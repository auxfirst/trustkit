/**
 * The rule set: one rule per AUX heuristic.
 *
 * Every rule scores what the spec *declares*, on the 0-3 scale from
 * schemas/aux-heuristics.yaml:
 *
 *   0 absent      — not even acknowledged
 *   1 attempted   — surface signal, no real mechanism
 *   2 present     — works in happy path, breaks under load
 *   3 robust      — works under novel, adversarial, or edge cases
 *
 * A spec is a claim, not a running product. aux-audit grades the claim: it can
 * prove a mechanism was never declared, never that a declared one works. Every
 * rule therefore returns the evidence it used, so a reader can disagree with a
 * number by pointing at a line.
 */
import type { AgentSpec, Level } from "./types.js";

export interface RuleOutcome {
  level: Level;
  applicable: boolean;
  evidence: string;
}

export interface Rule {
  id: string;
  evaluate(spec: AgentSpec): RuleOutcome;
}

const clamp = (n: number): Level => Math.max(0, Math.min(3, n)) as Level;

/** First guarantee matching the pattern, for use as quotable evidence. */
function guarantee(spec: AgentSpec, pattern: RegExp): string | undefined {
  return (spec.guarantees ?? []).find((g) => pattern.test(g));
}

function flowMatching(spec: AgentSpec, pattern: RegExp): string | undefined {
  return (spec.flows ?? []).find((f) => pattern.test(f));
}

const golden = (spec: AgentSpec) =>
  (spec.evaluation?.golden_transcripts ?? []).length > 0;
const failures = (spec: AgentSpec) =>
  (spec.evaluation?.failure_transcripts ?? []).length > 0;

function join(parts: string[]): string {
  return parts.filter(Boolean).join("; ");
}

