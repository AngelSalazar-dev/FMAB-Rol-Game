import type { GameState } from '@/types/game';

export interface NPC {
  id: string;
  name: string;
  archetype: string;
  faction: 'military' | 'ishvalan' | 'resistance' | 'state' | 'civilian' | 'homunculus' | 'neutral';
  stats: { str: number; agi: number; int: number; per: number; vol: number; car: number };
  hp: number;
  maxHp: number;
  weapon?: string;
  damage: number;
  armor: number;
  skills: string[];
  personality: string[];
  dialogue: Record<string, string>;
  loot: string[];
  isHostile: boolean;
  isUnique: boolean;
}

export const NPC_TEMPLATES: Record<string, Omit<NPC, 'id'>> = {
  soldado: {
    name: 'Soldado de Amestris',
    archetype: 'grunt',
    faction: 'military',
    stats: { str: 12, agi: 11, int: 9, per: 10, vol: 11, car: 9 },
    hp: 40,
    maxHp: 40,
    weapon: 'rifle',
    damage: 15,
    armor: 5,
    skills: ['disparo', 'cobertura', 'formación'],
    personality: ['disciplinado', 'leal', 'cansado'],
    dialogue: {
      greet: '¡Alto! Identifíquese.',
      hostile: '¡Objetivo confirmado! ¡Fuego!',
      flee: '¡Reagrupamos! ¡No morimos por esto!',
    },
    loot: ['munición', 'racion', 'insignia'],
    isHostile: false,
    isUnique: false,
  },
  alquimista_estatal: {
    name: 'Alquimista Estatal',
    archetype: 'specialist',
    faction: 'state',
    stats: { str: 10, agi: 12, int: 16, per: 13, vol: 14, car: 11 },
    hp: 60,
    maxHp: 60,
    weapon: 'guantes_transmutación',
    damage: 25,
    armor: 3,
    skills: ['alquimia_combate', 'transmutación_rápida', 'análisis'],
    personality: ['orgulloso', 'calculador', 'ambicioso'],
    dialogue: {
      greet: 'Un civil... o ¿un alquimista no registrado?',
      hostile: 'La alquimia estatal no perdona.',
      flee: 'Informaré al Estado Mayor.',
    },
    loot: ['reloj_bolsillo', 'notas_alquimia', 'guantes_dañados'],
    isHostile: false,
    isUnique: false,
  },
  ishvalano: {
    name: 'Guerrero Ishvalano',
    archetype: 'survivor',
    faction: 'ishvalan',
    stats: { str: 13, agi: 14, int: 10, per: 15, vol: 16, car: 8 },
    hp: 50,
    maxHp: 50,
    weapon: 'rifle_antiguo',
    damage: 18,
    armor: 2,
    skills: ['sigilo_desierto', 'emboscada', 'supervivencia'],
    personality: ['estoico', 'vengativo', 'fiel'],
    dialogue: {
      greet: 'Tu pueblo destruyó el nuestro. ¿Por qué estás aquí?',
      hostile: '¡Por Ishval! ¡Por los caídos!',
      flee: 'Los antepasados juzgarán.',
    },
    loot: ['agua', 'hierbas_curativas', 'amuleto'],
    isHostile: true,
    isUnique: false,
  },
  quimera: {
    name: 'Quimera Humana',
    archetype: 'monster',
    faction: 'homunculus',
    stats: { str: 18, agi: 15, int: 8, per: 14, vol: 12, car: 5 },
    hp: 80,
    maxHp: 80,
    weapon: 'garras',
    damage: 22,
    armor: 8,
    skills: ['sentidos_agudos', 'regeneración', 'ferocidad'],
    personality: ['doloroso', 'instintivo', 'leal_al_amo'],
    dialogue: {
      greet: 'Grrr... ¿Comida... o amigo?',
      hostile: '¡TE DESGARRARÉ!',
      flee: 'El amo... me castigará...',
    },
    loot: ['órgano_mutado', 'pelo', 'diente'],
    isHostile: true,
    isUnique: false,
  },
  informante: {
    name: 'Informante de la Resistencia',
    archetype: 'spy',
    faction: 'resistance',
    stats: { str: 9, agi: 14, int: 13, per: 16, vol: 11, car: 15 },
    hp: 35,
    maxHp: 35,
    weapon: 'daga_oculta',
    damage: 12,
    armor: 1,
    skills: ['infiltración', 'soborno', 'rumores', 'falsificación'],
    personality: ['paranoico', 'codicioso', 'útil'],
    dialogue: {
      greet: 'La información tiene precio. ¿Qué buscas?',
      hostile: '¡Me vendieron! ¡Corred!',
      flee: 'Volveré... con más secretos.',
    },
    loot: ['documentos_falsos', 'llave', 'mapa', 'dinero'],
    isHostile: false,
    isUnique: false,
  },
  civil: {
    name: 'Civil de Central',
    archetype: 'civilian',
    faction: 'civilian',
    stats: { str: 8, agi: 9, int: 10, per: 9, vol: 8, car: 10 },
    hp: 20,
    maxHp: 20,
    weapon: 'bolso',
    damage: 3,
    armor: 0,
    skills: ['cotilleo', 'trabajo'],
    personality: ['miedoso', 'curioso', 'normal'],
    dialogue: {
      greet: '¿Eh? ¿Necesitas algo?',
      hostile: '¡Auxilio! ¡Militares!',
      flee: '¡No quiero problemas!',
    },
    loot: ['dinero', 'comida', 'carta'],
    isHostile: false,
    isUnique: false,
  },
};

