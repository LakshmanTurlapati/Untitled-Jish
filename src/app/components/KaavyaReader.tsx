"use client";

import { useEffect, useMemo } from "react";
import { FaArrowLeft, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useReader } from "@/lib/kaavya/hooks/useReader";
import { ReaderPage } from "./ReaderPage";

interface KaavyaReaderProps {
  kaavyaId: number;
  onBack: () => void;
}

function getVisibleDots(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const dots: (number | "ellipsis")[] = [];

  if (currentPage <= 2) {
    // Near start: show first 5, ellipsis, last
    for (let i = 0; i < 5; i++) dots.push(i);
    dots.push("ellipsis");
    dots.push(totalPages - 1);
  } else if (currentPage >= totalPages - 3) {
    // Near end: first, ellipsis, last 5
    dots.push(0);
    dots.push("ellipsis");
    for (let i = totalPages - 5; i < totalPages; i++) dots.push(i);
  } else {
    // Middle: first, ellipsis, prev, current, next, ellipsis, last
    dots.push(0);
    dots.push("ellipsis");
    dots.push(currentPage - 1);
    dots.push(currentPage);
    dots.push(currentPage + 1);
    dots.push("ellipsis");
    dots.push(totalPages - 1);
  }

  return dots;
}

export function KaavyaReader({ kaavyaId, onBack }: KaavyaReaderProps) {
  const {
    kaavya,
    pages,
    currentPage,
    totalPages,
    isLoading,
    nextPage,
    prevPage,
  } = useReader(kaavyaId);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        nextPage();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        prevPage();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextPage, prevPage]);

  const visibleDots = useMemo(
    () => getVisibleDots(currentPage, totalPages),
    [currentPage, totalPages]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-parchment-50 rounded-xl">
        <div className="w-8 h-8 border-4 border-parchment-200 border-t-accent-500 rounded-full animate-spin" />
        <p className="mt-4 text-ink-700 text-sm">Loading...</p>
      </div>
    );
  }

  if (!kaavya || pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-parchment-50 rounded-xl">
        <p className="text-ink-700">No content available.</p>
        <button
          onClick={onBack}
          className="mt-4 text-accent-500 hover:text-accent-600 text-sm"
        >
          Return to Library
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between py-3 px-1">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-ink-700 hover:text-ink-800 transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Library</span>
        </button>

        <h1 className="text-lg font-semibold text-ink-800 truncate max-w-[50%] text-center">
          {kaavya.title}
        </h1>

        <span className="text-sm text-ink-700 whitespace-nowrap">
          Page {currentPage + 1} of {totalPages}
        </span>
      </div>

      {/* Reader viewport */}
      <div className="h-[70vh] overflow-hidden bg-parchment-50 rounded-xl border border-parchment-200 px-6 lg:px-10 py-8">
        <div key={currentPage} className="animate-[fade-in_300ms_ease]">
          <ReaderPage content={pages[currentPage]} />
        </div>
      </div>

      {/* Bottom navigation bar */}
      <div className="flex items-center justify-between py-4">
        <button
          onClick={prevPage}
          disabled={currentPage === 0}
          aria-label="Previous page"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-parchment-100 text-ink-700 hover:bg-parchment-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <FaChevronLeft className="w-4 h-4" />
        </button>

        {/* Page indicator dots */}
        <div className="flex items-center gap-1.5" role="tablist">
          {visibleDots.map((dot, idx) =>
            dot === "ellipsis" ? (
              <span key={`ellipsis-${idx}`} className="text-ink-700 text-xs px-0.5">
                ...
              </span>
            ) : (
              <span
                key={dot}
                role="tab"
                aria-selected={dot === currentPage}
                className={
                  dot === currentPage
                    ? "w-2.5 h-2.5 rounded-full bg-accent-500"
                    : "w-2 h-2 rounded-full bg-parchment-200"
                }
              />
            )
          )}
        </div>

        <button
          onClick={nextPage}
          disabled={currentPage === totalPages - 1}
          aria-label="Next page"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-parchment-100 text-ink-700 hover:bg-parchment-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <FaChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
