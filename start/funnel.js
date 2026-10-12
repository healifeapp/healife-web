// Healife web funnel — tek sayfa, adım adım akış.
// Cevap kimlikleri uygulamadaki onboarding ile birebir aynı
// (lib/data/questions_repository.dart), backend'e olduğu gibi gidebilir.
//
// İlke: ekrandaki her rakam ya kullanıcının kendi cevabından hesaplanır
// ya da üründen gelen gerçek bir sayıdır. Sahte yorum, uydurma istatistik
// ve geri sayım sayacı yok.

import { CONFIG } from "./config.js";
import {
  dailyTargets,
  trainingLevel,
  healthyRange,
  bmiInfo,
  projection,
  mainGoal,
  goalCanon,
  toOnboardingData,
  storage,
  track,
  signIn,
  createCheckout,
  wait,
} from "./services.js";

/* ============================================================ ikonlar */

const I = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  flame:
    '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1.2-3.6 2.4-4.6.2 1.6 1 2.6 2.1 2.9C10.6 9 11 6 12 3z"/>',
  muscle:
    '<path d="M4 15c2-6 5-9 8-9 1.6 0 2.5 1.2 2 2.6-.4 1-1.6 1.4-2.6 1l-1.4 2.6c2.6-1 6.4-.4 8 2.8 1 2-.6 4-3 4H8c-2.4 0-4.4-1.2-4-4z"/>',
  target:
    '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6" fill="currentColor"/>',
  bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  male: '<circle cx="10" cy="14" r="5"/><path d="M14 10l6-6M15 4h5v5"/>',
  female: '<circle cx="12" cy="9" r="5"/><path d="M12 14v7M9 18h6"/>',
  home: '<path d="M4 11l8-6 8 6v9H4z"/><path d="M10 20v-5h4v5"/>',
  gym: '<path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12"/>',
  both: '<path d="M4 12h16M12 4v16"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  shield: '<path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
  cancel: '<circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6M15 9l-6 6"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  login: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l4-4-4-4M14 12H4"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
  chev: '<path d="M6 9l6 6 6-6"/>',
  apple:
    '<path fill="currentColor" stroke="none" d="M16.37 1.43c0 1.14-.42 2.2-1.12 3.02-.85.99-2.24 1.76-3.37 1.67-.14-1.1.4-2.27 1.06-3 .75-.85 2.06-1.5 3.43-1.69zM20.99 17.1c-.55 1.28-.82 1.85-1.53 2.98-.99 1.58-2.39 3.54-4.12 3.55-1.54.02-1.93-1-4.02-.99-2.09.01-2.52 1.01-4.06.99-1.73-.01-3.05-1.78-4.04-3.35C.5 15.86-.02 10.7 1.7 8.02c1.22-1.9 3.15-3.02 4.96-3.02 1.84 0 3 1.01 4.52 1.01 1.48 0 2.38-1.01 4.51-1.01 1.61 0 3.32.88 4.54 2.39-3.99 2.19-3.34 7.89 1.76 9.71z"/>',
  google:
    '<path fill="#4285F4" stroke="none" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" stroke="none" d="M12 23c3 0 5.5-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" stroke="none" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8l3.6-2.8z"/><path fill="#EA4335" stroke="none" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.2 7.1l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4z"/>',
  play:
    '<path fill="#00d4ff" stroke="none" d="M3.6 1.8c-.4.4-.6.9-.6 1.6v17.2c0 .7.2 1.2.6 1.6l.1.1 9.6-9.6v-.2L3.7 1.7l-.1.1z"/><path fill="#ffd400" stroke="none" d="M16.5 15.9l-3.2-3.2v-.2l3.2-3.2.1.1 3.8 2.2c1.1.6 1.1 1.6 0 2.2l-3.9 2.1z"/><path fill="#ff3a44" stroke="none" d="M16.6 15.8l-3.3-3.3-9.7 9.7c.4.4 1 .4 1.7.1l11.3-6.5"/><path fill="#00c853" stroke="none" d="M16.6 8.2L5.3 1.8c-.7-.4-1.3-.3-1.7.1l9.7 9.7 3.3-3.4z"/>',
};
const icon = (name, cls = "") =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name]}</svg>`;

/* ============================================================ adımlar */

const GOAL_ICONS = { yag_yakma: "flame", kas_kazanma: "muscle", forma: "target", guclenme: "bolt", saglik: "heart" };
const GOAL_LABEL = {
  yag_yakma: "Yağ yakmak",
  kas_kazanma: "Kas kazanmak",
  forma: "Forma girmek",
  guclenme: "Güçlenmek",
  saglik: "Sağlıklı yaşamak",
};

// İlerleme çubuğu bu üç bölüme ayrılır; her soru bir bölüme aittir.
const SECTIONS = [
  ["profil", "Profil"],
  ["antrenman", "Antrenman"],
  ["beslenme", "Beslenme"],
];

// Hedef kilo, ana hedef seçilmeden önce de sayılır: sayaç "1/13"ten
// "2/14"e zıplamasın diye. Hedef "forma/sağlık" çıkarsa adım düşer.
const needsTarget = (a) => !a.goal?.length || ["lose_weight", "build_muscle"].includes(goalCanon(a));

const STEPS = [
  { id: "intro", kind: "intro", chrome: false },
  {
    id: "gender",
    sec: "profil",
    kind: "gender",
    q: "Cinsiyetin nedir?",
    hint: "Kalori ihtiyacın cinsiyete göre farklı hesaplanır.",
    options: [
      ["erkek", "Erkek", "male"],
      ["kadin", "Kadın", "female"],
    ],
    extra: ["belirtmek_istemiyorum", "Belirtmek istemiyorum"],
  },
  {
    id: "goal",
    sec: "profil",
    kind: "multi",
    max: 3,
    ordered: true,
    q: "Temel hedefin ne?",
    hint: "En fazla 3 tane seçebilirsin — ilk seçtiğin ana hedefin olur.",
    options: Object.entries(GOAL_LABEL).map(([k, v]) => [k, k === "saglik" ? "Daha sağlıklı yaşamak" : v]),
    icons: GOAL_ICONS,
  },
  {
    id: "focus_areas",
    sec: "profil",
    kind: "multi",
    q: "Hangi bölgelere odaklanmak istersin?",
    hint: "Birden fazla seçebilirsin.",
    layout: "chips",
    options: [
      ["karin", "Karın"],
      ["gogus", "Göğüs"],
      ["omuz", "Omuz"],
      ["sirt", "Sırt"],
      ["kol", "Kol"],
      ["kalca", "Kalça"],
      ["bacak", "Bacak"],
      ["genel", "Genel gelişim"],
    ],
  },
  { id: "info_start", sec: "profil", kind: "info" },
  { id: "age", sec: "profil", kind: "number", q: "Kaç yaşındasın?", unit: "yaş", min: 16, max: 80, step: 1, def: () => 28 },
  {
    id: "height",
    sec: "profil",
    kind: "number",
    q: "Boyun kaç?",
    unit: "cm",
    min: 140,
    max: 215,
    step: 1,
    def: (a) => (a.gender === "erkek" ? 177 : 164),
  },
  {
    id: "weight",
    sec: "profil",
    kind: "number",
    q: "Kilon kaç?",
    unit: "kg",
    min: 40,
    max: 180,
    step: 0.5,
    def: (a) => (a.gender === "erkek" ? 80 : 65),
  },
  { id: "bmi", sec: "profil", kind: "bmi" },
  {
    id: "target_weight",
    sec: "profil",
    kind: "number",
    q: "Hedef kilon kaç?",
    hint: "Hedefe ne zaman ulaşacağını hesaplayalım.",
    unit: "kg",
    min: 40,
    max: 180,
    step: 0.5,
    when: needsTarget,
    def: (a) => (goalCanon(a) === "lose_weight" ? Math.max(45, a.weight - 5) : a.weight + 4),
  },
  { id: "pace", sec: "profil", kind: "pace", when: (a) => needsTarget(a) && !!projection(a) },
  {
    id: "experience",
    sec: "antrenman",
    kind: "single",
    q: "Egzersiz deneyimin nedir?",
    options: [
      ["ilk_kez", "İlk kez başlıyorum"],
      ["ara_sira", "Ara sıra spor yapıyorum"],
      ["duzenli", "Düzenli spor yapıyorum"],
      ["ileri", "İleri seviye"],
    ],
  },
  {
    id: "performance",
    sec: "antrenman",
    kind: "performance",
    q: "Fiziksel performansın nasıl?",
    hint: "Seviyeni doğru belirlememize yardım eder. Bilmiyorsan geçebilirsin.",
  },
  {
    id: "activity_level",
    sec: "antrenman",
    kind: "single",
    q: "Günlük aktivite seviyen nasıl?",
    options: [
      ["oturan", "Çoğunlukla oturuyorum", "Masa başı iş, az yürüyüş"],
      ["hafif", "Hafif aktifim", "Günde biraz yürüyüş"],
      ["aktif", "Aktifim", "Gün boyu ayaktayım"],
      ["cok_aktif", "Çok aktifim", "Fiziksel iş veya yoğun spor"],
    ],
  },
  {
    id: "weekly_days",
    sec: "antrenman",
    kind: "single",
    q: "Haftada kaç gün antrenman yapabilirsin?",
    options: [
      ["d1_2", "1–2 gün"],
      ["d3_4", "3–4 gün"],
      ["d5_6", "5–6 gün"],
      ["hergun", "Her gün"],
    ],
  },
  {
    id: "workout_location",
    sec: "antrenman",
    kind: "single",
    q: "Nerede antrenman yapacaksın?",
    options: [
      ["ev", "Evde", "Ekipmansız veya basit ekipmanla", "home"],
      ["salon", "Spor salonunda", "Makineler ve serbest ağırlık", "gym"],
      ["ikisi", "Her ikisinde de", "Haftaya göre değişir", "both"],
    ],
  },
  {
    id: "diet_preference",
    sec: "beslenme",
    kind: "single",
    q: "Beslenme tercihin nedir?",
    options: [
      ["standart", "Standart", "Her şeyi yerim"],
      ["vejetaryen", "Vejetaryen", "Et yok, süt ve yumurta var"],
      ["vegan", "Vegan", "Hayvansal ürün yok"],
      ["pesketaryen", "Pesketaryen", "Et yok, balık var"],
    ],
  },
  {
    id: "allergies",
    sec: "beslenme",
    kind: "multi",
    q: "Besin alerjin var mı?",
    hint: "Varsa öğünlerinden çıkaracağız.",
    layout: "chips",
    none: "none",
    def: ["none"],
    options: [
      ["none", "Yok"],
      ["gluten", "Gluten"],
      ["sut", "Süt ürünleri"],
      ["yumurta", "Yumurta"],
      ["kuruyemis", "Kuruyemiş"],
      ["deniz", "Deniz ürünleri"],
      ["soya", "Soya"],
    ],
  },
  { id: "name", sec: "beslenme", kind: "name", q: "Son olarak, sana nasıl hitap edelim?" },
  { id: "loading", kind: "loading", chrome: false },
  { id: "email", kind: "email", chrome: "minimal" },
  { id: "result", kind: "result", chrome: "minimal", wide: true },
  { id: "paywall", kind: "paywall", chrome: "minimal", wide: true },
  { id: "account", kind: "account", chrome: "minimal" },
  { id: "checkout", kind: "checkout", chrome: "minimal" },
  { id: "success", kind: "success", chrome: false },
];

const QUESTION_KINDS = new Set(["gender", "multi", "single", "number", "performance", "name"]);

/* ============================================================ durum */

const fresh = () => ({
  step: "intro",
  answers: {},
  email: "",
  marketing: false,
  planId: null,
  user: null,
  paid: false,
});
let S = Object.assign(fresh(), storage.load() || {});
if (S.paid) S.step = "success";
let dir = "fwd";

const save = () => storage.save(S);
const stepById = (id) => STEPS.find((s) => s.id === id);
const visible = () => STEPS.filter((s) => !s.when || s.when(S.answers));
const firstName = () => (S.answers.name || "").trim().split(/\s+/)[0] || "";
const withName = (text, alt) => (firstName() ? `${firstName()}, ${text}` : alt);

function next() {
  const list = visible();
  const i = list.findIndex((s) => s.id === S.step);
  go(list[Math.min(i + 1, list.length - 1)].id);
}

function go(id, { replace = false } = {}) {
  dir = "fwd";
  S.step = id;
  save();
  const url = `#${id}`;
  if (replace) history.replaceState({ step: id }, "", url);
  else history.pushState({ step: id }, "", url);
  render();
}

