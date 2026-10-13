// Healife web funnel — tek sayfa, adım adım akış.
// Görsel dil uygulamadaki onboarding'in aynısı: AppIcons ikon fontu, seçili
// kartta lime degrade, cinsiyet avatarları, anatomik kas haritası, çark seçici.
// Cevap kimlikleri lib/data/questions_repository.dart ile birebir aynı.
//
// İlke: ekrandaki her rakam ya kullanıcının kendi cevabından hesaplanır ya da
// üründen gelen gerçek bir sayıdır. Sahte yorum, uydurma istatistik ve geri
// sayım sayacı yok.

import { CONFIG } from "./config.js?v=20261013i";
import { ICONS } from "./icons.js?v=20261013i";
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
} from "./services.js?v=20261013i";

/* ============================================================ ikonlar */

/** Uygulamanın kendi ikon fontu (AppIcons) — `Icon(AppIcons.fire)` karşılığı. */
const ai = (name, cls = "") => `<i class="ai ${cls}" aria-hidden="true">&#x${ICONS[name].toString(16)};</i>`;

// Marka logoları ikon setinde yok (uygulamada da ayrı SVG).
const BRAND = {
  apple:
    '<svg class="brand" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.37 1.43c0 1.14-.42 2.2-1.12 3.02-.85.99-2.24 1.76-3.37 1.67-.14-1.1.4-2.27 1.06-3 .75-.85 2.06-1.5 3.43-1.69zM20.99 17.1c-.55 1.28-.82 1.85-1.53 2.98-.99 1.58-2.39 3.54-4.12 3.55-1.54.02-1.93-1-4.02-.99-2.09.01-2.52 1.01-4.06.99-1.73-.01-3.050-1.78-4.04-3.35C.5 15.86-.02 10.7 1.7 8.02c1.22-1.9 3.15-3.02 4.96-3.02 1.84 0 3 1.01 4.52 1.01 1.48 0 2.38-1.01 4.51-1.01 1.61 0 3.32.88 4.54 2.39-3.99 2.19-3.34 7.89 1.76 9.71z"/></svg>',
  google:
    '<svg class="brand" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8l3.6-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.2 7.1l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>',
  play:
    '<svg class="brand" viewBox="0 0 24 24" aria-hidden="true"><path fill="#00d4ff" d="M3.6 1.8c-.4.4-.6.9-.6 1.6v17.2c0 .7.2 1.2.6 1.6l.1.1 9.6-9.6v-.2L3.7 1.7l-.1.1z"/><path fill="#ffd400" d="M16.5 15.9l-3.2-3.2v-.2l3.2-3.2.1.1 3.8 2.2c1.1.6 1.1 1.6 0 2.2l-3.9 2.1z"/><path fill="#ff3a44" d="M16.6 15.8l-3.3-3.3-9.7 9.7c.4.4 1 .4 1.7.1l11.3-6.5"/><path fill="#00c853" d="M16.6 8.2L5.3 1.8c-.7-.4-1.3-.3-1.7.1l9.7 9.7 3.3-3.4z"/></svg>',
};

const IMG = (name) => `/start/img/${name}.webp`;

/* ============================================================ adımlar */

const GOAL_LABEL = {
  yag_yakma: "Yağ yakmak",
  kas_kazanma: "Kas kazanmak",
  forma: "Forma girmek",
  guclenme: "Güçlenmek",
  saglik: "Daha sağlıklı yaşamak",
};
const GOAL_IMG = { lose_weight: "goal-lose", build_muscle: "goal-build", get_fit: "goal-fit" };
const FOCUS_LABEL = {
  karin: "Karın",
  gogus: "Göğüs",
  omuz: "Omuz",
  sirt: "Sırt",
  kol: "Kol",
  kalca: "Kalça",
  bacak: "Bacak",
  genel: "Genel gelişim",
};

const SECTIONS = [
  ["profil", "Profil"],
  ["antrenman", "Antrenman"],
  ["beslenme", "Beslenme"],
];

// Hedef kilo, ana hedef seçilmeden önce de sayılır: sayaç zıplamasın diye.
const needsTarget = (a) => !a.goal?.length || ["lose_weight", "build_muscle"].includes(goalCanon(a));

// Masaüstü yan panel: bölüme göre değişen görsel + kısa metin.
const ASIDE = {
  start: ["mot-progress", "Sana özel plan, 2 dakikada.", "Cevaplarına göre kalori hedefin, antrenman seviyen ve haftalık programın hesaplanır."],
  body: ["mot-halfway", "Doğru başlangıç noktası.", "Kalori ihtiyacın yaş, boy, kilo ve aktivitene göre Mifflin-St Jeor formülüyle hesaplanır."],
  train: ["mot-final", "Seviyene uygun program.", "176 egzersizin her biri videolu; doğru formu adım adım görürsün."],
  food: ["mot-almost", "Sana göre beslenme.", "Öğünlerin tercihine ve alerjilerine göre hazırlanır, AI koçla istediğin an değiştirirsin."],
  result: ["mot-stats", "Planın hazır.", "Uygulamaya girdiğinde aynı plan seni bekliyor olacak."],
};

const STEPS = [
  { id: "intro", kind: "intro", chrome: false },
  {
    id: "gender",
    sec: "profil",
    kind: "gender",
    aside: "start",
    q: "Cinsiyetin nedir?",
    hint: "Bu; kalori, hedef ve öneri hesaplamalarına daha iyi bir başlangıç noktası sağlar.",
  },
  {
    id: "goal",
    sec: "profil",
    kind: "multi",
    aside: "start",
    max: 3,
    ordered: true,
    q: "Temel hedefin ne?",
    hint: "Birden fazla seçebilirsin — ilk seçtiğin ana hedefin olur.",
    options: [
      ["yag_yakma", "Yağ Yakmak", null, "fire"],
      ["kas_kazanma", "Kas Kazanmak", null, "arm"],
      ["forma", "Forma Girmek", null, "bolt"],
      ["guclenme", "Güçlenmek", null, "gym"],
      ["saglik", "Daha Sağlıklı Yaşamak", null, "heartPulse"],
    ],
  },
  { id: "focus_areas", sec: "profil", kind: "focus", aside: "start", q: "Hangi bölgelere odaklanmak istersin?", hint: "Vücut üzerinden ya da aşağıdan seç." },
  { id: "info_start", sec: "profil", kind: "motivation", aside: "start" },
  { id: "age", sec: "profil", kind: "wheel", aside: "body", icon: "cake", q: "Kaç yaşındasın?", hint: "Yaşın kalori ihtiyacını ve önerileri şekillendirir.", unit: "yaş", min: 18, max: 90, step: 1, def: () => 28 },
  {
    id: "height",
    sec: "profil",
    kind: "wheel",
    aside: "body",
    icon: "height",
    q: "Boyun kaç?",
    unit: "cm",
    min: 120,
    max: 220,
    step: 1,
    def: (a) => (a.gender === "erkek" ? 177 : 164),
  },
  {
    id: "weight",
    sec: "profil",
    kind: "wheel",
    aside: "body",
    icon: "scale",
    q: "Kilon kaç?",
    unit: "kg",
    min: 30,
    max: 200,
    step: 0.5,
    def: (a) => (a.gender === "erkek" ? 80 : 65),
  },
  { id: "bmi", sec: "profil", kind: "bmi", aside: "body" },
  {
    id: "target_weight",
    sec: "profil",
    kind: "wheel",
    aside: "body",
    icon: "flag",
    q: "Hedef kilon kaç?",
    hint: "Hedefe ne zaman ulaşacağını hesaplayalım.",
    unit: "kg",
    min: 30,
    max: 200,
    step: 0.5,
    when: needsTarget,
    def: (a) => (goalCanon(a) === "lose_weight" ? Math.max(45, a.weight - 5) : a.weight + 4),
  },
  { id: "pace", sec: "profil", kind: "pace", aside: "body", when: (a) => needsTarget(a) && !!projection(a) },
  {
    id: "experience",
    sec: "antrenman",
    kind: "single",
    aside: "train",
    q: "Egzersiz deneyimin nedir?",
    options: [
      ["ilk_kez", "İlk kez başlıyorum", "Temelden, adım adım", "sprout"],
      ["ara_sira", "Ara sıra spor yapıyorum", "Ayda birkaç kez", "walk"],
      ["duzenli", "Düzenli spor yapıyorum", "Haftada birkaç kez", "run"],
      ["ileri", "İleri seviye", "Yıllardır antrenman yapıyorum", "trophy"],
    ],
  },
  { id: "performance", sec: "antrenman", kind: "performance", aside: "train", q: "Fiziksel performansın nasıl?", hint: "Seviyeni doğru belirlememize yardım eder. Bilmiyorsan geçebilirsin." },
  {
    id: "activity_level",
    sec: "antrenman",
    kind: "single",
    aside: "train",
    q: "Günlük aktivite seviyen nasıl?",
    options: [
      ["oturan", "Çoğunlukla oturuyorum", "Masa başı iş, az yürüyüş", "chair"],
      ["hafif", "Hafif aktifim", "Günde biraz yürüyüş", "walk"],
      ["aktif", "Aktifim", "Gün boyu ayaktayım", "run"],
      ["cok_aktif", "Çok aktifim", "Fiziksel iş veya yoğun spor", "bolt"],
    ],
  },
  {
    id: "weekly_days",
    sec: "antrenman",
    kind: "days",
    aside: "train",
    q: "Haftada kaç gün antrenman yapabilirsin?",
    hint: "Programın bu gün sayısına göre kurulur.",
    options: [
      ["d1_2", "1–2", "gün"],
      ["d3_4", "3–4", "gün"],
      ["d5_6", "5–6", "gün"],
      ["hergun", "Her", "gün"],
    ],
  },
  {
    id: "workout_location",
    sec: "antrenman",
    kind: "single",
    aside: "train",
    q: "Nerede antrenman yapacaksın?",
    options: [
      ["ev", "Evde", "Ekipmansız veya basit ekipmanla", "home"],
      ["salon", "Spor Salonunda", "Makineler ve serbest ağırlık", "gym"],
      ["ikisi", "Her İkisinde de", "Haftaya göre değişir", "swap"],
    ],
  },
  { id: "info_mid", sec: "antrenman", kind: "motivation", aside: "train" },
  {
    id: "diet_preference",
    sec: "beslenme",
    kind: "single",
    aside: "food",
    q: "Beslenme tercihin nedir?",
    options: [
      ["standart", "Standart", "Her şeyi yerim", "plate"],
      ["vejetaryen", "Vejetaryen", "Et yok, süt ve yumurta var", "salad"],
      ["vegan", "Vegan", "Hayvansal ürün yok", "sprout"],
      ["pesketaryen", "Pesketaryen", "Et yok, balık var", "fish"],
    ],
  },
  {
    id: "allergies",
    sec: "beslenme",
    kind: "multi",
    aside: "food",
    q: "Besin alerjin var mı?",
    hint: "Varsa öğünlerinden çıkaracağız.",
    grid: true,
    none: "none",
    def: ["none"],
    options: [
      ["none", "Yok", null, "checkCircle"],
      ["gluten", "Gluten", null, "wheat"],
      ["sut", "Süt ürünleri", null, "milk"],
      ["yumurta", "Yumurta", null, "egg"],
      ["kuruyemis", "Kuruyemiş", null, "nut"],
      ["deniz", "Deniz ürünleri", null, "shrimp"],
      ["soya", "Soya", null, "herb"],
    ],
  },
  { id: "name", sec: "beslenme", kind: "name", aside: "food", q: "Son olarak, sana nasıl hitap edelim?", hint: "Planını hazırlarken adınla hitap edeceğiz." },
  { id: "loading", kind: "loading", chrome: false },
  { id: "email", kind: "email", chrome: "minimal", aside: "result" },
  { id: "result", kind: "result", chrome: "minimal", wide: true },
  { id: "paywall", kind: "paywall", chrome: "minimal" },
  { id: "account", kind: "account", chrome: "minimal", aside: "result", when: () => CONFIG.authProvider !== "pending" },
  { id: "checkout", kind: "checkout", chrome: "minimal" },
  { id: "success", kind: "success", chrome: false },
];

