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
  description: string;
  tags: string[];
  contentWarning?: string;
  locations: StoryLocation[];
  relatedStoryIds?: string[];
  wikipediaSlug?: string; // Wikipedia article slug (e.g., "Ed_Gein", "Jeffrey_Dahmer")
}

export type InteractionMode = 'explore' | 'scroll' | 'story';

export interface ViewportLocation {
  location: StoryLocation;
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
  icon: string; // Emoji for visual identity
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
