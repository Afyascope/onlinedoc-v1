import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = async (path) => readFile(new URL(path, root), "utf8");

test("related health content uses the returned locale and translated slug", async () => {
  const helper = await source("lib/health/related-content.ts");
  const section = await source("components/health/health-section.tsx");
  const card = await source("components/health/health-card.tsx");

  assert.match(helper, /itemLocale === strapiLocaleFor\(locale\)/);
  assert.match(helper, /locale === "en"/);
  assert.match(section, /items\?\.filter\(item => isRelatedContentForLocale\(item, locale\)\)/);
  assert.match(card, /item\.slug/);
});

test("missing Swahili relation data is hidden instead of linked under /sw", async () => {
  const helper = await source("lib/health/related-content.ts");
  const relatedArticles = await source("components/dynamic-zone/related-articles.tsx");

  assert.match(helper, /if \(!item\?\.slug \|\| !isPublicLocale\(locale\)\) return false/);
  assert.match(relatedArticles, /availableArticles = .*filter/);
  assert.match(relatedArticles, /if \(availableArticles\.length === 0\) return null/);
});

test("relation filtering does not alter preview fetch status handling", async () => {
  const fetcher = await source("lib/strapi/fetchContentType.ts");
  const helper = await source("lib/health/related-content.ts");

  assert.match(fetcher, /queryParams\.status = "draft"/);
  assert.doesNotMatch(helper, /publishedAt/);
});
