# Historia — Classical History Timeline

An interactive **3D Cover Flow gallery, Archival Index Grid, and Classical Atlas companion** built to help students study and sequentially recite all **160 Classical Christian History Timeline events** (`#001 Creation` through `#160 Modern America Today`), paired with curated public-domain and freely licensed fine art, museum artifacts, archival photographs, original historical summaries, primary references, and MapLibre physical-relief geography.

## Purpose & Pedagogical Design

Students learn the 160 timeline events back-to-back in their `#001`–`#160` chronological recitation order across five period-styled museum wings (`32` plates each, keeping each event in its historical era wing as periods overlap):

1. **Gallery I · Old Testament & Ancient Egypt** (`#001`–`#052`, 32 plates)
2. **Gallery II · New Testament, Greece & Rome** (`#009`–`#068`, 32 plates)
3. **Gallery III · Middle Ages, Renaissance & Reformation** (`#064`–`#100`, 32 plates)
4. **Gallery IV · Explorers to 1815** (`#087`–`#128`, 32 plates)
5. **Gallery V · 1815 to Present** (`#129`–`#160`, 32 plates)

Cards remain in official `#001`–`#160` recitation sequence in the main gallery so chronology and historical era wings both stay intact.

## Features

- **3D Museum Cover Flow Gallery**:
  - Navigate sequentially with `←` / `→` (`Shift + ←/→` jumps 5 plates), trackpad/mouse wheel, touch/mouse drag-swipe, or the bottom timeline scrubber and 5-wing pigment bar.
  - Each wing features a distinct period wall tone, architectural backdrop, and perspective marble floor reflection, with walnut-and-brass framed plates and resilient multi-tier Wikimedia image loading.
  - Turn any center plate (`Space`, `Enter`, click, or the footer **Summary / Front** control) to inspect the verso summary, historical date, location, primary reference, artwork attribution and source credit, and direct **`Read in ESV`** (Bible Gateway) or **`More Info`** (Wikipedia) links.
- **Customizable Recite Mode**:
  - Open **Recite Mode** in the footer (or press `R`) to choose what to mask during oral review: **Hide Upcoming Photos** (opaque linen shutters over upcoming plates), **Hide Title**, **Hide Photo**, or **All** (masks photo, title, year, and ahead plates), with an inline **Reveal** button on the active plate.
- **Auto-Play Tour with Cadence Selector**:
  - Press **Play** to step through plates hands-free during oral review, with selectable cadence (`1.5s`, `2.5s`, `4s`).
- **Zero-Login Device Progress**:
  - Automatically remembers your last active plate, learned plates (`#001`–`#160`), Recite Mode toggles, and playback cadence in browser `localStorage` without accounts or logins.
  - Includes per-plate learned toggles, a bulk **"Mark #001–#XXX Learned"** action in both the gallery footer menu and Index Grid, and a reset option.
- **MapLibre Physical-Relief Classical Atlas**:
  - Open the bottom **Atlas Drawer** (`M`) inside Gallery view or switch to the full **Atlas** stage view to explore where each event took place on an Esri World Physical Relief basemap (without modern roads or borders) layered with Latin region watermarks, GeoJSON pins, co-located site picker (for cities such as Jerusalem, Rome, or Philadelphia), **Fit Pins** when filtered, and theatre camera presets (**Follow Plate**, **Near East**, **Mediterranean**, **Europe**, **N. America**, **World**).
- **Ranked & Typo-Tolerant Search**:
  - Press `/` to search across plate numbers (`#042`), titles, dates/years, locations, references/sources, artwork attributions, wings, and summaries with diacritic normalization and Damerau-Levenshtein typo tolerance, cross-wing fallback suggestions, and gallery/map filtering (`Enter` jumps; `Shift+Enter` filters).
- **Archival Catalogue Index Grid**:
  - Switch to **Index** to scan all 160 miniature framed plates at a glance, toggle learned status directly on cards, bulk-mark up to the active plate, or click any plate to jump into Gallery view.

## Keyboard Shortcuts

- `←` / `→`: Previous / next plate (`Shift` + Arrow steps 5 plates) in Gallery and Atlas views
- `Space` / `Enter`: Turn center plate between front artwork and verso summary (Gallery view)
- `R`: Toggle **Recite Mode** (restores last active mask set or toggles **Hide Upcoming Photos**)
- `M`: Toggle the **Atlas Drawer**
- `/`: Open quick search; `Esc` closes search/menus, returns a turned plate to the front, or collapses the Atlas Drawer

## Running Locally

### Option 1: Open Directly (`file://`, Zero Setup)
Double-click [`index.html`](./index.html) or run:
```bash
open index.html
```

### Option 2: Local HTTP Server
```bash
python3 -m http.server 8080
```
Then open `http://localhost:8080`.

*(Note: [`index.html`](./index.html) is a self-contained static app that requires no Node.js build step to run or deploy.)*

## Architecture, Dataset Pipeline & Automated Checks

- [`src/App.jsx`](./src/App.jsx) and [`src/utils/timelineSearch.js`](./src/utils/timelineSearch.js) are the canonical application and search sources.
- [`src/data/timelineData.json`](./src/data/timelineData.json) holds all 160 events (`series`, historical coordinates, `coverImage`, `artworkCredit`, `summaryBack`, and primary source links).
- [`scripts/bundle_browser.py`](./scripts/bundle_browser.py) (`python3 scripts/bundle_browser.py`) rebuilds [`src/data/timelineData.js`](./src/data/timelineData.js), [`public/timelineData.browser.js`](./public/timelineData.browser.js), and the standalone [`index.html`](./index.html) from `src/`.
- [`scripts/build_dataset.py`](./scripts/build_dataset.py) (`python3 scripts/build_dataset.py`) resolves Wikimedia Commons artwork overrides, normalizes thumbnail URLs to 960px, preserves geographic/reference fields, and re-runs `bundle_browser.py`.
- [`scripts/verify_project.py`](./scripts/verify_project.py) (`python3 scripts/verify_project.py`) runs automated dataset, attribution, trademark/IP, bundle-sync, UI-constraint, and search-engine unit tests.

## License & Media Attribution

- **Code & Original Prose ([`LICENSE`](./LICENSE)):** Released under the **MIT License**.
- **Exhibition Plates & Third-Party Links:** Historical artworks, museum artifact photographs, and archival images hosted on Wikimedia Commons remain in the Public Domain or under their individually credited Creative Commons licenses shown in each card's `artworkCredit` field. External **`Read in ESV`** (Bible Gateway) and **`More Info`** (Wikipedia) links remain subject to their respective providers' terms.
