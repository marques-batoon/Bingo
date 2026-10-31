import Marker from '../Marker';
import { MARKER_COLORS } from '../../lib/markers';

const PREVIEW = [7, 22, 0, 41, 68]; // 0 = FREE
const MARKED = new Set([7, 0, 68]);

/**
 * 12 marker swatches on card paper (markers are semi-transparent, so they're shown
 * the way they'll look on a card) with a live preview row above.
 */
export default function MarkerPalette({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="rounded-2xl bg-[#fffdf8] p-2.5">
      <div className="grid grid-cols-5 gap-1.5" aria-label="Preview">
        {PREVIEW.map(n => (
          <div
            key={n}
            className="relative grid aspect-square place-items-center rounded-lg bg-[#f1eee6] font-display text-xl font-extrabold text-[#1d1a2b]"
          >
            {n === 0 ? <span className="text-[10px] font-black tracking-wider text-[#8a8597]">FREE</span> : n}
            {MARKED.has(n) && <Marker color={value} className="absolute inset-[3px]" />}
          </div>
        ))}
      </div>
      <div role="radiogroup" aria-label="Marker color" className="mt-2 grid grid-cols-6 gap-1">
        {MARKER_COLORS.map(c => {
          const active = c.id === value;
          return (
            <button
              key={c.id}
              role="radio"
              aria-checked={active}
              aria-label={c.name}
              onClick={() => onChange(c.id)}
              className="grid min-h-11 place-items-center rounded-xl active:bg-black/5"
            >
              <span
                className={`relative block size-9 rounded-full transition ${
                  active ? 'scale-110 ring-[2.5px] ring-[#1d1a2b] ring-offset-2 ring-offset-[#fffdf8]' : ''
                }`}
              >
                <Marker color={c.id} className="absolute inset-0" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
