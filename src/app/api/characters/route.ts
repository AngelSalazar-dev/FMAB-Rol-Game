import { getCharacters, createCharacter, getCharacter } from '@/lib/save';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const character = await getCharacter(parseInt(id));
      if (!character) {
        return Response.json({ error: 'Personaje no encontrado' }, { status: 404 });
      }
      return Response.json(character);
    }

    const characters = await getCharacters();
    return Response.json(characters);
  } catch (error) {
    console.error('Error getting characters:', error);
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const character = await request.json();
    const id = await createCharacter(character);
    return Response.json({ id, ...character });
  } catch (error) {
    console.error('Error creating character:', error);
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}