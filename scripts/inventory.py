#!/usr/bin/env python3
"""
Deep Maps — Story & Moment Inventory Generator

Parses stories.ts (TypeScript) as text and produces a comprehensive
inventory report in Markdown.
"""
from __future__ import annotations

import re
import sys
from collections import defaultdict
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent
STORIES_FILE = SCRIPT_DIR.parent / "src" / "data" / "stories.ts"
REPORT_FILE = SCRIPT_DIR / "inventory-report.md"

# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

def extract_string_field(block: str, field: str) -> str | None:
    """Extract a string field value like `field: 'value'` or `field: "value"`.
    Handles escaped quotes inside the value."""
    # Try single-quoted first
    pattern_sq = rf"""{field}:\s*'((?:[^'\\]|\\.|'(?=\s))*?)'"""
    m = re.search(pattern_sq, block, re.DOTALL)
    if m:
        return m.group(1).replace("\\'", "'").replace("\\n", "\n")
    # Try double-quoted
    pattern_dq = rf'{field}:\s*"((?:[^"\\]|\\.)*?)"'
    m = re.search(pattern_dq, block, re.DOTALL)
    if m:
        return m.group(1).replace('\\"', '"').replace("\\n", "\n")
    return None


def extract_number_field(block: str, field: str) -> float | None:
    pattern = rf"{field}:\s*(-?[\d.]+)"
    m = re.search(pattern, block)
    if m:
        return float(m.group(1))
    return None


def extract_string_array(block: str, field: str) -> list[str]:
    """Extract an array of strings like tags: ['a', 'b', 'c']."""
    pattern = rf"{field}:\s*\[(.*?)\]"
    m = re.search(pattern, block, re.DOTALL)
    if not m:
        return []
    inner = m.group(1)
    return re.findall(r"'([^']*)'|\"([^\"]*)\"", inner)


# ---------------------------------------------------------------------------
# Main parser
# ---------------------------------------------------------------------------

def parse_stories(filepath: Path) -> list[dict]:
    """Parse stories.ts into a list of story dicts with embedded locations."""
    text = filepath.read_text(encoding="utf-8")

    # Remove the import line and export wrapper
    # Find the opening bracket of the array
    arr_start = text.index("export const stories: Story[] = [") + len("export const stories: Story[] = [")
    arr_end = text.rindex("];")
    body = text[arr_start:arr_end]

    stories = []

    # Split into top-level story objects by finding `  {` patterns at indent=2
    # Each story block starts with `  {` (exactly 2 spaces + brace) and its
    # `id:` field is at 4-space indent.
    # We'll use a brace-counting approach.

    story_blocks = _split_top_level_objects(body)

    for block in story_blocks:
        story = _parse_story_block(block)
        if story:
            stories.append(story)

    return stories


def _split_top_level_objects(body: str) -> list[str]:
    """Split the array body into individual top-level object strings."""
    blocks = []
    depth = 0
    current_start = None

    for i, ch in enumerate(body):
        if ch == '{':
            if depth == 0:
                current_start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and current_start is not None:
                blocks.append(body[current_start:i + 1])
                current_start = None

    return blocks


def _parse_story_block(block: str) -> dict | None:
    """Parse a single story block into a dict."""
    story_id = extract_string_field(block, "id")
    if not story_id:
        return None

    # Extract the locations array portion
    loc_match = re.search(r"locations:\s*\[", block)
    if loc_match:
        loc_start = loc_match.end()
        # Find the matching ]
        depth = 1
        i = loc_start
        while i < len(block) and depth > 0:
            if block[i] == '[':
                depth += 1
            elif block[i] == ']':
                depth -= 1
            i += 1
        locations_body = block[loc_start:i - 1]
        # The part of the block BEFORE the locations array for story-level fields
        story_header = block[:loc_match.start()]
    else:
        locations_body = ""
        story_header = block

    name = extract_string_field(block, "name")
    nickname = extract_string_field(block, "nickname")
    years = extract_string_field(block, "years")
    category = extract_string_field(block, "category")
    description = extract_string_field(block, "description")

    # Parse locations
    location_blocks = _split_top_level_objects(locations_body)
    locations = []
    for lb in location_blocks:
        loc = _parse_location_block(lb)
        if loc:
            locations.append(loc)

    return {
        "id": story_id,
        "name": name or "",
        "nickname": nickname,
        "years": years or "",
        "category": category or "",
        "description": description or "",
        "locations": locations,
    }


