'use client';

import { useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { GameTerminal } from '@/components/ui/GameTerminal';
import { StatsPanel } from '@/components/ui/StatsPanel';
import { Inventory } from '@/components/ui/Inventory';
import { Clocks } from '@/components/ui/Clocks';
import { InputBox } from '@/components/ui/InputBox';
import { DiceRoll } from '@/components/effects/DiceRoll';
import type { GameState, DiceResult } from '@/types/game';
import { INITIAL_STATE, createInitialState } from '@/engine/core/state';

export default function GamePage() {
  const [showDice, setShowDice] = useState<DiceResult | null>(null);
  const [characterId, setCharacterId] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('character');
    if (id) {
      const numId = parseInt(id);
      setCharacterId(numId);
      fetch(`/api/characters?id=${numId}`)
        .then(res => res.json())
        .then(character => {
          if (character && !character.error) {
            setGameState(createInitialState(character));
          }
        })
        .catch(err => console.error('Error loading character:', err));
    }
  }, []);

  const { state, messages, isLoading, lastDice, lastOutcome, sendAction, resetGame } = useGame(gameState || INITIAL_STATE, characterId ?? undefined);

  useEffect(() => {
    if (lastDice) {
      setShowDice(lastDice);
      setTimeout(() => setShowDice(null), 3000);
    }
  }, [lastDice]);

  const handleAction = (input: string) => {
    sendAction(input);
  };

  const getLocationName = (loc: string) => {
    const names: Record<string, string> = {
      central_city: 'Central City',
      eastern_hq: 'Cuartel General del Este',
      western_border: 'Frontera Oeste',
      ishval: 'Región de Ishval',
      dublith: 'Dublith',
      northern_border: 'Fortaleza Briggs',
      underground: 'Subterráneos de Central',
      eastern_desert: 'Desierto del Este',
      xerxes_ruins: 'Ruinas de Xerxes',
      drachma_border: 'Frontera de Drachma',
      father_lair: 'Guarida del Padre',
    };
    return names[loc] || loc;
  };

  const getWeatherIcon = (weather: string) => {
    const icons: Record<string, string> = {
      clear: '☀', rain: '🌧', snow: '❄', fog: '🌫', storm: '⛈',
    };
    return icons[weather] || '☀';
  };

  const getTimeIcon = (time: string) => {
    const icons: Record<string, string> = {
      dawn: '🌅', day: '☀', dusk: '🌇', night: '🌙',
    };
    return icons[time] || '☀';
  };

  return (
    <div className="min-h-screen bg-fmab-dark">
      <header className="border-b border-fmab-border px-4 py-3 bg-fmab-darker/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-full mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-xl text-fmab-gold">FMAB RPG</h1>
            <div className="hidden md:flex items-center gap-4 text-sm font-mono">
              <span className="text-fmab-gold">TURNO:</span>
              <span className="text-fmab-goldLight font-bold">{state.turn}</span>
              <span className="text-fmab-steel">|</span>
              <span className="text-fmab-gold">{getTimeIcon(state.environment.time)}</span>
              <span className="text-fmab-parchment capitalize">{state.environment.time}</span>
              <span className="text-fmab-gold">{getWeatherIcon(state.environment.weather)}</span>
              <span className="text-fmab-parchment capitalize">{state.environment.weather}</span>
              <span className="text-fmab-steel">|</span>
              <span className="text-fmab-gold">{state.environment.temperature}°C</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm font-mono">
            <div className="text-right">
              <div className="text-fmab-steel">SOSPECHA</div>
              <div className={`font-bold ${state.factions.suspicion > 70 ? 'text-fmab-redLight' : state.factions.suspicion > 40 ? 'text-fmab-goldLight' : 'text-green-400'}`}>
                {state.factions.suspicion}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-fmab-steel">ALINEAMIENTO</div>
              <div className={`font-bold capitalize ${
                state.morality.alignment === 'noble' ? 'text-green-400' :
                state.morality.alignment === 'ruthless' ? 'text-fmab-redLight' :
                'text-fmab-goldLight'
              }`}>
                {state.morality.alignment}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-4">
          <aside className="col-span-12 lg:col-span-3 space-y-4">
            <StatsPanel
              character={state.character}
              health={state.health}
              stress={state.stress}
              sanity={state.sanity}
            />
            <Clocks clocks={state.clocks} />
          </aside>

          <section className="col-span-12 lg:col-span-6 space-y-4">
            <div className="fmab-panel bg-fmab-card border border-fmab-border rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-mono text-xs text-fmab-gold tracking-wider">
                  {getLocationName(state.location)}
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-fmab-steel">{getTimeIcon(state.environment.time)}</span>
                  <span className="text-fmab-parchment capitalize">{state.environment.time}</span>
                  <span className="text-fmab-steel">|</span>
                  <span className="text-fmab-gold">{getWeatherIcon(state.environment.weather)}</span>
                  <span className="text-fmab-parchment capitalize">{state.environment.weather}</span>
                </div>
              </div>
            </div>

            <GameTerminal messages={messages} isTyping={isLoading} />

            <InputBox onSubmit={handleAction} disabled={isLoading} />
          </section>

          <aside className="col-span-12 lg:col-span-3 space-y-4">
            <Inventory items={state.inventory} />

            {state.companions.length > 0 && (
              <div className="fmab-panel bg-fmab-card border border-fmab-border rounded-lg p-4">
                <h3 className="font-mono text-xs text-fmab-gold mb-3 tracking-wider">COMPAÑEROS</h3>
                <div className="space-y-2">
                  {state.companions.map(c => (
                    <div key={c.id} className="bg-fmab-darker border border-fmab-border rounded p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-fmab-parchment">{c.name}</span>
                        <span className={`text-xs font-mono ${c.loyalty > 60 ? 'text-green-400' : c.loyalty > 30 ? 'text-fmab-goldLight' : 'text-fmab-redLight'}`}>
                          LEALTAD: {c.loyalty}%
                        </span>
                      </div>
                      <div className="text-xs text-fmab-steel flex gap-2">
                        <span>{c.status}</span>
                        {c.personality.trauma && <span className="text-fmab-red">[{c.personality.trauma}]</span>}
                        {c.personality.vice && <span className="text-fmab-goldLight">[{c.personality.vice}]</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.morality.decisions.length > 0 && (
              <div className="fmab-panel bg-fmab-card border border-fmab-border rounded-lg p-4">
                <h3 className="font-mono text-xs text-fmab-gold mb-3 tracking-wider">MORALIDAD</h3>
                <div className={`text-center mb-2 ${state.morality.karma > 0 ? 'text-green-400' : state.morality.karma < 0 ? 'text-fmab-redLight' : 'text-fmab-goldLight'}`}>
                  KARMA: {state.morality.karma >= 0 ? '+' : ''}{state.morality.karma}
                </div>
                <div className="text-sm text-fmab-steel capitalize">{state.morality.alignment}</div>
                <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                  {state.morality.decisions.slice(-3).map(d => (
                    <div key={d.id} className="text-xs text-fmab-steel border-l-2 border-fmab-border pl-2">
                      {d.choice} <span className={d.karmaChange >= 0 ? 'text-green-400' : 'text-fmab-redLight'}>({d.karmaChange >= 0 ? '+' : ''}{d.karmaChange})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {showDice && <DiceRoll result={showDice} onComplete={() => setShowDice(null)} />}
    </div>
  );
}