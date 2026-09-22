import type { GameState, ParsedAction, DiceResult, GameStateChanges } from '@/types/game';
import { getOutcomeLabel } from '../core/dice';

export function processSocial(parsed: ParsedAction, dice: DiceResult, state: GameState) {
  const details: string[] = [];
  const changes: GameStateChanges = {};

  const lower = parsed.raw.toLowerCase();
  let intent: 'convince' | 'deceive' | 'intimidate' | 'bribe' | 'inquire' = 'inquire';

  if (lower.includes('convenc') || lower.includes('persuad')) intent = 'convince';
  else if (lower.includes('engañ') || lower.includes('mient') || lower.includes('fing')) intent = 'deceive';
  else if (lower.includes('amenaz') || lower.includes('intimid')) intent = 'intimidate';
  else if (lower.includes('soborn') || lower.includes('pago') || lower.includes('dinero')) intent = 'bribe';

  const carismaMod = 0; // Attribute mod already applied in engine.ts dice roll
  const adjustedTotal = dice.total + carismaMod;

  let outcome: 'complete' | 'partial' | 'miss';
  if (adjustedTotal >= 10) outcome = 'complete';
  else if (adjustedTotal >= 7) outcome = 'partial';
  else outcome = 'miss';

  details.push(`Intención: ${intent}`);
  details.push(`Carisma: ${carismaMod >= 0 ? '+' : ''}${carismaMod} (aplicado en tirada base)`);
  details.push(`Tirada ajustada: ${adjustedTotal} (${getOutcomeLabel(outcome)})`);

  switch (outcome) {
    case 'complete':
      details.push('Tus palabras tienen el efecto deseado. El objetivo cede.');
      changes.social = { success: true, intent, attitude: 'friendly' };
      if (intent === 'bribe') {
        const hasMoney = state.inventory.some(i => i.name.toLowerCase() === 'dinero' && i.quantity >= 50);
        if (hasMoney) {
          changes.inventory = { remove: { name: 'dinero', quantity: 50 } };
        } else {
          details.push('¡No tienes suficiente dinero para sobornar!');
          return { success: false, outcome: 'miss' as const, changes, details: ['No tienes dinero para sobornar.'] };
        }
      }
      break;
    case 'partial':
      details.push('Logras algo, pero no todo. El objetivo duda o pone condiciones.');
      changes.social = { success: true, intent, attitude: 'neutral', conditions: true };
      changes.stress = 5;
      if (intent === 'bribe') {
        const hasMoney = state.inventory.some(i => i.name.toLowerCase() === 'dinero' && i.quantity >= 25);
        if (hasMoney) {
          changes.inventory = { remove: { name: 'dinero', quantity: 25 } };
        } else {
          details.push('¡No tienes suficiente dinero para sobornar!');
          return { success: false, outcome: 'miss' as const, changes, details: ['No tienes dinero para sobornar.'] };
        }
      }
      break;
    case 'miss':
      details.push('Tus palabras fallan. El objetivo se ofende, desconfía o ataca.');
      changes.social = { success: false, intent, attitude: 'hostile' };
      changes.stress = 10;
      changes.suspicion = 5;
      if (intent === 'intimidate') changes.suspicion = 15;
      break;
  }

  if (parsed.target && state.companions.some(c => c.name.toLowerCase() === parsed.target!.toLowerCase())) {
    const companion = state.companions.find(c => c.name.toLowerCase() === parsed.target!.toLowerCase());
    if (companion) {
      const loyaltyChange = outcome === 'complete' ? 10 : outcome === 'partial' ? 5 : -10;
      changes.companionLoyalty = { id: companion.id, change: loyaltyChange };
      details.push(`${companion.name}: lealtad ${loyaltyChange >= 0 ? '+' : ''}${loyaltyChange}.`);
    }
  }

  return { success: outcome !== 'miss', outcome, changes, details };
}