const QUESTION_KINDS = new Set(["gender", "multi", "single", "days", "focus", "wheel", "performance", "name"]);

/* ============================================================ durum */

const fresh = () => ({ step: "intro", answers: {}, email: "", marketing: false, planId: null, user: null, paid: false });
let S = Object.assign(fresh(), storage.load() || {});
if (S.paid) S.step = "success";
let dir = "fwd";

const save = () => storage.save(S);
const stepById = (id) => STEPS.find((s) => s.id === id);
const visible = () => STEPS.filter((s) => !s.when || s.when(S.answers));
// "samed" → "Samed" (Türkçe kurallarıyla: "ilker" → "İlker").
const firstName = () => {
  const n = (S.answers.name || "").trim().split(/\s+/)[0] || "";
  return n ? n.charAt(0).toLocaleUpperCase("tr") + n.slice(1) : "";
};
const withName = (text, alt) => (firstName() ? `${firstName()}, ${text}` : alt);
const avatar = () => (S.answers.gender === "kadin" ? "avatar-female" : "avatar-male");

function next() {
  const list = visible();
  const i = list.findIndex((s) => s.id === S.step);
  go(list[Math.min(i + 1, list.length - 1)].id);
}

function go(id, { replace = false } = {}) {
  dir = "fwd";
  S.step = id;
  save();
  const d = history.state?.d || 0;
  if (replace) history.replaceState({ step: id, d }, "", `#${id}`);
  else history.pushState({ step: id, d: d + 1 }, "", `#${id}`);
  render();
}

// Sayfa yenilenince / geri dönen ziyaretçide geçmişte funnel adımı yok:
// history.back() kişiyi funnel'dan (reklama, ana sayfaya) atar. O zaman bir
// önceki görünür adıma git.
function back() {
  if (history.state?.d > 0) return history.back();
  const list = visible();
  const i = list.findIndex((s) => s.id === S.step);
  if (i > 0) {
    dir = "back";
    S.step = list[i - 1].id === "loading" ? list[i - 2].id : list[i - 1].id;
    save();
    history.replaceState({ step: S.step, d: 0 }, "", `#${S.step}`);
    render();
  }
}

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
window.addEventListener("hashchange", () => {
  const id = location.hash.slice(1);
  if (id && id !== S.step) restore(id);
});

/* ============================================================ çizim */

const app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const fmt = (n, d = 0) => Number(n).toLocaleString("tr-TR", { maximumFractionDigits: d, minimumFractionDigits: d });
const money = (n) => `${fmt(n, n % 1 ? 2 : 0)} ${CONFIG.currency}`;
const dateLong = (d) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });

const NEEDS_ANSWERS = new Set(["bmi", "pace", "result", "paywall", "account", "checkout"]);
const GUARDS = {
  result: () => (!S.email ? "email" : null),
  paywall: () => (!S.email ? "email" : null),
  account: () => (!S.email ? "email" : !S.planId ? "paywall" : S.user ? "checkout" : null),
  checkout: () =>
    !S.email ? "email" : !S.planId ? "paywall" : !S.user && CONFIG.authProvider !== "pending" ? "account" : null,
  success: () => (!S.paid ? (S.email ? "paywall" : "intro") : null),
};

function progress(step) {
  const qs = visible().filter((s) => s.sec);
  const curIdx = SECTIONS.findIndex(([k]) => k === step.sec);
  return SECTIONS.map(([key, label], secIdx) => {
    const inSec = qs.filter((s) => s.sec === key);
    const idx = inSec.findIndex((s) => s.id === step.id);
    const fill = secIdx < curIdx ? 1 : secIdx > curIdx ? 0 : (idx + 1) / inSec.length;
    return `<div class="seg${secIdx === curIdx ? " is-cur" : ""}${secIdx < curIdx ? " is-done" : ""}">
      <span class="seg__label">${secIdx < curIdx ? ai("check") : ""}${label}</span><span class="seg__bar"><i style="width:${fill * 100}%"></i></span>
    </div>`;
  }).join("");
}

// Yan panel kalıcı: her adımda yeniden çizilirse görsel siyahtan açılıp
// "kararıyordu". Görsel değişince yenisi eskisinin ÜSTÜNDE belirir (eski,
// yenisi tamamen görünene dek altında kalır), metin ayrıca yumuşakça değişir.
function asideData(step) {
  let [img, title, text] = ASIDE[step.aside];
  if (step.aside === "start" && S.answers.goal?.length) img = GOAL_IMG[goalCanon(S.answers)];
  return { img, title, text };
}

function paintAside(step) {
  const el = app.querySelector(".aside");
  if (!el || !step.aside) return;
  const { img, title, text } = asideData(step);

  if (el.dataset.img !== img) {
    el.dataset.img = img;
    const layer = document.createElement("div");
    layer.className = "aside__img";
    layer.style.backgroundImage = `url(${IMG(img)})`;
    el.insertBefore(layer, el.querySelector(".aside__copy"));
    layer.addEventListener("transitionend", (e) => {
      if (e.propertyName !== "opacity" || !layer.isConnected) return;
      // Yalnız bu katmanın altındakileri temizle; üstte daha yenisi olabilir.
      let prev = layer.previousElementSibling;
      while (prev) {
        const p = prev.previousElementSibling;
        if (prev.classList.contains("aside__img")) prev.remove();
        prev = p;
      }
    });
    const pre = new Image();
    pre.src = IMG(img);
    (pre.decode ? pre.decode() : Promise.resolve()).catch(() => {}).then(() =>
      requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add("is-in"))),
    );
  }

  const copy = el.querySelector(".aside__copy");
  if (copy.dataset.title === title) return;
  const first = !copy.dataset.title;
  copy.dataset.title = title;
  const fill = () => {
    copy.querySelector("h2").textContent = title;
    copy.querySelector("p").textContent = text;
    copy.classList.remove("is-out");
  };
  if (first) return fill();
  copy.classList.add("is-out");
  setTimeout(fill, 220);
}

const asideShell = () => `<aside class="aside" aria-hidden="true">
    <div class="aside__copy">
      <img src="/assets/brand/logo.svg?v=20260830b" alt="" width="120" height="22" />
      <h2></h2>
      <p></p>
      <ul>
        <li>${ai("playCircle")}176 videolu egzersiz</li>
        <li>${ai("menuFood")}100+ tarif</li>
        <li>${ai("chat")}7/24 AI koç</li>
      </ul>
    </div>
  </aside>`;

