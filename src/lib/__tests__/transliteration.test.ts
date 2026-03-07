import { describe, it, expect } from "vitest";
import {
  devanagariToIast,
  iastToDevanagari,
  slp1ToIast,
  slp1ToDevanagari,
} from "@/lib/transliteration";

describe("devanagariToIast", () => {
  it("converts namaste", () => {
    expect(devanagariToIast("नमस्ते")).toBe("namaste");
  });

  it("converts dharma", () => {
    expect(devanagariToIast("धर्म")).toBe("dharma");
  });

  it("converts sanskrtam with diacritics", () => {
    expect(devanagariToIast("संस्कृतम्")).toBe("sa\u1E43sk\u1E5Btam");
  });

  it("handles single characters", () => {
    expect(devanagariToIast("अ")).toBe("a");
  });

  it("handles text with spaces", () => {
    expect(devanagariToIast("नमस्ते धर्म")).toBe("namaste dharma");
  });

  it("returns empty string for empty input", () => {
    expect(devanagariToIast("")).toBe("");
  });
});

describe("iastToDevanagari", () => {
  it("converts namaste", () => {
    expect(iastToDevanagari("namaste")).toBe("नमस्ते");
  });

  it("converts dharma", () => {
    expect(iastToDevanagari("dharma")).toBe("धर्म");
  });

  it("returns empty string for empty input", () => {
    expect(iastToDevanagari("")).toBe("");
  });
});

describe("round-trip fidelity", () => {
  it("Devanagari -> IAST -> Devanagari preserves text", () => {
    const original = "नमस्ते";
    const roundTripped = iastToDevanagari(devanagariToIast(original));
    expect(roundTripped).toBe(original);
  });

  it("round-trips dharma", () => {
    const original = "धर्म";
    const roundTripped = iastToDevanagari(devanagariToIast(original));
    expect(roundTripped).toBe(original);
  });
});

describe("slp1ToIast", () => {
  it("converts SLP1 Darma to IAST dharma", () => {
    expect(slp1ToIast("Darma")).toBe("dharma");
  });

  it("returns empty string for empty input", () => {
    expect(slp1ToIast("")).toBe("");
  });
});

describe("slp1ToDevanagari", () => {
  it("converts SLP1 Darma to Devanagari", () => {
    expect(slp1ToDevanagari("Darma")).toBe("धर्म");
  });

  it("returns empty string for empty input", () => {
    expect(slp1ToDevanagari("")).toBe("");
  });
});
