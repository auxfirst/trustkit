---
name: Schema issue
about: Bug, ambiguity, or proposed change in a YAML schema
title: "[schema] <schema-file>: <one-line>"
labels: schema
assignees: ''
---

## Schema file

Which file in `/schemas/` does this affect?

- [ ] `aux-heuristics.yaml`
- [ ] `trust-architecture.yaml`
- [ ] `trust-gap-taxonomy.yaml`
- [ ] `trust-contract.yaml`
- [ ] `agent-spec.schema.yaml`
- [ ] `memory-policy.schema.yaml`

## What's wrong

Field name, ambiguity, validation error, missing case, drift between schema
and the docs that reference it.

## Reproduction

If this is a validator failure, paste the YAML snippet that fails and the
exact error.

```yaml
# minimal failing snippet
```

## Proposed change

Concrete — what should the schema look like instead? If this changes an ID,
open a `debate` Issue first per CONTRIBUTING.md.
