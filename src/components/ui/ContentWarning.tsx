import { useState } from 'react';

interface ContentWarningProps {
  warning: string;
}

export function ContentWarning({ warning }: ContentWarningProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded bg-[rgba(220,38,38,0.08)] border border-[rgba(220,38,38,0.2)] text-xs">
      <span className="text-[var(--accent-red)] mt-0.5 shrink-0">&#9888;</span>
      <span className="text-[var(--text-secondary)] flex-1">{warning}</span>
      <button
        onClick={() => setDismissed(true)}
        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M8 2L2 8M2 2L8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
