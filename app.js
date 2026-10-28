// Progressive enhancement only: the page is complete without this file.

async function verifySeal() {
  const out = document.getElementById("verify");
  const expected = document.getElementById("seal").dataset.digest;
  try {
    const res = await fetch("profile.json", { cache: "no-store" });
    const buf = await crypto.subtle.digest("SHA-256", await res.arrayBuffer());
    const actual = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    const ok = actual === expected;
    out.dataset.state = ok ? "pass" : "fail";
    out.textContent = ok
      ? "Verified just now in your browser: profile.json matches the seal."
      : "Mismatch: profile.json hashes to " + actual + ". This page was altered after it was sealed.";
  } catch {
    out.textContent = "Could not fetch profile.json here (open over http to verify).";
  }
}

function trackRail() {
  const links = new Map([...document.querySelectorAll(".rail a")].map((a) => [a.hash.slice(1), a]));
  const seen = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      links.forEach((a) => a.removeAttribute("aria-current"));
      links.get(entry.target.id)?.setAttribute("aria-current", "true");
    }
  }, { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll(".control").forEach((c) => seen.observe(c));
}

document.getElementById("print").addEventListener("click", () => window.print());
trackRail();
verifySeal();
