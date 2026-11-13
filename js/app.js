// Point d'entrée : accueil (choix de l'espace), connexion, puis espace coach ou client.
import { sb, configured, appUrl } from "./db.js";
import { $, esc, store, settings, applyAccent, closeModal, toast } from "./core.js";

const app = $("#app");

document.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(); });

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

const ICON_CLIENT = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6.5 8.5v7M17.5 8.5v7M3.5 10.5v3M20.5 10.5v3M6.5 12h11"/></svg>`;
const ICON_COACH = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7M8.5 18h4"/></svg>`;

function gate(inner) {
  const s = settings();
  app.innerHTML = `<div class="gate">
    <header class="gate-top"><img src="icons/icon-192.png" alt="" width="34" height="34"><span class="gate-name">${esc(s.appName.toUpperCase())}</span></header>
    <main class="gate-main">${inner}</main>
    <footer class="gate-foot"><span>Suivi d'entraînement personnalisé</span><a href="confidentialite.html">Confidentialité</a></footer>
  </div>`;
}

function setupScreen() {
  gate(`<div><p class="gate-kicker">Configuration</p><h1 class="gate-title">Presque prêt</h1>
    <p class="gate-sub">L'appli n'est pas encore reliée à sa base de données. Renseigne l'adresse et la clé publique de ton projet Supabase dans le fichier config.js.</p></div>`);
}

function choiceScreen() {
  gate(`<div><p class="gate-kicker">Bienvenue</p><h1 class="gate-title">Choisis ton espace</h1></div>
    <div class="spaces">
      <button class="space" type="button" data-space="client">${ICON_CLIENT}<span class="space-t">ESPACE CLIENT</span><span class="space-d">Tes séances de la semaine, tes performances et ton bilan.</span><span class="space-arrow" aria-hidden="true">→</span></button>
      <button class="space" type="button" data-space="coach">${ICON_COACH}<span class="space-t">ESPACE COACH</span><span class="space-d">Tes clients, leurs programmes, leurs bilans et la surcharge.</span><span class="space-arrow" aria-hidden="true">→</span></button>
    </div>`);
  app.querySelectorAll("[data-space]").forEach((b) => (b.onclick = () => loginScreen(b.dataset.space)));
}

function passwordField(id, label, autocomplete) {
  return `<label class="f" for="${id}"><span>${label}</span>
    <input id="${id}" type="password" class="has-eye" autocomplete="${autocomplete}" required>
    <button class="eye" type="button" data-eye="${id}" aria-label="Afficher le mot de passe">Afficher</button></label>`;
}
function wireEyes() {
  app.querySelectorAll("[data-eye]").forEach((b) => (b.onclick = () => {
    const i = document.getElementById(b.dataset.eye);
    const show = i.type === "password";
    i.type = show ? "text" : "password";
    b.textContent = show ? "Masquer" : "Afficher";
    b.setAttribute("aria-label", show ? "Masquer le mot de passe" : "Afficher le mot de passe");
  }));
}

