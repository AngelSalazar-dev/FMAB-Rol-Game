import type { DiceResult } from '@/types/game';

export type { DiceResult };

export type DifficultyTier = 'easy' | 'normal' | 'hard' | 'extreme';

const DIFFICULTY_THRESHOLDS: Record<DifficultyTier, { complete: number; partial: number }> = {
  easy:    { complete: 12, partial: 9 },
  normal:  { complete: 10, partial: 7 },
  hard:    { complete: 8,  partial: 5 },
  extreme: { complete: 6,  partial: 3 },
};

export function rollDice(modifier: number = 0, difficulty: DifficultyTier = 'normal'): DiceResult {
  const roll1 = Math.floor(Math.random() * 6) + 1;
  const roll2 = Math.floor(Math.random() * 6) + 1;
  const raw = roll1 + roll2;
  const total = raw + modifier;

  // Critical/fumble on doubles
  if (roll1 === roll2) {
    if (roll1 === 6) {
      return { total, roll1, roll2, modifier, outcome: 'complete', critical: true };
    }
    if (roll1 === 1) {
      return { total, roll1, roll2, modifier, outcome: 'miss', fumble: true };
    }
  }

  const thresholds = DIFFICULTY_THRESHOLDS[difficulty];
  let outcome: DiceResult['outcome'];
  if (total >= thresholds.complete) outcome = 'complete';
  else if (total >= thresholds.partial) outcome = 'partial';
  else outcome = 'miss';

  return { total, roll1, roll2, modifier, outcome };
}

export function rollWithAdvantage(modifier: number = 0, difficulty: DifficultyTier = 'normal'): DiceResult {
  const r1 = rollDice(modifier, difficulty);
  const r2 = rollDice(modifier, difficulty);
  // Keep the better result (higher total, or better outcome)
  if (r2.total > r1.total) return { ...r2, advantage: true };
  return { ...r1, advantage: true };
}

export function rollWithDisadvantage(modifier: number = 0, difficulty: DifficultyTier = 'normal'): DiceResult {
  const r1 = rollDice(modifier, difficulty);
  const r2 = rollDice(modifier, difficulty);
  // Keep the worse result
  if (r1.total > r2.total) return { ...r2, disadvantage: true };
  return { ...r1, disadvantage: true };
}

export function rollDiceMultiple(count: number, modifier: number = 0, difficulty: DifficultyTier = 'normal'): DiceResult[] {
  return Array.from({ length: count }, () => rollDice(modifier, difficulty));
}

export function getOutcomeLabel(outcome: DiceResult['outcome']): string {
  switch (outcome) {
    case 'complete': return 'Éxito Completo';
    case 'partial': return 'Éxito con Costo';
    case 'miss': return 'Fallo / Consecuencia Dura';
  }
}

export function getOutcomeColor(outcome: DiceResult['outcome']): string {
  switch (outcome) {
    case 'complete': return 'text-green-400';
    case 'partial': return 'text-yellow-400';
    case 'miss': return 'text-red-400';
  }
}
