"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Level 6 / SM-CSE Virtual 4-Gas Sensor Simulator.
 * Deterministic scenario engine: gas stratification (O2 / LEL / H2S / CO),
 * pump discipline, zero/bump workflow, alarm setpoints and a timestamped log.
 * Pure client state - zero backend.
 */

interface Reading { o2: number; lel: number; h2s: number; co: number }

const SCENARIOS: Record<string, { label: string; profile: (depth: "top" | "mid" | "bot", t: number) => Reading; note: string }> = {
  fresh: {
    label: "Fresh Air Verification",
    note: "Zero + bump in clean air. Expect 20.9% O2 and flat lines.",
    profile: (_d) => ({ o2: 20.9 + Math.sin(_d.length) * 0.05, lel: 0, h2s: 0, co: 0 }),
  },
  pit: {
    label: "Contaminated Pump Pit",
    note: "Organic decomposition: O2 displaced at depth, H2S pooling low, LEL rising high.",
    profile: (d) => ({
      o2: d === "top" ? 20.4 : d === "mid" ? 18.2 : 16.4,
      lel: d === "top" ? 12 : d === "mid" ? 6 : 2,
      h2s: d === "bot" ? 34 : d === "mid" ? 9 : 1,
      co: d === "bot" ? 41 : d === "mid" ? 14 : 3,
    }),
  },
  tank: {
    label: "Inerted Storage Tank",
    note: "Nitrogen-purged vessel: severe oxygen deficiency at every level.",
    profile: () => ({ o2: 12.8, lel: 0, h2s: 0, co: 6 }),
  },
  leak: {
    label: "LPG Plant Leak (Hot Work Watch)",
    note: "Propane cloud drifting: LEL above the 0% hot-work ceiling.",
    profile: (d) => ({ o2: 20.8, lel: d === "top" ? 38 : d === "mid" ? 22 : 8, h2s: 0, co: 1 }),
  },
};

const ALARMS = { o2Low: 19.5, o2High: 23.5, lel: 5, h2s: 10, co: 25 };

function round(v: number, dp = 1): string { return v.toFixed(dp); }

