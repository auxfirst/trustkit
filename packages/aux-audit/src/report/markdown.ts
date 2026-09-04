import type { AuditReport, HeuristicResult } from "../types.js";

const LEVEL_LABEL: Record<number, string> = {
  0: "absent",
  1: "attempted",
  2: "present",
  3: "robust",
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: "🔴 critical",
  high: "🟠 high",
  medium: "🟡 medium",
  low: "⚪ low",
};

function bar(level: number): string {
  return "●".repeat(level) + "○".repeat(3 - level);
}

function row(h: HeuristicResult): string {
  if (!h.applicable) {
    return `| \`${h.id}\` | ${h.name} | — | n/a | ${h.evidence} |`;
  }
  return `| \`${h.id}\` | ${h.name} | ${bar(h.level)} | ${LEVEL_LABEL[h.level]} | ${h.evidence} |`;
}

/** The PR-comment scorecard. Readable on its own; no colour, no JS. */
export function toMarkdown(report: AuditReport): string {
  const lines: string[] = [];
  const applicable = report.heuristics.filter((h) => h.applicable);

  const version = report.spec.version === "unversioned" ? "" : ` \`${report.spec.version}\``;
  lines.push(`## aux-audit — ${report.spec.name}${version}`);
  lines.push("");
  lines.push(
    `**Score ${report.score}/100 · Grade ${report.grade} · Trust stage: ${report.trust_stage ?? "none earned"}**`,
  );
  lines.push("");

  lines.push("### Trust Architecture");
  lines.push("");
  lines.push("| Stage | Earned | Blocked by |");
  lines.push("|---|---|---|");
  for (const stage of report.trust_stages) {
    if (!stage.assessable) {
      lines.push(
        `| ${stage.order}. ${stage.name} | — | not assessable: ${stage.depends_on
          .map((s) => `\`${s}\``)
          .join(", ")} could not be scored |`,
      );
      continue;
    }
    const blockers =
      stage.shortfall.length > 0
        ? stage.shortfall.map((s) => `\`${s}\``).join(", ")
        : stage.earned
          ? "—"
          : "an earlier stage — trust is sequential";
    lines.push(`| ${stage.order}. ${stage.name} | ${stage.earned ? "✅" : "❌"} | ${blockers} |`);
  }
  lines.push("");
  lines.push(
    "> Trust is sequential. A stage is earned only when every heuristic its failure modes name scores *present* or better, and only if every earlier stage is earned.",
  );
  if (report.trust_stages.some((stage) => !stage.assessable)) {
    lines.push("");
    lines.push(
      "> A stage marked *not assessable* had no scoreable evidence at all. It is not earned and not failed — nothing was measured, and reporting it either way would be a claim rather than a finding.",
    );
  }
  lines.push("");

  lines.push(`### Heuristics (${applicable.length} scored)`);
  lines.push("");
  lines.push("| ID | Heuristic | Score | Level | Evidence |");
  lines.push("|---|---|---|---|---|");
  for (const h of report.heuristics) lines.push(row(h));
  lines.push("");

  if (report.issues.length > 0) {
    lines.push(`### Issues (${report.issues.length})`);
    lines.push("");
    for (const issue of report.issues) {
      lines.push(
        `- ${SEVERITY_BADGE[issue.severity] ?? issue.severity} **\`${issue.id}\`** \`${issue.type}\` — ${issue.evidence}`,
      );
    }
    lines.push("");
  } else {
    lines.push("### Issues");
    lines.push("");
    lines.push("None. Every applicable heuristic scores *present* or better.");
    lines.push("");
  }

  if (report.recommendations.length > 0) {
    lines.push("### Recommendations");
    lines.push("");
    for (const rec of report.recommendations) lines.push(`- ${rec}`);
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push(
    `<sub>aux-audit ${report.meta.tool_version} · heuristics ${report.meta.heuristics_version} · trust architecture ${report.meta.trust_architecture_version} · taxonomy ${report.meta.taxonomy_version}. ` +
      `Scores describe the **spec**, not the running product: aux-audit can prove a mechanism was never declared, never that a declared one works. ` +
      `Capability axis (\`evolution_stage\`) is not scored here by design: a spec states what a product claims, not what it does. ` +
      `[The standard](https://github.com/auxfirst/trustkit) · [auxfirst.com](https://auxfirst.com)</sub>`,
  );
  lines.push("");
  return lines.join("\n");
}
