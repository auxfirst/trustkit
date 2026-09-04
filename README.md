# TrustKit

**auxfirst** — agentic UX as a named discipline.

> Patterns, heuristics, and trust systems for AI products.
> We don't design interfaces. We design relationships between users and agents.

**Project home: [auxfirst.com](https://auxfirst.com)** · [`aux-audit`](packages/aux-audit/) · [Schemas](schemas/) · [Onboarding](onboarding/README.md) · [Docs](docs/index.md) · [Cite this work](CITATION.cff)

**AUX** (Agentic User Experience) is an open standard. The 10 AUX Heuristics, the 4-stage Trust Architecture, and the Trust Gap Taxonomy are published as editable YAML schemas — forkable, citable, not vendor-locked. The schemas are **MIT** — embed them, vendor them, no attribution condition. The prose around them is **CC BY 4.0**.

If you ship AI products, you are no longer designing screens. You are designing an ongoing relationship between a user and an agent that has memory, initiative, and judgment. Classical UX was built for tools. AUX is built for relationships.

## Run it

The standard is executable. `aux-audit` scores an agent product against the 10 heuristics and the Trust Architecture, and tells you which trust stage you have actually earned.

```bash
# from a clone of this repo
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

In CI, as a GitHub Action — SARIF into the Security tab, a scorecard on the PR:

```yaml
- uses: auxfirst/trustkit@v0.2
  with:
    spec: ./agent-spec.yaml
    fail-on: high
```

It grades the **spec**, not the running product: it can prove a mechanism was never declared, never that a declared one works. A spec with no evidence of testing is capped at *present* on every heuristic, so the score cannot be gamed with better prose.

Under agent-spec v1 it computes the gap between what an agent's credentials permit and what its mandate governs — the attack surface — and treats a row enforced by "the system prompt" as unenforced. See **[packages/aux-audit](packages/aux-audit/)**.

## Start here

Pick the role that's most you. Read five minutes. Walk away with one artifact you can forward.

| Who you are | Read this | Walk away with |
|---|---|---|
| Business operator / GTM | **[for-business-operators](onboarding/for-business-operators.md)** | [10 questions for any AI vendor](onboarding/forwardables/A1-10-questions-for-your-ai-vendor.md) |
| CTO / VP Engineering | **[for-ctos](onboarding/for-ctos.md)** | [CTO one-pager](onboarding/forwardables/A2-cto-exec-brief.md) |
| Engineer shipping the agent | **[for-engineering](onboarding/for-engineering.md)** | [aux-audit CI workflow](onboarding/forwardables/A3-aux-audit.yml) |
| Solo / indie builder | **[two-patterns](onboarding/two-patterns.md)** | [Two patterns, copy-paste](onboarding/forwardables/A4-two-patterns.md) |

Or read **[onboarding/README.md](onboarding/README.md)** — the router with all four side by side, plus appendices and principles.

## What's in here

```
.
├── onboarding/                    ← audience-routed onboarding (R1–R4 + forwardables A1–A4)
│   ├── README.md                  ← the router
│   ├── for-business-operators.md  ← R1 (3 pages, plain English)
│   ├── for-ctos.md                ← R2 (4 pages, peer-to-peer technical)
│   ├── for-engineering.md         ← R3 (4 pages, code-heavy)
│   ├── two-patterns.md            ← R4 (3 pages, copy-paste patterns)
│   ├── appendix-a-vocabulary.md   ← AUX vocabulary
│   ├── appendix-b-index.md        ← project file index
│   ├── principles.md              ← the five principles
│   ├── traps.md                   ← common ways this goes wrong
│   ├── auxfirst-onboarding-v0.2.docx  ← R1–R4 as one Word bundle
│   └── forwardables/              ← standalone take-aways A1–A4
│
├── schemas/                       ← canonical YAML — the standard
│   ├── aux-heuristics.yaml        ← the 10 heuristics
│   ├── trust-architecture.yaml    ← the 4 trust stages
│   ├── trust-gap-taxonomy.yaml    ← named failure modes
│   ├── aux-evolution-curve.yaml   ← the 4 capability stages (teardowns only)
│   ├── trust-contract.yaml        ← example Trust Contract
│   ├── agent-spec.schema.yaml     ← v1.0, real JSON Schema — per-action mandate
│   ├── agent-spec.v0.yaml         ← v0.1.0, frozen; still scored, not comparable
│   ├── MIGRATION.md               ← v0 → v1, and why
│   ├── migrate-v0-to-v1.py        ← converter; leaves TODOs rather than guessing
│   ├── brain-spec.schema.yaml     ← Agency Brain input format (JSON Schema)
│   └── memory-policy.schema.yaml  ← memory governance format
│
├── repos/                         ← first-wave repo READMEs (split out as v0.x ships)
│   ├── aux-frameworks/            ← Definition
│   ├── aux-audit/                 ← Executable (spec; built in packages/aux-audit)
│   ├── trust-gap-classifier/      ← Executable
│   ├── agent-memory-policy/       ← Executable
│   ├── agent-ux-teardowns/        ← Reference
│   └── agentic-ux-patterns/       ← Reference (intent-handshake, memory-in-motion)
│
├── packages/aux-audit/            ← the CLI (MIT) · npx aux-audit
├── action.yml                     ← GitHub Action wrapping the CLI
│
├── visuals/storyboard.html        ← single-page visual overview
├── one-pager/                     ← business one-pager (Word, editable)
├── profile/README.md              ← the github.com/auxfirst org profile
│
├── ARCHITECTURE.md                ← big-picture system view
├── REPO_STRUCTURE.md              ← naming + layout conventions
├── CONTRIBUTING.md                ← contribution bar (the bar is high)
├── CODE_OF_CONDUCT.md             ← Contributor Covenant 2.1
├── docs/                          ← static-site copy (canonical path TBD)
├── CHANGELOG.md                   ← what shipped
├── CITATION.cff                   ← how to cite AUX definitions
├── LICENSE                        ← CC BY 4.0 (prose; GitHub-detectable legal code)
├── LICENSING.md                   ← license map: machine-readable = MIT, prose = CC BY
└── .github/                       ← Issue templates, PR template, CI
```

## What you won't find here

- Random experiments, SaaS clones, tutorials, or think-pieces dressed as code.
- Opinions without benchmarks.
- Frameworks without schemas.

## The principle

> One technical post with runnable code + benchmark numbers will out-earn ten soft think-pieces.

This is the **proof layer** for the category. Every claim ships with a schema, a CLI, or a reproducible scenario.

## Read order (if you want the whole picture)

1. **[onboarding/README.md](onboarding/README.md)** — the router. Pick a slice, skip the rest.
2. **[packages/aux-audit](packages/aux-audit/)** — the CLI. Run it against your own spec.
3. **[docs/index.md](docs/index.md)** — the static-site copy of the same material.
4. **[ARCHITECTURE.md](ARCHITECTURE.md)** — how the pieces fit.
5. **[visuals/storyboard.html](visuals/storyboard.html)** — download and open in a browser; the whole story on one page.
6. **[repos/](repos/)** — the six first-wave repos.
7. **[schemas/](schemas/)** — the YAML that makes this real.
8. **[one-pager/auxfirst-github-onepager.docx](one-pager/auxfirst-github-onepager.docx)** — for business conversations.

## Principles

1. GitHub = **receipts for AUX**, not a projects page.
2. Every repo is exactly one of three kinds: Definition, Executable, Reference.
3. Every claim has a runnable example.
4. Name before you tool.
5. The internal execution layer and the public standard layer share one taxonomy.

## Contributing

The bar is high. Patterns need diagrams, heuristics need examples, benchmarks need a runnable script. See **[CONTRIBUTING.md](CONTRIBUTING.md)** before opening a PR. Open an Issue first for anything that touches an ID or introduces vocabulary — five Issue templates are set up: `pattern-request`, `gap-proposal`, `debate`, `schema`, `bug`.

## Citing AUX

The definitions here are meant to be quoted, forked, and built on. If you reference the AUX
Heuristics, the Trust Architecture, or the Trust Gap Taxonomy in a post, paper, or product doc,
cite the repository — **[CITATION.cff](CITATION.cff)** carries the machine-readable metadata, and
GitHub renders it behind the *Cite this repository* button as APA or BibTeX.

> auxfirst (2026). *TrustKit — AUX (Agentic User Experience) heuristics, trust architecture, and
> trust gap taxonomy* (Version 0.2). https://github.com/auxfirst/trustkit

## License

One rule: **machine-readable definitions are MIT, prose is CC BY 4.0.**

- Schemas (`schemas/*.yaml`), pattern examples (`example.py`), and tooling (`packages/aux-audit`, `action.yml`): **MIT**. Embed them; no attribution condition.
- Prose (onboarding, vocabulary, pattern write-ups and diagrams): **CC BY 4.0**.
- Teardown content: **CC BY-NC 4.0** (attribution, non-commercial).

GitHub's badge reads CC BY 4.0 because it detects the root **[LICENSE](LICENSE)**, which covers the prose. The schemas are not CC — see **[LICENSING.md](LICENSING.md)** and **[schemas/LICENSE](schemas/LICENSE)**.

## Status

**v0.2 · 2026-04-19** — First public release. Onboarding layer live: audience-routed docs (R1–R4) + four forwardable artifacts + two canonical patterns + six first-wave repo READMEs + canonical schemas. `aux-audit` v0.1 is implemented, tested, and wired into CI as a GitHub Action. Seven patterns close all 12 named trust gaps, enforced in CI. Next: `npm publish` so `npx aux-audit` resolves without a clone; list the Action on the Marketplace; name the Evolution Curve stages for teardowns ([#5](https://github.com/auxfirst/trustkit/issues/5) — the axis is human-assessed, not something `aux-audit` computes).

---

*TrustKit — auxfirst. Agentic UX as a named discipline.*

**[auxfirst.com](https://auxfirst.com)** · [github.com/auxfirst](https://github.com/auxfirst) · questions and proposals go in [Issues](https://github.com/auxfirst/trustkit/issues).
