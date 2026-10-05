// Chessground board (Lichess open-source board UI) wrapped for React.
// The wrapper owns one Api instance per mount and pushes prop diffs into it.

import { createElement, useEffect, useRef } from 'react';
import { Chessground } from 'chessground';
import type { Api } from 'chessground/api';
import type { Config } from 'chessground/config';
import type { DrawShape } from 'chessground/draw';
import type { Key } from 'chessground/types';
import type { Color } from '../core/types';

export interface BoardProps {
  fen: string;
  orientation?: Color;
  lastMove?: [string, string] | null;
  check?: boolean;
  /** Legal destinations for the side to move; empty map or null = view-only. */
  dests?: Map<string, string[]> | null;
  onMove?: (from: string, to: string) => void;
  shapes?: { orig: string; dest?: string; brush?: string }[];
  coordinates?: boolean;
  className?: string;
}

const FILE_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANK_LABELS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function turnColorOf(fen: string): Color {
  return (fen.split(' ')[1] ?? 'w') === 'w' ? 'white' : 'black';
}

export default function Board({
  fen,
  orientation = 'white',
  lastMove,
  check = false,
  dests = null,
  onMove,
  shapes,
  coordinates = true,
  className = '',
}: BoardProps) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const outerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<Api | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  // Mount once: create the board (coords are React-rendered outside the wrap).
  useEffect(() => {
    const el = elRef.current;
    if (!el || apiRef.current) return;
    const config: Config = {
      fen,
      orientation,
      turnColor: turnColorOf(fen),
      check,
      lastMove: (lastMove ?? undefined) as unknown as Key[] | undefined,
      highlight: { lastMove: true, check: true },
      coordinates: false, // rendered by our own coord elements
      animation: { enabled: true, duration: 180 },
      movable: { free: false, showDests: true },
      premovable: { enabled: false },
      drawable: { enabled: true, visible: true },
    };
    apiRef.current = Chessground(el, config);
    return () => {
      apiRef.current?.destroy();
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Position / orientation / highlight updates.
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    api.set({
      fen,
      orientation,
      turnColor: turnColorOf(fen),
      check: check || undefined,
      lastMove: (lastMove ?? undefined) as unknown as Key[] | undefined,
    });
  }, [fen, orientation, lastMove, check]);

  // Movable state (interactive boards get dests; view-only boards get none).
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const interactive = Boolean(dests && dests.size > 0);
    const destsCG = new Map(dests ?? []) as unknown as NonNullable<Config['movable']>['dests'];
    api.set({
      movable: {
        free: false,
        color: interactive ? turnColorOf(fen) : undefined,
        dests: destsCG,
        showDests: true,
        events: {
          after: (orig: string, dest: string) => {
            onMoveRef.current?.(orig, dest);
          },
        },
      },
    });
  }, [dests, fen]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    api.setShapes((shapes ?? []) as unknown as DrawShape[]);
  }, [shapes]);

  const fileLabels = orientation === 'white' ? FILE_LABELS : [...FILE_LABELS].reverse();
  const rankLabels = orientation === 'white' ? RANK_LABELS : [...RANK_LABELS].reverse();

  return (
    <div ref={outerRef} className={`cd-board-outer${coordinates ? ' with-coords' : ''} ${className}`}>
      <div ref={elRef} className="cd-board cg-wrap" data-fen={fen} />
      {coordinates && (
        <>
          {createElement('coords', { className: 'ranks' },
            rankLabels.map((r) => createElement('coord', { key: r }, r)))}
          {createElement('coords', { className: 'files' },
            fileLabels.map((f) => createElement('coord', { key: f }, f)))}
        </>
      )}
    </div>
  );
}
