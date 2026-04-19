# Two patterns. Copy them. Your agents will feel less broken by Friday.

*For solo builders, indie hackers, and one-person internal teams.*

You don't have time for 50 papers. You need two patterns that close the most common trust gaps, with code you can paste into whatever stack you're using tonight.

---

## Pattern 1 · Intent Handshake

Closes: **aux.H01 Visibility of intent** and **tg.judgment.overreach_in_ambiguity**.

**What it is.** Before the agent executes a multi-step plan, it shows the plan — and waits for confirmation when the stakes are non-trivial.

**Why it works.** Overreach-in-ambiguity is almost always a silent failure mode. The user can't tell the agent misread until the damage is done. A one-second preview surfaces disagreement *before* action.

**Minimal code:**

```python
def intent_handshake(plan, user, stakes):
    if stakes == "low":
        return plan  # execute silently
    preview = render_plan(plan)           # human-readable, 1–3 lines
    reply = ask_user(preview, options=["ok", "edit", "cancel"])
    if reply == "edit":
        return amend(plan, ask_user("what to change"))
    if reply == "cancel":
        return None
    return plan
```

**Anti-pattern.** "Shall I continue?" after every tool call. That's not a handshake — that's friction. Gate by stakes, not by step count.

Canonical version with full examples: **[repos/agentic-ux-patterns/patterns/intent-handshake](../repos/agentic-ux-patterns/patterns/intent-handshake/README.md)**.

## Pattern 2 · Memory in Motion

Closes: **aux.H08 Context efficiency** and **tg.contextual.memory_amnesia**.

**What it is.** The agent visibly updates its stored memory of the user in front of the user — at the moment the new information arrives — and gives the user a one-click edit.

**Why it works.** Memory amnesia is rage-inducing because it's invisible *until* it fails. Showing the write-event turns memory from a black box into a live contract.

**Minimal code:**

```python
def memory_in_motion(new_fact, user, memory):
    delta = diff(memory.get(user), new_fact)
    if delta.is_empty(): return
    memory.update(user, new_fact)
    notify(user, f"Got it — I'll remember: {delta.summary}. [edit] [forget]")
```

**Anti-pattern.** Writing to memory silently and asking the user to go to a settings page to inspect it. That's not memory — that's surveillance with a UI.

Canonical version: **[repos/agentic-ux-patterns/patterns/memory-in-motion](../repos/agentic-ux-patterns/patterns/memory-in-motion/README.md)**.

## Three gaps to watch for in a solo build

You'll hit these three before you hit anything else. Name them when you see them, fix them with the patterns.

1. **memory_amnesia** — the agent forgets a preference the user explicitly set. → Pattern 2.
2. **overreach_in_ambiguity** — the agent acts on a vague instruction. → Pattern 1.
3. **confident_nonsense** — the agent commits to a wrong read of the situation. → Add confidence cues + an "I'm not sure" branch to your prompt.

## Take this with you

**[forwardables/A4-two-patterns.md](forwardables/A4-two-patterns.md)** — a self-contained gist with both patterns as runnable code, ready to send.

---

<sub>**If you're also grading your own work →** see **[R3 · for engineering](for-engineering.md)**. Back to **[router](README.md)**.</sub>
