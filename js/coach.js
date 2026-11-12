// Espace coach : clients, programmes, bilans, surcharge progressive, PDF, réglages.
import { sb, tempClient, appUrl } from "./db.js";
import {
  $, $$, esc, uid, clone, fmt, num, settings, store, phaseFor, weekLabel, groupLines, flatSets, loadStr,
  UNITS, UNIT_LABEL, emptyEx, emptySeance, roundTo, computeSuggestions, progressionSeries, sparkCard,
  toast, openModal, closeModal, inlineConfirm, applyAccent, shrinkImage, randomPassword, imgSrc,
} from "./core.js";
import { makePdf } from "./pdf.js";
import { TEMPLATES } from "./templates.js";
import { LIBRARY } from "./library.js";

const TECHNIQUES = [
  "avec 1 seconde en haut", "avec 1 seconde en bas", "avec pic de contraction", "avec 2 secondes de descente", "avec 3 secondes de descente",
  "tempo 3/2/1 (3 s de descente, 2 s d'isométrie en bas)", "en tension continue", "tenu 2 secondes en bas à chaque répétition",
  "en rest-pause 6/4/2 (quelques secondes de récupération entre chaque)", "+ 6 répétitions partielles en position étirée",
  "+ 6 répétitions partielles basses", "en myo-reps : 6/6/5/5 toutes les 30 secondes", "+ 20 secondes de repos + répétitions max",
  "+ 6 secondes d'isométrie en fin de série", "en amplitude complète", "par bras", "par jambe", "par côté",
];
const RESTS = ["1 min", "1 min 30", "1 min 40 à 2 min", "2 min", "2 min 30", "3 min", "3 min 30"];
const LIB_BY_NAME = new Map(LIBRARY.map((e) => [e.n, e]));

const S = { el: null, session: null, clients: [], cur: null, weeks: [], fb: {}, curWeek: null, viewCycle: null, tab: "programme", overrides: {}, saving: {} };
const timers = {};

export async function startCoach(el, session) {
  Object.assign(S, { el, session });
  el.innerHTML = `<div class="app">
    <aside id="side">
      <div class="brand"><img src="icons/icon-192.png" alt="" width="36" height="36"><div><h1 id="app-name"></h1><small>Espace coach</small></div></div>
      <div class="clients" id="clients"></div>
      <div class="side-foot">
        <button class="btn primary" data-act="new-client" type="button">+ Nouveau client</button>
        <button class="btn ghost" data-act="settings" type="button">Réglages de la méthode et du PDF</button>
        <button class="btn ghost" data-act="logout" type="button">Se déconnecter</button>
      </div>
    </aside>
    <main id="main"></main></div>
    <datalist id="dl-ex">${LIBRARY.map((e) => `<option value="${esc(e.n)}">${esc(e.g)}</option>`).join("")}</datalist>
    <datalist id="dl-tech">${TECHNIQUES.map((t) => `<option value="${esc(t)}"></option>`).join("")}</datalist>
    <datalist id="dl-rest">${RESTS.map((t) => `<option value="${esc(t)}"></option>`).join("")}</datalist>`;
  el.addEventListener("click", onClick);
  el.addEventListener("input", onInput);
  el.addEventListener("change", onChange);
  el.addEventListener("focusout", (e) => { if (e.target.dataset && e.target.dataset.fb) setTimeout(() => { if (!isTyping()) renderMain(); }, 60); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && S.cur) reloadClient(true); });
  await loadClients();
  if (S.clients.length) await selectClient(S.clients[0].id); else render();
}

function isTyping() {
  const a = document.activeElement;
  return a && ["INPUT", "TEXTAREA", "SELECT"].includes(a.tagName) && $("#main")?.contains(a);
}
const client = () => S.clients.find((c) => c.id === S.cur) || null;
const week = () => S.weeks.find((w) => w.id === S.curWeek) || null;
const weekAt = (cy, n) => S.weeks.find((w) => w.cycle === cy && w.num === n) || null;

async function loadClients() {
  const { data, error } = await sb.from("clients").select("*").order("name");
  if (error) { toast("Impossible de charger les clients."); return; }
  S.clients = data || [];
}
async function selectClient(id) {
  S.cur = id; S.viewCycle = null; S.curWeek = null;
  $("#side")?.classList.remove("open");
  await reloadClient(false);
}
async function reloadClient(quiet) {
  const cid = S.cur;
  if (!cid) return render();
  const [{ data: weeks }, { data: fbs }] = await Promise.all([
    sb.from("weeks").select("*").eq("client_id", cid).order("cycle").order("num"),
    sb.from("feedback").select("*").eq("client_id", cid),
  ]);
  if (S.cur !== cid) return;
  // ne pas écraser une semaine en cours de modification
  const local = Object.fromEntries(S.weeks.filter((w) => S.saving[w.id]).map((w) => [w.id, w]));
  S.weeks = (weeks || []).map((w) => local[w.id] || w);
  S.fb = Object.fromEntries((fbs || []).map((f) => [f.week_id, f]));
  if (!S.curWeek || !week()) {
    const c = client();
    S.curWeek = (weekAt(c.cycle, c.current_week) || S.weeks[S.weeks.length - 1] || {}).id || null;
  }
  if (!(quiet && isTyping())) render();
}

/* ---------- enregistrement ---------- */
function saveWeek(id, delay = 600) {
  S.saving[id] = true;
  clearTimeout(timers[id]);
  timers[id] = setTimeout(async () => {
    const w = S.weeks.find((x) => x.id === id);
    if (!w) return;
    const { error } = await sb.from("weeks").update({ seances: w.seances }).eq("id", id);
    S.saving[id] = false;
    if (error) toast("Enregistrement impossible, vérifie ta connexion.");
  }, delay);
}
function saveFb(wid, delay = 700) {
  clearTimeout(timers["fb" + wid]);
  timers["fb" + wid] = setTimeout(async () => {
    const f = S.fb[wid];
    if (!f) return;
    const row = { week_id: wid, client_id: S.cur, sets: f.sets || {}, energie: f.energie ?? null, nerveux: f.nerveux ?? null, sommeil: f.sommeil ?? null, douleurs: f.douleurs || "", remarques: f.remarques || "", submitted: !!f.submitted, submitted_at: f.submitted_at || null };
    const { error } = await sb.from("feedback").upsert(row);
    if (error) toast("Enregistrement du bilan impossible.");
  }, delay);
}
async function saveClient(patch) {
  const c = client();
  Object.assign(c, patch);
  const { error } = await sb.from("clients").update(patch).eq("id", c.id);
  if (error) toast("Enregistrement impossible.");
}
function ensureFb(w) {
  if (!S.fb[w.id]) S.fb[w.id] = { week_id: w.id, client_id: S.cur, sets: {}, energie: null, nerveux: null, sommeil: null, douleurs: "", remarques: "", submitted: false };
  if (!S.fb[w.id].sets) S.fb[w.id].sets = {};
  return S.fb[w.id];
}

