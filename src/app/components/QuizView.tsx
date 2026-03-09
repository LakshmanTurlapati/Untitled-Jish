"use client";

import { useState, useMemo, useCallback } from "react";
import type { EnrichedWord } from "@/lib/analysis/types";
import type { QuizQuestion, QuizPhase } from "@/lib/study/types";
import { extractVocabulary } from "@/lib/study/vocabulary";
import { generateQuiz } from "@/lib/study/quiz";

interface QuizViewProps {
  words: EnrichedWord[];
}

export function QuizView({ words }: QuizViewProps) {
  const vocabulary = useMemo(() => extractVocabulary(words), [words]);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<QuizPhase>("ready");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const startQuiz = useCallback(() => {
    const q = generateQuiz(vocabulary);
    setQuestions(q);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setPhase("active");
  }, [vocabulary]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (phase !== "active") return;
      setSelectedAnswer(answer);
      if (answer === questions[currentIndex].correctAnswer) {
        setScore((s) => s + 1);
      }
      setPhase("answered");
    },
    [phase, questions, currentIndex]
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setPhase("complete");
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setPhase("active");
    }
  }, [currentIndex, questions.length]);

  // Not enough words for quiz
  if (vocabulary.length < 4) {
    return (
      <p className="text-sm text-ink-600">
        Need at least 4 words for quiz.
      </p>
    );
  }

  // Ready state: show start button
  if (phase === "ready") {
    return (
      <button
        onClick={startQuiz}
        className="rounded-lg bg-accent-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-700"
      >
        Start Quiz
      </button>
    );
  }

  // Complete state: show score
  if (phase === "complete") {
    const percentage = questions.length > 0 ? score / questions.length : 0;
    let encouragement = "Keep studying!";
    if (percentage >= 0.8) encouragement = "Excellent work!";
    else if (percentage >= 0.6) encouragement = "Good effort!";

    return (
      <div className="rounded-lg border border-parchment-200 bg-parchment-50 p-6 text-center">
        <h3 className="mb-2 text-xl font-semibold text-ink-900">
          Quiz Complete!
        </h3>
        <p className="mb-2 text-3xl font-bold text-accent-600">
          {score}/{questions.length}
        </p>
        <p className="mb-4 text-ink-600">{encouragement}</p>
        <button
          onClick={startQuiz}
          className="rounded-lg bg-accent-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-700"
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  // Active / Answered state: show question
  const question = questions[currentIndex];
  const progressPercent =
    ((currentIndex + (phase === "answered" ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="rounded-lg border border-parchment-200 bg-parchment-50 p-6">
      {/* Progress */}
      <div className="mb-4">
        <p className="mb-1 text-sm text-ink-600">
          Question {currentIndex + 1} of {questions.length}
        </p>
        <div className="h-3 rounded-full bg-parchment-200">
          <div
            className="h-3 rounded-full bg-accent-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Word prompt */}
      <div className="mb-6 text-center">
        <p className="font-sanskrit text-2xl">{question.word.original}</p>
        <p className="text-lg italic text-ink-600">{question.word.iast}</p>
      </div>

      {/* Options */}
      <div className="mb-4 space-y-2">
        {question.options.map((option) => {
          let optionClasses =
            "w-full rounded-lg border p-3 text-left text-sm transition-colors";

          if (phase === "answered") {
            if (option === question.correctAnswer) {
              optionClasses += " border-green-500 bg-green-50";
            } else if (option === selectedAnswer) {
              optionClasses += " border-red-500 bg-red-50";
            } else {
              optionClasses += " border-parchment-200 opacity-50";
            }
          } else {
            optionClasses +=
              " border-parchment-200 hover:border-accent-400 cursor-pointer";
          }

          return (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={phase === "answered"}
              className={optionClasses}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {phase === "answered" && (
        <div className="mb-4">
          {selectedAnswer === question.correctAnswer ? (
            <p className="text-sm font-medium text-green-700">Correct!</p>
          ) : (
            <p className="text-sm font-medium text-red-700">
              Not quite -- the answer is: {question.correctAnswer}
            </p>
          )}
        </div>
      )}

      {/* Next button */}
      {phase === "answered" && (
        <button
          onClick={handleNext}
          className="rounded-lg bg-ink-800 px-6 py-2.5 text-sm font-medium text-parchment-50 transition-colors hover:bg-ink-900"
        >
          Next
        </button>
      )}
    </div>
  );
}
