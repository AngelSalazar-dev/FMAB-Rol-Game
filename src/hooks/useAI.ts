'use client';

import { useState, useCallback } from 'react';

export function useAI() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateNarrative = useCallback(async (prompt: string): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error('Error generando narrativa');

      const data = await response.json();
      return data.narrative;
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Error desconocido';
      setError(err);
      return 'El narrador no responde. La realidad se desvanece.';
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generateNarrative, isGenerating, error };
}