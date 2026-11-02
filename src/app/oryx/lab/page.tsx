import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import Callout from '@/components/callout';
import FourGasSimulator from '@/components/lab/four-gas-simulator';
import ExposureCalculators from '@/components/lab/exposure-calculators';
import { ORYX_LEVELS } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Level 6 Virtual Sensor & Hygiene Lab',
  description:
    'Client-side simulators for the Oryx Institute Level 6 diploma: a 4-gas detector with statutory alarm thresholds and bump-test simulation, plus TWA, noise-dose and WBGT exposure calculators.',
};

export default function LabPage() {
  const l6 = ORYX_LEVELS.find((lv) => lv.level === 6);

  return (
    <>
      <SiteHeader track="oryx" />
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-sm">
          <Link
            href="/oryx/"
            className="inline-flex min-h-[44px] items-center gap-1.5 font-medium text-stone-500 hover:text-oryx-primary"
          >
            <span aria-hidden="true">←</span> Oryx NQF programmes
          </Link>
        </nav>

        <header className="mt-3 mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-oryx-accent">
            Level 6 virtual lab · pre-accreditation teaching aid
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight text-stone-900 sm:text-4xl">
            Virtual Sensor &amp; Hygiene Lab
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600">
            Practice the instrument logic taught in{' '}
            <span className="tnum font-semibold">{l6?.modules[1]?.id ?? 'L6-M2'}</span> (multi-gas
            telemetry) and <span className="tnum font-semibold">{l6?.modules[0]?.id ?? 'L6-M1'}</span>{' '}
            (quantitative exposure math) — entirely in the browser, no instrument required. All
            alarm set-points mirror the statutory values cited in the Level 6 manual.
          </p>
        </header>

        <Callout variant="oryx" label="Training simulation" className="mb-8">
          These simulators reproduce detector behaviour for classroom drill only. Field decisions
          require calibrated, serviced instruments and a statutory calibration chain (Level 6 Module
          L6-M8).
        </Callout>

        <section aria-labelledby="gas-heading" className="mb-10 scroll-mt-24" id="gas">
          <h2 id="gas-heading" className="mb-1 font-display text-2xl text-stone-900">
            4-Gas detector simulator
          </h2>
          <p className="mb-4 text-sm text-stone-600">
            O₂ / LEL / CO / H₂S — drag the sliders to change the atmosphere and watch the alarm
            logic respond.
          </p>
          <FourGasSimulator />
        </section>

        <section aria-labelledby="exposure-heading" className="scroll-mt-24" id="exposure">
          <h2 id="exposure-heading" className="mb-1 font-display text-2xl text-stone-900">
            Statutory exposure calculators
          </h2>
          <p className="mb-4 text-sm text-stone-600">
            Time-weighted averages, noise dose and heat-stress regimes — the maths behind the Level
            6 exposure papers.
          </p>
          <ExposureCalculators />
        </section>
      </div>
    </>
  );
}
