export { audit, shouldFail, type AuditOptions } from "./score.js";
export { loadSpec, validateSpec, SpecError } from "./spec.js";
export { loadConfig, type AuditConfig } from "./config.js";
export { loadCanon, gapsForHeuristic, heuristicsForStage } from "./canon.js";
export { RULES } from "./rules.js";
export { toJson } from "./report/json.js";
export { toMarkdown } from "./report/markdown.js";
export { toSarif } from "./report/sarif.js";
export type * from "./types.js";
