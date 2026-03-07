/**
 * Dictionary query functions for headword lookup, stem resolution, and full-text search.
 */

import { getDb } from "./db";
import type { DictionaryEntry, StemIndexEntry } from "./schema";

type Script = "iast" | "deva" | "slp1";

/**
 * Map script identifier to the appropriate headword column name.
 */
function headwordColumn(script: Script): string {
  switch (script) {
    case "iast":
      return "headword_iast";
    case "deva":
      return "headword_deva";
    case "slp1":
      return "headword_slp1";
  }
}

/**
 * Map script identifier to the appropriate stem index column name.
 */
function inflectedColumn(script: Script): string {
  switch (script) {
    case "iast":
      return "inflected_form_iast";
    case "deva":
      return "inflected_form_deva";
    case "slp1":
      return "inflected_form_slp1";
  }
}

/**
 * Look up dictionary entries by exact headword match.
 * Returns results from both MW and AP90, ordered with MW first.
 */
export function lookupByHeadword(
  headword: string,
  script: Script
): DictionaryEntry[] {
  const db = getDb();
  const col = headwordColumn(script);

  const stmt = db.prepare(`
    SELECT id, dictionary, headword_slp1, headword_deva, headword_iast,
           homonym, grammar, definition, etymology, raw_body, page_ref, l_number
    FROM entries
    WHERE ${col} = ?
    ORDER BY dictionary ASC, homonym ASC, id ASC
  `);

  return stmt.all(headword) as DictionaryEntry[];
}

/**
 * Look up dictionary entries by resolving inflected forms to stems.
 * First queries the stem index, then looks up each resolved stem.
 */
export function lookupByStem(
  inflectedForm: string,
  script: Script
): { stems: StemIndexEntry[]; entries: DictionaryEntry[] } {
  const db = getDb();
  const col = inflectedColumn(script);

  const stemStmt = db.prepare(`
    SELECT inflected_form_slp1, inflected_form_iast, inflected_form_deva,
           stem_slp1, stem_iast, stem_deva, grammar_info
    FROM stem_index
    WHERE ${col} = ?
  `);

  const stems = stemStmt.all(inflectedForm) as StemIndexEntry[];

  if (stems.length === 0) {
    return { stems: [], entries: [] };
  }

  // Collect unique stem headwords and look up each
  const uniqueStems = [...new Set(stems.map((s) => s.stem_iast))];
  const entries: DictionaryEntry[] = [];

  for (const stem of uniqueStems) {
    const stemEntries = lookupByHeadword(stem, "iast");
    entries.push(...stemEntries);
  }

  return { stems, entries };
}

/**
 * Full-text search across headwords and definitions using FTS5.
 */
export function searchEntries(
  query: string,
  limit: number = 20
): DictionaryEntry[] {
  const db = getDb();

  // Escape FTS5 special characters and add prefix matching
  const sanitized = query.replace(/['"]/g, "").trim();
  if (!sanitized) return [];

  const stmt = db.prepare(`
    SELECT e.id, e.dictionary, e.headword_slp1, e.headword_deva, e.headword_iast,
           e.homonym, e.grammar, e.definition, e.etymology, e.raw_body, e.page_ref, e.l_number
    FROM entries_fts fts
    JOIN entries e ON e.id = fts.rowid
    WHERE entries_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `);

  try {
    return stmt.all(sanitized, limit) as DictionaryEntry[];
  } catch {
    // If FTS query fails (e.g., invalid syntax), fall back to LIKE
    const fallback = db.prepare(`
      SELECT id, dictionary, headword_slp1, headword_deva, headword_iast,
             homonym, grammar, definition, etymology, raw_body, page_ref, l_number
      FROM entries
      WHERE headword_iast LIKE ? OR definition LIKE ?
      ORDER BY dictionary ASC
      LIMIT ?
    `);
    const pattern = `%${sanitized}%`;
    return fallback.all(pattern, pattern, limit) as DictionaryEntry[];
  }
}
