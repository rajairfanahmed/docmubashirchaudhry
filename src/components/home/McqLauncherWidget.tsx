'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlayCircle } from 'lucide-react';
import type { Exam, Subject, Topic } from '@/lib/schemas';
import { notifyNavigationStart } from '@/lib/motion/navigation-events';
import { Button } from '@/components/ui/Button';

export interface McqLauncherWidgetProps {
  exams: Exam[];
  subjects: Subject[];
  topics?: Topic[];
  questionCountsBySubject?: Record<string, number>;
  hideSubjectStrip?: boolean;
}

export function McqLauncherWidget({
  exams,
  subjects,
  topics: _topics,
  questionCountsBySubject: _questionCountsBySubject,
  hideSubjectStrip = false
}: McqLauncherWidgetProps) {
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const handleLaunch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedExam) params.set('exam', selectedExam);
    if (selectedSubject) params.set('subject', selectedSubject);
    const qs = params.toString();
    notifyNavigationStart();
    router.push(qs ? `/mcq/practice?${qs}` : '/mcq/practice');
  };

  return (
    <div className={hideSubjectStrip ? undefined : 'space-y-8'}>
      {/* Quick Exam & Subject Launcher Card */}
      <form
        action="/mcq/practice"
        method="GET"
        onSubmit={handleLaunch}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-5 sm:p-6 shadow-xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label
              htmlFor="home-mcq-exam"
              className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1.5"
            >
              Exam Authority
            </label>
            <select
              id="home-mcq-exam"
              name="exam"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full h-11 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-deep)]"
            >
              <option value="">All Exams (General Screening)</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.slug}>
                  {exam.bodyCode} - {exam.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="home-mcq-subject"
              className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1.5"
            >
              Subject Focus
            </label>
            <select
              id="home-mcq-subject"
              name="subject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full h-11 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-deep)]"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.slug}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full">
            <PlayCircle className="w-4 h-4" aria-hidden="true" />
            <span>Start Practice</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

