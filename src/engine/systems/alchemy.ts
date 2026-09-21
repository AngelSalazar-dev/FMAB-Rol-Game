import type { GameState, ParsedAction, DiceResult, Injury, GameStateChanges } from '@/types/game';
import { getOutcomeLabel } from '../core/dice';
import { extractMaterialFromInput } from './inventory';

const MATERIAL_COSTS: Record<string, number> = {
  hierro: 10, acero: 15, tierra: 5, arena: 3, piedra: 8,
  madera: 5, agua: 2, aire: 1, fuego: 3, plomo: 12,
  cobre: 10, plata: 20, oro: 50, carbón: 4, azufre: 6, sal: 2,
};

const TRANSMUTATION_DIFFICULTY: Record<string, number> = {
  simple: 0,
  moderate: -1,
  complex: -2,
  advanced: -3,
};

function hasCircle(state: GameState): boolean {
  return state.character.seenGate ||
    state.inventory.some(i => i.name.toLowerCase().includes('tiza')) ||
    state.inventory.some(i => i.name.toLowerCase().includes('guante')) ||
    (state.character.appearance.automail?.includes('círculo') ?? false);
}

function hasPhilosophersStone(state: GameState): boolean {
  return state.inventory.some(i => i.name.toLowerCase().includes('piedra filosofal'));
}

function getTransmutationComplexity(input: string): keyof typeof TRANSMUTATION_DIFFICULTY {
  const lower = input.toLowerCase();
  if (lower.includes('complejo') || lower.includes('avanzado') || lower.includes('humano') || lower.includes('quím')) return 'advanced';
  if (lower.includes('moderado') || lower.includes('arma') || lower.includes('estructura')) return 'complex';
  if (lower.includes('simple') || lower.includes('básico') || lower.includes('pequeño')) return 'simple';
  return 'moderate';
}

export function processAlchemy(parsed: ParsedAction, dice: DiceResult, state: GameState) {
  const details: string[] = [];
  const changes: GameStateChanges = {};

  const material = parsed.material || extractMaterialFromInput(parsed.raw);
  if (!material) {
    return {
      success: false,
      outcome: 'miss' as const,
      changes: {},
      details: ['No especificaste qué material transmutar.'],
    };
  }

  const hasMat = state.inventory.some(i => i.name.toLowerCase() === material && i.quantity >= (MATERIAL_COSTS[material] || 5));
  if (!hasMat && !hasPhilosophersStone(state)) {
    return {
      success: false,
      outcome: 'miss' as const,
      changes: {},
      details: [`No tienes suficiente ${material} para transmutar.`],
    };
  }

  const hasC = hasCircle(state);
  if (!hasC && !state.character.seenGate) {
    return {
      success: false,
      outcome: 'miss' as const,
      changes: { stress: 15 },
      details: ['Intentas transmutar sin círculo ni haber visto la Puerta. ¡Rebote alquímico!'],
    };
  }

  const complexity = getTransmutationComplexity(parsed.raw);
  const difficultyMod = TRANSMUTATION_DIFFICULTY[complexity];
  const adjustedTotal = dice.total + difficultyMod;

  let outcome: 'complete' | 'partial' | 'miss';
  if (adjustedTotal >= 10) outcome = 'complete';
  else if (adjustedTotal >= 7) outcome = 'partial';
  else outcome = 'miss';

  if (hasPhilosophersStone(state)) {
    outcome = 'complete';
    details.push('La Piedra Filosofal brilla en tu mano. El costo de la materia es nulo.');
    changes.sanity = 15;
  } else {
    const cost = MATERIAL_COSTS[material] || 5;
    changes.inventory = { remove: { name: material, quantity: cost } };
    details.push(`Consumes ${cost} unidades de ${material}.`);
  }

  let stressCost = 0;
  let sanityCost = 0;
  let injury: Injury | null = null;

  switch (outcome) {
    case 'complete':
      stressCost = 5;
      details.push('Transmutación perfecta. La materia obedece a tu voluntad.');
      break;
    case 'partial':
      stressCost = 10;
      details.push('La transmutación funciona, pero algo no sale como planeabas.');
      if (Math.random() < 0.3) {
        injury = {
          id: crypto.randomUUID(),
          bodyPart: 'left_arm',
          type: 'burn',
          severity: 'light',
          treated: false,
          isAutomail: false,
        };
changes.injury = injury;
        details.push('Sufres una quemadura leve en las manos.');
      }
      break;
    case 'miss':
      stressCost = 20;
      sanityCost = 5;
      injury = {
        id: crypto.randomUUID(),
        bodyPart: 'left_arm',
        type: 'burn',
        severity: Math.random() < 0.5 ? 'moderate' : 'severe',
        treated: false,
        isAutomail: false,
      };
      changes.injury = injury;
      details.push('¡REBOTE ALQUÍMICO! La energía se vuelve contra ti.');
      if (!state.character.seenGate) {
        details.push('No haber visto la Puerta te cuesta caro.');
      }
      break;
  }

  changes.stress = stressCost;
  if (sanityCost > 0) changes.sanity = sanityCost;

  if (parsed.raw.toLowerCase().includes('humano') || parsed.raw.toLowerCase().includes('alma')) {
    changes.sanity = (changes.sanity || 0) + 20;
    details.push('La transmutación humana corroe tu cordura.');
  }

  return {
    success: outcome !== 'miss',
    outcome,
    changes,
    details,
  };
}