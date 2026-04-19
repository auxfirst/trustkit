# trust-gap-classifier

> A taxonomy and detector for how agent trust breaks. Shared language for failure modes.

When a copilot "feels off," a user loses trust. That loss has a shape. This repo names the shapes.

## The taxonomy

Four families, fifteen named failure modes. Each one has a definition, a diagnostic question, a minimal reproducible scenario, and a recommended intervention.

| Family | Examples |
|---|---|
| **Functional** | `hallucination`, `silent_degradation`, `inconsistent_output` |
| **Contextual** | `memory_amnesia`, `preference_ignored`, `context_leak` |
| **Judgment** | `overreach_in_ambiguity`, `confident_nonsense`, `refusal_when_escalation_needed` |
| **Advocacy** | `metric_over_user`, `incentive_misalignment`, `loyalty_leak` |

See [`trust-gap-taxonomy.yaml`](../../schemas/trust-gap-taxonomy.yaml) for the canonical list.

## Detector

A lightweight scanner that takes **agent interaction logs** (transcripts, tool calls, memory reads/writes) and flags matches against the taxonomy.

```bash
npx trust-gap-classifier scan ./logs/session-*.jsonl
```

```yaml
# → output
session: "2026-04-18T14:22Z-user-483"
gaps:
  - type: memory_amnesia
    family: contextual
    severity: high
    evidence:
      turn: 12
      detail: "user stated 'my team is on GMT' in turn 3; ignored in turn 12"
  - type: overreach_in_ambiguity
    family: judgment
    severity: medium
    evidence:
      turn: 14
      detail: "agent scheduled without confirming ambiguous 'next week'"
```

## Why this matters

> Categories spread when people share a vocabulary. "Memory amnesia" is stickier than "the copilot forgot."

Every detected gap maps back to:
- An **AUX heuristic** (what broke)
- A **Trust Architecture stage** (what was violated)
- An **intervention pattern** (how to fix)

## Use cases

- **QA in CI.** Replay golden-path transcripts, fail the build on any `severity: high` gap.
- **Postmortems.** Classify the incident with a shared label.
- **Research.** Quantify how often a given family appears across products.

## Schema

[`trust-gap-taxonomy.yaml`](../../schemas/trust-gap-taxonomy.yaml) is the single source of truth. Each entry:

```yaml
- id: tg.contextual.memory_amnesia
  family: contextual
  name: Memory Amnesia
  question: "Does the agent treat the user as a stranger on every interaction?"
  heuristic_ref: aux.H04
  trust_stage: contextual
  severity_default: high
  fix_pattern: "memory-in-motion"
```

## Related

- **[aux-frameworks](../aux-frameworks)** — the frameworks these gaps are mapped to.
- **[aux-audit](../aux-audit)** — static scoring; this repo is dynamic (log-based).

## License

CC BY 4.0 for the taxonomy. MIT for the detector code.
