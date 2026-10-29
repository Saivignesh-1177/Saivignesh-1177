"""Generate the profile README and its artwork from profile.json, with fonts embedded so GitHub renders them as designed.

    python tools/readme_art.py   # writes README.md, assets/header.svg and assets/ledger.svg
"""
import base64
import json
import sys
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from build import SITE, seal  # noqa: E402  (same monogram and address as the site)

INK, RULE, PAPER, MUTED, OXBLOOD, BRASS = "#121110", "#2E2A26", "#E9E1D3", "#9A9286", "#9E2B2B", "#C4A56E"

# Outcome figures exactly as reported in professional practice; the source key resolves to its period.
LEDGER = [
    ("35%", "more documented security-control coverage", "P25"),
    ("25%", "less high-risk misconfiguration exposure", "P25"),
    ("20%", "faster incident-response turnaround", "P25"),
    ("99.9%", "data availability through backup and DR", "P23"),
    ("40%", "less manual effort, Terraform and PowerShell", "P20"),
    ("30+", "microservices operated by a six-engineer team", "P20"),
]


def font_face(family, file, style="normal"):
    data = base64.b64encode((ROOT / "assets/fonts" / file).read_bytes()).decode()
    return (f"@font-face{{font-family:'{family}';font-style:{style};"
            f"src:url(data:font/woff2;base64,{data}) format('woff2')}}")


FONTS = "".join([
    font_face("SVR Serif", "instrument-serif-400-normal.woff2"),
    font_face("SVR Serif", "instrument-serif-400-italic.woff2", "italic"),
    font_face("SVR Mono", "ibm-plex-mono-400-normal.woff2"),
])
STYLE = (f"<style>{FONTS}.serif{{font-family:'SVR Serif',Georgia,serif}}"
         f".mono{{font-family:'SVR Mono',Consolas,monospace;letter-spacing:.06em}}</style>")


def mark(x, y, size, ticks, color):
    inner = seal(ticks, color).split(">", 1)[1].rsplit("</svg>", 1)[0]
    return f'<g transform="translate({x} {y}) scale({size / 40})" fill="none" stroke="{color}" stroke-linecap="square">{inner}</g>'


def header(d):
    who, focus, layers = d["subject"], d["focus"]["cloud-security"], d["layers"]
    step = 1080 / len(layers)
    row = "".join(
        f'<text x="{60 + i * step:.0f}" y="372" class="mono" font-size="12" fill="{MUTED}">'
        f'<tspan fill="{OXBLOOD}">{i + 1:02d}</tspan> {escape(l["title"].upper())}</text>'
        for i, l in enumerate(layers))
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="420" viewBox="0 0 1200 420" role="img" aria-label="{escape(who['name'])} — {escape(focus['role'])}">
{STYLE}
<rect width="1200" height="420" fill="{INK}"/>
{mark(56, 40, 54, len(layers), PAPER)}
<text x="1140" y="62" text-anchor="end" class="mono" font-size="12" fill="{MUTED}">CLOUD SECURITY · IDENTITY · DEVSECOPS · GRC</text>
<line x1="60" y1="118" x2="1140" y2="118" stroke="{RULE}"/>
<text x="60" y="160" class="mono" font-size="13" fill="{OXBLOOD}">00 · THE SURFACE</text>
<text x="56" y="252" class="serif" font-size="96" fill="{PAPER}">{escape(who['name'])}</text>
<text x="60" y="302" class="serif" font-style="italic" font-size="32" fill="{BRASS}">{escape(focus['role'])}</text>
<line x1="60" y1="340" x2="1140" y2="340" stroke="{RULE}"/>
{row}
</svg>
"""


def ledger(d):
    cells = []
    for i, (fig, what, src) in enumerate(LEDGER):
        x, y = 60 + (i % 3) * 360, 96 + (i // 3) * 150
        cells.append(
            f'<text x="{x}" y="{y + 44}" class="serif" font-size="58" fill="{PAPER}">{escape(fig)}</text>'
            f'<text x="{x}" y="{y + 78}" class="serif" font-style="italic" font-size="20" fill="{BRASS}">{escape(what)}</text>'
            f'<text x="{x}" y="{y + 104}" class="mono" font-size="11" fill="{MUTED}">↳ {escape(d["sources"][src]["label"].upper())}</text>')
    grid = (f'<line x1="60" y1="236" x2="1140" y2="236" stroke="{RULE}"/>'
            f'<line x1="400" y1="96" x2="400" y2="376" stroke="{RULE}"/>'
            f'<line x1="760" y1="96" x2="760" y2="376" stroke="{RULE}"/>')
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="430" viewBox="0 0 1200 430" role="img" aria-label="Outcome figures as reported in professional practice">
{STYLE}
<rect width="1200" height="430" fill="{INK}"/>
<text x="60" y="56" class="mono" font-size="13" fill="{OXBLOOD}">OUTCOMES</text>
<text x="1140" y="56" text-anchor="end" class="mono" font-size="11" fill="{MUTED}">AS REPORTED IN PROFESSIONAL PRACTICE · NOT LIVE TELEMETRY</text>
{grid}{''.join(cells)}
</svg>
"""


