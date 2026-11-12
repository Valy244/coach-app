// Génération du PDF de la semaine, dans le style du programme Canva.
import { esc, settings, phaseFor, phaseSentence, weekLabel, groupLines, imgSrc, openModal, $ } from "./core.js";

const LIBS = [
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
];
function loadScript(src) {
  return new Promise((res, rej) => {
    if ([...document.scripts].some((s) => s.src === src)) return res();
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

function mixWhite(hex, t) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#b9c3f7";
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * t));
  return "#" + ch.map((v) => v.toString(16).padStart(2, "0")).join("");
}
function bandSVG(color) {
  let shapes = "";
  for (let i = -1; i < 26; i++) {
    const x = i * 34;
    shapes += i % 2
      ? `<path d="M${x} 46 A30 30 0 0 1 ${x + 30} 16" fill="none" stroke="${color}" stroke-width="12"/>`
      : `<path d="M${x + 6} 0 L${x + 22} 0 L${x + 4} 30 L${x - 12} 30 Z" fill="${color}"/>`;
  }
  return `<svg class="band" viewBox="0 0 794 46" preserveAspectRatio="none" width="794" height="46">${shapes}</svg>`;
}
function dumbbell(color) {
  return `<svg width="54" height="40" viewBox="0 0 54 40"><g transform="rotate(-35 27 20)"><rect x="4" y="13" width="7" height="14" rx="2" fill="#2b2b33"/><rect x="11" y="9" width="7" height="22" rx="2" fill="${color}"/><rect x="18" y="18" width="18" height="4" fill="#2b2b33"/><rect x="36" y="9" width="7" height="22" rx="2" fill="${color}"/><rect x="43" y="13" width="7" height="14" rx="2" fill="#2b2b33"/></g></svg>`;
}

export function pdfPages(w, c) {
  const s = settings();
  const ph = phaseFor(w.num, c.weeks_total);
  const acc = /^#[0-9a-f]{6}$/i.test(s.accent) ? s.accent : "#4a63f0";
  const foot = `<div class="foot">${esc(s.coach || "")}${s.coach ? " · " : ""}${esc(c.name)} · Cycle ${esc(w.cycle)} · ${esc(weekLabel(w.num))}</div>`;
  const wrap = (inner) => `<div class="pg" style="--pa:${acc};--pl:${mixWhite(acc, 0.5)}">${bandSVG(acc)}<div class="inner">${inner}</div>${foot}<div class="band bot">${bandSVG(acc)}</div></div>`;
  const cover = wrap(`<div class="cover-title">${dumbbell(acc)}<h1>${esc(s.brand || "PROGRAMME")}</h1>${dumbbell(acc)}</div>
    <div class="who">${esc(c.name)}</div><div class="cyc">Cycle ${esc(w.cycle)} · ${esc(weekLabel(w.num))}</div>
    <div class="plan-h">PLANNING</div>
    <div class="plan">${w.seances.map((se, i) => `<div><u>Séance ${i + 1}</u> : ${esc(se.title)}</div>`).join("")}</div>
    <div class="goalbox"><b>OBJECTIF DE LA SEMAINE : ${esc(ph.label.toUpperCase())}</b>${esc(phaseSentence(ph))}</div>
    ${s.remarque ? `<div class="rem"><u>Remarque</u> : ${esc(s.remarque)}</div>` : ""}
    <div class="rem" style="margin-top:12px;font-size:15px"><u>Ton suivi</u> : note tes charges, tes répétitions et ton RIR directement dans l'appli après chaque série, puis envoie ton bilan en fin de semaine.</div>`);
  const pages = w.seances.map((se, si) => wrap(`<h1 class="pt">Séance ${si + 1} : ${esc(se.title)}</h1>
    ${se.warmup ? `<div class="warm">Échauffement : ${esc(se.warmup)}</div>` : ""}
    <div class="goal">Objectif ${esc(ph.label)}</div>
    <div class="exs">${se.exercises.map((ex, ei) => {
      const img = imgSrc(ex.img);
      return `<div class="pex"><div class="pimg ${img ? "" : "none"}" style="${img ? `background-image:url('${img}')` : ""}"></div><div><div class="elbl">Exercice ${ei + 1}${ex.rest ? " - " + esc(ex.rest) + " de repos" : ""}</div><div class="ename">${esc(ex.name)}</div>${groupLines(ex).map((l) => `<div class="eline">${esc(l)}</div>`).join("")}</div></div>`;
    }).join("")}</div>`));
  return [cover, ...pages];
}

export async function makePdf(w, c) {
  openModal(`<h3>PDF · ${esc(c.name)} · ${esc(weekLabel(w.num))}</h3>
    <div id="pdf-st" class="hint" style="display:flex;gap:8px;align-items:center"><span class="spin"></span> Mise en page…</div>
    <div class="pages" id="pdf-pages"></div>
    <div class="bar"><div class="left"><span id="pdf-msg" class="hint"></span></div><div class="right"><button class="btn ghost" data-close="1" type="button">Fermer</button><a class="btn primary disabled" id="pdf-dl" aria-disabled="true">Télécharger le PDF</a></div></div>`, true);
  try {
    for (const l of LIBS) await loadScript(l);
    await document.fonts.ready;
    const stage = $("#pdf-stage");
    stage.innerHTML = pdfPages(w, c).join("");
    const pages = [...stage.querySelectorAll(".pg")];
    pages.forEach((pg) => {
      const inner = pg.querySelector(".inner");
      let fs = 1;
      while (inner.scrollHeight > inner.clientHeight + 2 && fs > 0.62) { fs -= 0.04; pg.style.setProperty("--fs", fs.toFixed(2)); }
    });
    const imgs = [...stage.querySelectorAll(".pimg")].map((d) => d.style.backgroundImage.match(/url\("?(.*?)"?\)/)?.[1]).filter(Boolean);
    await Promise.all(imgs.map((src) => new Promise((r) => { const i = new Image(); i.onload = r; i.onerror = r; i.src = src; })));
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const box = $("#pdf-pages");
    for (let i = 0; i < pages.length; i++) {
      const st = $("#pdf-st");
      if (st) st.innerHTML = `<span class="spin"></span> Page ${i + 1} / ${pages.length}…`;
      const cv = await window.html2canvas(pages[i], { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
      const data = cv.toDataURL("image/jpeg", 0.9);
      if (i) pdf.addPage();
      pdf.addImage(data, "JPEG", 0, 0, 210, 297);
      if (box) { const im = new Image(); im.src = data; im.alt = `Page ${i + 1}`; box.appendChild(im); }
    }
    stage.innerHTML = "";
    const blob = pdf.output("blob");
    const fname = `Cycle_${w.cycle}_${w.num === 0 ? "Calibration" : "Semaine_" + w.num}_${c.name.replace(/[^\p{L}\p{N}]+/gu, "_")}.pdf`;
    const st = $("#pdf-st");
    if (st) st.textContent = `${pages.length} pages prêtes.`;
    const dl = $("#pdf-dl");
    if (dl) {
      dl.href = URL.createObjectURL(blob);
      dl.download = fname;
      dl.classList.remove("disabled");
      dl.removeAttribute("aria-disabled");
    }
  } catch (e) {
    console.error(e);
    const st = $("#pdf-st");
    if (st) st.textContent = "La génération a échoué. Vérifie ta connexion et réessaie.";
  }
}
