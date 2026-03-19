import { useState, useEffect, useCallback } from 'react';
import { getKaavya } from '../db/kaavyaStore';
import { getReadingState, saveReadingState } from '../db/readingStateStore';
import { paginateText } from '../utils/textPaginator';
import type { Kaavya } from '../types';

interface UseReaderReturn {
  kaavya: Kaavya | null;
  pages: string[];
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

export function useReader(kaavyaId: number | null): UseReaderReturn {
  const [kaavya, setKaavya] = useState<Kaavya | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load kaavya and restore reading state
  useEffect(() => {
    if (kaavyaId === null) return;
    setIsLoading(true);

    (async () => {
      const k = await getKaavya(kaavyaId);
      if (!k) { setIsLoading(false); return; }

      setKaavya(k);
      const paginatedPages = paginateText(k.rawText);
      setPages(paginatedPages);

      // Restore reading position
      const state = await getReadingState(kaavyaId);
      if (state && state.currentPage < paginatedPages.length) {
        setCurrentPage(state.currentPage);
      } else {
        setCurrentPage(0);
      }

      setIsLoading(false);
    })();
  }, [kaavyaId]);

  // Persist reading state on page change (debounced, not on initial load)
  useEffect(() => {
    if (kaavyaId === null || pages.length === 0 || isLoading) return;

    const timer = setTimeout(() => {
      saveReadingState(kaavyaId, currentPage, pages.length);
    }, 500);

    return () => clearTimeout(timer);
  }, [kaavyaId, currentPage, pages.length, isLoading]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, pages.length - 1)));
  }, [pages.length]);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, pages.length - 1));
  }, [pages.length]);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  }, [pages.length]);

  return {
    kaavya,
    pages,
    currentPage,
    totalPages: pages.length,
    isLoading,
    goToPage,
    nextPage,
    prevPage,
  };
}
