import type { GameState, ParsedAction, DiceResult, GameStateChanges } from '@/types/game';
import { getOutcomeLabel } from '../core/dice';

const DOWNTIME_ACTIVITIES = [
  { id: 'heal', name: 'Curar heridas', description: 'Trata tus heridas y recupera salud.', cost: 0 },
  { id: 'maintain', name: 'Mantenimiento Automail', description: 'Revisa y repara tus partes de automail.', cost: 0 },
  { id: 'relax', name: 'Relajarse', description: 'Reduce el estrés mediante descanso, meditación o vicio.', cost: 0 },
  { id: 'research', name: 'Investigar', description: 'Busca información en archivos, rumores o contactos.', cost: 0 },
  { id: 'train', name: 'Entrenar', description: 'Mejora una habilidad o atributo.', cost: 0 },
  { id: 'work', name: 'Trabajar', description: 'Gana dinero o recursos.', cost: 0 },
] as const;

export function processRest(parsed: ParsedAction, dice: DiceResult, state: GameState) {
  const details: string[] = [];
  const changes: GameStateChanges = {};

  const lower = parsed.raw.toLowerCase();
  let activity = DOWNTIME_ACTIVITIES.find(a => lower.includes(a.id)) || DOWNTIME_ACTIVITIES[0];

  if (lower.includes('curo') || lower.includes('curar') || lower.includes('sanar')) activity = DOWNTIME_ACTIVITIES[0];
  else if (lower.includes('automail') || lower.includes('mantenimiento') || lower.includes('reparar')) activity = DOWNTIME_ACTIVITIES[1];
  else if (lower.includes('relaj') || lower.includes('descans') || lower.includes('medit') || lower.includes('vicio')) activity = DOWNTIME_ACTIVITIES[2];
  else if (lower.includes('investig') || lower.includes('busco info') || lower.includes('archivo')) activity = DOWNTIME_ACTIVITIES[3];
  else if (lower.includes('entren') || lower.includes('practic') || lower.includes('mejorar')) activity = DOWNTIME_ACTIVITIES[4];
  else if (lower.includes('trabaj') || lower.includes('ganar') || lower.includes('dinero')) activity = DOWNTIME_ACTIVITIES[5];

  const outcome = dice.outcome;
  const willMod = Math.floor((state.character.attributes.vol - 10) / 2);

  details.push(`Actividad: ${activity.name}`);
  details.push(`Tirada: ${dice.total} (${getOutcomeLabel(outcome)})`);
  if (willMod !== 0) {
    details.push(`Mod. Voluntad: ${willMod >= 0 ? '+' : ''}${willMod}`);
  }

  switch (activity.id) {
    case 'heal':
      const untreated = state.health.injuries.filter(i => !i.treated);
      if (untreated.length === 0) {
        details.push('No hay heridas que tratar.');
      } else {
        const healed = untreated.slice(0, outcome === 'complete' ? 2 : 1);
        healed.forEach(injury => {
          details.push(`Curada: ${injury.type} en ${injury.bodyPart} (${injury.severity}).`);
        });
        changes.heal = outcome === 'complete' ? 30 : 15;
      }
      break;

    case 'maintain':
      if (state.health.automailParts.length === 0) {
        details.push('No tienes automail que mantener.');
      } else {
        details.push('Automail revisado y lubricado. Funcionamiento óptimo restablecido.');
        changes.automailMaintained = true;
        changes.clocks = { consequence: -1 };
      }
      break;

    case 'relax':
      const stressReduction = outcome === 'complete' ? 25 : outcome === 'partial' ? 15 : 5;
      details.push(`Reduces tu estrés en ${stressReduction}.`);
      changes.stress = -stressReduction;
      if (outcome === 'complete') {
        details.push('Tu vicio te brinda un momento de paz genuina.');
      }
      break;

    case 'research':
      if (outcome === 'complete') {
        details.push('Descubres información valiosa: movimientos enemigos, debilidades, ubicaciones secretas.');
        changes.research = { success: true, quality: 'high' };
        changes.clocks = { suspicion: -1 };
      } else if (outcome === 'partial') {
        details.push('Encuentras rumores y pistas, nada concreto.');
        changes.research = { success: true, quality: 'low' };
      } else {
        details.push('Tu investigación atrae atención no deseada.');
        changes.suspicion = 10;
      }
      break;

    case 'train':
      const lowerRaw = parsed.raw.toLowerCase();
      let skill = 'combate';
      if (lowerRaw.includes('alquimia')) skill = 'alquimia';
      else if (lowerRaw.includes('sigilo')) skill = 'sigilo';
      else if (lowerRaw.includes('percepción') || lowerRaw.includes('percepcion')) skill = 'percepción';
      else if (lowerRaw.includes('social') || lowerRaw.includes('persuadir')) skill = 'social';
      else if (lowerRaw.includes('combate') || lowerRaw.includes('lucha')) skill = 'combate';

      if (outcome === 'complete') {
        details.push(`Entrenas ${skill}. Ganas +2 en la próxima tirada relacionada.`);
        changes.training = { skill, bonus: 2 };
      } else if (outcome === 'partial') {
        details.push(`Practicas ${skill}. Progreso lento. +1 en la próxima tirada.`);
        changes.training = { skill, bonus: 1 };
      } else {
        details.push('Te lesionas entrenando.');
        changes.stress = 10;
        changes.injury = { id: crypto.randomUUID(), type: 'blunt', severity: 'light', bodyPart: 'torso', treated: false, isAutomail: false };
      }
      break;

    case 'work':
      const locationEarnings: Record<string, number> = {
        central_city: 100,
        eastern_desert: 60,
        northern_border: 80,
        southern_port: 90,
        xerxes_ruins: 30,
        drachma_border: 70,
        father_lair: 0,
      };
      const basePay = locationEarnings[state.location] || 50;
      const earnings = outcome === 'complete' ? basePay * 2 : outcome === 'partial' ? basePay : Math.floor(basePay * 0.2);
      details.push(`Trabajas en ${state.location}. Ganas ${earnings} cenz.`);
      changes.money = earnings;
      break;
  }

  changes.timeAdvanced = true;
  return { success: outcome !== 'miss', outcome, changes, details };
}

export function getDowntimeOptions() {
  return DOWNTIME_ACTIVITIES;
}