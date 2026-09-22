import type { FactionState } from '@/types/game';

const FACTION_NAMES = ['military', 'ishvalan', 'resistance', 'state'] as const;
type FactionName = typeof FACTION_NAMES[number];

// Conflicting factions: raising one lowers the other
const FACTION_CONFLICTS: Record<FactionName, { target: FactionName; ratio: number }[]> = {
  military:    [{ target: 'ishvalan', ratio: 0.5 }, { target: 'resistance', ratio: 0.3 }],
  ishvalan:    [{ target: 'military', ratio: 0.5 }, { target: 'state', ratio: 0.3 }],
  resistance:  [{ target: 'military', ratio: 0.3 }, { target: 'state', ratio: 0.5 }],
  state:       [{ target: 'resistance', ratio: 0.5 }, { target: 'ishvalan', ratio: 0.3 }],
};

export type FactionReward = {
  faction: FactionName;
  threshold: number;
  name: string;
  description: string;
  effect: 'equipment' | 'info' | 'alliance' | 'safe_passage' | 'discount';
};

export const FACTION_REWARDS: FactionReward[] = [
  // Military rewards
  { faction: 'military', threshold: 25, name: 'Rango Reconocido', description: 'Acceso a equipamiento militar básico.', effect: 'equipment' },
  { faction: 'military', threshold: 50, name: 'Aliado Militar', description: 'Los soldados no te registran. Información sobre movimientos.', effect: 'info' },
  { faction: 'military', threshold: 75, name: 'Coronel de Confianza', description: 'Acceso a armas pesadas y transporte militar.', effect: 'alliance' },
  // Ishvalan rewards
  { faction: 'ishvalan', threshold: 25, name: 'Simpatizante', description: 'Refugio temporal en comunidades ishvalanas.', effect: 'safe_passage' },
  { faction: 'ishvalan', threshold: 50, name: 'Amigo del Pueblo', description: 'Información sobre alquimistas del estado y rutas secretas.', effect: 'info' },
  { faction: 'ishvalan', threshold: 75, name: 'Hermano de Armas', description: 'Guerreros ishvalanos combaten a tu lado.', effect: 'alliance' },
  // Resistance rewards
  { faction: 'resistance', threshold: 25, name: 'Contacto', description: 'Acceso a safe houses y documentos falsos.', effect: 'safe_passage' },
  { faction: 'resistance', threshold: 50, name: 'Operador', description: 'Misiones de la resistencia con recompensas.', effect: 'info' },
  { faction: 'resistance', threshold: 75, name: 'Líder de Cells', description: 'Comandos de resistencia ejecutan operaciones.', effect: 'alliance' },
  // State rewards
  { faction: 'state', threshold: 25, name: 'Ciudadano Modelo', description: 'Descuentos en tiendas oficiales.', effect: 'discount' },
  { faction: 'state', threshold: 50, name: 'Colaborador', description: 'Acceso a archivos del gobierno.', effect: 'info' },
  { faction: 'state', threshold: 75, name: 'Agente Estatal', description: 'Poder legal y protección gubernamental.', effect: 'alliance' },
];

export function increaseSuspicion(state: FactionState, amount: number): FactionState {
  const newSuspicion = Math.min(state.suspicion + amount, 100);
  return { ...state, suspicion: newSuspicion };
}

export function decreaseSuspicion(state: FactionState, amount: number): FactionState {
  const newSuspicion = Math.max(state.suspicion - amount, 0);
  return { ...state, suspicion: newSuspicion };
}

export function changeReputation(state: FactionState, faction: FactionName, amount: number): FactionState {
  let newState = { ...state };
  const current = state[faction];
  const newValue = Math.max(-100, Math.min(100, current + amount));
  newState[faction] = newValue;

  // Apply conflicts: raising one faction lowers rivals
  if (amount > 0) {
    const conflicts = FACTION_CONFLICTS[faction];
    for (const conflict of conflicts) {
      const loss = Math.round(amount * conflict.ratio);
      if (loss > 0) {
        newState[conflict.target] = Math.max(-100, newState[conflict.target] - loss);
      }
    }
  }

  return newState;
}

export function getFactionRewards(state: FactionState): FactionReward[] {
  const earned: FactionReward[] = [];
  for (const reward of FACTION_REWARDS) {
    if (state[reward.faction] >= reward.threshold) {
      earned.push(reward);
    }
  }
  return earned;
}

export function getPendingRewards(state: FactionState): FactionReward[] {
  const pending: FactionReward[] = [];
  for (const reward of FACTION_REWARDS) {
    const current = state[reward.faction];
    if (current < reward.threshold && current >= reward.threshold - 15) {
      pending.push(reward);
    }
  }
  return pending;
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

export function getFactionModifier(faction: FactionName, state: FactionState): number {
  const rep = state[faction];
  if (rep >= 50) return 2;
  if (rep >= 20) return 1;
  if (rep <= -50) return -2;
  if (rep <= -20) return -1;
  return 0;
}
