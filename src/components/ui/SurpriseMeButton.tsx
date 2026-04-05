/**
 * Bottom-of-panel "Surprise Me" button — keeps the rabbit hole going.
 * Drop this at the end of any scrollable panel content (before bottom padding).
 */
export function SurpriseMeButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="px-4 pt-8 pb-4 flex justify-center">
      <button
        onClick={onClick}
        className="w-[65%] rounded-xl border border-[var(--accent-gold)] hover:bg-[var(--accent-gold-dim)] transition-all duration-200 active:scale-[0.98] py-3 px-4 text-center group"
      >
        <div className="text-sm font-serif font-bold text-[var(--accent-gold)]">
          Surprise Me
        </div>
        <p className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
          Discover a random event
        </p>
      </button>
    </div>
  );
}
