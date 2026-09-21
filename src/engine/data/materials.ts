export const MATERIAL_CATALOG = [
  { name: 'Hierro', type: 'metal', rarity: 'common', sources: ['chatarra', 'armas', 'estructuras', 'suelo urbano'], alchemyCost: 10 },
  { name: 'Acero', type: 'metal', rarity: 'uncommon', sources: ['armas militares', 'tanques', 'puentes'], alchemyCost: 15 },
  { name: 'Plomo', type: 'metal', rarity: 'common', sources: ['balas', 'pesas', 'tuberías viejas'], alchemyCost: 12 },
  { name: 'Cobre', type: 'metal', rarity: 'common', sources: ['cables', 'monedas', 'tuberías'], alchemyCost: 10 },
  { name: 'Plata', type: 'metal', rarity: 'rare', sources: ['joyería', 'monedas antiguas', 'equipo médico'], alchemyCost: 20 },
  { name: 'Oro', type: 'metal', rarity: 'legendary', sources: ['tesoros', 'reservas bancarias', 'dientes'], alchemyCost: 50 },
  { name: 'Tierra', type: 'elemental', rarity: 'common', sources: ['suelo', 'paredes', 'escombros'], alchemyCost: 5 },
  { name: 'Arena', type: 'elemental', rarity: 'common', sources: ['desiertos', 'playas', 'relojes de arena'], alchemyCost: 3 },
  { name: 'Piedra', type: 'elemental', rarity: 'common', sources: ['rocas', 'edificios', 'estatuas'], alchemyCost: 8 },
  { name: 'Madera', type: 'organic', rarity: 'common', sources: ['árboles', 'muebles', 'construcciones'], alchemyCost: 5 },
  { name: 'Agua', type: 'elemental', rarity: 'common', sources: ['ríos', 'lluvia', 'tuberías', 'botellas'], alchemyCost: 2 },
  { name: 'Aire', type: 'elemental', rarity: 'infinite', sources: ['atmósfera'], alchemyCost: 1 },
  { name: 'Fuego', type: 'elemental', rarity: 'generated', sources: ['antorchas', 'explosiones', 'alquimia'], alchemyCost: 3 },
  { name: 'Carbón', type: 'organic', rarity: 'common', sources: ['minas', 'hornos', 'restos de incendio'], alchemyCost: 4 },
  { name: 'Azufre', type: 'chemical', rarity: 'uncommon', sources: ['volcanes', 'laboratorios', 'pólvora'], alchemyCost: 6 },
  { name: 'Sal', type: 'chemical', rarity: 'common', sources: ['mar', 'minas', 'cocinas', 'sangre'], alchemyCost: 2 },
  { name: 'Tiza', type: 'tool', rarity: 'common', sources: ['tiendas', 'escuelas', 'alquimistas'], alchemyCost: 1 },
  { name: 'Piedra Filosofal', type: 'legendary', rarity: 'mythic', sources: ['???'], alchemyCost: 0, effect: 'Anula costo de materia y círculo. -15 Cordura por uso.' },
];

export function getMaterial(name: string) {
  return MATERIAL_CATALOG.find(m => m.name.toLowerCase() === name.toLowerCase());
}

export function getMaterialsByType(type: string) {
  return MATERIAL_CATALOG.filter(m => m.type === type);
}