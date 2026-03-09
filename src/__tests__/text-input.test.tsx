// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnalysisView } from "@/app/components/AnalysisView";

// Mock fetch globally
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

// Mock ImageUpload to avoid OCR dependencies in text input tests
vi.mock("@/app/components/ImageUpload", () => ({
  ImageUpload: () => <div data-testid="mock-image-upload" />,
}));

// Mock child components
vi.mock("@/app/components/WordBreakdown", () => ({
  WordBreakdown: () => <div data-testid="mock-word" />,
}));

vi.mock("@/app/components/VocabularyList", () => ({
  VocabularyList: () => <div data-testid="mock-vocab" />,
}));

vi.mock("@/app/components/QuizView", () => ({
  QuizView: () => <div data-testid="mock-quiz" />,
}));

// Mock transliteration module
vi.mock("@/lib/transliteration", () => ({
  devanagariToIast: (text: string) => {
    if (text === "\u0927\u0930\u094D\u092E") return "dharma";
    if (text === "\u0915\u094D\u0937\u0947\u0924\u094D\u0930\u0947") return "k\u1E63etre";
    return "mock-iast";
  },
}));

describe("AnalysisView IAST preview", () => {
  it("shows IAST transliteration preview when Devanagari text is entered", () => {
    render(<AnalysisView />);
    const textarea = screen.getByPlaceholderText("Enter Sanskrit text in Devanagari...");
    fireEvent.change(textarea, { target: { value: "\u0927\u0930\u094D\u092E" } });
    expect(screen.getByText("dharma")).toBeInTheDocument();
  });

  it("does not show IAST preview when textarea is empty", () => {
    render(<AnalysisView />);
    // No text entered, no transliterated text should appear
    expect(screen.queryByText("dharma")).not.toBeInTheDocument();
    expect(screen.queryByText("mock-iast")).not.toBeInTheDocument();
  });

  it("accepts Devanagari input and updates textarea value", () => {
    render(<AnalysisView />);
    const textarea = screen.getByPlaceholderText("Enter Sanskrit text in Devanagari...");
    fireEvent.change(textarea, { target: { value: "\u0915\u094D\u0937\u0947\u0924\u094D\u0930\u0947" } });
    expect((textarea as HTMLTextAreaElement).value).toBe("\u0915\u094D\u0937\u0947\u0924\u094D\u0930\u0947");
  });
});
