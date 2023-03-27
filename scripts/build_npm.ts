import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";

import package_ from "./package.json" assert { type: "json" };

await emptyDir("./npm");

await build({
  entryPoints: ["./src/mod.ts"],
  outDir: "./npm",
  shims: {
    deno: true,
  },
  esModule: true,
  scriptModule: "cjs",
  test: false,
  package: {
    ...package_,
    version: Deno.args[0],
  },
  mappings: {
    "https://lib.deno.dev/x/grammy@1.x/mod.ts": {
      name: "grammy",
      version: "^1.0.0",
      peerDependency: true,
    },
  },
});

// post build steps
Deno.copyFileSync("src/LICENSE", "npm/LICENSE");
Deno.copyFileSync("src/README.md", "npm/README.md");
