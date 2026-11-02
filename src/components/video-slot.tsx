/**
 * Renders a real <video> player when a demo URL exists, or the mandated
 * "Practical Video Recording Scheduled" badge when it is still null.
 */
export default function VideoSlot({
  url,
  compact = false,
}: {
  url: string | null;
  compact?: boolean;
}) {
  if (url) {
    return (
      <video
        controls
        preload="metadata"
        src={url}
        className="w-full rounded-xl border border-safeman-hairline bg-black"
      >
        <track kind="captions" />
      </video>
    );
  }
  return (
    <p
      className={`inline-flex items-start gap-2 rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs font-medium leading-snug text-amber-900 ${
        compact ? '' : 'max-w-md'
      }`}
      role="note"
    >
      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="currentColor" aria-hidden="true">
        <path d="M4 5h16v11H4z" opacity=".3" />
        <path d="M21 4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h5v2h8v-2h5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1Zm-8 14h-2v-2h2v2Zm7-3H4V6h16v9Z" />
      </svg>
      <span>
        Practical Video Recording Scheduled — Follow Step-by-Step Illustrated Checklist Below
      </span>
    </p>
  );
}
