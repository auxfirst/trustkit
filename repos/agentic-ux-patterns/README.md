# agentic-ux-patterns

> Named patterns for agentic UX — one pattern per folder. Definition, diagram, runnable snippet, anti-pattern. No exceptions.

This is a **Reference** repo. Every pattern here:
1. **Closes a named trust gap** in [`trust-gap-taxonomy.yaml`](../../schemas/trust-gap-taxonomy.yaml).
2. **Maps to a heuristic ID** in [`aux-heuristics.yaml`](../../schemas/aux-heuristics.yaml).
3. **Has an anti-pattern** so people know what it isn't.

## Patterns

| Slug | Closes | Heuristic |
|---|---|---|
| **[intent-handshake](./patterns/intent-handshake)** | `tg.judgment.overreach_in_ambiguity` | `aux.H01` |
| **[memory-in-motion](./patterns/memory-in-motion)** | `tg.contextual.memory_amnesia` | `aux.H08` |

## Pattern template

```
/patterns/<slug>/
├── README.md            # what, why, when, how
├── diagram.svg          # one diagram
├── example.{py,ts,...}  # runnable
└── anti-pattern.md      # what this is not
```

## Contributing

See [`CONTRIBUTING.md`](../../CONTRIBUTING.md). A pattern PR is rejected if any of the four files are missing.

## License

CC BY 4.0.
