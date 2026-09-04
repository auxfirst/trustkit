import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { loadSpec, validateSpec, SpecError, SpecVersionError } from "../src/spec.js";
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


test("a v1 document is named as a version mismatch, not a pile of field errors", () => {
  const v1 = {
    spec_version: "1.0",
    id: "collections-agent",
    name: "Collections Agent",
    mandate: [{ action: "send reminder", authority: "human_approval", enforced_by: "queue" }],
  };
  assert.throws(
    () => validateSpec(v1),
    (error: unknown) => {
      assert.ok(error instanceof SpecVersionError, "should be a version error");
      assert.match(error.message, /agent-spec v1\.0 document/);
      assert.match(error.message, /MIGRATION\.md/);
      // The old behaviour demanded the very field v1 removes on purpose.
      assert.doesNotMatch(error.message, /`autonomy` is required/);
      assert.doesNotMatch(error.message, /is not valid/);
      return true;
    },
  );
});

test("either v1 marker alone is enough to detect it", () => {
  for (const marker of [{ mandate: [] }, { spec_version: "1.0" }]) {
    assert.throws(() => validateSpec({ name: "x", ...marker }), SpecVersionError);
  }
});

test("a v0 spec is still graded, not mistaken for v1", () => {
  const spec = loadSpec(fixture("strong-spec.yaml"));
  assert.equal(spec.name, "Support Copilot v2");
});
