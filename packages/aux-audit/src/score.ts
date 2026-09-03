/**
 * Turns rule outcomes into the v0.1 report: score, grade, trust stage, issues,
 * recommendations.
 *
 * Nothing here hardcodes which heuristics belong to which trust stage — that
 * mapping is read out of trust-gap-taxonomy.yaml, where each gap already names
 * both the heuristic that broke and the stage it violated.
 */
import {
  gapsForHeuristic,
  heuristicsForStage,
  loadCanon,
  type Canon,
} from "./canon.js";
import { RULES } from "./rules.js";
import type {
  AgentSpec,
  AuditReport,
  Grade,
  HeuristicResult,
  Issue,
  Severity,
  TrustStageResult,
} from "./types.js";
import { SEVERITY_ORDER } from "./types.js";

export interface AuditOptions {
  /** Heuristic ids to treat as not applicable (from audit.config.yaml). */
  ignore?: string[];
  /** Per-heuristic severity overrides (from audit.config.yaml). */
  severityOverrides?: Record<string, Severity>;
  toolVersion?: string;
  now?: Date;
}

/** A stage counts as earned only if every heuristic its gaps name scores >= 2. */
const EARNED_AT = 2;

/**
 * Level 3 is "robust — works under novel, adversarial, or edge cases". A spec
 * cannot demonstrate that; only evidence can. So a spec with no golden or
 * failure transcripts is capped at 2 ("present"), however much it declares.
 *
 * This is what stops the audit from being gamed by writing better prose.
 */
const ROBUST_CAP = 2;

function hasEvidence(spec: AgentSpec): boolean {
  return (
    (spec.evaluation?.golden_transcripts ?? []).length > 0 ||
    (spec.evaluation?.failure_transcripts ?? []).length > 0
  );
}

function grade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

/** "Visibility of Agent Intent & Action" -> "visibility_of_agent_intent_action" */
function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isSeverity(value: string): value is Severity {
  return value === "low" || value === "medium" || value === "high" || value === "critical";
}

/** The worst severity the taxonomy assigns to any gap caused by this heuristic. */
function worstSeverity(canon: Canon, heuristicId: string): Severity {
  let worst: Severity = "high";
  for (const gap of gapsForHeuristic(canon, heuristicId)) {
    const candidate = gap.severity_default;
    if (isSeverity(candidate) && SEVERITY_ORDER[candidate] > SEVERITY_ORDER[worst]) {
      worst = candidate;
    }
  }
  return worst;
}

function recommend(heuristicName: string, fixPattern: string): string {
  return `${heuristicName}: adopt the \`${fixPattern}\` pattern.`;
}

export function audit(spec: AgentSpec, options: AuditOptions = {}): AuditReport {
  const canon = loadCanon();
  const ignore = new Set(options.ignore ?? []);
  const overrides = options.severityOverrides ?? {};

  const evidenced = hasEvidence(spec);
  const byId = new Map(canon.heuristics.map((h) => [h.id, h]));
  const heuristics: HeuristicResult[] = [];

  for (const rule of RULES) {
    const definition = byId.get(rule.id);
    if (!definition) {
      throw new Error(
        `aux-audit: rule ${rule.id} has no definition in aux-heuristics.yaml`,
      );
    }
    if (ignore.has(rule.id)) {
      heuristics.push({
        id: rule.id,
        name: definition.name,
        level: 0,
        applicable: false,
        evidence: "ignored by audit.config.yaml",
        fix_pattern: definition.fix_pattern,
      });
      continue;
    }
    const outcome = rule.evaluate(spec);
    const capped = outcome.applicable && !evidenced && outcome.level > ROBUST_CAP;
    heuristics.push({
      id: rule.id,
      name: definition.name,
      level: capped ? ROBUST_CAP : outcome.level,
      applicable: outcome.applicable,
      evidence: capped
        ? `${outcome.evidence}; capped at "present" — no golden or failure transcripts demonstrate edge-case behaviour`
        : outcome.evidence,
      fix_pattern: definition.fix_pattern,
    });
  }

  // Heuristics that do not apply leave the denominator rather than scoring 0 or 3.
  const scored = heuristics.filter((h) => h.applicable);
  const total = scored.reduce((sum, h) => sum + h.level, 0);
  const max = scored.length * 3;
  const score = max === 0 ? 0 : Math.round((total / max) * 100);

  const levelOf = new Map(heuristics.map((h) => [h.id, h]));

  // Trust ladder: sequential, so a stage cannot be earned if an earlier one is not.
  const trust_stages: TrustStageResult[] = [];
  let ladderIntact = true;
  for (const stage of canon.stages) {
    const depends_on = heuristicsForStage(canon, stage.id);
    const shortfall = depends_on.filter((id) => {
      const result = levelOf.get(id);
      return result !== undefined && result.applicable && result.level < EARNED_AT;
    });
    const earnedHere = shortfall.length === 0;
    const earned = ladderIntact && earnedHere;
    if (!earned) ladderIntact = false;
    trust_stages.push({
      id: stage.id,
      name: stage.name,
      order: stage.order,
      earned,
      depends_on,
      shortfall,
    });
  }

  const highest = [...trust_stages].reverse().find((s) => s.earned);
  const trust_stage = highest ? highest.name.toLowerCase().replace(/ trust$/, "") : null;

  const issues: Issue[] = [];
  const recommendations: string[] = [];

  for (const result of heuristics) {
    if (!result.applicable || result.level >= EARNED_AT) continue;
    const override = overrides[result.id];
    const severity: Severity =
      override ?? (result.level === 0 ? worstSeverity(canon, result.id) : "medium");
    issues.push({
      id: result.id,
      type: slug(result.name),
      severity,
      evidence: result.evidence,
    });
    recommendations.push(recommend(result.name, result.fix_pattern));
  }

  for (const stage of trust_stages) {
    if (stage.earned || stage.shortfall.length === 0) continue;
    issues.push({
      id: stage.id,
      type: `${stage.name.toLowerCase().replace(/ trust$/, "").replace(/\s+/g, "_")}_trust_gap`,
      severity: "high",
      evidence: `${stage.name} is not earned: ${stage.shortfall.join(", ")} score below ${EARNED_AT}`,
    });
  }

  issues.sort(
    (a, b) =>
      SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] ||
      a.id.localeCompare(b.id),
  );

  return {
    spec: { name: spec.name, version: spec.version },
    score,
    grade: grade(score),
    trust_stage,
    evolution_stage: null,
    evolution_stage_status: "schema-undefined",
    heuristics,
    trust_stages,
    issues,
    recommendations: [...new Set(recommendations)],
    meta: {
      tool: "aux-audit",
      tool_version: options.toolVersion ?? "0.1.0",
      heuristics_version: canon.heuristicsVersion,
      trust_architecture_version: canon.trustArchitectureVersion,
      taxonomy_version: canon.taxonomyVersion,
      generated_at: (options.now ?? new Date()).toISOString(),
    },
  };
}

/** True when any issue is at or above the threshold — drives the CI exit code. */
export function shouldFail(report: AuditReport, failOn: Severity): boolean {
  return report.issues.some(
    (issue) => SEVERITY_ORDER[issue.severity] >= SEVERITY_ORDER[failOn],
  );
}
