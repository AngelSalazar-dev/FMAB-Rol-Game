import type { GameState, ParsedAction, DiceResult, GameStateChanges } from '@/types/game';
import { getOutcomeLabel } from '../core/dice';

export function processStealth(parsed: ParsedAction, dice: DiceResult, state: GameState) {
  const details: string[] = [];
  const changes: GameStateChanges = {};

  const envMods = getEnvironmentModifiers(state.environment);
  const stealthMod = envMods.stealthBonus;
  const adjustedTotal = dice.total + stealthMod;

  let outcome: 'complete' | 'partial' | 'miss';
  if (adjustedTotal >= 10) outcome = 'complete';
  else if (adjustedTotal >= 7) outcome = 'partial';
  else outcome = 'miss';

  details.push(`Modificador de entorno (sigilo): ${stealthMod >= 0 ? '+' : ''}${stealthMod}`);
  details.push(`Tirada ajustada: ${adjustedTotal} (${getOutcomeLabel(outcome)})`);

  switch (outcome) {
    case 'complete':
      details.push('Te mueves como una sombra. Nadie te detecta.');
      changes.stealth = { hidden: true, advantage: true };
      break;
    case 'partial':
      details.push('Logras esconderte, pero algo te delata: un ruido, un reflejo, una sombra.');
      changes.stealth = { hidden: true, compromised: true };
      changes.stress = 5;
      break;
    case 'miss':
      details.push('Fallaste. Te descubren inmediatamente.');
      changes.stealth = { hidden: false, detected: true };
      changes.suspicion = 10;
      changes.stress = 10;
      break;
  }

  return { success: outcome !== 'miss', outcome, changes, details };
}

export function processPerception(parsed: ParsedAction, dice: DiceResult, state: GameState) {
  const details: string[] = [];
  const changes: GameStateChanges = {};

  const envMods = getEnvironmentModifiers(state.environment);
  const perceptionMod = envMods.visibility;
  const adjustedTotal = dice.total + perceptionMod;

  let outcome: 'complete' | 'partial' | 'miss';
  if (adjustedTotal >= 10) outcome = 'complete';
  else if (adjustedTotal >= 7) outcome = 'partial';
  else outcome = 'miss';

  details.push(`Modificador de entorno (percepción): ${perceptionMod >= 0 ? '+' : ''}${perceptionMod}`);
  details.push(`Tirada ajustada: ${adjustedTotal} (${getOutcomeLabel(outcome)})`);

  switch (outcome) {
    case 'complete':
      details.push('Notas cada detalle: huellas, olores, sonidos lejanos, una trampa oculta.');
      changes.perception = { alert: true, details: 'full' };
      break;
    case 'partial':
      details.push('Percibes algo, pero no todo. Una pista, un indicio.');
      changes.perception = { alert: true, details: 'partial' };
      break;
    case 'miss':
      details.push('No notas nada fuera de lo común. Algo te pasa desapercibido.');
      changes.perception = { alert: false, details: 'none' };
      break  }

  return { success: outcome !== 'miss', outcome, changes, details };
}

function getEnvironmentModifiers(env: GameState['environment']) {
  const mods = { visibility: 0, alchemyBonus: 0, stealthBonus: 0, automailPenalty: 0 };

  if (env.weather === 'rain') { mods.alchemyBonus += 1; mods.visibility -= 1; }
  if (env.weather === 'snow') { mods.automailPenalty += 2; mods.visibility -= 1; mods.stealthBonus += 1; }
  if (env.weather === 'fog') { mods.stealthBonus += 2; mods.visibility -= 2; }
  if (env.weather === 'storm') { mods.visibility -= 2; mods.stealthBonus += 1; }

  if (env.time === 'night') { mods.stealthBonus += 1; mods.visibility -= 1; }
  if (env.time === 'dawn' || env.time === 'dusk') { mods.visibility -= 1; }

  return mods;
}