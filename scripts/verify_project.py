#!/usr/bin/env python3
"""Automated verification suite for Historia — Classical History Timeline."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

import bundle_browser  # noqa: E402

EXPECTED_SERIES_COUNT = 5
EXPECTED_TOTAL_EVENTS = 160
EXPECTED_EVENTS_PER_SERIES = 32
CC_ATTRIBUTION_CARDS = {18, 19, 26, 31, 32, 36, 37, 38, 70, 73, 88, 95}

BANNED_TERMS = (
    "ver" + "itas",
    "classical " + "conversations",
)
LOCAL_PATH_PREFIX = "/Users" + "/"
CONSOLE_CALL = "console" + ".log("
TEXT_EXTENSIONS = {".js", ".jsx", ".json", ".html", ".css", ".md", ".py", ".yml", ".yaml"}
CODE_EXTENSIONS = {".js", ".jsx", ".html"}


def fail(message: str) -> None:
    raise AssertionError(message)


def check_dataset_integrity(root: Path) -> dict:
    data_path = root / "src" / "data" / "timelineData.json"
    data = json.loads(data_path.read_text(encoding="utf-8"))

    series = data.get("series")
    events = data.get("events")
    if not isinstance(series, list) or len(series) != EXPECTED_SERIES_COUNT:
        fail(f"Expected {EXPECTED_SERIES_COUNT} series entries, found {len(series) if isinstance(series, list) else type(series)}")
    if not isinstance(events, list) or len(events) != EXPECTED_TOTAL_EVENTS:
        fail(f"Expected {EXPECTED_TOTAL_EVENTS} timeline events, found {len(events) if isinstance(events, list) else type(events)}")

    series_by_id: dict[str, dict] = {}
    for s in series:
        sid = s.get("id")
        sname = s.get("name")
        if not isinstance(sid, str) or not sid or not isinstance(sname, str) or not sname or sid in series_by_id:
            fail(f"Invalid or duplicate series definition: {s!r}")
        series_by_id[sid] = s

    series_counts = {sid: 0 for sid in series_by_id}
    seen_images: set[str] = set()
    seen_ids: set[str] = set()

    required_fields = (
        "id",
        "series",
        "seriesId",
        "title",
        "dateDisplay",
        "summaryBack",
        "coverImage",
        "artworkCredit",
        "sourceName",
        "resourceUrl",
        "resourceType",
    )

    for idx, event in enumerate(events, start=1):
        if event.get("cardNumber") != idx:
            fail(f"Card order mismatch at index {idx}: got cardNumber={event.get('cardNumber')!r}")

        event_id = event.get("id")
        if not isinstance(event_id, str) or not event_id or event_id in seen_ids:
            fail(f"Duplicate or invalid id at card #{idx}: {event_id!r}")
        seen_ids.add(event_id)

        for field in required_fields:
            val = event.get(field)
            if not isinstance(val, str) or not val.strip():
                fail(f"Card #{idx} missing required non-empty string field '{field}'")

        sid = event["seriesId"]
        if sid not in series_by_id:
            fail(f"Card #{idx} references unknown seriesId {sid!r}")
        if event["series"] != series_by_id[sid]["name"]:
            fail(f"Card #{idx} series name {event['series']!r} mismatches series definition {series_by_id[sid]['name']!r}")
        series_counts[sid] += 1

        lat = event.get("lat")
        lng = event.get("lng")
        if not isinstance(lat, (int, float)) or not (-90 <= lat <= 90):
            fail(f"Card #{idx} has invalid lat: {lat!r}")
        if not isinstance(lng, (int, float)) or not (-180 <= lng <= 180):
            fail(f"Card #{idx} has invalid lng: {lng!r}")

        cover = event["coverImage"]
        if not cover.startswith("https://upload.wikimedia.org/"):
            fail(f"Card #{idx} coverImage must use upload.wikimedia.org: {cover}")
        if "Special:FilePath" in cover:
            fail(f"Card #{idx} uses forbidden Special:FilePath URL: {cover}")
        if "/thumb/" in cover and "/960px-" not in cover:
            fail(f"Card #{idx} thumb URL is not normalized to 960px: {cover}")
        if cover in seen_images:
            fail(f"Duplicate coverImage URL at card #{idx}: {cover}")
        seen_images.add(cover)

        rtype = event["resourceType"]
        if rtype == "scripture":
            if event.get("wikiUrl") is not None:
                fail(f"Scripture card #{idx} must have wikiUrl: null")
            if event["sourceName"] != "Holy Bible (ESV)":
                fail(f"Scripture card #{idx} must cite 'Holy Bible (ESV)', got {event['sourceName']!r}")
            if "biblegateway.com" not in event["resourceUrl"] or "version=ESV" not in event["resourceUrl"]:
                fail(f"Scripture card #{idx} must link to Bible Gateway ESV: {event['resourceUrl']}")
        elif rtype == "encyclopedia":
            if not event.get("wikiUrl") or event.get("wikiUrl") != event["resourceUrl"]:
                fail(f"Encyclopedia card #{idx} wikiUrl and resourceUrl must match and be non-empty")
        else:
            fail(f"Card #{idx} has unknown resourceType {rtype!r}")

        if idx in CC_ATTRIBUTION_CARDS:
            credit = event["artworkCredit"]
            if "CC BY" not in credit or "Photo:" not in credit:
                fail(f"CC-licensed card #{idx} missing explicit photo/license credit: {credit!r}")

    for sid, count in series_counts.items():
        if count != EXPECTED_EVENTS_PER_SERIES:
            fail(f"Series {sid!r} has {count} cards; expected {EXPECTED_EVENTS_PER_SERIES}")

    print(f"[PASS] Dataset integrity: {len(series)} series, {len(events)} unique ordered plates, URL/ESV/CC checks valid")
    return data


def iter_public_files(root: Path) -> list[Path]:
    candidates: list[Path] = []
    for name in ("README.md", "LICENSE", "package.json", "index.html", ".gitignore"):
        path = root / name
        if path.is_file():
            candidates.append(path)
    for folder in ("src", "public", "scripts", ".github"):
        base = root / folder
        if not base.exists():
            continue
        for current, dirs, files in os.walk(base):
            dirs[:] = [d for d in dirs if d not in {"__pycache__", "node_modules", "dist", ".vite"}]
            for filename in sorted(files):
                fpath = Path(current) / filename
                if fpath.suffix.lower() in TEXT_EXTENSIONS:
                    candidates.append(fpath)
    return candidates


def has_emoji_codepoints(text: str) -> bool:
    for ch in text:
        cp = ord(ch)
        if (0x1F300 <= cp <= 0x1FAFF) or (0x2600 <= cp <= 0x27BF):
            return True
    return False


def check_public_hygiene(root: Path) -> None:
    license_path = root / "LICENSE"
    if not license_path.is_file() or "MIT License" not in license_path.read_text(encoding="utf-8"):
        fail("Repository root is missing an MIT LICENSE file")

    pkg = json.loads((root / "package.json").read_text(encoding="utf-8"))
    if pkg.get("license") != "MIT":
        fail(f"package.json must declare 'license': 'MIT', found {pkg.get('license')!r}")

    index_html = (root / "index.html").read_text(encoding="utf-8")
    if not re.search(r'<link\s+rel="icon"\s+type="image/svg\+xml"\s+href="data:image/svg\+xml,', index_html):
        fail("index.html is missing the inline SVG favicon link")

    gitignore = (root / ".gitignore").read_text(encoding="utf-8")
    for private_entry in ("GEMINI.md", "DESIGN_SKILLS.md", ".agent/"):
        if private_entry not in gitignore.splitlines():
            fail(f".gitignore must exclude private file/directory {private_entry!r}")

    scanned = 0
    for fpath in iter_public_files(root):
        rel = fpath.relative_to(root).as_posix()
        content = fpath.read_text(encoding="utf-8")
        lowered = content.lower()
        scanned += 1

        for banned in BANNED_TERMS:
            if banned in lowered:
                fail(f"Banned third-party brand term {banned!r} found in public file {rel}")

        if LOCAL_PATH_PREFIX in content:
            fail(f"Local machine path {LOCAL_PATH_PREFIX!r} leaked in public file {rel}")

        if fpath.suffix.lower() in CODE_EXTENSIONS and CONSOLE_CALL in content:
            fail(f"Debug {CONSOLE_CALL} found in {rel}")

    app_jsx = (root / "src" / "App.jsx").read_text(encoding="utf-8")
    if "rounded-full" in app_jsx:
        fail("src/App.jsx contains banned Tailwind utility 'rounded-full'")
    if has_emoji_codepoints(app_jsx):
        fail("src/App.jsx contains inline Unicode emoji codepoints")

    print(f"[PASS] Public hygiene & UI checks: scanned {scanned} files (0 trademarks, 0 leaks, 0 rounded-full, favicon present)")


def check_bundle_sync(root: Path) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        tmp_root = Path(tmp)
        (tmp_root / "public").mkdir(parents=True, exist_ok=True)
        for rel in (
            "src/data/timelineData.json",
            "src/utils/timelineSearch.js",
            "src/App.jsx",
            "index.html",
        ):
            src_file = root / rel
            dst_file = tmp_root / rel
            dst_file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src_file, dst_file)

        bundle_browser.build_all(tmp_root)

        for rel in (
            "src/data/timelineData.js",
            "public/timelineData.browser.js",
            "index.html",
        ):
            expected = (tmp_root / rel).read_text(encoding="utf-8")
            actual = (root / rel).read_text(encoding="utf-8")
            if actual != expected:
                fail(f"{rel} is out of sync with source files; run: python3 scripts/bundle_browser.py")

    print("[PASS] Browser bundle sync: src/data/timelineData.js, public/timelineData.browser.js, and index.html match sources")


def find_js_runtime() -> tuple[str, str]:
    node = shutil.which("node")
    if node:
        return ("node", node)
    jsc = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc"
    if os.path.isfile(jsc) and os.access(jsc, os.X_OK):
        return ("jsc", jsc)
    raise RuntimeError("No JavaScript runtime found (need 'node' or macOS 'jsc' to run search tests)")


def check_js_search_engine(root: Path, data: dict) -> None:
    runtime_name, runtime_bin = find_js_runtime()
    search_src = (root / "src" / "utils" / "timelineSearch.js").read_text(encoding="utf-8")
    stripped_search = bundle_browser.strip_esm_from_search(search_src)
    events_json = json.dumps(data["events"], ensure_ascii=False)

    test_harness = f"""
{stripped_search}

