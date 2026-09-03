# Schemas

These YAML files are the standard. Edit them and `aux-audit` changes with them —
the CLI does not duplicate heuristic text, IDs, or the trust-stage mapping.

| File | What it defines |
|---|---|
| [`schemas/aux-heuristics.yaml`](../schemas/aux-heuristics.yaml) | 10 AUX Heuristics (`aux.H01`–`aux.H10`) |
| [`schemas/trust-architecture.yaml`](../schemas/trust-architecture.yaml) | 4 trust stages (`aux.T01`–`aux.T04`) |
| [`schemas/trust-gap-taxonomy.yaml`](../schemas/trust-gap-taxonomy.yaml) | Named failure modes (`tg.*`) |
| [`schemas/trust-contract.yaml`](../schemas/trust-contract.yaml) | Example Trust Contract |
| [`schemas/agent-spec.schema.yaml`](../schemas/agent-spec.schema.yaml) | Audit input |
| [`schemas/memory-policy.schema.yaml`](../schemas/memory-policy.schema.yaml) | Memory governance |

License: **CC BY 4.0**. See [`LICENSING.md`](../LICENSING.md).

The Evolution Curve is mentioned in
[`onboarding/appendix-a-vocabulary.md`](../onboarding/appendix-a-vocabulary.md)
but is **not** defined here. Do not invent stages in the `aux.` namespace
without an Issue first ([CONTRIBUTING.md](../CONTRIBUTING.md)).
