export interface Clock {
  id: string;
  name: string;
  segments: number;
  filled: number;
  color: 'red' | 'blue' | 'green' | 'yellow';
  description?: string;
}

export function createClock(
  id: string,
  name: string,
  segments: number = 8,
  color: Clock['color'] = 'red',
  description?: string
): Clock {
  return { id, name, segments, filled: 0, color, description };
}

export function advanceClock(clock: Clock, segments: number = 1): Clock {
  return {
    ...clock,
    filled: Math.min(clock.filled + segments, clock.segments),
  };
}

export function reduceClock(clock: Clock, segments: number = 1): Clock {
  return {
    ...clock,
    filled: Math.max(clock.filled - segments, 0),
  };
}

export function resetClock(clock: Clock): Clock {
  return { ...clock, filled: 0 };
}

export function isClockComplete(clock: Clock): boolean {
  return clock.filled >= clock.segments;
}

export function getClockPercentage(clock: Clock): number {
  return (clock.filled / clock.segments) * 100;
}

export const DEFAULT_CLOCKS: Clock[] = [
  createClock('suspicion', 'Sospecha Militar', 8, 'red', 'Nivel de alerta de la Policía Militar'),
  createClock('disease', 'Enfermedad/Infección', 8, 'yellow', 'Progresión de heridas sin tratar'),
  createClock('consequence', 'Consecuencias Acumuladas', 8, 'blue', 'Eventos negativos en cascada'),
  createClock('trust', 'Confianza de Aliados', 4, 'green', 'Lealtad de los compañeros'),
];