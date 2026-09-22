import type { GameState, ParsedAction, DiceResult, GameStateChanges } from '@/types/game';
import { getOutcomeLabel } from '../core/dice';
import { LOCATIONS, extractLocation } from '@/engine/data/locations';
import { spawnNPCsForLocation } from '@/engine/data/npcs';

export function processExploration(parsed: ParsedAction, dice: DiceResult, state: GameState) {
  const details: string[] = [];
  const changes: GameStateChanges = {};

  const lower = parsed.raw.toLowerCase();
  let intent: 'move' | 'search' | 'investigate' | 'travel' = 'move';

  if (lower.includes('busco') || lower.includes('buscar') || lower.includes('registro')) intent = 'search';
  else if (lower.includes('investig') || lower.includes('examin') || lower.includes('analiz')) intent = 'investigate';
  else if (lower.includes('viajo') || lower.includes('voy a') || lower.includes('me dirijo')) intent = 'travel';

  const outcome = dice.outcome;
  const currentLoc = LOCATIONS[state.location];

  details.push(`Ubicación actual: ${currentLoc?.name || state.location}`);
  details.push(`Intención: ${intent}`);
  details.push(`Tirada: ${dice.total} (${getOutcomeLabel(outcome)})`);

  if (intent === 'travel' || lower.includes('voy') || lower.includes('me muevo')) {
    const target = extractLocation(lower);
    if (target && currentLoc?.connections.includes(target)) {
      changes.location = target;
      const newLoc = LOCATIONS[target];
      details.push(`Te diriges a ${newLoc?.name}.`);
      details.push(newLoc?.description || '');
      changes.environment = { terrain: newLoc?.terrain || 'urban' };
      changes.clocks = { suspicion: 1 };
      // Spawn NPCs for new location
      changes.npcs = spawnNPCsForLocation(target, state.npcs);
      if (newLoc?.npcs && newLoc.npcs.length > 0) {
        details.push(`Presencias detectadas: ${newLoc.npcs.slice(0, 2).join(', ')}.`);
      }
    } else if (target) {
      details.push(`No hay camino directo a ${target} desde aquí.`);
      return { success: false, outcome: 'miss' as const, changes, details };
    } else {
      details.push('Lugares conectados: ' + currentLoc?.connections.join(', '));
    }
  } else if (intent === 'search') {
    if (outcome === 'complete') {
      const found = currentLoc?.materials[Math.floor(Math.random() * (currentLoc?.materials.length || 1))];
      if (found) {
        changes.inventory = { add: { name: found, quantity: Math.floor(Math.random() * 3) + 1, item_type: 'material', properties: {} } };
        details.push(`Encuentras ${found}.`);
      }
      details.push('Descubres una ruta oculta o un escondite.');
      changes.exploration = { found: true };
    } else if (outcome === 'partial') {
      details.push('Encuentras rastros, pero el material se te escapa o está dañado.');
      changes.stress = 5;
    } else {
      details.push('No encuentras nada. Pierdes tiempo.');
      changes.stress = 5;
    }
  } else if (intent === 'investigate') {
    if (outcome === 'complete') {
      details.push('Descubres información crucial: movimientos de tropas, secretos, debilidades.');
      changes.investigation = { success: true, info: 'critical' };
    } else if (outcome === 'partial') {
      details.push('Obtienes información fragmentada. Necesitas más tiempo.');
      changes.investigation = { success: true, info: 'partial' };
      changes.stress = 5;
    } else {
      details.push('Tu investigación alerta a alguien. Sospecha +10.');
      changes.suspicion = 10;
      changes.stress = 10;
    }
  } else {
    details.push(`${currentLoc?.name}: ${currentLoc?.description}`);
    details.push('Conexiones: ' + currentLoc?.connections.join(', '));
    details.push('Materiales disponibles: ' + currentLoc?.materials.join(', '));
    details.push(`Nivel de peligro: ${currentLoc?.danger}/10`);
  }

  return { success: outcome !== 'miss', outcome, changes, details };
}