// Geniş ekranda yan panel görsellerini baştan indir: geçişte boş kare olmasın.
if (matchMedia("(min-width: 1024px)").matches) {
  [...Object.values(ASIDE).map(([img]) => img), ...Object.values(GOAL_IMG)].forEach((img) => {
    new Image().src = IMG(img);
  });
}

// Tek ekran: soru adımlarında sayfa kaydırma istemiyoruz. Her görünümde bir
// esnek öğe var (data-fit="en küçük px"); sayfa taşarsa o öğe taşan kadar
// küçülür. CSS ölçüyü --fit değişkeninden okur. Uzun sayfalarda (sonuç,
// paywall, ödeme) data-fit yok; orada düğme yapışkan dock'ta görünür kalır.
function fit() {
  const el = app.querySelector("[data-fit]");
  if (!el) return;
  const min = Number(el.dataset.fit ?? 120);
  // data-fit-to: sayfa uzun olabilir (paywall); yalnız o öğe dock'un üstünde
  // görünsün yeter.
  const target = el.dataset.fitTo && app.querySelector(el.dataset.fitTo);
  const dock = app.querySelector(".dock");
  const overflow = () =>
    target
      ? Math.ceil(target.getBoundingClientRect().bottom + scrollY - (innerHeight - (dock?.offsetHeight || 0)))
      : document.scrollingElement.scrollHeight - innerHeight;
  el.style.removeProperty("--fit");
  // Küçültme her zaman taşmayı bire bir azaltmıyor (ortalama, sarılan
  // satırlar); birkaç turda yakınsar.
  for (let i = 0; i < 4; i++) {
    const over = overflow();
    const h = el.getBoundingClientRect().height;
    if (over <= 0 || h <= min) break;
    let v = Math.max(min, Math.floor(h - over));
    if (min === 0 && v < 110) v = 0; // süs görseli: kırıntı bırakma, hiç gösterme
    el.style.setProperty("--fit", `${v}px`);
  }
  el.dispatchEvent(new Event("fit"));
}
let fitTimer;
addEventListener("resize", () => {
  clearTimeout(fitTimer);
  fitTimer = setTimeout(fit, 120);
});
// Yazı tipi geç gelirse satırlar uzar: yüklenince yeniden ölç.
document.fonts?.addEventListener?.("loadingdone", fit);
document.fonts?.ready.then(fit);

function render({ quiet = false } = {}) {
  const step = stepById(S.step) || STEPS[0];
  if (step.when && !step.when(S.answers)) return dir === "back" ? history.back() : next();
  if (NEEDS_ANSWERS.has(step.id) && !dailyTargets(S.answers)) return go("intro", { replace: true });
  // Adres çubuğundan ileri adıma atlanmasın (#success yazıp "Premium'un aktif"
  // görmek gibi). Önkoşulu eksikse o önkoşulu toplayan adıma dön.
  const guard = GUARDS[step.id]?.();
  if (guard) return go(guard, { replace: true });

  const qs = visible().filter((s) => QUESTION_KINDS.has(s.kind));
  const qi = qs.findIndex((s) => s.id === step.id);

  const chrome =
    step.chrome === false
      ? ""
      : `<header class="top">
          <div class="top__row">
            <button class="top__back" type="button" aria-label="Geri" data-back>${ai("chevronLeft")}</button>
            <img class="top__logo" src="/assets/brand/logo.svg?v=20260830b" alt="Healife" width="112" height="21" />
            <span class="top__count">${qi >= 0 ? `<span class="sr">Soru </span>${qi + 1}/${qs.length}` : ""}</span>
          </div>
          ${step.sec ? `<div class="segs" aria-hidden="true">${progress(step)}</div>` : ""}
        </header>`;

  const hasAside = !!step.aside;
  app.className = `funnel funnel--${step.kind}${step.wide ? " funnel--wide" : ""}${hasAside ? " has-aside" : ""}`;
  if (!app.querySelector(":scope > .main")) app.innerHTML = `${asideShell()}<div class="main"></div>`;
  app.querySelector(":scope > .main").innerHTML =
    `${chrome}<main class="stage" id="stage"><div class="stage__inner">${VIEWS[step.kind](step)}</div></main>`;
  paintAside(step);
  fit();

  app.querySelector("[data-back]")?.addEventListener("click", back);
  BIND[step.kind]?.(step);
  if (quiet) return;
  window.scrollTo(0, 0);
  app.querySelector(".stage__inner").classList.add(dir === "back" ? "enter-back" : "enter");
  document.title = step.q ? `${step.q} · Healife` : "Healife — Sana özel planını oluştur";
  track("step_view", { step: step.id });
}

const head = (step, q = step.q, hint = step.hint) =>
  `<header class="qhead"><h1 class="q">${esc(q)}</h1>${hint ? `<p class="hint">${esc(hint)}</p>` : ""}</header>`;

const cta = (label, attrs = "", icon = "arrowRight") =>
  `<div class="dock"><button class="btn btn--primary btn--block" type="button" data-next ${attrs}>${label}${icon ? ai(icon) : ""}</button></div>`;

const optCard = ({ id, label, sub, icon, on, multi, badge }) => `
  <button class="opt${on ? " is-on" : ""}" type="button" data-val="${id}" ${multi ? `aria-pressed="${on}"` : `role="radio" aria-checked="${on}"`}>
    ${icon ? ai(icon, "opt__ic") : ""}
    <span class="opt__txt"><b>${label}</b>${badge ? `<span class="opt__badge">${badge}</span>` : ""}${sub ? `<small>${sub}</small>` : ""}</span>
    ${on ? ai(multi ? "check" : "arrowRight", "opt__end") : `<span class="opt__mark${multi ? " is-box" : ""}"></span>`}
  </button>`;

/* ------------------------------------------------------------ görünümler */

