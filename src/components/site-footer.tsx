import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-oryx-hairline bg-oryx-canvas">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-stone-600 sm:flex-row sm:px-6">
        <p className="text-center sm:text-left">
          <span className="font-semibold text-stone-800">Oryx Institute</span>
          <span className="mx-2 text-stone-400" aria-hidden="true">
            ·
          </span>
          SafeMan™ Site Safety Passport System
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/verify/" className="min-h-[44px] py-2.5 hover:text-oryx-primary">
            Verify a credential
          </Link>
          <Link href="/safeman/" className="min-h-[44px] py-2.5 hover:text-safeman-primary">
            SafeMan courses
          </Link>
          <Link href="/oryx/" className="min-h-[44px] py-2.5 hover:text-oryx-primary">
            NQF programmes
          </Link>
          <a
            href="mailto:info@oryxinstitute.org"
            className="min-h-[44px] py-2.5 font-medium hover:text-stone-900"
          >
            info@oryxinstitute.org
          </a>
        </nav>
      </div>
    </footer>
  );
}
