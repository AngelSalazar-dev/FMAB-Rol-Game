import type { GameState, ParsedAction, DiceResult, GameStateChanges } from '@/types/game';
import { getOutcomeLabel } from '../core/dice';

export function processResistance(parsed: ParsedAction, dice: DiceResult, state: GameState) {
  const details: string[] = [];
  const changes: GameStateChanges = {};

  if (!parsed.raw.toLowerCase().includes('resist') && !parsed.raw.toLowerCase().includes('resisto') && !parsed.raw.toLowerCase().includes('me niego')) {
    return { success: false, outcome: 'miss' as const, changes, details: [] };
  }

  const attributes = {
    insight: state.character.attributes.int,
    prowess: state.character.attributes.str,
    resolve: state.character.attributes.vol,
  };

  let attribute: keyof typeof attributes = 'resolve';
  if (parsed.raw.toLowerCase().includes('físic') || parsed.raw.toLowerCase().includes('golpe') || parsed.raw.toLowerCase().includes('herida')) attribute = 'prowess';
  else if (parsed.raw.toLowerCase().includes('ment') || parsed.raw.toLowerCase().includes('engaño') || parsed.raw.toLowerCase().includes('mentira') || parsed.raw.toLowerCase().includes('ilusión')) attribute = 'insight';

  const attrValue = attributes[attribute];
  const attrMod = Math.floor((attrValue - 10) / 2);
  const adjustedTotal = dice.total + attrMod;

  details.push(`Atributo usado: ${attribute} (${attrValue}, mod ${attrMod >= 0 ? '+' : ''}${attrMod})`);
  details.push(`Tirada ajustada: ${adjustedTotal} (${getOutcomeLabel(adjustedTotal >= 10 ? 'complete' : adjustedTotal >= 7 ? 'partial' : 'miss')})`);

  const baseStress = 6;
  const reduction = adjustedTotal;
  const stressCost = Math.max(0, baseStress - reduction);

  details.push(`Estrés base para resistir: ${baseStress}`);
  details.push(`Reducción por tirada: ${reduction}`);
  details.push(`Estrés final: ${stressCost}`);

  if (adjustedTotal >= 12) {
    details.push('¡Éxito crítico! Reduces la consecuencia y recuperas 1 estrés.');
    changes.stress = -1;
    changes.resistance = { success: true, critical: true, consequenceReduced: true };
  } else if (adjustedTotal >= 7) {
    details.push('Resistes parcialmente. La consecuencia se reduce un nivel.');
    changes.stress = stressCost;
    changes.resistance = { success: true, critical: false, consequenceReduced: true };
  } else {
    details.push('No logras resistir. La consecuencia completa te golpea y pagas el estrés.');
    changes.stress = stressCost;
    changes.resistance = { success: false, critical: false, consequenceReduced: false };
  }

  return { success: adjustedTotal >= 7, outcome: adjustedTotal >= 10 ? 'complete' as const : adjustedTotal >= 7 ? 'partial' as const : 'miss' as const, changes, details };
}