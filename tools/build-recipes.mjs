#!/usr/bin/env node
// Backend'deki tarif seed'inden tarifler/ altındaki statik sayfaları üretir.
//
//   node tools/build-recipes.mjs [seedPath] [--count 20] [--preptimes <json>]
//
// seedPath: dcp_ai_fitness_backend/src/seeds/exploreRecipes.js (CommonJS).
// Seed bu repoya kopyalanmaz; yalnızca okunur.
// --preptimes: backend'in scripts/.recipe-preptimes.json dosyası (prod'a
// uygulanmış güncel süreler). Varsayılan yol yoksa seed süreleri kullanılır.
//
// stdout'a yalnızca sitemap.xml'e eklenecek <url> parçası basılır; ilerleme
// stderr'e gider. Böylece `node tools/build-recipes.mjs > parca.xml` çalışır.

import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyPrepTimeOverrides,
  assignSlugs,
  extractAssetVersions,
  extractHomeRecipeNumbers,
  renderHubPage,
  renderRecipePage,
  selectRecipes,
  sitemapFragment,
} from "./recipe-helpers.mjs";

const SITE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIR = join(SITE_ROOT, "tarifler");
const CHROME_SOURCE = join(SITE_ROOT, "hakkimizda.html");
const HOME_PAGE = join(SITE_ROOT, "index.html");
const BACKEND_ROOT = resolve(SITE_ROOT, "..", "dcp_ai_fitness_backend");
const DEFAULT_SEED_PATH = join(BACKEND_ROOT, "src", "seeds", "exploreRecipes.js");
const DEFAULT_PREPTIMES_PATH = join(BACKEND_ROOT, "scripts", ".recipe-preptimes.json");
const DEFAULT_COUNT = 20;

function log(message) {
  process.stderr.write(`${message}\n`);
}

function parseArgs(argv) {
  const options = { seedPath: DEFAULT_SEED_PATH, count: DEFAULT_COUNT, prepTimesPath: DEFAULT_PREPTIMES_PATH };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--count") {
      options.count = Number(argv[++index]);
      if (!Number.isInteger(options.count) || options.count < 1) {
        throw new Error(`--count pozitif bir tam sayı olmalı, gelen: ${argv[index]}`);
      }
    } else if (arg === "--preptimes") {
      options.prepTimesPath = resolve(argv[++index] ?? "");
    } else if (arg.startsWith("--")) {
      throw new Error(`Bilinmeyen seçenek: ${arg}`);
    } else {
      options.seedPath = resolve(arg);
    }
  }
  return options;
}

function loadSeed(seedPath) {
  const require = createRequire(import.meta.url);
  const { recipeSeedData } = require(seedPath);
  if (!Array.isArray(recipeSeedData) || recipeSeedData.length === 0) {
    throw new Error(`${seedPath} içinde recipeSeedData dizisi yok ya da boş`);
  }
  for (const recipe of recipeSeedData) {
    const valid =
      typeof recipe.title === "string" &&
      typeof recipe.description === "string" &&
      typeof recipe.thumbnailUrl === "string" &&
      Number.isFinite(recipe.calories) &&
      recipe.macros &&
      ["protein", "carb", "fat"].every((key) => Number.isFinite(recipe.macros[key])) &&
      Array.isArray(recipe.ingredients) &&
      Array.isArray(recipe.steps);
    if (!valid) throw new Error(`Seed'de eksik alanlı tarif: ${JSON.stringify(recipe.title)}`);
  }
  return recipeSeedData;
}

function loadPrepTimeOverrides(path) {
  if (!existsSync(path)) {
    log(`Süre dosyası yok (${path}); seed süreleri kullanılıyor.`);
    return [];
  }
  const overrides = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(overrides)) throw new Error(`${path} bir dizi değil`);
  return overrides;
}

function removeStalePages(keepFiles) {
  if (!existsSync(OUTPUT_DIR)) return;
  for (const file of readdirSync(OUTPUT_DIR)) {
    if (file.endsWith(".html") && !keepFiles.has(file)) {
      unlinkSync(join(OUTPUT_DIR, file));
      log(`Silindi (artık listede değil): tarifler/${file}`);
    }
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const seed = loadSeed(options.seedPath);
  const { recipes: timedSeed, applied } = applyPrepTimeOverrides(seed, loadPrepTimeOverrides(options.prepTimesPath));
  const versions = extractAssetVersions(readFileSync(CHROME_SOURCE, "utf8"));
  const homeNumbers = extractHomeRecipeNumbers(readFileSync(HOME_PAGE, "utf8"));

  const { selected, skipped } = selectRecipes(timedSeed, options.count, homeNumbers);
  const recipes = assignSlugs(selected);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const files = new Set(["index.html"]);
  for (const recipe of recipes) {
    const file = `${recipe.slug}.html`;
    files.add(file);
    writeFileSync(join(OUTPUT_DIR, file), renderRecipePage(recipe, recipes, versions));
  }
  writeFileSync(join(OUTPUT_DIR, "index.html"), renderHubPage(recipes, versions));
  removeStalePages(files);

  log(`Seed: ${options.seedPath} (${seed.length} tarif)`);
  log(`Ana sayfadaki tarifler (recipe_N): ${homeNumbers.join(", ")}`);
  const appliedInSelection = applied.filter((change) => recipes.some((recipe) => recipe.title === change.title));
  log(`Güncel süre uygulandı: ${applied.length} tarif (seçilenlerde ${appliedInSelection.length}: ${appliedInSelection.map((change) => `${change.title} ${change.from}→${change.to}`).join("; ") || "yok"})`);
  const skippedEarly = skipped.filter((recipe) => seed.indexOf(recipe) < seed.indexOf(selected[selected.length - 1]));
  if (skippedEarly.length) log(`İçeriği birebir tekrar eden, atlanan: ${skippedEarly.map((recipe) => recipe.title).join(", ")}`);
  log(`Yazıldı: tarifler/index.html + ${recipes.length} tarif sayfası`);
  for (const recipe of recipes) log(`  ${recipe.slug}`);

  process.stdout.write(`${sitemapFragment(recipes)}\n`);
}

try {
  main();
} catch (error) {
  log(`build-recipes başarısız: ${error.message}`);
  process.exit(1);
}
