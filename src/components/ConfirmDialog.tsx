import { motion } from 'framer-motion';
import Button from './Button';

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Centered yes/no dialog. Wrap in <AnimatePresence>. */
export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-6">
      <motion.button
        aria-label="Cancel"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      />
      <motion.div
        role="alertdialog"
        aria-label={title}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 500, damping: 34 }}
        className="relative w-full max-w-xs rounded-[var(--radius-card)] bg-ink-900 p-5 text-center shadow-[var(--shadow-lift)] ring-1 ring-white/10"
      >
        <h2 className="font-display text-xl font-extrabold">{title}</h2>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </motion.div>
    </div>
  );
}
