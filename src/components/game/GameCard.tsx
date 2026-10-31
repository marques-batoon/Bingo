import { useRef, useState, type PointerEvent } from 'react';
import BingoCardView from '../BingoCardView';
import Marker from '../Marker';
import { FREE, type BingoCard } from '../../lib/cards';
import { cellKey, clampOffset } from '../../lib/game';
import type { CardMarks, MarkPos } from '../../lib/types';

/** Marker diameter as a share of its square; with MARK_MAX_OFFSET it always stays inside. */
const MARKER_SIZE = 0.72;

interface Props {
  card: BingoCard;
  marks: CardMarks | undefined;
  color: string;
  /** Numbers this player has seen called. */
  revealed: Set<number>;
  beginner: boolean;
  onMark: (cell: number) => void;
  onMove: (cell: number, pos: MarkPos) => void;
}

export default function GameCard({ card, marks, color, revealed, beginner, onMark, onMove }: Props) {
  const [shaking, setShaking] = useState<number | null>(null);
  const shakeTimer = useRef<number | undefined>(undefined);

  function onCellTap(n: number, row: number, col: number) {
    const cell = row * 5 + col;
    if (marks?.[cellKey(cell)]) return; // Already marked: markers are never removed.
    if (n === FREE || revealed.has(n)) {
      onMark(cell);
      return;
    }
    setShaking(cell);
    window.clearTimeout(shakeTimer.current);
    shakeTimer.current = window.setTimeout(() => setShaking(null), 380);
    navigator.vibrate?.(30);
  }

  return (
    <BingoCardView
      card={card}
      onCellTap={onCellTap}
      cellClassName={(n, row, col) => {
        const cell = row * 5 + col;
        if (shaking === cell) return 'cell-shake';
        if (beginner && n !== FREE && revealed.has(n) && !marks?.[cellKey(cell)]) return 'cell-glow';
        return '';
      }}
      renderCellOverlay={(_n, row, col) => {
        const cell = row * 5 + col;
        const pos = marks?.[cellKey(cell)];
        return pos ? <DraggableMarker pos={pos} color={color} onCommit={p => onMove(cell, p)} /> : null;
      }}
    />
  );
}

/** A placed marker. Drag nudges it within its own square only. */
function DraggableMarker({ pos, color, onCommit }: { pos: MarkPos; color: string; onCommit: (pos: MarkPos) => void }) {
  const [drag, setDrag] = useState<MarkPos | null>(null);
  const start = useRef<{ px: number; py: number; size: number; x: number; y: number } | null>(null);
  const shown = drag ?? pos;

  function onPointerDown(e: PointerEvent<HTMLSpanElement>) {
    e.stopPropagation(); // Don't swipe the card pages.
    e.currentTarget.setPointerCapture(e.pointerId);
    const size = e.currentTarget.parentElement?.getBoundingClientRect().width ?? 1;
    start.current = { px: e.clientX, py: e.clientY, size, x: pos.x, y: pos.y };
  }

  function onPointerMove(e: PointerEvent<HTMLSpanElement>) {
    const s = start.current;
    if (!s) return;
    setDrag({ x: clampOffset(s.x + (e.clientX - s.px) / s.size), y: clampOffset(s.y + (e.clientY - s.py) / s.size) });
  }

  function onPointerUp() {
    if (drag && (drag.x !== pos.x || drag.y !== pos.y)) onCommit(drag);
    start.current = null;
    setDrag(null);
  }

  const inset = `${((1 - MARKER_SIZE) / 2) * 100}%`;
  return (
    <span
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="absolute touch-none"
      style={{
        inset,
        // Translate is relative to the marker's own size; offsets are fractions of the square.
        transform: `translate(${(shown.x / MARKER_SIZE) * 100}%, ${(shown.y / MARKER_SIZE) * 100}%) scale(${drag ? 1.08 : 1})`,
        transition: drag ? 'none' : 'transform 120ms ease-out',
      }}
    >
      <Marker color={color} className="size-full" />
    </span>
  );
}
