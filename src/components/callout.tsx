import type { ReactNode } from 'react';

export type CalloutVariant = 'oryx' | 'safeman';

/**
 * Brand callout: tinted fill + 3pt (~4px) solid left border.
 */
export default function Callout({
  variant,
  label,
  children,
  className = '',
}: {
  variant: CalloutVariant;
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  const labelColor =
    variant === 'oryx' ? 'text-oryx-primary' : 'text-safeman-primary';
  return (
    <aside className={`callout ${variant === 'oryx' ? 'callout-oryx' : 'callout-safeman'} p-4 sm:p-5 ${className}`}>
      {label ? (
        <p className={`mb-1.5 text-xs font-bold uppercase tracking-widest ${labelColor}`}>{label}</p>
      ) : null}
      <div className="text-sm leading-relaxed text-stone-800">{children}</div>
    </aside>
  );
}
