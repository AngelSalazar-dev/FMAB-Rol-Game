import type { GameState, ParsedAction, DiceResult, GameStateChanges, PendingDice } from '@/types/game';
import { rollDice, getOutcomeLabel } from './dice';
import { parseAction, getAttributeForAction } from './input';
import { applyStateChanges, getModifier, shouldRetire, isAlive, isInsane } from './state';
import { addStress, reduceSanity } from '@/engine/systems/stress';
import { addInjury, healInjury } from '@/engine/systems/health';
import { increaseSuspicion, changeReputation } from '@/engine/systems/factions';
import { updateLoyalty, checkCompanionDeath } from '@/engine/systems/companions';
import { addDecision, getRandomMoralChoice } from '@/engine/systems/morality';
import { advanceClock, reduceClock, isClockComplete, Clock } from './clocks';
import { processAlchemy } from '@/engine/systems/alchemy';
import { processCombat, calculateDamage } from '@/engine/systems/combat';
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
  pendingDice?: { action: string; parsed: ParsedAction; modifier: number; state: GameState };
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
  const idx = state.clocks.findIndex(c => c.id === clock.id);
  if (idx !== -1) state.clocks[idx] = { ...clock, filled: 0 };
}

export async function processAction(input: string, state: GameState, recentNarratives?: string[]): Promise<GameResponse> {
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
  
  // Actions that don't require dice
  const noDiceTypes = ['inventory', 'moral'];
  if (noDiceTypes.includes(parsed.type)) {
    const attribute = getAttributeForAction(parsed, state);
    const modifier = getModifier(state, attribute);
    const dice = rollDice(modifier);
    const mechanicalResult = dispatchAction(parsed, dice, state);
    return resolveMechanicalResult(parsed, dice, state, mechanicalResult, input, recentNarratives);
  }

  // Actions that require dice - return pendingDice for manual roll
  const attribute = getAttributeForAction(parsed, state);
  const modifier = getModifier(state, attribute);
  
  return {
    narrative: '',
    stateChanges: {},
    actionType: parsed.type,
    outcome: 'miss',
    mechanicalDetails: [],
    pendingDice: {
      action: input,
      parsed,
      modifier,
      state,
    },
  };
}

export function formatDiceResult(dice: DiceResult): string {
  return `${dice.roll1} + ${dice.roll2} ${dice.modifier >= 0 ? '+' : ''}${dice.modifier} = ${dice.total} (${getOutcomeLabel(dice.outcome)})`;
}

// Resolve action with manual dice result
export async function resolveDiceAction(
  pendingDice: { action: string; parsed: ParsedAction; modifier: number; state: GameState },
  diceResult: DiceResult,
  state: GameState,
  recentNarratives?: string[]
): Promise<GameResponse> {
  const { parsed, modifier } = pendingDice;
  
  const dice: DiceResult = {
    ...diceResult,
    modifier,
    total: diceResult.roll1 + diceResult.roll2 + modifier,
    outcome: (diceResult.roll1 + diceResult.roll2 + modifier >= 10) ? 'complete' :
             (diceResult.roll1 + diceResult.roll2 + modifier >= 7) ? 'partial' : 'miss',
  };

  const mechanicalResult = dispatchAction(parsed, dice, state);
  return resolveMechanicalResult(parsed, dice, state, mechanicalResult, pendingDice.action, recentNarratives);
}