const EVENTS = {events_json};
const INDEX_MAP = buildEventSearchIndex(EVENTS);
let passed = 0;

function assert(cond, msg) {{
  if (!cond) {{
    throw new Error('Assertion failed: ' + msg);
  }}
  passed += 1;
}}

assert(normalizeSearchText("Moses’ Birth — Éxodus") === "moses' birth - exodus", 'normalizeSearchText normalizes diacritics, apostrophes, and dashes');
assert(normalizeSearchText("Cortés’s Conquest") === "cortes's conquest", 'normalizeSearchText folds accents and curly apostrophes');
assert(damerauLevenshtein('creation', 'creation', 2) === 0, 'exact match distance is 0');
assert(damerauLevenshtein('pyramids', 'pyramds', 2) === 1, 'deletion distance is 1');
assert(damerauLevenshtein('america', 'amreica', 2) === 1, 'transposition distance is 1');
assert(damerauLevenshtein('creation', 'revolution', 2) === 3, 'distant strings clamp at maxDist + 1');

const allRes = searchTimelineEvents(EVENTS, '', 'all', INDEX_MAP);
assert(allRes.isQueryActive === false && allRes.results.length === 160 && allRes.totalInSeries === 160, 'empty query returns all 160 plates in order');
assert(allRes.results[0].event.cardNumber === 1 && allRes.results[159].event.cardNumber === 160, 'chronological order preserved');

