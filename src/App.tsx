import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AnalysisPipeline,
  CancelledError,
} from './core/analysis';
import { computeDashboard } from './core/aggregate';
import { gameLabel, parsePgn, suggestPlayerName, type ParsedGame } from './core/pgn';
import { getEngine, type StockfishEngine } from './core/engine';
import {
  clearState,
  defaultState,
  exportState,
  importState,
  loadState,
  saveState,
  type AppState,
  type Settings,
} from './core/storage';
import type { AnalysisProgress, } from './core/analysis';
import type { Filters, GameAnalysis, GameInfo } from './core/types';
import { DashboardView } from './ui/DashboardView';
import { DiagnosesView } from './ui/DiagnosesView';
import { GamesView } from './ui/GamesView';
import { PuzzlesView } from './ui/PuzzlesView';
import { ReportView } from './ui/ReportView';
import { TrainingView } from './ui/TrainingView';
import { SettingsModal } from './ui/SettingsModal';
import { EmptyState } from './ui/bits';

export type Tab = 'dashboard' | 'diagnoses' | 'report' | 'puzzles' | 'games' | 'training';

interface AnalysisState {
  running: boolean;
  engineStatus: 'idle' | 'loading' | 'ready' | 'error';
  engineError?: string;
  progress: AnalysisProgress | null;
  notice?: string;
  parseErrors: string[];
}