/* ---------- rendu ---------- */
function render() { renderSidebar(); renderMain(); }
function renderSidebar() {
  $("#app-name").textContent = settings().appName;
  const el = $("#clients");
  if (!S.clients.length) { el.innerHTML = `<div class="hint" style="padding:10px">Aucun client pour l'instant.</div>`; return; }
  el.innerHTML = S.clients.map((c) => `<button class="client-item ${c.id === S.cur ? "on" : ""}" data-act="pick" data-id="${esc(c.id)}" type="button"><b>${esc(c.name)}</b><span>Cycle ${esc(c.cycle)} · ${esc(weekLabel(c.current_week))}${c.current_week ? " / " + esc(c.weeks_total) : ""}${c.user_id ? "" : " · compte non activé"}</span></button>`).join("");
}
function renderMain() {
  const m = $("#main");
  const c = client();
  if (!c) {
    m.innerHTML = `<div class="wrap"><button class="btn menu-btn" data-act="menu" type="button">☰ Clients</button><div class="card empty"><h2>Bienvenue</h2><p>Crée ton premier client : l'appli lui génère ses identifiants de connexion.</p><div><button class="btn primary" data-act="new-client" type="button">+ Nouveau client</button></div></div></div>`;
    return;
  }
  const cyc = S.viewCycle ?? c.cycle;
  const cycles = [...new Set(S.weeks.map((w) => w.cycle))].sort((a, b) => a - b);
  const chips = [];
  for (let n = 0; n <= c.weeks_total; n++) {
    const w = weekAt(cyc, n);
    const ph = phaseFor(n, c.weeks_total);
    const fb = w && S.fb[w.id];
    chips.push(`<button class="chip ${w && w.id === S.curWeek ? "on" : ""} ${w ? "" : "ghosted"}" ${w ? `data-act="week" data-id="${w.id}"` : "disabled"} title="${esc(ph.label)}" type="button"><span class="dot ${ph.key}"></span>${n === 0 ? "Calib." : "S" + n}${fb && fb.submitted ? " ✓" : ""}</button>`);
  }
  const w = week();
  const ph = w ? phaseFor(w.num, c.weeks_total) : null;
  const fb = w ? S.fb[w.id] : null;
  m.innerHTML = `<div class="wrap">
    <button class="btn menu-btn" data-act="menu" type="button">☰ Clients</button>
    <div class="head">
      <div><h2>${esc(c.name)}</h2><div class="sub">${esc(c.objectif)} · Cycle ${esc(cyc)} de ${esc(c.weeks_total)} semaines</div></div>
      <div class="weeks">${cycles.length > 1 ? `<select class="field" style="width:auto" data-act-change="cycle" aria-label="Cycle affiché">${cycles.map((x) => `<option value="${x}" ${x === cyc ? "selected" : ""}>Cycle ${x}</option>`).join("")}</select>` : ""}${chips.join("")}</div>
    </div>
    ${w ? `<div class="bar"><div class="left">
        <span class="pill accent"><span class="dot ${ph.key}"></span>${esc(weekLabel(w.num))} · Objectif ${esc(ph.key === "calib" ? "RIR " + fmt(ph.target) : ph.label)}</span>
        ${w.published ? `<span class="pill good">Visible par ${esc(c.name)}</span>` : `<span class="pill warn">Brouillon, invisible pour le client</span>`}
        ${fb && fb.submitted ? `<span class="pill good">Bilan reçu</span>` : fb && Object.keys(fb.sets || {}).length ? `<span class="pill">Séries en cours de saisie</span>` : ""}
      </div><div class="right">
        <button class="btn small" data-act="refresh" type="button">Actualiser</button>
        ${w.published ? `<button class="btn small" data-act="unpublish" type="button">Repasser en brouillon</button>` : `<button class="btn primary" data-act="publish" type="button">Publier pour ${esc(c.name)}</button>`}
      </div></div>` : ""}
    <div class="tabs" role="tablist">${[["programme", "Programme"], ["bilan", "Bilan & surcharge"], ["progression", "Progression"], ["infos", "Infos client"]].map(([k, l]) => `<button class="tab ${S.tab === k ? "on" : ""}" role="tab" aria-selected="${S.tab === k}" data-act="tab" data-id="${k}" type="button">${l}</button>`).join("")}</div>
    <div id="tabbody">${!w && S.tab !== "infos" ? `<div class="card empty">Aucune semaine pour ce cycle.</div>` : tabBody()}</div>
  </div>`;
}
function tabBody() {
  if (S.tab === "programme") return renderProgramme();
  if (S.tab === "bilan") return renderBilan();
  if (S.tab === "progression") return renderProgression();
  return renderInfos();
}

