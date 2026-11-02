// Read-only export of active, non-premium Explore items (recipes + guides) from
// the live DB, for tools/build-recipes.mjs. The DB is the source of truth: the
// backend seed's isPremium flags are stale, and premium content must never be
// published on the site.
//
// Run from the backend repo so its env and mongoose are used:
//   cd ../dcp_ai_fitness_backend
//   npx env-cmd -f ./config/dev.env node ../healife-web/tools/export-explore.cjs "$PWD" /tmp/explore-free.json
//   cd ../healife-web
//   node tools/build-recipes.mjs --source /tmp/explore-free.json > /tmp/sitemap-fragment.xml
//
// Keep the export out of this repo; it is regenerated on demand.
const path = require("path");
const fs = require("fs");

const PUBLISHABLE_CATEGORIES = ["recipes", "mini_guides", "quick_tips", "training", "supplement"];

async function main() {
  const [backendRoot, outPath] = process.argv.slice(2);
  if (!backendRoot || !outPath) throw new Error("usage: export-explore.cjs <backendRoot> <out.json>");
  if (!process.env.MONGODB_URL) throw new Error("MONGODB_URL is not set; run through env-cmd with the backend env file");

  const mongoose = require(path.join(backendRoot, "node_modules/mongoose"));
  const ExploreItem = require(path.join(backendRoot, "src/models/exploreItem"));

  await mongoose.connect(process.env.MONGODB_URL);
  try {
    const items = await ExploreItem.find({
      isActive: true,
      isPremium: { $ne: true },
      category: { $in: PUBLISHABLE_CATEGORIES },
    })
      .sort({ category: 1, order: -1 })
      .lean();
    fs.writeFileSync(outPath, JSON.stringify(items.map(({ __v, ...item }) => item), null, 2));
    const recipeCount = items.filter((item) => item.category === "recipes").length;
    console.error(`exported ${items.length} items (${recipeCount} recipes) to ${outPath}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(`export-explore failed: ${error.message}`);
  process.exit(1);
});
