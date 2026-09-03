/**
 * Loads the canonical AUX definitions that ship with the package.
 *
 * These files are byte-identical copies of the repo-root `schemas/` directory
 * (kept honest by `scripts/sync-schemas.mjs --check` in CI). Nothing in this
 * module hardcodes heuristic text, IDs, or severities — change the YAML and the
 * audit changes with it.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

export interface Heuristic {
  id: string;
  name: string;
  question: string;
  failure_mode: string;
  fix_pattern: string;
}

export interface TrustStage {
  id: string;
  order: number;
  name: string;
  question: string;
  earned_when: string[];
  failure_modes: string[];
}

export interface TrustGap {
  id: string;
  family: string;
  name: string;
  question: string;
  heuristic_ref: string;
  trust_stage: string;
  severity_default: string;
  fix_pattern: string;
}

export interface Canon {
  heuristics: Heuristic[];
  heuristicsVersion: string;
  stages: TrustStage[];
  trustArchitectureVersion: string;
  gaps: TrustGap[];
  taxonomyVersion: string;
}

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Nearest ancestor holding a populated `schemas/` directory.
 *
 * Walked rather than hardcoded because the compiled layout differs between the
 * published package (`dist/canon.js`) and the test build, and a wrong constant
 * here fails at runtime in someone else's CI rather than in ours.
 */
export function schemaDir(): string {
  let dir = here;
  for (let depth = 0; depth < 6; depth++) {
    const candidate = join(dir, "schemas");
    if (existsSync(join(candidate, "aux-heuristics.yaml"))) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    `aux-audit: could not locate the schemas/ directory above ${here}. ` +
      "Reinstall the package, or run `npm run sync:schemas`.",
  );
}

function load(file: string): Record<string, unknown> {
  const raw = readFileSync(join(schemaDir(), file), "utf8");
  const doc = parse(raw) as Record<string, unknown> | null;
  if (!doc || typeof doc !== "object") {
    throw new Error(`aux-audit: ${file} did not parse into a mapping`);
  }
  return doc;
}

let cached: Canon | undefined;

export function loadCanon(): Canon {
  if (cached) return cached;

  const h = load("aux-heuristics.yaml");
  const t = load("trust-architecture.yaml");
  const g = load("trust-gap-taxonomy.yaml");

  const heuristics = h["heuristics"] as Heuristic[] | undefined;
  const stages = t["stages"] as TrustStage[] | undefined;
  const gaps = g["gaps"] as TrustGap[] | undefined;

  if (!Array.isArray(heuristics) || heuristics.length === 0) {
    throw new Error("aux-audit: aux-heuristics.yaml has no `heuristics` list");
  }
  if (!Array.isArray(stages) || stages.length === 0) {
    throw new Error("aux-audit: trust-architecture.yaml has no `stages` list");
  }
  if (!Array.isArray(gaps) || gaps.length === 0) {
    throw new Error("aux-audit: trust-gap-taxonomy.yaml has no `gaps` list");
  }

  cached = {
    heuristics,
    heuristicsVersion: String(h["version"] ?? "unknown"),
    stages: [...stages].sort((a, b) => a.order - b.order),
    trustArchitectureVersion: String(t["version"] ?? "unknown"),
    gaps,
    taxonomyVersion: String(g["version"] ?? "unknown"),
  };
  return cached;
}

/** Every gap in the taxonomy that names this heuristic as the thing that broke. */
export function gapsForHeuristic(canon: Canon, heuristicId: string): TrustGap[] {
  return canon.gaps.filter((gap) => gap.heuristic_ref === heuristicId);
}

/**
 * Heuristics a trust stage depends on, derived from the taxonomy rather than
 * hardcoded: a stage's gaps name the heuristics whose failure violates it.
 */
export function heuristicsForStage(canon: Canon, stageId: string): string[] {
  const ids = canon.gaps
    .filter((gap) => gap.trust_stage === stageId)
    .map((gap) => gap.heuristic_ref);
  return [...new Set(ids)].sort();
}
