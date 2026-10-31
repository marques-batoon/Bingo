import Sheet from '../Sheet';
import { BALL_STYLES } from '../../lib/balls';
import { LETTERS } from '../../lib/cards';

/** 75-number board with called numbers lit up. */
export default function HistorySheet({ called, onClose }: { called: number[]; onClose: () => void }) {
  const set = new Set(called);
  const last = called[called.length - 1];
  return (
    <Sheet title={`Called numbers · ${called.length}/75`} onClose={onClose}>
      <div className="overflow-y-auto px-4 pb-2">
        <div className="grid grid-cols-[22px_repeat(15,minmax(0,1fr))] gap-[2px]">
          {LETTERS.map((letter, row) => (
            <div key={letter} className="contents">
              <div
                className="grid aspect-square place-items-center self-center rounded-full font-display text-xs font-black text-ink-950"
                style={{ background: BALL_STYLES[letter].to }}
              >
                {letter}
              </div>
              {Array.from({ length: 15 }, (_, i) => {
                const n = row * 15 + i + 1;
                const on = set.has(n);
                return (
                  <div
                    key={n}
                    className={`grid aspect-square place-items-center rounded-[5px] text-[clamp(9px,2.6vw,13px)] font-bold tabular-nums ${
                      on ? 'text-ink-950' : 'bg-white/5 text-faint'
                    } ${n === last ? 'ring-2 ring-white' : ''}`}
                    style={on ? { background: BALL_STYLES[letter].from } : undefined}
                  >
                    {n}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {called.length > 0 && (
          <p className="mt-4 text-xs text-muted">
            Last 5: <span className="font-semibold text-fg">{called.slice(-5).reverse().join(' · ')}</span>
          </p>
        )}
      </div>
    </Sheet>
  );
}
