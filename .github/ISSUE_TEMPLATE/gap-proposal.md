---
name: Gap proposal
about: Propose a new failure mode for the Trust Gap Taxonomy
title: "[gap] <tg.family.name, e.g. 'tg.memory.amnesia'>"
labels: gap-proposal
assignees: ''
---

## Proposed ID

`tg.<family>.<name>` — must follow the taxonomy in
`schemas/trust-gap-taxonomy.yaml`.

## One-line definition

A single sentence the way it would appear in the schema.

## Heuristic / trust-stage reference

Which heuristic does this gap violate? (`aux.H01`–`H10`)
Which trust stage does it collapse? (`aux.T01`–`T04`)

## Minimal reproducible scenario

Required. The smallest agent interaction that demonstrates this failure.

```
USER:    <input>
AGENT:   <response that exhibits the gap>
RESULT:  <how trust breaks>
```

## Why this isn't covered by an existing gap

Reference the closest existing entry in `trust-gap-taxonomy.yaml` and
explain the distinction. Gaps that duplicate existing entries are rejected.

## Suggested fix pattern

Optional. If you know the pattern that prevents this gap, name it.
