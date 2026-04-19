# Architecture

auxfirst runs a two-sided system:

- An **internal execution layer** (AUX Studio) — where frameworks, audits, policies, and dashboards live and get used.
- A **public standard layer** (GitHub) — where the same taxonomy is visible, inspectable, and forkable.

Both sides point at **one shared taxonomy**. That's what makes the category real instead of an opinion.

```
  INTERNAL (AUX Studio)                   PUBLIC (github.com/auxfirst)
  ─────────────────────────────           ──────────────────────────────
  Framework engine              ─── → ── aux-frameworks (schemas)
  Audit engine                  ─── → ── aux-audit (CLI)
  Trust taxonomy                ─── → ── trust-gap-classifier
  Memory policy generator       ─── → ── agent-memory-policy
  Teardown templates            ─── → ── agent-ux-teardowns
  TrustOps dashboards           ─── → ── aux-metrics (schemas + samples)
                │                                 │
                └────── shared taxonomy ──────────┘
                           (IDs, stages, gaps)
```

## Why two sides

- **Internal** is where value is delivered to clients: audits, blueprints, TrustOps.
- **Public** is where credibility and language are won: standards, CLIs, teardowns.

The public layer makes the internal layer legible. The internal layer keeps the public layer honest — nothing ships to GitHub that hasn't survived real use inside.

## The shared taxonomy

Three canonical YAML files anchor everything:

- [`schemas/aux-heuristics.yaml`](schemas/aux-heuristics.yaml) — ten heuristics, IDs `aux.H01–H10`.
- [`schemas/trust-architecture.yaml`](schemas/trust-architecture.yaml) — four stages, IDs `aux.T01–T04`.
- [`schemas/trust-gap-taxonomy.yaml`](schemas/trust-gap-taxonomy.yaml) — named failure modes, each mapping to a heuristic + trust stage + fix pattern.

Every other artifact — audit rules, teardown scores, memory policies, Trust Contracts — references these IDs. Rename one, everything downstream updates.

## The core workflow

```
  [agent-spec.yaml]                            [scorecard + fix plan]
       │                                               ▲
       ▼                                               │
  ┌────────────────────────────────────────────────────────┐
  │  aux-audit                                             │
  │   1. validate spec against agent-spec.schema.yaml      │
  │   2. run heuristic rules (aux-heuristics.yaml)         │
  │   3. place on trust + evolution axes                   │
  │   4. classify gaps (trust-gap-taxonomy.yaml)           │
  │   5. emit Markdown + JSON + SARIF                      │
  └────────────────────────────────────────────────────────┘
```

Same spec format; the audit is deterministic and reproducible. Re-run after a change → diffable scorecard.

## Cross-channel flywheel

GitHub is not a standalone channel. It compounds with the others:

| Channel | Role |
|---|---|
| LinkedIn | **Insight** — name a failure mode, link to the teardown. |
| GitHub | **Proof** — the scorecard, the transcript, the CLI. |
| Newsletter | **Synthesis** — long-form: what the category learns. |

The loop: LinkedIn post → GitHub repo → newsletter expansion → LinkedIn follow-up. Each cycle adds a named pattern or gap to the public taxonomy.

## What stays internal, what goes public

| Stays internal | Goes public |
|---|---|
| Client-specific audits | The audit CLI + schemas |
| TrustOps dashboards for a customer | TrustOps schema + sample datasets |
| Full teardown database | Curated teardowns |
| Commercial playbooks | The methodology (`aux-frameworks`) |
| Client data, transcripts | Reproducible example transcripts |

The rule: **open-source the standard, keep the operation.**

## Non-goals

- A SaaS. AUX Studio is internal tooling; none of the public repos are a product surface.
- A framework zoo. Five repos, one taxonomy. Grow by deepening, not sprawling.
- A tutorial hub. Every repo assumes a practitioner audience.
