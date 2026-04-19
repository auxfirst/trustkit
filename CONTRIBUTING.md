# Contributing to auxfirst

Thanks — but the bar is high. Please read before opening a PR.

## What we accept

- **New patterns** — must come with a diagram, a runnable example, and a matching anti-pattern.
- **New gaps** — must come with a question, a heuristic reference, a trust-stage reference, and a minimal reproducible scenario.
- **Teardowns** — must use the template in `agent-ux-teardowns/_template/` and pass schema validation.
- **Framework edits** — must come with rationale, updated IDs if renamed, and updated examples.

## What we reject (politely)

- "I think X should be added" — without a schema change or a worked example.
- Renaming IDs without a rationale and a migration note.
- Tutorials, think-pieces, marketing copy.
- Patterns without anti-patterns.

## Process

1. **Open an Issue first** for anything that changes an ID or introduces new vocabulary. Use the `debate` or `pattern-request` label.
2. **Fork, branch, PR.** Reference the Issue.
3. **CI must pass.** Every repo has schema validation and a worked-example audit.
4. **Review is in the open.** Debates happen in Issues, not DMs.

## Style

- Short sentences.
- Named things over adjectives.
- Code before prose.
- No emoji in code or schemas.

## Author attribution

Contributors are listed in `CONTRIBUTORS.md` with the IDs / patterns they authored. Language carries credit.

## License

By contributing you agree your contribution is licensed under the repo's declared license (CC BY 4.0 for definition repos, MIT for executable repos, CC BY-NC 4.0 for teardowns).
