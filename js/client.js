// Espace client (mobile) : séances de la semaine, saisie des perfs, bilan, progression.
import { sb } from "./db.js";
import {
  $, $$, esc, fmt, num, settings, phaseFor, phaseSentence, weekLabel, groupLines, flatSets, loadStr,
  restSeconds, imgSrc, progressionSeries, sparkCard, toast,
} from "./core.js";
import { makePdf } from "./pdf.js";

const C = { el: null, session: null, client: null, weeks: [], fb: {}, saveT: null, timer: null, sync: "ok" };

export async function startClient(el, session, client) {
  Object.assign(C, { el, session, client });
  await load();
  window.addEventListener("hashchange", render);
  window.addEventListener("online", flushAll);
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible") { flushAll(); await refresh(); }
  });
  el.addEventListener("click", onClick);
  el.addEventListener("input", onInput);
  render();
}

async function load() {
  const [{ data: weeks, error: e1 }, { data: fbs, error: e2 }] = await Promise.all([
    sb.from("weeks").select("*").eq("client_id", C.client.id).order("cycle").order("num"),
    sb.from("feedback").select("*").eq("client_id", C.client.id),
  ]);
  if (e1 || e2) throw e1 || e2;
  C.weeks = weeks || [];
  C.fb = Object.fromEntries((fbs || []).map((f) => [f.week_id, f]));
  restorePending();
}
async function refresh() {
  const before = current()?.id;
  try {
    const { data: cl } = await sb.from("clients").select("*").eq("id", C.client.id).maybeSingle();
    if (cl) C.client = cl;
    const { data: weeks } = await sb.from("weeks").select("*").eq("client_id", C.client.id).order("cycle").order("num");
    if (weeks) C.weeks = weeks;
    if (current()?.id !== before) { toast("Ton nouveau programme est disponible"); render(); }
  } catch (e) {}
}

const current = () => C.weeks[C.weeks.length - 1] || null;
function fbOf(w) {
  if (!C.fb[w.id]) C.fb[w.id] = { week_id: w.id, client_id: C.client.id, sets: {}, energie: null, nerveux: null, sommeil: null, douleurs: "", remarques: "", submitted: false, submitted_at: null };
  if (!C.fb[w.id].sets) C.fb[w.id].sets = {};
  return C.fb[w.id];
}

/* ---------- enregistrement (avec reprise hors connexion) ---------- */
function queueSave(w, delay = 700) {
  const f = fbOf(w);
  try { localStorage.setItem("fbp-" + w.id, JSON.stringify(f)); } catch (e) {}
  setSync("pending");
  clearTimeout(C.saveT);
  C.saveT = setTimeout(() => flush(w.id), delay);
}
async function flush(id) {
  const f = C.fb[id];
  if (!f) return;
  const row = { week_id: f.week_id, client_id: f.client_id, sets: f.sets, energie: f.energie, nerveux: f.nerveux, sommeil: f.sommeil, douleurs: f.douleurs || "", remarques: f.remarques || "", submitted: !!f.submitted, submitted_at: f.submitted_at };
  const { error } = await sb.from("feedback").upsert(row);
  if (error) { setSync("offline"); return false; }
  try { localStorage.removeItem("fbp-" + id); } catch (e) {}
  setSync("ok");
  return true;
}
function flushAll() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith("fbp-")).forEach((k) => flush(k.slice(4)));
  } catch (e) {}
}
function restorePending() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith("fbp-")).forEach((k) => {
      const id = k.slice(4);
      if (!C.weeks.some((w) => w.id === id)) { localStorage.removeItem(k); return; }
      C.fb[id] = JSON.parse(localStorage.getItem(k));
      flush(id);
    });
  } catch (e) {}
}
function setSync(s) {
  C.sync = s;
  const el = $("#sync");
  if (el) el.outerHTML = syncHTML();
}
function syncHTML() {
  const m = { ok: ["ok", "Enregistré"], pending: ["pending", "Enregistrement…"], offline: ["offline", "Hors ligne · envoi dès le retour du réseau"] }[C.sync];
  return `<span id="sync" class="sync ${m[0]}" role="status">${m[1]}</span>`;
}

