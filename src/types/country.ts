export interface Country {
  code: string;
  name: string;
  officialName: string;
  capital: string;
  allCapitals: string[];
  currency: string;
  currencies: Record<string, { name: string; symbol?: string }>;
  language: string;
  allLanguages: string[];
  region: string;
  subregion: string;
  flagSvg: string;
  flagEmoji: string;
}

export type ScopeType = 'all' | 'letter' | 'region';

export interface ScopeFilter {
  type: ScopeType;
  value: string;
}

export type SubQuestionType = 'capital' | 'currency' | 'language';

export interface QuizAnswerRecord {
  countryCode: string;
  subQuestion: SubQuestionType;
  selectedOption: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface QuizState {
  activeScope: ScopeFilter;
  infoPage: number;
  currentCountryIndex: number;
  currentSubQuestion: SubQuestionType;
  score: number;
  totalAttempted: number;
  answersLog: QuizAnswerRecord[];
  isCompleted: boolean;
}

