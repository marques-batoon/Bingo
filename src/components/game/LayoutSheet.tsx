import Sheet from '../Sheet';

interface Props {
  cardCount: number;
  perPage: number;
  onChange: (perPage: number) => void;
  onClose: () => void;
}

/** All cards on one page, one per page, or a custom number per page. */
export default function LayoutSheet({ cardCount, perPage, onChange, onClose }: Props) {
  const custom = perPage > 1 && perPage < cardCount;
  const customValue = custom ? perPage : Math.min(2, Math.max(1, cardCount - 1));
  const option = (active: boolean, label: string, hint: string, onClick: () => void) => (
    <button
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-left ring-1 transition ${
        active ? 'bg-white/10 ring-gold' : 'bg-ink-800 ring-white/10'
      }`}
    >
      <span className={`grid size-5 place-items-center rounded-full ring-2 ${active ? 'ring-gold' : 'ring-white/30'}`}>
        {active && <span className="size-2.5 rounded-full bg-gold" />}
      </span>
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </button>
  );

  return (
    <Sheet title="Card layout" onClose={onClose}>
      <div role="radiogroup" className="flex flex-col gap-2 px-5 pb-2">
        {option(perPage === 0 || perPage >= cardCount, 'Show all cards', `All ${cardCount} on one screen`, () => onChange(0))}
        {cardCount > 1 && option(perPage === 1, 'One per page', 'Biggest cards. Swipe between them.', () => onChange(1))}
        {cardCount > 2 && (
          <div className={`rounded-2xl ring-1 ${custom ? 'bg-white/10 ring-gold' : 'bg-ink-800 ring-white/10'}`}>
            {option(custom, 'Custom', `${customValue} cards per page`, () => onChange(customValue))}
            {custom && (
              <div className="flex items-center justify-center gap-4 pb-3">
                <button
                  aria-label="Fewer per page"
                  disabled={perPage <= 2}
                  onClick={() => onChange(perPage - 1)}
                  className="grid size-11 place-items-center rounded-xl bg-ink-800 text-2xl font-bold disabled:text-faint"
                >
                  −
                </button>
                <span className="w-16 text-center font-display text-2xl font-black tabular-nums">{perPage}</span>
                <button
                  aria-label="More per page"
                  disabled={perPage >= cardCount - 1}
                  onClick={() => onChange(perPage + 1)}
                  className="grid size-11 place-items-center rounded-xl bg-ink-800 text-2xl font-bold disabled:text-faint"
                >
                  +
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
