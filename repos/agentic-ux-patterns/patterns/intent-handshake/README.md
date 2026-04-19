# Pattern · Intent Handshake

> Before the agent executes, it shows the plan. When the stakes warrant, it waits for a green light.

- **Heuristic:** `aux.H01` Visibility of Agent Intent & Action
- **Closes gap:** `tg.judgment.overreach_in_ambiguity`
- **Trust stage:** `aux.T03` Judgment

## What it is

A two-step structure around any multi-step, non-trivial agent action:

1. **Preview** — the agent renders its plan in 1–3 human-readable lines.
2. **Commit** — for low-stakes actions, it proceeds; for non-trivial stakes, it waits for one of `ok / edit / cancel`.

## Why it works

The dominant failure mode at the judgment stage is **silent overreach**: the agent commits to a wrong reading of an ambiguous instruction, and the user only notices after the effect. A preview is the cheapest possible intervention — it surfaces disagreement before action, not after.

## When to use it

- Multi-step plans (≥3 tool calls).
- Any external side-effect (email, payment, ticket creation).
- Any novel tool-use combination the agent hasn't attempted for this user before.

## When NOT to use it

- Single-step, reversible, internal actions (e.g. reading from a knowledge base).
- High-frequency, low-stakes loops — gating these is the **[anti-pattern](./anti-pattern.md)**.

## Minimal implementation

```python
def intent_handshake(plan, user, stakes):
    if stakes == "low":
        return plan

    preview = render_plan(plan)                    # 1–3 lines, human-readable
    reply = ask_user(preview, ["ok", "edit", "cancel"])

    if reply == "cancel":
        return None
    if reply == "edit":
        return amend(plan, ask_user("what should change?"))
    return plan
```

### Plan preview format

```
I'll do 3 things:
  1. Look up order #4831 in CRM
  2. Draft a refund email to customer
  3. Queue it for your review (won't send)
[ok] [edit] [cancel]
```

Note the **last line**: "won't send." Every preview should name what the agent **won't** do as well as what it will — that's where trust is earned.

## Stake heuristics

| Action | Stakes | Handshake? |
|---|---|---|
| Read from KB | low | no |
| Draft a response | low | no |
| Send external email | high | yes |
| Create a ticket | medium | yes (can be one-shot "yes, always" per user) |
| Charge / refund | high | yes, always |
| Delete data | critical | yes, always, with typed confirmation |

## Anti-pattern

See **[anti-pattern.md](./anti-pattern.md)**.

TL;DR: "Shall I continue?" after every tool call is not a handshake. It's friction. Gate by stakes, not by step count.
