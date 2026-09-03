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
   * Null until the Evolution Curve is published as a schema. The capability
   * axis is referenced by the AUX docs but has no canonical stage list, and
   * aux-audit will not invent IDs in the `aux.` namespace.
   */
  evolution_stage: null;
  evolution_stage_status: "schema-undefined";
  heuristics: HeuristicResult[];
  trust_stages: TrustStageResult[];
  issues: Issue[];
  recommendations: string[];
  meta: {
    tool: string;
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
