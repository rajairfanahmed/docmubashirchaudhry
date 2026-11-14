import type { Metadata } from 'next';
import React from 'react';
import { AdminParticipationClient } from '@/components/admin/AdminParticipationClient';

export const metadata: Metadata = {
  title: 'Quiz Participation & Scores | Admin Console',
  robots: { index: false, follow: false }
};

export default function AdminParticipationPage() {
  return <AdminParticipationClient />;
}
