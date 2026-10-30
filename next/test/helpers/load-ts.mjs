import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

export function loadTsModule(fileUrl, cache = new Map()) {
  const key = fileUrl.href;
  if (cache.has(key)) return cache.get(key);

  const source = readFileSync(fileUrl, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;

  const module = { exports: {} };
  cache.set(key, module.exports);

  const localRequire = (specifier) => {
    if (!specifier.startsWith(".")) return require(specifier);
    let target = new URL(specifier, fileUrl);
    if (!target.pathname.endsWith(".ts")) {
      target = new URL(`${specifier}.ts`, fileUrl);
    }
    return loadTsModule(target, cache);
  };

  const execute = new Function("module", "exports", "require", "process", "console", "URL", "TextDecoder", "setTimeout", "clearTimeout", compiled);
  execute(module, module.exports, localRequire, process, console, URL, TextDecoder, setTimeout, clearTimeout);
  cache.set(key, module.exports);
  return module.exports;
}
