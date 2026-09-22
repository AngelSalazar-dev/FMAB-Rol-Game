import { initProviders } from '@/engine/ai/router';
import { processAction, resolveDiceAction } from '@/engine/core/engine';
import type { GameState, PendingDice } from '@/types/game';

initProviders();

export async function POST(request: Request) {
  try {
    const { action, state, diceResult, pendingDice, recentNarratives } = await request.json();

    // Case 1: Resolve dice result (after user rolls)
    if (pendingDice && diceResult) {
      const response = await resolveDiceAction(pendingDice, diceResult, state as GameState, recentNarratives);
      return Response.json(response);
    }

    // Case 2: New action (returns pending dice for manual rolling)
    if (action && state) {
      const response = await processAction(action, state as GameState, recentNarratives);
      return Response.json(response);
    }

    return Response.json({ error: 'Acción o dados requeridos' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
