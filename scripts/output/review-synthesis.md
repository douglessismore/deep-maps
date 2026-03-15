# Deep Maps — Review Synthesis (5 Reviewers)

## Reviewers
- **Jimmy Wales** (narrative council) — Encyclopedic neutrality, biblical tone
- **Edward Tufte** (narrative council) — Information density, five-second test
- **Gemini** (AI council) — Content structure, scaling readiness
- **ChatGPT** (AI council) — Schema architecture, narrative quality
- **DeepSeek** (AI council) — Spot-check accuracy, entity completeness

---

## VERDICT: What We Accept, Reject, and Question

### ACCEPT — Clear consensus, aligns with our standards

#### 1. Naming Fixes (5/5 agree)
~17 moments fail the five-second test. Fragment names without subjects are the worst offenders.

**Do now:**
| Current | Fix |
|---------|-----|
| "Stole the Picker C-3000" | "A Maintenance Worker Steals a Radioactive Cancer Machine for Scrap" |
| "The Junkyard Breach" | "A Junkyard Crushes a Therapy Machine, Releasing Radioactive Pellets" |
| "Sacked the Port" | "English Privateer Cavendish Sacks Huatulco" |
| "The Unbreakable Wood" | "Cavendish Fails to Destroy a Legendary Cross Despite Fire and Axes" |
| "The Green Flare Signal" | "A Helicopter Fires Green Flares Signaling the Tlatelolco Massacre" |
| "The Chihuahua Building" | "Snipers in the Chihuahua Building Fire on Students Below" |
| "The Lomas Taurinas Rally" | "Gunman Assassinates Presidential Candidate Colosio at a Rally" |
| "Battle of Miahuatlan" | "Díaz Defeats French and Imperial Troops at Miahuatlán" |
| "The House on Calle Margaritas" | "Police Find 17 Bodies Beneath a Suburban Kitchen Floor" |
| "The Lomas de San Miguel Market" | "A Serial Killer Allegedly Sells Victims' Flesh as Pork" |
| "The Search at Venustiano Carranza" | "Rescuers Hear a Trapped Child's Tapping — But Find Only Money" |
| "The Robot's Descent" | "A Robot Enters a 2,000-Year-Old Sealed Tunnel Beneath a Pyramid" |
| "The Lake of Liquid Metal" | "Archaeologists Find a Pool of Liquid Mercury Mimicking an Underworld Lake" |

Also fix O. Henry moments missing subjects (6 moments need "Porter" or "O. Henry" prepended).

#### 2. Tense Standardization (5/5 agree)
At least 9 moments use present tense. Standardize to past tense throughout.

**Do now:** Fix all flagged present-tense moments.

#### 3. Sacred Content Tone Calibration (Wales + Tufte + DeepSeek agree)
Current content is ~80% well-calibrated. The remaining 20% needs attribution added.

**Principle (ACCEPTED):** "Would a non-religious historian write this sentence? If not, attribute it."

**Specific fixes:**
| Current | Fix |
|---------|-----|
| "the heavens opened and the Spirit descended like a dove" | Add "According to the Gospels," prefix |
| "an angel said 'He is not here; he has risen'" | "According to the Gospels, an angel..." |
| "God Makes a Covenant with Abraham" (subtitle) | Attribution: "According to Genesis..." |
| Guadalupe: "an image That Science Cannot Explain" | → "an Image Appears on the Fabric" (let description discuss ambiguity) |
| Paul Rome subtitle: "the apostle who wrote that all roads lead to God..." | → "Where Paul spent two years preaching under house arrest" |
| Moses Meribah: "one of the Bible's most poignant moments" | → "one of the Bible's most discussed passages on disobedience" |

**Cross-tradition consistency (Wales):** Christian content treats God as active historical agent while Maya content treats Chaac as a belief artifact. Apply same "tradition holds" framing to ALL traditions.

#### 4. O. Henry Consolidation (Tufte + Gemini)
17 moments for O. Henry = more than Jesus (18). At least 5 moments are duplicated across 3 stories. This is the single largest content proportion problem.