interface Store {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  config: AppState['settings']['config'];
  playerName: string;
  filteredGames: GameAnalysis[];
  dashboard: ReturnType<typeof computeDashboard>;
  analysis: AnalysisState;
  importAndAnalyze: (pgnText: string) => Promise<void>;
  analyzeGames: (parsed: ParsedGame[], preErrors?: string[]) => Promise<void>;
  cancelAnalysis: () => void;
  markPuzzle: (id: string, solved: boolean) => void;
  toggleTrainingTask: (key: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
  resetAll: () => void;
  doImportState: (json: string) => boolean;
  tab: Tab;
  setTab: (t: Tab) => void;
  openPosition: (gameId: string, ply: number) => void;
  explorer: { gameId: string; ply: number } | null;
  setExplorer: (e: { gameId: string; ply: number } | null) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
}

const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('Store context missing');
  return ctx;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '🩺' },
  { id: 'diagnoses', label: 'Diagnoses', icon: '📋' },
  { id: 'report', label: 'Doctor Report', icon: '📝' },
  { id: 'puzzles', label: 'Puzzles', icon: '♟' },
  { id: 'games', label: 'Game Explorer', icon: '🔎' },
  { id: 'training', label: 'Training', icon: '🎯' },
];

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [analysis, setAnalysis] = useState<AnalysisState>({
    running: false,
    engineStatus: 'idle',
    progress: null,
    parseErrors: [],
  });
  const [tab, setTab] = useState<Tab>('dashboard');
  const [explorer, setExplorer] = useState<{ gameId: string; ply: number } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pipelineRef = useRef<AnalysisPipeline | null>(null);
  const engineRef = useRef<StockfishEngine | null>(null);

  const update = useCallback((fn: (s: AppState) => AppState) => {
    setState((prev) => {
      const next = fn(prev);
      saveState(next);
      return next;
    });
  }, []);

  const resolveGameInfo = useCallback(
    (parsed: ParsedGame, playerName: string): GameInfo => {
      const info: GameInfo = {
        ...parsed.info,
        playerColor: null,
        playerElo: undefined,
        resultForPlayer: null,
      };
      let playerColor: GameInfo['playerColor'] = null;
      if (playerName) {
        const name = playerName.trim().toLowerCase();
        if (info.white.trim().toLowerCase() === name) playerColor = 'white';
        else if (info.black.trim().toLowerCase() === name) playerColor = 'black';
      }
      info.playerColor = playerColor;
      info.playerElo = playerColor === 'white' ? info.whiteElo : playerColor === 'black' ? info.blackElo : undefined;
      if (playerColor) {
        info.resultForPlayer =
          info.result === '1-0'
            ? playerColor === 'white'
              ? 'win'
              : 'loss'
            : info.result === '0-1'
              ? playerColor === 'black'
                ? 'win'
                : 'loss'
              : info.result === '1/2-1/2'
                ? 'draw'
                : null;
      } else {
        info.resultForPlayer = null;
      }
      return info;
    },
    []
  );

  const analyzeParsedGames = useCallback(
    async (parsed: ParsedGame[], preErrors: string[] = []) => {
      if (analysis.running) return;
      setAnalysis((a) => ({ ...a, running: true, engineStatus: 'loading', progress: null, parseErrors: preErrors, notice: undefined }));
      const errors = [...preErrors];

      // 1. Engine boot (Stockfish 19 NNUE wasm).
      let engine: StockfishEngine;
      try {
        engine = await getEngine();
        engineRef.current = engine;
        setAnalysis((a) => ({ ...a, engineStatus: 'ready' }));
      } catch (e) {
        setAnalysis((a) => ({
          ...a,
          running: false,
          engineStatus: 'error',
          engineError: (e as Error).message,
        }));
        return;
      }

      // 2. Auto-detect the player if not set (one name present in every game).
      let playerName = state.settings.playerName;
      let notice: string | undefined;
      if (!playerName) {
        const suggestion = suggestPlayerName(parsed);
        if (suggestion) {
          playerName = suggestion;
          notice = `Detected player: ${suggestion}. You can change this in Settings.`;
          update((s) => ({ ...s, settings: { ...s.settings, playerName: suggestion } }));
        }
      }

      const pipeline = new AnalysisPipeline(engine, state.settings.config);
      pipelineRef.current = pipeline;
      engine.newGame();

      let done = 0;
      for (let i = 0; i < parsed.length; i++) {
        const p = parsed[i];
        const label = `${p.info.white} – ${p.info.black}`;
        try {
          const info = resolveGameInfo(p, playerName);
          const id = `g${Date.now().toString(36)}${i}`;
          const analyzed = await pipeline.analyzeGame(
            { startFen: p.startFen, plies: p.plies },
            info,
            id,
            (progress) => {
              setAnalysis((a) => ({ ...a, progress: { ...progress, gameIndex: done, gameCount: parsed.length } }));
            },
            done,
            parsed.length,
            label
          );
          update((s) => ({ ...s, games: [...s.games, analyzed] }));
        } catch (err) {
          if (err instanceof CancelledError || (err as Error).message === 'cancelled') {
            notice = notice ?? 'Analysis cancelled — already-analyzed games were kept.';
            break;
          }
          errors.push(`${label}: ${(err as Error).message}`);
        }
        done++;
      }

      pipelineRef.current = null;
      setAnalysis((a) => ({
        ...a,
        running: false,
        progress: null,
        parseErrors: errors,
        notice,
      }));
    },
    [analysis.running, resolveGameInfo, state.settings.config, state.settings.playerName, update]
  );

  const importAndAnalyze = useCallback(
    async (pgnText: string) => {
      if (analysis.running) return;
      const { games: parsed, errors } = parsePgn(pgnText);
      if (parsed.length === 0) {
        setAnalysis((a) => ({
          ...a,
          running: false,
          parseErrors: errors.length ? errors : ['No valid games found in the PGN text.'],
        }));
        return;
      }
      await analyzeParsedGames(parsed, errors);
    },
    [analysis.running, analyzeParsedGames]
  );

  const cancelAnalysis = useCallback(() => {
    pipelineRef.current?.cancel();
  }, []);

  const filteredGames = useMemo(
    () => state.games.slice().sort((a, b) => b.importedAt - a.importedAt),
    [state.games]
  );

  const dashboard = useMemo(
    () => computeDashboard(state.games, state.filters, state.settings.playerName, state.settings.config),
    [state.games, state.filters, state.settings.playerName, state.settings.config]
  );

  const markPuzzle = useCallback(
    (id: string, solved: boolean) => {
      update((s) => {
        const prev = s.puzzleResults[id] ?? { solved: false, attempts: 0, lastAt: 0 };
        return {
          ...s,
          puzzleResults: {
            ...s.puzzleResults,
            [id]: { solved: prev.solved || solved, attempts: prev.attempts + 1, lastAt: Date.now() },
          },
        };
      });
    },
    [update]
  );

  const toggleTrainingTask = useCallback(
    (key: string) => {
      update((s) => ({ ...s, trainingChecks: { ...s.trainingChecks, [key]: !s.trainingChecks[key] } }));
    },
    [update]
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
    },
    [update]
  );

  const resetAll = useCallback(() => {
    clearState();
    setState(defaultState());
    setTab('dashboard');
  }, []);

  const doImportState = useCallback((json: string) => {
    const next = importState(json);
    if (!next) return false;
    setState(next);
    saveState(next);
    return true;
  }, []);

  const openPosition = useCallback((gameId: string, ply: number) => {
    setExplorer({ gameId, ply });
    setTab('games');
  }, []);

  const store: Store = {
    state,
    update,
    config: state.settings.config,
    playerName: state.settings.playerName,
    filteredGames,
    dashboard,
    analysis,
    importAndAnalyze,
    analyzeGames: analyzeParsedGames,
    cancelAnalysis,
    markPuzzle,
    toggleTrainingTask,
    updateSettings,
    resetAll,
    doImportState,
    tab,
    setTab,
    openPosition,
    explorer,
    setExplorer,
    settingsOpen,
    setSettingsOpen,
  };

  const hasGames = state.games.length > 0;

  return (
    <StoreContext.Provider value={store}>
      <div className="app">
        <header className="app-header">
          <div className="brand">
            <img className="brand-glyph" src="/mascot.svg" alt="" width={40} height={40} />
            <div>
              <h1>Chess Doctor</h1>
              <p>Diagnose your chess. Understand your weaknesses. Train what actually matters.</p>
            </div>
          </div>
          <nav className="tabs" aria-label="Sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
                disabled={(t.id === 'puzzles' || t.id === 'training' || t.id === 'games') && !hasGames}
              >
                <span className="tab-icon">{t.icon}</span> {t.label}
              </button>
            ))}
          </nav>
          <button className="btn ghost settings-btn" onClick={() => setSettingsOpen(true)} title="Settings">
            ⚙ Settings
          </button>
        </header>

        {analysis.running && (
          <div className="analysis-bar" role="status">
            <span className="spinner" aria-hidden />
            <span>
              Analyzing <strong>{analysis.progress?.gameLabel ?? '…'}</strong>
              {analysis.progress ? ` — position ${analysis.progress.ply + 1}/${analysis.progress.plies} (game ${analysis.progress.gameIndex + 1}/${analysis.progress.gameCount})` : ''}
            </span>
            <button className="btn danger small" onClick={cancelAnalysis}>Cancel</button>
          </div>
        )}

        {tab !== 'dashboard' && !hasGames ? (
          <div className="page">
            <EmptyState
              icon="♟"
              title="No games analyzed yet"
              text="Head to the Dashboard to import PGN games. Chess Doctor will run them through Lichess's Stockfish engine, find your recurring mistakes, and build your diagnosis."
              action={<button className="btn primary" onClick={() => setTab('dashboard')}>Go to Dashboard</button>}
            />
          </div>
        ) : (
          <main className="page" key={tab}>
            {tab === 'dashboard' && <DashboardView />}
            {tab === 'diagnoses' && <DiagnosesView />}
            {tab === 'report' && <ReportView />}
            {tab === 'puzzles' && <PuzzlesView />}
            {tab === 'games' && <GamesView />}
            {tab === 'training' && <TrainingView />}
          </main>
        )}

        {settingsOpen && <SettingsModal />}
      </div>
    </StoreContext.Provider>
  );
}

