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

### Notes

- `evolution_stage` is reported as `schema-undefined`. The Evolution Curve is
  referenced in docs but has no schema; the CLI will not mint `aux.` IDs.
- A spec with no evaluation transcripts is capped at heuristic level 2.
