import type { GameState } from '@/types/game';

export type WeatherType = 'clear' | 'rain' | 'snow' | 'fog' | 'storm';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type TerrainType = 'urban' | 'forest' | 'desert' | 'mountain' | 'coast';

export interface EnvironmentState {
  weather: WeatherType;
  time: TimeOfDay;
  terrain: TerrainType;
  temperature: number;
}

export interface EnvironmentModifiers {
  visibility: number;
  alchemyBonus: number;
  stealthBonus: number;
  automailPenalty: number;
  combatModifier: number;
}

const WEATHER_CYCLE: WeatherType[] = ['clear', 'clear', 'rain', 'fog', 'storm', 'snow'];
const TIME_CYCLE: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];

export function getEnvironmentModifiers(env: EnvironmentState): EnvironmentModifiers {
  const mods: EnvironmentModifiers = {
    visibility: 0,
    alchemyBonus: 0,
    stealthBonus: 0,
    automailPenalty: 0,
    combatModifier: 0,
  };

  switch (env.weather) {
    case 'rain':
      mods.alchemyBonus += 1;
      mods.visibility -= 1;
      mods.combatModifier -= 1;
      break;
    case 'snow':
      mods.automailPenalty += 2;
      mods.visibility -= 1;
      mods.stealthBonus += 1;
      mods.combatModifier -= 2;
      break;
    case 'fog':
      mods.stealthBonus += 2;
      mods.visibility -= 2;
      break;
    case 'storm':
      mods.visibility -= 2;
      mods.stealthBonus += 1;
      mods.combatModifier -= 2;
      mods.alchemyBonus -= 1;
      break;
    case 'clear':
    default:
      break;
  }

  switch (env.time) {
    case 'night':
      mods.stealthBonus += 1;
      mods.visibility -= 1;
      break;
    case 'dawn':
    case 'dusk':
      mods.visibility -= 1;
      break;
    case 'day':
    default:
      break;
  }

  switch (env.terrain) {
    case 'forest':
      mods.stealthBonus += 1;
      mods.alchemyBonus += 1;
      break;
    case 'desert':
      mods.visibility += 1;
      mods.automailPenalty += 1;
      break;
    case 'mountain':
      mods.combatModifier -= 1;
      mods.automailPenalty += 1;
      break;
    case 'coast':
      mods.alchemyBonus += 1;
      break;
    case 'urban':
    default:
      break;
  }

  if (env.temperature < -10) mods.automailPenalty += 2;
  if (env.temperature > 35) mods.combatModifier -= 1;

  return mods;
}

export function advanceTime(state: GameState): GameState {
  const timeIndex = TIME_CYCLE.indexOf(state.environment.time);
  const nextTime = TIME_CYCLE[(timeIndex + 1) % TIME_CYCLE.length];

  let newWeather = state.environment.weather;
  if (nextTime === 'dawn' && Math.random() < 0.3) {
    newWeather = WEATHER_CYCLE[Math.floor(Math.random() * WEATHER_CYCLE.length)];
  }

  return {
    ...state,
    weather: newWeather,
    timeOfDay: nextTime,
    environment: {
      ...state.environment,
      time: nextTime,
      weather: newWeather,
      temperature: calculateTemperature(newWeather, nextTime, state.environment.terrain),
    },
  };
}

function calculateTemperature(weather: WeatherType, time: TimeOfDay, terrain: TerrainType): number {
  let base = 20;

  switch (terrain) {
    case 'desert': base = 35; break;
    case 'mountain': base = 5; break;
    case 'coast': base = 18; break;
    case 'forest': base = 15; break;
    case 'urban': base = 20; break;
  }

  switch (weather) {
    case 'snow': base -= 15; break;
    case 'rain': base -= 5; break;
    case 'storm': base -= 10; break;
    case 'fog': base -= 3; break;
    case 'clear': break;
  }

  switch (time) {
    case 'night': base -= 10; break;
    case 'dawn': base -= 5; break;
    case 'dusk': base -= 3; break;
    case 'day': break;
  }

  return Math.max(-20, Math.min(45, base + Math.floor(Math.random() * 6) - 3));
}

export function getWeatherDescription(weather: WeatherType): string {
  switch (weather) {
    case 'clear': return 'Cielo despejado';
    case 'rain': return 'Lluvia constante';
    case 'snow': return 'Nieve intensa';
    case 'fog': return 'Niebla densa';
    case 'storm': return 'Tormenta violenta';
  }
}

export function getTimeDescription(time: TimeOfDay): string {
  switch (time) {
    case 'dawn': return 'Amanecer';
    case 'day': return 'Mediodía';
    case 'dusk': return 'Atardecer';
    case 'night': return 'Noche';
  }
}

export function getTerrainDescription(terrain: TerrainType): string {
  switch (terrain) {
    case 'urban': return 'Entorno urbano';
    case 'forest': return 'Bosque denso';
    case 'desert': return 'Desierto árido';
    case 'mountain': return 'Montaña escarpada';
    case 'coast': return 'Costa rocosa';
  }
}