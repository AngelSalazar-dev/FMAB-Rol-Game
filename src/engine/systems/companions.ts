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
      details.push('¿A qué compañero ordenas?');
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

  if (lower.includes('estado') || lower.includes('compañeros') || lower.includes('equipo')) {
    if (state.companions.length === 0) {
      details.push('No tienes compañeros.');
    } else {
      details.push('Compañeros:');
      state.companions.forEach(c => {
        const status = c.isAlive ? c.status : 'MUERTO';
        details.push(`  - ${c.name}: Lealtad ${c.loyalty}, Estado: ${status}`);
        if (c.personality.trauma) details.push(`    Trauma: ${c.personality.trauma}`);
      });
    }
    return { success: true, outcome: 'complete' as const, changes, details };
  }

  return { success: false, outcome: 'miss' as const, changes, details: ['Acción de compañeros no reconocida.'] };
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