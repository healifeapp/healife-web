import test from "node:test";
import assert from "node:assert";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  renderGuideContent,
  buildArticleJsonLd,
  prepareGuides,
  guidePageTitle,
  guideRecipeLinks,
  renderGuidePage,
  extractAssetVersions,
  slugify,
  PAGE_TITLE_MAX,
} from "../tools/recipe-helpers.mjs";

const SITE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// rehber/ yalnızca --with-guides ile üretilir; hangisi varsa o denetlenir.
const GENERATED_DIRS = ["tarifler", "rehber"].map((dir) => join(SITE_ROOT, dir)).filter((dir) => existsSync(dir));
// DB dışa aktarımı repoda tutulmaz; premium kontrolü için yolu bu değişkenle ver:
// EXPLORE_SOURCE=/yol/explore-free.json node --test test/
const EXPLORE_SOURCE = process.env.EXPLORE_SOURCE;

const VERSIONS = extractAssetVersions(`
  <link href="styles/tokens.css?v=1" /><link href="styles/base.css?v=2" />
  <link href="styles/sections.css?v=3" /><img src="assets/brand/logo.svg?v=4" />
  <link href="assets/brand/icon.png?v=5" /><script src="scripts/consent.js?v=6"></script>
  <img src="assets/brand/cards/mastercard.svg?v=7" /><img src="assets/brand/cards/visa.svg?v=7" />
  <img src="assets/brand/cards/amex.svg?v=7" /><img src="assets/brand/cards/troy.svg?v=7" />
`);

function guide(overrides = {}) {
  return {
    _id: "g1",
    title: "Yumurta",
    description: "Yumurta seçimi ve pişirme önerileri.",
    thumbnailUrl: "https://res.cloudinary.com/dcth0hfqd/image/upload/v1/explore/images/egg.jpg",
    category: "quick_tips",
    isActive: true,
    isPremium: false,
    readTime: "1 dk",
    tags: ["yumurta", "protein"],
    createdAt: "2026-07-02T12:44:11.790Z",
    updatedAt: "2026-08-20T09:58:18.912Z",
    content: "**YUMURTA**\n\n- Ucuz protein kaynağıdır.\n- - Alt madde",
    ...overrides,
  };
}

function jsonLdBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
}

function generatedPages() {
  return GENERATED_DIRS.filter((dir) => existsSync(dir)).flatMap((dir) =>
    readdirSync(dir)
      .filter((file) => file.endsWith(".html"))
      .map((file) => ({ dir, file, html: readFileSync(join(dir, file), "utf8") })),
  );
}

test("renderGuideContent: başlık, madde, alt madde, kalın; geri kalan her şey kaçırılır", () => {
  const html = renderGuideContent(
    "**Başlık <b>**\n\n- Normal **kalın** madde\n- - Alt madde\n- \nDüz satır & <script>alert(1)</script>\n- ***Yarım yıldız (Baklava)\n**Kapanmamış başlık*",
  );
  assert.equal(
    html.split(/\n\s*/).join("\n"),
    [
      "<h2>Başlık &lt;b&gt;</h2>",
      '<ul class="guide__list">',
      "<li>Normal <strong>kalın</strong> madde</li>",
      '<li class="guide__sub">Alt madde</li>',
      "</ul>",
      "<p>Düz satır &amp; &lt;script&gt;alert(1)&lt;/script&gt;</p>",
      '<ul class="guide__list">',
      "<li>Yarım yıldız (Baklava)</li>",
      "</ul>",
      "<h2>Kapanmamış başlık</h2>",
    ].join("\n"),
  );
  assert.doesNotMatch(renderGuideContent('- <img src=x onerror="alert(1)">'), /<img/);
});

test("prepareGuides: premium, pasif ve içeriksiz rehber yayınlanmaz", () => {
  const { guides, skipped } = prepareGuides([
    guide(),
    guide({ title: "Gizli", isPremium: true }),
    guide({ title: "Pasif", isActive: false }),
    guide({ title: "Boş", content: "  " }),
    { title: "Tarif", category: "recipes" },
  ], new Map([["yumurta", "**Düzeltilmiş**\n- Metin"], ["gizli", "x"], ["pasif", "x"], ["bos", "x"]]));
  assert.deepEqual(guides.map((item) => item.slug), ["yumurta"]);
  assert.deepEqual(skipped.map((entry) => entry.reason), ["premium", "aktif değil", "içerik yok"]);
});

test("prepareGuides: DB metni değil düzeltilmiş metin yayınlanır; düzeltmesi olmayan atlanır", () => {
  const { guides, skipped } = prepareGuides(
    [guide(), guide({ title: "Uyku" })],
    new Map([["yumurta", "**Düzeltilmiş başlık**\n- doğru bilgi"]]),
  );
  assert.equal(guides.length, 1);
  assert.equal(guides[0].content, "**Düzeltilmiş başlık**\n- doğru bilgi");
  assert.equal(guides[0].readTime, "1 dk");
  assert.deepEqual(skipped, [{ title: "Uyku", reason: "düzeltilmiş metin yok" }]);
  assert.equal(prepareGuides([guide()]).guides.length, 0);
});

