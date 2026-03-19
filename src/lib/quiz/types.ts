import type { State } from 'ts-fsrs';
import type { WordType, Linga } from '@/lib/analysis/types';

export interface VocabItem {
  id?: number;
  stem: string;           // Deduplicate key
  original: string;       // Devanagari form
  iast: string;           // IAST transliteration
  kaavyaId: number;       // Source kaavya
  // Dictionary meanings (QUIZ-09: never conjured)
  mwDefinitions: string[];
  apteDefinitions: string[];
  // Grammar facts (QUIZ-03)
  wordType: WordType;
  vibhakti?: string;
  dhatu?: string;
  gana?: number;
  linga?: Linga;
  // FSRS card state (QUIZ-06)
  due: string;            // ISO date string
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: State;           // New=0, Learning=1, Review=2, Relearning=3
  lastReview?: string;    // ISO date string
  // Timestamps
  addedAt: string;
}

export interface ReviewLog {
  id?: number;
  vocabItemId: number;
  rating: number;         // Rating enum: Again=1, Hard=2, Good=3, Easy=4
  state: State;           // State before review
  reviewedAt: string;     // ISO date string
}

export interface QuizQuestion {
  vocabItemId: number;
  word: { original: string; iast: string };
  grammarFacts: {
    wordType: WordType;
    vibhakti?: string;
    dhatu?: string;
    gana?: number;
    linga?: Linga;
  };
  correctAnswer: string;   // From MW/Apte
  options: string[];       // 4 options total
  allMeanings: string[];   // All MW/Apte meanings shown after answer
}

export interface MasteryStats {
  total: number;
  newCount: number;
  learning: number;
  review: number;
  mastered: number;
  dueNow: number;
}
