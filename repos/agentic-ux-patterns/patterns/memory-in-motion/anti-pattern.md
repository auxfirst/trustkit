# Anti-pattern · Silent memory capture

What it looks like:

- The agent infers that the user prefers terse answers and stores `response_style: terse` in a persistent memory scope.
- The user never sees that the inference happened.
- Three weeks later the user gets a string of terse answers and wonders why the agent "changed."
- To fix it, the user must discover there is a settings page, navigate to it, identify the right field, and edit it.

## Why this is not Memory in Motion

- **The user never consented.** Memory captured without notice is assumed against the user, not for them.
- **The write is unverifiable.** The user cannot check whether the capture is correct until it has already produced a surprising output.
- **The fix path is expensive.** Finding a settings page costs more user attention than the original inference saved.

## Tell-tale symptoms

- The word "settings" appears in the mitigation plan.
- The agent's memory has scopes the user has never seen named.
- Support tickets of the form "why did the agent start doing X?"

## The correct pattern

Announce the write at the moment of capture, inline, with **edit** and **forget** affordances. See **[README.md](./README.md)**.
