import type { AuditReport } from "../types.js";

/** The v0.1 JSON contract, stable field order for readable diffs in CI. */
export function toJson(report: AuditReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
