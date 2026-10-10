import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = async (path) => readFile(new URL(path, root), "utf8");

test("public locale prefixes map English and Kenyan Swahili to Strapi codes", async () => {
  const config = await source("i18n.config.ts");

  assert.match(config, /locales:\s*\["en",\s*"sw"\]/);
  assert.match(config, /en:\s*"en"/);
  assert.match(config, /sw:\s*"sw-KE"/);
  assert.match(config, /\/sw` is the stable public URL/);
});

test("locale-aware Strapi filters are normalized at the fetch boundary", async () => {
  const fetcher = await source("lib/strapi/fetchContentType.ts");

  assert.match(fetcher, /normalizeLocaleQuery/);
  assert.match(fetcher, /filters\.locale = strapiLocaleFor\(filters\.locale\)/);
  assert.match(fetcher, /const queryParams = normalizeLocaleQuery\(params\)/);
});

test("the switcher preserves translated slugs and does not create missing-locale URLs", async () => {
  const switcher = await source("components/locale-switcher.tsx");

  assert.match(switcher, /strapiLocaleFor\(targetLocale\)/);
  assert.match(switcher, /return null/);
  assert.match(switcher, /newSegments\[newSegments\.length - 1\] = localizedSlug/);
  assert.doesNotMatch(switcher, /TEMPORARY OVERRIDE/);
});

test("Strapi preview locales are mapped to public route prefixes", async () => {
  const preview = await source("app/api/preview/route.ts");

  assert.match(preview, /toPublicLocale/);
  assert.match(preview, /Invalid locale/);
  assert.match(preview, /`\/\$\{publicLocale\}\/blog/);
});

test("health detail pages initialize localized slugs from the current entry", async () => {
  const healthPage = await source("app/[locale]/(marketing)/health/[section]/[slug]/page.tsx");

  assert.match(healthPage, /ClientSlugHandler/);
  assert.match(healthPage, /item\.localizations\?\.reduce/);
  assert.match(healthPage, /acc\[localization\.locale\] = localization\.slug/);
  assert.match(healthPage, /\{ \[params\.locale\]: params\.slug \}/);
});

test("slug state is scoped to the current pathname to prevent stale mappings", async () => {
  const handler = await source("app/[locale]/(marketing)/ClientSlugHandler.tsx");
  const context = await source("app/context/SlugContext.tsx");
  const switcher = await source("components/locale-switcher.tsx");

  assert.match(handler, /usePathname/);
  assert.match(handler, /path: pathname/);
  assert.match(context, /localizedSlugPath/);
  assert.match(switcher, /state\.localizedSlugPath === pathname/);
});
