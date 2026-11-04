import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = async (path) => readFile(new URL(path, root), "utf8");

test("Strapi User image is optional and deep-populated", async () => {
  const schema = JSON.parse(await source("../strapi/src/components/shared/user.json"));
  const deepPopulate = await source("../strapi/src/middlewares/deepPopulate.ts");

  assert.equal(schema.attributes.image.type, "media");
  assert.equal(schema.attributes.image.multiple, false);
  assert.equal(schema.attributes.image.required, false);
  assert.match(deepPopulate, /case 'media':[\s\S]*?acc\[attributeName\] = \{ populate: "\*" \}/);
});

test("AnimatedTooltip safely handles a missing or null image relation", async () => {
  const component = await source("components/ui/animated-tooltip.tsx");

  assert.doesNotMatch(component, /strapiImage\(item\.image\.url\)/);
  assert.match(component, /image\?: AnimatedTooltipImage \| null/);
  assert.match(component, /const url = image\?\.url/);
  assert.match(component, /typeof url !== "string"/);
  assert.match(component, /console\.warn\(/);
  assert.match(component, /<IconUser/);
  assert.match(component, /role="img"/);
  assert.match(component, /bg-neutral-100 text-neutral-500/);
});
