# Anti-pattern · Hedging everything

What it looks like:

```
User: What's our refund window?
Agent: I believe it may be around 30 days, though I'm not entirely certain
       and you may want to verify this with the policy team.

User: And what's 14 days after March 3rd?
Agent: That would likely be March 17th, but please double-check my arithmetic.

User: Is the customer's account active?
Agent: Based on what I can see, it appears the account might be active,
       though I'd recommend confirming.
```

## Why this is not Confidence Cues

- **The band never changes, so it carries no information.** Three claims with wildly different evidence — a retrieved policy, a deterministic calculation, a live database read — all render identically. A signal that is always on is not a signal.
- **It is derived from nothing.** "I believe", "appears", "might" are tone, not measurement. The agent hedged the date arithmetic, which it computed exactly, and hedged the account status, which it read directly.
- **It offloads the agent's job onto the user.** "Please verify" on every answer means the user must independently check everything, which is the work they delegated in the first place.
- **It is defensive, not honest.** Blanket hedging protects the agent from being wrong. It does not help the user be right.

The mirror image is equally wrong and more common: uniform confidence, where an invented statistic and a cited one arrive in the same flat declarative voice.

## The correct pattern

Measure support, band it, and let the surface differ. The date calculation asserts flatly. The account status cites the read. The refund window either cites the policy doc or says it could not find one — and names the doc it would need.

See **[README.md](./README.md)**.
