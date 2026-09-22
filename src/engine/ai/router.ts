import OpenAI from 'openai';
import Groq from 'groq-sdk';

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

function recordFailure(name: ProviderName) {
  const s = status[name];
  s.failCount++;
  if (s.failCount >= MAX_FAILS) {
    s.cooldownUntil = Date.now() + COOLDOWN_MS;
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
}

export async function generateNarrative(context: NarrativeContext): Promise<string> {
  const prompt = buildPrompt(context);

  const messages = [
    { role: 'system' as const, content: FMAB_SYSTEM_PROMPT },
    { role: 'user' as const, content: prompt },
  ];

  const result = await streamChat(messages);
  return result;
}

function buildPrompt(context: NarrativeContext): string {
  const { action, parsed, dice, mechanicalResult, state } = context;

  let prompt = `ACCIÓN DEL JUGADOR: "${action}"\n\n`;
  prompt += `TIPO DE ACCIÓN: ${parsed.type}\n`;
  prompt += `RESULTADO MECÁNICO: ${mechanicalResult.outcome.toUpperCase()}\n`;
  prompt += `TIRADA: ${dice.roll1} + ${dice.roll2} ${dice.modifier >= 0 ? '+' : ''}${dice.modifier} = ${dice.total}\n\n`;

  if (mechanicalResult.details.length > 0) {
    prompt += `DETALLES MECÁNICOS:\n`;
    mechanicalResult.details.forEach((d: string) => prompt += `- ${d}\n`);
    prompt += '\n';
  }

  prompt += `ESTADO ACTUAL:\n`;
  prompt += `- Nombre: ${state.character.name} (${state.character.origin}, ${state.character.history})\n`;
  prompt += `- Atributos: FUE:${state.character.attributes.str} AGI:${state.character.attributes.agi} INT:${state.character.attributes.int} PER:${state.character.attributes.per} VOL:${state.character.attributes.vol} CAR:${state.character.attributes.car}\n`;
  prompt += `- HP: ${state.health.current}/${state.health.max}\n`;
  prompt += `- Estrés: ${state.stress.current}/${state.stress.max}\n`;
  prompt += `- Cordura: ${state.sanity.current}/${state.sanity.max}\n`;
  prompt += `- Sospecha: ${state.factions.suspicion}/100\n`;
  prompt += `- Ubicación: ${state.location}\n`;
  prompt += `- Clima: ${state.environment.weather}, ${state.environment.time}, ${state.environment.temperature}°C\n`;
  prompt += `- Alineamiento: ${state.morality.alignment} (Karma: ${state.morality.karma})\n\n`;

  if (state.health.injuries.length > 0) {
    prompt += `HERIDAS ACTIVAS:\n`;
    state.health.injuries.forEach((inj: any) => {
      prompt += `- ${inj.bodyPart}: ${inj.type} (${inj.severity}) ${inj.treated ? '[TRATADA]' : '[SIN TRATAR]'}\n`;
    });
    prompt += '\n';
  }

  if (state.inventory.length > 0) {
    prompt += `INVENTARIO:\n`;
    state.inventory.forEach((item: any) => {
      prompt += `- ${item.name} x${item.quantity} (${item.item_type})\n`;
    });
    prompt += '\n';
  }

  if (state.npcs.length > 0) {
    prompt += `NPCS PRESENTES:\n`;
    state.npcs.forEach((npc: any) => {
      prompt += `- ${npc.name} (${npc.archetype}, ${npc.faction}) HP:${npc.hp}/${npc.maxHp} ${npc.isHostile ? '[HOSTIL]' : '[NEUTRAL]'}\n`;
    });
    prompt += '\n';
  }

  if (state.companions.length > 0) {
    prompt += `COMPAÑEROS:\n`;
    state.companions.forEach((c: any) => {
      prompt += `- ${c.name} (Lealtad: ${c.loyalty}%) Skills: ${c.skills.join(', ')}\n`;
    });
    prompt += '\n';
  }

  if (state.stress.traumas.length > 0) {
    prompt += `TRAUMAS: ${state.stress.traumas.map((t: any) => t.type).join(', ')}\n\n`;
  }

  if (state.stealth?.hidden) {
    prompt += `ESTADO: OCULTO (ventaja en próximo ataque)\n`;
  }

prompt += `INSTRUCCIONES:\n`;
  prompt += `1. Escribe SOLO narrativa en segunda persona.\n`;
  prompt += `2. NO inventes consecuencias mecánicas.\n`;
  prompt += `3. NO cambies el estado del juego.\n`;
  prompt += `4. Respeta el resultado: ${mechanicalResult.outcome}.\n`;
  prompt += `5. Tono serio y oscuro, como el anime.\n`;
  prompt += `6. Sé breve: 2-3 párrafos cortos.\n`;
  prompt += `7. Usa palabras simples y directas.\n`;
  prompt += `8. Describe lo que el jugador ve y siente.\n`;
  prompt += `9. Si hay heridas, menciona el dolor.\n`;
  prompt += `10. Si hay enemigos, describe qué hacen.\n\n`;

  if (mechanicalResult.outcome === 'miss') {
    prompt += `La acción FALLÓ. Describe qué salió mal.`;
  } else if (mechanicalResult.outcome === 'partial') {
    prompt += `ÉXITO CON COSTO. Funciona, pero algo sale mal.`;
  } else {
    prompt += `ÉXITO COMPLETO. Todo sale bien.`;
  }

  return prompt;
}

export async function streamChat(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]): Promise<string> {
  initProviders();
  resetCooldownIfNeeded('openrouter');
  resetCooldownIfNeeded('groq');

  console.log('streamChat called. openrouter:', !!openrouterClient, 'groq:', !!groqClient);

  // === FASE 1: OpenRouter (7 modelos free en cascada) ===
  if (openrouterClient && !checkCooldown('openrouter')) {
    for (const model of OPENROUTER_MODELS) {
      try {
        console.log('Trying OpenRouter (FREE):', model);
        const response = await openrouterClient.chat.completions.create({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
          stream: true,
        } as any);
        recordSuccess('openrouter');
        console.log('OpenRouter success:', model);
        let fullText = '';
        const stream = response as unknown as AsyncIterable<any>;
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) fullText += content;
        }
        console.log('OpenRouter response length:', fullText.length);
        return fullText;
      } catch (e: any) {
        console.error('OpenRouter error:', model, e?.message || e);
        recordFailure('openrouter');
      }
    }
  }

  // === FASE 2: Groq (3 modelos free en cascada) ===
  if (groqClient && !checkCooldown('groq')) {
    for (const model of GROQ_MODELS) {
      try {
        console.log('Trying Groq (FREE):', model);
        const stream = await groqClient.chat.completions.create({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
          stream: true,
        });
        recordSuccess('groq');
        console.log('Groq success:', model);
        let fullText = '';
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) fullText += content;
        }
        console.log('Groq response length:', fullText.length);
        return fullText;
      } catch (e: any) {
        console.error('Groq error:', model, e?.message || e);
        recordFailure('groq');
      }
    }
  }

  throw new Error('Todos los providers de IA están agotados. Intenta de nuevo en unos minutos.');
}

