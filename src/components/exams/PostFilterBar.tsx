'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Inbox } from 'lucide-react';
import type { RecruitmentPost } from '@/lib/schemas';
import { PostCard } from '@/components/ppsc/PostCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';

export type PostStatusFilterValue = 'all' | 'open' | 'closed';

export interface PostFilterBarProps {
  posts: RecruitmentPost[];
  questionCountByPostId: Record<string, number>;
}

export function PostFilterBar({ posts, questionCountByPostId }: PostFilterBarProps) {
  const [filter, setFilter] = useState<PostStatusFilterValue>('all');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const initial = sp.get('status');
    if (initial === 'open' || initial === 'closed' || initial === 'all') {
      setFilter(initial);
    }
  }, []);

  const handleSelectFilter = (next: PostStatusFilterValue) => {
    setFilter(next);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (next === 'all') {
        url.searchParams.delete('status');
      } else {
        url.searchParams.set('status', next);
      }
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  };

  const counts = useMemo(
    () => ({
      all: posts.length,
      open: posts.filter((p) => p.postStatus === 'open').length,
      closed: posts.filter((p) => p.postStatus === 'closed').length
    }),
    [posts]
  );

  const visiblePosts = useMemo(() => {
    if (filter === 'all') return posts;
    return posts.filter((p) => p.postStatus === filter);
  }, [posts, filter]);

  const tabs: { key: PostStatusFilterValue; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'open', label: 'Open', count: counts.open },
    { key: 'closed', label: 'Closed', count: counts.closed }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 id="posts-grid-title" className="type-section-heading text-[var(--color-ink)]">
            PPSC Recruitment Posts
          </h2>
          <p className="type-body-sm text-[var(--color-ink-secondary)] mt-1">
            Filter active or closed recruitment cadres and download verified solved PDF booklets.
          </p>
        </div>

        {posts.length > 0 && (
          <div
            role="group"
            aria-label="Filter PPSC posts by recruitment status"
            className="inline-flex flex-wrap items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-1.5 self-start shadow-xs"
          >
            <Filter className="w-3.5 h-3.5 text-[var(--color-brand-deep)] ml-1.5 mr-0.5" aria-hidden="true" />
            {tabs.map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectFilter(tab.key)}
                  className={`dmc-press min-h-[44px] px-3.5 py-1.5 rounded-[var(--radius-control)] text-xs font-semibold cursor-pointer tabular-nums focus-visible:outline-2 focus-visible:outline-[var(--color-brand-deep)] ${
                    active
                      ? 'bg-[var(--color-action)] text-[var(--color-action-ink)]'
                      : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div aria-live="polite" className="sr-only">
        Showing {visiblePosts.length} PPSC recruitment post{visiblePosts.length === 1 ? '' : 's'}
      </div>

      {visiblePosts.length === 0 ? (
        <EmptyStateCard
          icon={Inbox}
          title={posts.length === 0 ? 'No Recruitment Posts Published Yet' : `No ${filter === 'open' ? 'Open' : 'Closed'} Recruitment Posts Listed`}
          description={
            posts.length === 0
              ? 'Tracked recruitment posts and cadre study guides will appear here once officially published by the commission.'
              : 'No PPSC posts in the current snapshot match this status filter. Reset to view all tracked cadres.'
          }
          primaryAction={
            posts.length > 0
              ? {
                  label: 'Show All Posts',
                  onClick: () => handleSelectFilter('all')
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visiblePosts.map((post) => {
            const verificationBadge =
              post.verification.status === 'verified'
                ? 'Official Ad Verified'
                : 'Metadata Unverified - Booklets Ready';

            return (
              <PostCard
                key={post.id}
                slug={post.slug}
                title={post.title}
                department={post.department}
                grade={post.basicScale}
                syllabusTopics={post.topicIds.slice(0, 6).map((t) =>
                  t.replace(/^top-/, '').replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
                )}
                solvedMcqCount={questionCountByPostId[post.id] ?? 0}
                status={verificationBadge}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

