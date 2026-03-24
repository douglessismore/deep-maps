import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
);

async function main() {
  // Get all pipeline moments with descriptions over 700 chars
  const { data: moments } = await sb
    .from('moments')
    .select('id, name, description')
    .eq('source', 'notable-people');

  const long = (moments || []).filter(m => m.description.length > 700);
  console.log(`Found ${long.length} moments with descriptions > 700 chars:\n`);

  for (const m of long) {
    console.log(`${m.id}: ${m.description.length} chars`);
    console.log(`  "${m.name}"`);
    console.log(`  ${m.description}\n`);
  }
}

main();
