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

  const volMod = 0; // Attribute mod already applied in engine.ts dice roll
  const adjustedTotal = dice.total + volMod;

  let outcome: 'complete' | 'partial' | 'miss';
  if (adjustedTotal >= 10) outcome = 'complete';
  else if (adjustedTotal >= 7) outcome = 'partial';
  else outcome = 'miss';

  details.push(`Actividad: ${activity.name}`);
  details.push(`Tirada ajustada: ${adjustedTotal} (${getOutcomeLabel(outcome)})`);

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
      const skills = ['combate', 'alquimia', 'sigilo', 'percepción', 'social'];
      const skill = skills[Math.floor(Math.random() * skills.length)];
      if (outcome === 'complete') {
        details.push(`Entrenas ${skill}. Ganas +1 en la próxima tirada relacionada.`);
        changes.training = { skill, bonus: 1 };
      } else if (outcome === 'partial') {
        details.push(`Practicas ${skill}. Progreso lento.`);
        changes.training = { skill, bonus: 0 };
      } else {
        details.push('Te lesionas entrenando.');
        changes.stress = 10;
        changes.injury = { id: crypto.randomUUID(), type: 'blunt', severity: 'light', bodyPart: 'torso', treated: false, isAutomail: false };
      }
      break;

    case 'work':
      const earnings = outcome === 'complete' ? 100 : outcome === 'partial' ? 50 : 10;
      details.push(`Ganas ${earnings} cenz.`);
      changes.money = earnings;
      break;
  }

  changes.timeAdvanced = true;
  return { success: outcome !== 'miss', outcome, changes, details };
}

export function getDowntimeOptions() {
  return DOWNTIME_ACTIVITIES;
}