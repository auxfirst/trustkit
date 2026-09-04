#!/usr/bin/env node
/**
 * Copy the canonical AUX schemas into the package so the published tarball is
 * self-contained, and fail loudly if the copies have drifted.
 *
 *   node scripts/sync-schemas.mjs           # copy repo schemas/ -> package schemas/
 *   node scripts/sync-schemas.mjs --check   # exit 1 if they differ (used in CI)
 *
 * The repo-root schemas/ directory is the single source of truth. Editing the
 * copies under packages/aux-audit/schemas/ is always wrong.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkgSchemas = join(here, "..", "schemas");
const repoSchemas = join(here, "..", "..", "..", "schemas");

const FILES = [
  "aux-heuristics.yaml",
  "trust-architecture.yaml",
  "trust-gap-taxonomy.yaml",
  "agent-spec.schema.yaml",
  // What the CLI actually validates against, until v0.2 reads v1.
  "agent-spec.v0.yaml",
  // The schemas are MIT and say so next to themselves, in the tarball too.
  "LICENSE",
];

const check = process.argv.includes("--check");
mkdirSync(pkgSchemas, { recursive: true });

const drifted = [];
for (const file of FILES) {
  const from = join(repoSchemas, file);
  const to = join(pkgSchemas, file);
  if (!existsSync(from)) {
    console.error(`sync-schemas: canonical schema missing: ${from}`);
    process.exit(1);
  }
  const source = readFileSync(from, "utf8");
  const current = existsSync(to) ? readFileSync(to, "utf8") : null;
  if (source === current) continue;
  if (check) {
    drifted.push(file);
  } else {
    writeFileSync(to, source);
    console.log(`sync-schemas: updated ${file}`);
  }
}

if (drifted.length > 0) {
  console.error(
    `sync-schemas: package copies are stale: ${drifted.join(", ")}\n` +
      `Run \`npm run sync:schemas\` in packages/aux-audit and commit the result.`,
  );
  process.exit(1);
}
if (check) console.log("sync-schemas: package schemas match schemas/");
