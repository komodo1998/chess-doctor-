// Persistence — localStorage-backed app state with quota handling, export/import.

import { DEFAULT_CONFIG, type DoctorConfig } from './config';
import { detectPatterns } from './patterns';
import { detectCriticalPlies } from './critical';
import type { Filters, GameAnalysis } from './types';

const STORAGE_KEY = 'chess-doctor.v1';

export interface Settings {
  playerName: string;
  config: DoctorConfig;
  defaultOrientation: 'white' | 'black';
}

export interface PuzzleResult {
  solved: boolean;
  attempts: number;
  lastAt: number;
}

export interface AppState {
  version: 1;
  settings: Settings;
  games: GameAnalysis[];
  puzzleResults: Record<string, PuzzleResult>;
  /** training task check-off keyed by `${diagnosisId}:${dayIdx}:${taskIdx}` */
  trainingChecks: Record<string, boolean>;
  filters: Filters;
}

export function defaultState(): AppState {
  return {
    version: 1,
    settings: {
      playerName: '',
      config: structuredClone(DEFAULT_CONFIG),
      defaultOrientation: 'white',
    },
    games: [],
    puzzleResults: {},
    trainingChecks: {},
    filters: {
      color: 'both',
      timeControl: 'all',
      opening: 'all',
      severity: 'all',
      phase: 'all',
    },
  };
}

/**
 * Re-derive pattern instances + critical plies from the stored moves.
 * Keeps saved data consistent when the detector logic improves, without
 * paying for engine time again (both functions are pure board math).
 */
function rederiveGame(g: GameAnalysis, config: DoctorConfig): GameAnalysis {
  try {
    const instances = detectPatterns(g.moves, g.id, config);
    const patternsByPly = new Map<number, string[]>();
    for (const inst of instances) {
      const list = patternsByPly.get(inst.ply) ?? [];
      list.push(inst.patternId);
      patternsByPly.set(inst.ply, list);
    }
    const moves = g.moves.map((m) => ({ ...m, patterns: patternsByPly.get(m.ply) ?? [] }));
    return { ...g, moves, instances, criticalPlies: detectCriticalPlies(moves, instances, config) };
  } catch {
    return g;
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || parsed.version !== 1) return defaultState();
    const base = defaultState();
    const config: DoctorConfig = { ...base.settings.config, ...(parsed.settings?.config ?? {}) };
    return {
      ...base,
      ...parsed,
      settings: {
        ...base.settings,
        ...parsed.settings,
        config,
      },
      filters: { ...base.filters, ...(parsed.filters ?? {}) },
      games: (parsed.games ?? []).map((g) => rederiveGame(g, config)),
    };
  } catch {
    return defaultState();
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function saveState(state: AppState): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Quota exceeded (games can be large) — drop oldest games until it fits.
      const appState = state;
      if (appState.games.length > 1) {
        try {
          const trimmed: AppState = { ...appState, games: appState.games.slice(1) };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
          console.warn('Storage quota reached — oldest game analysis was dropped.');
        } catch {
          console.error('Could not persist state:', e);
        }
      }
    }
  }, 400);
}

export function exportState(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importState(json: string): AppState | null {
  try {
    const parsed = JSON.parse(json) as AppState;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.games)) return null;
    const base = defaultState();
    const config: DoctorConfig = { ...base.settings.config, ...(parsed.settings?.config ?? {}) };
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...parsed.settings, config },
      filters: { ...base.filters, ...(parsed.filters ?? {}) },
      games: parsed.games.map((g) => rederiveGame(g, config)),
    };
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
