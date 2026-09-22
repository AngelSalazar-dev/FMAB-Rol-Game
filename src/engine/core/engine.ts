import type { GameState, ParsedAction, DiceResult, GameStateChanges } from '@/types/game';
import { rollDice, getOutcomeLabel } from './dice';
import { parseAction, getAttributeForAction } from './input';
import { applyStateChanges, getModifier, shouldRetire, isAlive, isInsane } from './state';
import { addStress, reduceSanity } from '@/engine/systems/stress';
import { addInjury, healInjury } from '@/engine/systems/health';
import { increaseSuspicion, changeReputation } from '@/engine/systems/factions';
import { updateLoyalty } from '@/engine/systems/companions';
import { addDecision } from '@/engine/systems/morality';
import { advanceClock, reduceClock, isClockComplete, Clock } from './clocks';
import { processAlchemy } from '@/engine/systems/alchemy';
import { processCombat } from '@/engine/systems/combat';
import { processStealth } from '@/engine/systems/stealth';
import { processSocial } from '@/engine/systems/social';
import { processExploration } from '@/engine/systems/exploration';
import { processInventory, addItem, removeItem } from '@/engine/systems/inventory';
import { processRest } from '@/engine/systems/downtime';
import { generateNarrative } from '@/engine/ai/router';
import { advanceTime } from '@/engine/systems/weather';

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

  let newState = applyStateChanges(state, mechanicalResult.changes as Partial<GameState>);

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
        // Check for clock completion
        if (isClockComplete(newState.clocks[clockIndex])) {
          handleClockCompletion(newState, newState.clocks[clockIndex], mechanicalResult.details);
        }
      }
    }
  }

  function handleClockCompletion(state: GameState, clock: Clock, details: string[]) {
    switch (clock.id) {
      case 'suspicion':
        details.push('⚠️ ¡SOSPECHA MÁXIMA! La Policía Militar te busca activamente.');
        state.factions.suspicion = 100;
        break;
      case 'disease':
        details.push('☠️ ¡INFECCIÓN CRÍTICA! Una herida no tratada se vuelve séptica.');
        state.health.current = Math.max(1, state.health.current - 20);
        break;
      case 'consequence':
        details.push('💥 ¡CONSECUENCIAS EN CASCADA! Algo terrible sucede.');
        state.stress = { ...state.stress, current: Math.min(state.stress.max, state.stress.current + 30) };
        break;
      case 'trust':
        details.push('💔 ¡CONFIANZA ROTA! Un compañero te abandona.');
        if (state.companions.length > 0) {
          const leaving = state.companions[0];
          state.companions = state.companions.slice(1);
          details.push(`${leaving.name} se ha ido.`);
        }
        break;
    }
    // Reset clock after completion
    const idx = state.clocks.findIndex(c => c.id === clock.id);
    if (idx !== -1) state.clocks[idx] = { ...clock, filled: 0 };
  }

  if (mechanicalResult.changes.inventory) {
    const inv = mechanicalResult.changes.inventory;
    if (inv.add) {
      newState.inventory = addItem(newState, inv.add).inventory;
    }
    if (inv.remove) {
      newState.inventory = removeItem(newState, inv.remove.name, inv.remove.quantity).inventory;
    }
  }

  if (mechanicalResult.changes.environment) {
    const env = mechanicalResult.changes.environment;
    if (env.terrain) newState.environment.terrain = env.terrain as typeof newState.environment.terrain;
  }

  if (mechanicalResult.changes.timeAdvanced) {
    newState = advanceTime(newState);
  }

  if (mechanicalResult.changes.combat) {
    const combat = mechanicalResult.changes.combat;
    if (combat.damage > 0 && newState.npcs.length > 0) {
      const targetIndex = newState.npcs.findIndex(n => n.isHostile);
      if (targetIndex !== -1) {
        const target = newState.npcs[targetIndex];
        const actualDamage = Math.max(1, combat.damage - target.armor);
        target.hp -= actualDamage;
        mechanicalResult.details.push(`${target.name} recibe ${actualDamage} de daño (HP: ${Math.max(0, target.hp)}/${target.maxHp}).`);
        if (target.hp <= 0) {
          mechanicalResult.details.push(`¡${target.name} ha sido derrotado!`);
          newState.npcs.splice(targetIndex, 1);
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
