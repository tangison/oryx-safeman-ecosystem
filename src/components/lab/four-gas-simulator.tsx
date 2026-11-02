'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { addBumpEntry, getBumpLog, type BumpLogEntry } from '@/lib/storage';

type GasKey = 'o2' | 'lel' | 'co' | 'h2s';

interface GasConfig {
  key: GasKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  /** statutory alarm set-point (always alarms) */
  alarm: (v: number) => boolean;
  /** early-warning band (optional) */
  warn: (v: number) => boolean;
  alarmNote: string;
}

const GASES: GasConfig[] = [
  {
    key: 'o2',
    label: 'Oxygen',
    unit: '% vol',
    min: 16,
    max: 25,
    step: 0.1,
    alarm: (v) => v < 19.5 || v > 23.5,
    warn: (v) => (v >= 19.5 && v < 20) || (v > 23 && v <= 23.5),
    alarmNote: 'Statutory limits: deficient < 19.5% · enriched > 23.5%',
  },
  {
    key: 'lel',
    label: 'Flammable gas',
    unit: '% LEL',
    min: 0,
    max: 100,
    step: 1,
    alarm: (v) => v >= 10,
    warn: (v) => v >= 5 && v < 10,
    alarmNote: 'Statutory alarm: ≥ 10% LEL',
  },
  {
    key: 'co',
    label: 'Carbon monoxide',
    unit: 'ppm',
    min: 0,
    max: 500,
    step: 5,
    alarm: (v) => v >= 35,
    warn: (v) => v >= 25 && v < 35,
    alarmNote: 'Statutory alarm: ≥ 35 ppm',
  },
  {
    key: 'h2s',
    label: 'Hydrogen sulphide',
    unit: 'ppm',
    min: 0,
    max: 100,
    step: 1,
    alarm: (v) => v >= 10,
    warn: (v) => v >= 5 && v < 10,
    alarmNote: 'Statutory alarm: ≥ 10 ppm',
  },
];

const FRESH_AIR: Record<GasKey, number> = { o2: 20.9, lel: 0, co: 0, h2s: 0 };
const BUMP_CHALLENGE: Record<GasKey, number> = { o2: 20.9, lel: 25, co: 120, h2s: 25 };

