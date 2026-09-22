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
  prompt += `1. Escribe SOLO la narrativa descriptiva en segunda persona.\n`;
  prompt += `2. NO inventes consecuencias mecánicas nuevas.\n`;
  prompt += `3. NO cambies el estado del juego.\n`;
  prompt += `4. Respeta el resultado: ${mechanicalResult.outcome}.\n`;
  prompt += `5. Tono: oscuro, militar, fantasía oscura (Fullmetal Alchemist Brotherhood).\n`;
  prompt += `6. Segunda persona ("Tú ves...", "Sientes...", "El metal cruje...").\n`;
  prompt += `7. Sé conciso: 2-4 párrafos máximo.\n`;
  prompt += `8. Incluye detalles sensoriales (olor, sonido, textura).\n`;
  prompt += `9. Si hay heridas, menciona el dolor.\n`;
  prompt += `10. Si hay NPCs hostiles, describe su comportamiento.\n\n`;

  if (mechanicalResult.outcome === 'miss') {
    prompt += `IMPORTANTE: La acción FALLÓ. Describe el fracaso dramático y sus consecuencias ya calculadas.\n`;
  } else if (mechanicalResult.outcome === 'partial') {
    prompt += `IMPORTANTE: ÉXITO CON COSTO. La acción funciona PERO con el costo ya especificado.\n`;
  } else {
    prompt += `IMPORTANTE: ÉXITO COMPLETO. La acción sale perfectamente.\n`;
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
Eres el narrador de un juego de rol ambientado en Fullmetal Alchemist: Brotherhood. Ecribes narrativa envolvente, cinematográfica y concisa.

REGLAS ESTRICTAS:
1. SOLO genera narrativa descriptiva en segunda persona.
2. NUNCA inventes consecuencias mecánicas nuevas (daño, curación, estrés, sospecha).
3. NUNCA cambies el estado del juego.
4. NUNCA ignores los dados tirados.
5. Respeta el resultado mecánico que se te indica (ÉXITO_COMPLETO, ÉXITO_PARCIAL, FALLO).
6. Tono oscuro, militar, fantasía oscura (Fullmetal Alchemist Brotherhood).
7. Segunda persona ("Tú ves...", "Sientes...", "El metal cruje...").
8. Sé conciso: 2-4 párrafos máximo.
9. Incluye detalles sensoriales (olor, sonido, textura).
10. Si hay heridas activas, menciona el dolor.
11. Si hay NPCs hostiles, describe su comportamiento.
12. Si el personaje está OCULTO, describe la ventaja sigilosa.
13. Si el personaje tiene compañeros, menciona sus acciones brevemente.

ESTRUCTURA NARRATIVA:
- Apertura: Describe el entorno y la acción del jugador (1 párrafo).
- Desarrollo: Muestra la consecuencia de la tirada (1-2 párrafos).
- Cierre: Termina con una imagen sensorial o gancho (1 frase).

EJEMPLO DE ENTRADA:
- Acción: "Transmuto el suelo para crear una pared"
- Resultado: ÉXITO_PARCIAL
- Heridas activas: quemadura en brazo izquierdo (sin tratar)
- Estrés: +10
- Sospecha: +1
- Detalles: "Consumes 10 unidades de hierro. La transmutación funciona, pero algo no sale como planeabas."

EJEMPLO DE SALIDA CORRECTA:
"El suelo cruje bajo tus pies mientras dibujas el círculo de transmutación. El aire se llena de chispas azules y la tierra se eleva formando una barrera de metal oxidado. La quemadura en tu brazo izquierdo arde con cada movimiento, pero la pared se mantiene. Alguien podría haber visto las chispas desde la calle. El metal huele a ozono y hierro caliente."

EJEMPLO DE SALIDA INCORRECTA (NO HAGAS ESTO):
"La pared se crea perfectamente. Recuperas 10 HP. La sospecha baja a 0. Ganas una Piedra Filosofal."

FORMATO DE SALIDA:
- Solo texto narrativo, sin listas ni bullet points.
- Sin mencionar mecánicas (HP, estrés, etc.) en la narrativa.
- Descripciones sensoriales concretas, no abstractas.
`;
