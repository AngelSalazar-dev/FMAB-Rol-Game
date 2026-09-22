export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type ProviderName = 'groq' | 'openrouter';

export interface ProviderStatus {
  available: boolean;
  cooldownUntil: number;
  failCount: number;
}

export interface CompletionResult {
  text: string;
  provider: ProviderName;
  tokensUsed?: { prompt: number; completion: number };
}

export interface Personality {
  id: string;
  name: string;
  emoji: string;
  description: string;
  systemPrompt: string;
  enabled?: boolean;
  provider?: 'groq' | 'openrouter';
  modelId?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  personalityId: string;
  isLoading: boolean;
  streamingText: string;
  activeProvider: ProviderName | null;
}

export interface Character {
  id: number;
  name: string;
  origin: 'central' | 'ishval' | 'drachma' | 'xing';
  history: 'alchemist' | 'soldier' | 'civilian' | 'prisoner';
  seenGate: boolean;
  appearance: {
    face: string;
    scars: string[];
    clothing: string;
    automail?: string;
  };
  attributes: {
    str: number;
    agi: number;
    int: number;
    per: number;
    vol: number;
    car: number;
  };
  skills: string[];
  hp: number;
  maxHp: number;
  stress: number;
  maxStress: number;
  sanity: number;
  maxSanity: number;
}

export interface Injury {
  id: string;
  bodyPart: 'head' | 'torso' | 'left_arm' | 'right_arm' | 'left_leg' | 'right_leg';
  type: 'cut' | 'fracture' | 'burn' | 'bullet' | 'blunt';
  severity: 'light' | 'moderate' | 'severe' | 'critical';
  treated: boolean;
  isAutomail: boolean;
}

const BODY_PARTS = ['head', 'torso', 'left_arm', 'right_arm', 'left_leg', 'right_leg'] as const;
export type BodyPart = typeof BODY_PARTS[number];

export interface HealthState {
  current: number;
  max: number;
  injuries: Injury[];
  automailParts: BodyPart[];
}

export interface Trauma {
  id: string;
  type: 'cold' | 'haunted' | 'obsessed' | 'paranoid' | 'reckless' | 'soft' | 'unstable' | 'vicious';
  permanent: boolean;
}

export interface StressState {
  current: number;
  max: number;
  traumas: Trauma[];
}

export interface SanityState {
  current: number;
  max: number;
  conditions: string[];
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  item_type: 'material' | 'weapon' | 'tool' | 'consumable' | 'key';
  properties: Record<string, any>;
  weight?: number;
  equipped?: boolean;
  stowed?: boolean;
}

export type StealthState = {
  hidden: boolean;
  advantage?: boolean;
  compromised?: boolean;
  detected?: boolean;
  detectionLevel: number;
  turnsHidden: number;
  lastKnownPosition?: string;
};

export interface FactionState {
  military: number;
  ishvalan: number;
  resistance: number;
  state: number;
  suspicion: number;
}

export interface Companion {
  id: string;
  name: string;
  loyalty: number;
  isAlive: boolean;
  status: 'active' | 'injured' | 'missing' | 'dead';
  personality: {
    traits: string[];
    trauma?: string;
    vice?: string;
  };
  skills: string[];
}

export interface Clock {
  id: string;
  name: string;
  segments: number;
  filled: number;
  color: 'red' | 'blue' | 'green' | 'yellow';
  description?: string;
}

export interface Decision {
  id: string;
  description: string;
  choice: string;
  karmaChange: number;
  timestamp: number;
  consequences: string[];
}

export interface MoralityState {
  karma: number;
  decisions: Decision[];
  alignment: 'noble' | 'neutral' | 'ruthless';
}

export interface EnvironmentState {
  weather: 'clear' | 'rain' | 'snow' | 'fog' | 'storm';
  time: 'dawn' | 'day' | 'dusk' | 'night';
  terrain: 'urban' | 'forest' | 'desert' | 'mountain' | 'coast';
  temperature: number;
}

