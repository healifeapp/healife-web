// Tarif sayfaları için saf yardımcılar ve HTML şablonları.
// tools/build-recipes.mjs dosya okuma/yazmayı yapar; burada yan etki yok,
// böylece test/recipes.test.js her şeyi diske dokunmadan doğrulayabilir.

export const SITE_ORIGIN = "https://hea-life.com";
export const RECIPES_PATH = "/tarifler/";
export const DATE_PUBLISHED = "2026-11-02";
export const RECIPES_CSS_VERSION = "20261102b";
export const PAGE_TITLE_MAX = 60;
export const META_DESCRIPTION_MAX = 160;
export const RELATED_COUNT = 4;
export const ORG_ID = `${SITE_ORIGIN}/#org`;
export const START_URL = "/start/";
export const DOWNLOAD_URL = "/indir.html";

const MINUTES_PER_HOUR = 60;
const HEADING_MAX_LENGTH = 40;
const HUB_EAGER_IMAGES = 4;

const DIFFICULTY_LABELS = { easy: "Kolay", medium: "Orta", hard: "Zor" };

// Başlıktaki anahtar kelimeye göre kategori. Sıra önemli: "Fırında Baharatlı
// Tatlı Patates" tatlı değil; "Tavuklu Sebze Sote" sebze yemeği değil ana yemek.
// Eşleşmeyen tarifte recipeCategory hiç yazılmaz; uydurma bir kategori, eksik
// olandan kötü. Hub'da bunlar "Diğer" altında listelenir.
const CATEGORY_RULES = [
  ["Sebze yemekleri", /tatlı patates/],
  ["Tatlı", /cheesecake|brownie|\bkek\b|mousse|\bmus\b|dondurma|revani|tatlı|puding|sufle|pasta|kurabiye|tiramisu|sütlaç|\bbar\b|barı|toplar|muffin/],
  ["Salata", /salata/],
  ["İçecek", /smoothie|limonata|\bsüt\b|içecek|ayran|(?<![a-zçğıöşü])çay(?![a-zçğıöşü])/],
  ["Kahvaltı", /pankek|pancake|omlet|kahvaltı|lapası|menemen|\btost\b/],
  ["Hamur işi", /böre[kğ]|ekmek|pide|poğaça/],
  ["Atıştırmalık", /kraker|çubuk|atıştırmalık|cips|ara öğün|rulo|dilimleri|humus|kasesi|püresi|fırın nohut|fıstık ezmeli/],
  ["Ana yemek", /pizza|burger|tavuk|tenders|köfte|somon|kıyma|sandviç|dürüm|wrap|çorba|makarna|ton balık|hindi|tabağı/],
  ["Sebze yemekleri", /zeytinyağlı|söğürme|ekşili|karnabahar|patates|kabak|mantar|brokoli|ıspanak|sebze|semizotu|biber|havuç|mücver|nohut|fasulye|enginar|patlıcan/],
];

// Hub'daki grup sırası: önce öğünler, sonra ara öğün ve tatlılar.
export const CATEGORY_ORDER = ["Ana yemek", "Kahvaltı", "Salata", "Sebze yemekleri", "Hamur işi", "Atıştırmalık", "Tatlı", "İçecek"];
export const UNCATEGORIZED_LABEL = "Diğer";

const TURKISH_ASCII = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

export function slugify(text) {
  return text
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşüâîû]/g, (char) => TURKISH_ASCII[char])
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function stripEmoji(text) {
  return text
    .replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{200D}\u{20E3}]/gu, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?)])/g, "$1")
    .replace(/\(\s+/g, "(")
    .trim();
}

// "10 dk" → 10, "1 saat 15 dk" → 75. Okunamayan biçimde null döner; çağıran
// taraf süreyi hiç yazmamayı seçer, tahmin etmez.
export function prepTimeToMinutes(prepTime) {
  if (typeof prepTime !== "string") return null;
  const text = prepTime.toLocaleLowerCase("tr");
  const hourMatch = text.match(/(\d+)\s*(?:saat|sa\.?)(?![a-zçğıöşü])/);
  const minuteMatch = text.match(/(\d+)\s*(?:dk|dak|dakika|min)(?![a-zçğıöşü])/);
  if (!hourMatch && !minuteMatch) return null;
  const total =
    (hourMatch ? Number(hourMatch[1]) * MINUTES_PER_HOUR : 0) +
    (minuteMatch ? Number(minuteMatch[1]) : 0);
  return total > 0 ? total : null;
}

