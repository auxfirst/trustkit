# github/

The auxfirst GitHub strategy — documents, schemas, visuals, onboarding, and business one-pager.

This folder is the **source of truth** for what goes on `github.com/auxfirst` before any of it is pushed. When a doc here stabilises, it ships to a real repo.

## Start here

**New to auxfirst?** Go to **[onboarding/README.md](onboarding/README.md)** — the router. Pick the role that's most you, read five minutes, walk away with an artifact.

## What's in here

```
github/
├── README.md                      ← you are here (staging index)
├── ARCHITECTURE.md                ← the big-picture system view
├── REPO_STRUCTURE.md              ← naming + layout conventions
├── CONTRIBUTING.md                ← contribution bar
├── CODE_OF_CONDUCT.md             ← Contributor Covenant 2.1
├── LICENSE                        ← CC BY 4.0 (with per-repo variation note)
├── .github/                       ← Issue templates, PR template, CI
│   ├── ISSUE_TEMPLATE/            ← pattern-request, gap-proposal, debate, schema, bug
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/validate.yml     ← YAML lint + markdown link check on every PR
│
├── onboarding/                    ← ★ audience-routed onboarding (v0.2, public)
│   ├── README.md                  ← the router — "pick the one that's most you"
│   ├── for-business-operators.md  ← R1 (3 pages, plain English)
│   ├── for-ctos.md                ← R2 (4 pages, peer-to-peer technical)
│   ├── for-engineering.md         ← R3 (4 pages, code-heavy)
│   ├── two-patterns.md            ← R4 (3 pages, copy-paste patterns)
│   ├── appendix-a-vocabulary.md   ← GitHub + AUX vocabulary
│   ├── appendix-b-index.md        ← index of project files
│   ├── principles.md              ← the five principles
│   ├── traps.md                   ← common ways this goes wrong
│   ├── auxfirst-onboarding-v0.2.docx  ← the full DOCX bundle (R1–R4)
│   └── forwardables/              ← standalone take-aways (A1–A4)
│
├── profile/
│   └── README.md                  ← the github.com/auxfirst profile README
│
├── repos/
│   ├── aux-frameworks/            ← Definition
│   ├── aux-audit/                 ← Executable (CLI)
│   ├── trust-gap-classifier/      ← Executable
│   ├── agent-memory-policy/       ← Executable
│   ├── agent-ux-teardowns/        ← Reference
│   └── agentic-ux-patterns/       ← Reference (intent-handshake, memory-in-motion)
│
├── schemas/
│   ├── aux-heuristics.yaml        ← the 10 heuristics, canonical
│   ├── trust-architecture.yaml    ← the 4 trust stages
│   ├── trust-gap-taxonomy.yaml    ← named failure modes
│   ├── trust-contract.yaml        ← example Trust Contract
│   ├── agent-spec.schema.yaml     ← audit input format
│   └── memory-policy.schema.yaml  ← memory governance format
│
├── visuals/
│   └── storyboard.html            ← single-file visual overview of architecture + flow
│
├── one-pager/
│   └── auxfirst-github-onepager.docx  ← business one-pager (editable)
│
└── internal/                      ← ✖ NOT for public upload — founder-only planning
    ├── LAUNCH_PLAN.md             ← 30-day week-by-week plan
    ├── internal-status.md         ← R5 slice (founder / collaborator onboarding)
    └── A5-internal-status.md      ← R5 forwardable
```

**Ship vs. internal.** Everything outside `internal/` is staged for public upload to `github.com/auxfirst`. `internal/` is founder-only — don't upload.

## Read order

1. **[onboarding/README.md](onboarding/README.md)** — the router. Read the slice that's you, skip the rest.
2. **[profile/README.md](profile/README.md)** — the manifesto entry point.
3. **[ARCHITECTURE.md](ARCHITECTURE.md)** — how the internal system and the public layer fit.
4. **[visuals/storyboard.html](visuals/storyboard.html)** — open in a browser, the whole story in one page.
5. **[repos/](repos/)** — the six first-wave repos.
6. **[schemas/](schemas/)** — the YAML that makes this real.
7. **[one-pager/auxfirst-github-onepager.docx](one-pager/auxfirst-github-onepager.docx)** — for business conversations.
8. **[internal/](internal/)** — *(founder-only)* launch plan, R5 slice, A5 forwardable.

## Principles

1. GitHub = **receipts for AUX**, not a projects page.
2. Every repo is exactly one of three kinds: Definition, Executable, Reference.
3. Every claim has a runnable example.
4. Name before you tool.
5. The internal system and the public layer share one taxonomy.

## Status

**v0.2 · 2026-04-19** — Onboarding layer added: audience-routed doc + five forwardable artifacts + two canonical patterns. Next: pressure-test the router with a real R2 reader (the CTO test, AC10).
