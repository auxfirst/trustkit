# Repo Structure & Naming Conventions

## Naming rule

```
noun + system + clarity
```

Yes:
- `aux-frameworks`
- `aux-audit`
- `trust-gap-classifier`
- `agent-memory-policy`
- `agent-ux-teardowns`

No:
- `aux-studio-*` (internal-product-first, not category-first)
- `cool-agent-stuff` (vague)
- `copilot-tools` (tool-first, not concept-first)

Every repo name should read like a **reference in a paper**, not a product.

## Three repo kinds

| Kind | Purpose | Primary content | Primary license |
|---|---|---|---|
| **Definition** | Own the language | Markdown + YAML schemas | CC BY 4.0 |
| **Executable** | Earn dev respect | CLI / scanner / linter | MIT |
| **Reference** | Show what good looks like | One pattern, runnable | CC BY 4.0 / MIT |

Every new repo must declare its kind in its README header. Mixed repos are not allowed — split them.

## Standard repo layout

```
<repo-name>/
├── README.md            # required — kind, entry points, links to siblings
├── LICENSE              # required
├── CONTRIBUTING.md      # required for any repo accepting PRs
├── CHANGELOG.md         # required on executable repos (SemVer)
├── CODE_OF_CONDUCT.md   # optional — use contributor-covenant
├── frameworks/ or src/ or patterns/ or teardowns/   # one of these, not many
├── schemas/             # YAML/JSON schemas for any data format the repo defines
├── examples/            # a real, runnable example per entry point
└── .github/
    ├── ISSUE_TEMPLATE/
    └── workflows/
```

## Cross-linking rule

Every repo README must:
1. Link to **[profile/README.md](profile/README.md)** at the top.
2. Link to at least **two sibling repos** in a "Related" section at the bottom.

This is how the language compounds.

## Versioning

- **Definition repos**: SemVer on the framework level. Breaking = rename or remove a rule ID.
- **Executable repos**: SemVer on the CLI. Public YAML output is part of the API surface.
- **Reference repos**: not versioned. Each pattern has its own folder and can be replaced.

## Writing rules (README style)

- Lead with the **entry point** — a CLI command or a one-line value prop.
- One sentence per claim. Benchmarks beat adjectives.
- Code blocks before prose.
- Every README ends with "Related" and "License."
- Never: "awesome", "best-in-class", "revolutionary."

## PR rules

- Every PR that changes a framework YAML must include:
  - a rationale in the description,
  - updated heuristic/stage IDs if renamed,
  - updated examples that reference the IDs.
- Every PR to an executable repo must include a passing CI run that audits the worked example.

## Issue conventions

Issues are the **discussion layer** for the category. Labels:

| Label | For |
|---|---|
| `debate` | language / naming / ordering arguments |
| `violation` | "is this a violation of AUX?" — links to a real product |
| `pattern-request` | propose a new pattern |
| `gap-proposal` | propose a new entry in the trust-gap taxonomy |
| `bug` | CLI bug |
| `schema` | YAML/JSON schema change |

## What never goes in any of these repos

- Tutorials
- SaaS clones
- "Awesome-lists"
- Random experiments
- Marketing copy (goes in the profile README, not per-repo)
