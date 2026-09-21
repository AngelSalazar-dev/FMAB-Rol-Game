'use client';

import { useState, useCallback, useEffect } from 'react';
import type { GameState, ParsedAction, DiceResult } from '@/types/game';
import { INITIAL_STATE, createInitialState } from '@/engine/core/state';

export function useGame(initialState?: GameState) {
  const [state, setState] = useState<GameState>(initialState || INITIAL_STATE);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastDice, setLastDice] = useState<DiceResult | null>(null);
  const [lastOutcome, setLastOutcome] = useState<'complete' | 'partial' | 'miss' | null>(null);

  const sendAction = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: input }]);

    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, state }),
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await response.json();

      setState(data.stateChanges as GameState);
      setMessages(prev => [...prev, { role: 'assistant', content: data.narrative }]);
      setLastDice(data.diceResult || null);
      setLastOutcome(data.outcome);
    } catch (error) {
      console.error('Error processing action:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Algo salió mal. El narrador guarda silencio.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [state, isLoading]);

  const resetGame = useCallback((newState?: GameState) => {
    setState(newState || INITIAL_STATE);
    setMessages([]);
    setLastDice(null);
    setLastOutcome(null);
  }, []);

  return {
    state,
    messages,
    isLoading,
    lastDice,
    lastOutcome,
    sendAction,
    resetGame,
  };
}