**Do now:**
- Merge `o-henry-embezzlement` into `o-henry-life` (one life = one story)
- Remove all duplicated moments (keep the one with the best description)
- Reduce from 17+6 duplicated to ~12-14 unique moments
- Lower notability scores (a pharmacy apprenticeship is not notability 64)

#### 5. Subtitle Restatement Fixes (Tufte + Wales)
At least 6 subtitles merely restate the name. Violates content guide.

**Do now:** Fix Lincoln birth, JFK birth, MLK birth subtitles — add new information the name doesn't contain.

#### 6. Orphan Biblical Moments (Wales + internal audit)
8 standalone biblical events (Noah, Babel, Sodom, Jericho, Samson, Elijah, Jonah, Daniel) are in collections but not in any story.

**Do now:** Create a "Great Events of the Hebrew Bible" story to house these.

#### 7. Category Fixes (Tufte + Wales)
- Catholic Pilgrimage Sites → move to `sacred-history`
- Islamic Holy Cities → move to `sacred-history`
- Sacred Sites of Eastern Religions → move to `sacred-history`

#### 8. Fix Annunciation Date (Wales)
Moment "The Angel Gabriel Appears to Mary in Nazareth" has year `1969` (the basilica completion date), not the biblical event date (~4 BCE).

---

### ACCEPT WITH MODIFICATION — Good ideas, adapt to our standards

#### 9. Notability Score Recalibration (Tufte — STRONGEST finding)
Tufte found a systematic bias: local Austin/Texas moments scored too high, genuinely world-historical events scored too low.

**Critical examples:**
| Moment | Current | Should Be | Reasoning |
|--------|---------|-----------|-----------|
| Pickett's Charge at Gettysburg | 21 | 70+ | Turning point of American Civil War |
| Little Bighorn (Custer) | 21 | 65+ | Most famous battle in the Indian Wars |
| Dien Bien Phu | 21 | 60+ | Ended French colonialism in Asia |
| Isandlwana (Zulu) | 21 | 50+ | Iconic colonial-era battle |
| Roosevelt Menger Bar | 77 | 40-50 | A bar anecdote, not world-historical |
| Dennis Hopper in Taos | 67 | 35-45 | A celebrity moving to a town |
| Clyde Barrow burial | 64 | 30-40 | A burial |
| O. Henry pharmacy | 64 | 20-25 | A boy learning pharmacy |

**Note:** Scores 21 for the "Famous Battlefields" story are likely because these were added in a global-content batch where the scoring pipeline wasn't recalibrated. These need manual override. This is the #1 priority content fix — if Gettysburg shows at notability 21 while a ghost story shows at 77, the world-zoom is broken.

#### 10. Primary Moment Selection (Gemini + ChatGPT)
For biography stories, the most famous achievement should be the primary pin, not the birth. Currently the first chronological moment defaults to primary.

**Accept the principle.** But we don't have `isPrimary` in our schema yet. This is a Supabase-phase feature — add it to the migration plan. For now, the notability score already handles this (the most famous moment will have the highest score).

#### 11. "Tourism Coda" Pattern (Tufte)
~30-40 descriptions end with present-day tourism sentences that add nothing to historical information density. "The site is now a popular recreation area," etc.

**Accept with nuance:** For a MAP app, knowing "you can still visit this" IS relevant. But it should be the last sentence, not dominate the description. **Trim but don't eliminate.**

#### 12. Curated Lists → Collections (Tufte)
"History's Bravest," "Scientific Minds," "Revolutionary Leaders" are curated lists, not narrative stories. They should be collections.

**Accept as future work.** These already exist as both stories AND collections (known duplication from session notes). The panel architecture needs to support collection-only moments first. Queue for Supabase phase.

---

### REJECT — Doesn't align with our standards or adds unnecessary complexity

#### 13. ❌ Gemini's "Goosebumps" / "Human Soul" / "Madness Test" framing
Gemini wants more emotional, magazine-style writing. **This directly contradicts our north star.** Our content guide says: encyclopedic, information-dense, Wikipedia-style clarity. Jimmy Wales is our tone model, not BuzzFeed. The content is not supposed to give "goosebumps" — it's supposed to inform with clarity and precision.