export function prepTimeToIsoDuration(prepTime) {
  const total = prepTimeToMinutes(prepTime);
  if (total == null) return null;
  const hours = Math.floor(total / MINUTES_PER_HOUR);
  const minutes = total % MINUTES_PER_HOUR;
  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}`;
}

export function difficultyLabel(difficulty) {
  return DIFFICULTY_LABELS[difficulty] ?? null;
}

export function recipeCategory(title) {
  const lower = title.toLocaleLowerCase("tr");
  const rule = CATEGORY_RULES.find(([, pattern]) => pattern.test(lower));
  return rule ? rule[0] : null;
}

function isNote(line) {
  return /^not\s*:/i.test(line);
}

function noteText(line) {
  return line.replace(/^not\s*:\s*/i, "");
}

// "Üzeri için:" gibi satırlar malzeme değil, bir sonraki malzemelerin başlığı.
// "Protein sos: 1 ölçek ..." ise iki nokta içerse de malzemedir.
export function isIngredientHeading(line) {
  return line.endsWith(":") && line.length <= HEADING_MAX_LENGTH;
}

export function parseIngredients(lines) {
  const groups = [{ heading: null, items: [] }];
  const notes = [];
  for (const raw of lines) {
    const line = stripEmoji(raw);
    if (!line) continue;
    if (isNote(line)) {
      notes.push(noteText(line));
    } else if (isIngredientHeading(line)) {
      groups.push({ heading: line.slice(0, -1).trim(), items: [] });
    } else {
      groups[groups.length - 1].items.push(line);
    }
  }
  return { groups: groups.filter((group) => group.items.length > 0), notes };
}

export function parseSteps(lines) {
  const steps = [];
  const notes = [];
  for (const raw of lines) {
    const line = stripEmoji(raw);
    if (!line) continue;
    if (isNote(line)) notes.push(noteText(line));
    else steps.push(line);
  }
  return { steps, notes };
}

// Notlardaki "tarif 4 porsiyon çıkarır" / "Tarif 1 porsiyonluktur" ifadesinden
// recipeYield. Bulunamazsa null; porsiyon sayısı uydurulmaz.
export function parseYield(notes) {
  for (const note of notes) {
    const many = note.match(/tarif (?:yaklaşık )?(\d+) (?:küçük )?(porsiyon|dilim|adet|kase|bardak|top|disk|kurabiye|muffin|parça)\b[^;.]*?çıkarır/i);
    if (many) return `${many[1]} ${many[2]}`;
    const single = note.match(/tarif (\d+) porsiyonluktur/i);
    if (single) return `${single[1]} porsiyon`;
  }
  return null;
}

export function cloudinaryUrl(thumbnailUrl, transformation) {
  return thumbnailUrl.replace("/image/upload/", `/image/upload/${transformation}/`);
}

export function recipeNumber(thumbnailUrl) {
  const match = thumbnailUrl.match(/recipe_(\d+)\./);
  return match ? Number(match[1]) : null;
}

export function pageTitle(recipe) {
  const { title, calories, macros } = recipe;
  const candidates = [
    `${title} Tarifi: ${calories} kcal, ${macros.protein} g Protein | Healife`,
    `${title} Tarifi: ${calories} kcal | Healife`,
    `${title} Tarifi | Healife`,
    `${title} | Healife`,
  ];
  return candidates.find((candidate) => candidate.length <= PAGE_TITLE_MAX) ?? candidates[candidates.length - 1];
}

function truncateAtWord(text, maxLength) {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "")}…`;
}

export function metaDescription(recipe) {
  const macrosText = `1 porsiyon: ${recipe.calories} kcal, ${recipe.macros.protein} g protein, ${recipe.macros.carb} g karbonhidrat, ${recipe.macros.fat} g yağ.`;
  const room = META_DESCRIPTION_MAX - macrosText.length - 1;
  return `${truncateAtWord(recipe.description.trim(), room)} ${macrosText}`;
}

function contentKey(recipe) {
  return JSON.stringify([recipe.ingredients, recipe.steps]);
}

// Bazı kayıtlarda adımlar `steps` yerine `instructions` alanında; dizi string
// ya da {text}/{description} nesnesi olabilir.
function instructionLines(instructions) {
  if (!Array.isArray(instructions)) return [];
  return instructions
    .map((entry) => (typeof entry === "string" ? entry : entry?.text ?? entry?.description ?? ""))
    .filter((line) => typeof line === "string" && line.trim());
}

function skipReason(item) {
  if (item.isPremium === true) return "premium";
  if (item.isActive === false) return "aktif değil";
  if (typeof item.thumbnailUrl !== "string" || recipeNumber(item.thumbnailUrl) == null) return "görsel yok";
  if (!Array.isArray(item.ingredients) || item.ingredients.length === 0) return "malzeme yok";
  if (item.steps.length === 0) return "adım yok";
  const validNumbers =
    Number.isFinite(item.calories) &&
    item.macros &&
    ["protein", "carb", "fat"].every((key) => Number.isFinite(item.macros[key]));
  if (!validNumbers) return "kalori/makro eksik";
  if (typeof item.title !== "string" || typeof item.description !== "string") return "başlık/açıklama eksik";
  return null;
}

// DB dışa aktarımından yayınlanacak tarifler. Sıra görsel numarasıdır
// (recipe_<n>): DB'deki `order` panelden değişebilir, görsel numarası değişmez;
// böylece aynı başlıklı tariflerde slug sahibi ve tekrar elemesinde kalan
// tarif her üretimde aynıdır. Malzemesi ve adımları birebir aynı olan tarif
// ("Cheesecake" = "Protein Cheesecake") atlanır: aynı içeriği iki URL'de
// yayınlamak arama motorunda ikisini de zayıflatır. `requiredNumbers` ana
// sayfada kartı olan tarifler; biri yayınlanamıyorsa üretim durur.
export function prepareRecipes(items, requiredNumbers = []) {
  const skipped = [];
  const candidates = [];
  for (const raw of items) {
    if (raw.category !== "recipes") continue;
    const steps = Array.isArray(raw.steps) && raw.steps.length ? raw.steps : instructionLines(raw.instructions);
    const item = { ...raw, steps };
    const reason = skipReason(item);
    if (reason) skipped.push({ title: raw.title, reason });
    else candidates.push(item);
  }
  candidates.sort((a, b) => recipeNumber(a.thumbnailUrl) - recipeNumber(b.thumbnailUrl));
  const seen = new Map();
  const recipes = [];
  for (const recipe of candidates) {
    const key = contentKey(recipe);
    if (seen.has(key)) {
      skipped.push({ title: recipe.title, reason: `içerik "${seen.get(key)}" ile birebir aynı` });
      continue;
    }
    seen.set(key, recipe.title);
    recipes.push(recipe);
  }
  for (const number of requiredNumbers) {
    if (!recipes.some((recipe) => recipeNumber(recipe.thumbnailUrl) === number)) {
      throw new Error(`Ana sayfadaki recipe_${number} yayınlanacak tarifler arasında yok`);
    }
  }
  return { recipes, skipped };
}

// Aynı başlık iki kez geçerse ("Hurma Brownie") ikinciye görsel numarası
// eklenir; liste görsel numarasına göre sıralı geldiği için slug'lar sabit kalır.
export function assignSlugs(recipes) {
  const used = new Set();
  return recipes.map((recipe) => {
    let slug = slugify(recipe.title);
    if (used.has(slug)) slug = `${slug}-${recipeNumber(recipe.thumbnailUrl)}`;
    used.add(slug);
    return { ...recipe, slug };
  });
}

