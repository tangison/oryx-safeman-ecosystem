import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import VideoSlot from '@/components/video-slot';
import { SAFEMAN_COURSES, SAFEMAN_SYSTEM, getCourse } from '@/lib/data';

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return SAFEMAN_COURSES.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const course = getCourse(id);
  return {
    title: course ? `${course.title} — SafeMan™` : 'SafeMan™ course',
    description: course?.subtitle,
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-safeman-hairline bg-white px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">{label}</p>
      <p className="tnum mt-0.5 text-sm font-semibold text-stone-900">{value}</p>
    </div>
  );
}

export default async function CourseReaderPage({ params }: Props) {
  const { id } = await params;
  const course = getCourse(id);
  if (!course) notFound();

  return (
    <>
      <SiteHeader track="safeman" />

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-sm">
          <Link
            href="/safeman/"
            className="inline-flex min-h-[44px] items-center gap-1.5 font-medium text-stone-500 hover:text-safeman-primary"
          >
            <span aria-hidden="true">←</span> SafeMan courses
          </Link>
        </nav>

        {/* Course hero */}
        <article className="mt-4 overflow-hidden rounded-3xl border border-safeman-hairline bg-white shadow-sm">
          <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="tnum rounded-full bg-safeman-primary px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">
                  {course.id}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    course.requires_practicum
                      ? 'bg-safeman-callout text-safeman-primary ring-1 ring-safeman-hairline'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {course.requires_practicum ? 'Theory + Practicum' : 'Theory'}
                </span>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600">
                  {course.subtitle}
                </span>
              </div>

              <h1 className="mt-3 font-display text-3xl leading-tight text-stone-900 sm:text-4xl">
                {course.title}
              </h1>

              <ul className="mt-4 flex flex-wrap gap-1.5">
                {course.standards.map((s) => (
                  <li
                    key={s}
                    className="rounded-full border border-safeman-hairline bg-oryx-canvas px-2.5 py-1 text-[11px] font-medium text-stone-600"
                  >
                    {s}
                  </li>
                ))}
              </ul>

              <div className="tnum mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <Stat label="Pass mark" value={`${course.pass_mark}%`} />
                <Stat label="Exam questions" value={String(course.questions_in_exam)} />
                <Stat label="Validity" value={`${course.cert_validity_months} months`} />
                <Stat label="Modules" value={String(course.modules.length)} />
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link
                  href={`/safeman/course/${course.id}/quiz/`}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-safeman-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-safeman-primary/90"
                >
                  Start knowledge check
                </Link>
                {course.requires_practicum ? (
                  <Link
                    href={`/safeman/course/${course.id}/practicum/`}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-safeman-primary/40 bg-safeman-callout px-5 py-2.5 text-sm font-semibold text-safeman-primary hover:bg-green-100"
                  >
                    Practicum sign-off
                  </Link>
                ) : null}
                <a
                  href={course.manual}
                  download
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d="M12 3v10.6l-3.3-3.3-1.4 1.4L12 16.4l4.7-4.7-1.4-1.4-3.3 3.3V3h-2ZM5 19v2h14v-2H5Z" />
                  </svg>
                  Course manual (PDF)
                </a>
              </div>
            </div>

            <div className="flex h-40 items-center justify-center rounded-2xl bg-oryx-canvas md:h-auto md:w-56">
              <img
                src={course.diagram}
                alt={`Illustration for ${course.title}`}
                className="max-h-[85%] max-w-[85%] object-contain"
                width={190}
                height={160}
              />
            </div>
          </div>
        </article>

        {/* Course-level demo video slot */}
        <div className="mt-6">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-500">
            Practical demonstration video
          </h2>
          <VideoSlot url={course.video_demo_url} />
        </div>

        {/* Modules */}
        <section aria-label="Course modules" className="mt-10">
          <h2 className="font-display text-2xl text-stone-900">Modules</h2>
          <p className="tnum mt-1 text-sm text-stone-600">
            {course.modules.length} modules · read each focus, then work through the key points
          </p>

          <ol className="mt-5 space-y-4">
            {course.modules.map((mod, i) => (
              <li
                key={mod.id}
                className="overflow-hidden rounded-2xl border border-safeman-hairline bg-white shadow-sm"
              >
                <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[220px_1fr]">
                  <div className="flex h-36 items-center justify-center rounded-xl bg-oryx-canvas">
                    <img
                      src={mod.diagram}
                      alt=""
                      aria-hidden="true"
                      className="max-h-[80%] max-w-[80%] object-contain"
                      loading="lazy"
                      width={180}
                      height={130}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="tnum rounded-md bg-safeman-callout px-2 py-0.5 text-[11px] font-bold text-safeman-primary ring-1 ring-safeman-hairline">
                        Module {i + 1} · {mod.id}
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-xl leading-snug text-stone-900">
                      {mod.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{mod.focus}</p>

                    <div className="mt-3">
                      <VideoSlot url={mod.video_demo_url} compact />
                    </div>

                    <h4 className="mt-4 text-xs font-bold uppercase tracking-widest text-stone-500">
                      Key points
                    </h4>
                    <ul className="mt-2 space-y-1.5">
                      {mod.keypoints.map((kp, j) => (
                        <li key={j} className="flex gap-2 text-sm leading-relaxed text-stone-700">
                          <svg
                            viewBox="0 0 24 24"
                            className="mt-0.5 h-4 w-4 shrink-0 text-safeman-accent"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M9.55 17.05 4.9 12.4l1.4-1.4 3.25 3.24 8.15-8.15 1.4 1.42-9.55 9.54Z" />
                          </svg>
                          <span>{kp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Practicum preview */}
        {course.practicum ? (
          <section aria-label="Practicum" className="mt-10 rounded-2xl border border-safeman-hairline bg-safeman-callout p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl text-safeman-primary">{course.practicum.title}</h2>
              <Link
                href={`/safeman/course/${course.id}/practicum/`}
                className="inline-flex min-h-[44px] items-center rounded-full bg-safeman-primary px-4 py-2 text-sm font-semibold text-white hover:bg-safeman-primary/90"
              >
                Open sign-off
              </Link>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">
              <strong>Pass standard:</strong> {course.practicum.pass_standard}
            </p>
            <ol className="tnum mt-3 list-decimal space-y-1 pl-5 text-sm text-stone-700">
              {course.practicum.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </section>
        ) : null}

        <p className="mt-10 text-center text-xs text-stone-500">
          Questions about this course? <a className="font-medium text-safeman-primary" href={`mailto:${SAFEMAN_SYSTEM.contact}`}>{SAFEMAN_SYSTEM.contact}</a>
        </p>
      </div>
    </>
  );
}
