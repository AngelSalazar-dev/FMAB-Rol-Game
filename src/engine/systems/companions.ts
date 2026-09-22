import type { GameState, ParsedAction, DiceResult, Companion, GameStateChanges } from '@/types/game';
import { getOutcomeLabel } from '../core/dice';

const COMPANION_TEMPLATES: Omit<Companion, 'id'>[] = [
  {
    name: 'Alphonse Elric',
    loyalty: 90,
    isAlive: true,
    status: 'active',
    personality: { traits: ['protector', 'gentil', 'filósofo'], vice: 'preocupación excesiva' },
    skills: ['alquimia_sin_círculo', 'combate_cuerpo_a_cuerpo', 'escudo'],
  },
  {
    name: 'Riza Hawkeye',
    loyalty: 70,
    isAlive: true,
    status: 'active',
    personality: { traits: ['leal', 'disciplinada', 'observadora'], trauma: 'cold' },
    skills: ['francotirador', 'táctica', 'sigilo'],
  },
  {
    name: 'Jean Havoc',
    loyalty: 60,
    isAlive: true,
    status: 'active',
    personality: { traits: ['relajado', 'fumador', 'leal'], vice: 'cigarrillos' },
    skills: ['conducción', 'combate_urbano', 'contactos'],
  },
  {
    name: 'Ling Yao',
    loyalty: 40,
    isAlive: true,
    status: 'active',
    personality: { traits: ['ambicioso', 'astuto', 'hambriento'], vice: 'comida', trauma: 'obsessed' },
    skills: ['espada', 'detección_qi', 'supervivencia'],
  },
  {
    name: 'May Chang',
    loyalty: 50,
    isAlive: true,
    status: 'active',
    personality: { traits: ['ingenua', 'determinada', 'clan'], vice: 'shao_mei' },
    skills: ['alquimia_xing', 'curación', 'pequeño_tamaño'],
  },
];

export type CompanionRelationship = {
  type: 'trust' | 'rivalry' | 'mentor' | 'bond' | 'tension' | 'debt';
  with: string;
  value: number;
  description: string;
};

export type CompanionHook = {
  trigger: 'low_loyalty' | 'high_loyalty' | 'injury' | 'combat' | 'location' | 'moral' | 'turn';
  condition: string;
  text: string;
  mechanicalEffect?: string;
};

export const COMPANION_HOOKS: CompanionHook[] = [
  // Alphonse
  { trigger: 'moral', condition: 'ruthless', text: 'Alphonse duda de tus métodos. "¿Es esto lo que nos enseñó Van Hohenheim?"', mechanicalEffect: 'loyalty -10' },
  { trigger: 'low_loyalty', condition: 'loyalty < 30', text: 'Alphonse se pregunta si tu camino es el correcto. Su armadura se siente vacía.', mechanicalEffect: 'riesgo de partida' },
  { trigger: 'combat', condition: 'hostile_npc_faction:state', text: 'Alphonse se interpone: "¡No podemos luchar contra ellos! Son del gobierno."', mechanicalEffect: 'rechaza órdenes' },
  // Hawkeye
  { trigger: 'low_loyalty', condition: 'loyalty < 40', text: 'Hawkeye se mantiene profesional pero distante. Su dedicación a Mustang la-first no a ti.', mechanicalEffect: 'pierde habilidades tácticas' },
  { trigger: 'injury', condition: 'health < 30', text: 'Hawkeye cubre tu retirada sin decir una palabra. Su mirada dice todo.', mechanicalEffect: 'ventaja en huida' },
  // Ling
  { trigger: 'high_loyalty', condition: 'loyalty > 80', text: '"Voy contigo, hermano. Los diez devoradores están contigo." Ling sonríe.', mechanicalEffect: '+2 combate cuerpo a cuerpo' },
  { trigger: 'moral', condition: 'ruthless', text: 'Ling se ríe. "Me gusta tu estilo. Los débiles no sobreviven."', mechanicalEffect: 'loyalty +5' },
  // May
  { trigger: 'injury', condition: 'any_injury', text: 'May se acerca con su hierba xingese. "Todavía puedo curarte."', mechanicalEffect: 'curación bonus' },
  { trigger: 'low_loyalty', condition: 'loyalty < 25', text: 'May llora en silencio. Extraña a Xiao-Mei. Quizás deba volver a Xing.', mechanicalEffect: 'pierde alquimia_xing' },
];

