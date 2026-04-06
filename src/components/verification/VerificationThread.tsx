import { useState, useEffect, useCallback } from 'react';
import type { LocationSuggestion, LocationAccuracy, Moment } from '../../types';
import { useAuth } from '../../lib/auth';
import { fetchSuggestionsForMoment, castVote, addComment } from '../../lib/verification';
import { LoginModal } from '../auth/LoginModal';
import { SuggestionForm } from './SuggestionForm';

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
  const [showLogin, setShowLogin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refiningSuggestion, setRefiningSuggestion] = useState<string | undefined>();
  const [votingId, setVotingId] = useState<string | null>(null);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    const data = await fetchSuggestionsForMoment(moment.id);
    setSuggestions(data);
    setLoading(false);
  }, [moment.id]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleSuggest = () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setRefiningSuggestion(undefined);
    setShowForm(true);
  };

  const handleRefine = (parentId: string) => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setRefiningSuggestion(parentId);
    setShowForm(true);
  };

  const handleVote = async (suggestionId: string, voteType: 'agree' | 'disagree') => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setVotingId(suggestionId);
    const result = await castVote(suggestionId, voteType);
    if (result.error) {
      console.error('Vote failed:', result.error);
    }
    await loadSuggestions();
    setVotingId(null);
  };

  const handleComment = async (suggestionId: string) => {
    if (!commentText.trim()) return;
    setCommentSubmitting(true);
    const result = await addComment(suggestionId, commentText.trim());
    if (result.error) {
      console.error('Comment failed:', result.error);
    }
    setCommentText('');
    setCommentSubmitting(false);
    setCommentingId(null);
    await loadSuggestions();
  };

  // ── Empty / loading state: just a subtle inline link ──
  if (loading || suggestions.length === 0) {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleSuggest}
          className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1.5"/>
            <path d="M5 3v4M3 5h4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
          </svg>
          Suggest a more accurate location
        </button>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} action="suggest a location" />}
        {showForm && (
          <SuggestionForm
            momentId={moment.id} momentName={moment.name}
            currentLat={moment.lat} currentLng={moment.lng}
            currentAccuracy={moment.accuracy} parentSuggestionId={refiningSuggestion}
            onClose={() => setShowForm(false)}
            onSubmitted={() => { setShowForm(false); loadSuggestions(); }}
          />
        )}
      </div>
    );
  }

  // ── Thread with suggestions ──
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const verifiedSuggestions = suggestions.filter(s => s.status === 'verified');
  const otherSuggestions = suggestions.filter(s => s.status !== 'pending' && s.status !== 'verified');

  return (
    <div
      className="space-y-2"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Compact header — only shown when there ARE suggestions */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1"/>
            <path d="M3.5 5l1.2 1.2L6.5 4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {suggestions.length} location {suggestions.length === 1 ? 'suggestion' : 'suggestions'}
        </span>
        <button
          onClick={handleSuggest}
          className="text-[10px] font-mono text-[#e74c3c] hover:text-[#c0392b] transition-colors"
        >
          + Suggest
        </button>
      </div>

      {/* Verified first, then pending, then others */}
      {[...verifiedSuggestions, ...pendingSuggestions, ...otherSuggestions].map((s) => (
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
          onVote={handleVote}
          onRefine={handleRefine}
          onToggleComment={setCommentingId}
          onCommentChange={setCommentText}
          onCommentSubmit={handleComment}
        />
      ))}

      {/* Modals */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          action="suggest a location"
        />
      )}
      {showForm && (
        <SuggestionForm
          momentId={moment.id}
          momentName={moment.name}
          currentLat={moment.lat}
          currentLng={moment.lng}
          currentAccuracy={moment.accuracy}
          parentSuggestionId={refiningSuggestion}
          onClose={() => setShowForm(false)}
          onSubmitted={() => {
            setShowForm(false);
            loadSuggestions();
          }}
        />
      )}
    </div>
  );
}

