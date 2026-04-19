# Appendix A · Vocabulary

Two tables. One for GitHub words (useful to R1 and R4 if they venture there). One for AUX words (load-bearing in every slice).

---

## A.1 · GitHub words (if you need them)

| Term | Plain-English meaning |
|---|---|
| **Repo / repository** | A folder with files, version history, and a public URL. |
| **README** | The document that explains what a repo is and how to use it. |
| **Issue** | A thread. Used here for debates about language, patterns, and gaps. |
| **PR / pull request** | A proposed change to a repo, visible and reviewable before it lands. |
| **Fork** | Your own copy of a repo. What you do when you want to extend or dissent. |
| **Star** | A bookmark. Used as a weak popularity signal. |
| **CLI** | A tool you run from a terminal. `npx aux-audit run ./spec.yaml` is a CLI invocation. |
| **CI / CI pipeline** | Automation that runs on every code change. Where `aux-audit` becomes merge-blocking. |
| **SARIF** | A standard file format for code-scan findings. What CI tools read to surface violations. |
| **YAML** | A human-readable config format. Every AUX schema is YAML. |
| **Gist** | A single-file snippet, shareable by link. |

## A.2 · AUX words (load-bearing)

| Term | Meaning | Canonical source |
|---|---|---|
| **Agentic UX (AUX)** | The design of relationships between users and agents that have memory, initiative, and judgment. | [profile/README.md](../profile/README.md) |
| **Heuristic** | One of ten diagnostic questions for agentic products. IDs `aux.H01–H10`. | [schemas/aux-heuristics.yaml](../schemas/aux-heuristics.yaml) |
| **Trust stage** | One of four rungs: Functional, Contextual, Judgment, Advocacy. IDs `aux.T01–T04`. | [schemas/trust-architecture.yaml](../schemas/trust-architecture.yaml) |
| **Trust gap** | A named failure mode. Family + name + severity. IDs `tg.<family>.<name>`. | [schemas/trust-gap-taxonomy.yaml](../schemas/trust-gap-taxonomy.yaml) |
| **Trust Contract** | A machine-readable declaration of an agent's scope, autonomy, memory, and escalation. | [schemas/trust-contract.yaml](../schemas/trust-contract.yaml) |
| **Agent spec** | A YAML file describing the agent product. Input to `aux-audit`. | [schemas/agent-spec.schema.yaml](../schemas/agent-spec.schema.yaml) |
| **Memory policy** | Declared scopes, retention, and user controls for persistent memory. | [schemas/memory-policy.schema.yaml](../schemas/memory-policy.schema.yaml) |
| **Pattern** | A named, reusable design move that closes a specific gap. | [repos/agentic-ux-patterns](../repos/agentic-ux-patterns/README.md) |
| **Teardown** | A structured review of a shipped product: `analysis.md` + `score.json`. | [repos/agent-ux-teardowns](../repos/agent-ux-teardowns/README.md) |
| **Evolution curve** | The capability axis, independent of trust. | [schemas/trust-architecture.yaml](../schemas/trust-architecture.yaml) |
| **Definition / Executable / Reference** | The three kinds of repo. Every repo is exactly one. | [REPO_STRUCTURE.md](../REPO_STRUCTURE.md) |
