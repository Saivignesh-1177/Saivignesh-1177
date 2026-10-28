// The descent: one particle field that re-forms into each layer of a cloud estate as you scroll.
// No libraries. The page is complete without this file.

const PAPER = [233, 225, 211], BRASS = [196, 165, 110], DENY = [214, 74, 64];
const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let paused = reduced, t = 0, w = 0, h = 0, dpr = 1, S = 0, cx = 0, cy = 0;

const N = matchMedia("(max-width: 52rem)").matches ? 720 : 1331;
const TAU = Math.PI * 2;
const frac = (v) => v - Math.floor(v);
const seed = new Float32Array(N * 4);  // deterministic, so every visit draws the same estate
for (let i = 0; i < seed.length; i++) seed[i] = frac(Math.sin(i * 12.9898 + 78.233) * 43758.5453);
const px = new Float32Array(N), py = new Float32Array(N), ox = new Float32Array(N), oy = new Float32Array(N);
const out = { x: 0, y: 0, c: PAPER, a: 0, s: 1 };
const smooth = (a, b, v) => { const k = Math.min(1, Math.max(0, (v - a) / (b - a))); return k * k * (3 - 2 * k); };

// Each scene writes particle i's target into `out`.
const scenes = {
  internet(i, a, b, c, d) {
    out.x = frac(a + t * 0.012 * (0.3 + c)) * w;
    out.y = (b + 0.018 * Math.sin(t * 0.6 + a * 40)) * h;
    out.c = d > 0.93 ? DENY : PAPER; out.a = 0.18 + 0.55 * d; out.s = c > 0.96 ? 2 : 1.2;
  },
  identity(i, a, b, c, d) {
    const verified = d < 0.16, gx = cx;
    let x = frac(a + t * 0.05 * (0.5 + c)) * w;
    const dist = Math.min(1, Math.abs(x - gx) / (w * 0.5));
    out.y = cy + (b - 0.5) * S * 0.95 * (0.08 + 0.92 * dist);
    if (!verified && x > gx - 4) { x = gx - 4 - c * 14; out.c = DENY; out.a = 0.22; }
    else if (verified && x > gx) { out.c = BRASS; out.a = 0.95; }
    else { out.c = PAPER; out.a = 0.42; }
    out.x = x; out.s = verified ? 1.8 : 1.2;
  },
  network(i, a, b, c, d) {
    const k = i % 4, rw = S * 0.34, rh = S * 0.22, g = S * 0.06;
    const rx = cx + (k % 2 ? g / 2 : -rw - g / 2), ry = cy + (k < 2 ? -rh - g / 2 : g / 2);
    const lane = Math.floor(b * 7);
    out.x = rx + frac(a + t * 0.035 * (0.4 + c) * (k === 3 ? 0.25 : 1)) * rw;
    out.y = ry + (lane + 0.5) / 7 * rh;
    out.c = k === 3 ? DENY : k === 1 ? BRASS : PAPER; out.a = k === 3 ? 0.75 : 0.55; out.s = 1.3;
  },
  workload(i, a, b, c, d) {
    const k = i % 8, th = -Math.PI / 2 + k * TAU / 8, q = frac(a + t * 0.11 * (0.5 + c));
    const wall = S * 0.17, allowed = k === 0;
    let r = q * S * 0.5;
    if (!allowed && r > wall) { r = wall; out.c = DENY; out.a = 0.85 * (1 - q); }
    else { out.c = allowed ? BRASS : PAPER; out.a = allowed ? 0.95 : 0.5; }
    const j = (b - 0.5) * 7;
    out.x = cx + Math.cos(th) * r - Math.sin(th) * j;
    out.y = cy + Math.sin(th) * r + Math.cos(th) * j;
    out.s = allowed ? 1.8 : 1.3;
  },
  data(i) {
    const gx = i % 11 - 5, gy = Math.floor(i / 11) % 11 - 5, gz = Math.floor(i / 121) % 11 - 5;
    const ry = t * 0.16, rx = 0.55, ca = Math.cos(ry), sa = Math.sin(ry);
    let X = gx * ca - gz * sa, Z = gx * sa + gz * ca, Y = gy;
    const Y2 = Y * Math.cos(rx) - Z * Math.sin(rx); Z = Y * Math.sin(rx) + Z * Math.cos(rx); Y = Y2;
    const f = 1 / (1 + Z / 24), sp = S * 0.042;
    out.x = cx + X * sp * f; out.y = cy + Y * sp * f;
    const core = gx === 0 && gy === 0 && gz === 0;
    out.c = core ? BRASS : PAPER; out.a = core ? 1 : 0.1 + 0.35 * (1 - (Z + 7) / 14); out.s = core ? 5 : 1.2;
  },
  detection(i, a, b, c, d) {
    const r = (Math.floor(b * 6) + 1) / 6 * S * 0.47, phi = a * TAU;
    const sweep = frac(t * 0.14) * TAU, delta = frac((sweep - phi) / TAU) * TAU;
    const glow = Math.exp(-delta * 2.4), anomaly = d > 0.986;
    out.x = cx + Math.cos(phi) * r; out.y = cy + Math.sin(phi) * r;
    out.c = anomaly && glow > 0.05 ? DENY : glow > 0.4 ? BRASS : PAPER;
    out.a = 0.08 + 0.9 * glow; out.s = anomaly ? 3 : 1.2;
  },
  evidence(i, a, b, c) {
    const rows = 16, cols = Math.ceil(N / rows), r = i % rows, col = Math.floor(i / rows);
    out.x = cx - S * 0.46 + (col / cols) * S * 0.92; out.y = cy - S * 0.3 + (r / (rows - 1)) * S * 0.6;
    const written = frac(t * 0.07) * 1.25 > col / cols;
    out.c = written ? BRASS : PAPER; out.a = c < 0.28 ? 0 : written ? 0.85 : 0.08; out.s = 1.5;
  },
  surface(i, a, b, c, d) {
    out.x = frac(a + t * 0.002) * w; out.y = (b + 0.004 * Math.sin(t * 0.2 + a * 30)) * h;
    out.c = PAPER; out.a = 0.06 + 0.3 * d * d; out.s = c > 0.98 ? 1.8 : 1;
  },
};

