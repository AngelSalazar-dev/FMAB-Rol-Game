import type { GameState, ParsedAction, DiceResult, GameStateChanges } from '@/types/game';
import { rollDice, getOutcomeLabel } from './dice';
import { parseAction, getAttributeForAction } from './input';
import { applyStateChanges, getModifier, shouldRetire, isAlive, isInsane } from './state';
import { addStress, reduceSanity } from '@/engine/systems/stress';
import { addInjury, healInjury } from '@/engine/systems/health';
import { increaseSuspicion, changeReputation } from '@/engine/systems/factions';
import { updateLoyalty } from '@/engine/systems/companions';
import { addDecision } from '@/engine/systems/morality';
import { advanceClock, reduceClock } from './clocks';
import { processAlchemy } from '@/engine/systems/alchemy';
import { processCombat } from '@/engine/systems/combat';
import { processStealth } from '@/engine/systems/stealth';
import { processSocial } from '@/engine/systems/social';
import { processExploration } from '@/engine/systems/exploration';
import { processInventory } from '@/engine/systems/inventory';
import { processRest } from '@/engine/systems/downtime';
import { generateNarrative } from '@/engine/ai/router';

export interface GameResponse {
  narrative: string;
  stateChanges: Partial<GameState>;
  diceResult?: DiceResult;
  actionType: string;
  outcome: 'complete' | 'partial' | 'miss';
  mechanicalDetails: string[];
}

export async function processAction(input: string, state: GameState): Promise<GameResponse> {
  if (!isAlive(state) || isInsane(state)) {
    return {
      narrative: shouldRetire(state)
        ? 'Tu historia ha terminado. Demasiado trauma, locura o la muerte te ha reclamado.'
        : 'No puedes actuar en tu estado actual.',
      stateChanges: {},
      actionType: 'none',
      outcome: 'miss',
      mechanicalDetails: [],
    };
  }

  const parsed = parseAction(input, state);
  const attribute = getAttributeForAction(parsed, state);
  const modifier = getModifier(state, attribute);
  const dice = rollDice(modifier);

  let mechanicalResult: {
    success: boolean;
    outcome: 'complete' | 'partial' | 'miss';
    changes: GameStateChanges;
    details: string[];
  };

  switch (parsed.type) {
    case 'alchemy':
      mechanicalResult = processAlchemy(parsed, dice, state);
      break;
    case 'combat':
      mechanicalResult = processCombat(parsed, dice, state);
      break;
    case 'stealth':
      mechanicalResult = processStealth(parsed, dice, state);
      break;
    case 'social':
      mechanicalResult = processSocial(parsed, dice, state);
      break;
    case 'exploration':
      mechanicalResult = processExploration(parsed, dice, state);
      break;
    case 'inventory':
      mechanicalResult = processInventory(parsed, dice, state);
      break;
    case 'rest':
      mechanicalResult = processRest(parsed, dice, state);
      break;
    default:
      mechanicalResult = {
        success: false,
        outcome: 'miss',
        changes: {},
        details: ['Acción no reconocida. Sé más específico.'],
      };
  }

  const newState = applyStateChanges(state, mechanicalResult.changes as Partial<GameState>);

  if (mechanicalResult.changes.stress) {
    newState.stress = addStress(newState.stress, mechanicalResult.changes.stress);
  }
  if (mechanicalResult.changes.sanity) {
    newState.sanity = reduceSanity(newState.sanity, mechanicalResult.changes.sanity);
  }
  if (mechanicalResult.changes.injury) {
    newState.health = addInjury(newState.health, mechanicalResult.changes.injury);
  }
  if (mechanicalResult.changes.heal) {
    newState.health = {
      ...newState.health,
      current: Math.min(newState.health.max, newState.health.current + mechanicalResult.changes.heal),
    };
  }
  if (mechanicalResult.changes.health) {
    newState.health = mechanicalResult.changes.health;
  }
  if (mechanicalResult.changes.suspicion) {
    newState.factions = increaseSuspicion(newState.factions, mechanicalResult.changes.suspicion);
  }
  if (mechanicalResult.changes.reputation) {
    newState.factions = changeReputation(
      newState.factions,
      mechanicalResult.changes.reputation.faction as 'military' | 'ishvalan' | 'resistance' | 'state',
      mechanicalResult.changes.reputation.amount
    );
  }
  if (mechanicalResult.changes.companionLoyalty) {
    newState.companions = newState.companions.map(c =>
      c.id === mechanicalResult.changes.companionLoyalty!.id
        ? updateLoyalty(c, mechanicalResult.changes.companionLoyalty!.change)
        : c
    );
  }
  if (mechanicalResult.changes.morality) {
    newState.morality = addDecision(newState.morality, mechanicalResult.changes.morality);
  }

  if (mechanicalResult.changes.clocks) {
    for (const [clockId, segments] of Object.entries(mechanicalResult.changes.clocks)) {
      const clockIndex = newState.clocks.findIndex(c => c.id === clockId);
      if (clockIndex !== -1) {
        if (segments >= 0) {
          newState.clocks[clockIndex] = advanceClock(newState.clocks[clockIndex], segments);
        } else {
          newState.clocks[clockIndex] = reduceClock(newState.clocks[clockIndex], Math.abs(segments));
        }
      }
    }
  }

  const narrative = await generateNarrative({
    action: input,
    parsed,
    dice,
    mechanicalResult,
    state: newState,
  });

  return {
    narrative,
    stateChanges: { ...newState },
    diceResult: dice,
    actionType: parsed.type,
    outcome: mechanicalResult.outcome,
    mechanicalDetails: mechanicalResult.details,
  };
}

export function formatDiceResult(dice: DiceResult): string {
  return `${dice.roll1} + ${dice.roll2} ${dice.modifier >= 0 ? '+' : ''}${dice.modifier} = ${dice.total} (${getOutcomeLabel(dice.outcome)})`;
}
