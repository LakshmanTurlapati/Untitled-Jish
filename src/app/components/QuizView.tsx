"use client";

import { useState, useMemo, useEffect, useReducer, useCallback, useRef } from "react";
import type { EnrichedWord } from "@/lib/analysis/types";
import type { QuizQuestion as LegacyQuizQuestion } from "@/lib/study/types";
import type { QuizQuestion as SRSQuizQuestion } from "@/lib/quiz/types";
import { extractVocabulary } from "@/lib/study/vocabulary";
import { generateQuiz } from "@/lib/study/quiz";
import { getDueCards, generateQuizQuestions } from "@/lib/quiz/quizEngine";
import { storableToCard, scheduleReview, cardToStorable, Rating } from "@/lib/quiz/srs";
import { db } from "@/lib/kaavya/db/schema";
import { computeQuizSessionXP } from "@/lib/gamification/xpEngine";
import { getCurrentRank } from "@/lib/gamification/rankSystem";
import { getMasteryStats } from "@/lib/quiz/quizEngine";
import type { UserStats } from "@/lib/gamification/types";
import { GrammarFactsPill } from "./GrammarFactsPill";
import { SRSRatingBar } from "./SRSRatingBar";

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

// --- Unified question type for reducer ---

interface UnifiedQuestion {
  word: { original: string; iast: string };
  correctAnswer: string;
  options: string[];
  // SRS-only fields
  vocabItemId?: number;
  grammarFacts?: SRSQuizQuestion["grammarFacts"];
  allMeanings?: string[];
}

// --- Reducer ---

interface QuizGameState {
  questions: UnifiedQuestion[];
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
  | { type: "START"; questions: UnifiedQuestion[] }
  | { type: "SELECT"; option: string }
  | { type: "CHECK" }
  | { type: "NEXT" }
  | { type: "RESTART"; questions: UnifiedQuestion[] };

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