// Geri tuşu bir önceki adıma döner. Ödemeden sonra geri gitmek anlamsız;
// yükleme ekranına dönülürse animasyon yerine son soruya geçilir.
function restore(id) {
  if (S.paid) return go("success", { replace: true });
  if (id === "loading") id = "name";
  if (!stepById(id)) id = "intro";
  dir = "back";
  S.step = id;
  save();
  render();
}
window.addEventListener("popstate", (e) => restore(e.state?.step || location.hash.slice(1)));
// Adres çubuğuna elle #adım yazılırsa (aynı belge, popstate state'siz gelir)
window.addEventListener("hashchange", () => {
  const id = location.hash.slice(1);
  if (id && id !== S.step) restore(id);
});

/* ============================================================ çizim */

const app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const fmt = (n, d = 0) =>
  Number(n).toLocaleString("tr-TR", { maximumFractionDigits: d, minimumFractionDigits: d });
const money = (n) => `${fmt(n, n % 1 ? 2 : 0)} ${CONFIG.currency}`;
const dateLong = (d) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });

const NEEDS_ANSWERS = new Set(["bmi", "pace", "result", "paywall", "account", "checkout"]);

function progress(step) {
  const qs = visible().filter((s) => s.sec);
  return SECTIONS.map(([key, label]) => {
    const inSec = qs.filter((s) => s.sec === key);
    const idx = inSec.findIndex((s) => s.id === step.id);
    const secIdx = SECTIONS.findIndex(([k]) => k === key);
    const curIdx = SECTIONS.findIndex(([k]) => k === step.sec);
    const fill = secIdx < curIdx ? 1 : secIdx > curIdx ? 0 : (idx + 1) / inSec.length;
    return `<div class="seg${secIdx === curIdx ? " is-cur" : ""}${fill === 1 && secIdx < curIdx ? " is-done" : ""}">
      <span class="seg__label">${label}</span><span class="seg__bar"><i style="width:${fill * 100}%"></i></span>
    </div>`;
  }).join("");
}

