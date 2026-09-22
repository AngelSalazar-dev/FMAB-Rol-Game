'use server';

import pool from './db';
import type { GameState, Character, SaveData, Decision } from '@/types/game';

function safeJsonParse(val: any, fallback: any = null) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

export async function saveGame(state: GameState, characterId: number): Promise<SaveData> {
  const save = {
    character_id: characterId,
    mode: state.mode,
    state: JSON.stringify(state),
    turn_count: state.turn,
    decision_history: JSON.stringify(state.morality.decisions),
    is_alive: state.health.current > 0,
  };

  const [result] = await pool.query('INSERT INTO saves SET ?', [save]) as any;

  return {
    id: result.insertId,
    characterId: characterId,
    mode: state.mode,
    state,
    turnCount: state.turn,
    decisionHistory: state.morality.decisions,
    isAlive: state.health.current > 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function loadGame(saveId: number): Promise<SaveData | null> {
  const [rows] = await pool.query('SELECT * FROM saves WHERE id = ?', [saveId]) as any[];

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    characterId: row.character_id,
    mode: row.mode,
    state: safeJsonParse(row.state, {}),
    turnCount: row.turn_count,
    decisionHistory: safeJsonParse(row.decision_history, []),
    isAlive: row.is_alive,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSaves(characterId: number): Promise<SaveData[]> {
  const [rows] = await pool.query(
    'SELECT * FROM saves WHERE character_id = ? ORDER BY updated_at DESC',
    [characterId]
  ) as any[];

  return rows.map((row: any) => ({
    id: row.id,
    characterId: row.character_id,
    mode: row.mode,
    state: safeJsonParse(row.state, {}),
    turnCount: row.turn_count,
    decisionHistory: safeJsonParse(row.decision_history, []),
    isAlive: row.is_alive,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function deleteSave(saveId: number): Promise<void> {
  await pool.query('DELETE FROM saves WHERE id = ?', [saveId]);
}

export async function createCharacter(character: Omit<Character, 'id'>): Promise<number> {
  const row = {
    name: character.name,
    origin: character.origin,
    history: character.history,
    seen_gate: (character as any).seenGate ?? false,
    appearance: JSON.stringify(character.appearance),
    attributes: JSON.stringify(character.attributes),
    skills: JSON.stringify(character.skills),
    hp: (character as any).hp ?? 100,
    max_hp: (character as any).maxHp ?? 100,
    stress: (character as any).stress ?? 0,
    max_stress: (character as any).maxStress ?? 100,
    sanity: (character as any).sanity ?? 100,
    max_sanity: (character as any).maxSanity ?? 100,
  };

  const [result] = await pool.query('INSERT INTO characters SET ?', [row]) as any;

  return result.insertId;
}

export async function getCharacter(id: number): Promise<Character | null> {
  const [rows] = await pool.query('SELECT * FROM characters WHERE id = ?', [id]) as any[];

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    origin: row.origin,
    history: row.history,
    seenGate: row.seen_gate,
    appearance: safeJsonParse(row.appearance, {}),
    attributes: safeJsonParse(row.attributes, {}),
    skills: safeJsonParse(row.skills, []),
    hp: row.hp,
    maxHp: row.max_hp,
    stress: row.stress,
    maxStress: row.max_stress,
    sanity: row.sanity,
    maxSanity: row.max_sanity,
  } as Character;
}

export async function getCharacters(): Promise<Character[]> {
  const [rows] = await pool.query('SELECT * FROM characters ORDER BY created_at DESC') as any[];

  return rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    origin: row.origin,
    history: row.history,
    seenGate: row.seen_gate,
    appearance: safeJsonParse(row.appearance, {}),
    attributes: safeJsonParse(row.attributes, {}),
    skills: safeJsonParse(row.skills, []),
    hp: row.hp,
    maxHp: row.max_hp,
    stress: row.stress,
    maxStress: row.max_stress,
    sanity: row.sanity,
    maxSanity: row.max_sanity,
  })) as Character[];
}

export async function updateCharacter(id: number, updates: Partial<Character>): Promise<void> {
  const data: any = { ...updates };
  if (data.appearance) data.appearance = JSON.stringify(data.appearance);
  if (data.attributes) data.attributes = JSON.stringify(data.attributes);
  if (data.skills) data.skills = JSON.stringify(data.skills);

  await pool.query('UPDATE characters SET ? WHERE id = ?', [data, id]);
}