/* ----- Programme ----- */
function renderProgramme() {
  const w = week();
  const head = `<div class="bar"><div class="left"><span class="hint">Tout est modifiable directement, l'enregistrement est automatique.</span></div>
    <div class="right"><button class="btn primary" data-act="pdf" type="button">Générer le PDF</button></div></div>`;
  const seances = w.seances.map((se, si) => `<section class="card" aria-label="Séance ${si + 1}">
    <div class="seance-head">
      <span class="num">Séance ${si + 1}</span>
      <input class="field title" id="se-t-${si}" data-bind="seances.${si}.title" value="${esc(se.title)}" aria-label="Titre de la séance">
      <input class="field" id="se-w-${si}" data-bind="seances.${si}.warmup" value="${esc(se.warmup)}" aria-label="Échauffement" placeholder="Échauffement">
      <span>${si > 0 ? `<button class="btn ghost small" data-act="se-up" data-si="${si}" title="Monter" type="button">↑</button>` : ""}<button class="btn ghost small danger" data-act="se-del" data-si="${si}" title="Supprimer la séance" type="button">✕</button></span>
    </div>
    <div>${se.exercises.map((ex, ei) => renderEx(ex, si, ei)).join("")}</div>
    <div><button class="btn small" data-act="ex-add" data-si="${si}" type="button">+ Exercice</button></div>
  </section>`).join("");
  return `<div class="stack">${head}${seances}<div><button class="btn" data-act="se-add" type="button">+ Séance</button></div></div>`;
}
function renderEx(ex, si, ei) {
  const img = imgSrc(ex.img);
  const p = `seances.${si}.exercises.${ei}`;
  const groups = ex.sets.map((g, gi) => {
    const flat = flatSets({ sets: ex.sets.slice(0, gi) }).length;
    const c = Math.max(1, Number(g.count) || 1);
    const lbl = c === 1 ? `Série ${flat + 1}` : `Séries ${flat + 1}-${flat + c}`;
    const gp = `${p}.sets.${gi}`;
    const id = `${si}-${ei}-${gi}`;
    return `<div class="group">
      <span class="lbl">${lbl}</span>
      <input class="field num" id="g-c-${id}" data-bind="${gp}.count" data-type="int" value="${esc(g.count)}" aria-label="Nombre de séries" title="Nombre de séries">
      <span class="x">×</span>
      <input class="field num" id="g-r-${id}" data-bind="${gp}.reps" value="${esc(g.reps)}" aria-label="Répétitions" title="Répétitions">
      <span class="x">@</span>
      <input class="field num" id="g-l-${id}" data-bind="${gp}.load" data-type="num" value="${esc(fmt(g.load))}" aria-label="Charge" title="Charge" ${g.unit === "" ? "disabled" : ""}>
      <select class="field" id="g-u-${id}" data-bind="${gp}.unit" data-rerender="1" aria-label="Unité">${UNITS.map((u) => `<option value="${esc(u)}" ${u === (g.unit ?? "kg") ? "selected" : ""}>${esc(UNIT_LABEL[u])}</option>`).join("")}</select>
      <input class="field note" id="g-n-${id}" data-bind="${gp}.note" list="dl-tech" value="${esc(g.note)}" placeholder="technique : choisis ou écris" aria-label="Consigne">
      <span class="gact"><button class="btn ghost small" data-act="drop" data-si="${si}" data-ei="${ei}" data-gi="${gi}" type="button">${g.drop ? "− enchaînement" : "+ enchaînement"}</button>${ex.sets.length > 1 ? `<button class="btn ghost small danger" data-act="g-del" data-si="${si}" data-ei="${ei}" data-gi="${gi}" title="Retirer ce bloc" type="button">✕</button>` : ""}</span>
      ${g.drop ? `<div class="drop"><span>+</span><input class="field num" id="d-r-${id}" data-bind="${gp}.drop.reps" value="${esc(g.drop.reps)}" aria-label="Répétitions enchaînées"><span>@</span><input class="field num" id="d-l-${id}" data-bind="${gp}.drop.load" data-type="num" value="${esc(fmt(g.drop.load))}" aria-label="Charge enchaînée"><select class="field" id="d-u-${id}" data-bind="${gp}.drop.unit" aria-label="Unité">${UNITS.map((u) => `<option value="${esc(u)}" ${u === (g.drop.unit ?? g.unit) ? "selected" : ""}>${esc(UNIT_LABEL[u])}</option>`).join("")}</select><input class="field" id="d-n-${id}" data-bind="${gp}.drop.note" value="${esc(g.drop.note)}" placeholder="ex. en moins lourd"></div>` : ""}
    </div>`;
  }).join("");
  return `<div class="ex">
    <button class="thumb ${img ? "has" : ""}" style="${img ? `background-image:url('${esc(img)}')` : ""}" data-act="img" data-si="${si}" data-ei="${ei}" aria-label="Choisir l'illustration" type="button">${img ? "" : "+ image"}</button>
    <div class="ex-main">
      <div class="ex-top"><span class="ex-idx">${ei + 1}</span><input class="field title" id="ex-n-${si}-${ei}" data-bind="${p}.name" list="dl-ex" autocomplete="off" value="${esc(ex.name)}" aria-label="Nom de l'exercice" placeholder="Tape pour chercher dans la bibliothèque"><input class="field rest" id="ex-r-${si}-${ei}" data-bind="${p}.rest" list="dl-rest" value="${esc(ex.rest)}" aria-label="Repos" placeholder="repos"></div>
      <div class="groups">${groups}</div>
      <div><button class="btn ghost small" data-act="g-add" data-si="${si}" data-ei="${ei}" type="button">+ bloc de séries</button></div>
      <div class="preview-line" data-preview="${si}-${ei}">${esc(groupLines(ex).join(" · "))}</div>
    </div>
    <div class="ex-actions">
      ${ei > 0 ? `<button class="btn ghost small" data-act="ex-up" data-si="${si}" data-ei="${ei}" title="Monter" type="button">↑</button>` : ""}
      <button class="btn ghost small" data-act="ex-down" data-si="${si}" data-ei="${ei}" title="Descendre" type="button">↓</button>
      <button class="btn ghost small danger" data-act="ex-del" data-si="${si}" data-ei="${ei}" title="Supprimer l'exercice" type="button">✕</button>
    </div>
  </div>`;
}

