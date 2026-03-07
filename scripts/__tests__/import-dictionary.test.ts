import { describe, it, expect } from "vitest";
import { parseEntryLine, createDatabase } from "../import-dictionary";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import os from "os";

describe("parseEntryLine", () => {
  it("parses a standard MW H1 entry line", () => {
    const line =
      '<H1><h><key1>aBi</key1><key2>aBi</key2></h><body><lex>ind.</lex> a prefix to verbs and nouns</body><tail><L>60</L><pc>1,1</pc></tail></H1>';
    const result = parseEntryLine(line);
    expect(result).not.toBeNull();
    expect(result!.key1).toBe("aBi");
    expect(result!.body).toContain("a prefix to verbs and nouns");
    expect(result!.lexInfo).toContain("ind.");
    expect(result!.lNumber).toBe("60");
    expect(result!.pageRef).toBe("1,1");
    expect(result!.hType).toBe("H1");
  });

  it("parses H2 entry type", () => {
    const line =
      '<H2><h><key1>aBi</key1><key2>aBi</key2></h><body><lex>m.</lex> some sub-entry definition</body><tail><L>61</L><pc>1,1</pc></tail></H2>';
    const result = parseEntryLine(line);
    expect(result).not.toBeNull();
    expect(result!.hType).toBe("H2");
  });

  it("parses H3 entry type", () => {
    const line =
      '<H3><h><key1>aBi</key1><key2>aBi</key2></h><body><lex>f.</lex> another definition</body><tail><L>62</L><pc>1,2</pc></tail></H3>';
    const result = parseEntryLine(line);
    expect(result).not.toBeNull();
    expect(result!.hType).toBe("H3");
  });

  it("parses entry with homonym number", () => {
    const line =
      '<H1><h><key1>a</key1><key2>a</key2><hom>1</hom></h><body><lex>ind.</lex> a negative prefix</body><tail><L>1</L><pc>1,1</pc></tail></H1>';
    const result = parseEntryLine(line);
    expect(result).not.toBeNull();
    expect(result!.homonym).toBe(1);
  });

  it("handles entry missing optional fields gracefully", () => {
    const line =
      '<H1><h><key1>aBi</key1><key2>aBi</key2></h><body>a prefix to verbs</body><tail><L>60</L><pc>1,1</pc></tail></H1>';
    const result = parseEntryLine(line);
    expect(result).not.toBeNull();
    expect(result!.homonym).toBeNull();
    expect(result!.lexInfo).toEqual([]);
  });

  it("converts SLP1 headword to IAST", () => {
    const line =
      '<H1><h><key1>aBi</key1><key2>aBi</key2></h><body><lex>ind.</lex> a prefix</body><tail><L>60</L><pc>1,1</pc></tail></H1>';
    const result = parseEntryLine(line);
    expect(result).not.toBeNull();
    expect(result!.headwordIast).toBe("abhi");
  });

  it("converts SLP1 headword to Devanagari", () => {
    const line =
      '<H1><h><key1>Darma</key1><key2>Darma</key2></h><body><lex>m.</lex> law</body><tail><L>100</L><pc>5,1</pc></tail></H1>';
    const result = parseEntryLine(line);
    expect(result).not.toBeNull();
    // SLP1 "Darma" -> Devanagari "धर्म" (D=dh, a=a, r=r, m=m, a=a)
    expect(result!.headwordDeva).toBeTruthy();
    expect(result!.headwordDeva.length).toBeGreaterThan(0);
  });

  it("returns null for non-entry lines", () => {
    expect(parseEntryLine("")).toBeNull();
    expect(parseEntryLine("some random text")).toBeNull();
    expect(parseEntryLine("<info>metadata</info>")).toBeNull();
  });
});

describe("createDatabase", () => {
  it("creates database with expected tables", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dict-test-"));
    const dbPath = path.join(tmpDir, "test.db");

    try {
      const db = createDatabase(dbPath);

      // Check entries table exists
      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )
        .all() as { name: string }[];
      const tableNames = tables.map((t) => t.name);

      expect(tableNames).toContain("entries");
      expect(tableNames).toContain("entries_fts");
      expect(tableNames).toContain("stem_index");

      // Check entries table has correct columns
      const columns = db.prepare("PRAGMA table_info(entries)").all() as {
        name: string;
      }[];
      const colNames = columns.map((c) => c.name);
      expect(colNames).toContain("id");
      expect(colNames).toContain("dictionary");
      expect(colNames).toContain("headword_slp1");
      expect(colNames).toContain("headword_deva");
      expect(colNames).toContain("headword_iast");
      expect(colNames).toContain("definition");

      db.close();
    } finally {
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      fs.rmdirSync(tmpDir);
    }
  });
});
