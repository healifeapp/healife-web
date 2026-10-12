// Healife web funnel — tek sayfa, adım adım akış.
// Cevap kimlikleri uygulamadaki onboarding ile birebir aynı
// (lib/data/questions_repository.dart), backend'e olduğu gibi gidebilir.

import { CONFIG } from "./config.js";
import {
  dailyTargets,
  trainingLevel,
  healthyRange,
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
  flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1.2-3.6 2.4-4.6.2 1.6 1 2.6 2.1 2.9C10.6 9 11 6 12 3z"/>',
  muscle: '<path d="M4 15c2-6 5-9 8-9 1.6 0 2.5 1.2 2 2.6-.4 1-1.6 1.4-2.6 1l-1.4 2.6c2.6-1 6.4-.4 8 2.8 1 2-.6 4-3 4H8c-2.4 0-4.4-1.2-4-4z"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6" fill="currentColor"/>',
  bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  male: '<circle cx="10" cy="14" r="5"/><path d="M14 10l6-6M15 4h5v5"/>',
  female: '<circle cx="12" cy="9" r="5"/><path d="M12 14v7M9 18h6"/>',
  home: '<path d="M4 11l8-6 8 6v9H4z"/><path d="M10 20v-5h4v5"/>',
  gym: '<path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12"/>',
  both: '<path d="M4 12h16M12 4v16"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  apple:
    '<path fill="currentColor" stroke="none" d="M16.37 1.43c0 1.14-.42 2.2-1.12 3.02-.85.99-2.24 1.76-3.37 1.67-.14-1.1.4-2.27 1.06-3 .75-.85 2.06-1.5 3.43-1.69zM20.99 17.1c-.55 1.28-.82 1.85-1.53 2.98-.99 1.58-2.39 3.54-4.12 3.55-1.54.02-1.93-1-4.02-.99-2.09.01-2.52 1.01-4.06.99-1.73-.01-3.05-1.78-4.04-3.35C.5 15.86-.02 10.7 1.7 8.02c1.22-1.9 3.15-3.02 4.96-3.02 1.84 0 3 1.01 4.52 1.01 1.48 0 2.38-1.01 4.51-1.01 1.61 0 3.32.88 4.54 2.39-3.99 2.19-3.34 7.89 1.76 9.71z"/>',
  google:
    '<path fill="#4285F4" stroke="none" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" stroke="none" d="M12 23c3 0 5.5-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" stroke="none" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8l3.6-2.8z"/><path fill="#EA4335" stroke="none" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.2 7.1l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4z"/>',
};
const icon = (name, cls = "") =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name]}</svg>`;

/* ============================================================ adımlar */

const GOAL_ICONS = { yag_yakma: "flame", kas_kazanma: "muscle", forma: "target", guclenme: "bolt", saglik: "heart" };

const STEPS = [
  { id: "intro", kind: "intro", chrome: false },
  {
    id: "gender",
    kind: "gender",
    q: "Cinsiyetin nedir?",
    hint: "Kalori ihtiyacını doğru hesaplamamız için.",
    options: [
      ["erkek", "Erkek", "male"],
      ["kadin", "Kadın", "female"],
    ],
    extra: ["belirtmek_istemiyorum", "Belirtmek istemiyorum"],
  },
  {
    id: "goal",
    kind: "multi",
    max: 3,
    ordered: true,
    q: "Temel hedefin ne?",
    hint: "En fazla 3 tane seçebilirsin — ilk seçtiğin ana hedefin olur.",
    options: [
      ["yag_yakma", "Yağ yakmak"],
      ["kas_kazanma", "Kas kazanmak"],
      ["forma", "Forma girmek"],
      ["guclenme", "Güçlenmek"],
      ["saglik", "Daha sağlıklı yaşamak"],
    ],
    icons: GOAL_ICONS,
  },
  {
    id: "focus_areas",
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
  { id: "info_start", kind: "info" },
  { id: "age", kind: "number", q: "Kaç yaşındasın?", unit: "yaş", min: 16, max: 80, step: 1, def: () => 28 },
  {
    id: "height",
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
    kind: "number",
    q: "Kilon kaç?",
    unit: "kg",
    min: 40,
    max: 180,
    step: 0.5,
    def: (a) => (a.gender === "erkek" ? 80 : 65),
  },
  {
    id: "target_weight",
    kind: "number",
    q: "Hedef kilon kaç?",
    hint: "Ulaşacağın tarihi tahmin etmek için.",
    unit: "kg",
    min: 40,
    max: 180,
    step: 0.5,
    when: (a) => ["lose_weight", "build_muscle"].includes(goalCanon(a)),
    def: (a) => (goalCanon(a) === "lose_weight" ? Math.max(45, a.weight - 5) : a.weight + 4),
  },
  {
    id: "experience",
    kind: "single",
    q: "Egzersiz deneyimin nedir?",
    options: [
      ["ilk_kez", "İlk kez başlıyorum"],
      ["ara_sira", "Ara sıra spor yapıyorum"],
      ["duzenli", "Düzenli spor yapıyorum"],
      ["ileri", "İleri seviye"],
    ],
  },
  { id: "performance", kind: "performance", q: "Fiziksel performansın nasıl?", hint: "Bilmiyorsan boş bırakabilirsin." },
  {
    id: "activity_level",
    kind: "single",
    q: "Günlük aktivite seviyeni nasıl tanımlarsın?",
    options: [
      ["oturan", "Çoğunlukla oturuyorum", "Masa başı iş, az yürüyüş"],
      ["hafif", "Hafif aktifim", "Günde biraz yürüyüş"],
      ["aktif", "Aktifim", "Gün boyu ayaktayım"],
      ["cok_aktif", "Çok aktifim", "Fiziksel iş veya yoğun spor"],
    ],
  },
  {
    id: "weekly_days",
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
    kind: "single",
    q: "Nerede antrenman yapacaksın?",
    options: [
      ["ev", "Evde", null, "home"],
      ["salon", "Spor salonunda", null, "gym"],
      ["ikisi", "Her ikisinde de", null, "both"],
    ],
  },
  {
    id: "diet_preference",
    kind: "single",
    q: "Beslenme tercihin nedir?",
    options: [
      ["standart", "Standart"],
      ["vejetaryen", "Vejetaryen"],
      ["vegan", "Vegan"],
      ["pesketaryen", "Pesketaryen"],
    ],
  },
  {
    id: "allergies",
    kind: "multi",
    q: "Besin alerjin var mı?",
    hint: "Planındaki öğünlerden çıkaracağız.",
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
  { id: "loading", kind: "loading", chrome: false },
  { id: "email", kind: "email", chrome: "minimal" },
  { id: "result", kind: "result", chrome: "minimal", wide: true },
  { id: "paywall", kind: "paywall", chrome: "minimal", wide: true },
  { id: "account", kind: "account", chrome: "minimal" },
  { id: "checkout", kind: "checkout", chrome: "minimal" },
  { id: "success", kind: "success", chrome: false },
];

const QUESTION_KINDS = new Set(["gender", "multi", "single", "number", "performance"]);

/* ============================================================ durum */

const fresh = () => ({ step: "intro", answers: {}, email: "", marketing: false, planId: null, user: null, paid: false });
let S = Object.assign(fresh(), storage.load() || {});
if (S.paid) S.step = "success";

const save = () => storage.save(S);
const stepById = (id) => STEPS.find((s) => s.id === id);
const visible = () => STEPS.filter((s) => !s.when || s.when(S.answers));
const questionSteps = () => visible().filter((s) => QUESTION_KINDS.has(s.kind));

function next() {
  const list = visible();
  const i = list.findIndex((s) => s.id === S.step);
  go(list[Math.min(i + 1, list.length - 1)].id);
}

function go(id, { replace = false } = {}) {
  S.step = id;
  save();
  const url = `#${id}`;
  if (replace) history.replaceState({ step: id }, "", url);
  else history.pushState({ step: id }, "", url);
  render();
}

