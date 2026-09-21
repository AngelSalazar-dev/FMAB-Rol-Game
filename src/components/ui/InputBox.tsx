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

  return (
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
          type="submit"
          disabled={disabled || !input.trim()}
          className="px-4 py-2 bg-fmab-gold text-fmab-darker font-bold font-mono text-sm rounded hover:bg-fmab-goldLight transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ACTUAR
        </button>
      </div>
      {disabled && <p className="text-xs text-fmab-red mt-1">Esperando respuesta del narrador...</p>}
    </form>
  );
}