function render({ quiet = false } = {}) {
  const step = stepById(S.step) || STEPS[0];
  if (step.when && !step.when(S.answers)) return dir === "back" ? history.back() : next();
  // Doğrudan #result gibi bir adrese cevapsız gelinirse başa dön.
  if (NEEDS_ANSWERS.has(step.id) && !dailyTargets(S.answers)) return go("intro", { replace: true });

  const qs = visible().filter((s) => QUESTION_KINDS.has(s.kind));
  const qi = qs.findIndex((s) => s.id === step.id);

  const chrome =
    step.chrome === false
      ? ""
      : `<header class="top">
          <div class="top__row">
            <button class="top__back" type="button" aria-label="Geri" data-back>${icon("back")}</button>
            <img class="top__logo" src="/assets/brand/logo.svg?v=20260830b" alt="Healife" width="112" height="21" />
            <span class="top__count">${qi >= 0 ? `<span class="sr">Soru </span>${qi + 1}/${qs.length}` : ""}</span>
          </div>
          ${step.sec ? `<div class="segs" aria-hidden="true">${progress(step)}</div>` : ""}
        </header>`;

  app.className = `funnel funnel--${step.kind}${step.wide ? " funnel--wide" : ""}`;
  app.innerHTML = `${chrome}<main class="stage" id="stage"><div class="stage__inner">${VIEWS[step.kind](step)}</div></main>`;

  app.querySelector("[data-back]")?.addEventListener("click", () => history.back());
  BIND[step.kind]?.(step);
  if (quiet) return;
  window.scrollTo(0, 0);
  app.querySelector(".stage__inner").classList.add(dir === "back" ? "enter-back" : "enter");
  document.title = step.q ? `${step.q} · Healife` : "Healife — Sana özel planını oluştur";
  track("step_view", { step: step.id });
}

const head = (step, q = step.q) =>
  `<h1 class="q">${esc(q)}</h1>${step.hint ? `<p class="hint">${esc(step.hint)}</p>` : ""}`;

const cta = (label, attrs = "") =>
  `<div class="dock"><button class="btn btn--primary btn--block" type="button" data-next ${attrs}>${label}</button></div>`;

/* ------------------------------------------------------------ görünümler */

