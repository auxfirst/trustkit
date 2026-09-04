/**
 * The rule set: one rule per AUX heuristic, scoring the normalised evidence.
 *
 * Every rule scores what a spec *declares*, on the 0-3 scale from
 * schemas/aux-heuristics.yaml:
 *
 *   0 absent      — not even acknowledged
 *   1 attempted   — surface signal, no real mechanism
 *   2 present     — works in happy path, breaks under load
 *   3 robust      — works under novel, adversarial, or edge cases
 *
 * Two spec versions reach these rules through one evidence model. v0 declares
 * a single autonomy label and prose guarantees; v1 declares per-action
 * authority with an enforcing mechanism. Where a rule can ask the better
 * question, it does — and its evidence string names which version answered.
 */
import type { Evidence } from "./evidence.js";
import type { Level } from "./types.js";

export interface RuleOutcome {
  level: Level;
  applicable: boolean;
  evidence: string;
}

export interface Rule {
  id: string;
  evaluate(e: Evidence): RuleOutcome;
}

const clamp = (n: number): Level => Math.max(0, Math.min(3, n)) as Level;
const join = (parts: (string | false | undefined)[]): string =>
  parts.filter(Boolean).join("; ");

const guarantee = (e: Evidence, pattern: RegExp): string | undefined =>
  e.guarantees.find((g) => pattern.test(g));
const flowMatching = (e: Evidence, pattern: RegExp): string | undefined =>
  e.flows.find((f) => pattern.test(f));

const isV1 = (e: Evidence): boolean => e.specVersion === "v1.0";

/** Mandate rows that need an enforcing mechanism: everything but `autonomous`. */
const gated = (e: Evidence) => (e.mandate ?? []).filter((r) => r.authority !== "autonomous");
const unenforced = (e: Evidence) => gated(e).filter((r) => !r.enforcementIsMechanism);

const control = (e: Evidence, which: "observe" | "interrupt" | "approve" | "override" | "disable") =>
  e.control?.[which];
const has = (e: Evidence, which: Parameters<typeof control>[1]): boolean =>
  control(e, which)?.available === true;
const supervises = (e: Evidence, key: string): boolean => e.supervision?.[key] === true;

