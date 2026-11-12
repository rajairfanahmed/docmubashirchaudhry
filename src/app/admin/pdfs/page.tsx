import React from 'react';
import { AdminPdfsClient } from '@/components/admin/AdminPdfsClient';

export default function AdminPdfsPage() {
  return (
    <section aria-labelledby="admin-pdfs-heading" className="space-y-6 max-w-7xl">
      <div className="space-y-1">
        <span className="type-label-micro text-[var(--dmc-brand-forest)]">
          Private R2 Storage &amp; Access Logs
        </span>
        <h1 id="admin-pdfs-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
          PDF Upload &amp; Download Analytics
        </h1>
        <p className="type-body-sm text-[var(--dmc-ink-secondary)]">
          Upload owner-watermarked PDFs directly into the private Cloudflare R2 bucket and inspect
          per-resource and per-user signed download activity.
        </p>
      </div>

      <AdminPdfsClient />
    </section>
  );
}