const VIEWS = {
  intro: () => `
    <section class="intro">
      <img class="intro__logo" src="/assets/brand/logo.svg?v=20260830b" alt="Healife" width="132" height="25" />
      <div class="intro__media" aria-hidden="true">
        <picture>
          <source srcset="/assets/img/athlete-run.webp" type="image/webp" />
          <img src="/assets/img/athlete-run.png" alt="" fetchpriority="high" />
        </picture>
        <div class="float float--a"><b>${fmt(1850)}</b><span>kcal / gün</span></div>
        <div class="float float--b">${icon("check")}<span>Haftada 4 gün</span></div>
      </div>
      <div class="intro__copy">
        <span class="pill">${icon("spark")}2 dakikalık kişisel test</span>
        <h1 class="display">Sana özel antrenman ve beslenme planı.</h1>
        <p class="lead">Birkaç soruyu cevapla; kalori ihtiyacını, antrenman seviyeni ve haftalık programını hemen hesaplayalım.</p>
        <button class="btn btn--primary btn--xl" type="button" data-next>Teste başla</button>
        <ul class="intro__facts">
          <li><b>176</b>videolu egzersiz</li>
          <li><b>100+</b>tarif</li>
          <li><b>7/24</b>AI koç</li>
        </ul>
      </div>
    </section>`,

  gender: (step) => `
    ${head(step)}
    <div class="cards2">
      ${step.options
        .map(
          ([id, label, ic]) => `
        <button class="tile${S.answers.gender === id ? " is-on" : ""}" type="button" data-val="${id}">
          <span class="tile__ic">${icon(ic)}</span><span class="tile__label">${label}</span>
        </button>`,
        )
        .join("")}
    </div>
    <button class="link" type="button" data-val="${step.extra[0]}">${step.extra[1]}</button>`,

  single: (step) => `
    ${head(step)}
    <div class="opts">
      ${step.options
        .map(
          ([id, label, sub, ic]) => `
        <button class="opt${S.answers[step.id] === id ? " is-on" : ""}" type="button" data-val="${id}">
          ${ic ? `<span class="opt__ic">${icon(ic)}</span>` : ""}
          <span class="opt__txt"><b>${label}</b>${sub ? `<small>${sub}</small>` : ""}</span>
          <span class="opt__radio"></span>
        </button>`,
        )
        .join("")}
    </div>`,

  multi: (step) => {
    const sel = S.answers[step.id] ?? step.def ?? [];
    const chips = step.layout === "chips";
    return `
    ${head(step)}
    <div class="${chips ? "chips" : "opts"}">
      ${step.options
        .map(([id, label]) => {
          const idx = sel.indexOf(id);
          const on = idx >= 0;
          const ic = step.icons?.[id];
          return chips
            ? `<button class="chip${on ? " is-on" : ""}" type="button" data-val="${id}" aria-pressed="${on}">${on ? icon("check") : ""}${label}</button>`
            : `<button class="opt${on ? " is-on" : ""}" type="button" data-val="${id}" aria-pressed="${on}">
                ${ic ? `<span class="opt__ic">${icon(ic)}</span>` : ""}
                <span class="opt__txt"><b>${label}</b></span>
                ${step.ordered && idx === 0 && sel.length > 1 ? `<span class="badge">Ana hedef</span>` : ""}
                <span class="opt__box">${on ? icon("check") : ""}</span>
              </button>`;
        })
        .join("")}
    </div>
    ${cta("Devam", sel.length ? "" : "disabled")}`;
  },

  info: () => {
    const g = mainGoal(S.answers);
    const copy = {
      yag_yakma: "Yağ yakmanın anahtarı küçük ama sürdürülebilir bir kalori açığı ve kas kaybını önleyen kuvvet antrenmanı.",
      kas_kazanma: "Kas kazanmak için yeterli protein, kontrollü kalori fazlası ve her hafta biraz daha zorlayan bir program gerekir.",
      guclenme: "Güçlenmek için temel hareketlerde düzenli ilerleme ve yeterli toparlanma gerekir.",
      forma: "Forma girmek için kuvvet, kardiyo ve dengeli beslenmenin birlikte yürümesi gerekir.",
      saglik: "Sağlıklı bir yaşam; düzenli hareket, dengeli beslenme ve sürdürülebilir alışkanlıklarla başlar.",
    }[g];
    return `
    <section class="info">
      <span class="eyebrow">Hedef: ${GOAL_LABEL[g]}</span>
      <h1 class="q">Harika seçim. Planını bunun üzerine kuracağız.</h1>
      <p class="hint">${copy}</p>
      <div class="facts">
        <div class="fact"><b>176</b><span>egzersiz, hepsi videolu anlatımla</span></div>
        <div class="fact"><b>36</b><span>hedef ve seviyeye göre başlangıç programı</span></div>
        <div class="fact"><b>100+</b><span>tarif ve hazır beslenme menüsü</span></div>
      </div>
      <p class="hint" style="margin-top:1.25rem">Şimdi vücudunu biraz tanıyalım.</p>
    </section>
    ${cta("Devam")}`;
  },

  number: (step) => {
    const a = S.answers;
    const v = a[step.id] ?? step.def(a);
    return `
    ${head(step)}
    <div class="num">
      <div class="num__display">
        <button class="num__step" type="button" data-delta="-1" aria-label="Azalt">−</button>
        <label class="num__value">
          <input id="numInput" type="number" inputmode="decimal" min="${step.min}" max="${step.max}" step="${step.step}" value="${v}" aria-label="${esc(step.q)}" />
          <span>${step.unit}</span>
        </label>
        <button class="num__step" type="button" data-delta="1" aria-label="Arttır">+</button>
      </div>
      <input id="numRange" class="range" type="range" min="${step.min}" max="${step.max}" step="${step.step}" value="${v}" aria-hidden="true" tabindex="-1" />
      <div class="range__ends" aria-hidden="true"><span>${step.min}</span><span>${step.max}</span></div>
      <p class="num__note" id="numNote"></p>
    </div>
    ${cta("Devam")}`;
  },

  bmi: () => {
    const b = bmiInfo(S.answers.weight, S.answers.height);
    const pos = Math.min(100, Math.max(0, ((b.value - 15) / (40 - 15)) * 100));
    return `
    <section class="bmi">
      <span class="eyebrow">Vücut analizin</span>
      <h1 class="q">Vücut kitle indeksin</h1>
      <div class="card bmi__card">
        <div class="bmi__top">
          <div><div class="bmi__val">${fmt(b.value, 1)}</div><div class="bmi__cat" style="--c:${b.color}">${b.label}</div></div>
          <div class="bmi__range"><small>Sağlıklı kilo aralığın</small><b>${b.min}–${b.max} kg</b></div>
        </div>
        <div class="gauge"><div class="gauge__bar"></div><span class="gauge__pin" style="left:${pos}%"></span></div>
        <div class="gauge__lbl"><span>Zayıf</span><span>Normal</span><span>Fazla</span><span>Obez</span></div>
      </div>
      <p class="hint">${b.note}</p>
      <p class="fine">VKİ kas kütlesini ayırt etmez; sporcularda yüksek çıkabilir. Tıbbi bir değerlendirme değildir.</p>
    </section>
    ${cta("Devam")}`;
  },

  pace: () => {
    const p = projection(S.answers);
    const lose = p.to < p.from;
    const perWeek = Math.abs(p.to - p.from) / p.weeks;
    return `
    <section class="pace">
      <span class="eyebrow">Gerçekçi bir hedef</span>
      <h1 class="q">${fmt(Math.abs(p.to - p.from), 1)} kg ${lose ? "vermek" : "almak"} için tahmini tarih: <em>${dateLong(p.end)}</em></h1>
      <div class="card card--hero">${projectionChart(p)}</div>
      <ul class="ticks">
        <li>${icon("check")}<span>Haftada yaklaşık <b>${fmt(perWeek, 2)} kg</b> — ${lose ? "kas kaybetmeden yağ yakmaya uygun" : "yağlanmayı sınırlayan"} bir hız</span></li>
        <li>${icon("check")}<span>Planın ilerlemene göre her hafta güncellenir</span></li>
        <li>${icon("check")}<span>Hızlı diyetlerin aksine kalıcı olması hedeflenir</span></li>
      </ul>
      <p class="fine">Tahmindir; kişiden kişiye değişir.</p>
    </section>
    ${cta("Devam")}`;
  },

  performance: (step) => `
    ${head(step)}
    <div class="perf">
      ${[
        ["squats", "Squat", "Ağırlıksız, tek sette durmadan kaç tekrar?", "örn. 15"],
        ["pullups", "Barfiks", "Barda, tek sette kaç tekrar?", "örn. 5"],
      ]
        .map(
          ([k, t, d, ph]) => `
        <label class="field">
          <span class="field__t">${t}</span>
          <span class="field__d">${d}</span>
          <span class="field__in"><input type="number" inputmode="numeric" min="0" max="200" data-k="${k}" placeholder="${ph}" value="${S.answers[k] ?? ""}" /><em>tekrar</em></span>
        </label>`,
        )
        .join("")}
    </div>
    <div class="dock dock--2">
      <button class="btn btn--ghost" type="button" data-skip>Bilmiyorum</button>
      <button class="btn btn--primary" type="button" data-next>Devam</button>
    </div>`,

  name: (step) => `
    ${head(step)}
    <p class="hint">Planını sana özel hazırlarken adınla hitap edeceğiz.</p>
    <form id="nameForm" class="grow" novalidate>
      <label class="field--solo">
        <span class="sr">Adın</span>
        <input id="nameInput" type="text" autocomplete="given-name" autocapitalize="words" maxlength="40" placeholder="Adın" value="${esc(S.answers.name)}" />
      </label>
      <div class="dock dock--2">
        <button class="btn btn--ghost" type="button" data-skip>Geç</button>
        <button class="btn btn--primary" type="submit">Devam</button>
      </div>
    </form>`,

  loading: () => `
    <section class="loading">
      <div class="ring" style="--p:0"><svg viewBox="0 0 120 120"><circle class="ring__bg" cx="60" cy="60" r="52"/><circle class="ring__fg" cx="60" cy="60" r="52"/></svg><b id="ringPct">0%</b></div>
      <h1 class="q">${firstName() ? `${esc(firstName())}, planın hazırlanıyor` : "Planın hazırlanıyor"}</h1>
      <ul class="checks" id="checks">
        ${["Kalori ihtiyacın hesaplanıyor", "Antrenman seviyen belirleniyor", "Haftalık programın kuruluyor", "Beslenme menün hazırlanıyor"]
          .map((t) => `<li><span class="checks__dot">${icon("check")}</span>${t}</li>`)
          .join("")}
      </ul>
    </section>`,

  email: () => `
    <section class="email">
      <div class="badge-ok">${icon("check")}</div>
      <h1 class="q">${esc(withName("planın hazır!", "Planın hazır!"))}</h1>
      <p class="hint">Planını görmek için e-posta adresini gir. Hesabın ve planın bu adrese bağlanır.</p>
      <form id="emailForm" class="grow" novalidate>
        <label class="field--solo">
          <span class="sr">E-posta</span>
          <input id="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="ornek@eposta.com" value="${esc(S.email)}" required />
        </label>
        <button class="suggest" type="button" id="suggest" hidden></button>
        <p class="err" id="emailErr" hidden>Geçerli bir e-posta adresi gir.</p>
        <label class="consent">
          <input type="checkbox" id="marketing" ${S.marketing ? "checked" : ""} />
          <span>Kampanya ve ipuçlarını e-postayla almak istiyorum. <small>(isteğe bağlı)</small></span>
        </label>
        <p class="fine">${icon("lock")} Spam yok. Devam ederek <a href="${CONFIG.legal.terms}" target="_blank" rel="noopener">Kullanım Koşulları</a>'nı kabul etmiş ve <a href="${CONFIG.legal.privacy}" target="_blank" rel="noopener">Gizlilik Politikası</a> ile <a href="${CONFIG.legal.kvkk}" target="_blank" rel="noopener">KVKK Aydınlatma Metni</a>'ni okumuş olursun.</p>
        <div class="dock"><button class="btn btn--primary btn--block" type="submit">Planımı göster</button></div>
      </form>
    </section>`,

  result: () => resultView(),
  paywall: () => paywallView(),

  account: () => `
    <section class="account">
      <div class="lockup">${icon("lock")}</div>
      <h1 class="q">Hesabını oluştur</h1>
      <p class="hint">Aboneliğin bu hesaba bağlanacak. Uygulamayı indirdiğinde <b>aynı yöntemle</b> giriş yapman yeterli; planın ve premium seni bekliyor olacak.</p>
      <div class="auth">
        <button class="btn btn--apple btn--block" type="button" data-auth="apple">${icon("apple")}Apple ile devam et</button>
        <button class="btn btn--google btn--block" type="button" data-auth="google">${icon("google")}Google ile devam et</button>
      </div>
      <p class="err" id="authErr" hidden></p>
      <p class="fine center">Şifre yok, ekstra form yok. E-postan: <b>${esc(S.email)}</b></p>
    </section>`,

  checkout: () => checkoutView(),
  success: () => successView(),
};