**Reject.** Our best content already has emotional power BECAUSE it's factual and dense, not despite it.

#### 14. ❌ ChatGPT's wonderScore / visualScore / locationPrecision fields
These are premature optimization. We don't need 3 new metadata fields before we've even migrated to Supabase. Notability score + kind + category already handles filtering. Adding fields we can't populate or use yet is bloat.

**Reject for now.** Revisit post-Supabase if we actually need them for filtering/ranking.

#### 15. ❌ Gemini's "Score Jitter" for identical notability scores
Adding ±1 random jitter to prevent "pop-in" at identical scores. This is solving a problem we don't have — the fractal zoom already uses notability thresholds per zoom level, not exact-score matching. Jitter would make scores meaningless.

**Reject.**

#### 16. ❌ Gemini's "Michael Barnes" source tagging
This references a "Mentor Layer" that doesn't exist. Adding `source: "michael-barnes"` tags to moments is not part of our architecture.

**Reject.**

#### 17. ❌ ChatGPT's "Never expose scores to users"
We already don't expose scores to users. The scores are internal ranking only. This is advice for a problem we already solved.

**Noted, no action needed.**

#### 18. ❌ Gemini's Capernaum → "Jesus Calls First Disciples" rename
Gemini says "Jesus Makes Capernaum His Base for Ministry" is a "presence" not a "moment." But we have a `kind: presence` field specifically for ongoing-location moments. Capernaum WAS his base — that's the geographically accurate moment. Inventing a specific event is less accurate than describing the ongoing presence.

**Reject.** The `kind` field already handles this distinction.

#### 19. ❌ Gemini's "trim astronomical degrees, focus on feeling"
For Chichen Itza shadow serpent: "Focus on the feeling of 35,000 people gasping." This is magazine writing, not encyclopedic description. We describe the phenomenon; the reader supplies the feeling.

**Reject.**

---

### QUESTION — Need user input

#### 20. DeepSeek's "Add victim names for crime moments"
"Include victims' names where appropriate. It's a small act of humanity." This is a philosophical question about the purpose of the content.

**For user to decide:** Do we name Zodiac victims (Cecilia Shepard, Bryan Hartnell) in moment descriptions? Naming victims personalizes the history but also risks the map feeling like a true-crime database. Our current approach focuses on the perpetrator/event.

#### 21. Tufte's "Expand thin stories" (Geronimo, Pueblo Revolt)
"The Pueblo Revolt is the most successful Native uprising in North American history and gets ONE moment?" — Tufte is right that this is thin. But expanding means writing new content.

**For user to decide:** Do we prioritize expanding thin stories (Geronimo, Pueblo Revolt, Pancho Villa) in this checkpoint, or save for the next content sprint?

#### 22. DeepSeek's "Expand entity coverage"
D-Day only links to Churchill, not Eisenhower/Bradley/Rommel. Zodiac doesn't name victims in entities. Biblical moments don't include Pilate, Herod, Caiaphas.

**For user to decide:** How aggressively do we expand the entity graph before Supabase? Each entity needs a description, canonicalStoryId, etc.

---

## Implementation Priority Order

```
CRITICAL (do before any deploy):
  1. Fix notability scores for Famous Battlefields etc. (21 → 60-70+)
  2. Fix ~17 fragment moment names (verb-first with subjects)
  3. Fix ~9 present-tense moments
  4. Fix Annunciation date (1969 → ~4 BCE)

HIGH (do this session):
  5. Sacred tone attribution pass (~10 moments)
  6. Fix 6 subtitle restatements
  7. O. Henry consolidation (deduplicate, merge stories)
  8. Move 3 pilgrimage stories to sacred-history category
  9. Create "Great Events of the Hebrew Bible" story for 8 orphans

MEDIUM (do next session):
  10. Lower inflated Texas/Austin notability scores
  11. Trim tourism codas in ~30 descriptions
  12. Expand Geronimo, Pueblo Revolt (if user approves)
  13. Entity graph expansion (if user approves)

DEFERRED TO SUPABASE:
  14. isPrimary moment selection
  15. Curated-list stories → collections migration
  16. Additional metadata fields (if ever needed)
```