export function GasSimulator() {
  const [scenario, setScenario] = useState<keyof typeof SCENARIOS>("pit");
  const [depth, setDepth] = useState<"top" | "mid" | "bot">("top");
  const [pumpOn, setPumpOn] = useState(false);
  const [zeroed, setZeroed] = useState(false);
  const [reading, setReading] = useState<Reading>({ o2: 20.9, lel: 0, h2s: 0, co: 0 });
  const [log, setLog] = useState<{ t: string; msg: string; alarm: boolean }[]>([]);
  const tick = useRef(0);

  const stamp = () => new Date().toTimeString().slice(0, 8);

  useEffect(() => {
    const id = setInterval(() => {
      tick.current += 1;
      const s = SCENARIOS[scenario];
      if (pumpOn) {
        const base = s.profile(depth, tick.current);
        const jitter = (v: number, amp: number) => v + (Math.sin(tick.current * 2.7 + amp) * amp) / 4;
        setReading({ o2: jitter(base.o2, 0.08), lel: Math.max(0, jitter(base.lel, 0.4)), h2s: Math.max(0, jitter(base.h2s, 0.5)), co: Math.max(0, jitter(base.co, 0.8)) });
      } else {
        setReading((r) => ({ ...r, lel: 0, h2s: 0, co: 0, o2: 20.9 }));
      }
    }, 900);
    return () => clearInterval(id);
  }, [scenario, depth, pumpOn]);

  const addLog = (msg: string, alarm = false) => setLog((l) => [{ t: stamp(), msg, alarm }, ...l].slice(0, 40));

  const alarms = {
    o2: reading.o2 < ALARMS.o2Low || reading.o2 > ALARMS.o2High,
    lel: reading.lel >= ALARMS.lel,
    h2s: reading.h2s >= ALARMS.h2s,
    co: reading.co >= ALARMS.co,
  };
  const anyAlarm = alarms.o2 || alarms.lel || alarms.h2s || alarms.co;

  const doZero = () => { setZeroed(true); addLog("ZERO complete in clean air - instrument ready"); };
  const doPump = () => { setPumpOn(!pumpOn); addLog(pumpOn ? "PUMP OFF - diffusion mode (unreliable at depth)" : "PUMP ON - drawing remote sample"); };
  const doTest = (d: "top" | "mid" | "bot") => {
    setDepth(d);
    const s = SCENARIOS[scenario].profile(d, tick.current);
    const alarmHit = s.o2 < ALARMS.o2Low || s.lel >= ALARMS.lel || s.h2s >= ALARMS.h2s || s.co >= ALARMS.co;
    addLog(`TEST ${d.toUpperCase()}  O2 ${round(s.o2)}%  LEL ${round(s.lel)}%  H2S ${round(s.h2s)}ppm  CO ${round(s.co)}ppm`, alarmHit);
    if (!zeroed) addLog("WARNING: instrument not zeroed - readings untrusted", true);
    if (!pumpOn) addLog("WARNING: pump off - stratified sample not drawn", true);
  };

  const cell = (label: string, value: string, alarm: boolean, pct: number) => (
    <div className={`sim-cell ${alarm ? "alarm" : ""}`} key={label}>
      <div className="sim-label">{label}</div>
      <div className="sim-value">{value}</div>
      <div className="sim-bar"><div style={{ width: `${Math.min(100, pct)}%` }} /></div>
    </div>
  );

  return (
    <div className="sim-panel">
      <div className="eyebrow">VIRTUAL 4-GAS SENSOR LABORATORY</div>
      <h3 className="serif" style={{ fontSize: "1.7rem", margin: "10px 0 6px" }}>Atmospheric Testing Simulator</h3>
      <p className="course-desc" style={{ marginBottom: 16 }}>{SCENARIOS[scenario].note}</p>

      <div className="sim-controls">
        <select className="form-select" style={{ maxWidth: 300 }} value={scenario}
          onChange={(e) => { setScenario(e.target.value as keyof typeof SCENARIOS); addLog(`SCENARIO: ${SCENARIOS[e.target.value].label}`); }}>
          {Object.entries(SCENARIOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button className={`btn btn-outline btn-sm ${zeroed ? "" : ""}`} onClick={doZero}>{zeroed ? "Zeroed ✓" : "Zero Instrument"}</button>
        <button className="btn btn-outline btn-sm" onClick={doPump}>{pumpOn ? "Pump: ON" : "Pump: OFF"}</button>
      </div>

      <div className="sim-readout">
        {cell("O2 %", round(reading.o2), alarms.o2, (reading.o2 / 25) * 100)}
        {cell("LEL %", round(reading.lel), alarms.lel, (reading.lel / 50) * 100)}
        {cell("H2S ppm", round(reading.h2s), alarms.h2s, (reading.h2s / 40) * 100)}
        {cell("CO ppm", round(reading.co), alarms.co, (reading.co / 60) * 100)}
      </div>

      <div className="sim-controls">
        {(["top", "mid", "bot"] as const).map((d) => (
          <button key={d} className={`btn ${depth === d ? "btn-primary" : "btn-outline"} btn-sm`} onClick={() => doTest(d)}>
            Test {d === "top" ? "Top (LEL)" : d === "mid" ? "Middle (O2)" : "Bottom (H2S/CO)"}
          </button>
        ))}
      </div>
      {anyAlarm && (
        <p className="quiz-why" style={{ marginTop: 16 }}>
          <b>ALARM CONDITION.</b> Entry prohibited: {alarms.o2 ? "oxygen outside 19.5-23.5% band; " : ""}
          {alarms.lel ? "LEL at/above 5% (0% for hot work); " : ""}{alarms.h2s ? "H2S at/above 10 ppm; " : ""}
          {alarms.co ? "CO at/above 25 ppm. " : ""}Ventilate, re-test, record on the permit.
        </p>
      )}

      <div className="sim-log" aria-live="polite">
        {log.length === 0 && <div className="sim-log-row"><b>READY</b> Zero the instrument, switch the pump on, then test top / middle / bottom.</div>}
        {log.map((l, i) => (
          <div className={`sim-log-row ${l.alarm ? "alarm" : ""}`} key={i}><b>{l.t}</b> {l.msg}</div>
        ))}
      </div>
    </div>
  );
}
