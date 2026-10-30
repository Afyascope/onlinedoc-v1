import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { loadTsModule } from "./helpers/load-ts.mjs";

const root = new URL("../", import.meta.url);
const queryHelpers = loadTsModule(new URL("lib/catalogue/search-query.ts", root));
const searchClientModule = loadTsModule(new URL("lib/catalogue/search-client.ts", root));
const source = (path) => readFile(new URL(path, root), "utf8");

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

test("a single meaningful character starts a search; whitespace does not", () => {
  assert.equal(queryHelpers.isSearchableCatalogueSearchQuery("a"), true);
  assert.equal(queryHelpers.isSearchableCatalogueSearchQuery("  A  "), true);
  assert.equal(queryHelpers.isSearchableCatalogueSearchQuery(""), false);
  assert.equal(queryHelpers.isSearchableCatalogueSearchQuery("   "), false);
  assert.equal(queryHelpers.normalizeCatalogueSearchQuery("  cough  "), "cough");
});

test("LIKE characters from user input are escaped", () => {
  assert.equal(queryHelpers.escapeLikePattern("50%_off\\"), "50\\%\\_off\\\\");
  const patterns = queryHelpers.catalogueSearchPatterns("  A%b  ");
  assert.equal(patterns.value, "A%b");
  assert.equal(patterns.prefix, "A\\%b%");
  assert.equal(patterns.contains, "%A\\%b%");
  assert.equal(queryHelpers.catalogueSearchPatterns("   "), null);
});

test("an empty or whitespace-only query never calls the search endpoint", async () => {
  let calls = 0;
  let idle = 0;
  const client = searchClientModule.createCatalogueSearchClient(async () => {
    calls += 1;
    return [];
  });

  await client.search("   ", {
    onResults: () => assert.fail("results should not be delivered"),
    onError: () => assert.fail("errors should not be delivered"),
    onIdle: () => { idle += 1; },
  });

  assert.equal(calls, 0);
  assert.equal(idle, 1);
});

test("loading, empty and error states are reported in order", async () => {
  const states = [];
  const emptyClient = searchClientModule.createCatalogueSearchClient(async () => []);
  await emptyClient.search("a", {
    onLoading: () => states.push("loading"),
    onResults: (results) => states.push(`results:${results.length}`),
    onError: () => states.push("error"),
  });
  assert.deepEqual(states, ["loading", "results:0"]);

  const errorStates = [];
  const failingClient = searchClientModule.createCatalogueSearchClient(async () => {
    throw new Error("network unavailable");
  });
  await failingClient.search("b", {
    onLoading: () => errorStates.push("loading"),
    onResults: () => errorStates.push("results"),
    onError: () => errorStates.push("error"),
  });
  assert.deepEqual(errorStates, ["loading", "error"]);
});

test("older responses cannot overwrite a newer query", async () => {
  const requests = [];
  const client = searchClientModule.createCatalogueSearchClient((query, signal) => {
    const request = deferred();
    requests.push({ query, signal, ...request });
    return request.promise;
  });

  const delivered = [];
  const firstSearch = client.search("a", {
    onResults: (results, query) => delivered.push({ query, results }),
    onError: () => assert.fail("first request should be superseded, not fail"),
  });
  const secondSearch = client.search("ab", {
    onResults: (results, query) => delivered.push({ query, results }),
    onError: () => assert.fail("second request should succeed"),
  });

  assert.equal(requests.length, 2);
  assert.equal(requests[0].signal.aborted, true);

  requests[1].resolve([{ id: "newer" }]);
  await secondSearch;
  requests[0].resolve([{ id: "older" }]);
  await firstSearch;

  assert.deepEqual(delivered, [{ query: "ab", results: [{ id: "newer" }] }]);
});

test("aborting an in-flight request is not surfaced as a search error", async () => {
  let errors = 0;
  const client = searchClientModule.createCatalogueSearchClient(async () => {
    throw new DOMException("Aborted", "AbortError");
  });
  await client.search("a", {
    onResults: () => assert.fail("aborted requests must not deliver results"),
    onError: () => { errors += 1; },
  });
  assert.equal(errors, 0);
});

test("the search field is an accessible combobox with keyboard navigation and retry", async () => {
  const component = await source("components/consultations/CatalogueSearch.tsx");

  assert.match(component, /role="combobox"/);
  assert.match(component, /aria-autocomplete="list"/);
  assert.match(component, /aria-expanded=\{showDropdown\}/);
  assert.match(component, /aria-activedescendant=/);
  assert.match(component, /role="listbox"/);
  assert.match(component, /role="option"/);
  assert.match(component, /event\.key === "ArrowDown"/);
  assert.match(component, /event\.key === "ArrowUp"/);
  assert.match(component, /event\.key === "Enter"/);
  assert.match(component, /event\.key === "Escape"/);
  assert.match(component, /Try again/);
  assert.match(component, /Searching…/);
  assert.match(component, /No matching catalogue items\./);
  assert.match(component, /\/api\/catalogue\/search\?domain=/);
  assert.match(component, /createCatalogueSearchClient/);
});

test("selecting a result keeps the catalogue resource ID and display details", async () => {
  const component = await source("components/consultations/CatalogueSearch.tsx");
  const clinician = await source("app/[locale]/(authenticated)/dashboard/clinician/consultations/[id]/client.tsx");

  assert.match(component, /onSelect\(option\)/);
  assert.match(clinician, /resourceId: option\.id/);
  assert.match(clinician, /name: option\.name/);
  assert.match(clinician, /code: option\.code/);
  assert.match(clinician, /dosageForm: option\.dosageForm/);
  assert.match(clinician, /route: option\.route/);
});

test("server search starts at one character and only queries active catalogue data", async () => {
  const route = await source("app/api/catalogue/search/route.ts");
  const action = await source("lib/actions/catalogue.ts");
  const service = await source("lib/catalogue/service.ts");

  assert.match(route, /isSearchableCatalogueSearchQuery\(query\)/);
  assert.match(action, /isSearchableCatalogueSearchQuery\(trimmed\)/);
  assert.doesNotMatch(route, /query\.length < 2/);
  assert.doesNotMatch(action, /trimmed\.length < 2/);
  assert.match(service, /eq\(catalogueReleases\.status, "active"\)/);
  assert.match(service, /eq\(catalogueResources\.lifecycle, "active"\)/);
  assert.match(service, /eq\(catalogueResources\.isActive, true\)/);
  assert.match(service, /ilike\(catalogueResources\.genericName/);
  assert.match(service, /ilike\(catalogueResources\.brandName/);
  assert.match(service, /ilike\(catalogueResources\.synonyms/);
  assert.match(service, /ilike\(catalogueResources\.sourceIdentifier/);
  assert.match(service, /orderBy\(rank, asc\(catalogueResources\.name\)/);
});
