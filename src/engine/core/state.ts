import type { GameState, Character, Injury, Clock, Item, FactionState, Companion, EnvironmentState, MoralityState, StressState, SanityState } from '@/types/game';
import { DEFAULT_CLOCKS, createClock } from './clocks';

export const INITIAL_STATE: GameState = {
  turn: 0,
  mode: 'freedom',
  character: {
    id: 0,
    name: '',
    origin: 'central',
    history: 'civilian',
    seenGate: false,
    appearance: { face: '', scars: [], clothing: '', automail: undefined },
    attributes: { str: 10, agi: 10, int: 10, per: 10, vol: 10, car: 10 },
    skills: [],
    hp: 100,
    maxHp: 100,
    stress: 0,
    maxStress: 100,
    sanity: 100,
    maxSanity: 100,
  },
  health: {
    current: 100,
    max: 100,
    injuries: [],
    automailParts: [],
  },
  stress: {
    current: 0,
    max: 100,
    traumas: [],
  },
  sanity: {
    current: 100,
    max: 100,
    conditions: [],
  },
  inventory: [],
  factions: {
    military: 0,
    ishvalan: 0,
    resistance: 0,
    state: 0,
    suspicion: 0,
  },
  location: 'central_city',
  weather: 'clear',
  timeOfDay: 'day',
  terrain: 'urban',
  companions: [],
  clocks: DEFAULT_CLOCKS.map(c => ({ ...c })),
  morality: {
    karma: 0,
    decisions: [],
    alignment: 'neutral',
  },
  environment: {
    weather: 'clear',
    time: 'day',
    terrain: 'urban',
    temperature: 20,
  },
  npcs: [],
};

export function createInitialState(character: Character): GameState {
  return {
    ...INITIAL_STATE,
    character,
    health: { ...INITIAL_STATE.health, current: character.hp, max: character.maxHp },
    stress: { ...INITIAL_STATE.stress, max: character.maxStress },
    sanity: { ...INITIAL_STATE.sanity, max: character.maxSanity },
  };
}

export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

export function applyStateChanges(state: GameState, changes: Partial<GameState>): GameState {
  const c = changes as any;

  // Handle inventory add/remove
  let newInventory = [...state.inventory];
  if (c.inventory?.add) {
    const existing = newInventory.find(i => i.name === c.inventory.add.name);
    if (existing) {
      newInventory = newInventory.map(i =>
        i.name === c.inventory.add.name ? { ...i, quantity: i.quantity + c.inventory.add.quantity } : i
      );
    } else {
      newInventory.push({ ...c.inventory.add, id: crypto.randomUUID() });
    }
  }
  if (c.inventory?.remove) {
    newInventory = newInventory
      .map(i => i.name === c.inventory.remove.name ? { ...i, quantity: i.quantity - c.inventory.remove.quantity } : i)
      .filter(i => i.quantity > 0);
  }

  // Handle companion loyalty
  let newCompanions = c.companions ? [...c.companions] : [...state.companions];
  if (c.companionLoyalty) {
    newCompanions = newCompanions.map(comp =>
      comp.id === c.companionLoyalty.id
        ? { ...comp, loyalty: Math.max(0, Math.min(100, comp.loyalty + c.companionLoyalty.change)) }
        : comp
    );
  }

  // Handle clocks
  let newClocks = [...state.clocks];
  if (c.clocks) {
    for (const [clockId, delta] of Object.entries(c.clocks)) {
      newClocks = newClocks.map(cl =>
        cl.id === clockId ? { ...cl, filled: Math.max(0, Math.min(cl.segments, cl.filled + (delta as number))) } : cl
      );
    }
  }

  // Handle injuries
  let newInjuries = [...state.health.injuries];
  if (c.injury) {
    newInjuries.push(c.injury);
  }
  if (c.heal) {
    newInjuries = newInjuries.filter(i => !i.treated).slice(c.heal);
  }

  // Handle money
  const currentMoney = state.inventory.find(i => i.name === 'dinero');
  const moneyChange = c.money || 0;
  if (moneyChange !== 0 && currentMoney) {
    newInventory = newInventory.map(i =>
      i.name === 'dinero' ? { ...i, quantity: Math.max(0, i.quantity + moneyChange) } : i
    );
  } else if (moneyChange > 0 && !currentMoney) {
    newInventory.push({ id: crypto.randomUUID(), name: 'dinero', quantity: moneyChange, item_type: 'material', properties: {} });
  }

  // Handle stress (number = direct change)
  let newStress = state.stress;
  if (typeof c.stress === 'number') {
    newStress = { ...state.stress, current: Math.max(0, Math.min(state.stress.max, state.stress.current + c.stress)) };
  }

  // Handle sanity (number = direct change)
  let newSanity = state.sanity;
  if (typeof c.sanity === 'number') {
    newSanity = { ...state.sanity, current: Math.max(0, Math.min(state.sanity.max, state.sanity.current + c.sanity)) };
  }

  return {
    ...state,
    ...(c.location !== undefined ? { location: c.location } : {}),
    turn: state.turn + 1,
    health: { ...state.health, current: c.health?.current ?? state.health.current, injuries: newInjuries },
    stress: newStress,
    sanity: newSanity,
    factions: c.factions ? { ...state.factions, ...c.factions } : state.factions,
    inventory: newInventory,
    companions: newCompanions,
    clocks: newClocks,
    environment: c.environment ? { ...state.environment, ...c.environment } : state.environment,
    morality: c.morality ? { ...state.morality, ...(typeof c.morality === 'object' && !Array.isArray(c.morality) ? c.morality : {}) } : state.morality,
    character: c.character ? { ...state.character, ...c.character } : state.character,
    npcs: c.npcs !== undefined ? [...c.npcs] : state.npcs,
    stealth: c.stealth !== undefined ? { ...(state.stealth || {}), ...c.stealth } : state.stealth,
  } as GameState;
}

export function getModifier(state: GameState, attribute: keyof Character['attributes']): number {
  const value = state.character.attributes[attribute];
  let mod = Math.floor((value - 10) / 2);
  
  // Injury penalties
  const untreatedInjuries = state.health.injuries.filter(i => !i.treated);
  const severeInjuries = untreatedInjuries.filter(i => i.severity === 'severe').length;
  const moderateInjuries = untreatedInjuries.filter(i => i.severity === 'moderate').length;
  const lightInjuries = untreatedInjuries.filter(i => i.severity === 'light').length;
  
  mod -= severeInjuries * 2;
  mod -= moderateInjuries * 1;
  mod -= lightInjuries * 0; // Light injuries don't penalize
  
  return mod;
}

export function isAlive(state: GameState): boolean {
  return state.health.current > 0;
}

export function isInsane(state: GameState): boolean {
  return state.sanity.current <= 0;
}

export function getTraumaCount(state: GameState): number {
  return state.stress.traumas.length;
}

export function shouldRetire(state: GameState): boolean {
  return getTraumaCount(state) >= 4 || isInsane(state) || !isAlive(state);
}