    case "CHECK":
      return state;

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

// --- Interval display helper ---

function formatInterval(card: ReturnType<typeof storableToCard>, rating: Rating): string {
  const result = scheduleReview(card, rating);
  const storable = cardToStorable(result);
  const dueDate = new Date(storable.due);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return `${Math.max(1, diffMins)}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

// --- QuizView component ---

interface QuizViewProps {
  // Legacy mode (from Analyze tab study)
  words?: EnrichedWord[];
  onBackToText?: () => void;
  // SRS mode (from Quiz tab)
  mode?: "daily" | "kaavya";
  kaavyaId?: number;
  onBackToModes?: () => void;
}

export function QuizView({ words, onBackToText, mode, kaavyaId, onBackToModes }: QuizViewProps) {
  const isSRSMode = mode !== undefined;

  // Legacy mode vocabulary
  const vocabulary = useMemo(
    () => (words ? extractVocabulary(words) : []),
    [words]
  );

  const [gameState, dispatch] = useReducer(quizReducer, initialState);
  const [fallbackMeanings, setFallbackMeanings] = useState<string[] | null>(null);
  const [loadingFallbacks, setLoadingFallbacks] = useState(false);
  const [srsLoading, setSrsLoading] = useState(isSRSMode);
  const [srsEmpty, setSrsEmpty] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [vocabItemsMap, setVocabItemsMap] = useState<Map<number, import("@/lib/quiz/types").VocabItem>>(new Map());
  const autoRateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoRateWarning, setAutoRateWarning] = useState(false);
  const [showRankUp, setShowRankUp] = useState<{ show: boolean; rankName: string; sanskritName: string }>({ show: false, rankName: "", sanskritName: "" });
  const [showXPFloat, setShowXPFloat] = useState(false);
  const xpPersistedRef = useRef(false);

  // Persist XP to IndexedDB userStats
  async function persistQuizXP(earnedXP: number): Promise<{ rankedUp: boolean; newRankName: string; newSanskritName: string }> {
    const stats = await db.userStats.toCollection().first();
    const newTotalXP = (stats?.totalXP ?? 0) + earnedXP;

    const mastery = await getMasteryStats();
    const readingStates = await db.readingStates.toArray();
    const kaavyasRead = readingStates.filter(rs => rs.currentPage === rs.totalPages).length;
    const newRank = getCurrentRank(mastery.mastered, kaavyasRead);

    const previousRankName = stats?.lastRankName ?? "Shishya";
    const rankedUp = newRank.name !== previousRankName;

    if (stats?.id) {
      await db.userStats.update(stats.id, { totalXP: newTotalXP, lastRankName: newRank.name });
    } else {
      await db.userStats.add({ totalXP: newTotalXP, lastRankName: newRank.name });
    }

    return { rankedUp, newRankName: newRank.name, newSanskritName: rankedUp ? newRank.sanskritName : "" };
  }

  // Floating XP animation on correct answer
  useEffect(() => {
    if (gameState.lastAnswerCorrect === true) {
      setShowXPFloat(true);
      const timer = setTimeout(() => setShowXPFloat(false), 800);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentIndex, gameState.lastAnswerCorrect]);

  // Persist XP on quiz completion
  useEffect(() => {
    if (gameState.phase === "complete" && gameState.xp > 0 && !xpPersistedRef.current) {
      xpPersistedRef.current = true;
      persistQuizXP(gameState.xp).then(result => {
        if (result.rankedUp) {
          getMasteryStats().then(stats => {
            db.readingStates.toArray().then(rs => {
              const kaavyasRead = rs.filter(r => r.currentPage === r.totalPages).length;
              const rank = getCurrentRank(stats.mastered, kaavyasRead);
              setShowRankUp({ show: true, rankName: rank.name, sanskritName: rank.sanskritName });
              setTimeout(() => setShowRankUp({ show: false, rankName: "", sanskritName: "" }), 3000);
            });
          });
        }
      });
    }
    if (gameState.phase !== "complete") {
      xpPersistedRef.current = false;
    }
  }, [gameState.phase, gameState.xp]);

  const needsFallback = !isSRSMode && vocabulary.length < 4;

  // SRS mode: load due cards on mount
  useEffect(() => {
    if (!isSRSMode) return;

    async function loadSRSQuestions() {
      setSrsLoading(true);
      try {
        const dueCards = await getDueCards(mode!, kaavyaId);
        if (dueCards.length === 0) {
          setSrsEmpty(true);
          setSrsLoading(false);
          return;
        }

        const allVocab = await db.vocabItems.toArray();

        // Build map for quick lookups during rating
        const itemMap = new Map<number, import("@/lib/quiz/types").VocabItem>();
        for (const item of allVocab) {
          if (item.id !== undefined) itemMap.set(item.id, item);
        }
        setVocabItemsMap(itemMap);

        const questions = generateQuizQuestions(dueCards, allVocab);
        const unified: UnifiedQuestion[] = questions.map((q) => ({
          word: q.word,
          correctAnswer: q.correctAnswer,
          options: q.options,
          vocabItemId: q.vocabItemId,
          grammarFacts: q.grammarFacts,
          allMeanings: q.allMeanings,
        }));

        dispatch({ type: "START", questions: unified });
      } catch (err) {
        console.error('Quiz load failed:', err);
        setQuizError('Failed to load quiz questions. Please try again.');
      }
      setSrsLoading(false);
    }

    loadSRSQuestions();
  }, [isSRSMode, mode, kaavyaId]);

  // Legacy mode: fetch fallback distractors
  useEffect(() => {
    if (!needsFallback) return;
    setLoadingFallbacks(true);
    fetch("/api/distractors?count=6")
      .then((res) => res.json())
      .then((data) => setFallbackMeanings(data.meanings))
      .catch(() => setFallbackMeanings([]))
      .finally(() => setLoadingFallbacks(false));
  }, [needsFallback]);

  // Auto-rate timer for SRS mode (10s timeout, 1s warning)
  useEffect(() => {
    if (!isSRSMode || gameState.phase !== "checked") {
      if (autoRateTimerRef.current) {
        clearTimeout(autoRateTimerRef.current);
        autoRateTimerRef.current = null;
      }
      setAutoRateWarning(false);
      return;
    }

    // After 9 seconds, show warning
    const warningTimer = setTimeout(() => {
      setAutoRateWarning(true);
    }, 9000);

    // After 10 seconds, auto-rate as Good
    autoRateTimerRef.current = setTimeout(() => {
      handleSRSRate(Rating.Good);
    }, 10000);

    return () => {
      clearTimeout(warningTimer);
      if (autoRateTimerRef.current) {
        clearTimeout(autoRateTimerRef.current);
        autoRateTimerRef.current = null;
      }
      setAutoRateWarning(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSRSMode, gameState.phase, gameState.currentIndex]);

  // SRS rating handler
  const handleSRSRate = useCallback(
    async (rating: Rating) => {
      if (autoRateTimerRef.current) {
        clearTimeout(autoRateTimerRef.current);
        autoRateTimerRef.current = null;
      }
      setAutoRateWarning(false);

      const question = gameState.questions[gameState.currentIndex];
      if (!question?.vocabItemId) {
        dispatch({ type: "NEXT" });
        return;
      }

      const currentItem = vocabItemsMap.get(question.vocabItemId);
      if (!currentItem) {
        dispatch({ type: "NEXT" });
        return;
      }

      try {
        const card = storableToCard({
          due: currentItem.due,
          stability: currentItem.stability,
          difficulty: currentItem.difficulty,
          elapsed_days: currentItem.elapsedDays,
          scheduled_days: currentItem.scheduledDays,
          reps: currentItem.reps,
          lapses: currentItem.lapses,
          learning_steps: currentItem.learningSteps,
          state: currentItem.state,
          last_review: currentItem.lastReview,
        });
        const updatedCard = scheduleReview(card, rating);
        const storable = cardToStorable(updatedCard);

        await db.vocabItems.update(question.vocabItemId, {
          due: storable.due,
          stability: storable.stability,
          difficulty: storable.difficulty,
          elapsedDays: storable.elapsed_days,
          scheduledDays: storable.scheduled_days,
          reps: storable.reps,
          lapses: storable.lapses,
          learningSteps: storable.learning_steps,
          state: storable.state,
          lastReview: storable.last_review,
        });

        await db.reviewLogs.add({
          vocabItemId: question.vocabItemId,
          rating,
          state: currentItem.state,
          reviewedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('SRS rating update failed:', {
          vocabItemId: question.vocabItemId,
          rating,
          error: err,
        });
      }

      dispatch({ type: "NEXT" });
    },
    [gameState.questions, gameState.currentIndex, vocabItemsMap]
  );

  // Compute SRS intervals for current question
  const srsIntervals = useMemo(() => {
    if (!isSRSMode || gameState.phase !== "checked") return null;
    const question = gameState.questions[gameState.currentIndex];
    if (!question?.vocabItemId) return null;
    const currentItem = vocabItemsMap.get(question.vocabItemId);
    if (!currentItem) return null;

    const card = storableToCard({
      due: currentItem.due,
      stability: currentItem.stability,
      difficulty: currentItem.difficulty,
      elapsed_days: currentItem.elapsedDays,
      scheduled_days: currentItem.scheduledDays,
      reps: currentItem.reps,
      lapses: currentItem.lapses,
      learning_steps: currentItem.learningSteps,
      state: currentItem.state,
      last_review: currentItem.lastReview,
    });

    return {
      again: formatInterval(card, Rating.Again),
      hard: formatInterval(card, Rating.Hard),
      good: formatInterval(card, Rating.Good),
      easy: formatInterval(card, Rating.Easy),
    };
  }, [isSRSMode, gameState.phase, gameState.currentIndex, gameState.questions, vocabItemsMap]);

  // --- Legacy mode start ---
  function startLegacyQuiz() {
    const q = generateQuiz(
      vocabulary,
      needsFallback ? (fallbackMeanings ?? undefined) : undefined
    );
    const unified: UnifiedQuestion[] = q.map((lq: LegacyQuizQuestion) => ({
      word: lq.word,
      correctAnswer: lq.correctAnswer,
      options: lq.options,
    }));
    dispatch({ type: "START", questions: unified });
  }

  // --- SRS loading/empty states ---
  if (isSRSMode && srsLoading) {
    return <p className="text-sm text-ink-600">Loading quiz...</p>;
  }

  if (isSRSMode && quizError) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-700 mb-4">{quizError}</p>
        {onBackToModes && (
          <button
            onClick={onBackToModes}
            className="rounded-xl bg-ink-800 text-parchment-50 font-bold px-8 py-3 border-b-4 border-ink-900 active:border-b-2 active:translate-y-[2px] transition-all duration-75"
          >
            Back to Modes
          </button>
        )}
      </div>
    );
  }

  if (isSRSMode && srsEmpty) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-ink-600 mb-4">No words due for review</p>
        {onBackToModes && (
          <button
            onClick={onBackToModes}
            className="rounded-xl bg-ink-800 text-parchment-50 font-bold px-8 py-3 border-b-4 border-ink-900 active:border-b-2 active:translate-y-[2px] transition-all duration-75"
          >
            Back to Modes
          </button>
        )}
      </div>
    );
  }

  // --- Legacy fallback handling ---
  if (!isSRSMode && needsFallback) {
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

  // Ready state (legacy only -- SRS auto-starts)
  if (phase === "ready") {
    return (
      <div className="text-center">
        <button
          onClick={startLegacyQuiz}
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
        {showRankUp.show && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            onClick={() => setShowRankUp({ show: false, rankName: "", sanskritName: "" })}
          >
            <Confetti />
            <div
              className="bg-white rounded-2xl shadow-xl p-8 max-w-sm mx-auto text-center"
              style={{ animation: "check-appear 300ms ease-out" }}
            >
              <p className="text-xl font-bold text-ink-900 mb-2">Rank Up!</p>
              <p className="text-2xl font-bold text-accent-500 mb-1">{showRankUp.sanskritName}</p>
              <p className="text-base text-ink-700">You are now {showRankUp.rankName} ({showRankUp.sanskritName})</p>
            </div>
          </div>
        )}
        <h3 className="mb-4 text-2xl font-bold text-ink-900">
          {isSRSMode ? "Review Complete!" : "Quiz Complete!"}
        </h3>
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
          {isSRSMode ? (
            onBackToModes && (
              <button
                onClick={onBackToModes}
                className="rounded-xl bg-ink-800 text-parchment-50 font-bold px-8 py-3 border-b-4 border-ink-900 active:border-b-2 active:translate-y-[2px] transition-all duration-75"
              >
                Back to Modes
              </button>
            )
          ) : (
            <>
              <button
                onClick={() => {
                  const q = generateQuiz(
                    vocabulary,
                    needsFallback ? (fallbackMeanings ?? undefined) : undefined
                  );
                  const unified: UnifiedQuestion[] = q.map((lq: LegacyQuizQuestion) => ({
                    word: lq.word,
                    correctAnswer: lq.correctAnswer,
                    options: lq.options,
                  }));
                  dispatch({ type: "RESTART", questions: unified });
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
            </>
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
        <span className="relative text-accent-600 font-bold text-sm whitespace-nowrap">
          {xp} XP
          {showXPFloat && (
            <span
              className="absolute -top-1 left-0 text-sm font-bold text-accent-500 pointer-events-none"
              style={{ animation: "xp-float 800ms ease-out forwards" }}
            >
              +10 XP
            </span>
          )}
        </span>
      </div>

      {/* Question counter */}
      <p className="mb-1 text-sm text-ink-600 text-center">
        Question {currentIndex + 1} of {questions.length}
      </p>

      {/* Word prompt */}
      <div className="mb-4 text-center">
        <p className="font-sanskrit text-2xl">{question.word.original}</p>
        <p className="text-lg italic text-ink-600">{question.word.iast}</p>
      </div>

      {/* Grammar facts pills (SRS mode only) */}
      {isSRSMode && question.grammarFacts && (
        <GrammarFactsPill
          wordType={question.grammarFacts.wordType}
          vibhakti={question.grammarFacts.vibhakti}
          dhatu={question.grammarFacts.dhatu}
          gana={question.grammarFacts.gana}
          linga={question.grammarFacts.linga}
        />
      )}

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

          {/* All meanings (SRS mode) */}
          {isSRSMode && question.allMeanings && question.allMeanings.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-bold text-ink-800 mb-1">
                All meanings (MW/Apte)
              </h4>
              <ul className="list-disc list-inside text-sm text-ink-600 space-y-0.5">
                {question.allMeanings.map((meaning, idx) => (
                  <li key={idx}>{meaning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* SRS Rating Bar or Continue button */}
      {phase === "checked" && (
        isSRSMode && srsIntervals ? (
          <div className={autoRateWarning ? "animate-pulse" : ""}>
            <SRSRatingBar onRate={handleSRSRate} intervals={srsIntervals} />
          </div>
        ) : (
          <button
            onClick={() => dispatch({ type: "NEXT" })}
            className="w-full rounded-xl bg-ink-800 text-parchment-50 font-bold px-8 py-3 border-b-4 border-ink-900 active:border-b-2 active:translate-y-[2px] transition-all duration-75"
          >
            Continue
          </button>
        )
      )}
    </div>
  );
}
