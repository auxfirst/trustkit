# aux-audit

> Score an agent product against the [10 AUX Heuristics](../../schemas/aux-heuristics.yaml) and the [Trust Architecture](../../schemas/trust-architecture.yaml). Score, grade, violations — reproducible.

```bash
# today — from a clone of auxfirst/trustkit
npm --prefix packages/aux-audit ci && npm --prefix packages/aux-audit run build
node packages/aux-audit/dist/cli.js run ./agent-spec.yaml

# after npm publish
npx aux-audit run ./agent-spec.yaml
```

```
Score 41/100 · Grade F · Trust stage: functional

| Stage | Earned | Blocked by |
| 1. Functional Trust | ✅ | — |
| 2. Contextual Trust | ❌ | aux.H08 |
```

## What it actually does

1. **Validates** your spec against [`agent-spec.schema.yaml`](../../schemas/agent-spec.schema.yaml). A spec missing a required field is an error, not a bad score — refusing to grade an unparseable product is the point.
2. **Scores** each of the 10 heuristics on the canonical 0–3 scale (absent / attempted / present / robust).
3. **Derives** the trust stage from [`trust-gap-taxonomy.yaml`](../../schemas/trust-gap-taxonomy.yaml) — each gap already names both the heuristic that broke and the stage it violated, so the ladder is read from the standard, not hardcoded here.
4. **Emits** Markdown, JSON, or SARIF 2.1.0.

Change the YAML in `schemas/`, and the audit changes with it. No heuristic text, ID, or severity is duplicated in this package's source.

## What it does not do

**aux-audit grades the spec, not the running product.** It can prove a mechanism was never declared. It cannot prove a declared one works.

Two consequences, both deliberate:

- **Level 3 requires evidence.** "Robust" means *works under novel, adversarial, or edge cases* — prose cannot demonstrate that. A spec with no `evaluation.golden_transcripts` or `evaluation.failure_transcripts` is capped at level 2 on every heuristic, however well written. This is what stops the score from being gamed by rewriting guarantees.
- **`evolution_stage` is always `null` — by design, not pending.** A spec states what a product *claims about itself*; capability is a claim about what it *does*. No schema turns a declaration into an observation, so the Evolution Curve is assessed by a human in [`agent-ux-teardowns`](../../repos/agent-ux-teardowns) and this tool reports `evolution_stage_status: "human-assessed"`. Decided in [trustkit#5](https://github.com/auxfirst/trustkit/issues/5).

## Install

**Works today** (from a clone of this repository):

```bash
npm --prefix packages/aux-audit ci
npm --prefix packages/aux-audit run build
node packages/aux-audit/dist/cli.js run ./agent-spec.yaml
```

**After `npm publish`** (optional — the GitHub Action does not need this):

```bash
npx aux-audit run ./agent-spec.yaml     # no install
npm install --save-dev aux-audit        # or pin it
```

Requires Node 20+.

## Usage

```
aux-audit run <spec.yaml> [options]

  --config <path>     audit.config.yaml (ignore list, severity overrides, fail_on)
  --format <fmt>      md (default) | json | sarif
  --out <path>        write the report here instead of stdout
  --summary <path>    additionally write the Markdown scorecard here
  --fail-on <sev>     exit 1 on findings at or above: low | medium | high | critical
```

**Exit codes** — `0` clean · `1` findings at or above `--fail-on` · `2` invalid spec or usage. The distinction matters in CI: `2` means nothing was graded.

### audit.config.yaml

```yaml
fail_on: high
ignore:
  - aux.H09          # single-agent product; multi-agent clarity does not apply
severity_overrides:
  aux.H04: medium    # trust laddering is on the roadmap, not a blocker yet
```

Ignored heuristics leave the denominator entirely — they neither inflate nor deflate the score.

## In CI

Use the Action from this repo:

```yaml
- uses: auxfirst/trustkit@v0.2
  with:
    spec: ./agent-spec.yaml
    fail-on: high
```

It writes `audit.sarif` (upload with `github/codeql-action/upload-sarif` to get findings in the Security tab), `audit-summary.md` (use as a PR comment body), and `audit.json`, and exposes `score`, `grade`, `trust-stage`, and `issue-count` as step outputs. Default `version` is `local` — the Action builds `packages/aux-audit` from this checkout, so it does not wait on `npm publish`. A ready-made workflow is at [`onboarding/forwardables/A3-aux-audit.yml`](../../onboarding/forwardables/A3-aux-audit.yml).

## As a library

```ts
import { loadSpec, audit, toMarkdown } from "aux-audit";

const report = audit(loadSpec("./agent-spec.yaml"));
console.log(report.score, report.trust_stage);
console.log(toMarkdown(report));
```

## How a heuristic is scored

Every rule returns the evidence it used, so you can disagree with a number by pointing at a line:

| ID | Reads | Reaches *present* when |
|---|---|---|
| `aux.H01` Visibility of Intent | `autonomy`, `guarantees`, `flows` | a review point exists and a guarantee declares a pre-action checkpoint |
| `aux.H02` Progressive Transparency | `tools`, `flows`, golden transcripts | tool calls are nameable and flows are documented |
| `aux.H03` Steering | `autonomy`, `guarantees`, `memory.user_editable` | the user can interrupt or undo mid-flight |
| `aux.H04` Trust Is Dynamic | `guarantees`, `flows` | autonomy is tied to tenure, stakes, or outcomes |
| `aux.H05` Autonomy Boundaries | `guarantees` | boundaries are stated absolutely (will always / will never) |
| `aux.H06` Graceful Uncertainty | `guarantees`, failure transcripts | confidence or sourcing behaviour is declared |
| `aux.H07` Assertiveness | `guarantees`, failure transcripts | escalation, refusal, or pushback is declared |
| `aux.H08` Context Efficiency | `memory` | memory is persistent and scoped |
| `aux.H09` Multi-Agent Clarity | `surface`, `tools`, `guarantees` | *not applicable to single-agent specs* — dropped from the denominator |
| `aux.H10` Consistency | evaluation transcripts, `guarantees` | golden transcripts pin expected behaviour |

## Development

```bash
npm install
npm test          # builds, then runs the suite
npm run build
```

`schemas/` in this package is a **generated copy** of the repo-root `schemas/`. Never edit it directly — run `npm run sync:schemas`. CI runs `npm run check:schemas` and fails on drift.

## License

MIT throughout — the CLI and the bundled AUX schemas alike. See [LICENSE](LICENSE).