const VIEWS = {
  intro: () => `
    <section class="intro">
      <img class="intro__logo" src="/assets/brand/logo.svg?v=20260830b" alt="Healife" width="132" height="25" />
      <div class="intro__grid">
        <div class="intro__art" aria-hidden="true" data-fit="150">
          <div class="intro__glow"></div>
          <img class="intro__fig" src="${IMG("hero-runner")}" alt="" width="551" height="680" fetchpriority="high" />
          <div class="float float--a">${ai("fire")}<div><b>1.850 kcal</b><span>günlük hedef</span></div></div>
          <div class="float float--b">${ai("calendarCheck")}<div><b>Haftada 4 gün</b><span>antrenman</span></div></div>
          <div class="float float--c">${ai("trendingUp")}<div><b>Kişisel plan</b><span>sana göre</span></div></div>
        </div>
        <div class="intro__copy">
          <span class="pill">${ai("sparkle")}2 dakikalık kişisel test</span>
          <h1 class="display">Sana özel antrenman ve <em>beslenme planı.</em></h1>
          <p class="lead">Birkaç soruyu cevapla; kalori ihtiyacını, antrenman seviyeni ve haftalık programını hemen hesaplayalım.</p>
          <button class="btn btn--primary btn--xl" type="button" data-next>Teste başla${ai("arrowRight")}</button>
          <ul class="intro__facts">
            <li>${ai("playCircle")}<div><b>176</b><span>videolu egzersiz</span></div></li>
            <li>${ai("menuFood")}<div><b>100+</b><span>tarif</span></div></li>
            <li>${ai("chat")}<div><b>7/24</b><span>AI koç</span></div></li>
          </ul>
        </div>
      </div>
    </section>`,

  gender: (step) => `
    ${head(step)}
    <div class="gender" role="radiogroup" data-fit="190">
      ${[
        ["erkek", "Erkek", "avatar-male"],
        ["kadin", "Kadın", "avatar-female"],
      ]
        .map(
          ([id, label, img]) => `
        <button class="gcard${S.answers.gender === id ? " is-on" : ""}" type="button" role="radio" aria-checked="${S.answers.gender === id}" data-val="${id}">
          <span class="gcard__img"><img src="${IMG(img)}" alt="" width="520" height="775" /></span>
          <span class="gcard__label">${label}</span>
        </button>`,
        )
        .join("")}
    </div>
    <button class="link${S.answers.gender === "belirtmek_istemiyorum" ? " is-on" : ""}" type="button" data-val="belirtmek_istemiyorum">Belirtmek istemiyorum</button>`,

  single: (step) => `
    ${head(step)}
    <div class="opts" role="radiogroup">
      ${step.options.map(([id, label, sub, icon]) => optCard({ id, label, sub, icon, on: S.answers[step.id] === id })).join("")}
    </div>`,

  days: (step) => `
    ${head(step)}
    <div class="days" role="radiogroup">
      ${step.options
        .map(
          ([id, n, u]) => `
        <button class="day${S.answers[step.id] === id ? " is-on" : ""}" type="button" role="radio" aria-checked="${S.answers[step.id] === id}" data-val="${id}">
          <b>${n}</b><span>${u}</span>
        </button>`,
        )
        .join("")}
    </div>`,

  multi: (step) => {
    const sel = S.answers[step.id] ?? step.def ?? [];
    return `
    ${head(step)}
    <div class="opts${step.grid ? " opts--grid" : ""}">
      ${step.options
        .map(([id, label, sub, icon]) =>
          optCard({ id, label, sub, icon, on: sel.includes(id), multi: true, badge: step.ordered && sel[0] === id && sel.length > 1 ? "Ana hedef" : "" }),
        )
        .join("")}
    </div>
    ${cta("Devam", sel.length ? "" : "disabled")}`;
  },

  focus: (step) => {
    const sel = S.answers.focus_areas || [];
    return `
    <header class="qhead"><h1 class="q">${esc(step.q)}</h1><p class="hint hint--tap">${ai("tap")}Kaslara dokun ya da aşağıdan seç.</p></header>
    <div class="atlas${sel.length ? " has-sel" : ""}" id="atlas" data-fit="150">
      <div class="atlas__fig" data-view="front"><span class="atlas__tag">Ön</span></div>
      <div class="atlas__fig" data-view="back"><span class="atlas__tag">Arka</span></div>
    </div>
    <div class="chips">
      ${Object.entries(FOCUS_LABEL)
        .map(([id, label]) => `<button class="chip${sel.includes(id) ? " is-on" : ""}" type="button" data-val="${id}" aria-pressed="${sel.includes(id)}">${label}</button>`)
        .join("")}
    </div>
    <p class="credit">Anatomi çizimi: Ryan Graves, CC BY 4.0</p>
    ${cta("Devam", sel.length ? "" : "disabled")}`;
  },

  motivation: (step) => {
    const a = S.answers;
    const mid = step.id === "info_mid";
    const lv = trainingLevel(a);
    const recap = mid
      ? [`Seviye: ${lv.label}`, `Haftada ${lv.days} gün antrenman`, `Yer: ${{ ev: "Evde", salon: "Spor salonunda", ikisi: "Ev + salon" }[a.workout_location] || "—"}`]
      : [
          `Hedefin: ${GOAL_LABEL[mainGoal(a)]}`,
          a.goal?.length > 1 ? `Ek hedefler: ${a.goal.slice(1).map((g) => GOAL_LABEL[g]).join(", ")}` : null,
          a.focus_areas?.length ? `Odak: ${a.focus_areas.map((f) => FOCUS_LABEL[f]).join(", ")}` : null,
        ].filter(Boolean);
    const img = mid ? "hero-abs" : GOAL_IMG[goalCanon(a)];
    return `
    <section class="moti">
      <div class="moti__art${mid ? " is-alpha" : ""}" data-fit="110"><img src="${IMG(img)}" alt="" /></div>
      <span class="moti__phase">${mid ? "Devam ediyoruz · %55" : "Başlıyoruz! · %25"}</span>
      <h1 class="q">${mid ? "Sana özel sistemi oluşturuyorum" : "Profilini tanımaya başlıyorum"}</h1>
      <p class="hint">${
        mid
          ? "Antrenman alışkanlıklarını analiz ettim. Şimdi beslenme tercihlerini öğrenip planını tamamlıyorum."
          : "Hedeflerini analiz ettim. Şimdi vücudunu ve yaşam tarzını öğrenerek sana daha doğru öneriler hazırlayacağım."
      }</p>
      <ul class="recap">${recap.map((r) => `<li>${ai("checkCircle")}${esc(r)}</li>`).join("")}</ul>
    </section>
    ${cta("Devam")}`;
  },

  wheel: (step) => {
    const n = Math.round((step.max - step.min) / step.step);
    const items = Array.from({ length: n + 1 }, (_, i) => step.min + i * step.step);
    return `
    ${head(step)}
    <div class="wheelbox">
      <div class="wheelbox__badge">${ai(step.icon)}</div>
      <div class="wheel" data-fit="170">
        <div class="wheel__band" aria-hidden="true"><span class="wheel__unit">${step.unit}</span></div>
        <div class="wheel__list" id="wheel" tabindex="0" role="listbox" aria-label="${esc(step.q)}">
          <div class="wheel__pad"></div>
          ${items.map((x) => `<div class="wheel__item" role="option" data-v="${x}">${fmt(x, step.step < 1 ? 1 : 0)}</div>`).join("")}
          <div class="wheel__pad"></div>
        </div>
      </div>
      <p class="num__note" id="numNote" aria-live="polite"></p>
    </div>
    ${cta("Devam")}`;
  },

  bmi: () => {
    const b = bmiInfo(S.answers.weight, S.answers.height);
    const pos = Math.min(100, Math.max(0, ((b.value - 15) / (40 - 15)) * 100));
    return `
    <section class="bmi">
      ${head({}, "Vücut analizin", "Boy ve kilona göre vücut kitle indeksin (VKİ).")}
      <div class="card bmi__card">
        <div class="bmi__top">
          <div class="bmi__ic">${ai("body")}</div>
          <div class="bmi__main"><small>VKİ</small><div class="bmi__val">${fmt(b.value, 1)}</div></div>
          <span class="bmi__cat" style="--c:${b.color}">${b.label}</span>
        </div>
        <div class="gauge"><div class="gauge__bar"></div><span class="gauge__pin" style="left:${pos}%"></span></div>
        <div class="gauge__lbl"><span>Zayıf</span><span>Normal</span><span>Fazla</span><span>Obez</span></div>
        <div class="bmi__range">${ai("target")}<span>Sağlıklı kilo aralığın</span><b>${b.min}–${b.max} kg</b></div>
      </div>
      <div class="tip">${ai("info")}<p>${b.note}</p></div>
      <p class="fine center">VKİ kas kütlesini ayırt etmez; sporcularda yüksek çıkabilir. Tıbbi bir değerlendirme değildir.</p>
    </section>
    ${cta("Devam")}`;
  },

  pace: () => {
    const p = projection(S.answers);
    const lose = p.to < p.from;
    const perWeek = Math.abs(p.to - p.from) / p.weeks;
    return `
    <section class="pace">
      <header class="qhead">
        <span class="eyebrow">Gerçekçi bir hedef</span>
        <h1 class="q">${fmt(Math.abs(p.to - p.from), 1)} kg ${lose ? "vermek" : "almak"} için tahmini tarih</h1>
        <div class="pace__date">${ai("calendarCheck")}${dateLong(p.end)}</div>
      </header>
      <div class="card pace__chart" data-fit="130">${projectionChart(p)}</div>
      <ul class="ticks">
        <li>${ai("checkCircle")}<span>Haftada yaklaşık <b>${fmt(perWeek, 2)} kg</b> — ${lose ? "kas kaybetmeden yağ yakmaya uygun" : "yağlanmayı sınırlayan"} bir hız</span></li>
        <li>${ai("checkCircle")}<span>Planın ilerlemene göre güncellenir</span></li>
        <li>${ai("checkCircle")}<span>Hızlı diyetlerin aksine kalıcı olması hedeflenir</span></li>
      </ul>
      <p class="fine center">Tahmindir; kişiden kişiye değişir.</p>
    </section>
    ${cta("Devam")}`;
  },

  performance: (step) => `
    ${head(step)}
    <div class="perf">
      ${[
        ["squats", "Squat", "Ağırlıksız, tek sette durmadan kaç tekrar?", "örn. 15", "standing"],
        ["pullups", "Barfiks", "Barda, tek sette kaç tekrar?", "örn. 5", "pullupBar"],
      ]
        .map(
          ([k, t, d, ph, ic]) => `
        <label class="pfield">
          ${ai(ic, "pfield__ic")}
          <span class="pfield__txt"><b>${t}</b><small>${d}</small></span>
          <span class="pfield__in"><input type="number" inputmode="numeric" min="0" max="200" data-k="${k}" placeholder="${ph}" value="${S.answers[k] ?? ""}" /><em>tekrar</em></span>
        </label>`,
        )
        .join("")}
    </div>
    <div class="dock dock--2">
      <button class="btn btn--ghost" type="button" data-skip>Bilmiyorum</button>
      <button class="btn btn--primary" type="button" data-next>Devam${ai("arrowRight")}</button>
    </div>`,

  name: (step) => `
    ${head(step)}
    <form id="nameForm" class="grow" novalidate>
      <label class="field">
        ${ai("person", "field__ic")}
        <span class="sr">Adın</span>
        <input id="nameInput" type="text" autocomplete="given-name" autocapitalize="words" maxlength="40" placeholder="Adın" value="${esc(S.answers.name)}" />
      </label>
      <div class="dock dock--2">
        <button class="btn btn--ghost" type="button" data-skip>Geç</button>
        <button class="btn btn--primary" type="submit">Devam${ai("arrowRight")}</button>
      </div>
    </form>`,

  loading: () => `
    <section class="loading">
      <div class="ring" style="--p:0">
        <svg viewBox="0 0 120 120"><circle class="ring__bg" cx="60" cy="60" r="52"/><circle class="ring__fg" cx="60" cy="60" r="52"/></svg>
        <b id="ringPct">0%</b>
      </div>
      <h1 class="q">${firstName() ? `${esc(firstName())}, planın hazırlanıyor` : "Planın hazırlanıyor"}</h1>
      <ul class="checks" id="checks">
        ${[
          ["fire", "Kalori ihtiyacın hesaplanıyor"],
          ["level", "Antrenman seviyen belirleniyor"],
          ["calendar", "Haftalık programın kuruluyor"],
          ["menuFood", "Beslenme menün hazırlanıyor"],
        ]
          .map(([ic, t]) => `<li>${ai(ic, "checks__ic")}<span>${t}</span>${ai("checkCircle", "checks__ok")}</li>`)
          .join("")}
      </ul>
    </section>`,

  email: () => `
    <section class="email">
      <div class="badge-ok">${ai("checkCircle")}</div>
      ${head({}, withName("planın hazır!", "Planın hazır!"), "Planını görmek için e-posta adresini gir. Satın alırsan fatura ve abonelik bilgilerin bu adrese gelir.")}
      <form id="emailForm" class="grow" novalidate>
        <label class="field">
          ${ai("send", "field__ic")}
          <span class="sr">E-posta</span>
          <input id="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="ornek@eposta.com" value="${esc(S.email)}" required />
        </label>
        <button class="suggest" type="button" id="suggest" hidden></button>
        <p class="err" id="emailErr" hidden>Geçerli bir e-posta adresi gir.</p>
        ${
          CONFIG.collectLeads
            ? `<label class="optin">
          <input type="checkbox" id="marketing" ${S.marketing ? "checked" : ""} />
          <span>Kampanya ve ipuçlarını ticari elektronik ileti olarak e-postayla almak istiyorum; iznimi istediğim an geri alabilirim. <small>(isteğe bağlı)</small></span>
        </label>`
            : ""
        }
        <p class="fine">${ai("lock")} Spam yok. Devam ederek <a href="${CONFIG.legal.terms}" target="_blank" rel="noopener">Kullanım Koşulları</a>'nı kabul etmiş ve <a href="${CONFIG.legal.privacy}" target="_blank" rel="noopener">Gizlilik Politikası</a> ile <a href="${CONFIG.legal.kvkk}" target="_blank" rel="noopener">KVKK Aydınlatma Metni</a>'ni okumuş olursun.</p>
        <div class="dock"><button class="btn btn--primary btn--block" type="submit">Planımı göster${ai("arrowRight")}</button></div>
      </form>
    </section>`,

  result: () => resultView(),
  paywall: () => paywallView(),

  account: () => {
    // Uygulamada Apple ile giriş yalnız iPhone'da var (login_screen.dart).
    // Android'de Apple ile hesap açan kişi uygulamaya giremez → Android'de
    // yalnız Google; masaüstünde ikisi de, altında uyarıyla.
    const { android, ios } = device();
    const apple = `<button class="btn btn--apple btn--block" type="button" data-auth="apple">${BRAND.apple}Apple ile devam et</button>`;
    const google = `<button class="btn btn--google btn--block" type="button" data-auth="google">${BRAND.google}Google ile devam et</button>`;
    return `
    <section class="account">
      <div class="badge-ok">${ai("personOutline")}</div>
      ${head({}, "Hesabını oluştur", "Aboneliğin bu hesaba bağlanacak. Uygulamayı indirdiğinde aynı yöntemle giriş yapman yeterli.")}
      <div class="auth">
        ${android ? google : ios ? apple + google : google + apple}
      </div>
      ${!android && !ios ? `<p class="fine center">Telefonun Android ise <b>Google</b> ile devam et; Apple ile giriş uygulamada yalnızca iPhone'da var.</p>` : ""}
      <p class="err" id="authErr" hidden></p>
      <div class="tip">${ai("shieldCheck")}<p>Şifre yok, ekstra form yok. E-postan: <b>${esc(S.email)}</b></p></div>
      ${legalFoot()}
    </section>`;
  },

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
    <text x="${x0}" y="${y(p.from) - 14}" class="chart__v">${fmt(p.from, 1)} kg</text>
    <text x="${x1}" y="${y(p.to) - 14}" class="chart__v chart__v--end" text-anchor="end">${fmt(p.to, 1)} kg</text>
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
  ["Kahvaltı", 0.25, "sunrise"],
  ["Öğle", 0.35, "sun"],
  ["Ara öğün", 0.1, "glass"],
  ["Akşam", 0.3, "moon"],
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
  // Hedef sonradan "forma/sağlık"a dönerse eski hedef kilo kalmasın.
  const pr = needsTarget(a) ? projection(a) : null;
  const days = SPLIT_DAYS[lv.days];
  const kc = { p: t.protein * 4, c: t.carbs * 4, f: t.fat * 9 };
  const tot = kc.p + kc.c + kc.f;
  let mealSum = 0;
  const meals = MEALS.map(([n, r, ic], i) => {
    const v = i === MEALS.length - 1 ? t.calories - mealSum : Math.round((t.calories * r) / 10) * 10;
    mealSum += v;
    return [n, v, ic];
  });
  const diet = DIET[a.diet_preference];
  const allergic = a.allergies?.length && !a.allergies.includes("none");

  return `
  <section class="result">
    <header class="qhead">
      <span class="eyebrow">Kişisel planın</span>
      <h1 class="q">${esc(withName(`${GOAL_LABEL[mainGoal(a)].toLowerCase()} için planın hazır.`, `${GOAL_LABEL[mainGoal(a)]} için planın hazır.`))}</h1>
    </header>

    <div class="grid">
      ${
        pr
          ? `<article class="card card--hero">
              <div class="hero__copy">
                <div class="card__t">${ai("calendarCheck")}Tahmini hedef tarihi</div>
                <div class="big">${dateLong(pr.end)}</div>
                <p class="fine">${fmt(pr.from, 1)} kg → ${fmt(pr.to, 1)} kg · haftada ~${fmt(Math.abs(pr.to - pr.from) / pr.weeks, 2)} kg. Tahmindir.</p>
              </div>
              ${projectionChart(pr)}
            </article>`
          : ""
      }
      <article class="card">
        <div class="card__t">${ai("fire")}Günlük kalori hedefin</div>
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
        <div class="card__t">${ai("dumbbell")}Antrenman programın</div>
        <div class="big">Haftada ${lv.days} gün</div>
        <div class="week">${DAY_NAMES.map((n, i) => `<span class="${days.includes(i) ? "on" : ""}">${n}</span>`).join("")}</div>
        <ul class="kv">
          <li>Seviye <b>${lv.label}</b></li>
          <li>Yer <b>${LOCATION[a.workout_location] || "—"}</b></li>
          ${a.focus_areas?.length ? `<li>Odak <b>${a.focus_areas.map((f) => FOCUS_LABEL[f]).slice(0, 3).join(", ")}</b></li>` : ""}
        </ul>
      </article>
      <article class="card card--meals">
        <div class="card__t">${ai("menuFood")}Örnek bir gün</div>
        <ul class="meals">${meals.map(([n, v, ic]) => `<li>${ai(ic)}<span>${n}</span><b>${fmt(v)} kcal</b></li>`).join("")}</ul>
        <p class="fine">Öğünlerin${diet ? ` ${diet}` : ""} menülerden${allergic ? ", alerjilerin çıkarılarak" : ""} uygulamada hazırlanır.</p>
      </article>
    </div>

    <h2 class="sub">Uygulamada seni bekleyenler</h2>
    <div class="shots" tabindex="0" aria-label="Uygulama ekran görüntüleri">
      ${APP_SHOTS.map(([f, c]) => `<figure class="shot"><img src="/assets/screens/app/${f}.webp" alt="${c}" loading="lazy" width="560" height="1218" /><figcaption>${c}</figcaption></figure>`).join("")}
    </div>
  </section>
  ${cta("Planımı aç")}`;
}

/* ------------------------------------------------------------ paywall */

const FEATURES = [
  ["calendarCheck", "Sana özel antrenman ve beslenme planı"],
  ["playCircle", "176 egzersiz, videolu anlatım"],
  ["scan", "Fotoğraftan kalori hesaplama"],
  ["chat", "7/24 AI koç"],
  ["menuFood", "100+ tarif, takip ve hatırlatıcılar"],
];

const FAQ = [
  ["Aboneliğimi nasıl iptal ederim?", "Web'den başlattığın aboneliği info@hea-life.com adresine yazarak istediğin zaman iptal edebilirsin. İptal ettiğinde ödediğin dönemin sonuna kadar premium açık kalır, sonra yenilenmez."],
  ["Uygulamayı nasıl kullanacağım?", "Ödemeden sonra Healife'ı App Store veya Google Play'den indir ve burada kullandığın Apple ya da Google hesabıyla giriş yap. Planın ve premium hazır olur."],
  ["Planım nasıl hazırlanıyor?", "Kalori hedefin yaş, boy, kilo, cinsiyet ve aktivite seviyene göre Mifflin-St Jeor formülüyle hesaplanır. Antrenman seviyen deneyim ve performans cevaplarınla belirlenir; program hedefine ve gün sayına göre seçilir."],
  ["Ödeme güvenli mi?", "Ödemeler PayTR altyapısıyla 3D Secure üzerinden alınır. Kart bilgilerin Healife'a ulaşmaz, saklanmaz."],
];

// Sitedeki "Ücretsiz başla" / "İndir" de funnel'ı açıyor; ödemek istemeyen
// kişi paywall'da takılmasın — indirme sayfasına (UTM'lerle) gider.
const freeUrl = () => {
  const q = new URLSearchParams(S.utm || {}).toString();
  return `/indir.html${q ? `?${q}` : ""}`;
};

function paywallView() {
  const plans = CONFIG.plans;
  if (!S.planId) S.planId = (plans.find((p) => p.preselected) || plans[0]).id;
  const maxPerWeek = Math.max(...plans.map((p) => p.price / p.weeks));
  return `
  <section class="paywall">
    <div class="pw-hero" aria-hidden="true" data-fit="0" data-fit-to=".plans">
      <div class="pw-hero__glow"></div>
      <img src="${IMG(avatar())}" alt="" class="pw-hero__img" />
    </div>
    <header class="qhead">
      <h1 class="q">${esc(withName("planın hazır.", "Planın hazır."))}</h1>
      <p class="hint">Tam erişimi aç, bugün başla.</p>
    </header>
    <ul class="pw-incl" aria-label="Premium'a dahil">
      <li>${ai("calendarCheck")}Kişisel plan</li>
      <li>${ai("chat")}7/24 AI koç</li>
      <li>${ai("playCircle")}176 videolu egzersiz</li>
    </ul>

    <div class="plans" role="radiogroup" aria-label="Abonelik seçenekleri">
      ${plans
        .map((p) => {
          const perWeek = p.price / p.weeks;
          const save = Math.round((1 - perWeek / maxPerWeek) * 100);
          const on = p.id === S.planId;
          return `
        <button class="plan${on ? " is-on" : ""}" type="button" role="radio" aria-checked="${on}" data-plan="${p.id}">
          ${p.badge ? `<span class="plan__badge">${p.badge}</span>` : ""}
          <span class="plan__radio">${on ? ai("check") : ""}</span>
          <span class="plan__main"><b>${p.title}</b><small>${p.id === "weekly" ? "Her hafta yenilenir" : `Haftada ${money(Math.round(perWeek * 100) / 100)}'ye denk`}</small></span>
          <span class="plan__per">${save >= 10 ? `<em>haftalığa göre %${save} tasarruf</em>` : ""}<b>${money(p.price)}</b><small>/ ${UNIT[p.id] || p.periodLabel}</small></span>
        </button>`;
        })
        .join("")}
    </div>

    <ul class="trust">
      <li>${ai("shieldCheck")}Güvenli ödeme</li>
      <li>${ai("close")}İstediğin zaman iptal</li>
      <li>${ai("bolt")}Anında erişim</li>
    </ul>

    <h2 class="sub">Premium'da neler var?</h2>
    <ul class="feats">${FEATURES.map(([ic, f]) => `<li>${ai(ic)}<span>${f}</span></li>`).join("")}</ul>

    <h2 class="sub">Sık sorulan sorular</h2>
    <div class="faq">
      ${FAQ.map(([q, ans]) => `<details><summary>${q}${ai("chevronDown")}</summary><p>${ans}</p></details>`).join("")}
    </div>

    <p class="fine center legal">Abonelik, iptal edene kadar seçtiğin dönem sonunda aynı ücretle otomatik yenilenir. Devam ederek <a href="${CONFIG.legal.terms}" target="_blank" rel="noopener">Kullanım Koşulları</a>'nı kabul edersin.</p>
    ${legalFoot()}
  </section>
  <div class="dock dock--pw">
    <p class="pw-total">${(() => {
      const p = plans.find((x) => x.id === S.planId) || plans[0];
      return `Bugün <b>${money(p.price)}</b> · ${p.periodLabel} yenilenir · istediğin zaman iptal`;
    })()}</p>
    <button class="btn btn--primary btn--block" type="button" data-next>Devam et${ai("arrowRight")}</button>
    <a class="free-link" href="${freeUrl()}" data-free>Şimdilik ücretsiz sürümle devam et</a>
  </div>`;
}

/* ------------------------------------------------------------ ödeme */

// Satın alma adımlarının altındaki yasal bilgi: satıcı kimliği + sözleşmeler.
// Ödeme kuruluşları ve tüketici mevzuatı bunları satış sayfasında arar.
const legalFoot = () => `
  <footer class="lfoot">
    <nav>
      <a href="${CONFIG.legal.terms}" target="_blank" rel="noopener">Kullanım Koşulları</a>
      <a href="${CONFIG.legal.privacy}" target="_blank" rel="noopener">Gizlilik</a>
      <a href="${CONFIG.legal.kvkk}" target="_blank" rel="noopener">KVKK</a>
      <a href="${CONFIG.legal.preInfo}" target="_blank" rel="noopener">Ön Bilgilendirme</a>
      <a href="${CONFIG.legal.distanceSale}" target="_blank" rel="noopener">Mesafeli Satış</a>
      <a href="/hakkimizda.html" target="_blank" rel="noopener">Hakkımızda</a>
      <a href="/iletisim.html" target="_blank" rel="noopener">İletişim</a>
    </nav>
    <p>${CONFIG.seller.name}<br />${CONFIG.seller.address} · ${CONFIG.seller.tax}<br />MERSİS ${CONFIG.seller.mersis} · Ticaret Sicil No ${CONFIG.seller.registry}<br /><a href="tel:${CONFIG.seller.phone.replace(/\s/g, "")}">${CONFIG.seller.phone}</a> · <a href="mailto:${CONFIG.seller.email}">${CONFIG.seller.email}</a></p>
  </footer>`;

// Sonraki tahsilat tarihi (otomatik yenileme), plan dönemine göre.
function renewDate(plan) {
  const d = new Date();
  if (plan.id === "yearly") d.setFullYear(d.getFullYear() + 1);
  else if (plan.id === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setDate(d.getDate() + 7);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

const UNIT = { yearly: "yıl", monthly: "ay", weekly: "hafta" };

function checkoutView() {
  const p = CONFIG.plans.find((x) => x.id === S.planId) || CONFIG.plans[0];
  const via = !S.user ? null : S.user.method === "apple" ? ["apple", "Apple hesabı"] : ["google", "Google hesabı"];
  const email = S.user?.email || S.email;
  return `
  <section class="checkout">
    <div class="co">
      <aside class="co__sum" aria-label="Sipariş özeti">
        <span class="eyebrow">Sipariş özeti</span>
        <div class="co__prod">
          <span class="co__ic">${ai("starFill")}</span>
          <div><b>Healife Premium</b><small>${p.title} abonelik</small></div>
        </div>
        <div class="co__price"><b>${money(p.price)}</b><span>/ ${UNIT[p.id] || p.periodLabel}</span></div>
        <dl class="co__lines">
          <div><dt>Healife Premium · ${p.title}</dt><dd>${money(p.price)}</dd></div>
          <div><dt>KDV</dt><dd>Fiyata dâhil</dd></div>
          <div class="is-total"><dt>Bugün ödenecek</dt><dd>${money(p.price)}</dd></div>
        </dl>
        <p class="co__renew">${ai("refresh")}<span>Abonelik <b>${renewDate(p)}</b> tarihinde ${money(p.price)} ile yenilenir. İstediğin zaman iptal edebilirsin.</span></p>
        <ul class="co__incl">
          <li>${ai("check")}Sana özel antrenman ve beslenme planı</li>
          <li>${ai("check")}Sınırsız AI koç ve fotoğrafla kalori hesaplama</li>
          <li>${ai("check")}176 videolu egzersiz, 100+ tarif</li>
        </ul>
        <button class="co__change" type="button" data-change>Planı değiştir</button>
      </aside>

      <div class="co__form">
        <h1 class="co__title">Ödeme</h1>
        <div class="co__acct">
          ${
            via
              ? `<span class="co__acct-ic">${BRAND[via[0]]}</span>
          <div><small>${via[1]}</small><b>${esc(email || "—")}</b></div>
          ${ai("checkCircle", "co__acct-ok")}`
              : `<span class="co__acct-ic co__acct-ic--mail">${ai("send")}</span>
          <div><small>Fatura ve abonelik e-postası</small><b>${esc(email || "—")}</b></div>`
          }
        </div>
        <label class="optin optin--legal">
          <input type="checkbox" id="legalOk" />
          <span><a href="${CONFIG.legal.preInfo}" target="_blank" rel="noopener">Ön Bilgilendirme Formu</a>'nu ve <a href="${CONFIG.legal.distanceSale}" target="_blank" rel="noopener">Mesafeli Satış Sözleşmesi</a>'ni okudum, kabul ediyorum. Aboneliğin ödemeyle birlikte hemen başlamasını ve bu nedenle cayma hakkımın sona ereceğini onaylıyorum.</span>
        </label>
        <div class="pay" id="pay"><div class="pay__loading"><span class="spin"></span>Güvenli ödeme formu yükleniyor…</div></div>
        <div class="co__secure">
          <span>${ai("lockFill")}PayTR güvencesiyle · 256-bit SSL · 3D Secure</span>
          <span class="cards" aria-label="Kabul edilen kartlar"><i class="card-mark card-mark--visa">VISA</i><i class="card-mark card-mark--mc"><b></b><b></b></i><i class="card-mark card-mark--troy">troy</i></span>
        </div>
        <div class="dock dock--pay" id="payDock" hidden>
          <p class="err" id="payErr" hidden>Devam etmek için sözleşme onayını işaretle.</p>
          <button class="btn btn--primary btn--block is-dim" type="button" id="demoPay">${ai("lock")}${money(p.price)} öde</button>
          <div class="soon" id="soon" hidden>
            ${ai("info")}
            <div>
              <b>Web üzerinden ödeme çok yakında</b>
              <p>Kartla ödeme altyapımız şu an devreye alınıyor; bu işlemden ücret alınmadı. Şimdilik uygulamayı indirip aboneliği uygulama içinden başlatabilirsin.</p>
              <a class="btn btn--ghost btn--block" href="${freeUrl()}">Uygulamayı indir</a>
            </div>
          </div>
        </div>
      </div>
    </div>
    ${legalFoot()}
  </section>`;
}

/* ------------------------------------------------------------ başarı */

function device() {
  const ua = navigator.userAgent;
  return {
    ios: /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    android: /Android/.test(ua),
  };
}

function successView() {
  const { ios, android } = device();
  const method = S.user?.method === "google" ? "Google" : "Apple";
  const store = (kind) =>
    kind === "ios"
      ? `<a class="store" href="${CONFIG.stores.ios}" data-store="ios">${BRAND.apple}<em><span>İndir</span><strong>App Store</strong></em></a>`
      : `<a class="store" href="${CONFIG.stores.android}" data-store="android">${BRAND.play}<em><span>İndir</span><strong>Google Play</strong></em></a>`;
  const stores = android ? [store("android")] : ios ? [store("ios")] : [store("ios"), store("android")];

  return `
  <section class="success">
    <img class="intro__logo" src="/assets/brand/logo.svg?v=20260830b" alt="Healife" width="132" height="25" />
    <div class="success__art" aria-hidden="true">
      <div class="pw-hero__glow"></div>
      <img src="${IMG(avatar())}" alt="" />
      <span class="burst">${ai("check")}</span>
    </div>
    <h1 class="display display--sm">${esc(withName("hoş geldin!", "Hoş geldin!"))}<br />Premium'un aktif.</h1>
    <p class="lead">Planın hesabına kaydedildi. Uygulamada planına ulaşmak için:</p>
    <ol class="steps">
      <li><span>1</span><div><b>Healife'ı indir</b><small>Ücretsiz, birkaç saniye sürer.</small></div>${ai("download")}</li>
      <li><span>2</span><div><b>“Giriş yap”a dokun</b><small>Açılış ekranının altındaki “Zaten hesabın var mı? Giriş yap”.</small></div>${ai("login")}</li>
      <li><span>3</span><div><b>${method} ile giriş yap</b><small>Planın ve premium hazır olacak; soruları tekrar cevaplaman gerekmez.</small></div>${ai("checkCircle")}</li>
    </ol>
    <div class="acct" role="note">
      <div class="acct__head">${ai("info")}<b>Bu hesapla giriş yapmalısın</b></div>
      <div class="acct__id">
        <span class="acct__logo">${method === "Google" ? BRAND.google : BRAND.apple}</span>
        <div><small>${method} hesabı</small><b>${esc(S.user?.email || S.email)}</b></div>
      </div>
      <p>Farklı bir hesapla ya da giriş yapmadan devam edersen aboneliğin görünmez.${
        method === "Apple" ? " Apple, e-postanı gizlediysen farklı bir adres gösterebilir; aynı Apple kimliğini seçmen yeterli." : ""
      }</p>
    </div>
    <div class="stores">${stores.join("")}</div>
    ${!ios && !android ? `<figure class="qr"><img src="/assets/brand/qr-indir.svg?v=20260917a" alt="QR kod: telefonunla tarat" width="120" height="120" /><figcaption>Telefonunla tarat</figcaption></figure>` : ""}
    <p class="fine center">Bir sorun mu var? <a href="mailto:info@hea-life.com">info@hea-life.com</a></p>
  </section>`;
}

/* ============================================================ etkileşim */

const haptic = () => {
  try {
    navigator.vibrate?.(8);
  } catch {}
};

const nextBtn = () => app.querySelector("[data-next]")?.addEventListener("click", next);

function bindAuto(step) {
  app.querySelectorAll("[data-val]").forEach((b) =>
    b.addEventListener("click", () => {
      S.answers[step.id] = b.dataset.val;
      pick(b);
    }),
  );
}

const BIND = {
  intro: () => app.querySelector("[data-next]").addEventListener("click", () => (track("start"), next())),
  gender: () => bindAuto({ id: "gender" }),
  single: (step) => bindAuto(step),
  days: (step) => bindAuto(step),

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
    nextBtn();
  },

  focus: async () => {
    const sel = () => S.answers.focus_areas || [];
    const sync = () => {
      const on = new Set(sel());
      app.querySelectorAll(".chip").forEach((c) => {
        c.classList.toggle("is-on", on.has(c.dataset.val));
        c.setAttribute("aria-pressed", on.has(c.dataset.val));
      });
      app.querySelector("[data-next]").disabled = !on.size;
      paintAtlas(on);
    };
    const toggle = (id) => {
      let s = sel();
      if (s.includes(id)) s = s.filter((x) => x !== id);
      else if (id === "genel") s = ["genel"];
      else s = [...s.filter((x) => x !== "genel"), id];
      haptic();
      S.answers.focus_areas = s;
      save();
      sync();
    };
    app.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => toggle(c.dataset.val)));
    nextBtn();
    await loadAtlas();
    app.querySelector("#atlas")?.addEventListener("click", (e) => {
      const area = e.target.closest("path.m")?.dataset.area;
      if (area) toggle(area);
    });
    sync();
  },

  motivation: () => nextBtn(),
  bmi: () => nextBtn(),
  pace: () => nextBtn(),

  wheel: (step) => {
    const list = app.querySelector("#wheel");
    const items = [...list.querySelectorAll(".wheel__item")];
    const note = app.querySelector("#numNote");
    const btn = app.querySelector("[data-next]");
    // offsetHeight tam sayıya yuvarlar; sığdırma satırı küsuratlı yapınca
    // yüzlerce satırda birikip seçili değer görünenden kayıyordu.
    const rowH = () => items[0].getBoundingClientRect().height;
    let H = rowH();
    const start = S.answers[step.id] ?? step.def(S.answers);
    let idx = Math.max(0, Math.min(items.length - 1, Math.round((start - step.min) / step.step)));
    list.scrollTop = idx * H;

    const noteFor = (v) => {
      if (step.id !== "target_weight") return ["", false];
      const h = healthyRange(S.answers.height || 170);
      const diff = v - S.answers.weight;
      if (v < h.min) return [`Boyuna göre sağlıklı aralığın alt sınırı ${h.min} kg. Bunun altını hedeflemeni önermiyoruz.`, true];
      if (Math.abs(diff) < 0.5) return ["Mevcut kilonla aynı.", false];
      return [`${diff > 0 ? "+" : "−"}${fmt(Math.abs(diff), 1)} kg · sağlıklı aralığın ${h.min}–${h.max} kg`, false];
    };
    const paint = () => {
      const pos = list.scrollTop / H;
      idx = Math.max(0, Math.min(items.length - 1, Math.round(pos)));
      for (let i = Math.max(0, idx - 4); i <= Math.min(items.length - 1, idx + 4); i++) {
        items[i].style.setProperty("--d", Math.min(3, Math.abs(i - pos)).toFixed(2));
        items[i].classList.toggle("is-on", i === idx);
        items[i].setAttribute("aria-selected", i === idx);
      }
      const v = Number(items[idx].dataset.v);
      S.answers[step.id] = v;
      const [txt, warn] = noteFor(v);
      note.textContent = txt;
      note.classList.toggle("is-warn", warn);
    };
    let raf = 0;
    let lastIdx = idx;
    list.addEventListener(
      "scroll",
      () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          paint();
          if (idx !== lastIdx) {
            lastIdx = idx;
            haptic();
          }
        });
      },
      { passive: true },
    );
    // Ekrana sığdırma satır yüksekliğini değiştirebilir: seçili değerde kal.
    list.closest("[data-fit]").addEventListener("fit", () => {
      const keep = idx;
      H = rowH();
      list.scrollTop = keep * H;
    });
    items.forEach((it, i) => it.addEventListener("click", () => list.scrollTo({ top: i * H, behavior: "smooth" })));
    list.addEventListener("keydown", (e) => {
      const k = { ArrowUp: -1, ArrowDown: 1, PageUp: -5, PageDown: 5 }[e.key];
      if (k) {
        e.preventDefault();
        list.scrollTo({ top: Math.max(0, Math.min(items.length - 1, idx + k)) * H, behavior: "smooth" });
      } else if (e.key === "Enter") btn.click();
    });
    btn.addEventListener("click", () => {
      paint();
      save();
      next();
    });
    paint();
    if (matchMedia("(pointer: fine)").matches) list.focus({ preventScroll: true });
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
    sug.addEventListener("click", () => {
      input.value = sug.dataset.v;
      sug.hidden = true;
      input.focus();
    });
    input.addEventListener("input", () => {
      err.hidden = true;
      sug.hidden = true;
    });
    input.addEventListener("blur", () => {
      const s = suggestEmail(input.value.trim());
      sug.hidden = !s;
      if (s) sug.innerHTML = `Bunu mu demek istedin? <b>${esc(s)}</b>`;
      sug.dataset.v = s || "";
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        err.hidden = false;
        input.focus();
        return;
      }
      S.email = v.toLowerCase();
      S.marketing = !!app.querySelector("#marketing")?.checked;
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
        render({ quiet: true });
      }),
    );
    app.querySelector("[data-free]").addEventListener("click", () => track("free_continue"));
    app.querySelector("[data-next]").addEventListener("click", () => {
      const p = CONFIG.plans.find((x) => x.id === S.planId) || CONFIG.plans[0];
      // Ödemeye başlama tek kez, burada (ödeme ekranı her çizildiğinde değil).
      track("checkout_start", { plan: p.id, value: p.price, currency: "TRY" });
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
    app.querySelector("[data-change]").addEventListener("click", () => go("paywall"));
    const box = app.querySelector("#pay");
    const plan = CONFIG.plans.find((x) => x.id === S.planId) || CONFIG.plans[0];
    try {
      const co = await createCheckout({ plan, email: S.email, userId: S.user?.userId });
      if (co.mode === "iframe") {
        box.innerHTML = `<iframe class="pay__frame" src="${co.url}" title="Güvenli ödeme" allow="payment"></iframe>`;
        return;
      }
      const live = co.mode === "demo";
      box.innerHTML = `
        <div class="pay__demo">
          <div class="cardform" aria-hidden="true">
            <div class="cf-row"><span>Kart üzerindeki isim</span><i>${esc(S.answers.name || "Ad Soyad")}</i></div>
            <div class="cf-row"><span>Kart numarası</span><i>•••• •••• •••• ••••</i></div>
            <div class="cf-2"><div class="cf-row"><span>Son kullanma</span><i>AA/YY</i></div><div class="cf-row"><span>CVC</span><i>•••</i></div></div>
          </div>
          ${live ? `<p class="demo-note">${ai("info")}Demo kipi — PayTR bağlanınca bu alanda gerçek ödeme formu açılacak.</p>` : ""}
        </div>`;
      // Öde düğmesi diğer adımlardaki gibi yapışkan dock'ta: kaydırmadan basılır.
      // PayTR iFrame'inin kendi düğmesi var, o kipte dock gizli kalır.
      const dock = app.querySelector("#payDock");
      dock.hidden = false;
      const pay = dock.querySelector("#demoPay");
      const ok = app.querySelector("#legalOk");
      const err = dock.querySelector("#payErr");
      ok.addEventListener("change", () => {
        pay.classList.toggle("is-dim", !ok.checked);
        if (ok.checked) err.hidden = true;
      });
      pay.addEventListener("click", async (e) => {
        if (!ok.checked) {
          err.hidden = false;
          shake(ok.closest("label"));
          return;
        }
        if (!live) {
          track("payment_pending_click", { plan: plan.id });
          dock.querySelector("#soon").hidden = false;
          pay.hidden = true;
          return;
        }
        e.currentTarget.disabled = true;
        e.currentTarget.innerHTML = `<span class="spin"></span>İşleniyor…`;
        await wait(1200);
        completePurchase(plan);
      });
    } catch (e) {
      box.innerHTML = `<p class="err">${esc(e.message)}. Lütfen tekrar dene.</p><button class="btn btn--ghost btn--block" type="button" id="retry">Tekrar dene</button>`;
      box.querySelector("#retry").addEventListener("click", () => render());
    }
  },

  success: () => app.querySelectorAll("[data-store]").forEach((a) => a.addEventListener("click", () => track("store_click", { store: a.dataset.store }))),
};

