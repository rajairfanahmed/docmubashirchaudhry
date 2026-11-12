'use client';

import React, { useEffect, useState } from 'react';
import { Mail, Clock, ShieldCheck, Send, CheckCircle2, Copy, Check } from 'lucide-react';
import {
  buildCorrectionMailtoUrl,
  formatFeedbackReportText,
  PORTAL_CORRECTION_EMAIL,
  type FeedbackCategory
} from '@/lib/feedback/mailto';
import { useToast } from '@/components/ui/ToastProvider';

interface FeedbackFieldErrors {
  fullName?: string;
  email?: string;
  referenceTitle?: string;
  message?: string;
}

const VALID_CATEGORIES = new Set<FeedbackCategory>([
  'errata',
  'pastpaper',
  'syllabus',
  'geography',
  'copyright',
  'other'
]);

export function AcademicFeedbackForm() {
  const { showToast } = useToast();
  const [composerReady, setComposerReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<FeedbackFieldErrors>({});
  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    category: FeedbackCategory;
    referenceTitle: string;
    message: string;
  }>({
    fullName: '',
    email: '',
    category: 'errata',
    referenceTitle: '',
    message: ''
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const ref = sp.get('ref')?.trim();
    const cat = sp.get('category')?.trim() as FeedbackCategory | undefined;
    if (ref || (cat && VALID_CATEGORIES.has(cat))) {
      setFormData((prev) => ({
        ...prev,
        ...(ref ? { referenceTitle: ref } : {}),
        ...(cat && VALID_CATEGORIES.has(cat) ? { category: cat } : {})
      }));
    }
  }, []);

  const mailtoInput = {
    fullName: formData.fullName,
    senderEmail: formData.email,
    category: formData.category,
    referenceTitle: formData.referenceTitle,
    message: formData.message
  };

  const validateForm = (): FeedbackFieldErrors => {
    const next: FeedbackFieldErrors = {};
    if (formData.fullName.trim().length < 2) {
      next.fullName = 'Please enter your name (at least 2 characters).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      next.email = 'Please enter a valid email address so editors can follow up.';
    }
    if (formData.referenceTitle.trim().length < 3) {
      next.referenceTitle = 'Reference title or slug must be at least 3 characters.';
    }
    if (formData.message.trim().length < 15) {
      next.message = 'Please explain the correction or citation (at least 15 characters).';
    }
    return next;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstInvalidId = nextErrors.fullName
        ? 'fullName'
        : nextErrors.email
          ? 'email'
          : nextErrors.referenceTitle
            ? 'referenceTitle'
            : 'message';
      if (typeof document !== 'undefined') {
        document.getElementById(firstInvalidId)?.focus();
      }
      return;
    }

    setErrors({});
    const url = buildCorrectionMailtoUrl(mailtoInput);
    setComposerReady(true);
    showToast({
      tone: 'success',
      title: 'Correction draft prepared',
      description: 'Email client launched with a structured copy fallback below.'
    });
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  };

  const handleCopyReport = async () => {
    const { subject, body } = formatFeedbackReportText(mailtoInput);
    const fullText = `To: ${PORTAL_CORRECTION_EMAIL}\nSubject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      showToast({
        tone: 'success',
        title: 'Copied to clipboard',
        description: `Paste into any webmail client addressed to ${PORTAL_CORRECTION_EMAIL}.`
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      showToast({
        tone: 'warning',
        title: 'Clipboard access blocked',
        description: 'Select and copy the formatted email preview manually.'
      });
    }
  };

  const formattedPreview = formatFeedbackReportText(mailtoInput);

  return (
    <section aria-labelledby="feedback-form-heading" className="space-y-6">
      <div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[var(--color-warning-bg)] text-[var(--color-warning-ink)] border border-[var(--color-warning-border)] mb-2">
          ACADEMIC ERRATA &amp; INQUIRY DESK
        </span>
        <h2 id="feedback-form-heading" className="text-xl sm:text-2xl font-extrabold text-[var(--color-ink)] tracking-tight">
          Submit Errata, Question Clarifications, or Academic Feedback
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] mt-1">
          Reports open directly in your email client with zero backend form tracking or account login required.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-4 sm:p-6 shadow-xs space-y-5">
          <div>
            <div className="text-xs font-bold text-[var(--color-ink-muted)] uppercase tracking-wider">
              Editorial Standards Desk
            </div>
            <h3 className="text-base font-bold text-[var(--color-ink)] mt-1">
              Factual Integrity Protocol
            </h3>
            <p className="text-xs text-[var(--color-ink-secondary)] mt-2 leading-relaxed">
              Every booklet question and country fact is verified against cited official gazettes and UN/ISO standards. If you identify an error, compose a citation email below for editorial PR review.
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t border-[var(--color-border)] text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] text-[var(--color-brand-deep)] shrink-0">
                <Mail className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <div className="font-bold text-[var(--color-ink)]">Direct Faculty Contact</div>
                <div className="text-[var(--color-ink-muted)] font-mono text-[11px] mt-0.5">{PORTAL_CORRECTION_EMAIL}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-[var(--radius-control)] bg-[var(--color-warning-bg)] text-[var(--color-warning-ink)] shrink-0">
                <Clock className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <div className="font-bold text-[var(--color-ink)]">Correction Review SLA</div>
                <div className="text-[var(--color-ink-muted)] text-[11px] mt-0.5">24 to 48 Hours Source Verification Window</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] text-[var(--color-brand-deep)] shrink-0">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <div className="font-bold text-[var(--color-ink)]">Client-Only Mail Composer</div>
                <div className="text-[var(--color-ink-muted)] text-[11px] mt-0.5">Zero server storage and zero telemetry tracking</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-4 sm:p-6 lg:p-7 shadow-xs">
          {composerReady ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[var(--color-success-ink)]">
                <div className="w-10 h-10 rounded-full bg-[var(--color-success-bg)] border border-[var(--color-success-border)] text-[var(--color-brand-deep)] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-ink)]">
                    Email Draft Ready to Send
                  </h3>
                  <p className="text-xs text-[var(--color-ink-secondary)]">
                    Your default email app was launched. You can also copy the formatted report below and send it manually to {PORTAL_CORRECTION_EMAIL}.
                  </p>
                </div>
              </div>

              <pre className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-[var(--radius-control)] p-4 text-[11px] font-mono text-[var(--color-ink-secondary)] whitespace-pre-wrap break-words overflow-x-auto max-w-full">
                {`To: ${PORTAL_CORRECTION_EMAIL}\nSubject: ${formattedPreview.subject}\n\n${formattedPreview.body}`}
              </pre>

              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={buildCorrectionMailtoUrl(mailtoInput)}
                  className="dmc-press inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 bg-[var(--color-action)] text-[var(--color-action-ink)] rounded-[var(--radius-control)] text-xs font-semibold hover:bg-[var(--color-action-hover)] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Open Email Client Again</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="dmc-press inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-ink)] rounded-[var(--radius-control)] text-xs font-semibold hover:bg-[var(--color-surface-soft)] transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[var(--color-success-ink)]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Report Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setComposerReady(false)}
                  className="inline-flex items-center min-h-[44px] px-2 text-xs font-semibold text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] underline cursor-pointer"
                >
                  Edit Draft
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? 'error-fullName' : undefined}
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value });
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                    }}
                    placeholder="Candidate or Academic Name"
                    onBlur={() => {
                      const err = validateForm().fullName;
                      if (err) setErrors((prev) => ({ ...prev, fullName: err }));
                    }}
                    className={`w-full min-h-[44px] text-sm sm:text-xs px-3 py-2 rounded-[var(--radius-control)] border bg-[var(--color-surface)] text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-deep)] ${
                      errors.fullName
                        ? 'border-[var(--color-danger-ink)]'
                        : 'border-[var(--color-border-strong)]'
                    }`}
                  />
                  {errors.fullName && (
                    <p id="error-fullName" role="alert" className="text-[11px] font-semibold text-[var(--color-danger-ink)] mt-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">
                    Your Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'error-email' : undefined}
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="name@example.com"
                    onBlur={() => {
                      const err = validateForm().email;
                      if (err) setErrors((prev) => ({ ...prev, email: err }));
                    }}
                    className={`w-full min-h-[44px] text-sm sm:text-xs px-3 py-2 rounded-[var(--radius-control)] border bg-[var(--color-surface)] text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-deep)] ${
                      errors.email
                        ? 'border-[var(--color-danger-ink)]'
                        : 'border-[var(--color-border-strong)]'
                    }`}
                  />
                  {errors.email && (
                    <p id="error-email" role="alert" className="text-[11px] font-semibold text-[var(--color-danger-ink)] mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">
                    Submission Category
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as FeedbackCategory })}
                    className="w-full min-h-[44px] text-sm sm:text-xs px-3 py-2 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-deep)] cursor-pointer"
                  >
                    <option value="errata">Errata / Question Key Discrepancy</option>
                    <option value="pastpaper">Past Paper Question Clarification</option>
                    <option value="syllabus">Syllabus Benchmark Update</option>
                    <option value="geography">Geography Fact Verification</option>
                    <option value="copyright">Copyright / Takedown Request</option>
                    <option value="other">General Academic Inquiry</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="referenceTitle" className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">
                    Reference Document / Post Title
                  </label>
                  <input
                    id="referenceTitle"
                    type="text"
                    required
                    aria-invalid={Boolean(errors.referenceTitle)}
                    aria-describedby={errors.referenceTitle ? 'error-referenceTitle' : undefined}
                    value={formData.referenceTitle}
                    onChange={(e) => {
                      setFormData({ ...formData, referenceTitle: e.target.value });
                      if (errors.referenceTitle) setErrors((prev) => ({ ...prev, referenceTitle: undefined }));
                    }}
                    onBlur={() => {
                      const err = validateForm().referenceTitle;
                      if (err) setErrors((prev) => ({ ...prev, referenceTitle: err }));
                    }}
                    placeholder="e.g. Set 01 MCQ #142 or South Africa Capital"
                    className={`w-full min-h-[44px] text-sm sm:text-xs px-3 py-2 rounded-[var(--radius-control)] border bg-[var(--color-surface)] text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-deep)] ${
                      errors.referenceTitle
                        ? 'border-[var(--color-danger-ink)]'
                        : 'border-[var(--color-border-strong)]'
                    }`}
                  />
                  {errors.referenceTitle && (
                    <p id="error-referenceTitle" role="alert" className="text-[11px] font-semibold text-[var(--color-danger-ink)] mt-1">
                      {errors.referenceTitle}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">
                  Message &amp; Verified Evidence Citation
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'error-message' : undefined}
                  value={formData.message}
                  onChange={(e) => {
                    setFormData({ ...formData, message: e.target.value });
                    if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
                  }}
                  onBlur={() => {
                    const err = validateForm().message;
                    if (err) setErrors((prev) => ({ ...prev, message: err }));
                  }}
                  placeholder="Provide official commission notification URL, PDF citation, or UN/ISO reference..."
                  className={`w-full text-sm sm:text-xs px-3 py-2 rounded-[var(--radius-control)] border bg-[var(--color-surface)] text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-deep)] ${
                    errors.message
                      ? 'border-[var(--color-danger-ink)]'
                      : 'border-[var(--color-border-strong)]'
                  }`}
                ></textarea>
                {errors.message && (
                  <p id="error-message" role="alert" className="text-[11px] font-semibold text-[var(--color-danger-ink)] mt-1">
                    {errors.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-[var(--color-ink-muted)] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-brand-deep)] shrink-0" aria-hidden="true" />
                  <span>Direct Mailto Dispatch (Zero Data Stored)</span>
                </span>

                <button
                  type="submit"
                  className="dmc-press inline-flex items-center justify-center gap-1.5 min-h-[44px] w-full sm:w-auto px-4 py-2.5 bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] font-semibold text-xs rounded-[var(--radius-control)] shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Prepare Correction Email</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
