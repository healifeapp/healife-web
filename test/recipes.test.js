import test from "node:test";
import assert from "node:assert";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  slugify,
  stripEmoji,
  prepTimeToIsoDuration,
  parseIngredients,
  parseSteps,
  parseYield,
  pageTitle,
  metaDescription,
  selectRecipes,
  assignSlugs,
  applyPrepTimeOverrides,
  relatedRecipes,
  recipeCategory,
  renderRecipePage,
  renderHubPage,
  extractAssetVersions,
  PAGE_TITLE_MAX,
  META_DESCRIPTION_MAX,
} from "../tools/recipe-helpers.mjs";

const RECIPES_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "tarifler");
const IMG = (n) => `https://res.cloudinary.com/dcth0hfqd/image/upload/explore/recipes/recipe_${n}.jpg`;

function fixture(overrides = {}) {
  return {
    title: "Lavaş Burger",
    description: "Lavaşla hazırlanan pratik burger.",
    thumbnailUrl: IMG(2),
    calories: 440,
    prepTime: "15 dk",
    difficulty: "medium",
    macros: { protein: 41, carb: 32, fat: 16 },
    ingredients: ["1 adet lavaş (65 g) 🫓", "Üzeri için:", "1 dilim kaşar 🧀", "Not: Kaşar yerine lor da olur."],
    steps: ["Lavaşı hazırlayın.", "Katlayın ve kızartın.", "Not: Kalori ve makro değerleri 1 porsiyon içindir; tarif 4 porsiyon çıkarır."],
    ...overrides,
  };
}

const VERSIONS = extractAssetVersions(`
  <link href="styles/tokens.css?v=1" /><link href="styles/base.css?v=2" />
  <link href="styles/sections.css?v=3" /><img src="assets/brand/logo.svg?v=4" />
  <link href="assets/brand/icon.png?v=5" /><script src="scripts/consent.js?v=6"></script>
  <img src="assets/brand/cards/mastercard.svg?v=7" /><img src="assets/brand/cards/visa.svg?v=7" />
  <img src="assets/brand/cards/amex.svg?v=7" /><img src="assets/brand/cards/troy.svg?v=7" />
`);

function jsonLdBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
}

test("slugify: Türkçe karakterler ASCII, küçük harf, tireli", () => {
  assert.equal(slugify("Lavaş Burger"), "lavas-burger");
  assert.equal(slugify("Kıymalı Ekmek"), "kiymali-ekmek");
  assert.equal(slugify("Çikolatalı Fit Sütlaç (Şekersiz)"), "cikolatali-fit-sutlac-sekersiz");
  assert.equal(slugify("İçli Köfte"), "icli-kofte");
  assert.equal(slugify("Yoğurtlu Semizotu Salatası"), "yogurtlu-semizotu-salatasi");
  assert.equal(slugify("3 Malzeme Mousse"), "3-malzeme-mousse");
  assert.equal(slugify("  Fışkıran   Pizza! "), "fiskiran-pizza");
});

test("stripEmoji: emoji, varyant seçici ve fazladan boşluk gider", () => {
  assert.equal(stripEmoji("2 dondurulmuş muz 🍌"), "2 dondurulmuş muz");
  assert.equal(stripEmoji("1/2 kapya 🌶️"), "1/2 kapya");
  assert.equal(stripEmoji("Birkaç dilim kapya biber 🌶️ ve soğan 🧅"), "Birkaç dilim kapya biber ve soğan");
  assert.equal(stripEmoji("Mutlaka soğuk tüketin 🥶. Üzeri için"), "Mutlaka soğuk tüketin. Üzeri için");
  assert.equal(stripEmoji("1 avuç maydanoz 🌿 (lor tuzsuzsa ilave tuz 🧂)"), "1 avuç maydanoz (lor tuzsuzsa ilave tuz)");
  assert.equal(stripEmoji("Çok az tuz 🤏 🧂"), "Çok az tuz");
  assert.equal(stripEmoji("170°C fırın, %100 fıstık ezmesi"), "170°C fırın, %100 fıstık ezmesi");
});

test("prepTimeToIsoDuration", () => {
  assert.equal(prepTimeToIsoDuration("10 dk"), "PT10M");
  assert.equal(prepTimeToIsoDuration("2 dk"), "PT2M");
  assert.equal(prepTimeToIsoDuration("60 dk"), "PT1H");
  assert.equal(prepTimeToIsoDuration("90 dk"), "PT1H30M");
  assert.equal(prepTimeToIsoDuration("1 saat 15 dk"), "PT1H15M");
  assert.equal(prepTimeToIsoDuration("2 saat"), "PT2H");
  assert.equal(prepTimeToIsoDuration("15 dakika"), "PT15M");
  assert.equal(prepTimeToIsoDuration("hızlı"), null);
  assert.equal(prepTimeToIsoDuration(undefined), null);
});