const seriesIds = new Set();
for (const ev of EVENTS) seriesIds.add(ev.seriesId);
assert(seriesIds.size === 5, '5 distinct seriesId wings exist');
for (const sid of seriesIds) {{
  const wingRes = searchTimelineEvents(EVENTS, '', sid, INDEX_MAP);
  assert(wingRes.results.length === 32 && wingRes.totalInSeries === 32, 'series wing ' + sid + ' has 32 cards');
}}

const plate42 = searchTimelineEvents(EVENTS, '#042', 'all', INDEX_MAP);
assert(plate42.isQueryActive === true && plate42.results.length >= 1, '#042 finds card 42');
assert(plate42.results[0].event.cardNumber === 42 && plate42.results[0].score === 10000 && plate42.results[0].matchLabel === 'Plate #', '#042 matches Plate # with score 10000');

const card42 = searchTimelineEvents(EVENTS, 'card 42', 'all', INDEX_MAP);
assert(card42.results[0].event.cardNumber === 42 && card42.results[0].matchLabel === 'Plate #', 'card 42 matches Plate #42');

const modern = searchTimelineEvents(EVENTS, 'Modern America Today', 'all', INDEX_MAP);
assert(modern.results.length >= 1 && modern.results[0].event.cardNumber === 160, 'exact title query ranks #160 first');

const typo = searchTimelineEvents(EVENTS, 'Modern Amreica', 'all', INDEX_MAP);
assert(typo.results.some((r) => r.event.cardNumber === 160), 'typo transposition still finds Modern America Today');

const outOfWing = searchTimelineEvents(EVENTS, 'Modern America Today', EVENTS[0].seriesId, INDEX_MAP);
assert(outOfWing.results.length === 0, 'wing filter excludes cards from other wings');

const msg = 'JS_SEARCH_TESTS_PASSED:' + passed;
if (typeof console !== 'undefined' && typeof console.log === 'function') {{
  console.log(msg);
}} else {{
  print(msg);
}}
"""

    with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8", delete=False) as tf:
        tf.write(test_harness)
        temp_path = Path(tf.name)

    try:
        proc = subprocess.run([runtime_bin, str(temp_path)], capture_output=True, text=True)
    finally:
        temp_path.unlink(missing_ok=True)

    if proc.returncode != 0 or "JS_SEARCH_TESTS_PASSED:" not in proc.stdout:
        fail(
            f"JS search tests failed under {runtime_name} (exit={proc.returncode}):\n"
            f"STDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
        )

    marker = [line for line in proc.stdout.splitlines() if "JS_SEARCH_TESTS_PASSED:" in line][-1]
    count = marker.split(":", 1)[1].strip()
    print(f"[PASS] JS search unit tests ({runtime_name}): {count} assertions passed")


def main() -> int:
    data = check_dataset_integrity(ROOT)
    check_public_hygiene(ROOT)
    check_bundle_sync(ROOT)
    check_js_search_engine(ROOT, data)
    print("\nAll Historia verification checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
