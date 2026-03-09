/**
 * Tests for AnalysisView bottom nav navigation,
 * sticky bar gating, and progress checkmark colors.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Mock child components to isolate AnalysisView behavior
vi.mock("@/app/components/WordBreakdown", () => ({
  WordBreakdown: ({ word }: { word: unknown }) => (
    <div data-testid="word-breakdown">word</div>
  ),
}));

vi.mock("@/app/components/ImageUpload", () => ({
  ImageUpload: ({ onTextExtracted }: { onTextExtracted: (t: string) => void }) => (
    <div data-testid="image-upload" />
  ),
}));

vi.mock("@/app/components/VocabularyList", () => ({
  VocabularyList: ({ words }: { words: unknown }) => (
    <div data-testid="vocabulary-list">vocabulary</div>
  ),
}));

vi.mock("@/app/components/QuizView", () => ({
  QuizView: ({ words, onBackToText }: { words: unknown; onBackToText: () => void }) => (
    <div data-testid="quiz-view">quiz</div>
  ),
}));

vi.mock("@/lib/transliteration", () => ({
  devanagariToIast: (text: string) => text,
}));

import { AnalysisView } from "@/app/components/AnalysisView";

const mockAnalysisResponse = {
  words: [
    {
      original: "dharma",
      iast: "dharma",
      stem: "dharma",
      sandhi: { sandhi_type: "none" },
      morphology: {
        stem: "dharma",
        word_type: "noun",
        vibhakti: "pratham\u0101",
        vacana: "ekavacana",
        linga: "pullinga",
      },
      contextual_meaning: "righteousness",
      inria_validated: true,
      inria_grammar: "mas nom sg",
      mw_definitions: ["virtue"],
      apte_definitions: [],
      meaning_source: "both",
    },
  ],
};

/** Helper: get nav buttons from the bottom nav bar */
function getNavButtons() {
  const nav = document.querySelector('nav[aria-label="Main navigation"]')!;
  const buttons = nav.querySelectorAll("button");
  return {
    analyzeNav: buttons[0],
    wordsNav: buttons[1],
    quizNav: buttons[2],
  };
}

/** Helper: get the sticky bar submit button */
function getSubmitButton() {
  // The sticky analyze button is in a .fixed.bottom-16 container (above nav)
  const stickyBar = document.querySelector(".fixed.bottom-16");
  return stickyBar?.querySelector("button") ?? null;
}

/** Helper: type text and submit via sticky bar */
async function typeAndSubmit(text: string) {
  const textarea = screen.getByPlaceholderText("Enter Sanskrit text in Devanagari...");
  fireEvent.change(textarea, { target: { value: text } });
  const submitBtn = getSubmitButton()!;
  fireEvent.click(submitBtn);
}

beforeEach(() => {
  vi.useFakeTimers();
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("AnalysisView bottom navigation", () => {
  it("renders bottom nav with Analyze, Words, and Quiz buttons", () => {
    render(<AnalysisView />);
    const { analyzeNav, wordsNav, quizNav } = getNavButtons();
    expect(analyzeNav).toBeInTheDocument();
    expect(wordsNav).toBeInTheDocument();
    expect(quizNav).toBeInTheDocument();
  });

  it("shows analyze page by default with input card visible", () => {
    render(<AnalysisView />);
    expect(screen.getByPlaceholderText("Enter Sanskrit text in Devanagari...")).toBeInTheDocument();
  });

  it("clicking Words nav shows empty state when no results", () => {
    render(<AnalysisView />);
    const { wordsNav } = getNavButtons();
    fireEvent.click(wordsNav);
    expect(screen.getByText("No vocabulary yet")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter Sanskrit text in Devanagari...")).not.toBeInTheDocument();
  });

  it("clicking Words nav shows vocabulary after analysis", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalysisResponse,
    });

    render(<AnalysisView />);
    await typeAndSubmit("dharma");

    await vi.waitFor(() => {
      expect(screen.queryByTestId("word-breakdown")).toBeInTheDocument();
    });

    const { wordsNav } = getNavButtons();
    fireEvent.click(wordsNav);
    expect(screen.getByTestId("vocabulary-list")).toBeInTheDocument();
  });

  it("sticky analyze button only shows on analyze page", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalysisResponse,
    });

    render(<AnalysisView />);

    // Sticky button visible on analyze page
    expect(getSubmitButton()).toBeInTheDocument();

    await typeAndSubmit("dharma");
    await vi.waitFor(() => {
      expect(screen.queryByTestId("word-breakdown")).toBeInTheDocument();
    });

    // Switch to Words page
    const { wordsNav } = getNavButtons();
    fireEvent.click(wordsNav);

    // Sticky button should be gone
    expect(getSubmitButton()).toBeNull();
  });

  it("switching pages preserves analysis state", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalysisResponse,
    });

    render(<AnalysisView />);
    await typeAndSubmit("dharma");

    await vi.waitFor(() => {
      expect(screen.queryByTestId("word-breakdown")).toBeInTheDocument();
    });

    // Go to Words then back to Analyze
    const { wordsNav, analyzeNav } = getNavButtons();
    fireEvent.click(wordsNav);
    fireEvent.click(analyzeNav);

    // Input and results should still be there
    const textarea = screen.getByPlaceholderText("Enter Sanskrit text in Devanagari...") as HTMLTextAreaElement;
    expect(textarea.value).toBe("dharma");
    expect(screen.getByTestId("word-breakdown")).toBeInTheDocument();
  });

  it("progress step checkmarks use accent color (bg-accent-600), not green", () => {
    render(<AnalysisView />);

    const textarea = screen.getByPlaceholderText("Enter Sanskrit text in Devanagari...");
    fireEvent.change(textarea, { target: { value: "dharma" } });

    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise(() => {}) // never resolves, keeps loading
    );

    const submitBtn = getSubmitButton()!;
    fireEvent.click(submitBtn);

    // Advance timers to complete steps
    vi.advanceTimersByTime(4000);

    // Check for accent color checkmarks
    const checkmarks = document.querySelectorAll(".bg-accent-600");
    expect(checkmarks.length).toBeGreaterThan(0);

    // Ensure no green checkmarks
    const greenCheckmarks = document.querySelectorAll(".bg-green-500");
    expect(greenCheckmarks.length).toBe(0);
  });
});