def _parse_location_block(block: str) -> dict | None:
    loc_id = extract_string_field(block, "id")
    if not loc_id:
        return None

    return {
        "id": loc_id,
        "name": extract_string_field(block, "name") or "",
        "subtitle": extract_string_field(block, "subtitle") or "",
        "description": extract_string_field(block, "description") or "",
        "lat": extract_number_field(block, "lat"),
        "lng": extract_number_field(block, "lng"),
        "type": extract_string_field(block, "type") or "",
        "importance": extract_string_field(block, "importance") or "",
        "accuracy": extract_string_field(block, "accuracy") or "",
        "year": extract_number_field(block, "year"),
        "address": extract_string_field(block, "address"),
    }


# ---------------------------------------------------------------------------
# Analysis helpers
# ---------------------------------------------------------------------------

def infer_story_type(story: dict) -> str:
    """Classify story as biography / place / incident.

    Heuristics:
      biography — about a person's life arc.  Strong signals: ID contains
        "life", years span > 15 years, name looks like a personal name
        (1–4 words, no "The", no place/event words), description mentions
        "born" near the start.
      place — about a specific venue/landmark.  Strong signal: all moments
        cluster within ~0.01 degrees, or the single-moment story's ID or
        name matches a known place-name pattern.
      incident — everything else (events, disasters, mysteries, etc.)
    """
    sid = story["id"].lower()
    name = story["name"].lower()
    original_name = story["name"]
    years = story["years"]
    desc = story["description"].lower()
    locs = story["locations"]

    # --- Place heuristics (check first) ---
    # If all moments cluster tightly, it's about a single place.
    if len(locs) >= 2:
        coords = [(l["lat"], l["lng"]) for l in locs if l["lat"] and l["lng"]]
        if coords:
            avg_lat = sum(c[0] for c in coords) / len(coords)
            avg_lng = sum(c[1] for c in coords) / len(coords)
            max_dist = max(
                abs(c[0] - avg_lat) + abs(c[1] - avg_lng) for c in coords
            )
            if max_dist < 0.01:
                return "place"

    # Single-moment stories whose name is clearly a place
    place_name_words = {
        "garden", "gardens", "ranch", "hotel", "house", "grill", "bar",
        "tavern", "saloon", "cafe", "museum", "theater", "theatre",
        "cemetery", "plaza", "square", "park", "bridge", "dam", "fort",
        "prison", "jail", "school", "university", "college", "hospital",
        "courthouse", "headquarters", "factory", "church", "cathedral",
        "stadium", "arena", "auditorium", "tunnel", "tunnels", "canyon",
        "caverns", "springs", "creek", "river", "lake", "mountain",
        "island", "array", "studios", "studio",
    }
    if len(locs) == 1 and any(w in place_name_words for w in name.split()):
        return "place"

    # --- Biography heuristics ---
    years_span = _parse_year_span(years)
    long_span = bool(years_span and (years_span[1] - years_span[0]) > 15)

    # "life" in id is a very strong signal
    life_in_id = "life" in sid

    # Name looks like a personal name: 1-4 capitalized words, no leading
    # "The", no place/event indicator words
    event_words = {
        "the", "of", "at", "in", "battle", "siege", "massacre",
        "incident", "disaster", "tunnel", "ranch", "garden",
        "hotel", "house", "creek", "river", "trail", "road",
        "flight", "test", "day", "night", "panic", "crash",
        "mystery", "disappearance", "betrayal", "escape",
        "murder", "assassination", "bombing", "bombings",
        "encounter", "sighting", "zone", "revolt", "raid",
        "war", "dam", "fire", "flood", "restoration",
        "footprints", "consequences", "eclipse",
    }
    name_words = name.split()
    looks_like_person = (
        1 <= len(name_words) <= 5
        and not name.startswith("the ")
        and not any(w in event_words for w in name_words)
        # At least the first word is capitalized (a name)
        and original_name[0].isupper()
    )

    # Description starts with birth/life language
    born_mention = bool(re.search(r"\b(born|grew up|childhood|raised)\b", desc[:150]))

    bio_score = sum([
        life_in_id * 3,           # very strong signal
        long_span * 2,            # strong signal
        looks_like_person,
        born_mention,
    ])

    if bio_score >= 3:
        return "biography"

    return "incident"


