# agent-memory-policy

> Generate memory governance policy + system-prompt snippets from a single config. The bridge between product, compliance, and devs.

Memory is where agent UX and compliance collide. Product wants persistence, legal wants retention limits, devs want clarity. This tool gives all three a single source of truth.

## One config, three outputs

**Input** — `memory.yaml`:

```yaml
product: "Support Copilot v2"
memory:
  scopes:
    - name: preferences
      retention: P90D
      purpose: "personalise tone and language"
      user_visible: true
      user_editable: true
    - name: conversation_history
      retention: P30D
      purpose: "resume sessions"
      user_visible: true
      user_editable: true
    - name: escalation_notes
      retention: P365D
      purpose: "improve handoff quality"
      user_visible: false
      user_editable: false
  deletion:
    on_user_request: immediate
    on_account_close: P7D
  disclosure:
    surface: "settings > memory"
    surface_first_run: true
```

**Outputs**:

1. **`policy.md`** — human-readable memory governance policy. Linkable from your product's settings page.
2. **`system-prompt.snippet.md`** — a snippet to paste into the agent's system prompt that declares what it remembers and for how long.
3. **`compliance.json`** — machine-readable record (retention clocks, scopes, lawful basis hooks) for your compliance team.

## Run it

```bash
npx agent-memory-policy gen ./memory.yaml --out ./dist
```

## Why one config

Today, memory is described in three places that drift: a slide in a product deck, a paragraph in a privacy page, and a fuzzy line in a system prompt. When they drift, users are surprised. Surprise destroys trust.

## Schema

See [`schemas/memory-policy.schema.yaml`](../../schemas/memory-policy.schema.yaml).

Every scope requires: `name`, `retention` (ISO 8601 duration), `purpose`, `user_visible`, `user_editable`. Retention is enforced as a machine-readable duration — not "a while."

## Integrates with

- **[aux-audit](../aux-audit)** — memory config is a required field in the audit spec. No declared memory policy → automatic `severity: high`.
- **[trust-gap-classifier](../trust-gap-classifier)** — `memory_amnesia` and `context_leak` both check against the declared policy.

## Roadmap

- **v0.1** — generate policy.md + system-prompt snippet.
- **v0.2** — diff mode: detect drift between declared and observed memory.
- **v0.3** — region-aware output (EU vs US compliance hooks).

## License

MIT.
