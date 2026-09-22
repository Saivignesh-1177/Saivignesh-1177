/* ============================================================
   SAI VIGNESH RAYAL — LIVE PORTFOLIO
   Animation system + public GitHub data.

   Sections
     A. CONFIG            — all tunable values in one place
     B. RUNTIME           — shared state, rAF scheduler, helpers
     C. ANIMATION MODULES — parallax, lamp, papers, compass,
                            clock, map telemetry, network graph,
                            terminal, dust
     D. GITHUB DATA       — public REST API only, no tokens
     E. BOOT

   All visual telemetry on this page is a SIMULATED VISUALIZATION.
   No real security events, alerts or attack data are represented.
   ============================================================ */

/* ---------- A. CONFIG --------------------------------------- */
const CONFIG = {
  github: {
    user: 'Saivignesh-1177',
    api: 'https://api.github.com',
    reposShown: 4
  },
  parallax: {
    maxShift: 18,      // px, per the deepest layer
    ease: 0.045        // interpolation factor — deliberately slow
  },
  lamp: {
    base: 0.72,
    amplitude: 0.08,   // brightness swing
    speed: 0.00007     // radians per ms — extremely slow
  },
  papers: {
    amplitude: 1.6,    // px — keep under 2px
    speed: 0.00012
  },
  compass: {
    amplitude: 5,      // degrees
    speed: 0.00006
  },
  map: {
    points: 26,
    linkEveryMs: 2600,
    linkLifeMs: 2400
  },
  graph: {
    nodes: ['CLOUD', 'IDENTITY', 'WORKLOADS', 'DATA', 'MONITORING', 'RESPONSE'],
    pulseSpeed: 0.0009
  },
  terminal: {
    lines: [
      '[cloud] posture assessment',
      '[identity] access review',
      '[infra] configuration baseline',
      '[iac] deployment validation',
      '[monitoring] telemetry active',
      '[response] incident workflow ready'
    ],
    typeMs: 42,
    holdMs: 2200
  },
  dust: {
    count: 26,
    speed: 0.012
  },
  palette: {
    brass: '#A88A5A',
    brassLight: '#D3BF98',
    burgundy: '#5A161E',
    muted: '#AAA094',
    border: '#3A3030'
  }
};

/* ---------- B. RUNTIME -------------------------------------- */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReduced = () => reduceMotion.matches;

/** Single requestAnimationFrame loop shared by every module. */
const loop = {
  tasks: [],
  running: false,
  add(fn) { this.tasks.push(fn); },
  start() {
    if (this.running) return;
    this.running = true;
    const tick = (now) => {
      for (let i = 0; i < this.tasks.length; i++) this.tasks[i](now);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
};

/** Pause the loop's visual work while the tab is hidden. */
let visible = !document.hidden;
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min, max) => min + Math.random() * (max - min);
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Size a canvas to its CSS box, accounting for device pixel ratio. */
function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: rect.width, h: rect.height };
}

/* ---------- C. ANIMATION MODULES ---------------------------- */

/* C1. Parallax — layers drift with the pointer, never chase it. */
function initParallax() {
  const layers = $$('.layer[data-depth]');
  if (!layers.length || prefersReduced()) return;

  const pointer = { x: 0, y: 0 };   // target, normalised -1..1
  const current = { x: 0, y: 0 };   // eased value

  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  loop.add(() => {
    if (!visible) return;
    current.x = lerp(current.x, pointer.x, CONFIG.parallax.ease);
    current.y = lerp(current.y, pointer.y, CONFIG.parallax.ease);
    for (const layer of layers) {
      const depth = parseFloat(layer.dataset.depth) || 0;
      const dx = -current.x * CONFIG.parallax.maxShift * depth;
      const dy = -current.y * CONFIG.parallax.maxShift * depth;
      // transform only — never layout properties
      layer.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
    }
  });
}

/* C2. Ambient light — the desk lamp breathes, very slowly. */
function initLamp() {
  const root = document.documentElement;
  if (prefersReduced()) return;
  const { base, amplitude, speed } = CONFIG.lamp;
  loop.add((now) => {
    if (!visible) return;
    // two detuned sines so the flicker never reads as a loop
    const v = base
      + Math.sin(now * speed) * amplitude
      + Math.sin(now * speed * 2.7) * amplitude * 0.35;
    root.style.setProperty('--lamp', v.toFixed(3));
  });
}

/* C3. Paper movement — sub-2px drift on loose documents. */
function initPapers() {
  const papers = $$('[data-drift]');
  if (!papers.length || prefersReduced()) return;
  const { amplitude, speed } = CONFIG.papers;
  const seeds = papers.map((el, i) => ({
    el,
    phase: i * 1.7,
    rotation: parseFloat((el.style.transform || '').replace(/[^-\d.]/g, '')) || 0
  }));
  loop.add((now) => {
    if (!visible) return;
    for (const s of seeds) {
      const dy = Math.sin(now * speed + s.phase) * amplitude;
      const dx = Math.cos(now * speed * 0.8 + s.phase) * amplitude * 0.6;
      s.el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
    }
  });
}

