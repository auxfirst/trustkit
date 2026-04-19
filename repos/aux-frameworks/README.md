# aux-frameworks

> Methodology as code. The AUX discipline — defined as editable, runnable YAML.

`aux-frameworks` is the definition repo: the open standard for evaluating agentic UX. Every framework here is versioned, schema-validated, and meant to be forked.

## What's in here

```
/frameworks
  /aux-heuristics           # the 10 AUX heuristics
    schema.yaml
    heuristics.yaml
  /trust-architecture       # 4-stage trust maturity ladder
    schema.yaml
    stages.yaml
  /aux-evolution-curve      # capability maturity axis
    schema.yaml
    stages.yaml
  /aux-audit                # audit rules derived from the above
    schema.yaml
    rules.yaml
```

## Design principles

1. **Schema first.** Every framework has a JSON/YAML schema. Nothing is prose-only.
2. **Two axes, not one.** Trust and capability are independent. A product can be very capable and very untrusted.
3. **Named, ordered, canonical.** Heuristics have numbers. Stages have order. The language is load-bearing.
4. **Every rule has a failure mode.** If we can't describe what breakage looks like, it doesn't go in.

## Use it

### As a reviewer
Cite the rule ID in PRs and audit notes: `aux.H04` (trust-is-dynamic), `aux.T03` (judgment-trust).

### As a tool builder
Load `frameworks/aux-audit/rules.yaml` into your linter/CI and fail the build on `severity: high` violations.

### As a researcher
Fork, extend, and open a PR. Debates happen in Issues. Merges change the standard.

## Versioning

SemVer on the framework level. Breaking change = renumber or remove a rule. Changes are tracked in `CHANGELOG.md`.

## Related repos

- **[aux-audit](../aux-audit)** — runs these frameworks as a CLI.
- **[trust-gap-classifier](../trust-gap-classifier)** — the failure taxonomy that pairs with Trust Architecture.

## License

CC BY 4.0. Use it. Attribute it. Extend it.
