import Groq from 'groq-sdk';
import OpenAI from 'openai';

const GROQ_MODEL = 'openai/gpt-oss-120b';
const OPENROUTER_MODELS = [
  'openai/gpt-oss-120b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
];

const COOLDOWN_MS = 60_000;
const MAX_FAILS = 2;

type ProviderName = 'groq' | 'openrouter';

interface ProviderStatus {
  available: boolean;
  cooldownUntil: number;
  failCount: number;
}

let groqClient: Groq | null = null;
let openrouterClient: OpenAI | null = null;
let initialized = false;
const status: Record<ProviderName, ProviderStatus> = {
  groq: { available: false, cooldownUntil: 0, failCount: 0 },
  openrouter: { available: false, cooldownUntil: 0, failCount: 0 },
};

export function initProviders() {
  if (initialized) return;
  initialized = true;

  const groqKey = process.env.GROQ_API_KEY;
  const orKey = process.env.OPENROUTER_API_KEY;

  console.log('Initializing AI providers...');
  console.log('GROQ_API_KEY:', groqKey ? 'Set' : 'Not set');
  console.log('OPENROUTER_API_KEY:', orKey ? 'Set' : 'Not set');

  if (groqKey) {
    groqClient = new Groq({ apiKey: groqKey });
    status.groq.available = true;
  }

  if (orKey) {
    openrouterClient = new OpenAI({
      apiKey: orKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    status.openrouter.available = true;
  }
}

function isInCooldown(name: ProviderName): boolean {
  const s = status[name];
  if (Date.now() < s.cooldownUntil) return true;
  if (s.cooldownUntil > 0) {
    s.cooldownUntil = 0;
    s.failCount = 0;
    s.available = true;
  }
  return false;
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
  prompt += `- HP: ${state.health.current}/${state.health.max}\n`;
  prompt += `- Estrés: ${state.stress.current}/${state.stress.max}\n`;
  prompt += `- Cordura: ${state.sanity.current}/${state.sanity.max}\n`;
  prompt += `- Sospecha: ${state.factions.suspicion}/100\n`;
  prompt += `- Ubicación: ${state.location}\n`;
  prompt += `- Clima: ${state.environment.weather}, ${state.environment.time}\n`;
  prompt += `- Compañeros: ${state.companions.map((c: any) => c.name).join(', ') || 'Ninguno'}\n\n`;

  prompt += `INSTRUCCIONES:\n`;
  prompt += `1. Escribe SOLO la narrativa descriptiva en segunda persona.\n`;
  prompt += `2. NO inventes consecuencias mecánicas nuevas.\n`;
  prompt += `3. NO cambies el estado del juego.\n`;
  prompt += `4. Respeta el resultado: ${mechanicalResult.outcome}.\n`;
  prompt += `5. Tono: oscuro, militar, fantasía oscura (Fullmetal Alchemist Brotherhood).\n`;
  prompt += `6. Segunda persona ("Tú ves...", "Sientes...", "El suelo cruje...").\n\n`;

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

  if (groqClient && !isInCooldown('groq')) {
    try {
      const stream = await groqClient.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
      });
      recordSuccess('groq');
      let fullText = '';
      for await (const chunk of stream) {
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) fullText += content;
      }
      return fullText;
    } catch {
      recordFailure('groq');
    }
  }

  if (openrouterClient && !isInCooldown('openrouter')) {
    try {
      const response = await openrouterClient.chat.completions.create({
        model: OPENROUTER_MODELS[0],
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
      } as any);
      recordSuccess('openrouter');
      let fullText = '';
      const stream = response as unknown as AsyncIterable<any>;
      for await (const chunk of stream) {
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) fullText += content;
      }
      return fullText;
    } catch {
      recordFailure('openrouter');
    }
  }

  throw new Error('Todos los providers de IA están indisponibles.');
}

export function getProviderStatus() {
  return {
    groq: { enabled: !!groqClient, inCooldown: isInCooldown('groq') },
    openrouter: { enabled: !!openrouterClient, inCooldown: isInCooldown('openrouter') },
  };
}

const FMAB_SYSTEM_PROMPT = `
Eres el narrador de un juego de rol ambientado en Fullmetal Alchemist: Brotherhood.

REGLAS ESTRICTAS:
1. SOLO genera narrativa descriptiva en segunda persona.
2. NUNCA inventes consecuencias mecánicas nuevas.
3. NUNCA cambies el estado del juego.
4. NUNCA ignores los dados tirados.
5. Respeta el resultado mecánico que se te indica (ÉXITO_COMPLETO, ÉXITO_PARCIAL, FALLO).
6. Mantén tono oscuro y militar.
7. Narrativa en segunda persona ("Tú ves...", "Sientes...", "El metal cruje...").

EJEMPLO DE ENTRADA:
- Acción: "Transmuto el suelo para crear una pared"
- Resultado: ÉXITO_PARCIAL
- Estrés: +10
- Sospecha: +1
- Detalles: "Consumes 10 unidades de hierro. La transmutación funciona, pero algo no sale como planeabas."

EJEMPLO DE SALIDA CORRECTA:
"El suelo cruje y se eleva formando una barrera de metal oxidado. El aire se llena de chispas. Sientes un tirón en el antebrazo izquierdo - una grieta pequeña recorre la pared, pero la barrera se mantiene. Alguien podría haber visto las chispas desde la calle."

EJEMPLO DE SALIDA INCORRECTA (NO HAGAS ESTO):
"La pared se crea perfectamente. Recuperas 10 HP. La sospecha baja a 0. Ganas una Piedra Filosofal."
`;