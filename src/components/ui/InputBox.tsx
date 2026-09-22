'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';

interface InputBoxProps {
  onSubmit: (input: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function InputBox({ onSubmit, disabled, placeholder = 'Escribe tu acción...' }: InputBoxProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showDice, setShowDice] = useState(false);
  const [manualDice, setManualDice] = useState<{ r1: number; r2: number; total: number } | null>(null);
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

  const rollManualDice = () => {
    const r1 = Math.floor(Math.random() * 6) + 1;
    const r2 = Math.floor(Math.random() * 6) + 1;
    setManualDice({ r1, r2, total: r1 + r2 });
  };

  return (
    <div className="space-y-2">
      {showDice && (
        <div className="fmab-input-area bg-fmab-card border border-fmab-border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-fmab-gold tracking-wider">DADOS MANUALES (2D6)</span>
            <button onClick={() => { setShowDice(false); setManualDice(null); }} className="text-fmab-steel hover:text-fmab-parchment text-xs">✕</button>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={rollManualDice}
              className="px-4 py-2 bg-fmab-red text-fmab-parchment font-bold font-mono text-sm rounded hover:bg-fmab-redLight transition-colors"
            >
              🎲 TIRAR
            </button>
            {manualDice && (
              <div className="flex items-center gap-3 font-mono">
                <span className="text-fmab-parchment text-lg">[{manualDice.r1}] + [{manualDice.r2}]</span>
                <span className="text-fmab-gold font-bold text-xl">= {manualDice.total}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  manualDice.total >= 10 ? 'bg-green-900 text-green-300' :
                  manualDice.total >= 7 ? 'bg-yellow-900 text-yellow-300' :
                  'bg-red-900 text-red-300'
                }`}>
                  {manualDice.total >= 10 ? 'ÉXITO' : manualDice.total >= 7 ? 'COSTO' : 'FALLO'}
                </span>
              </div>
            )}
          </div>
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
            disabled={disabled}
            placeholder={placeholder}
            className="flex-1 bg-fmab-darker border border-fmab-border rounded px-3 py-2 text-fmab-parchment placeholder-fmab-steel focus:outline-none focus:ring-2 focus:ring-fmab-gold font-mono text-sm disabled:opacity-50"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setShowDice(!showDice)}
            className="px-3 py-2 bg-fmab-darker border border-fmab-border text-fmab-gold font-mono text-sm rounded hover:bg-fmab-card transition-colors"
            title="Dados manuales"
          >
            🎲
          </button>
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="px-4 py-2 bg-fmab-gold text-fmab-darker font-bold font-mono text-sm rounded hover:bg-fmab-goldLight transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ACTUAR
          </button>
        </div>
        {disabled && <p className="text-xs text-fmab-red mt-1">Esperando respuesta del narrador...</p>}
      </form>
    </div>
  );
}
