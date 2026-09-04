import { test } from "node:test";
import assert from "node:assert/strict";
import { audit, shouldFail } from "../src/score.js";
import { loadSpec, loadEvidence, evidenceFrom } from "../src/spec.js";
import { fromV0 } from "../src/evidence.js";
import { loadCanon, heuristicsForStage } from "../src/canon.js";
import { RULES } from "../src/rules.js";
import { fixture } from "./helpers.js";

const strong = () => audit(loadEvidence(fixture("strong-spec.yaml")));
const weak = () => audit(loadEvidence(fixture("weak-spec.yaml")));

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

  const crew = audit(loadEvidence(fixture("multi-agent-spec.yaml")));
  const multi = crew.heuristics.find((h) => h.id === "aux.H09")!;
  assert.equal(multi.applicable, true, "agent.delegate should trigger H09");
});

test("non-applicable heuristics never produce issues", () => {
  for (const report of [strong(), weak(), audit(loadEvidence(fixture("multi-agent-spec.yaml")))]) {
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
  const report = audit(loadEvidence(fixture("weak-spec.yaml")), {
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
  const ev = loadEvidence(fixture("strong-spec.yaml"));
  assert.deepEqual(audit(ev, { now }), audit(ev, { now }));
});

test("evolution_stage is permanently out of scope, not pending", () => {
  // trustkit#5 option B: capability is assessed by a human in teardowns,
  // never computed from a spec. The status must not read as future work.
  for (const report of [strong(), weak()]) {
    assert.equal(report.evolution_stage, null);
    assert.equal(report.evolution_stage_status, "human-assessed");
  }
});

test("level 3 requires evidence — a spec with no transcripts is capped at present", () => {
  const ev = loadEvidence(fixture("strong-spec.yaml"));
  const withEvidence = audit(ev);
  const withoutEvidence = audit({
    ...ev,
    goldenTranscripts: false,
    failureTranscripts: false,
    evidenced: false,
  });

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
  const wordy = audit(fromV0({
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
  }));
  assert.ok(wordy.heuristics.every((h) => !h.applicable || h.level <= 2));
  assert.ok(wordy.score <= 67, `prose alone should not reach robust, got ${wordy.score}`);
});

// --- agent-spec v1 ------------------------------------------------------

const v1strong = () => audit(loadEvidence(fixture("v1-strong-spec.yaml")));
const v1weak = () => audit(loadEvidence(fixture("v1-weak-spec.yaml")));

test("v1: the report records which spec format produced the score", () => {
  assert.equal(v1strong().meta.spec_version, "v1.0");
  assert.equal(strong().meta.spec_version, "v0.1.0");
});

test("v1: a mandate with enforcement outscores one without", () => {
  assert.ok(v1strong().score > v1weak().score);
});

test("v1: capability the mandate does not govern is reported as the attack surface", () => {
  const h05 = v1weak().heuristics.find((h) => h.id === "aux.H05")!;
  assert.match(h05.evidence, /capabilities the credentials grant but no mandate governs/);
  assert.match(h05.evidence, /delete_email/);
  assert.ok(h05.level < 2, "ungoverned write capability must not score as present");
});

test("v1: a prompt is not an enforcing mechanism", () => {
  const spec = {
    spec_version: "1.0",
    id: "prompt-enforcement-probe",
    name: "Prompt Enforcement Probe",
    purpose: "Exercise the rule that an enforcing mechanism is not a prompt.",
    owners: { business: { name: "A", role: "r" }, technical: { name: "B", role: "r" } },
    trigger: { kind: "event" },
    systems: { data_sources: ["s"], connected: [{ name: "n", auth: "service_account" }] },
    capability: { can_read: [], can_change: ["refund"] },
    mandate: [{ action: "refund", authority: "human_approval", enforced_by: "the system prompt" }],
    human_control: {
      observe: { available: true },
      interrupt: { available: true },
      approve: { available: true },
      override: { available: true },
      disable: { available: true },
    },
    exceptions: [{ condition: "other", response: "stop" }],
    shutdown: { procedure: "Disable the integration.", tested: true },
  };
  const report = audit(evidenceFrom(spec));
  const h05 = report.heuristics.find((h) => h.id === "aux.H05")!;
  assert.match(h05.evidence, /enforced by something that is not a mechanism/);
  assert.match(h05.evidence, /the system prompt/);
});

test("v1: aux.H08 is not scoreable, and says why rather than scoring zero", () => {
  const h08 = v1strong().heuristics.find((h) => h.id === "aux.H08")!;
  assert.equal(h08.applicable, false);
  assert.match(h08.evidence, /no memory field/);
  assert.ok(!v1strong().issues.some((i) => i.id === "aux.H08"), "must not be reported as a failing");
});

test("a stage with no scoreable evidence is never reported as earned", () => {
  // The bug this guards: aux.H08 is the only heuristic backing aux.T02. Under
  // v1 it cannot be scored, and an empty shortfall was reading as "earned" —
  // a claim dressed as a finding.
  const contextual = v1strong().trust_stages.find((s) => s.id === "aux.T02")!;
  assert.equal(contextual.assessable, false);
  assert.equal(contextual.earned, false);
  assert.ok(!v1strong().issues.some((i) => i.id === "aux.T02"), "not the product's failure to fix");
});

test("an unassessable stage stops the ladder, as a broken one would", () => {
  const stages = v1strong().trust_stages;
  assert.equal(stages.find((s) => s.id === "aux.T01")!.earned, true);
  for (const id of ["aux.T02", "aux.T03", "aux.T04"]) {
    assert.equal(stages.find((s) => s.id === id)!.earned, false, `${id} must not be earned`);
  }
  assert.equal(v1strong().trust_stage, "functional");
});

test("v0 stages stay assessable — the change is version-specific", () => {
  assert.ok(strong().trust_stages.every((s) => s.assessable));
});
