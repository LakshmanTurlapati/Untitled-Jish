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
        vibhakti: "prathamā",
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
    expect(screen.getByRole("button", { name: "Analyze" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Study" })).toBeInTheDocument();
  });

  it("Study tab is disabled when no analysis results exist", () => {
    render(<AnalysisView />);
    const studyTab = screen.getByRole("button", { name: "Study" });
    expect(studyTab).toBeDisabled();
  });

  it("Study tab becomes enabled after analysis results arrive", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalysisResponse,
    });

    render(<AnalysisView />);

    // Type text and submit
    const textarea = screen.getByPlaceholderText("Enter Sanskrit text in Devanagari...");
    fireEvent.change(textarea, { target: { value: "dharma" } });

    // Find the sticky bar Analyze button (the submit one, not the tab)
    const submitButton = screen.getByRole("button", { name: "Analyze" });
    // There should be both a tab and a submit button - we need the submit action
    // The sticky bar button triggers handleSubmit
    fireEvent.click(submitButton);

    await vi.waitFor(() => {
      const studyTab = screen.getByRole("button", { name: "Study" });
      expect(studyTab).not.toBeDisabled();
    });
  });

  it("clicking Study tab shows vocabulary/quiz content and hides input card", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalysisResponse,
    });

    render(<AnalysisView />);

    const textarea = screen.getByPlaceholderText("Enter Sanskrit text in Devanagari...");
    fireEvent.change(textarea, { target: { value: "dharma" } });
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: "Study" })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Study" }));

    // Input card (textarea) should not be visible
    expect(screen.queryByPlaceholderText("Enter Sanskrit text in Devanagari...")).not.toBeInTheDocument();

    // Vocabulary or quiz sub-content should be present
    expect(
      screen.getByTestId("vocabulary-list") || screen.getByTestId("quiz-view")
    ).toBeInTheDocument();
  });

  it("sticky bottom bar renders when on Analyze tab", () => {
    render(<AnalysisView />);
    // The sticky bar contains the submit button in a fixed-bottom container
    const stickyBar = document.querySelector(".fixed.bottom-0");
    expect(stickyBar).toBeInTheDocument();
  });

  it("sticky bottom bar does NOT render when on Study tab", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalysisResponse,
    });

    render(<AnalysisView />);

    const textarea = screen.getByPlaceholderText("Enter Sanskrit text in Devanagari...");
    fireEvent.change(textarea, { target: { value: "dharma" } });
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: "Study" })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Study" }));

    const stickyBar = document.querySelector(".fixed.bottom-0");
    expect(stickyBar).not.toBeInTheDocument();
  });

  it("progress step checkmarks use accent color (bg-accent-600), not green", () => {
    render(<AnalysisView />);

    // Type text to enable submit
    const textarea = screen.getByPlaceholderText("Enter Sanskrit text in Devanagari...");
    fireEvent.change(textarea, { target: { value: "dharma" } });

    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise(() => {}) // never resolves, keeps loading
    );

    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

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
