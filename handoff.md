# Deep Maps — Session Handoff

**Last updated:** 2026-03-20 (Session 58 — mobile UX variant system, bug fixes, expert council review)
**Branch:** `main`

---

## Bug Tracker

### ✅ Resolved (Session 58)
- **BUG-5: Missing DIVE DEEPER on biographies** — Root cause: canonical story filter removed ALL related stories on biographies like O. Henry. Fix: stopped filtering canonical stories from connectedEntries in StoryPanel.
- **BUG-6: Tab switch resets scroll** — Root cause: header + tab bar were inside the scroll container, so tab switches disrupted scroll position. Fix: moved header and tab bar outside scroll container in EntityPanel.
- **Scroll cutoff at bottom of lists** — Root cause: BottomSheet content area extended below viewport (sheet is 100dvh but translated down). Fix: explicit `visibleContentHeight` computed from currentSnap. Also reduced mobile spacers from 40vh to pb-24.
- **Excess black space at bottom of lists** — Root cause: 40vh spacers designed for desktop were too large for mobile's smaller visible area. Fix: responsive spacers (pb-24 mobile, 40vh desktop).

### ✅ Resolved (Sessions 56-57)
- **Bottom sheet auto-expands on navigation/scroll** — Fix: `fixed inset-0` with `height: 100dvh`.
- **Vercel deploy failures** — Fix: explicit file list in `.vercelignore`.
- **Active pin hidden behind bottom sheet** — Fix: `panToAboveSheet` with project/unproject offset.
- **Map marker clicks not working on mobile** — Fix: `tolerance: 16` on canvas renderer.
- **Moment expansion finicky (BUG-3)** — Fix: removed expansion entirely, always-collapsed with description preview.
- **Scroll-driven map panning blocked** — Fix: isProgrammaticMove flag + 4s cooldown.
- **Default sheet at peek** — Sheet starts at 260px (peek).

### 🟡 Potential Issues (Monitoring)
- **Map panning snap-back** — Improved with 4s cooldown + instant snap. Not reported recently.
- **Compact card density on mobile** — User flagged moment cards as "busy" even in compact mode. Park for future session.

### 🟡 Open Issues (Non-Bug)
- **Co-located moments (Texas State Cemetery)** — Content issue, convert to place entity.
- **Trump notability ranking** — Scoring issue.
- **188 descriptions over 500 chars** — Trimming pass needed.
- **Scroll-driven zoom** — User wants it eventually but all implementations too laggy. Parked. User's latest idea: idle-triggered slow zoom (zoom in after 1.5-2s pause, zoom back out on scroll). Better concept than scroll-driven.
- **BUG-4: Entity sub-tab inconsistency** — Low priority, data-driven.

---

## UI Variant System (NEW — Session 58)

### Toggle
Floating pill button top-right on mobile. Tap to cycle variants. Persists in localStorage.

### Variants
| Variant | Key | Description |
|---------|-----|-------------|
| **Current** | A | 3 snaps (peek/half/full), compact cards on mobile. Today's default. |
| **Spotlight** | B | Expert council's top pick. 2 snaps (peek/full). Peek = single "now playing" card. Contextual drag handle (story name + progress). Tap card → expand to full. |
| **Split** | C | Mia Chen's idea. Persistent map (top 40%) + panel below (60%). No sheet overlay. Map always visible. |
| **Claude** | D | Map-first HUD. Translucent card overlay (30%/60%/85%). Progress dots. Floating context pill at top. Map always visible through backdrop blur. |
| **Cinema** | E | Ultra-minimal. 80px translucent banner at bottom with moment name. Tap to expand. Maximum map immersion. Progress bar instead of dots. |

### Key Files
- `src/lib/uiVariant.tsx` — Context + provider + localStorage persistence
- `src/components/ui/VariantToggle.tsx` — Floating cycle button
- `src/components/ui/BottomSheet.tsx` — Handles Current + Spotlight variants
- `src/components/ui/ClaudeSheet.tsx` — Claude variant
- `src/components/ui/CinemaSheet.tsx` — Cinema variant
- `src/App.tsx` — Variant-aware layout switching (split layout vs overlay variants)

### Expert Council Feedback (Session 58)
**Council 1 (Wales, Jobs, Tufte):** Kill half snap. Peek is information dead zone. Compact cards too compact — stripped the value. Tab proliferation across panels. Map-content relationship invisible.

**Council 2 (Spradlin, Chen, Wroblewski):** Sheet solving wrong problem. Half snap fights the map. No peek-to-detail interaction. Drag handle wastes 48px. 8px drag threshold too low.

**Top 3 unified recommendations:**
1. Kill half snap, make peek a single-card spotlight
2. Make map-to-content connection visible (pin pulse, path lines, connector animation)
3. Put drag handle to work (contextual info instead of cosmetic pill)

---

## Content Changes (Session 58)
- Renamed "The Booker T. Washington Snub" → "Booker T. Washington Denied the Texas Capitol"

---

