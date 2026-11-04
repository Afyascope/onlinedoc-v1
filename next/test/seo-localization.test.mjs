import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = async (path) => readFile(new URL(path, root), "utf8");

const SEO_PAGES = {
  home: "app/[locale]/(marketing)/page.tsx",
  page: "app/[locale]/(marketing)/[slug]/page.tsx",
  blogIndex: "app/[locale]/(marketing)/blog/page.tsx",
  blogDetail: "app/[locale]/(marketing)/blog/[slug]/page.tsx",
  productsIndex: "app/[locale]/(marketing)/products/page.tsx",
  productDetail: "app/[locale]/(marketing)/products/[slug]/page.tsx",
  healthIndex: "app/[locale]/(marketing)/health/page.tsx",
  healthSection: "app/[locale]/(marketing)/health/[section]/page.tsx",
  healthDetail: "app/[locale]/(marketing)/health/[section]/[slug]/page.tsx",
  privacy: "app/[locale]/(marketing)/privacy-policy/page.tsx",
  terms: "app/[locale]/(marketing)/terms-of-service/page.tsx",
};

test("alternates are built from the configured locale mapping without a hardcoded origin", async () => {
  const helpers = await source("lib/seo/alternates.ts");

  assert.match(helpers, /import \{ siteUrl \} from "@\/lib\/config"/);
  assert.match(helpers, /absoluteUrl/);
  assert.doesNotMatch(helpers, /https?:\/\//);
  assert.match(helpers, /path\.split/);
  assert.match(helpers, /\.replace\(/);
  assert.match(helpers, /import \{ i18n, isPublicLocale, publicLocaleFor, type Locale \} from "@\/i18n.config"/);
});

test("x-default is only emitted when the English destination exists", async () => {
  const helpers = await source("lib/seo/alternates.ts");

  assert.match(helpers, /languages\[i18n\.defaultLocale\]/);
  assert.match(helpers, /languages\["x-default"\] = languages\[i18n\.defaultLocale\]/);
  assert.match(helpers, /if \(languages\[i18n\.defaultLocale\]\)/);
  assert.match(helpers, /languages\["x-default"\] = languages\[i18n\.defaultLocale\]/);
});

test("detail alternates come from real localization records and never invent a locale", async () => {
  const helpers = await source("lib/seo/alternates.ts");

  // Skip incomplete localization records.
  assert.match(helpers, /if \(!localization\?\.locale \|\| !localization\?\.slug\) continue/);
  // Map Strapi locale codes to public prefixes and drop unknown ones (e.g. fr).
  assert.match(helpers, /const publicLocale = publicLocaleFor\(localization\.locale\)/);
  assert.match(helpers, /if \(publicLocale\) add\(publicLocale, localization\.slug\)/);
});

test("OpenGraph locale uses valid language_TERRITORY values", async () => {
  const helpers = await source("lib/seo/alternates.ts");
  const metadata = await source("lib/shared/metadata.ts");

  assert.match(helpers, /en: "en_US"/);
  assert.match(helpers, /sw: "sw_KE"/);
  assert.match(helpers, /export function openGraphLocale/);
  assert.match(metadata, /openGraphLocale/);
});

test("metadata canonical always wins over unverified Strapi SEO fields", async () => {
  const metadata = await source("lib/shared/metadata.ts");
  const health = await source("lib/health/content.ts");

  assert.match(metadata, /alternates\?\.canonical/);
  assert.doesNotMatch(health, /canonicalURL/);
});

test("route-level pages emit reciprocal en/sw alternates; detail pages derive them", async () => {
  const routePages = ["home", "blogIndex", "productsIndex", "healthIndex", "healthSection"];
  const detailPages = ["page", "blogDetail", "healthDetail"];

  for (const key of routePages) {
    const file = await source(SEO_PAGES[key]);
    assert.match(file, /routeAlternates/, `${key} should use routeAlternates`);
  }
  for (const key of detailPages) {
    const file = await source(SEO_PAGES[key]);
    assert.match(file, /detailAlternates|contentMetadata/, `${key} should derive alternates`);
  }
});

test("localized detail metadata fetches request localizations explicitly", async () => {
  for (const key of ["page", "blogDetail", "healthDetail"]) {
    const file = await source(SEO_PAGES[key]);
    assert.match(file, /localizations: \{ fields: \["slug", "locale"\] \}/, `${key} must populate localizations`);
  }
});

test("products canonicalize to /en with no alternates", async () => {
  const file = await source(SEO_PAGES.productDetail);

  assert.match(file, /absoluteUrl\(`\/en\/products\/\$\{params\.slug\}`\)/);
  assert.match(file, /alternates: \{ canonical \}/);
  assert.doesNotMatch(file, /routeAlternates|detailAlternates/);
});

test("English-only legal pages canonicalize to /en with no alternates", async () => {
  for (const key of ["privacy", "terms"]) {
    const file = await source(SEO_PAGES[key]);
    assert.match(file, /absoluteUrl\("\/en\/(privacy-policy|terms-of-service)"\)/);
    assert.match(file, /alternates: \{ canonical \}/);
    assert.doesNotMatch(file, /routeAlternates|detailAlternates/);
  }
});

test("middleware forwards the locale header without dropping existing headers", async () => {
  const middleware = await source("middleware.ts");

  assert.match(middleware, /new Headers\(request\.headers\)/);
  assert.match(middleware, /requestHeaders\.set\('x-locale', locale\)/);
  assert.match(middleware, /NextResponse\.next\(\{ request: \{ headers: requestHeaders \} \}\)/);
});

test("root layout renders the active locale in server HTML with an English default", async () => {
  const layout = await source("app/layout.tsx");

  assert.match(layout, /headers\(\)\.get\("x-locale"\)/);
  assert.match(layout, /locale === "sw" \? "sw" : "en"/);
  assert.match(layout, /<html lang=\{lang\}/);
  // Client-side fallback for in-app navigation is preserved.
  const setLang = await source("app/[locale]/SetLang.tsx");
  assert.match(setLang, /document\.documentElement\.lang = locale/);
});

test("sitemap lists products once under the default locale and includes health sections", async () => {
  const sitemap = await source("app/sitemap.ts");

  assert.match(sitemap, /healthSections/);
  assert.match(sitemap, /health\/\$\{definition\.route\}/);
  assert.match(sitemap, /`\$\{baseUrl\}\/\$\{i18n\.defaultLocale\}\/products\/\$\{slug\}`/);
  // No products emitted under every locale.
  assert.doesNotMatch(sitemap, /\[locale\]\/products\/\$\{slug\}/);
  assert.match(sitemap, /detailAlternates/);
  assert.match(sitemap, /routeAlternates/);
});

test("sitemap excludes reserved homepage slug and the duplicated articles health section", async () => {
  const sitemap = await source("app/sitemap.ts");

  // homepage is served at /{locale}, not /{locale}/homepage.
  assert.match(sitemap, /page\.slug !== "homepage"/);
  // The articles health section mirrors /blog and is excluded.
  assert.match(sitemap, /section !== "articles"/);
  assert.match(sitemap, /sitemapHealthSections/);
});

test("sitemap surfaces fetch errors instead of swallowing them", async () => {
  const sitemap = await source("app/sitemap.ts");

  assert.match(sitemap, /console\.warn/);
  assert.doesNotMatch(sitemap, /catch\s*\{\s*\}/);
});

test("robots disallows authenticated dashboard routes in bare and locale-prefixed forms", async () => {
  const robots = await source("app/robots.ts");
  assert.match(robots, /"\/api\/"/);
  assert.match(robots, /"\/dashboard\/"/);
  assert.match(robots, /"\/\*\/dashboard\/"/);
});

test("unknown blog and product slugs 404 instead of rendering a soft-404", async () => {
  const blogDetail = await source(SEO_PAGES.blogDetail);
  const productDetail = await source(SEO_PAGES.productDetail);

  // Blog detail must call notFound() in both generateMetadata and the page,
  // and must not render inline "not found" markup.
  assert.match(blogDetail, /import \{ notFound \} from "next\/navigation"/);
  assert.equal((blogDetail.match(/notFound\(\)/g) || []).length, 2);
  assert.doesNotMatch(blogDetail, /Blog not found/);

  // Product detail must not soft-redirect with a meta refresh.
  assert.match(productDetail, /import \{ notFound \} from "next\/navigation"/);
  assert.equal((productDetail.match(/notFound\(\)/g) || []).length, 2);
  assert.doesNotMatch(productDetail, /redirect\("\/products"\)/);
});

test("no loading boundary sits above the locale tree, so notFound()/redirect() keep their HTTP status", async () => {
  // A loading.tsx at the [locale] segment wraps every locale page in a Suspense
  // boundary. The fallback flushes a 200 shell before the page can throw
  // notFound()/redirect(), turning real 404s and 308s into soft 200s. The file
  // must therefore not exist (section-level skeletons are still allowed).
  await assert.rejects(
    () => stat(new URL("app/[locale]/loading.tsx", root)),
    /ENOENT/,
  );
});

test("the catch-all page permanently redirects reserved slugs (homepage) to the locale home", async () => {
  const page = await source(SEO_PAGES.page);

  assert.match(page, /import \{ notFound, permanentRedirect \} from 'next\/navigation'/);
  assert.match(page, /RESERVED_PAGE_SLUGS = new Set\(\["homepage"\]\)/);
  assert.match(page, /if \(RESERVED_PAGE_SLUGS\.has\(params\.slug\)\) permanentRedirect\(`\/\$\{params\.locale\}`\)/);
});

test("health article mirrors canonicalize to the primary blog URL", async () => {
  const detail = await source(SEO_PAGES.healthDetail);
  const section = await source(SEO_PAGES.healthSection);

  assert.match(detail, /section === "articles"/);
  assert.match(detail, /`\/\$\{locale\}\/blog\/\$\{slug\}`/);
  assert.match(section, /section === "articles"/);
  assert.match(section, /`\/\$\{locale\}\/blog`/);
});

test("structured data is rendered for articles and products", async () => {
  const blogDetail = await source(SEO_PAGES.blogDetail);
  const productDetail = await source(SEO_PAGES.productDetail);
  const jsonLd = await source("components/seo/json-ld.tsx");

  assert.match(blogDetail, /ArticleSchema/);
  assert.match(productDetail, /ProductSchema/);
  // Product offers carry the real price, not a fabricated zero.
  assert.match(jsonLd, /hasPrice \? \{ price: `\$\{price\}` \} : \{\}/);
});

test("preview draft handling is unchanged", async () => {
  const fetcher = await source("lib/strapi/fetchContentType.ts");
  assert.match(fetcher, /queryParams\.status = "draft"/);
  assert.match(fetcher, /isEnabled \|\| fresh/);
});

test("JSON-LD is server-rendered and covers medical and breadcrumb pages", async () => {
  const jsonLd = await source("components/seo/json-ld.tsx");
  const marketingLayout = await source("app/[locale]/(marketing)/layout.tsx");

  // next/script injects on the client; crawlers need the markup in the HTML.
  assert.doesNotMatch(jsonLd, /from "next\/script"/);
  assert.match(jsonLd, /dangerouslySetInnerHTML/);
  assert.match(jsonLd, /\\u003c/);
  assert.match(jsonLd, /export function OrganizationSchema/);
  assert.match(jsonLd, /export function WebSiteSchema/);
  assert.match(jsonLd, /export function MedicalWebPageSchema/);
  assert.match(jsonLd, /export function BreadcrumbSchema/);
  assert.match(marketingLayout, /OrganizationSchema/);
  assert.match(marketingLayout, /WebSiteSchema/);
});

test("auth and dashboard routes are excluded from indexing", async () => {
  const authLayout = await source("app/[locale]/(auth)/layout.tsx");
  const dashboardLayout = await source("app/[locale]/(authenticated)/layout.tsx");

  assert.match(authLayout, /robots: \{[\s\S]*?index: false,[\s\S]*?follow: false,[\s\S]*?nocache: true,/);
  assert.match(dashboardLayout, /robots: \{[\s\S]*?index: false,[\s\S]*?follow: false,[\s\S]*?nocache: true,/);
});

test("robots blocks private areas and the sitemap lists legal pages", async () => {
  const robots = await source("app/robots.ts");
  const sitemap = await source("app/sitemap.ts");

  assert.match(robots, /"\/api\/"/);
  assert.match(robots, /"\/dashboard\/"/);
  assert.match(robots, /"\/\*\/dashboard\/"/);
  assert.match(sitemap, /privacy-policy/);
  assert.match(sitemap, /terms-of-service/);
  // CMS content changes after deploy, so the sitemap must be regenerated.
  assert.match(sitemap, /export const revalidate = 3600/);
});

test("missing CMS SEO falls back instead of emitting an empty title", async () => {
  const metadata = await source("lib/shared/metadata.ts");
  const blogIndex = await source(SEO_PAGES.blogIndex);
  const productsIndex = await source(SEO_PAGES.productsIndex);
  const page = await source(SEO_PAGES.page);
  const blogDetail = await source(SEO_PAGES.blogDetail);
  const healthDetail = await source(SEO_PAGES.healthDetail);
  const healthContent = await source("lib/health/content.ts");

  assert.match(metadata, /fallbackTitle\?: string/);
  assert.match(metadata, /fallbackDescription\?: string/);
  assert.match(metadata, /const title = seo\?\.metaTitle \|\| options\?\.fallbackTitle/);
  assert.match(metadata, /\.\.\.\(titleValue \? \{ title: titleValue \} : \{\}\)/);
  assert.match(metadata, /absolute: title/);
  assert.match(blogIndex, /fallbackTitle:/);
  assert.match(productsIndex, /fallbackTitle:/);
  assert.match(page, /fallbackTitle: fallbackTitle\(/);
  assert.match(blogDetail, /fallbackTitle: article\?\.title/);
  assert.match(healthDetail, /fallbackTitle: contentTitle\(/);
  assert.match(healthDetail, /fallbackDescription: contentDescription\(/);
  assert.match(healthContent, /fallbackDescription: dates\?\.fallbackDescription/);
});

test("blog index tolerates a missing locale entry instead of crashing", async () => {
  const blogIndex = await source(SEO_PAGES.blogIndex);

  assert.doesNotMatch(blogIndex, /blogPage\.localizations/);
  assert.match(blogIndex, /blogPage\?\.localizations/);
  assert.match(blogIndex, /blogPage\?\.heading/);
  assert.match(blogIndex, /blogPage\?\.sub_heading/);
});

test("articles always expose a schema image and products expose an OG locale", async () => {
  const jsonLd = await source("components/seo/json-ld.tsx");
  const productDetail = await source(SEO_PAGES.productDetail);

  assert.match(jsonLd, /image: \[imageUrl \|\| `\$\{siteUrl\}\/og-default\.png`\]/);
  assert.match(productDetail, /locale: OPEN_GRAPH_LOCALE\.en/);
});

test("legacy CMS links redirect and stale legal labels are normalized", async () => {
  const config = await source("next.config.mjs");
  const footer = await source("components/footer.tsx");

  assert.match(config, /source: "\/:locale\/product", destination: "\/:locale\/products"/);
  assert.match(config, /source: "\/:locale\/policy", destination: "\/:locale\/privacy-policy"/);
  assert.match(config, /source: "\/:locale\/terms", destination: "\/:locale\/terms-of-service"/);
  assert.match(config, /source: "\/:locale\/disclaimer"/);
  assert.match(footer, /label === "cookie policy"/);
});

test("the client config falls back to the served origin when only server env is set", async () => {
  const config = await source("lib/config.ts");

  assert.match(config, /typeof window !== "undefined" \? window\.location\.origin : undefined/);
  assert.match(config, /if \(browserFallback\) return browserFallback\.replace/);
});

test("public SEO origin is an origin-only URL and production rejects non-canonical hosts", async () => {
  const config = await source("lib/config.ts");

  assert.match(config, /parsed\.pathname !== "\/" \|\| parsed\.search \|\| parsed\.hash/);
  assert.match(config, /process\.env\.NODE_ENV === "production" && parsed\.origin !== "https:\/\/www\.onlinedoc\.co\.ke"/);
  assert.match(config, /return parsed\.origin/);
});

test("canonical and Open Graph URLs are built from locale-specific paths", async () => {
  const helpers = await source("lib/seo/alternates.ts");
  const sitemap = await source("app/sitemap.ts");
  const healthIndex = await source(SEO_PAGES.healthIndex);
  const healthSection = await source(SEO_PAGES.healthSection);

  assert.match(helpers, /canonical: absoluteUrl\(pathFor\(canonicalLocale\)\)/);
  assert.match(helpers, /absoluteUrl\(buildPath\(selfLocale, slug\)\)/);
  assert.match(sitemap, /addRoute\(locale => `\/\$\{locale\}\/blog`/);
  assert.match(sitemap, /addRoute\(locale => `\/\$\{locale\}\/health`/);
  assert.match(healthIndex, /url: alternates\.canonical/);
  assert.match(healthSection, /url: alternates\.canonical/);
});

test("sitemap omits CMS noindex and test or placeholder entries", async () => {
  const sitemap = await source("app/sitemap.ts");

  assert.match(sitemap, /seo: \{ fields: \["metaRobots"\] \}/);
  assert.match(sitemap, /function isNoindex/);
  assert.match(sitemap, /function isPlaceholder/);
  assert.match(sitemap, /isNoindex\(item\) \|\| isPlaceholder\(item\)/);
  assert.match(sitemap, /if \(!slug \|\| isPlaceholder\(product\)\) continue/);
});

test("root redirect keeps language negotiation and localized routes bypass it", async () => {
  const middleware = await source("middleware.ts");

  assert.match(middleware, /const locale = getLocale\(request\)/);
  assert.match(middleware, /NextResponse\.redirect\(redirectUrl\)/);
  assert.match(middleware, /pathnameIsMissingLocale/);
  assert.match(middleware, /pathname !== `\/\$\{locale\}`/);
});

test("robots keeps public crawling open and points to the canonical sitemap", async () => {
  const robots = await source("app/robots.ts");

  assert.match(robots, /allow: "\/"/);
  assert.match(robots, /"\/api\/"/);
  assert.match(robots, /"\/\*\/dashboard/);
  assert.match(robots, /sitemap: `\$\{baseUrl\}\/sitemap\.xml`/);
});

test("health descriptions fall back to the first content paragraph", async () => {
  const healthContent = await source("lib/health/content.ts");

  assert.match(healthContent, /function firstBlockText/);
  assert.match(healthContent, /firstBlockText\(item\.content\)/);
});

test("sign-up keeps the active locale in its redirect", async () => {
  const signUp = await source("app/[locale]/(auth)/sign-up/page.tsx");

  assert.match(signUp, /redirect\(`\/\$\{params\.locale\}\/register`\)/);
});

test("repeated CMS form sections do not create a second H1 or Strapi-branded links", async () => {
  const formSection = await source("components/dynamic-zone/form-next-to-section.tsx");

  assert.match(formSection, /<h2 className="mt-8/);
  assert.doesNotMatch(formSection, /strapijs|github\.com\/strapi|linkedin\.com\/strapi/);
  assert.match(formSection, /aria-label=\{social\.title\}/);
});

test("public layouts expose a main landmark", async () => {
  const pageContent = await source("lib/shared/PageContent.tsx");
  const blogLayout = await source("components/blog-layout.tsx");
  const blogIndex = await source(SEO_PAGES.blogIndex);
  const productsIndex = await source(SEO_PAGES.productsIndex);
  const productDetail = await source(SEO_PAGES.productDetail);

  for (const file of [pageContent, blogLayout, blogIndex, productsIndex, productDetail]) {
    assert.match(file, /<main\b/);
  }
});