export function relatedRecipes(recipe, all, count = RELATED_COUNT) {
  const startIndex = all.findIndex((candidate) => candidate.slug === recipe.slug);
  const rotated = [...all.slice(startIndex + 1), ...all.slice(0, startIndex)];
  const category = recipeCategory(recipe.title);
  const sameCategory = category ? rotated.filter((candidate) => recipeCategory(candidate.title) === category) : [];
  const picked = sameCategory.slice(0, count);
  for (const candidate of rotated) {
    if (picked.length >= count) break;
    if (!picked.includes(candidate)) picked.push(candidate);
  }
  return picked;
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// JSON içindeki "</script>" bloğu erken kapatamasın.
export function jsonLdScript(data) {
  const json = JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">\n${json}\n    </script>`;
}

export function recipeUrl(slug) {
  return `${SITE_ORIGIN}${RECIPES_PATH}${slug}.html`;
}

const HUB_URL = `${SITE_ORIGIN}${RECIPES_PATH}`;

export function buildRecipeJsonLd(recipe) {
  const ingredients = parseIngredients(recipe.ingredients);
  const steps = parseSteps(recipe.steps);
  const notes = [...ingredients.notes, ...steps.notes];
  const recipeYield = parseYield(notes);
  const category = recipeCategory(recipe.title);
  const totalTime = prepTimeToIsoDuration(recipe.prepTime);
  const url = recipeUrl(recipe.slug);
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "@id": `${url}#recipe`,
    name: recipe.title,
    description: recipe.description.trim(),
    url,
    image: ["ar_1:1", "ar_4:3", "ar_16:9"].map((ratio) =>
      cloudinaryUrl(recipe.thumbnailUrl, `q_auto,c_fill,${ratio},w_1200`),
    ),
    author: { "@type": "Organization", "@id": ORG_ID, name: "Healife", url: `${SITE_ORIGIN}/` },
    datePublished: DATE_PUBLISHED,
    inLanguage: "tr",
    ...(totalTime && { totalTime }),
    ...(recipeYield && { recipeYield }),
    ...(category && { recipeCategory: category }),
    nutrition: {
      "@type": "NutritionInformation",
      servingSize: "1 porsiyon",
      calories: `${recipe.calories} calories`,
      proteinContent: `${recipe.macros.protein} g`,
      carbohydrateContent: `${recipe.macros.carb} g`,
      fatContent: `${recipe.macros.fat} g`,
    },
    recipeIngredient: ingredients.groups.flatMap((group) => group.items),
    recipeInstructions: steps.steps.map((text, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      text,
    })),
  };
}

function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, item], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item,
    })),
  };
}

// ── HTML ────────────────────────────────────────────────

// `versions` hakkimizda.html'den okunur: önbellek kırıcı ?v= değerleri sitenin
// geri kalanıyla elle senkron tutulmasın.
function asset(versions, path) {
  const version = versions[path];
  if (!version) throw new Error(`${path} için ?v= sürümü hakkimizda.html'de bulunamadı`);
  return `/${path}?v=${version}`;
}