/* ----- Bilan & surcharge ----- */
function renderBilan() {
  const c = client(), w = week();
  const fb = S.fb[w.id] || { sets: {} };
  const last = w.num >= c.weeks_total;
  const s = settings();
  const nextPh = last ? { label: "Calibration", target: s.calibTarget, key: "calib" } : phaseFor(w.num + 1, c.weeks_total);
  const nextLbl = last ? `Calibration du cycle ${w.cycle + 1}` : weekLabel(w.num + 1);
  const hasData = Object.values(fb.sets || {}).some((a) => (a || []).some((x) => x && x.reps != null));
  const scale = (k, l) => `<div class="metric"><label>${l}</label><div class="scale">${[1, 2, 3, 4, 5].map((n) => `<button data-act="scale" data-k="${k}" data-v="${n}" class="${fb[k] === n ? "on" : ""}" aria-label="${l} ${n}" type="button">${n}</button>`).join("")}</div></div>`;
  const rows = w.seances.map((se, si) => se.exercises.map((ex) => {
    const flat = flatSets(ex);
    const arr = (fb.sets || {})[ex.id] || [];
    return `<tr class="exrow"><td colspan="5">S${si + 1} · ${esc(ex.name)}</td></tr>` + flat.map((f, k) => {
      const a = arr[k] || {};
      const g = f.g;
      return `<tr><td class="n">Série ${k + 1}</td><td class="n">${esc(g.reps)} reps ${g.unit === "" ? "" : "@ " + esc(loadStr(g.load, g.unit))}</td>
        <td><input class="field num" id="fb-l-${ex.id}-${k}" data-fb="${esc(ex.id)}" data-k="${k}" data-f="load" value="${esc(fmt(a.load))}" placeholder="${esc(fmt(g.load))}" aria-label="Charge réalisée" ${g.unit === "" ? "disabled" : ""}></td>
        <td><input class="field num" id="fb-r-${ex.id}-${k}" data-fb="${esc(ex.id)}" data-k="${k}" data-f="reps" value="${esc(fmt(a.reps))}" aria-label="Répétitions réalisées"></td>
        <td><input class="field num" id="fb-i-${ex.id}-${k}" data-fb="${esc(ex.id)}" data-k="${k}" data-f="rir" value="${esc(fmt(a.rir))}" aria-label="RIR"></td></tr>`;
    }).join("");
  }).join("")).join("");
  const status = fb.submitted
    ? `<div class="alert ok">Bilan envoyé par ${esc(c.name)}${fb.submitted_at ? " le " + new Date(fb.submitted_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : ""}.</div>`
    : `<div class="alert info">${esc(c.name)} n'a pas encore envoyé son bilan. Ses séries apparaissent ici au fur et à mesure (bouton « Actualiser »). Tu peux aussi les saisir toi-même.</div>`;
  return `<div class="stack">
    ${status}
    <section class="card">
      <h3>Ressenti et performances</h3>
      <div class="metrics">${scale("energie", "Énergie")}${scale("nerveux", "État nerveux")}${scale("sommeil", "Sommeil")}</div>
      <div class="grid2"><div class="metric"><label for="fb-d">Douleurs / gênes</label><input class="field" id="fb-d" data-fbtop="douleurs" value="${esc(fb.douleurs)}" placeholder="aucune"></div>
      <div class="metric"><label for="fb-m">Remarques</label><input class="field" id="fb-m" data-fbtop="remarques" value="${esc(fb.remarques)}"></div></div>
      ${fb.douleurs ? `<div class="alert bad">Douleur signalée : ${esc(fb.douleurs)}. Vérifie les exercices concernés avant de valider la surcharge.</div>` : ""}
      <p class="hint">Charge vide = charge prescrite. RIR = répétitions en réserve (0 = échec).</p>
      <div class="scroll-x"><table class="table"><thead><tr><th>Série</th><th>Prescrit</th><th>Charge</th><th>Reps</th><th>RIR</th></tr></thead><tbody>${rows}</tbody></table></div>
    </section>
    <section class="card">
      <h3>Proposition pour ${esc(nextLbl)} · objectif RIR ${esc(fmt(nextPh.target))}${nextPh.key === "calib" || nextPh.key === "fail" ? "" : " (" + esc(nextPh.label) + ")"}</h3>
      ${hasData ? renderSugg(w, fb, c, nextPh, last, nextLbl) : `<p class="hint">Dès que des séries sont notées, la surcharge proposée apparaît ici.</p>`}
    </section></div>`;
}
function renderSugg(w, fb, c, nextPh, last, nextLbl) {
  const s = settings();
  const sugg = computeSuggestions(w, fb, c.weeks_total, nextPh);
  const ovs = S.overrides[w.id] || {};
  const exists = last ? weekAt(w.cycle + 1, 0) : weekAt(w.cycle, w.num + 1);
  const rows = w.seances.map((se, si) => se.exercises.map((ex) => {
    const r = sugg.ex[ex.id];
    return `<tr class="exrow"><td colspan="4">S${si + 1} · ${esc(ex.name)}</td></tr>` + ex.sets.map((g, gi) => {
      const p = r.groups[gi];
      const key = ex.id + ":" + gi;
      const ov = ovs[key] || {};
      const nl = ov.load !== undefined ? ov.load : p.load, nr = ov.reps !== undefined ? ov.reps : p.reps;
      const arrow = { up: "↑", down: "↓", same: "=", reps: "+rep" }[p.dir];
      return `<tr class="sugg"><td class="n">${esc(g.count)} × ${esc(g.reps)} ${g.unit === "" ? "" : "@ " + esc(loadStr(g.load, g.unit))}</td>
        <td><span class="arrow ${p.dir}">${arrow}</span></td>
        <td style="white-space:nowrap"><input class="field num inl" id="sg-r-${ex.id}-${gi}" data-ov="${esc(key)}" data-f="reps" value="${esc(nr)}" aria-label="Répétitions proposées"> reps ${g.unit === "" ? "" : `@ <input class="field num inl" id="sg-l-${ex.id}-${gi}" data-ov="${esc(key)}" data-f="load" value="${esc(fmt(nl))}" aria-label="Charge proposée"> ${esc(UNIT_LABEL[g.unit ?? "kg"])}`}</td>
        <td><span class="why">${esc(p.why)}</span></td></tr>`;
    }).join("");
  }).join("")).join("");
  return `${sugg.fatigue ? `<div class="alert warn">Énergie ou état nerveux bas : la proposition garde 1 répétition de réserve en plus.</div>` : ""}
    <div class="scroll-x"><table class="table"><thead><tr><th>Cette semaine</th><th></th><th>Proposé</th><th>Pourquoi</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="hint">Capacité estimée = reps réalisées + RIR, puis charge recalculée pour l'objectif, arrondie à ton incrément (${esc(fmt(s.increments.kg))} kg barre/machine, ${esc(fmt(s.increments["kg/main"]))} kg haltères) et plafonnée à +${esc(s.maxJump)} %. Si l'incrément est trop gros, on ajoute une répétition. Chaque valeur est modifiable.</p>
    <div class="bar"><div class="left"></div><div class="right">
      ${exists ? `<span class="hint">${esc(nextLbl)} existe déjà.</span><button class="btn" data-act="create-next" data-confirm="1" type="button">Remplacer ${esc(nextLbl)}</button>`
        : `<button class="btn primary" data-act="create-next" type="button">${last ? `Préparer le cycle ${w.cycle + 1} (calibration)` : `Préparer ${esc(nextLbl)}`}</button>`}
    </div></div>`;
}
async function createNext() {
  const c = client(), w = week();
  const last = w.num >= c.weeks_total;
  const s = settings();
  const nextPh = last ? { label: "Calibration", target: s.calibTarget, key: "calib" } : phaseFor(w.num + 1, c.weeks_total);
  const sugg = computeSuggestions(w, S.fb[w.id], c.weeks_total, nextPh);
  const ovs = S.overrides[w.id] || {};
  const seances = clone(w.seances);
  seances.forEach((se) => se.exercises.forEach((ex) => {
    const r = sugg.ex[ex.id];
    ex.sets.forEach((g, gi) => {
      const p = r.groups[gi];
      const ov = ovs[ex.id + ":" + gi] || {};
      g.load = g.unit === "" ? null : ov.load !== undefined ? ov.load : p.load;
      g.reps = ov.reps !== undefined ? ov.reps : p.reps;
      if (g.drop && p.dropLoad != null) g.drop.load = p.dropLoad;
    });
  }));
  const row = { client_id: c.id, cycle: last ? w.cycle + 1 : w.cycle, num: last ? 0 : w.num + 1, seances, published: false };
  const { data, error } = await sb.from("weeks").upsert(row, { onConflict: "client_id,cycle,num" }).select().single();
  if (error) { toast("Création impossible : " + error.message); return; }
  await saveClient({ cycle: row.cycle, current_week: row.num });
  S.weeks = S.weeks.filter((x) => x.id !== data.id).concat(data).sort((a, b) => a.cycle - b.cycle || a.num - b.num);
  S.curWeek = data.id; S.viewCycle = null; S.tab = "programme";
  render();
  toast(`${weekLabel(row.num)} préparée en brouillon. Vérifie-la puis clique sur « Publier ».`);
}

