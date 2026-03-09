"use client";

import { useState, useMemo, useEffect, useReducer } from "react";
import type { EnrichedWord } from "@/lib/analysis/types";
import type { QuizQuestion } from "@/lib/study/types";
import { extractVocabulary } from "@/lib/study/vocabulary";
import { generateQuiz } from "@/lib/study/quiz";

// --- Gamification constants ---

const CORRECT_MESSAGES = [
  "Sadhu! (Well done!)",
  "Ati uttamam! (Excellent!)",
  "Bahu sundaram!",
  "Samicinam! (Correct!)",
];
const WRONG_MESSAGES = [
  "Punah prayatnah (Try again)",
  "Not quite -- keep learning!",
];
const STREAK_MESSAGES: Record<number, string> = {
  3: "On fire! 3x streak!",
  5: "Unstoppable! 5x streak!",
};

function getEncouragement(correct: boolean, streak: number): string {
  if (correct) {
    if (STREAK_MESSAGES[streak]) return STREAK_MESSAGES[streak];
    return CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)];
  }
  return WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)];
}

// --- Hearts component ---

function Hearts({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-1" data-testid="hearts">
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`h-6 w-6 ${i < count ? "text-red-500" : "text-parchment-200"}`}
          fill="currentColor"
          data-testid={i < count ? "heart-filled" : "heart-empty"}
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ))}
    </div>
  );
}

// --- Confetti component ---

const CONFETTI_COLORS = [
  "bg-accent-500",
  "bg-accent-600",
  "bg-green-500",
  "bg-blue-500",
  "bg-red-500",
  "bg-parchment-200",
];

function Confetti() {
  // Generate deterministic-looking but varied confetti
  const pieces = Array.from({ length: 25 }, (_, i) => {
    const left = ((i * 37 + 13) % 100);
    const delay = ((i * 0.12) % 3).toFixed(2);
    const duration = (2 + (i % 3)).toFixed(1);
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    return (
      <div
        key={i}
        className={`absolute h-1 w-1 rounded-full ${color} pointer-events-none`}
        style={{
          left: `${left}%`,
          top: "-10px",
          animationName: "confetti-fall",
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          animationTimingFunction: "ease-in",
          animationFillMode: "forwards",
        }}
      />
    );
  });
  return <>{pieces}</>;
}

// --- Reducer ---

interface QuizGameState {
  questions: QuizQuestion[];
  currentIndex: number;
  phase: "ready" | "selecting" | "checked" | "complete";
  selectedOption: string | null;
  score: number;
  xp: number;
  hearts: number;
  streak: number;
  maxStreak: number;
  lastAnswerCorrect: boolean | null;
  encouragement: string | null;
}

type QuizAction =
  | { type: "START"; questions: QuizQuestion[] }
  | { type: "SELECT"; option: string }
  | { type: "CHECK" }
  | { type: "NEXT" }
  | { type: "RESTART"; questions: QuizQuestion[] };

const initialState: QuizGameState = {
  questions: [],
  currentIndex: 0,
  phase: "ready",
  selectedOption: null,
  score: 0,
  xp: 0,
  hearts: 3,
  streak: 0,
  maxStreak: 0,
  lastAnswerCorrect: null,
  encouragement: null,
};

