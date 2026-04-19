# Pattern · Memory in Motion

> The agent visibly updates its memory *in front of the user*, at the moment new information arrives, with a one-click edit.

- **Heuristic:** `aux.H08` Context Efficiency
- **Closes gap:** `tg.contextual.memory_amnesia`
- **Trust stage:** `aux.T02` Contextual

## What it is

Whenever the agent captures a new fact about the user that will persist across sessions, it **announces the capture in-line** and gives the user two affordances:

- **edit** — change or expand the fact
- **forget** — reject the fact

## Why it works

Memory amnesia is rage-inducing because it's invisible — until it fails. Memory-in-motion makes the write-event observable. That alone:

- Surfaces errors immediately (user sees the wrong fact captured).
- Turns memory from a black box into a live contract.
- Lets the user **trust the system without auditing settings** — because the audit happens inline.

## When to use it

- Any persistent memory write.
- Any preference capture.
- Any inferred fact (the inference step is where most bad memories are born).

## When NOT to use it

- Ephemeral session context (no persistence).
- Updates so frequent that the notice becomes noise — in that case, batch into a "what I learned today" digest.

## Minimal implementation

```python
def memory_in_motion(new_fact, user, memory, notify):
    current = memory.get(user)
    delta = diff(current, new_fact)
    if delta.is_empty():
        return

    memory.update(user, new_fact)
    notify(
        user,
        f"Got it — I'll remember: {delta.summary}.",
        actions=["edit", "forget"],
    )
```

## The notification format

```
💡 Got it — I'll remember: you prefer responses in British English.
[edit] [forget]
```

Rules for the notification:
- **One fact per notification.** Batch only if updates exceed a rate threshold.
- **Plain language.** "British English" beats `locale: en-GB`.
- **Two buttons, always.** Not one, not three.

## Memory scope declaration

This pattern works with — and requires — a declared memory policy. See [`agent-memory-policy`](../../../agent-memory-policy/README.md). Every memory-in-motion write must be in a declared scope, or the write is rejected.

## Anti-pattern

See **[anti-pattern.md](./anti-pattern.md)**.

TL;DR: Writing to memory silently and surfacing it only in a settings page. That's not memory — that's surveillance with a UI.