/* ----- Progression ----- */
function renderProgression() {
  const c = client();
  const series = progressionSeries(S.weeks, S.fb, c.weeks_total);
  const ids = Object.keys(series);
  const withFb = S.weeks.filter((w) => S.fb[w.id]);
  if (!ids.length) return `<div class="card empty">La progression apparaîtra dès que des séries auront été notées.</div>`;
  const well = withFb.map((w) => { const f = S.fb[w.id]; return `<tr><td>C${w.cycle} · ${esc(weekLabel(w.num))}</td><td class="n">${f.energie ?? "–"}</td><td class="n">${f.nerveux ?? "–"}</td><td class="n">${f.sommeil ?? "–"}</td><td>${esc(f.douleurs || "")}</td></tr>`; }).join("");
  return `<div class="stack"><p class="hint">Force estimée (1RM théorique) par exercice, à partir de la meilleure série de chaque semaine : charge × (1 + (reps + RIR) / 30).</p>
    <div class="charts">${ids.map((id) => sparkCard(series[id])).join("")}</div>
    <section class="card"><h3>Ressenti semaine par semaine</h3><div class="scroll-x"><table class="table"><thead><tr><th>Semaine</th><th>Énergie</th><th>Nerveux</th><th>Sommeil</th><th>Douleurs</th></tr></thead><tbody>${well}</tbody></table></div></section></div>`;
}

/* ----- Infos client ----- */
function renderInfos() {
  const c = client();
  return `<div class="stack"><section class="card"><div class="form">
    <label for="ci-name">Prénom</label><input class="field" id="ci-name" data-client="name" value="${esc(c.name)}">
    <label for="ci-obj">Objectif</label><input class="field" id="ci-obj" data-client="objectif" value="${esc(c.objectif)}">
    <label for="ci-tot">Durée du cycle</label><select class="field" id="ci-tot" data-client="weeks_total">${[6, 7, 8, 9, 10].map((n) => `<option ${n === c.weeks_total ? "selected" : ""} value="${n}">${n} semaines</option>`).join("")}</select>
    <label for="ci-notes">Notes (matériel, blessures, préférences)</label><textarea class="field" id="ci-notes" data-client="notes" rows="4">${esc(c.notes)}</textarea>
    <label>Accès à l'appli</label><div>${esc(c.email)} · ${c.user_id ? `<span class="pill good">compte activé</span>` : `<span class="pill warn">compte non activé</span>`} <button class="btn small" data-act="share-access" type="button">Renvoyer les instructions d'accès</button></div>
  </div></section>
  ${week() ? `<section class="card"><div class="bar"><div class="left"><b>${esc(weekLabel(week().num))} du cycle ${esc(week().cycle)}</b></div><div class="right"><button class="btn danger small" data-act="del-week" type="button">Supprimer cette semaine</button></div></div></section>` : ""}
  <section class="card"><div class="bar"><div class="left"><span class="hint">Supprime la fiche, tous les programmes et bilans. Le client ne pourra plus rien voir.</span></div><div class="right"><button class="btn danger" data-act="del-client" type="button">Supprimer ce client</button></div></div></section></div>`;
}

/* ---------- événements ---------- */
function setPath(o, p, v) { const ks = p.split("."); let x = o; for (let i = 0; i < ks.length - 1; i++) x = x[ks[i]] ??= {}; x[ks[ks.length - 1]] = v; }
function getPath(o, p) { return p.split(".").reduce((x, k) => x?.[k], o); }

