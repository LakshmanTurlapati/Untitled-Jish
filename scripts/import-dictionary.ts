/**
 * CDSL Dictionary Parser and SQLite Importer
 *
 * Parses Monier-Williams (MW) and Apte (AP90) dictionary data from
 * the Cologne Digital Sanskrit Lexicon (CDSL) format and imports
 * into an SQLite database with FTS5 full-text search.
 *
 * CDSL format (v02):
 * - Entries start with `<L>` header line containing L-number, pc, k1, k2, optional h (homonym), e
 * - Body lines follow until `<LEND>`
 * - MW uses `<s>text</s>` for Sanskrit in SLP1
 * - AP90 uses `{#text#}` for Sanskrit in SLP1
 * - `<lex>` tags contain grammatical info
 * - `<etym>` tags contain etymology
 *
 * Run with: npx tsx scripts/import-dictionary.ts
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import {
  slp1ToDevanagari,
  slp1ToIast,
} from "../src/lib/transliteration";
import type { DictionaryName } from "../src/lib/dictionary/schema";

/** Parsed CDSL entry */
export interface CdslEntry {
  hType: string;
  key1: string;
  key2: string;
  homonym: number | null;
  body: string;
  lexInfo: string[];
  lNumber: string;
  pageRef: string;
  headwordIast: string;
  headwordDeva: string;
}

/**
 * Parse a single CDSL entry line (the old H1/H2-style format).
 * Kept for backward compatibility with tests that use XML-style input.
 * For actual CDSL v02 parsing, use parseEntries() which handles multi-line format.
 */
export function parseEntryLine(line: string): CdslEntry | null {
  if (!line || line.length < 5) return null;

  // Try old XML-style format (H1/H2 tags) used in tests
  const hMatch = line.match(/^<(H[1-4][A-E]?|HPW)>/);
  if (hMatch) {
    return parseXmlStyleEntry(line, hMatch[1]);
  }

  return null;
}

function parseXmlStyleEntry(line: string, hType: string): CdslEntry | null {
  const key1Match = line.match(/<key1>([^<]*)<\/key1>/);
  const key2Match = line.match(/<key2>([^<]*)<\/key2>/);
  const homMatch = line.match(/<hom>(\d+)<\/hom>/);
  const bodyMatch = line.match(/<body>([\s\S]*?)<\/body>/);
  const bodyContent = bodyMatch?.[1] || "";
  const lexMatches = [...bodyContent.matchAll(/<lex>([^<]*)<\/lex>/g)];
  const lexInfo = lexMatches.map((m) => m[1]);
  const lMatch = line.match(/<L>([^<]*)<\/L>/);
  const pcMatch = line.match(/<pc>([^<]*)<\/pc>/);

  const key1 = key1Match?.[1] || "";
  if (!key1) return null;

  let headwordIast: string;
  let headwordDeva: string;
  try {
    headwordIast = slp1ToIast(key1);
    headwordDeva = slp1ToDevanagari(key1);
  } catch {
    headwordIast = key1;
    headwordDeva = key1;
  }

  return {
    hType,
    key1,
    key2: key2Match?.[1] || key1,
    homonym: homMatch ? parseInt(homMatch[1]) : null,
    body: bodyContent,
    lexInfo,
    lNumber: lMatch?.[1] || "",
    pageRef: pcMatch?.[1] || "",
    headwordIast,
    headwordDeva,
  };
}

/**
 * Parse the actual CDSL v02 multi-line format.
 * Each entry starts with `<L>...` header and ends with `<LEND>`.
 *
 * Header format: <L>number<pc>page<k1>key1<k2>key2[<h>homonym]<e>entry_type
 */
