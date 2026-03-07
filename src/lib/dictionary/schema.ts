/**
 * TypeScript types for dictionary entries and stem index.
 * These types mirror the SQLite schema used in data/sanskrit.db.
 */

/** Supported dictionary sources */
export type DictionaryName = "mw" | "ap90";

/** A single dictionary entry from MW or AP90 */
export interface DictionaryEntry {
  id: number;
  dictionary: DictionaryName;
  headword_slp1: string;
  headword_deva: string;
  headword_iast: string;
  homonym: number;
  grammar: string | null;
  definition: string;
  etymology: string | null;
  raw_body: string | null;
  page_ref: string | null;
  l_number: string | null;
}

/** An inflection-to-stem mapping from the INRIA morphological data */
export interface StemIndexEntry {
  inflected_form_slp1: string;
  inflected_form_iast: string;
  inflected_form_deva: string;
  stem_slp1: string;
  stem_iast: string;
  stem_deva: string;
  grammar_info: string | null;
}
