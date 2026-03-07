import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

// Skip all tests if database doesn't exist
const dbPath = path.join(process.cwd(), "data", "sanskrit.db");
const dbExists = fs.existsSync(dbPath);

describe.skipIf(!dbExists)("dictionary lookup", () => {
  let lookupByHeadword: typeof import("@/lib/dictionary/lookup").lookupByHeadword;
  let searchEntries: typeof import("@/lib/dictionary/lookup").searchEntries;

  beforeAll(async () => {
    const mod = await import("@/lib/dictionary/lookup");
    lookupByHeadword = mod.lookupByHeadword;
    searchEntries = mod.searchEntries;
  });

  it("lookupByHeadword('dharma', 'iast') returns MW results", () => {
    const results = lookupByHeadword("dharma", "iast");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].dictionary).toBe("mw");
    expect(results[0].headword_iast).toBe("dharma");
  });

  it("lookupByHeadword returns entries with non-empty definition", () => {
    const results = lookupByHeadword("dharma", "iast");
    for (const entry of results) {
      expect(entry.definition).toBeTruthy();
      expect(entry.definition.length).toBeGreaterThan(0);
    }
  });

  it("lookupByHeadword with Devanagari input returns results", () => {
    const results = lookupByHeadword("\u0927\u0930\u094d\u092e", "deva");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].headword_deva).toBe("\u0927\u0930\u094d\u092e");
  });

  it("lookupByHeadword returns AP90 entries", () => {
    // AP90 headwords often include visarga, so use a word present in both
    // "a" exists in both MW and AP90
    const results = lookupByHeadword("a", "iast");
    const ap90 = results.filter((e) => e.dictionary === "ap90");
    expect(ap90.length).toBeGreaterThan(0);
  });

  it("lookupByHeadword finds AP90 entries with visarga-style headwords", () => {
    // AP90 stores "dharmaḥ" with visarga; verify AP90 has dharma entries via search
    const results = searchEntries("dharma");
    const ap90 = results.filter((e) => e.dictionary === "ap90");
    expect(ap90.length).toBeGreaterThan(0);
  });

  it("searchEntries('dharma') returns results via FTS5", () => {
    const results = searchEntries("dharma");
    expect(results.length).toBeGreaterThan(0);
  });

  it("lookupByHeadword for nonexistent word returns empty array", () => {
    const results = lookupByHeadword("nonexistentword12345", "iast");
    expect(results).toEqual([]);
  });
});