test("parseIngredients: alt başlıklar ve notlar ayrılır", () => {
  const { groups, notes } = parseIngredients(fixture().ingredients);
  assert.deepEqual(groups, [
    { heading: null, items: ["1 adet lavaş (65 g)"] },
    { heading: "Üzeri için", items: ["1 dilim kaşar"] },
  ]);
  assert.deepEqual(notes, ["Kaşar yerine lor da olur."]);
  const colonInside = parseIngredients(["Protein sos: 1 ölçek whey + 3-4 yk su"]);
  assert.deepEqual(colonInside.groups[0].items, ["Protein sos: 1 ölçek whey + 3-4 yk su"]);
});

test("parseSteps ve parseYield", () => {
  const { steps, notes } = parseSteps(fixture().steps);
  assert.equal(steps.length, 2);
  assert.equal(parseYield(notes), "4 porsiyon");
  assert.equal(parseYield(["Kalori ve makro değerleri 1 kurabiye içindir; tarif yaklaşık 13 adet çıkarır."]), "13 adet");
  assert.equal(parseYield(["Kalori ve makro değerleri 1 porsiyon (2 top) içindir; tarif 18 top çıkarır."]), "18 top");
  assert.equal(parseYield(["Tarif 1 porsiyonluktur (2 külah). Kalori ve makro değerleri tarifin tamamı içindir."]), "1 porsiyon");
  assert.equal(parseYield(["Sadece muz 105 kcal."]), null);
});

test("pageTitle 60 karakteri geçmez, uzun başlıkta proteini bırakır", () => {
  assert.equal(pageTitle(fixture()), "Lavaş Burger Tarifi: 440 kcal, 41 g Protein | Healife");
  const long = pageTitle(fixture({ title: "Yüksek Protein Tuzlu Çubuklar", calories: 74, macros: { protein: 4, carb: 9, fat: 3 } }));
  assert.ok(long.length <= PAGE_TITLE_MAX, long);
  assert.equal(long, "Yüksek Protein Tuzlu Çubuklar Tarifi: 74 kcal | Healife");
});

test("metaDescription makroları içerir ve sınırı aşmaz", () => {
  const description = metaDescription(fixture({ description: "Çok uzun bir açıklama ".repeat(20) }));
  assert.ok(description.length <= META_DESCRIPTION_MAX, `${description.length}`);
  assert.match(description, /440 kcal, 41 g protein, 32 g karbonhidrat, 16 g yağ\.$/);
});

test("selectRecipes: birebir tekrar atlanır, ana sayfadaki tarif dahil edilir", () => {
  const seed = [1, 2, 3, 4, 5].map((n) => fixture({ title: `T${n}`, thumbnailUrl: IMG(n), steps: [`adım ${n}`] }));
  seed.splice(2, 0, { ...seed[1], title: "Kopya", thumbnailUrl: IMG(9) });
  const { selected, skipped } = selectRecipes(seed, 3, [5]);
  assert.deepEqual(skipped.map((recipe) => recipe.title), ["Kopya"]);
  assert.deepEqual(selected.map((recipe) => recipe.title), ["T1", "T2", "T5"]);
  assert.throws(() => selectRecipes(seed, 3, [42]), /recipe_42/);
});

test("assignSlugs: aynı başlıkta görsel numarası eklenir", () => {
  const slugs = assignSlugs([fixture({ title: "Hurma Brownie", thumbnailUrl: IMG(10) }), fixture({ title: "Hurma Brownie", thumbnailUrl: IMG(23) })]);
  assert.deepEqual(slugs.map((recipe) => recipe.slug), ["hurma-brownie", "hurma-brownie-23"]);
});

test("applyPrepTimeOverrides yalnızca 'before' seed ile eşleşirse uygular", () => {
  const seed = [fixture(), fixture({ title: "Başka", prepTime: "30 dk" })];
  const { recipes, applied } = applyPrepTimeOverrides(seed, [
    { title: "Lavaş Burger", before: "15 dk", minutes: 20 },
    { title: "Başka", before: "15 dk", minutes: 5 },
  ]);
  assert.equal(recipes[0].prepTime, "20 dk");
  assert.equal(recipes[1].prepTime, "30 dk");
  assert.equal(applied.length, 1);
});

