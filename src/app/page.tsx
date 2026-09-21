'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CharacterCreate } from '@/components/ui/CharacterCreate';
import type { Character } from '@/types/game';

export default function HomePage() {
  const [savedCharacters, setSavedCharacters] = useState<Character[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const res = await fetch('/api/characters');
      if (res.ok) {
        const data = await res.json();
        setSavedCharacters(data);
      }
    } catch (e) {
      console.error('Error loading characters:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComplete = (character: Character) => {
    setShowCreate(false);
    setSelectedCharacter(character);
  };

  const handleSelectCharacter = (char: Character) => {
    setSelectedCharacter(char);
  };

  const handleNewGame = () => {
    setShowCreate(true);
    setSelectedCharacter(null);
  };

  if (showCreate) {
    return <CharacterCreate onComplete={handleCreateComplete} />;
  }

  if (selectedCharacter) {
    return (
      <div className="min-h-screen bg-fmab-dark flex items-center justify-center p-4">
        <div className="fmab-create max-w-md w-full text-center animate-fade-in">
          <h1 className="font-serif text-3xl text-fmab-gold mb-2">{selectedCharacter.name}</h1>
          <p className="text-fmab-steel mb-6">{selectedCharacter.origin} · {selectedCharacter.history}</p>

          <div className="space-y-3">
            <Link
              href="/game"
              className="block px-6 py-4 bg-fmab-gold text-fmab-darker font-bold rounded-lg hover:bg-fmab-goldLight transition-colors font-mono text-lg"
            >
              COMENZAR PARTIDA
            </Link>
            <button
              onClick={() => setSelectedCharacter(null)}
              className="w-full px-6 py-3 border border-fmab-border text-fmab-parchment rounded-lg hover:bg-fmab-darker font-mono"
            >
              VOLVER
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fmab-dark flex flex-col">
      <header className="border-b border-fmab-border px-6 py-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="font-serif text-3xl text-fmab-gold tracking-wider">FMAB RPG</h1>
          <p className="text-fmab-steel text-sm">Fullmetal Alchemist: Brotherhood</p>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col items-center">
        <div className="text-center mb-12 w-full">
          <h2 className="font-serif text-4xl text-fmab-parchment mb-4">EL INTERCAMBIO EQUIVALENTE</h2>
          <p className="text-fmab-steel text-lg max-w-2xl mx-auto">
            "La humanidad no puede obtener nada sin antes dar algo a cambio.
            Para obtener algo de igual valor, se debe perder algo de igual valor.
            Esa es la primera ley de la alquimia. El Intercambio Equivalente."
          </p>
        </div>

        <div className="w-full space-y-4">
          {loading ? (
            <div className="fmab-panel p-8 text-center">
              <div className="animate-bounce text-fmab-gold">⚙</div>
              <p className="mt-2 text-fmab-steel">Cargando archivos...</p>
            </div>
          ) : savedCharacters.length > 0 ? (
            <>
              <h3 className="font-mono text-xs text-fmab-gold tracking-wider uppercase mb-4">PARTIDAS GUARDADAS</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {savedCharacters.map(char => (
                  <button
                    key={char.id}
                    onClick={() => handleSelectCharacter(char)}
                    className="fmab-panel p-6 text-left hover:border-fmab-gold transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-serif text-xl text-fmab-parchment">{char.name}</h4>
                      <span className="text-xs text-fmab-gold font-mono px-2 py-0.5 bg-fmab-gold/10 rounded">
                        LIBERTAD
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-fmab-steel">
                      <span>{char.origin} · {char.history}</span>
                      <span className="text-fmab-redLight">♥ {char.hp}</span>
                      <span className="text-fmab-goldLight">⚡ {char.stress}</span>
                      <span className="text-purple-400">◆ {char.sanity}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="fmab-panel p-8 text-center">
              <p className="text-fmab-steel mb-6">No hay personajes guardados.</p>
              <button
                onClick={handleNewGame}
                className="px-8 py-3 bg-fmab-gold text-fmab-darker font-bold rounded-lg hover:bg-fmab-goldLight font-mono text-lg"
              >
                CREAR NUEVO PERSONAJE
              </button>
            </div>
          )}

          {savedCharacters.length > 0 && (
            <button
              onClick={handleNewGame}
              className="w-full mt-8 px-6 py-3 border border-fmab-gold text-fmab-gold font-bold rounded-lg hover:bg-fmab-gold/10 font-mono text-lg transition-colors"
            >
              + NUEVO PERSONAJE
            </button>
          )}
        </div>

        <footer className="mt-16 text-center text-fmab-steel text-sm border-t border-fmab-border pt-8 w-full">
          <p>El Intercambio Equivalente es absoluto.</p>
          <p className="mt-1 font-mono text-xs">FMAB RPG v1.0 — Modo Hardcore Permanente</p>
        </footer>
      </main>
    </div>
  );
}