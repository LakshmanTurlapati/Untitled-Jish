"use client";

import { useState } from "react";
import { FaPlus, FaCheck } from "react-icons/fa";
import { populateVocabulary } from "@/lib/quiz/vocabularyPopulator";

interface VocabPopulateButtonProps {
  kaavyaId: number;
  kaavyaText: string;
  onComplete?: (count: number) => void;
}

type ButtonState = "idle" | "loading" | "success" | "error";

export function VocabPopulateButton({
  kaavyaId,
  kaavyaText,
  onComplete,
}: VocabPopulateButtonProps) {
  const [state, setState] = useState<ButtonState>("idle");
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    if (state === "loading") return;

    setState("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/quiz/populate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: kaavyaText, kaavyaId }),
      });

      if (!res.ok) throw new Error("API request failed");

      const data = await res.json();
      const result = await populateVocabulary(data.words, kaavyaId);

      setAddedCount(result.added);
      setState("success");
      onComplete?.(result.added);

      // Brief success state then return to idle
      setTimeout(() => {
        setState("idle");
      }, 400);
    } catch {
      setState("error");
      setErrorMessage(
        "Could not extract vocabulary. Check your connection and try again."
      );
      // Return to idle after showing error
      setTimeout(() => {
        setState("idle");
      }, 3000);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        className={`rounded-xl font-bold px-4 py-2 border-b-4 active:border-b-2 active:translate-y-[2px] transition-all duration-75 flex items-center gap-2 ${
          state === "success"
            ? "bg-green-500 border-green-700 text-white"
            : "bg-accent-600 border-accent-800 text-white"
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {state === "loading" ? (
          <>
            <FaPlus className="animate-spin" />
            <span>Adding...</span>
          </>
        ) : state === "success" ? (
          <>
            <FaCheck />
            <span>{addedCount} words added to quiz</span>
          </>
        ) : (
          <>
            <FaPlus />
            <span>
              {addedCount !== null
                ? `${addedCount} words added to quiz`
                : "Add Words to Quiz"}
            </span>
          </>
        )}
      </button>
      {state === "error" && errorMessage && (
        <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
      )}
    </div>
  );
}
