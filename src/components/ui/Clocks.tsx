'use client';

import type { Clock } from '@/types/game';

interface ClocksProps {
  clocks: Clock[];
}

function ClockComponent({ clock }: { clock: Clock }) {
  const percentage = (clock.filled / clock.segments) * 100;

  const colorClasses: Record<Clock['color'], string> = {
    red: 'bg-fmab-red',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-fmab-parchment">{clock.name}</span>
        <span className="text-fmab-goldLight">{clock.filled}/{clock.segments}</span>
      </div>
      <div className="h-2 bg-fmab-border rounded-full overflow-hidden">
        <div
          className={`${colorClasses[clock.color]} h-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {clock.description && (
        <p className="text-xs text-fmab-steel italic">{clock.description}</p>
      )}
    </div>
  );
}

export function Clocks({ clocks }: ClocksProps) {
  if (clocks.length === 0) return null;

  return (
    <div className="fmab-panel bg-fmab-card border border-fmab-border rounded-lg p-4">
      <h3 className="font-mono text-xs text-fmab-gold mb-3 tracking-wider">RELOJES DE PROGRESO</h3>
      <div className="space-y-4">
        {clocks.map(clock => (
          <ClockComponent key={clock.id} clock={clock} />
        ))}
      </div>
    </div>
  );
}