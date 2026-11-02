'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type Track = 'neutral' | 'safeman' | 'oryx';

/**
 * Persistent domain-switcher pill: jumps between the two brand tracks.
 */
export default function DomainSwitcher({ track }: { track: Track }) {
  const pathname = usePathname() ?? '/';

  const isSafe = track === 'safeman' || pathname.startsWith('/safeman');
  const isOryx = track === 'oryx' || pathname.startsWith('/oryx');

  const base =
    'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors min-h-[36px] min-w-[44px] justify-center';
  const activeSafe = 'bg-safeman-primary text-white';
  const activeOryx = 'bg-oryx-primary text-white';
  const idle = 'text-stone-600 hover:bg-stone-200/70';

  return (
    <nav
      aria-label="Switch brand track"
      className="flex items-center rounded-full border border-stone-300 bg-white/70 p-1 shadow-sm backdrop-blur"
    >
      <Link
        href="/safeman/"
        aria-current={track === 'safeman' ? 'page' : undefined}
        className={`${base} ${isSafe ? activeSafe : idle}`}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
          <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1.2 13.6-3-3 1.4-1.4 1.6 1.6 4-4L16.2 10l-5.4 5.6Z" />
        </svg>
        SafeMan
      </Link>
      <Link
        href="/oryx/"
        aria-current={track === 'oryx' ? 'page' : undefined}
        className={`${base} ${isOryx ? activeOryx : idle}`}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
          <path d="M6 20c1.8-1 3-2.6 3.4-4.6C6.8 14.6 5 12.2 5 9.4 5 5.9 7.9 3 11.4 3h1.2C16.1 3 19 5.9 19 9.4c0 3.4-2.7 6.2-6.1 6.4-.2 1.7-1.2 3.2-2.7 4.2H6Z" />
        </svg>
        Oryx
      </Link>
    </nav>
  );
}
