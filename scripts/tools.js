// Hesaplayıcı sayfaları (kalori-, makro-, bazal-metabolizma-hesaplama.html) —
// form ↔ sonuç bağlantısı. Hesabın kendisi calc.js'te; burası yalnız okur,
// doğrular ve yazar. JS yoksa form durur, formül sayfa metninde yazılıdır.

import {
  bmr,
  tdee,
  dailyTargets,
  macroCalories,
  validateInputs,
  ACTIVITY_FACTORS,
  GOAL_ADJUSTMENTS,
  CALORIE_FLOOR,
  CALORIE_CEILING,
} from "./calc.js?v=20261102a";

const FIELDS = ["gender", "age", "height", "weight", "activity", "goal"];
const GOAL_LABELS = { lose_weight: "kilo verme", build_muscle: "kas yapma", get_fit: "formda kalma" };
const HOURS_PER_DAY = 24;

// Gruplama kapalı: "1.788" ondalık sanılabiliyor; sayfa metni de "2271" yazıyor.
const formatNumber = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0, useGrouping: false });
const kcal = (value) => formatNumber.format(Math.round(value));
const signedKcal = (value) => (value > 0 ? "+" : value < 0 ? "−" : "±") + kcal(Math.abs(value));

// Hangi sayfa hangi seçimleri zorunlu tutuyor. Bazal metabolizma sayfasında
// hareketlilik isteğe bağlı: BMR onsuz hesaplanır, seçilirse TDEE de görünür.
const NEEDS = {
  kalori: { activity: true, goal: true },
  makro: { activity: true, goal: true },
  bmr: {},
};

function readForm(form) {
  const data = new FormData(form);
  const raw = {};
  for (const field of FIELDS) raw[field] = data.get(field) ?? "";
  return raw;
}

function setText(root, key, text) {
  for (const node of root.querySelectorAll(`[data-out="${key}"]`)) node.textContent = text;
}

function clampNote(targets, unclamped) {
  if (targets.calories === CALORIE_FLOOR && unclamped < CALORIE_FLOOR)
    return `Hesap ${kcal(unclamped)} kcal çıktı; güvenlik için ${kcal(CALORIE_FLOOR)} kcal altına inilmez.`;
  if (targets.calories === CALORIE_CEILING && unclamped > CALORIE_CEILING)
    return `Hesap ${kcal(unclamped)} kcal çıktı; hedef ${kcal(CALORIE_CEILING)} kcal ile sınırlanır.`;
  return "";
}

const RENDERERS = {
  kalori(root, values) {
    const targets = dailyTargets(values);
    const maintenance = tdee(values);
    const unclamped = Math.round(maintenance + GOAL_ADJUSTMENTS[values.goal]);
    setText(root, "calories", kcal(targets.calories));
    setText(root, "maintenance", `${kcal(maintenance)} kcal`);
    setText(root, "bmr", `${kcal(bmr(values))} kcal`);
    setText(root, "adjustment", `${signedKcal(GOAL_ADJUSTMENTS[values.goal])} kcal (${GOAL_LABELS[values.goal]})`);
    setText(root, "note", clampNote(targets, unclamped));
    return `Günlük kalori hedefin ${kcal(targets.calories)} kcal. Kilonu korumak için yaklaşık ${kcal(maintenance)} kcal.`;
  },

  makro(root, values) {
    const targets = dailyTargets(values);
    const split = macroCalories(targets);
    setText(root, "calories", kcal(targets.calories));
    for (const macro of ["protein", "carbs", "fat"]) {
      setText(root, `${macro}-g`, `${targets[macro]} g`);
      setText(root, `${macro}-kcal`, `${kcal(split.kcal[macro])} kcal · %${split.share[macro]}`);
      const bar = root.querySelector(`[data-bar="${macro}"]`);
      if (bar) bar.style.flexBasis = `${split.share[macro]}%`;
    }
    setText(root, "per-kg", `${(targets.protein / values.weight).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} g/kg`);
    return `Günlük ${kcal(targets.calories)} kcal: protein ${targets.protein} gram, karbonhidrat ${targets.carbs} gram, yağ ${targets.fat} gram.`;
  },

  bmr(root, values) {
    const resting = bmr(values);
    setText(root, "bmr", kcal(resting));
    setText(root, "per-hour", `${kcal(resting / HOURS_PER_DAY)} kcal`);
    const hasActivity = Boolean(values.activity);
    setText(root, "tdee", hasActivity ? `${kcal(tdee(values))} kcal` : "Hareketliliğini seçersen görünür");
    return hasActivity
      ? `Bazal metabolizma hızın günde ${kcal(resting)} kcal; hareketinle birlikte günlük harcaman yaklaşık ${kcal(tdee(values))} kcal.`
      : `Bazal metabolizma hızın günde ${kcal(resting)} kcal.`;
  },
};

function initTool(form) {
  const kind = form.dataset.tool;
  const render = RENDERERS[kind];
  const result = document.getElementById(form.dataset.result);
  if (!render || !result) return;
  const live = result.querySelector("[data-live]");
  const touched = new Set();
  let lastAnnouncement = "";

  function showErrors(errors, fields) {
    for (const field of FIELDS) {
      const message = form.querySelector(`[data-error="${field}"]`);
      if (!message) continue;
      const text = fields.has(field) ? errors[field] || "" : "";
      message.textContent = text;
      message.hidden = !text;
      for (const control of form.querySelectorAll(`[name="${field}"]`)) {
        if (text) control.setAttribute("aria-invalid", "true");
        else control.removeAttribute("aria-invalid");
      }
    }
  }

  // announce: ekran okuyucuya yalnız alan tamamlandığında (change/submit)
  // söylenir; her tuşta okunmasın.
  function update({ announce }) {
    const raw = readForm(form);
    const needs = { ...NEEDS[kind] };
    const { values, errors, ok } = validateInputs(raw, needs);
    if (kind === "bmr" && ACTIVITY_FACTORS[raw.activity] !== undefined) values.activity = raw.activity;
    showErrors(errors, touched);
    result.dataset.state = ok ? "ready" : "empty";
    if (!ok) return null;
    const sentence = render(result, values);
    if (announce && live && sentence !== lastAnnouncement) {
      live.textContent = sentence;
      lastAnnouncement = sentence;
    }
    return sentence;
  }

  form.addEventListener("input", (event) => {
    if (event.target.name && event.target.type === "radio") touched.add(event.target.name);
    update({ announce: false });
  });
  form.addEventListener("change", (event) => {
    if (event.target.name) touched.add(event.target.name);
    update({ announce: true });
  });
  form.addEventListener("focusout", (event) => {
    if (event.target.name && event.target.value !== "") {
      touched.add(event.target.name);
      update({ announce: false });
    }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    for (const field of FIELDS) touched.add(field);
    if (update({ announce: true })) {
      result.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
      return;
    }
    const firstInvalid = form.querySelector('[aria-invalid="true"]');
    if (firstInvalid) firstInvalid.focus();
  });

  form.classList.add("is-enhanced");
  // Tarayıcı geri gelişte alanları doldurmuş olabilir; sonucu hemen göster.
  update({ announce: false });
}

for (const form of document.querySelectorAll("form[data-tool]")) initTool(form);