/* ------------------------------------------------------------ grafik */

function projectionChart(p) {
  const W = 340,
    H = 170,
    padX = 22,
    padT = 30,
    padB = 26;
  const lo = Math.min(p.from, p.to) - 1.5,
    hi = Math.max(p.from, p.to) + 1.5;
  const y = (v) => padT + ((hi - v) / (hi - lo)) * (H - padT - padB);
  const x0 = padX,
    x1 = W - padX;
  // Başta hızlı, sona doğru yavaşlayan eğri (gerçekçi kilo değişimi)
  const pts = Array.from({ length: 31 }, (_, i) => {
    const t = i / 30;
    const e = 1 - Math.pow(1 - t, 1.6);
    return [x0 + (x1 - x0) * t, y(p.from + (p.to - p.from) * e)];
  });
  const d = pts.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ");
  const area = `${d} L${x1} ${H - padB} L${x0} ${H - padB} Z`;
  const mid = new Date(Date.now() + (p.end - Date.now()) / 2);
  const short = (dt) => dt.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  const grid = [0.25, 0.5, 0.75]
    .map((f) => `<line x1="${x0}" x2="${x1}" y1="${padT + f * (H - padT - padB)}" y2="${padT + f * (H - padT - padB)}" class="chart__grid"/>`)
    .join("");
  return `
  <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tahmini kilo değişimi: ${p.from} kg'dan ${p.to} kg'a, ${dateLong(p.end)}">
    <defs><linearGradient id="cg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#bbe448" stop-opacity=".32"/><stop offset="1" stop-color="#bbe448" stop-opacity="0"/></linearGradient></defs>
    ${grid}
    <path d="${area}" fill="url(#cg)"/>
    <path class="chart__line" d="${d}" fill="none" stroke="#bbe448" stroke-width="3" stroke-linecap="round" pathLength="1"/>
    <circle cx="${x0}" cy="${y(p.from)}" r="5" fill="#121214" stroke="#aeaeb2" stroke-width="2"/>
    <circle class="chart__end" cx="${x1}" cy="${y(p.to)}" r="6" fill="#bbe448"/>
    <g class="chart__tag" transform="translate(${x0},${y(p.from) - 14})"><text class="chart__v">${fmt(p.from, 1)} kg</text></g>
    <g class="chart__tag" transform="translate(${x1},${y(p.to) - 14})"><text class="chart__v chart__v--end" text-anchor="end">${fmt(p.to, 1)} kg</text></g>
    <text x="${x0}" y="${H - 4}" class="chart__d">Bugün</text>
    <text x="${(x0 + x1) / 2}" y="${H - 4}" class="chart__d" text-anchor="middle">${short(mid)}</text>
    <text x="${x1}" y="${H - 4}" class="chart__d" text-anchor="end">${short(p.end)}</text>
  </svg>`;
}

/* ------------------------------------------------------------ sonuç */

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const SPLIT_DAYS = { 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5] };
const LOCATION = { ev: "Evde", salon: "Salonda", ikisi: "Ev + salon" };
const DIET = { standart: "", vejetaryen: "vejetaryen", vegan: "vegan", pesketaryen: "pesketaryen" };
const MEALS = [
  ["Kahvaltı", 0.25],
  ["Öğle", 0.35],
  ["Ara öğün", 0.1],
  ["Akşam", 0.3],
];
const APP_SHOTS = [
  ["today", "Günlük hedeflerin tek ekranda"],
  ["plan", "Cevaplarına göre kurulan plan"],
  ["scan", "Fotoğraftan kalori hesaplama"],
];

function resultView() {
  const a = S.answers;
  const t = dailyTargets(a);
  const lv = trainingLevel(a);
  const pr = projection(a);
  const days = SPLIT_DAYS[lv.days];
  const kc = { p: t.protein * 4, c: t.carbs * 4, f: t.fat * 9 };
  const tot = kc.p + kc.c + kc.f;
  let mealSum = 0;
  const meals = MEALS.map(([n, r], i) => {
    const v = i === MEALS.length - 1 ? t.calories - mealSum : Math.round((t.calories * r) / 10) * 10;
    mealSum += v;
    return [n, v];
  });
  const diet = DIET[a.diet_preference];
  const allergic = a.allergies?.length && !a.allergies.includes("none");

  return `
  <section class="result">
    <span class="eyebrow">Kişisel planın</span>
    <h1 class="q">${esc(withName(`${GOAL_LABEL[mainGoal(a)].toLowerCase()} için planın hazır.`, `${GOAL_LABEL[mainGoal(a)]} için planın hazır.`))}</h1>

    <div class="grid">
      ${
        pr
          ? `<article class="card card--hero">
              <div class="hero__copy">
                <div class="card__t">Tahmini hedef tarihi</div>
                <div class="big">${dateLong(pr.end)}</div>
                <p class="fine">${fmt(pr.from, 1)} kg → ${fmt(pr.to, 1)} kg · haftada ~${fmt(Math.abs(pr.to - pr.from) / pr.weeks, 2)} kg. Tahmindir, kişiden kişiye değişir.</p>
              </div>
              ${projectionChart(pr)}
            </article>`
          : ""
      }

      <article class="card">
        <div class="card__t">Günlük kalori hedefin</div>
        <div class="big"><span data-count="${t.calories}">${fmt(t.calories)}</span> <small>kcal</small></div>
        <div class="macro-bar" aria-hidden="true">
          <i style="flex:${kc.p / tot};background:var(--protein)"></i>
          <i style="flex:${kc.c / tot};background:var(--carb)"></i>
          <i style="flex:${kc.f / tot};background:var(--fat)"></i>
        </div>
        <ul class="macros">
          <li><span style="--c:var(--protein)"></span>Protein <b>${t.protein} g</b></li>
          <li><span style="--c:var(--carb)"></span>Karbonhidrat <b>${t.carbs} g</b></li>
          <li><span style="--c:var(--fat)"></span>Yağ <b>${t.fat} g</b></li>
        </ul>
      </article>

      <article class="card">
        <div class="card__t">Antrenman programın</div>
        <div class="big">Haftada ${lv.days} gün</div>
        <div class="week">
          ${DAY_NAMES.map((n, i) => `<span class="${days.includes(i) ? "on" : ""}">${n}</span>`).join("")}
        </div>
        <ul class="kv">
          <li>Seviye <b>${lv.label}</b></li>
          <li>Yer <b>${LOCATION[a.workout_location] || "—"}</b></li>
          ${a.focus_areas?.length ? `<li>Odak bölgeler <b>${a.focus_areas.length}</b></li>` : ""}
        </ul>
      </article>

      <article class="card card--meals">
        <div class="card__t">Örnek bir gün</div>
        <ul class="meals">
          ${meals.map(([n, v]) => `<li><span>${n}</span><b>${fmt(v)} kcal</b></li>`).join("")}
        </ul>
        <p class="fine">Öğünlerin${diet ? ` ${diet}` : ""} menülerden${allergic ? ", alerjilerin çıkarılarak" : ""} uygulamada hazırlanır.</p>
      </article>
    </div>

    <h2 class="sub">Uygulamada seni bekleyenler</h2>
    <div class="shots" tabindex="0" aria-label="Uygulama ekran görüntüleri">
      ${APP_SHOTS.map(
        ([f, c]) => `<figure class="shot"><img src="/assets/screens/app/${f}.webp" alt="${c}" loading="lazy" width="560" height="1218" /><figcaption>${c}</figcaption></figure>`,
      ).join("")}
    </div>
  </section>
  ${cta("Planımı aç")}`;
}