## Current State

### Database
- **304 entities**, **293 stories**, **1,260 moments**, **219 images**, **30 collections**
- **~124/507** planned people fully imported (≥4 moments)
- Pipeline offset: **152** (people 1-152 processed across runs 1-15)

### What Shipped (Session 58)
1. **UI variant toggle system** — 5 mobile layout variants behind a floating toggle
2. **Compact card mode** — Dense 2-line rows on mobile (name + subtitle), rich cards on desktop
3. **BottomSheet scroll cutoff fix** — visibleContentHeight computed from snap position
4. **Tab scroll reset fix** — Header/tab bar moved outside scroll container
5. **Dive Deeper fix** — Canonical story filter relaxed to show related stories
6. **Expert + UI/UX council review** — Detailed feedback from 6 personas
7. **Responsive bottom spacers** — pb-24 mobile, 40vh desktop

### What Shipped (Session 57)
- Moment expansion removal, sheet auto-expand on navigation, peek height 260px, instant scroll-driven pan, panToAboveSheet offset fix, isProgrammaticMove flag

---

## Key Decisions Made

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| UI comparison approach | Live toggle with 5 variants | Static mockups | Need to feel interactions — drag, scroll, map panning. Mockups can't show this. |
| Compact cards | Dense 2-line rows on mobile | Always rich cards | ~4x more cards visible at peek. But user flagged as "busy" — revisit card design. |
| Bottom sheet content sizing | Explicit visibleContentHeight from snap | flex-1 (fills 100dvh) | flex-1 extends below viewport causing scroll cutoff. Explicit height = correct scroll bounds. |
| Tab scroll preservation | Header/tabs outside scroll container | Save/restore scrollTop with double-rAF | Structural fix > timing hack. Tabs outside scroll means content swap doesn't affect position. |
| Dive Deeper canonical filter | Show canonical stories in related | Filter them out | Filtering left Dive Deeper empty on biographies where all related stories are canonical. |

---

## Immediate Next Steps

### Priority 1 — UI Variant Evaluation
1. ⬜ **User tests all 5 variants on mobile** — identify favorite(s)
2. ⬜ **Refine winning variant(s)** — polish based on feedback
3. ⬜ **Remove toggle, commit to final design** — or keep 2-3 options

### Priority 2 — Content & Data
4. ⬜ **V3 rewrite cleanup** — trim 188 descriptions over 500 chars
5. ⬜ **Apply v3 rewrites to database**
6. ⬜ **32 place→entity conversions**
7. ⬜ **Continue people pipeline** — offset 153

### Priority 3 — Future UX
8. ⬜ **Map-to-content connection** — pin pulse, path lines (council recommendation #2)
9. ⬜ **Idle zoom** — slow zoom-in after 1.5s pause on a moment (user's latest idea)
10. ⬜ **Reduce ExplorePanel tabs** — 4 tabs → 2 ("Nearby" + "Collections")

---

## Expert Council

### Original
- **Jimmy Wales** (encyclopedic clarity)
- **Steve Jobs** (design simplicity)
- **Edward Tufte** (data visualization)

### UI/UX Council (Session 58)
- **Liam Spradlin** archetype (Google Maps mobile UX)
- **Mia Chen** archetype (Mapbox cartographic storytelling)
- **Luke Wroblewski** archetype (mobile-first touch interaction)

---

## Common Commands

```bash
# Dev server
cd deep-maps && npx vite --host --port 5178

# Static file server (for tracker/dashboard)
cd deep-maps && python3 -m http.server 8896

# Pipeline — subagent mode
npx tsx scripts/ingest/notable-people-local.ts --phase prep --offset 153 --limit 25
npx tsx scripts/ingest/notable-people-local.ts --phase assemble --batch <batch-id>

# Audit
npx tsx scripts/audit-wiring.ts

# Regenerate dashboards
npx tsx scripts/generate-tracker.ts
npx tsx scripts/generate-dashboard.ts
```

---

## Architecture Reference

| File | Role |
|------|------|
| `src/App.tsx` | Main layout — variant-aware map/panel split, routing, mode system |
| `src/lib/uiVariant.tsx` | UI variant context (current/spotlight/split/claude/cinema) |
| `src/lib/data/provider.tsx` | DataProvider — TanStack Query + Context + loading screen |
| `src/components/ui/BottomSheet.tsx` | Mobile bottom sheet — Current + Spotlight variants |
| `src/components/ui/ClaudeSheet.tsx` | Claude variant — translucent HUD with progress dots |
| `src/components/ui/CinemaSheet.tsx` | Cinema variant — minimal banner |
| `src/components/ui/VariantToggle.tsx` | Floating variant cycle button |
| `src/components/panel/ExplorePanel.tsx` | Panel with hybrid nearest/notable sort |
| `src/components/map/EmergenceLayer.tsx` | Canvas-based moment renderer (tolerance:16) |
| `src/lib/sheetAwareMap.ts` | Sheet-aware map panning — panToAboveSheet |
