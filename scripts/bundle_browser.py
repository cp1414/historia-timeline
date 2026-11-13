#!/usr/bin/env python3
"""
Builds derived dataset and browser artifacts from the canonical sources in src/:
- src/data/timelineData.js (ESM bundle for Vite)
- public/timelineData.browser.js (window global dataset)
- index.html (self-contained standalone exhibition bundle runnable over file:// or static HTTP)
"""

import json
import re
from pathlib import Path


def strip_esm_from_search(search_src: str) -> str:
    return re.sub(r"^export\s+(?=function\s+|const\s+|let\s+|class\s+)", "", search_src, flags=re.MULTILINE).strip()


def strip_esm_from_app(app_src: str) -> str:
    lines = []
    skip_imports = True
    for line in app_src.splitlines():
        if skip_imports and line.startswith("import "):
            continue
        if line.strip() != "":
            skip_imports = False
        lines.append(line)
    cleaned = "\n".join(lines).strip()
    cleaned = re.sub(r"^export\s+default\s+function\s+App\b", "function App", cleaned, flags=re.MULTILINE)
    return cleaned


def build_all(root: Path | None = None) -> None:
    if root is None:
        root = Path(__file__).resolve().parent.parent

    data_json = json.loads((root / "src" / "data" / "timelineData.json").read_text("utf-8"))
    series = data_json["series"]
    events = data_json["events"]

    # 1. Write ESM dataset module src/data/timelineData.js
    esm_data_js = (
        "// Auto-generated 160-card Historia Classical Timeline dataset\n"
        f"export const SERIES_INFO = {json.dumps(series, indent=2, ensure_ascii=False)};\n\n"
        f"export const TIMELINE_EVENTS = {json.dumps(events, indent=2, ensure_ascii=False)};\n"
    )
    (root / "src" / "data" / "timelineData.js").write_text(esm_data_js, "utf-8")

    # 2. Write browser global dataset public/timelineData.browser.js
    browser_data_js = (
        "// Auto-generated browser dataset for Historia Classical Timeline (160 events)\n"
        f"window.SERIES_INFO = {json.dumps(series, ensure_ascii=False)};\n"
        f"window.TIMELINE_EVENTS = {json.dumps(events, ensure_ascii=False)};\n"
    )
    (root / "public" / "timelineData.browser.js").write_text(browser_data_js, "utf-8")

    # 3. Assemble standalone index.html from src/utils/timelineSearch.js + src/App.jsx
    search_src = strip_esm_from_search((root / "src" / "utils" / "timelineSearch.js").read_text("utf-8"))
    app_src = strip_esm_from_app((root / "src" / "App.jsx").read_text("utf-8"))

    data_block = (
        "<!-- HISTORIA:DATA_START -->\n"
        "    <script>\n"
        f"window.SERIES_INFO = {json.dumps(series, indent=2, ensure_ascii=False)};\n"
        f"window.TIMELINE_EVENTS = {json.dumps(events, indent=2, ensure_ascii=False)};\n"
        "    </script>\n"
        "    <!-- HISTORIA:DATA_END -->"
    )

    app_block = (
        "<!-- HISTORIA:APP_START -->\n"
        "    <script type=\"text/babel\">\n"
        "      const { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } = React;\n"
        "      const SERIES_INFO = window.SERIES_INFO;\n"
        "      const TIMELINE_EVENTS = window.TIMELINE_EVENTS;\n\n"
        f"{search_src}\n\n"
        f"{app_src}\n\n"
        "      const root = ReactDOM.createRoot(document.getElementById(\"root\"));\n"
        "      root.render(<App />);\n"
        "    </script>\n"
        "    <!-- HISTORIA:APP_END -->"
    )

    index_path = root / "index.html"
    html = index_path.read_text("utf-8")

    if "<!-- HISTORIA:DATA_START -->" in html and "<!-- HISTORIA:DATA_END -->" in html:
        html = re.sub(
            r"<!-- HISTORIA:DATA_START -->.*?<!-- HISTORIA:DATA_END -->",
            lambda _: data_block,
            html,
            count=1,
            flags=re.DOTALL,
        )
    else:
        html = re.sub(
            r"<script>\s*window\.SERIES_INFO\s*=.*?</script>",
            lambda _: data_block,
            html,
            count=1,
            flags=re.DOTALL,
        )

    if "<!-- HISTORIA:APP_START -->" in html and "<!-- HISTORIA:APP_END -->" in html:
        html = re.sub(
            r"<!-- HISTORIA:APP_START -->.*?<!-- HISTORIA:APP_END -->",
            lambda _: app_block,
            html,
            count=1,
            flags=re.DOTALL,
        )
    else:
        html = re.sub(
            r"<script type=\"text/babel\">.*?</script>",
            lambda _: app_block,
            html,
            count=1,
            flags=re.DOTALL,
        )

    index_path.write_text(html, "utf-8")
    print(
        f"Bundled {len(events)} events into:\n"
        "  - src/data/timelineData.js\n"
        "  - public/timelineData.browser.js\n"
        "  - index.html"
    )


if __name__ == "__main__":
    build_all()
