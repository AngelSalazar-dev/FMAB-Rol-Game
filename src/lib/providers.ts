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

export async function streamChat(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
): Promise<string> {
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