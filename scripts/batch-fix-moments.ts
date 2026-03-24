#!/usr/bin/env npx tsx
/**
 * Deep Maps — Batch Moment Name/Subtitle Fix
 *
 * Applies approved content quality fixes to moment names and subtitles.
 * Updates both Supabase (live) and reports results.
 *
 * Usage:
 *   npx tsx scripts/batch-fix-moments.ts              # dry run
 *   npx tsx scripts/batch-fix-moments.ts --execute     # apply changes
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const DRY_RUN = !process.argv.includes('--execute');

interface Fix {
  id: string;
  name?: string;
  subtitle?: string;
}

const FIXES: Fix[] = [
  // ── BAD: Fundamentally broken ──
  { id: 'rp-arrest-site', name: "Rosa Parks Refuses to Give Up Her Bus Seat at the Empire Theatre Stop" },
  { id: 'btw-white-house-dinner', name: "Booker T. Washington Dines with President Roosevelt at the White House" },
  { id: 'btw-tuskegee-founding', name: "Booker T. Washington Founds the Tuskegee Institute in a Converted Church" },
  { id: 'btw-virginia-birth', name: "Booker T. Washington Is Born into Slavery on a Virginia Tobacco Plantation" },
  { id: 'ohenry-chelsea-hotel', name: "William Sydney Porter Checks Into the Hotel Chelsea in Declining Health" },
  { id: 'ohenry-federal-trial', name: "William Sydney Porter Is Convicted of Embezzlement in Federal Court" },
  { id: 'ohenry-irving-place', name: "O. Henry Writes His New York Stories from an Irving Place Apartment" },
  { id: 'willie-dripping-picnic', name: "Willie Nelson Hosts the First Fourth of July Picnic in Dripping Springs" },
  { id: 'willie-abbott-birth', name: "Willie Nelson Is Born in a Two-Room House on First Street in Abbott, Texas", subtitle: "Raised by grandparents in a farming community, he writes his first song at age seven" },

  // ── Missing subject ──
  { id: 'ohenry-marriage-athol', name: "William Sydney Porter Elopes with Athol Estes Despite Her Mother's Opposition" },
  { id: 'ohenry-furnished-room', name: "O. Henry Writes 'The Furnished Room' in a Chelsea Boarding House" },
  { id: 'ohenry-second-marriage', name: "O. Henry Marries Childhood Sweetheart Sara Coleman in Asheville" },
  { id: 'ohenry-petes-tavern', name: "O. Henry Drafts 'The Gift of the Magi' at Pete's Tavern" },
  { id: 'ohenry-rolling-stone', name: "William Sydney Porter Launches 'The Rolling Stone' Humor Weekly in Austin" },
  { id: 'ohenry-greensboro-birth', name: "William Sydney Porter Is Orphaned at Three and Apprentices as a Pharmacist in Greensboro" },
  { id: 'btw-hampton-entrance', name: "Booker T. Washington Travels to Hampton Institute and Earns Admission", subtitle: "Asked to sweep a classroom as his entrance exam, he cleans it until a white handkerchief finds no dust" },
  { id: 'btw-atlanta-compromise', name: "Booker T. Washington Delivers the Atlanta Compromise Speech to a Biracial Audience" },

  // ── Place-name / noun-phrase titles ──
  { id: 'cemetery-stephen-austin', name: "Stephen F. Austin Is Reburied at the Texas State Cemetery" },
  { id: 'dtm-warhead-impact', name: "The Titan II Explosion Ejects a Nine-Megaton Warhead Into a Ditch — It Does Not Detonate" },
  { id: 'manicouagan-crater', name: "An Asteroid Carves a 100-Kilometer Crater into Quebec That Remains Visible from Space" },
  { id: 'palace-santa-fe', name: "Spanish Colonists Build the Palace of the Governors — the Oldest Public Building in America" },
  { id: 'tomb-7-museum', name: "Oaxaca's Regional Museum Installs the Mixtec Gold Treasures from Tomb 7" },

  // ── Sensationalized / non-encyclopedic ──
  { id: 'ala-long-barrack', name: "Mexican Troops Storm the Long Barrack in Room-to-Room Combat" },
  { id: 'frida-bus-accident', name: "A Bus Crash Leaves Eighteen-Year-Old Frida Kahlo Bedridden for a Year" },
  { id: 'gein-cemetery', name: "Ed Gein Robs Graves at Plainfield Cemetery, Guided by Local Obituaries" },

  // ── Ongoing activity → specific event ──
  { id: 'queen-milam-park', name: "Chile Queens Set Up Open-Air Kitchens in Milam Park After the Civil War" },
  { id: 'queen-military-plaza', name: "Chile Queens on Military Plaza Turn San Antonio Into the Chili Capital of America" },
  { id: 'varanasi-ganges', name: "Hindu Pilgrims Begin Cremating the Dead on the Ganges at Varanasi's Manikarnika Ghat" },
  { id: 'vla-site', name: "A Grid of 27 Radio Telescopes Begins Scanning the Sky from the New Mexico Desert" },
  { id: 'hopper-taos', name: "Dennis Hopper Buys the Mabel Dodge Luhan House in Taos After Easy Rider" },
  { id: 'dahmer-chocolate-factory', name: "Dahmer Takes a Night-Shift Job at the Ambrosia Chocolate Factory" },
  { id: 'scholz-longhorn-tradition', name: "Scholz Garden Opens in 1866 as Austin's First Beer Garden" },
  { id: 'spoke-survival-battle', name: "James White Refuses Every Buyout Offer as Condos Surround the Broken Spoke" },
  { id: 'victory-doris-miller', name: "The Doris Miller Auditorium Opens as East Austin's Premier Black Entertainment Venue" },

  // ── Demographic-first framing ──
  { id: 'victoria-crowned', name: "Victoria Is Crowned Queen at Westminster Abbey at Eighteen" },
  { id: 'gein-school', name: "Ed Gein's Mother Raises Him in Near-Total Isolation on a Rural Wisconsin Farm" },

  // ── "King" ambiguity, weak verbs ──
  { id: 'mlk-lorraine-motel', name: "Martin Luther King Jr. Is Shot on the Balcony of the Lorraine Motel" },
  { id: 'mlk-morehouse', name: "Martin Luther King Jr. Enters Morehouse College at Age 15" },
  { id: 'mlk-dexter-church', name: "Martin Luther King Jr. Begins His First Pastorate at Dexter Avenue Baptist Church" },
  { id: 'jfk-choate', name: "John F. Kennedy Enrolls at Choate Preparatory School" },
  { id: 'dtm-little-rock-afb', name: "Little Rock Air Force Base Coordinates Evacuation After a Titan II Missile Accident" },
  { id: 'tri-ground-zero', name: "The First Nuclear Bomb Detonates at 21 Kilotons, Fusing Desert Sand to Glass" },
  { id: 'okeeffe-abiquiu', name: "Georgia O'Keeffe Buys the Abiquiu Adobe and Makes It Her Permanent Home" },
  { id: 'okeeffe-ghost-ranch', name: "Georgia O'Keeffe Buys Ghost Ranch and Begins Painting the Red Cliffs of Piedra Lumbre" },

  // ── Subtitle-only fixes ──
  { id: 'ae-harbour-grace', subtitle: "Where Earhart departed for her 1932 solo transatlantic crossing" },
  { id: 'earhart-disappears', subtitle: "Earhart sends her last radio transmission over the Pacific and is never seen again" },
  { id: 'adel-gruene-hall', subtitle: "Built in 1878, it still hosts live music seven nights a week" },
  { id: 'bonnell-summit', subtitle: "The cliff has been the subject of Lover's Leap legends since the 1850s" },
  { id: 'palo-tule-canyon', subtitle: "Without their horse herds, the Comanche, Kiowa, and Southern Cheyenne have no choice but to surrender" },
  { id: 'colosio-lomas-taurinas', subtitle: "The PRI's presidential frontrunner is shot point-blank during a campaign walkabout in Tijuana" },
  { id: 'twa-calverton', subtitle: "NTSB reconstructs 95% of the fuselage in a Calverton hangar to isolate the fuel tank failure" },
  { id: 'ae-lae-airfield', subtitle: "Earhart and Noonan depart Papua New Guinea for the 2,556-mile leg to Howland Island" },
  { id: 'ae-howland-island', subtitle: "Her last radio transmission fades at 8:43 AM; no wreckage has ever been confirmed" },
  { id: 'cobalt-medical-theft', subtitle: "The stolen cobalt-60 source contaminates an entire neighborhood and kills four people" },
  { id: 'salt-lake-deposits', subtitle: "Mexican-American and Tejano families had harvested communal salt here for generations" },
  { id: 'salt-plaza-siege', subtitle: "The only time in history the Texas Rangers surrendered to civilians" },
];

async function main() {
  console.log(`\n📝 Batch Moment Fix ${DRY_RUN ? '(DRY RUN)' : '(EXECUTING)'}`);
  console.log('─'.repeat(60));
  console.log(`Fixes to apply: ${FIXES.length}\n`);

  let success = 0;
  let failed = 0;
  let notFound = 0;

  for (const fix of FIXES) {
    const update: Record<string, string> = {};
    if (fix.name) update.name = fix.name;
    if (fix.subtitle) update.subtitle = fix.subtitle;

    if (DRY_RUN) {
      console.log(`  📋 ${fix.id}`);
      if (fix.name) console.log(`     name → "${fix.name}"`);
      if (fix.subtitle) console.log(`     sub  → "${fix.subtitle}"`);
      success++;
      continue;
    }

    const { data, error } = await sb
      .from('moments')
      .update(update)
      .eq('id', fix.id)
      .select('id,name');

    if (error) {
      console.log(`  ❌ ${fix.id}: ${error.message}`);
      failed++;
    } else if (!data || data.length === 0) {
      console.log(`  ⚠️  ${fix.id}: not found in database`);
      notFound++;
    } else {
      console.log(`  ✅ ${fix.id}`);
      success++;
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`✅ Success: ${success}  ❌ Failed: ${failed}  ⚠️  Not found: ${notFound}`);
  if (DRY_RUN) console.log(`\n⏸️  DRY RUN — run with --execute to apply.`);
}

main().catch(console.error);
