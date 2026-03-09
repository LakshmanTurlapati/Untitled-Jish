/**
 * Shared TypeScript types for the Sanskrit analysis pipeline.
 * These types define the contracts between LLM output, INRIA validation,
 * and the UI display layer.
 */

/** Type of sandhi junction between words */
export type SandhiType = "vowel" | "consonant" | "visarga" | "none";

/** Sandhi information for a word boundary */
export interface SandhiInfo {
  sandhi_type: SandhiType;
  sandhi_rule?: string;
}

/** Grammatical number (vacana) */
export type Vacana = "ekavacana" | "dvivacana" | "bahuvacana";

/** Grammatical gender (linga) */
export type Linga = "pullinga" | "strilinga" | "napumsakalinga";

/** Word type classification */
export type WordType =
  | "noun"
  | "verb"
  | "adjective"
  | "indeclinable"
  | "participle"
  | "pronoun";

/** Morphological analysis of a single word */
export interface MorphologyInfo {
  stem: string;
  word_type: WordType;
  /** Case (vibhakti) for nominals */
  vibhakti?: string;
  /** Number for nominals and verbs */
  vacana?: Vacana;
  /** Gender for nominals */
  linga?: Linga;
  /** Verbal root for verb forms */
  dhatu?: string;
  /** Verb class 1-10 */
  gana?: number;
  /** Tense/mood (lakara) for verb forms */
  lakara?: string;
  /** Person (purusha) for verb forms */
  purusha?: string;
}

/** Compound type classification */
export type SamasaType =
  | "tatpurusha"
  | "dvandva"
  | "bahuvrihi"
  | "avyayibhava"
  | "karmadharaya"
  | "dvigu"
  | "none";

/** Component of a compound word */
export interface SamasaComponent {
  word: string;
  iast: string;
  meaning: string;
  role: string;
}

/** Compound (samasa) decomposition information */
export interface SamasaInfo {
  compound: string;
  is_compound: boolean;
  samasa_type?: SamasaType;
  components?: SamasaComponent[];
}

/** A single analyzed word with all grammatical information */
export interface AnalyzedWord {
  original: string;
  iast: string;
  sandhi: SandhiInfo;
  morphology: MorphologyInfo;
  samasa?: SamasaInfo;
  contextual_meaning: string;
  inria_validated: boolean;
  inria_grammar: string | null;
}

/** Complete analysis result for a Sanskrit text */
export interface AnalysisResult {
  input_text: string;
  words: AnalyzedWord[];
  raw_llm_output: unknown;
}

/** Source of a word's meaning */
export type MeaningSource = "dictionary" | "ai" | "both";

/** AnalyzedWord enriched with dictionary definitions */
export interface EnrichedWord extends AnalyzedWord {
  mw_definitions: string[];
  apte_definitions: string[];
  meaning_source: MeaningSource;
}