// Thin line-work drawn with each scene, weighted by how present the scene is.
function overlay(name, k) {
  if (k < 0.02) return;
  ctx.save(); ctx.globalAlpha = k; ctx.lineWidth = 1;
  ctx.font = "500 10px 'IBM Plex Mono', monospace"; ctx.fillStyle = "rgba(154,146,134,.9)";
  const stroke = (c, a) => (ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`);
  if (name === "identity") {
    stroke(BRASS, 0.8); ctx.beginPath(); ctx.moveTo(cx, cy - S * 0.42); ctx.lineTo(cx, cy + S * 0.42); ctx.stroke();
    ctx.fillText("VERIFY EXPLICITLY", cx + 10, cy - S * 0.38);
  } else if (name === "network") {
    const rw = S * 0.34, rh = S * 0.22, g = S * 0.06;
    ["MANAGEMENT", "SENSOR", "LAB", "QUARANTINE"].forEach((label, k2) => {
      const rx = cx + (k2 % 2 ? g / 2 : -rw - g / 2), ry = cy + (k2 < 2 ? -rh - g / 2 : g / 2);
      stroke(k2 === 3 ? DENY : PAPER, k2 === 3 ? 0.6 : 0.22); ctx.strokeRect(rx, ry, rw, rh);
      ctx.fillText(label, rx, ry - 6);
    });
    ctx.setLineDash([3, 5]); stroke(PAPER, 0.15);
    ctx.strokeRect(cx - rw - g * 1.5, cy - rh - g * 2, rw * 2 + g * 3, rh * 2 + g * 3.5); ctx.setLineDash([]);
    ctx.fillText("NO ROUTE OUT", cx - rw - g * 1.5, cy + rh + g * 2.6);
  } else if (name === "workload") {
    stroke(BRASS, 0.9); ctx.beginPath(); ctx.arc(cx, cy, 6, 0, TAU); ctx.stroke();
    ctx.setLineDash([2, 4]); stroke(DENY, 0.5); ctx.beginPath(); ctx.arc(cx, cy, S * 0.17 + 4, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillText("1 ALLOWED · 7 DENIED", cx + 12, cy - S * 0.5);
  } else if (name === "data") {
    stroke(BRASS, 0.7); ctx.beginPath(); ctx.arc(cx, cy, 16, 0, TAU); ctx.stroke();
    ctx.fillText("ONE SECRET", cx + 22, cy + 4);
  } else if (name === "detection") {
    for (let r = 1; r <= 6; r++) { stroke(PAPER, 0.06); ctx.beginPath(); ctx.arc(cx, cy, r / 6 * S * 0.47, 0, TAU); ctx.stroke(); }
    const s = frac(t * 0.14) * TAU; stroke(BRASS, 0.6);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(s) * S * 0.49, cy + Math.sin(s) * S * 0.49); ctx.stroke();
  } else if (name === "evidence") {
    ctx.fillText("CONTROL → TEST → EVIDENCE → SHA-256", cx - S * 0.46, cy - S * 0.36);
  }
  ctx.restore();
}

function resize() {
  dpr = Math.min(2, devicePixelRatio || 1);
  w = innerWidth; h = innerHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const wide = w > 832;
  S = wide ? Math.min(w * 0.5, h * 0.92) : Math.min(w * 0.95, h * 0.6);
  cx = wide ? w * 0.68 : w * 0.5; cy = wide ? h * 0.46 : h * 0.36;
}

const sections = [...document.querySelectorAll(".layer")];
const gaugeItems = new Map([...document.querySelectorAll(".gauge li")].map((li) => [li.dataset.for, li]));
const altDepth = document.getElementById("alt-depth"), altName = document.getElementById("alt-name");
let current = -1;

function position() {
  const probe = scrollY + h * 0.5;
  let k = 0;
  while (k < sections.length - 1 && sections[k + 1].offsetTop <= probe) k++;
  const s = sections[k], m = (probe - s.offsetTop) / s.offsetHeight;
  const next = sections[Math.min(k + 1, sections.length - 1)];
  if (k !== current) {
    current = k;
    altDepth.textContent = s.dataset.depth; altName.textContent = s.dataset.title;
    gaugeItems.forEach((li) => li.removeAttribute("aria-current"));
    gaugeItems.get(s.id)?.setAttribute("aria-current", "true");
  }
  return [s.dataset.scene, next.dataset.scene, next === s ? 0 : smooth(0.86, 1, m)];
}

let last = performance.now(), primed = false;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!paused) t += dt;
  const [A, B, mix] = position();
  ctx.clearRect(0, 0, w, h);
  const follow = primed ? 1 - Math.exp(-dt * 5) : 1;
  for (let i = 0; i < N; i++) {
    const a = seed[i * 4], b = seed[i * 4 + 1], c = seed[i * 4 + 2], d = seed[i * 4 + 3];
    scenes[A](i, a, b, c, d); const x1 = out.x, y1 = out.y, c1 = out.c, a1 = out.a, s1 = out.s;
    let x = x1, y = y1, col = c1, al = a1, sz = s1;
    if (mix > 0) {
      scenes[B](i, a, b, c, d);
      x = x1 + (out.x - x1) * mix; y = y1 + (out.y - y1) * mix; al = a1 + (out.a - a1) * mix; sz = s1 + (out.s - s1) * mix;
      col = mix > 0.5 ? out.c : c1;
    }
    ox[i] = px[i]; oy[i] = py[i];
    // A wrap or reset jumps instead of smearing across the scene.
    if (Math.abs(x - px[i]) > S * 0.2 || Math.abs(y - py[i]) > S * 0.2) { px[i] = ox[i] = x; py[i] = oy[i] = y; }
    else { px[i] += (x - px[i]) * follow; py[i] += (y - py[i]) * follow; }
    if (al < 0.02) continue;
    const style = `rgba(${col[0]},${col[1]},${col[2]},${al.toFixed(3)})`;
    const vx = px[i] - ox[i], vy = py[i] - oy[i];
    if (vx * vx + vy * vy > 0.6) {  // a short tail along the motion: trails without residue
      ctx.strokeStyle = style; ctx.lineWidth = sz * 0.85;
      ctx.beginPath(); ctx.moveTo(px[i] - vx * 4, py[i] - vy * 4); ctx.lineTo(px[i], py[i]); ctx.stroke();
    } else { ctx.fillStyle = style; ctx.fillRect(px[i], py[i], sz, sz); }
  }
  primed = true;
  overlay(A, 1 - mix); if (B !== A) overlay(B, mix);
  requestAnimationFrame(frame);
}

async function verifySeal() {
  const el = document.getElementById("verify");
  const expected = document.getElementById("seal").dataset.digest;
  try {
    const res = await fetch("profile.json", { cache: "no-store" });
    const buf = await crypto.subtle.digest("SHA-256", await res.arrayBuffer());
    const actual = [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
    el.dataset.state = actual === expected ? "pass" : "fail";
    el.textContent = actual === expected
      ? "Verified just now in your browser: profile.json matches the seal."
      : "Mismatch: profile.json hashes to " + actual + ". This page was altered after it was sealed.";
  } catch {
    el.textContent = "Could not fetch profile.json here (open over http to verify).";
  }
}

const motion = document.getElementById("motion");
motion.textContent = paused ? "Play motion" : "Pause motion";
motion.addEventListener("click", () => { paused = !paused; motion.textContent = paused ? "Play motion" : "Pause motion"; });
document.addEventListener("visibilitychange", () => { last = performance.now(); });
addEventListener("resize", resize);
resize();
document.documentElement.classList.add("live");
requestAnimationFrame(frame);
verifySeal();
