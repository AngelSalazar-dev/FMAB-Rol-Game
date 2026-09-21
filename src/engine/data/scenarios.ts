import type { GameState, Scenario } from '@/types/game';

export const SCENARIOS: Scenario[] = [
  {
    id: 'awakening',
    name: 'El Despertar',
    description: 'Despiertas en una celda fría. No recuerdas cómo llegaste aquí. Solo sabes que tus manos brillan con energía extraña.',
    startingLocation: 'underground',
    startingState: {
      health: { current: 50, max: 100, injuries: [{ id: '1', bodyPart: 'head', type: 'blunt', severity: 'moderate', treated: false, isAutomail: false }], automailParts: [] },
      stress: { current: 30, max: 100, traumas: [] },
      sanity: { current: 80, max: 100, conditions: ['amnesia'] },
      inventory: [],
      factions: { military: 0, ishvalan: 0, resistance: 0, state: -10, suspicion: 20 },
      clocks: [],
    },
    objectives: ['Escapar de la celda', 'Descubrir quién eres', 'Encontrar tus guantes o tiza'],
  },
  {
    id: 'state_alchemist_exam',
    name: 'Examen de Alquimista Estatal',
    description: 'Estás ante el tribunal militar. Debes demostrar tu valía. El General Mustang te observa desde las sombras.',
    startingLocation: 'eastern_hq',
    startingState: {
      health: { current: 100, max: 100, injuries: [], automailParts: [] },
      stress: { current: 40, max: 100, traumas: [] },
      sanity: { current: 100, max: 100, conditions: [] },
      inventory: [{ id: '1', name: 'tiza', quantity: 3, item_type: 'tool', properties: {} }],
      factions: { military: 10, ishvalan: 0, resistance: -10, state: 20, suspicion: 5 },
      clocks: [],
    },
    objectives: ['Impresionar a los examinadores', 'No revelar conocimientos prohibidos', 'Ganar el reloj de plata'],
  },
  {
    id: 'ishvalan_revenge',
    name: 'Venganza Ishvalana',
    description: 'Eres un superviviente de la guerra. Tus ojos arden con el fuego de la venganza. Un alquimista estatal destruyó tu templo.',
    startingLocation: 'ishval',
    startingState: {
      health: { current: 80, max: 100, injuries: [{ id: '1', bodyPart: 'torso', type: 'burn', severity: 'severe', treated: false, isAutomail: false }], automailParts: [] },
      stress: { current: 60, max: 100, traumas: [{ id: '1', type: 'haunted', permanent: true }] },
      sanity: { current: 60, max: 100, conditions: ['pesadillas'] },
      inventory: [{ id: '1', name: 'rifle_antiguo', quantity: 1, item_type: 'weapon', properties: {} }, { id: '2', name: 'agua', quantity: 5, item_type: 'consumable', properties: { heal: 10 } }],
      factions: { military: -50, ishvalan: 30, resistance: 10, state: -30, suspicion: 15 },
      clocks: [],
    },
    objectives: ['Encontrar al alquimista responsable', 'Reunir aliados', 'Supervivencia en el desierto'],
  },
  {
    id: 'homunculus_hunter',
    name: 'Cazador de Homúnculos',
    description: 'Trabajas para una organización secreta. Tu misión: eliminar a los siete pecados capitales. Tu brazo de automail late con cada latido.',
    startingLocation: 'central_city',
    startingState: {
      health: { current: 100, max: 100, injuries: [], automailParts: ['right_arm'] },
      stress: { current: 20, max: 100, traumas: [] },
      sanity: { current: 90, max: 100, conditions: [] },
      inventory: [{ id: '1', name: 'pistola', quantity: 1, item_type: 'weapon', properties: {} }, { id: '2', name: 'munición', quantity: 30, item_type: 'consumable', properties: {} }, { id: '3', name: 'dossier_homúnculos', quantity: 1, item_type: 'key', properties: {} }],
      factions: { military: 20, ishvalan: 0, resistance: 30, state: 10, suspicion: 40 },
      clocks: [],
    },
    objectives: ['Rastrear a Lujuria', 'Proteger a aliados', 'No convertirse en monstruo'],
  },
  {
    id: 'xerxes_explorer',
    name: 'Explorador de Xerxes',
    description: 'Arqueólogo obsesionado con la civilización perdida. Has encontrado un fragmento de piedra filosofal. Voces susurran en tu mente.',
    startingLocation: 'xerxes_ruins',
    startingState: {
      health: { current: 70, max: 100, injuries: [], automailParts: [] },
      stress: { current: 40, max: 100, traumas: [] },
      sanity: { current: 50, max: 100, conditions: ['susurros'] },
      inventory: [{ id: '1', name: 'fragmento_piedra', quantity: 1, item_type: 'key', properties: { sanityCost: 5 } }, { id: '2', name: 'diario', quantity: 1, item_type: 'tool', properties: {} }],
      factions: { military: -10, ishvalan: 0, resistance: 0, state: -20, suspicion: 10 },
      clocks: [],
    },
    objectives: ['Descifrar los jeroglíficos', 'Resistir la corrupción', 'Decidir el destino del fragmento'],
  },
  {
    id: 'free_mode',
    name: 'Modo Libertad',
    description: 'Sin historia predefinida. Eres quien elijas ser. El mundo de Amestris te espera.',
    startingLocation: 'central_city',
    startingState: {
      health: { current: 100, max: 100, injuries: [], automailParts: [] },
      stress: { current: 0, max: 100, traumas: [] },
      sanity: { current: 100, max: 100, conditions: [] },
      inventory: [{ id: '1', name: 'tiza', quantity: 5, item_type: 'tool', properties: {} }],
      factions: { military: 0, ishvalan: 0, resistance: 0, state: 0, suspicion: 0 },
      clocks: [],
    },
    objectives: ['Supervivencia', 'Descubrimiento', 'Poder', 'Redención - tú eliges'],
  },
];

export function getScenario(id: string) {
  return SCENARIOS.find(s => s.id === id);
}

export function getAllScenarios() {
  return SCENARIOS;
}