def _parse_year_span(years: str) -> tuple[int, int] | None:
    """Try to parse years like '1850–1886' or '1947' into (start, end)."""
    # Handle en-dash, em-dash, hyphen
    parts = re.split(r"[–—\-]", years)
    nums = []
    for p in parts:
        p = p.strip()
        m = re.search(r"(\d{4})", p)
        if m:
            nums.append(int(m.group(1)))
    if len(nums) == 2:
        return (nums[0], nums[1])
    if len(nums) == 1:
        return (nums[0], nums[0])
    return None


# Verb test: does the moment name start with a verb / action phrase?
VERB_STARTERS = re.compile(
    r"^("
    r"murder|born|opening|founding|discover|escape|arrest|siege|battle|"
    r"death|kill|shot|shoot|fire|burn|hang|lynch|attack|bomb|crash|"
    r"flood|storm|explod|collaps|destroy|build|creat|found|establish|"
    r"filmed|hovered|tracked|publish|writ|record|sign|announc|"
    r"the (?:great |final |last |first |1\d{3} )|"
    r"where |when |how |"
    r"buried|fled|fleeing|convicted|acquitted|sentenced|"
    r"arrive|arriv|land|launch|sailed|march|walk|"
    r"captur|surrender|defeat|rescu|sav|"
    r"played|perform|sang|danc|"
    r"a [a-z]+"  # "A 19-year-old..."
    r")",
    re.IGNORECASE,
)

# More precise: names that are clearly just noun phrases (venue names, etc.)
# If the name doesn't match verb starters, it fails the verb test.
def verb_test(name: str) -> bool:
    """Return True if the moment name starts with a verb/action phrase."""
    if VERB_STARTERS.match(name):
        return True
    # Also pass if name contains em-dash separator suggesting "Event — subtitle"
    # or starts with a gerund (-ing)
    if re.match(r"^\w+ing\b", name):
        return True
    return False


def find_shared_moment_candidates(stories: list[dict]) -> list[dict]:
    """Find moments across different stories that may describe the same event."""
    all_moments = []
    for s in stories:
        for loc in s["locations"]:
            all_moments.append({**loc, "story_id": s["id"], "story_name": s["name"]})

    candidates = []
    seen = set()
    for i, a in enumerate(all_moments):
        for j, b in enumerate(all_moments):
            if j <= i:
                continue
            if a["story_id"] == b["story_id"]:
                continue
            pair_key = tuple(sorted([a["id"], b["id"]]))
            if pair_key in seen:
                continue

            if a["lat"] is None or b["lat"] is None:
                continue

            lat_diff = abs(a["lat"] - b["lat"])
            lng_diff = abs(a["lng"] - b["lng"])

            if lat_diff > 0.005 or lng_diff > 0.005:
                continue

            # Similar years?
            year_match = False
            if a["year"] and b["year"]:
                year_match = abs(a["year"] - b["year"]) <= 5

            # Similar names?
            name_match = _fuzzy_name_match(a["name"], b["name"])

            if year_match or name_match or (lat_diff < 0.001 and lng_diff < 0.001):
                seen.add(pair_key)
                candidates.append({
                    "a_id": a["id"],
                    "a_name": a["name"],
                    "a_story": a["story_id"],
                    "b_id": b["id"],
                    "b_name": b["name"],
                    "b_story": b["story_id"],
                    "coord_dist": f"{lat_diff:.4f}, {lng_diff:.4f}",
                    "year_a": int(a["year"]) if a["year"] else "?",
                    "year_b": int(b["year"]) if b["year"] else "?",
                    "reason": ("coords" if lat_diff < 0.001 and lng_diff < 0.001 else "") +
                              (" +year" if year_match else "") +
                              (" +name" if name_match else ""),
                })

    return candidates


def _fuzzy_name_match(a: str, b: str) -> bool:
    """Check if two names are similar enough to be the same thing."""
    a_lower = a.lower().strip()
    b_lower = b.lower().strip()
    if a_lower == b_lower:
        return True
    # Check if one contains the other
    if a_lower in b_lower or b_lower in a_lower:
        return True
    # Check significant word overlap
    a_words = set(re.findall(r"\b[a-z]{3,}\b", a_lower))
    b_words = set(re.findall(r"\b[a-z]{3,}\b", b_lower))
    if not a_words or not b_words:
        return False
    overlap = a_words & b_words
    min_len = min(len(a_words), len(b_words))
    if min_len > 0 and len(overlap) / min_len >= 0.6:
        return True
    return False


