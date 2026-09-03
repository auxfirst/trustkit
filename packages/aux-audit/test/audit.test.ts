import { test } from "node:test";
import assert from "node:assert/strict";
import { audit, shouldFail } from "../src/score.js";
import { loadSpec } from "../src/spec.js";
import { loadCanon, heuristicsForStage } from "../src/canon.js";
import { RULES } from "../src/rules.js";
import { fixture } from "./helpers.js";

const strong = () => audit(loadSpec(fixture("strong-spec.yaml")));
const weak = () => audit(loadSpec(fixture("weak-spec.yaml")));

test("every rule maps to a heuristic in the canonical schema", () => {
  const canon = loadCanon();
  const ids = new Set(canon.heuristics.map((h) => h.id));
  assert.equal(RULES.length, canon.heuristics.length, "one rule per heuristic");
  for (const rule of RULES) {
    assert.ok(ids.has(rule.id), `${rule.id} is not in aux-heuristics.yaml`);
  }
});

test("a spec declaring real mechanisms outscores one that declares none", () => {
  assert.ok(strong().score > weak().score);
});

test("the weak spec fails hard and earns no trust stage", () => {
  const report = weak();
  assert.equal(report.trust_stage, null);
  assert.equal(report.grade, "F");
  assert.ok(report.issues.length > 0);
  assert.ok(report.trust_stages.every((stage) => !stage.earned));
});

test("the strong spec climbs the ladder", () => {
  const report = strong();
  assert.ok(report.score >= 75, `expected >= 75, got ${report.score}`);
  assert.ok(report.trust_stage !== null);
  assert.equal(report.trust_stages[0]!.earned, true);
});

test("score is a percentage of applicable heuristics only", () => {
  const report = strong();
  const applicable = report.heuristics.filter((h) => h.applicable);
  const total = applicable.reduce((sum, h) => sum + h.level, 0);
  assert.equal(report.score, Math.round((total / (applicable.length * 3)) * 100));
});

test("aux.H09 is not applicable to a single-agent spec but is to a crew", () => {
  const single = strong().heuristics.find((h) => h.id === "aux.H09")!;
  assert.equal(single.applicable, false);

  const crew = audit(loadSpec(fixture("multi-agent-spec.yaml")));
  const multi = crew.heuristics.find((h) => h.id === "aux.H09")!;
  assert.equal(multi.applicable, true, "agent.delegate should trigger H09");
});

test("non-applicable heuristics never produce issues", () => {
  for (const report of [strong(), weak(), audit(loadSpec(fixture("multi-agent-spec.yaml")))]) {
    const skipped = report.heuristics.filter((h) => !h.applicable).map((h) => h.id);
    for (const id of skipped) {
      assert.ok(!report.issues.some((issue) => issue.id === id), `${id} should not be reported`);
    }
  }
});

test("the trust ladder is sequential — a later stage cannot outrank an earlier gap", () => {
  const report = weak();
  let seenUnearned = false;
  for (const stage of report.trust_stages) {
    if (!stage.earned) seenUnearned = true;
    if (seenUnearned) assert.equal(stage.earned, false, `${stage.id} skipped a broken stage`);
  }
});

test("stage dependencies come from the taxonomy, not from code", () => {
  const canon = loadCanon();
  const report = strong();
  for (const stage of report.trust_stages) {
    assert.deepEqual(stage.depends_on, heuristicsForStage(canon, stage.id));
    assert.ok(stage.depends_on.length > 0, `${stage.id} has no gaps pointing at it`);
  }
});

test("issues are sorted worst-first", () => {
  const order = { low: 0, medium: 1, high: 2, critical: 3 } as const;
  const issues = weak().issues;
  for (let i = 1; i < issues.length; i++) {
    assert.ok(order[issues[i - 1]!.severity] >= order[issues[i]!.severity]);
  }
});

test("every issue carries evidence a reader can argue with", () => {
  for (const issue of weak().issues) {
    assert.ok(issue.evidence.length > 20, `${issue.id} evidence is too thin`);
    assert.ok(issue.type.length > 0);
  }
});

test("config can ignore a heuristic and override a severity", () => {
  const spec = loadSpec(fixture("weak-spec.yaml"));
  const report = audit(spec, {
    ignore: ["aux.H04"],
    severityOverrides: { "aux.H01": "low" },
  });
  const h04 = report.heuristics.find((h) => h.id === "aux.H04")!;
  assert.equal(h04.applicable, false);
  assert.ok(!report.issues.some((i) => i.id === "aux.H04"));
  assert.equal(report.issues.find((i) => i.id === "aux.H01")!.severity, "low");
});

test("shouldFail respects the threshold", () => {
  const report = weak();
  assert.equal(shouldFail(report, "critical"), report.issues.some((i) => i.severity === "critical"));
  assert.equal(shouldFail(report, "high"), true);
  assert.equal(shouldFail(report, "low"), true);
  assert.equal(shouldFail(strong(), "critical"), false);
});

test("the report is deterministic for the same spec", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const spec = loadSpec(fixture("strong-spec.yaml"));
  assert.deepEqual(audit(spec, { now }), audit(spec, { now }));
});

test("evolution_stage stays null while the Evolution Curve has no schema", () => {
  const report = strong();
  assert.equal(report.evolution_stage, null);
  assert.equal(report.evolution_stage_status, "schema-undefined");
});

test("level 3 requires evidence — a spec with no transcripts is capped at present", () => {
  const spec = loadSpec(fixture("strong-spec.yaml"));
  const withEvidence = audit(spec);
  const withoutEvidence = audit({ ...spec, evaluation: { golden_transcripts: [], failure_transcripts: [] } });

  assert.ok(withEvidence.heuristics.some((h) => h.applicable && h.level === 3));
  assert.ok(
    withoutEvidence.heuristics.every((h) => !h.applicable || h.level <= 2),
    "no heuristic may reach robust without transcripts",
  );
  assert.ok(withoutEvidence.score < withEvidence.score);
  assert.match(
    withoutEvidence.heuristics.find((h) => h.id === "aux.H01")!.evidence,
    /capped at "present"/,
  );
});

test("the cap cannot be dodged by declaring more prose", () => {
  const spec = loadSpec(fixture("weak-spec.yaml"));
  const wordy = audit({
    ...spec,
    guarantees: [
      "will always ask before acting",
      "will never act on an ambiguous request",
      "the user can cancel any in-flight action",
      "autonomy expands with tenure",
      "will flag low confidence and cite sources",
      "will always escalate to a human",
      "responses are deterministic and pinned to a model version",
    ],
    flows: ["./flows/onboarding.md", "./flows/handoff.md"],
  });
  assert.ok(wordy.heuristics.every((h) => !h.applicable || h.level <= 2));
  assert.ok(wordy.score <= 67, `prose alone should not reach robust, got ${wordy.score}`);
});
