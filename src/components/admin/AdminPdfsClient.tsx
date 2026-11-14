'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CloudUpload,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import {
  FieldWrapper,
  SelectField,
  SkeletonBlock,
  TextArea,
  TextInput
} from '@/components/ui/FormPrimitives';
import { Modal } from '@/components/ui/Modal';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { useToast } from '@/components/ui/ToastProvider';
import { formatBytes } from '@/lib/format';
import type { PdfResourceRow } from '@/lib/supabase/database.types';
import { uploadPdfBinaryToR2, v3Api } from '@/lib/v3/client';
import type { AdminPdfAnalyticsResponse, AdminPdfInventoryResponse } from '@/lib/v3/types';

const MAX_PDF_BYTES = 50 * 1024 * 1024;

function slugifyTitle(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

async function computeFileSha256(file: File): Promise<string | null> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return null;
  }
  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
}

export function AdminPdfsClient() {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [inventory, setInventory] = useState<AdminPdfInventoryResponse | null>(null);
  const [analytics, setAnalytics] = useState<AdminPdfAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [subject, setSubject] = useState('General Knowledge');
  const [examTag, setExamTag] = useState('PPSC');
  const [tagsCsv, setTagsCsv] = useState('');
  const [description, setDescription] = useState('');
  const [watermarkConfirmed, setWatermarkConfirmed] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStage, setUploadStage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const uploadAbortRef = useRef<AbortController | null>(null);

  // Edit & Delete modals
  const [editingPdf, setEditingPdf] = useState<PdfResourceRow | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editExamTag, setEditExamTag] = useState('PPSC');
  const [editDescription, setEditDescription] = useState('');
  const [editPublished, setEditPublished] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<PdfResourceRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(
    async (targetPage: number, signal?: AbortSignal) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [invRes, anaRes] = await Promise.all([
          v3Api.admin.pdfs.list({ page: targetPage, pageSize }, signal),
          v3Api.admin.analytics.pdfs(signal)
        ]);
        setInventory(invRes);
        setAnalytics(anaRes);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setErrorMsg(err instanceof Error ? err.message : 'Unable to load PDF resources.');
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchAll(page, controller.signal);
    return () => controller.abort();
  }, [page, fetchAll]);

  const handleFilePicked = (file: File | null) => {
    if (!file) {
      return;
    }
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFormErrors({ file: 'Only valid .pdf documents are accepted.' });
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setFormErrors({ file: 'PDF exceeds the 50 MB upload limit.' });
      return;
    }

    setSelectedFile(file);
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.file;
      return next;
    });

    if (!title.trim()) {
      const cleanName = file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();
      setTitle(cleanName);
      if (!slugManual) {
        setSlug(slugifyTitle(cleanName));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!selectedFile) {
      errs.file = 'Select a watermarked .pdf file to upload.';
    }
    if (title.trim().length < 3) {
      errs.title = 'Enter a descriptive document title.';
    }
    if (!/^[a-z0-9-]+$/.test(slug.trim())) {
      errs.slug = 'Use lowercase letters, numbers, and hyphens only.';
    }
    if (!subject.trim()) {
      errs.subject = 'Subject is required.';
    }
    if (!watermarkConfirmed) {
      errs.watermarkConfirmed =
        'Confirm that this PDF already carries the owner watermark before uploading.';
    }

    if (Object.keys(errs).length > 0 || !selectedFile) {
      setFormErrors(errs);
      return;
    }

    setFormErrors({});
    setUploadProgress(0);
    try {
      setUploadStage('Computing SHA-256 verification hash...');
      const sha256 = await computeFileSha256(selectedFile);

      setUploadStage('Requesting private R2 presigned URL...');
      try {
        const grant = await v3Api.admin.pdfs.createUploadUrl({
          filename: selectedFile.name,
          contentType: 'application/pdf',
          fileSizeBytes: selectedFile.size
        });

        setUploadStage('Uploading directly to Cloudflare R2...');
        const controller = new AbortController();
        uploadAbortRef.current = controller;
        await uploadPdfBinaryToR2({
          uploadUrl: grant.uploadUrl,
          file: selectedFile,
          requiredHeaders: grant.requiredHeaders,
          onProgress: (pct: number) => setUploadProgress(pct),
          signal: controller.signal
        });
        uploadAbortRef.current = null;

        setUploadStage('Saving metadata to catalog...');
        const tags = tagsCsv
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

        await v3Api.admin.pdfs.create({
          slug: slug.trim(),
          title: title.trim(),
          description: description.trim(),
          subject: subject.trim(),
          examTag: examTag.trim(),
          tags,
          fileKey: grant.fileKey,
          fileSize: selectedFile.size,
          sha256,
          watermarkConfirmed: true,
          isPublished
        });
      } catch (uploadErr: any) {
        if (uploadErr?.code === 'ABORTED') throw uploadErr;

        // Fallback: Upload directly to server endpoint to bypass client CORS restrictions
        setUploadStage('Connecting via server-side storage pipeline...');
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', title.trim());
        formData.append('slug', slug.trim());
        formData.append('description', description.trim());
        formData.append('subject', subject.trim());
        formData.append('examTag', examTag.trim());
        formData.append('sha256', sha256 || '');
        formData.append('tags', tagsCsv || '');
        formData.append('isPublished', String(isPublished));

        await v3Api.admin.pdfs.uploadDirect(formData);
      }

      showToast({
        title: 'Watermarked PDF uploaded',
        description: `"${title.trim()}" is now registered in private R2 storage.`,
        tone: 'success'
      });

      setSelectedFile(null);
      setTitle('');
      setSlug('');
      setSlugManual(false);
      setTagsCsv('');
      setDescription('');
      setWatermarkConfirmed(false);
      setUploadProgress(null);
      setUploadStage(null);
      await fetchAll(1);
    } catch (err) {
      uploadAbortRef.current = null;
      setUploadProgress(null);
      setUploadStage(null);
      const isAborted =
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: unknown }).code === 'ABORTED';
      if (isAborted) {
        showToast({
          title: 'Upload cancelled',
          description: 'Your form metadata was preserved so you can edit or retry anytime.',
          tone: 'info'
        });
        return;
      }
      setFormErrors({
        form: err instanceof Error ? err.message : 'PDF upload failed.'
      });
    }
  };

  const openEditModal = (pdf: PdfResourceRow) => {
    setEditingPdf(pdf);
    setEditTitle(pdf.title);
    setEditSubject(pdf.subject);
    setEditExamTag(pdf.exam_tag);
    setEditDescription(pdf.description ?? '');
    setEditPublished(pdf.is_published);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPdf) {
      return;
    }
    setSavingEdit(true);
    try {
      await v3Api.admin.pdfs.update(editingPdf.id, {
        title: editTitle.trim(),
        subject: editSubject.trim(),
        examTag: editExamTag.trim(),
        description: editDescription.trim(),
        isPublished: editPublished
      });
      showToast({ title: 'PDF metadata updated', tone: 'success' });
      setEditingPdf(null);
      await fetchAll(page);
    } catch (err) {
      showToast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Could not update PDF metadata.',
        tone: 'error'
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleTogglePublished = async (pdf: PdfResourceRow) => {
    try {
      await v3Api.admin.pdfs.update(pdf.id, { isPublished: !pdf.is_published });
      showToast({
        title: pdf.is_published ? 'PDF hidden from library' : 'PDF published',
        tone: 'info'
      });
      await fetchAll(page);
    } catch (err) {
      showToast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        tone: 'error'
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await v3Api.admin.pdfs.remove(deleteTarget.id);
      showToast({ title: 'PDF record deleted', tone: 'info' });
      setDeleteTarget(null);
      await fetchAll(page);
    } catch (err) {
      showToast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Could not delete PDF.',
        tone: 'error'
      });
    } finally {
      setDeleting(false);
    }
  };

  const pdfs = inventory?.items ?? [];
  const totalManaged = inventory?.pagination.totalItems ?? pdfs.length;
  const totalDownloads = (analytics?.perResource ?? []).reduce(
    (sum, item) => sum + item.downloadCount,
    0
  );

  const kpis = [
    { label: 'Managed PDF Resources', value: String(totalManaged), icon: FileText },
    { label: 'Total User Downloads', value: totalDownloads.toLocaleString(), icon: Download },
    { label: 'Private Bucket Security', value: 'R2 Signed URLs', icon: ShieldCheck }
  ];

  const isUploading = uploadProgress !== null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-5 elevation-1 space-y-2"
            >
              <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[var(--dmc-ink-muted)]">
                <span>{item.label}</span>
                <Icon className="w-4 h-4 text-[var(--dmc-brand-forest)] shrink-0" aria-hidden="true" />
              </div>
              <div className="font-display font-extrabold text-xl sm:text-2xl text-[var(--dmc-ink-primary)] tabular-nums">
                {loading && !inventory ? '...' : item.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Direct Private R2 Upload Form */}
        <aside className="xl:col-span-5 bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-5 sm:p-6 elevation-1 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="type-card-title text-[var(--dmc-ink-primary)]">
              Upload Watermarked PDF
            </h2>
            <HardDrive className="w-4 h-4 text-[var(--dmc-brand-forest)]" aria-hidden="true" />
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-3.5">
            {formErrors.form ? (
              <div
                role="alert"
                className="rounded-[var(--dmc-radius-squircle)] border border-[var(--dmc-status-error-border)] bg-[var(--dmc-status-error-bg)] px-3 py-2 text-xs font-semibold text-[var(--dmc-status-error-ink)]"
              >
                {formErrors.form}
              </div>
            ) : null}

            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFilePicked(e.dataTransfer.files?.[0] ?? null);
              }}
              className="block rounded-[var(--dmc-radius-card)] border-2 border-dashed border-[var(--dmc-border-strong)] hover:border-[var(--dmc-brand-forest)] bg-[var(--dmc-surface-ground)] p-5 text-center space-y-2 cursor-pointer transition-colors"
            >
              <CloudUpload
                className="w-8 h-8 text-[var(--dmc-brand-forest)] mx-auto"
                aria-hidden="true"
              />
              <div className="text-sm font-semibold text-[var(--dmc-ink-primary)]">
                {selectedFile ? selectedFile.name : 'Click or drag .PDF file here'}
              </div>
              <p className="text-xs text-[var(--dmc-ink-muted)]">
                {selectedFile
                  ? `${formatBytes(selectedFile.size)} - Ready for R2 upload`
                  : 'Watermarked PDF only, up to 50 MB'}
              </p>
              <input
                type="file"
                accept="application/pdf,.pdf"
                disabled={isUploading}
                onChange={(e) => handleFilePicked(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
            {formErrors.file ? (
              <p role="alert" className="text-xs font-semibold text-[var(--dmc-status-error-ink)]">
                {formErrors.file}
              </p>
            ) : null}

            <FieldWrapper id="pdf-title" label="PDF Title" required error={formErrors.title}>
              <TextInput
                id="pdf-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugManual) {
                    setSlug(slugifyTitle(e.target.value));
                  }
                }}
                placeholder="e.g., PPSC Geography Solved 2018-2025"
                hasError={Boolean(formErrors.title)}
              />
            </FieldWrapper>

            <FieldWrapper id="pdf-slug" label="Resource Slug" required error={formErrors.slug}>
              <TextInput
                id="pdf-slug"
                value={slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setSlug(e.target.value);
                }}
                placeholder="ppsc-geography-solved"
                hasError={Boolean(formErrors.slug)}
              />
            </FieldWrapper>

            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper id="pdf-subject" label="Subject" required error={formErrors.subject}>
                <TextInput
                  id="pdf-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  hasError={Boolean(formErrors.subject)}
                />
              </FieldWrapper>
              <FieldWrapper id="pdf-exam" label="Exam Tag" required>
                <SelectField
                  id="pdf-exam"
                  value={examTag}
                  onChange={(e) => setExamTag(e.target.value)}
                >
                  <option value="PPSC">PPSC</option>
                  <option value="FPSC">FPSC</option>
                  <option value="CSS">CSS</option>
                  <option value="PMS">PMS</option>
                  <option value="NTS">NTS</option>
                  <option value="FIA">FIA</option>
                  <option value="PERA">PERA</option>
                  <option value="General">General</option>
                </SelectField>
              </FieldWrapper>
            </div>

            <FieldWrapper id="pdf-tags" label="Additional Tags (Comma-separated)">
              <TextInput
                id="pdf-tags"
                value={tagsCsv}
                onChange={(e) => setTagsCsv(e.target.value)}
                placeholder="solved papers, maps, past mcqs"
              />
            </FieldWrapper>

            <FieldWrapper id="pdf-description" label="Description">
              <TextArea
                id="pdf-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes summary visible inside PDF Library before download..."
              />
            </FieldWrapper>

            <div className="rounded-[var(--dmc-radius-squircle)] border border-[var(--dmc-border-subtle)] bg-[var(--dmc-surface-ground)] p-3 space-y-2">
              <label className="flex items-start gap-2.5 text-xs font-semibold text-[var(--dmc-ink-primary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={watermarkConfirmed}
                  onChange={(e) => setWatermarkConfirmed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded accent-[var(--dmc-brand-forest)] shrink-0"
                />
                <span>
                  I confirm this PDF already contains the owner watermark before upload.
                </span>
              </label>
              {formErrors.watermarkConfirmed ? (
                <p role="alert" className="text-xs font-semibold text-[var(--dmc-status-error-ink)]">
                  {formErrors.watermarkConfirmed}
                </p>
              ) : null}

              <label className="flex items-center gap-2.5 text-xs font-semibold text-[var(--dmc-ink-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--dmc-brand-forest)]"
                />
                <span>Publish immediately to PDF Library</span>
              </label>
            </div>

            {isUploading ? (
              <div
                className="flex flex-col items-center justify-center gap-3.5 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-6"
                aria-live="polite"
              >
                {/* SVG circular progress ring matching the quiz runner ring */}
                <div
                  className="relative inline-flex items-center justify-center shrink-0"
                  style={{ width: 116, height: 116 }}
                  role="progressbar"
                  aria-valuenow={Math.max(0, Math.min(100, uploadProgress ?? 0))}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <svg
                    width={116}
                    height={116}
                    viewBox="0 0 116 116"
                    className="-rotate-90"
                    aria-hidden="true"
                  >
                    <circle
                      cx={58}
                      cy={58}
                      r={48}
                      fill="none"
                      stroke="var(--color-border)"
                      strokeWidth={9}
                    />
                    <circle
                      cx={58}
                      cy={58}
                      r={48}
                      fill="none"
                      stroke="var(--color-brand-deep, #0d4a28)"
                      strokeWidth={9}
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={
                        2 * Math.PI * 48 * (1 - Math.max(0, Math.min(100, uploadProgress ?? 0)) / 100)
                      }
                      strokeLinecap="round"
                      className="transition-[stroke-dashoffset] duration-200 ease-out motion-reduce:transition-none"
                    />
                  </svg>
                  <span className="absolute font-extrabold text-2xl tabular-nums text-[var(--color-ink)] tracking-tight select-none">
                    {Math.max(0, Math.min(100, uploadProgress ?? 0))}%
                  </span>
                </div>

                <div className="text-center space-y-1">
                  <div className="text-sm font-bold text-[var(--color-ink)]">
                    {uploadStage || 'Uploading PDF to Cloudflare R2...'}
                  </div>
                  <p className="text-xs text-[var(--color-ink-secondary)]">
                    Secure multipart transfer to private cloud storage
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1"
                isLoading={isUploading}
              >
                {isUploading ? 'Uploading to R2...' : 'Upload PDF to Private Bucket'}
              </Button>
              {isUploading ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => uploadAbortRef.current?.abort()}
                >
                  Cancel Upload
                </Button>
              ) : null}
            </div>
          </form>
        </aside>

        {/* Right: Managed PDFs & Analytics */}
        <div className="xl:col-span-7 space-y-6">
          {errorMsg ? (
            <div
              role="alert"
              className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-status-error-border)] rounded-[var(--dmc-radius-card)] p-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-[var(--color-danger-ink)] shrink-0" />
                <p className="text-xs text-[var(--color-ink-secondary)]">{errorMsg}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void fetchAll(page)}
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Retry</span>
              </Button>
            </div>
          ) : loading && !inventory ? (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-6 space-y-3">
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-full" />
            </div>
          ) : pdfs.length === 0 ? (
            <EmptyStateCard
              icon={FileText}
              title="No PDF resources uploaded yet"
              description="Upload your first watermarked booklet on the left to store it securely inside Cloudflare R2."
            />
          ) : (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] overflow-hidden shadow-xs">
              <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between gap-2">
                <h2 className="type-card-title text-[var(--color-ink)]">
                  Managed PDFs &amp; Access Metrics
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void fetchAll(page)}
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Refresh</span>
                </Button>
              </div>

              <div className="md:hidden px-4 py-2 text-[11px] font-medium text-[var(--color-ink-muted)] bg-[var(--color-surface-soft)] border-b border-[var(--color-border)]">
                Swipe horizontally to view all PDF columns and actions
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-soft)] border-b border-[var(--color-border)] text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                      <th scope="col" className="py-3 px-4">Title</th>
                      <th scope="col" className="py-3 px-4">Subject / Tag</th>
                      <th scope="col" className="py-3 px-4">Size</th>
                      <th scope="col" className="py-3 px-4">Downloads</th>
                      <th scope="col" className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {pdfs.map((pdf) => (
                      <tr
                        key={pdf.id}
                        className="hover:bg-[var(--color-surface-soft)]/70 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--color-ink)]">
                              {pdf.title}
                            </span>
                            {!pdf.is_published ? <Badge variant="neutral">Draft</Badge> : null}
                          </div>
                          <div className="text-[11px] text-[var(--color-ink-muted)] font-mono truncate max-w-[220px]">
                            {pdf.file_key}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[var(--color-ink-secondary)]">
                          {pdf.subject} - {pdf.exam_tag}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[var(--color-ink-secondary)] tabular-nums">
                          {formatBytes(pdf.file_size ?? (pdf as any).file_bytes ?? 0)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[var(--color-brand-deep)] tabular-nums">
                          {pdf.download_count}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => void handleTogglePublished(pdf)}
                              aria-label={pdf.is_published ? 'Hide PDF' : 'Publish PDF'}
                              className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] inline-flex items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)] cursor-pointer"
                            >
                              {pdf.is_published ? (
                                <Eye className="w-4 h-4 text-[var(--color-brand-deep)]" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(pdf)}
                              aria-label={`Edit ${pdf.title}`}
                              className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] inline-flex items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)] cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(pdf)}
                              aria-label={`Delete ${pdf.title}`}
                              className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] inline-flex items-center justify-center rounded-lg text-[var(--dmc-status-error-ink)] hover:bg-[var(--dmc-status-error-bg)] cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <PaginationBar
            page={page}
            totalPages={inventory?.pagination.totalPages ?? 1}
            totalItems={totalManaged}
            pageSize={pageSize}
            onPageChange={setPage}
            itemLabel="PDFs"
          />

          {/* Top Resources + Top User Downloaders */}
          {analytics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-4 elevation-1 space-y-3">
                <h3 className="text-sm font-bold text-[var(--dmc-ink-primary)]">
                  Most Downloaded Resources
                </h3>
                {analytics.mostDownloadedResources.length === 0 ? (
                  <p className="text-xs text-[var(--dmc-ink-muted)]">No downloads logged yet.</p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {analytics.mostDownloadedResources.slice(0, 5).map((item) => (
                      <li key={item.pdfId} className="flex items-center justify-between gap-2">
                        <span className="font-medium text-[var(--dmc-ink-primary)] truncate">
                          {item.title}
                        </span>
                        <Badge variant="feature">{item.downloadCount}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-4 elevation-1 space-y-3">
                <h3 className="text-sm font-bold text-[var(--dmc-ink-primary)]">
                  Downloads per User
                </h3>
                {analytics.downloadsPerUser.length === 0 ? (
                  <p className="text-xs text-[var(--dmc-ink-muted)]">
                    No user download activity logged yet.
                  </p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {analytics.downloadsPerUser.slice(0, 5).map((u) => (
                      <li key={u.userId} className="flex items-center justify-between gap-2">
                        <span className="font-medium text-[var(--dmc-ink-primary)] truncate">
                          {u.displayName || u.email || u.userId}
                        </span>
                        <Badge variant="neutral">{u.totalDownloads}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Edit Metadata Modal */}
      <Modal
        isOpen={Boolean(editingPdf)}
        onClose={() => setEditingPdf(null)}
        title="Edit PDF Metadata"
        className="max-w-lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-3.5">
          <FieldWrapper id="edit-pdf-title" label="Title" required>
            <TextInput
              id="edit-pdf-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </FieldWrapper>
          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper id="edit-pdf-subject" label="Subject" required>
              <TextInput
                id="edit-pdf-subject"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
              />
            </FieldWrapper>
            <FieldWrapper id="edit-pdf-exam" label="Exam Tag" required>
              <SelectField
                id="edit-pdf-exam"
                value={editExamTag}
                onChange={(e) => setEditExamTag(e.target.value)}
              >
                <option value="PPSC">PPSC</option>
                <option value="FPSC">FPSC</option>
                <option value="CSS">CSS</option>
                <option value="PMS">PMS</option>
                <option value="NTS">NTS</option>
                <option value="FIA">FIA</option>
                <option value="PERA">PERA</option>
                <option value="General">General</option>
              </SelectField>
            </FieldWrapper>
          </div>
          <FieldWrapper id="edit-pdf-desc" label="Description">
            <TextArea
              id="edit-pdf-desc"
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </FieldWrapper>
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--dmc-ink-primary)] cursor-pointer">
            <input
              type="checkbox"
              checked={editPublished}
              onChange={(e) => setEditPublished(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--dmc-brand-forest)]"
            />
            <span>Published in Library</span>
          </label>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--dmc-border-subtle)]">
            <Button type="button" variant="outline" onClick={() => setEditingPdf(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={savingEdit}>
              Save Metadata
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete PDF Resource?"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--dmc-ink-secondary)]">
            Are you sure you want to remove{' '}
            <strong className="text-[var(--dmc-ink-primary)]">{deleteTarget?.title}</strong> from
            the catalog?
          </p>
          <div className="flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={deleting}
              onClick={() => void handleDelete()}
            >
              Delete PDF
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
