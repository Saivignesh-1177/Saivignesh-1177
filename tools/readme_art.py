"""Generate the README artwork from profile.json, with the fonts embedded so GitHub renders them as designed.

    python tools/readme_art.py   # writes assets/header.svg and assets/ledger.svg
"""
import base64
import json
import sys
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from build import LETTERS, seal  # noqa: E402  (same monogram as the site)

INK, RULE, PAPER, MUTED, OXBLOOD, BRASS = "#121110", "#2E2A26", "#E9E1D3", "#9A9286", "#9E2B2B", "#B89B68"

# Outcome figures exactly as stated in the résumé, with their source.
LEDGER = [
    ("35%", "more documented security-control coverage", "UW–Madison SMPH"),
    ("25%", "less high-risk misconfiguration exposure", "UW–Madison SMPH"),
    ("20%", "faster incident-response turnaround", "UW–Madison SMPH"),
    ("99.9%", "availability with Azure backup and DR", "Kgate"),
    ("40%", "less manual effort, Terraform and PowerShell", "Tata Consultancy Services"),
    ("500+", "devices under Intune and SCCM compliance", "Tata Consultancy Services"),
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


def mark(x, y, size, color):
    inner = seal(7, color).split(">", 1)[1].rsplit("</svg>", 1)[0]
    return f'<g transform="translate({x} {y}) scale({size / 40})" fill="none" stroke="{color}" stroke-linecap="square">{inner}</g>'


def header(d):
    who, p = d["subject"], d["package"]
    fams = d["controls"]
    total = sum(len(c["implementation"]) for c in fams)
    step = 1080 / len(fams)
    row = "".join(
        f'<text x="{60 + i * step:.0f}" y="372" class="mono" font-size="12" fill="{MUTED}">{escape(c["family"])}</text>'
        for i, c in enumerate(fams))
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="420" viewBox="0 0 1200 420" role="img" aria-label="{escape(who['name'])} — {escape(who['role'])}">
{STYLE}
<rect width="1200" height="420" fill="{INK}"/>
{mark(56, 40, 54, PAPER)}
<text x="1140" y="62" text-anchor="end" class="mono" font-size="12" fill="{MUTED}">PACKAGE {escape(p['id'])} · REV {escape(p['revision'])} · {total} STATEMENTS · ALL SOURCED</text>
<line x1="60" y1="118" x2="1140" y2="118" stroke="{RULE}"/>
<text x="60" y="160" class="mono" font-size="13" fill="{OXBLOOD}">§1 · SYSTEM IDENTIFICATION</text>
<text x="56" y="252" class="serif" font-size="96" fill="{PAPER}">{escape(who['name'])}</text>
<text x="60" y="302" class="serif" font-style="italic" font-size="32" fill="{BRASS}">{escape(who['role'])}</text>
<line x1="60" y1="340" x2="1140" y2="340" stroke="{RULE}"/>
{row}
</svg>
"""


def ledger():
    cells = []
    for i, (fig, what, src) in enumerate(LEDGER):
        x, y = 60 + (i % 3) * 360, 96 + (i // 3) * 150
        cells.append(
            f'<text x="{x}" y="{y + 44}" class="serif" font-size="58" fill="{PAPER}">{escape(fig)}</text>'
            f'<text x="{x}" y="{y + 78}" class="serif" font-style="italic" font-size="20" fill="{BRASS}">{escape(what)}</text>'
            f'<text x="{x}" y="{y + 104}" class="mono" font-size="11" fill="{MUTED}">↳ RÉSUMÉ · {escape(src.upper())}</text>')
    grid = (f'<line x1="60" y1="236" x2="1140" y2="236" stroke="{RULE}"/>'
            f'<line x1="400" y1="96" x2="400" y2="376" stroke="{RULE}"/>'
            f'<line x1="760" y1="96" x2="760" y2="376" stroke="{RULE}"/>')
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="430" viewBox="0 0 1200 430" role="img" aria-label="Outcome figures as reported in the résumé">
{STYLE}
<rect width="1200" height="430" fill="{INK}"/>
<text x="60" y="56" class="mono" font-size="13" fill="{OXBLOOD}">OUTCOME LEDGER</text>
<text x="1140" y="56" text-anchor="end" class="mono" font-size="11" fill="{MUTED}">AS REPORTED IN THE RÉSUMÉ · NOT LIVE TELEMETRY</text>
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
    who, src = d["subject"], d["sources"]
    site = "https://saivignesh-1177.github.io/Saivignesh-1177/"
    out = [
        '<p align="center"><img src="./assets/header.svg" width="100%" alt="Sai Vignesh Rayal — Cybersecurity Engineer, Cloud Security" /></p>',
        "",
        f"{who['summary']}",
        "",
        f"<sub>{d['package']['note']} The full package is at <a href=\"{site}\">{site.split('//')[1]}</a>.</sub>",
        "",
        "**Roles in scope** · " + " · ".join(who["roles_in_scope"]),
        "",
        "## §3 Control implementation",
        "",
    ]
    for i, c in enumerate(d["controls"], 1):
        out += [f"<details{' open' if i == 1 else ''}>",
                f"<summary><code>{c['family']}</code> <b>{c['name']}</b> — <i>{c['statement']}</i></summary>", ""]
        out += [f"- {m['text']}  \n  ↳ {cite(m['src'], src)}" for m in c["implementation"]]
        out += ["", "</details>", ""]
    repos = [k for k, s in src.items() if s["kind"] == "repo"]
    out += ["## §4 Evidence", "", "| Repository | Statements citing it |", "|---|---|"]
    out += [f"| {cite(k, src)} | {sum(m['src'] == k for c in d['controls'] for m in c['implementation'])} |" for k in repos]
    out += ["", '<p align="center"><img src="./assets/ledger.svg" width="100%" alt="Outcome figures as reported in the résumé" /></p>', "",
            "## §5 Operating history", "", "| Period | Role | Organisation |", "|---|---|---|"]
    out += [f"| {h['from']} – {h['to']} | {h['title']} | {h['org']} · {h['place']} |" for h in d["history"]]
    out += ["", "## §6 Plan of action & milestones", "", "Open work, stated plainly.", "", "| ID | Item | Where |", "|---|---|---|"]
    out += [f"| `{x['id']}` | {x['item']} | {cite(x['src'], src)} |" for x in d["poam"]]
    out += ["", "## §7 Credentials & contact", ""]
    out += [f"- **{c['name']}**" + (f" — {c['detail']}" if c.get("detail") else "") for c in who["credentials"]]
    out += ["", f"[{who['contact']['email']}](mailto:{who['contact']['email']}) · {who['location']}", "",
            "---", "",
            "<sub>Generated from <code>profile.json</code> — the same source as the site and the artwork. "
            "Typefaces: Instrument Serif and IBM Plex (SIL Open Font License), self-hosted. No trackers or third-party requests.</sub>", ""]
    return "\n".join(out)


def main():
    d = json.loads((ROOT / "profile.json").read_text(encoding="utf-8"))
    (ROOT / "assets/header.svg").write_text(header(d), encoding="utf-8", newline="\n")
    (ROOT / "assets/ledger.svg").write_text(ledger(), encoding="utf-8", newline="\n")
    (ROOT / "README.md").write_text(readme(d), encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
