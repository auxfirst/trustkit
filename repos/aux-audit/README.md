# aux-audit

> A CLI that scores an agent product against the AUX heuristics and Trust Architecture. Score, grade, violations — reproducible.

> **Status — v0.1 implemented.** The CLI lives at **[`packages/aux-audit`](../../packages/aux-audit/)** in this repository: validator, rule set, scorer, and Markdown/JSON/SARIF output, with a GitHub Action wrapper at [`action.yml`](../../action.yml). From a clone: `npm --prefix packages/aux-audit ci && npm --prefix packages/aux-audit run build`. `npx aux-audit` works after the package is published to npm.

```bash
# today — from a clone of this repo
npm --prefix packages/aux-audit ci && npm --prefix packages/aux-audit run build
node packages/aux-audit/dist/cli.js run ./agent-spec.yaml

# after npm publish
npx aux-audit run ./agent-spec.yaml
```

```yaml
# → output
score: 72
grade: B
trust_stage: contextual
evolution_stage: null          # schema-undefined until the Evolution Curve ships
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
3. **Scores** trust maturity from the Trust Architecture. Capability (`evolution_stage`) is `null` until an Evolution Curve schema is published.
4. **Emits** a scored report as Markdown, JSON, or SARIF (for CI integration).

## Why CLI-first

Because AUX claims need to be **inspectable and reproducible.** A score that can't be re-run is an opinion.

## Install

**Works today**

```bash
# CI
- uses: auxfirst/trustkit@v0.2
  with:
    spec: ./agent-spec.yaml
    fail-on: high

# local, from a clone of auxfirst/trustkit
npm --prefix packages/aux-audit ci
npm --prefix packages/aux-audit run build
node packages/aux-audit/dist/cli.js run ./spec.yaml
```

**After `npm publish`** (optional — not required for the Action)

```bash
npm i -g aux-audit
# or one-shot:
npx aux-audit run ./spec.yaml
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
# .github/workflows/aux-audit.yml — copy-paste: onboarding/forwardables/A3-aux-audit.yml
- uses: auxfirst/trustkit@v0.2
  with:
    spec: ./spec.yaml
    fail-on: high
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