/* ---------- rendu ---------- */
const ICONS = {
  home: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  bilan: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 8h6M9 12h6M9 16h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  progres: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 20h18M5 16l4-5 4 3 6-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  compte: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
};
function view() {
  const h = location.hash.replace(/^#/, "");
  if (h.startsWith("seance-")) return { name: "seance", i: parseInt(h.slice(7), 10) || 0 };
  return { name: ["bilan", "progres", "compte"].includes(h) ? h : "home" };
}
function render() {
  const v = view();
  const w = current();
  let body;
  if (v.name === "compte") body = renderCompte();
  else if (!w) body = `<div class="c-empty"><h2>Ton programme arrive</h2><p>Ton coach prépare ta première semaine. Tu recevras tout ici dès qu'elle sera prête.</p></div>`;
  else if (v.name === "seance" && w.seances[v.i]) body = renderSeance(w, v.i);
  else if (v.name === "bilan") body = renderBilan(w);
  else if (v.name === "progres") body = renderProgres();
  else body = renderHome(w);
  const tab = v.name === "seance" ? "home" : v.name;
  C.el.innerHTML = `<div class="c-app">
    <main class="c-main" id="c-main">${body}</main>
    <div id="timer-slot">${timerHTML()}</div>
    <nav class="c-nav" aria-label="Navigation">
      ${[["home", "Semaine", ""], ["bilan", "Bilan", "bilan"], ["progres", "Progrès", "progres"], ["compte", "Compte", "compte"]].map(([k, l, h]) => `<a href="#${h}" class="${tab === k ? "on" : ""}" ${tab === k ? 'aria-current="page"' : ""}>${ICONS[k]}<span>${l}</span></a>`).join("")}
    </nav></div>`;
  if (v.name === "seance") window.scrollTo(0, C.keepScroll ? window.scrollY : 0);
}

function countDone(w, se) {
  const f = C.fb[w.id];
  let done = 0, total = 0;
  (se ? [se] : w.seances).forEach((s) => s.exercises.forEach((ex) => {
    const n = flatSets(ex).length;
    total += n;
    const arr = f?.sets?.[ex.id] || [];
    for (let k = 0; k < n; k++) if (arr[k] && arr[k].reps != null) done++;
  }));
  return { done, total };
}

function renderHome(w) {
  const ph = phaseFor(w.num, C.client.weeks_total);
  const f = C.fb[w.id];
  const all = countDone(w);
  return `<header class="c-head"><div><span class="c-kicker">Salut</span><h1>${esc(C.client.name)}</h1></div>${syncHTML()}</header>
  <section class="phase-card ph-${ph.key}">
    <div class="ph-k">Cycle ${esc(w.cycle)} · ${esc(weekLabel(w.num))}${w.num ? ` / ${esc(C.client.weeks_total)}` : ""}</div>
    <div class="ph-v">Objectif ${esc(ph.key === "calib" ? "RIR " + fmt(ph.target) : ph.label)}</div>
    <p>${esc(phaseSentence(ph))}</p>
  </section>
  <h2 class="c-h2">Tes séances</h2>
  <div class="seance-list">${w.seances.map((se, i) => {
    const c = countDone(w, se);
    const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
    return `<a class="seance-card ${c.done === c.total && c.total ? "complete" : ""}" href="#seance-${i}">
      <span class="sc-n">Séance ${i + 1}</span><span class="sc-t">${esc(se.title)}</span>
      <span class="sc-p"><span class="bar"><span style="width:${pct}%"></span></span>${c.done}/${c.total} séries</span>
      <span class="chev" aria-hidden="true">›</span></a>`;
  }).join("")}</div>
  <a class="bilan-card ${f?.submitted ? "sent" : ""}" href="#bilan">
    <b>${f?.submitted ? "Bilan envoyé ✓" : "Bilan de la semaine"}</b>
    <span>${f?.submitted ? "Ton coach prépare ta semaine suivante." : `${all.done}/${all.total} séries notées. Envoie ton bilan en fin de semaine.`}</span></a>
  <button class="btn ghost full" data-act="pdf" type="button">Télécharger mon programme en PDF</button>`;
}

function setRow(w, ex, k) {
  const flat = flatSets(ex);
  const g = flat[k].g;
  const a = (fbOf(w).sets[ex.id] || [])[k] || {};
  const done = a.reps != null;
  const target = `${esc(g.reps)} reps${g.unit === "" ? "" : " · " + esc(loadStr(g.load, g.unit))}${g.drop && g.drop.reps ? ` <span class="drop-t">+ ${esc(g.drop.reps)} reps${g.drop.load != null ? " · " + esc(loadStr(g.drop.load, g.drop.unit ?? g.unit)) : ""}</span>` : ""}`;
  const rid = `${ex.id}-${k}`;
  return `<div class="set-row ${done ? "done" : ""}" id="row-${rid}">
    <div class="set-top"><span class="set-n">Série ${k + 1}</span><span class="set-target">${target}</span></div>
    <div class="set-in">
      ${g.unit === "" ? `<span class="pdc">Poids du corps</span>` : `<label class="fld"><span>kg</span><input id="l-${rid}" inputmode="decimal" data-set="1" data-ex="${esc(ex.id)}" data-k="${k}" data-f="load" value="${esc(fmt(a.load))}" placeholder="${esc(fmt(g.load))}" aria-label="Charge série ${k + 1}"></label>`}
      <label class="fld"><span>reps</span><input id="r-${rid}" inputmode="numeric" data-set="1" data-ex="${esc(ex.id)}" data-k="${k}" data-f="reps" value="${esc(fmt(a.reps))}" placeholder="${esc(g.reps)}" aria-label="Répétitions série ${k + 1}"></label>
      <button class="check ${done ? "on" : ""}" type="button" data-act="done" data-ex="${esc(ex.id)}" data-k="${k}" aria-label="${done ? "Série notée" : "Valider la série et lancer le repos"}">✓</button>
    </div>
    <div class="rir" role="group" aria-label="RIR série ${k + 1}"><span>RIR</span>${[0, 1, 2, 3, 4].map((n) => `<button type="button" class="${a.rir === n ? "on" : ""}" data-act="rir" data-ex="${esc(ex.id)}" data-k="${k}" data-v="${n}">${n === 4 ? "4+" : n}</button>`).join("")}</div>
  </div>`;
}

function renderSeance(w, i) {
  const se = w.seances[i];
  const ph = phaseFor(w.num, C.client.weeks_total);
  return `<header class="c-head sub"><a href="#" class="back" aria-label="Retour">‹</a><div><span class="c-kicker">Séance ${i + 1} · Objectif ${esc(ph.key === "calib" ? "RIR " + fmt(ph.target) : ph.label)}</span><h1>${esc(se.title)}</h1></div>${syncHTML()}</header>
  ${se.warmup ? `<p class="warmup"><b>Échauffement</b> · ${esc(se.warmup)}</p>` : ""}
  ${i === 0 && settings().remarque ? `<p class="hint pad">${esc(settings().remarque)}</p>` : ""}
  ${se.exercises.map((ex, ei) => {
    const img = imgSrc(ex.img);
    return `<section class="ex-card">
      <div class="ex-h">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<div class="noimg" aria-hidden="true"></div>`}
        <div><span class="ex-lbl">Exercice ${ei + 1}${ex.rest ? ` · ${esc(ex.rest)} de repos` : ""}</span><h3>${esc(ex.name)}</h3></div></div>
      <ul class="ex-lines">${groupLines(ex).map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
      <div class="sets">${flatSets(ex).map((_, k) => setRow(w, ex, k)).join("")}</div>
    </section>`;
  }).join("")}
  <div class="pad">${i < w.seances.length - 1 ? `<a class="btn primary full" href="#seance-${i + 1}">Séance suivante ›</a>` : `<a class="btn primary full" href="#bilan">Aller au bilan de la semaine</a>`}</div>`;
}

function scale(f, k, label, lo, hi) {
  return `<div class="scale-q"><div class="sq-l"><b>${label}</b><span>1 = ${lo} · 5 = ${hi}</span></div>
    <div class="scale">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="${f[k] === n ? "on" : ""}" data-act="scale" data-k="${k}" data-v="${n}" aria-label="${label} ${n}">${n}</button>`).join("")}</div></div>`;
}
function renderBilan(w) {
  const f = fbOf(w);
  const all = countDone(w);
  return `<header class="c-head"><div><span class="c-kicker">${esc(weekLabel(w.num))} · Cycle ${esc(w.cycle)}</span><h1>Bilan</h1></div>${syncHTML()}</header>
  ${f.submitted ? `<div class="ok-banner">Bilan envoyé${f.submitted_at ? " le " + new Date(f.submitted_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : ""}. Tu peux encore le modifier.</div>` : ""}
  <section class="card-c">
    <h2 class="c-h2">Tes séries</h2>
    <p>${all.done} séries notées sur ${all.total}.</p>
    ${w.seances.map((se, i) => { const c = countDone(w, se); return `<a class="mini-row" href="#seance-${i}"><span>Séance ${i + 1} · ${esc(se.title)}</span><b class="${c.done === c.total ? "full" : ""}">${c.done}/${c.total}</b></a>`; }).join("")}
  </section>
  <section class="card-c">
    <h2 class="c-h2">Ton ressenti</h2>
    ${scale(f, "energie", "Énergie", "à plat", "au top")}
    ${scale(f, "nerveux", "État nerveux", "très stressé", "serein")}
    ${scale(f, "sommeil", "Sommeil", "très mauvais", "excellent")}
    <label class="lbl" for="b-d">Douleurs ou gênes</label>
    <textarea id="b-d" data-top="douleurs" rows="2" placeholder="Aucune ? Laisse vide.">${esc(f.douleurs)}</textarea>
    <label class="lbl" for="b-r">Remarques pour ton coach</label>
    <textarea id="b-r" data-top="remarques" rows="3" placeholder="Machine prise, séance décalée, sensations…">${esc(f.remarques)}</textarea>
  </section>
  <div class="pad"><button class="btn primary full big" data-act="submit" type="button">${f.submitted ? "Mettre à jour mon bilan" : "Envoyer mon bilan à mon coach"}</button></div>`;
}

function renderProgres() {
  const series = progressionSeries(C.weeks, C.fb, C.client.weeks_total);
  const ids = Object.keys(series);
  return `<header class="c-head"><div><span class="c-kicker">Force estimée par exercice</span><h1>Progrès</h1></div></header>
  ${ids.length ? `<p class="hint pad">Calculée à partir de ta meilleure série de chaque semaine (charge, répétitions et RIR).</p><div class="charts pad">${ids.map((id) => sparkCard(series[id])).join("")}</div>`
    : `<div class="c-empty"><p>Tes courbes apparaîtront dès que tu auras noté tes premières séries.</p></div>`}`;
}

function renderCompte() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  return `<header class="c-head"><div><span class="c-kicker">Mon compte</span><h1>${esc(C.client.name)}</h1></div></header>
  <section class="card-c"><p><b>E-mail</b><br>${esc(C.session.user.email)}</p><p><b>Objectif</b><br>${esc(C.client.objectif)}</p></section>
  ${standalone ? "" : `<section class="card-c"><h2 class="c-h2">Installer l'appli</h2>${ios
    ? `<ol class="steps"><li>Ouvre ce lien dans <b>Safari</b>.</li><li>Touche le bouton <b>Partager</b> (carré avec une flèche).</li><li>Choisis <b>Sur l'écran d'accueil</b>, puis <b>Ajouter</b>.</li></ol>`
    : `<ol class="steps"><li>Ouvre ce lien dans <b>Chrome</b>.</li><li>Touche le menu <b>⋮</b> en haut à droite.</li><li>Choisis <b>Installer l'application</b> (ou « Ajouter à l'écran d'accueil »).</li></ol>${window.__installPrompt ? `<button class="btn primary full" data-act="install" type="button">Installer maintenant</button>` : ""}`}</section>`}
  <section class="card-c"><h2 class="c-h2">Changer mon mot de passe</h2>
    <form id="pw" novalidate><label class="lbl" for="pw1">Nouveau mot de passe (8 caractères minimum)</label><input id="pw1" type="password" autocomplete="new-password" minlength="8">
    <div class="err" id="pw-err" role="alert"></div><button class="btn full" type="submit">Enregistrer</button></form></section>
  <div class="pad"><button class="btn ghost full danger" data-act="logout" type="button">Se déconnecter</button></div>`;
}