// Tarayıcının geri tuşu bir önceki adıma döner. Ödeme sonrasında geri
// gitmek anlamsız; yükleme ekranına dönülürse animasyonu tekrar oynatmak
// yerine sorulara geçilir.
window.addEventListener("popstate", (e) => {
  if (S.paid) return go("success", { replace: true });
  let id = e.state?.step || "intro";
  if (id === "loading") id = "allergies";
  S.step = id;
  save();
  render();
});

/* ============================================================ çizim */

const app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const fmt = (n, d = 0) => Number(n).toLocaleString("tr-TR", { maximumFractionDigits: d, minimumFractionDigits: d });
const money = (n) => `${fmt(n, n % 1 ? 2 : 0)} ${CONFIG.currency}`;

const NEEDS_ANSWERS = new Set(["result", "paywall", "account", "checkout"]);

function render({ quiet = false } = {}) {
  const step = stepById(S.step) || STEPS[0];
  if (step.when && !step.when(S.answers)) return next();
  // Doğrudan #result gibi bir adrese gelinirse (cevaplar yokken) başa dön.
  if (NEEDS_ANSWERS.has(step.id) && !dailyTargets(S.answers)) return go("intro", { replace: true });

  const qs = questionSteps();
  const qi = qs.findIndex((s) => s.id === step.id);
  const pct = qi >= 0 ? ((qi + 1) / qs.length) * 100 : 100;

  const chrome =
    step.chrome === false
      ? ""
      : `<header class="top">
          <button class="top__back" type="button" aria-label="Geri" data-back>${icon("back")}</button>
          <img class="top__logo" src="/assets/brand/logo.svg?v=20260830b" alt="Healife" width="112" height="21" />
          <span class="top__count">${qi >= 0 ? `${qi + 1}/${qs.length}` : ""}</span>
          ${step.chrome === "minimal" ? "" : `<div class="top__bar"><i style="width:${pct}%"></i></div>`}
        </header>`;

  app.className = `funnel funnel--${step.kind}${step.wide ? " funnel--wide" : ""}`;
  app.innerHTML = `${chrome}<main class="stage" id="stage"><div class="stage__inner">${VIEWS[step.kind](step)}</div></main>`;

  app.querySelector("[data-back]")?.addEventListener("click", () => history.back());
  BIND[step.kind]?.(step);
  if (quiet) return;
  window.scrollTo(0, 0);
  app.querySelector(".stage__inner").classList.add("enter");
  track("step_view", { step: step.id });
}

