"""Render the portfolio from profile.json (the single source of truth).

One page per focus (cloud security at /, then /iam/, /grc/, /devsecops/, /microsoft/). Every page tells the
same verified story in the same physical order — the descent through a cloud estate — but leads with the
role, summary and work that the focus calls for. Retarget by editing profile.json, never the HTML.

    python build.py          # writes every page plus assets/seal.svg and assets/favicon.svg
    python build.py --check  # exits 1 if anything committed is stale
"""
import hashlib
import html
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "profile.json"
SITE = "https://saivignesh-1177.github.io/Saivignesh-1177/"

# Monogram strokes on a 40x40 grid: S, V, R, each 8 units tall.
LETTERS = ("M14.5 16H11.5A2 2 0 0 0 11.5 20H12.5A2 2 0 0 1 12.5 24H9.5"
           "M16.5 16L20 24L23.5 16"
           "M25.5 24V16H28.5A2 2 0 0 1 28.5 20H25.5M28 20L30.5 24")


def seal(ticks, stroke="currentColor"):
    """Ring with one tick per layer, starting at 12 o'clock."""
    marks = []
    for i in range(ticks):
        a = -math.pi / 2 + 2 * math.pi * i / ticks
        x1, y1 = 20 + 15.2 * math.cos(a), 20 + 15.2 * math.sin(a)
        x2, y2 = 20 + 18.2 * math.cos(a), 20 + 18.2 * math.sin(a)
        marks.append(f"M{x1:.2f} {y1:.2f}L{x2:.2f} {y2:.2f}")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" stroke="{stroke}" '
            f'stroke-linecap="square" role="img" aria-label="SVR seal">'
            f'<circle cx="20" cy="20" r="13" stroke-width=".6"/>'
            f'<path d="{"".join(marks)}" stroke-width="1.2"/>'
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


def ordered(work, lead):
    """Work the focus calls for comes first; otherwise the order in profile.json stands."""
    return sorted(work, key=lambda m: 0 if set(m["tags"]) & set(lead) else 1)


def layer(i, lay, d, focus):
    src, n = d["sources"], len(d["layers"])
    items = "".join(f'<li><p>{e(m["text"])}</p>{chip(m["src"], src)}</li>' for m in ordered(lay["work"], focus["lead"]))
    tools = "".join(f"<li>{e(t)}</li>" for t in lay["tools"])
    extra = ""
    if lay["id"] == "evidence":
        repos = "".join(
            f'<li>{chip(k, src)}<span>{sum(m["src"] == k for l in d["layers"] for m in l["work"])} statements cite it</span></li>'
            for k, s in src.items() if s["kind"] == "repo")
        poam = "".join(f'<tr><td>{e(x["id"])}</td><td>{e(x["item"])}</td><td>Open</td></tr>' for x in d["poam"])
        extra = (f'<div class="aside"><p class="fam">Repositories</p><ul class="repos">{repos}</ul>'
                 f'<p class="fam">Open items</p><p class="lede">Stated plainly — a package without open items has not been examined closely.</p>'
                 f'<table><tbody>{poam}</tbody></table></div>')
    lid = e(lay["id"])
    return f"""
<section class="layer" id="{lid}" data-scene="{lid}" data-depth="{i:02d}" data-title="{e(lay["title"])}" aria-labelledby="{lid}-h">
  <div class="stage">
    <p class="depth"><span>{i:02d}</span>/{n:02d} · {e(lay["title"])}</p>
    <h2 id="{lid}-h">{e(lay["question"])}</h2>
    <p class="scene-cap">{e(lay["scene"])} {chip(lay["scene_src"], src)}</p>
  </div>
  <div class="work">
    <header class="work-head">
      <p class="fam">{e(lay["family"])} · {e(lay["name"])}</p>
      <p class="stmt">{e(lay["statement"])}</p>
      <ul class="tools" aria-label="Tools and practices">{tools}</ul>
    </header>
    <ol class="items">{items}</ol>{extra}
  </div>
</section>"""