/* ---------- minuteur de repos ---------- */
function timerHTML() {
  const t = C.timer;
  if (!t) return "";
  const left = Math.max(0, Math.ceil((t.end - Date.now()) / 1000));
  if (left === 0) return `<div class="timer go" role="timer">C'est reparti ! <button type="button" data-act="t-stop" class="btn small">OK</button></div>`;
  return `<div class="timer" role="timer"><span>Repos</span><b>${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}</b>
    <button type="button" data-act="t-add" class="btn small">+15 s</button><button type="button" data-act="t-stop" class="btn small">Passer</button></div>`;
}
function startTimer(sec) {
  if (C.timer?.iv) clearInterval(C.timer.iv);
  C.timer = { end: Date.now() + sec * 1000, buzzed: false };
  C.timer.iv = setInterval(() => {
    const slot = $("#timer-slot");
    if (slot) slot.innerHTML = timerHTML();
    if (C.timer && !C.timer.buzzed && Date.now() >= C.timer.end) {
      C.timer.buzzed = true;
      try { navigator.vibrate && navigator.vibrate([300, 120, 300]); } catch (e) {}
      setTimeout(() => { if (C.timer && C.timer.buzzed) stopTimer(); }, 4000);
    }
  }, 250);
  const slot = $("#timer-slot");
  if (slot) slot.innerHTML = timerHTML();
}
function stopTimer() {
  if (C.timer?.iv) clearInterval(C.timer.iv);
  C.timer = null;
  const slot = $("#timer-slot");
  if (slot) slot.innerHTML = "";
}