function completePurchase(plan) {
  S.paid = true;
  // Reklam/analitik satın alması yalnız gerçek ödemede; önizleme demosu
  // Meta/GA verisini kirletmesin. PayTR'de event_id = merchant_oid (CAPI ile eşleşir).
  if (CONFIG.paymentProvider === "paytr") track("purchase", { value: plan.price, currency: "TRY", plan: plan.id });
  save();
  go("success", { replace: true });
}

// Tek seçimli sorularda seçimi gösterip kendiliğinden ilerle (tek tık).
function pick(btn) {
  haptic();
  app.querySelectorAll("[data-val]").forEach((b) => {
    const on = b === btn;
    b.classList.toggle("is-on", on);
    if (b.classList.contains("opt")) {
      const end = b.querySelector(".opt__end, .opt__mark");
      if (end) end.outerHTML = on ? ai("arrowRight", "opt__end") : '<span class="opt__mark"></span>';
    }
  });
  save();
  app.style.pointerEvents = "none";
  setTimeout(() => {
    app.style.pointerEvents = "";
    next();
  }, 320);
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

/* ------------------------------------------------------------ kas haritası */

// Uygulamadaki InlineMuscleMap'in aynısı: flutter_body_atlas SVG'leri
// (Ryan Graves, CC BY 4.0). Bölge → kas kimlikleri atlas/focus.json'da,
// uygulamanın body_atlas_mapping.dart eşlemesinden üretildi.
const ATLAS = { loaded: false, byMuscle: {} };

async function loadAtlas() {
  const box = app.querySelector("#atlas");
  if (!box) return;
  try {
    if (!ATLAS.loaded) {
      const [front, back, map] = await Promise.all([
        fetch("/start/atlas/front.svg?v=20261013i").then((r) => r.text()),
        fetch("/start/atlas/back.svg?v=20261013i").then((r) => r.text()),
        fetch("/start/atlas/focus.json?v=20261013i").then((r) => r.json()),
      ]);
      Object.assign(ATLAS, { front, back, loaded: true });
      for (const [area, ids] of Object.entries(map)) ids.forEach((id) => (ATLAS.byMuscle[id] = area));
    }
    if (!app.contains(box)) return;
    box.querySelector('[data-view="front"]').insertAdjacentHTML("afterbegin", ATLAS.front);
    box.querySelector('[data-view="back"]').insertAdjacentHTML("afterbegin", ATLAS.back);
    box.querySelectorAll("svg").forEach((s) => {
      s.removeAttribute("width");
      s.removeAttribute("height");
      s.setAttribute("aria-hidden", "true");
    });
    // Kimlik bazen <path>'te, bazen onu saran <g>'de; ikisinde de bölgeyi
    // alt path'lere yay ki boyama ve dokunma her parçada çalışsın.
    box.querySelectorAll("[id]").forEach((el) => {
      const area = ATLAS.byMuscle[el.id];
      if (!area) return;
      (el.tagName === "path" ? [el] : el.querySelectorAll("path")).forEach((p) => {
        p.classList.add("m");
        p.dataset.area = area;
      });
    });
    // Fareyle bir kasın üstüne gelince bölgenin tamamı (ön+arka) aydınlansın:
    // tıklayınca neyin seçileceği önceden görünür.
    box.addEventListener("pointerover", (e) => {
      const area = e.target.closest?.("path.m")?.dataset.area;
      box.querySelectorAll("path.m").forEach((p) => p.classList.toggle("hov", !!area && p.dataset.area === area));
    });
    box.addEventListener("pointerleave", () => box.querySelectorAll("path.hov").forEach((p) => p.classList.remove("hov")));
    box.classList.add("is-ready");
  } catch {
    box.hidden = true; // harita yüklenemezse çipler yeterli
  }
}

function paintAtlas(on) {
  app.querySelector("#atlas")?.classList.toggle("has-sel", on.size > 0);
  app.querySelectorAll("#atlas path.m").forEach((p) => p.classList.toggle("on", on.has(p.dataset.area)));
}

/* ------------------------------------------------------------ e-posta önerisi */

const DOMAINS = ["gmail.com", "hotmail.com", "outlook.com", "icloud.com", "yahoo.com", "yandex.com", "live.com"];
function suggestEmail(v) {
  const m = v.toLowerCase().match(/^([^@\s]+)@([^@\s]+)$/);
  if (!m || DOMAINS.includes(m[2])) return null;
  let best = null,
    bestD = 3;
  for (const d of DOMAINS) {
    const dist = lev(m[2], d);
    if (dist < bestD) [bestD, best] = [dist, d];
  }
  return best && bestD <= 2 ? `${m[1]}@${best}` : null;
}
function lev(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/* ============================================================ başlat */

// PayTR iFrame'i dönüş adresini çerçevenin İÇİNDE açar: funnel içinde funnel
// olmasın, üst pencereye geç.
if (window.top !== window.self) window.top.location.href = location.href;

const params = new URLSearchParams(location.search);
// PayTR dönüş adresi. Gerçek ödeme bağlanmadan bu parametre hiçbir şey açmaz
// (yoksa herkes ?odeme=tamam yazıp "Premium'un aktif" görürdü). Bağlanınca
// burada /api/web/checkout/status ile sunucu onayı beklenmeli.
if (CONFIG.paymentProvider === "paytr" && params.get("odeme") === "tamam" && S.user) {
  S.paid = true;
  S.step = "success";
}
if (params.has("sifirla")) {
  storage.clear();
  S = fresh();
}
const utm = {};
params.forEach((v, k) => /^(utm_|fbclid$|gclid$|gbraid$|wbraid$|ttclid$)/.test(k) && (utm[k] = v));
if (Object.keys(utm).length) S.utm = utm;

if (S.step === "loading") S.step = "email";
// Eski sürümden kalmış ve artık olmayan bir adım kaydedildiyse başa dön.
if (!stepById(S.step)) S.step = "intro";
history.replaceState({ step: S.step, d: 0 }, "", `${location.pathname}#${S.step}`);
render();