export function getProviderStatus() {
  return {
    openrouter: { enabled: !!openrouterClient, inCooldown: checkCooldown('openrouter') },
    groq: { enabled: !!groqClient, inCooldown: checkCooldown('groq') },
  };
}

const FMAB_SYSTEM_PROMPT = `
Eres el narrador de un juego de rol de Fullmetal Alchemist: Brotherhood. Ecribes en español claro y directo.

REGLAS:
1. Escribe en segunda persona ("Tú haces...", "Ves...", "Sientes...").
2. NO inventes efectos mecánicos (nours, curas, estrés, sospecha).
3. NO cambies el estado del juego.
4. Respeta el resultado: ÉXITO, ÉXITO CON COSTO, o FALLO.
5. Tono serio y oscuro, como el anime.
6. Sé breve: 2-3 párrafos cortos.
7. Usa palabras simples. No uses lenguaje poético ni florido.

CÓMO ESCRIBIR:
- Describe lo que el jugador ve, oye y siente.
- Si falla, explica qué salió mal de forma clara.
- Si tiene heridas, menciona el dolor brevemente.
- Si hay enemigos, describe qué hacen.
- Termina con una frase que deje claro qué pasó.

EJEMPLO BIEN:
"Transmutas el suelo y se levanta una pared de metal. La quemadura en tu brazo arde, pero aguantas. Alguien vio las chispas desde la calle."

EJEMPLO MAL (NO HAGAS ESTO):
"El suelo cruje bajo tus pies mientras dibujas el círculo de transmutación. El aire se llena de chispas azules y la tierra se eleva formando una barrera de metal oxidado. La quemadura en tu brazo izquierdo arde con cada movimiento, pero la pared se mantiene."

FORMATO:
- Solo texto narrativo.
- Sin mencionar números ni mecánicas.
- Frases cortas y directas.
`;
