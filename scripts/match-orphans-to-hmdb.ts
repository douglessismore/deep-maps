/**
 * Cross-reference orphan moments (moments with no parent story) against
 * the HMDB dataset. Surface:
 *  1. Geographic matches within 2km — HMDB markers that mirror or add
 *     context to existing orphan moments
 *  2. Entity-name overlaps — HMDB marker titles containing the same
 *     person/place as an orphan moment's name/description
 *  3. Narrative clusters — groups of ≥3 orphan moments near one another
 *     that could become a new story
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config({ path: '.env.local', override: true });

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Haversine, meters
function distMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface HmdbRow {
  marker_id: string;
  title: string;
  subtitle: string;
  year_erected: string;
  lat: number;
  lng: number;
  state: string;
  city: string;
  link: string;
}

function parseCsv(content: string): HmdbRow[] {
  const lines = content.split('\n');
  const header = lines[0].split(',');
  const idx = (name: string) => header.indexOf(name);
  const I = {
    id: idx('marker_id'),
    title: idx('title'),
    subtitle: idx('subtitle'),
    year: idx('year_erected'),
    lat: idx('latitude_minus_s'),
    lng: idx('longitude_minus_w'),
    state: idx('state_or_prov'),
    city: idx('city_or_town'),
    link: idx('link'),
  };
  const rows: HmdbRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    // naive CSV split — HMDB uses quoted fields; handle simple cases
    const parts: string[] = [];
    let cur = '';
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) { parts.push(cur); cur = ''; }
      else cur += ch;
    }
    parts.push(cur);
    const lat = parseFloat(parts[I.lat]);
    const lng = parseFloat(parts[I.lng]);
    if (!isFinite(lat) || !isFinite(lng)) continue;
    rows.push({
      marker_id: parts[I.id],
      title: parts[I.title] || '',
      subtitle: parts[I.subtitle] || '',
      year_erected: parts[I.year] || '',
      lat,
      lng: -Math.abs(lng), // HMDB stores positive as "minus_w", so negate for standard
      state: parts[I.state] || '',
      city: parts[I.city] || '',
      link: parts[I.link] || '',
    });
  }
  return rows;
}

(async () => {
  console.log('Loading orphan moments from Supabase...');
  const moments: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('moments').select('id,name,subtitle,location,year,description').range(from, from + 999);
    if (error) { console.error(error); break; }
    if (!data || data.length === 0) break;
    moments.push(...data);
    if (data.length < 1000) break;
  }
  const meAll: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from('moment_entities').select('moment_id').range(from, from + 999);
    if (!data || data.length === 0) break;
    meAll.push(...data);
    if (data.length < 1000) break;
  }
  const momentEntityCount = new Map<string, number>();
  for (const r of meAll) momentEntityCount.set(r.moment_id, (momentEntityCount.get(r.moment_id) || 0) + 1);
  const sm: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from('story_moments').select('moment_id').range(from, from + 999);
    if (!data || data.length === 0) break;
    sm.push(...data);
    if (data.length < 1000) break;
  }
  const cm: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from('collection_moments').select('moment_id').range(from, from + 999);
    if (!data || data.length === 0) break;
    cm.push(...data);
    if (data.length < 1000) break;
  }
  // A moment is "orphaned" only if it has NO parent story AND NO parent collection.
  // Collection-wired moments are already discoverable to users via the collection browse tab.
  const inStory = new Set(sm.map(r => r.moment_id));
  const inCollection = new Set(cm.map(r => r.moment_id));
  const hasParent = (id: string) => inStory.has(id) || inCollection.has(id);
  // Unpack PostGIS location column → lat/lng
  for (const m of moments) {
    const coords = m.location?.coordinates;
    if (coords) {
      m.lng = coords[0];
      m.lat = coords[1];
    }
  }
  const orphans = moments.filter(m => !hasParent(m.id) && isFinite(m.lat) && isFinite(m.lng));
  const inStoryCount = moments.filter(m => inStory.has(m.id)).length;
  const inCollectionOnly = moments.filter(m => !inStory.has(m.id) && inCollection.has(m.id)).length;
  console.log(`Total moments: ${moments.length}`);
  console.log(`  in story: ${inStoryCount}`);
  console.log(`  in collection only (not in any story): ${inCollectionOnly}`);
  console.log(`  true orphans (no story, no collection): ${orphans.length}`);

  // Filter to orphans with no entity either (true orphans)
  const totalWithEntities = orphans.filter(o => (momentEntityCount.get(o.id) || 0) > 0).length;
  console.log(`Orphans with ≥1 entity tag: ${totalWithEntities}`);
  console.log(`Orphans with NO entity (fully isolated): ${orphans.length - totalWithEntities}`);

  // Parse HMDB
  console.log('Loading HMDB...');
  const csvPath = path.join('scripts/staging/sources/historical_markers.csv');
  const hmdb = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  console.log(`HMDB rows with coords: ${hmdb.length}`);

  // 1. Proximity matches: orphan → nearest HMDB markers within 500m
  console.log('\n=== 1. PROXIMITY MATCHES (orphan → HMDB within 500m) ===');
  const proximityHits: Array<{ orphan: any; markers: any[] }> = [];
  for (const o of orphans) {
    const nearby: any[] = [];
    for (const h of hmdb) {
      if (Math.abs(h.lat - o.lat) > 0.01 || Math.abs(h.lng - o.lng) > 0.01) continue;
      const d = distMeters(o.lat, o.lng, h.lat, h.lng);
      if (d <= 500) nearby.push({ ...h, distance: Math.round(d) });
    }
    if (nearby.length > 0) {
      nearby.sort((a, b) => a.distance - b.distance);
      proximityHits.push({ orphan: o, markers: nearby.slice(0, 3) });
    }
  }
  console.log(`${proximityHits.length} orphans have ≥1 HMDB marker within 500m`);

  // 2. Name token overlap — orphan name words that appear in HMDB titles
  console.log('\n=== 2. NAME TOKEN MATCHES (orphan keywords in HMDB titles) ===');
  const stop = new Set(['the','a','an','of','and','in','on','at','to','for','with','by','is','as','his','her','their','from','after','before','over','under','this','that']);
  function tokens(s: string): string[] {
    return (s || '').toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(t => t.length >= 4 && !stop.has(t));
  }
  const hmdbIndex = new Map<string, number[]>();
  hmdb.forEach((h, i) => {
    for (const t of new Set(tokens(h.title + ' ' + h.subtitle))) {
      if (!hmdbIndex.has(t)) hmdbIndex.set(t, []);
      hmdbIndex.get(t)!.push(i);
    }
  });

  const nameMatches: Array<{ orphan: any; markers: any[]; keyword: string }> = [];
  for (const o of orphans) {
    const oTokens = new Set(tokens(o.name + ' ' + (o.subtitle || '') + ' ' + (o.description || '')));
    // Find HMDB markers that share ≥2 distinctive tokens AND are within 50km
    const scores = new Map<number, { count: number; sharedTokens: string[] }>();
    for (const t of oTokens) {
      const list = hmdbIndex.get(t) || [];
      if (list.length > 2000) continue; // too generic
      for (const idx of list) {
        const s = scores.get(idx) || { count: 0, sharedTokens: [] };
        s.count++;
        s.sharedTokens.push(t);
        scores.set(idx, s);
      }
    }
    const candidates: any[] = [];
    for (const [idx, s] of scores) {
      if (s.count < 2) continue;
      const h = hmdb[idx];
      const d = distMeters(o.lat, o.lng, h.lat, h.lng);
      if (d > 50000) continue;
      candidates.push({ ...h, distance: Math.round(d), shared: s.sharedTokens, score: s.count });
    }
    candidates.sort((a, b) => b.score - a.score || a.distance - b.distance);
    if (candidates.length > 0) {
      nameMatches.push({ orphan: o, markers: candidates.slice(0, 3), keyword: candidates[0].shared.join(',') });
    }
  }
  console.log(`${nameMatches.length} orphans match HMDB titles by ≥2 shared tokens`);

  // 3. Orphan clusters: groups of ≥3 orphans within 5km of each other
  console.log('\n=== 3. ORPHAN CLUSTERS (≥3 orphans within 5km) ===');
  const clusters: Array<{ center: any; members: any[] }> = [];
  const used = new Set<string>();
  for (const o of orphans) {
    if (used.has(o.id)) continue;
    const group: any[] = [o];
    for (const o2 of orphans) {
      if (o2.id === o.id || used.has(o2.id)) continue;
      if (distMeters(o.lat, o.lng, o2.lat, o2.lng) <= 5000) group.push(o2);
    }
    if (group.length >= 3) {
      group.forEach(m => used.add(m.id));
      clusters.push({ center: o, members: group });
    }
  }
  clusters.sort((a, b) => b.members.length - a.members.length);
  console.log(`${clusters.length} geographic clusters of ≥3 orphans`);

  // Write report
  const report = {
    summary: {
      totalMoments: moments.length,
      orphanCount: orphans.length,
      orphansWithEntities: totalWithEntities,
      orphansFullyIsolated: orphans.length - totalWithEntities,
      hmdbRows: hmdb.length,
      proximityHits: proximityHits.length,
      nameMatches: nameMatches.length,
      clusters: clusters.length,
    },
    proximityHits: proximityHits.slice(0, 200),
    nameMatches: nameMatches.slice(0, 200),
    topClusters: clusters.slice(0, 30).map(c => ({
      size: c.members.length,
      center: { lat: c.center.lat, lng: c.center.lng, name: c.center.name },
      members: c.members.map(m => ({ id: m.id, name: m.name, year: m.year, lat: m.lat, lng: m.lng })),
    })),
  };
  fs.writeFileSync('scripts/staging/orphan-hmdb-report.json', JSON.stringify(report, null, 2));
  console.log('\nReport written to scripts/staging/orphan-hmdb-report.json');
  console.log('\nTop 10 orphan clusters:');
  clusters.slice(0, 10).forEach(c => {
    console.log(`  ${c.members.length} moments near "${c.center.name.slice(0, 60)}"`);
  });
})();
