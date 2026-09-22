'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import type { DiceResult } from '@/types/game';

interface InputBoxProps {
  onSubmit: (input: string) => void;
  onRollDice?: (result: DiceResult) => void;
  disabled?: boolean;
  pendingDice?: boolean;
  placeholder?: string;
}

export function InputBox({ onSubmit, onRollDice, disabled, pendingDice, placeholder = 'Escribe tu acción...' }: InputBoxProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showDicePanel, setShowDicePanel] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [diceResult, setDiceResult] = useState<DiceResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;

    onSubmit(input);
    setHistory(prev => [input, ...prev].slice(0, 50));
    setHistoryIndex(-1);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        setHistoryIndex(prev => prev + 1);
        setInput(history[historyIndex + 1]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        setHistoryIndex(prev => prev - 1);
        setInput(history[historyIndex - 1]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const handleRollDice = () => {
    setRolling(true);
    setDiceResult(null);
    
    // Animate rolling
    let rolls = 0;
    const interval = setInterval(() => {
      rolls++;
      if (rolls >= 10) {
        clearInterval(interval);
        const r1 = Math.floor(Math.random() * 6) + 1;
        const r2 = Math.floor(Math.random() * 6) + 1;
        const result: DiceResult = {
          roll1: r1,
          roll2: r2,
          modifier: 0,
          total: r1 + r2,
          outcome: (r1 + r2 >= 10) ? 'complete' : (r1 + r2 >= 7) ? 'partial' : 'miss',
        };
        setDiceResult(result);
        setRolling(false);
      }
    }, 80);
  };

  const handleConfirmRoll = () => {
    if (diceResult && onRollDice) {
      onRollDice(diceResult);
      setShowDicePanel(false);
      setDiceResult(null);
    }
  };

  return (
    <div className="space-y-2">
      {/* Dice Panel - shows when pendingDice is true */}
      {pendingDice && (
        <div className="fmab-input-area bg-fmab-card border-2 border-fmab-gold rounded-lg p-4 animate-pulse">
          <div className="text-center mb-3">
            <span className="font-mono text-sm text-fmab-gold tracking-wider">🎲 TIRA LOS DADOS</span>
          </div>
          
          {!showDicePanel ? (
            <div className="text-center">
              <button
                onClick={() => setShowDicePanel(true)}
                className="px-6 py-3 bg-fmab-gold text-fmab-darker font-bold font-mono rounded-lg hover:bg-fmab-goldLight transition-colors animate-bounce"
              >
                🎲 ABRIR DADOS
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center gap-4">
                <div className={`w-16 h-16 bg-fmab-darker border-2 border-fmab-gold rounded-xl flex items-center justify-center text-3xl font-mono ${rolling ? 'animate-bounce' : ''}`}>
                  {rolling ? '🎲' : diceResult ? ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][diceResult.roll1 - 1] : '?'}
                </div>
                <span className="self-center text-2xl text-fmab-gold font-bold">+</span>
                <div className={`w-16 h-16 bg-fmab-darker border-2 border-fmab-gold rounded-xl flex items-center justify-center text-3xl font-mono ${rolling ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.1s' }}>
                  {rolling ? '🎲' : diceResult ? ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][diceResult.roll2 - 1] : '?'}
                </div>
              </div>

              {diceResult && (
                <div className="text-center space-y-2">
                  <div className="font-mono text-lg text-fmab-parchment">
                    {diceResult.roll1} + {diceResult.roll2} = <span className="text-fmab-gold font-bold">{diceResult.total}</span>
                  </div>
                  <div className={`font-serif text-xl font-bold ${
                    diceResult.outcome === 'complete' ? 'text-green-400' :
                    diceResult.outcome === 'partial' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {diceResult.outcome === 'complete' ? 'ÉXITO COMPLETO' :
                     diceResult.outcome === 'partial' ? 'ÉXITO CON COSTO' : 'FALLO'}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                {!diceResult ? (
                  <button
                    onClick={handleRollDice}
                    disabled={rolling}
                    className="px-6 py-2 bg-fmab-red text-fmab-parchment font-bold font-mono rounded hover:bg-fmab-redLight transition-colors disabled:opacity-50"
                  >
                    {rolling ? 'LANZANDO...' : '🎲 TIRAR'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleRollDice}
                      className="px-4 py-2 border border-fmab-border text-fmab-parchment font-mono text-sm rounded hover:bg-fmab-darker"
                    >
                      REINTENTAR
                    </button>
                    <button
                      onClick={handleConfirmRoll}
                      className="px-6 py-2 bg-fmab-gold text-fmab-darker font-bold font-mono rounded hover:bg-fmab-goldLight transition-colors"
                    >
                      ✓ CONFIRMAR
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => { setShowDicePanel(false); setDiceResult(null); }}
                className="w-full text-center text-fmab-steel hover:text-fmab-parchment text-xs"
              >
                Cerrar panel
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="fmab-input-area bg-fmab-card border border-fmab-border rounded-lg p-3">
        <div className="flex gap-2">
          <span className="text-fmab-gold font-mono self-center mr-2">{'>'}{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || pendingDice}
            placeholder={pendingDice ? 'Tira los dados primero...' : placeholder}
            className="flex-1 bg-fmab-darker border border-fmab-border rounded px-3 py-2 text-fmab-parchment placeholder-fmab-steel focus:outline-none focus:ring-2 focus:ring-fmab-gold font-mono text-sm disabled:opacity-50"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={disabled || !input.trim() || pendingDice}
            className="px-4 py-2 bg-fmab-gold text-fmab-darker font-bold font-mono text-sm rounded hover:bg-fmab-goldLight transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ACTUAR
          </button>
        </div>
        {disabled && <p className="text-xs text-fmab-red mt-1">Esperando respuesta del narrador...</p>}
        {pendingDice && !disabled && <p className="text-xs text-fmab-gold mt-1">🎲 Abre el panel de dados para tirar</p>}
      </form>
    </div>
  );
}
