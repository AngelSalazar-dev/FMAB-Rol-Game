import { saveGame, loadGame, getSaves } from '@/lib/save';
import type { GameState } from '@/types/game';

export async function POST(request: Request) {
  try {
    const { state, characterId } = await request.json();

    if (!state || !characterId) {
      return Response.json({ error: 'Estado y characterId requeridos' }, { status: 400 });
    }

    const save = await saveGame(state as GameState, characterId);
    return Response.json(save);
  } catch (error) {
    console.error('Error saving game:', error);
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const saveId = searchParams.get('id');
    const characterId = searchParams.get('characterId');

    if (saveId) {
      const save = await loadGame(parseInt(saveId));
      return Response.json(save);
    }

    if (characterId) {
      const saves = await getSaves(parseInt(characterId));
      return Response.json(saves);
    }

    return Response.json({ error: 'Parámetro requerido' }, { status: 400 });
  } catch (error) {
    console.error('Error loading game:', error);
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}