def extract_entities(stories: list[dict]) -> list[dict]:
    """Extract people and places mentioned across multiple stories."""
    # Build a corpus of text per story
    story_texts = {}
    for s in stories:
        parts = [s["name"], s.get("nickname") or "", s["description"]]
        for loc in s["locations"]:
            parts.extend([loc["name"], loc.get("subtitle") or "", loc["description"]])
        story_texts[s["id"]] = " ".join(parts)

    # Extract proper nouns / known entity patterns
    # We'll use a simple approach: find capitalized multi-word sequences
    # that appear in 2+ stories

    entity_occurrences = defaultdict(set)  # entity_name -> set of story_ids

    # Phrases to exclude: date-based, geographic boilerplate, common phrases
    exclude_phrases = {
        # Date phrases
        "on january", "on february", "on march", "on april", "on may",
        "on june", "on july", "on august", "on september", "on october",
        "on november", "on december",
        "in january", "in february", "in march", "in april", "in may",
        "in june", "in july", "in august", "in september", "in october",
        "in november", "in december",
        "by january", "by february", "by march", "by april", "by may",
        "by june", "by july", "by august", "by september", "by october",
        "by november", "by december",
        # Common geographic / contextual phrases
        "the united states", "united states", "new mexico", "new york",
        "los angeles", "san francisco", "san antonio", "el paso",
        "fort worth", "new orleans", "south texas", "north texas",
        "west texas", "east texas", "mexico city", "civil war",
        "world war", "cold war", "korean war", "vietnam war",
        "rio grande", "latin america", "north america", "south america",
        "central america",
        # Common non-entity phrases
        "the first", "the last", "the great", "the next",
        "the second", "the third", "the final",
    }

    for sid, text in story_texts.items():
        # Find capitalized phrases (2-4 words)
        # Pattern: two or more capitalized words in sequence
        caps = re.findall(
            r"\b([A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|[A-Z]\.?))+)\b", text
        )
        for phrase in caps:
            if phrase.lower() in exclude_phrases:
                continue
            # Skip phrases that are just location type + name from our own data
            if len(phrase.split()) <= 1:
                continue
            entity_occurrences[phrase].add(sid)

        # Also look for single notable names that appear as standalone
        # (e.g., "Geronimo", "O. Henry")
        # Find "O. Henry" pattern
        dot_names = re.findall(r"\b([A-Z]\.\s*[A-Z][a-z]+)\b", text)
        for dn in dot_names:
            entity_occurrences[dn].add(sid)

    # Filter to entities appearing in 2+ stories
    multi_story = {
        k: v for k, v in entity_occurrences.items() if len(v) >= 2
    }

    # Classify as person / place / org
    place_indicators = {
        "river", "creek", "lake", "mountain", "hill", "park", "ranch",
        "garden", "hotel", "museum", "theater", "theatre", "church",
        "cemetery", "plaza", "square", "building", "tower", "bridge",
        "dam", "fort", "base", "prison", "jail", "school", "university",
        "college", "hospital", "institute", "courthouse", "avenue",
        "street", "road", "boulevard", "headquarters", "factory",
        "club", "bar", "tavern", "saloon", "cafe", "restaurant",
        "capitol", "county",
    }
    org_indicators = {
        "company", "corporation", "inc", "llc", "foundation", "society",
        "association", "department", "bureau", "agency", "force",
        "army", "navy", "commission", "council",
    }

    results = []
    for name, sids in sorted(multi_story.items(), key=lambda x: -len(x[1])):
        lower = name.lower()
        words = lower.split()
        if any(w in place_indicators for w in words):
            etype = "place"
        elif any(w in org_indicators for w in words):
            etype = "org"
        else:
            etype = "person"
        results.append({
            "name": name,
            "type": etype,
            "stories": sorted(sids),
            "count": len(sids),
        })

    return results


