/**
 * The normalised model both spec versions map into.
 *
 * Rules read this, never a raw spec. Two reasons: one rule set instead of two,
 * and the difference between what v0 and v1 can express becomes a visible,
 * testable mapping rather than branching scattered through the rules.
 *
 * Where a version cannot express something at all, the field is `undefined`
 * and the rule reports the heuristic as not applicable. It never guesses, and
 * it never scores absence of a *field* as absence of a *mechanism*.
 */
import type { AgentSpec } from "./types.js";
import type { AgentSpecV1, Authority, Control, ExceptionRow } from "./spec-v1.js";

export interface MemoryEvidence {
  persistent: boolean;
  scopeCount: number;
  userVisible: boolean;
  userEditable: boolean;
}

export interface MandateEvidence {
  action: string;
  authority: Authority;
  enforcedBy: string;
  /** A prompt is a request, not a boundary — trust-architecture.yaml. */
  enforcementIsMechanism: boolean;
}

export interface Evidence {
  /** Which spec format this came from, not the agent's own release version. */
  specVersion: "v0.1.0" | "v1.0";
  name: string;
  /** The agent's own version, as the spec declares it. */
  agentVersion: string;

  /** Per-action authority. v0 cannot express this; it has one label instead. */
  mandate?: MandateEvidence[];
  /** v0's single label, kept only so its rules can say what it was. */
  autonomyLabel?: string;
  /** Capabilities the credentials grant but no mandate row governs. */
  ungovernedWrites?: string[];

  /** Five forms of control, v1 only. */
  control?: Record<"observe" | "interrupt" | "approve" | "override" | "disable", Control>;
  supervision?: Partial<Record<string, boolean>>;
  exceptions?: ExceptionRow[];
  escalationDefault?: boolean;
  shutdownTested?: boolean;
  modelPinned?: boolean;

  /** v1 has no memory field at all. `undefined` means "cannot be expressed". */
  memory?: MemoryEvidence;

  /** Promises in prose. v0 only — v1 replaced them with enforced mandate rows. */
  guarantees: string[];
  tools: string[];
  flows: string[];
  goldenTranscripts: boolean;
  failureTranscripts: boolean;
  multiAgentSignal?: string;

  /** True once the spec carries evidence of testing, which gates level 3. */
  evidenced: boolean;
}

/**
 * "System prompt" is the canonical non-answer: trust-architecture.yaml states
 * that a prompt is a request and a tool boundary is a control, and the v1
 * schema repeats it on the field itself.
 */
const NOT_A_MECHANISM =
  /\b(prompt|instructions?|guidelines?|policy document|training|conventions?|documentation|we ask|asked to|told to|expected to)\b/i;

function isMechanism(enforcedBy: string): boolean {
  return enforcedBy.trim().length >= 3 && !NOT_A_MECHANISM.test(enforcedBy.trim());
}

const MULTI_AGENT = /agent|delegate|sub[-_]?agent|handoff|hand_off|swarm|crew/i;

export function fromV0(spec: AgentSpec): Evidence {
  const golden = (spec.evaluation?.golden_transcripts ?? []).length > 0;
  const failure = (spec.evaluation?.failure_transcripts ?? []).length > 0;
  return {
    specVersion: "v0.1.0",
    name: spec.name,
    agentVersion: spec.version,
    autonomyLabel: spec.autonomy,
    memory: {
      persistent: spec.memory.persistent,
      scopeCount: spec.memory.scopes.length,
      userVisible: spec.memory.user_visible,
      userEditable: spec.memory.user_editable,
    },
    guarantees: spec.guarantees ?? [],
    tools: spec.tools ?? [],
    flows: spec.flows ?? [],
    goldenTranscripts: golden,
    failureTranscripts: failure,
    multiAgentSignal:
      spec.surface === "multi-surface"
        ? "multi-surface"
        : (spec.tools ?? []).find((t) => MULTI_AGENT.test(t)) ??
          (spec.guarantees ?? []).find((g) => /\bagents?\b/i.test(g)),
    evidenced: golden || failure,
  };
}

export function fromV1(spec: AgentSpecV1): Evidence {
  const mandate: MandateEvidence[] = spec.mandate.map((row) => ({
    action: row.action,
    authority: row.authority,
    enforcedBy: row.enforced_by,
    enforcementIsMechanism: isMechanism(row.enforced_by),
  }));

  // The gap between what the credentials permit and what the mandate governs
  // is the attack surface — the v1 schema says so in its own header.
  const governed = mandate.map((row) => row.action.toLowerCase());
  const ungovernedWrites = spec.capability.can_change.filter(
    (write) => !governed.some((action) => action.includes(write.toLowerCase()) || write.toLowerCase().includes(action)),
  );

  const multiAgent =
    spec.systems.connected.map((c) => c.name).find((n) => MULTI_AGENT.test(n)) ??
    mandate.map((m) => m.action).find((a) => MULTI_AGENT.test(a));

  return {
    specVersion: "v1.0",
    name: spec.name,
    agentVersion: spec.version ?? "unversioned",
    mandate,
    ungovernedWrites,
    control: spec.human_control,
    supervision: spec.supervision ?? {},
    exceptions: spec.exceptions,
    escalationDefault: spec.escalation_default !== undefined,
    shutdownTested: spec.shutdown.tested,
    modelPinned: spec.model?.version_pinned ?? false,
    // v1 declares no memory. Not false — absent. See trustkit#10.
    memory: undefined,
    guarantees: [],
    tools: spec.capability.can_change,
    flows: [],
    goldenTranscripts: false,
    failureTranscripts: false,
    multiAgentSignal: multiAgent,
    // A tested shutdown and a pinned model are v1's evidence of exercise, in
    // the way transcripts are v0's.
    evidenced: spec.shutdown.tested === true,
  };
}
