/**
 * Type contracts for study features: vocabulary extraction and quiz generation.
 */

import type { WordType, Linga } from "@/lib/analysis/types";

/** A vocabulary word extracted from analysis results */
export interface VocabularyWord {
  original: string;
  iast: string;
  stem: string;
  wordType: WordType;
  linga: Linga | undefined;
  contextualMeaning: string;
  mwDefinition: string | null;
}

/** A single quiz question (MCQ with 4 options) */
export interface QuizQuestion {
  word: { original: string; iast: string };
  correctAnswer: string;
  options: string[];
}

/** Quiz lifecycle phases */
export type QuizPhase = "ready" | "active" | "answered" | "complete";

/** Full quiz state for UI */
export interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  phase: QuizPhase;
  selectedAnswer: string | null;
  score: number;
}