export const RULES: Rule[] = [
  {
    id: "aux.H01",
    evaluate(spec) {
      const base =
        spec.autonomy === "human-in-the-loop"
          ? 2
          : spec.autonomy === "human-on-the-loop"
            ? 1
            : 0;
      const asks = guarantee(
        spec,
        /\b(ask|confirm|preview|propose|approval|before (send|act|writ|delet|purchas))/i,
      );
      const flows = (spec.flows ?? []).length > 0;
      const level = clamp(base + (asks ? 1 : 0) + (flows ? 1 : 0));
      return {
        level,
        applicable: true,
        evidence: join([
          `autonomy is \`${spec.autonomy}\``,
          asks ? `guarantee declares a checkpoint: "${asks}"` : "no guarantee declares a pre-action checkpoint",
          flows ? `${spec.flows?.length} flow(s) documented` : "no flows documented",
        ]),
      };
    },
  },
  {
    id: "aux.H02",
    evaluate(spec) {
      const tools = (spec.tools ?? []).length > 0;
      const flows = (spec.flows ?? []).length > 0;
      const level = clamp(
        (tools ? 1 : 0) + (flows ? 1 : 0) + (golden(spec) ? 1 : 0),
      );
      return {
        level,
        applicable: true,
        evidence: join([
          tools ? `${spec.tools?.length} tool(s) named — calls can be attributed` : "no tools named, so tool calls cannot be shown",
          flows ? "flows documented" : "no flows documented",
          golden(spec) ? "golden transcripts available as an evidence trail" : "no golden transcripts",
        ]),
      };
    },
  },
  {
    id: "aux.H03",
    evaluate(spec) {
      const base = spec.autonomy === "autonomous" ? 0 : 2;
      const undo = guarantee(
        spec,
        /\b(undo|revert|cancel|stop|interrupt|rollback|pause)\b/i,
      );
      const editable = spec.memory.user_editable;
      const level = clamp(base + (undo ? 1 : 0) + (editable ? 1 : 0));
      return {
        level,
        applicable: true,
        evidence: join([
          spec.autonomy === "autonomous"
            ? "autonomous agent — no inherent interruption point"
            : `autonomy \`${spec.autonomy}\` provides a review point`,
          undo ? `guarantee declares mid-flight control: "${undo}"` : "no undo/cancel/interrupt guarantee",
          editable ? "memory is user-editable" : "memory is not user-editable",
        ]),
      };
    },
  },
  {
    id: "aux.H04",
    evaluate(spec) {
      const ladder = guarantee(
        spec,
        /\b(tenure|earn|gradual|progressive|trust level|new user|first[- ]time|unlock|graduat)/i,
      );
      const onboarding = flowMatching(spec, /onboard|first[-_ ]?run|new[-_ ]?user/i);
      const level = clamp((ladder ? 2 : 0) + (onboarding ? 1 : 0));
      return {
        level,
        applicable: true,
        evidence: join([
          ladder
            ? `guarantee declares autonomy that changes over time: "${ladder}"`
            : "no guarantee ties granted autonomy to tenure, stakes, or outcomes",
          onboarding
            ? `a new-user flow is declared (${onboarding})`
            : "no distinct new-user flow — new and expert users appear to get the same product",
        ]),
      };
    },
  },
  {
    id: "aux.H05",
    evaluate(spec) {
      const count = (spec.guarantees ?? []).length;
      const base = count === 0 ? 0 : count === 1 ? 1 : 2;
      const explicit = guarantee(spec, /\bwill (never|not|always)\b/i);
      const level = clamp(base + (explicit ? 1 : 0));
      return {
        level,
        applicable: true,
        evidence: join([
          count === 0
            ? "no guarantees declared — the user cannot predict when confirmation is required"
            : `${count} guarantee(s) declared`,
          explicit
            ? `at least one states an absolute boundary: "${explicit}"`
            : "no guarantee uses absolute boundary language (will always / will never)",
        ]),
      };
    },
  },
  {
    id: "aux.H06",
    evaluate(spec) {
      const confidence = guarantee(
        spec,
        /\b(confidence|uncertain|unsure|verify|cite|citation|source|evidence|caveat|flag when|don't know|do not know)/i,
      );
      const level = clamp((confidence ? 2 : 0) + (failures(spec) ? 1 : 0));
      return {
        level,
        applicable: true,
        evidence: join([
          confidence
            ? `guarantee addresses confidence or sourcing: "${confidence}"`
            : "no guarantee addresses how confidence or uncertainty is communicated",
          failures(spec)
            ? "failure transcripts exist — uncertainty behaviour is exercised"
            : "no failure transcripts, so uncertainty behaviour is untested",
        ]),
      };
    },
  },
  {
    id: "aux.H07",
    evaluate(spec) {
      const assertive = guarantee(
        spec,
        /\b(escalat|hand off|handoff|hand-off|human review|push back|pushback|refuse|decline|second opinion)/i,
      );
      const level = clamp((assertive ? 2 : 0) + (failures(spec) ? 1 : 0));
      return {
        level,
        applicable: true,
        evidence: join([
          assertive
            ? `guarantee declares escalation or pushback: "${assertive}"`
            : "no guarantee declares when the agent escalates, refuses, or pushes back",
          failures(spec)
            ? "failure transcripts exercise the escalation path"
            : "no failure transcripts covering escalation",
        ]),
      };
    },
  },
  {
    id: "aux.H08",
    evaluate(spec) {
      if (!spec.memory.persistent) {
        return {
          level: 0,
          applicable: true,
          evidence:
            "memory.persistent is false — the agent starts every session as a stranger",
        };
      }
      const scopes = spec.memory.scopes.length;
      const level = clamp(2 + (scopes >= 2 ? 1 : 0));
      return {
        level,
        applicable: true,
        evidence: join([
          "memory is persistent",
          scopes >= 2
            ? `${scopes} memory scopes declared`
            : `only ${scopes} memory scope declared — context is coarse`,
        ]),
      };
    },
  },
  {
    id: "aux.H09",
    evaluate(spec) {
      const multiAgentTool = (spec.tools ?? []).find((t) =>
        /agent|delegate|sub[-_]?agent|handoff|hand_off|swarm|crew/i.test(t),
      );
      const multiAgentGuarantee = guarantee(spec, /\bagents?\b/i);
      const applicable =
        spec.surface === "multi-surface" ||
        multiAgentTool !== undefined ||
        multiAgentGuarantee !== undefined;

      if (!applicable) {
        return {
          level: 3,
          applicable: false,
          evidence:
            "not applicable — the spec describes a single agent (no delegating tools, no multi-agent guarantees, single surface)",
        };
      }
      const attribution = guarantee(
        spec,
        /\b(attribut|which agent|responsib|named agent|on behalf)/i,
      );
      const handoffFlow = flowMatching(spec, /handoff|hand[-_]off|delegat|escalat/i);
      const level = clamp((attribution ? 2 : 0) + (handoffFlow ? 1 : 0));
      return {
        level,
        applicable: true,
        evidence: join([
          `multi-agent signals present (${
            spec.surface === "multi-surface"
              ? "multi-surface"
              : (multiAgentTool ?? "agent guarantee")
          })`,
          attribution
            ? `guarantee addresses attribution: "${attribution}"`
            : "no guarantee tells the user which agent did what",
          handoffFlow ? `handoff flow documented (${handoffFlow})` : "no handoff flow documented",
        ]),
      };
    },
  },
  {
    id: "aux.H10",
    evaluate(spec) {
      const contract = guarantee(
        spec,
        /\b(deterministic|same (input|output)|consistent|reproducib|pinned|model version|regression)/i,
      );
      const level = clamp(
        (golden(spec) ? 2 : 0) + (failures(spec) ? 1 : 0) + (contract ? 1 : 0),
      );
      return {
        level,
        applicable: true,
        evidence: join([
          golden(spec)
            ? "golden transcripts pin expected behaviour"
            : "no golden transcripts — nothing detects silent drift between model versions",
          failures(spec) ? "failure transcripts present" : "no failure transcripts",
          contract
            ? `guarantee declares a behavioural contract: "${contract}"`
            : "no guarantee about behavioural consistency over time",
        ]),
      };
    },
  },
];
