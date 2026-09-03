# Anti-pattern · `WHERE user_id = ?` and calling it scoped

What it looks like:

```python
def recall(query, user_id):
    return store.search(query, filter={"user_id": user_id})
```

Then, in a document being drafted for Client B:

```
Agent: Based on your usual pricing, I'd suggest £48k — that's in line with
       what you agreed with Northgate last quarter.
```

Northgate is a different client. The filter did its job perfectly: it is the
same user.

## Why this is not Memory Policy Scoping

- **It solves tenancy, not context.** Access control answers *who may read this*. Scoping answers *is this appropriate to surface here*. The leak above passes access control cleanly — and is exactly the disclosure that loses the account.
- **The user cannot predict it.** From the outside, memory is one pool with one boundary drawn around the whole person. There is no line the user can point at and say "the agent will not cross this."
- **It fails silently in both directions.** Nothing is withheld, so nothing can be offered. The agent either volunteers Northgate unprompted, or — in a design that does filter — goes quiet without saying it knows something relevant.
- **It cannot be audited.** "Which scope was this learned in" has no answer, because nothing recorded one.

## The correct pattern

Label the write with the boundary the user would recognise, filter the read
through the current one, and surface what was withheld:

```
Agent: I'd suggest £48k for this proposal.
       I have a comparable figure from another client engagement —
       bring it in? [yes] [no]
```

The user now sees the boundary, and chooses whether to cross it. That is a
boundary they can trust, because they watched it hold.

See **[README.md](./README.md)**.
