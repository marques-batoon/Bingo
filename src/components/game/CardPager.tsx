import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';
import { CARD_GAP, fitCards, paginate } from '../../lib/cardLayout';

interface Props<T> {
  items: T[];
  /** 0 = everything on one page. */
  perPage: number;
  renderItem: (item: T) => ReactNode;
  itemKey: (item: T) => string | number;
  /** Beginner mode: pages holding a glowing square get a glowing dot. */
  pageHasAlert?: (items: T[]) => boolean;
}

/** Cards laid out to fill the space, split into swipeable pages with dots. */
export default function CardPager<T>({ items, perPage, renderItem, itemKey, pageHasAlert }: Props<T>) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [page, setPage] = useState(0);
  const x = useMotionValue(0);

  const pages = paginate(items, perPage);
  const current = Math.min(page, Math.max(0, pages.length - 1));

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Slide on page change; jump on resize (rotating the phone shouldn't animate across pages).
  const lastW = useRef(size.w);
  useEffect(() => {
    if (lastW.current !== size.w) {
      lastW.current = size.w;
      x.set(-current * size.w);
      return;
    }
    const controls = animate(x, -current * size.w, { type: 'spring', stiffness: 380, damping: 40 });
    return () => controls.stop();
  }, [current, size.w, x]);

  const goTo = (p: number) => {
    const next = Math.max(0, Math.min(pages.length - 1, p));
    setPage(next);
    if (next === current) animate(x, -current * size.w, { type: 'spring', stiffness: 380, damping: 40 });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={box} className="relative min-h-0 flex-1 overflow-hidden">
        {size.w > 0 && (
          <motion.div
            className="flex h-full"
            style={{ x, width: size.w * pages.length }}
            drag={pages.length > 1 ? 'x' : false}
            dragConstraints={{ left: -(pages.length - 1) * size.w, right: 0 }}
            dragElastic={0.12}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              const swipe = info.offset.x + info.velocity.x * 0.2;
              if (swipe < -size.w / 5) goTo(current + 1);
              else if (swipe > size.w / 5) goTo(current - 1);
              else goTo(current);
            }}
          >
            {pages.map((pageItems, i) => {
              const { cols, cardW } = fitCards(pageItems.length, size.w, size.h);
              return (
                <div key={i} className="grid h-full shrink-0 place-content-center" style={{ width: size.w }}>
                  <div className="grid justify-center" style={{ gridTemplateColumns: `repeat(${cols}, ${cardW}px)`, gap: CARD_GAP }}>
                    {pageItems.map(item => (
                      <div key={itemKey(item)} style={{ width: cardW }}>
                        {renderItem(item)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      {pages.length > 1 && (
        <div className="flex justify-center" role="tablist" aria-label="Card pages">
          {pages.map((pageItems, i) => {
            const alert = pageHasAlert?.(pageItems);
            return (
              <button
                key={i}
                role="tab"
                aria-selected={i === current}
                aria-label={`Page ${i + 1}${alert ? ', has numbers to mark' : ''}`}
                onClick={() => goTo(i)}
                className="grid size-11 place-items-center"
              >
                <span
                  className={`block rounded-full transition-all ${i === current ? 'h-2.5 w-6' : 'size-2.5'} ${
                    alert ? 'dot-glow bg-gold' : i === current ? 'bg-fg' : 'bg-white/25'
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
