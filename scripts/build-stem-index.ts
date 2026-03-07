/**
 * INRIA Morphological Data Importer for Stem Index
 *
 * Parses SL_morph.xml from INRIA Sanskrit Heritage project and populates
 * the stem_index table with inflected form -> stem mappings.
 *
 * XML format:
 *   <f form="inflected_slp1">
 *     <na><case/><number/><gender/></na>
 *     <s stem="stem_slp1"/>
 *   </f>
 *
 * Run with: npx tsx scripts/build-stem-index.ts
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import {
  slp1ToDevanagari,
  slp1ToIast,
} from "../src/lib/transliteration";

interface StemEntry {
  inflected_slp1: string;
  stem_slp1: string;
  grammar_info: string;
}

/**
 * Parse grammar info from <na> elements.
 * E.g., <na><acc/><sg/><mas/></na> -> "acc.sg.m"
 */
function parseGrammarInfo(naContent: string): string {
  const parts: string[] = [];

  // Case
  const caseMap: Record<string, string> = {
    nom: "nom",
    acc: "acc",
    ins: "ins",
    dat: "dat",
    abl: "abl",
    gen: "gen",
    loc: "loc",
    voc: "voc",
  };
  for (const [tag, label] of Object.entries(caseMap)) {
    if (naContent.includes(`<${tag}/>`)) {
      parts.push(label);
      break;
    }
  }

  // Number
  if (naContent.includes("<sg/>")) parts.push("sg");
  else if (naContent.includes("<du/>")) parts.push("du");
  else if (naContent.includes("<pl/>")) parts.push("pl");

  // Gender
  if (naContent.includes("<mas/>")) parts.push("m");
  else if (naContent.includes("<fem/>")) parts.push("f");
  else if (naContent.includes("<neu/>")) parts.push("n");

  return parts.join(".") || "unknown";
}

/**
 * Parse the INRIA SL_morph.xml file and extract stem entries.
 * Uses streaming regex parsing rather than XML parser (file is large but structured).
 */
function parseInriaFile(filePath: string): StemEntry[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const entries: StemEntry[] = [];

  // Match each <f form="...">...</f> block
  const formRegex = /<f form="([^"]+)">([\s\S]*?)<\/f>/g;
  let match;

  while ((match = formRegex.exec(content)) !== null) {
    const inflected_slp1 = match[1];
    const body = match[2];

    // Extract stem
    const stemMatch = body.match(/<s stem="([^"]+)"\s*\/>/);
    if (!stemMatch) continue;

    // Clean stem (remove homonym markers like #2)
    const stem_slp1 = stemMatch[1].replace(/#\d+$/, "");

    // Extract grammar info from all <na> blocks
    const naRegex = /<na>([\s\S]*?)<\/na>/g;
    let naMatch;
    const grammarInfos: string[] = [];

    while ((naMatch = naRegex.exec(body)) !== null) {
      grammarInfos.push(parseGrammarInfo(naMatch[1]));
    }

    // Deduplicate grammar info for same inflected+stem pair
    const uniqueGrammars = [...new Set(grammarInfos)];

    for (const grammar_info of uniqueGrammars) {
      entries.push({
        inflected_slp1,
        stem_slp1,
        grammar_info,
      });
    }
  }

  return entries;
}

// Main execution
const isMainModule =
  process.argv[1]?.endsWith("build-stem-index.ts") ||
  process.argv[1]?.endsWith("build-stem-index");

if (isMainModule) {
  const projectRoot = path.resolve(__dirname, "..");
  const dbPath = path.join(projectRoot, "data", "sanskrit.db");
  const inriaPath = path.join(projectRoot, "data", "cdsl", "SL_morph.xml");

  if (!fs.existsSync(dbPath)) {
    console.error("Database not found. Run 'npm run import-dict' first.");
    process.exit(1);
  }

  if (!fs.existsSync(inriaPath)) {
    console.error("INRIA data not found. Run 'bash scripts/setup-data.sh' first.");
    process.exit(1);
  }

  console.log("Opening database...");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  // Clear existing stem index
  db.exec("DELETE FROM stem_index");

  console.log("Parsing INRIA morphological data...");
  const entries = parseInriaFile(inriaPath);
  console.log(`Parsed ${entries.length} stem mappings.`);

  console.log("Importing into stem_index table...");
  const insert = db.prepare(`
    INSERT OR IGNORE INTO stem_index
      (inflected_form_slp1, inflected_form_iast, inflected_form_deva,
       stem_slp1, stem_iast, stem_deva, grammar_info)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const batchSize = 10000;
  let count = 0;

  const insertBatch = db.transaction((batch: StemEntry[]) => {
    for (const entry of batch) {
      let inflected_iast: string;
      let inflected_deva: string;
      let stem_iast: string;
      let stem_deva: string;

      try {
        inflected_iast = slp1ToIast(entry.inflected_slp1);
        inflected_deva = slp1ToDevanagari(entry.inflected_slp1);
        stem_iast = slp1ToIast(entry.stem_slp1);
        stem_deva = slp1ToDevanagari(entry.stem_slp1);
      } catch {
        continue; // Skip entries that fail transliteration
      }

      insert.run(
        entry.inflected_slp1,
        inflected_iast,
        inflected_deva,
        entry.stem_slp1,
        stem_iast,
        stem_deva,
        entry.grammar_info
      );
      count++;
    }
  });

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    insertBatch(batch);
    if (count > 0 && count % 100000 < batchSize) {
      console.log(`  ${count} entries imported...`);
    }
  }

  console.log(`\n=== Stem Index Complete ===`);
  console.log(`Total entries imported: ${count}`);

  const totalInDb = (
    db.prepare("SELECT COUNT(*) as count FROM stem_index").get() as {
      count: number;
    }
  ).count;
  console.log(`Total entries in database: ${totalInDb}`);

  db.close();
}
