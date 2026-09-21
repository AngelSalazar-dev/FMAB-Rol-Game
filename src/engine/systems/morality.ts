import type { GameState, ParsedAction, DiceResult, MoralityState, Decision, GameStateChanges } from '@/types/game';
import { getOutcomeLabel } from '../core/dice';

interface MoralOption {
  text: string;
  karma: number;
  stress: number;
  sanity?: number;
  suspicion?: number;
  consequence: string;
}

interface MoralChoice {
  id: string;
  description: string;
  options: MoralOption[];
}

const MORAL_CHOICES: MoralChoice[] = [
  {
    id: 'save_civilian',
    description: 'Un civil está en peligro. ¿Lo salvas a costa de tu misión?',
    options: [
      { text: 'Salvarlo', karma: 15, stress: 10, consequence: 'Misión comprometida' },
      { text: 'Ignorarlo', karma: -20, stress: 5, consequence: 'Culpa persistente' },
      { text: 'Sacrificar a otro', karma: -30, stress: 15, consequence: 'Trauma garantizado' },
    ],
  },
  {
    id: 'use_philosophers_stone',
    description: 'Tienes una Piedra Filosofal. ¿La usas para salvar a alguien?',
    options: [
      { text: 'Úsala', karma: -15, stress: 5, sanity: 20, consequence: 'Corrupción del alma' },
      { text: 'No la uses', karma: 10, stress: 20, consequence: 'Muerte evitable' },
      { text: 'Destrúyela', karma: 25, stress: 10, consequence: 'Poder perdido para siempre' },
    ],
  },
  {
    id: 'human_transmutation',
    description: 'Intentas transmutar a un ser humano. ¿Continuas sabiendo el costo?',
    options: [
      { text: 'Continuar', karma: -50, stress: 30, sanity: 30, consequence: 'Puerta de la Verdad' },
      { text: 'Detenerse', karma: 20, stress: 10, consequence: 'Arrepentimiento' },
    ],
  },
  {
    id: 'betray_ally',
    description: 'Un aliado te traiciona. ¿Cómo respondes?',
    options: [
      { text: 'Perdonar', karma: 15, stress: 10, consequence: 'Riesgo futuro' },
      { text: 'Ejecutar', karma: -25, stress: 5, consequence: 'Reputación de verdugo' },
      { text: 'Entregar a militares', karma: -10, stress: 5, suspicion: 20, consequence: 'Favor militar' },
    ],
  },
];

export function getRandomMoralChoice(): typeof MORAL_CHOICES[0] {
  return MORAL_CHOICES[Math.floor(Math.random() * MORAL_CHOICES.length)];
}

export function addDecision(state: MoralityState, decision: Omit<Decision, 'id' | 'timestamp'>): MoralityState {
  const newDecision: Decision = {
    ...decision,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  const newKarma = Math.max(-100, Math.min(100, state.karma + decision.karmaChange));
  let alignment: MoralityState['alignment'] = 'neutral';

  if (newKarma > 30) alignment = 'noble';
  else if (newKarma < -30) alignment = 'ruthless';

  return {
    karma: newKarma,
    decisions: [...state.decisions, newDecision],
    alignment,
  };
}

export function processMorality(parsed: ParsedAction, dice: DiceResult, state: GameState) {
  const details: string[] = [];
  const changes: GameStateChanges = {};

  if (parsed.raw.toLowerCase().includes('moral') || parsed.raw.toLowerCase().includes('dilema') || parsed.raw.toLowerCase().includes('decido')) {
    const choice = getRandomMoralChoice();
    details.push(`DILEMA MORAL: ${choice.description}`);
    choice.options.forEach((opt, i) => {
      details.push(`  ${i + 1}. ${opt.text} (Karma: ${opt.karma >= 0 ? '+' : ''}${opt.karma})`);
    });
    changes.moralChoice = choice;
    return { success: true, outcome: 'complete' as const, changes, details };
  }

  return { success: false, outcome: 'miss' as const, changes, details: [] };
}

export function resolveMoralChoice(state: GameState, choiceId: string, optionIndex: number) {
  const choice = MORAL_CHOICES.find(c => c.id === choiceId);
  if (!choice) return state;

  const option = choice.options[optionIndex];
  if (!option) return state;

  let newState = { ...state };
  newState.morality = addDecision(newState.morality, {
    description: choice.description,
    choice: option.text,
    karmaChange: option.karma,
    consequences: [option.consequence],
  });

  if (option.stress) newState.stress = { ...newState.stress, current: Math.min(newState.stress.max, newState.stress.current + option.stress) };
  if (option.sanity) newState.sanity = { ...newState.sanity, current: Math.max(0, newState.sanity.current - option.sanity) };
  if (option.suspicion) newState.factions = { ...newState.factions, suspicion: Math.min(100, newState.factions.suspicion + option.suspicion) };

  return newState;
}

export function getAlignmentDescription(alignment: MoralityState['alignment']): string {
  switch (alignment) {
    case 'noble': return 'Noble: Tus acciones inspiran confianza y respeto.';
    case 'neutral': return 'Neutral: Caminas la línea entre el bien y el mal.';
    case 'ruthless': return 'Despiadado: El miedo te precede. Pocos confían en ti.';
  }
}