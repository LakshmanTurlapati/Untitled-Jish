import { useState, useCallback } from 'react';

interface UseShlokaHintsReturn {
  hints: string;
  isLoading: boolean;
  error: string | null;
  requestHints: (shlokaText: string, userInterpretation: string) => Promise<void>;
  reset: () => void;
}

export function useShlokaHints(): UseShlokaHintsReturn {
  const [hints, setHints] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestHints = useCallback(async (shlokaText: string, userInterpretation: string) => {
    setIsLoading(true);
    setError(null);
    setHints('');

    try {
      const res = await fetch('/api/hints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shlokaText, userInterpretation }),
      });

      if (!res.ok) throw new Error('Failed to fetch hints');
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Parse AI SDK data stream format
        // Lines starting with "0:" contain text chunks (JSON-encoded strings)
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2));
              accumulated += text;
              setHints(accumulated);
            } catch {
              /* skip non-JSON lines */
            }
          }
        }
      }
    } catch {
      setError('Could not load hints right now. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setHints('');
    setError(null);
    setIsLoading(false);
  }, []);

  return { hints, isLoading, error, requestHints, reset };
}
