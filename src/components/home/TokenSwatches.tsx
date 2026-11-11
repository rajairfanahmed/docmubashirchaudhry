import React from 'react';

export function TokenSwatches() {
  const swatches = [
    {
      name: 'Forest Dark',
      hex: '#08331B',
      role: 'Hero & Focus Depth',
      contrast: '14.00:1 (AAA)',
      bg: 'bg-[var(--dmc-brand-dark)]',
      text: 'text-white',
      subText: 'text-emerald-200'
    },
    {
      name: 'Primary Forest',
      hex: '#0D4A28',
      role: 'Brand & Active Controls',
      contrast: '10.36:1 (AAA)',
      bg: 'bg-[var(--dmc-brand-forest)]',
      text: 'text-white',
      subText: 'text-emerald-200'
    },
    {
      name: 'Warm Gold',
      hex: '#F0B938',
      role: 'Primary CTA Accent',
      contrast: '9.95:1 on Ink (AAA)',
      bg: 'bg-[var(--dmc-accent-gold)]',
      text: 'text-[var(--dmc-ink-primary)]',
      subText: 'text-[var(--dmc-ink-primary)]/85'
    },
    {
      name: 'Answer Highlight',
      hex: '#FEF08A / #78350F',
      role: 'Verified Answer Pills',
      contrast: '7.80:1 (AAA)',
      bg: 'bg-[var(--dmc-highlight-bg)] border border-[var(--dmc-highlight-border)]',
      text: 'text-[var(--dmc-highlight-ink)]',
      subText: 'text-[var(--dmc-highlight-ink)]'
    },
    {
      name: 'MCQ Mint Sheet',
      hex: '#E6F4F1',
      role: '/mcq/practice Canvas',
      contrast: '13.75:1 on Stem (AAA)',
      bg: 'bg-[var(--dmc-surface-mcq-sheet)] border border-[var(--dmc-border-subtle)]',
      text: 'text-[var(--dmc-mcq-heading)]',
      subText: 'text-[var(--dmc-ink-secondary)]'
    },
    {
      name: 'Canvas Ground',
      hex: '#FAFBFC',
      role: 'Daylight Canvas',
      contrast: '17.23:1 on Ink (AAA)',
      bg: 'bg-[var(--dmc-surface-ground)] border border-[var(--dmc-border-subtle)]',
      text: 'text-[var(--dmc-ink-primary)]',
      subText: 'text-[var(--dmc-ink-muted)]'
    }
  ];

  return (
    <section aria-labelledby="tokens-title" className="space-y-4 pt-6 border-t border-[var(--dmc-border-subtle)] pb-8">
      <div>
        <span className="pill-badge bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-status-verified-ink)] border border-[var(--dmc-status-verified-border)]/40 mb-2">
          ACADEMIC EMERALD &amp; GOLD TOKENS
        </span>
        <h3 id="tokens-title" className="type-section-heading text-[var(--dmc-ink-primary)] mt-1">
          Active Design System Tokens and WCAG 2.2 Contrast Audit
        </h3>
        <p className="text-xs text-[var(--dmc-ink-muted)] mt-0.5">
          Formally verified color pairings calibrated for high readability across daylight study conditions.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
        {swatches.map((swatch) => (
          <div
            key={swatch.name}
            className={`${swatch.bg} ${swatch.text} p-3.5 rounded-[var(--dmc-radius-squircle)] elevation-1`}
          >
            <div className={`text-[11px] uppercase font-bold ${swatch.subText}`}>{swatch.name}</div>
            <div className="text-sm font-bold mt-1 font-mono">{swatch.hex}</div>
            <div className="text-[10px] opacity-90 mt-1">{swatch.role}</div>
            <div className="text-[10px] opacity-85 mt-0.5 font-semibold">{swatch.contrast}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
