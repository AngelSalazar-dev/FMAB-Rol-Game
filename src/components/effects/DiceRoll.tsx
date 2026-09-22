'use client';

import { useState, useEffect, useCallback } from 'react';

interface DiceRollProps {
  result: { roll1: number; roll2: number; modifier: number; total: number; outcome: string; advantage?: boolean; disadvantage?: boolean; critical?: boolean; fumble?: boolean } | null;
  onComplete?: () => void;
}

const DIE_SVG = (value: number, color: string) => (
  <svg viewBox="0 0 100 100" className="w-20 h-20">
    <rect x="5" y="5" width="90" height="90" rx="12" fill="#1a1a2e" stroke={color} strokeWidth="3" />
    {value === 1 && <circle cx="50" cy="50" r="8" fill={color} />}
    {value === 2 && (
      <>
        <circle cx="30" cy="30" r="8" fill={color} />
        <circle cx="70" cy="70" r="8" fill={color} />
      </>
    )}
    {value === 3 && (
      <>
        <circle cx="30" cy="30" r="8" fill={color} />
        <circle cx="50" cy="50" r="8" fill={color} />
        <circle cx="70" cy="70" r="8" fill={color} />
      </>
    )}
    {value === 4 && (
      <>
        <circle cx="30" cy="30" r="8" fill={color} />
        <circle cx="70" cy="30" r="8" fill={color} />
        <circle cx="30" cy="70" r="8" fill={color} />
        <circle cx="70" cy="70" r="8" fill={color} />
      </>
    )}
    {value === 5 && (
      <>
        <circle cx="30" cy="30" r="8" fill={color} />
        <circle cx="70" cy="30" r="8" fill={color} />
        <circle cx="50" cy="50" r="8" fill={color} />
        <circle cx="30" cy="70" r="8" fill={color} />
        <circle cx="70" cy="70" r="8" fill={color} />
      </>
    )}
    {value === 6 && (
      <>
        <circle cx="30" cy="25" r="8" fill={color} />
        <circle cx="70" cy="25" r="8" fill={color} />
        <circle cx="30" cy="50" r="8" fill={color} />
        <circle cx="70" cy="50" r="8" fill={color} />
        <circle cx="30" cy="75" r="8" fill={color} />
        <circle cx="70" cy="75" r="8" fill={color} />
      </>
    )}
  </svg>
);

export function DiceRoll({ result, onComplete }: DiceRollProps) {
  const [phase, setPhase] = useState<'rolling' | 'result'>('rolling');
  const [die1, setDie1] = useState(1);
  const [die2, setDie2] = useState(1);
  const [shake, setShake] = useState(true);

  const dismiss = useCallback(() => {
    if (phase === 'result' && onComplete) onComplete();
  }, [phase, onComplete]);

  useEffect(() => {
    if (!result) return;

    let rolls = 0;
    const interval = setInterval(() => {
      setDie1(Math.floor(Math.random() * 6) + 1);
      setDie2(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls >= 12) {
        clearInterval(interval);
        setDie1(result.roll1);
        setDie2(result.roll2);
        setShake(false);
        setTimeout(() => setPhase('result'), 200);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [result]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dismiss]);

  useEffect(() => {
    if (phase === 'result' && onComplete) {
      const t = setTimeout(onComplete, 3000);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  if (!result) return null;

  const outcomeColors: Record<string, string> = {
    complete: '#22c55e',
    partial: '#eab308',
    miss: '#ef4444',
  };

  const outcomeLabels: Record<string, string> = {
    complete: 'ÉXITO COMPLETO',
    partial: 'ÉXITO CON COSTO',
    miss: 'FALLO',
  };

  const borderColor = outcomeColors[result.outcome] || '#d4af37';
  const isCritDouble = result.roll1 === result.roll2;
  const glowClass = phase === 'result' ? 'shadow-lg' : '';

  return (
    <div
      className="fixed bottom-4 right-4 z-50 animate-slide-up cursor-pointer"
      onClick={dismiss}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && dismiss()}
    >
      <div
        className={`bg-fmab-card border-2 rounded-xl p-6 text-center ${glowClass} transition-all duration-300`}
        style={{ borderColor, boxShadow: `0 0 20px ${borderColor}40` }}
      >
        <div className="flex gap-3 justify-center mb-4">
          <div className={`${shake ? 'animate-bounce' : 'animate-jello'}`}>
            {DIE_SVG(die1, borderColor)}
          </div>
          <span className="self-center text-3xl text-fmab-gold font-bold">+</span>
          <div className={`${shake ? 'animate-bounce' : 'animate-jello'}`} style={{ animationDelay: '0.1s' }}>
            {DIE_SVG(die2, borderColor)}
          </div>
        </div>

        {phase === 'result' && (
          <div className="space-y-2">
            <div className="font-mono text-lg text-fmab-parchment">
              {result.roll1} + {result.roll2}
              {result.modifier !== 0 && (
                <span> {result.modifier >= 0 ? '+' : ''}{result.modifier}</span>
              )}
              {' = '}<span className="text-fmab-gold font-bold">{result.total}</span>
            </div>
            <div className="font-serif text-xl font-bold" style={{ color: borderColor }}>
              {outcomeLabels[result.outcome]}
            </div>
            {isCritDouble && (
              <div className="text-fmab-gold text-sm font-mono">
                {result.roll1 === 6 ? '★ CRÍTICO DOBLE ★' : result.roll1 === 1 ? '✗ PIFIA DOBLE ✗' : `DOBLES: ${result.roll1}`}
              </div>
            )}
            {result.advantage && <div className="text-green-400 text-sm">↑ Ventaja</div>}
            {result.disadvantage && <div className="text-red-400 text-sm">↓ Desventaja</div>}
          </div>
        )}
      </div>
    </div>
  );
}
