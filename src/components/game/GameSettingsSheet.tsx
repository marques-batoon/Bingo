import Sheet from '../Sheet';
import MarkerPalette from '../settings/MarkerPalette';
import ModeToggle from '../settings/ModeToggle';
import type { PlayMode } from '../../lib/types';

interface Props {
  color: string;
  mode: PlayMode;
  showBall: boolean;
  onColor: (c: string) => void;
  onMode: (m: PlayMode) => void;
  onShowBall: (show: boolean) => void;
  onClose: () => void;
}

export default function GameSettingsSheet(props: Props) {
  const { color, mode, showBall, onColor, onMode, onShowBall, onClose } = props;
  return (
    <Sheet title="Settings" onClose={onClose}>
      <div className="overflow-y-auto px-5 pb-2">
        <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">Marker color</h3>
        <MarkerPalette value={color} onChange={onColor} />
        <h3 className="mt-5 mb-2 text-xs font-semibold tracking-wider text-muted uppercase">Mode</h3>
        <ModeToggle value={mode} onChange={onMode} />
        <label className="mt-5 flex min-h-12 items-center justify-between gap-3">
          <span>
            <span className="block font-semibold">Show current number</span>
            <span className="block text-xs text-muted">The ball at the top of the screen</span>
          </span>
          <Switch checked={showBall} onChange={onShowBall} />
        </label>
        <p className="mt-4 text-xs text-faint">Your name, avatar and cards are locked until the game ends.</p>
      </div>
    </Sheet>
  );
}

export function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-13 shrink-0 rounded-full transition ${checked ? 'bg-mint' : 'bg-ink-600'}`}
    >
      <span className={`absolute top-1 left-1 size-6 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}
