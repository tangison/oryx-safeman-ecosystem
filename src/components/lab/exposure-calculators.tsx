'use client';

import { useMemo, useState } from 'react';

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const MAX_SEGMENTS = 4;

function NumField({
  label,
  value,
  onChange,
  step = 'any',
  min = '0',
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string | number;
  min?: string | number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
        {label}
      </span>
      <span className="mt-1 flex items-center rounded-xl border border-stone-300 bg-white focus-within:border-oryx-primary">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="tnum w-full min-w-0 rounded-xl bg-transparent px-3 py-2 text-sm focus:outline-none"
        />
        {suffix ? <span className="tnum pr-3 text-xs text-stone-500">{suffix}</span> : null}
      </span>
    </label>
  );
}

function Verdict({ pct, unitLabel }: { pct: number; unitLabel: string }) {
  const state = pct >= 100 ? 'EXCEEDED' : pct >= 50 ? 'ACTION LEVEL' : 'PASS';
  const cls =
    pct >= 100
      ? 'bg-red-100 text-red-700 ring-1 ring-red-200'
      : pct >= 50
        ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
        : 'bg-green-100 text-safeman-primary ring-1 ring-safeman-hairline';
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="tnum text-3xl font-bold text-stone-900">
        {pct.toFixed(0)}
        <span className="text-base font-medium text-stone-500">% {unitLabel}</span>
      </p>
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{state}</span>
      {pct >= 50 && pct < 100 ? (
        <span className="text-xs text-amber-700">≥ 50% — action level: investigate sources.</span>
      ) : null}
    </div>
  );
}

function StatusNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 rounded-xl bg-oryx-callout px-3.5 py-2.5 text-xs leading-relaxed text-stone-700">{children}</p>;
}

/* ------------------------------------------------------------------ */
/* (a) Chemical exposure — 8h/12h TWA                                  */
/* ------------------------------------------------------------------ */

interface Segment {
  c: number;
  h: number;
}

