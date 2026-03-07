import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

// Skip all tests if database doesn't exist
const dbPath = path.join(process.cwd(), "data", "sanskrit.db");
const dbExists = fs.existsSync(dbPath);

// Check if stem index is populated
let stemPopulated = false;
if (dbExists) {
  try {
    const Database = require("better-sqlite3");
    const db = new Database(dbPath, { readonly: true });
    const row = db.prepare("SELECT COUNT(*) as count FROM stem_index").get() as { count: number };
    stemPopulated = row.count > 0;
    db.close();
  } catch {
    stemPopulated = false;
  }
}

describe.skipIf(!dbExists || !stemPopulated)("stem index lookup", () => {
  let lookupByStem: typeof import("@/lib/dictionary/lookup").lookupByStem;

  beforeAll(async () => {
    const mod = await import("@/lib/dictionary/lookup");
    lookupByStem = mod.lookupByStem;
  });

  it("lookupByStem with known inflected form resolves to correct stem", () => {
    const result = lookupByStem("dharmasya", "iast");
    expect(result.stems.length).toBeGreaterThan(0);
    // dharmasya should resolve to dharma
    const hasDharma = result.stems.some(
      (s) => s.stem_iast === "dharma"
    );
    expect(hasDharma).toBe(true);
  });

  it("lookupByStem returns grammar_info", () => {
    const result = lookupByStem("dharmasya", "iast");
    expect(result.stems.length).toBeGreaterThan(0);
    expect(result.stems[0].grammar_info).toBeTruthy();
  });

  it("lookupByStem with unknown inflected form returns empty", () => {
    const result = lookupByStem("nonexistentword12345", "iast");
    expect(result.stems).toEqual([]);
    expect(result.entries).toEqual([]);
  });
});