export const RULES: Rule[] = [
  {
    id: "aux.H01",
    evaluate(e) {
      if (isV1(e)) {
        const checkpoints = (e.mandate ?? []).filter((r) => r.authority === "human_approval");
        const level = clamp(
          (checkpoints.length > 0 ? 2 : 0) +
            (supervises(e, "action_receipt") ? 1 : 0) +
            (supervises(e, "agent_identity_disclosed") ? 1 : 0),
        );
        return {
          level,
          applicable: true,
          evidence: join([
            checkpoints.length > 0
              ? `${checkpoints.length} of ${e.mandate?.length} action(s) require approval before execution`
              : "no action requires approval — every mandate row is autonomous or barred",
            supervises(e, "action_receipt")
              ? "each action leaves a receipt"
              : "no action receipt",
            supervises(e, "agent_identity_disclosed")
              ? "the agent discloses that it is an agent"
              : "agent identity is not disclosed",
          ]),
        };
      }
      const base =
        e.autonomyLabel === "human-in-the-loop" ? 2 : e.autonomyLabel === "human-on-the-loop" ? 1 : 0;
      const asks = guarantee(
        e,
        /\b(ask|confirm|preview|propose|approval|before (send|act|writ|delet|purchas))/i,
      );
      const flows = e.flows.length > 0;
      return {
        level: clamp(base + (asks ? 1 : 0) + (flows ? 1 : 0)),
        applicable: true,
        evidence: join([
          `autonomy is \`${e.autonomyLabel}\``,
          asks
            ? `guarantee declares a checkpoint: "${asks}"`
            : "no guarantee declares a pre-action checkpoint",
          flows ? `${e.flows.length} flow(s) documented` : "no flows documented",
        ]),
      };
    },
  },
  {
    id: "aux.H02",
    evaluate(e) {
      if (isV1(e)) {
        const observe = control(e, "observe");
        const memoryHidden = e.memory !== undefined && e.memory.persistent && !e.memory.userVisible;
        const level = clamp(
          (has(e, "observe") ? 1 : 0) +
            (supervises(e, "provenance_at_decision") ? 1 : 0) +
            (observe?.audience === "affected_user" ? 1 : 0) -
            (memoryHidden ? 1 : 0),
        );
        return {
          level,
          applicable: true,
          evidence: join([
            has(e, "observe")
              ? `runs are observable${observe?.mechanism ? ` via ${observe.mechanism}` : ""}`
              : "runs are not observable",
            supervises(e, "provenance_at_decision")
              ? "provenance is shown at the decision"
              : "no provenance at the point of decision",
            observe?.audience === "affected_user"
              ? "visible to the affected user, not only operators"
              : `observability reaches ${observe?.audience ?? "no one"}`,
            memoryHidden && "at least one retained scope is hidden from the user",
          ]),
        };
      }
      const tools = e.tools.length > 0;
      const flows = e.flows.length > 0;
      return {
        level: clamp((tools ? 1 : 0) + (flows ? 1 : 0) + (e.goldenTranscripts ? 1 : 0)),
        applicable: true,
        evidence: join([
          tools
            ? `${e.tools.length} tool(s) named — calls can be attributed`
            : "no tools named, so tool calls cannot be shown",
          flows ? "flows documented" : "no flows documented",
          e.goldenTranscripts
            ? "golden transcripts available as an evidence trail"
            : "no golden transcripts",
        ]),
      };
    },
  },
  {
    id: "aux.H03",
    evaluate(e) {
      if (isV1(e)) {
        const memoryStuck = e.memory !== undefined && e.memory.persistent && !e.memory.userEditable;
        const level = clamp(
          (has(e, "interrupt") ? 1 : 0) +
            (has(e, "override") ? 1 : 0) +
            (supervises(e, "reversal") ? 1 : 0) -
            (memoryStuck ? 1 : 0),
        );
        return {
          level,
          applicable: true,
          evidence: join([
            has(e, "interrupt") ? "a run can be interrupted mid-flight" : "no interrupt control",
            has(e, "override") ? "a decision can be overridden" : "no override control",
            supervises(e, "reversal") ? "actions are reversible" : "actions are not reversible",
            memoryStuck && "a retained scope cannot be corrected by the user",
          ]),
        };
      }
      const base = e.autonomyLabel === "autonomous" ? 0 : 2;
      const undo = guarantee(e, /\b(undo|revert|cancel|stop|interrupt|rollback|pause)\b/i);
      const editable = e.memory?.userEditable === true;
      return {
        level: clamp(base + (undo ? 1 : 0) + (editable ? 1 : 0)),
        applicable: true,
        evidence: join([
          e.autonomyLabel === "autonomous"
            ? "autonomous agent — no inherent interruption point"
            : `autonomy \`${e.autonomyLabel}\` provides a review point`,
          undo
            ? `guarantee declares mid-flight control: "${undo}"`
            : "no undo/cancel/interrupt guarantee",
          editable ? "memory is user-editable" : "memory is not user-editable",
        ]),
      };
    },
  },
  {
    id: "aux.H04",
    evaluate(e) {
      if (isV1(e)) {
        const levels = new Set((e.mandate ?? []).map((r) => r.authority));
        const scaled = supervises(e, "consequence_scaled_approval");
        return {
          level: clamp((scaled ? 2 : 0) + (levels.size > 1 ? 1 : 0)),
          applicable: true,
          evidence: join([
            scaled
              ? "approval scales with consequence"
              : "approval does not scale with consequence — the same gate for every stake",
            levels.size > 1
              ? `authority varies across actions (${[...levels].join(", ")})`
              : `every action carries the same authority (${[...levels][0] ?? "none"})`,
          ]),
        };
      }
      const ladder = guarantee(
        e,
        /\b(tenure|earn|gradual|progressive|trust level|new user|first[- ]time|unlock|graduat)/i,
      );
      const onboarding = flowMatching(e, /onboard|first[-_ ]?run|new[-_ ]?user/i);
      return {
        level: clamp((ladder ? 2 : 0) + (onboarding ? 1 : 0)),
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
    evaluate(e) {
      if (isV1(e)) {
        const rows = e.mandate ?? [];
        const weak = unenforced(e);
        const ungoverned = e.ungovernedWrites ?? [];
        const level = clamp(
          (rows.length > 0 ? 1 : 0) +
            (gated(e).length > 0 && weak.length === 0 ? 1 : 0) +
            (ungoverned.length === 0 ? 1 : 0),
        );
        return {
          level,
          applicable: true,
          evidence: join([
            rows.length > 0
              ? `${rows.length} action(s) carry an explicit authority`
              : "no mandate rows — authority is undefined",
            weak.length === 0
              ? gated(e).length > 0
                ? "every gated action names an enforcing mechanism"
                : "no gated actions to enforce"
              : `${weak.length} gated action(s) enforced by something that is not a mechanism: ${weak
                  .map((r) => `"${r.enforcedBy}"`)
                  .join(", ")}`,
            ungoverned.length === 0
              ? "no write capability sits outside the mandate"
              : `${ungoverned.length} ${ungoverned.length === 1 ? "capability" : "capabilities"} the credentials grant but no mandate governs: ${ungoverned.join(", ")}`,
          ]),
        };
      }
      const count = e.guarantees.length;
      const base = count === 0 ? 0 : count === 1 ? 1 : 2;
      const explicit = guarantee(e, /\bwill (never|not|always)\b/i);
      return {
        level: clamp(base + (explicit ? 1 : 0)),
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
    evaluate(e) {
      if (isV1(e)) {
        const lowConfidence = (e.exceptions ?? []).find((x) => x.condition === "confidence_low");
        const acts = lowConfidence !== undefined &&
          ["ask_human", "route", "refuse", "stop"].includes(lowConfidence.response);
        return {
          level: clamp((lowConfidence ? 2 : 0) + (acts ? 1 : 0)),
          applicable: true,
          evidence: join([
            lowConfidence
              ? `low confidence is a designed exception, answered with \`${lowConfidence.response}\``
              : "low confidence is not among the declared exceptions",
            lowConfidence && !acts
              ? `\`${lowConfidence.response}\` does not surface the uncertainty to anyone`
              : acts && "the response hands the decision to a human rather than proceeding",
          ]),
        };
      }
      const confidence = guarantee(
        e,
        /\b(confidence|uncertain|unsure|verify|cite|citation|source|evidence|caveat|flag when|don't know|do not know)/i,
      );
      return {
        level: clamp((confidence ? 2 : 0) + (e.failureTranscripts ? 1 : 0)),
        applicable: true,
        evidence: join([
          confidence
            ? `guarantee addresses confidence or sourcing: "${confidence}"`
            : "no guarantee addresses how confidence or uncertainty is communicated",
          e.failureTranscripts
            ? "failure transcripts exist — uncertainty behaviour is exercised"
            : "no failure transcripts, so uncertainty behaviour is untested",
        ]),
      };
    },
  },
  {
    id: "aux.H07",
    evaluate(e) {
      if (isV1(e)) {
        const escalations = (e.exceptions ?? []).filter((x) => x.escalation !== undefined);
        const named = escalations.filter(
          (x) => x.escalation!.recipient.trim().length > 0 && x.escalation!.on_timeout,
        );
        const level = clamp(
          (named.length > 0 ? 2 : 0) +
            (e.escalationDefault || supervises(e, "escalation_handoff") ? 1 : 0),
        );
        return {
          level,
          applicable: true,
          evidence: join([
            named.length > 0
              ? `${named.length} exception(s) escalate to a named recipient with a timeout`
              : escalations.length > 0
                ? "escalations exist but none names both a recipient and what happens on timeout"
                : "no exception escalates — the agent absorbs every failure itself",
            e.escalationDefault
              ? "a default escalation catches anything unlisted"
              : "no default escalation for unlisted conditions",
          ]),
        };
      }
      const assertive = guarantee(
        e,
        /\b(escalat|hand off|handoff|hand-off|human review|push back|pushback|refuse|decline|second opinion)/i,
      );
      return {
        level: clamp((assertive ? 2 : 0) + (e.failureTranscripts ? 1 : 0)),
        applicable: true,
        evidence: join([
          assertive
            ? `guarantee declares escalation or pushback: "${assertive}"`
            : "no guarantee declares when the agent escalates, refuses, or pushes back",
          e.failureTranscripts
            ? "failure transcripts exercise the escalation path"
            : "no failure transcripts covering escalation",
        ]),
      };
    },
  },
  {
    id: "aux.H08",
    evaluate(e) {
      // v1 declares no memory at all — not "no memory", but no field for it.
      // Scoring absence of a field as absence of a mechanism would be a lie.
      if (e.memory === undefined) {
        return {
          level: 0,
          applicable: false,
          evidence:
            "not scoreable — agent-spec v1.0 has no memory field, so a spec cannot declare persistence, scoping, or retention (trustkit#10)",
        };
      }
      if (!e.memory.persistent) {
        return {
          level: 0,
          applicable: true,
          evidence: "memory.persistent is false — the agent starts every session as a stranger",
        };
      }
      const scopes = e.memory.scopeCount;
      if (isV1(e)) {
        // v1 declares retention and visibility per scope, so it can say more
        // than "memory exists": whether each category is bounded, and whether
        // the user can make it go away.
        const level = clamp(
          (scopes >= 1 ? 1 : 0) +
            (e.memory.everyScopeRetained ? 1 : 0) +
            (e.memory.forgettable ? 1 : 0),
        );
        return {
          level,
          applicable: true,
          evidence: join([
            scopes >= 1
              ? `memory is persistent across ${scopes} scope(s)`
              : "memory is persistent but no scope is declared — what is kept is unstated",
            e.memory.everyScopeRetained
              ? "every scope names a retention period"
              : "at least one scope is retained indefinitely, or does not say",
            e.memory.forgettable
              ? "the user can have it forgotten on request"
              : "no forget mechanism — retention is a promise about the calendar, not a control",
          ]),
        };
      }
      return {
        level: clamp(2 + (scopes >= 2 ? 1 : 0)),
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
    evaluate(e) {
      if (e.multiAgentSignal === undefined) {
        return {
          level: 3,
          applicable: false,
          evidence:
            "not applicable — the spec describes a single agent (no delegating tools, no multi-agent guarantees, single surface)",
        };
      }
      if (isV1(e)) {
        const disclosed = supervises(e, "agent_identity_disclosed");
        const handoff = (e.exceptions ?? []).some((x) => x.response === "route");
        return {
          level: clamp((disclosed ? 2 : 0) + (handoff ? 1 : 0)),
          applicable: true,
          evidence: join([
            `multi-agent signal present (${e.multiAgentSignal})`,
            disclosed
              ? "agent identity is disclosed, so actions can be attributed"
              : "identity is not disclosed — the user cannot tell which agent acted",
            handoff ? "a routing response documents the handoff" : "no routing exception documented",
          ]),
        };
      }
      const attribution = guarantee(e, /\b(attribut|which agent|responsib|named agent|on behalf)/i);
      const handoffFlow = flowMatching(e, /handoff|hand[-_]off|delegat|escalat/i);
      return {
        level: clamp((attribution ? 2 : 0) + (handoffFlow ? 1 : 0)),
        applicable: true,
        evidence: join([
          `multi-agent signals present (${e.multiAgentSignal})`,
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
    evaluate(e) {
      if (isV1(e)) {
        const level = clamp(
          (e.modelPinned ? 2 : 0) +
            (e.shutdownTested ? 1 : 0) +
            ((e.exceptions ?? []).length >= 3 ? 1 : 0),
        );
        return {
          level,
          applicable: true,
          evidence: join([
            e.modelPinned
              ? "the model version is pinned, so behaviour cannot change without a release"
              : "the model version is not pinned — behaviour can change without a release",
            e.shutdownTested
              ? "the shutdown procedure has been tested"
              : "the shutdown procedure is untested, so it is a claim rather than a control",
            (e.exceptions ?? []).length >= 3
              ? `${e.exceptions?.length} failure conditions are designed for`
              : "fewer than three failure conditions designed for",
          ]),
        };
      }
      const contract = guarantee(
        e,
        /\b(deterministic|same (input|output)|consistent|reproducib|pinned|model version|regression)/i,
      );
      return {
        level: clamp(
          (e.goldenTranscripts ? 2 : 0) + (e.failureTranscripts ? 1 : 0) + (contract ? 1 : 0),
        ),
        applicable: true,
        evidence: join([
          e.goldenTranscripts
            ? "golden transcripts pin expected behaviour"
            : "no golden transcripts — nothing detects silent drift between model versions",
          e.failureTranscripts ? "failure transcripts present" : "no failure transcripts",
          contract
            ? `guarantee declares a behavioural contract: "${contract}"`
            : "no guarantee about behavioural consistency over time",
        ]),
      };
    },
  },
];
