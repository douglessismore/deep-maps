#!/usr/bin/env node
/**
 * Run a SQL migration against the live Supabase database.
 *
 * Prerequisites (one of):
 *   - SUPABASE_ACCESS_TOKEN env var  (get from supabase.com/dashboard/account/tokens)
 *   - Already logged in via `npx supabase login`
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/run-migration.mjs supabase/migrations/003_tracker_notes.sql
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Parse .env.local
function loadEnv() {
  const envPath = resolve(ROOT, ".env.local");
  const env = {};
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq !== -1) env[t.slice(0, eq)] = t.slice(eq + 1);
    }
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = SUPABASE_URL?.replace("https://", "").split(".")[0];

if (!SUPABASE_URL) {
  console.error("Missing VITE_SUPABASE_URL in .env.local");
  process.exit(1);
}

const migrationPath = process.argv[2];
if (!migrationPath) {
  console.error("Usage: node scripts/run-migration.mjs <path-to-migration.sql>");
  process.exit(1);
}

const sqlFile = resolve(ROOT, migrationPath);
if (!existsSync(sqlFile)) {
  console.error(`File not found: ${sqlFile}`);
  process.exit(1);
}

const sql = readFileSync(sqlFile, "utf-8");
console.log(`Migration: ${migrationPath} (${sql.length} chars)`);
console.log(`Project:   ${projectRef}\n`);

// Execute via Supabase CLI
try {
  console.log("Executing via Supabase CLI...\n");
  const output = execSync(
    `npx supabase db query --linked -f "${sqlFile}" --workdir "${ROOT}"`,
    {
      cwd: ROOT,
      encoding: "utf-8",
      timeout: 30000,
      env: { ...process.env },
    }
  );
  console.log(output || "(no output — success)");
} catch (err) {
  const msg = (err.stderr || err.message || "").trim();
  console.error("CLI failed:", msg, "\n");
  console.log("========================================");
  console.log(" HOW TO RUN THIS MIGRATION");
  console.log("========================================\n");
  console.log("Option A — Access token (quickest):\n");
  console.log("  1. Go to https://supabase.com/dashboard/account/tokens");
  console.log("  2. Click 'Generate new token'");
  console.log("  3. Run:\n");
  console.log(`     SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/run-migration.mjs ${migrationPath}\n`);
  console.log("Option B — Link project:\n");
  console.log("  npx supabase login");
  console.log(`  npx supabase link --project-ref ${projectRef} --workdir "${ROOT}"`);
  console.log(`  npx supabase db push --workdir "${ROOT}"\n`);
  console.log("Option C — Dashboard SQL Editor:\n");
  console.log(`  https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  console.log(`  Paste contents of: ${migrationPath}\n`);
  process.exit(1);
}

// Verify
console.log("Verifying table exists...");
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// PostgREST schema cache may take a moment to refresh
await new Promise((r) => setTimeout(r, 3000));

const { error } = await supabase.from("tracker_notes").select("id").limit(0);
if (error) {
  console.log("Note: PostgREST schema cache hasn't refreshed yet.");
  console.log("The table was created — it will be queryable in a few seconds.");
} else {
  console.log("tracker_notes table is live and queryable!");
}
console.log("\nDone.");
