# Two patterns · copy-paste

*auxfirst · v0.1 · for solo builders and indie hackers*

Two patterns, two anti-patterns, two runnable snippets. That's it.

---

## Pattern 1 · Intent Handshake

Closes: the agent acted on an ambiguous instruction and the user only noticed after the damage.

```python
def intent_handshake(plan, user, stakes):
    if stakes == "low":
        return plan
    preview = render_plan(plan)          # 1–3 lines, human-readable
    reply = ask_user(preview, ["ok", "edit", "cancel"])
    if reply == "cancel": return None
    if reply == "edit":   return amend(plan, ask_user("what to change?"))
    return plan
```

**Preview format:**

```
I'll do 3 things:
  1. Look up order #4831
  2. Draft a refund email
  3. Queue it for your review (won't send)
[ok] [edit] [cancel]
```

**Anti-pattern.** "Shall I continue?" after every tool call. Gate by stakes, not by step count.

---

## Pattern 2 · Memory in Motion

Closes: the agent silently stored a fact about the user, which only surfaced in a surprising output three weeks later.

```python
def memory_in_motion(new_fact, user, memory, notify):
    delta = diff(memory.get(user), new_fact)
    if delta.is_empty(): return
    memory.update(user, new_fact)
    notify(user, f"Got it — I'll remember: {delta.summary}.",
           actions=["edit", "forget"])
```

**Notification format:**

```
💡 Got it — I'll remember: you prefer responses in British English.
[edit] [forget]
```

**Anti-pattern.** Writing to memory silently and hiding the result behind a settings page.

---

## Three gaps you'll hit first

1. **memory amnesia** → Pattern 2.
2. **overreach in ambiguity** → Pattern 1.
3. **confident nonsense** → add confidence cues and an "I'm not sure" branch.

---

<sub>Full canonical versions: **github.com/auxfirst/agentic-ux-patterns**.</sub>
