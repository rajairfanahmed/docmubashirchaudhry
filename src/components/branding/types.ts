export interface CommissionBrandBadgeProps {
  examCodeOrSlug: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  priority?: boolean;
  className?: string;
}

export interface SubjectIconChipProps {
  subjectId: string;
  label?: string;
  size?: 'sm' | 'md';
  iconOnly?: boolean;
  inheritColor?: boolean;
  className?: string;
}

