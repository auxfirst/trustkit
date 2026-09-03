# agentic-ux-patterns

> Named patterns for agentic UX — one pattern per folder. Definition, diagram, runnable snippet, anti-pattern. No exceptions.

This is a **Reference** repo. Every pattern here:
1. **Closes a named trust gap** in [`trust-gap-taxonomy.yaml`](../../schemas/trust-gap-taxonomy.yaml).
2. **Maps to a heuristic ID** in [`aux-heuristics.yaml`](../../schemas/aux-heuristics.yaml).
3. **Has an anti-pattern** so people know what it isn't.

## Patterns

Seven patterns close all **12 named gaps** in [`trust-gap-taxonomy.yaml`](../../schemas/trust-gap-taxonomy.yaml). Coverage is enforced in CI by [`check-coverage.py`](./check-coverage.py) — adding a gap without a pattern fails the build.

| Pattern | Closes | Heuristic | Trust stage |
|---|---|---|---|
| **[intent-handshake](./patterns/intent-handshake)** | `tg.judgment.overreach_in_ambiguity` | `aux.H01` | `aux.T03` |
| **[memory-in-motion](./patterns/memory-in-motion)** | `tg.contextual.memory_amnesia`<br>`tg.contextual.preference_ignored` | `aux.H08` | `aux.T02` |
| **[confidence-cues](./patterns/confidence-cues)** | `tg.functional.hallucination`<br>`tg.judgment.confident_nonsense` | `aux.H06` | `aux.T01`, `aux.T03` |
| **[behavioral-contract](./patterns/behavioral-contract)** | `tg.functional.silent_degradation`<br>`tg.functional.inconsistent_output` | `aux.H10` | `aux.T01` |
| **[memory-policy-scoping](./patterns/memory-policy-scoping)** | `tg.contextual.context_leak` | `aux.H08` | `aux.T02` |
| **[escalation-handoff](./patterns/escalation-handoff)** | `tg.judgment.refusal_when_escalation_needed` | `aux.H07` | `aux.T03` |
| **[user-aligned-objective](./patterns/user-aligned-objective)** | `tg.advocacy.metric_over_user`<br>`tg.advocacy.incentive_misalignment`<br>`tg.advocacy.loyalty_leak` | `aux.H07` | `aux.T04` |

Every pattern ships four files. `example.py` is runnable as-is: `python patterns/<slug>/example.py`.

## Pattern template

```
/patterns/<slug>/
├── README.md            # what, why, when, how — embeds the diagram
├── diagram.svg          # one diagram, light/dark aware
├── example.py           # runnable: python example.py
└── anti-pattern.md      # what this is not
```

The anti-pattern is not decoration. Every one of these failure modes ships in
real products *because it looks like the pattern* — hedging every sentence
looks like calibration, a snapshot test looks like a contract, a `user_id`
filter looks like scoping. Naming the near-miss is most of the work.

## Contributing

See [`CONTRIBUTING.md`](../../CONTRIBUTING.md). A pattern PR is rejected if any of the four files are missing.

## License

Same rule as the rest of TrustKit: **if you embed it, MIT; if you read it, CC BY 4.0.**

| File | License |
|---|---|
| `example.py` — the thing you copy into your codebase | **MIT** (`SPDX-License-Identifier: MIT` in each file) |
| `README.md`, `anti-pattern.md`, `diagram.svg` | **CC BY 4.0** |

The examples are labelled copy-paste, so a license that sends an adopter to
their legal team defeats the point. Attribution is still wanted — see
[`CITATION.cff`](../../CITATION.cff) — it is just not a condition of use.