function head({ versions, title, description, canonical, ogType, ogImage, ogImageAlt, jsonLd }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <meta name="theme-color" content="#0b0b0c" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:site_name" content="Healife" />
    <meta property="og:locale" content="tr_TR" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${ogImage.url}" />
    <meta property="og:image:width" content="${ogImage.width}" />
    <meta property="og:image:height" content="${ogImage.height}" />
    <meta property="og:image:alt" content="${escapeHtml(ogImageAlt)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${ogImage.url}" />
    <link rel="icon" href="${asset(versions, "assets/brand/icon.png")}" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preconnect" href="https://res.cloudinary.com" />
    <link
      rel="preload"
      as="style"
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap"
    />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap"
      media="print"
      onload="this.media='all'"
    />
    <noscript>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap"
      />
    </noscript>

    <link rel="stylesheet" href="${asset(versions, "styles/tokens.css")}" />
    <link rel="stylesheet" href="${asset(versions, "styles/base.css")}" />
    <link rel="stylesheet" href="${asset(versions, "styles/sections.css")}" />
    <link rel="stylesheet" href="/styles/recipes.css?v=${RECIPES_CSS_VERSION}" />

    ${jsonLd.map((data) => jsonLdScript(data)).join("\n    ")}
  </head>
`;
}

function topbar(versions, backHref, backLabel) {
  return `    <header class="topbar rcp-topbar">
      <div class="wrap topbar__inner">
        <a class="topbar__logo" href="/" aria-label="Healife ana sayfa">
          <img src="${asset(versions, "assets/brand/logo.svg")}" alt="Healife" width="130" height="24" />
        </a>
        <a class="topbar__cta" href="${backHref}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M19 12H6m0 0 5-5m-5 5 5 5" />
          </svg>
          ${backLabel}
        </a>
      </div>
    </header>`;
}

function footer(versions) {
  return `    <footer class="footer">
      <div class="wrap">
        <div class="footer__pay">
          <ul class="paycards" aria-label="Kabul edilen kartlar">
            <li><img src="${asset(versions, "assets/brand/cards/mastercard.svg")}" alt="Mastercard" width="34" height="21" loading="lazy" /></li>
            <li><img src="${asset(versions, "assets/brand/cards/visa.svg")}" alt="Visa" width="40" height="13" loading="lazy" /></li>
            <li><img src="${asset(versions, "assets/brand/cards/amex.svg")}" alt="American Express" width="28" height="28" loading="lazy" /></li>
            <li><img src="${asset(versions, "assets/brand/cards/troy.svg")}" alt="Troy" width="40" height="18" loading="lazy" /></li>
          </ul>
          <span>Web ödemeleri PayTR güvencesiyle</span>
        </div>
        <div class="footer__bottom">
          <span>© <span id="year">2026</span> Healife. Tüm hakları saklıdır.</span>
          <nav class="footer__legal" aria-label="Yasal">
            <a href="/">Ana sayfa</a>
            <a href="/hakkimizda.html">Hakkımızda</a>
            <a href="/iletisim.html">İletişim</a>
            <a href="/abonelik.html">Abonelik yönetimi</a>
            <a href="/legal.html#kullanim-kosullari">Hizmet Koşulları</a>
            <a href="/legal.html#gizlilik">Gizlilik</a>
            <a href="/legal.html#kvkk">KVKK</a>
            <a href="/legal.html#mesafeli-satis">Mesafeli Satış</a>
            <a href="/legal.html#cerez">Çerez Politikası</a>
            <button type="button" class="linklike" data-consent-open>Çerez tercihleri</button>
            <a href="/legal.html#sorumluluk-reddi">Sorumluluk Reddi</a>
            <a href="/legal.html#uyelik-sozlesmesi">Üyelik Sözleşmesi</a>
            <a href="/kalori-hesaplama.html">Kalori hesaplama</a>
            <a href="/makro-hesaplama.html">Makro hesaplama</a>
            <a href="/bazal-metabolizma-hesaplama.html">Bazal metabolizma</a>
            <a href="/tarifler/">Tarifler</a>
${versions.guidesEnabled ? '            <a href="/rehber/">Rehberler</a>\n' : ""}            <a href="/sources.html">Kaynaklar</a>
          </nav>
        </div>
      </div>
    </footer>

    <script>
      var y = document.getElementById("year");
      if (y) y.textContent = new Date().getFullYear();
    </script>
    <script src="${asset(versions, "scripts/consent.js")}" defer></script>
  </body>
</html>
`;
}

function crumbs(items) {
  const parts = items.map(([name, href], index) =>
    index === items.length - 1
      ? `<li><span aria-current="page">${escapeHtml(name)}</span></li>`
      : `<li><a href="${href}">${escapeHtml(name)}</a></li>`,
  );
  return `<nav class="crumbs" aria-label="Sayfa yolu">
            <ol>
              ${parts.join("\n              ")}
            </ol>
          </nav>`;
}

function card(recipe, headingTag, { eager = false } = {}) {
  const small = cloudinaryUrl(recipe.thumbnailUrl, "f_auto,q_auto,c_fill,ar_4:3,w_600");
  const large = cloudinaryUrl(recipe.thumbnailUrl, "f_auto,q_auto,c_fill,ar_4:3,w_1200");
  const loading = eager ? `loading="eager"` : `loading="lazy"`;
  return `<li>
                <a class="recipe recipe--link" href="${RECIPES_PATH}${recipe.slug}.html">
                  <div class="recipe__img">
                    <img src="${small}" srcset="${small} 600w, ${large} 1200w" sizes="(min-width: 1100px) 280px, (min-width: 600px) 45vw, 90vw" alt="${escapeHtml(recipe.title)}" width="600" height="450" ${loading} decoding="async" />
                    <span class="recipe__kcal">${recipe.calories} kcal</span>
                  </div>
                  <div class="recipe__body">
                    <${headingTag} class="recipe__title">${escapeHtml(recipe.title)}</${headingTag}>
                    <div class="recipe__foot"><span>${escapeHtml(recipe.prepTime)}</span><span>${recipe.macros.protein} g protein</span></div>
                  </div>
                </a>
              </li>`;
}

function ingredientsHtml(groups) {
  return groups
    .map((group) => {
      const heading = group.heading ? `<h3 class="rcp-ing__group">${escapeHtml(group.heading)}</h3>\n                ` : "";
      const items = group.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n                  ");
      return `${heading}<ul class="rcp-ing__list">
                  ${items}
                </ul>`;
    })
    .join("\n                ");
}

export function renderRecipePage(recipe, allRecipes, versions) {
  const url = recipeUrl(recipe.slug);
  const ingredients = parseIngredients(recipe.ingredients);
  const steps = parseSteps(recipe.steps);
  const notes = [...ingredients.notes, ...steps.notes];
  const recipeYield = parseYield(notes);
  const difficulty = difficultyLabel(recipe.difficulty);
  const related = relatedRecipes(recipe, allRecipes);
  const title = pageTitle(recipe);
  const description = metaDescription(recipe);
  const heroSrc = (width) => cloudinaryUrl(recipe.thumbnailUrl, `f_auto,q_auto,c_fill,ar_3:2,w_${width}`);
  const ogImage = {
    url: cloudinaryUrl(recipe.thumbnailUrl, "q_auto,c_fill,ar_3:2,w_1200"),
    width: 1200,
    height: 800,
  };
  const breadcrumb = breadcrumbJsonLd([
    ["Ana sayfa", `${SITE_ORIGIN}/`],
    ["Tarifler", HUB_URL],
    [recipe.title, url],
  ]);
  const metaItems = [
    `<li><span class="rcp-meta__label">Hazırlık</span> ${escapeHtml(recipe.prepTime)}</li>`,
    difficulty && `<li><span class="rcp-meta__label">Zorluk</span> ${difficulty}</li>`,
    recipeYield && `<li><span class="rcp-meta__label">Verim</span> ${escapeHtml(recipeYield)}</li>`,
  ].filter(Boolean);
  const notesHtml = notes.length
    ? `
              <div class="rcp-note">
                ${notes.map((note) => `<p><strong>Not:</strong> ${escapeHtml(note)}</p>`).join("\n                ")}
              </div>`
    : "";

  return `${head({
    versions,
    title,
    description,
    canonical: url,
    ogType: "article",
    ogImage,
    ogImageAlt: recipe.title,
    jsonLd: [buildRecipeJsonLd(recipe), breadcrumb],
  })}
  <body>
    <a class="skip-link" href="#main">İçeriğe geç</a>

${topbar(versions, RECIPES_PATH, "Tüm tarifler")}

    <main class="recipes" id="main">
      <div class="wrap">
        ${crumbs([["Ana sayfa", "/"], ["Tarifler", RECIPES_PATH], [recipe.title, null]])}

        <article class="rcp">
          <header class="rcp-hero">
            <figure class="rcp-hero__photo">
              <img src="${heroSrc(900)}" srcset="${heroSrc(600)} 600w, ${heroSrc(900)} 900w, ${heroSrc(1200)} 1200w" sizes="(min-width: 1240px) 640px, (min-width: 900px) 52vw, 100vw" alt="${escapeHtml(recipe.title)}" width="1200" height="800" fetchpriority="high" decoding="async" />
            </figure>
            <div class="rcp-hero__text">
              <h1>${escapeHtml(recipe.title)}</h1>
              <p class="rcp-lead">${escapeHtml(recipe.description.trim())}</p>
              <dl class="rcp-macros" aria-label="1 porsiyonun besin değerleri">
                <div class="rcp-macros__kcal"><dt>Kalori</dt><dd>${recipe.calories} <span>kcal</span></dd></div>
                <div class="rcp-macros__item rcp-macros__item--protein"><dt>Protein</dt><dd>${recipe.macros.protein} g</dd></div>
                <div class="rcp-macros__item rcp-macros__item--carb"><dt>Karbonhidrat</dt><dd>${recipe.macros.carb} g</dd></div>
                <div class="rcp-macros__item rcp-macros__item--fat"><dt>Yağ</dt><dd>${recipe.macros.fat} g</dd></div>
              </dl>
              <ul class="rcp-meta">
                ${metaItems.join("\n                ")}
              </ul>
              <p class="rcp-estimate">Değerler 1 porsiyon için yaklaşık tahmindir; kullandığın ürünlere, markaya ve porsiyon büyüklüğüne göre değişir.</p>
            </div>
          </header>

          <div class="rcp-body">
            <section class="rcp-ing" aria-labelledby="malzemeler">
              <h2 id="malzemeler">Malzemeler</h2>
              <div class="rcp-ing__groups">
                ${ingredientsHtml(ingredients.groups)}
              </div>
            </section>

            <section class="rcp-steps" aria-labelledby="hazirlanisi">
              <h2 id="hazirlanisi">Hazırlanışı</h2>
              <ol class="rcp-steps__list">
                ${steps.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("\n                ")}
              </ol>${notesHtml}
            </section>
          </div>
        </article>

        <aside class="rcp-cta" aria-labelledby="uygulama">
          <div>
            <h2 id="uygulama">Öğünlerini Healife ile takip et</h2>
            <p>Bu tarif ve daha fazlası uygulamanın Keşfet bölümünde. Hedefine göre günlük kalori ve makro planını oluştur, yediklerini kaydet.</p>
          </div>
          <div class="rcp-cta__actions">
            <a class="btn btn--primary" href="${START_URL}">Planını oluştur</a>
            <a class="btn btn--ghost" href="${DOWNLOAD_URL}">Uygulamayı indir</a>
          </div>
        </aside>

        <section class="rcp-related" aria-labelledby="diger-tarifler">
          <h2 id="diger-tarifler">Diğer tarifler</h2>
          <ul class="recipes__grid">
              ${related.map((other) => card(other, "h3")).join("\n              ")}
          </ul>
        </section>
      </div>
    </main>

${footer(versions)}`;
}

export const HUB_TITLE = "Fit Tarifler: Kalori ve Makro Değerleriyle | Healife";
export const HUB_DESCRIPTION =
  "Kalori, protein, karbonhidrat ve yağ değerleri yazılı fit tarifler: tavuk, kıyma, yumurta ve yulafla pratik yemekler, şekersiz tatlılar ve ara öğünler.";

// Hub'daki gruplar; ItemList de aynı sırayı izler ki görünen ve işaretlenen
// liste birbirini tutsun.
export function groupRecipes(recipes) {
  const groups = new Map([...CATEGORY_ORDER, UNCATEGORIZED_LABEL].map((label) => [label, []]));
  for (const recipe of recipes) groups.get(recipeCategory(recipe.title) ?? UNCATEGORIZED_LABEL).push(recipe);
  return [...groups].filter(([, items]) => items.length > 0).map(([label, items]) => ({ label, id: slugify(label), items }));
}

export function renderHubPage(recipes, versions) {
  const groups = groupRecipes(recipes);
  const ordered = groups.flatMap((group) => group.items);
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Fit tarifler",
    numberOfItems: ordered.length,
    itemListElement: ordered.map((recipe, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: recipeUrl(recipe.slug),
      name: recipe.title,
    })),
  };
  const breadcrumb = breadcrumbJsonLd([
    ["Ana sayfa", `${SITE_ORIGIN}/`],
    ["Tarifler", HUB_URL],
  ]);
  const ogSource = ordered[0];
  let cardIndex = 0;
  const groupSections = groups
    .map(
      (group) => `<section class="recipes__group" id="${group.id}" aria-labelledby="${group.id}-baslik">
          <h2 id="${group.id}-baslik">${escapeHtml(group.label)} <span class="recipes__count">${group.items.length}</span></h2>
          <ul class="recipes__grid">
              ${group.items.map((recipe) => card(recipe, "h3", { eager: cardIndex++ < HUB_EAGER_IMAGES })).join("\n              ")}
          </ul>
        </section>`,
    )
    .join("\n\n        ");

  return `${head({
    versions,
    title: HUB_TITLE,
    description: HUB_DESCRIPTION,
    canonical: HUB_URL,
    ogType: "website",
    ogImage: {
      url: cloudinaryUrl(ogSource.thumbnailUrl, "q_auto,c_fill,ar_3:2,w_1200"),
      width: 1200,
      height: 800,
    },
    ogImageAlt: ogSource.title,
    jsonLd: [itemList, breadcrumb],
  })}
  <body>
    <a class="skip-link" href="#main">İçeriğe geç</a>

${topbar(versions, "/", "Ana sayfaya dön")}

    <main class="recipes" id="main">
      <div class="wrap">
        ${crumbs([["Ana sayfa", "/"], ["Tarifler", null]])}

        <header class="recipes__head">
          <h1>Fit tarifler</h1>
          <p>
            Healife uygulamasının Keşfet bölümündeki ${ordered.length} ücretsiz
            tarifin hepsi burada. Her tarifte 1 porsiyonun kalorisi, protein,
            karbonhidrat ve yağ miktarı, hazırlık süresi ve zorluk derecesi
            yazıyor; böylece günlük kalori ve makro hedefine uyan öğünü
            pişirmeden önce seçebilirsin.
          </p>
          <p>
            Tariflerin çoğu tavuk göğsü, yağsız kıyma, yumurta, lor peyniri,
            yoğurt, sebze ve yulaf gibi her markette bulunan malzemelerle
            hazırlanıyor. Tatlılarda şeker yerine tatlandırıcı, hurma ya da muz
            kullanılıyor.
          </p>
          <p>
            Değerler, tarifteki miktarlara göre hesaplanmış tahminlerdir.
            Kullandığın markaya, porsiyonun büyüklüğüne ve pişirme yöntemine
            göre değişebilir. Yediklerini uygulamada kaydederek günlük hedefini
            takip edebilirsin.
          </p>
        </header>

        <nav class="recipes__jump" aria-label="Tarif grupları">
          <ul>
            ${groups.map((group) => `<li><a href="#${group.id}">${escapeHtml(group.label)}</a></li>`).join("\n            ")}
          </ul>
        </nav>

        ${groupSections}

        <aside class="rcp-cta" aria-labelledby="uygulama">
          <div>
            <h2 id="uygulama">Hedefine göre planını oluştur</h2>
            <p>Healife kısa bir testle günlük kalori ve makro hedefini hesaplar, öğünlerini ve antrenmanını buna göre planlar.</p>
          </div>
          <div class="rcp-cta__actions">
            <a class="btn btn--primary" href="${START_URL}">Planını oluştur</a>
            <a class="btn btn--ghost" href="${DOWNLOAD_URL}">Uygulamayı indir</a>
          </div>
        </aside>
      </div>
    </main>

${footer(versions)}`;
}

// ── Rehberler (/rehber/) ────────────────────────────────

export const GUIDES_PATH = "/rehber/";
const GUIDES_HUB_URL = `${SITE_ORIGIN}${GUIDES_PATH}`;
export const GUIDES_HUB_TITLE = "Beslenme ve Antrenman Rehberleri | Healife";
export const GUIDES_HUB_DESCRIPTION =
  "Kalori hesabı, uyku ve toparlanma, yumurta ve antrenman üzerine Healife'ın kısa rehberleri. Genel bilgilendirme amaçlıdır.";
const GUIDE_CATEGORIES = new Set(["mini_guides", "quick_tips", "training"]);
const GUIDE_KIND_LABELS = { mini_guides: "Mini rehber", quick_tips: "Kısa bilgi", training: "Antrenman rehberi" };
const RELATED_RECIPE_COUNT = 3;
const ORG_LOGO = `${SITE_ORIGIN}/assets/brand/icon.png`;

// Rehbere özel iç bağlantılar. Tarif bağlantıları sabit yazılmaz; tarif
// listesinden malzemeye göre seçilir (bkz. guideRecipeLinks).
const GUIDE_TOOL_LINKS = {
  "kalori-hesaplama": [
    { href: "/kalori-hesaplama.html", label: "Kalori hesaplama aracı", text: "Yaşına, boyuna, kilona ve aktivitene göre günlük kalori ihtiyacını hesapla." },
    { href: "/bazal-metabolizma-hesaplama.html", label: "Bazal metabolizma hesaplama", text: "Hiç hareket etmesen de harcadığın kaloriyi (BMR) hesapla." },
  ],
};
const GUIDE_RECIPE_INGREDIENT = { yumurta: /yumurta/ };

export function guideUrl(slug) {
  return `${SITE_ORIGIN}${GUIDES_PATH}${slug}.html`;
}

function isoDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

const TURKISH_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function turkishDate(isoDay) {
  const [year, month, day] = isoDay.split("-").map(Number);
  return `${day} ${TURKISH_MONTHS[month - 1]} ${year}`;
}

export function prepareGuides(items) {
  const skipped = [];
  const guides = [];
  for (const item of items) {
    if (!GUIDE_CATEGORIES.has(item.category)) continue;
    let reason = null;
    if (item.isPremium === true) reason = "premium";
    else if (item.isActive === false) reason = "aktif değil";
    else if (typeof item.content !== "string" || !item.content.trim()) reason = "içerik yok";
    else if (typeof item.thumbnailUrl !== "string" || !item.thumbnailUrl.includes("/image/upload/")) reason = "görsel yok";
    else if (!isoDate(item.createdAt)) reason = "createdAt yok";
    if (reason) skipped.push({ title: item.title, reason });
    else guides.push({ ...item, slug: slugify(item.title) });
  }
  guides.sort((a, b) => a.slug.localeCompare(b.slug));
  return { guides, skipped };
}

// Yalnızca paired **kalın** biçimlenir; kalan yıldızlar biçim artığıdır
// ("***Gün içerisinde ...") ve atılır. Metin önce kaçırılır, HTML üretilmez.
function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(\S(?:.*?\S)?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*+/g, "");
}

// DB'deki rehber metni: "**Başlık**" satırları, "- " maddeler, "- - " alt
// maddeler ve ara sıra düz satırlar. Bunun dışında hiçbir markdown desteklenmez.
export function renderGuideContent(content) {
  const html = [];
  let listOpen = false;
  const closeList = () => {
    if (listOpen) html.push("</ul>");
    listOpen = false;
  };
  for (const rawLine of content.split(/\r?\n/)) {
    const line = stripEmoji(rawLine);
    if (!line) {
      closeList();
      continue;
    }
    const heading = line.match(/^\*\*(.+?)\*{1,2}$/);
    if (heading && !heading[1].includes("**")) {
      closeList();
      html.push(`<h2>${inlineMarkdown(heading[1].trim())}</h2>`);
      continue;
    }
    const bullet = line.match(/^-\s*(-\s*)?(.*)$/);
    if (bullet) {
      if (!bullet[2].trim()) continue;
      if (!listOpen) html.push('<ul class="guide__list">');
      listOpen = true;
      const subClass = bullet[1] ? ' class="guide__sub"' : "";
      html.push(`<li${subClass}>${inlineMarkdown(bullet[2].trim())}</li>`);
      continue;
    }
    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  closeList();
  return html.join("\n              ");
}

export function guidePageTitle(guide) {
  const candidates = [`${guide.title} Rehberi | Healife`, `${guide.title} | Healife`];
  return candidates.find((candidate) => candidate.length <= PAGE_TITLE_MAX) ?? candidates[candidates.length - 1];
}

export function buildArticleJsonLd(guide) {
  const url = guideUrl(guide.slug);
  const organization = {
    "@type": "Organization",
    "@id": ORG_ID,
    name: "Healife",
    url: `${SITE_ORIGIN}/`,
    logo: { "@type": "ImageObject", url: ORG_LOGO },
  };
  const modified = isoDate(guide.updatedAt);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: guide.title,
    description: guide.description.trim(),
    url,
    mainEntityOfPage: url,
    image: ["ar_1:1", "ar_4:3", "ar_16:9"].map((ratio) =>
      cloudinaryUrl(guide.thumbnailUrl, `f_jpg,q_auto,c_fill,${ratio},w_1200`),
    ),
    author: organization,
    publisher: organization,
    datePublished: isoDate(guide.createdAt),
    ...(modified && { dateModified: modified }),
    inLanguage: "tr",
    ...(Array.isArray(guide.tags) && guide.tags.length && { keywords: guide.tags.join(", ") }),
  };
}

export function guideRecipeLinks(guide, recipes, count = RELATED_RECIPE_COUNT) {
  const pattern = GUIDE_RECIPE_INGREDIENT[guide.slug];
  if (!pattern) return [];
  const matches = recipes.filter((recipe) =>
    recipe.ingredients.some((line) => pattern.test(line.toLocaleLowerCase("tr"))),
  );
  // Adında da geçen tarif (omlet, yumurtalı salata) konuya en yakın olanı.
  const inTitle = matches.filter((recipe) => pattern.test(recipe.title.toLocaleLowerCase("tr")) || /omlet/.test(recipe.title.toLocaleLowerCase("tr")));
  return [...new Set([...inTitle, ...matches])].slice(0, count);
}

function guideCard(guide, headingTag) {
  const small = cloudinaryUrl(guide.thumbnailUrl, "f_auto,q_auto,c_fill,ar_4:3,w_600");
  const large = cloudinaryUrl(guide.thumbnailUrl, "f_auto,q_auto,c_fill,ar_4:3,w_1200");
  const readTime = guide.readTime ? `<span>${escapeHtml(guide.readTime)} okuma</span>` : "";
  return `<li>
                <a class="recipe recipe--link" href="${GUIDES_PATH}${guide.slug}.html">
                  <div class="recipe__img">
                    <img src="${small}" srcset="${small} 600w, ${large} 1200w" sizes="(min-width: 1100px) 280px, (min-width: 600px) 45vw, 90vw" alt="${escapeHtml(guide.title)}" width="600" height="450" loading="lazy" decoding="async" />
                  </div>
                  <div class="recipe__body">
                    <p class="guide-kind">${GUIDE_KIND_LABELS[guide.category]}</p>
                    <${headingTag} class="recipe__title">${escapeHtml(guide.title)}</${headingTag}>
                    <p>${escapeHtml(guide.description.trim())}</p>
                    <div class="recipe__foot">${readTime}</div>
                  </div>
                </a>
              </li>`;
}

export function renderGuidePage(guide, allGuides, recipes, versions) {
  const url = guideUrl(guide.slug);
  const published = isoDate(guide.createdAt);
  const modified = isoDate(guide.updatedAt) ?? published;
  const heroSrc = (width) => cloudinaryUrl(guide.thumbnailUrl, `f_auto,q_auto,c_fill,ar_3:2,w_${width}`);
  const tools = GUIDE_TOOL_LINKS[guide.slug] ?? [];
  const relatedRecipeItems = guideRecipeLinks(guide, recipes);
  const otherGuides = allGuides.filter((other) => other.slug !== guide.slug);
  const breadcrumb = breadcrumbJsonLd([
    ["Ana sayfa", `${SITE_ORIGIN}/`],
    ["Rehberler", GUIDES_HUB_URL],
    [guide.title, url],
  ]);
  const toolsHtml = tools.length
    ? `
        <section class="guide-links" aria-labelledby="araclar">
          <h2 id="araclar">Hesaplama araçları</h2>
          <ul>
            ${tools.map((tool) => `<li><a href="${tool.href}"><strong>${escapeHtml(tool.label)}</strong><span>${escapeHtml(tool.text)}</span></a></li>`).join("\n            ")}
          </ul>
        </section>`
    : "";
  const recipesHtml = relatedRecipeItems.length
    ? `
        <section class="rcp-related" aria-labelledby="ilgili-tarifler">
          <h2 id="ilgili-tarifler">İçinde ${escapeHtml(guide.title.toLocaleLowerCase("tr"))} olan tarifler</h2>
          <ul class="recipes__grid">
              ${relatedRecipeItems.map((recipe) => card(recipe, "h3")).join("\n              ")}
          </ul>
        </section>`
    : "";

  return `${head({
    versions,
    title: guidePageTitle(guide),
    description: truncateAtWord(guide.description.trim(), META_DESCRIPTION_MAX),
    canonical: url,
    ogType: "article",
    ogImage: { url: cloudinaryUrl(guide.thumbnailUrl, "f_jpg,q_auto,c_fill,ar_3:2,w_1200"), width: 1200, height: 800 },
    ogImageAlt: guide.title,
    jsonLd: [buildArticleJsonLd(guide), breadcrumb],
  })}
  <body>
    <a class="skip-link" href="#main">İçeriğe geç</a>

${topbar(versions, GUIDES_PATH, "Tüm rehberler")}

    <main class="recipes" id="main">
      <div class="wrap">
        ${crumbs([["Ana sayfa", "/"], ["Rehberler", GUIDES_PATH], [guide.title, null]])}

        <article class="guide-page">
          <header class="guide-page__head">
            <p class="guide-kind">${GUIDE_KIND_LABELS[guide.category]}</p>
            <h1>${escapeHtml(guide.title)}</h1>
            <p class="rcp-lead">${escapeHtml(guide.description.trim())}</p>
            <ul class="rcp-meta">
              ${guide.readTime ? `<li><span class="rcp-meta__label">Okuma</span> ${escapeHtml(guide.readTime)}</li>` : ""}
              <li><span class="rcp-meta__label">Güncelleme</span> <time datetime="${modified}">${turkishDate(modified)}</time></li>
            </ul>
          </header>
          <figure class="guide-page__photo">
            <img src="${heroSrc(900)}" srcset="${heroSrc(600)} 600w, ${heroSrc(900)} 900w, ${heroSrc(1200)} 1200w" sizes="(min-width: 860px) 780px, 100vw" alt="${escapeHtml(guide.title)}" width="1200" height="800" fetchpriority="high" decoding="async" />
          </figure>
          <div class="guide-page__body">
              ${renderGuideContent(guide.content)}
          </div>
          <div class="rcp-note guide-page__note">
            <p>Genel bilgilendirme amaçlıdır; tıbbi tavsiye değildir. Bir sağlık sorunun varsa beslenme veya antrenman düzenini değiştirmeden önce hekimine danış. Önerilerin hangi kaynaklara dayandığını <a href="/sources.html">Kaynaklar</a> sayfasında bulabilirsin.</p>
          </div>
        </article>
${toolsHtml}${recipesHtml}

        <aside class="rcp-cta" aria-labelledby="uygulama">
          <div>
            <h2 id="uygulama">Hedefine göre planını oluştur</h2>
            <p>Healife kısa bir testle günlük kalori ve makro hedefini hesaplar, öğünlerini ve antrenmanını buna göre planlar.</p>
          </div>
          <div class="rcp-cta__actions">
            <a class="btn btn--primary" href="${START_URL}">Planını oluştur</a>
            <a class="btn btn--ghost" href="${DOWNLOAD_URL}">Uygulamayı indir</a>
          </div>
        </aside>

        <section class="rcp-related" aria-labelledby="diger-rehberler">
          <h2 id="diger-rehberler">Diğer rehberler</h2>
          <ul class="recipes__grid">
              ${otherGuides.map((other) => guideCard(other, "h3")).join("\n              ")}
          </ul>
        </section>
      </div>
    </main>

${footer(versions)}`;
}

export function renderGuidesHubPage(guides, versions) {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Healife rehberleri",
    numberOfItems: guides.length,
    itemListElement: guides.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: guideUrl(guide.slug),
      name: guide.title,
    })),
  };
  const breadcrumb = breadcrumbJsonLd([
    ["Ana sayfa", `${SITE_ORIGIN}/`],
    ["Rehberler", GUIDES_HUB_URL],
  ]);
  const ogSource = guides[0];

  return `${head({
    versions,
    title: GUIDES_HUB_TITLE,
    description: GUIDES_HUB_DESCRIPTION,
    canonical: GUIDES_HUB_URL,
    ogType: "website",
    ogImage: { url: cloudinaryUrl(ogSource.thumbnailUrl, "f_jpg,q_auto,c_fill,ar_3:2,w_1200"), width: 1200, height: 800 },
    ogImageAlt: ogSource.title,
    jsonLd: [itemList, breadcrumb],
  })}
  <body>
    <a class="skip-link" href="#main">İçeriğe geç</a>

${topbar(versions, "/", "Ana sayfaya dön")}

    <main class="recipes" id="main">
      <div class="wrap">
        ${crumbs([["Ana sayfa", "/"], ["Rehberler", null]])}

        <header class="recipes__head">
          <h1>Rehberler</h1>
          <p>
            Healife uygulamasının Keşfet bölümündeki ücretsiz rehberler:
            kalorinin nasıl hesaplandığı, uykunun toparlanmaya etkisi, yumurtanın
            besin değeri ve ağırlık antrenmanında yük ve tekrar seçimi.
          </p>
          <p>
            Rehberler genel bilgilendirme amaçlıdır; tıbbi tavsiye yerine geçmez.
            Hesaplamalarımızın dayandığı kaynakları <a href="/sources.html">Kaynaklar</a>
            sayfasında bulabilirsin.
          </p>
        </header>

        <ul class="recipes__grid">
              ${guides.map((guide) => guideCard(guide, "h2")).join("\n              ")}
        </ul>

        <aside class="rcp-cta" aria-labelledby="uygulama">
          <div>
            <h2 id="uygulama">Tarifler de burada</h2>
            <p>Kalori ve makro değerleri yazılı fit tariflerle rehberlerdeki bilgiyi mutfağa taşı.</p>
          </div>
          <div class="rcp-cta__actions">
            <a class="btn btn--primary" href="${RECIPES_PATH}">Tariflere göz at</a>
            <a class="btn btn--ghost" href="${START_URL}">Planını oluştur</a>
          </div>
        </aside>
      </div>
    </main>

${footer(versions)}`;
}

function sitemapEntry(loc, changefreq, priority, lastmod) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export function sitemapFragment(recipes, guides = []) {
  const recipeEntries = [
    sitemapEntry(HUB_URL, "weekly", "0.7", DATE_PUBLISHED),
    ...recipes.map((recipe) => sitemapEntry(recipeUrl(recipe.slug), "monthly", "0.6", DATE_PUBLISHED)),
  ];
  const guideEntries = guides.length
    ? [
        sitemapEntry(GUIDES_HUB_URL, "monthly", "0.6", DATE_PUBLISHED),
        ...guides.map((guide) =>
          sitemapEntry(guideUrl(guide.slug), "monthly", "0.6", isoDate(guide.updatedAt) ?? isoDate(guide.createdAt)),
        ),
      ]
    : [];
  return [...recipeEntries, ...guideEntries].join("\n");
}

// hakkimizda.html'deki "styles/base.css?v=20261102a" gibi referanslardan
// yol → sürüm haritası.
export function extractAssetVersions(html) {
  const versions = {};
  for (const match of html.matchAll(/(?:href|src)="\/?((?:styles|scripts|assets)\/[^"?]+)\?v=([^"&]+)"/g)) {
    versions[match[1]] = match[2];
  }
  return versions;
}

export function extractHomeRecipeNumbers(html) {
  const numbers = new Set();
  for (const match of html.matchAll(/explore\/recipes\/recipe_(\d+)\./g)) numbers.add(Number(match[1]));
  return [...numbers];
}
