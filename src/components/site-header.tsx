'use client';

import Link from 'next/link';
import DomainSwitcher, { type Track } from './domain-switcher';

const TRACK_META: Record<
  Track,
  { title: string; sub: string; accentText: string; hairline: string; logo?: string }
> = {
  neutral: {
    title: 'ORYX ECOSYSTEM',
    sub: 'Oryx Institute · Namibia',
    accentText: 'text-oryx-primary',
    hairline: 'border-oryx-hairline',
  },
  safeman: {
    title: 'SAFEMAN™',
    sub: 'Site Safety Passport System',
    accentText: 'text-safeman-primary',
    hairline: 'border-safeman-hairline',
    logo: '/assets/logos/safeman_logo_color.png',
  },
  oryx: {
    title: 'ORYX INSTITUTE',
    sub: 'Vocational & Corporate Training',
    accentText: 'text-oryx-primary',
    hairline: 'border-oryx-hairline',
  },
};

export default function SiteHeader({ track }: { track: Track }) {
  const meta = TRACK_META[track];
  const home = track === 'safeman' ? '/safeman/' : track === 'oryx' ? '/oryx/' : '/';

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-oryx-canvas/95 backdrop-blur ${meta.hairline}`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href={home} className="flex min-w-0 items-center gap-3 focus-visible:outline-2">
          {meta.logo ? (
            <img
              src={meta.logo}
              alt="SafeMan wordmark"
              className="h-10 w-auto shrink-0"
              width={160}
              height={40}
            />
          ) : (
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-current/0 ${
                track === 'oryx' ? 'bg-oryx-primary' : 'bg-stone-800/5'
              }`}
            >
              {track === 'oryx' ? (
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-oryx-canvas" fill="currentColor" aria-hidden="true">
                  <path d="M6 20c1.8-1 3-2.6 3.4-4.6C6.8 14.6 5 12.2 5 9.4 5 5.9 7.9 3 11.4 3h1.2C16.1 3 19 5.9 19 9.4c0 3.4-2.7 6.2-6.1 6.4-.2 1.7-1.2 3.2-2.7 4.2H6Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-oryx-primary" fill="currentColor" aria-hidden="true">
                  <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1.2 13.6-3-3 1.4-1.4 1.6 1.6 4-4L16.2 10l-5.4 5.6Z" />
                </svg>
              )}
            </span>
          )}
          <span className="min-w-0">
            <span
              className={`block truncate font-display text-lg leading-tight tracking-wide ${meta.accentText}`}
            >
              {meta.title}
            </span>
            <span className="block truncate text-[11px] font-medium uppercase tracking-widest text-stone-500">
              {meta.sub}
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <a
            href="mailto:info@oryxinstitute.org"
            className="hidden min-h-[36px] items-center rounded-full px-3 text-xs font-medium text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 md:inline-flex"
          >
            info@oryxinstitute.org
          </a>
          <DomainSwitcher track={track} />
        </div>
      </div>
    </header>
  );
}
