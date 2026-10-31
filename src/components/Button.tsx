import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-gold to-amber text-ink-950 shadow-[var(--shadow-glow-gold)] active:brightness-95 disabled:from-ink-700 disabled:to-ink-700 disabled:text-faint disabled:shadow-none',
  secondary: 'bg-ink-800 text-fg ring-1 ring-inset ring-white/10 active:bg-ink-700 disabled:text-faint',
  ghost: 'text-muted active:text-fg disabled:text-faint',
};

export default function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 font-display text-[17px] font-bold tracking-wide transition active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
    />
  );
}
