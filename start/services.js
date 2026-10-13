// Hesaplamalar + dış servis bağdaştırıcıları (giriş, ödeme, ölçüm).
// Hesaplamalar backend'deki kural motorunun birebir kopyası; önizlemede
// gösterilen kalori uygulamaya girince değişmesin diye.
//   dailyTargets.js · levelScore.js · planResolver.js (MAX_TRAINING_LEVEL)

import { CONFIG } from "./config.js?v=20261013g";

/* ---------------------------------------------------------------- hesap */

const ACTIVITY_FACTORS = { oturan: 1.2, hafif: 1.375, aktif: 1.55, cok_aktif: 1.725 };
const GOAL_CANON = {
  yag_yakma: "lose_weight",
  kas_kazanma: "build_muscle",
  guclenme: "build_muscle",
  forma: "get_fit",
  saglik: "get_fit",
};
const GOAL_ADJUSTMENTS = { lose_weight: -500, build_muscle: 300, get_fit: 0 };

export const mainGoal = (a) => (a.goal && a.goal[0]) || "forma";
export const goalCanon = (a) => GOAL_CANON[mainGoal(a)] || "get_fit";

export function dailyTargets(a) {
  const { age, height, weight } = a;
  if (!age || !height || !weight) return null;
  const isMale = a.gender === "erkek";
  const bmr = isMale
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
  const tdee = bmr * (ACTIVITY_FACTORS[a.activity_level] || 1.375);
  const goal = goalCanon(a);
  let calories = Math.round(tdee + (GOAL_ADJUSTMENTS[goal] ?? 0));
  calories = Math.max(1200, Math.min(5000, calories));

  let protein = Math.round(weight * (goal === "get_fit" ? 1.6 : 2.0));
  const fat = Math.round((calories * 0.25) / 9);
  let carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  if (carbs < 50) {
    protein = Math.max(0, Math.round((calories - fat * 9 - 200) / 4));
    carbs = 50;
  }
  return { calories, protein, carbs, fat };
}

const EXPERIENCE_POINTS = { ilk_kez: 0, ara_sira: 1, duzenli: 2, ileri: 3 };
const squatPoints = (r) => (r <= 10 ? 0 : r <= 30 ? 1 : r <= 50 ? 2 : 3);
const pullupPoints = (r) => (r <= 0 ? 0 : r <= 5 ? 1 : r <= 10 ? 2 : 3);
const MAX_TRAINING_LEVEL = { d1_2: 1, d3_4: 2 };

export function trainingLevel(a) {
  const score =
    (EXPERIENCE_POINTS[a.experience] ?? 0) +
    squatPoints(Number(a.squats) || 0) +
    pullupPoints(Number(a.pullups) || 0);
  const level = score <= 3 ? 1 : score <= 6 ? 2 : 3;
  const capped = Math.min(level, MAX_TRAINING_LEVEL[a.weekly_days] ?? 3);
  return { level: capped, label: ["Başlangıç", "Orta", "İleri"][capped - 1], days: capped + 2 };
}

/** BMI 18.5–25 aralığının kilo karşılığı — hedef kilo sorusunda uyarı için. */
export function healthyRange(heightCm) {
  const m = heightCm / 100;
  return { min: Math.ceil(18.5 * m * m), max: Math.floor(24.9 * m * m) };
}

/** Dünya Sağlık Örgütü VKİ sınıfları + kullanıcıya gösterilecek kısa not. */
export function bmiInfo(weight, heightCm) {
  const value = weight / Math.pow(heightCm / 100, 2);
  const { min, max } = healthyRange(heightCm);
  const cls =
    value < 18.5
      ? ["Zayıf", "#0a84ff", "Sağlıklı kilo almak için yeterli kalori ve kuvvet antrenmanına odaklanacağız."]
      : value < 25
        ? ["Normal", "#bbe448", "Harika bir başlangıç noktası. Planın vücut kompozisyonunu iyileştirmeye odaklanacak."]
        : value < 30
          ? ["Fazla kilolu", "#ffd60a", "Küçük ama sürdürülebilir bir kalori açığı ve düzenli antrenmanla sağlıklı aralığa inebilirsin."]
          : ["Obez", "#ff7a1a", "Kademeli ve güvenli bir planla başlayacağız. Bir sağlık sorunun varsa başlamadan önce doktoruna danış."];
  return { value, min, max, label: cls[0], color: cls[1], note: cls[2] };
}

/**
 * Hedef kiloya tahmini varış. Güvenli hızlar: verme haftada en çok
 * vücut ağırlığının %0,75'i (0,5 kg üst sınır), alma haftada 0,25 kg.
 */
export function projection(a) {
  if (!a.target_weight || !a.weight) return null;
  const diff = a.target_weight - a.weight;
  if (Math.abs(diff) < 0.5) return null;
  const rate = diff < 0 ? Math.min(0.5, a.weight * 0.0075) : 0.25;
  const weeks = Math.max(2, Math.ceil(Math.abs(diff) / rate));
  const end = new Date();
  end.setDate(end.getDate() + weeks * 7);
  return { from: a.weight, to: a.target_weight, weeks, end };
}

/** Web cevaplarını uygulamanın onboardingData biçimine çevirir
 *  (lib/providers/onboarding_provider.dart → buildOnboardingPayload). */