test("recipeCategory ve relatedRecipes", () => {
  assert.equal(recipeCategory("Red Velvet Pankek Pasta"), "Tatlı");
  assert.equal(recipeCategory("Tuzlu Pankek"), "Kahvaltı");
  assert.equal(recipeCategory("Lavaş Burger"), "Ana yemek");
  assert.equal(recipeCategory("Tek Malzeme"), null);
  const all = assignSlugs(["Brownie", "Lavaş Burger", "Kek", "Pizza", "Mousse", "Omlet"].map((title, n) => fixture({ title, thumbnailUrl: IMG(n + 1) })));
  const related = relatedRecipes(all[0], all);
  assert.equal(related.length, 4);
  assert.ok(!related.includes(all[0]));
  assert.deepEqual(related.slice(0, 2).map((recipe) => recipe.title), ["Kek", "Mousse"]);
});

test("tarif sayfası: Recipe ve BreadcrumbList JSON-LD ayrıştırılır, sahte puan yok", () => {
  const recipes = assignSlugs([fixture(), fixture({ title: "Protein Kek", thumbnailUrl: IMG(8) })]);
  const html = renderRecipePage(recipes[0], recipes, VERSIONS);
  const blocks = jsonLdBlocks(html);
  const recipe = blocks.find((block) => block["@type"] === "Recipe");
  const breadcrumb = blocks.find((block) => block["@type"] === "BreadcrumbList");
  assert.ok(recipe && breadcrumb);
  assert.equal(recipe.totalTime, "PT15M");
  assert.equal(recipe.recipeYield, "4 porsiyon");
  assert.equal(recipe.nutrition.proteinContent, "41 g");
  assert.deepEqual(recipe.recipeIngredient, ["1 adet lavaş (65 g)", "1 dilim kaşar"]);
  assert.equal(recipe.recipeInstructions[0]["@type"], "HowToStep");
  assert.equal(recipe.aggregateRating, undefined);
  assert.equal(breadcrumb.itemListElement.length, 3);
  assert.match(html, /<link rel="canonical" href="https:\/\/hea-life.com\/tarifler\/lavas-burger.html" \/>/);
  assert.match(html, /href="\/styles\/tokens.css\?v=1"/);
  assert.doesNotMatch(html, /\s(?:href|src)="(?!\/|https:|#)/, "tüm yerel yollar kökten mutlak olmalı");
});

test("hub sayfası: ItemList JSON-LD tüm tarifleri sayar", () => {
  const recipes = assignSlugs([fixture(), fixture({ title: "Protein Kek", thumbnailUrl: IMG(8) })]);
  const blocks = jsonLdBlocks(renderHubPage(recipes, VERSIONS));
  const itemList = blocks.find((block) => block["@type"] === "ItemList");
  assert.equal(itemList.itemListElement.length, 2);
  assert.equal(itemList.itemListElement[1].url, "https://hea-life.com/tarifler/protein-kek.html");
});

test("üretilmiş tarifler/ sayfaları: JSON-LD geçerli, emoji yok, yollar mutlak", { skip: !existsSync(RECIPES_DIR) }, () => {
  const files = readdirSync(RECIPES_DIR).filter((file) => file.endsWith(".html"));
  assert.ok(files.includes("index.html"));
  for (const file of files) {
    const html = readFileSync(join(RECIPES_DIR, file), "utf8");
    const blocks = jsonLdBlocks(html);
    assert.ok(blocks.length >= 2, `${file}: JSON-LD eksik`);
    if (file !== "index.html") {
      const recipe = blocks.find((block) => block["@type"] === "Recipe");
      assert.ok(recipe, `${file}: Recipe yok`);
      assert.ok(recipe.recipeIngredient.length > 0 && recipe.recipeInstructions.length > 0, file);
      assert.match(recipe.totalTime, /^PT(\d+H)?(\d+M)?$/, file);
    }
    // Footer'daki © da Extended_Pictographic sayılıyor; emoji değil.
    assert.doesNotMatch(html.replace(/[©®™]/g, ""), /\p{Extended_Pictographic}/u, `${file}: emoji kalmış`);
    assert.doesNotMatch(html, /aggregateRating|"review"/, file);
    assert.doesNotMatch(html, /\s(?:href|src)="(?!\/|https:|#)/, `${file}: göreli yol`);
    const title = html.match(/<title>([^<]*)<\/title>/)[1];
    assert.ok(title.length <= PAGE_TITLE_MAX, `${file}: ${title}`);
  }
});