async function onClick(e) {
  const b = e.target.closest("[data-act]");
  if (!b || !S.el.contains(b)) return;
  const a = b.dataset.act, si = +b.dataset.si, ei = +b.dataset.ei, gi = +b.dataset.gi;
  const w = week();
  const edit = (fn) => { fn(); saveWeek(w.id, 200); renderMain(); };
  switch (a) {
    case "pick": await selectClient(b.dataset.id); break;
    case "menu": $("#side").classList.toggle("open"); break;
    case "tab": S.tab = b.dataset.id; renderMain(); break;
    case "week": S.curWeek = b.dataset.id; renderMain(); break;
    case "refresh": await reloadClient(false); toast("À jour"); break;
    case "publish": case "unpublish": {
      const pub = a === "publish";
      const { error } = await sb.from("weeks").update({ published: pub }).eq("id", w.id);
      if (error) { toast("Action impossible."); break; }
      w.published = pub;
      if (pub) await saveClient({ cycle: w.cycle, current_week: w.num });
      render(); toast(pub ? `Publiée : ${client().name} la voit dans son appli.` : "Repassée en brouillon."); break;
    }
    case "se-add": edit(() => w.seances.push(emptySeance(w.seances.length + 1))); break;
    case "se-del": inlineConfirm(b, "Supprimer la séance ?", () => edit(() => w.seances.splice(si, 1))); break;
    case "se-up": edit(() => { const t = w.seances.splice(si, 1)[0]; w.seances.splice(si - 1, 0, t); }); break;
    case "ex-add": edit(() => w.seances[si].exercises.push(emptyEx())); break;
    case "ex-del": inlineConfirm(b, "Supprimer ?", () => edit(() => w.seances[si].exercises.splice(ei, 1))); break;
    case "ex-up": edit(() => { const l = w.seances[si].exercises; const t = l.splice(ei, 1)[0]; l.splice(ei - 1, 0, t); }); break;
    case "ex-down": edit(() => { const l = w.seances[si].exercises; if (ei < l.length - 1) { const t = l.splice(ei, 1)[0]; l.splice(ei + 1, 0, t); } else if (si < w.seances.length - 1) { const t = l.splice(ei, 1)[0]; w.seances[si + 1].exercises.unshift(t); } }); break;
    case "g-add": edit(() => { const st = w.seances[si].exercises[ei].sets; const lst = st[st.length - 1] || {}; st.push({ count: 1, reps: lst.reps || 10, load: lst.load ?? null, unit: lst.unit ?? "kg", note: "" }); }); break;
    case "g-del": edit(() => w.seances[si].exercises[ei].sets.splice(gi, 1)); break;
    case "drop": edit(() => { const g = w.seances[si].exercises[ei].sets[gi]; if (g.drop) delete g.drop; else g.drop = { reps: 10, load: g.load != null ? roundTo(Number(g.load) * 0.8, 2.5) : null, unit: g.unit ?? "kg", note: "" }; }); break;
    case "img": openImagePicker(si, ei); break;
    case "pdf": makePdf(w, client()); break;
    case "scale": { const fb = ensureFb(w); const v = +b.dataset.v; fb[b.dataset.k] = fb[b.dataset.k] === v ? null : v; saveFb(w.id, 200); renderMain(); break; }
    case "create-next": if (b.dataset.confirm) inlineConfirm(b, "Écraser la semaine existante ?", createNext); else createNext(); break;
    case "new-client": openNewClient(); break;
    case "settings": openSettings(); break;
    case "share-access": showAccess(client(), null); break;
    case "del-client": inlineConfirm(b, "Supprimer définitivement ce client ?", deleteClient); break;
    case "del-week": inlineConfirm(b, "Supprimer définitivement cette semaine ?", deleteWeek); break;
    case "logout": await sb.auth.signOut(); break;
  }
}
function onChange(e) {
  const t = e.target;
  if (t.dataset.actChange === "cycle") {
    const c = client(); const cy = +t.value;
    S.viewCycle = cy === c.cycle ? null : cy;
    const ws = S.weeks.filter((w) => w.cycle === cy);
    S.curWeek = ws.length ? ws[ws.length - 1].id : null;
    renderMain(); return;
  }
  if (t.dataset.bind && /exercises\.\d+\.name$/.test(t.dataset.bind)) {
    const w = week();
    const ex = getPath(w, t.dataset.bind.replace(/\.name$/, ""));
    const v = t.value.trim().toUpperCase();
    const hit = LIB_BY_NAME.get(v);
    if (ex) {
      ex.name = v;
      if (hit && (!ex.img || ex.img.startsWith("ill/lib/"))) ex.img = hit.img;
      saveWeek(w.id, 100);
      renderMain();
    }
    return;
  }
  if (t.dataset.bind && t.dataset.rerender) renderMain();
  if (t.dataset.client && t.tagName === "SELECT") { saveClient({ [t.dataset.client]: parseInt(t.value, 10) }).then(render); }
}
function onInput(e) {
  const t = e.target;
  const w = week();
  if (t.dataset.bind && w) {
    let v = t.value;
    if (t.dataset.type === "num") v = num(v);
    else if (t.dataset.type === "int") v = Math.max(1, parseInt(v, 10) || 1);
    setPath(w, t.dataset.bind, v);
    if (t.dataset.bind.endsWith(".unit") && v === "" && !t.dataset.bind.includes(".drop.")) getPath(w, t.dataset.bind.replace(/\.unit$/, "")).load = null;
    const m = t.dataset.bind.match(/^seances\.(\d+)\.exercises\.(\d+)/);
    if (m) { const pv = document.querySelector(`[data-preview="${m[1]}-${m[2]}"]`); if (pv) pv.textContent = groupLines(w.seances[m[1]].exercises[m[2]]).join(" · "); }
    saveWeek(w.id);
    return;
  }
  if (t.dataset.fbtop) { ensureFb(w)[t.dataset.fbtop] = t.value; saveFb(w.id, 900); return; }
  if (t.dataset.fb) {
    const fb = ensureFb(w);
    const arr = (fb.sets[t.dataset.fb] ||= []);
    const k = +t.dataset.k;
    for (let i = 0; i <= k; i++) if (!arr[i]) arr[i] = { load: null, reps: null, rir: null };
    arr[k][t.dataset.f] = num(t.value);
    saveFb(w.id, 700);
    return;
  }
  if (t.dataset.ov) { const o = (S.overrides[w.id] ||= {}); const r = (o[t.dataset.ov] ||= {}); r[t.dataset.f] = t.dataset.f === "load" ? num(t.value) : t.value; return; }
  if (t.dataset.client && t.tagName !== "SELECT") {
    clearTimeout(timers.c);
    const k = t.dataset.client, v = t.value;
    timers.c = setTimeout(() => saveClient({ [k]: v }).then(renderSidebar), 700);
  }
}

async function deleteClient() {
  const c = client();
  const { error } = await sb.from("clients").delete().eq("id", c.id);
  if (error) { toast("Suppression impossible."); return; }
  S.clients = S.clients.filter((x) => x.id !== c.id);
  S.cur = null; S.weeks = []; S.fb = {};
  if (S.clients.length) await selectClient(S.clients[0].id); else render();
}
async function deleteWeek() {
  const w = week();
  const { error } = await sb.from("weeks").delete().eq("id", w.id);
  if (error) { toast("Suppression impossible."); return; }
  S.weeks = S.weeks.filter((x) => x.id !== w.id);
  const lw = S.weeks[S.weeks.length - 1];
  S.curWeek = lw ? lw.id : null;
  if (lw) await saveClient({ cycle: lw.cycle, current_week: lw.num });
  render();
}