def render(d, digest, key):
    who, src, p = d["subject"], d["sources"], d["package"]
    focus = d["focus"][key]
    base = "../" if focus["path"] else ""
    url = SITE + (focus["path"] + "/" if focus["path"] else "")
    layers = "".join(layer(i + 1, lay, d, focus) for i, lay in enumerate(d["layers"]))
    gauge = "".join(f'<li data-for="{e(l["id"])}"><span>{i + 1:02d}</span>{e(l["title"])}</li>' for i, l in enumerate(d["layers"]))
    stats = "".join(f'<li><span class="fig">{e(s["figure"])}</span><span class="lab">{e(s["label"])}</span></li>' for s in who["stats"])
    timeline = "".join(
        f'<li><p class="when">{e(t["from"])} — {e(t["to"])}</p><div><h3>{e(t["title"])}</h3><p>{e(t["scope"])}</p></div></li>'
        for t in d["timeline"])
    leadership = "".join(f'<li><p>{e(x["text"])}</p>{chip(x["src"], src)}</li>' for x in d["leadership"])
    others = " · ".join(
        f'<a href="{base}{v["path"] + "/" if v["path"] else ""}"{" aria-current=\"page\"" if k == key else ""}>{e(v["label"])}</a>'
        for k, v in d["focus"].items())
    total = sum(len(l["work"]) for l in d["layers"])
    edu = who["education"]
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
<title>{e(who["name"])} — {e(focus["role"])}</title>
<meta name="description" content="{e(focus["summary"])}">
<link rel="canonical" href="{e(url)}">
<link rel="icon" href="{base}assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="{base}assets/fonts/instrument-serif-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{base}styles.css">
<script src="{base}app.js" defer></script>
</head>
<body>
<a class="skip" href="#identity">Skip to content</a>
<canvas id="field" aria-hidden="true"></canvas>

<header class="masthead">
  <a class="mark" href="#top" aria-label="Back to the surface">{seal(len(d["layers"]))}</a>
  <p class="altimeter" aria-hidden="true"><span id="alt-depth">00</span> <span id="alt-name">Surface · the internet</span></p>
</header>

<nav class="gauge" aria-label="Layers"><ol>{gauge}</ol></nav>

<main>
<section class="layer hero" id="top" data-scene="internet" data-depth="00" data-title="Surface · the internet">
  <div class="stage">
    <p class="depth"><span>00</span> · {e(focus["label"])}</p>
    <h1>{e(who["name"])}</h1>
    <p class="role">{e(focus["role"])}</p>
    <p class="summary">{e(focus["summary"])}</p>
    <ul class="stats">{stats}</ul>
    <p class="cue"><span class="cue-text">A cloud estate is a stack of decisions about trust. Descend through one — each layer holds the work I have done there.</span> <span class="cue-arrow" aria-hidden="true">↓</span></p>
  </div>
</section>
{layers}
<section class="layer record" id="record" data-scene="surface" data-depth="—" data-title="The record" aria-labelledby="record-h">
  <div class="stage">
    <p class="depth"><span>—</span> · Back at the surface</p>
    <h2 id="record-h">The record.</h2>
    <p class="scene-cap">{total} statements, each traced to a period of practice or a public repository.</p>
  </div>
  <div class="work record-work">
    <div><p class="fam">Experience</p><ol class="timeline">{timeline}</ol></div>
    <div>
      <p class="fam">Leadership</p><ol class="items">{leadership}</ol>
      <p class="fam">Education</p><p class="edu">{e(edu["name"])}</p><p class="edu-detail">{e(edu["detail"])}</p>
    </div>
    <div class="contact">
      <a href="mailto:{e(who["contact"]["email"])}">{e(who["contact"]["email"])}</a>
      <a href="{e(who["contact"]["github"])}">github.com/Saivignesh-1177</a>
      <span>{e(who["location"])}</span>
    </div>
  </div>
</section>
</main>

<footer class="integrity">
  <p class="focus-nav">Read this record by focus: {others}</p>
  <p class="focus-nav">Field notes: <a href="{base}journal/">The Boundary — articles and drawings from the labs</a></p>
  <p>{e(p["note"])}</p>
  <p>Integrity seal · SHA-256 of <a href="{base}profile.json">profile.json</a> <code id="seal" data-src="{base}profile.json" data-digest="{digest}">{digest}</code></p>
  <p id="verify" aria-live="polite">Verification runs in your browser when scripts are enabled.</p>
  <p>Set in Instrument Serif and IBM Plex, self-hosted under the SIL Open Font License. Particle field written by hand — no libraries, no trackers, no third-party requests. <button type="button" id="motion">Pause motion</button></p>
</footer>
</body>
</html>
"""


def outputs():
    raw = DATA.read_bytes()
    d = json.loads(raw.decode("utf-8"))
    digest = hashlib.sha256(raw).hexdigest()
    files = {ROOT / "assets/seal.svg": seal(len(d["layers"]), "#E9E1D3"),
             ROOT / "assets/favicon.svg": seal(len(d["layers"]), "#9E2B2B")}
    for key, f in d["focus"].items():
        files[ROOT / f["path"] / "index.html" if f["path"] else ROOT / "index.html"] = render(d, digest, key)
    return files


def main():
    stale = []
    for path, text in outputs().items():
        if "--check" in sys.argv:
            if not path.exists() or path.read_text(encoding="utf-8") != text:
                stale.append(str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding="utf-8", newline="\n")
    if stale:
        sys.exit("stale: " + ", ".join(stale) + " — run python build.py")


if __name__ == "__main__":
    main()
