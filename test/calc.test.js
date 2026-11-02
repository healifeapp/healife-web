import test from "node:test";
import assert from "node:assert";
import {
  bmr,
  tdee,
  dailyTargets,
  macroCalories,
  validateInputs,
  parseNumber,
  ACTIVITY_FACTORS,
  CALORIE_FLOOR,
  CALORIE_CEILING,
} from "../scripts/calc.js";

// start/config.js modül yüklenirken location.hostname okuyor; node'da yok.
// Sahte bir yerel adresle services.js'i olduğu gibi yükleyip onun
// dailyTargets'ını doğruluk kaynağı olarak kullanıyoruz.
globalThis.location ??= { hostname: "localhost", search: "", href: "http://localhost/" };
const services = await import("../start/services.js");

// Funnel'daki hedef anahtarı → backend'in kanonik hedefi (services.js GOAL_CANON).
const FUNNEL_GOAL_FOR = { lose_weight: "yag_yakma", build_muscle: "kas_kazanma", get_fit: "forma" };

const GRID = {
  gender: ["erkek", "kadin"],
  age: [15, 22, 37, 58, 90],
  height: [120, 152, 171, 188, 230],
  weight: [35, 48.5, 70, 96, 160, 250],
  activity: Object.keys(ACTIVITY_FACTORS),
  goal: Object.keys(FUNNEL_GOAL_FOR),
};

function* gridInputs() {
  for (const gender of GRID.gender)
    for (const age of GRID.age)
      for (const height of GRID.height)
        for (const weight of GRID.weight)
          for (const activity of GRID.activity)
            for (const goal of GRID.goal) yield { gender, age, height, weight, activity, goal };
}

test("dailyTargets start/services.js ile her girdi için birebir aynı", () => {
  let compared = 0;
  let floorHits = 0;
  let ceilingHits = 0;
  let carbFloorHits = 0;
  for (const input of gridInputs()) {
    const expected = services.dailyTargets({
      gender: input.gender,
      age: input.age,
      height: input.height,
      weight: input.weight,
      activity_level: input.activity,
      goal: [FUNNEL_GOAL_FOR[input.goal]],
    });
    const actual = dailyTargets(input);
    assert.deepStrictEqual(actual, expected, JSON.stringify(input));
    compared += 1;
    if (actual.calories === CALORIE_FLOOR) floorHits += 1;
    if (actual.calories === CALORIE_CEILING) ceilingHits += 1;
    if (actual.carbs === 50) carbFloorHits += 1;
  }
  // Izgara sınır dallarını da gerçekten çalıştırmalı; yoksa eşitlik yalnız ana yolu kanıtlar.
  assert.equal(compared, 3600);
  assert.ok(floorHits > 0, "1200 alt sınırı denenmedi");
  assert.ok(ceilingHits > 0, "5000 üst sınırı denenmedi");
  assert.ok(carbFloorHits > 0, "karbonhidrat < 50 g kuralı denenmedi");
});

test("eksik girdi services.js gibi null döner", () => {
  assert.equal(dailyTargets({ gender: "erkek", age: 0, height: 178, weight: 82 }), null);
  assert.equal(services.dailyTargets({ gender: "erkek", age: 0, height: 178, weight: 82 }), null);
});

test("bilinmeyen aktivite ve hedef backend'deki gibi hafif / get_fit'e düşer", () => {
  const base = { gender: "kadin", age: 30, height: 165, weight: 60 };
  assert.deepStrictEqual(
    dailyTargets({ ...base, activity: "yok", goal: "yok" }),
    services.dailyTargets({ ...base, activity_level: "yok", goal: ["yok"] }),
  );
});

test("BMR örneği: erkek 82 kg 178 cm 30 yaş → 1787.5 kcal", () => {
  // 10×82 + 6.25×178 − 5×30 + 5 = 820 + 1112.5 − 150 + 5
  assert.equal(bmr({ gender: "erkek", age: 30, height: 178, weight: 82 }), 1787.5);
  assert.equal(bmr({ gender: "kadin", age: 30, height: 178, weight: 82 }), 1621.5);
  assert.equal(tdee({ gender: "erkek", age: 30, height: 178, weight: 82, activity: "aktif" }), 1787.5 * 1.55);
});

test("macroCalories gramları kcal'e ve yüzdeye çevirir", () => {
  const split = macroCalories({ protein: 131, carbs: 389, fat: 77 });
  assert.deepStrictEqual(split.kcal, { protein: 524, carbs: 1556, fat: 693 });
  assert.equal(split.total, 2773);
  assert.deepStrictEqual(split.share, { protein: 19, carbs: 56, fat: 25 });
});

test("parseNumber ondalık virgülü kabul eder, boşu null, çöpü NaN yapar", () => {
  assert.equal(parseNumber("72,5"), 72.5);
  assert.equal(parseNumber(" 180 "), 180);
  assert.equal(parseNumber(""), null);
  assert.ok(Number.isNaN(parseNumber("abc")));
});

test("validateInputs aralık dışını ve boşu Türkçe mesajla reddeder", () => {
  const bad = validateInputs({ gender: "", age: "14", height: "231", weight: "" }, { activity: true, goal: true });
  assert.equal(bad.ok, false);
  assert.deepStrictEqual(bad.errors, {
    gender: "Cinsiyetini seç.",
    age: "Yaş 15 ile 90 arasında olmalı.",
    height: "Boy 120 ile 230 cm arasında olmalı.",
    weight: "Kilonu kg olarak gir.",
    activity: "Hareketlilik düzeyini seç.",
    goal: "Hedefini seç.",
  });

  const edges = validateInputs({ gender: "kadin", age: "15", height: "230", weight: "35" });
  assert.equal(edges.ok, true);
  assert.deepStrictEqual(edges.values, { gender: "kadin", age: 15, height: 230, weight: 35 });

  const over = validateInputs({ gender: "erkek", age: "91", height: "119", weight: "250,1" });
  assert.deepStrictEqual(Object.keys(over.errors), ["age", "height", "weight"]);
});