def check_context_dependent(description: str) -> list[str]:
    """Check if a description uses context-dependent language.
    Returns list of flagged patterns found."""
    flags = []
    lower = description.lower()

    # References to undefined subjects
    patterns = [
        (r"\bthe killer\b", "the killer"),
        (r"\bthe attacker\b", "the attacker"),
        (r"\bthe victim\b", "the victim"),
        (r"\bthe suspect\b", "the suspect"),
        (r"\bthe gunman\b", "the gunman"),
        (r"\bthe shooter\b", "the shooter"),
        (r"\bthe assailant\b", "the assailant"),
        (r"\bthe perpetrator\b", "the perpetrator"),
    ]

    # Temporal references that assume prior context
    temporal = [
        (r"\bby this point\b", "by this point"),
        (r"\bthe following year\b", "the following year"),
        (r"\bthe next year\b", "the next year"),
        (r"\bthe previous year\b", "the previous year"),
        (r"\bafter the\b(?! \w+ war| civil| revolution| flood)", "after the..."),
        (r"\bbefore the\b(?! \w+ war| civil| revolution| flood)", "before the..."),
        (r"\bby then\b", "by then"),
        (r"\bby now\b", "by now"),
        (r"\bat this point\b", "at this point"),
        (r"\bthe following month\b", "the following month"),
        (r"\bthe year before\b", "the year before"),
    ]

    # Pronoun-heavy openings (first 80 chars)
    opening = lower[:80]
    pronoun_patterns = [
        (r"^he\b", "starts with 'he'"),
        (r"^she\b", "starts with 'she'"),
        (r"^they\b", "starts with 'they'"),
        (r"^his\b", "starts with 'his'"),
        (r"^her\b", "starts with 'her'"),
        (r"^their\b", "starts with 'their'"),
        (r"^it\b", "starts with 'it'"),
    ]

    for pat, label in patterns:
        if re.search(pat, lower):
            flags.append(label)
    for pat, label in temporal:
        if re.search(pat, lower):
            flags.append(label)
    for pat, label in pronoun_patterns:
        if re.search(pat, opening):
            flags.append(label)

    return flags


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------