const head = (step) =>
  `<h1 class="q">${esc(step.q)}</h1>${step.hint ? `<p class="hint">${esc(step.hint)}</p>` : ""}`;

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
          <img src="/assets/img/athlete-run.png" alt="" />
        </picture>
      </div>
      <div class="intro__copy">
        <span class="eyebrow">2 dakikalık test</span>
        <h1 class="display">Sana özel antrenman ve beslenme planı.</h1>
        <p class="lead">Birkaç soruyu cevapla; kalori ihtiyacını, antrenman seviyeni ve haftalık programını hemen hesaplayalım.</p>
        <button class="btn btn--primary btn--xl" type="button" data-next>Teste başla</button>
        <ul class="intro__facts">
          <li><b>176</b> videolu egzersiz</li>
          <li><b>100+</b> tarif</li>
          <li><b>AI</b> koç</li>
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
                ${step.ordered && idx === 0 ? `<span class="badge">Ana hedef</span>` : ""}
                <span class="opt__box">${on ? icon("check") : ""}</span>
              </button>`;
        })
        .join("")}
    </div>
    ${cta("Devam", sel.length ? "" : "disabled")}`;
  },

  info: () => `
    <section class="info">
      <span class="eyebrow">Harika gidiyorsun</span>
      <h1 class="q">Profilini tanımaya başlıyoruz.</h1>
      <p class="hint">Hedeflerini öğrendik. Şimdi vücudunu ve yaşam tarzını tanıyıp planını ona göre kuracağız.</p>
      <div class="facts">
        <div class="fact"><b>176</b><span>egzersiz, hepsi videolu</span></div>
        <div class="fact"><b>36</b><span>başlangıç programı</span></div>
        <div class="fact"><b>100+</b><span>tarif ve beslenme menüsü</span></div>
      </div>
      <div class="info__media"><picture><source srcset="/assets/img/athlete-abs.webp" type="image/webp" /><img src="/assets/img/athlete-abs.png" alt="" /></picture></div>
    </section>
    ${cta("Devam")}`,

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
      <p class="num__note" id="numNote"></p>
    </div>
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

  loading: () => `
    <section class="loading">
      <div class="ring" style="--p:0"><svg viewBox="0 0 120 120"><circle class="ring__bg" cx="60" cy="60" r="52"/><circle class="ring__fg" cx="60" cy="60" r="52"/></svg><b id="ringPct">0%</b></div>
      <h1 class="q">Planın hazırlanıyor</h1>
      <ul class="checks" id="checks">
        ${["Kalori ihtiyacın hesaplanıyor", "Antrenman seviyen belirleniyor", "Haftalık programın kuruluyor", "Beslenme menün hazırlanıyor"]
          .map((t) => `<li><span class="checks__dot">${icon("check")}</span>${t}</li>`)
          .join("")}
      </ul>
    </section>`,

  email: () => `
    <section class="email">
      <div class="badge-ok">${icon("check")}</div>
      <h1 class="q">Planın hazır!</h1>
      <p class="hint">Planını görmek için e-posta adresini gir. Hesabın ve planın bu adrese bağlanır.</p>
      <form id="emailForm" novalidate>
        <label class="field field--solo">
          <span class="sr">E-posta</span>
          <input id="email" type="email" inputmode="email" autocomplete="email" placeholder="ornek@eposta.com" value="${esc(S.email)}" required />
        </label>
        <p class="err" id="emailErr" hidden>Geçerli bir e-posta adresi gir.</p>
        <label class="consent">
          <input type="checkbox" id="marketing" ${S.marketing ? "checked" : ""} />
          <span>Kampanya ve ipuçlarını e-postayla almak istiyorum. <small>(isteğe bağlı)</small></span>
        </label>
        <p class="fine">Devam ederek <a href="${CONFIG.legal.terms}" target="_blank" rel="noopener">Kullanım Koşulları</a>'nı kabul etmiş ve <a href="${CONFIG.legal.privacy}" target="_blank" rel="noopener">Gizlilik Politikası</a> ile <a href="${CONFIG.legal.kvkk}" target="_blank" rel="noopener">KVKK Aydınlatma Metni</a>'ni okumuş olursun.</p>
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

/* ------------------------------------------------------------ sonuç */

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const SPLIT_DAYS = { 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5] };
const LOCATION = { ev: "Evde", salon: "Salonda", ikisi: "Ev + salon" };
const GOAL_LABEL = { yag_yakma: "Yağ yakmak", kas_kazanma: "Kas kazanmak", forma: "Forma girmek", guclenme: "Güçlenmek", saglik: "Sağlıklı yaşamak" };
const MEALS = [
  ["Kahvaltı", 0.25],
  ["Öğle", 0.35],
  ["Ara öğün", 0.1],
  ["Akşam", 0.3],
];

function projectionChart(p) {
  const W = 320,
    H = 150,
    pad = 18;
  const lo = Math.min(p.from, p.to) - 2,
    hi = Math.max(p.from, p.to) + 2;
  const y = (v) => pad + ((hi - v) / (hi - lo)) * (H - pad * 2 - 18);
  const x0 = pad,
    x1 = W - pad;
  // Yumuşak eğri: başta hızlı, sona doğru yavaşlayan (gerçekçi kilo değişimi)
  const pts = Array.from({ length: 21 }, (_, i) => {
    const t = i / 20;
    const e = 1 - Math.pow(1 - t, 1.6);
    return [x0 + (x1 - x0) * t, y(p.from + (p.to - p.from) * e)];
  });
  const d = pts.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ");
  const area = `${d} L${x1} ${H - 18} L${x0} ${H - 18} Z`;
  const month = (dt) => dt.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  return `
  <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tahmini kilo değişimi: ${p.from} kg'dan ${p.to} kg'a">
    <defs><linearGradient id="cg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--lime)" stop-opacity=".35"/><stop offset="1" stop-color="var(--lime)" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#cg)"/>
    <path d="${d}" fill="none" stroke="var(--lime)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${x0}" cy="${y(p.from)}" r="5" fill="var(--bg)" stroke="var(--text-2)" stroke-width="2"/>
    <circle cx="${x1}" cy="${y(p.to)}" r="6" fill="var(--lime)"/>
    <text x="${x0}" y="${y(p.from) - 10}" class="chart__v">${fmt(p.from, 1)} kg</text>
    <text x="${x1}" y="${y(p.to) - 12}" class="chart__v chart__v--end" text-anchor="end">${fmt(p.to, 1)} kg</text>
    <text x="${x0}" y="${H - 2}" class="chart__d">Bugün</text>
    <text x="${x1}" y="${H - 2}" class="chart__d" text-anchor="end">${month(p.end)}</text>
  </svg>`;
}

function resultView() {
  const a = S.answers;
  const t = dailyTargets(a);
  const lv = trainingLevel(a);
  const pr = projection(a);
  const days = SPLIT_DAYS[lv.days];
  const kcalMacro = { p: t.protein * 4, c: t.carbs * 4, f: t.fat * 9 };
  const tot = kcalMacro.p + kcalMacro.c + kcalMacro.f;

  return `
  <section class="result">
    <span class="eyebrow">Kişisel planın</span>
    <h1 class="q">${GOAL_LABEL[mainGoal(a)]} için planın hazır.</h1>

    <div class="grid">
      ${
        pr
          ? `<article class="card card--hero">
              <div class="card__t">Tahmini hedef tarihi</div>
              <div class="big">${pr.end.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}</div>
              ${projectionChart(pr)}
              <p class="fine">Planına uyarsan haftada ${fmt(Math.abs(pr.to - pr.from) / pr.weeks, 2)} kg — sağlıklı ve sürdürülebilir bir hız. Kişiden kişiye değişir; söz değil, tahmindir.</p>
            </article>`
          : ""
      }

      <article class="card">
        <div class="card__t">Günlük kalori hedefin</div>
        <div class="big">${fmt(t.calories)} <small>kcal</small></div>
        <div class="macro-bar" aria-hidden="true">
          <i style="flex:${kcalMacro.p / tot};background:var(--protein)"></i>
          <i style="flex:${kcalMacro.c / tot};background:var(--carb)"></i>
          <i style="flex:${kcalMacro.f / tot};background:var(--fat)"></i>
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
          ${a.focus_areas?.length ? `<li>Odak <b>${a.focus_areas.length} bölge</b></li>` : ""}
        </ul>
      </article>

      <article class="card">
        <div class="card__t">Örnek bir gün</div>
        <ul class="meals">
          ${MEALS.map(([n, r]) => `<li><span>${n}</span><b>${fmt(Math.round((t.calories * r) / 10) * 10)} kcal</b></li>`).join("")}
        </ul>
        <p class="fine">Öğünlerin ${a.diet_preference && a.diet_preference !== "standart" ? `${a.diet_preference} tercihine` : "tercihine"}${a.allergies?.length && !a.allergies.includes("none") ? " ve alerjilerine" : ""} göre uygulamada hazırlanır.</p>
      </article>
    </div>

    <div class="locked">
      ${icon("lock")}<span>Günlük antrenmanlar, hareket videoları, öğün menüleri ve AI koç planına dahil.</span>
    </div>
  </section>
  ${cta("Planımı aç")}`;
}

/* ------------------------------------------------------------ paywall */

const FEATURES = [
  "Sana özel antrenman ve beslenme planı",
  "176 egzersizin tamamı, videolu anlatımla",
  "Fotoğraftan kalori hesaplama",
  "7/24 AI koç: soru sor, planını değiştir",
  "100+ tarif, ilerleme takibi, hatırlatıcılar",
];

function paywallView() {
  const plans = CONFIG.plans;
  if (!S.planId) S.planId = (plans.find((p) => p.preselected) || plans[0]).id;
  const t = dailyTargets(S.answers);
  return `
  <section class="paywall">
    <span class="eyebrow">Son adım</span>
    <h1 class="q">Planına tam erişim aç</h1>
    <div class="pw-summary">
      <span>${fmt(t.calories)} kcal/gün</span><span>Haftada ${trainingLevel(S.answers).days} gün</span><span>${GOAL_LABEL[mainGoal(S.answers)]}</span>
    </div>

    <div class="pw">
      <div class="plans" role="radiogroup" aria-label="Abonelik seçenekleri">
        ${plans
          .map((p) => {
            const perWeek = p.price / p.weeks;
            const on = p.id === S.planId;
            return `
          <button class="plan${on ? " is-on" : ""}" type="button" role="radio" aria-checked="${on}" data-plan="${p.id}">
            ${p.badge ? `<span class="plan__badge">${p.badge}</span>` : ""}
            <span class="plan__radio"></span>
            <span class="plan__main"><b>${p.title}</b><small>${money(p.price)} ${p.periodLabel}</small></span>
            <span class="plan__per"><b>${money(Math.round(perWeek * 100) / 100)}</b><small>haftalık</small></span>
          </button>`;
          })
          .join("")}
      </div>
      <ul class="feats">
        ${FEATURES.map((f) => `<li>${icon("check")}${f}</li>`).join("")}
      </ul>
    </div>

    <p class="fine center">Abonelik, iptal edene kadar seçtiğin dönem sonunda otomatik yenilenir. İstediğin zaman hesabından iptal edebilirsin.</p>
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
      <div><span>Healife Premium · ${p.title}</span><b>${money(p.price)}</b></div>
      <div class="order__sub"><span>${esc(S.email)}</span><span>${p.periodLabel} yenilenir</span></div>
    </div>
    <div class="pay" id="pay"><div class="pay__loading"><span class="spin"></span>Güvenli ödeme formu yükleniyor…</div></div>
    <p class="secure">${icon("lock")}Ödemeler PayTR güvencesiyle alınır. Kart bilgilerin Healife'a ulaşmaz.</p>
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
      ? `<a class="store" href="${CONFIG.stores.ios}">${icon("apple")}<em><span>İndir</span><strong>App Store</strong></em></a>`
      : `<a class="store" href="${CONFIG.stores.android}"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="#00d4ff" d="M3.6 1.8c-.4.4-.6.9-.6 1.6v17.2c0 .7.2 1.2.6 1.6l.1.1 9.6-9.6v-.2L3.7 1.7l-.1.1z"/><path fill="#ffd400" d="M16.5 15.9l-3.2-3.2v-.2l3.2-3.2.1.1 3.8 2.2c1.1.6 1.1 1.6 0 2.2l-3.9 2.1z"/><path fill="#ff3a44" d="M16.6 15.8l-3.3-3.3-9.7 9.7c.4.4 1 .4 1.7.1l11.3-6.5"/><path fill="#00c853" d="M16.6 8.2L5.3 1.8c-.7-.4-1.3-.3-1.7.1l9.7 9.7 3.3-3.4z"/></svg><em><span>İndir</span><strong>Google Play</strong></em></a>`;
  const stores = android ? [store("android")] : ios ? [store("ios")] : [store("ios"), store("android")];

  return `
  <section class="success">
    <img class="intro__logo" src="/assets/brand/logo.svg?v=20260830b" alt="Healife" width="132" height="25" />
    <div class="burst">${icon("check")}</div>
    <h1 class="display display--sm">Hoş geldin! Premium'un aktif.</h1>
    <p class="lead">Planın hesabına kaydedildi. Son iki adım:</p>
    <ol class="steps">
      <li><span>1</span><div><b>Healife'ı indir</b><small>Ücretsiz, birkaç saniye sürer.</small></div></li>
      <li><span>2</span><div><b>${method} ile giriş yap</b><small>Web'de kullandığın yöntemle. Planın ve premium hazır olacak.</small></div></li>
    </ol>
    <div class="stores">${stores.join("")}</div>
    ${!ios && !android ? `<figure class="qr"><img src="/assets/brand/qr-indir.svg?v=20260917a" alt="QR kod: telefonunla tarat" width="120" height="120" /><figcaption>Telefonunla tarat</figcaption></figure>` : ""}
    <p class="fine center">Sorun mu var? <a href="mailto:destek@hea-life.com">destek@hea-life.com</a></p>
  </section>`;
}

