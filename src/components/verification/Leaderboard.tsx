import { useState, useEffect } from 'react';
import { fetchTopContributors, fetchTopVerifiers, type LeaderboardEntry } from '../../lib/verification';

type Tab = 'contributors' | 'verifiers';

export function Leaderboard() {
  const [tab, setTab] = useState<Tab>('contributors');
  const [contributors, setContributors] = useState<LeaderboardEntry[]>([]);
  const [verifiers, setVerifiers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchTopContributors(), fetchTopVerifiers()]).then(([c, v]) => {
      setContributors(c);
      setVerifiers(v);
      setLoading(false);
    });
  }, []);

  const entries = tab === 'contributors' ? contributors : verifiers;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-[var(--text-primary)]">Community Leaderboard</h3>

      {/* Tab toggle */}
      <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-full p-0.5">
        {(['contributors', 'verifiers'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-full text-[11px] font-medium transition-all ${
              tab === t
                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {t === 'contributors' ? 'Top Contributors' : 'Top Verifiers'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-6 text-center">
          <span className="text-[10px] text-[var(--text-muted)] font-mono">Loading...</span>
        </div>
      ) : entries.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            {tab === 'contributors'
              ? 'No verified suggestions yet. Be the first!'
              : 'No verifications yet. Start verifying locations!'}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map(({ profile, rank }) => (
            <div
              key={profile.id}
              className="flex items-center gap-3 py-2 px-3 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              {/* Rank */}
              <span className={`text-sm font-bold w-6 text-center ${
                rank <= 3 ? 'text-[#D4A853]' : 'text-[var(--text-muted)]'
              }`}>
                {rank}
              </span>

              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-[#e74c3c] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {profile.displayName.slice(0, 2).toUpperCase()}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-[var(--text-primary)] truncate block">
                  {profile.displayName}
                </span>
              </div>

              {/* Count */}
              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {tab === 'contributors' ? profile.totalSuggestions : profile.totalVerifications}
                </span>
                <span className="text-[9px] text-[var(--text-muted)] block font-mono">
                  {tab === 'contributors' ? 'verified' : 'verifications'}
                </span>
              </div>

              {/* Accuracy breakdown for contributors */}
              {tab === 'contributors' && (profile.pinpointCount > 0 || profile.exactCount > 0) && (
                <div className="flex gap-1 shrink-0">
                  {profile.pinpointCount > 0 && (
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#10b981]/10 text-[#10b981]">
                      {profile.pinpointCount} pin
                    </span>
                  )}
                  {profile.exactCount > 0 && (
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#22c55e]/10 text-[#22c55e]">
                      {profile.exactCount} exact
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
