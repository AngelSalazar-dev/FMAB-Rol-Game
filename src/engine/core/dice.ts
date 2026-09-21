export type DiceResult = {
  total: number;
  roll1: number;
  roll2: number;
  modifier: number;
  outcome: 'complete' | 'partial' | 'miss';
};

export function rollDice(modifier: number = 0): DiceResult {
  const roll1 = Math.floor(Math.random() * 6) + 1;
  const roll2 = Math.floor(Math.random() * 6) + 1;
  const total = roll1 + roll2 + modifier;

  let outcome: DiceResult['outcome'];
  if (total >= 10) outcome = 'complete';
  else if (total >= 7) outcome = 'partial';
  else outcome = 'miss';

  return { total, roll1, roll2, modifier, outcome };
}

export function rollDiceMultiple(count: number, modifier: number = 0): DiceResult[] {
  return Array.from({ length: count }, () => rollDice(modifier));
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