/* ---------- événements ---------- */
function findEx(w, id) { for (const se of w.seances) for (const ex of se.exercises) if (ex.id === id) return ex; return null; }
function entry(w, exId, k) {
  const f = fbOf(w);
  const arr = (f.sets[exId] ||= []);
  for (let i = 0; i <= k; i++) if (!arr[i]) arr[i] = { load: null, reps: null, rir: null };
  return arr[k];
}
function refreshRow(w, exId, k) {
  const ex = findEx(w, exId);
  const row = document.getElementById(`row-${exId}-${k}`);
  if (ex && row) row.outerHTML = setRow(w, ex, k);
}

async function onClick(e) {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const w = current();
  const a = b.dataset.act;
  if (a === "rir") {
    const en = entry(w, b.dataset.ex, +b.dataset.k);
    const v = +b.dataset.v;
    en.rir = en.rir === v ? null : v;
    queueSave(w);
    refreshRow(w, b.dataset.ex, +b.dataset.k);
  } else if (a === "done") {
    const ex = findEx(w, b.dataset.ex);
    const k = +b.dataset.k;
    const g = flatSets(ex)[k].g;
    const en = entry(w, ex.id, k);
    if (en.reps != null && b.classList.contains("on")) {
      en.reps = null; en.load = null; en.rir = null;
      queueSave(w); refreshRow(w, ex.id, k); return;
    }
    const rIn = document.getElementById(`r-${ex.id}-${k}`), lIn = document.getElementById(`l-${ex.id}-${k}`);
    en.reps = num(rIn?.value) ?? num(g.reps);
    if (g.unit !== "") en.load = num(lIn?.value) ?? (g.load != null ? Number(g.load) : null);
    queueSave(w);
    refreshRow(w, ex.id, k);
    startTimer(restSeconds(ex.rest));
  } else if (a === "scale") {
    const f = fbOf(w);
    const v = +b.dataset.v;
    f[b.dataset.k] = f[b.dataset.k] === v ? null : v;
    queueSave(w);
    $$(`[data-act="scale"][data-k="${b.dataset.k}"]`).forEach((x) => x.classList.toggle("on", +x.dataset.v === f[b.dataset.k]));
  } else if (a === "submit") {
    const f = fbOf(w);
    f.submitted = true;
    f.submitted_at = new Date().toISOString();
    try { localStorage.setItem("fbp-" + w.id, JSON.stringify(f)); } catch (err) {}
    b.disabled = true;
    clearTimeout(C.saveT);
    const ok = await flush(w.id);
    toast(ok ? "Bilan envoyé à ton coach" : "Pas de réseau : ton bilan partira dès le retour de la connexion");
    render();
  } else if (a === "t-add") {
    if (C.timer) { C.timer.end += 15000; C.timer.buzzed = false; }
  } else if (a === "t-stop") {
    stopTimer();
  } else if (a === "pdf") {
    makePdf(w, C.client);
  } else if (a === "logout") {
    stopTimer();
    await sb.auth.signOut();
  } else if (a === "install" && window.__installPrompt) {
    window.__installPrompt.prompt();
    window.__installPrompt = null;
  }
}

function onInput(e) {
  const t = e.target;
  const w = current();
  if (!w) return;
  if (t.dataset.set) {
    const en = entry(w, t.dataset.ex, +t.dataset.k);
    const v = num(t.value);
    en[t.dataset.f] = v;
    if (t.dataset.f === "reps") {
      const row = document.getElementById(`row-${t.dataset.ex}-${t.dataset.k}`);
      if (row) { row.classList.toggle("done", v != null); row.querySelector(".check")?.classList.toggle("on", v != null); }
    }
    queueSave(w, 900);
  } else if (t.dataset.top) {
    fbOf(w)[t.dataset.top] = t.value;
    queueSave(w, 900);
  }
}

document.addEventListener("submit", async (e) => {
  if (e.target.id !== "pw") return;
  e.preventDefault();
  const p = $("#pw1").value;
  if (p.length < 8) { $("#pw-err").textContent = "Au moins 8 caractères."; return; }
  const { error } = await sb.auth.updateUser({ password: p });
  $("#pw-err").textContent = error ? "Impossible : " + error.message : "";
  if (!error) { $("#pw1").value = ""; toast("Mot de passe modifié"); }
});
