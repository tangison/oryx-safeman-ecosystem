import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import Callout from '@/components/callout';
import CourseCard from '@/components/course-card';
import { SAFEMAN_COURSES, SAFEMAN_SYSTEM } from '@/lib/data';

export const metadata: Metadata = {
  title: 'SafeMan™ Course Catalogue',
  description: SAFEMAN_SYSTEM.disclosure,
};

export default function SafeManDashboard() {
  return (
    <>
      <SiteHeader track="safeman" />

      <section className="mx-auto w-full max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-safeman-accent">
              SafeMan™ · {SAFEMAN_SYSTEM.owner}
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-stone-900 sm:text-4xl">
              Course Catalogue
            </h1>
            <p className="tnum mt-2 text-sm text-stone-600">
              {SAFEMAN_COURSES.length} courses · pass mark {SAFEMAN_COURSES[0].pass_mark}% ·
              knowledge check + assessor practicum where required
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/safeman/issue/"
              className="inline-flex min-h-[44px] items-center rounded-full bg-safeman-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-safeman-primary/90"
            >
              Issue certificates
            </Link>
            <Link
              href="/verify/"
              className="inline-flex min-h-[44px] items-center rounded-full border border-safeman-hairline bg-white px-4 py-2.5 text-sm font-medium text-safeman-primary hover:bg-safeman-callout"
            >
              Verify a ticket
            </Link>
          </div>
        </div>

        <Callout variant="safeman" label="Mandatory disclosure" className="mt-6">
          {SAFEMAN_SYSTEM.disclosure}
        </Callout>
      </section>

      <section aria-label="Courses" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SAFEMAN_COURSES.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>
    </>
  );
}
