/**
 * Tests for VocabularyList component.
 * Validates collapsible word list with Devanagari, IAST, word type tags, and meanings.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { EnrichedWord } from "@/lib/analysis/types";
import type { VocabularyWord } from "@/lib/study/types";

// Mock extractVocabulary
const mockExtractVocabulary = vi.fn<(words: EnrichedWord[]) => VocabularyWord[]>();
vi.mock("@/lib/study/vocabulary", () => ({
  extractVocabulary: (...args: Parameters<typeof mockExtractVocabulary>) =>
    mockExtractVocabulary(...args),
}));

import { VocabularyList } from "@/app/components/VocabularyList";

/** Helper to create a minimal EnrichedWord */
function makeWord(overrides: Partial<EnrichedWord> = {}): EnrichedWord {
  return {
    original: "\u0927\u0930\u094D\u092E\u0903",
    iast: "dharma\u1E25",
    sandhi: { sandhi_type: "none" },
    morphology: {
      stem: "dharma",
      word_type: "noun",
      vibhakti: "pratham\u0101",
      vacana: "ekavacana",
      linga: "pullinga",
    },
    contextual_meaning: "righteousness, duty",
    inria_validated: true,
    inria_grammar: "mas nom sg",
    mw_definitions: ["law, duty, righteousness"],
    apte_definitions: [],
    meaning_source: "both",
    ...overrides,
  };
}

const mockVocab: VocabularyWord[] = [
  {
    original: "\u0927\u0930\u094D\u092E\u0903",
    iast: "dharma\u1E25",
    stem: "dharma",
    wordType: "noun",
    linga: "pullinga",
    contextualMeaning: "righteousness, duty",
    mwDefinition: "law, duty",
  },
  {
    original: "\u0915\u094D\u0937\u0947\u0924\u094D\u0930\u0947",
    iast: "k\u1E63etre",
    stem: "k\u1E63etra",
    wordType: "noun",
    linga: "napumsakalinga",
    contextualMeaning: "field, domain",
    mwDefinition: "field",
  },
  {
    original: "\u0915\u0941\u0930\u094D\u0935\u0924",
    iast: "kurvata",
    stem: "k\u1E5B",
    wordType: "verb",
    linga: undefined,
    contextualMeaning: "do, perform",
    mwDefinition: null,
  },
];

describe("VocabularyList", () => {
  it("renders 'View Vocabulary (N words)' button with correct count", () => {
    mockExtractVocabulary.mockReturnValue(mockVocab);
    render(<VocabularyList words={[makeWord()]} />);
    expect(
      screen.getByRole("button", { name: /View Vocabulary \(3 words\)/i })
    ).toBeInTheDocument();
  });

  it("word list is hidden by default", () => {
    mockExtractVocabulary.mockReturnValue(mockVocab);
    render(<VocabularyList words={[makeWord()]} />);
    // The word meanings should not be visible until expanded
    expect(screen.queryByText("righteousness, duty")).not.toBeInTheDocument();
  });

  it("clicking button reveals word cards", () => {
    mockExtractVocabulary.mockReturnValue(mockVocab);
    render(<VocabularyList words={[makeWord()]} />);

    fireEvent.click(
      screen.getByRole("button", { name: /View Vocabulary/i })
    );

    expect(screen.getByText("righteousness, duty")).toBeInTheDocument();
    expect(screen.getByText("field, domain")).toBeInTheDocument();
  });

  it("each card shows Devanagari, IAST, meaning, and word type tag", () => {
    mockExtractVocabulary.mockReturnValue(mockVocab);
    render(<VocabularyList words={[makeWord()]} />);

    fireEvent.click(
      screen.getByRole("button", { name: /View Vocabulary/i })
    );

    // Devanagari
    expect(screen.getByText("\u0927\u0930\u094D\u092E\u0903")).toBeInTheDocument();
    // IAST
    expect(screen.getByText("dharma\u1E25")).toBeInTheDocument();
    // Word type tag with linga: [noun, m.]
    expect(screen.getByText("[noun, m.]")).toBeInTheDocument();
    // Neuter: [noun, n.]
    expect(screen.getByText("[noun, n.]")).toBeInTheDocument();
    // Verb with no linga: [verb]
    expect(screen.getByText("[verb]")).toBeInTheDocument();
    // Meaning
    expect(screen.getByText("righteousness, duty")).toBeInTheDocument();
  });

  it("does not render when vocabulary is empty", () => {
    mockExtractVocabulary.mockReturnValue([]);
    const { container } = render(<VocabularyList words={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