/* ------------------------------------------------------------ paywall */

const FEATURES = [
  ["Sana özel antrenman ve beslenme planı", "Cevaplarına göre kurulur, ilerledikçe güncellenir"],
  ["176 egzersiz, videolu anlatım", "Her hareketin doğru formu gösterilir"],
  ["Fotoğraftan kalori hesaplama", "Tabağını çek, kalori ve makroları gör"],
  ["7/24 AI koç", "Soru sor, planını değiştir, menü iste"],
  ["100+ tarif ve takip araçları", "Su, kilo, uyku, hatırlatıcılar"],
];

const FAQ = [
  [
    "Aboneliğimi nasıl iptal ederim?",
    "Hesabından tek tıkla iptal edebilirsin. İptal ettiğinde ödediğin dönemin sonuna kadar premium açık kalır, sonra yenilenmez.",
  ],
  [
    "Uygulamayı nasıl kullanacağım?",
    "Ödemeden sonra Healife'ı App Store veya Google Play'den indir ve burada kullandığın Apple ya da Google hesabıyla giriş yap. Planın ve premium hazır olur.",
  ],
  [
    "Planım nasıl hazırlanıyor?",
    "Kalori hedefin yaş, boy, kilo, cinsiyet ve aktivite seviyene göre Mifflin-St Jeor formülüyle hesaplanır. Antrenman seviyen deneyimin ve performans cevaplarınla belirlenir; program hedefine ve gün sayına göre seçilir.",
  ],
  [
    "Ödeme güvenli mi?",
    "Ödemeler PayTR altyapısıyla 3D Secure üzerinden alınır. Kart bilgilerin Healife'a ulaşmaz, saklanmaz.",
  ],
  [
    "Verilerim güvende mi?",
    "Cevapların yalnızca planını hazırlamak için kullanılır ve üçüncü kişilerle satılmaz. Ayrıntılar Gizlilik Politikası ve KVKK Aydınlatma Metni'nde.",
  ],
];

function paywallView() {
  const plans = CONFIG.plans;
  if (!S.planId) S.planId = (plans.find((p) => p.preselected) || plans[0]).id;
  const a = S.answers;
  const t = dailyTargets(a);
  const pr = projection(a);
  const lv = trainingLevel(a);
  const maxPerWeek = Math.max(...plans.map((p) => p.price / p.weeks));

  const summary = pr
    ? `<div class="ba">
        <div><small>Şimdi</small><b>${fmt(pr.from, 1)} kg</b></div>
        <span class="ba__arrow" aria-hidden="true">→</span>
        <div class="ba__goal"><small>${dateLong(pr.end)}</small><b>${fmt(pr.to, 1)} kg</b></div>
      </div>`
    : `<div class="ba">
        <div><small>Günlük hedef</small><b>${fmt(t.calories)} kcal</b></div>
        <span class="ba__arrow" aria-hidden="true">+</span>
        <div class="ba__goal"><small>Antrenman</small><b>${lv.days} gün/hafta</b></div>
      </div>`;

  return `
  <section class="paywall">
    <span class="eyebrow">${esc(firstName() || "Son adım")}</span>
    <h1 class="q">Planına tam erişim aç</h1>
    ${summary}

    <div class="pw">
      <div class="pw__col">
        <div class="plans" role="radiogroup" aria-label="Abonelik seçenekleri">
          ${plans
            .map((p) => {
              const perWeek = p.price / p.weeks;
              const save = Math.round((1 - perWeek / maxPerWeek) * 100);
              const on = p.id === S.planId;
              return `
            <button class="plan${on ? " is-on" : ""}" type="button" role="radio" aria-checked="${on}" data-plan="${p.id}">
              ${p.badge ? `<span class="plan__badge">${p.badge}${save >= 10 ? ` · %${save} tasarruf` : ""}</span>` : ""}
              <span class="plan__radio"></span>
              <span class="plan__main"><b>${p.title}</b><small>${money(p.price)} ${p.periodLabel}${!p.badge && save >= 10 ? ` · <em>%${save} tasarruf</em>` : ""}</small></span>
              <span class="plan__per"><b>${money(Math.round(perWeek * 100) / 100)}</b><small>/ hafta</small></span>
            </button>`;
            })
            .join("")}
        </div>
        <ul class="trust">
          <li>${icon("shield")}Güvenli ödeme</li>
          <li>${icon("cancel")}İstediğin zaman iptal</li>
          <li>${icon("bolt")}Anında erişim</li>
        </ul>
      </div>

      <div class="pw__col">
        <ul class="feats">
          ${FEATURES.map(([f, s]) => `<li>${icon("check")}<div><b>${f}</b><small>${s}</small></div></li>`).join("")}
        </ul>
      </div>
    </div>

    <h2 class="sub">Nasıl çalışır?</h2>
    <ol class="how">
      <li><span>${icon("card")}</span><b>Planını seç</b><small>Ödemeyi burada güvenle tamamla.</small></li>
      <li><span>${icon("phone")}</span><b>Healife'ı indir</b><small>App Store veya Google Play'den.</small></li>
      <li><span>${icon("login")}</span><b>Aynı hesapla gir</b><small>Planın ve premium hazır olur.</small></li>
    </ol>

    <h2 class="sub">Sık sorulan sorular</h2>
    <div class="faq">
      ${FAQ.map(([q, a]) => `<details><summary>${q}${icon("chev")}</summary><p>${a}</p></details>`).join("")}
    </div>

    <p class="fine center legal">Abonelik, iptal edene kadar seçtiğin dönem sonunda aynı ücretle otomatik yenilenir. Devam ederek <a href="${CONFIG.legal.terms}" target="_blank" rel="noopener">Kullanım Koşulları</a>'nı kabul edersin.</p>
  </section>
  ${cta("Devam et")}`;
}

/* ------------------------------------------------------------ ödeme */

function checkoutView() {
  const p = CONFIG.plans.find((x) => x.id === S.planId) || CONFIG.plans[0];
  return `
  <section class="checkout">
    <h1 class="q">Ödeme</h1>
    <div class="order">
      <div class="order__row"><span>Healife Premium · ${p.title}</span><b>${money(p.price)}</b></div>
      <div class="order__sub"><span>${esc(S.email)}</span><span>${p.periodLabel} yenilenir</span></div>
      <div class="order__total"><span>Bugün ödenecek</span><b>${money(p.price)}</b></div>
    </div>
    <div class="pay" id="pay"><div class="pay__loading"><span class="spin"></span>Güvenli ödeme formu yükleniyor…</div></div>
    <p class="secure">${icon("lock")}256-bit SSL · 3D Secure · Ödemeler PayTR altyapısıyla alınır, kart bilgilerin Healife'a ulaşmaz.</p>
  </section>`;
}

