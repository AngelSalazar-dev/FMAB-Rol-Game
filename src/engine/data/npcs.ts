import type { NPC } from '@/types/game';

const NPC_TEMPLATES: Record<string, Omit<NPC, 'id'>[]> = {
  central_city: [
    { name: 'Soldado de la Milicia', archetype: 'soldado', faction: 'military', stats: { str: 12, agi: 10, int: 8, per: 10, vol: 10, car: 8 }, hp: 60, maxHp: 60, weapon: 'rifle', damage: 15, armor: 2, skills: ['rifle', 'disciplina'], personality: ['obediente', 'leal'], dialogue: {}, loot: ['munición', 'ration'], isHostile: false, isUnique: false },
    { name: 'Civil Asustado', archetype: 'civilian', faction: 'civilian', stats: { str: 8, agi: 10, int: 10, per: 10, vol: 8, car: 10 }, hp: 30, maxHp: 30, damage: 5, armor: 0, skills: ['supervivencia'], personality: ['miedoso', 'cooperativo'], dialogue: {}, loot: ['monedas'], isHostile: false, isUnique: false },
    { name: 'Alquimista Estatal', archetype: 'alquimista', faction: 'military', stats: { str: 8, agi: 10, int: 16, per: 12, vol: 10, car: 10 }, hp: 50, maxHp: 50, damage: 20, armor: 1, skills: ['alquimia', 'círculo'], personality: ['calculador', 'profesional'], dialogue: {}, loot: ['tiza', 'catalizador'], isHostile: false, isUnique: false },
  ],
  eastern_hq: [
    { name: 'Oficial de Alto Rango', archetype: 'oficial', faction: 'military', stats: { str: 12, agi: 10, int: 14, per: 12, vol: 12, car: 14 }, hp: 80, maxHp: 80, weapon: 'espada', damage: 18, armor: 3, skills: ['estrategia', 'esgrima'], personality: ['autoritario', 'astuto'], dialogue: {}, loot: ['documentos', 'llave'], isHostile: false, isUnique: false },
    { name: 'Centinela', archetype: 'soldado', faction: 'military', stats: { str: 14, agi: 12, int: 8, per: 14, vol: 10, car: 8 }, hp: 70, maxHp: 70, weapon: 'rifle', damage: 18, armor: 3, skills: ['vigilancia', 'rifle'], personality: ['alerta', 'desconfiado'], dialogue: {}, loot: ['munición'], isHostile: true, isUnique: false },
  ],
  western_border: [
    { name: 'Mercenario', archetype: 'mercenario', faction: 'neutral', stats: { str: 14, agi: 14, int: 10, per: 12, vol: 12, car: 8 }, hp: 90, maxHp: 90, weapon: 'espada', damage: 20, armor: 2, skills: ['combate', 'negociación'], personality: ['pragmático', 'vago'], dialogue: {}, loot: ['dinero', 'arma'], isHostile: false, isUnique: false },
    { name: 'Bandido', archetype: 'bandido', faction: 'neutral', stats: { str: 13, agi: 12, int: 8, per: 10, vol: 10, car: 8 }, hp: 60, maxHp: 60, weapon: 'daga', damage: 12, armor: 1, skills: ['robo', 'emboscada'], personality: ['cobarde', 'ambicioso'], dialogue: {}, loot: ['dinero', 'botín'], isHostile: true, isUnique: false },
    { name: 'Comerciante', archetype: 'comerciante', faction: 'civilian', stats: { str: 8, agi: 10, int: 12, per: 10, vol: 10, car: 14 }, hp: 40, maxHp: 40, damage: 5, armor: 0, skills: ['negociación', 'mercado'], personality: ['amable', 'avispero'], dialogue: {}, loot: ['mercancía'], isHostile: false, isUnique: false },
  ],
  ishval: [
    { name: 'Ishvalano Superviviente', archetype: 'ishvalano', faction: 'ishvalan', stats: { str: 12, agi: 14, int: 10, per: 14, vol: 14, car: 10 }, hp: 70, maxHp: 70, weapon: 'daga', damage: 15, armor: 1, skills: ['supervivencia', 'sigilo'], personality: ['desconfiado', 'honorable'], dialogue: {}, loot: ['artefacto'], isHostile: false, isUnique: false },
    { name: 'Monje del Templo', archetype: 'monje', faction: 'ishvalan', stats: { str: 10, agi: 12, int: 14, per: 12, vol: 16, car: 12 }, hp: 60, maxHp: 60, damage: 10, armor: 0, skills: ['alquimia', 'curación', 'meditación'], personality: ['pacífico', 'sabio'], dialogue: {}, loot: ['incienso', 'pergamino'], isHostile: false, isUnique: false },
  ],
  dublith: [
    { name: 'Alquimista Renegado', archetype: 'alquimista', faction: 'neutral', stats: { str: 8, agi: 10, int: 18, per: 12, vol: 10, car: 10 }, hp: 50, maxHp: 50, damage: 25, armor: 1, skills: ['alquimia', 'experimental'], personality: ['obsesivo', 'genio'], dialogue: {}, loot: ['catalizador', 'experimento'], isHostile: false, isUnique: false },
    { name: 'Obrero', archetype: 'obrero', faction: 'civilian', stats: { str: 14, agi: 10, int: 8, per: 10, vol: 12, car: 8 }, hp: 80, maxHp: 80, damage: 12, armor: 0, skills: ['trabajo_físico'], personality: ['agotado', 'honesto'], dialogue: {}, loot: ['herramienta'], isHostile: false, isUnique: false },
  ],
  northern_border: [
    { name: 'Soldado de Briggs', archetype: 'elite', faction: 'military', stats: { str: 16, agi: 14, int: 10, per: 14, vol: 16, car: 10 }, hp: 100, maxHp: 100, weapon: 'rifle', damage: 22, armor: 4, skills: ['combate_extremo', 'supervivencia'], personality: ['determinado', 'implacable'], dialogue: {}, loot: ['munición', 'razione'], isHostile: true, isUnique: false },
  ],
  underground: [
    { name: 'Quimera', archetype: 'quimera', faction: 'neutral', stats: { str: 18, agi: 14, int: 6, per: 12, vol: 12, car: 4 }, hp: 120, maxHp: 120, weapon: 'garras', damage: 25, armor: 3, skills: ['ferocidad', 'regeneración'], personality: ['salvaje', 'hambrienta'], dialogue: {}, loot: ['restos'], isHostile: true, isUnique: false },
    { name: 'Guardia de Sombra', archetype: 'guardia', faction: 'state', stats: { str: 14, agi: 14, int: 10, per: 14, vol: 12, car: 8 }, hp: 80, maxHp: 80, weapon: 'pistola', damage: 20, armor: 3, skills: ['sigilo', 'combate'], personality: ['silencioso', 'letal'], dialogue: {}, loot: ['llave', 'documento'], isHostile: true, isUnique: false },
  ],
};

export function spawnNPCsForLocation(locationId: string, existingNPCs: NPC[]): NPC[] {
  const templates = NPC_TEMPLATES[locationId] || [];
  if (templates.length === 0) return existingNPCs;

  // Don't spawn if NPCs already present
  if (existingNPCs.length > 0) return existingNPCs;

  // Spawn 1-2 random NPCs
  const count = Math.floor(Math.random() * 2) + 1;
  const shuffled = [...templates].sort(() => Math.random() - 0.5);
  const spawned: NPC[] = shuffled.slice(0, count).map(t => ({
    ...t,
    id: crypto.randomUUID(),
  }));

  return [...existingNPCs, ...spawned];
}
