import { useState, useEffect, useCallback } from 'react';
import type { LocationSuggestion, LocationAccuracy, Moment } from '../../types';
import { useAuth } from '../../lib/auth';
import { fetchSuggestionsForMoment, castVote, addComment, checkPinpointLocked } from '../../lib/verification';
import { LoginModal } from '../auth/LoginModal';
import { PinEditor } from '../ui/PinEditor';

const ACCURACY_COLORS: Record<LocationAccuracy, string> = {
  pinpoint: '#10b981',
  exact: '#22c55e',
  approximate: '#eab308',
  'general-area': '#f97316',
};

const STATUS_DISPLAY = {
  pending: { label: 'Needs Verification', color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
  verified: { label: 'Verified', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  superseded: { label: 'Superseded', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
} as const;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface VerificationThreadProps {
  moment: Moment;
}

export function VerificationThread({ moment }: VerificationThreadProps) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinpointLocked, setPinpointLocked] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refiningSuggestion, setRefiningSuggestion] = useState<string | undefined>();
  const [votingId, setVotingId] = useState<string | null>(null);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    const [data, locked] = await Promise.all([
      fetchSuggestionsForMoment(moment.id),
      checkPinpointLocked(moment.id),
    ]);
    setSuggestions(data);
    setPinpointLocked(locked);
    setLoading(false);
  }, [moment.id]);

  useEffect(() => { loadSuggestions(); }, [loadSuggestions]);

  const requireAuth = (action: () => void) => {
    if (!user) { setShowLogin(true); return; }
    action();
  };

  const handleSuggest = () => requireAuth(() => {
    setRefiningSuggestion(undefined);
    setShowForm(true);
  });

  const handleRefine = (parentId: string) => requireAuth(() => {
    setRefiningSuggestion(parentId);
    setShowForm(true);
  });

  const handleVote = async (suggestionId: string, voteType: 'agree' | 'disagree') => {
    if (!user) { setShowLogin(true); return; }
    setVotingId(suggestionId);
    await castVote(suggestionId, voteType);
    await loadSuggestions();
    setVotingId(null);
  };

  const handleComment = async (suggestionId: string) => {
    if (!commentText.trim()) return;
    setCommentSubmitting(true);
    await addComment(suggestionId, commentText.trim());
    setCommentText('');
    setCommentSubmitting(false);
    setCommentingId(null);
    await loadSuggestions();
  };

  // ── Empty / loading state ──
  if (loading || suggestions.length === 0) {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        {pinpointLocked ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="3" y="5" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1"/>
              <path d="M4.5 5V3.5a1.5 1.5 0 013 0V5" stroke="currentColor" strokeWidth="1"/>
            </svg>
            Pinpoint verified
          </span>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); handleSuggest(); }}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" strokeDasharray="2.5 2"/>
              <path d="M6 4v4M4 6h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            Suggest a more accurate location
          </button>
        )}
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} action="suggest a location" />}
        {showForm && (
          <PinEditor
            momentId={moment.id} momentName={moment.name}
            lat={moment.lat} lng={moment.lng}
            accuracy={moment.accuracy} geoSourceUrl={moment.geoSourceUrl}
            mode="suggest" parentSuggestionId={refiningSuggestion}
            onClose={() => setShowForm(false)}
            onSaved={() => { setShowForm(false); loadSuggestions(); }}
          />
        )}
      </div>
    );
  }

  // ── Thread with suggestions ──
  const sorted = [
    ...suggestions.filter(s => s.status === 'verified'),
    ...suggestions.filter(s => s.status === 'pending'),
    ...suggestions.filter(s => s.status !== 'verified' && s.status !== 'pending'),
  ];

  return (
    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1.5">
          {pinpointLocked ? (
            <>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="2.5" y="4" width="5" height="4" rx="0.8" stroke="#10b981" strokeWidth="0.8"/>
                <path d="M3.5 4V3a1.5 1.5 0 013 0v1" stroke="#10b981" strokeWidth="0.8"/>
              </svg>
              <span className="text-green-400">Pinpoint verified</span>
            </>
          ) : (
            <>
              {suggestions.length} {suggestions.length === 1 ? 'suggestion' : 'suggestions'}
            </>
          )}
        </span>
        {!pinpointLocked && (
          <button
            onClick={handleSuggest}
            className="text-[10px] font-mono text-[#e74c3c] hover:text-[#c0392b] transition-colors"
          >
            + Suggest
          </button>
        )}
      </div>

      {/* Suggestion cards */}
      {sorted.map((s) => (
        <SuggestionCard
          key={s.id}
          suggestion={s}
          currentLat={moment.lat}
          currentLng={moment.lng}
          userId={user?.id}
          votingId={votingId}
          commentingId={commentingId}
          commentText={commentText}
          commentSubmitting={commentSubmitting}
          pinpointLocked={pinpointLocked}
          onVote={handleVote}
          onRefine={handleRefine}
          onToggleComment={setCommentingId}
          onCommentChange={setCommentText}
          onCommentSubmit={handleComment}
        />
      ))}

      {/* Modals */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} action="suggest a location" />}
      {showForm && (
        <PinEditor
          momentId={moment.id} momentName={moment.name}
          lat={moment.lat} lng={moment.lng}
          accuracy={moment.accuracy} geoSourceUrl={moment.geoSourceUrl}
          mode="suggest" parentSuggestionId={refiningSuggestion}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadSuggestions(); }}
        />
      )}
    </div>
  );
}

// ─── SuggestionCard ───────────────────────────────────────────────────

