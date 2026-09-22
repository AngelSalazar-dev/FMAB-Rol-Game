'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, DiceResult } from '@/types/game';
import { INITIAL_STATE } from '@/engine/core/state';

export function useGame(initialState?: GameState, characterId?: number) {
  const [state, setState] = useState<GameState>(initialState || INITIAL_STATE);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastDice, setLastDice] = useState<DiceResult | null>(null);
  const [lastOutcome, setLastOutcome] = useState<'complete' | 'partial' | 'miss' | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (initialState && initialState.character.id !== 0 && initialState.character.id !== state.character.id) {
      setState(initialState);
    }
  }, [initialState?.character?.id]);

  const saveGame = useCallback(async (gameState: GameState) => {
    if (!characterId) return;
    try {
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, state: gameState }),
      });
    } catch (e) {
      console.error('Error saving game:', e);
    }
  }, [characterId]);

  const sendAction = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: input }]);

    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, state: stateRef.current }),
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await response.json();

      const newState = data.stateChanges as GameState;
      setState(newState);
      setMessages(prev => [...prev, { role: 'assistant', content: data.narrative }]);
      setLastDice(data.diceResult || null);
      setLastOutcome(data.outcome);

      // Auto-save after each action
      await saveGame(newState);
    } catch (error) {
      console.error('Error processing action:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Algo salió mal. El narrador guarda silencio.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, saveGame]);

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