def cite(src_id, sources):
    s = sources[src_id]
    if s["kind"] == "repo" and s.get("released", True):
        return f"[`{s['label']}`]({s['url']})"
    if s["kind"] == "repo":
        return f"`{s['label']}` *(release pending)*"
    return f"*{s['label']}*"


def readme(d):
    who, src, focus = d["subject"], d["sources"], d["focus"]["cloud-security"]
    host = SITE.split("//")[1]
    stats = " · ".join(f"**{s['figure']}** {s['label']}" for s in who["stats"])
    focus_links = " · ".join(f"[{v['label']}]({SITE}{v['path'] + '/' if v['path'] else ''})" for v in d["focus"].values())
    out = [
        '<p align="center"><img src="./assets/header.svg" width="100%" alt="Sai Vignesh Rayal — Cloud Security Engineer" /></p>',
        "",
        focus["summary"],
        "",
        stats,
        "",
        f"**The full portfolio** — a descent through a cloud estate, one layer at a time: [{host}]({SITE})  ",
        f"<sub>Read by focus: {focus_links}</sub>",
        f"**Field notes** — [The Boundary]({SITE}journal/): newspaper-style articles and drawings from the labs.",
        "",
    ]
    for i, lay in enumerate(d["layers"], 1):
        out += [f"<details{' open' if i == 1 else ''}>",
                f"<summary><code>{i:02d} · {lay['title'].upper()}</code> <b>{lay['question']}</b> — <i>{lay['statement']}</i></summary>", "",
                "`" + "` · `".join(lay["tools"]) + "`", ""]
        out += [f"- {m['text']}  \n  ↳ {cite(m['src'], src)}" for m in lay["work"]]
        out += ["", "</details>", ""]
    out += ['<p align="center"><img src="./assets/ledger.svg" width="100%" alt="Outcome figures as reported in professional practice" /></p>', "",
            "## Experience", "", "| Period | Role | Scope |", "|---|---|---|"]
    out += [f"| {t['from']} – {t['to']} | **{t['title']}** | {t['scope']} |" for t in d["timeline"]]
    out += ["", "## Leadership", ""] + [f"- {x['text']}" for x in d["leadership"]]
    repos = [k for k, s in src.items() if s["kind"] == "repo"]
    out += ["", "## Evidence", "", "| Repository | Statements citing it |", "|---|---|"]
    out += [f"| {cite(k, src)} | {sum(m['src'] == k for l in d['layers'] for m in l['work'])} |" for k in repos]
    out += ["", "**Open items** — stated plainly.", "", "| ID | Item | Where |", "|---|---|---|"]
    out += [f"| `{x['id']}` | {x['item']} | {cite(x['src'], src)} |" for x in d["poam"]]
    edu = who["education"]
    out += ["", "## Education", "", f"**{edu['name']}** — {edu['detail']}", "",
            "## Contact", "", f"[{who['contact']['email']}](mailto:{who['contact']['email']}) · {who['location']}", "",
            "---", "",
            f"<sub>{d['package']['note']} Generated from <code>profile.json</code> — the same source as the site and the artwork. "
            "Typefaces: Instrument Serif and IBM Plex (SIL Open Font License), self-hosted. No trackers or third-party requests.</sub>", ""]
    return "\n".join(out)


def main():
    d = json.loads((ROOT / "profile.json").read_text(encoding="utf-8"))
    (ROOT / "assets/header.svg").write_text(header(d), encoding="utf-8", newline="\n")
    (ROOT / "assets/ledger.svg").write_text(ledger(d), encoding="utf-8", newline="\n")
    (ROOT / "README.md").write_text(readme(d), encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
