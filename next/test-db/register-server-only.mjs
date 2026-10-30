import { registerHooks } from "node:module";

const emptyModule = new URL("./empty-server-only.mjs", import.meta.url).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: emptyModule, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
