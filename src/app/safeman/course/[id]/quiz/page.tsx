import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import QuizRunner from '@/components/quiz-runner';
import { SAFEMAN_COURSES, getCourse } from '@/lib/data';

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
    title: course ? `Knowledge check — ${course.title} — SafeMan™` : 'Knowledge check — SafeMan™',
  };
}

export default async function QuizPage({ params }: Props) {
  const { id } = await params;
  const course = getCourse(id);
  if (!course) notFound();

  return (
    <>
      <SiteHeader track="safeman" />
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-sm">
          <Link
            href={`/safeman/course/${course.id}/`}
            className="inline-flex min-h-[44px] items-center gap-1.5 font-medium text-stone-500 hover:text-safeman-primary"
          >
            <span aria-hidden="true">←</span> {course.title}
          </Link>
        </nav>

        <header className="mt-3 mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-safeman-accent">
            SafeMan™ knowledge check
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight text-stone-900">
            {course.title}
          </h1>
          <p className="tnum mt-2 text-sm text-stone-600">
            {course.questions_in_exam} questions · {course.pass_mark}% to pass · answers graded
            instantly
          </p>
        </header>

        <QuizRunner course={course} />
      </div>
    </>
  );
}
