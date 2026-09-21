import type { GameState, ParsedAction, DiceResult, Weapon, NPC, GameStateChanges, Injury } from '@/types/game';
import { getOutcomeLabel } from '../core/dice';

const WEAPONS: Record<string, Weapon> = {
  'espada': { name: 'Espada', damage: 15, range: 'melee', type: 'physical' },
  'daga': { name: 'Daga', damage: 10, range: 'melee', type: 'physical' },
  'pistola': { name: 'Pistola', damage: 20, range: 'medium', type: 'physical' },
  'rifle': { name: 'Rifle', damage: 30, range: 'long', type: 'physical' },
  'lanzas': { name: 'Lanza', damage: 18, range: 'melee', type: 'physical' },
  'puños': { name: 'Puños', damage: 8, range: 'melee', type: 'physical' },
  'automail': { name: 'Brazo Automail', damage: 22, range: 'melee', type: 'physical' },
};

export function getWeapon(state: GameState, weaponName?: string): Weapon {
  if (weaponName && WEAPONS[weaponName.toLowerCase()]) {
    return WEAPONS[weaponName.toLowerCase()];
  }
  const invWeapon = state.inventory.find(i => i.item_type === 'weapon');
  if (invWeapon) {
    return WEAPONS[invWeapon.name.toLowerCase()] || { name: invWeapon.name, damage: 10, range: 'melee', type: 'physical' };
  }
  if (state.health.automailParts.includes('right_arm') || state.health.automailParts.includes('left_arm')) {
    return WEAPONS.automail;
  }
  return WEAPONS.puños;
}

export function calculateDamage(weapon: Weapon, dice: DiceResult, position: 'melee' | 'ranged' | 'flanking' = 'melee'): number {
  let baseDamage = weapon.damage;

  if (position === 'flanking') baseDamage *= 1.5;
  if (weapon.range === 'long' && position === 'melee') baseDamage *= 0.5;

  if (dice.outcome === 'complete') baseDamage *= 2;
  if (dice.outcome === 'partial') baseDamage *= 1.5;
  if (dice.outcome === 'miss') baseDamage = 0;

  return Math.floor(baseDamage);
}

export function processCombat(parsed: ParsedAction, dice: DiceResult, state: GameState) {
  const details: string[] = [];
  const changes: GameStateChanges = {};

  const weapon = getWeapon(state, parsed.weapon);
  const position = parsed.raw.toLowerCase().includes('flanco') ? 'flanking' :
                   parsed.raw.toLowerCase().includes('distancia') ? 'ranged' : 'melee';

  const damage = calculateDamage(weapon, dice, position);

  details.push(`Arma: ${weapon.name} (${weapon.damage} daño base)`);
  details.push(`Posición: ${position}`);
  details.push(`Tirada: ${getOutcomeLabel(dice.outcome)}`);
  details.push(`Daño calculado: ${damage}`);

  if (dice.outcome === 'miss') {
    details.push('Tu ataque falla estrepitosamente.');
    if (Math.random() < 0.4) {
      const injury: Injury = {
        id: crypto.randomUUID(),
        bodyPart: 'torso',
        type: 'blunt',
        severity: 'light',
        treated: false,
        isAutomail: false,
      };
changes.injury = injury;
      changes.stress = 5;
      details.push('Recibes un contraataque. Golpe leve en el torso.');
    }
    return { success: false, outcome: 'miss' as const, changes, details };
  }

  changes.combat = { damage, weapon: weapon.name, position };

  if (dice.outcome === 'complete') {
    details.push('¡Golpe crítico! El enemigo recibe el impacto completo.');
    if (Math.random() < 0.3) {
      changes.clocks = { consequence: 1 };
      details.push('El enemigo queda aturdido. Ventaja en el siguiente turno.');
    }
  } else {
    details.push('Golpeas, pero el enemigo se defiende parcialmente.');
  }

  return { success: true, outcome: dice.outcome, changes, details };
}

export function processEnemyAttack(state: GameState, enemy: NPC, dice: DiceResult) {
  const details: string[] = [];
  const changes: GameStateChanges = {};

  const enemyWeapon: Weapon = { name: enemy.weapon || 'Garras', damage: enemy.damage || 15, range: 'melee', type: 'physical' };
  const damage = calculateDamage(enemyWeapon, dice, 'melee');

  if (dice.outcome === 'miss') {
    details.push(`${enemy.name} falla su ataque.`);
    return { damage: 0, details };
  }

if (dice.outcome === 'complete') {
    details.push(`${enemy.name} te asesta un golpe brutal.`);
    const injury: Injury = {
      id: crypto.randomUUID(),
      bodyPart: 'torso',
      type: 'blunt',
      severity: 'moderate',
      treated: false,
      isAutomail: false,
    };
    changes.injury = injury;
  } else {
    details.push(`${enemy.name} te hiere.`);
    const injury: Injury = {
      id: crypto.randomUUID(),
      bodyPart: 'left_arm',
      type: 'cut',
      severity: 'light',
      treated: false,
      isAutomail: false,
    };
    changes.injury = injury;
  }

  return { damage, details, changes };
}