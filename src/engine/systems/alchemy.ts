import type { GameState, ParsedAction, DiceResult, Injury, GameStateChanges } from '@/types/game';

export type AlchemyType = 
  | 'basic'        // Transmutación básica (crear objetos, reparar)
  | 'combat'       // Alquimia de combate (armas, escudos, trampas)
  | 'medical'      // Alquimia médica (curar heridas)
  | 'human'        // Transmutación humana (prohibida, necesita piedra)
  | 'body'         // Transmutación del propio cuerpo (como Alphonse)
  | 'circle'       // Dibujar círculos alquímicos
  | 'gate'         // Ir a la Puerta de la Verdad
  | 'father'       // Habilidades de Father (absorber almas, etc.)
  | 'philosopher'; // Uso de la Piedra Filosofal

interface AlchemyResult {
  type: AlchemyType;
  difficulty: number;
  needsCircle: boolean;
  needsStone: boolean;
  materialCost: string | null;
  sanityCost: number;
  stressCost: number;
  hpCost: number;
  specialEffect?: string;
}

const ALCHEMY_ACTIONS: Record<string, (input: string, state: GameState) => AlchemyResult> = {
  // === BÁSICA ===
  transmute: (input, state) => ({
    type: 'basic',
    difficulty: 0,
    needsCircle: true,
    needsStone: false,
    materialCost: extractMaterial(input),
    sanityCost: 0,
    stressCost: 5,
    hpCost: 0,
  }),
  
  crear: (input, state) => ({
    type: 'basic',
    difficulty: 0,
    needsCircle: true,
    needsStone: false,
    materialCost: extractMaterial(input),
    sanityCost: 0,
    stressCost: 5,
    hpCost: 0,
  }),
  
  reparar: (input, state) => ({
    type: 'basic',
    difficulty: -1,
    needsCircle: true,
    needsStone: false,
    materialCost: null,
    sanityCost: 0,
    stressCost: 5,
    hpCost: 0,
  }),

  // === COMBATE ===
  arma: (input, state) => ({
    type: 'combat',
    difficulty: -1,
    needsCircle: true,
    needsStone: false,
    materialCost: null,
    sanityCost: 0,
    stressCost: 10,
    hpCost: 0,
  }),
  
  escudo: (input, state) => ({
    type: 'combat',
    difficulty: 0,
    needsCircle: true,
    needsStone: false,
    materialCost: null,
    sanityCost: 0,
    stressCost: 5,
    hpCost: 0,
  }),
  
  trampa: (input, state) => ({
    type: 'combat',
    difficulty: -1,
    needsCircle: true,
    needsStone: false,
    materialCost: null,
    sanityCost: 0,
    stressCost: 8,
    hpCost: 0,
  }),

  // === MÉDICA ===
  curar: (input, state) => ({
    type: 'medical',
    difficulty: -2,
    needsCircle: true,
    needsStone: false,
    materialCost: null,
    sanityCost: 0,
    stressCost: 10,
    hpCost: 0,
  }),
  
  sanar: (input, state) => ({
    type: 'medical',
    difficulty: -2,
    needsCircle: true,
    needsStone: false,
    materialCost: null,
    sanityCost: 0,
    stressCost: 10,
    hpCost: 0,
  }),

  // === HUMANA (PROHIBIDA) ===
  transmutar_humano: (input, state) => ({
    type: 'human',
    difficulty: -4,
    needsCircle: true,
    needsStone: true,
    materialCost: null,
    sanityCost: 40,
    stressCost: 50,
    hpCost: 30,
    specialEffect: 'gate',
  }),
  
  resucitar: (input, state) => ({
    type: 'human',
    difficulty: -4,
    needsCircle: true,
    needsStone: true,
    materialCost: null,
    sanityCost: 40,
    stressCost: 50,
    hpCost: 30,
    specialEffect: 'gate',
  }),

  // === CUERPO (COMO ALPHONSE) ===
  transmutar_cuerpo: (input, state) => ({
    type: 'body',
    difficulty: -3,
    needsCircle: true,
    needsStone: false,
    materialCost: null,
    sanityCost: 20,
    stressCost: 30,
    hpCost: 15,
    specialEffect: 'armour',
  }),
  
  armadura: (input, state) => ({
    type: 'body',
    difficulty: -2,
    needsCircle: true,
    needsStone: false,
    materialCost: null,
    sanityCost: 10,
    stressCost: 20,
    hpCost: 0,
    specialEffect: 'armour',
  }),

  // === CÍRCULOS ===
  dibujar_círculo: (input, state) => ({
    type: 'circle',
    difficulty: 0,
    needsCircle: false,
    needsStone: false,
    materialCost: 'tiza',
    sanityCost: 0,
    stressCost: 2,
    hpCost: 0,
  }),
  
  círculo: (input, state) => ({
    type: 'circle',
    difficulty: 0,
    needsCircle: false,
    needsStone: false,
    materialCost: 'tiza',
    sanityCost: 0,
    stressCost: 2,
    hpCost: 0,
  }),

  // === PUERTA DE LA VERDAD ===
  puerta: (input, state) => ({
    type: 'gate',
    difficulty: -3,
    needsCircle: true,
    needsStone: false,
    materialCost: null,
    sanityCost: 30,
    stressCost: 40,
    hpCost: 20,
    specialEffect: 'gate',
  }),
  
  verdad: (input, state) => ({
    type: 'gate',
    difficulty: -3,
    needsCircle: true,
    needsStone: false,
    materialCost: null,
    sanityCost: 30,
    stressCost: 40,
    hpCost: 20,
    specialEffect: 'gate',
  }),

  // === FATHER (PODERES ESPECIALES) ===
  absorber: (input, state) => ({
    type: 'father',
    difficulty: -4,
    needsCircle: false,
    needsStone: true,
    materialCost: null,
    sanityCost: 50,
    stressCost: 30,
    hpCost: 10,
    specialEffect: 'absorb',
  }),
  
  alma: (input, state) => ({
    type: 'father',
    difficulty: -4,
    needsCircle: false,
    needsStone: true,
    materialCost: null,
    sanityCost: 50,
    stressCost: 30,
    hpCost: 10,
    specialEffect: 'soul',
  }),

  // === PIEDRA FILOSOFAL ===
  piedra: (input, state) => ({
    type: 'philosopher',
    difficulty: 0,
    needsCircle: false,
    needsStone: true,
    materialCost: null,
    sanityCost: 15,
    stressCost: 5,
    hpCost: 0,
    specialEffect: 'philosopher',
  }),
};

