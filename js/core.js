// Outils partagés : formatage, phases RIR, moteur de surcharge, modales.

export const DEFAULTS = {
  appName: "Coach Hub",
  brand: "PROGRAMME",
  coach: "",
  accent: "#4a63f0",
  remarque: "Pour le premier exercice de chaque séance, réalise 2 à 3 séries de chauffe entre 8 et 12 répétitions maximum en montant progressivement la charge.",
  calibTarget: 3,
  phases: [
    { until: 2, label: "RIR 2", target: 2 },
    { until: 5, label: "RIR 2-1", target: 1.5 },
    { until: 99, label: "RIR 1-0", target: 0.5 },
  ],
  lastWeekFailure: true,
  increments: { "kg": 2.5, "kg/côté": 2.5, "kg/main": 2, "+kg": 2.5 },
  maxJump: 8,
  fatigueRule: true,
};
export const UNITS = ["kg", "kg/côté", "kg/main", "+kg", ""];
export const UNIT_LABEL = { "kg": "kg", "kg/côté": "kg/côté", "kg/main": "kg/main", "+kg": "+kg (lest)", "": "PDC" };

export const store = { settings: null, images: {} };

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const uid = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "").slice(0, 10) : Math.random().toString(36).slice(2, 12));
export const clone = (o) => JSON.parse(JSON.stringify(o));
export const fmt = (n) => (n == null || n === "" || isNaN(n) ? "" : String(Math.round(Number(n) * 100) / 100).replace(".", ","));
export const num = (v) => {
  if (v == null) return null;
  const s = String(v).replace(",", ".").trim();
  if (s === "") return null;
  const n = Number(s);
  return isNaN(n) ? null : n;
};

export function settings() {
  const raw = store.settings || {};
  const s = Object.assign(clone(DEFAULTS), raw);
  s.increments = Object.assign({}, DEFAULTS.increments, raw.increments || {});
  if (!Array.isArray(s.phases) || !s.phases.length) s.phases = clone(DEFAULTS.phases);
  return s;
}

export function weekLabel(n) { return n === 0 ? "Calibration" : `Semaine ${n}`; }

export function phaseFor(n, total) {
  const s = settings();
  if (n === 0) return { label: "Calibration", target: Number(s.calibTarget), key: "calib" };
  if (s.lastWeekFailure && n === total) return { label: "Échec volontaire", target: 0, key: "fail" };
  for (let i = 0; i < s.phases.length; i++) {
    if (n <= Number(s.phases[i].until)) return { ...s.phases[i], target: Number(s.phases[i].target), key: "p" + i };
  }
  const i = s.phases.length - 1;
  return { ...s.phases[i], target: Number(s.phases[i].target), key: "p" + i };
}

export function phaseSentence(ph) {
  if (ph.key === "calib") return "Semaine de calibration : trouve tes charges en gardant environ 3 répétitions en réserve à la fin de chaque série.";
  if (ph.key === "fail") return "Dernière semaine : va jusqu'à l'échec volontaire sur chaque série de travail, toujours avec une technique propre.";
  const r = String(ph.label).replace(/^RIR\s*/i, "");
  return `Cette semaine, il doit te rester ${r} répétition${/[2-9]/.test(r) ? "s" : ""} en réserve à la fin de chaque série de travail (RIR ${r}).`;
}

export function loadStr(load, unit) {
  if (load == null || load === "" || unit === "") return "";
  const n = fmt(load);
  if (unit === "+kg") return `+${n}kg`;
  if (unit === "kg/côté") return `${n}kg/côté`;
  if (unit === "kg/main") return `${n}kg/main`;
  return `${n}kg`;
}

export function groupLines(ex) {
  const gs = ex.sets || [];
  let idx = 1;
  const out = [];
  gs.forEach((g) => {
    const c = Math.max(1, Number(g.count) || 1), a = idx, b = idx + c - 1;
    idx = b + 1;
    let line;
    if (gs.length === 1 && c > 1) line = `${c} séries de ${g.reps} répétitions`;
    else {
      const lbl = a === b ? `Série ${a}` : c === 2 ? `Série ${a} et ${b}` : `Séries ${a} à ${b}`;
      line = `${lbl} : ${g.reps} répétitions`;
    }
    if (g.note) line += " " + g.note;
    const ls = loadStr(g.load, g.unit);
    if (ls) line += ` (${ls})`;
    if (g.drop && g.drop.reps) {
      line += ` + ${g.drop.reps} répétitions${g.drop.note ? " " + g.drop.note : ""}`;
      const d = loadStr(g.drop.load, g.drop.unit ?? g.unit);
      if (d) line += ` (${d})`;
    }
    out.push(line);
  });
  return out;
}

export function flatSets(ex) {
  const out = [];
  (ex.sets || []).forEach((g, gi) => {
    const c = Math.max(1, Number(g.count) || 1);
    for (let i = 0; i < c; i++) out.push({ gi, g });
  });
  return out;
}