def generate_report(stories: list[dict]) -> str:
    lines = []
    ln = lines.append

    ln("# Deep Maps — Story & Moment Inventory Report")
    ln("")
    ln(f"Generated from `src/data/stories.ts`")
    ln("")

    # ---- Section 1: Story Summary Table ----
    ln("## Section 1: Story Summary Table")
    ln("")
    ln(f"**{len(stories)} stories total**")
    ln("")
    ln("| # | Story ID | Story Name | Inferred Type | Category | Moments | Years |")
    ln("|---|----------|-----------|---------------|----------|---------|-------|")

    type_counts = defaultdict(int)
    total_moments = 0

    for i, s in enumerate(stories, 1):
        stype = infer_story_type(s)
        type_counts[stype] += 1
        n_locs = len(s["locations"])
        total_moments += n_locs
        # Escape pipe chars in name
        safe_name = s["name"].replace("|", "\\|")
        ln(f"| {i} | `{s['id']}` | {safe_name} | {stype} | {s['category']} | {n_locs} | {s['years']} |")

    ln("")

    # ---- Section 2: All Moments Table ----
    ln("## Section 2: All Moments Table")
    ln("")
    ln(f"**{total_moments} moments total**")
    ln("")
    ln("| # | Moment ID | Current Name | Verb Test | Parent Story | Year | Lat | Lng |")
    ln("|---|-----------|-------------|-----------|-------------|------|-----|-----|")

    moment_num = 0
    verb_fail_count = 0
    for s in stories:
        for loc in s["locations"]:
            moment_num += 1
            vt = verb_test(loc["name"])
            if not vt:
                verb_fail_count += 1
            vt_str = "pass" if vt else "FAIL"
            safe_name = loc["name"].replace("|", "\\|")
            year_str = int(loc["year"]) if loc["year"] else "—"
            lat_str = f"{loc['lat']:.4f}" if loc["lat"] else "—"
            lng_str = f"{loc['lng']:.4f}" if loc["lng"] else "—"
            ln(f"| {moment_num} | `{loc['id']}` | {safe_name} | {vt_str} | `{s['id']}` | {year_str} | {lat_str} | {lng_str} |")

    ln("")

    # ---- Section 3: Shared Moment Candidates ----
    ln("## Section 3: Shared Moment Candidates")
    ln("")

    candidates = find_shared_moment_candidates(stories)
    ln(f"**{len(candidates)} candidate pairs found**")
    ln("")

    if candidates:
        ln("| # | Moment A | Story A | Moment B | Story B | Coord Diff (lat,lng) | Years | Match Reason |")
        ln("|---|----------|---------|----------|---------|---------------------|-------|-------------|")
        for i, c in enumerate(candidates, 1):
            ln(f"| {i} | `{c['a_id']}` ({c['a_name'][:30]}) | `{c['a_story']}` | `{c['b_id']}` ({c['b_name'][:30]}) | `{c['b_story']}` | {c['coord_dist']} | {c['year_a']}/{c['year_b']} | {c['reason'].strip()} |")
    else:
        ln("*No shared moment candidates found.*")

    ln("")

    # ---- Section 4: Implicit Entity Extraction ----
    ln("## Section 4: Implicit Entity Extraction")
    ln("")

    entities = extract_entities(stories)
    ln(f"**{len(entities)} entities appearing in 2+ stories**")
    ln("")

    if entities:
        ln("| # | Entity Name | Type | # Stories | Story IDs |")
        ln("|---|------------|------|-----------|-----------|")
        for i, e in enumerate(entities, 1):
            story_ids = ", ".join(f"`{s}`" for s in e["stories"][:8])
            if len(e["stories"]) > 8:
                story_ids += f" +{len(e['stories']) - 8} more"
            ln(f"| {i} | {e['name']} | {e['type']} | {e['count']} | {story_ids} |")
    else:
        ln("*No multi-story entities found.*")

    ln("")

    # ---- Section 5: Description Dependency Analysis ----
    ln("## Section 5: Description Dependency Analysis")
    ln("")

    dep_moments = []
    for s in stories:
        for loc in s["locations"]:
            flags = check_context_dependent(loc["description"])
            if flags:
                dep_moments.append({
                    "loc_id": loc["id"],
                    "loc_name": loc["name"],
                    "story_id": s["id"],
                    "flags": flags,
                })

    ln(f"**{len(dep_moments)} moments with context-dependent descriptions**")
    ln("")

    if dep_moments:
        ln("| # | Moment ID | Moment Name | Parent Story | Flags |")
        ln("|---|-----------|-------------|-------------|-------|")
        for i, d in enumerate(dep_moments, 1):
            safe_name = d["loc_name"].replace("|", "\\|")
            flags_str = ", ".join(d["flags"])
            ln(f"| {i} | `{d['loc_id']}` | {safe_name} | `{d['story_id']}` | {flags_str} |")
    else:
        ln("*No context-dependent descriptions found.*")

    ln("")

    # ---- Section 6: Summary Statistics ----
    ln("## Section 6: Summary Statistics")
    ln("")
    ln("| Metric | Value |")
    ln("|--------|-------|")
    ln(f"| Total stories | {len(stories)} |")
    for stype in ["biography", "place", "incident"]:
        ln(f"| Stories — {stype} | {type_counts.get(stype, 0)} |")
    ln(f"| Total moments | {total_moments} |")
    verb_pass = total_moments - verb_fail_count
    pct_fail = (verb_fail_count / total_moments * 100) if total_moments else 0
    ln(f"| Moments passing verb test | {verb_pass} ({100 - pct_fail:.1f}%) |")
    ln(f"| Moments failing verb test | {verb_fail_count} ({pct_fail:.1f}%) |")
    ln(f"| Shared moment candidates | {len(candidates)} |")
    ln(f"| Entities in 2+ stories | {len(entities)} |")
    ln(f"| Context-dependent descriptions | {len(dep_moments)} |")
    ln("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if not STORIES_FILE.exists():
        print(f"ERROR: stories.ts not found at {STORIES_FILE}", file=sys.stderr)
        sys.exit(1)

    print(f"Parsing {STORIES_FILE} ...")
    stories = parse_stories(STORIES_FILE)
    print(f"  Found {len(stories)} stories")

    total_locs = sum(len(s["locations"]) for s in stories)
    print(f"  Found {total_locs} moments total")

    print("Generating report ...")
    report = generate_report(stories)

    REPORT_FILE.write_text(report, encoding="utf-8")
    print(f"Report written to {REPORT_FILE}")
    print()

    # Print summary statistics to stdout
    type_counts = defaultdict(int)
    for s in stories:
        type_counts[infer_story_type(s)] += 1

    verb_fail = sum(
        1 for s in stories for loc in s["locations"] if not verb_test(loc["name"])
    )
    candidates = find_shared_moment_candidates(stories)
    entities = extract_entities(stories)
    dep_count = sum(
        1 for s in stories for loc in s["locations"]
        if check_context_dependent(loc["description"])
    )

    print("=" * 50)
    print("SUMMARY STATISTICS")
    print("=" * 50)
    print(f"  Total stories:              {len(stories)}")
    print(f"    biography:                {type_counts.get('biography', 0)}")
    print(f"    place:                    {type_counts.get('place', 0)}")
    print(f"    incident:                 {type_counts.get('incident', 0)}")
    print(f"  Total moments:              {total_locs}")
    print(f"  Moments failing verb test:  {verb_fail} ({verb_fail/total_locs*100:.1f}%)")
    print(f"  Shared moment candidates:   {len(candidates)}")
    print(f"  Entities in 2+ stories:     {len(entities)}")
    print(f"  Context-dependent descs:    {dep_count}")
    print("=" * 50)


if __name__ == "__main__":
    main()