async function loginScreen(space, msg) {
  space = space === "coach" ? "coach" : "client";
  let coachExists = true;
  if (space === "coach") {
    try { const { data } = await sb.rpc("coach_exists"); coachExists = data !== false; } catch (e) {}
  }
  gate(`<button class="gate-back" type="button" id="back">‹ Changer d'espace</button>
    <div><p class="gate-kicker">${space === "coach" ? "Espace coach" : "Espace client"}</p><h1 class="gate-title">Connexion</h1>
    ${space === "client" ? `<p class="gate-sub">Utilise l'e-mail et le mot de passe envoyés par ton coach.</p>` : ""}</div>
    <form id="login" class="gate-form" novalidate>
      <label class="f" for="li-email"><span>E-mail</span><input id="li-email" type="email" autocomplete="username" inputmode="email" required></label>
      ${passwordField("li-pass", "Mot de passe", "current-password")}
      <p class="gate-msg" id="li-err" role="alert">${msg ? esc(msg) : ""}</p>
      <div class="gate-actions">
        <button class="btn primary" type="submit">Se connecter</button>
        <button class="linkbtn" type="button" id="forgot">Mot de passe oublié ?</button>
      </div>
    </form>
    ${space === "coach" && !coachExists ? `<div class="gate-note"><b>Première utilisation ?</b> Crée ton compte coach : le premier compte créé devient automatiquement le compte coach.<br><br><button class="btn" id="mk-coach" type="button">Créer mon compte coach</button></div>` : ""}`);
  wireEyes();
  $("#back").onclick = choiceScreen;
  $("#login").onsubmit = async (e) => {
    e.preventDefault();
    const email = $("#li-email").value.trim(), password = $("#li-pass").value;
    const err = $("#li-err");
    err.className = "gate-msg";
    if (!email || !password) { err.textContent = "Renseigne ton e-mail et ton mot de passe."; return; }
    const btn = $("#login button[type=submit]");
    btn.disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email, password });
    btn.disabled = false;
    if (error) err.textContent = /confirm/i.test(error.message) ? "Ton e-mail n'est pas encore confirmé : ouvre le lien reçu par e-mail." : "E-mail ou mot de passe incorrect.";
  };
  $("#forgot").onclick = async () => {
    const email = $("#li-email").value.trim();
    const err = $("#li-err");
    if (!email) { err.className = "gate-msg"; err.textContent = "Écris ton e-mail ci-dessus, puis clique à nouveau sur « Mot de passe oublié »."; return; }
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: appUrl() });
    err.className = error ? "gate-msg" : "gate-msg ok";
    err.textContent = error ? "Envoi impossible pour le moment, réessaie plus tard." : "Si ce compte existe, un e-mail de réinitialisation vient d'être envoyé.";
  };
  const mk = $("#mk-coach");
  if (mk) mk.onclick = coachSignupScreen;
  setTimeout(() => { const i = $("#li-email"); if (i && window.matchMedia("(min-width: 760px)").matches) i.focus(); }, 50);
}

function coachSignupScreen() {
  gate(`<button class="gate-back" type="button" id="back">‹ Retour</button>
    <div><p class="gate-kicker">Espace coach</p><h1 class="gate-title">Créer ton compte</h1>
    <p class="gate-sub">Ce compte te donnera accès à l'espace coach.</p></div>
    <form id="su" class="gate-form" novalidate>
      <label class="f" for="su-email"><span>Ton e-mail</span><input id="su-email" type="email" autocomplete="username" required></label>
      ${passwordField("su-pass", "Mot de passe · 8 caractères minimum", "new-password")}
      <p class="gate-msg" id="su-err" role="alert"></p>
      <div class="gate-actions"><button class="btn primary" type="submit">Créer mon compte coach</button></div>
    </form>`);
  wireEyes();
  $("#back").onclick = () => loginScreen("coach");
  $("#su").onsubmit = async (e) => {
    e.preventDefault();
    const email = $("#su-email").value.trim(), password = $("#su-pass").value;
    const err = $("#su-err");
    err.className = "gate-msg";
    if (password.length < 8) { err.textContent = "Le mot de passe doit faire au moins 8 caractères."; return; }
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) { err.textContent = "Création impossible : " + error.message; return; }
    if (!data.session) { err.className = "gate-msg ok"; err.textContent = "Compte créé. Confirme ton e-mail avec le lien reçu, puis connecte-toi."; }
  };
}

function newPasswordScreen() {
  gate(`<div><p class="gate-kicker">Mot de passe oublié</p><h1 class="gate-title">Nouveau mot de passe</h1></div>
    <form id="np" class="gate-form" novalidate>
      ${passwordField("np-pass", "Nouveau mot de passe · 8 caractères minimum", "new-password")}
      <p class="gate-msg" id="np-err" role="alert"></p>
      <div class="gate-actions"><button class="btn primary" type="submit">Enregistrer</button></div>
    </form>`);
  wireEyes();
  $("#np").onsubmit = async (e) => {
    e.preventDefault();
    const password = $("#np-pass").value;
    if (password.length < 8) { $("#np-err").textContent = "Au moins 8 caractères."; return; }
    const { error } = await sb.auth.updateUser({ password });
    if (error) { $("#np-err").textContent = "Impossible d'enregistrer : " + error.message; return; }
    toast("Mot de passe modifié");
    recovering = false;
    history.replaceState(null, "", location.pathname);
    route(true);
  };
}

async function loadShared() {
  const [{ data: st }, { data: imgs }] = await Promise.all([
    sb.from("settings").select("data").eq("id", 1).maybeSingle(),
    sb.from("images").select("id,name,data"),
  ]);
  store.settings = st ? st.data : null;
  store.images = Object.fromEntries((imgs || []).map((i) => [i.id, i]));
  applyAccent();
}

let current = null;
let recovering = false;
async function route(force) {
  if (recovering) return newPasswordScreen();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { current = null; return choiceScreen(); }
  if (current === session.user.id && !force) return;
  current = session.user.id;
  app.innerHTML = `<div class="loading"><span class="spin"></span> Chargement…</div>`;
  try {
    await loadShared();
    const { data: coach } = await sb.from("coaches").select("user_id").eq("user_id", session.user.id).maybeSingle();
    if (coach) {
      const m = await import("./coach.js");
      return m.startCoach(app, session);
    }
    const { data: client } = await sb.from("clients").select("*").eq("user_id", session.user.id).maybeSingle();
    if (client) {
      const m = await import("./client.js");
      return m.startClient(app, session, client);
    }
    gate(`<div><p class="gate-kicker">Compte</p><h1 class="gate-title">Pas encore de programme</h1>
      <p class="gate-sub">Ton compte n'est relié à aucun programme pour l'instant. Contacte ton coach pour qu'il vérifie l'e-mail utilisé.</p></div>
      <div class="gate-actions"><button class="btn" id="lo" type="button">Se déconnecter</button></div>`);
    $("#lo").onclick = () => sb.auth.signOut();
  } catch (e) {
    console.error(e);
    current = null;
    gate(`<div><p class="gate-kicker">Connexion</p><h1 class="gate-title">Serveur injoignable</h1>
      <p class="gate-sub">Vérifie ta connexion internet puis réessaie.</p></div>
      <div class="gate-actions"><button class="btn primary" id="retry" type="button">Réessayer</button></div>`);
    $("#retry").onclick = () => route(true);
  }
}

if (!configured) setupScreen();
else {
  sb.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") { recovering = true; newPasswordScreen(); return; }
    if (event === "USER_UPDATED" && recovering) { recovering = false; }
    if (event === "SIGNED_OUT") { if (current) { location.replace(location.pathname); return; } choiceScreen(); return; }
    if (event === "SIGNED_IN" || event === "INITIAL_SESSION") setTimeout(() => route(), 0);
  });
}
