import Link from 'next/link';
import SiteHeader from '@/components/site-header';

export default function NotFound() {
  return (
    <>
      <SiteHeader track="neutral" />
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <p className="tnum text-6xl font-bold text-oryx-hairline">404</p>
        <h1 className="mt-4 font-display text-3xl text-stone-900">This page wandered off the route</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-600">
          The address you followed does not exist on the Oryx Ecosystem static site. Pick a track
          below, or verify a credential.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-full bg-oryx-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-oryx-primary/90"
          >
            Back to landing
          </Link>
          <Link
            href="/safeman/"
            className="inline-flex min-h-[44px] items-center rounded-full border border-safeman-hairline bg-white px-5 py-2.5 text-sm font-medium text-safeman-primary"
          >
            SafeMan track
          </Link>
          <Link
            href="/oryx/"
            className="inline-flex min-h-[44px] items-center rounded-full border border-oryx-hairline bg-white px-5 py-2.5 text-sm font-medium text-oryx-primary"
          >
            Oryx track
          </Link>
        </div>
      </section>
    </>
  );
}
