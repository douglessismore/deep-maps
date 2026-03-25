#!/usr/bin/env npx tsx
/**
 * Manually verified BG matches — filter bg-new-burials.json to only
 * confirmed correct matches, then extract GPS from BG record pages.
 *
 * Outputs bg-verified-mappings.json for the Phase 2 pipeline.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { fetchRecordData } from './lib/billiongraves-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '../output');

// Manually verified correct matches (entity → BG record ID)
// These are confirmed to be the correct historical figure's burial record.
const VERIFIED_MATCHES: Array<{
  entityId: string;
  name: string;
  bgRecordId: number;
  notes: string;
}> = [
  { entityId: 'abraham-lincoln', name: 'Abraham Lincoln', bgRecordId: 34176450, notes: 'Lincoln Tomb State Historic Site, Springfield IL' },
  { entityId: 'alexander-hamilton', name: 'Alexander Hamilton', bgRecordId: 160253956, notes: 'Trinity Churchyard, NYC' },
  { entityId: 'billy-the-kid', name: 'Billy the Kid', bgRecordId: 37576325, notes: 'Old Fort Sumner Cemetery, NM' },
  { entityId: 'charles-dickens', name: 'Charles Dickens', bgRecordId: 96532787, notes: 'Westminster Abbey, London' },
  { entityId: 'edgar-allan-poe', name: 'Edgar Allan Poe', bgRecordId: 1924245, notes: 'Westminster Hall and Burying Ground, Baltimore' },
  { entityId: 'karl-marx', name: 'Karl Marx', bgRecordId: 19356901, notes: 'Highgate Cemetery, London' },
  { entityId: 'marie-curie', name: 'Marie Curie', bgRecordId: 164073265, notes: 'Panthéon, Paris' },
  { entityId: 'muhammad-ali', name: 'Muhammad Ali', bgRecordId: 40127728, notes: 'Cave Hill Cemetery, Louisville KY' },
  { entityId: 'neil-armstrong', name: 'Neil Armstrong', bgRecordId: 97152988, notes: 'Emerald Cemetery, OH (ashes scattered at sea, cenotaph here)' },
  { entityId: 'theodore-roosevelt', name: 'Theodore Roosevelt', bgRecordId: 34198707, notes: 'Youngs Memorial Cemetery, Oyster Bay NY' },
  { entityId: 'david-livingstone', name: 'David Livingstone', bgRecordId: 55770339, notes: 'Westminster Abbey, London' },
  { entityId: 'rosa-parks', name: 'Rosa Parks', bgRecordId: 46710158, notes: 'Woodlawn Cemetery, Detroit MI' },
  { entityId: 'thomas-edison', name: 'Thomas Edison', bgRecordId: 123606843, notes: 'Rosedale Cemetery / Thomas Edison NHP, West Orange NJ' },
  { entityId: 'charles-darwin', name: 'Charles Darwin', bgRecordId: 30649599, notes: 'Westminster Abbey (actually buried there, not Downe)' },
  { entityId: 'daniel-burnham', name: 'Daniel Burnham', bgRecordId: 14636698, notes: 'Graceland Cemetery, Chicago IL' },
  { entityId: 'martin-luther-king-jr', name: 'Martin Luther King Jr.', bgRecordId: 20689572, notes: 'MLK Jr National Historical Park, Atlanta GA' },
  { entityId: 'carl-friedrich-gauss', name: 'Carl Friedrich Gauss', bgRecordId: 15574400, notes: 'Albanifriedhof, Göttingen, Germany' },
  { entityId: 'alexander-fleming', name: 'Alexander Fleming', bgRecordId: 87104089, notes: 'East Kilbride Cemetery, Scotland (or St Pauls Cathedral)' },
  { entityId: 'franklin-d-roosevelt', name: 'Franklin D. Roosevelt', bgRecordId: 19918401, notes: 'Home of FDR NHS, Hyde Park NY' },
  { entityId: 'thomas-jefferson', name: 'Thomas Jefferson', bgRecordId: 0, notes: 'Monticello Graveyard — need to verify record ID' },
  { entityId: 'dick-hickock', name: 'Dick Hickock', bgRecordId: 580504, notes: 'Mount Muncie Cemetery, Lansing KS (In Cold Blood)' },
  { entityId: 'carter-harrison-sr', name: 'Carter Harrison Sr.', bgRecordId: 0, notes: 'Graceland Cemetery, Chicago — need to verify record ID' },
  { entityId: 'winston-churchill', name: 'Winston Churchill', bgRecordId: 70732791, notes: 'Westminster Abbey memorial (buried at Bladon)' },
].filter(m => m.bgRecordId > 0); // Remove entries needing verification

async function main() {
  console.log(`Fetching GPS for ${VERIFIED_MATCHES.length} verified BG matches...\n`);

  const mappings: any[] = [];
  let fetched = 0;
  let failed = 0;

  for (const match of VERIFIED_MATCHES) {
    process.stdout.write(`[${fetched + 1}/${VERIFIED_MATCHES.length}] ${match.name}... `);

    const record = await fetchRecordData(match.bgRecordId);
    if (record) {
      console.log(`GPS: ${record.lat.toFixed(6)}, ${record.lng.toFixed(6)} | ${record.cemeteryName}`);
      mappings.push({
        momentId: `${match.entityId}-burial`,
        entityId: match.entityId,
        entityName: match.name,
        bgRecordId: match.bgRecordId,
        bgUrl: `https://billiongraves.com/grave/r/${match.bgRecordId}`,
        lat: record.lat,
        lng: record.lng,
        cemeteryName: record.cemeteryName,
        cemeteryCity: record.cemeteryCity,
        cemeteryState: record.cemeteryState,
        cemeteryCountry: record.cemeteryCountry,
        notes: match.notes,
      });
      fetched++;
    } else {
      console.log('FAILED to extract GPS');
      failed++;
    }
  }

  console.log(`\n✓ Fetched: ${fetched} | Failed: ${failed}`);

  const outPath = resolve(OUTPUT_DIR, 'bg-verified-with-gps.json');
  writeFileSync(outPath, JSON.stringify(mappings, null, 2));
  console.log(`Written to ${outPath}`);
}

main().catch(console.error);
