# How we will judge any agent we ship or buy

*Executive brief · auxfirst · v0.1*

**Source.** This page adopts **AUX** — an open standard for agentic UX published at **github.com/auxfirst**. Schemas + heuristics are CC BY 4.0; CLIs are MIT. Forkable. Citable. Not vendor-locked.

This is the one-page version. The framework is open-standard and forkable.

---

## The standard

We adopt the **AUX framework**: 10 heuristics for agentic UX + a 4-stage Trust Architecture. Both are published as editable YAML schemas. Every claim carries a reproducible example.

## How we grade

Every agent product — shipped or purchased — is scored on two independent axes:

1. **Trust Architecture** — Functional → Contextual → Judgment → Advocacy. A product cannot earn stage N+1 without proving stage N.
2. **10 AUX Heuristics** — Intent, transparency, steering, dynamic trust, boundaries, uncertainty, assertiveness, context, multi-agent, consistency. Scored 0–3 each.

**Load-bearing rule.** Trust loss does not cascade gracefully. A single Advocacy violation can collapse trust all the way to Functional.

## The merge gate

Five of the ten heuristics are merge-blocking in CI: intent visibility, steering, boundaries, uncertainty, assertiveness. A high-severity regression against any of them blocks the release.

## The vendor rubric

One question per heuristic. One score per question. One notebook per vendor. A vendor scoring ≤1 on uncertainty or assertiveness is carrying **advocacy risk we will own.**

## What we ship with every product

1. A **Trust Contract** — what the agent will, won't, and will-always-ask before doing.
2. A **Memory Policy** — scopes, retention, user controls — in the same language.
3. An **audit report** — scored, grade-assigned, reproducible, diffable.
4. A **named gap list** — every known failure mode, with a fix patterns assigned.

## What this protects us from

- "Are our agents trustworthy?" — answered with a number and a diff, not a vibe.
- Vendor lock-in — the scoring framework is open standard; we can re-grade anyone.
- Compliance landmines — memory policies are machine-readable and auditable.
- Model-update regressions — audits rerun, regressions show up in CI.

---

## Next step

Adopt the framework with a 90-day pilot on one product. At day 90, the product has: an agent spec, a Trust Contract, a memory policy, a passing CI audit, and a published teardown (internal). If that's useful, expand.

---

<sub>Source: auxfirst · aux-frameworks, aux-audit · CC BY 4.0.</sub>
