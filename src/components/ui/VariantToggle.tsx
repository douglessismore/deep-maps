import { useUIVariant, type UIVariant } from '../../lib/uiVariant';

const VARIANTS: UIVariant[] = ['current', 'spotlight', 'split', 'claude', 'cinema'];
const LABELS: Record<UIVariant, string> = {
  current: 'A: Current',
  spotlight: 'B: Spotlight',
  split: 'C: Split',
  claude: 'D: Claude',
  cinema: 'E: Cinema',
};

export function VariantToggle() {
  const { variant, setVariant } = useUIVariant();

  const cycle = () => {
    const idx = VARIANTS.indexOf(variant);
    setVariant(VARIANTS[(idx + 1) % VARIANTS.length]);
  };

  return (
    <button
      onClick={cycle}
      className="lg:hidden fixed top-2 right-2 z-[100] px-2.5 py-1 rounded-full text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-primary)]/80 backdrop-blur-sm border border-[var(--border-subtle)] active:bg-[var(--bg-primary)] transition-colors select-none"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {LABELS[variant]}
    </button>
  );
}