export const UNIQUE_NPCS: Record<string, NPC> = {
  roy_mustang: {
    id: 'roy_mustang',
    name: 'Roy Mustang',
    archetype: 'leader',
    faction: 'state',
    stats: { str: 11, agi: 14, int: 17, per: 14, vol: 16, car: 18 },
    hp: 80,
    maxHp: 80,
    weapon: 'guantes_llama',
    damage: 35,
    armor: 5,
    skills: ['alquimia_fuego', 'liderazgo', 'táctica', 'manipulación'],
    personality: ['ambicioso', 'protector', 'arrepentido', 'carismático'],
    dialogue: {
      greet: '¿Un alquimista interesante? Cuéntame.',
      hostile: 'Las llamas purifican todo.',
      flee: 'No huyo. Me repliego.',
    },
    loot: ['guantes_llama', 'guantes_cuero', 'foto_equipo'],
    isHostile: false,
    isUnique: true,
  },
  edward_elric: {
    id: 'edward_elric',
    name: 'Edward Elric',
    archetype: 'protagonist',
    faction: 'resistance',
    stats: { str: 14, agi: 16, int: 18, per: 13, vol: 19, car: 12 },
    hp: 90,
    maxHp: 90,
    weapon: 'brazo_automail',
    damage: 30,
    armor: 3,
    skills: ['alquimia_sin_círculo', 'transmutación_instantánea', 'combate_cuerpo', 'terquedad'],
    personality: ['testarudo', 'protector', 'culpable', 'genio'],
    dialogue: {
      greet: '¿Quién eres? ¿Amigo de Al?',
      hostile: '¡No me subestimes por mi altura!',
      flee: '¡Al! ¡Nos vamos!',
    },
    loot: ['reloj_estado', 'brazo_automail_roto', 'diario'],
    isHostile: false,
    isUnique: true,
  },
  alphonse_elric: {
    id: 'alphonse_elric',
    name: 'Alphonse Elric',
    archetype: 'guardian',
    faction: 'resistance',
    stats: { str: 20, agi: 10, int: 16, per: 12, vol: 18, car: 15 },
    hp: 120,
    maxHp: 120,
    weapon: 'cuerpo_armadura',
    damage: 25,
    armor: 15,
    skills: ['alquimia_sin_círculo', 'escudo_absoluto', 'protección', 'empático'],
    personality: ['gentil', 'filosófico', 'leal', 'triste'],
    dialogue: {
      greet: 'Hola. Mi hermano es el bajito.',
      hostile: 'No quiero lastimarte. Pero lo haré.',
      flee: 'Hermano... espero.',
    },
    loot: ['sello_sangre', 'cuerpo_armadura', 'gato_dentro'],
    isHostile: false,
    isUnique: true,
  },
  father: {
    id: 'father',
    name: 'Padre',
    archetype: 'villain',
    faction: 'homunculus',
    stats: { str: 25, agi: 20, int: 25, per: 25, vol: 25, car: 25 },
    hp: 500,
    maxHp: 500,
    weapon: 'transmutación_divina',
    damage: 999,
    armor: 50,
    skills: ['todo', 'creación_homúnculos', 'absorción_dios', 'verdad'],
    personality: ['perfecto', 'vacío', 'superior', 'paciente'],
    dialogue: {
      greet: 'Bienvenido. ¿Buscas la verdad?',
      hostile: 'Sois hormigas ante un dios.',
      flee: 'Yo no huyo. Yo espero.',
    },
    loot: ['piedra_filosófal', 'conocimiento_absoluto', 'cuerpo_original'],
    isHostile: true,
    isUnique: true,
  },
};

export function createNPC(templateKey: string, overrides: Partial<NPC> = {}): NPC {
  const template = NPC_TEMPLATES[templateKey];
  if (!template) throw new Error(`NPC template ${templateKey} not found`);

  return {
    ...template,
    id: crypto.randomUUID(),
    ...overrides,
  };
}

export function getUniqueNPC(id: string): NPC | undefined {
  return UNIQUE_NPCS[id];
}