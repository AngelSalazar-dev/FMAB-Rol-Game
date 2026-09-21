import type { GameState, ParsedAction, DiceResult, Injury, HealthState, GameStateChanges } from '@/types/game';
import { getOutcomeLabel } from '../core/dice';

const BODY_PARTS = ['head', 'torso', 'left_arm', 'right_arm', 'left_leg', 'right_leg'] as const;
type BodyPart = typeof BODY_PARTS[number];

const INJURY_TYPES = ['cut', 'fracture', 'burn', 'bullet', 'blunt'] as const;
type InjuryType = typeof INJURY_TYPES[number];

const SEVERITY_DAMAGE = { light: 5, moderate: 15, severe: 25, critical: 40 };
const SEVERITY_NAMES = { light: 'Leve', moderate: 'Moderada', severe: 'Grave', critical: 'Crítica' };

export function addInjury(health: HealthState, injury: Injury): HealthState {
  const newInjuries = [...health.injuries, injury];
  const damage = SEVERITY_DAMAGE[injury.severity];

  return {
    ...health,
    current: Math.max(0, health.current - damage),
    injuries: newInjuries,
  };
}

export function healInjury(health: HealthState, injuryId: string, amount: number = 10): HealthState {
  const injuryIndex = health.injuries.findIndex(i => i.id === injuryId);
  if (injuryIndex === -1) return health;

  const newInjuries = [...health.injuries];
  const injury = newInjuries[injuryIndex];

  if (injury.severity === 'light') {
    newInjuries.splice(injuryIndex, 1);
  } else {
    const severities: Injury['severity'][] = ['critical', 'severe', 'moderate', 'light'];
    const currentIndex = severities.indexOf(injury.severity);
    if (currentIndex < severities.length - 1) {
      newInjuries[injuryIndex] = { ...injury, severity: severities[currentIndex + 1] };
    }
  }

  return {
    ...health,
    current: Math.min(health.max, health.current + amount),
    injuries: newInjuries,
  };
}

export function treatInjury(health: HealthState, injuryId: string): HealthState {
  const newInjuries = health.injuries.map(i =>
    i.id === injuryId ? { ...i, treated: true } : i
  );
  return { ...health, injuries: newInjuries };
}

export function addAutomail(health: HealthState, part: BodyPart): HealthState {
  return {
    ...health,
    automailParts: [...health.automailParts, part],
  };
}

export function checkAutomailFailure(health: HealthState, environment: { temperature: number; weather: string }): Injury | null {
  if (health.automailParts.length === 0) return null;

  if (environment.temperature < 0 && environment.weather === 'snow') {
    const part = health.automailParts[Math.floor(Math.random() * health.automailParts.length)];
    return {
      id: crypto.randomUUID(),
      bodyPart: part,
      type: 'blunt',
      severity: 'moderate',
      treated: false,
      isAutomail: true,
    };
  }

  return null;
}

export function processHealth(parsed: ParsedAction, dice: DiceResult, state: GameState) {
  const details: string[] = [];
  const changes: GameStateChanges = {};

  if (parsed.intent === 'heal' || parsed.raw.toLowerCase().includes('curo') || parsed.raw.toLowerCase().includes('cura')) {
    const untreatedInjuries = state.health.injuries.filter(i => !i.treated);
    if (untreatedInjuries.length === 0) {
      return { success: true, outcome: 'complete' as const, changes: { stress: -5 }, details: ['No hay heridas que tratar.'] };
    }

    const injury = untreatedInjuries[0];
    const healed = healInjury(state.health, injury.id, 15);

    changes.health = healed;
    details.push(`Tratas tu ${injury.type} en ${injury.bodyPart} (${SEVERITY_NAMES[injury.severity]}).`);

    if (dice.outcome === 'partial') {
      details.push('La curación es parcial. Necesitarás más tiempo.');
    } else if (dice.outcome === 'miss') {
      details.push('La herida empeora con tu torpe intento.');
      changes.health = addInjury(state.health, {
        ...injury,
        id: crypto.randomUUID(),
        severity: 'moderate',
      });
    }

    return { success: true, outcome: dice.outcome, changes, details };
  }

  return { success: false, outcome: 'miss' as const, changes: {}, details: ['Acción de salud no reconocida.'] };
}

export function getHealthDescription(health: HealthState): string {
  if (health.injuries.length === 0) return 'Sin heridas.';

  return health.injuries.map(i => {
    const auto = i.isAutomail ? ' [AUTOMAIL]' : '';
    const treated = i.treated ? ' (Tratada)' : '';
    return `${i.bodyPart}: ${i.type} ${SEVERITY_NAMES[i.severity]}${auto}${treated}`;
  }).join(', ');
}