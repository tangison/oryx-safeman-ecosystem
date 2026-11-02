import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import { SAFEMAN_COURSES, ORYX_LEVELS } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Oryx Ecosystem — SafeMan™ & Oryx Institute',
};

function TrackCard({
  href,
  badge,
  title,
  copy,
  stats,
  primary,
  secondary,
  secondaryHref,
  theme,
  art,
}: {
  href: string;
  badge: string;
  title: string;
  copy: string;
  stats: string[];
  primary: string;
  secondary: string;
  secondaryHref: string;
  theme: 'safeman' | 'oryx';
  art: string;
}) {
  const isSafe = theme === 'safeman';
  return (
    <article
      className={`relative overflow-hidden rounded-3xl border bg-white shadow-sm transition-shadow hover:shadow-lg ${
        isSafe ? 'border-safeman-hairline' : 'border-oryx-hairline'
      }`}
    >
      <div className={`h-1.5 w-full ${isSafe ? 'bg-safeman-primary' : 'bg-oryx-primary'}`} />
      <div className="flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-bold uppercase tracking-[0.2em] ${
              isSafe ? 'text-safeman-accent' : 'text-oryx-accent'
            }`}
          >
            {badge}
          </p>
          <h2 className="mt-2 font-display text-2xl leading-tight text-stone-900 sm:text-3xl">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-[15px]">{copy}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {stats.map((s) => (
              <li
                key={s}
                className="tnum rounded-full border border-stone-200 bg-oryx-canvas px-3 py-1 text-xs font-medium text-stone-600"
              >
                {s}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={href}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 ${
                isSafe ? 'bg-safeman-primary hover:bg-safeman-primary/90' : 'bg-oryx-primary hover:bg-oryx-primary/90'
              }`}
            >
              {primary} <span aria-hidden="true">→</span>
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex min-h-[44px] items-center rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50"
            >
              {secondary}
            </Link>
          </div>
        </div>
        <div
          className={`flex h-36 w-full shrink-0 items-center justify-center rounded-2xl md:h-44 md:w-44 ${
            isSafe ? 'bg-safeman-callout' : 'bg-oryx-callout'
          }`}
        >
          <img src={art} alt="" aria-hidden="true" className="max-h-[80%] max-w-[80%] object-contain" width={140} height={140} />
        </div>
      </div>
    </article>
  );
}

export default function LandingPage() {
  return (
    <>
      <SiteHeader track="neutral" />

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-oryx-accent">
          Oryx Institute · Namibia
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.1] text-stone-900 sm:text-5xl">
          One ecosystem. Two pathways to a{' '}
          <em className="text-oryx-primary">safer workforce</em>.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone-600">
          The <strong className="text-safeman-primary">SafeMan™ Site Safety Passport</strong> issues
          QR-verified competency tickets to industry. The{' '}
          <strong className="text-oryx-primary">Oryx Institute NQF track</strong> delivers formal
          vocational programmes from Level <span className="tnum">1</span> to Level{' '}
          <span className="tnum">7</span>. Every credential can be verified by anyone, offline, in
          seconds.
        </p>
      </section>

      <section aria-label="Brand tracks" className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <TrackCard
            href="/safeman/"
            badge="Corporate track · safeman.oryxinstitute.org"
            title="SafeMan™ Site Safety Passport"
            copy="Fast, rigorous HSE courses for the working day — knowledge checks, assessor practicum sign-offs and printable PVC passport cards with signed QR tickets."
            stats={[
              `${SAFEMAN_COURSES.length} courses`,
              'QR-verified tickets',
              'Practicum sign-off',
            ]}
            primary="Enter SafeMan track"
            secondary="Issue certificates"
            secondaryHref="/safeman/issue/"
            theme="safeman"
            art="/assets/webp/safeman_40-green-helmet.webp"
          />
          <TrackCard
            href="/oryx/"
            badge="Academic track · oryxinstitute.org"
            title="Oryx Institute NQF Programmes"
            copy="A formal vocational ladder in occupational health & safety — seven levels with NTA alignment, learner manuals, assessment packs and a virtual instrumentation lab."
            stats={[
              `Levels ${ORYX_LEVELS[0].level}–${ORYX_LEVELS[ORYX_LEVELS.length - 1].level}`,
              'NTA-aligned modules',
              'Virtual Level 6 lab',
            ]}
            primary="Enter Oryx track"
            secondary="Open the Level 6 lab"
            secondaryHref="/oryx/lab/"
            theme="oryx"
            art="/assets/webp/oryx_01-hero-oryx.webp"
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Link
            href="/verify/"
            className="group rounded-2xl border border-oryx-hairline bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <h3 className="font-display text-lg text-stone-900 group-hover:text-oryx-primary">
              Verify a SafeMan™ credential
            </h3>
            <p className="mt-1 text-sm text-stone-600">
              Paste any QR payload or scan link — the signature check runs entirely on your device.
            </p>
            <p className="tnum mt-3 text-xs font-semibold uppercase tracking-widest text-oryx-accent">
              /verify →
            </p>
          </Link>
          <div className="rounded-2xl border border-oryx-hairline bg-white p-5 shadow-sm">
            <h3 className="font-display text-lg text-stone-900">Contact</h3>
            <p className="mt-1 text-sm text-stone-600">
              All enquiries for both tracks go to one address:
            </p>
            <a
              href="mailto:info@oryxinstitute.org"
              className="mt-3 inline-block min-h-[44px] text-sm font-semibold text-stone-900 underline decoration-oryx-accent decoration-2 underline-offset-4"
            >
              info@oryxinstitute.org
            </a>
          </div>
          <div className="rounded-2xl border border-safeman-hairline bg-safeman-callout p-5 shadow-sm">
            <h3 className="font-display text-lg text-safeman-primary">Status disclosure</h3>
            <p className="mt-1 text-sm leading-relaxed text-stone-700">
              SafeMan™ is a non-accredited corporate competency benchmark; Oryx NQF programmes run
              pre-accreditation until NTA registration is granted. Full disclosure on each portal.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
