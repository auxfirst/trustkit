# Agentic User Experience (AUX)

> Patterns, heuristics, and trust systems for AI products.
>
> We don't design interfaces. We design relationships between users and agents.

---

**AUX** is a named discipline. This is its public layer — the codified, inspectable, forkable version of what most teams only talk about.

If you ship AI products, you are no longer designing screens. You are designing an ongoing relationship between a user and an agent that has memory, initiative, and judgment. Classical UX was built for tools. AUX is built for relationships.

## Start here

| Entry point | What it is | Use when |
|---|---|---|
| **[aux-frameworks](../repos/aux-frameworks)** | Methodology as code. Audits, taxonomies, scorecards as YAML. | You want the standard. |
| **[aux-audit](../repos/aux-audit)** | `npx aux-audit` — a CLI (v0.1 contract · binary in development) that scores an agent product against the 10 heuristics. | You want a grade, not an opinion. |
| **[trust-gap-classifier](../repos/trust-gap-classifier)** | A taxonomy + detector for how agent trust breaks. | You want shared language for failures. |
| **[agent-memory-policy](../repos/agent-memory-policy)** | Generate memory governance policy + system-prompt snippets from a config. | Product, compliance, and devs need to agree. |
| **[agent-ux-teardowns](../repos/agent-ux-teardowns)** | Structured teardowns of shipped AI products. | You want receipts, not vibes. |

## What you'll find here

- **Definition repos** — the "Wikipedia pages" for the category: patterns, heuristics, trust stages.
- **Executable repos** — CLIs and scanners that turn the ideas into diagnostics.
- **Reference implementations** — one pattern, runnable, clean, minimal.

## What you won't find here

- Random experiments, SaaS clones, tutorials, or think-pieces dressed as code.
- Opinions without benchmarks.
- Frameworks without schemas.

## The principle

> One technical blog post with runnable code + benchmark numbers will out-earn ten soft think-pieces.

This is the **proof layer** for the category — every claim ships with a schema, a CLI, or a reproducible scenario.

---

## For developers

Every tool ships as a CLI. Every framework ships as YAML/JSON. Every claim ships with a reproducible scenario.

```bash
# aux-audit v0.1 contract — CLI in active development
npx aux-audit run ./agent-spec.json
# → score: 72  grade: B  issues: [trust_gap, memory_amnesia]
```

The spec format ([`agent-spec.schema.yaml`](../schemas/agent-spec.schema.yaml)) and rule set ([`aux-heuristics.yaml`](../schemas/aux-heuristics.yaml)) are published today. The binary follows — see [`aux-audit`](../repos/aux-audit).

## For product & design

Use the **[10 AUX Heuristics](../repos/aux-frameworks/frameworks/aux-heuristics)** and the **[Trust Architecture](../repos/aux-frameworks/frameworks/trust-architecture)** to diagnose, plan, and review. Both are editable YAML — fork, extend, submit a PR.

## For analysts & researchers

Teardowns are structured (`analysis.md` + `score.json`) so they can be compared, aggregated, and cited. Start with [`agent-ux-teardowns`](../repos/agent-ux-teardowns).

---

## Architecture at a glance

See the visual overview: **[visuals/storyboard.html](../visuals/storyboard.html)**.

```
  Internal (AUX Studio)                Public (GitHub)
  ─────────────────────────────        ─────────────────────
  Framework engine            ───▶     aux-frameworks (schemas)
  Audit engine                ───▶     aux-audit (CLI)
  Trust taxonomy              ───▶     trust-gap-classifier
  Memory policy generator     ───▶     agent-memory-policy
  Teardown templates          ───▶     agent-ux-teardowns
```

The internal system is the private execution layer. GitHub is the public standard layer. Both point at the same taxonomy.

---

## Contributing

Every repo has a `CONTRIBUTING.md`. The short version: **patterns need diagrams, heuristics need examples, benchmarks need a runnable script.** No exceptions.

## License

Definition repos: **CC BY 4.0**. Executable repos: **MIT**. Teardowns: **CC BY-NC 4.0** (attribution, non-commercial).

---

*auxfirst — agentic UX as a named discipline.*