export function toOnboardingData(a) {
  const genderMap = { erkek: "male", kadin: "female", belirtmek_istemiyorum: "other" };
  const p = {
    gender: genderMap[a.gender],
    age: a.age,
    height: a.height,
    heightUnit: "CM",
    weight: a.weight,
    weightUnit: "KG",
    goal: mainGoal(a),
    goals: a.goal,
    focusAreas: a.focus_areas,
    experience: a.experience,
    activityLevel: a.activity_level,
    workoutFrequency: a.weekly_days,
    workoutLocation: a.workout_location,
    squats: a.squats ?? undefined,
    pullups: a.pullups ?? undefined,
    dietPreference: a.diet_preference,
    allergies: a.allergies,
    // Hedef kilo yalnız kilo verme/alma hedefinde anlamlı (funnel'da needsTarget).
    targetWeight: ["lose_weight", "build_muscle"].includes(goalCanon(a)) ? a.target_weight ?? undefined : undefined,
    name: a.name || undefined,
    source: "web_funnel",
  };
  Object.keys(p).forEach((k) => p[k] === undefined && delete p[k]);
  return p;
}

/* -------------------------------------------------------------- kayıt */

const STORE_KEY = "healife.funnel.v1";

export const storage = {
  load() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || null;
    } catch {
      return null;
    }
  },
  save(state) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      /* gizli sekme vb. — akış bellekte devam eder */
    }
  },
  clear() {
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {}
  },
};

/* ------------------------------------------------------------- ölçüm */

/** Meta Pixel / GTM yüklüyse onlara, yoksa yalnızca konsola. */
// Funnel olayı → GTM (dataLayer), GA4 (gtag) ve Meta Pixel (fbq). gtag/fbq
// yalnız ilgili çerez izni verildiyse vardır (scripts/consent.js); yoksa
// olay sessizce düşer.
const GA_EVENT = { lead: "generate_lead", checkout_start: "begin_checkout", purchase: "purchase", account_created: "sign_up" };
const FB_EVENT = { lead: "Lead", checkout_start: "InitiateCheckout", account_created: "CompleteRegistration", purchase: "Purchase" };
const FB_CUSTOM = { start: "FunnelStart", result_cta: "FunnelPlanViewed" };

export function track(event, props = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: `funnel_${event}`, ...props });
    if (typeof window.gtag === "function") window.gtag("event", GA_EVENT[event] || `funnel_${event}`, props);
    if (typeof window.fbq === "function") {
      const money = props.value != null ? { value: props.value, currency: props.currency || "TRY" } : {};
      const content = props.plan ? { content_ids: [props.plan], content_name: `Healife Premium ${props.plan}`, content_type: "product" } : {};
      if (FB_EVENT[event]) window.fbq("track", FB_EVENT[event], { ...money, ...content }, props.event_id ? { eventID: props.event_id } : undefined);
      else if (FB_CUSTOM[event]) window.fbq("trackCustom", FB_CUSTOM[event]);
    }
  } catch {}
  if (location.hostname === "localhost") console.debug("[funnel]", event, props);
}

/* ------------------------------------------------------------- giriş */

/**
 * Kullanıcıyı uygulamadaki hesabıyla aynı kimliğe bağlar. Uygulamaya
 * aynı yöntemle (Apple/Google) girince abonelik orada görünür.
 *
 * live kipinde yapılacaklar (backend):
 *  - /login-google: web OAuth istemci kimliğini audience listesine ekle
 *  - /login-apple: Services ID (web) ile gelen identityToken'ı kabul et
 *  - dönen kullanıcıya onboardingData'yı PATCH et (toOnboardingData)
 *  - dönüşte hesabın e-postasını `email` olarak ver: başarı ekranı
 *    "bu hesapla giriş yap" kartında onu gösteriyor (Apple gizli e-posta
 *    verebilir; formdaki adresle aynı olmayabilir).
 */
export async function signIn(method, answers) {
  if (CONFIG.authProvider === "demo") {
    await wait(700);
    return { userId: `demo_${Date.now().toString(36)}`, method, token: null };
  }
  throw new Error(`${method} girişi henüz bağlanmadı`);
}

/* ------------------------------------------------------------ ödeme */

/**
 * PayTR iFrame API akışı (paymentProvider: "paytr"):
 *  1. POST {apiBase}/web/checkout/paytr  { planId, email, userId }
 *     → backend merchant_oid üretir, paytr_token hash'ini hesaplar,
 *       https://www.paytr.com/odeme/api/get-token'dan token alır → { token }
 *  2. iFrame: https://www.paytr.com/odeme/guvenli/{token}
 *  3. PayTR, merchant_ok_url'e (/start/?odeme=tamam) döner. Asıl onay
 *     backend'e gelen bildirim (callback) ile verilir; sayfa yalnızca
 *     /web/checkout/status ile o onayı bekler.
 * Tekrarlayan ödeme için PayTR'nin kart saklama / abonelik ürünü gerekir.
 */
export async function createCheckout({ plan, email, userId }) {
  if (CONFIG.paymentProvider === "demo") return { mode: "demo" };
  if (CONFIG.paymentProvider === "pending") return { mode: "pending" };

  const res = await fetch(`${CONFIG.apiBase}/web/checkout/paytr`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId: plan.id, email, userId }),
  });
  if (!res.ok) throw new Error("Ödeme başlatılamadı");
  const { token } = await res.json();
  return { mode: "iframe", url: `https://www.paytr.com/odeme/guvenli/${token}` };
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
