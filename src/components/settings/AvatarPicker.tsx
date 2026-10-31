import { useState } from 'react';
import Avatar from '../Avatar';
import Sheet from '../Sheet';
import { AVATAR_CATEGORIES, avatarKey, avatarsIn, findAvatar } from '../../lib/avatars';

interface Props {
  name: string;
  /** Player ID, so the initials placeholder matches the one in the lobby. */
  seed: string;
  value: string;
  onChange: (avatarId: string) => void;
  onClose: () => void;
}

export default function AvatarPicker({ name, seed, value, onChange, onClose }: Props) {
  const [tab, setTab] = useState(() => findAvatar(value)?.category ?? AVATAR_CATEGORIES[0].id);

  return (
    <Sheet title="Choose your avatar" onClose={onClose}>
      <div role="tablist" className="flex gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none]">
        {AVATAR_CATEGORIES.map(c => (
          <button
            key={c.id}
            role="tab"
            aria-selected={tab === c.id}
            onClick={() => setTab(c.id)}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition ${
              tab === c.id ? 'bg-fg text-ink-950' : 'bg-ink-800 text-muted ring-1 ring-white/10'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-x-1 gap-y-3 overflow-y-auto px-4 pt-1 pb-2">
        {avatarsIn(tab).map(a => {
          const key = avatarKey(a);
          const selected = key === value;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              aria-pressed={selected}
              aria-label={a.name}
              className="flex min-w-0 flex-col items-center gap-1 rounded-2xl py-1 active:bg-white/5"
            >
              <span className={`rounded-full p-[3px] transition ${selected ? 'bg-gold' : 'bg-transparent'}`}>
                <Avatar name={a.name} avatarId={key} size={54} />
              </span>
              <span className={`w-full truncate px-0.5 text-center text-[11px] leading-tight ${selected ? 'font-bold text-fg' : 'text-muted'}`}>
                {a.name}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-3 px-5 pt-3">
        <button
          onClick={() => onChange('')}
          className={`flex min-h-11 items-center gap-2 rounded-full pr-4 pl-1 text-sm font-semibold ${value ? 'text-muted' : 'text-fg'}`}
        >
          <Avatar name={name} seed={seed} size={36} />
          Use my initials
        </button>
        <button onClick={onClose} className="min-h-11 rounded-full bg-fg px-6 font-display font-bold text-ink-950">
          Done
        </button>
      </div>
    </Sheet>
  );
}