export function restSeconds(r) {
  if (!r) return 120;
  const s = String(r).toLowerCase().replace(",", ".");
  const m = s.match(/(\d+(?:\.\d+)?)\s*(?:min|mn|m|')/);
  let sec = 0;
  if (m) {
    sec += Number(m[1]) * 60;
    const after = s.slice(s.indexOf(m[0]) + m[0].length).match(/(\d+)/);
    if (after) sec += Number(after[1]);
  } else {
    const n = s.match(/(\d+)/);
    if (n) sec = Number(n[1]) > 10 ? Number(n[1]) : Number(n[1]) * 60;
  }
  return sec || 120;
}

export function imgSrc(id) {
  if (!id) return null;
  if (id.startsWith("ill/") || id.startsWith("data:")) return id;
  return store.images[id] ? store.images[id].data : null;
}

export function emptyEx() {
  return { id: "ex-" + uid(), name: "NOUVEL EXERCICE", rest: "2 min", img: null, sets: [{ count: 3, reps: 10, load: null, unit: "kg", note: "" }] };
}
export function emptySeance(n) {
  return { id: "se-" + uid(), title: `SÉANCE ${n}`, warmup: "5 min de rameur (ne te crame pas)", exercises: [emptyEx()] };
}

/* ---------- moteur de surcharge progressive ---------- */
export function roundTo(x, inc) { return Math.round(x / inc) * inc; }

// week: {seances, num, cycle}; fb: {sets, energie, nerveux}; total: semaines du cycle
export function computeSuggestions(week, fb, total, nextPh) {
  const s = settings();
  fb = fb || { sets: {} };
  const curT = phaseFor(week.num, total).target;
  const isCalib = nextPh.key === "calib";
  const fatigue = !!(s.fatigueRule && !isCalib && ((fb.energie && fb.energie <= 2) || (fb.nerveux && fb.nerveux <= 2)));
  const T = Number(nextPh.target) + (fatigue ? 1 : 0);
  const out = { fatigue, ex: {} };
  week.seances.forEach((se) => se.exercises.forEach((ex) => {
    const flat = flatSets(ex);
    const arr = (fb.sets || {})[ex.id] || [];
    const groups = ex.sets.map((g, gi) => {
      const reps0 = parseInt(g.reps, 10);
      const unit = g.unit ?? "kg";
      const inc = Number(s.increments[unit] || 2.5);
      const done = flat.map((f, k) => ({ f, a: arr[k] })).filter((x) => x.f.gi === gi && x.a && x.a.reps != null);
      const base = { load: g.load, reps: g.reps, dir: "same", why: "Pas de données sur ce bloc : on garde." };
      if (!done.length || isNaN(reps0)) return base;
      const caps = done.map((x) => ({ L: x.a.load ?? g.load, reps: Number(x.a.reps), rir: x.a.rir ?? curT, guessed: x.a.rir == null }));
      const worst = caps.reduce((m, x) => (x.reps + x.rir < m.reps + m.rir ? x : m), caps[0]);
      const desc = `Fait ${fmt(worst.reps)} reps${worst.L != null && unit !== "" ? " à " + fmt(worst.L) : ""} @RIR ${fmt(worst.rir)}${caps.some((c) => c.guessed) ? " (RIR non indiqué)" : ""} → visé ${reps0} reps @RIR ${fmt(T)}`;
      if (g.load == null || unit === "") {
        const cap = worst.reps + worst.rir;
        let nr = Math.round(cap - T);
        nr = Math.max(reps0 - 2, Math.min(reps0 + 2, nr));
        return { load: null, reps: String(nr), dir: nr > reps0 ? "reps" : nr < reps0 ? "down" : "same", why: desc };
      }
      const L = Number(worst.L);
      const e1 = L * (1 + (worst.reps + worst.rir) / 30);
      const raw = e1 / (1 + (reps0 + T) / 30);
      let nl = roundTo(raw, inc);
      const cur = Number(g.load);
      const maxUp = Math.floor((cur * (1 + s.maxJump / 100)) / inc) * inc;
      const minDown = isCalib ? cur * 0.82 : cur * 0.9;
      let dir = "same", reps = g.reps;
      if (nl > cur) {
        if (maxUp <= cur) {
          nl = cur;
          const capReps = Math.floor(worst.reps + worst.rir - T);
          if (capReps > reps0) { reps = String(reps0 + 1); dir = "reps"; }
        } else { nl = Math.min(nl, maxUp); dir = "up"; }
      } else if (nl < cur) {
        nl = Math.max(nl, roundTo(minDown, inc));
        dir = nl < cur ? "down" : "same";
      }
      const r = { load: nl, reps, dir, why: desc };
      const ratio = cur ? nl / cur : 1;
      if (g.drop && g.drop.load != null && ratio !== 1) {
        const du = g.drop.unit ?? unit;
        r.dropLoad = roundTo(Number(g.drop.load) * ratio, Number(s.increments[du] || 2.5));
      }
      return r;
    });
    out.ex[ex.id] = { groups };
  }));
  return out;
}

// Force estimée (1RM théorique) par exercice et par semaine
export function progressionSeries(weeks, fbByWeek, total) {
  const series = {};
  weeks.forEach((w) => {
    const fb = fbByWeek[w.id];
    if (!fb || !fb.sets) return;
    w.seances.forEach((se) => se.exercises.forEach((ex) => {
      const arr = fb.sets[ex.id] || [];
      const flat = flatSets(ex);
      let best = null;
      arr.forEach((a, k) => {
        if (!a || a.reps == null || !flat[k]) return;
        const g = flat[k].g;
        const L = a.load ?? g.load;
        if (L == null || g.unit === "") return;
        const rir = a.rir ?? phaseFor(w.num, total).target;
        const e = Number(L) * (1 + (Number(a.reps) + Number(rir)) / 30);
        if (best == null || e > best) best = e;
      });
      if (best == null) return;
      (series[ex.id] ||= { name: ex.name, unit: ex.sets[0]?.unit ?? "kg", pts: [] }).pts.push({ lbl: `C${w.cycle} ${w.num === 0 ? "Cal" : "S" + w.num}`, v: best });
    }));
  });
  return series;
}

export function sparkCard(s) {
  const pts = s.pts, W = 226, H = 64, P = 6;
  const vs = pts.map((p) => p.v);
  let mn = Math.min(...vs), mx = Math.max(...vs);
  if (mx - mn < 1) { mx += 1; mn -= 1; }
  const x = (i) => (pts.length === 1 ? W / 2 : P + (i * (W - 2 * P)) / (pts.length - 1));
  const y = (v) => H - P - ((v - mn) / (mx - mn)) * (H - 2 * P);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${H - P} L${x(0).toFixed(1)},${H - P} Z`;
  const last = pts[pts.length - 1], first = pts[0];
  const d = last.v - first.v, pct = first.v ? (d / first.v) * 100 : 0;
  const unit = s.unit === "kg/côté" ? " kg/côté" : s.unit === "kg/main" ? " kg/main" : s.unit === "+kg" ? " kg (lest)" : " kg";
  return `<div class="chart"><h4>${esc(s.name)}</h4><div class="val">${fmt(Math.round(last.v * 2) / 2)}${unit}</div>
    <div class="delta">${pts.length > 1 ? `${d >= 0 ? "+" : ""}${fmt(Math.round(d * 2) / 2)}${unit} (${pct >= 0 ? "+" : ""}${fmt(Math.round(pct * 10) / 10)} %) depuis ${esc(first.lbl)}` : esc(last.lbl)}</div>
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="Évolution ${esc(s.name)}">
      <line x1="${P}" x2="${W - P}" y1="${H - P}" y2="${H - P}" stroke="var(--line)"/>
      <path d="${area}" fill="var(--accent-soft)"/><path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2"/>
      <circle cx="${x(pts.length - 1)}" cy="${y(last.v)}" r="4" fill="var(--accent)"/></svg></div>`;
}

/* ---------- interface ---------- */
export function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}
export function openModal(html, wide) {
  const root = $("#modal-root");
  root.innerHTML = `<div class="modal-back" data-back="1"><div class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true">${html}</div></div>`;
  const f = root.querySelector("input, textarea, button");
  if (f) f.focus();
  return root.querySelector(".modal");
}
export function closeModal() { $("#modal-root").innerHTML = ""; }
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
document.addEventListener("mousedown", (e) => { if (e.target.dataset && e.target.dataset.back) closeModal(); });

export function inlineConfirm(btn, msg, fn, onCancel) {
  const span = document.createElement("span");
  span.className = "confirm";
  span.innerHTML = `${esc(msg)} <button class="btn small danger" type="button">Oui</button><button class="btn small" type="button">Non</button>`;
  btn.replaceWith(span);
  const [yes, no] = span.querySelectorAll("button");
  yes.onclick = (ev) => { ev.stopPropagation(); fn(); };
  no.onclick = (ev) => { ev.stopPropagation(); onCancel ? onCancel() : span.replaceWith(btn); };
}

export function applyAccent() {
  const acc = settings().accent;
  if (/^#[0-9a-f]{6}$/i.test(acc)) {
    document.documentElement.style.setProperty("--brand", acc);
  }
}

export function shrinkImage(file, max) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * r);
      c.height = Math.round(img.height * r);
      const x = c.getContext("2d");
      x.fillStyle = "#fff";
      x.fillRect(0, 0, c.width, c.height);
      x.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.8));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

export function randomPassword() {
  const a = "abcdefghjkmnpqrstuvwxyz", A = "ABCDEFGHJKLMNPQRSTUVWXYZ", d = "23456789";
  const pick = (s, n) => Array.from({ length: n }, () => s[Math.floor(Math.random() * s.length)]).join("");
  return pick(A, 1) + pick(a, 5) + pick(d, 3) + pick(a, 2);
}