function parseCdslEntries(
  content: string,
  dictName: DictionaryName
): CdslEntry[] {
  const entries: CdslEntry[] = [];
  const lines = content.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Look for entry header: <L>...
    if (!line.startsWith("<L>")) {
      i++;
      continue;
    }

    // Parse header line
    const lMatch = line.match(/<L>([^<]*)/);
    const pcMatch = line.match(/<pc>([^<]*)/);
    const k1Match = line.match(/<k1>([^<]*)/);
    const k2Match = line.match(/<k2>([^<]*)/);
    const hMatch = line.match(/<h>(\d+)/);
    const eMatch = line.match(/<e>(\w+)/);

    const key1 = k1Match?.[1] || "";
    if (!key1) {
      i++;
      continue;
    }

    // Collect body lines until <LEND>
    const bodyLines: string[] = [];
    i++;
    while (i < lines.length && lines[i] !== "<LEND>") {
      bodyLines.push(lines[i]);
      i++;
    }
    // Skip <LEND>
    if (i < lines.length) i++;

    const bodyText = bodyLines.join(" ").trim();
    if (!bodyText) continue;

    // Extract lex info from body
    const lexMatches = [...bodyText.matchAll(/<lex>([^<]*)<\/lex>/g)];
    const lexInfo = lexMatches.map((m) => m[1]);

    // Also check for <info lex="..."/> format
    const infoLexMatch = bodyText.match(/<info\s+lex="([^"]*)"\s*\/>/);
    if (infoLexMatch && lexInfo.length === 0) {
      // Parse "m:f:n" style into separate lex entries
      lexInfo.push(...infoLexMatch[1].split(":").map((s) => s.trim() + "."));
    }

    // Determine hType from the <e> value
    let hType = "H1";
    const eVal = eMatch?.[1] || "";
    if (eVal.endsWith("A")) hType = "H1A";
    else if (eVal === "2") hType = "H2";
    else if (eVal === "3") hType = "H3";
    else if (eVal === "4") hType = "H4";

    let headwordIast: string;
    let headwordDeva: string;
    try {
      headwordIast = slp1ToIast(key1);
      headwordDeva = slp1ToDevanagari(key1);
    } catch {
      headwordIast = key1;
      headwordDeva = key1;
    }

    entries.push({
      hType,
      key1,
      key2: k2Match?.[1] || key1,
      homonym: hMatch ? parseInt(hMatch[1]) : null,
      body: bodyText,
      lexInfo,
      lNumber: lMatch?.[1] || "",
      pageRef: pcMatch?.[1] || "",
      headwordIast,
      headwordDeva,
    });
  }

  return entries;
}

/**
 * Clean definition text by stripping internal markup tags but preserving readable text.
 */
