'use client';

import type { GameState } from '@/types/game';

interface StatsPanelProps {
  character: GameState['character'];
  health: GameState['health'];
  stress: GameState['stress'];
  sanity: GameState['sanity'];
}

function StatBar({ label, value, max, color, warningThreshold = 0.3 }: {
  label: string;
  value: number;
  max: number;
  color: string;
  warningThreshold?: number;
}) {
  const percentage = (value / max) * 100;
  const isWarning = percentage < warningThreshold * 100;

  const colorMap: Record<string, string> = {
    red: 'bg-red-600',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-fmab-parchment">{label}</span>
        <span className={isWarning ? 'text-fmab-redLight' : 'text-fmab-goldLight'}>{value}/{max}</span>
      </div>
      <div className="h-2 bg-fmab-border rounded-full overflow-hidden">
        <div
          className={`${colorMap[color] || 'bg-gray-500'} h-full transition-all duration-500 ${isWarning ? 'animate-pulse' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function StatsPanel({ character, health, stress, sanity }: StatsPanelProps) {
  return (
    <div className="fmab-panel bg-fmab-card border border-fmab-border rounded-lg p-4 space-y-6">
      <div className="border-b border-fmab-border pb-4">
        <h2 className="font-serif text-xl text-fmab-gold font-bold">{character.name}</h2>
        <p className="text-sm text-fmab-steel capitalize">{character.origin} · {character.history}</p>
        {character.seenGate && <span className="text-xs text-fmab-redLight font-mono">VIO LA PUERTA</span>}
      </div>

      <div className="space-y-4">
        <StatBar label="VITALIDAD" value={health.current} max={health.max} color="red" warningThreshold={0.25} />
        <StatBar label="ESTRÉS" value={stress.current} max={stress.max} color="yellow" warningThreshold={0.7} />
        <StatBar label="CORDURA" value={sanity.current} max={sanity.max} color="purple" warningThreshold={0.3} />
      </div>

      <div className="border-t border-fmab-border pt-4">
        <h3 className="font-mono text-xs text-fmab-gold mb-2 tracking-wider">ATRIBUTOS</h3>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {[
            { key: 'str', label: 'FUE' },
            { key: 'agi', label: 'AGI' },
            { key: 'int', label: 'INT' },
            { key: 'per', label: 'PER' },
            { key: 'vol', label: 'VOL' },
            { key: 'car', label: 'CAR' },
          ].map(({ key, label }) => (
            <div key={key} className="flex justify-between">
              <span className="text-fmab-steel">{label}</span>
              <span className="text-fmab-parchment font-bold">{character.attributes[key as keyof typeof character.attributes]}</span>
            </div>
          ))}
        </div>
      </div>

      {health.injuries.length > 0 && (
        <div className="border-t border-fmab-red pt-4">
          <h3 className="font-mono text-xs text-fmab-red mb-2 tracking-wider">HERIDAS</h3>
          <div className="space-y-1 text-xs">
            {health.injuries.map((injury: any) => (
              <div key={injury.id} className="flex justify-between text-fmab-redLight">
                <span>{injury.bodyPart}: {injury.type} ({injury.severity})</span>
                <span>{injury.treated ? '✓' : '✗'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {health.automailParts.length > 0 && (
        <div className="border-t border-fmab-steel pt-4">
          <h3 className="font-mono text-xs text-fmab-steel mb-2 tracking-wider">AUTOMAIL</h3>
          <div className="flex flex-wrap gap-1">
            {health.automailParts.map((part: string) => (
              <span key={part} className="px-2 py-0.5 bg-fmab-steel text-fmab-parchment text-xs rounded">
                {part.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}