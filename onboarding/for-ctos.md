# For CTOs and VPs of Engineering

*You'll be asked if your agents are trustworthy. Here's a defensible framework — and the open standard you can adopt or fork.*

> **AUX** is an open standard for agentic UX published at **github.com/auxfirst** — schemas and heuristics are **CC BY 4.0**, tooling is **MIT**. Fork it, cite it, extend it.

This is the 5-minute version. The long version is **[ARCHITECTURE.md](../ARCHITECTURE.md)**. The executable version is **[aux-audit](../repos/aux-audit/README.md)**.

---

## 1 · The framework — Trust Architecture

Four stages, one explicit axis, one load-bearing property.

| Stage | Question | Canonical failure modes |
|---|---|---|
| **T01 · Functional** | Can it complete tasks reliably and predictably? | hallucination, silent_degradation |
| **T02 · Contextual** | Does it understand nuance, preferences, history? | memory_amnesia, preference_ignored |
| **T03 · Judgment** | Can it make good calls in ambiguous, novel situations? | overreach_in_ambiguity, confident_nonsense |
| **T04 · Advocacy** | Does it act in the user's interest when incentives misalign? | metric_over_user, incentive_misalignment |

**Load-bearing property.** Trust loss does **not** cascade gracefully. A single T04 violation can collapse user trust all the way back to T01. Your risk profile is dominated by your weakest stage *at the moment the user notices.*

Canonical YAML: **[schemas/trust-architecture.yaml](../schemas/trust-architecture.yaml)**.

## 2 · The contract — Trust Contract

The Trust Contract is the machine-readable declaration of what your agent will, won't, and will-always-ask before doing. It is the artifact your legal team, your product team, and your model provider can all sign off on without drifting.

The minimum viable contract declares:
- **Scope** — what is in/out.
- **Autonomy levels** — what runs without asking, what always asks, what is forbidden.
- **Memory** — scopes, retention, user controls.
- **Escalation** — triggers, target, SLA.
- **Guarantees** — named, each backed by a golden transcript.

Canonical example: **[schemas/trust-contract.yaml](../schemas/trust-contract.yaml)**.

A Trust Contract without guarantees-backed-by-tests is a marketing page. Don't ship one.

## 3 · Auditing your own agents

`aux-audit` runs the 10 heuristics + 4 trust stages against an agent spec and emits a score, a grade, and named violations. It emits SARIF, which means it can block merges in CI the same way your static-analyzer does.

> *v0.1 — CLI contract published, binary in active development. The command below describes the intended invocation; follow [aux-audit](../repos/aux-audit/README.md) for the ship date.*

```bash
# v0.1 contract
npx aux-audit run ./spec.yaml --format sarif --fail-on high
```

What this gives you:
- **A defensible number.** The grade is reproducible. A regression shows up in a diff.
- **A named gap.** "Stage 3 regression on the escalation flow" beats "the copilot feels worse."
- **A merge gate.** High-severity violations block the PR — not the vibes check.

See **[aux-audit README](../repos/aux-audit/README.md)** and the **[agent-spec schema](../schemas/agent-spec.schema.yaml)**.

## 4 · Vendor evaluation rubric

Use the 10 AUX heuristics as a buy-side checklist. One question per heuristic, one score per question, one notebook per vendor.

| # | Heuristic | Question to the vendor |
|---|---|---|
| H01 | Visibility of agent intent | Show me the intent preview before a multi-step action. |
| H02 | Progressive transparency | How does a user zoom into reasoning and tool calls? |
| H03 | User control through steering | How does a user correct or undo mid-flight? |
| H04 | Trust is dynamic | How does granted autonomy change with tenure and stakes? |
| H05 | Clear boundaries of autonomy | Show me what the agent will and will not do without asking. |
| H06 | Graceful uncertainty | How is confidence communicated to the user? |
| H07 | Appropriate assertiveness | Show me the escalation trigger and the refusal trigger. |
| H08 | Context efficiency | How does memory persist across sessions, and who controls it? |
| H09 | Multi-agent clarity | When multiple agents act, how is responsibility attributed? |
| H10 | Consistency of behavior | How do you detect and announce behavioral drift? |

Canonical YAML: **[schemas/aux-heuristics.yaml](../schemas/aux-heuristics.yaml)**. Score 0–3 per heuristic. Any vendor scoring ≤1 on H06 or H07 is carrying advocacy risk you'll own.

## Take this with you

The **[CTO one-pager](forwardables/A2-cto-exec-brief.md)** — board-deck-ready, one page: "How we will judge any agent we ship or buy."

---

<sub>**If you're also the person shipping →** see **[R3 · for engineering](for-engineering.md)**. Back to **[router](README.md)**.</sub>
