# Changelog

All notable changes to TrustKit are recorded here. The product version of the
standard is **v0.2**; the first executable (`aux-audit`) is **v0.1**.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

Nothing yet.

## [0.2.0] — 2026-04-19

First public release of the AUX definitions, plus the v0.1 `aux-audit` CLI
that implements the contract those definitions already described.

Draft GitHub release notes: [docs/releases/v0.2.md](docs/releases/v0.2.md).
Publishing the GitHub release and tagging `v0.2` is a manual step after merge.

### Added

- Canonical YAML in `schemas/`: 10 AUX Heuristics, 4-stage Trust Architecture,
  Trust Gap Taxonomy, Trust Contract example, agent-spec and memory-policy
  schemas.
- Audience-routed onboarding (R1–R4) and forwardables A1–A4.
- `packages/aux-audit` — CLI that validates an agent spec, scores the 10
  heuristics, derives the trust ladder from the taxonomy, and emits Markdown,
  JSON, and SARIF 2.1.0.
- GitHub Action at the repository root (`action.yml`). Runs the CLI from this
  checkout by default, so it does not depend on `npm publish`.
- `CITATION.cff` for GitHub’s *Cite this repository* button.
- Project-home links to [auxfirst.com](https://auxfirst.com).

## aux-audit 0.3.0

- **agent-spec v1 declares memory.** A required block, per scope: name, retention,
  visibility, editability, lawful basis, plus a forget mechanism. Shape follows
  `memory-policy.schema.yaml`, so nothing new was invented. `aux.H08` is scoreable
  under v1 and `aux.T02` Contextual Trust is assessable again — the three memory
  gaps in the taxonomy are reachable from a v1 spec.
- Memory the user cannot see costs `aux.H02`; memory they cannot correct costs
  `aux.H03`. Same split v0 made, where `user_editable` fed H03.
- **The audit argues with the spec's claim.** `trust_stage` is compared against the
  computed stage, never used as input. Claiming more than the evidence supports is
  a `high` finding naming what blocks it. Claiming less is reported and nothing more.

## aux-audit 0.2.0

- Scores **agent-spec v1.0**. Both formats are read, detected from the document
  rather than the filename, and `meta.spec_version` records which produced a
  score — they are not comparable.
- Under v1 the rules ask a better question. `aux.H01` and `aux.H03` read
  per-action authority and the five human controls instead of one label;
  `aux.H05` computes the gap between what the credentials permit and what the
  mandate governs; a row enforced by "the system prompt" counts as unenforced.
- `aux.H08` reports *not scoreable* under v1, which has no memory field, rather
  than scoring zero. A trust stage whose entire backing is unscoreable is now
  reported **not assessable** and is never counted as earned — previously an
  empty shortfall read as success on zero evidence.
- v0.1.0 scoring is unchanged.

### Notes

- `agent-spec.schema.yaml` is now v1.0: real JSON Schema draft 2020-12, with a
  per-action `mandate` requiring `enforced_by`. The previous format is frozen as
  `agent-spec.v0.yaml` and is what `aux-audit` 0.1.x still reads; handed a v1
  document, the CLI reports a version mismatch instead of missing fields
  ([#10](https://github.com/auxfirst/trustkit/issues/10)).

- `evolution_stage` is reported as `human-assessed` and is always `null` in
  `aux-audit`. The capability axis is defined in
  `schemas/aux-evolution-curve.yaml` (E01 Reactive → E04 Personally
  Intelligent) and scored by a human in a teardown, not derived from a spec
  ([#5](https://github.com/auxfirst/trustkit/issues/5)).
- Licensing follows one rule: machine-readable definitions are MIT, prose is
  CC BY 4.0. That now covers pattern `example.py` files as well as schemas.
- A spec with no evaluation transcripts is capped at heuristic level 2.
