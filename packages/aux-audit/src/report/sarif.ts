/**
 * SARIF 2.1.0 output, for `github/codeql-action/upload-sarif`.
 *
 * Each AUX heuristic becomes a SARIF rule; each issue becomes a result anchored
 * to the spec file, so findings land in the Security tab and on the PR diff.
 */
import { loadCanon } from "../canon.js";
import type { AuditReport, Severity } from "../types.js";

/** SARIF has three levels; the taxonomy has four. critical and high both fail. */
const SARIF_LEVEL: Record<Severity, "error" | "warning" | "note"> = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "note",
};

/** GitHub renders security-severity as the numeric CVSS-style band. */
const SECURITY_SEVERITY: Record<Severity, string> = {
  critical: "9.0",
  high: "7.0",
  medium: "4.0",
  low: "1.0",
};

export function toSarif(report: AuditReport, specPath: string): string {
  const canon = loadCanon();

  const heuristicRules = canon.heuristics.map((h) => ({
    id: h.id,
    name: h.name,
    shortDescription: { text: h.name },
    fullDescription: { text: h.question },
    help: {
      text: `${h.question}\n\nFailure mode: ${h.failure_mode}\nFix pattern: ${h.fix_pattern}`,
      markdown:
        `**${h.question}**\n\n` +
        `- Failure mode: ${h.failure_mode}\n` +
        `- Fix pattern: \`${h.fix_pattern}\`\n\n` +
        `[AUX Heuristics](https://github.com/auxfirst/trustkit/blob/main/schemas/aux-heuristics.yaml)`,
    },
    properties: { tags: ["aux", "heuristic", h.fix_pattern] },
  }));

  const stageRules = canon.stages.map((s) => ({
    id: s.id,
    name: s.name,
    shortDescription: { text: s.name },
    fullDescription: { text: s.question },
    help: {
      text: `${s.question}\n\nEarned when:\n${s.earned_when.map((e) => `- ${e}`).join("\n")}`,
      markdown:
        `**${s.question}**\n\nEarned when:\n${s.earned_when.map((e) => `- ${e}`).join("\n")}\n\n` +
        `[Trust Architecture](https://github.com/auxfirst/trustkit/blob/main/schemas/trust-architecture.yaml)`,
    },
    properties: { tags: ["aux", "trust-stage"] },
  }));

  const rules = [...heuristicRules, ...stageRules];
  const ruleIndex = new Map(rules.map((rule, index) => [rule.id, index]));

  const results = report.issues.map((issue) => ({
    ruleId: issue.id,
    ruleIndex: ruleIndex.get(issue.id) ?? 0,
    level: SARIF_LEVEL[issue.severity],
    message: { text: `${issue.type}: ${issue.evidence}` },
    properties: {
      "security-severity": SECURITY_SEVERITY[issue.severity],
      "aux-severity": issue.severity,
    },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: specPath, uriBaseId: "%SRCROOT%" },
          region: { startLine: 1 },
        },
      },
    ],
  }));

  const sarif = {
    $schema:
      "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "aux-audit",
            version: report.meta.tool_version,
            semanticVersion: report.meta.tool_version,
            informationUri: "https://github.com/auxfirst/trustkit",
            rules,
          },
        },
        results,
        properties: {
          score: report.score,
          grade: report.grade,
          trust_stage: report.trust_stage,
        },
      },
    ],
  };

  return `${JSON.stringify(sarif, null, 2)}\n`;
}
