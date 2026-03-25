/**
 * Deep Maps — Name Matching for BillionGraves Pipeline
 *
 * Handles name normalization, fuzzy matching, and confidence scoring
 * for matching our entities against BillionGraves search results.
 */

import type { BurialSearchResult } from './billiongraves-client.js';
import { generateJSON } from './llm-client.js';

// ── Types ────────────────────────────────────────────────────────────

export interface EntityForMatching {
  id: string;
  name: string;
  years?: string;         // e.g. "1809–1865"
  description?: string;
  deathYear?: number;
  /** Known moment coordinates for geographic proximity scoring */
  knownLocations?: Array<{ lat: number; lng: number }>;
}

export interface ScoredMatch {
  result: BurialSearchResult;
  confidence: number;     // 0–1
  nameScore: number;      // 0–1
  yearScore: number;      // 0–1
  geoScore: number;       // 0–1
  reason: string;         // human-readable explanation
}

// ── Name Normalization ───────────────────────────────────────────────

/**
 * Split a full name into given name + surname.
 * Handles "First Last", "Last, First", suffixes (Jr./Sr./III/IV), and diacritics.
 */
export function normalizeName(name: string): { given: string; surname: string } {
  let cleaned = name.trim();

  // Remove common suffixes
  cleaned = cleaned.replace(/\b(Jr\.?|Sr\.?|III|IV|II|Esq\.?)\b/gi, '').trim();

  // Remove parenthetical nicknames or titles
  cleaned = cleaned.replace(/\([^)]*\)/g, '').trim();

  // Strip diacritics (é → e, ñ → n, etc.)
  cleaned = cleaned.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Handle "Last, First" format
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',').map(p => p.trim());
    return { given: parts[1] || '', surname: parts[0] || '' };
  }

  // Handle "First Middle Last" — last word is surname
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return { given: '', surname: '' };
  if (words.length === 1) return { given: words[0], surname: '' };

  // Common prefixes that are part of surname (von, de, van, etc.)
  const surnameStarts = new Set(['von', 'van', 'de', 'del', 'della', 'di', 'la', 'le', 'el', 'al', 'bin', 'ibn']);
  let surnameIdx = words.length - 1;
  // Walk backwards to include surname prefixes
  while (surnameIdx > 1 && surnameStarts.has(words[surnameIdx - 1].toLowerCase())) {
    surnameIdx--;
  }

  return {
    given: words.slice(0, surnameIdx).join(' '),
    surname: words.slice(surnameIdx).join(' '),
  };
}

// ── String Similarity ────────────────────────────────────────────────

/**
 * Jaro-Winkler similarity between two strings (0–1, higher = more similar).
 * Good for name matching — gives extra weight to matching prefixes.
 */
function jaroWinkler(s1: string, s2: string): number {
  const a = s1.toLowerCase();
  const b = s2.toLowerCase();

  if (a === b) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;

  const matchWindow = Math.max(Math.floor(Math.max(a.length, b.length) / 2) - 1, 0);
  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matching characters
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, b.length);

    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3;

  // Winkler bonus for common prefix (up to 4 chars)
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(a.length, b.length)); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

// ── Scoring ──────────────────────────────────────────────────────────

/**
 * Haversine distance in km between two lat/lng pairs.
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Score a BG search result against our entity.
 * Returns a confidence score from 0–1 with component scores.
 */
export function scoreBurialMatch(
  entity: EntityForMatching,
  candidate: BurialSearchResult,
): ScoredMatch {
  // ── Name score (0–1) ──
  const entityNorm = normalizeName(entity.name);
  const candidateNorm = normalizeName(candidate.fullName);

  const givenSim = jaroWinkler(entityNorm.given, candidateNorm.given);
  const surnameSim = jaroWinkler(entityNorm.surname, candidateNorm.surname);
  // Surname matters more — weight 60/40
  const nameScore = surnameSim * 0.6 + givenSim * 0.4;

  // ── Year score (0–1) ──
  let yearScore = 0.5; // neutral if we don't have death year
  if (entity.deathYear && candidate.deathYear) {
    const diff = Math.abs(entity.deathYear - candidate.deathYear);
    if (diff === 0) yearScore = 1.0;
    else if (diff <= 1) yearScore = 0.9;
    else if (diff <= 3) yearScore = 0.7;
    else if (diff <= 5) yearScore = 0.5;
    else if (diff <= 10) yearScore = 0.2;
    else yearScore = 0.0;
  } else if (entity.deathYear && !candidate.deathYear) {
    yearScore = 0.3; // penalize missing death year on candidate
  }

  // ── Geographic proximity score (0–1) ──
  let geoScore = 0.5; // neutral if we have no known locations
  if (entity.knownLocations && entity.knownLocations.length > 0) {
    // Find closest known location to this candidate's GPS
    const minDist = Math.min(
      ...entity.knownLocations.map(loc =>
        haversineKm(loc.lat, loc.lng, candidate.lat, candidate.lng)
      )
    );
    // Within 50km of a known location = strong signal
    if (minDist < 10) geoScore = 0.9;
    else if (minDist < 50) geoScore = 0.8;
    else if (minDist < 200) geoScore = 0.6;
    else if (minDist < 1000) geoScore = 0.4;
    else geoScore = 0.2;
  }

  // ── Combined confidence ──
  // Name is most important (50%), year match (30%), geo (20%)
  const confidence = nameScore * 0.5 + yearScore * 0.3 + geoScore * 0.2;

  // Build reason string
  const reasons: string[] = [];
  if (nameScore >= 0.9) reasons.push('exact name match');
  else if (nameScore >= 0.7) reasons.push('close name match');
  else reasons.push(`weak name match (${nameScore.toFixed(2)})`);

  if (yearScore >= 0.9) reasons.push('death year matches');
  else if (yearScore < 0.5) reasons.push('death year mismatch');

  if (geoScore >= 0.8) reasons.push('near known locations');

  return {
    result: candidate,
    confidence,
    nameScore,
    yearScore,
    geoScore,
    reason: reasons.join(', '),
  };
}