export type WeatherType = EnvironmentState['weather'];
export type TimeOfDay = EnvironmentState['time'];
export type TerrainType = EnvironmentState['terrain'];

export interface GameState {
  turn: number;
  mode: 'freedom' | 'story';
  character: Character;
  health: HealthState;
  stress: StressState;
  sanity: SanityState;
  inventory: Item[];
  factions: FactionState;
  location: string;
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  terrain: TerrainType;
  companions: Companion[];
  clocks: Clock[];
  morality: MoralityState;
  environment: EnvironmentState;
  npcs: NPC[];
  stealth?: StealthState;
}

export interface ParsedAction {
  type: 'alchemy' | 'combat' | 'stealth' | 'social' | 'exploration' | 'inventory' | 'rest' | 'moral' | 'unknown';
  intent: string;
  target?: string;
  material?: string;
  weapon?: string;
  skill?: string;
  raw: string;
}

export interface DiceResult {
  total: number;
  roll1: number;
  roll2: number;
  modifier: number;
  outcome: 'complete' | 'partial' | 'miss';
  critical?: boolean;
  fumble?: boolean;
  advantage?: boolean;
  disadvantage?: boolean;
}

export interface PendingDice {
  action: string;
  parsed: ParsedAction;
  modifier: number;
  state: GameState;
}

export interface AIResponse {
  narrative: string;
  stateChanges: Partial<GameState>;
  moralChoice?: {
    description: string;
    options: string[];
  };
  consequences: string[];
}

export interface NarrativeContext {
  action: string;
  parsed: ParsedAction;
  dice: DiceResult;
  mechanicalResult: any;
  state: GameState;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  startingLocation: string;
  startingState: Partial<GameState>;
  objectives: string[];
}

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

export interface Weapon {
  name: string;
  damage: number;
  range: 'melee' | 'short' | 'medium' | 'long';
  type: 'physical' | 'alchemy';
}

export interface SaveData {
  id: number;
  characterId: number;
  mode: 'freedom' | 'story';
  state: GameState;
  turnCount: number;
  decisionHistory: Decision[];
  messages: { role: 'user' | 'assistant'; content: string }[];
  isAlive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameStateChanges {
  stress?: number;
  injury?: Injury;
  heal?: number;
  health?: HealthState;
  sanity?: number;
  suspicion?: number;
  reputation?: { faction: string; amount: number };
  companionLoyalty?: { id: string; change: number };
  morality?: Omit<Decision, 'id' | 'timestamp'>;
  moralChoice?: any;
  clocks?: Record<string, number>;
  inventory?: { add?: Omit<Item, 'id'>; remove?: { name: string; quantity: number } };
  timeAdvanced?: boolean;
  automailMaintained?: boolean;
  combat?: { damage: number; weapon: string; position: string };
  research?: { success: boolean; quality: string };
  training?: { skill: string; bonus: number };
  money?: number;
  social?: { success: boolean; intent: string; attitude: string; conditions?: boolean };
  stealth?: StealthState;
  resistance?: { success: boolean; critical: boolean; consequenceReduced: boolean };
  exploration?: { found: boolean };
  perception?: { alert: boolean; details: string };
  location?: string;
  environment?: { terrain?: TerrainType };
  investigation?: { success: boolean; info: string };
  npcs?: NPC[];
  companions?: Companion[];
  character?: Partial<Character>;
  factions?: Partial<FactionState>;
}

export interface LocationData {
  name: string;
  description: string;
  connections: string[];
  materials: string[];
  npcs: string[];
  danger: number;
  terrain: GameState['terrain'];
}

export interface MoralOption {
  text: string;
  karma: number;
  stress: number;
  sanity?: number;
  suspicion?: number;
  consequence: string;
}

export interface MoralChoice {
  id: string;
  description: string;
  options: MoralOption[];
}