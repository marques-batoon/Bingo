import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import credits from '../data/avatarCredits.json';

/** Photo credits for the avatar pictures of real people (required by their Creative Commons licenses). */
export default function Credits() {
  return (
    <main className="page mx-auto flex w-full max-w-md flex-col gap-4">
      <header className="flex items-center justify-between">
        <Link to="/" className="-ml-2 flex min-h-11 items-center gap-1 rounded-xl px-2 font-display text-[15px] font-bold text-muted active:text-fg">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Home
        </Link>
        <span className="font-display text-sm font-bold tracking-[0.3em] text-faint">CREDITS</span>
        <span className="w-[76px]" />
      </header>

      <section className="rounded-[var(--radius-card)] bg-ink-900/80 p-4 ring-1 ring-white/[0.07]">
        <h1 className="font-display text-2xl font-extrabold">Photo credits</h1>
        <p className="mt-2 text-sm text-muted">
          Avatar photos of real people are from Wikimedia Commons, cropped and resized for this app, and shared under
          the license shown for each. Disney and Pokémon characters are trademarks of their owners; their avatars show
          initials only.
        </p>
      </section>

      <ul className="flex flex-col gap-1 rounded-[var(--radius-card)] bg-ink-900/80 p-2 ring-1 ring-white/[0.07]">
        {credits.map(c => (
          <li key={c.avatar} className="flex items-center gap-3 rounded-2xl px-2 py-2">
            <Avatar name={c.name} avatarId={c.avatar} size={44} />
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-semibold">{c.name}</p>
              <p className="truncate text-xs text-muted">Photo: {c.author}</p>
              <p className="text-xs">
                {c.licenseUrl ? (
                  <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer" className="text-sky underline-offset-2 active:underline">
                    {c.license}
                  </a>
                ) : (
                  <span className="text-muted">{c.license}</span>
                )}
                <span className="text-faint"> · </span>
                <a href={c.source} target="_blank" rel="noopener noreferrer" className="text-sky underline-offset-2 active:underline">
                  Source
                </a>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
