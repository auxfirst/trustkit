# Anti-pattern · "Shall I continue?" after every tool call

What it looks like:

```
Agent: I'll search for the order.
User: ok
Agent: Found it. Shall I continue?
User: ok
Agent: I'll draft the response.
User: ok
Agent: Drafted. Shall I continue?
User: ok
Agent: Saved as draft. Shall I continue?
```

## Why this is not an Intent Handshake

- **It gates by step count, not by stakes.** Reading from a KB and sending an external email are gated identically.
- **It surfaces no intent.** "Shall I continue?" tells the user nothing about what the agent is about to do.
- **It teaches users to click through.** After the third "ok," the user is rubber-stamping — which means the *one* prompt that actually matters (the external email) is also rubber-stamped.

## The correct pattern

Gate **once**, with full preview, at the stake threshold. Do not gate again unless the plan changes materially.

See **[README.md](./README.md)**.