export default function FourGasSimulator() {
  const [values, setValues] = useState<Record<GasKey, number>>({ ...FRESH_AIR });
  const [bumpState, setBumpState] = useState<'idle' | 'gas-on' | 'decay'>('idle');
  const [log, setLog] = useState<BumpLogEntry[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setLog(getBumpLog());
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const alarming = (g: GasConfig, v: number) => g.alarm(v);
  const warning = (g: GasConfig, v: number) => !g.alarm(v) && g.warn(v);

  const anyAlarm = GASES.some((g) => alarming(g, values[g.key]));

  const setGas = (key: GasKey, v: number) => {
    if (bumpState !== 'idle') return;
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const runBumpTest = useCallback(() => {
    if (bumpState !== 'idle') return;
    setBumpState('gas-on');
    setValues({ ...BUMP_CHALLENGE });

    timers.current.push(
      setTimeout(() => {
        // Channels must reach their alarm thresholds to pass.
        const results = GASES.filter((g) => g.key !== 'o2').map(
          (g) => `${g.key.toUpperCase()} ${g.alarm(BUMP_CHALLENGE[g.key]) ? 'OK' : 'NO-RESPONSE'}`,
        );
        const pass = results.every((r) => r.endsWith('OK'));
        setBumpState('decay');
        setValues({ ...FRESH_AIR });

        timers.current.push(
          setTimeout(() => {
            setBumpState('idle');
            const entry: BumpLogEntry = {
              date: new Date().toISOString(),
              result: pass ? 'PASS' : 'FAIL',
              detail: `span gas: LEL 25% · CO 120 ppm · H₂S 25 ppm — ${results.join(' · ')}`,
            };
            addBumpEntry(entry);
            setLog(getBumpLog());
          }, 900),
        );
      }, 1400),
    );
  }, [bumpState]);

  return (
    <div className="space-y-5">
      {anyAlarm ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3.5"
        >
          <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-red-600" fill="currentColor" aria-hidden="true">
            <path d="M12 2 1 21h22L12 2Zm1 14h-2v2h2v-2Zm0-7h-2v5h2V9Z" />
          </svg>
          <p className="text-sm font-semibold leading-relaxed text-red-800">
            GAS ALARM — {GASES.filter((g) => alarming(g, values[g.key])).map((g) => g.label).join(' · ')}.
            Ventilate, withdraw personnel and re-test before entry. (Simulation output only.)
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {GASES.map((g) => {
          const v = values[g.key];
          const isAlarm = alarming(g, v);
          const isWarn = warning(g, v);
          const state = isAlarm ? 'ALARM' : isWarn ? 'WARNING' : 'NORMAL';
          const color = isAlarm
            ? 'border-red-300 bg-red-50'
            : isWarn
              ? 'border-amber-300 bg-amber-50'
              : 'border-safeman-hairline bg-white';
          return (
            <div key={g.key} className={`rounded-2xl border p-4 ${color}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">
                  {g.label}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider ${
                    isAlarm
                      ? 'bg-red-600 text-white'
                      : isWarn
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-green-100 text-safeman-primary'
                  }`}
                >
                  {state}
                </span>
              </div>
              <p
                className={`tnum mt-2 text-4xl font-bold ${
                  isAlarm ? 'text-red-700' : isWarn ? 'text-amber-700' : 'text-stone-900'
                }`}
              >
                {g.key === 'o2' ? v.toFixed(1) : Math.round(v)}
                <span className="ml-1 text-sm font-medium text-stone-500">{g.unit}</span>
              </p>
              <input
                type="range"
                min={g.min}
                max={g.max}
                step={g.step}
                value={v}
                disabled={bumpState !== 'idle'}
                onChange={(e) => setGas(g.key, Number(e.target.value))}
                aria-label={`${g.label} concentration in ${g.unit}`}
                className="mt-3 w-full accent-[#14532D] disabled:opacity-50"
              />
              <p className="mt-1.5 text-[11px] leading-snug text-stone-500">{g.alarmNote}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-oryx-hairline bg-white p-4">
        <button
          type="button"
          onClick={runBumpTest}
          disabled={bumpState !== 'idle'}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-safeman-primary px-5 py-2.5 text-sm font-semibold text-white enabled:hover:bg-safeman-primary/90 disabled:cursor-wait disabled:opacity-60"
        >
          {bumpState === 'gas-on'
            ? 'Span gas applied — checking response…'
            : bumpState === 'decay'
              ? 'Purging to fresh air…'
              : 'Run bump test'}
        </button>
        <p className="text-xs leading-snug text-stone-500">
          Applies a certified-style span gas challenge (LEL 25% · CO 120 ppm · H₂S 25 ppm), verifies
          each channel crosses its statutory alarm threshold, then purges to fresh air.
          <br />
          <strong className="text-stone-600">Simulation only</strong> — field instruments require
          certified gas and a logged calibration chain.
        </p>
        <span
          className={`tnum ml-auto rounded-full px-3 py-1 text-xs font-bold ${
            bumpState === 'idle' ? 'bg-green-100 text-safeman-primary' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {bumpState === 'idle' ? 'FRESH AIR' : 'GAS ON'}
        </span>
      </div>

      {log.length > 0 ? (
        <div className="rounded-2xl border border-oryx-hairline bg-white p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">
            Bump-test log (this device)
          </h3>
          <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto slim-scroll pr-1">
            {log.map((e, i) => (
              <li key={i} className="tnum flex flex-wrap items-baseline gap-2 text-xs text-stone-600">
                <span
                  className={`rounded px-1.5 py-0.5 font-bold ${
                    e.result === 'PASS' ? 'bg-green-100 text-safeman-primary' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {e.result}
                </span>
                <span>{new Date(e.date).toLocaleString()}</span>
                <span className="text-stone-400">{e.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
