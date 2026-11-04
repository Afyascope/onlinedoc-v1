import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = async (path) => readFile(new URL(path, root), "utf8");

test("Strapi Hero supports an optional CMS image and editable eyebrow", async () => {
  const schema = JSON.parse(await source("../strapi/src/components/dynamic-zone/hero.json"));

  assert.equal(schema.attributes.eyebrow.type, "string");
  assert.equal(schema.attributes.backgroundImage.type, "media");
  assert.equal(schema.attributes.backgroundImage.multiple, false);
  assert.deepEqual(schema.attributes.backgroundImage.allowedTypes, ["images"]);
  assert.equal(schema.attributes.backgroundImage.required, false);
});

test("homepage hero renders a safe optimized Strapi image or its gradient fallback", async () => {
  const hero = await source("components/dynamic-zone/hero.tsx");
  const deepPopulate = await source("../strapi/src/middlewares/deepPopulate.ts");

  assert.match(hero, /getSafeImageSrc\(backgroundImage\?\.url\)/);
  assert.match(hero, /<Image[\s\S]*?fill[\s\S]*?priority[\s\S]*?sizes="100vw"/);
  assert.match(hero, /alternativeText\?\.trim\(\) \|\| ""/);
  assert.match(hero, /bg-gradient-to-br from-\[#0F2A43\][\s\S]*?to-\[#0f766e\]/);
  assert.match(deepPopulate, /case 'media':[\s\S]*?acc\[attributeName\] = \{ populate: "\*" \}/);
  assert.doesNotMatch(hero, /Need medical advice\?|Talk to a Clinician|Explore Health Resources/);
});

test("the premium presentation is limited to the localized homepage Hero", async () => {
  const route = await source("app/[locale]/(marketing)/page.tsx");
  const content = await source("lib/shared/PageContent.tsx");
  const manager = await source("components/dynamic-zone/manager.tsx");
  const hero = await source("components/dynamic-zone/hero.tsx");

  assert.match(route, /<PageContent pageData=\{safePageData\} isHomepage \/>/);
  assert.match(content, /isHomepage\?: boolean/);
  assert.match(manager, /isHomepage && componentData\.__component === 'dynamic-zone\.hero' \? \{ isHomepageHero: true \} : \{\}/);
  assert.match(hero, /if \(isHomepageHero\)/);
});
