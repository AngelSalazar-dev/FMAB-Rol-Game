import type { GameState } from '@/types/game';

export type ParsedAction = {
  type: 'alchemy' | 'combat' | 'stealth' | 'social' | 'exploration' | 'inventory' | 'rest' | 'unknown';
  intent: string;
  target?: string;
  material?: string;
  weapon?: string;
  skill?: string;
  raw: string;
};

const ALCHEMY_KEYWORDS = ['transmuto', 'transmutar', 'alquimia', 'círculo', 'transmutación', 'creo', 'crear', 'transformo', 'transformar'];
const COMBAT_KEYWORDS = ['ataco', 'atacar', 'golpeo', 'golpear', 'disparo', 'disparar', 'apuñalo', 'apuñalar', 'defiendo', 'esquivo', 'peleo', 'lucho'];
const STEALTH_KEYWORDS = ['me escondo', 'esconder', 'sigilo', 'silencio', 'acecho', 'infiltro', 'robo', 'hurto'];
const SOCIAL_KEYWORDS = ['hablo', 'hablar', 'digo', 'pregunto', 'convenco', 'engañ', 'miento', 'amenazo', 'soborno', 'negocio'];
const EXPLORATION_KEYWORDS = ['busco', 'buscar', 'examino', 'examinar', 'inspecciono', 'inspeccionar', 'leo', 'leer', 'investigo', 'muevo', 'voy', 'camino', 'entro', 'salgo'];
const INVENTORY_KEYWORDS = ['inventario', 'bolso', 'mochila', 'equipo', 'uso', 'usar', 'tomo', 'tomar', 'dejo', 'dropear'];
const REST_KEYWORDS = ['descanso', 'descansar', 'duermo', 'dormir', 'recupero', 'recuperar', 'medito', 'curar', 'curo'];

export function parseAction(input: string, state: GameState): ParsedAction {
  const lower = input.toLowerCase().trim();

  for (const kw of ALCHEMY_KEYWORDS) {
    if (lower.includes(kw)) {
      const material = extractMaterial(lower);
      return { type: 'alchemy', intent: 'transmute', material, raw: input };
    }
  }

  for (const kw of COMBAT_KEYWORDS) {
    if (lower.includes(kw)) {
      const weapon = extractWeapon(lower, state);
      return { type: 'combat', intent: 'attack', weapon, raw: input };
    }
  }

  for (const kw of STEALTH_KEYWORDS) {
    if (lower.includes(kw)) {
      return { type: 'stealth', intent: 'hide', raw: input };
    }
  }

  for (const kw of SOCIAL_KEYWORDS) {
    if (lower.includes(kw)) {
      return { type: 'social', intent: 'talk', raw: input };
    }
  }

  for (const kw of EXPLORATION_KEYWORDS) {
    if (lower.includes(kw)) {
      return { type: 'exploration', intent: 'move', raw: input };
    }
  }

  for (const kw of INVENTORY_KEYWORDS) {
    if (lower.includes(kw)) {
      return { type: 'inventory', intent: 'manage', raw: input };
    }
  }

  for (const kw of REST_KEYWORDS) {
    if (lower.includes(kw)) {
      return { type: 'rest', intent: 'recover', raw: input };
    }
  }

  return { type: 'unknown', intent: 'unknown', raw: input };
}

function extractMaterial(input: string): string | undefined {
  const materials = ['hierro', 'acero', 'tierra', 'arena', 'piedra', 'madera', 'agua', 'aire', 'fuego', 'plomo', 'cobre', 'plata', 'oro', 'carbón', 'azufre', 'sal'];
  for (const m of materials) {
    if (input.includes(m)) return m;
  }
  return undefined;
}

function extractWeapon(input: string, state: GameState): string | undefined {
  const weapons = state.inventory
    .filter(i => i.item_type === 'weapon')
    .map(i => i.name.toLowerCase());
  for (const w of weapons) {
    if (input.includes(w)) return w;
  }
  return undefined;
}

export function getAttributeForAction(action: ParsedAction, state: GameState): keyof GameState['character']['attributes'] {
  switch (action.type) {
    case 'alchemy': return 'int';
    case 'combat': return 'str';
    case 'stealth': return 'agi';
    case 'social': return 'car';
    case 'exploration': return 'per';
    case 'rest': return 'vol';
    default: return 'int';
  }
}