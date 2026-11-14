export interface ExamFilterItem {
  slug: string;
  label: string;
  href: string;
}

export const EXAM_FILTERS: ExamFilterItem[] = [
  { slug: 'all', label: 'All Exams', href: '/library' },
  { slug: 'ppsc', label: 'PPSC', href: '/library/ppsc' },
  { slug: 'fpsc', label: 'FPSC', href: '/library/fpsc' },
  { slug: 'css', label: 'CSS', href: '/library/css' },
  { slug: 'pms', label: 'PMS', href: '/library/pms' },
  { slug: 'nts', label: 'NTS', href: '/library/nts' },
  { slug: 'fia', label: 'FIA', href: '/library/fia' },
  { slug: 'pera', label: 'PERA', href: '/library/pera' },
  { slug: 'general', label: 'General', href: '/library/general' }
];
