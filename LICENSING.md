# Licensing

TrustKit is dual-licensed by artifact type. GitHub’s license detector reads
[`LICENSE`](LICENSE), which is the unmodified **CC BY 4.0** legal code.

| Artifact | License | File |
|---|---|---|
| Definitions: schemas, onboarding, vocabulary, patterns, teardowns metadata | **CC BY 4.0** | [`LICENSE`](LICENSE) |
| Executable tooling: `packages/aux-audit`, `action.yml` | **MIT** | [`packages/aux-audit/LICENSE`](packages/aux-audit/LICENSE) |
| Teardown *content* under `repos/agent-ux-teardowns/teardowns/` (when added) | **CC BY-NC 4.0** | declared in that tree |

The bundled YAML under `packages/aux-audit/schemas/` is a copy of the canonical
definitions and remains **CC BY 4.0**, even though the CLI that reads it is MIT.
