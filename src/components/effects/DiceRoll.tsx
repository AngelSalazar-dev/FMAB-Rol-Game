'use client';

interface DiceRollProps {
  result: { roll1: number; roll2: number; modifier: number; total: number; outcome: string } | null;
  onComplete?: () => void;
}

const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function DiceRoll({ result, onComplete }: DiceRollProps) {
  if (!result) return null;

  const [phase, setPhase] = useState<'rolling' | 'result'>('rolling');
  const [die1, setDie1] = useState(1);
  const [die2, setDie2] = useState(1);

  useEffect(() => {
    let rolls = 0;
    const interval = setInterval(() => {
      setDie1(Math.floor(Math.random() * 6) + 1);
      setDie2(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls >= 10) {
        clearInterval(interval);
        setDie1(result.roll1);
        setDie2(result.roll2);
        setTimeout(() => setPhase('result'), 300);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [result]);

  useEffect(() => {
    if (phase === 'result' && onComplete) {
      const t = setTimeout(onComplete, 2000);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  const outcomeColors: Record<string, string> = {
    complete: 'text-green-400',
    partial: 'text-yellow-400',
    miss: 'text-red-400',
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-fmab-card border-2 border-fmab-gold rounded-xl p-8 text-center animate-slide-up">
        <div className="flex gap-4 justify-center mb-6">
          <div className="w-20 h-20 bg-fmab-darker border-2 border-fmab-gold rounded-xl flex items-center justify-center text-5xl font-mono animate-bounce">
            {phase === 'rolling' ? '⚀' : FACES[die1 - 1]}
          </div>
          <span className="self-center text-4xl text-fmab-gold font-bold">+</span>
          <div className="w-20 h-20 bg-fmab-darker border-2 border-fmab-gold rounded-xl flex items-center justify-center text-5xl font-mono animate-bounce" style={{ animationDelay: '0.1s' }}>
            {phase === 'rolling' ? '⚀' : FACES[die2 - 1]}
          </div>
        </div>

        {phase === 'result' && (
          <div className="space-y-2">
            <div className="font-mono text-lg text-fmab-parchment">
              {result.roll1} + {result.roll2} {result.modifier >= 0 ? '+' : ''}{result.modifier} = <span className="text-fmab-gold">{result.total}</span>
            </div>
            <div className={`font-serif text-2xl font-bold ${outcomeColors[result.outcome]}`}>
              {result.outcome === 'complete' ? 'ÉXITO COMPLETO' : result.outcome === 'partial' ? 'ÉXITO CON COSTO' : 'FALLO / CONSECUENCIA DURA'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';