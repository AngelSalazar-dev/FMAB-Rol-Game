import type { StressState, SanityState, Trauma, GameState } from '@/types/game';

const TRAUMA_TYPES: Trauma['type'][] = [
  'cold', 'haunted', 'obsessed', 'paranoid',
  'reckless', 'soft', 'unstable', 'vicious'
];

const TRAUMA_DESCRIPTIONS: Record<Trauma['type'], string> = {
  cold: 'Frío: No te conmueven los llamamientos emocionales ni los lazos sociales.',
  haunted: 'Acosado: A menudo te pierdes en ensoñaciones, reviviendo horrores pasados.',
  obsessed: 'Obsesionado: Estás cautivado por una sola cosa: una actividad, una persona, una ideología.',
  paranoid: 'Paranoico: Imaginas peligro en todas partes; no puedes confiar en los demás.',
  reckless: 'Temerario: Tienes poca consideración por tu propia seguridad o intereses.',
  soft: 'Blando: Pierdes tu filo; te vuelves sentimental, pasivo, gentil.',
  unstable: 'Inestable: Tu estado emocional es volátil. Puedes enfurecerte o caer en la desesperación instantáneamente.',
  vicious: 'Vicioso: Buscas oportunidades para dañar a la gente, incluso sin buena razón.',
};

export function addStress(state: StressState, amount: number): StressState {
  const newCurrent = Math.min(state.current + amount, state.max);
  const gainedTrauma = newCurrent >= state.max && state.current < state.max;

  if (gainedTrauma) {
    const trauma = generateTrauma();
    return {
      current: 0,
      max: state.max,
      traumas: [...state.traumas, trauma],
    };
  }

  return { ...state, current: newCurrent };
}

export function reduceStress(state: StressState, amount: number): StressState {
  return { ...state, current: Math.max(0, state.current - amount) };
}

export function generateTrauma(): Trauma {
  const type = TRAUMA_TYPES[Math.floor(Math.random() * TRAUMA_TYPES.length)];
  return {
    id: crypto.randomUUID(),
    type,
    permanent: true,
  };
}

export function getTraumaDescription(trauma: Trauma): string {
  return TRAUMA_DESCRIPTIONS[trauma.type];
}

export function reduceSanity(state: SanityState, amount: number): SanityState {
  const newCurrent = Math.max(0, state.current - amount);
  return { ...state, current: newCurrent };
}

export function recoverSanity(state: SanityState, amount: number): SanityState {
  return { ...state, current: Math.min(state.max, state.current + amount) };
}

export function addSanityCondition(state: SanityState, condition: string): SanityState {
  if (state.conditions.includes(condition)) return state;
  return { ...state, conditions: [...state.conditions, condition] };
}

export function processWitnessAberration(state: GameState, aberrationType: 'chimera' | 'human_transmutation' | 'philosophers_stone' | 'homunculus') {
  const sanityLoss = {
    chimera: 10,
    human_transmutation: 25,
    philosophers_stone: 15,
    homunculus: 20,
  };

  const stressGain = {
    chimera: 5,
    human_transmutation: 15,
    philosophers_stone: 10,
    homunculus: 10,
  };

  return {
    sanityLoss: sanityLoss[aberrationType],
    stressGain: stressGain[aberrationType],
  };
}

export function getStressDescription(stress: StressState): string {
  const pct = (stress.current / stress.max) * 100;
  if (pct < 25) return 'Calmado';
  if (pct < 50) return 'Tenso';
  if (pct < 75) return 'Agitado';
  return 'Al borde del colapso';
}

export function getSanityDescription(sanity: SanityState): string {
  const pct = (sanity.current / sanity.max) * 100;
  if (pct > 75) return 'Estable';
  if (pct > 50) return 'Preocupado';
  if (pct > 25) return 'Inestable';
  return 'Al borde de la locura';
}