function TwaCalculator() {
  const [segments, setSegments] = useState<Segment[]>([
    { c: 40, h: 3 },
    { c: 80, h: 2 },
    { c: 0, h: 3 },
    { c: 0, h: 0 },
  ]);
  const [period, setPeriod] = useState<8 | 12>(8);
  const [oel, setOel] = useState(50);

  const { twa, pct, totalHours } = useMemo(() => {
    const ctSum = segments.reduce((acc, s) => acc + (Number(s.c) || 0) * (Number(s.h) || 0), 0);
    const th = segments.reduce((acc, s) => acc + (Number(s.h) || 0), 0);
    const twaVal = period > 0 ? ctSum / period : 0;
    return {
      twa: twaVal,
      pct: oel > 0 ? (twaVal / oel) * 100 : 0,
      totalHours: th,
    };
  }, [segments, period, oel]);

  return (
    <div className="rounded-3xl border border-oryx-hairline bg-white p-5 shadow-sm sm:p-6">
      <h3 className="font-display text-xl text-stone-900">
        Statutory exposure calculator — TWA (<span className="tnum">{period}</span> h reference
        period)
      </h3>
      <p className="mt-1 text-sm text-stone-600">
        TWA = Σ (concentration × time) ÷ reference period, across up to{' '}
        <span className="tnum">{MAX_SEGMENTS}</span> work segments.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="space-y-2.5">
          {segments.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2.5">
              <NumField
                label={`Segment ${i + 1} — concentration`}
                value={s.c}
                onChange={(v) =>
                  setSegments((prev) => prev.map((x, j) => (j === i ? { ...x, c: v } : x)))
                }
                suffix="ppm"
              />
              <NumField
                label="Duration"
                value={s.h}
                onChange={(v) =>
                  setSegments((prev) => prev.map((x, j) => (j === i ? { ...x, h: v } : x)))
                }
                step={0.5}
                suffix="h"
              />
              <button
                type="button"
                onClick={() => setSegments((prev) => prev.map((x, j) => (j === i ? { c: 0, h: 0 } : x)))}
                className="mb-0.5 inline-flex h-[42px] min-h-[42px] items-center rounded-xl px-3 text-xs font-medium text-stone-500 hover:bg-stone-100"
              >
                Clear
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-3 lg:w-52">
          <label className="block">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Reference period
            </span>
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value) as 8 | 12)}
              className="tnum mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:border-oryx-primary focus:outline-none"
            >
              <option value={8}>8-hour shift</option>
              <option value={12}>12-hour shift</option>
            </select>
          </label>
          <NumField label="Statutory OEL (TWA)" value={oel} onChange={setOel} suffix="ppm" />
          <p className="tnum text-xs text-stone-500">Total logged: {totalHours.toFixed(1)} h</p>
        </div>
      </div>

      <div className="mt-5 border-t border-oryx-hairline pt-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
          Time-weighted average
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-4">
          <p className="tnum text-3xl font-bold text-oryx-primary">{twa.toFixed(1)} ppm</p>
          <p className="tnum text-sm text-stone-500">vs OEL {oel} ppm</p>
        </div>
        <div className="mt-2">
          <Verdict pct={pct} unitLabel="of OEL" />
        </div>
        {totalHours > period ? (
          <StatusNote>
            Logged exposure ({totalHours.toFixed(1)} h) exceeds the {period}-hour reference period —
            under extended-shift adjustment rules the effective limit tightens further. Recalculate
            with the statutory adjustment factor before sign-off.
          </StatusNote>
        ) : (
          <StatusNote>
            For 12-hour shifts most statutes require an adjusted limit (e.g. brief &amp; scala
            factor) — apply the statutory multiplier to the OEL before comparing.
          </StatusNote>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* (b) Noise dose — 85 dBA 8h, 3 dB exchange                           */
/* ------------------------------------------------------------------ */

function NoiseCalculator() {
  const [segments, setSegments] = useState<Segment[]>([
    { c: 88, h: 4 },
    { c: 92, h: 2 },
    { c: 80, h: 2 },
    { c: 0, h: 0 },
  ]);

  const { dose, twa } = useMemo(() => {
    // Allowance hours at level L: T(L) = 8 / 2^((L - 85) / 3)
    const doseSum = segments.reduce((acc, s) => {
      const L = Number(s.c) || 0;
      const t = Number(s.h) || 0;
      if (L <= 0 || t <= 0) return acc;
      const allowable = 8 / Math.pow(2, (L - 85) / 3);
      return acc + t / allowable;
    }, 0);
    const d = doseSum * 100;
    const t = d > 0 ? 85 + 10 * Math.log10(d / 100) : 0;
    return { dose: d, twa: t };
  }, [segments]);

  const pct = dose;

  return (
    <div className="rounded-3xl border border-oryx-hairline bg-white p-5 shadow-sm sm:p-6">
      <h3 className="font-display text-xl text-stone-900">
        Noise dose calculator — <span className="tnum">85 dBA</span> · <span className="tnum">8 h</span>{' '}
        · <span className="tnum">3 dB</span> exchange
      </h3>
      <p className="mt-1 text-sm text-stone-600">
        Dose % = Σ t ÷ T(L), where T(L) = <span className="tnum">8 / 2^((L−85)/3)</span> hours.
      </p>

      <div className="mt-4 space-y-2.5">
        {segments.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2.5">
            <NumField
              label={`Segment ${i + 1} — level`}
              value={s.c}
              onChange={(v) => setSegments((prev) => prev.map((x, j) => (j === i ? { ...x, c: v } : x)))}
              step={1}
              min={0}
              suffix="dBA"
            />
            <NumField
              label="Duration"
              value={s.h}
              onChange={(v) => setSegments((prev) => prev.map((x, j) => (j === i ? { ...x, h: v } : x)))}
              step={0.5}
              suffix="h"
            />
            <button
              type="button"
              onClick={() => setSegments((prev) => prev.map((x, j) => (j === i ? { c: 0, h: 0 } : x)))}
              className="mb-0.5 inline-flex h-[42px] min-h-[42px] items-center rounded-xl px-3 text-xs font-medium text-stone-500 hover:bg-stone-100"
            >
              Clear
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-oryx-hairline pt-4">
        <div className="flex flex-wrap items-baseline gap-x-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Noise dose</p>
            <p className="tnum text-3xl font-bold text-oryx-primary">{dose.toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Equivalent TWA
            </p>
            <p className="tnum text-3xl font-bold text-oryx-primary">
              {twa > 0 ? twa.toFixed(1) : '—'} dBA
            </p>
          </div>
        </div>
        <div className="mt-2">
          <Verdict pct={pct} unitLabel="of 85 dBA / 8 h criterion" />
        </div>
        <StatusNote>
          3 dB exchange rate: every +3 dBA halves the allowable exposure time. At ≥ 85 dBA TWA,
          hearing conservation (baseline audiometry, protection, zoning) becomes mandatory.
        </StatusNote>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* (c) WBGT work / rest regime                                         */
/* ------------------------------------------------------------------ */

const WBGT_TABLE: { range: string; min: number; max: number; light: string; moderate: string; heavy: string }[] = [
  { range: '≤ 28 °C', min: -Infinity, max: 28, light: 'Continuous', moderate: 'Continuous', heavy: '50 / 50' },
  { range: '> 28 – 30 °C', min: 28, max: 30, light: 'Continuous', moderate: '75 / 25', heavy: '50 / 50' },
  { range: '> 30 – 32 °C', min: 30, max: 32, light: '75 / 25', moderate: '50 / 50', heavy: '25 / 75' },
  { range: '> 32 – 34 °C', min: 32, max: 34, light: '50 / 50', moderate: '25 / 75', heavy: 'Rest' },
  { range: '> 34 – 36 °C', min: 34, max: 36, light: '25 / 75', moderate: 'Rest', heavy: 'Stop' },
  { range: '> 36 °C', min: 36, max: Infinity, light: 'Stop', moderate: 'Stop', heavy: 'Stop' },
];

function WbgtRegime() {
  const [wbgt, setWbgt] = useState(31);
  const [workload, setWorkload] = useState<'light' | 'moderate' | 'heavy'>('moderate');

  const rowIndex = WBGT_TABLE.findIndex((r) => wbgt > r.min && wbgt <= r.max);
  const active = rowIndex >= 0 ? WBGT_TABLE[rowIndex] : WBGT_TABLE[WBGT_TABLE.length - 1];

  return (
    <div className="rounded-3xl border border-oryx-hairline bg-white p-5 shadow-sm sm:p-6">
      <h3 className="font-display text-xl text-stone-900">
        WBGT work / rest regime — heat stress screening
      </h3>
      <p className="mt-1 text-sm text-stone-600">
        Hourly work : rest ratios per workload class. Enter the measured WBGT to highlight the
        applicable regime row.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[auto_auto_1fr]">
        <NumField
          label="WBGT reading"
          value={wbgt}
          onChange={(v) => setWbgt(Math.min(45, Math.max(20, v)))}
          step={0.5}
          min={20}
          suffix="°C"
        />
        <label className="block">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Workload class
          </span>
          <select
            value={workload}
            onChange={(e) => setWorkload(e.target.value as 'light' | 'moderate' | 'heavy')}
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm capitalize focus:border-oryx-primary focus:outline-none"
          >
            <option value="light">Light (desk, inspection)</option>
            <option value="moderate">Moderate (fitting, hauling)</option>
            <option value="heavy">Heavy (shovelling, mining)</option>
          </select>
        </label>
        <div className="flex items-end">
          <p className="tnum rounded-xl bg-oryx-callout px-4 py-2.5 text-sm font-semibold text-oryx-primary">
            Regime @ {wbgt.toFixed(1)} °C · {workload}: {active[workload]}
            {active[workload].includes('/') ? ' (work : rest, min per hour)' : ''}
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-oryx-hairline slim-scroll">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="bg-oryx-callout text-left text-xs font-bold uppercase tracking-wider text-oryx-primary">
              <th className="px-3 py-2.5">WBGT</th>
              <th className="px-3 py-2.5">Light</th>
              <th className="px-3 py-2.5">Moderate</th>
              <th className="px-3 py-2.5">Heavy</th>
            </tr>
          </thead>
          <tbody>
            {WBGT_TABLE.map((r, i) => (
              <tr
                key={r.range}
                className={`border-t border-oryx-hairline ${
                  i === rowIndex ? 'bg-oryx-callout font-semibold' : 'bg-white'
                }`}
              >
                <td className="tnum px-3 py-2.5">{r.range}</td>
                <td className="tnum px-3 py-2.5">{r.light}</td>
                <td className="tnum px-3 py-2.5">{r.moderate}</td>
                <td className="tnum px-3 py-2.5">{r.heavy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <StatusNote>
        ACGIH-style screening values shown as work : rest minutes per hour. Always confirm against
        the current statutory table and site heat-stress management plan.
      </StatusNote>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function ExposureCalculators() {
  return (
    <div className="space-y-6">
      <TwaCalculator />
      <NoiseCalculator />
      <WbgtRegime />
    </div>
  );
}
