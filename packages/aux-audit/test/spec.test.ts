import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { loadSpec, loadEvidence, evidenceFrom, validateSpec, SpecError } from "../src/spec.js";
import { fixture, repoSchema } from "./helpers.js";

test("loads a well-formed spec", () => {
  const spec = loadSpec(fixture("strong-spec.yaml"));
  assert.equal(spec.name, "Support Copilot v2");
  assert.equal(spec.autonomy, "human-on-the-loop");
  assert.equal(spec.memory.scopes.length, 3);
});

test("refuses to grade a spec missing required fields", () => {
  assert.throws(
    () => loadSpec(fixture("invalid-spec.yaml")),
    (error: unknown) => {
      assert.ok(error instanceof SpecError);
      const joined = error.problems.join("\n");
      assert.match(joined, /`version` is required/);
      assert.match(joined, /`autonomy` is required/);
      assert.match(joined, /`surface` must be one of/);
      assert.match(joined, /memory\.scopes/);
      assert.match(joined, /ISO-8601/);
      return true;
    },
  );
});

test("reports every problem at once rather than the first", () => {
  try {
    validateSpec({});
    assert.fail("expected SpecError");
  } catch (error) {
    assert.ok(error instanceof SpecError);
    assert.ok(error.problems.length >= 5, "should collect all missing fields");
  }
});

test("rejects a non-mapping document", () => {
  assert.throws(() => validateSpec([1, 2, 3]), SpecError);
  assert.throws(() => validateSpec("just a string"), SpecError);
});

test("accepts the example embedded in agent-spec.v0.yaml", () => {
  const schema = parse(readFileSync(repoSchema("agent-spec.v0.yaml"), "utf8")) as Record<
    string,
    unknown
  >;
  const example = schema["example"];
  assert.equal(typeof example, "string", "schema must carry a usable example");
  const spec = validateSpec(parse(example as string));
  assert.equal(spec.name, "Support Copilot v2");
});

test("enum values are read from the schema, not hardcoded", () => {
  const schema = parse(readFileSync(repoSchema("agent-spec.v0.yaml"), "utf8")) as Record<
    string,
    unknown
  >;
  const root = schema["$schema"] as Record<string, { values?: string[] }>;
  for (const surface of root["surface"]!.values!) {
    const spec = validateSpec({
      name: "x",
      version: "1",
      surface,
      autonomy: "autonomous",
      memory: {
        persistent: true,
        scopes: ["a"],
        retention: "P1D",
        user_visible: true,
        user_editable: true,
      },
    });
    assert.equal(spec.surface, surface);
  }
});

test("ISO-8601 durations are validated", () => {
  const base = {
    name: "x",
    version: "1",
    surface: "chat",
    autonomy: "autonomous",
  };
  const withRetention = (retention: string) => ({
    ...base,
    memory: {
      persistent: true,
      scopes: ["a"],
      retention,
      user_visible: true,
      user_editable: true,
    },
  });
  for (const good of ["P90D", "P1Y", "P1Y6M", "PT12H", "P1DT6H"]) {
    assert.doesNotThrow(() => validateSpec(withRetention(good)), `${good} should parse`);
  }
  for (const bad of ["90 days", "P", "", "1D", "PT"]) {
    assert.throws(() => validateSpec(withRetention(bad)), SpecError, `${bad} should fail`);
  }
});


test("a v1 document is detected and scored, not rejected", () => {
  const v1 = {
    spec_version: "1.0",
    id: "collections-agent",
    name: "Collections Agent",
    purpose: "Chase overdue invoices before they age past 90 days.",
    owners: {
      business: { name: "A. Novak", role: "Head of Credit" },
      technical: { name: "B. Reyes", role: "Staff Engineer" },
    },
    trigger: { kind: "schedule" },
    systems: { data_sources: ["ledger"], connected: [{ name: "erp", auth: "service_account" }] },
    capability: { can_read: ["invoices"], can_change: ["invoice_note"] },
    mandate: [
      { action: "invoice_note", authority: "autonomous", enforced_by: "scoped API token" },
    ],
    human_control: {
      observe: { available: true },
      interrupt: { available: true },
      approve: { available: false },
      override: { available: true },
      disable: { available: true },
    },
    exceptions: [{ condition: "records_conflict", response: "ask_human" }],
    shutdown: { procedure: "Revoke the service account and drain the queue.", tested: true },
  };
  const evidence = evidenceFrom(v1);
  assert.equal(evidence.specVersion, "v1.0");
  assert.equal(evidence.name, "Collections Agent");
  assert.equal(evidence.mandate?.length, 1);
  assert.equal(evidence.mandate?.[0]?.enforcementIsMechanism, true);
  // v1 declares no memory, and the absence must not read as "no memory".
  assert.equal(evidence.memory, undefined);
});

test("a v1 document that breaks the schema reports the real field", () => {
  assert.throws(
    () => evidenceFrom({ spec_version: "1.0", mandate: [] }),
    (error: unknown) => {
      assert.ok(error instanceof SpecError);
      const joined = error.problems.join("\n");
      assert.match(joined, /`shutdown` is required/);
      assert.match(joined, /`mandate` must NOT have fewer than 1 items/);
      return true;
    },
  );
});

test("v1 rejects the autonomy label the canon forbids", () => {
  assert.throws(
    () =>
      evidenceFrom({
        spec_version: "1.0",
        mandate: [{ action: "send", authority: "semi_autonomous", enforced_by: "queue" }],
      }),
    (error: unknown) => {
      assert.ok(error instanceof SpecError);
      assert.match(
        error.problems.join("\n"),
        /`mandate\.0\.authority` must be one of: autonomous, human_approval, human_only, prohibited/,
      );
      return true;
    },
  );
});

test("a v0 spec still loads as v0", () => {
  const evidence = loadEvidence(fixture("strong-spec.yaml"));
  assert.equal(evidence.specVersion, "v0.1.0");
  assert.equal(evidence.name, "Support Copilot v2");
  assert.equal(evidence.memory?.persistent, true);
});
