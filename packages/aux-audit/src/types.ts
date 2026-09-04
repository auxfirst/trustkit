/** Types for the aux-audit v0.1 contract. */

export type Surface = "chat" | "inline" | "ambient" | "async" | "multi-surface";

export type Autonomy =
  | "human-in-the-loop"
  | "human-on-the-loop"
  | "autonomous";

export type Severity = "low" | "medium" | "high" | "critical";

/** Heuristic scoring scale, per schemas/aux-heuristics.yaml. */
export type Level = 0 | 1 | 2 | 3;

export interface MemorySpec {
  persistent: boolean;
  scopes: string[];
  retention: string;
  user_visible: boolean;
  user_editable: boolean;
}

export interface AgentSpec {
  name: string;
  version: string;
  surface: Surface;
  autonomy: Autonomy;
  memory: MemorySpec;
  tools?: string[];
  flows?: string[];
  guarantees?: string[];
  evaluation?: {
    golden_transcripts?: string[];
    failure_transcripts?: string[];
  };
}

/** One heuristic's outcome. `applicable: false` drops it from the denominator. */
export interface HeuristicResult {
  id: string;
  name: string;
  level: Level;
  applicable: boolean;
  evidence: string;
  fix_pattern: string;
}

export interface Issue {
  id: string;
  type: string;
  severity: Severity;
  evidence: string;
}

export interface TrustStageResult {
  id: string;
  name: string;
  order: number;
  earned: boolean;
  /**
   * False when every heuristic backing this stage is inapplicable, so nothing
   * was measured. A stage that cannot be assessed is never reported as earned:
   * that would be a claim dressed as a finding.
   */
  assessable: boolean;
  /** Heuristic ids that must score >= 2 for this stage, per the gap taxonomy. */
  depends_on: string[];
  shortfall: string[];
}

export type Grade = "A" | "B" | "C" | "D" | "F";

export interface AuditReport {
  spec: { name: string; version: string };
  score: number;
  grade: Grade;
  trust_stage: string | null;
  /**
   * The stage the spec claimed, when it claimed one. Reported next to the
   * computed stage so the two can disagree in public.
   */
  trust_stage_claimed: string | null;
  /**
   * Always null, by design — not pending.
   *
   * A spec describes what a product *declares about itself*; capability is a
   * claim about what it actually does. No schema turns a declaration into an
   * observation, so the Evolution Curve is assessed by a human in
   * `agent-ux-teardowns` and is out of scope for this tool permanently.
   *
   * Decided in auxfirst/trustkit#5 (option B).
   */
  evolution_stage: null;
  evolution_stage_status: "human-assessed";
  heuristics: HeuristicResult[];
  trust_stages: TrustStageResult[];
  issues: Issue[];
  recommendations: string[];
  meta: {
    tool: string;
    /** Which agent-spec format was scored. Scores are not comparable across it. */
    spec_version: "v0.1.0" | "v1.0";
    tool_version: string;
    heuristics_version: string;
    trust_architecture_version: string;
    taxonomy_version: string;
    generated_at: string;
  };
}

export const SEVERITY_ORDER: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};
