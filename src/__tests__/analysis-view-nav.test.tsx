/**
 * Tests for AnalysisView top-level tab navigation,
 * sticky bar gating, and progress checkmark colors.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

/** Helper: get the page-level tab buttons (first set of Analyze/Study buttons) */
function getPageTabs() {
  // The page tabs are the first set of buttons; the sticky bar button is inside .fixed.bottom-0
  const analyzeButtons = screen.getAllByRole("button", { name: "Analyze" });
  // First "Analyze" button is the page tab, second (if present) is sticky bar submit
  const analyzeTab = analyzeButtons[0];
  const studyTab = screen.getByRole("button", { name: "Study" });
  return { analyzeTab, studyTab };
}

/** Helper: get the sticky bar submit button */
function getSubmitButton() {
  const stickyBar = document.querySelector(".fixed.bottom-0");
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

describe("AnalysisView top-level tab navigation", () => {
  it("renders Analyze and Study tab buttons", () => {
    render(<AnalysisView />);
    const { analyzeTab, studyTab } = getPageTabs();
    expect(analyzeTab).toBeInTheDocument();
    expect(studyTab).toBeInTheDocument();
  });

  it("Study tab is disabled when no analysis results exist", () => {
    render(<AnalysisView />);
    const { studyTab } = getPageTabs();
    expect(studyTab).toBeDisabled();
  });

  it("Study tab becomes enabled after analysis results arrive", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalysisResponse,
    });

    render(<AnalysisView />);
    await typeAndSubmit("dharma");

    await vi.waitFor(() => {
      const { studyTab } = getPageTabs();
      expect(studyTab).not.toBeDisabled();
    });
  });

  it("clicking Study tab shows vocabulary/quiz content and hides input card", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalysisResponse,
    });

    render(<AnalysisView />);
    await typeAndSubmit("dharma");

    await vi.waitFor(() => {
      const { studyTab } = getPageTabs();
      expect(studyTab).not.toBeDisabled();
    });

    const { studyTab } = getPageTabs();
    fireEvent.click(studyTab);

    // Input card (textarea) should not be visible
    expect(screen.queryByPlaceholderText("Enter Sanskrit text in Devanagari...")).not.toBeInTheDocument();

    // Vocabulary sub-content should be present (default study sub-tab)
    expect(screen.getByTestId("vocabulary-list")).toBeInTheDocument();
  });

  it("sticky bottom bar renders when on Analyze tab", () => {
    render(<AnalysisView />);
    const stickyBar = document.querySelector(".fixed.bottom-0");
    expect(stickyBar).toBeInTheDocument();
  });

  it("sticky bottom bar does NOT render when on Study tab", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalysisResponse,
    });

    render(<AnalysisView />);
    await typeAndSubmit("dharma");

    await vi.waitFor(() => {
      const { studyTab } = getPageTabs();
      expect(studyTab).not.toBeDisabled();
    });

    const { studyTab } = getPageTabs();
    fireEvent.click(studyTab);

    const stickyBar = document.querySelector(".fixed.bottom-0");
    expect(stickyBar).not.toBeInTheDocument();
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