/* ---------- modales ---------- */
function openImagePicker(si, ei) {
  const own = Object.keys(store.images);
  const tpl = [...new Set(TEMPLATES.flatMap((t) => t.seances.flatMap((se) => se.exercises.map((ex) => ex.img).filter(Boolean))))];
  const groups = [...new Set(LIBRARY.map((e) => e.g))];
  const tile = (id, label) => `<button data-img="${esc(id)}" data-label="${esc((label || "").toLowerCase())}" type="button" title="${esc(label || "")}"><img src="${esc(imgSrc(id))}" alt="" loading="lazy"><span>${esc(label || "")}</span></button>`;
  const m = openModal(`<h3>Illustration de l'exercice</h3>
    <div class="bar"><div class="left"><button class="btn primary" id="up-img" type="button">Importer une image</button><button class="btn" id="no-img" type="button">Sans image</button></div><div class="right"><button class="btn ghost" data-close="1" type="button">Fermer</button></div></div>
    <input class="field" id="lib-q" placeholder="Rechercher un exercice (ex. tirage, curl, fente…)" autocomplete="off">
    <div class="lib-scroll">
      ${own.length ? `<h4>Tes images</h4><div class="lib">${own.map((id) => tile(id, store.images[id].name)).join("")}</div>` : ""}
      ${groups.map((g) => `<h4 data-group>${esc(g)}</h4><div class="lib">${LIBRARY.filter((e) => e.g === g).map((e) => tile(e.img, e.n)).join("")}</div>`).join("")}
      <h4>Programme modèle</h4><div class="lib">${tpl.map((id) => tile(id, "")).join("")}</div>
    </div>
    <input type="file" id="file" accept="image/*" hidden>`, true);
  $("#lib-q", m).oninput = (ev) => {
    const q = ev.target.value.trim().toLowerCase();
    $$(".lib button", m).forEach((b) => { b.hidden = !!q && !b.dataset.label.includes(q); });
    $$(".lib", m).forEach((l) => { const h = l.previousElementSibling; const any = [...l.children].some((b) => !b.hidden); l.hidden = !any; if (h) h.hidden = !any; });
  };
  const w = week();
  const ex = w.seances[si].exercises[ei];
  const set = (id) => { ex.img = id; saveWeek(w.id, 100); closeModal(); renderMain(); };
  $("#no-img", m).onclick = () => set(null);
  $$("[data-img]", m).forEach((b) => (b.onclick = () => set(b.dataset.img)));
  $("#up-img", m).onclick = () => {
    const f = $("#file", m);
    f.onchange = async () => {
      const file = f.files[0];
      if (!file) return;
      try {
        const data = await shrinkImage(file, 260);
        const id = "img-" + uid();
        const { error } = await sb.from("images").insert({ id, name: ex.name, data });
        if (error) throw error;
        store.images[id] = { id, name: ex.name, data };
        set(id);
      } catch (err) { toast("Image impossible à importer. Essaie un JPG ou un PNG."); }
    };
    f.click();
  };
}

function openNewClient() {
  const pw = randomPassword();
  const m = openModal(`<h3>Nouveau client</h3><div class="form">
    <label for="nc-name">Prénom</label><input class="field" id="nc-name" placeholder="Prénom du client">
    <label for="nc-email">E-mail du client</label><input class="field" id="nc-email" type="email" placeholder="il s'en servira pour se connecter">
    <label for="nc-pw">Mot de passe provisoire</label><input class="field" id="nc-pw" value="${esc(pw)}">
    <label for="nc-obj">Objectif</label><input class="field" id="nc-obj" value="Hypertrophie">
    <label for="nc-tot">Durée du cycle</label><select class="field" id="nc-tot">${[7, 8, 9].map((n) => `<option value="${n}" ${n === 8 ? "selected" : ""}>${n} semaines</option>`).join("")}</select>
    <label for="nc-base">Point de départ</label><select class="field" id="nc-base"><option value="">Programme vierge</option>${TEMPLATES.map((t) => `<option value="tpl:${esc(t.id)}">Modèle : ${esc(t.name)}</option>`).join("")}${S.clients.map((c) => `<option value="cl:${esc(c.id)}">Copier le programme actuel de ${esc(c.name)}</option>`).join("")}</select>
  </div><p class="hint">Le client démarre par une semaine de calibration (objectif RIR ${esc(fmt(settings().calibTarget))}). Elle reste en brouillon jusqu'à ce que tu la publies.</p>
  <div class="bar"><div class="left"><span id="nc-err" class="err" role="alert"></span></div><div class="right"><button class="btn ghost" data-close="1" type="button">Annuler</button><button class="btn primary" id="nc-go" type="button">Créer le client et son accès</button></div></div>`);
  $("#nc-go", m).onclick = async (ev) => {
    const btn = ev.currentTarget;
    const name = $("#nc-name", m).value.trim(), email = $("#nc-email", m).value.trim().toLowerCase(), password = $("#nc-pw", m).value;
    const err = $("#nc-err", m);
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) { err.textContent = "Indique le prénom et un e-mail valide."; return; }
    if (password.length < 8) { err.textContent = "Le mot de passe doit faire au moins 8 caractères."; return; }
    btn.disabled = true; err.textContent = "Création…";
    let seances = [emptySeance(1)];
    const base = $("#nc-base", m).value;
    if (base.startsWith("tpl:")) seances = clone(TEMPLATES.find((t) => "tpl:" + t.id === base).seances);
    else if (base.startsWith("cl:")) {
      const bc = S.clients.find((c) => "cl:" + c.id === base);
      const { data } = await sb.from("weeks").select("seances").eq("client_id", bc.id).eq("cycle", bc.cycle).eq("num", bc.current_week).maybeSingle();
      if (data) seances = clone(data.seances);
    }
    seances.forEach((se) => { se.id = "se-" + uid(); se.exercises.forEach((ex) => { ex.id = "ex-" + uid(); }); });
    const { data: c, error: e1 } = await sb.from("clients").insert({ name, email, objectif: $("#nc-obj", m).value.trim() || "Hypertrophie", weeks_total: +$("#nc-tot", m).value }).select().single();
    if (e1) { btn.disabled = false; err.textContent = /duplicate|unique/i.test(e1.message) ? "Un client utilise déjà cet e-mail." : "Création impossible : " + e1.message; return; }
    await sb.from("weeks").insert({ client_id: c.id, cycle: 1, num: 0, seances, published: false });
    // création du compte de connexion du client
    let accountNote = null;
    try {
      const { data: su, error: e2 } = await tempClient().auth.signUp({ email, password });
      if (e2) accountNote = "Le compte n'a pas pu être créé : " + e2.message + ". Le client pourra utiliser « Mot de passe oublié ».";
      else if (!su.session) accountNote = "Ton projet Supabase demande une confirmation par e-mail : ton client doit d'abord cliquer sur le lien reçu.";
    } catch (x) { accountNote = "Le compte n'a pas pu être créé (connexion)."; }
    S.clients.push(c);
    S.clients.sort((a, b) => a.name.localeCompare(b.name));
    S.tab = "programme";
    await selectClient(c.id);
    showAccess(c, password, accountNote);
  };
}

