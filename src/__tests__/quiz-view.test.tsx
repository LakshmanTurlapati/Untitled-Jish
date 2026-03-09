/**
 * Tests for QuizView component.
 * Validates gamified quiz flow: start, tap-to-auto-check, hearts, XP,
 * streaks, encouragement, completion, practice again, fallback distractors.
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

const threeQuestions: QuizQuestion[] = [
  ...twoQuestions,
  {
    word: { original: "\u0915\u0941\u0930\u0941", iast: "kuru" },
    correctAnswer: "do",
    options: ["duty", "field", "do", "battle"],
  },
];

const threeWordVocab = fiveWordVocab.slice(0, 3);

const _originalFetch = global.fetch;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(Math, "random").mockReturnValue(0); // deterministic encouragement
});

afterEach(() => {
  global.fetch = _originalFetch;
  vi.restoreAllMocks();
});

describe("QuizView", () => {
  it("renders 'Start Quiz' button when vocabulary >= 4", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    render(<QuizView words={[makeWord()]} />);
    expect(screen.getByRole("button", { name: /Start Quiz/i })).toBeInTheDocument();
  });

  it("clicking Start shows first question with Devanagari and IAST", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));

    expect(screen.getByText("\u0927\u0930\u094D\u092E")).toBeInTheDocument();
    expect(screen.getByText("dharma")).toBeInTheDocument();
  });

  it("shows progress indicator (Question 1 of N)", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));

    expect(screen.getByText(/Question 1 of 2/i)).toBeInTheDocument();
  });

  it("displays 3 hearts at quiz start", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));

    const filledHearts = screen.getAllByTestId("heart-filled");
    expect(filledHearts).toHaveLength(3);
  });

  it("tapping an option auto-checks and shows feedback immediately", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));
    // Tap correct answer — should auto-check
    fireEvent.click(screen.getByRole("button", { name: "duty" }));

    // Feedback appears immediately (no Check button needed)
    expect(screen.getByText("Sadhu! (Well done!)")).toBeInTheDocument();
    // No Check button should exist
    expect(screen.queryByRole("button", { name: /Check/i })).not.toBeInTheDocument();
  });

  it("tapping wrong answer shows 'The answer is'", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));
    fireEvent.click(screen.getByRole("button", { name: "field" }));

    expect(screen.getByText(/The answer is: duty/i)).toBeInTheDocument();
  });

  it("wrong answer decreases hearts by 1", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));
    fireEvent.click(screen.getByRole("button", { name: "field" }));

    const filledHearts = screen.getAllByTestId("heart-filled");
    expect(filledHearts).toHaveLength(2);
  });

  it("correct answer awards 10 XP", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));
    fireEvent.click(screen.getByRole("button", { name: "duty" }));

    expect(screen.getByText("10 XP")).toBeInTheDocument();
  });

  it("Continue button advances to next question", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));
    fireEvent.click(screen.getByRole("button", { name: "duty" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    expect(screen.getByText(/Question 2 of 2/i)).toBeInTheDocument();
    expect(screen.getByText("\u0915\u094D\u0937\u0947\u0924\u094D\u0930")).toBeInTheDocument();
  });

  it("completion screen shows score, XP, hearts, and Quiz Complete!", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));
    // Q1 correct
    fireEvent.click(screen.getByRole("button", { name: "duty" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    // Q2 correct
    fireEvent.click(screen.getByRole("button", { name: "field" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    expect(screen.getByText(/Quiz Complete/i)).toBeInTheDocument();
    expect(screen.getByText("2/2")).toBeInTheDocument();
    expect(screen.getByText("+20 XP")).toBeInTheDocument();
    expect(screen.getByTestId("hearts")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Practice Again/i })).toBeInTheDocument();
  });

  it("Practice Again restarts quiz", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));
    // Q1
    fireEvent.click(screen.getByRole("button", { name: "duty" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    // Q2
    fireEvent.click(screen.getByRole("button", { name: "field" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    fireEvent.click(screen.getByRole("button", { name: /Practice Again/i }));

    expect(screen.getByText(/Question 1 of 2/i)).toBeInTheDocument();
  });

  it("hearts never go below 0 and quiz continues", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(threeQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));

    // Q1 wrong
    fireEvent.click(screen.getByRole("button", { name: "field" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    // Q2 wrong
    fireEvent.click(screen.getByRole("button", { name: "duty" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    // Q3 wrong
    fireEvent.click(screen.getByRole("button", { name: "field" }));

    const filledHearts = screen.queryAllByTestId("heart-filled");
    expect(filledHearts).toHaveLength(0);
    expect(screen.getByRole("button", { name: /Continue/i })).toBeInTheDocument();
  });

  it("streak counter shows message at 3 consecutive correct", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(threeQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));

    // Q1 correct
    fireEvent.click(screen.getByRole("button", { name: "duty" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    // Q2 correct
    fireEvent.click(screen.getByRole("button", { name: "field" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    // Q3 correct (streak = 3)
    fireEvent.click(screen.getByRole("button", { name: "do" }));

    expect(screen.getByText(/On fire! 3x streak!/i)).toBeInTheDocument();
  });

  it("XP shows total on completion screen", () => {
    mockExtractVocabulary.mockReturnValue(fiveWordVocab);
    mockGenerateQuiz.mockReturnValue(twoQuestions);
    render(<QuizView words={[makeWord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Start Quiz/i }));
    // Q1 correct (+10)
    fireEvent.click(screen.getByRole("button", { name: "duty" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    // Q2 wrong (+0)
    fireEvent.click(screen.getByRole("button", { name: "duty" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    expect(screen.getByText("+10 XP")).toBeInTheDocument();
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
    vi.spyOn(Math, "random").mockReturnValue(0);
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