/* ============================================================ etkileşim */

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
        S.answers[step.id] = sel;
        save();
        render({ quiet: true });
      }),
    );
    app.querySelector("[data-next]").addEventListener("click", next);
  },

  info: () => app.querySelector("[data-next]").addEventListener("click", next),

  number: (step) => {
    const input = app.querySelector("#numInput");
    const range = app.querySelector("#numRange");
    const note = app.querySelector("#numNote");
    const btn = app.querySelector("[data-next]");
    const clamp = (v) => Math.min(step.max, Math.max(step.min, Math.round(v / step.step) * step.step));
    const update = (v, from) => {
      if (from !== "input") input.value = v;
      if (from !== "range") range.value = v;
      range.style.setProperty("--fill", `${((v - step.min) / (step.max - step.min)) * 100}%`);
      const ok = isFinite(v) && v >= step.min && v <= step.max;
      btn.disabled = !ok;
      note.className = "num__note";
      note.textContent = ok ? noteFor(step, v) : `${step.min}–${step.max} ${step.unit} arası bir değer gir.`;
      if (!ok) note.classList.add("is-warn");
      else if (note.dataset.warn) note.classList.add("is-warn");
      if (ok) S.answers[step.id] = v;
    };
    const noteFor = (s, v) => {
      delete note.dataset.warn;
      if (s.id !== "target_weight" && s.id !== "weight") return "";
      const h = healthyRange(S.answers.height || 170);
      if (s.id === "weight") return "";
      const diff = v - S.answers.weight;
      if (v < h.min) {
        note.dataset.warn = 1;
        return `Boyuna göre sağlıklı aralığın alt sınırı ${h.min} kg. Bunun altını hedeflemeni önermiyoruz.`;
      }
      if (Math.abs(diff) < 0.5) return "Mevcut kilonla aynı.";
      return `${diff > 0 ? "+" : "−"}${fmt(Math.abs(diff), 1)} kg · sağlıklı aralığın ${h.min}–${h.max} kg`;
    };
    input.addEventListener("input", () => update(parseFloat(input.value), "input"));
    input.addEventListener("blur", () => isFinite(parseFloat(input.value)) && update(clamp(parseFloat(input.value))));
    range.addEventListener("input", () => update(parseFloat(range.value), "range"));
    app.querySelectorAll("[data-delta]").forEach((b) =>
      b.addEventListener("click", () => update(clamp((parseFloat(input.value) || step.def(S.answers)) + step.step * b.dataset.delta))),
    );
    input.addEventListener("keydown", (e) => e.key === "Enter" && !btn.disabled && next());
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
        items.forEach((li, i) => li.classList.toggle("is-done", eased >= (i + 1) / items.length - 0.02));
        items.forEach((li, i) => li.classList.toggle("is-active", eased >= i / items.length));
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
    input.addEventListener("input", () => (err.hidden = true));
  },

  result: () => app.querySelector("[data-next]").addEventListener("click", () => (track("result_cta"), next())),

  paywall: () => {
    app.querySelectorAll("[data-plan]").forEach((b) =>
      b.addEventListener("click", () => {
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
            <div class="cf-row"><span>Kart numarası</span><i>•••• •••• •••• ••••</i></div>
            <div class="cf-2"><div class="cf-row"><span>Son kullanma</span><i>AA/YY</i></div><div class="cf-row"><span>CVC</span><i>•••</i></div></div>
          </div>
          <p class="fine center">Demo kipi — PayTR bağlanınca bu alanda gerçek ödeme formu açılacak.</p>
          <button class="btn btn--primary btn--block" type="button" id="demoPay">${money(plan.price)} öde</button>
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
};

function completePurchase(plan) {
  S.paid = true;
  track("purchase", { value: plan.price, currency: "TRY", plan: plan.id });
  save();
  go("success", { replace: true });
}

// Tek seçimli sorularda seçimi gösterip kendiliğinden ilerle (tek tık).
function pick(btn) {
  app.querySelectorAll("[data-val]").forEach((b) => b.classList.toggle("is-on", b === btn));
  save();
  app.style.pointerEvents = "none";
  setTimeout(() => {
    app.style.pointerEvents = "";
    next();
  }, 260);
}

function shake(el) {
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
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

// Sayfa yenilendiğinde yükleme ekranında kalmasın.
if (S.step === "loading") S.step = "email";
history.replaceState({ step: S.step }, "", `${location.pathname}#${S.step}`);
render();
