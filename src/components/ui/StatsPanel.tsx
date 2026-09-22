'use client';

import type { GameState, Injury } from '@/types/game';

interface StatsPanelProps {
  character: GameState['character'];
  health: GameState['health'];
  stress: GameState['stress'];
  sanity: GameState['sanity'];
}

const INJURY_BODY: Record<string, string> = {
  head: 'Cabeza', torso: 'Torso', left_arm: 'Brazo izq.', right_arm: 'Brazo der.',
  left_leg: 'Pierna izq.', right_leg: 'Pierna der.', hand: 'Mano',
};

const INJURY_TYPE: Record<string, string> = {
  cut: 'Corte', fracture: 'Fractura', burn: 'Quemadura', bullet: 'Balazo',
  blunt: 'Golpe', stab: 'Aplastamiento',
};

const INJURY_SEVERITY: Record<string, string> = {
  light: 'Leve', moderate: 'Moderada', severe: 'Grave', critical: 'Crítica',
};

function StatBar({ label, value, max, color, warningHigh = false, warningThreshold = 0.3 }: {
  label: string;
  value: number;
  max: number;
  color: string;
  warningHigh?: boolean;
  warningThreshold?: number;
}) {
  const percentage = (value / max) * 100;
  const isWarning = warningHigh
    ? percentage > warningThreshold * 100
    : percentage < warningThreshold * 100;

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
  const untreatedSevere = health.injuries.filter((i: Injury) => !i.treated && i.severity === 'severe').length;
  const untreatedCritical = health.injuries.filter((i: Injury) => !i.treated && i.severity === 'critical').length;
  const untreatedModerate = health.injuries.filter((i: Injury) => !i.treated && i.severity === 'moderate').length;
  const totalPenalty = untreatedCritical * -3 + untreatedSevere * -2 + untreatedModerate * -1;

  return (
    <div className="fmab-panel bg-fmab-card border border-fmab-border rounded-lg p-4 space-y-6">
      <div className="border-b border-fmab-border pb-4">
        <h2 className="font-serif text-xl text-fmab-gold font-bold">{character.name}</h2>
        <p className="text-sm text-fmab-steel capitalize">{character.origin} · {character.history}</p>
        {character.seenGate && <span className="text-xs text-fmab-redLight font-mono">VIO LA PUERTA</span>}
      </div>

      <div className="space-y-4">
        <StatBar label="VITALIDAD" value={health.current} max={health.max} color="red" warningThreshold={0.25} />
        <StatBar label="ESTRÉS" value={stress.current} max={stress.max} color="yellow" warningHigh warningThreshold={0.7} />
        <StatBar label="CORDURA" value={sanity.current} max={sanity.max} color="purple" warningThreshold={0.3} />
      </div>

      {sanity.conditions.length > 0 && (
        <div className="border-t border-fmab-purple pt-3">
          <h3 className="font-mono text-xs text-fmab-purple mb-2 tracking-wider">CONDICIONES MENTALES</h3>
          <div className="flex flex-wrap gap-1">
            {sanity.conditions.map((cond: string) => (
              <span key={cond} className="px-2 py-0.5 bg-fmab-purple/20 text-fmab-purple text-xs rounded border border-fmab-purple/30">
                {cond}
              </span>
            ))}
          </div>
        </div>
      )}

      {stress.traumas.length > 0 && (
        <div className="border-t border-fmab-red pt-3">
          <h3 className="font-mono text-xs text-fmab-red mb-2 tracking-wider">TRAUMAS</h3>
          <div className="space-y-1">
            {stress.traumas.map((trauma: any) => (
              <div key={trauma.id || trauma.type} className="text-xs text-fmab-redLight flex justify-between">
                <span>{trauma.type}</span>
                {trauma.permanent && <span className="text-fmab-red font-mono">PERMANENTE</span>}
              </div>
            ))}
          </div>
        </div>
      )}

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
        {totalPenalty !== 0 && (
          <div className="mt-2 text-xs text-fmab-redLight font-mono">
            Penalización por heridas: {totalPenalty} a todas las tiradas
          </div>
        )}
      </div>

      {health.injuries.length > 0 && (
        <div className="border-t border-fmab-red pt-4">
          <h3 className="font-mono text-xs text-fmab-red mb-2 tracking-wider">HERIDAS</h3>
          <div className="space-y-1 text-xs">
            {health.injuries.map((injury: Injury) => (
              <div key={injury.id} className="flex justify-between text-fmab-redLight">
                <span>{INJURY_BODY[injury.bodyPart] || injury.bodyPart}: {INJURY_TYPE[injury.type] || injury.type} ({INJURY_SEVERITY[injury.severity] || injury.severity})</span>
                <span className="flex items-center gap-2">
                  {!injury.treated && injury.severity === 'critical' && <span className="text-fmab-red font-bold">-3</span>}
                  {!injury.treated && injury.severity === 'severe' && <span className="text-fmab-redLight">-2</span>}
                  {!injury.treated && injury.severity === 'moderate' && <span className="text-fmab-yellow">-1</span>}
                  {injury.isAutomail && <span className="text-fmab-steel">⚙</span>}
                  <span>{injury.treated ? '✓' : '✗'}</span>
                </span>
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

      {character.skills && character.skills.length > 0 && (
        <div className="border-t border-fmab-border pt-4">
          <h3 className="font-mono text-xs text-fmab-gold mb-2 tracking-wider">HABILIDADES</h3>
          <div className="flex flex-wrap gap-1">
            {character.skills.map((skill: string) => (
              <span key={skill} className="px-2 py-0.5 bg-fmab-gold/10 text-fmab-goldLight text-xs rounded border border-fmab-gold/20">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