function showAccess(c, password, note) {
  const url = appUrl();
  const txt = `Salut ${c.name} ! Voici ton accès à ton appli de coaching :

Lien : ${url}
E-mail : ${c.email}
Mot de passe : ${password || "(celui que tu as déjà, ou « Mot de passe oublié » sur l'écran de connexion)"}

Pour l'installer sur ton téléphone :
• iPhone : ouvre le lien dans Safari → bouton Partager → « Sur l'écran d'accueil ».
• Android : ouvre le lien dans Chrome → menu ⋮ → « Installer l'application ».

Tu pourras changer ton mot de passe dans l'onglet Compte.`;
  const m = openModal(`<h3>Accès de ${esc(c.name)}</h3>
    ${note ? `<div class="alert warn">${esc(note)}</div>` : ""}
    <p class="hint">Envoie ce message à ${esc(c.name)} (Instagram, SMS, mail).${password ? " Le mot de passe n'est affiché qu'une seule fois." : ""}</p>
    <code class="tpl" id="acc-txt">${esc(txt)}</code>
    <div class="bar"><div class="left"><span id="acc-st" class="hint"></span></div><div class="right"><button class="btn ghost" data-close="1" type="button">Fermer</button><button class="btn primary" id="acc-copy" type="button">Copier le message</button></div></div>`, true);
  $("#acc-copy", m).onclick = async () => {
    try { await navigator.clipboard.writeText(txt); $("#acc-st", m).textContent = "Copié."; }
    catch (e) { const r = document.createRange(); r.selectNodeContents($("#acc-txt", m)); const s = getSelection(); s.removeAllRanges(); s.addRange(r); $("#acc-st", m).textContent = "Texte sélectionné : copie-le avec Ctrl+C."; }
  };
}

function openSettings() {
  const s = settings();
  const m = openModal(`<h3>Réglages</h3>
  <h4>Phases de RIR</h4>
  <div class="form">
    <label for="st-cal">Calibration (semaine 0)</label><div>RIR cible <input class="field num inl" id="st-cal" value="${esc(fmt(s.calibTarget))}"></div>
    ${s.phases.map((p, i) => `<label>Phase ${i + 1}</label><div class="row-in">jusqu'à la semaine <input class="field num inl" id="st-pu-${i}" value="${esc(p.until === 99 ? "" : p.until)}" placeholder="fin"> libellé <input class="field inl-w" id="st-pl-${i}" value="${esc(p.label)}"> RIR visé <input class="field num inl" id="st-pt-${i}" value="${esc(fmt(p.target))}"></div>`).join("")}
    <label for="st-fail">Dernière semaine</label><label class="plain"><input type="checkbox" id="st-fail" ${s.lastWeekFailure ? "checked" : ""}> Échec volontaire (RIR 0)</label>
  </div>
  <h4>Surcharge progressive</h4>
  <div class="form">
    <label>Incréments de charge</label><div class="row-in">${["kg", "kg/côté", "kg/main", "+kg"].map((u) => `${esc(UNIT_LABEL[u])} <input class="field num inl" data-u="${esc(u)}" value="${esc(fmt(s.increments[u]))}" aria-label="Incrément ${esc(u)}">`).join("")}</div>
    <label for="st-max">Hausse max par semaine</label><div><input class="field num inl" id="st-max" value="${esc(s.maxJump)}"> %</div>
    <label for="st-fat">Fatigue</label><label class="plain"><input type="checkbox" id="st-fat" ${s.fatigueRule ? "checked" : ""}> Si énergie ou état nerveux ≤ 2/5, garder 1 rep de réserve en plus</label>
  </div>
  <h4>Nom de l'appli et PDF</h4>
  <div class="form">
    <label for="st-app">Nom de l'appli</label><input class="field" id="st-app" value="${esc(s.appName)}">
    <label for="st-brand">Titre de couverture du PDF</label><input class="field" id="st-brand" value="${esc(s.brand)}">
    <label for="st-coach">Signature (bas de page)</label><input class="field" id="st-coach" value="${esc(s.coach)}" placeholder="ex. Ton nom · Coaching">
    <label for="st-acc">Couleur du PDF</label><input type="color" id="st-acc" value="${esc(s.accent)}">
    <label for="st-rem">Remarque (couverture et séance 1)</label><textarea class="field" id="st-rem" rows="3">${esc(s.remarque)}</textarea>
  </div>
  <div class="bar"><div class="left"></div><div class="right"><button class="btn ghost" data-close="1" type="button">Annuler</button><button class="btn primary" id="st-save" type="button">Enregistrer</button></div></div>`, true);
  $("#st-save", m).onclick = async () => {
    const ns = clone(s);
    ns.calibTarget = num($("#st-cal", m).value) ?? 3;
    ns.phases = s.phases.map((p, i) => ({ until: num($(`#st-pu-${i}`, m).value) ?? 99, label: $(`#st-pl-${i}`, m).value || p.label, target: num($(`#st-pt-${i}`, m).value) ?? p.target }));
    ns.lastWeekFailure = $("#st-fail", m).checked;
    ns.fatigueRule = $("#st-fat", m).checked;
    ns.maxJump = num($("#st-max", m).value) ?? 8;
    $$("[data-u]", m).forEach((i) => { const v = num(i.value); if (v) ns.increments[i.dataset.u] = v; });
    ns.appName = $("#st-app", m).value.trim() || "Coach Hub";
    ns.brand = $("#st-brand", m).value || "PROGRAMME";
    ns.coach = $("#st-coach", m).value;
    ns.accent = $("#st-acc", m).value;
    ns.remarque = $("#st-rem", m).value;
    const { error } = await sb.from("settings").upsert({ id: 1, data: ns });
    if (error) { toast("Enregistrement impossible."); return; }
    store.settings = ns;
    applyAccent();
    closeModal();
    render();
    toast("Réglages enregistrés");
  };
}