interface SuggestionCardProps {
  suggestion: LocationSuggestion;
  currentLat: number;
  currentLng: number;
  userId?: string;
  votingId: string | null;
  commentingId: string | null;
  commentText: string;
  commentSubmitting: boolean;
  pinpointLocked: boolean;
  onVote: (id: string, type: 'agree' | 'disagree') => void;
  onRefine: (id: string) => void;
  onToggleComment: (id: string | null) => void;
  onCommentChange: (text: string) => void;
  onCommentSubmit: (id: string) => void;
}

function SuggestionCard({
  suggestion: s, currentLat, currentLng, userId, votingId,
  commentingId, commentText, commentSubmitting, pinpointLocked,
  onVote, onRefine, onToggleComment, onCommentChange, onCommentSubmit,
}: SuggestionCardProps) {
  const status = STATUS_DISPLAY[s.status];
  const userVoted = s.votes?.some(v => v.userId === userId);
  const isVoting = votingId === s.id;
  const isCommenting = commentingId === s.id;

  const distMeters = Math.round(
    Math.sqrt(
      Math.pow((s.lat - currentLat) * 111320, 2) +
      Math.pow((s.lng - currentLng) * 111320 * Math.cos(currentLat * Math.PI / 180), 2)
    )
  );

  return (
    <div
      className="rounded-xl border transition-all"
      style={{
        borderColor: s.status === 'verified' ? 'rgba(34,197,94,0.3)' : 'var(--border-subtle)',
        backgroundColor: s.status === 'verified' ? 'rgba(34,197,94,0.03)' : 'var(--bg-card)',
      }}
    >
      <div className="p-3 space-y-2">
        {/* User + status + time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#e74c3c] flex items-center justify-center text-[8px] font-bold text-white shrink-0">
              {(s.user?.displayName ?? 'A').slice(0, 2).toUpperCase()}
            </div>
            <span className="text-[11px] font-medium text-[var(--text-primary)]">
              {s.user?.displayName ?? 'Anonymous'}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">{timeAgo(s.createdAt)}</span>
          </div>
          <span
            className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-full"
            style={{ color: status.color, backgroundColor: status.bg }}
          >
            {status.label}
          </span>
        </div>

        {/* Accuracy + distance */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: ACCURACY_COLORS[s.accuracyLevel] }} />
            {s.accuracyLevel}
          </span>
          <span>{distMeters < 1000 ? `${distMeters}m` : `${(distMeters / 1000).toFixed(1)}km`} from current</span>
        </div>

        {/* Explanation */}
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
          {s.explanation}
        </p>

        {/* Source */}
        <a
          href={s.sourceUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] font-mono text-[#3b82f6] hover:text-[#60a5fa] transition-colors truncate max-w-full"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M8 6v2a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1h2M5 5l4-4M6 1h3v3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="truncate">{s.sourceUrl}</span>
        </a>

        {/* Votes — show who agreed/disagreed */}
        {s.votes && s.votes.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {s.votes.map((v) => (
              <span key={v.id} className="inline-flex items-center gap-1 text-[10px]">
                <span className={v.voteType === 'agree' ? 'text-green-400' : 'text-red-400'}>
                  {v.voteType === 'agree' ? '✓' : '✗'}
                </span>
                <span className="text-[var(--text-muted)]">
                  {v.user?.displayName ?? 'Anonymous'}
                </span>
                <span className="text-[var(--text-muted)] opacity-50">{timeAgo(v.createdAt)}</span>
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {/* Agree button — prominent green */}
          {s.status === 'pending' && (
            <button
              onClick={() => onVote(s.id, 'agree')}
              disabled={isVoting || userVoted}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                userVoted
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-green-600 text-white hover:bg-green-500 shadow-sm shadow-green-900/20'
              } disabled:opacity-60`}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5.5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {userVoted ? 'Agreed' : 'Agree'}
              {s.agreeCount > 0 && <span className="opacity-70">({s.agreeCount})</span>}
            </button>
          )}
          {/* Refine — only if not pinpoint locked */}
          {s.status === 'pending' && !pinpointLocked && (
            <button
              onClick={() => onRefine(s.id)}
              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-secondary)] transition-all"
            >
              Refine
            </button>
          )}
          {/* Discuss */}
          <button
            onClick={() => onToggleComment(isCommenting ? null : s.id)}
            className="px-2 py-1 rounded-lg text-[10px] font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-secondary)] transition-all"
          >
            Discuss {(s.comments?.length ?? 0) > 0 ? `(${s.comments!.length})` : ''}
          </button>
        </div>

        {/* Comments */}
        {(isCommenting || (s.comments && s.comments.length > 0)) && (
          <div className="mt-2 pl-3 border-l-2 border-[var(--border-subtle)] space-y-2">
            {s.comments?.map((c) => (
              <div key={c.id} className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-[var(--text-primary)]">
                    {c.user?.displayName ?? 'Anonymous'}
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)]">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{c.body}</p>
              </div>
            ))}
            {isCommenting && (
              <div className="flex gap-1.5 mt-1">
                <input
                  type="text" value={commentText}
                  onChange={(e) => onCommentChange(e.target.value)}
                  placeholder="Add a comment..."
                  autoFocus
                  className="flex-1 px-2 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#e74c3c] transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onCommentSubmit(s.id); }
                  }}
                />
                <button
                  onClick={() => onCommentSubmit(s.id)}
                  disabled={commentSubmitting || !commentText.trim()}
                  className="px-2 py-1.5 rounded-lg text-[10px] font-medium bg-[#e74c3c] text-white hover:bg-[#c0392b] disabled:opacity-50 transition-colors"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
