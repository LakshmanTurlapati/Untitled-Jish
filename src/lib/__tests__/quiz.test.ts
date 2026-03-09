import { describe, it, expect } from "vitest";
import { generateQuiz, pickRandom } from "@/lib/study/quiz";
import type { VocabularyWord } from "@/lib/study/types";

/** Helper to create mock VocabularyWord */
function mockVocab(iast: string, meaning: string): VocabularyWord {
  return {
    original: iast,
    iast,
    stem: iast,
    wordType: "noun",
    linga: "pullinga",
    contextualMeaning: meaning,
    mwDefinition: `MW: ${meaning}`,
  };
}

const vocab5: VocabularyWord[] = [
  mockVocab("dharma", "righteousness"),
  mockVocab("yoga", "discipline"),
  mockVocab("karma", "action"),
  mockVocab("moksha", "liberation"),
  mockVocab("bhakti", "devotion"),
];

describe("pickRandom", () => {
  it("picks the requested number of unique items", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const picked = pickRandom(items, 3);
    expect(picked).toHaveLength(3);
    // All unique
    expect(new Set(picked).size).toBe(3);
    // All from source
    for (const p of picked) {
      expect(items).toContain(p);
    }
  });

  it("returns all items when n >= array length", () => {
    const items = [1, 2];
    const picked = pickRandom(items, 5);
    expect(picked).toHaveLength(2);
  });
});

describe("generateQuiz", () => {
  it("generates questions with 4 options each", () => {
    const questions = generateQuiz(vocab5);
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions) {
      expect(q.options).toHaveLength(4);
    }
  });

  it("correctAnswer matches word's contextualMeaning", () => {
    const questions = generateQuiz(vocab5);
    for (const q of questions) {
      // correctAnswer must be one of our vocab meanings
      const allMeanings = vocab5.map((v) => v.contextualMeaning);
      expect(allMeanings).toContain(q.correctAnswer);
    }
  });

  it("each question's options array contains the correctAnswer", () => {
    const questions = generateQuiz(vocab5);
    for (const q of questions) {
      expect(q.options).toContain(q.correctAnswer);
    }
  });

  it("distractors come from sibling words' contextualMeaning", () => {
    const questions = generateQuiz(vocab5);
    const allMeanings = vocab5.map((v) => v.contextualMeaning);
    for (const q of questions) {
      const distractors = q.options.filter((o) => o !== q.correctAnswer);
      for (const d of distractors) {
        expect(allMeanings).toContain(d);
      }
    }
  });

  it("caps questions at 10 maximum", () => {
    const bigVocab = Array.from({ length: 15 }, (_, i) =>
      mockVocab(`word${i}`, `meaning${i}`)
    );
    const questions = generateQuiz(bigVocab);
    expect(questions.length).toBeLessThanOrEqual(10);
    expect(questions.length).toBeGreaterThan(0);
  });

  it("returns empty array when < 4 words and no fallback", () => {
    const small = vocab5.slice(0, 2);
    const questions = generateQuiz(small);
    expect(questions).toEqual([]);
  });

  it("uses fallbackMeanings to pad distractors when vocabulary is small", () => {
    const small = [mockVocab("dharma", "righteousness")];
    const fallbacks = ["action", "liberation", "devotion", "discipline"];
    const questions = generateQuiz(small, fallbacks);
    expect(questions).toHaveLength(1);
    expect(questions[0].options).toHaveLength(4);
    expect(questions[0].correctAnswer).toBe("righteousness");
    expect(questions[0].options).toContain("righteousness");
  });

  it("returns empty when fallbackMeanings + vocab < 4 total meanings", () => {
    const small = [mockVocab("dharma", "righteousness")];
    const fallbacks = ["action"];
    const questions = generateQuiz(small, fallbacks);
    expect(questions).toEqual([]);
  });
});
