/**
 * Tests for WordBreakdown and MeaningBadge components.
 * Validates rendering of analysis properties, morphology badges,
 * and meaning source distinction (MEAN-04).
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { WordBreakdown } from "@/app/components/WordBreakdown";
import { MeaningBadge } from "@/app/components/MeaningBadge";
import type { EnrichedWord } from "@/lib/analysis/types";

/** Helper to create a minimal EnrichedWord for testing */
function makeWord(overrides: Partial<EnrichedWord> = {}): EnrichedWord {
  return {
    original: "धर्मः",
    iast: "dharmaḥ",
    sandhi: { sandhi_type: "none" },
    morphology: {
      stem: "dharma",
      word_type: "noun",
      vibhakti: "prathamā",
      vacana: "ekavacana",
      linga: "pullinga",
    },
    contextual_meaning: "righteousness, duty",
    inria_validated: true,
    inria_grammar: "mas nom sg",
    mw_definitions: ["law, duty, righteousness"],
    apte_definitions: ["virtue, moral merit"],
    meaning_source: "both",
    ...overrides,
  };
}

describe("MeaningBadge", () => {
  it("renders 'MW Dictionary' with green styling for mw source", () => {
    render(<MeaningBadge source="mw" />);
    const badge = screen.getByText("MW Dictionary");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/green/);
  });

  it("renders 'Apte Dictionary' with blue styling for apte source", () => {
    render(<MeaningBadge source="apte" />);
    const badge = screen.getByText("Apte Dictionary");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/blue/);
  });

  it("renders 'AI Interpretation' with amber styling for ai source", () => {
    render(<MeaningBadge source="ai" />);
    const badge = screen.getByText("AI Interpretation");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/amber/);
  });
});

describe("WordBreakdown", () => {
  it("renders Devanagari text and IAST transliteration", () => {
    render(<WordBreakdown word={makeWord()} />);
    expect(screen.getByText("धर्मः")).toBeInTheDocument();
    expect(screen.getByText("dharmaḥ")).toBeInTheDocument();
  });

  it("renders morphology badges for vibhakti, vacana, linga", () => {
    render(<WordBreakdown word={makeWord()} />);
    expect(screen.getByText("prathamā")).toBeInTheDocument();
    expect(screen.getByText("ekavacana")).toBeInTheDocument();
    expect(screen.getByText("pullinga")).toBeInTheDocument();
  });

  it("renders MW definition with 'MW Dictionary' badge when mw_definitions present", () => {
    render(<WordBreakdown word={makeWord()} />);
    expect(screen.getByText("MW Dictionary")).toBeInTheDocument();
    expect(screen.getByText("law, duty, righteousness")).toBeInTheDocument();
  });

  it("renders Apte definition with 'Apte Dictionary' badge when apte_definitions present", () => {
    render(<WordBreakdown word={makeWord()} />);
    expect(screen.getByText("Apte Dictionary")).toBeInTheDocument();
    expect(screen.getByText("virtue, moral merit")).toBeInTheDocument();
  });

  it("renders AI interpretation with 'AI Interpretation' badge", () => {
    render(<WordBreakdown word={makeWord()} />);
    expect(screen.getByText("AI Interpretation")).toBeInTheDocument();
    expect(screen.getByText("righteousness, duty")).toBeInTheDocument();
  });

  it("does NOT render MW badge when mw_definitions is empty", () => {
    render(<WordBreakdown word={makeWord({ mw_definitions: [] })} />);
    expect(screen.queryByText("MW Dictionary")).not.toBeInTheDocument();
  });

  it("renders samasa info for compound words", () => {
    const compoundWord = makeWord({
      original: "धर्मक्षेत्रे",
      iast: "dharmakṣetre",
      samasa: {
        compound: "dharmakṣetra",
        is_compound: true,
        samasa_type: "tatpurusha",
        components: [
          { word: "धर्म", iast: "dharma", meaning: "duty", role: "modifier" },
          { word: "क्षेत्र", iast: "kṣetra", meaning: "field", role: "head" },
        ],
      },
    });
    render(<WordBreakdown word={compoundWord} />);
    expect(screen.getByText(/tatpurusha/i)).toBeInTheDocument();
    // "dharma" appears both as stem badge and as samasa component
    const dharmaElements = screen.getAllByText("dharma");
    expect(dharmaElements.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("kṣetra")).toBeInTheDocument();
  });

  it("renders verb-specific morphology (dhatu, gana, lakara)", () => {
    const verbWord = makeWord({
      original: "कुर्वत",
      iast: "kurvata",
      morphology: {
        stem: "kṛ",
        word_type: "verb",
        dhatu: "kṛ",
        gana: 8,
        lakara: "laṭ",
        purusha: "prathama",
        vacana: "bahuvacana",
      },
    });
    render(<WordBreakdown word={verbWord} />);
    // stem and dhatu both "kṛ" so multiple matches expected
    const kṛElements = screen.getAllByText("kṛ");
    expect(kṛElements.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("laṭ")).toBeInTheDocument();
  });

  it("shows INRIA validated indicator when inria_validated is true", () => {
    render(<WordBreakdown word={makeWord({ inria_validated: true })} />);
    expect(screen.getByText(/verified/i)).toBeInTheDocument();
  });
});
