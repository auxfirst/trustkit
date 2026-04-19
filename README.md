# auxfirst — agentic UX as a named discipline aux

> Patterns, heuristics, and trust systems for AI products.
> We don't design interfaces. We design relationships between users and agents.

**AUX** (Agentic User Experience) is an open standard. The 10 AUX Heuristics, the 4-stage Trust Architecture, and the Trust Gap Taxonomy are published as editable YAML schemas — forkable, citable, not vendor-locked. Definitions are **CC BY 4.0**; executable tooling is **MIT**.

If you ship AI products, you are no longer designing screens. You are designing an ongoing relationship between a user and an agent that has memory, initiative, and judgment. Classical UX was built for tools. AUX is built for relationships.

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
│   ├── trust-contract.yaml        ← example Trust Contract
│   ├── agent-spec.schema.yaml     ← audit input format
│   └── memory-policy.schema.yaml  ← memory governance format
│
├── repos/                         ← first-wave repo READMEs (split out as v0.x ships)
│   ├── aux-frameworks/            ← Definition
│   ├── aux-audit/                 ← Executable (CLI · v0.1 contract)
│   ├── trust-gap-classifier/      ← Executable
│   ├── agent-memory-policy/       ← Executable
│   ├── agent-ux-teardowns/        ← Reference
│   └── agentic-ux-patterns/       ← Reference (intent-handshake, memory-in-motion)
│
├── visuals/storyboard.html        ← single-page visual overview
├── one-pager/                     ← business one-pager (Word, editable)
├── profile/README.md              ← the github.com/auxfirst org profile
│
├── ARCHITECTURE.md                ← big-picture system view
├── REPO_STRUCTURE.md              ← naming + layout conventions
├── CONTRIBUTING.md                ← contribution bar (the bar is high)
├── CODE_OF_CONDUCT.md             ← Contributor Covenant 2.1
├── LICENSE                        ← CC BY 4.0
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
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** — how the pieces fit.
3. **[visuals/storyboard.html](visuals/storyboard.html)** — download and open in a browser; the whole story on one page.
4. **[repos/](repos/)** — the six first-wave repos.
5. **[schemas/](schemas/)** — the YAML that makes this real.
6. **[one-pager/auxfirst-github-onepager.docx](one-pager/auxfirst-github-onepager.docx)** — for business conversations.

## Principles

1. GitHub = **receipts for AUX**, not a projects page.
2. Every repo is exactly one of three kinds: Definition, Executable, Reference.
3. Every claim has a runnable example.
4. Name before you tool.
5. The internal execution layer and the public standard layer share one taxonomy.

## Contributing

The bar is high. Patterns need diagrams, heuristics need examples, benchmarks need a runnable script. See **[CONTRIBUTING.md](CONTRIBUTING.md)** before opening a PR. Open an Issue first for anything that touches an ID or introduces vocabulary — five Issue templates are set up: `pattern-request`, `gap-proposal`, `debate`, `schema`, `bug`.

## License

- Definition content (schemas, frameworks, heuristics, vocabulary): **CC BY 4.0**.
- Executable tooling (when shipped): **MIT**.
- Teardown content: **CC BY-NC 4.0** (attribution, non-commercial).

See **[LICENSE](LICENSE)** for the full text and per-repo variation.

## Status

**v0.2 · 2026-04-19** — First public release. Onboarding layer live: audience-routed docs (R1–R4) + four forwardable artifacts + two canonical patterns + six first-wave repo READMEs + canonical schemas. `aux-audit` CLI (v0.1 contract) in active development. Next: pressure-test the router with a real CTO reader; ship the `aux-audit` binary.

---

*auxfirst — agentic UX as a named discipline.*
