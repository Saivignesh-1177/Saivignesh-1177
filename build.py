"""Render index.html and the SVR seal from profile.json (the single source of truth).

    python build.py          # writes index.html, assets/seal.svg, assets/favicon.svg
    python build.py --check  # exits 1 if the committed files are stale
"""
import hashlib
import html
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "profile.json"

# Monogram strokes on a 40x40 grid: S, V, R, each 8 units tall.
LETTERS = ("M14.5 16H11.5A2 2 0 0 0 11.5 20H12.5A2 2 0 0 1 12.5 24H9.5"
           "M16.5 16L20 24L23.5 16"
           "M25.5 24V16H28.5A2 2 0 0 1 28.5 20H25.5M28 20L30.5 24")


def seal(families, stroke="currentColor"):
    """Ring with one tick per control family, starting at 12 o'clock."""
    ticks = []
    for i in range(families):
        a = -math.pi / 2 + 2 * math.pi * i / families
        x1, y1 = 20 + 15.2 * math.cos(a), 20 + 15.2 * math.sin(a)
        x2, y2 = 20 + 18.2 * math.cos(a), 20 + 18.2 * math.sin(a)
        ticks.append(f"M{x1:.2f} {y1:.2f}L{x2:.2f} {y2:.2f}")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" stroke="{stroke}" '
            f'stroke-linecap="square" role="img" aria-label="SVR seal">'
            f'<circle cx="20" cy="20" r="13" stroke-width=".6"/>'
            f'<path d="{"".join(ticks)}" stroke-width="1.2"/>'
            f'<path d="{LETTERS}" stroke-width="1.15"/></svg>')


def e(s):
    return html.escape(str(s), quote=True)


def chip(src_id, sources):
    s = sources[src_id]
    if s["kind"] == "repo" and s.get("released", True):
        return f'<a class="src src-repo" href="{e(s["url"])}">{e(s["label"])}</a>'
    if s["kind"] == "repo":
        return f'<span class="src src-pending" title="Repository not yet public">{e(s["label"])} · release pending</span>'
    return f'<span class="src">{e(s["label"])}</span>'


def layer(i, lay, d):
    src = d["sources"]
    controls = [c for c in d["controls"] if c["family"] in lay["families"]]
    blocks = "".join(
        f'<div class="family"><p class="fam">{e(c["family"])} · {e(c["name"])}</p>'
        f'<p class="stmt">{e(c["statement"])}</p><ol>'
        + "".join(f'<li><p>{e(m["text"])}</p>{chip(m["src"], src)}</li>' for m in c["implementation"])
        + "</ol></div>"
        for c in controls)
    extra = ""
    if lay["id"] == "evidence":
        repos = "".join(
            f'<li>{chip(k, src)}<span>{sum(m["src"] == k for c in d["controls"] for m in c["implementation"])} statements cite it</span></li>'
            for k, s in src.items() if s["kind"] == "repo")
        poam = "".join(f'<tr><td>{e(x["id"])}</td><td>{e(x["item"])}</td><td>Open</td></tr>' for x in d["poam"])
        extra = (f'<div class="family"><p class="fam">Repositories</p><ul class="repos">{repos}</ul></div>'
                 f'<div class="family"><p class="fam">Plan of action &amp; milestones</p>'
                 f'<p class="stmt">Open work, stated plainly.</p><table><tbody>{poam}</tbody></table></div>')
    n = len(d["layers"])
    return f"""
<section class="layer" id="{e(lay["id"])}" data-scene="{e(lay["id"])}" data-depth="{i:02d}" data-title="{e(lay["title"])}" aria-labelledby="{e(lay["id"])}-h">
  <div class="stage">
    <p class="depth"><span>{i:02d}</span>/{n:02d} · {e(lay["title"])}</p>
    <h2 id="{e(lay["id"])}-h">{e(lay["question"])}</h2>
    <p class="scene-cap">{e(lay["scene"])} {chip(lay["src"], src)}</p>
  </div>
  <div class="work">{blocks}{extra}</div>
</section>"""


