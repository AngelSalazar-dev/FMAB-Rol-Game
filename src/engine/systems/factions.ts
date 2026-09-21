import type { FactionState } from '@/types/game';

const FACTION_NAMES = ['military', 'ishvalan', 'resistance', 'state'] as const;
type FactionName = typeof FACTION_NAMES[number];

export function increaseSuspicion(state: FactionState, amount: number): FactionState {
  const newSuspicion = Math.min(state.suspicion + amount, 100);
  return { ...state, suspicion: newSuspicion };
}

export function decreaseSuspicion(state: FactionState, amount: number): FactionState {
  const newSuspicion = Math.max(state.suspicion - amount, 0);
  return { ...state, suspicion: newSuspicion };
}

export function changeReputation(state: FactionState, faction: FactionName, amount: number): FactionState {
  const current = state[faction];
  const newValue = Math.max(-100, Math.min(100, current + amount));
  return { ...state, [faction]: newValue };
}

export function getSuspicionLevel(suspicion: number): { level: string; description: string; events: string[] } {
  if (suspicion >= 90) {
    return {
      level: 'Caza Activa',
      description: 'Alquimistas Estatales y Policía Militar te buscan activamente.',
      events: ['Emboscadas frecuentes', 'Órdenes de captura', 'Aliados en peligro'],
    };
  }
  if (suspicion >= 70) {
    return {
      level: 'Persecución',
      description: 'Eres un objetivo prioritario. Redadas y interrogatorios son comunes.',
      events: ['Redadas policiales', 'Vigilancia constante', 'Dificultad para moverse'],
    };
  }
  if (suspicion >= 50) {
    return {
      level: 'Sospechoso',
      description: 'Las autoridades te vigilan. Interrogatorios aleatorios.',
      events: ['Interrogatorios', 'Registros', 'Restricciones de movimiento'],
    };
  }
  if (suspicion >= 30) {
    return {
      level: 'Persona de Interés',
      description: 'Tu nombre está en listas. Seguimiento discreto.',
      events: ['Seguimiento', 'Preguntas a conocidos', 'Archivos revisados'],
    };
  }
  return {
    level: 'Desconocido',
    description: 'No hay atención especial sobre ti.',
    events: [],
  };
}

export function getFactionDescription(faction: FactionName, value: number): string {
  if (value > 50) return `Aliado cercano de ${faction}`;
  if (value > 20) return `Bien visto por ${faction}`;
  if (value > -20) return `Neutral con ${faction}`;
  if (value > -50) return `Mal visto por ${faction}`;
  return `Enemigo de ${faction}`;
}

export function getActiveThreats(state: FactionState): string[] {
  const threats: string[] = [];
  const suspicionInfo = getSuspicionLevel(state.suspicion);
  threats.push(...suspicionInfo.events);

  if (state.military < -50) threats.push('Militares hostiles a la vista');
  if (state.ishvalan < -50) threats.push('Extremistas ishvalanos te buscan');
  if (state.resistance < -50) threats.push('La resistencia te considera traidor');

  return threats;
}