function quizReducer(state: QuizGameState, action: QuizAction): QuizGameState {
  switch (action.type) {
    case "START":
      return {
        ...initialState,
        questions: action.questions,
        phase: "selecting",
        hearts: 3,
      };

    case "SELECT": {
      if (state.phase !== "selecting") return state;
      // Auto-check: selecting an option immediately checks the answer
      const currentQ = state.questions[state.currentIndex];
      const correct = action.option === currentQ.correctAnswer;
      const newStreak = correct ? state.streak + 1 : 0;
      const newMaxStreak = Math.max(state.maxStreak, newStreak);
      return {
        ...state,
        phase: "checked",
        selectedOption: action.option,
        score: correct ? state.score + 1 : state.score,
        xp: correct ? state.xp + 10 : state.xp,
        hearts: correct ? state.hearts : Math.max(0, state.hearts - 1),
        streak: newStreak,
        maxStreak: newMaxStreak,
        lastAnswerCorrect: correct,
        encouragement: getEncouragement(correct, newStreak),
      };
    }

    case "CHECK": {
      // Legacy — no longer used, SELECT auto-checks
      return state;
    }

    case "NEXT":
      if (state.currentIndex + 1 >= state.questions.length) {
        return { ...state, phase: "complete", selectedOption: null, encouragement: null };
      }
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        phase: "selecting",
        selectedOption: null,
        lastAnswerCorrect: null,
        encouragement: null,
      };

    case "RESTART":
      return quizReducer(state, { type: "START", questions: action.questions });

    default:
      return state;
  }
}

// --- QuizView component ---

interface QuizViewProps {
  words: EnrichedWord[];
  onBackToText?: () => void;
}

