export interface AIResponse {
  narrative: string;
  stateChanges: any;
  moralChoice?: {
    description: string;
    options: string[];
  };
  consequences: string[];
}

export function parseAIResponse(response: string): AIResponse {
  try {
    const parsed = JSON.parse(response);
    return {
      narrative: parsed.narrative || '',
      stateChanges: parsed.stateChanges || {},
      moralChoice: parsed.moralChoice || undefined,
      consequences: parsed.consequences || [],
    };
  } catch {
    return {
      narrative: response,
      stateChanges: {},
      consequences: [],
    };
  }
}

export function buildNarrativePrompt(context: any): string {
  return context;
}