def render(d, digest):
    p, who, src = d["package"], d["subject"], d["sources"]
    layers = "".join(layer(i + 1, lay, d) for i, lay in enumerate(d["layers"]))
    gauge = "".join(f'<li data-for="{e(l["id"])}"><span>{i + 1:02d}</span>{e(l["title"])}</li>'
                    for i, l in enumerate(d["layers"]))
    history = "".join(
        f'<li><p class="when">{e(h["from"])} — {e(h["to"])}</p><div><h3>{e(h["title"])}</h3>'
        f'<p>{e(h["org"])} · {e(h["place"])}</p></div></li>' for h in d["history"])
    creds = "".join(f'<li><p class="fam">{e(c["type"])}</p><p>{e(c["name"])}</p>'
                    + (f'<p class="detail">{e(c["detail"])}</p>' if c.get("detail") else "") + "</li>"
                    for c in who["credentials"])
    roles = " · ".join(e(r) for r in who["roles_in_scope"])
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
<title>{e(who["name"])} — {e(who["role"])}</title>
<meta name="description" content="{e(who["summary"])}">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/instrument-serif-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="styles.css">
<script src="app.js" defer></script>
</head>
<body>
<a class="skip" href="#identity">Skip to content</a>
<canvas id="field" aria-hidden="true"></canvas>

<header class="masthead">
  <a class="mark" href="#top" aria-label="Back to the surface">{seal(len(d["controls"]))}</a>
  <p class="altimeter" aria-hidden="true"><span id="alt-depth">00</span> <span id="alt-name">Surface · the internet</span></p>
</header>

<nav class="gauge" aria-label="Layers"><ol>{gauge}</ol></nav>

<main>
<section class="layer hero" id="top" data-scene="internet" data-depth="00" data-title="Surface · the internet">
  <div class="stage">
    <p class="depth"><span>00</span> · The open internet</p>
    <h1>{e(who["name"])}</h1>
    <p class="role">{e(who["role"])}</p>
    <p class="summary">{e(who["summary"])}</p>
    <p class="descend">A cloud estate is a stack of decisions about trust. Scroll down through one — every layer holds work I have done.</p>
    <p class="cue" aria-hidden="true">Descend <span>↓</span></p>
  </div>
</section>
{layers}
<section class="layer record" id="record" data-scene="surface" data-depth="—" data-title="The record" aria-labelledby="record-h">
  <div class="stage">
    <p class="depth"><span>—</span> · Back at the surface</p>
    <h2 id="record-h">The record.</h2>
    <p class="scene-cap">{roles}</p>
  </div>
  <div class="work">
    <div class="family"><p class="fam">Operating history</p><ol class="history">{history}</ol></div>
    <div class="family"><p class="fam">Credentials</p><ul class="creds">{creds}</ul></div>
    <div class="family contact">
      <a href="mailto:{e(who["contact"]["email"])}">{e(who["contact"]["email"])}</a>
      <a href="{e(who["contact"]["github"])}">github.com/Saivignesh-1177</a>
      <span>{e(who["location"])}</span>
    </div>
  </div>
</section>
</main>

<footer class="integrity">
  <p>{e(p["note"])}</p>
  <p>Integrity seal · SHA-256 of <a href="profile.json">profile.json</a> <code id="seal" data-digest="{digest}">{digest}</code></p>
  <p id="verify" aria-live="polite">Verification runs in your browser when scripts are enabled.</p>
  <p>Set in Instrument Serif and IBM Plex, self-hosted under the SIL Open Font License. Particle field hand-written, no libraries, no trackers. <button type="button" id="motion">Pause motion</button></p>
</footer>
</body>
</html>
"""


def outputs():
    raw = DATA.read_bytes()
    d = json.loads(raw.decode("utf-8"))
    digest = hashlib.sha256(raw).hexdigest()
    n = len(d["controls"])
    return {
        ROOT / "index.html": render(d, digest),
        ROOT / "assets/seal.svg": seal(n, "#E9E1D3"),
        ROOT / "assets/favicon.svg": seal(n, "#9E2B2B"),
    }


def main():
    stale = []
    for path, text in outputs().items():
        if "--check" in sys.argv:
            if not path.exists() or path.read_text(encoding="utf-8") != text:
                stale.append(path.name)
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding="utf-8", newline="\n")
    if stale:
        sys.exit("stale: " + ", ".join(stale) + " — run python build.py")


if __name__ == "__main__":
    main()
