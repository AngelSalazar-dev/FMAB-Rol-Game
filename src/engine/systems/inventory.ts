import type { GameState, Item, ParsedAction, GameStateChanges } from '@/types/game';

export function extractMaterialFromInput(input: string): string | undefined {
  const materials = ['hierro', 'acero', 'tierra', 'arena', 'piedra', 'madera', 'agua', 'aire', 'fuego', 'plomo', 'cobre', 'plata', 'oro', 'carbón', 'azufre', 'sal', 'tiza', 'piedra filosofal'];
  const lower = input.toLowerCase();
  for (const m of materials) {
    if (lower.includes(m)) return m;
  }
  return undefined;
}

export function hasItem(state: GameState, itemName: string, quantity: number = 1): boolean {
  const item = state.inventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());
  return item ? item.quantity >= quantity : false;
}

export function getItemQuantity(state: GameState, itemName: string): number {
  const item = state.inventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());
  return item ? item.quantity : 0;
}

export function addItem(state: GameState, item: Omit<Item, 'id'>): GameState {
  const existing = state.inventory.findIndex(i => i.name.toLowerCase() === item.name.toLowerCase());
  if (existing !== -1) {
    const newInv = [...state.inventory];
    newInv[existing] = { ...newInv[existing], quantity: newInv[existing].quantity + item.quantity };
    return { ...state, inventory: newInv };
  }
  return { ...state, inventory: [...state.inventory, { ...item, id: crypto.randomUUID() }] };
}

export function removeItem(state: GameState, itemName: string, quantity: number = 1): GameState {
  const existing = state.inventory.findIndex(i => i.name.toLowerCase() === itemName.toLowerCase());
  if (existing === -1) return state;

  const newInv = [...state.inventory];
  if (newInv[existing].quantity <= quantity) {
    newInv.splice(existing, 1);
  } else {
    newInv[existing] = { ...newInv[existing], quantity: newInv[existing].quantity - quantity };
  }
  return { ...state, inventory: newInv };
}

export function processInventory(parsed: ParsedAction, dice: any, state: GameState) {
  const details: string[] = [];
  const changes: GameStateChanges = {};

  const lower = parsed.raw.toLowerCase();

  if (lower.includes('veo') || lower.includes('ver') || lower.includes('muestra') || lower.includes('inventario')) {
    if (state.inventory.length === 0) {
      details.push('Tu inventario está vacío.');
    } else {
      details.push('Inventario:');
      state.inventory.forEach(i => {
        details.push(`  - ${i.name} x${i.quantity} (${i.item_type})`);
      });
    }
    return { success: true, outcome: 'complete' as const, changes, details };
  }

  if (lower.includes('tomo') || lower.includes('agarro') || lower.includes('recogo')) {
    const material = extractMaterialFromInput(lower);
    if (material) {
      const newItem: Omit<Item, 'id'> = {
        name: material,
        quantity: 1,
        item_type: 'material',
        properties: {},
      };
      changes.inventory = { add: newItem };
      details.push(`Recoges ${material}.`);
    }
    return { success: true, outcome: 'complete' as const, changes, details };
  }

  if (lower.includes('uso') || lower.includes('usar') || lower.includes('consume') || lower.includes('beber') || lower.includes('comer')) {
    const consumables = state.inventory.filter(i => i.item_type === 'consumable');
    if (consumables.length === 0) {
      details.push('No tienes consumibles.');
      return { success: false, outcome: 'miss' as const, changes, details };
    }
    const item = consumables[0];
    changes.inventory = { remove: { name: item.name, quantity: 1 } };
    details.push(`Usas ${item.name}.`);
    if (item.properties.heal) changes.heal = item.properties.heal;
    if (item.properties.stress) changes.stress = -item.properties.stress;
    return { success: true, outcome: 'complete' as const, changes, details };
  }

  return { success: false, outcome: 'miss' as const, changes, details: ['Acción de inventario no reconocida.'] };
}

export function getInventoryDescription(inventory: Item[]): string {
  if (inventory.length === 0) return 'Vacío';
  return inventory.map(i => `${i.name} x${i.quantity}`).join(', ');
}