export function processCompanions(parsed: ParsedAction, dice: DiceResult, state: GameState) {
  const details: string[] = [];
  const changes: GameStateChanges = {};

  const lower = parsed.raw.toLowerCase();

  if (lower.includes('reclut') || lower.includes('únete') || lower.includes('aliado')) {
    const available = COMPANION_TEMPLATES.filter(t => !state.companions.some(c => c.name === t.name));
    if (available.length === 0) {
      details.push('No hay más compañeros disponibles.');
      return { success: false, outcome: 'miss' as const, changes, details };
    }

    const template = available[0];
    const newCompanion: Companion = {
      ...template,
      id: crypto.randomUUID(),
    };

    changes.companions = [...state.companions, newCompanion];
    details.push(`${template.name} se une a ti. Lealtad inicial: ${template.loyalty}.`);
    return { success: true, outcome: 'complete' as const, changes, details };
  }

  if (lower.includes('ordeno') || lower.includes('ordena') || lower.includes('digo a')) {
    const target = extractCompanionName(lower, state);
    if (!target) {
      details.push('¿A qué compañía ordenas?');
      return { success: false, outcome: 'miss' as const, changes, details };
    }

    const loyalty = target.loyalty;
    const success = dice.outcome !== 'miss' && loyalty > 30;

    if (success) {
      details.push(`${target.name} obedece tu orden.`);
      changes.companionLoyalty = { id: target.id, change: 5 };
    } else {
      details.push(`${target.name} duda o se niega. Lealtad: ${loyalty}.`);
      changes.companionLoyalty = { id: target.id, change: -5 };
      changes.stress = 5;
    }
    return { success, outcome: success ? dice.outcome : 'miss' as const, changes, details };
  }

  if (lower.includes('hablo') || lower.includes('pregunto') || lower.includes('converso')) {
    const target = extractCompanionName(lower, state);
    if (!target) {
      details.push('¿Con quién hablas?');
      return { success: false, outcome: 'miss' as const, changes, details };
    }

    const loyalty = target.loyalty;
    const outcome = dice.outcome;

    if (outcome === 'complete') {
      details.push(`${target.name} comparte sus pensamientos. Lealtad +5.`);
      changes.companionLoyalty = { id: target.id, change: 5 };
      if (loyalty > 60) details.push('Confía en ti. Te cuenta algo personal.');
    } else if (outcome === 'partial') {
      details.push(`${target.name} responde con cautela. Hay cosas que no dice.`);
      changes.companionLoyalty = { id: target.id, change: 2 };
    } else {
      details.push(`${target.name} se cierra. "No es asunto tuyo."`);
      changes.companionLoyalty = { id: target.id, change: -3 };
    }
    return { success: outcome !== 'miss', outcome, changes, details };
  }

  if (lower.includes('estado') || lower.includes('compañeros') || lower.includes('equipo')) {
    if (state.companions.length === 0) {
      details.push('No tienes compañeros.');
    } else {
      details.push('Compañeros:');
      state.companions.forEach(c => {
        const status = c.isAlive ? c.status : 'MUERTO';
        const loyaltyBar = getLoyaltyBar(c.loyalty);
        details.push(`  - ${c.name}: Lealtad ${loyaltyBar} ${c.loyalty}/100, Estado: ${status}`);
        if (c.personality.trauma) details.push(`    Trauma: ${c.personality.trauma}`);
        if (c.personality.vice) details.push(`    Defecto: ${c.personality.vice}`);
      });
    }
    return { success: true, outcome: 'complete' as const, changes, details };
  }

  return { success: false, outcome: 'miss' as const, changes, details: ['Acción de compañeros no reconocida.'] };
}

function getLoyaltyBar(loyalty: number): string {
  const filled = Math.round(loyalty / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

function extractCompanionName(input: string, state: GameState): Companion | null {
  for (const c of state.companions) {
    if (input.includes(c.name.toLowerCase())) return c;
  }
  return null;
}

export function updateLoyalty(companion: Companion, change: number): Companion {
  const newLoyalty = Math.max(0, Math.min(100, companion.loyalty + change));
  let status = companion.status;

  if (newLoyalty < 20) status = 'missing';
  else if (newLoyalty < 40) status = 'active';

  return { ...companion, loyalty: newLoyalty, status };
}

export function checkCompanionDeath(state: GameState): GameState {
  let newState = { ...state };
  newState.companions = state.companions.map(c => {
    if (!c.isAlive) return c;
    if (c.status === 'dead') return { ...c, isAlive: false };
    if (c.loyalty <= 0) {
      return { ...c, isAlive: false, status: 'dead' };
    }
    return c;
  });

  const dead = newState.companions.filter(c => !c.isAlive && c.status === 'dead');
  if (dead.length > 0) {
    newState.stress = { ...newState.stress, current: Math.min(newState.stress.max, newState.stress.current + 20) };
    newState.morality = {
      ...newState.morality,
      karma: newState.morality.karma - 10,
      decisions: [...newState.morality.decisions, {
        id: crypto.randomUUID(),
        description: 'Un compañero ha muerto',
        choice: 'No pude salvarlo',
        karmaChange: -10,
        timestamp: Date.now(),
        consequences: ['Trauma por pérdida', 'Menor apoyo en combate'],
      }],
    };
  }

  return newState;
}

export function getActiveHooks(state: GameState): CompanionHook[] {
  const hooks: CompanionHook[] = [];

  for (const companion of state.companions) {
    if (!companion.isAlive) continue;

    // Low loyalty hooks
    if (companion.loyalty < 30) {
      const hook = COMPANION_HOOKS.find(h =>
        h.trigger === 'low_loyalty' && h.condition.includes(companion.name.toLowerCase().split(' ')[0])
      );
      if (hook) hooks.push(hook);
    }

    // High loyalty hooks
    if (companion.loyalty > 80) {
      const hook = COMPANION_HOOKS.find(h =>
        h.trigger === 'high_loyalty' && h.condition.includes(companion.name.toLowerCase().split(' ')[0])
      );
      if (hook) hooks.push(hook);
    }

    // Injury hooks
    if (state.health.current < 30) {
      const hook = COMPANION_HOOKS.find(h =>
        h.trigger === 'injury' && h.condition.includes(companion.name.toLowerCase().split(' ')[0])
      );
      if (hook) hooks.push(hook);
    }

    // Moral hooks
    if (state.morality.alignment === 'ruthless') {
      const hook = COMPANION_HOOKS.find(h =>
        h.trigger === 'moral' && h.condition.includes(companion.name.toLowerCase().split(' ')[0])
      );
      if (hook) hooks.push(hook);
    }
  }

  return hooks;
}

export function getCompanionBonus(companion: Companion, actionType: string): number {
  if (!companion.isAlive || companion.status !== 'active') return 0;
  if (companion.loyalty < 20) return -1;

  const hasSkill = companion.skills.some(s => s.includes(actionType));
  if (hasSkill && companion.loyalty >= 60) return 2;
  if (hasSkill) return 1;
  return 0;
}
