import { motion } from 'framer-motion';

const BALLS = [
  { letter: 'B', from: '#4cc3ff', to: '#2f7bff' },
  { letter: 'I', from: '#ff5d73', to: '#d8335a' },
  { letter: 'N', from: '#f4f2ff', to: '#b9b3dd' },
  { letter: 'G', from: '#3ee0a8', to: '#13a874' },
  { letter: 'O', from: '#ffc94a', to: '#ff8a3d' },
];

export default function BingoBalls({ size = 52 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden>
      {BALLS.map((b, i) => (
        <motion.div
          key={b.letter}
          initial={{ y: -24, opacity: 0, rotate: -40 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.08 * i }}
          className="relative grid place-items-center rounded-full"
          style={{
            width: size,
            height: size,
            background: `radial-gradient(circle at 32% 28%, ${b.from}, ${b.to} 70%)`,
            boxShadow: `0 10px 22px -10px ${b.to}, inset 0 -4px 8px rgb(0 0 0 / 0.2)`,
          }}
        >
          <div
            className="grid place-items-center rounded-full bg-white font-display font-black text-ink-950"
            style={{ width: size * 0.58, height: size * 0.58, fontSize: size * 0.34 }}
          >
            {b.letter}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
