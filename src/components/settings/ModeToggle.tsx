import type { PlayMode } from '../../lib/types';

const MODES: { id: PlayMode; label: string; hint: string }[] = [
  { id: 'beginner', label: 'Beginner', hint: 'Called numbers glow until you mark them.' },
  { id: 'pro', label: 'Pro', hint: 'No glow. Find the numbers yourself.' },
];

export default function ModeToggle({ value, onChange }: { value: PlayMode; onChange: (mode: PlayMode) => void }) {
  return (
    <div>
      <div role="radiogroup" aria-label="Mode" className="grid grid-cols-2 gap-1 rounded-2xl bg-ink-800 p-1 ring-1 ring-white/10">
        {MODES.map(m => {
          const active = m.id === value;
          return (
            <button
              key={m.id}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(m.id)}
              className={`min-h-11 rounded-xl font-display text-[15px] font-bold transition ${
                active ? 'bg-fg text-ink-950 shadow' : 'text-muted'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">{MODES.find(m => m.id === value)?.hint}</p>
    </div>
  );
}
