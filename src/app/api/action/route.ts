import { initProviders } from '@/engine/ai/router';
import { processAction } from '@/engine/core/engine';
import type { GameState } from '@/types/game';

initProviders();

export async function POST(request: Request) {
  try {
    const { input, state } = await request.json();

    if (!input || !state) {
      return Response.json({ error: 'Input y state requeridos' }, { status: 400 });
    }

    const response = await processAction(input, state as GameState);

    return Response.json(response);
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
