import type { ReactNode } from 'react';
import { FREE, LETTERS, cardLabel, cellAt, type BingoCard } from '../lib/cards';

interface Props {
  card: BingoCard;
  className?: string;
  /** Extra content drawn inside a square (markers, glow) — used by the game screen. */
  renderCellOverlay?: (n: number, row: number, col: number) => ReactNode;
  onCellTap?: (n: number, row: number, col: number) => void;
  /** Extra classes per square (glow, shake). */
  cellClassName?: (n: number, row: number, col: number) => string;
}

/**
 * One Bingo card. Sizes itself to its container's width (container query units),
 * so the same component works as a big preview, a game card, or a thumbnail.
 */
export default function BingoCardView({ card, className = '', renderCellOverlay, onCellTap, cellClassName }: Props) {
  const { bg, text } = card.color;
  // Plain squares when the card isn't interactive (previews, thumbnails inside buttons).
  const Cell = onCellTap ? 'button' : 'div';
  return (
    <div className={`w-full [container-type:inline-size] ${className}`}>
      <div
        className="overflow-hidden rounded-[4cqw] bg-[#fffdf8] shadow-[var(--shadow-lift)] ring-1 ring-black/10"
      >
        <div className="px-[2.5cqw] pt-[2.2cqw] pb-[1.6cqw]" style={{ background: bg, color: text }}>
          <div className="grid grid-cols-5 text-center font-display text-[13cqw] leading-none font-black">
            {LETTERS.map(l => (
              <span key={l} className="drop-shadow-[0_0.4cqw_0_rgb(0_0_0/0.18)]">{l}</span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-[1.2cqw] p-[2.2cqw]">
          {Array.from({ length: 25 }, (_, i) => {
            const row = Math.floor(i / 5);
            const col = i % 5;
            const n = cellAt(card, row, col);
            const free = n === FREE;
            return (
              <Cell
                key={i}
                {...(onCellTap ? { type: 'button' as const, onClick: () => onCellTap(n, row, col) } : {})}
                aria-label={free ? 'Free space' : String(n)}
                className={`relative grid aspect-square place-items-center rounded-[2cqw] bg-[#f1eee6] font-display text-[8.5cqw] leading-none font-extrabold text-[#1d1a2b] tabular-nums ${cellClassName?.(n, row, col) ?? ''}`}
              >
                {free ? (
                  <span className="flex flex-col items-center" style={{ color: bg }}>
                    <svg viewBox="0 0 24 24" className="size-[7cqw] fill-current" aria-hidden>
                      <path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z" />
                    </svg>
                    <span className="mt-[0.4cqw] text-[2.8cqw] font-black tracking-wider">FREE</span>
                  </span>
                ) : (
                  n
                )}
                {renderCellOverlay?.(n, row, col)}
              </Cell>
            );
          })}
        </div>
        <p className="-mt-[1cqw] pr-[3cqw] pb-[1.6cqw] text-right font-sans text-[2.8cqw] font-semibold text-[#8a8597] tabular-nums">
          {card.color.name} {cardLabel(card.id)}
        </p>
      </div>
    </div>
  );
}
