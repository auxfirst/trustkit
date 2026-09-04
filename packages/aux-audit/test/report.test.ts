import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { audit } from "../src/score.js";
import { loadEvidence } from "../src/spec.js";
import { toJson } from "../src/report/json.js";
import { toMarkdown } from "../src/report/markdown.js";
import { toSarif } from "../src/report/sarif.js";
import { cliPath, fixture } from "./helpers.js";

const weak = () => audit(loadEvidence(fixture("weak-spec.yaml")));

test("json output round-trips and keeps the v0.1 contract fields", () => {
  const report = weak();
  const parsed = JSON.parse(toJson(report));
  for (const key of ["score", "grade", "trust_stage", "issues", "recommendations"]) {
    assert.ok(key in parsed, `missing contract field: ${key}`);
  }
  assert.equal(parsed.score, report.score);
});

test("markdown scorecard names the score, the stages, and every issue", () => {
  const report = weak();
  const md = toMarkdown(report);
  assert.match(md, /## aux-audit/);
  assert.match(md, new RegExp(`Score ${report.score}/100`));
  for (const stage of report.trust_stages) assert.ok(md.includes(stage.name));
  for (const issue of report.issues) assert.ok(md.includes(issue.id));
  assert.match(md, /grades the \*\*spec\*\*|describe the \*\*spec\*\*/);
});

test("sarif is valid 2.1.0 and every result points at a declared rule", () => {
  const report = weak();
  const sarif = JSON.parse(toSarif(report, "spec.yaml"));
  assert.equal(sarif.version, "2.1.0");
  const run = sarif.runs[0];
  assert.equal(run.tool.driver.name, "aux-audit");
  const ruleIds = run.tool.driver.rules.map((r: { id: string }) => r.id);
  assert.equal(new Set(ruleIds).size, ruleIds.length, "rule ids must be unique");
  for (const result of run.results) {
    assert.ok(ruleIds.includes(result.ruleId), `${result.ruleId} has no rule`);
    assert.equal(ruleIds[result.ruleIndex], result.ruleId, "ruleIndex must match ruleId");
    assert.ok(["error", "warning", "note"].includes(result.level));
    assert.ok(result.locations[0].physicalLocation.artifactLocation.uri);
  }
  assert.equal(run.results.length, report.issues.length);
});

test("CLI: grades a spec and exits 0 when under the threshold", () => {
  const out = execFileSync(process.execPath, [
    cliPath(), "run", fixture("strong-spec.yaml"), "--fail-on", "critical",
  ], { encoding: "utf8" });
  assert.match(out, /Score \d+\/100/);
});

test("CLI: exits 1 on findings at or above --fail-on", () => {
  try {
    execFileSync(process.execPath, [
      cliPath(), "run", fixture("weak-spec.yaml"), "--fail-on", "high",
    ], { encoding: "utf8", stdio: "pipe" });
    assert.fail("expected a non-zero exit");
  } catch (error) {
    assert.equal((error as { status: number }).status, 1);
  }
});

test("CLI: exits 2 on an invalid spec without grading it", () => {
  try {
    execFileSync(process.execPath, [cliPath(), "run", fixture("invalid-spec.yaml")], {
      encoding: "utf8",
      stdio: "pipe",
    });
    assert.fail("expected a non-zero exit");
  } catch (error) {
    const err = error as { status: number; stderr: string; stdout: string };
    assert.equal(err.status, 2);
    assert.match(err.stderr, /agent spec is not valid/);
    assert.doesNotMatch(err.stdout, /Score/, "must not print a grade");
  }
});

test("CLI: exits 2 on a missing file and on a bad flag", () => {
  for (const argv of [
    ["run", "./does-not-exist.yaml"],
    ["run", fixture("weak-spec.yaml"), "--format", "xml"],
    ["explode", fixture("weak-spec.yaml")],
  ]) {
    try {
      execFileSync(process.execPath, [cliPath(), ...argv], { stdio: "pipe" });
      assert.fail(`expected a non-zero exit for: ${argv.join(" ")}`);
    } catch (error) {
      assert.equal((error as { status: number }).status, 2, argv.join(" "));
    }
  }
});

test("CLI: --out and --summary write both artifacts the workflow expects", () => {
  const dir = mkdtempSync(join(tmpdir(), "aux-audit-"));
  const sarifPath = join(dir, "audit.sarif");
  const summaryPath = join(dir, "audit-summary.md");
  try {
    execFileSync(process.execPath, [
      cliPath(), "run", fixture("weak-spec.yaml"),
      "--format", "sarif", "--out", sarifPath, "--summary", summaryPath,
      "--fail-on", "high",
    ], { stdio: "pipe" });
    assert.fail("expected exit 1");
  } catch (error) {
    assert.equal((error as { status: number }).status, 1);
  }
  assert.equal(JSON.parse(readFileSync(sarifPath, "utf8")).version, "2.1.0");
  assert.match(readFileSync(summaryPath, "utf8"), /## aux-audit/);
});

test("CLI: --config is honoured", () => {
  const out = execFileSync(process.execPath, [
    cliPath(), "run", fixture("strong-spec.yaml"),
    "--config", fixture("audit.config.yaml"), "--format", "json",
  ], { encoding: "utf8" });
  const report = JSON.parse(out);
  const h09 = report.heuristics.find((h: { id: string }) => h.id === "aux.H09");
  assert.equal(h09.applicable, false);
});

test("CLI: --version and --help exit 0", () => {
  assert.match(
    execFileSync(process.execPath, [cliPath(), "--version"], { encoding: "utf8" }),
    /^0\.3\.0/,
  );
  assert.match(
    execFileSync(process.execPath, [cliPath(), "--help"], { encoding: "utf8" }),
    /USAGE/,
  );
});


test("CLI: a v1 spec is scored, and the report says which format it was", () => {
  const out = execFileSync(
    process.execPath,
    [cliPath(), "run", fixture("v1-strong-spec.yaml"), "--format", "json"],
    { encoding: "utf8" },
  );
  const report = JSON.parse(out);
  assert.equal(report.meta.spec_version, "v1.0");
  assert.ok(report.score > 0);
  assert.equal(report.spec.name, "Accounts Receivable Follow-Up");
});

test("CLI: an invalid v1 spec reports v1 fields, never v0 ones", () => {
  const dir = mkdtempSync(join(tmpdir(), "aux-audit-v1-"));
  const specPath = join(dir, "broken.yaml");
  writeFileSync(specPath, "spec_version: '1.0'\nid: x\nname: X\nmandate: []\n");
  try {
    execFileSync(process.execPath, [cliPath(), "run", specPath], { stdio: "pipe" });
    assert.fail("expected a non-zero exit");
  } catch (error) {
    const err = error as { status: number; stderr: Buffer };
    assert.equal(err.status, 2);
    const stderr = err.stderr.toString();
    assert.match(stderr, /`shutdown` is required/);
    // v0's vocabulary must never surface for a v1 document.
    assert.doesNotMatch(stderr, /`autonomy` is required/);
    assert.doesNotMatch(stderr, /`surface` is required/);
  }
});
