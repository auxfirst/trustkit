# Licensing

TrustKit is licensed by artifact type, on one rule:

> **Machine-readable definitions are MIT. Prose is CC BY 4.0.**

If a file is something you embed, vendor, parse, or generate from, it is MIT
and carries no attribution condition. If it is something you read, it is
CC BY 4.0 and attribution is the price.

GitHub's license detector reads the root [`LICENSE`](LICENSE), the unmodified
CC BY 4.0 legal code, so the repository badge says **CC BY 4.0**. That covers
the prose, which is most of the repository by volume. It does not describe
`schemas/`, which is MIT — see the table.

| Artifact | License | File |
|---|---|---|
| **Schemas** — every `.yaml` under [`schemas/`](schemas/) | **MIT** | [`schemas/LICENSE`](schemas/LICENSE) |
| **Pattern examples** — `example.py` under [`repos/agentic-ux-patterns/`](repos/agentic-ux-patterns/) | **MIT** | `SPDX-License-Identifier` in each file |
| **Executable tooling** — `packages/aux-audit`, `action.yml` | **MIT** | [`packages/aux-audit/LICENSE`](packages/aux-audit/LICENSE) |
| **Prose** — onboarding, vocabulary, pattern write-ups and diagrams, architecture, this file | **CC BY 4.0** | [`LICENSE`](LICENSE) |
| **Teardown content** under `repos/agent-ux-teardowns/teardowns/` (when added) | **CC BY-NC 4.0** | declared in that tree |

## Why the schemas are MIT

The point of publishing the heuristics, the trust ladder, and the gap taxonomy
as YAML is that other people put them **inside** things — a CI check, a linter,
a scoring service, a product's own config. Creative Commons says plainly that
its licenses are not intended for software, and many legal teams will not
approve CC-licensed files in a codebase. A license that makes a corporate
adopter open a ticket is a license that loses the adoption.

Attribution is still wanted, and [`CITATION.cff`](CITATION.cff) makes it
one click. It is just not a condition of use.

## What this means in practice

- **Vendoring `aux-heuristics.yaml` into a closed-source product** — fine, MIT.
- **Copying a pattern's `example.py` into your agent** — fine, MIT. That is what it is for.
- **Shipping a tool that bundles the schemas** — fine, MIT, which is why the
  copies under `packages/aux-audit/schemas/` need no separate carve-out.
- **Quoting the onboarding docs in a blog post** — CC BY 4.0, so credit
  auxfirst and link back.
- **Reselling a teardown** — no; teardown content is CC BY-NC 4.0.
