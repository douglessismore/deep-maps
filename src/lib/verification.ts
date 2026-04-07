/**
 * Verification data service — CRUD for location suggestions, votes, comments.
 * All operations go through Supabase with RLS (user must be authenticated).
 */
import { supabase } from './supabase';
import type {
  LocationSuggestion,
  SuggestionVote,
  SuggestionComment,
  UserProfile,
  LocationAccuracy,
  VoteType,
} from '../types';

// ─── Row → Type mappers ──────────────────────────────────────────────

function mapProfile(row: any): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name ?? 'Anonymous',
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: row.created_at,
    totalSuggestions: row.total_suggestions ?? 0,
    totalVerifications: row.total_verifications ?? 0,
    pinpointCount: row.pinpoint_count ?? 0,
    exactCount: row.exact_count ?? 0,
  };
}

function mapVote(row: any): SuggestionVote {
  return {
    id: row.id,
    suggestionId: row.suggestion_id,
    userId: row.user_id,
    user: row.user_profiles ? mapProfile(row.user_profiles) : undefined,
    voteType: row.vote_type,
    createdAt: row.created_at,
  };
}

function mapComment(row: any): SuggestionComment {
  return {
    id: row.id,
    suggestionId: row.suggestion_id,
    userId: row.user_id,
    user: row.user_profiles ? mapProfile(row.user_profiles) : undefined,
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapSuggestion(row: any): LocationSuggestion {
  return {
    id: row.id,
    momentId: row.moment_id,
    userId: row.user_id,
    user: row.user_profiles ? mapProfile(row.user_profiles) : undefined,
    createdAt: row.created_at,
    lat: row.lat,
    lng: row.lng,
    accuracyLevel: row.accuracy_level as LocationAccuracy,
    explanation: row.explanation,
    sourceUrl: row.source_url,
    sourceDescription: row.source_description ?? undefined,
    parentSuggestionId: row.parent_suggestion_id ?? undefined,
    status: row.status,
    verifiedAt: row.verified_at ?? undefined,
    agreeCount: row.agree_count ?? 0,
    votes: row.suggestion_votes?.map(mapVote) ?? [],
    comments: row.suggestion_comments?.map(mapComment) ?? [],
  };
}

// ─── Queries ──────────────────────────────────────────────────────────

/** Fetch all suggestions for a moment, with user profiles, votes, and comments.
 *  PostgREST can't join user_profiles via location_suggestions.user_id because
 *  the FK goes to auth.users, not user_profiles. So we fetch profiles separately. */
export async function fetchSuggestionsForMoment(
  momentId: string
): Promise<LocationSuggestion[]> {
  const { data, error } = await supabase
    .from('location_suggestions')
    .select(`
      *,
      suggestion_votes(*),
      suggestion_comments(*)
    `)
    .eq('moment_id', momentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch suggestions:', error);
    return [];
  }
  if (!data || data.length === 0) return [];

  // Collect all user IDs and batch-fetch profiles
  const userIds = new Set<string>();
  for (const s of data) {
    userIds.add(s.user_id);
    for (const v of s.suggestion_votes ?? []) userIds.add(v.user_id);
    for (const c of s.suggestion_comments ?? []) userIds.add(c.user_id);
  }

  const profileMap = new Map<string, any>();
  if (userIds.size > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', [...userIds]);
    for (const p of profiles ?? []) profileMap.set(p.id, p);
  }

  // Attach profiles to the data before mapping
  return data.map((row) => {
    row.user_profiles = profileMap.get(row.user_id) ?? null;
    for (const v of row.suggestion_votes ?? []) {
      v.user_profiles = profileMap.get(v.user_id) ?? null;
    }
    for (const c of row.suggestion_comments ?? []) {
      c.user_profiles = profileMap.get(c.user_id) ?? null;
    }
    return mapSuggestion(row);
  });
}

/** Fetch suggestion count for a moment (lightweight, no joins). */
export async function fetchSuggestionCount(momentId: string): Promise<number> {
  const { count, error } = await supabase
    .from('location_suggestions')
    .select('*', { count: 'exact', head: true })
    .eq('moment_id', momentId);

  if (error) return 0;
  return count ?? 0;
}

// ─── Mutations ────────────────────────────────────────────────────────

interface SubmitSuggestionData {
  momentId: string;
  lat: number;
  lng: number;
  accuracyLevel: LocationAccuracy;
  explanation: string;
  sourceUrl: string;
  sourceDescription?: string;
  parentSuggestionId?: string;
}

/** Submit a new location suggestion. */
export async function submitSuggestion(
  data: SubmitSuggestionData
): Promise<{ suggestion: LocationSuggestion | null; error: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { suggestion: null, error: 'Not authenticated' };

  const { data: row, error } = await supabase
    .from('location_suggestions')
    .insert({
      moment_id: data.momentId,
      user_id: userData.user.id,
      lat: data.lat,
      lng: data.lng,
      accuracy_level: data.accuracyLevel,
      explanation: data.explanation,
      source_url: data.sourceUrl,
      source_description: data.sourceDescription ?? null,
      parent_suggestion_id: data.parentSuggestionId ?? null,
    })
    .select('*')
    .single();

  if (error) return { suggestion: null, error: error.message };
  return { suggestion: mapSuggestion(row), error: null };
}

/** Cast a vote on a suggestion. */
export async function castVote(
  suggestionId: string,
  voteType: VoteType
): Promise<{ error: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('suggestion_votes')
    .insert({
      suggestion_id: suggestionId,
      user_id: userData.user.id,
      vote_type: voteType,
    });

  if (error) {
    if (error.code === '23505') return { error: 'You already voted on this suggestion' };
    return { error: error.message };
  }
  return { error: null };
}

/** Add a comment to a suggestion. */
export async function addComment(
  suggestionId: string,
  body: string
): Promise<{ comment: SuggestionComment | null; error: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { comment: null, error: 'Not authenticated' };

  const { data: row, error } = await supabase
    .from('suggestion_comments')
    .insert({
      suggestion_id: suggestionId,
      user_id: userData.user.id,
      body,
    })
    .select('*, user_profiles(*)')
    .single();

  if (error) return { comment: null, error: error.message };
  return { comment: mapComment(row), error: null };
}

// ─── Pinpoint lock ────────────────────────────────────────────────────

/** Check if a moment has a verified pinpoint suggestion (locked — no more suggestions). */
export async function checkPinpointLocked(momentId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('location_suggestions')
    .select('id')
    .eq('moment_id', momentId)
    .eq('status', 'verified')
    .eq('accuracy_level', 'pinpoint')
    .limit(1);

  if (error || !data) return false;
  return data.length > 0;
}

// ─── Leaderboard ──────────────────────────────────────────────────────

export interface LeaderboardEntry {
  profile: UserProfile;
  rank: number;
}

/** Fetch top contributors (most verified suggestions). */
export async function fetchTopContributors(limit = 20): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .gt('total_suggestions', 0)
    .order('total_suggestions', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((row, i) => ({ profile: mapProfile(row), rank: i + 1 }));
}

/** Fetch top verifiers (most verification votes cast). */
export async function fetchTopVerifiers(limit = 20): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .gt('total_verifications', 0)
    .order('total_verifications', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((row, i) => ({ profile: mapProfile(row), rank: i + 1 }));
}
