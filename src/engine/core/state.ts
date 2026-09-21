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
  const { stress, health, sanity, morale, factions, inventory, companions, clocks, environment, morality, location, ...rest } = changes as any;
  return {
    ...state,
    ...rest,
    ...(location !== undefined ? { location } : {}),
    turn: state.turn + 1,
  };
}

export function getModifier(state: GameState, attribute: keyof Character['attributes']): number {
  const value = state.character.attributes[attribute];
  return Math.floor((value - 10) / 2);
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