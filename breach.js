// Try to Breach Me — every outcome below is the recorded result from the lab run of 2026-10-28
// (azure-iam-zero-trust-lab, evidence/2026-10-28). Nothing is simulated beyond replaying those results.

const EVIDENCE = "https://github.com/Saivignesh-1177/azure-iam-zero-trust-lab/tree/main/evidence/2026-10-28";

const STAGES = [
  {
    id: "insider", title: "Foothold", who: "You are logged in as intern — a low-privilege user on the workload server.",
    moves: [
      { id: "a01", label: "Ask the identity service for the machine's token", cmd: "curl -H Metadata:true http://localhost:40342/metadata/identity/oauth2/token?resource=https://vault.azure.net",
        out: ["HTTP/1.1 401 Unauthorized", "WWW-Authenticate: Basic realm=/var/opt/azcmagent/tokens/….key", "$ cat /var/opt/azcmagent/tokens/*.key", "cat: Permission denied"],
        verdict: "held", control: "AC-6 · IA-9", why: "The identity service answers with a challenge that only a privileged process can read. The challenge key is not readable by intern, so no token is issued.",
        seen: "Denied file access recorded by auditd on the server.", ref: "EVD-013 · A01" },
      { id: "a02", label: "Hunt for credentials on disk and in the app's memory", cmd: "grep -rIE 'password|secret|token' / ; cat /proc/$(pidof zt-app)/environ",
        out: ["(no credential strings found)", "cat: /proc/…/environ: Permission denied"],
        verdict: "held", control: "IA-5(7)", why: "There is nothing to find. The app authenticates with a managed identity; no password, key or connection string exists on disk or in its environment.",
        seen: "Nothing to see — there was nothing to take.", ref: "EVD-013 · A02" },
      { id: "a07", label: "Try to escalate locally with sudo", cmd: "sudo -l ; sudo su -",
        out: ["sudo: refused — intern has no sudo rights", "attempt written to the audit log (auditd)"],
        verdict: "held", control: "AC-6 · AU-12", why: "intern has no sudo rights, and the attempt itself is evidence: auditd records it.",
        seen: "Attempt recorded by auditd (access_denied).", ref: "EVD-013 · A07" },
    ],
  },
  {
    id: "network", title: "From the network", who: "You are an anonymous client on the lab network, talking to the app's URL-fetch feature.",
    moves: [
      { id: "a03", label: "SSRF: make the app fetch the identity endpoint for you", cmd: "GET /fetch?url=http://localhost:40342/metadata/identity/oauth2/token",
        out: ["HTTP/1.1 401 Unauthorized  (challenge, not a token)", "Authorization header cannot be injected through the fetch → still no token", "GET /fetch?url=file:///var/opt/azcmagent/tokens/x.key", "200 OK — challenge key returned   ← FINDING F-005"],
        verdict: "finding", control: "SI-10 · SC-7", why: "The identity endpoint still refused to issue a token, but the fetch feature accepted file:// and could read the challenge key, because the app runs in the himds group. Logged as finding F-005, fixed with a scheme allow-list, internal-address blocking and no redirects.",
        seen: "Recorded as F-005 in the lab journal, then re-tested (next move).", ref: "EVD-013 · A03" },
      { id: "a08", label: "Re-test after the fix: try every bypass", cmd: "file:// · localhost · 127.0.0.1 · 2130706433 · [::1] · 169.254.169.254 · 192.168.56.1 · gopher://",
        out: ["blocked: file:///var/opt/azcmagent/tokens/x.key", "blocked: http://localhost:40342/…", "blocked: http://127.0.0.1:40342/", "blocked: http://2130706433:40342/   (decimal IP)", "blocked: http://[::1]:40342/", "blocked: http://169.254.169.254/metadata/instance", "blocked: http://192.168.56.1/", "blocked: gopher://localhost:40342/", "legitimate external URL still works"],
        verdict: "held", control: "SI-10 · SC-7", why: "Eight bypass techniques, eight refusals — and the feature still works for legitimate URLs. A finding is only closed when the re-test passes.",
        seen: "Re-test transcript kept as evidence.", ref: "EVD-013 · A08" },
    ],
  },
  {
    id: "root", title: "Assume breach: root", who: "Assume the worst. You are root on the server, and the machine's identity is yours. What can you reach?",
    moves: [
      { id: "r-read", label: "Read the app's secret", cmd: "GET https://<vault>.vault.azure.net/secrets/app-db-password",
        out: ["HTTP/1.1 200 OK", "{ \"value\": \"••••••••\" }   (36 characters)"], gain: true,
        verdict: "design", control: "AC-6", why: "This is the one thing the workload is meant to read. You have exactly what the app has — and, as the next moves show, nothing more.",
        seen: "Secret read logged by Key Vault and surfaced by the secret-reads-by-identity hunt.", ref: "EVD-013b" },
      { id: "r-decoy", label: "Read the other team's secret", cmd: "GET https://<vault>.vault.azure.net/secrets/unrelated-team-secret",
        out: ["HTTP/1.1 403 Forbidden", "ForbiddenByRbac"],
        verdict: "held", control: "AC-6 · AC-3", why: "The role is scoped to one secret, not to the vault. The decoy sits in the same vault and is still out of reach.",
        seen: "Denial logged by Key Vault; surfaced by the denied-access hunt by identity and IP.", ref: "EVD-013b" },
      { id: "r-list", label: "List every secret in the vault", cmd: "GET https://<vault>.vault.azure.net/secrets",
        out: ["HTTP/1.1 403 Forbidden", "ForbiddenByRbac"],
        verdict: "held", control: "AC-6", why: "Listing is a separate permission the identity was never given. You cannot even learn what else exists.",
        seen: "Denial logged by Key Vault; surfaced by the denied-access hunt.", ref: "EVD-013b" },
      { id: "r-write", label: "Overwrite the secret with your own value", cmd: "PUT https://<vault>.vault.azure.net/secrets/app-db-password  {\"value\":\"attacker-controlled\"}",
        out: ["HTTP/1.1 403 Forbidden", "ForbiddenByRbac"],
        verdict: "held", control: "AC-6", why: "Secrets User reads; it cannot write. The app's dependency cannot be poisoned with this identity.",
        seen: "Denial logged by Key Vault; surfaced by the denied-access hunt.", ref: "EVD-013b" },
      { id: "r-delete", label: "Delete the secret", cmd: "DELETE https://<vault>.vault.azure.net/secrets/app-db-password",
        out: ["HTTP/1.1 403 Forbidden", "ForbiddenByRbac"],
        verdict: "held", control: "AC-6 · CP-10", why: "Refused — and even an administrator could not purge it: soft delete and purge protection are enforced.",
        seen: "Denial logged by Key Vault; surfaced by the denied-access hunt.", ref: "EVD-013b" },
      { id: "r-owner", label: "Grant yourself Owner on the resource group", cmd: "PUT …/providers/Microsoft.Authorization/roleAssignments/<new>  role=Owner",
        out: ["HTTP/1.1 403 Forbidden", "AuthorizationFailed"],
        verdict: "held", control: "AC-6(10)", why: "The identity holds no privileged role anywhere, so it cannot create role assignments. Privilege escalation stops here.",
        seen: "Refused by Azure authorization.", ref: "EVD-013b" },
      { id: "r-rg", label: "Read the resource group's configuration", cmd: "GET https://management.azure.com/subscriptions/<sub>/resourcegroups/<rg>",
        out: ["HTTP/1.1 403 Forbidden", "AuthorizationFailed"],
        verdict: "held", control: "AC-6", why: "No control-plane read access: you cannot map the environment from here.",
        seen: "Refused by Azure authorization.", ref: "EVD-013b" },
      { id: "r-list-rg", label: "List resource groups in the subscription", cmd: "GET https://management.azure.com/subscriptions/<sub>/resourcegroups",
        out: ["HTTP/1.1 200 OK", "{ \"value\": [] }   (0 items)"],
        verdict: "nothing", control: "AC-6", why: "The call itself is answered, but the identity can see nothing in it. Zero items — no map, no targets.",
        seen: "Recorded in the probe evidence.", ref: "EVD-013b" },
      { id: "r-graph", label: "Enumerate users in the directory", cmd: "GET https://graph.microsoft.com/v1.0/users?$top=1",
        out: ["HTTP/1.1 403 Forbidden", "Authorization_RequestDenied"],
        verdict: "held", control: "AC-6", why: "The workload has no directory permissions. No user list, no phishing targets, no pivot into identity.",
        seen: "Refused by Microsoft Graph.", ref: "EVD-013b" },
      { id: "a05", label: "Exfiltrate the token and replay it from your own machine", cmd: "export TOKEN=… ; curl -H \"Authorization: Bearer $TOKEN\" https://<vault>/secrets/app-db-password",
        out: ["From the same home network:  200 OK   ← FINDING RISK-08", "Decoy secret with the stolen token:  403 Forbidden", "From Azure Cloud Shell (another network):  refused by the vault firewall"],
        verdict: "finding", control: "SC-7 · AU-6", why: "A stolen token is still the workload: replayed from the same network it worked, though still only for the one secret. It is recorded as RISK-08 and accepted, with detection as the compensating control. From any other network the vault's firewall refuses it.",
        seen: "Secret reads by identity and source IP are surfaced by the hunts; accepted residual risk is documented.", ref: "EVD-013 · A05 · RISK-08" },
    ],
  },
];

