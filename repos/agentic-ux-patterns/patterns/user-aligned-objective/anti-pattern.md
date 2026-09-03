# Anti-pattern · The blended score

What it looks like:

```python
def rank(option, user):
    return (
        0.5 * fit_to_usage(option, user)
        + 0.3 * margin(option)              # <- house economics, same formula
        + 0.2 * (1 / option.price)
    )
```

Shipped alongside a footer that reads *"We always recommend what's best for you."*

## Why this is not a User-Aligned Objective

- **The two interests are added together, so neither can be inspected.** Once `margin` is inside the sum, no one can answer "would we have recommended this if we earned nothing on it?" — not the user, not support, not the team that wrote the function. The information is destroyed at the point of addition, not hidden.
- **Divergence becomes undetectable by construction.** There is no moment where the code notices that the house pick and the user pick differ, because it never computes them separately. Nothing can be disclosed, because nothing was ever distinguished.
- **The weight looks defensible and isn't.** 0.3 sounds modest. Across a catalogue where fit scores cluster between 0.6 and 0.8, a 0.3-weighted margin term decides nearly every ranking. Blended weights hide their own influence.
- **The footer is a claim, not evidence.** "We always recommend what's best for you" is exactly what a system optimising 30% for margin would also say. A promise that is equally consistent with its own violation is not a promise.
- **This is what makes it a `loyalty_leak`.** Not malice — arithmetic. Nobody decided to sell the user the wrong plan; the objective function did, quietly, and the disclosure layer had nothing to report because the divergence never had a name.

## The correct pattern

Compute the two separately, let the user's ranking win, and disclose when they
disagreed:

```python
user_pick     = max(options, key=objective.user_value)
platform_pick = max(options, key=objective.platform_value)
# recommend user_pick; if the two differ, say so, and name the other one.
```

Now "would we have recommended this if we earned nothing on it?" has an answer,
and it can be printed.

See **[README.md](./README.md)**.
