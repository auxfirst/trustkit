/** Optional audit.config.yaml — narrow on purpose. */
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import type { Severity } from "./types.js";

export interface AuditConfig {
  /** Default --fail-on threshold when the flag is not passed. */
  fail_on?: Severity;
  /** Heuristics to mark not applicable (e.g. aux.H09 for a single-agent product). */
  ignore?: string[];
  /** Per-heuristic severity overrides, for teams that grade differently. */
  severity_overrides?: Record<string, Severity>;
}

const SEVERITIES = new Set(["low", "medium", "high", "critical"]);

function assertSeverity(value: unknown, where: string): Severity {
  if (typeof value !== "string" || !SEVERITIES.has(value)) {
    throw new Error(
      `audit config: ${where} must be one of low, medium, high, critical (got: ${String(value)})`,
    );
  }
  return value as Severity;
}

export function loadConfig(path: string): AuditConfig {
  const parsed = parse(readFileSync(path, "utf8")) as unknown;
  if (parsed === null || parsed === undefined) return {};
  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("audit config: file must be a mapping");
  }
  const raw = parsed as Record<string, unknown>;
  const config: AuditConfig = {};

  if (raw["fail_on"] !== undefined) {
    config.fail_on = assertSeverity(raw["fail_on"], "fail_on");
  }

  if (raw["ignore"] !== undefined) {
    const ignore = raw["ignore"];
    if (!Array.isArray(ignore) || ignore.some((v) => typeof v !== "string")) {
      throw new Error("audit config: ignore must be a list of heuristic ids");
    }
    config.ignore = ignore as string[];
  }

  if (raw["severity_overrides"] !== undefined) {
    const overrides = raw["severity_overrides"];
    if (typeof overrides !== "object" || overrides === null || Array.isArray(overrides)) {
      throw new Error("audit config: severity_overrides must be a mapping");
    }
    const out: Record<string, Severity> = {};
    for (const [key, value] of Object.entries(overrides as Record<string, unknown>)) {
      out[key] = assertSeverity(value, `severity_overrides.${key}`);
    }
    config.severity_overrides = out;
  }

  return config;
}
