'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, DiceResult, PendingDice } from '@/types/game';
import { INITIAL_STATE } from '@/engine/core/state';

type GameMessage = { role: 'user' | 'assistant'; content: string };

export function useGame(initialState?: GameState, characterId?: number, initialMessages?: GameMessage[]) {
  const [state, setState] = useState<GameState>(initialState || INITIAL_STATE);
  const [messages, setMessages] = useState<GameMessage[]>(initialMessages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [lastDice, setLastDice] = useState<DiceResult | null>(null);
  const [lastOutcome, setLastOutcome] = useState<'complete' | 'partial' | 'miss' | null>(null);
  const [pendingDice, setPendingDice] = useState<PendingDice | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    if (initialState && initialState.character.id !== 0 && initialState.character.id !== state.character.id) {
      setState(initialState);
    }
  }, [initialState?.character?.id]);

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0 && messages.length === 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const saveGame = useCallback(async (gameState: GameState, currentMessages: GameMessage[]) => {
    if (!characterId) return;
    try {
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, state: gameState, messages: currentMessages }),
      });
    } catch (e) {
      console.error('Error saving game:', e);
    }
  }, [characterId]);

  const getRecentNarratives = useCallback((msgs: GameMessage[]): string[] => {
    return msgs
      .filter(m => m.role === 'assistant')
      .slice(-2)
      .map(m => m.content);
  }, []);

  const sendAction = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage = { role: 'user' as const, content: input };
    const newMessages = [...messagesRef.current, userMessage];
    setMessages(newMessages);

    try {
      const recentNarratives = getRecentNarratives(messagesRef.current);
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: input, state: stateRef.current, recentNarratives }),
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await response.json();

      // If there's a pendingDice, store it and wait for user to roll
      if (data.pendingDice) {
        setPendingDice(data.pendingDice);
        const assistantMessage = { role: 'assistant' as const, content: data.narrative };
        setMessages([...newMessages, assistantMessage]);
        setIsLoading(false);
        return;
      }

      const newState = data.stateChanges as GameState;
      setState(newState);
      const assistantMessage = { role: 'assistant' as const, content: data.narrative };
      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      setLastDice(data.diceResult || null);
      setLastOutcome(data.outcome);

      // Auto-save after each action
      await saveGame(newState, updatedMessages);
    } catch (error) {
      console.error('Error processing action:', error);
      const errorMessage = { role: 'assistant' as const, content: 'Algo salió mal. El narrador guarda silencio.' };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, saveGame, getRecentNarratives]);

  const rollDiceAndResolve = useCallback(async (diceResult: DiceResult) => {
    if (!pendingDice || isLoading) return;

    setIsLoading(true);
    
    try {
      const recentNarratives = getRecentNarratives(messagesRef.current);
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pendingDice, 
          diceResult,
          state: stateRef.current,
          recentNarratives,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al resolver los dados');
      }

      const data = await response.json();
      const newState = data.stateChanges as GameState;
      setState(newState);
      
      const assistantMessage = { role: 'assistant' as const, content: data.narrative };
      const updatedMessages = [...messagesRef.current, assistantMessage];
      setMessages(updatedMessages);
      setLastDice(data.diceResult || null);
      setLastOutcome(data.outcome);
      setPendingDice(null);

      // Auto-save after each action
      await saveGame(newState, updatedMessages);
    } catch (error) {
      console.error('Error resolving dice:', error);
      const errorMessage = { role: 'assistant' as const, content: 'Error al resolver los dados.' };
      setMessages([...messagesRef.current, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [pendingDice, isLoading, saveGame, getRecentNarratives]);

  const resetGame = useCallback((newState?: GameState) => {
    setState(newState || INITIAL_STATE);
    setMessages([]);
    setLastDice(null);
    setLastOutcome(null);
    setPendingDice(null);
  }, []);

  return {
    state,
    messages,
    isLoading,
    lastDice,
    lastOutcome,
    pendingDice,
    sendAction,
    rollDiceAndResolve,
    resetGame,
  };
}
