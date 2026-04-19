# For engineering — PMs, eng leads, senior devs shipping the agent

*Here's the spec format, the audit CLI, and a worked example. Run it on your agent today.*

---

## 1 · The spec format

Your agent gets described once, in YAML, and that description drives everything downstream: the audit, the Trust Contract, the memory policy, the golden-transcript replay.

```yaml
# spec.yaml
name: "Support Copilot v2"
version: "2.3.1"
surface: chat
autonomy: human-on-the-loop
memory:
  persistent: true
  scopes: [preferences, conversation_history, escalation_notes]
  retention: P90D
  user_visible: true
  user_editable: true
tools: [crm.lookup, email.send, ticket.create]
flows: [./flows/handoff.md, ./flows/refund.md]
guarantees:
  - "will always ask before sending external email"
  - "will always hand off to a human after two failed resolutions"
evaluation:
  golden_transcripts: [./transcripts/golden/*.jsonl]
  failure_transcripts: [./transcripts/failures/*.jsonl]
```

Full schema: **[schemas/agent-spec.schema.yaml](../schemas/agent-spec.schema.yaml)**.

**Rule.** `guarantees` are contracts. Each one must be backed by a golden transcript that exercises it. Otherwise it's a TODO, not a guarantee.

## 2 · Running aux-audit

> **Status — v0.1 contract · CLI in development.** The commands below describe the v0.1 invocation. The binary isn't on npm yet; follow [aux-audit](../repos/aux-audit/README.md) for the ship date. You can still adopt the spec format today and wire the workflow file in advance.

Locally (v0.1 contract):

```bash
npx aux-audit run ./spec.yaml
# → score, grade, named gaps, recommendations
```

In CI (v0.1 contract):

```yaml
# .github/workflows/aux-audit.yml
name: aux-audit
on:
  pull_request:
    paths: ["spec.yaml", "transcripts/**", "flows/**"]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npx aux-audit run ./spec.yaml --format sarif --out audit.sarif --fail-on high
      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with: { sarif_file: audit.sarif }
```

Copy-pasteable version: **[forwardables/A3-aux-audit.yml](forwardables/A3-aux-audit.yml)**.

## 3 · Heuristics as merge-blocking rules

| ID | Heuristic | In CI |
|---|---|---|
| H01 | Visibility of agent intent | fail-on high |
| H02 | Progressive transparency | warn |
| H03 | User control through steering | fail-on high |
| H04 | Trust is dynamic | warn |
| H05 | Clear boundaries of autonomy | fail-on high |
| H06 | Graceful uncertainty | fail-on high |
| H07 | Appropriate assertiveness | fail-on high |
| H08 | Context efficiency | warn |
| H09 | Multi-agent clarity | warn |
| H10 | Consistency of behavior | fail-on high |

Rationale: the five marked `fail-on high` are the ones where a regression ships real user harm. The rest can accumulate a backlog without blocking release.

Tune in `audit.config.yaml`:

```yaml
rules:
  aux.H01: { severity_override: high, block_merge: true }
  aux.H02: { severity_override: medium, block_merge: false }
  # ...
```

## 4 · Contributing gaps and patterns upstream

Found a failure mode that isn't in **[trust-gap-taxonomy.yaml](../schemas/trust-gap-taxonomy.yaml)**? Open a PR.

Minimal taxonomy entry:

```yaml
- id: tg.<family>.<name>
  family: functional | contextual | judgment | advocacy
  name: "Human-readable name"
  question: "Diagnostic question"
  heuristic_ref: aux.H0X
  trust_stage: aux.T0X
  severity_default: low | medium | high | critical
  fix_pattern: "<pattern-slug>"
```

Pattern PRs require: definition, diagram, runnable snippet, anti-pattern. No exceptions. See **[CONTRIBUTING.md](../CONTRIBUTING.md)**.

## Take this with you

The **[CI workflow snippet](forwardables/A3-aux-audit.yml)** — drop it into `.github/workflows/`, point it at your spec, ship.

---

<sub>**If you're also building patterns →** see **[R4 · two patterns](two-patterns.md)**. Back to **[router](README.md)**.</sub>