function processMoralResponse(parsed: ParsedAction, state: GameState) {
  const lower = parsed.raw.toLowerCase();
  const details: string[] = [];
  const changes: GameStateChanges = {};

  // Mercy dilemmas
  if (lower.includes('perdonar')) {
    changes.morality = { description: 'Perdonar la vida de un enemigo herido', choice: 'Perdonar', karmaChange: 15, consequences: ['Compasión', 'Puede arrepentirse después'] };
    changes.stress = -5;
    details.push('Eliges la compasión. El enemigo escapa.');
  } else if (lower.includes('ejecutar')) {
    changes.morality = { description: 'Ejecutar a un enemigo herido', choice: 'Ejecutar', karmaChange: -20, consequences: ['Crueldad', 'Reputación de verdugo'] };
    changes.stress = 10;
    details.push('No dejas testigos. El peso de tu decisión te persigue.');
  }
  // Truth/lie dilemmas
  else if (lower.includes('mentir')) {
    changes.morality = { description: 'Mentir para protegerse', choice: 'Mentir', karmaChange: -5, consequences: ['Engaño', 'Sospecha reducida'] };
    changes.suspicion = -10;
    details.push('Tu mentira es convincente. La sospecha baja.');
  } else if (lower.includes('verdad')) {
    changes.morality = { description: 'Decir la verdad arriesgándose', choice: 'Verdad', karmaChange: 10, consequences: ['Honestidad', 'Sospecha aumenta'] };
    changes.suspicion = 15;
    details.push('La verdad sale a la luz. La sospecha aumenta.');
  }
  // Sharing dilemmas
  else if (lower.includes('compartir')) {
    changes.morality = { description: 'Compartir recursos con un compañero', choice: 'Compartir', karmaChange: 10, consequences: ['Generosidad', 'Compañero agradecido'] };
    changes.companionLoyalty = { id: state.companions[0]?.id || '', change: 15 };
    details.push('Tu compañero agradece tu generosidad.');
  } else if (lower.includes('guardar')) {
    changes.morality = { description: 'Guardar recursos para uno mismo', choice: 'Guarda', karmaChange: -10, consequences: ['Egoísmo', 'Compañero decepcionado'] };
    changes.companionLoyalty = { id: state.companions[0]?.id || '', change: -10 };
    details.push('Tu compañero parece decepcionado.');
  }
  // Temptation dilemmas
  else if (lower.includes('resistir')) {
    changes.morality = { description: 'Resistir la tentación oscura', choice: 'Resistir', karmaChange: 15, consequences: ['Fortaleza mental', 'Cordura estable'] };
    changes.sanity = -5;
    details.push('Resistes la tentación. Tu mente se mantiene fuerte.');
  } else if (lower.includes('ceder')) {
    changes.morality = { description: 'Ceder a la tentación oscura', choice: 'Ceder', karmaChange: -25, consequences: ['Corrupción', 'Poder oscuro'] };
    changes.sanity = -20;
    changes.stress = 15;
    details.push('Cedes a la oscuridad. Sientes poder fluyendo, pero algo se rompe dentro.');
  }
  // Generic moral response
  else if (lower.includes('moral') || lower.includes('dilema') || lower.includes('decido')) {
    const choice = getRandomMoralChoice();
    details.push(`DILEMA MORAL: ${choice.description}`);
    choice.options.forEach((opt, i) => {
      details.push(`  ${i + 1}. ${opt.text} (Karma: ${opt.karma >= 0 ? '+' : ''}${opt.karma})`);
    });
    changes.moralChoice = choice;
    return { success: true, outcome: 'complete' as const, changes, details };
  }

  if (details.length === 0) {
    return { success: false, outcome: 'miss' as const, changes, details: ['Respuesta no reconocida. Intenta "perdonar", "ejecutar", "mentir", "verdad", "compartir", "guardar", "resistir" o "ceder".'] };
  }

  return { success: true, outcome: 'complete' as const, changes, details };
}

function generateMoralPrompt(state: GameState, parsed: ParsedAction, result: MechanicalResult): string | null {
  if (parsed.type === 'combat' && result.outcome === 'complete' && state.npcs.length > 0) {
    const target = state.npcs.find(n => n.isHostile && n.hp > 0 && n.hp < n.maxHp * 0.3);
    if (target && Math.random() < 0.4) {
      return `⚖️ DILEMA: ${target.name} está herido y vulnerable. ¿Le perdonas la vida? (Responde "perdonar" o "ejecutar")`;
    }
  }
  if (parsed.type === 'social' && state.factions.suspicion > 60 && Math.random() < 0.3) {
    return `⚖️ DILEMA: La sospecha es alta. ¿Mentir para protegerte o decir la verdad arriesgándote? (Responde "mentir" o "verdad")`;
  }
  if (parsed.type === 'inventory' && state.companions.length > 0) {
    const hurtCompanion = state.companions.find(c => c.loyalty < 50);
    if (hurtCompanion && Math.random() < 0.3) {
      return `⚖️ DILEMA: ${hurtCompanion.name} necesita ayuda pero tienes algo importante. ¿Compartir o guardar? (Responde "compartir" o "guardar")`;
    }
  }
  if (parsed.type === 'exploration' && state.sanity.current < 30 && Math.random() < 0.4) {
    return `⚖️ DILEMA: Tu cordura es baja. Sientes una extraña tentación en esta zona. ¿Resistir o ceder? (Responde "resistir" o "ceder")`;
  }
  if (state.morality.karma < -50 && Math.random() < 0.2) {
    return `⚖️ SEÑAL: Tu camino se oscurece. El karma es ${state.morality.karma}. Considera tus acciones.`;
  }
  if (state.morality.karma > 50 && Math.random() < 0.2) {
    return `⚖️ SEÑAL: Tu camino es noble. El karma es ${state.morality.karma}. Sigue así.`;
  }
  return null;
}

type MechanicalResult = {
  success: boolean;
  outcome: 'complete' | 'partial' | 'miss';
  changes: GameStateChanges;
  details: string[];
};