function extractMaterial(input: string): string | null {
  const materials = ['hierro', 'acero', 'tierra', 'arena', 'piedra', 'madera', 'agua', 'aire', 'fuego', 'plomo', 'cobre', 'plata', 'oro', 'carbón', 'azufre', 'sal'];
  for (const m of materials) {
    if (input.includes(m)) return m;
  }
  return null;
}

function hasCircle(state: GameState): boolean {
  return state.character.seenGate ||
    state.inventory.some(i => i.name.toLowerCase().includes('tiza')) ||
    state.inventory.some(i => i.name.toLowerCase().includes('guante')) ||
    (state.character.appearance.automail?.includes('círculo') ?? false) ||
    state.character.skills?.some(s => s.includes('alquimia'));
}

function hasPhilosophersStone(state: GameState): boolean {
  return state.inventory.some(i => i.name.toLowerCase().includes('piedra filosofal'));
}

function getAlchemySkillBonus(state: GameState): number {
  let bonus = 0;
  if (state.character.skills?.some(s => s.includes('alquimia_estatal'))) bonus += 2;
  if (state.character.skills?.some(s => s.includes('alquimia_intuitiva'))) bonus += 1;
  if (state.character.seenGate) bonus += 1;
  return bonus;
}

export function processAlchemy(parsed: ParsedAction, dice: DiceResult, state: GameState) {
  const details: string[] = [];
  const changes: GameStateChanges = {};

  // Detectar tipo de alquimia
  const lower = parsed.raw.toLowerCase().replace(/\s+/g, '_');
  let alchemyResult: AlchemyResult | null = null;

  // Buscar coincidencia en las acciones de alquimia
  for (const [keyword, getAction] of Object.entries(ALCHEMY_ACTIONS)) {
    if (lower.includes(keyword) || lower.includes(keyword.replace('_', ' '))) {
      alchemyResult = getAction(parsed.raw, state);
      break;
    }
  }

  // Si no se encontró acción específica, usar transmutación básica
  if (!alchemyResult) {
    alchemyResult = {
      type: 'basic',
      difficulty: 0,
      needsCircle: true,
      needsStone: false,
      materialCost: extractMaterial(parsed.raw),
      sanityCost: 0,
      stressCost: 5,
      hpCost: 0,
    };
  }

  // Verificar círculo alquímico
  if (alchemyResult.needsCircle && !hasCircle(state)) {
    return {
      success: false,
      outcome: 'miss' as const,
      changes: { stress: 20 },
      details: ['No tienes círculo alquímico. Necesitas tiza, guantes con círculos, o haber visto la Puerta.'],
    };
  }

  // Verificar Piedra Filosofal si se necesita
  if (alchemyResult.needsStone && !hasPhilosophersStone(state)) {
    return {
      success: false,
      outcome: 'miss' as const,
      changes: { stress: 15 },
      details: ['Esta transmutación requiere la Piedra Filosofal.'],
    };
  }

  // Verificar material
  if (alchemyResult.materialCost) {
    const hasMat = state.inventory.some(i => 
      i.name.toLowerCase().includes(alchemyResult.materialCost!) && i.quantity >= 5
    );
    if (!hasMat && !hasPhilosophersStone(state)) {
      return {
        success: false,
        outcome: 'miss' as const,
        changes: {},
        details: [`No tienes suficiente ${alchemyResult.materialCost}.`],
      };
    }
    // Consumir material
    if (!hasPhilosophersStone(state)) {
      changes.inventory = { remove: { name: alchemyResult.materialCost, quantity: 5 } };
      details.push(`Consumes 5 unidades de ${alchemyResult.materialCost}.`);
    }
  }

  // Calcular resultado
  const skillBonus = getAlchemySkillBonus(state);
  const adjustedTotal = dice.total + alchemyResult.difficulty + skillBonus;

  let outcome: 'complete' | 'partial' | 'miss';
  if (adjustedTotal >= 10) outcome = 'complete';
  else if (adjustedTotal >= 7) outcome = 'partial';
  else outcome = 'miss';

  // Piedra Filosofal siempre tiene éxito
  if (hasPhilosophersStone(state) && alchemyResult.type !== 'human') {
    outcome = 'complete';
    details.push('La Piedra Filosofal brilla. La transmutación es perfecta.');
    changes.sanity = 10;
  }

  // Aplicar costos según resultado
  switch (outcome) {
    case 'complete':
      changes.stress = alchemyResult.stressCost;
      if (alchemyResult.sanityCost > 0) changes.sanity = alchemyResult.sanityCost;
      if (alchemyResult.hpCost > 0) {
        changes.health = {
          ...state.health,
          current: Math.max(1, state.health.current - alchemyResult.hpCost),
        };
      }
      details.push(getSuccessDescription(alchemyResult.type));
      break;

    case 'partial':
      changes.stress = alchemyResult.stressCost + 5;
      if (alchemyResult.sanityCost > 0) changes.sanity = Math.floor(alchemyResult.sanityCost * 0.5);
      if (alchemyResult.hpCost > 0) {
        changes.health = {
          ...state.health,
          current: Math.max(1, state.health.current - Math.floor(alchemyResult.hpCost * 0.5)),
        };
      }
      details.push(getPartialDescription(alchemyResult.type));
      // Posible herida leve
      if (Math.random() < 0.3) {
        changes.injury = {
          id: crypto.randomUUID(),
          bodyPart: Math.random() < 0.5 ? 'left_arm' : 'right_arm',
          type: 'burn',
          severity: 'light',
          treated: false,
          isAutomail: false,
        };
        details.push('Sufres una quemadura leve en las manos.');
      }
      break;

    case 'miss':
      changes.stress = alchemyResult.stressCost + 10;
      if (alchemyResult.sanityCost > 0) changes.sanity = Math.floor(alchemyResult.sanityCost * 0.7);
      if (alchemyResult.hpCost > 0) {
        changes.health = {
          ...state.health,
          current: Math.max(1, state.health.current - Math.floor(alchemyResult.hpCost * 0.7)),
        };
      }
      details.push('¡REBOTE ALQUÍMICO! La energía se vuelve contra ti.');
      // Herida garantizada en fallo
      changes.injury = {
        id: crypto.randomUUID(),
        bodyPart: Math.random() < 0.5 ? 'left_arm' : 'right_arm',
        type: 'burn',
        severity: Math.random() < 0.5 ? 'moderate' : 'severe',
        treated: false,
        isAutomail: false,
      };
      break;
  }

  // Efectos especiales
  if (alchemyResult.specialEffect && outcome !== 'miss') {
    const special = getSpecialEffect(alchemyResult.specialEffect, state);
    if (special.changes) Object.assign(changes, special.changes);
    if (special.details) details.push(...special.details);
  }

  return {
    success: outcome !== 'miss',
    outcome,
    changes,
    details,
  };
}