function cleanDefinition(body: string, dictName: DictionaryName): string {
  if (!body) return "";
  let text = body;

  // Remove homonym markers
  text = text.replace(/<hom>\d+\.<\/hom>\s*/g, "");

  if (dictName === "mw") {
    // Convert <s>SLP1</s> Sanskrit text to IAST
    text = text.replace(/<s>([^<]*)<\/s>/g, (_match, inner) => {
      try {
        return slp1ToIast(inner);
      } catch {
        return inner;
      }
    });
  } else {
    // AP90: Convert {#SLP1#} Sanskrit text to IAST
    text = text.replace(/\{#([^#]*)#\}/g, (_match, inner) => {
      try {
        return slp1ToIast(inner);
      } catch {
        return inner;
      }
    });
  }

  // Remove lex tags (stored separately)
  text = text.replace(/<lex>[^<]*<\/lex>/g, "");
  // Remove info tags
  text = text.replace(/<info[^>]*\/>/g, "");
  // Remove <s1>named entities</s1> but keep text
  text = text.replace(/<\/?s1>/g, "");
  // Remove <ls>references</ls> but keep text
  text = text.replace(/<\/?ls>/g, "");
  // Remove <ab>abbreviations</ab> but keep text
  text = text.replace(/<\/?ab>/g, "");
  // Remove <lang>language</lang> but keep text
  text = text.replace(/<\/?lang>/g, "");
  // Remove <etym>etymology</etym> but keep text
  text = text.replace(/<\/?etym>/g, "");
  // Remove <gk>greek</gk> but keep text
  text = text.replace(/<\/?gk>/g, "");
  // Remove <lbinfo.../> tags
  text = text.replace(/<lbinfo[^>]*\/>/g, "");
  // Remove {@N@} style markers (AP90 sense numbers)
  text = text.replace(/\{@\d+@\}/g, "");
  // Remove {@ @} markers but keep text
  text = text.replace(/\{@([^@]*)@\}/g, "$1");
  // Remove remaining XML-like tags
  text = text.replace(/<[^>]+>/g, "");
  // Remove the word separator bar
  text = text.replace(/\s*¦\s*/, " ");
  // Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Extract etymology text from body.
 */
function extractEtymology(body: string): string | null {
  const etymMatch = body.match(/<etym>([^<]*)<\/etym>/);
  if (!etymMatch) return null;
  return etymMatch[1].trim() || null;
}

/**
 * Create the SQLite database with all required tables and indexes.
 */
export function createDatabase(dbPath: string): Database.Database {
  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  db.exec(`
    -- Core dictionary entries
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dictionary TEXT NOT NULL,
      headword_slp1 TEXT NOT NULL,
      headword_deva TEXT NOT NULL,
      headword_iast TEXT NOT NULL,
      homonym INTEGER DEFAULT 0,
      grammar TEXT,
      definition TEXT NOT NULL,
      etymology TEXT,
      raw_body TEXT,
      page_ref TEXT,
      l_number TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_entries_headword_iast ON entries(headword_iast);
    CREATE INDEX IF NOT EXISTS idx_entries_headword_deva ON entries(headword_deva);
    CREATE INDEX IF NOT EXISTS idx_entries_dictionary ON entries(dictionary);
    CREATE INDEX IF NOT EXISTS idx_entries_headword_slp1 ON entries(headword_slp1);

    -- Full-text search index
    CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
      headword_iast,
      headword_deva,
      definition,
      content=entries,
      content_rowid=id
    );

    -- Inflection-to-stem reverse index
    CREATE TABLE IF NOT EXISTS stem_index (
      inflected_form_slp1 TEXT NOT NULL,
      inflected_form_iast TEXT NOT NULL,
      inflected_form_deva TEXT NOT NULL,
      stem_slp1 TEXT NOT NULL,
      stem_iast TEXT NOT NULL,
      stem_deva TEXT NOT NULL,
      grammar_info TEXT,
      PRIMARY KEY (inflected_form_slp1, stem_slp1, grammar_info)
    );

    CREATE INDEX IF NOT EXISTS idx_stem_iast ON stem_index(inflected_form_iast);
    CREATE INDEX IF NOT EXISTS idx_stem_deva ON stem_index(inflected_form_deva);
  `);

  return db;
}

/**
 * Import a CDSL dictionary file into the database.
 */
export function importDictionary(
  db: Database.Database,
  filePath: string,
  dictName: DictionaryName
): number {
  const content = fs.readFileSync(filePath, "utf-8");
  const entries = parseCdslEntries(content, dictName);

  const insert = db.prepare(`
    INSERT INTO entries (dictionary, headword_slp1, headword_deva, headword_iast,
      homonym, grammar, definition, etymology, raw_body, page_ref, l_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  const batchSize = 5000;

  const insertBatch = db.transaction((batch: CdslEntry[]) => {
    for (const entry of batch) {
      const definition = cleanDefinition(entry.body, dictName);
      if (!definition) continue;

      const etymology = extractEtymology(entry.body);
      const grammar =
        entry.lexInfo.length > 0 ? entry.lexInfo.join(", ") : null;

      insert.run(
        dictName,
        entry.key1,
        entry.headwordDeva,
        entry.headwordIast,
        entry.homonym ?? 0,
        grammar,
        definition,
        etymology,
        entry.body,
        entry.pageRef || null,
        entry.lNumber || null
      );
      count++;
    }
  });

  // Process in batches
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    insertBatch(batch);
    if (count > 0 && count % 50000 < batchSize) {
      console.log(`  ${dictName}: ${count} entries imported...`);
    }
  }

  return count;
}

/**
 * Rebuild the FTS5 index after all imports.
 */
function rebuildFtsIndex(db: Database.Database): void {
  console.log("Rebuilding FTS5 index...");
  db.exec(`
    INSERT INTO entries_fts(entries_fts) VALUES('rebuild');
  `);
  console.log("FTS5 index rebuilt.");
}

// Main execution (only when run directly)
const isMainModule =
  process.argv[1]?.endsWith("import-dictionary.ts") ||
  process.argv[1]?.endsWith("import-dictionary");

if (isMainModule) {
  const projectRoot = path.resolve(__dirname, "..");
  const dbPath = path.join(projectRoot, "data", "sanskrit.db");
  const mwPath = path.join(projectRoot, "data", "cdsl", "mw.txt");
  const ap90Path = path.join(projectRoot, "data", "cdsl", "ap90.txt");

  // Remove existing database
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log("Removed existing database.");
  }

  console.log("Creating database...");
  const db = createDatabase(dbPath);

  // Import MW
  if (fs.existsSync(mwPath)) {
    console.log("\nImporting Monier-Williams dictionary...");
    const mwCount = importDictionary(db, mwPath, "mw");
    console.log(`MW import complete: ${mwCount} entries`);
  } else {
    console.error(`MW file not found: ${mwPath}`);
    console.error("Run 'bash scripts/setup-data.sh' first.");
    process.exit(1);
  }

  // Import AP90
  if (fs.existsSync(ap90Path)) {
    console.log("\nImporting Apte (AP90) dictionary...");
    const ap90Count = importDictionary(db, ap90Path, "ap90");
    console.log(`AP90 import complete: ${ap90Count} entries`);
  } else {
    console.warn(`AP90 file not found: ${ap90Path} -- skipping.`);
  }

  // Rebuild FTS index
  rebuildFtsIndex(db);

  // Log final counts
  const mwTotal = (
    db
      .prepare(
        "SELECT COUNT(*) as count FROM entries WHERE dictionary = 'mw'"
      )
      .get() as { count: number }
  ).count;
  const ap90Total = (
    db
      .prepare(
        "SELECT COUNT(*) as count FROM entries WHERE dictionary = 'ap90'"
      )
      .get() as { count: number }
  ).count;
  console.log(`\n=== Import Complete ===`);
  console.log(`MW entries:   ${mwTotal}`);
  console.log(`AP90 entries: ${ap90Total}`);
  console.log(`Total:        ${mwTotal + ap90Total}`);
  console.log(`Database:     ${dbPath}`);

  db.close();
}
