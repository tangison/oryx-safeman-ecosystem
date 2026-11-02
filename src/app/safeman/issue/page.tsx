import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import Callout from '@/components/callout';
import Issuer from '@/components/issuer';
import { SAFEMAN_SYSTEM } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Issue SafeMan™ Certificates',
  description:
    'Generate QR-signed SafeMan™ certificates of competency and printable PVC Site Safety Passport cards entirely in the browser.',
};

export default function IssuePage() {
  return (
    <>
      <SiteHeader track="safeman" />
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-sm">
          <Link
            href="/safeman/"
            className="inline-flex min-h-[44px] items-center gap-1.5 font-medium text-stone-500 hover:text-safeman-primary"
          >
            <span aria-hidden="true">←</span> SafeMan courses
          </Link>
        </nav>

        <header className="mt-3 mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-safeman-accent">
            Certificate issuer
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight text-stone-900 sm:text-4xl">
            SafeMan™ Certificate &amp; Site Safety Passport
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
            Serials follow <span className="tnum font-semibold">{SAFEMAN_SYSTEM.serial_format}</span>{' '}
            (e.g. <span className="tnum">SM-2026-FIRE-00481</span>). Every PDF embeds a QR code
            signed with HMAC-SHA256; the public portal recomputes the signature to confirm
            authenticity — no database, no server, no account.
          </p>
        </header>

        <Callout variant="safeman" label="Mandatory non-accredited disclosure" className="mb-8">
          {SAFEMAN_SYSTEM.disclosure}
        </Callout>

        <Issuer />
      </div>
    </>
  );
}
