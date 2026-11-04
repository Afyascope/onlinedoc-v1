import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("forwarded server actions bypass the locale redirect before it runs", async () => {
  const middleware = await source("middleware.ts");

  assert.match(middleware, /request\.method === 'POST'/);
  assert.match(middleware, /pathname === '\/\[locale\]' \|\| pathname\.startsWith\('\/\[locale\]\/'\)/);
  assert.match(middleware, /request\.headers\.get\('x-action-forwarded'\) === '1'/);
  assert.match(middleware, /request\.headers\.has\('next-action'\)/);
  assert.match(
    middleware,
    /if \(isForwardedServerAction\(request, pathname\)\) \{\s*return NextResponse\.next\(\)/,
  );

  const bypassIndex = middleware.indexOf("isForwardedServerAction(request, pathname)");
  const localeRedirectIndex = middleware.indexOf("if (pathnameIsMissingLocale)");

  assert.ok(bypassIndex > -1, "forwarded action guard should be called");
  assert.ok(localeRedirectIndex > -1, "locale redirect should remain");
  assert.ok(bypassIndex < localeRedirectIndex, "forwarded actions must be allowed before locale redirect");
});
