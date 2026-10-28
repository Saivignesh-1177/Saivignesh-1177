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


def render(d, digest):
    p, who, src = d["package"], d["subject"], d["sources"]
    roles = "".join(f"<li>{e(r)}</li>" for r in who["roles_in_scope"])
    rail = "".join(f'<li><a href="#c{i + 1}"><span>{e(c["family"])}</span>{e(c["name"])}</a></li>'
                   for i, c in enumerate(d["controls"]))
    controls = "".join(
        f'<article class="control" id="c{i + 1}">'
        f'<header><p class="fam">§3.{i + 1} · {e(c["family"])}</p><h3>{e(c["name"])}</h3>'
        f'<p class="stmt">{e(c["statement"])}</p></header><ol>'
        + "".join(f'<li><p>{e(m["text"])}</p>{chip(m["src"], src)}</li>' for m in c["implementation"])
        + "</ol></article>"
        for i, c in enumerate(d["controls"]))
    history = "".join(
        f'<li><p class="when">{e(h["from"])} — {e(h["to"])}</p><div><h3>{e(h["title"])}</h3>'
        f'<p>{e(h["org"])} · {e(h["place"])}</p></div></li>' for h in d["history"])
    evidence = "".join(
        f'<li><h3>{chip(k, src)}</h3>'
        f'<p>{sum(m["src"] == k for c in d["controls"] for m in c["implementation"])} control statements cite this repository.</p></li>'
        for k, s in src.items() if s["kind"] == "repo")
    poam = "".join(f'<tr><td>{e(x["id"])}</td><td>{e(x["item"])}</td><td>{chip(x["src"], src)}</td><td>Open</td></tr>'
                   for x in d["poam"])
    creds = "".join(f'<li><p class="kind">{e(c["type"])}</p><p>{e(c["name"])}</p>'
                    + (f'<p class="detail">{e(c["detail"])}</p>' if c.get("detail") else "") + "</li>"
                    for c in who["credentials"])
    total = sum(len(c["implementation"]) for c in d["controls"])
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
<title>{e(who["name"])} — {e(p["title"])} {e(p["id"])}</title>
<meta name="description" content="{e(who["role"])}. {e(who["summary"])}">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/instrument-serif-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="styles.css">
<script src="app.js" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="masthead">
  <a class="mark" href="#top" aria-label="Top">{seal(len(d["controls"]))}</a>
  <dl class="control-block">
    <div><dt>Package</dt><dd>{e(p["id"])}</dd></div>
    <div><dt>Revision</dt><dd>{e(p["revision"])}</dd></div>
    <div><dt>Dated</dt><dd><time datetime="{e(p["date"])}">{e(p["date"])}</time></dd></div>
    <div><dt>Statements</dt><dd>{total} · all sourced</dd></div>
  </dl>
</header>

<main id="main">
<section class="hero" id="top">
  <p class="eyebrow">§1 · System identification</p>
  <h1>{e(who["name"])}</h1>
  <p class="role">{e(who["role"])}</p>
  <p class="summary">{e(who["summary"])}</p>
  <p class="note">{e(p["note"])}</p>
</section>

<section class="scope" aria-labelledby="scope-h">
  <h2 id="scope-h"><span>§2</span> Roles in scope</h2>
  <ul class="roles">{roles}</ul>
</section>

<section class="implementation" aria-labelledby="impl-h">
  <h2 id="impl-h"><span>§3</span> Control implementation</h2>
  <div class="split">
    <nav class="rail" aria-label="Control families"><ol>{rail}</ol></nav>
    <div class="controls">{controls}</div>
  </div>
</section>

<section aria-labelledby="ev-h">
  <h2 id="ev-h"><span>§4</span> Evidence</h2>
  <ul class="evidence">{evidence}</ul>
</section>

<section aria-labelledby="hist-h">
  <h2 id="hist-h"><span>§5</span> Operating history</h2>
  <ol class="history">{history}</ol>
</section>

<section aria-labelledby="poam-h">
  <h2 id="poam-h"><span>§6</span> Plan of action &amp; milestones</h2>
  <p class="lede">Open work, stated plainly. A package without open items has not been looked at closely.</p>
  <div class="table"><table>
    <thead><tr><th scope="col">ID</th><th scope="col">Item</th><th scope="col">Where</th><th scope="col">Status</th></tr></thead>
    <tbody>{poam}</tbody>
  </table></div>
</section>

<section aria-labelledby="auth-h" class="auth">
  <h2 id="auth-h"><span>§7</span> Credentials &amp; contact</h2>
  <ul class="creds">{creds}</ul>
  <p class="contact"><a href="mailto:{e(who["contact"]["email"])}">{e(who["contact"]["email"])}</a>
  <a href="{e(who["contact"]["github"])}">github.com/Saivignesh-1177</a>
  <span>{e(who["location"])}</span></p>
</section>
</main>

<footer class="integrity">
  <div class="seal-line">
    <p>Integrity seal · SHA-256 of <a href="profile.json">profile.json</a></p>
    <code id="seal" data-digest="{digest}">{digest}</code>
    <p id="verify" aria-live="polite">Verification runs in your browser when scripts are enabled.</p>
  </div>
  <p class="colophon">Set in Instrument Serif and IBM Plex, self-hosted under the SIL Open Font License. No trackers, no third-party requests. <button type="button" id="print">Print package</button></p>
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
