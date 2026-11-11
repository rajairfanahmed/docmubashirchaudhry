import React from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { getServerManifest } from '@/lib/data/server-manifest';

export function Footer() {
  const manifest = getServerManifest();

  return (
    <footer
      role="contentinfo"
      className="bg-[var(--dmc-brand-footer)] text-slate-300 text-xs border-t border-[var(--dmc-brand-dark)] pt-12 pb-8"
    >
      <PageContainer>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 mb-10">
          {/* Brand Summary & Non-Affiliation */}
          <div className="lg:col-span-5 space-y-3 min-w-0">
            <Link href="/" className="inline-flex items-center gap-2.5 max-w-full min-w-0">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-[var(--dmc-brand-forest)] flex items-center justify-center text-[var(--dmc-accent-gold)]">
                <GraduationCap className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="text-base font-bold text-white font-display tracking-tight min-w-0 break-words [overflow-wrap:anywhere]">
                docmubashirchaudhry
              </span>
            </Link>
            <p className="text-slate-300 text-xs leading-relaxed max-w-sm">
              Independent open-access examination preparation portal for Pakistani civil service and one-paper candidates. Free solved MCQ booklets, topic-indexed MCQ drills, and verified World Geography quizzes.
            </p>
            <p className="text-[11px] font-semibold text-emerald-300">
              Free &middot; Zero Ads &middot; No Signup &middot; Independent from Government Commissions
            </p>
          </div>

          {/* Primary Study Portals */}
          <div className="lg:col-span-2">
            <h2 className="text-white font-bold text-xs uppercase tracking-wider mb-2 sm:mb-3">Portals</h2>
            <ul className="space-y-0.5 sm:space-y-2">
              <li><Link href="/exams" className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-[var(--dmc-accent-gold)]">Exams Hub</Link></li>
              <li><Link href="/geography" className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-[var(--dmc-accent-gold)]">World Geography</Link></li>
              <li><Link href="/mcq" className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-[var(--dmc-accent-gold)]">MCQ Practice</Link></li>
              <li><Link href="/library" className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-[var(--dmc-accent-gold)]">PDF Library</Link></li>
              <li><Link href="/search" className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-[var(--dmc-accent-gold)]">Portal Search</Link></li>
            </ul>
          </div>

          {/* Commission Hubs */}
          <div className="lg:col-span-2">
            <h2 className="text-white font-bold text-xs uppercase tracking-wider mb-2 sm:mb-3">Exams</h2>
            <ul className="space-y-0.5 sm:space-y-2">
              <li><Link href="/ppsc" className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-[var(--dmc-accent-gold)]">PPSC Hub</Link></li>
              <li><Link href="/ppsc/intelligent-officer" className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-[var(--dmc-accent-gold)]">Intelligence Officer</Link></li>
              <li><Link href="/css-pms" className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-[var(--dmc-accent-gold)]">CSS / PMS</Link></li>
              <li><Link href="/fpsc" className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-[var(--dmc-accent-gold)]">FPSC Hub</Link></li>
              <li><Link href="/nts" className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-[var(--dmc-accent-gold)]">NTS Hub</Link></li>
            </ul>
          </div>

          {/* Required Governance & Information Links */}
          <div className="lg:col-span-3">
            <h2 className="text-white font-bold text-xs uppercase tracking-wider mb-2 sm:mb-3">Transparency &amp; Info</h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 sm:gap-y-2">
              <li><Link href="/about" className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-[var(--dmc-accent-gold)]">About</Link></li>
              <li><Link href="/methodology" className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-[var(--dmc-accent-gold)]">Methodology</Link></li>
              <li><Link href="/corrections" className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-[var(--dmc-accent-gold)]">Corrections</Link></li>
              <li><Link href="/copyright" className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-[var(--dmc-accent-gold)]">Copyright</Link></li>
              <li><Link href="/privacy" className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-[var(--dmc-accent-gold)]">Privacy</Link></li>
              <li><Link href="/accessibility" className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-[var(--dmc-accent-gold)]">Accessibility</Link></li>
              <li><Link href="/status" className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-[var(--dmc-accent-gold)]">Status</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--dmc-brand-dark)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>
            &copy; 2024-2026 docmubashirchaudhry. Not affiliated with PPSC, FPSC, NTS, or any government body.
          </p>
          <p>
            Dataset <span className="font-mono text-slate-300">{manifest.datasetVersion}</span> verified at build time.
          </p>
        </div>
      </PageContainer>
    </footer>
  );
}
