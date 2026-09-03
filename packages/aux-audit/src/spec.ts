/**
 * Loads and validates an agent spec against schemas/agent-spec.schema.yaml.
 *
 * Per the schema header: "Fields marked required will cause the audit to refuse
 * to run if missing." A spec that fails validation is an error, not a low score
 * — refusing to grade an unparseable product is the whole point.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { schemaDir } from "./canon.js";
import type { AgentSpec, Autonomy, MemorySpec, Surface } from "./types.js";

const schemaPath = (): string => join(schemaDir(), "agent-spec.schema.yaml");

export class SpecError extends Error {
  readonly problems: string[];
  constructor(problems: string[]) {
    super(
      `agent spec is not valid:\n${problems.map((p) => `  - ${p}`).join("\n")}`,
    );
    this.name = "SpecError";
    this.problems = problems;
  }
}

interface FieldRule {
  type?: string;
  values?: string[];
  required?: boolean;
}

/** Enum values come from the schema so adding a surface does not require a release. */
function schemaEnums(): { surface: string[]; autonomy: string[] } {
  const doc = parse(readFileSync(schemaPath(), "utf8")) as Record<string, unknown>;
  const root = (doc["$schema"] ?? {}) as Record<string, FieldRule>;
  const surface = root["surface"]?.values;
  const autonomy = root["autonomy"]?.values;
  if (!Array.isArray(surface) || !Array.isArray(autonomy)) {
    throw new Error(
      "aux-audit: agent-spec.schema.yaml is missing surface/autonomy enum values",
    );
  }
  return { surface, autonomy };
}

/** ISO-8601 duration, e.g. P90D, P1Y6M, PT12H. Rejects a bare "P". */
const ISO_DURATION =
  /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?!$)(\d+H)?(\d+M)?(\d+S)?)?$/;

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function validateMemory(value: unknown, problems: string[]): void {
  if (value === undefined || value === null) {
    problems.push("`memory` is required");
    return;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    problems.push("`memory` must be a mapping");
    return;
  }
  const memory = value as Record<string, unknown>;
  for (const key of ["persistent", "user_visible", "user_editable"] as const) {
    if (typeof memory[key] !== "boolean") {
      problems.push(`\`memory.${key}\` is required and must be a boolean`);
    }
  }
  if (!isStringList(memory["scopes"])) {
    problems.push("`memory.scopes` is required and must be a list of strings");
  }
  const retention = memory["retention"];
  if (typeof retention !== "string") {
    problems.push(
      "`memory.retention` is required and must be an ISO-8601 duration (e.g. P90D)",
    );
  } else if (!ISO_DURATION.test(retention)) {
    problems.push(
      `\`memory.retention\` is not a valid ISO-8601 duration: ${retention}`,
    );
  }
}

function validateOptionalStringList(
  value: unknown,
  path: string,
  problems: string[],
): void {
  if (value === undefined || value === null) return;
  if (!isStringList(value)) {
    problems.push(`\`${path}\` must be a list of strings`);
  }
}

export function validateSpec(input: unknown): AgentSpec {
  const problems: string[] = [];

  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new SpecError(["the spec must be a YAML or JSON mapping"]);
  }
  const raw = input as Record<string, unknown>;
  const { surface, autonomy } = schemaEnums();

  for (const key of ["name", "version"] as const) {
    if (typeof raw[key] !== "string" || (raw[key] as string).trim() === "") {
      problems.push(`\`${key}\` is required and must be a non-empty string`);
    }
  }

  if (typeof raw["surface"] !== "string") {
    problems.push("`surface` is required");
  } else if (!surface.includes(raw["surface"])) {
    problems.push(
      `\`surface\` must be one of: ${surface.join(", ")} (got: ${raw["surface"]})`,
    );
  }

  if (typeof raw["autonomy"] !== "string") {
    problems.push("`autonomy` is required");
  } else if (!autonomy.includes(raw["autonomy"])) {
    problems.push(
      `\`autonomy\` must be one of: ${autonomy.join(", ")} (got: ${raw["autonomy"]})`,
    );
  }

  validateMemory(raw["memory"], problems);
  validateOptionalStringList(raw["tools"], "tools", problems);
  validateOptionalStringList(raw["flows"], "flows", problems);
  validateOptionalStringList(raw["guarantees"], "guarantees", problems);

  const evaluation = raw["evaluation"];
  if (evaluation !== undefined && evaluation !== null) {
    if (typeof evaluation !== "object" || Array.isArray(evaluation)) {
      problems.push("`evaluation` must be a mapping");
    } else {
      const ev = evaluation as Record<string, unknown>;
      validateOptionalStringList(
        ev["golden_transcripts"],
        "evaluation.golden_transcripts",
        problems,
      );
      validateOptionalStringList(
        ev["failure_transcripts"],
        "evaluation.failure_transcripts",
        problems,
      );
    }
  }

  if (problems.length > 0) throw new SpecError(problems);

  return {
    name: raw["name"] as string,
    version: raw["version"] as string,
    surface: raw["surface"] as Surface,
    autonomy: raw["autonomy"] as Autonomy,
    memory: raw["memory"] as MemorySpec,
    tools: (raw["tools"] as string[] | undefined) ?? [],
    flows: (raw["flows"] as string[] | undefined) ?? [],
    guarantees: (raw["guarantees"] as string[] | undefined) ?? [],
    evaluation: {
      golden_transcripts:
        ((raw["evaluation"] as Record<string, unknown> | undefined)?.[
          "golden_transcripts"
        ] as string[] | undefined) ?? [],
      failure_transcripts:
        ((raw["evaluation"] as Record<string, unknown> | undefined)?.[
          "failure_transcripts"
        ] as string[] | undefined) ?? [],
    },
  };
}

export function loadSpec(path: string): AgentSpec {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    throw new SpecError([`cannot read spec file: ${path}`]);
  }
  let parsed: unknown;
  try {
    parsed = parse(raw);
  } catch (error) {
    throw new SpecError([
      `spec is not valid YAML or JSON: ${(error as Error).message}`,
    ]);
  }
  return validateSpec(parsed);
}
