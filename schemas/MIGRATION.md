# Agent Spec — migrating from v0.1.0 to v1.0

**TL;DR** — v0.1.0 still works and is not going away this year. v1.0 exists
because v0.1.0 contradicts the doctrine this repository publishes. If you have
v0 specs, run the converter, then spend an hour on the TODOs it leaves. The
hour is the migration.

```bash
python3 schemas/migrate-v0-to-v1.py your-spec.yaml
python3 schemas/validate.py your-agent.agent-spec.yaml
```

---

## Why v1.0 exists

v0.1.0 was written as an input format for `aux-audit`, before the Agent Owner's
Manual and the Action Heat Ladder were published. Two of its fields are now at
odds with what auxfirst tells everyone else to do.

### 1. `autonomy` was one label for the whole agent

```yaml
# v0.1.0
autonomy:
  type: enum
  values: ["human-in-the-loop", "human-on-the-loop", "autonomous"]
  required: true
```

The [Agent Owner's Manual](https://auxfirst.com/agent-owners-manual.html) is
explicit about this:

> Avoid vague descriptions such as *semi-autonomous*. Define authority for
> specific actions instead.

An agent that can read a CRM, draft an email and send an invoice does not have
one autonomy level. It has three, and the third is the one that matters. A
single label averages them, and averaging is what the Action Heat Ladder exists
to stop:

> An action is as hot as its hottest dimension. No averaging.

v1.0 replaces the field with a `mandate` array — one row per verb the agent can
reach, each with an authority of `autonomous`, `human_approval`, `human_only`
or `prohibited`.

### 2. `guarantees` were promises, not controls

```yaml
# v0.1.0
guarantees:
  - "will always ask before sending external email"
```

That sentence is true right up until a prompt injection, a model upgrade, or a
refactor that grants the send scope. The repository's own rule:

> Enforcement lives in a mechanism, not in a prompt.
> A recommendation is not a control.

v1.0 requires `enforced_by` on every mandate row. The row above becomes:

```yaml
# v1.0
- action: Send external email
  authority: human_approval
  enforced_by: Send scope withheld from the token until approval is issued
  approver: Named support lead
```

The schema **rejects** a row without `enforced_by`. That refusal is the feature.

### 3. `$schema` was used as a container

v0.1.0 puts a custom notation under the key `$schema`, which is reserved in
JSON Schema. Any JSON Schema tool misreads the file. v1.0 is a real JSON Schema
(draft 2020-12) and validates with `jsonschema`, in editors, and in CI.

---

## What the converter does, and what it refuses to do

```
python3 schemas/migrate-v0-to-v1.py support-copilot.yaml
```

Writes two files:

| Output | Why two |
|---|---|
| `<slug>.agent-spec.yaml` | The v1.0 spec |
| `<slug>.memory-policy.yaml` | v0's `memory` block, moved to its own document — memory governance is its own concern, see `memory-policy.schema.yaml` |

### Carried over mechanically

| v0 | v1 | Note |
|---|---|---|
| `name` | `name` | |
| `version` | `version` | Added to v1 for this migration |
| `surface` | `surface` | Added to v1 for this migration |
| `tools` | `mandate[].action` | One row per tool, authority left blank |
| `memory.persistent` | memory policy, `classes[].persistent` | |
| `memory.retention` | memory policy, `ttl_days` | ISO-8601 duration parsed to days |
| `memory.user_visible` | memory policy, `must_be_visible` | |
| `memory.user_editable` | memory policy, `editable` | |
| `memory.scopes` | memory policy, `retained_categories` | **Not** `scope.levels` — see below |

### Deliberately not guessed

The converter leaves a `TODO` rather than inventing an answer for:

- **`purpose`** — v0 had no field for why the agent exists
- **`owners`** — two named people, business and technical. v0 recorded neither
- **`trigger`** — what starts a run
- **`systems`** and **`capability`** — what the credentials actually permit,
  which is nearly always broader than the mandate. That difference is the
  attack surface
- **every `authority` and `enforced_by`** — this is the migration
- **`human_control`** — the five forms. v0 recorded none
- **`exceptions`** — v0 had no failure design at all
- **`shutdown.tested`** — starts `false`, because an untested kill switch is a
  claim rather than a control
- **memory `scope.default`** — v0 recorded *what* was retained but never *how
  far it may travel*

A converted file **will not validate** until these are resolved. That is
intended. A migration that produced a passing file would have invented the
answers, and the answers are the point.

### One trap worth naming

v0's `memory.scopes` and v1's `scope.levels` sound alike and are different
axes. `scopes: [preferences, conversation_history]` says **what** is retained.
`levels: [user, team, tenant, global]` says **how far it may travel**. The
converter maps the first to `retained_categories` and leaves the second as a
TODO, because conflating them is how `tg.contextual.context_leak` happens.

### Not carried over

`flows` belong to the storyboard artifact and `evaluation.*_transcripts` to the
evaluation suite. Keep the paths; they do not belong in the agent spec. The
converter says so in its report rather than dropping them silently.

---

## Reading your old `autonomy` value

The converter prints a hint. It is a hypothesis to test, never an answer:

| v0 value | Likely v1 shape |
|---|---|
| `human-in-the-loop` | Most rows `human_approval`; read-only rows are candidates for `autonomous` |
| `human-on-the-loop` | A mix — `autonomous` for reads and drafts, `human_approval` for anything that leaves the building |
| `autonomous` | Every row needs a deliberate decision. This is where the migration most often surfaces a surprise |

If filling in the mandate changes your mind about what the agent should be
allowed to do, the migration has already paid for itself.

---

## Timeline

| Date | What |
|---|---|
| 2026-09-04 | v1.0 published. v0.1.0 renamed to `agent-spec.v0.yaml`, frozen |
| — | `aux-audit` reads v0.1.0 until it learns v1.0 |
| No earlier than 2027-03-01 | `agent-spec.v0.yaml` removed, and only after `aux-audit` reads v1.0 |

v0.1.0 receives bug fixes only — no new fields. Nothing you have stops working
today.

---

## Worked example

The `example` block inside `agent-spec.v0.yaml` ("Support Copilot v2") converts
to five mandate rows: three from `tools`, two from `guarantees`. All five need
an authority and a mechanism, and the converter reports ten decisions it could
not make.

That number is not a criticism of the old spec. It is the difference between
describing an agent and being able to operate one.