/* C4. Compass — the brass needle settles and drifts. */
function initCompass() {
  const needle = document.getElementById('compass-needle');
  if (!needle || prefersReduced()) return;
  const { amplitude, speed } = CONFIG.compass;
  loop.add((now) => {
    if (!visible) return;
    const deg = Math.sin(now * speed) * amplitude + Math.sin(now * speed * 3.3) * amplitude * 0.25;
    needle.style.transform = `rotate(${deg.toFixed(2)}deg)`;
  });
}

/* C5. Clock — a real local clock, updated every second. */
function initClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const fmt = new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const render = () => {
    const now = new Date();
    el.textContent = fmt.format(now);
    el.setAttribute('datetime', now.toISOString());
  };
  render();
  setInterval(render, 1000);
}

/* C6. Security map — abstract telemetry over the aged world map.
      Brass points rest on the map; thin links occasionally illuminate.
      These are NOT real events. */
function initMap() {
  const canvas = document.getElementById('map-canvas');
  if (!canvas) return;
  let view = fitCanvas(canvas);
  if (!view) return;

  const points = Array.from({ length: CONFIG.map.points }, () => ({
    x: rand(0.04, 0.96),
    y: rand(0.08, 0.86),
    phase: rand(0, Math.PI * 2)
  }));
  const links = [];
  let lastLink = 0;

  window.addEventListener('resize', () => { view = fitCanvas(canvas) || view; }, { passive: true });

  loop.add((now) => {
    if (!visible) return;
    const { ctx, w, h } = view;
    ctx.clearRect(0, 0, w, h);

    if (!prefersReduced() && now - lastLink > CONFIG.map.linkEveryMs) {
      lastLink = now;
      const a = points[Math.floor(Math.random() * points.length)];
      const b = points[Math.floor(Math.random() * points.length)];
      if (a !== b) links.push({ a, b, born: now });
    }

    // links
    for (let i = links.length - 1; i >= 0; i--) {
      const link = links[i];
      const age = (now - link.born) / CONFIG.map.linkLifeMs;
      if (age >= 1) { links.splice(i, 1); continue; }
      const alpha = Math.sin(age * Math.PI) * 0.5;
      const ax = link.a.x * w, ay = link.a.y * h;
      const bx = link.b.x * w, by = link.b.y * h;
      const cx = (ax + bx) / 2, cy = (ay + by) / 2 - Math.abs(bx - ax) * 0.18;
      ctx.strokeStyle = `rgba(168,138,90,${alpha.toFixed(3)})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(cx, cy, bx, by);
      ctx.stroke();
    }

    // points
    for (const p of points) {
      const pulse = prefersReduced() ? 0.5 : 0.35 + Math.sin(now * 0.0008 + p.phase) * 0.2;
      ctx.fillStyle = `rgba(211,191,152,${pulse.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/* C7. Network graph — the six security domains, gently pulsing. */
function initGraph() {
  const canvas = document.getElementById('graph-canvas');
  if (!canvas) return;
  let view = fitCanvas(canvas);
  if (!view) return;

  const labels = CONFIG.graph.nodes;
  const nodes = labels.map((label, i) => {
    const angle = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
    return { label, angle, phase: i * 0.9 };
  });
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    edges.push([i, (i + 1) % nodes.length]);
    edges.push([i, (i + 2) % nodes.length]);
  }

  window.addEventListener('resize', () => { view = fitCanvas(canvas) || view; }, { passive: true });

  loop.add((now) => {
    if (!visible) return;
    const { ctx, w, h } = view;
    const cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) * 0.36;
    ctx.clearRect(0, 0, w, h);

    const pos = nodes.map((n) => ({
      x: cx + Math.cos(n.angle) * r * 1.5,
      y: cy + Math.sin(n.angle) * r,
      n
    }));

    // edges — pulse travels along each connection
    for (let i = 0; i < edges.length; i++) {
      const [a, b] = edges[i];
      const t = prefersReduced() ? 0.3 : (Math.sin(now * CONFIG.graph.pulseSpeed + i) + 1) / 2;
      ctx.strokeStyle = `rgba(168,138,90,${(0.08 + t * 0.20).toFixed(3)})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(pos[a].x, pos[a].y);
      ctx.lineTo(pos[b].x, pos[b].y);
      ctx.stroke();
    }

    // nodes
    ctx.font = '7px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of pos) {
      const glow = prefersReduced() ? 0.6 : 0.45 + Math.sin(now * 0.0011 + p.n.phase) * 0.25;
      ctx.fillStyle = `rgba(211,191,152,${glow.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(170,160,148,${(0.55 + glow * 0.3).toFixed(3)})`;
      ctx.fillText(p.n.label, p.x, p.y - 9);
    }
  });
}

/* C8. Terminal — a controlled, rotating, clearly simulated sequence. */
function initTerminal() {
  const line = document.getElementById('terminal-line');
  if (!line) return;
  const { lines, typeMs, holdMs } = CONFIG.terminal;

  if (prefersReduced()) {
    line.textContent = lines[0];
    return;
  }

  let index = 0, char = 0, phase = 'type', last = 0;
  loop.add((now) => {
    if (!visible) return;
    if (phase === 'type') {
      if (now - last < typeMs) return;
      last = now;
      char++;
      line.textContent = lines[index].slice(0, char);
      if (char >= lines[index].length) { phase = 'hold'; last = now; }
    } else if (phase === 'hold') {
      if (now - last < holdMs) return;
      phase = 'erase'; last = now;
    } else {
      if (now - last < typeMs / 2) return;
      last = now;
      char--;
      line.textContent = lines[index].slice(0, Math.max(char, 0));
      if (char <= 0) { phase = 'type'; index = (index + 1) % lines.length; }
    }
  });
}

/* C9. Dust — extremely sparse, nearly invisible particles. */
function initDust() {
  const canvas = document.getElementById('dust-canvas');
  if (!canvas || prefersReduced()) return;
  let view = fitCanvas(canvas);
  if (!view) return;

  let motes = [];
  const seed = () => {
    motes = Array.from({ length: CONFIG.dust.count }, () => ({
      x: rand(0, view.w), y: rand(0, view.h),
      r: rand(0.5, 1.4),
      vx: rand(-CONFIG.dust.speed, CONFIG.dust.speed) * 30,
      vy: rand(-CONFIG.dust.speed, CONFIG.dust.speed) * 18,
      a: rand(0.04, 0.16)
    }));
  };
  seed();

  window.addEventListener('resize', () => {
    const next = fitCanvas(canvas);
    if (next) { view = next; seed(); }
  }, { passive: true });

  let prev = 0;
  loop.add((now) => {
    if (!visible) return;
    const dt = Math.min(now - prev, 48); prev = now;
    const { ctx, w, h } = view;
    ctx.clearRect(0, 0, w, h);
    for (const m of motes) {
      m.x += m.vx * dt * 0.01;
      m.y += m.vy * dt * 0.01;
      if (m.x < -5) m.x = w + 5; else if (m.x > w + 5) m.x = -5;
      if (m.y < -5) m.y = h + 5; else if (m.y > h + 5) m.y = -5;
      ctx.fillStyle = `rgba(236,228,215,${m.a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/* ---------- D. GITHUB DATA ---------------------------------- */
/* Public, unauthenticated endpoints only. Never embed a token here. */

const FALLBACK = 'Signal unavailable';

function setSignal(key, value) {
  for (const el of $$(`[data-gh="${key}"]`)) {
    el.textContent = value === null || value === undefined ? FALLBACK : value;
  }
}

async function getJSON(url) {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`GitHub request failed: ${res.status}`);
  return res.json();
}

async function loadProfile() {
  const { api, user } = CONFIG.github;
  try {
    const profile = await getJSON(`${api}/users/${user}`);
    setSignal('repos', profile.public_repos);
    setSignal('followers', profile.followers);
  } catch (err) {
    console.warn('[github] profile signal unavailable:', err.message);
    // leave the fallback text in place — never show a fabricated 0
  }
}

async function loadRepos() {
  const { api, user, reposShown } = CONFIG.github;
  const list = document.getElementById('repo-list');
  try {
    const repos = await getJSON(`${api}/users/${user}/repos?per_page=100&sort=updated`);
    const visibleRepos = repos.filter((r) => !r.fork);

    const stars = visibleRepos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    setSignal('stars', stars);

    const languages = [...new Set(visibleRepos.map((r) => r.language).filter(Boolean))];
    setSignal('languages', languages.length ? languages.slice(0, 5).join(' · ') : null);

    if (!list) return;
    const recent = visibleRepos.slice(0, reposShown);
    if (!recent.length) return;

    const fmtDate = new Intl.DateTimeFormat([], { year: 'numeric', month: 'short', day: 'numeric' });
    list.innerHTML = '';
    for (const repo of recent) {
      const li = document.createElement('li');

      const name = document.createElement('a');
      name.className = 'repos__name';
      name.href = repo.html_url;
      name.rel = 'noopener';
      name.textContent = repo.name;

      const desc = document.createElement('span');
      desc.className = 'repos__desc';
      desc.textContent = repo.description || 'No public description.';

      const meta = document.createElement('span');
      meta.className = 'repos__meta';
      meta.textContent = [
        repo.language,
        `${repo.stargazers_count} stars`,
        `updated ${fmtDate.format(new Date(repo.pushed_at))}`
      ].filter(Boolean).join(' · ');

      li.append(name, desc, meta);
      list.append(li);
    }
  } catch (err) {
    console.warn('[github] repository signal unavailable:', err.message);
  }
}

/* ---------- E. BOOT ----------------------------------------- */
function boot() {
  initClock();
  initParallax();
  initLamp();
  initPapers();
  initCompass();
  initMap();
  initGraph();
  initTerminal();
  initDust();
  loop.start();

  loadProfile();
  loadRepos();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