/* ------------------------------------------------------------ başarı */

function successView() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const method = S.user?.method === "google" ? "Google" : "Apple";
  const store = (kind) =>
    kind === "ios"
      ? `<a class="store" href="${CONFIG.stores.ios}" data-store="ios">${icon("apple")}<em><span>İndir</span><strong>App Store</strong></em></a>`
      : `<a class="store" href="${CONFIG.stores.android}" data-store="android">${icon("play")}<em><span>İndir</span><strong>Google Play</strong></em></a>`;
  const stores = android ? [store("android")] : ios ? [store("ios")] : [store("ios"), store("android")];

  return `
  <section class="success">
    <img class="intro__logo" src="/assets/brand/logo.svg?v=20260830b" alt="Healife" width="132" height="25" />
    <div class="burst">${icon("check")}</div>
    <h1 class="display display--sm">${esc(withName("hoş geldin!", "Hoş geldin!"))}<br />Premium'un aktif.</h1>
    <p class="lead">Planın hesabına kaydedildi. Son iki adım:</p>
    <ol class="steps">
      <li><span>1</span><div><b>Healife'ı indir</b><small>Ücretsiz, birkaç saniye sürer.</small></div></li>
      <li><span>2</span><div><b>${method} ile giriş yap</b><small>Web'de kullandığın yöntemle. Planın ve premium hazır olacak.</small></div></li>
    </ol>
    <div class="stores">${stores.join("")}</div>
    ${!ios && !android ? `<figure class="qr"><img src="/assets/brand/qr-indir.svg?v=20260917a" alt="QR kod: telefonunla tarat" width="120" height="120" /><figcaption>Telefonunla tarat</figcaption></figure>` : ""}
    <p class="fine center">Bir sorun mu var? <a href="mailto:destek@hea-life.com">destek@hea-life.com</a></p>
  </section>`;
}

/* ============================================================ etkileşim */

const haptic = () => {
  try {
    navigator.vibrate?.(8);
  } catch {}
};

const BIND = {
  intro: () => app.querySelector("[data-next]").addEventListener("click", () => (track("start"), next())),

  gender: () =>
    app.querySelectorAll("[data-val]").forEach((b) =>
      b.addEventListener("click", () => {
        S.answers.gender = b.dataset.val;
        pick(b);
      }),
    ),

  single: (step) =>
    app.querySelectorAll("[data-val]").forEach((b) =>
      b.addEventListener("click", () => {
        S.answers[step.id] = b.dataset.val;
        pick(b);
      }),
    ),

  multi: (step) => {
    if (!S.answers[step.id] && step.def) S.answers[step.id] = [...step.def];
    app.querySelectorAll("[data-val]").forEach((b) =>
      b.addEventListener("click", () => {
        const v = b.dataset.val;
        let sel = [...(S.answers[step.id] || [])];
        if (sel.includes(v)) sel = sel.filter((x) => x !== v);
        else if (step.none && v === step.none) sel = [v];
        else {
          sel = sel.filter((x) => x !== step.none);
          if (step.max && sel.length >= step.max) return shake(b);
          sel.push(v);
        }
        haptic();
        S.answers[step.id] = sel;
        save();
        render({ quiet: true });
      }),
    );
    app.querySelector("[data-next]").addEventListener("click", next);
  },

  info: () => app.querySelector("[data-next]").addEventListener("click", next),
  bmi: () => app.querySelector("[data-next]").addEventListener("click", next),
  pace: () => app.querySelector("[data-next]").addEventListener("click", next),

  number: (step) => {
    const input = app.querySelector("#numInput");
    const range = app.querySelector("#numRange");
    const note = app.querySelector("#numNote");
    const btn = app.querySelector("[data-next]");
    const clamp = (v) => Math.min(step.max, Math.max(step.min, Math.round(v / step.step) * step.step));
    let warn = false;
    const noteFor = (v) => {
      warn = false;
      if (step.id !== "target_weight") return "";
      const h = healthyRange(S.answers.height || 170);
      const diff = v - S.answers.weight;
      if (v < h.min) {
        warn = true;
        return `Boyuna göre sağlıklı aralığın alt sınırı ${h.min} kg. Bunun altını hedeflemeni önermiyoruz.`;
      }
      if (Math.abs(diff) < 0.5) return "Mevcut kilonla aynı.";
      return `${diff > 0 ? "+" : "−"}${fmt(Math.abs(diff), 1)} kg · sağlıklı aralığın ${h.min}–${h.max} kg`;
    };
    const update = (v, from) => {
      if (from !== "input") input.value = v;
      if (from !== "range") range.value = v;
      range.style.setProperty("--fill", `${((Math.min(step.max, Math.max(step.min, v)) - step.min) / (step.max - step.min)) * 100}%`);
      const ok = isFinite(v) && v >= step.min && v <= step.max;
      btn.disabled = !ok;
      note.textContent = ok ? noteFor(v) : `${step.min}–${step.max} ${step.unit} arası bir değer gir.`;
      note.classList.toggle("is-warn", !ok || warn);
      if (ok) S.answers[step.id] = v;
    };
    input.addEventListener("focus", () => input.select());
    input.addEventListener("input", () => update(parseFloat(input.value), "input"));
    input.addEventListener("blur", () => isFinite(parseFloat(input.value)) && update(clamp(parseFloat(input.value))));
    range.addEventListener("input", () => update(parseFloat(range.value), "range"));
    app.querySelectorAll("[data-delta]").forEach((b) =>
      b.addEventListener("click", () => {
        haptic();
        update(clamp((parseFloat(input.value) || step.def(S.answers)) + step.step * b.dataset.delta));
      }),
    );
    input.addEventListener("keydown", (e) => e.key === "Enter" && !btn.disabled && btn.click());
    btn.addEventListener("click", () => {
      update(clamp(parseFloat(input.value)));
      save();
      next();
    });
    update(parseFloat(input.value));
  },

  performance: () => {
    const read = () =>
      app.querySelectorAll("[data-k]").forEach((i) => {
        const n = parseInt(i.value, 10);
        S.answers[i.dataset.k] = isFinite(n) && n >= 0 ? n : null;
      });
    app.querySelector("[data-next]").addEventListener("click", () => (read(), save(), next()));
    app.querySelector("[data-skip]").addEventListener("click", () => {
      S.answers.squats = S.answers.pullups = null;
      save();
      next();
    });
  },

  name: () => {
    const form = app.querySelector("#nameForm");
    const input = app.querySelector("#nameInput");
    const done = (v) => {
      S.answers.name = v;
      save();
      go("loading");
    };
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      done(input.value.trim().replace(/\s+/g, " ").slice(0, 40));
    });
    app.querySelector("[data-skip]").addEventListener("click", () => done(""));
  },

  loading: async () => {
    const ring = app.querySelector(".ring");
    const pct = app.querySelector("#ringPct");
    const items = [...app.querySelectorAll("#checks li")];
    const total = 4200;
    const t0 = performance.now();
    await new Promise((done) => {
      const tick = (now) => {
        if (S.step !== "loading") return done();
        const p = Math.min(1, (now - t0) / total);
        const eased = 1 - Math.pow(1 - p, 2);
        ring.style.setProperty("--p", eased);
        pct.textContent = `${Math.round(eased * 100)}%`;
        items.forEach((li, i) => {
          li.classList.toggle("is-done", eased >= (i + 1) / items.length - 0.02);
          li.classList.toggle("is-active", eased >= i / items.length);
        });
        p < 1 ? requestAnimationFrame(tick) : done();
      };
      requestAnimationFrame(tick);
    });
    await wait(350);
    if (S.step === "loading") go("email", { replace: true });
  },

  email: () => {
    const form = app.querySelector("#emailForm");
    const input = app.querySelector("#email");
    const err = app.querySelector("#emailErr");
    const sug = app.querySelector("#suggest");
    const check = () => {
      const s = suggestEmail(input.value.trim());
      sug.hidden = !s;
      if (s) sug.innerHTML = `Bunu mu demek istedin? <b>${esc(s)}</b>`;
      sug.dataset.v = s || "";
    };
    sug.addEventListener("click", () => {
      input.value = sug.dataset.v;
      sug.hidden = true;
      input.focus();
    });
    input.addEventListener("input", () => {
      err.hidden = true;
      sug.hidden = true;
    });
    input.addEventListener("blur", check);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        err.hidden = false;
        input.focus();
        return;
      }
      S.email = v;
      S.marketing = app.querySelector("#marketing").checked;
      track("lead", { goal: mainGoal(S.answers) });
      save();
      next();
    });
  },

  result: () => {
    countUp(app.querySelector("[data-count]"));
    app.querySelector("[data-next]").addEventListener("click", () => (track("result_cta"), next()));
  },

  paywall: () => {
    app.querySelectorAll("[data-plan]").forEach((b) =>
      b.addEventListener("click", () => {
        haptic();
        S.planId = b.dataset.plan;
        save();
        app.querySelectorAll("[data-plan]").forEach((x) => {
          const on = x === b;
          x.classList.toggle("is-on", on);
          x.setAttribute("aria-checked", on);
        });
      }),
    );
    app.querySelector("[data-next]").addEventListener("click", () => {
      track("plan_selected", { plan: S.planId });
      S.user ? go("checkout") : next();
    });
  },

  account: () => {
    const err = app.querySelector("#authErr");
    app.querySelectorAll("[data-auth]").forEach((b) =>
      b.addEventListener("click", async () => {
        app.querySelectorAll("[data-auth]").forEach((x) => (x.disabled = true));
        b.classList.add("is-busy");
        try {
          S.user = await signIn(b.dataset.auth, toOnboardingData(S.answers));
          track("account_created", { method: b.dataset.auth });
          save();
          next();
        } catch (e) {
          err.textContent = e.message || "Giriş yapılamadı, tekrar dener misin?";
          err.hidden = false;
          app.querySelectorAll("[data-auth]").forEach((x) => (x.disabled = false));
          b.classList.remove("is-busy");
        }
      }),
    );
  },

  checkout: async () => {
    const box = app.querySelector("#pay");
    const plan = CONFIG.plans.find((x) => x.id === S.planId) || CONFIG.plans[0];
    try {
      const co = await createCheckout({ plan, email: S.email, userId: S.user?.userId });
      if (co.mode === "iframe") {
        box.innerHTML = `<iframe class="pay__frame" src="${co.url}" title="Güvenli ödeme" allow="payment"></iframe>`;
        return;
      }
      box.innerHTML = `
        <div class="pay__demo">
          <div class="cardform" aria-hidden="true">
            <div class="cf-row"><span>Kart üzerindeki isim</span><i>${esc(S.answers.name || "Ad Soyad")}</i></div>
            <div class="cf-row"><span>Kart numarası</span><i>•••• •••• •••• ••••</i></div>
            <div class="cf-2"><div class="cf-row"><span>Son kullanma</span><i>AA/YY</i></div><div class="cf-row"><span>CVC</span><i>•••</i></div></div>
          </div>
          <p class="demo-note">Demo kipi — PayTR bağlanınca bu alanda gerçek ödeme formu açılacak.</p>
          <button class="btn btn--primary btn--block" type="button" id="demoPay">${icon("lock")}${money(plan.price)} öde</button>
        </div>`;
      box.querySelector("#demoPay").addEventListener("click", async (e) => {
        e.currentTarget.disabled = true;
        e.currentTarget.innerHTML = `<span class="spin"></span>İşleniyor…`;
        await wait(1200);
        completePurchase(plan);
      });
    } catch (e) {
      box.innerHTML = `<p class="err">${esc(e.message)}. Lütfen tekrar dene.</p><button class="btn btn--ghost btn--block" type="button" id="retry">Tekrar dene</button>`;
      box.querySelector("#retry").addEventListener("click", render);
    }
  },

  success: () =>
    app.querySelectorAll("[data-store]").forEach((a) => a.addEventListener("click", () => track("store_click", { store: a.dataset.store }))),
};

