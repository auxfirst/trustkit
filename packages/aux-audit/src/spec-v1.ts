/**
 * agent-spec v1.0 — real JSON Schema draft 2020-12, validated with ajv.
 *
 * v1 replaces v0's single `autonomy` label with a per-action mandate, each
 * non-autonomous row naming the mechanism that enforces it. That is the whole
 * reason it exists, and it is what makes the audit able to ask a better
 * question than "what did you call your autonomy level".
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ajvModule, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";

/**
 * ajv ships CommonJS. Under NodeNext the constructor arrives on `.default`,
 * but the type is the namespace, so both sides need coaxing.
 */
type AjvCtor = new (options?: Record<string, unknown>) => {
  compile(schema: object): ValidateFunction;
  addFormat(name: string, format: RegExp): unknown;
};
const Ajv2020 = ((ajvModule as unknown as { default?: unknown }).default ??
  ajvModule) as unknown as AjvCtor;
import { parse } from "yaml";
import { schemaDir } from "./canon.js";

export type Authority = "autonomous" | "human_approval" | "human_only" | "prohibited";

export interface MandateRow {
  action: string;
  authority: Authority;
  enforced_by: string;
  approver?: string;
}

export interface Control {
  available: boolean;
  mechanism?: string;
  audience?: "affected_user" | "operator" | "admin_only" | "none";
}

export interface Escalation {
  recipient: string;
  deadline_minutes: number;
  on_timeout: "stop" | "fallback" | "refuse" | "page_secondary";
  context_preserved?: boolean;
}

export interface ExceptionRow {
  condition: string;
  detail?: string;
  response: "retry" | "stop" | "ask_human" | "route" | "fallback" | "log" | "refuse";
  escalation?: Escalation;
}

export interface MemoryScope {
  name: string;
  purpose?: string;
  retention: string;
  user_visible: boolean;
  user_editable: boolean;
  lawful_basis?: string;
}

export interface MemorySpecV1 {
  persistent: boolean;
  scopes?: MemoryScope[];
  forget?: { available: boolean; mechanism?: string };
}

export interface AgentSpecV1 {
  spec_version: string;
  id: string;
  name: string;
  version?: string;
  surface?: string;
  purpose: string;
  owners: { business: unknown; technical: unknown };
  trigger: { kind: string; detail?: string };
  users?: unknown[];
  systems: { data_sources: string[]; connected: { name: string; auth: unknown }[] };
  capability: { can_read: string[]; can_change: string[] };
  memory: MemorySpecV1;
  mandate: MandateRow[];
  human_control: Record<"observe" | "interrupt" | "approve" | "override" | "disable", Control>;
  exceptions: ExceptionRow[];
  escalation_default?: Escalation;
  supervision?: Partial<
    Record<
      | "agent_identity_disclosed"
      | "action_receipt"
      | "reversal"
      | "consequence_scaled_approval"
      | "escalation_handoff"
      | "provenance_at_decision",
      boolean
    >
  >;
  shutdown: { procedure: string; tested: boolean; last_tested?: string; revokes_access?: boolean };
  model?: { provider?: string; name?: string; version_pinned?: boolean };
  trust_stage?: string;
  status?: string;
}

let compiled: ValidateFunction | undefined;

function validator(): ValidateFunction {
  if (compiled) return compiled;
  const schema = parse(
    readFileSync(join(schemaDir(), "agent-spec.schema.yaml"), "utf8"),
  ) as object;
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  // `shutdown.last_tested` is `format: date`. Validate it rather than let ajv
  // log that it is ignoring a format on every run.
  ajv.addFormat("date", /^\d{4}-\d{2}-\d{2}$/);
  const fn = ajv.compile(schema);
  compiled = fn;
  return fn;
}

/** ajv's paths are terse; make them read like the field a person would fix. */
function describe(error: ErrorObject): string {
  const where = error.instancePath.replace(/^\//, "").replace(/\//g, ".") || "(root)";
  if (error.keyword === "required") {
    const missing = (error.params as { missingProperty: string }).missingProperty;
    return where === "(root)"
      ? `\`${missing}\` is required`
      : `\`${where}.${missing}\` is required`;
  }
  if (error.keyword === "enum") {
    const allowed = (error.params as { allowedValues: unknown[] }).allowedValues;
    return `\`${where}\` must be one of: ${allowed.join(", ")}`;
  }
  if (error.keyword === "additionalProperties") {
    const extra = (error.params as { additionalProperty: string }).additionalProperty;
    return `\`${where}\` has an unknown field: ${extra}`;
  }
  return `\`${where}\` ${error.message ?? "is invalid"}`;
}

export function validateV1(input: unknown): { spec?: AgentSpecV1; problems: string[] } {
  const validate = validator();
  if (validate(input)) return { spec: input as AgentSpecV1, problems: [] };
  const problems = (validate.errors ?? []).map(describe);
  return { problems: [...new Set(problems)] };
}