/**
 * Score all candidates and return them sorted by confidence (highest first).
 */
export function rankCandidates(
  entity: EntityForMatching,
  candidates: BurialSearchResult[],
): ScoredMatch[] {
  return candidates
    .map(c => scoreBurialMatch(entity, c))
    .sort((a, b) => b.confidence - a.confidence);
}

// ── LLM Disambiguation ──────────────────────────────────────────────

/**
 * When the top candidates are too close in score, use Claude to pick the right one.
 * Only called when the top 2 candidates are within 0.1 confidence of each other.
 */
export async function disambiguateWithLLM(
  entity: EntityForMatching,
  topCandidates: ScoredMatch[],
): Promise<ScoredMatch | null> {
  if (topCandidates.length === 0) return null;
  if (topCandidates.length === 1) return topCandidates[0];

  // Only disambiguate if top 2 are close
  if (topCandidates[0].confidence - topCandidates[1].confidence > 0.1) {
    return topCandidates[0]; // clear winner, no LLM needed
  }

  const candidateDescriptions = topCandidates.slice(0, 5).map((c, i) => ({
    index: i,
    name: c.result.fullName,
    birthYear: c.result.birthYear ?? 'unknown',
    deathYear: c.result.deathYear ?? 'unknown',
    cemetery: c.result.cemeteryName,
    lat: c.result.lat,
    lng: c.result.lng,
    confidence: c.confidence.toFixed(3),
  }));

  const prompt = `You are matching a historical figure to a BillionGraves burial record.

**Person we're looking for:**
- Name: ${entity.name}
- Years: ${entity.years ?? 'unknown'}
- Description: ${entity.description ?? 'none available'}

**Candidate burial records:**
${JSON.stringify(candidateDescriptions, null, 2)}

Which candidate (by index) is most likely the correct burial record for this person?
If none are a good match, return -1.

Respond with JSON: { "index": <number>, "reason": "<brief explanation>" }`;

  try {
    const result = await generateJSON<{ index: number; reason: string }>({
      system: 'You are a genealogy expert matching historical figures to burial records. Be precise and conservative — only match when confident.',
      prompt,
      maxTokens: 256,
      temperature: 0.1,
    });

    if (result.index === -1) return null;
    if (result.index >= 0 && result.index < topCandidates.length) {
      const selected = topCandidates[result.index];
      // Boost confidence slightly since LLM confirmed
      selected.confidence = Math.min(1.0, selected.confidence + 0.05);
      selected.reason += ` (LLM confirmed: ${result.reason})`;
      return selected;
    }

    return topCandidates[0]; // fallback to highest scoring
  } catch (err) {
    console.warn(`  ⚠ LLM disambiguation failed:`, (err as Error).message);
    return topCandidates[0]; // fallback to highest scoring
  }
}

/**
 * Extract death year from an entity's years string (e.g., "1809–1865" → 1865).
 */
export function extractDeathYear(years: string | undefined): number | undefined {
  if (!years) return undefined;
  // Match the second year in ranges like "1809-1865", "1809–1865", "c. 1200–1255"
  const match = years.match(/[-–]\s*(\d{3,4})/);
  if (match) return parseInt(match[1], 10);
  // Single year (already dead, year only)
  const singleMatch = years.match(/\b(\d{4})\b/);
  return singleMatch ? parseInt(singleMatch[1], 10) : undefined;
}
