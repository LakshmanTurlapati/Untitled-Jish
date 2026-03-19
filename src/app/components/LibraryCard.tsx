"use client";

import type { Kaavya, ReadingState } from "@/lib/kaavya/types";
import { FaTrash } from "react-icons/fa";
import { DueCountBadge } from "./DueCountBadge";

interface LibraryCardProps {
  kaavya: Kaavya;
  readingState?: ReadingState;
  dueCount?: number;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
  onQuiz?: () => void;
}

function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

export function LibraryCard({ kaavya, readingState, dueCount, onOpen, onDelete, onQuiz }: LibraryCardProps) {
  const progress = readingState
    ? `Page ${readingState.currentPage} of ${readingState.totalPages}`
    : "Not started";

  const lastActivity = readingState
    ? `Last read ${relativeTime(readingState.lastReadAt)}`
    : `Added ${relativeTime(kaavya.createdAt)}`;

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    const confirmed = window.confirm(
      `This will permanently remove ${kaavya.title} from your library. Reading progress and interpretation history will be lost.`
    );
    if (confirmed) {
      onDelete(kaavya.id!);
    }
  }

  function handleQuiz(e: React.MouseEvent) {
    e.stopPropagation();
    onQuiz?.();
  }

  return (
    <div
      onClick={() => onOpen(kaavya.id!)}
      className="group relative cursor-pointer rounded-lg border border-parchment-200 bg-parchment-100 p-4 transition-shadow duration-200 hover:shadow-md"
    >
      <button
        onClick={handleDelete}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 p-1"
        aria-label={`Delete ${kaavya.title}`}
      >
        <FaTrash className="text-sm" />
      </button>

      {/* Due count badge */}
      {dueCount !== undefined && dueCount > 0 && (
        <div className="absolute top-3 right-10">
          <DueCountBadge count={dueCount} />
        </div>
      )}

      <h3 className="text-lg font-semibold text-ink-800 pr-16">{kaavya.title}</h3>

      {kaavya.author && (
        <p className="text-sm text-ink-700 mt-1">{kaavya.author}</p>
      )}

      <p className="text-sm text-ink-700 mt-2">{progress}</p>
      <p className="text-xs text-ink-700 mt-1">{lastActivity}</p>

      {onQuiz && (
        <button
          onClick={handleQuiz}
          aria-label={`Quiz words from ${kaavya.title}`}
          className="mt-2 text-sm text-accent-600 hover:text-accent-700 font-medium transition-colors"
        >
          Quiz this
        </button>
      )}
    </div>
  );
}
