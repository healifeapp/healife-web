#!/usr/bin/env node
// Canlı DB'nin dışa aktarımından tarifler/ ve rehber/ altındaki statik
// sayfaları üretir.
//
//   node tools/build-recipes.mjs --source <explore-free.json>
//
// --source: Explore koleksiyonunun aktif ve ücretsiz kayıtlarının JSON dizisi
// (category: recipes | mini_guides | quick_tips | training). Dosya bu repoya
// kopyalanmaz; yalnızca okunur. Premium ya da pasif bir kayıt gelirse yine de
// yayınlanmaz.
//
// stdout'a yalnızca sitemap.xml'e eklenecek <url> parçası basılır; ilerleme
// stderr'e gider. Böylece `node tools/build-recipes.mjs --source x.json > parca.xml`
// çalışır.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assignSlugs,
  extractAssetVersions,
  extractHomeRecipeNumbers,
  prepareGuides,
  prepareRecipes,
  renderGuidePage,
  renderGuidesHubPage,
  renderHubPage,
  renderRecipePage,
  sitemapFragment,
} from "./recipe-helpers.mjs";

const SITE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RECIPES_DIR = join(SITE_ROOT, "tarifler");
const GUIDES_DIR = join(SITE_ROOT, "rehber");
const CHROME_SOURCE = join(SITE_ROOT, "hakkimizda.html");
const HOME_PAGE = join(SITE_ROOT, "index.html");

function log(message) {
  process.stderr.write(`${message}\n`);
}

function parseArgs(argv) {
  const options = { sourcePath: null, withGuides: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--source") options.sourcePath = resolve(argv[++index] ?? "");
    else if (arg === "--with-guides") options.withGuides = true;
    else throw new Error(`Bilinmeyen argüman: ${arg}`);
  }
  if (!options.sourcePath) throw new Error("--source <explore-free.json> gerekli");
  return options;
}

function loadSource(path) {
  if (!existsSync(path)) throw new Error(`Kaynak dosya yok: ${path}`);
  const items = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(items) || items.length === 0) throw new Error(`${path} boş ya da dizi değil`);
  return items;
}

// Listeden düşen bir tarifin eski sayfası sunucuda kalmasın diye klasördeki
// her .html bu üretimin çıktısı olmalı.
function writePages(dir, pages) {
  mkdirSync(dir, { recursive: true });
  for (const [file, html] of pages) writeFileSync(join(dir, file), html);
  for (const file of readdirSync(dir)) {
    if (file.endsWith(".html") && !pages.has(file)) {
      unlinkSync(join(dir, file));
      log(`Silindi (artık yayında değil): ${dir.slice(SITE_ROOT.length + 1)}/${file}`);
    }
  }
}

function main() {
  const { sourcePath, withGuides } = parseArgs(process.argv.slice(2));
  const items = loadSource(sourcePath);
  // Rehber metinleri uzman onayı bekliyor (2.11.2026: kaynaksız/hatalı sağlık
  // iddiaları). Onaylanana kadar varsayılan üretim rehber yayınlamaz.
  const versions = { ...extractAssetVersions(readFileSync(CHROME_SOURCE, "utf8")), guidesEnabled: withGuides };
  const homeNumbers = extractHomeRecipeNumbers(readFileSync(HOME_PAGE, "utf8"));

  const prepared = prepareRecipes(items, homeNumbers);
  const recipes = assignSlugs(prepared.recipes);
  const { guides, skipped: skippedGuides } = withGuides ? prepareGuides(items) : { guides: [], skipped: [] };
  if (withGuides && guides.length === 0) throw new Error("Yayınlanacak rehber yok");

  const recipePages = new Map([["index.html", renderHubPage(recipes, versions)]]);
  for (const recipe of recipes) recipePages.set(`${recipe.slug}.html`, renderRecipePage(recipe, recipes, versions));
  writePages(RECIPES_DIR, recipePages);

  if (withGuides) {
    const guidePages = new Map([["index.html", renderGuidesHubPage(guides, versions)]]);
    for (const guide of guides) guidePages.set(`${guide.slug}.html`, renderGuidePage(guide, guides, recipes, versions));
    writePages(GUIDES_DIR, guidePages);
  } else if (existsSync(GUIDES_DIR)) {
    rmSync(GUIDES_DIR, { recursive: true });
    log("rehber/ kaldırıldı (--with-guides verilmedi)");
  }

  log(`Kaynak: ${sourcePath} (${items.length} kayıt)`);
  log(`Ana sayfadaki tarifler (recipe_N): ${homeNumbers.join(", ")}`);
  for (const { title, reason } of [...prepared.skipped, ...skippedGuides]) log(`Atlandı: ${title} (${reason})`);
  log(`Yazıldı: tarifler/ (${recipes.length} tarif + index)`);
  if (withGuides) log(`Yazıldı: rehber/ (${guides.length} rehber + index): ${guides.map((guide) => guide.slug).join(", ")}`);

  process.stdout.write(`${sitemapFragment(recipes, guides)}\n`);
}

try {
  main();
} catch (error) {
  log(`build-recipes başarısız: ${error.message}`);
  process.exit(1);
}
