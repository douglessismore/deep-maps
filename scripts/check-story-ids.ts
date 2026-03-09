import { stories } from '../src/data/stories';

const flaggedIds = [
  'ed-gein', 'dahmer', 'elfego-baca', 'billy-the-kid', 'geronimo',
  'los-alamos', 'carlsbad-caverns', 'white-sands-footprints', 'georgia-okeeffe',
  'dennis-hopper-taos', 'pancho-villa-raid', 'pueblo-revolt', 'truth-or-consequences',
  'chaco-canyon', 'vla', 'clovis-points'
];

const storyIds = new Set(stories.map(s => s.id));

for (const id of flaggedIds) {
  if (storyIds.has(id)) {
    const story = stories.find(s => s.id === id);
    console.log(`OK: "${id}" (currently ${story?.storyType})`);
  } else {
    // Find closest match by substring
    const matches = stories.filter(s =>
      s.id.includes(id.split('-')[0]) || id.includes(s.id)
    );
    const closest = matches.map(s => `"${s.id}" (${s.storyType})`).join(', ');
    console.log(`MISSING: "${id}" → possible: ${closest || 'none found'}`);
  }
}