test("Article JSON-LD: tarihler, görsel, yayıncı", () => {
  const article = buildArticleJsonLd({ ...guide(), slug: "yumurta" });
  assert.equal(article["@type"], "Article");
  assert.equal(article.headline, "Yumurta");
  assert.equal(article.datePublished, "2026-07-02");
  assert.equal(article.dateModified, "2026-08-20");
  assert.equal(article.publisher["@id"], "https://hea-life.com/#org");
  assert.ok(article.image.every((url) => url.includes("/image/upload/f_jpg,q_auto,c_fill,ar_")));
  assert.equal(guidePageTitle({ title: "Uyku & Toparlanma" }), "Uyku & Toparlanma Rehberi | Healife");
});

test("rehber sayfası: JSON-LD ayrıştırılır, uyarı ve kaynak bağlantısı var, yumurta tarifleri bağlanır", () => {
  const recipes = [
    { title: "Sebzeli Omlet", slug: "sebzeli-omlet", ingredients: ["2 yumurta"], calories: 200, prepTime: "10 dk", macros: { protein: 14 }, thumbnailUrl: "https://res.cloudinary.com/x/image/upload/explore/recipes/recipe_58.jpg" },
    { title: "Tavuk", slug: "tavuk", ingredients: ["tavuk"], calories: 300, prepTime: "20 dk", macros: { protein: 40 }, thumbnailUrl: "https://res.cloudinary.com/x/image/upload/explore/recipes/recipe_6.jpg" },
  ];
  const item = { ...guide(), slug: "yumurta" };
  assert.deepEqual(guideRecipeLinks(item, recipes).map((recipe) => recipe.slug), ["sebzeli-omlet"]);
  const html = renderGuidePage(item, [item, { ...guide({ title: "Antrenman", category: "training" }), slug: "antrenman" }], recipes, VERSIONS);
  const types = jsonLdBlocks(html).map((block) => block["@type"]);
  assert.deepEqual(types, ["Article", "BreadcrumbList"]);
  assert.match(html, /Genel bilgilendirme amaçlıdır; tıbbi tavsiye değildir/);
  assert.match(html, /href="\/sources.html"/);
  assert.match(html, /href="\/tarifler\/sebzeli-omlet.html"/);
  assert.doesNotMatch(html, /href="\/tarifler\/tavuk.html"/);
});

test("üretilmiş tüm sayfalar: başlık ≤60, canonical benzersiz, JSON-LD geçerli", { skip: GENERATED_DIRS.length === 0 }, () => {
  const canonicals = new Map();
  const pages = generatedPages();
  assert.ok(pages.some((page) => page.dir.endsWith("tarifler") && page.file === "index.html"));
  for (const { dir, file, html } of pages) {
    const name = `${dir.slice(SITE_ROOT.length + 1)}/${file}`;
    const title = html.match(/<title>([^<]*)<\/title>/)[1];
    assert.ok(title.length <= PAGE_TITLE_MAX, `${name}: ${title} (${title.length})`);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)[1];
    assert.ok(!canonicals.has(canonical), `${name}: canonical ${canonical} ${canonicals.get(canonical)} ile aynı`);
    canonicals.set(canonical, name);
    assert.ok(jsonLdBlocks(html).length >= 2, `${name}: JSON-LD eksik`);
    if (dir.endsWith("rehber") && file !== "index.html") {
      assert.ok(jsonLdBlocks(html).some((block) => block["@type"] === "Article"), `${name}: Article yok`);
    }
  }
});

test("hiçbir premium kayıt yayınlanmaz (EXPLORE_SOURCE ile)", { skip: !EXPLORE_SOURCE && "EXPLORE_SOURCE verilmedi" }, () => {
  const items = JSON.parse(readFileSync(EXPLORE_SOURCE, "utf8"));
  const bySlug = new Map();
  for (const item of items) {
    const slug = slugify(item.title);
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), item]);
  }
  for (const { dir, file } of generatedPages()) {
    if (file === "index.html") continue;
    // "hurma-brownie-23" gibi çakışma ekli slug'larda ek, görsel numarasıdır.
    const slug = file.replace(/\.html$/, "");
    const matches = bySlug.get(slug) ?? bySlug.get(slug.replace(/-\d+$/, "")) ?? [];
    assert.ok(matches.length > 0, `${dir}/${file}: dışa aktarımda karşılığı yok`);
    assert.ok(matches.every((item) => item.isPremium !== true && item.isActive !== false), `${file}: premium ya da pasif kayıt yayında`);
  }
});
