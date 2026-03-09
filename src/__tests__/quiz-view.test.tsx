/**
 * Tests for QuizView component.
 * Validates quiz flow: start, questions, feedback, completion, retake.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { EnrichedWord } from "@/lib/analysis/types";
import type { VocabularyWord } from "@/lib/study/types";
import type { QuizQuestion } from "@/lib/study/types";

// Mock extractVocabulary
const mockExtractVocabulary = vi.fn<(words: EnrichedWord[]) => VocabularyWord[]>();
vi.mock("@/lib/study/vocabulary", () => ({
  extractVocabulary: (...args: Parameters<typeof mockExtractVocabulary>) =>
    mockExtractVocabulary(...args),
}));

// Mock generateQuiz
const mockGenerateQuiz = vi.fn<(vocab: VocabularyWord[], fallback?: string[]) => QuizQuestion[]>();
vi.mock("@/lib/study/quiz", () => ({
  generateQuiz: (...args: Parameters<typeof mockGenerateQuiz>) =>
    mockGenerateQuiz(...args),
}));

import { QuizView } from "@/app/components/QuizView";

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

const fiveWordVocab: VocabularyWord[] = [
  { original: "\u0927\u0930\u094D\u092E", iast: "dharma", stem: "dharma", wordType: "noun", linga: "pullinga", contextualMeaning: "duty", mwDefinition: "law" },
  { original: "\u0915\u094D\u0937\u0947\u0924\u094D\u0930", iast: "k\u1E63etra", stem: "k\u1E63etra", wordType: "noun", linga: "napumsakalinga", contextualMeaning: "field", mwDefinition: "field" },
  { original: "\u0915\u0941\u0930\u0941", iast: "kuru", stem: "k\u1E5B", wordType: "verb", linga: undefined, contextualMeaning: "do", mwDefinition: null },
  { original: "\u0905\u0930\u094D\u091C\u0941\u0928", iast: "arjuna", stem: "arjuna", wordType: "noun", linga: "pullinga", contextualMeaning: "Arjuna", mwDefinition: "white" },
  { original: "\u092F\u0941\u0926\u094D\u0927", iast: "yuddha", stem: "yuddha", wordType: "noun", linga: "napumsakalinga", contextualMeaning: "battle", mwDefinition: "war" },
];

const twoQuestions: QuizQuestion[] = [
  {
    word: { original: "\u0927\u0930\u094D\u092E", iast: "dharma" },
    correctAnswer: "duty",
    options: ["duty", "field", "do", "battle"],
  },
  {
    word: { original: "\u0915\u094D\u0937\u0947\u0924\u094D\u0930", iast: "k\u1E63etra" },
    correctAnswer: "field",
    options: ["duty", "field", "Arjuna", "battle"],
  },
];

const threeWordVocab = fiveWordVocab.slice(0, 3);

const _originalFetch = global.fetch;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  global.fetch = _originalFetch;
});

describe("QuizView", () => {
  it("renders 'Start Quiz' button when vocabulary >= 4", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    render(<QuizView words={[makeWord()]} />);
    expect(screen.getByRole("button", { name: /Start Quiz/i })).toBeInTheDocument();
  });

  it("shows loading state when vocabulary < 4 (fetching fallbacks)", () => {
    mockExtractVocabulary.mockReturnValue(threeWordVocab);
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<QuizView words={[makeWord()]} />);
    expect(screen.getByText(/Loading quiz/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Start Quiz/i })).not.toBeInTheDocument();
  });

  it("clicking Start shows first question with Devanagari and IAST", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));

    expect(screen.getByText("\u0927\u0930\u094D\u092E")).toBeInTheDocument();
    expect(screen.getByText("dharma")).toBeInTheDocument();
  });

  it("shows progress indicator (1/N)", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));

    expect(screen.getByText(/Question 1 of 2/i)).toBeInTheDocument();
  });

  it("selecting correct answer shows green feedback with 'Correct!'", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));
    // Click the correct answer "duty"
    fireEvent.click(screen.getByRole("button", { name: "duty" }));

    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("selecting wrong answer shows red feedback with 'Not quite' and correct answer", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));
    // Click a wrong answer "field"
    fireEvent.click(screen.getByRole("button", { name: "field" }));

    expect(screen.getByText(/Not quite/i)).toBeInTheDocument();
    expect(screen.getByText(/the answer is: duty/i)).toBeInTheDocument();
  });

  it("'Next' button advances to next question", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));
    // Answer first question
    fireEvent.click(screen.getByRole("button", { name: "duty" }));
    // Click Next
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Should now show question 2
    expect(screen.getByText(/Question 2 of 2/i)).toBeInTheDocument();
    expect(screen.getByText("\u0915\u094D\u0937\u0947\u0924\u094D\u0930")).toBeInTheDocument();
  });

  it("completion screen shows score and 'Retake Quiz' button", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));
    // Answer question 1 correctly
    fireEvent.click(screen.getByRole("button", { name: "duty" }));
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    // Answer question 2 correctly
    fireEvent.click(screen.getByRole("button", { name: "field" }));
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Should show completion
    expect(screen.getByText(/Quiz Complete/i)).toBeInTheDocument();
    expect(screen.getByText(/2\/2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retake Quiz/i })).toBeInTheDocument();
  });
});

describe("QuizView fallback distractors", () => {
  const fallbackResponse = {
    meanings: ["a river", "fire", "king", "wisdom", "battle", "virtue"],
  };

  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("fetches fallback distractors when vocabulary < 4", () => {
    mockExtractVocabulary.mockReturnValue(threeWordVocab);
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(fallbackResponse),
    });

    render(<QuizView words={[makeWord()]} />);

    expect(global.fetch).toHaveBeenCalledWith("/api/distractors?count=6");
  });

  it("shows loading state while fetching fallbacks", () => {
    mockExtractVocabulary.mockReturnValue(threeWordVocab);
    // Never-resolving promise to keep loading state
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

    render(<QuizView words={[makeWord()]} />);

    expect(screen.getByText(/Loading quiz/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Start Quiz/i })).not.toBeInTheDocument();
  });

  it("shows Start Quiz after fallbacks load", async () => {
    mockExtractVocabulary.mockReturnValue(threeWordVocab);
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(fallbackResponse),
    });

    render(<QuizView words={[makeWord()]} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Start Quiz/i })).toBeInTheDocument();
    });
  });

  it("passes fallbackMeanings to generateQuiz", async () => {
    mockExtractVocabulary.mockReturnValue(threeWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(fallbackResponse),
    });

    render(<QuizView words={[makeWord()]} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Start Quiz/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));

    expect(mockGenerateQuiz).toHaveBeenCalledWith(
      threeWordVocab,
      fallbackResponse.meanings
    );
  });

  it("shows disabled message when fetch fails", async () => {
    mockExtractVocabulary.mockReturnValue(threeWordVocab);
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<QuizView words={[makeWord()]} />);

    await waitFor(() => {
      expect(screen.getByText(/Need at least 4 words for quiz/i)).toBeInTheDocument();
    });
  });

  it("does not fetch when vocabulary >= 4", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    global.fetch = vi.fn();

    render(<QuizView words={[makeWord()]} />);

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
