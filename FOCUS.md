# THIS WEEK — Phase 1 Execution

> Everything below this line is what matters. Everything else is noise.
> When you finish all items, come back and update this file.

---

## 0. Fix bugs that will derail user testing

> These are the ones testers WILL hit and WILL complain about.
> Skip everything else — edge cases and polish can wait.

**P0 — Will confuse/frustrate every tester:**
- [x] ~~**Arrow click → label disappears instead of opening panel**~~ — FIXED (scroll overlay + click handler rework)
- [x] ~~**Corner label when scrolling person moments**~~ — FIXED (label now always centered below dot)
- [x] ~~**Gray markers for wrong person after arrow click**~~ — FIXED (scroll lock + opacity improvements)

**P1 — Likely to hit, worth fixing if time allows:**
- [x] ~~**Category filter doesn't filter backfill people**~~ — FIXED
- [x] ~~**First person card can't be highlighted**~~ — FIXED
- [ ] **Labels hiding their markers** — LBJ label covers the marker dot.
- [ ] **Downtown Austin shows only 3 moments** — `viewportLocations` may not update after flyTo. Bad look if testers are in Austin.

**P2 — Won't hit in 10 minutes of testing (skip for now):**
- ~~Armstrong/stuck-story bug~~ — rare
- ~~Moment click zoom inconsistency~~ — minor
- ~~Static map on scroll~~ — attempted 4x, don't touch
- ~~Markers dim on load then fill in~~ — cosmetic, fast
- ~~Sort toggle appears intermittently~~ — edge case
- ~~SRV single-moment jitter~~ — one story
- ~~Polyline overshoot~~ — cosmetic

---

## 1. Watch 3 people use Deep Maps (10 min each, no helping)
- [ ] Person 1: _____ — Did they find entity graph? Where did they stop?
- [ ] Person 2: _____ — Did they hit Surprise Me? Did they explore beyond first card?
- [ ] Person 3: _____ — Did they follow a person from one event to another?

## 2. Add Plausible analytics
- [ ] Sign up at plausible.io (free trial or $9/mo)
- [ ] Add script tag to index.html
- [ ] Deploy to Vercel

## 3. Post first viral collection
- [ ] Pick collection (Serial Killer Crime Scenes recommended)
- [ ] Write Reddit post for r/TrueCrime ("I mapped every serial killer crime scene in America")
- [ ] Post it. Don't overthink it.

---

**NOT this week:** Audio, walking tours, subscriptions, new content, new features, admin panel improvements, dashboard, AR, community verification, Tour Guide Mode. All of that is Phase 2+.

**Source of truth for all bugs:** `handoff.md` → "Open Issues" section (Session 18)
