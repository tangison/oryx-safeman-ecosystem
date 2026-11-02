import Link from 'next/link';
import type { SafeManCourse } from '@/lib/data';

/**
 * One card in the SafeMan course grid — data comes straight from
 * /data/safeman_courses.json (13 courses), nothing hardcoded.
 */
export default function CourseCard({ course }: { course: SafeManCourse }) {
  return (
    <Link
      href={`/safeman/course/${course.id}/`}
      className="group flex flex-col rounded-2xl border border-safeman-hairline bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-safeman-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-safeman-primary sm:p-5"
    >
      <div className="mb-3 flex h-24 items-center justify-center rounded-xl bg-oryx-canvas">
        <img
          src={course.diagram}
          alt=""
          aria-hidden="true"
          className="max-h-full max-w-[70%] object-contain"
          loading="lazy"
          width={220}
          height={96}
        />
      </div>

      <h3 className="font-display text-lg leading-snug text-stone-900 group-hover:text-safeman-primary">
        {course.title}
      </h3>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-stone-500">
        {course.subtitle}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {course.standards.slice(0, 3).map((s) => (
          <span
            key={s}
            className="rounded-full border border-safeman-hairline bg-oryx-canvas px-2 py-0.5 text-[11px] font-medium text-stone-600"
          >
            {s}
          </span>
        ))}
        {course.standards.length > 3 ? (
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
            +{course.standards.length - 3}
          </span>
        ) : null}
      </div>

      <div className="mt-auto flex items-center gap-2 pt-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            course.requires_practicum
              ? 'bg-safeman-primary text-white'
              : 'border border-safeman-hairline bg-white text-stone-600'
          }`}
        >
          {course.requires_practicum ? 'Theory + Practicum' : 'Theory'}
        </span>
        <span className="tnum text-[11px] font-medium text-stone-500">
          Pass {course.pass_mark}% · {course.cert_validity_months} mo
        </span>
        <span className="ml-auto text-safeman-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true">
          →
        </span>
      </div>
    </Link>
  );
}
