import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import Callout from '@/components/callout';
import VerifyClient from '@/components/verify-client';
import { SAFEMAN_SYSTEM } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Verify a SafeMan™ Credential',
  description:
    'Public verification portal for SafeMan™ Site Safety Passport credentials. Recomputes the HMAC-SHA256 signature of every QR payload entirely in your browser — works offline.',
};

export default function VerifyPage() {
  return (
    <>
      <SiteHeader track="safeman" />
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-sm">
          <Link
            href="/safeman/"
            className="inline-flex min-h-[44px] items-center gap-1.5 font-medium text-stone-500 hover:text-safeman-primary"
          >
            <span aria-hidden="true">←</span> SafeMan track
          </Link>
        </nav>

        <header className="mt-3 mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-safeman-accent">
            Public verification portal
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight text-stone-900 sm:text-4xl">
            Check any SafeMan™ ticket
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
            Scanning the QR on a certificate or passport card opens this portal with the credential
            payload pre-loaded. Employers, auditors and safety officers can confirm authenticity in
            seconds — no account, no server round-trip.
          </p>
        </header>

        <Callout variant="safeman" className="mb-8">
          This portal is the public verifier for credentials issued under{' '}
          <strong>safeman.oryxinstitute.org</strong>. SafeMan™ is a proprietary non-accredited
          corporate competency benchmark of Oryx Institute. Questions: {SAFEMAN_SYSTEM.contact}
        </Callout>

        <VerifyClient />
      </div>
    </>
  );
}
