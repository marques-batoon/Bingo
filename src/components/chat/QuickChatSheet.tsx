import Sheet from '../Sheet';
import { QUICK_CHAT, type ChatPlace } from '../../config/quickChat';

/** Pick a greeting to send to everyone. */
export default function QuickChatSheet(props: { place: ChatPlace; onSend: (index: number) => void; onClose: () => void }) {
  const { place, onSend, onClose } = props;
  return (
    <Sheet title="Quick chat" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2 overflow-y-auto px-5 pb-2">
        {QUICK_CHAT[place].map((text, i) => (
          <button
            key={i}
            onClick={() => onSend(i)}
            className="min-h-14 rounded-2xl bg-ink-800 px-3 py-2 text-left text-[15px] leading-snug font-semibold ring-1 ring-white/10 active:scale-[0.97] active:bg-ink-700"
          >
            {text}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