function getSuccessDescription(type: AlchemyType): string {
  const descriptions: Record<AlchemyType, string> = {
    basic: 'La transmutación es perfecta. La materia obedece a tu voluntad.',
    combat: 'Tu alquimia de combate es letal. El metal se forma en el arma que necesitas.',
    medical: 'La alquimia médica cierra las heridas. El dolor disminuye.',
    human: 'La transmutación humana tiene éxito... pero a un costo terrible.',
    body: 'Tu cuerpo se transforma. La armadura de metal te protege.',
    circle: 'El círculo alquímico brilla con energía azul.',
    gate: 'La Puerta de la Verdad se abre ante ti.',
    father: 'Poder absoluto fluye a través de ti.',
    philosopher: 'La Piedra Filosofal amplifica tu poder infinitamente.',
  };
  return descriptions[type];
}

function getPartialDescription(type: AlchemyType): string {
  const descriptions: Record<AlchemyType, string> = {
    basic: 'La transmutación funciona, pero algo no sale como esperabas.',
    combat: 'El arma se forma, pero imperfecta. Aún sirve.',
    medical: 'Las heridas mejoran parcialmente. Necesitas más tiempo.',
    human: 'La transmutación falla parcialmente. sufres un rebote terrible.',
    body: 'La transformación es incompleta. Parte de tu cuerpo queda expuesto.',
    circle: 'El círculo se dibuja, pero tiene imperfecciones.',
    gate: 'La Puerta se abre momentáneamente, pero se cierra rápido.',
    father: 'El poder es inestable. Puede ser peligroso.',
    philosopher: 'La piedra brilla, pero su poder es inestable.',
  };
  return descriptions[type];
}

function getSpecialEffect(effect: string, state: GameState): { changes?: GameStateChanges; details?: string[] } {
  switch (effect) {
    case 'gate':
      return {
        changes: { character: { ...state.character, seenGate: true } },
        details: ['Has visto la Puerta de la Verdad. Ahora puedes transmutar sin círculo.'],
      };
    case 'armour':
      return {
        details: ['La armadura de metal te envuelve. Estás más protegido.'],
      };
    case 'absorb':
      return {
        changes: {
          sanity: 30,
          stress: 30,
        },
        details: ['Absorbes almas a tu alrededor. El poder es intoxicante, pero corruptor.'],
      };
    case 'soul':
      return {
        changes: {
          sanity: 40,
        },
        details: ['Manipulas almas humanas. Cada uso te acerca más a la locura.'],
      };
    case 'philosopher':
      return {
        changes: {
          sanity: 15,
        },
        details: ['La Piedra Filosofal brilla con un poder terrible. Las almas atrapadas susurran.'],
      };
    default:
      return {};
  }
}
