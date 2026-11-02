// Hesaplayıcı sayfalarının (kalori, makro, bazal metabolizma) saf hesap çekirdeği.
// Backend'deki dailyTargets.js'in ve onu kopyalayan start/services.js
// dailyTargets'ın birebir aynısıdır: sitede gösterilen sayı, kullanıcı
// uygulamaya geçince değişmesin. Bir katsayı ya da kural orada değişirse
// burada da değişmeli; test/calc.test.js iki tarafı karşılaştırır.
// services.js içe aktarılmıyor çünkü config.js'i ve tarayıcıya bağlı
// servisleri de yanında getiriyor.

export const ACTIVITY_FACTORS = { oturan: 1.2, hafif: 1.375, aktif: 1.55, cok_aktif: 1.725 };
// Backend bilinmeyen hareketlilik düzeyinde "hafif" katsayısına düşer.
const FALLBACK_ACTIVITY_FACTOR = ACTIVITY_FACTORS.hafif;

export const GOAL_ADJUSTMENTS = { lose_weight: -500, build_muscle: 300, get_fit: 0 };
const FALLBACK_GOAL = "get_fit";

export const CALORIE_FLOOR = 1200;
export const CALORIE_CEILING = 5000;

const PROTEIN_G_PER_KG = 2.0;
const PROTEIN_G_PER_KG_GET_FIT = 1.6;
const FAT_SHARE_OF_CALORIES = 0.25;
const MIN_CARBS_G = 50;
// Karbonhidrat tabana çekildiğinde ona ayrılan kalori (50 g × 4 kcal).
const MIN_CARBS_KCAL = MIN_CARBS_G * 4;

export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 };

const MIFFLIN_MALE_OFFSET = 5;
const MIFFLIN_FEMALE_OFFSET = -161;

// Mifflin-St Jeor. "erkek" dışındaki her değer kadın denklemine düşer (backend ile aynı).
export function bmr({ gender, age, height, weight }) {
  const offset = gender === "erkek" ? MIFFLIN_MALE_OFFSET : MIFFLIN_FEMALE_OFFSET;
  return 10 * weight + 6.25 * height - 5 * age + offset;
}

export function tdee(input) {
  return bmr(input) * (ACTIVITY_FACTORS[input.activity] || FALLBACK_ACTIVITY_FACTOR);
}

// goal: "lose_weight" | "build_muscle" | "get_fit" (backend'in kanonik hedefleri).
export function dailyTargets(input) {
  const { age, height, weight } = input;
  if (!age || !height || !weight) return null;
  const goal = GOAL_ADJUSTMENTS[input.goal] === undefined ? FALLBACK_GOAL : input.goal;
  let calories = Math.round(tdee(input) + GOAL_ADJUSTMENTS[goal]);
  calories = Math.max(CALORIE_FLOOR, Math.min(CALORIE_CEILING, calories));

  let protein = Math.round(weight * (goal === "get_fit" ? PROTEIN_G_PER_KG_GET_FIT : PROTEIN_G_PER_KG));
  const fat = Math.round((calories * FAT_SHARE_OF_CALORIES) / KCAL_PER_GRAM.fat);
  let carbs = Math.round((calories - protein * KCAL_PER_GRAM.protein - fat * KCAL_PER_GRAM.fat) / KCAL_PER_GRAM.carbs);
  if (carbs < MIN_CARBS_G) {
    protein = Math.max(0, Math.round((calories - fat * KCAL_PER_GRAM.fat - MIN_CARBS_KCAL) / KCAL_PER_GRAM.protein));
    carbs = MIN_CARBS_G;
  }
  return { calories, protein, carbs, fat };
}

// Gram → kcal ve toplam kaloriye oranı (yuvarlanmış gramlardan; toplam
// hedefle birkaç kcal sapabilir, uygulama da gramları gösterir).
export function macroCalories({ protein, carbs, fat }) {
  const kcal = {
    protein: protein * KCAL_PER_GRAM.protein,
    carbs: carbs * KCAL_PER_GRAM.carbs,
    fat: fat * KCAL_PER_GRAM.fat,
  };
  const total = kcal.protein + kcal.carbs + kcal.fat;
  const share = (part) => (total > 0 ? Math.round((part / total) * 100) : 0);
  return { kcal, total, share: { protein: share(kcal.protein), carbs: share(kcal.carbs), fat: share(kcal.fat) } };
}

/* -------------------------------------------------------------- doğrulama */

export const INPUT_LIMITS = {
  age: { min: 15, max: 90, empty: "Yaşını gir.", range: "Yaş 15 ile 90 arasında olmalı." },
  height: { min: 120, max: 230, empty: "Boyunu cm olarak gir.", range: "Boy 120 ile 230 cm arasında olmalı." },
  weight: { min: 35, max: 250, empty: "Kilonu kg olarak gir.", range: "Kilo 35 ile 250 kg arasında olmalı." },
};
const GENDERS = ["erkek", "kadin"];
const GENDER_ERROR = "Cinsiyetini seç.";
const ACTIVITY_ERROR = "Hareketlilik düzeyini seç.";
const GOAL_ERROR = "Hedefini seç.";

// Form alanlarından gelen metni sayıya çevirir; Türkçe klavyedeki ondalık virgülü de kabul eder.
export function parseNumber(raw) {
  if (typeof raw === "number") return raw;
  const text = String(raw ?? "").trim().replace(",", ".");
  if (text === "") return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : NaN;
}

// raw: { gender, age, height, weight, activity?, goal? } (form metinleri).
// needs: hangi seçimlerin zorunlu olduğu ({ activity: true, goal: true }).
export function validateInputs(raw, needs = {}) {
  const errors = {};
  const values = {};

  if (GENDERS.includes(raw.gender)) values.gender = raw.gender;
  else errors.gender = GENDER_ERROR;

  for (const [field, limit] of Object.entries(INPUT_LIMITS)) {
    const value = parseNumber(raw[field]);
    if (value === null) errors[field] = limit.empty;
    else if (Number.isNaN(value) || value < limit.min || value > limit.max) errors[field] = limit.range;
    else values[field] = value;
  }

  if (needs.activity) {
    if (ACTIVITY_FACTORS[raw.activity] !== undefined) values.activity = raw.activity;
    else errors.activity = ACTIVITY_ERROR;
  }
  if (needs.goal) {
    if (GOAL_ADJUSTMENTS[raw.goal] !== undefined) values.goal = raw.goal;
    else errors.goal = GOAL_ERROR;
  }

  return { values, errors, ok: Object.keys(errors).length === 0 };
}
