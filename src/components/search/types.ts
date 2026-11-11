import type { SearchEntityType, SearchHit } from '@/lib/search';

export interface SearchGroup {
  type: SearchEntityType;
  label: string;
  hits: SearchHit[];
}

export interface SearchExperienceProps {
  initialQuery: string;
  initialSerializedIndex?: string;
}

