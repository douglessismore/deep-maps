export type StoryCategory =
  | 'dark-history'
  | 'last-stands'
  | 'discovery-science'
  | 'arts-culture'
  | 'mystery-unexplained'
  | 'political-drama'
  | 'everyday-extraordinary';

export type LocationImportance = 'major' | 'minor' | 'contextual';

export type LocationAccuracy = 'exact' | 'approximate' | 'general-area';

export interface StoryMedia {
  type: 'image' | 'youtube';
  url: string;
  caption?: string;
}

/** @deprecated Use Moment instead. Kept during migration for backward compatibility. */
export interface StoryLocation {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  lat: number;
  lng: number;
  type: string;
  importance: LocationImportance;
  accuracy: LocationAccuracy;
  year?: number;
  date?: string;
  address?: string;
  media?: StoryMedia[];
  wikiSection?: string; // Wikipedia section anchor (e.g., "Crimes", "Early_life")
  links?: LocationLink[]; // External links (affiliates, tours, stays, sources)
}

export interface Story {
  id: string;
  name: string;
  nickname?: string;
  years: string;
  category: StoryCategory;
  storyType: StoryType;                // NEW: incident | biography | place | era
  description: string;
  tags: string[];
  contentWarning?: string;
  moments: StoryMoment[];              // NEW: ordered moment references
  relatedStoryIds?: string[];
  wikipediaSlug?: string; // Wikipedia article slug (e.g., "Ed_Gein", "Jeffrey_Dahmer")
}

export type InteractionMode = 'explore' | 'scroll' | 'story' | 'entity';

export interface ViewportLocation {
  location: Moment;
  story: Story;
  distance: number;
}

export type TileStyle = 'dark' | 'light' | 'satellite';

/** A curated collection of stories around a theme (e.g., "Serial Killers of America") */
export interface StoryCollection {
  id: string;
  name: string;
  subtitle: string; // Clickbait-style hook
  description: string; // 1-2 sentences
  icon?: string; // Deprecated — no longer rendered
  storyIds: string[]; // References to story IDs
  /** Optional: specific location IDs to feature (cherry-pick across stories) */
  featuredLocationIds?: string[];
  tags: string[];
}

/** External link on a location (affiliate, source, tour, stay, etc.) */
export interface LocationLink {
  label: string;
  url: string;
  type: 'affiliate' | 'wiki' | 'source' | 'tour' | 'stay';
}

// ─── V2 Architecture: Moments-First Model ───────────────────────────

/** The atomic unit — something that happened at a place and time.
 *  Moments are VERBS: "O. Henry Coins 'Servant Girl Annihilator'"
 *  They have standalone descriptions that make sense without any story context. */
export interface Moment {
  id: string;                          // e.g. 'ohenry-coins-annihilator'
  name: string;                        // VERB-DRIVEN: "O. Henry Coins 'Servant Girl Annihilator'"
  subtitle: string;                    // Hook: "A bank clerk's letter names America's first serial killer"
  description: string;                 // STANDALONE — must make sense without any story context
  lat: number;
  lng: number;
  type: string;                        // 'crime_scene', 'cultural_venue', etc.
  importance: LocationImportance;
  accuracy: LocationAccuracy;
  kind?: MomentKind;                   // 'event' | 'milestone' | 'presence' — defaults to 'event' if omitted
  year?: number;
  date?: string;
  address?: string;
  entityIds?: string[];                // References to Entity.id: ['o-henry', 'annihilator-case']
  media?: StoryMedia[];
  wikiSection?: string;                // Wikipedia section anchor (e.g., "Crimes", "Early_life")
  links?: LocationLink[];              // External links (affiliates, tours, stays, sources)
}

/** A story's reference to a shared moment, with optional narrative framing.
 *  narrativeGlue provides story-specific context before the moment's standalone description.
 *  Example: "While the city reeled from the latest axe attack, a keen observer was watching..." */
export interface StoryMoment {
  momentId: string;                    // Reference to Moment.id
  narrativeGlue?: string;             // Story-specific intro sentence
}

/** A person, place, organization, or concept that appears across moments and stories.
 *  Entities are NOUNS: "O. Henry", "The Broken Spoke", "FBI" */
export interface Entity {
  id: string;                          // e.g. 'o-henry', 'broken-spoke', 'fbi'
  name: string;                        // Display name: 'O. Henry', 'The Broken Spoke'
  type: 'person' | 'place' | 'organization' | 'concept';
  years?: string;                      // For people: '1862–1910'
  description?: string;                // Brief bio/description
  canonicalStoryId?: string;           // Their "main" story: 'o-henry-life'
  wikipediaSlug?: string;              // Entity's own Wikipedia article
}

/** Story taxonomy — what kind of narrative thread is this? */
export type StoryType = 'incident' | 'biography' | 'place' | 'era';

/** Moment taxonomy — what kind of moment is this?
 *  - event: A dramatic happening — "Police Discover Gein's Farmhouse"
 *  - milestone: A life event (birth/death/marriage) — "O. Henry Born in Greensboro"
 *  - presence: Ongoing association with a place — "O. Henry Works at the Land Office"
 *  Defaults to 'event' if omitted. */
export type MomentKind = 'event' | 'milestone' | 'presence';