export function QuizView({ words, onBackToText }: QuizViewProps) {
  const vocabulary = useMemo(() => extractVocabulary(words), [words]);

  const [gameState, dispatch] = useReducer(quizReducer, initialState);
  const [fallbackMeanings, setFallbackMeanings] = useState<string[] | null>(null);
  const [loadingFallbacks, setLoadingFallbacks] = useState(false);
  const needsFallback = vocabulary.length < 4;

  useEffect(() => {
    if (!needsFallback) return;
    setLoadingFallbacks(true);
    fetch("/api/distractors?count=6")
      .then((res) => res.json())
      .then((data) => setFallbackMeanings(data.meanings))
      .catch(() => setFallbackMeanings([]))
      .finally(() => setLoadingFallbacks(false));
  }, [needsFallback]);

  function startQuiz() {
    const q = generateQuiz(
      vocabulary,
      needsFallback ? (fallbackMeanings ?? undefined) : undefined
    );
    dispatch({ type: "START", questions: q });
  }

  // Handle small vocabulary with fallback distractors
  if (needsFallback) {
    if (loadingFallbacks) {
      return <p className="text-sm text-ink-600">Loading quiz...</p>;
    }
    const totalUnique = new Set([
      ...vocabulary.map((w) => w.contextualMeaning),
      ...(fallbackMeanings ?? []),
    ]).size;
    if (totalUnique < 4) {
      return (
        <p className="text-sm text-ink-600">Need at least 4 words for quiz.</p>
      );
    }
  }

  const { phase, questions, currentIndex, selectedOption, score, xp, hearts, streak, maxStreak, lastAnswerCorrect, encouragement } = gameState;

  // Ready state
  if (phase === "ready") {
    return (
      <div className="text-center">
        <button
          onClick={startQuiz}
          className="rounded-xl bg-accent-600 text-white font-bold px-8 py-3 border-b-4 border-accent-800 active:border-b-2 active:translate-y-[2px] transition-all duration-75"
        >
          Start Quiz
        </button>
      </div>
    );
  }

  // Complete state (celebration screen)
  if (phase === "complete") {
    return (
      <div className="rounded-2xl border border-parchment-200 bg-parchment-50 p-8 text-center relative overflow-hidden">
        <Confetti />
        <h3 className="mb-4 text-2xl font-bold text-ink-900">Quiz Complete!</h3>
        <p className="mb-2 text-4xl font-bold text-accent-600">
          {score}/{questions.length}
        </p>
        <p className="mb-2 text-lg font-semibold text-accent-600">
          +{xp} XP
        </p>
        <div className="mb-2 flex justify-center">
          <Hearts count={hearts} />
        </div>
        {maxStreak >= 3 && (
          <p className="mb-4 text-sm text-ink-600">
            Best streak: {maxStreak}x
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => {
              const q = generateQuiz(
                vocabulary,
                needsFallback ? (fallbackMeanings ?? undefined) : undefined
              );
              dispatch({ type: "RESTART", questions: q });
            }}
            className="rounded-xl bg-accent-600 text-white font-bold px-8 py-3 border-b-4 border-accent-800 active:border-b-2 active:translate-y-[2px] transition-all duration-75"
          >
            Practice Again
          </button>
          {onBackToText ? (
            <button
              onClick={onBackToText}
              className="rounded-xl bg-ink-800 text-parchment-50 font-bold px-8 py-3 border-b-4 border-ink-900 active:border-b-2 active:translate-y-[2px] transition-all duration-75"
            >
              Back to Text
            </button>
          ) : (
            <p className="text-sm text-ink-600 mt-2">
              Switch tabs to return to text analysis
            </p>
          )}
        </div>
      </div>
    );
  }

  // Active quiz (selecting / checked)
  const question = questions[currentIndex];
  const progressPercent =
    ((currentIndex + (phase === "checked" ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="rounded-2xl border border-parchment-200 bg-parchment-50 p-6">
      {/* Header: Hearts | Progress | XP */}
      <div className="mb-4 flex items-center gap-3">
        <Hearts count={hearts} />
        <div className="flex-1">
          <div className="h-3 rounded-full bg-parchment-200">
            <div
              className="h-3 rounded-full bg-accent-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <span className="text-accent-600 font-bold text-sm whitespace-nowrap">
          {xp} XP
        </span>
      </div>

      {/* Question counter */}
      <p className="mb-1 text-sm text-ink-600 text-center">
        Question {currentIndex + 1} of {questions.length}
      </p>

      {/* Word prompt */}
      <div className="mb-6 text-center">
        <p className="font-sanskrit text-2xl">{question.word.original}</p>
        <p className="text-lg italic text-ink-600">{question.word.iast}</p>
      </div>

      {/* Options */}
      <div className="mb-4 space-y-2">
        {question.options.map((option) => {
          let optionClasses =
            "w-full rounded-xl border-2 p-4 text-left text-sm transition-all";

          if (phase === "checked") {
            if (option === question.correctAnswer) {
              optionClasses += " border-green-500 bg-green-50";
            } else if (option === selectedOption) {
              optionClasses += " border-red-500 bg-red-50";
            } else {
              optionClasses += " border-parchment-200 opacity-50";
            }
          } else {
            // selecting phase
            if (option === selectedOption) {
              optionClasses += " border-accent-600 bg-accent-50";
            } else {
              optionClasses +=
                " border-parchment-200 bg-parchment-50 hover:border-accent-400 cursor-pointer";
            }
          }

          return (
            <button
              key={option}
              onClick={() => {
                if (phase === "selecting") {
                  dispatch({ type: "SELECT", option });
                }
              }}
              disabled={phase === "checked"}
              className={optionClasses}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Feedback section (only in checked phase) */}
      {phase === "checked" && (
        <div className="mb-4">
          <p
            className={`text-sm font-medium ${
              lastAnswerCorrect ? "text-green-700" : "text-red-700"
            }`}
          >
            {encouragement}
          </p>
          {!lastAnswerCorrect && (
            <p className="text-sm text-red-700 mt-1">
              The answer is: {question.correctAnswer}
            </p>
          )}
          {streak >= 3 && lastAnswerCorrect && (
            <p className="text-sm font-bold text-accent-600 mt-1">
              {streak}x streak!
            </p>
          )}
        </div>
      )}

      {/* Continue button (only in checked phase) */}
      {phase === "checked" && (
        <button
          onClick={() => dispatch({ type: "NEXT" })}
          className="w-full rounded-xl bg-ink-800 text-parchment-50 font-bold px-8 py-3 border-b-4 border-ink-900 active:border-b-2 active:translate-y-[2px] transition-all duration-75"
        >
          Continue
        </button>
      )}
    </div>
  );
}
