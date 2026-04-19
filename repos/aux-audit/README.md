# aux-audit

> A CLI that scores an agent product against the AUX heuristics and Trust Architecture. Score, grade, violations — reproducible.

> **Status — v0.1 spec · not yet on npm.** This repo is the specification, the rule set, and the intended CLI contract. The runnable binary is in active development — follow this repo or open an issue to be notified when `npx aux-audit` ships. All commands below describe the v0.1 contract.

```bash
# v0.1 contract (CLI in development):
npx aux-audit run ./agent-spec.json
```

```yaml
# → output
score: 72
grade: B
trust_stage: contextual
evolution_stage: task-aware
issues:
  - id: aux.H01
    type: visibility_of_intent
    severity: high
    evidence: "agent executes multi-step plan with no plan preview"
  - id: aux.H04
    type: trust_is_dynamic
    severity: medium
    evidence: "new-user and returning-user flows are identical"
  - id: aux.T02
    type: contextual_trust_gap
    severity: medium
    evidence: "no stated preference is re-used across sessions"
recommendations:
  - "Add an intent-handshake before multi-step tool use"
  - "Differentiate gated vs autonomous modes by user tenure"
```

## What it does

1. **Parses** an agent spec (JSON/YAML describing the product: surface, memory model, tool use, autonomy model, failure handling).
2. **Runs** the rule set from [`aux-frameworks`](../aux-frameworks) against it.
3. **Scores** on two axes — trust maturity and capability — per the Trust Architecture + Evolution Curve.
4. **Emits** a scored report as Markdown, JSON, or SARIF (for CI integration).

## Why CLI-first

Because AUX claims need to be **inspectable and reproducible.** A score that can't be re-run is an opinion.

## Install

```bash
npm i -g aux-audit
# or one-shot:
npx aux-audit run ./spec.json
```

## Agent spec format

See [`schemas/agent-spec.schema.yaml`](../../schemas/agent-spec.schema.yaml). Minimal example:

```yaml
name: "Support Copilot v2"
surface: "chat"
memory: { persistent: true, retention_days: 30 }
autonomy: "human-on-the-loop"
tools: ["crm.lookup", "email.send"]
flows: ["./flows/handoff.md", "./flows/refund.md"]
```

## Use in CI

```yaml
# .github/workflows/aux-audit.yml
- run: npx aux-audit run ./spec.yaml --format sarif --fail-on high
```

Failing the build on `severity: high` makes AUX a merge-blocking check, not a slide.

## Roadmap

- **v0.1** — score + grade, rules from `aux-heuristics` (10 rules).
- **v0.2** — Trust Architecture scoring (4 stages).
- **v0.3** — benchmark mode: run the same spec through OpenAI / Anthropic / in-house and compare.
- **v0.4** — HTML report + diffable scorecards.

## Related

- **[aux-frameworks](../aux-frameworks)** — the rules this tool runs.
- **[trust-gap-classifier](../trust-gap-classifier)** — the failure taxonomy used in `issues[].type`.

## License

MIT.