const VERDICT = { held: "Control held", finding: "Finding — recorded", design: "Allowed by design", nothing: "Answered — nothing visible" };
const $ = (s, el = document) => el.querySelector(s);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const state = { done: new Set(), gained: 0, held: 0, findings: 0, unlocked: false };
let typing = 0;

function el(tag, props = {}, ...kids) {
  const n = Object.assign(document.createElement(tag), props);
  for (const k of kids) n.append(k);
  return n;
}

function renderMoves() {
  const root = $("#moves");
  root.replaceChildren();
  for (const stage of STAGES) {
    const locked = stage.id === "root" && !state.unlocked;
    const box = el("section", { className: "stage" + (locked ? " locked" : "") });
    box.append(el("p", { className: "stage-k", textContent: stage.title }), el("p", { className: "stage-who", textContent: stage.who }));
    const list = el("ol", { className: "move-list" });
    for (const m of stage.moves) {
      const b = el("button", { type: "button", className: "move", disabled: locked, textContent: m.label });
      if (state.done.has(m.id)) b.classList.add("done", "v-" + m.verdict);
      b.addEventListener("click", () => play(m, b));
      list.append(el("li", {}, b));
    }
    box.append(list);
    if (stage.id === "root" && !state.unlocked) {
      const u = el("button", { type: "button", className: "unlock", textContent: "Assume breach — become root" });
      u.addEventListener("click", () => { state.unlocked = true; renderMoves(); narrate("Assume breach", "The earlier doors held. Good design assumes one will fail anyway — so from here on, you are root, holding the machine's own identity."); });
      box.append(u);
    }
    root.append(box);
  }
}

