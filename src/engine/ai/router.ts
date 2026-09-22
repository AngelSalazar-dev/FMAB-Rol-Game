import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { FMAB_SYSTEM_PROMPT, DEATH_PROMPT, INSANITY_PROMPT, VICTORY_PROMPT } from './prompts';
import { LOCATIONS } from '@/engine/data/locations';

const OPENROUTER_MODELS = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3.5-lightning:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'minimax/minimax-m3:free',
  'openrouter/free:free',
];

const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.6-27b',
  'llama-3.3-70b-versatile',
];

const COOLDOWN_MS = 60_000;
const MAX_FAILS = 5;
const REQUEST_TIMEOUT_MS = 30_000;

type ProviderName = 'openrouter' | 'groq';

interface ProviderStatus {
  available: boolean;
  cooldownUntil: number;
  failCount: number;
}

let openrouterClient: OpenAI | null = null;
let groqClient: Groq | null = null;
let initialized = false;
const status: Record<ProviderName, ProviderStatus> = {
  openrouter: { available: false, cooldownUntil: 0, failCount: 0 },
  groq: { available: false, cooldownUntil: 0, failCount: 0 },
};

export function initProviders() {
  if (initialized) return;
  initialized = true;

  const orKey = process.env.OPENROUTER_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  console.log('Initializing AI providers...');
  console.log('OPENROUTER_API_KEY:', orKey ? 'Set' : 'Not set');
  console.log('GROQ_API_KEY:', groqKey ? 'Set' : 'Not set');

  if (orKey) {
    openrouterClient = new OpenAI({
      apiKey: orKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    status.openrouter.available = true;
  }

  if (groqKey) {
    groqClient = new Groq({ apiKey: groqKey });
    status.groq.available = true;
  }
}

function checkCooldown(name: ProviderName): boolean {
  return Date.now() < status[name].cooldownUntil;
}

function resetCooldownIfNeeded(name: ProviderName) {
  const s = status[name];
  if (s.cooldownUntil > 0 && Date.now() >= s.cooldownUntil) {
    s.cooldownUntil = 0;
    s.failCount = 0;
    s.available = true;
  }
}

function recordFailure(name: ProviderName, isRateLimit: boolean = false) {
  const s = status[name];
  s.failCount++;
  if (isRateLimit || s.failCount >= MAX_FAILS) {
    s.cooldownUntil = Date.now() + (isRateLimit ? COOLDOWN_MS * 3 : COOLDOWN_MS);
    s.available = false;
  }
}

function recordSuccess(name: ProviderName) {
  status[name].failCount = 0;
  status[name].cooldownUntil = 0;
  status[name].available = true;
}

export interface NarrativeContext {
  action: string;
  parsed: any;
  dice: any;
  mechanicalResult: any;
  state: any;
  recentNarratives?: string[];
}

export async function generateNarrative(context: NarrativeContext): Promise<string> {
  const prompt = buildPrompt(context);

  const messages = [
    { role: 'system' as const, content: FMAB_SYSTEM_PROMPT },
    { role: 'user' as const, content: prompt },
  ];

  try {
    const result = await streamChat(messages);
    if (!result || result.trim().length === 0) {
      console.warn('AI returned empty response, using fallback');
      return generateFallback(context);
    }
    return result;
  } catch (e) {
    console.error('All AI providers failed, using fallback:', e);
    return generateFallback(context);
  }
}

function generateFallback(context: NarrativeContext): string {
  const { action, mechanicalResult, state } = context;
  const outcome = mechanicalResult?.outcome || 'miss';
  const name = state?.character?.name || 'El alquimista';

  const fallbacks: Record<string, string[]> = {
    complete: [
      `${name} ejecuta la acción con precisión. El resultado supera lo esperado.`,
      `La acción de ${name} sale perfectamente. Todo funciona como planeado.`,
      `${name} logra lo que se propuso. El éxito es claro.`,
    ],
    partial: [
      `${name} logra parte de lo que quería, pero algo sale mal por el camino.`,
      `La acción de ${name} funciona a medias. Hay una consecuencia no esperada.`,
      `${name} avanza, pero el costo es más alto del previsto.`,
    ],
    miss: [
      `${name} falla estrepitosamente. La situación se complica.`,
      `La acción de ${name} no produce el efecto deseado. Algo sale mal.`,
      `${name} intenta pero no lo logra. Las cosas empeoran.`,
    ],
  };

  const options = fallbacks[outcome] || fallbacks.miss;
  return options[Math.floor(Math.random() * options.length)];
}

function buildPrompt(context: NarrativeContext): string {
  const { action, parsed, dice, mechanicalResult, state, recentNarratives } = context;

  let prompt = `ACCIÓN: "${action}"\n`;
  prompt += `TIPO: ${parsed.type} | RESULTADO: ${mechanicalResult.outcome.toUpperCase()}\n`;
  prompt += `TIRADA: ${dice.roll1}+${dice.roll2}${dice.modifier >= 0 ? '+' : ''}${dice.modifier}=${dice.total}\n\n`;

  // Compressed mechanical details
  if (mechanicalResult.details.length > 0) {
    const summary = mechanicalResult.details
      .filter((d: string) => !d.startsWith('Arma:') && !d.startsWith('Posición:') && !d.startsWith('Tirada:'))
      .slice(0, 3)
      .join('. ');
    if (summary) prompt += `RESULTADO: ${summary}\n\n`;
  }

  // Character core
  const ch = state.character;
  prompt += `PERSONAJE: ${ch.name} (${ch.origin}, ${ch.history})\n`;
  prompt += `ATTR: FUE${ch.attributes.str} AGI${ch.attributes.agi} INT${ch.attributes.int} PER${ch.attributes.per} VOL${ch.attributes.vol} CAR${ch.attributes.car}\n`;
  prompt += `HP: ${state.health.current}/${state.health.max} | ESTRÉS: ${state.stress.current}/${state.stress.max} | CORDURA: ${state.sanity.current}/${state.sanity.max}\n`;

  // Appearance
  if (ch.appearance) {
    const parts: string[] = [];
    if (ch.appearance.scars?.length) parts.push(`cicatrices: ${ch.appearance.scars.join(', ')}`);
    if (ch.appearance.automail) parts.push(`automail: ${ch.appearance.automail}`);
    if (ch.appearance.clothing) parts.push(`ropa: ${ch.appearance.clothing}`);
    if (parts.length) prompt += `APARIENCIA: ${parts.join(', ')}\n`;
  }

  // Skills
  if (ch.skills?.length) prompt += `HABILIDADES: ${ch.skills.join(', ')}\n`;

  // Location with description
  const loc = LOCATIONS[state.location];
  if (loc) {
    prompt += `\nUBICACIÓN: ${loc.name}\n`;
    prompt += `DESCRIPCIÓN: ${loc.description}\n`;
    prompt += `CONEXIONES: ${loc.connections.map((c: string) => LOCATIONS[c]?.name || c).join(', ')}\n`;
    prompt += `PELIGRO: ${loc.danger}/10\n`;
  }

  // Environment
  prompt += `CLIMA: ${state.environment.weather}, ${state.environment.time}, ${state.environment.temperature}°C\n`;

  // Factions
  const f = state.factions;
  prompt += `FACCIONES: Mil${f.military} Ish${f.ishvalan} Res${f.resistance} Est${f.state} Sos${f.suspicion}%\n`;

  // Clocks
  if (state.clocks?.length) {
    const clockStr = state.clocks
      .filter((c: any) => c.filled > 0)
      .map((c: any) => `${c.name}(${c.filled}/${c.max})`)
      .join(', ');
    if (clockStr) prompt += `RELOJES: ${clockStr}\n`;
  }

  // Morality
  prompt += `ALINEAMIENTO: ${state.morality.alignment} (karma: ${state.morality.karma})\n`;

  // Injuries
  if (state.health.injuries.length > 0) {
    const INJURY_BODY: Record<string, string> = {
      head: 'Cabeza', torso: 'Torso', left_arm: 'Brazo izq', right_arm: 'Brazo der',
      left_leg: 'Pierna izq', right_leg: 'Pierna der', hand: 'Mano',
    };
    const INJURY_TYPE: Record<string, string> = {
      cut: 'Corte', fracture: 'Fractura', burn: 'Quemadura', bullet: 'Balazo',
      blunt: 'Golpe', stab: 'Aplastamiento',
    };
    const injuries = state.health.injuries
      .map((i: any) => `${INJURY_BODY[i.bodyPart] || i.bodyPart}:${INJURY_TYPE[i.type] || i.type}(${i.severity})${i.treated ? '✓' : '✗'}`)
      .join(', ');
    prompt += `HERIDAS: ${injuries}\n`;
  }

  // Inventory (compressed)
  if (state.inventory.length > 0) {
    const items = state.inventory
      .slice(0, 8)
      .map((i: any) => `${i.name}${i.quantity > 1 ? `x${i.quantity}` : ''}`)
      .join(', ');
    prompt += `EQUIPO: ${items}${state.inventory.length > 8 ? ` (+${state.inventory.length - 8} más)` : ''}\n`;
  }

  // NPCs
  if (state.npcs.length > 0) {
    prompt += `\nNPCS:\n`;
    state.npcs.forEach((npc: any) => {
      prompt += `- ${npc.name} [${npc.archetype},${npc.faction}] HP:${npc.hp}/${npc.maxHp} ${npc.isHostile ? 'HOSTIL' : 'neutral'}`;
      if (npc.weapon) prompt += ` arma:${npc.weapon}`;
      prompt += '\n';
    });
  }

  // Companions with personality
  if (state.companions.length > 0) {
    prompt += `\nCOMPAÑEROS:\n`;
    state.companions.forEach((c: any) => {
      prompt += `- ${c.name} Lealtad:${c.loyalty}% ${c.status}`;
      if (c.personality?.traits?.length) prompt += ` rasgos:${c.personality.traits.join(',')}`;
      if (c.personality?.trauma) prompt += ` trauma:${c.personality.trauma}`;
      if (c.personality?.vice) prompt += ` vicio:${c.personality.vice}`;
      prompt += '\n';
    });
  }

  // Sanity conditions
  if (state.sanity.conditions?.length) {
    prompt += `CONDICIONES: ${state.sanity.conditions.join(', ')}\n`;
  }

  // Traumas
  if (state.stress.traumas?.length) {
    prompt += `TRAUMAS: ${state.stress.traumas.map((t: any) => t.type + (t.permanent ? '(permanente)' : '')).join(', ')}\n`;
  }

  // Stealth
  if (state.stealth?.hidden) prompt += `ESTADO: OCULTO\n`;
  if (state.stealth?.compromised) prompt += `ESTADO: SIGILO COMPROMETIDO\n`;

  // Recent narratives for continuity
  if (recentNarratives?.length) {
    prompt += `\nCONTEXTO RECIENTE:\n`;
    recentNarratives.slice(-2).forEach((n: string, i: number) => {
      prompt += `[Turno anterior ${i + 1}]: ${n.slice(0, 200)}...\n`;
    });
  }

  // Turn and mode
  prompt += `\nTURNO: ${state.turn} | MODO: ${state.mode || 'freedom'}\n`;

  // Outcome-specific instruction
  if (mechanicalResult.outcome === 'miss') {
    prompt += `\nLa acción FALLÓ. Describe qué salió mal.`;
  } else if (mechanicalResult.outcome === 'partial') {
    prompt += `\nÉXITO CON COSTO. Funciona, pero hay una consecuencia.`;
  } else {
    prompt += `\nÉXITO COMPLETO. Todo sale bien.`;
  }

  return prompt;
}

export async function streamChat(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]): Promise<string> {
  initProviders();
  resetCooldownIfNeeded('openrouter');
  resetCooldownIfNeeded('groq');

  console.log('streamChat called. openrouter:', !!openrouterClient, 'groq:', !!groqClient);

  // === FASE 1: OpenRouter ===
  if (openrouterClient && !checkCooldown('openrouter')) {
    for (const model of OPENROUTER_MODELS) {
      try {
        console.log('Trying OpenRouter:', model);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const response = await openrouterClient.chat.completions.create({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 512,
          stream: true,
        } as any);
        clearTimeout(timeout);
        recordSuccess('openrouter');
        console.log('OpenRouter success:', model);

        let fullText = '';
        const stream = response as unknown as AsyncIterable<any>;
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) fullText += content;
        }

        if (!fullText || fullText.trim().length === 0) {
          console.warn('OpenRouter empty response:', model);
          recordFailure('openrouter');
          continue;
        }

        console.log('OpenRouter response length:', fullText.length);
        return fullText;
      } catch (e: any) {
        clearTimeout((e as any)?.timeoutId);
        const isRateLimit = e?.status === 429 || e?.message?.includes('rate');
        console.error('OpenRouter error:', model, e?.message || e);
        recordFailure('openrouter', isRateLimit);
      }
    }
  }

  // === FASE 2: Groq ===
  if (groqClient && !checkCooldown('groq')) {
    for (const model of GROQ_MODELS) {
      try {
        console.log('Trying Groq:', model);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const stream = await groqClient.chat.completions.create({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 512,
          stream: true,
        });
        clearTimeout(timeout);
        recordSuccess('groq');
        console.log('Groq success:', model);

        let fullText = '';
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) fullText += content;
        }

        if (!fullText || fullText.trim().length === 0) {
          console.warn('Groq empty response:', model);
          recordFailure('groq');
          continue;
        }

        console.log('Groq response length:', fullText.length);
        return fullText;
      } catch (e: any) {
        clearTimeout((e as any)?.timeoutId);
        const isRateLimit = e?.status === 429 || e?.message?.includes('rate');
        console.error('Groq error:', model, e?.message || e);
        recordFailure('groq', isRateLimit);
      }
    }
  }

  throw new Error('Todos los providers de IA están agotados.');
}

export function getSpecialPrompt(type: 'death' | 'insanity' | 'victory'): string {
  switch (type) {
    case 'death': return DEATH_PROMPT;
    case 'insanity': return INSANITY_PROMPT;
    case 'victory': return VICTORY_PROMPT;
  }
}

export function getProviderStatus() {
  return {
    openrouter: { enabled: !!openrouterClient, inCooldown: checkCooldown('openrouter') },
    groq: { enabled: !!groqClient, inCooldown: checkCooldown('groq') },
  };
}