// ─── SuggestionCard sub-component ─────────────────────────────────────

interface SuggestionCardProps {
  suggestion: LocationSuggestion;
  currentLat: number;
  currentLng: number;
  userId?: string;
  votingId: string | null;
  commentingId: string | null;
  commentText: string;
  commentSubmitting: boolean;
  onVote: (id: string, type: 'agree' | 'disagree') => void;
  onRefine: (id: string) => void;
  onToggleComment: (id: string | null) => void;
  onCommentChange: (text: string) => void;
  onCommentSubmit: (id: string) => void;
}

function SuggestionCard({
  suggestion: s,
  currentLat,
  currentLng,
  userId,
  votingId,
  commentingId,
  commentText,
  commentSubmitting,
  onVote,
  onRefine,
  onToggleComment,
  onCommentChange,
  onCommentSubmit,
}: SuggestionCardProps) {
  const status = STATUS_DISPLAY[s.status];
  const userVoted = s.votes?.some(v => v.userId === userId);
  const isVoting = votingId === s.id;
  const isCommenting = commentingId === s.id;

  // Distance from current pin
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
            <span className="text-[10px] text-[var(--text-muted)]">
              {timeAgo(s.createdAt)}
            </span>
          </div>
          <span
            className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-full"
            style={{ color: status.color, backgroundColor: status.bg }}
          >
            {status.label}
          </span>
        </div>

        {/* Location delta */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ backgroundColor: ACCURACY_COLORS[s.accuracyLevel] }}
            />
            {s.accuracyLevel}
          </span>
          <span>{distMeters < 1000 ? `${distMeters}m` : `${(distMeters / 1000).toFixed(1)}km`} from current</span>
          <span className="font-mono text-[9px] opacity-60">
            {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
          </span>
        </div>

        {/* Explanation */}
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {s.explanation}
        </p>

        {/* Source */}
        <a
          href={s.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] font-mono text-[#3b82f6] hover:text-[#60a5fa] transition-colors truncate max-w-full"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M8 6v2a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1h2M5 5l4-4M6 1h3v3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="truncate">{s.sourceUrl}</span>
        </a>
        {s.sourceDescription && (
          <p className="text-[10px] text-[var(--text-muted)] italic">{s.sourceDescription}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {s.status === 'pending' && (
            <>
              <button
                onClick={() => onVote(s.id, 'agree')}
                disabled={isVoting || userVoted}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all border ${
                  userVoted
                    ? 'bg-green-500/15 text-green-400 border-green-500/30 cursor-default'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30'
                } disabled:opacity-50`}
              >
                {userVoted ? '\u2713' : ''} Agree {s.agreeCount > 0 ? `(${s.agreeCount})` : ''}
              </button>
              <button
                onClick={() => onRefine(s.id)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-secondary)] transition-all"
              >
                Refine
              </button>
            </>
          )}
          <button
            onClick={() => onToggleComment(isCommenting ? null : s.id)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-secondary)] transition-all"
          >
            Discuss {(s.comments?.length ?? 0) > 0 ? `(${s.comments!.length})` : ''}
          </button>
        </div>

        {/* Comments thread */}
        {(isCommenting || (s.comments && s.comments.length > 0)) && (
          <div className="mt-2 pl-3 border-l-2 border-[var(--border-subtle)] space-y-2">
            {s.comments?.map((c) => (
              <div key={c.id} className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-[var(--text-primary)]">
                    {c.user?.displayName ?? 'Anonymous'}
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)]">
                    {timeAgo(c.createdAt)}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  {c.body}
                </p>
              </div>
            ))}
            {isCommenting && (
              <div className="flex gap-1.5 mt-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => onCommentChange(e.target.value)}
                  placeholder="Add a comment..."
                  autoFocus
                  className="flex-1 px-2 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#e74c3c] transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onCommentSubmit(s.id);
                    }
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