function dispatchAction(parsed: ParsedAction, dice: DiceResult, state: GameState): MechanicalResult {
  switch (parsed.type) {
    case 'alchemy': return processAlchemy(parsed, dice, state);
    case 'combat': return processCombat(parsed, dice, state);
    case 'stealth': return processStealth(parsed, dice, state);
    case 'social': return processSocial(parsed, dice, state);
    case 'exploration': return processExploration(parsed, dice, state);
    case 'inventory': return processInventory(parsed, dice, state);
    case 'rest': return processRest(parsed, dice, state);
    case 'moral': return processMoralResponse(parsed, state);
    default: return { success: false, outcome: 'miss', changes: {}, details: ['Acción no reconocida. Sé más específico.'] };
  }
}

async function resolveMechanicalResult(
  parsed: ParsedAction,
  dice: DiceResult,
  state: GameState,
  mechanicalResult: MechanicalResult,
  actionText: string,
  recentNarratives?: string[],
): Promise<GameResponse> {
  let newState = applyStateChanges(state, mechanicalResult.changes as Partial<GameState>);

  if (mechanicalResult.changes.stress) {
    newState.stress = addStress(newState.stress, mechanicalResult.changes.stress);
  }
  if (mechanicalResult.changes.sanity) {
    newState.sanity = reduceSanity(newState.sanity, mechanicalResult.changes.sanity);
  }
  if (mechanicalResult.changes.health) {
    newState.health = { ...newState.health, current: mechanicalResult.changes.health.current ?? newState.health.current };
  }
  if (mechanicalResult.changes.heal) {
    newState.health = {
      ...newState.health,
      current: Math.min(newState.health.max, newState.health.current + mechanicalResult.changes.heal),
    };
  }
  if (mechanicalResult.changes.injury) {
    newState.health = addInjury(newState.health, mechanicalResult.changes.injury);
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
    newState = checkCompanionDeath(newState);
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
        if (isClockComplete(newState.clocks[clockIndex])) {
          handleClockCompletion(newState, newState.clocks[clockIndex], mechanicalResult.details);
        }
      }
    }
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
        const newHp = target.hp - actualDamage;
        newState.npcs = [...newState.npcs];
        newState.npcs[targetIndex] = { ...target, hp: newHp };
        mechanicalResult.details.push(`${target.name} recibe ${actualDamage} de daño (HP: ${Math.max(0, newHp)}/${target.maxHp}).`);
        if (newHp <= 0) {
          mechanicalResult.details.push(`¡${target.name} ha sido derrotado!`);
          newState.npcs = newState.npcs.filter((_, i) => i !== targetIndex);
        }
      }
    }

    if (newState.npcs.length > 0 && combat.damage === 0) {
      const hostileIdx = newState.npcs.findIndex(n => n.isHostile);
      if (hostileIdx !== -1 && Math.random() < 0.5) {
        const enemy = newState.npcs[hostileIdx];
        const counterDice = rollDice(0);
        const enemyWeapon = { name: enemy.weapon || 'Garras', damage: enemy.damage || 15, range: 'melee' as const, type: 'physical' as const };
        const counterDamage = calculateDamage(enemyWeapon, counterDice, 'melee');
        if (counterDamage > 0) {
          newState.health = { ...newState.health, current: Math.max(0, newState.health.current - counterDamage) };
          mechanicalResult.details.push(`⚡ ${enemy.name} contraataca y causa ${counterDamage} de daño.`);
        } else {
          mechanicalResult.details.push(`${enemy.name} intenta contraatacar pero falla.`);
        }
      }
    }

    if (newState.companions.length > 0 && combat.damage > 0) {
      for (const companion of newState.companions) {
        if (companion.loyalty > 40 && Math.random() < 0.5) {
          const companionDamage = Math.floor(5 + companion.loyalty / 10);
          if (newState.npcs.length > 0) {
            const targetIdx = newState.npcs.findIndex(n => n.isHostile);
            if (targetIdx !== -1) {
              const t = newState.npcs[targetIdx];
              const dmg = Math.max(1, companionDamage - t.armor);
              const newT = { ...t, hp: t.hp - dmg };
              newState.npcs = [...newState.npcs];
              newState.npcs[targetIdx] = newT;
              mechanicalResult.details.push(`${companion.name} ataca y causa ${dmg} de daño adicional.`);
              if (newT.hp <= 0) {
                mechanicalResult.details.push(`¡${t.name} es derrotado por ${companion.name}!`);
                newState.npcs = newState.npcs.filter((_, i) => i !== targetIdx);
              }
            }
          }
        }
      }
    }
  }

  const moralPrompt = generateMoralPrompt(newState, parsed, mechanicalResult);
  if (moralPrompt) {
    mechanicalResult.details.push(moralPrompt);
  }

  const narrative = await generateNarrative({
    action: actionText,
    parsed,
    dice,
    mechanicalResult,
    state: newState,
    recentNarratives,
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
