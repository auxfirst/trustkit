# Repo metadata cheat-sheet

Paste these into the GitHub UI after the public push.
**Settings → General → "About"** (the gear icon at the top-right of the repo page) — or click the ⚙ next to "About" on the repo home.

---

## Description (max 350 chars; aim for ~150)

> Agentic UX as a named discipline. Patterns, heuristics, and trust systems for AI products — published as open standard YAML schemas. Forkable, citable, not vendor-locked.

## Website

```
https://github.com/auxfirst
```

(Once `auxfirst.com` exists, swap in that URL.)

## Topics (max 20 — paste these one-by-one in the Topics field)

Core:
- `agentic-ux`
- `ai-ux`
- `ai-agents`
- `agent-design`
- `human-ai-interaction`

Standard / spec:
- `open-standard`
- `yaml-schema`
- `design-patterns`
- `heuristic-evaluation`
- `framework`

Trust / safety:
- `ai-trust`
- `ai-safety`
- `responsible-ai`

Product / dev:
- `developer-tools`
- `product-design`
- `ux-research`

## Repository details — toggles

In **Settings → General → Features**, set:

- [x] **Issues** — on (templates set up)
- [ ] **Sponsorships** — off for now
- [ ] **Preserve this repository** — off
- [x] **Discussions** — on (Q&A space; alternative: leave off until first contributor lands)
- [ ] **Projects** — off (we don't use GitHub Projects)
- [ ] **Wiki** — off (everything lives in `/onboarding/` and `/repos/*/README.md`)

## Branch protection (Settings → Branches → Add rule)

Branch name pattern: `main`

- [x] Require a pull request before merging
- [x] Require status checks to pass before merging
  - Required check: `validate / yaml`
  - Required check: `validate / links`
- [x] Require branches to be up to date before merging
- [ ] Require signed commits — off (overkill for a docs repo)
- [x] Do not allow bypassing the above settings

## Issue labels (Issues → Labels → New label)

| Label | Color (hex) | Description |
|---|---|---|
| `pattern-request` | `#0E8A16` (green) | Proposing a new agentic UX pattern |
| `gap-proposal` | `#D93F0B` (red-orange) | Proposing a new entry in the Trust Gap Taxonomy |
| `debate` | `#5319E7` (purple) | Vocabulary, ID, or framework structure change |
| `schema` | `#1D76DB` (blue) | YAML schema bug, ambiguity, or change |
| `bug` | `#B60205` (deep red) | Something is broken |
| `good first issue` | `#7057FF` (light purple) | Beginner-friendly contribution |
| `help wanted` | `#008672` (teal) | Maintainers welcome help here |

GitHub creates `bug`, `good first issue`, and `help wanted` by default — keep them, just verify the colors match your scheme. Add the four custom ones (`pattern-request`, `gap-proposal`, `debate`, `schema`) manually.

## Social preview (optional, Settings → General → Social preview)

Recommended: 1280×640 PNG.
Background: white or off-white.
Text suggestion:

> **AUX**
> Agentic User Experience
>
> *Patterns, heuristics, and trust systems for AI products.*
>
> github.com/auxfirst

If you don't have one ready, GitHub auto-generates a default — fine for soft launch, replace before announcing on LinkedIn.

## Pinned items (org page, github.com/auxfirst → Pinned section)

Pin these in this order once they exist:
1. `auxfirst/trustkit` — the hub (this repo)
2. `auxfirst/aux-audit` — when the CLI ships
3. `auxfirst/trust-gap-classifier` — when ready
4. (open slot)
5. (open slot)
6. (open slot)