function completePurchase(plan) {
  S.paid = true;
  track("purchase", { value: plan.price, currency: "TRY", plan: plan.id });
  save();
  go("success", { replace: true });
}

// Tek seçimli sorularda seçimi gösterip kendiliğinden ilerle (tek tık).
function pick(btn) {
  haptic();
  app.querySelectorAll("[data-val]").forEach((b) => b.classList.toggle("is-on", b === btn));
  save();
  app.style.pointerEvents = "none";
  setTimeout(() => {
    app.style.pointerEvents = "";
    next();
  }, 280);
}

function shake(el) {
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

function countUp(el) {
  if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const to = Number(el.dataset.count);
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / 900);
    el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Sık yapılan alan adı yazım hataları (gmial.com → gmail.com).
const DOMAINS = ["gmail.com", "hotmail.com", "outlook.com", "icloud.com", "yahoo.com", "yandex.com", "live.com"];
function suggestEmail(v) {
  const m = v.toLowerCase().match(/^([^@\s]+)@([^@\s]+)$/);
  if (!m) return null;
  const dom = m[2];
  if (DOMAINS.includes(dom)) return null;
  let best = null,
    bestD = 3;
  for (const d of DOMAINS) {
    const dist = lev(dom, d);
    if (dist < bestD) {
      bestD = dist;
      best = d;
    }
  }
  return best && bestD <= 2 ? `${m[1]}@${best}` : null;
}
function lev(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/* ============================================================ başlat */

// PayTR başarılı ödemeden sonra /start/?odeme=tamam adresine döner.
// Asıl onay backend bildirimiyle gelir; burada yalnızca başarı ekranı açılır.
const params = new URLSearchParams(location.search);
if (params.get("odeme") === "tamam" && S.user) {
  S.paid = true;
  S.step = "success";
}
if (params.has("sifirla")) {
  storage.clear();
  S = fresh();
}
// UTM'leri sakla: ödeme olayında kampanya kaynağı bilinsin.
const utm = {};
params.forEach((v, k) => /^utm_|^fbclid$/.test(k) && (utm[k] = v));
if (Object.keys(utm).length) S.utm = utm;

// Sayfa yenilendiğinde yükleme ekranında kalmasın.
if (S.step === "loading") S.step = "email";
history.replaceState({ step: S.step }, "", `${location.pathname}#${S.step}`);
render();
