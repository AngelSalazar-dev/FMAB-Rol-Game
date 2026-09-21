import type { GameState } from '@/types/game';

export interface LocationData {
  name: string;
  description: string;
  connections: string[];
  materials: string[];
  npcs: string[];
  danger: number;
  terrain: GameState['terrain'];
}

export const LOCATIONS: Record<string, LocationData> = {
  central_city: {
    name: 'Central City',
    description: 'La capital de Amestris. Edificios de piedra gris, calles empedradas, cuarteles militares en cada esquina. El aire huele a hollín, aceite y burocracia.',
    connections: ['eastern_hq', 'western_border', 'underground'],
    materials: ['hierro', 'acero', 'piedra', 'carbón', 'tiza'],
    npcs: ['soldado', 'civil', 'alquimista_estatal', 'informante', 'periodista'],
    danger: 2,
    terrain: 'urban',
  },
  eastern_hq: {
    name: 'Cuartel General del Este',
    description: 'Fortaleza de ladrillo rojo y acero. Bandera de Amestris ondeando. Centinelas en cada torre. El corazón del poder militar.',
    connections: ['central_city'],
    materials: ['acero', 'pólvora', 'documentos', 'munición'],
    npcs: ['general', 'soldado', 'oficial', 'secretaria', 'prisionero'],
    danger: 8,
    terrain: 'urban',
  },
  western_border: {
    name: 'Frontera Oeste',
    description: 'Tierras baldías azotadas por el viento. Puestos de avanzada oxidados. La ley del más fuerte. Creta al otro lado.',
    connections: ['central_city', 'drachma_border'],
    materials: ['hierro', 'madera', 'pieles', 'chatarra'],
    npcs: ['mercenario', 'comerciante', 'refugiado', 'bandido', 'explorador'],
    danger: 5,
    terrain: 'desert',
  },
  ishval: {
    name: 'Región de Ishval',
    description: 'Ruinas blancas bajo el sol implacable. Arena que cubre templos y hogares. El olor a sangre seca y incienso viejo.',
    connections: ['eastern_desert'],
    materials: ['arena', 'piedra', 'vidrio', 'artefactos_antiguos', 'tela_roja'],
    npcs: ['ishvalano', 'monje', 'superviviente', 'fantasma', 'niño_perdido'],
    danger: 7,
    terrain: 'desert',
  },
  dublith: {
    name: 'Dublith',
    description: 'Ciudad del humo y el vapor. Chimeneas vomitando negro. Alquimistas independientes, mercenarios, y la carnicería de Izumi.',
    connections: ['southern_border'],
    materials: ['hierro', 'carbón', 'ácidos', 'catalizadores', 'cuero'],
    npcs: ['alquimista_renegado', 'obrero', 'izumi', 'mason', 'cliente_sospechoso'],
    danger: 4,
    terrain: 'urban',
  },
  northern_border: {
    name: 'Fortaleza Briggs',
    description: 'Montaña helada. Acero azulado. Soldados que no tiemblan. El Mayor General Olivier Mira Armstrong observa desde lo alto.',
    connections: ['drachma_border'],
    materials: ['acero_britannico', 'aceite_especial', 'munición', 'lana', 'hielo_puro'],
    npcs: ['soldado_briggs', 'general_olivier', 'doctor_knox', 'bucket', 'recluta'],
    danger: 9,
    terrain: 'mountain',
  },
  underground: {
    name: 'Subterráneos de Central',
    description: 'Oscuridad absoluta. Túneles que huelen a óxido, sangre y algo peor. Laboratorios donde la ciencia no tiene ética.',
    connections: ['central_city', 'father_lair'],
    materials: ['piedra', 'agua_estancada', 'hongos', 'restos_quimera', 'equipo_quirúrgico'],
    npcs: ['quimera', 'experimento', 'guardia_sombra', 'doctor', 'voz_en_la_oscuridad'],
    danger: 10,
    terrain: 'urban',
  },
  eastern_desert: {
    name: 'Desierto del Este',
    description: 'Dunas infinitas. Ruinas de Xerxes a lo lejos. El sol quema de día, el hielo muerde de noche.',
    connections: ['ishval', 'xerxes_ruins'],
    materials: ['arena', 'piedra_antigua', 'fósiles', 'vidrio_volcánico'],
    npcs: ['nómada', 'arqueólogo', 'escorpión_gigante', 'espiritu_arena'],
    danger: 6,
    terrain: 'desert',
  },
  xerxes_ruins: {
    name: 'Ruinas de Xerxes',
    description: 'Ciudad milenaria convertida en círculo de transmutación gigante. Sombras que se mueven solas. La verdad duerme aquí.',
    connections: ['eastern_desert'],
    materials: ['piedra_filosófica_fragmento', 'sangre_seca', 'cenizas_humanas', 'conocimiento_prohibido'],
    npcs: ['enano_en_la_botella', 'sombra', 'eco_del_pasado'],
    danger: 10,
    terrain: 'desert',
  },
  drachma_border: {
    name: 'Frontera de Drachma',
    description: 'Nieve perpetua. Trincheras heladas. Bandera de oso contra dragón. La guerra nunca termina aquí.',
    connections: ['western_border', 'northern_border'],
    materials: ['hierro_frío', 'piel_oso', 'vodka', 'cartas_casa'],
    npcs: ['soldado_drachma', 'oficial_ruso', 'espía', 'desertor'],
    danger: 8,
    terrain: 'mountain',
  },
  father_lair: {
    name: 'Guarida del Padre',
    description: 'Bajo Central. Tubos, cables, contenedores. Siete homúnculos. Un círculo que abarca la nación. El fin del mundo.',
    connections: ['underground'],
    materials: ['piedra_filosófal', 'almas_humanas', 'sangre_del_padre', 'verdad_pura'],
    npcs: ['padre', 'orgullo', 'lujuria', 'gula', 'avaricia', 'pereza', 'ira', 'envidia'],
    danger: 10,
    terrain: 'urban',
  },
};

export function extractLocation(input: string): string | null {
  const locations = ['central_city', 'eastern_hq', 'western_border', 'ishval', 'dublith', 'northern_border', 'underground', 'eastern_desert', 'xerxes_ruins', 'drachma_border', 'father_lair'];
  for (const loc of locations) {
    const name = LOCATIONS[loc]?.name.toLowerCase() || '';
    if (input.includes(name) || input.includes(loc.replace('_', ' '))) return loc;
  }
  return null;
}

export function getLocation(id: string) {
  return LOCATIONS[id];
}

export function getConnectedLocations(locationId: string) {
  const loc = LOCATIONS[locationId];
  if (!loc) return [];
  return loc.connections.map(id => ({ id, ...LOCATIONS[id] }));
}