# Anti-pattern · The polite dead end

What it looks like:

```
User: The refund is £780, above your limit. Can you get it approved?
Agent: I'm not able to help with that. Please contact our support team
       for further assistance.
```

Or, wearing a routing label:

```
Agent: I've created ticket #99412 for you.
```

...and the ticket body reads, in full: *"Customer enquiry via assistant."*

## Why this is not an Escalation Handoff

- **The destination is not a place.** "Our support team" is not something the user can picture, reach, or estimate. They now have a second task: find out who that is.
- **The context is dropped.** The agent had the order number, the amount, the purchase date, and a completed policy check. All of it is discarded. The user re-tells the story to a human who starts from zero — which is precisely the work they came to avoid.
- **The agent's read is missing.** The agent had concluded the refund qualified and that the only blocker was the amount. That single sentence would let a supervisor approve in one click. It is not passed on.
- **Nobody said the user is done.** After a dead end, the user does not know whether to wait, chase, or start again. Most start again, in a different channel, which is how one blocked task becomes three.
- **The ticket variant is worse than the refusal**, because it looks resolved. The user waits on a queue entry that contains nothing anyone can act on.

## The correct pattern

Name the blocker, name the destination, hand over everything already gathered,
state what the agent would have done, and tell the user they can stop:

```
I can't approve above £500 — that needs a supervisor.
Routed to the Billing supervisor queue with the order, the policy check,
and my read that this qualifies. Typical response under 2 hours.
You don't need to repeat any of it.
```

See **[README.md](./README.md)**.
