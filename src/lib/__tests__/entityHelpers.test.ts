import { describe, it, expect } from 'vitest';
import { filterBrowseableStories } from '../entityHelpers';
import type { Story } from '../../types';

/** Minimal story stub for testing filter logic. */
function makeStory(overrides: Partial<Story> & { id: string; storyType: Story['storyType'] }): Story {
  return {
    name: overrides.id,
    category: 'dark-history',
    description: '',
    tags: [],
    years: '2000',
    moments: [],
    ...overrides,
  } as Story;
}

describe('filterBrowseableStories', () => {
  it('passes incident stories through', () => {
    const stories = [makeStory({ id: 'a', storyType: 'incident' })];
    expect(filterBrowseableStories(stories)).toHaveLength(1);
    expect(filterBrowseableStories(stories)[0].id).toBe('a');
  });

  it('blocks biography stories', () => {
    const stories = [makeStory({ id: 'bio', storyType: 'biography' })];
    expect(filterBrowseableStories(stories)).toHaveLength(0);
  });

  it('blocks place stories', () => {
    const stories = [makeStory({ id: 'place', storyType: 'place' })];
    expect(filterBrowseableStories(stories)).toHaveLength(0);
  });

  it('blocks era stories', () => {
    const stories = [makeStory({ id: 'era', storyType: 'era' })];
    expect(filterBrowseableStories(stories)).toHaveLength(0);
  });

  it('returns empty array for empty input', () => {
    expect(filterBrowseableStories([])).toHaveLength(0);
  });

  it('filters mixed array to only incidents', () => {
    const stories = [
      makeStory({ id: 'incident-1', storyType: 'incident' }),
      makeStory({ id: 'bio-1', storyType: 'biography' }),
      makeStory({ id: 'incident-2', storyType: 'incident' }),
      makeStory({ id: 'place-1', storyType: 'place' }),
      makeStory({ id: 'era-1', storyType: 'era' }),
    ];
    const result = filterBrowseableStories(stories);
    expect(result).toHaveLength(2);
    expect(result.map(s => s.id)).toEqual(['incident-1', 'incident-2']);
  });

  it('blocks unknown/future story types (whitelist safety)', () => {
    // Simulate a future story type that doesn't exist yet
    const stories = [makeStory({ id: 'future', storyType: 'new-type' as Story['storyType'] })];
    expect(filterBrowseableStories(stories)).toHaveLength(0);
  });
});
