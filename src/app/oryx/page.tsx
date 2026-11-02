import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import Callout from '@/components/callout';
import {
  ORYX_LEVELS,
  ORYX_SYSTEM,
  ntaMatrixColumns,
  ntaMatrixRows,
  type OryxLevel,
} from '@/lib/data';

export const metadata: Metadata = {
  title: 'Oryx Institute NQF Programmes (Levels 1–7)',
  description: ORYX_SYSTEM.disclosure,
};

function StatusChip({ status }: { status: string }) {
  const verified = /verified/i.test(status);
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        verified
          ? 'bg-green-50 text-safeman-primary ring-1 ring-safeman-hairline'
          : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
      }`}
    >
      {status}
    </span>
  );
}

function LevelCard({ level, defaultOpen }: { level: OryxLevel; defaultOpen: boolean }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-oryx-hairline bg-white shadow-sm">
      <div className="grid gap-4 p-5 sm:grid-cols-[auto_1fr] sm:p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-oryx-primary">
          <span className="tnum text-2xl font-bold text-oryx-canvas">{level.level}</span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl leading-snug text-stone-900 sm:text-2xl">
              Level <span className="tnum">{level.level}</span> — {level.title}
            </h3>
          </div>
          <div className="mt-1.5">
            <StatusChip status={level.status} />
          </div>

          <dl className="tnum mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                Duration
              </dt>
              <dd className="mt-0.5 font-medium text-stone-800">{level.duration}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                Credits
              </dt>
              <dd className="mt-0.5 font-medium text-stone-800">{level.credits}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                Entry
              </dt>
              <dd className="mt-0.5 font-medium text-stone-800">{level.entry ?? 'Open entry'}</dd>
            </div>
          </dl>

          <ul className="mt-3 flex flex-wrap gap-1.5">
            {level.nta_anchors.map((a) => (
              <li
                key={a}
                className="rounded-full border border-oryx-hairline bg-oryx-callout px-2.5 py-1 text-[11px] font-medium text-oryx-primary"
              >
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <details className="level-modules border-t border-oryx-hairline" open={defaultOpen}>
        <summary className="flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-oryx-primary hover:bg-oryx-callout sm:px-6">
          <svg
            viewBox="0 0 24 24"
            className="chevron h-4 w-4"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M9 6v12l9-6-9-6Z" />
          </svg>
          Modules (<span className="tnum">{level.modules.length}</span>) &amp; NTA references
        </summary>
        <div className="border-t border-oryx-hairline bg-oryx-canvas/60 px-5 py-5 sm:px-6">
          <ol className="space-y-3">
            {level.modules.map((mod, i) => (
              <li key={mod.id} className="rounded-xl border border-oryx-hairline bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tnum rounded-md bg-oryx-callout px-2 py-0.5 text-[11px] font-bold text-oryx-primary ring-1 ring-oryx-hairline">
                    {mod.id}
                  </span>
                  <span className="tnum rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-stone-600 ring-1 ring-stone-200">
                    {mod.nta_ref}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">
                    Module {i + 1}
                  </span>
                </div>
                <h4 className="mt-1.5 font-medium leading-snug text-stone-900">{mod.title}</h4>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">{mod.focus}</p>
              </li>
            ))}
          </ol>

          <div className="mt-4 rounded-xl border border-oryx-hairline bg-white p-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-oryx-primary">
              Assessment summary
            </h4>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-700">{level.assessment}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <a
              href={level.manual}
              download
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-oryx-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-oryx-primary/90"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M12 3v10.6l-3.3-3.3-1.4 1.4L12 16.4l4.7-4.7-1.4-1.4-3.3 3.3V3h-2ZM5 19v2h14v-2H5Z" />
              </svg>
              Learner manual (PDF)
            </a>
            <a
              href={level.assessment_pack}
              download
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-oryx-primary/40 bg-white px-4 py-2.5 text-sm font-semibold text-oryx-primary hover:bg-oryx-callout"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M12 3v10.6l-3.3-3.3-1.4 1.4L12 16.4l4.7-4.7-1.4-1.4-3.3 3.3V3h-2ZM5 19v2h14v-2H5Z" />
              </svg>
              Assessment pack (PDF)
            </a>
          </div>
        </div>
      </details>
    </article>
  );
}

export default function OryxPortalPage() {
  const columns = ntaMatrixColumns();
  const rows = ntaMatrixRows();

  return (
    <>
      <SiteHeader track="oryx" />

      <section className="mx-auto w-full max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-oryx-accent">
          {ORYX_SYSTEM.brand} · {ORYX_SYSTEM.domain}
        </p>
        <h1 className="mt-2 max-w-3xl font-display text-3xl leading-tight text-stone-900 sm:text-4xl">
          NQF Curriculum Explorer — Levels <span className="tnum">1</span>–
          <span className="tnum">7</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
          Principal and Founder: {ORYX_SYSTEM.founder}. Certificate types issued:{' '}
          {ORYX_SYSTEM.certificate_types.join(' · ')}.
        </p>

        <Callout variant="oryx" label="Status disclosure" className="mt-6">
          {ORYX_SYSTEM.disclosure}
        </Callout>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            href="/oryx/lab/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-oryx-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-oryx-primary/90"
          >
            Open the Level 6 Virtual Sensor &amp; Hygiene Lab →
          </Link>
        </div>
      </section>

      <section aria-label="NQF levels" className="mx-auto w-full max-w-6xl space-y-4 px-4 pb-10 sm:px-6">
        {ORYX_LEVELS.map((lv, i) => (
          <LevelCard key={lv.level} level={lv} defaultOpen={i === 0} />
        ))}
      </section>

      <section aria-labelledby="matrix-heading" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl border border-oryx-hairline bg-white p-5 shadow-sm sm:p-6">
          <h2 id="matrix-heading" className="font-display text-2xl text-stone-900">
            NTA alignment matrix
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Level × statutory anchor coverage. Anchors are normalised from the programme data; full
            wording appears on each level card.
          </p>
          <div className="mt-4 max-h-96 overflow-auto rounded-xl border border-oryx-hairline slim-scroll">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-oryx-callout text-left">
                  <th className="sticky left-0 z-10 bg-oryx-callout px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-oryx-primary">
                    Level
                  </th>
                  {columns.map((c) => (
                    <th
                      key={c}
                      className="tnum px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-oryx-primary"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ level, anchors }) => (
                  <tr key={level.level} className="border-t border-oryx-hairline">
                    <th
                      scope="row"
                      className="tnum sticky left-0 z-10 bg-white px-3 py-2.5 text-left font-semibold text-stone-800"
                    >
                      L{level.level}
                    </th>
                    {columns.map((c) => (
                      <td key={c} className="px-3 py-2.5 text-center">
                        {anchors.has(c) ? (
                          <>
                            <span className="sr-only">Aligned</span>
                            <svg
                              viewBox="0 0 24 24"
                              className="inline h-4 w-4 text-oryx-primary"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M9.55 17.05 4.9 12.4l1.4-1.4 3.25 3.24 8.15-8.15 1.4 1.42-9.55 9.54Z" />
                            </svg>
                          </>
                        ) : (
                          <span className="text-stone-300" aria-hidden="true">
                            ·
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
