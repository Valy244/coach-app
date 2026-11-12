// Point d'entrée : connexion, choix de l'espace (coach ou client).
import { sb, configured, appUrl } from "./db.js";
import { $, esc, store, settings, applyAccent, closeModal, toast } from "./core.js";

const app = $("#app");

document.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(); });

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

function shell(inner) {
  const s = settings();
  return `<div class="auth"><div class="auth-card">
    <div class="auth-logo"><img src="icons/icon-192.png" alt="" width="64" height="64"><h1>${esc(s.appName)}</h1></div>
    ${inner}</div></div>`;
}

function setupScreen() {
  app.innerHTML = shell(`<p>L'appli n'est pas encore reliée à sa base de données.</p>
    <p class="hint">Renseigne l'adresse et la clé publique de ton projet Supabase dans le fichier <code>config.js</code>, comme expliqué dans le guide d'installation.</p>`);
}

async function loginScreen(msg) {
  let coachExists = true;
  try { const { data } = await sb.rpc("coach_exists"); coachExists = data !== false; } catch (e) {}
  app.innerHTML = shell(`
    <form id="login" class="auth-form" novalidate>
      <label for="li-email">E-mail</label>
      <input id="li-email" type="email" autocomplete="username" inputmode="email" required>
      <label for="li-pass">Mot de passe</label>
      <input id="li-pass" type="password" autocomplete="current-password" required>
      <div id="li-err" class="err" role="alert">${msg ? esc(msg) : ""}</div>
      <button class="btn primary big" type="submit">Se connecter</button>
      <button class="btn ghost" type="button" id="forgot">Mot de passe oublié ?</button>
    </form>
    <a class="hint" style="text-align:center" href="confidentialite.html">Confidentialité et données personnelles</a>
    ${coachExists ? "" : `<div class="first-run"><p><b>Première utilisation ?</b> Crée d'abord ton compte coach. Le premier compte créé devient automatiquement le compte coach.</p><button class="btn" id="mk-coach" type="button">Créer mon compte coach</button></div>`}`);
  $("#login").onsubmit = async (e) => {
    e.preventDefault();
    const email = $("#li-email").value.trim(), password = $("#li-pass").value;
    if (!email || !password) { $("#li-err").textContent = "Renseigne ton e-mail et ton mot de passe."; return; }
    const btn = e.submitter; btn.disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email, password });
    btn.disabled = false;
    if (error) $("#li-err").textContent = /confirm/i.test(error.message) ? "Ton e-mail n'est pas encore confirmé : ouvre le lien reçu par e-mail." : "E-mail ou mot de passe incorrect.";
  };
  $("#forgot").onclick = async () => {
    const email = $("#li-email").value.trim();
    if (!email) { $("#li-err").textContent = "Écris ton e-mail ci-dessus, puis clique à nouveau sur « Mot de passe oublié »."; return; }
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: appUrl() });
    $("#li-err").textContent = error ? "Envoi impossible pour le moment, réessaie plus tard." : "Si ce compte existe, un e-mail de réinitialisation vient d'être envoyé.";
  };
  const mk = $("#mk-coach");
  if (mk) mk.onclick = coachSignupScreen;
}

function coachSignupScreen() {
  app.innerHTML = shell(`<form id="su" class="auth-form" novalidate>
    <p class="hint">Ce compte te donnera accès à l'espace coach.</p>
    <label for="su-email">Ton e-mail</label><input id="su-email" type="email" autocomplete="username" required>
    <label for="su-pass">Mot de passe (8 caractères minimum)</label><input id="su-pass" type="password" autocomplete="new-password" minlength="8" required>
    <div id="su-err" class="err" role="alert"></div>
    <button class="btn primary big" type="submit">Créer mon compte coach</button>
    <button class="btn ghost" type="button" id="su-back">Retour</button></form>`);
  $("#su-back").onclick = () => loginScreen();
  $("#su").onsubmit = async (e) => {
    e.preventDefault();
    const email = $("#su-email").value.trim(), password = $("#su-pass").value;
    if (password.length < 8) { $("#su-err").textContent = "Le mot de passe doit faire au moins 8 caractères."; return; }
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) { $("#su-err").textContent = "Création impossible : " + error.message; return; }
    if (!data.session) $("#su-err").textContent = "Compte créé. Confirme ton e-mail avec le lien reçu, puis connecte-toi.";
  };
}

function newPasswordScreen() {
  app.innerHTML = shell(`<form id="np" class="auth-form" novalidate>
    <label for="np-pass">Nouveau mot de passe (8 caractères minimum)</label><input id="np-pass" type="password" autocomplete="new-password" minlength="8" required>
    <div id="np-err" class="err" role="alert"></div>
    <button class="btn primary big" type="submit">Enregistrer</button></form>`);
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
  if (!session) { current = null; return loginScreen(); }
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
    app.innerHTML = shell(`<p>Ton compte n'est relié à aucun programme pour l'instant.</p><p class="hint">Contacte ton coach pour qu'il vérifie l'e-mail utilisé.</p><button class="btn" id="lo" type="button">Se déconnecter</button>`);
    $("#lo").onclick = () => sb.auth.signOut();
  } catch (e) {
    console.error(e);
    current = null;
    app.innerHTML = shell(`<p>Impossible de joindre le serveur.</p><p class="hint">Vérifie ta connexion internet puis réessaie.</p><button class="btn primary" id="retry" type="button">Réessayer</button>`);
    $("#retry").onclick = () => route(true);
  }
}

if (!configured) setupScreen();
else {
  sb.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") { recovering = true; newPasswordScreen(); return; }
    if (event === "USER_UPDATED" && recovering) { recovering = false; }
    if (event === "SIGNED_OUT") { if (current) { location.replace(location.pathname); return; } loginScreen(); return; }
    if (event === "SIGNED_IN" || event === "INITIAL_SESSION") setTimeout(() => route(), 0);
  });
}
