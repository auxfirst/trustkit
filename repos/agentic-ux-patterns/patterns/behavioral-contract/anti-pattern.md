# Anti-pattern · Snapshot-testing the prose

What it looks like:

```python
def test_refund_flow():
    out = agent.run("customer wants a refund on order 4831")
    assert out == (
        "I've looked up order #4831. I'll draft a refund email for your "
        "review. I won't send anything without your approval."
    )
```

Six weeks later the suite is red on every run, someone adds `--update-snapshots`
to CI, and the assertion now records whatever the agent did last.

## Why this is not a Behavioral Contract

- **It fails on changes nobody would notice.** "I've looked up" becomes "I looked up" and the build goes red. Nothing about the promise to the user changed.
- **It passes on changes everybody would notice.** Once snapshots auto-update, the day the agent stops saying "I won't send anything without your approval" — and starts sending — the suite records it as the new truth and stays green.
- **It asserts on the wrong layer.** The promise was *"won't send without approval."* The test asserts on a sentence that happens to describe that promise. Those are not the same thing, and only one of them is what the user relies on.
- **It produces no changelog.** Even when it catches something, the output is a diff of two paragraphs, not a statement of which guarantee moved.

## The correct pattern

Assert the property, not the paragraph:

```python
def test_refund_flow():
    out = agent.run("customer wants a refund on order 4831")
    assert not called("email.send", out)      # the actual promise
    assert asks_before_acting(out)
    assert mentions_order(out, "4831")
```

Now a rephrase passes, an unannounced send fails, and the failure names the
guarantee that broke.

See **[README.md](./README.md)**.