function narrate(title, text) {
  const out = $("#outcome");
  out.replaceChildren(el("p", { className: "o-k", textContent: title }), el("p", { className: "o-why", textContent: text }));
}

async function play(m, button) {
  const run = ++typing;
  // Count the move the moment it is made, so a quick next click never drops it from the score.
  if (!state.done.has(m.id)) {
    state.done.add(m.id);
    if (m.gain) state.gained++;
    if (m.verdict === "held") state.held++;
    if (m.verdict === "finding") state.findings++;
  }
  button.classList.add("done", "v-" + m.verdict);
  score();

  const out = $("#outcome");
  out.replaceChildren();
  out.append(el("p", { className: "o-k", textContent: m.label }));
  if (matchMedia("(max-width: 56rem)").matches) out.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  const term = el("pre", { className: "term" });
  out.append(term);
  const line = (t, cls) => { const s = el("span", { className: cls || "", textContent: t + "\n" }); term.append(s); return s; };
  await type(line("", "cmd"), "$ " + m.cmd, run);
  for (const o of m.out) {
    if (run !== typing) return;
    await wait(reduced ? 0 : 260);
    line(o, /403|401|denied|blocked|refused|Sorry/i.test(o) ? "deny" : /FINDING/.test(o) ? "find" : /200 OK|works/.test(o) ? "ok" : "");
  }
  if (run !== typing) return;
  const card = el("div", { className: "verdict v-" + m.verdict },
    el("p", { className: "v-head", textContent: VERDICT[m.verdict] }),
    el("p", { className: "v-why", textContent: m.why }),
    el("dl", {},
      el("div", {}, el("dt", { textContent: "Control" }), el("dd", { textContent: m.control })),
      el("div", {}, el("dt", { textContent: "Defender saw" }), el("dd", { textContent: m.seen })),
      el("div", {}, el("dt", { textContent: "Evidence" }), el("dd", {}, el("a", { href: EVIDENCE, textContent: m.ref })))));
  out.append(card);
}

async function type(node, text, run) {
  if (reduced) { node.textContent = text + "\n"; return; }
  for (let i = 1; i <= text.length; i += 3) {
    if (run !== typing) return;
    node.textContent = text.slice(0, i);
    await wait(8);
  }
  node.textContent = text + "\n";
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function score() {
  const total = STAGES.reduce((n, s) => n + s.moves.length, 0);
  $("#s-moves").textContent = `${state.done.size}/${total}`;
  $("#s-held").textContent = state.held;
  $("#s-gained").textContent = state.gained;
  $("#s-find").textContent = state.findings;
  $("#finish").disabled = state.done.size === 0;
}

function scorecard() {
  const secret = state.gained ? "1 secret — the one the app is designed to read" : "nothing";
  return `I tried to breach Sai Vignesh Rayal's zero-trust lab.\n` +
    `Moves: ${state.done.size} · Blocked: ${state.held} · Findings I surfaced: ${state.findings}\n` +
    `What I got: ${secret}.\n` +
    `Every result is replayed from recorded evidence.\nTry it: https://saivignesh-1177.github.io/Saivignesh-1177/breach/`;
}

$("#finish").addEventListener("click", () => {
  const text = scorecard();
  $("#card-text").textContent = text;
  $("#card").hidden = false;
  $("#copy").focus();
});
$("#copy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("#card-text").textContent); $("#copy").textContent = "Copied"; }
  catch { $("#copy").textContent = "Select the text to copy"; }
});
$("#close").addEventListener("click", () => { $("#card").hidden = true; $("#copy").textContent = "Copy scorecard"; });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("#card").hidden = true; });

renderMoves();
score();
narrate("Choose a move", "Pick any attack on the left. Each one replays what actually happened when the lab was attacked on October 28, 2026 — the response, the control that answered, and what the defender saw.");
