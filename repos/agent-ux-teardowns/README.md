# agent-ux-teardowns

> Structured teardowns of shipped AI products. Receipts, not vibes.

Every teardown is two files: `analysis.md` (the argument) and `score.json` (the numbers). Same structure, every time — so teardowns can be compared, aggregated, and cited.

## What's in here

```
/teardowns
  /chatgpt
    analysis.md
    score.json
  /github-copilot
    analysis.md
    score.json
  /notion-ai
    analysis.md
    score.json
  /claude-projects
    analysis.md
    score.json
```

## Teardown structure

Every `analysis.md`:

1. **The agent's claim** — what the product says it does.
2. **The user's contract** — what the user expects in return.
3. **Where the contract breaks** — named failures from [`trust-gap-classifier`](../trust-gap-classifier).
4. **Heuristic scorecard** — 10 heuristics, scored 0–3, with evidence.
5. **Trust stage** — placed on the Trust Architecture ladder.
6. **The fix** — one concrete pattern that would move it up a stage.

Every `score.json`:

```json
{
  "product": "ChatGPT",
  "version": "4o, 2026-04",
  "trust_stage": "contextual",
  "evolution_stage": "personally-intelligent",
  "heuristics": {
    "aux.H01": 2, "aux.H02": 1, "aux.H03": 3,
    "aux.H04": 2, "aux.H05": 1, "aux.H06": 2,
    "aux.H07": 2, "aux.H08": 3, "aux.H09": 0,
    "aux.H10": 2
  },
  "overall": 18,
  "grade": "C+"
}
```

## Why it matters

- For **devs**: every teardown has a reproducible scenario. No "I felt like…" — there's a transcript.
- For **analysts**: structured scores mean you can say "the category averages 1.4/3 on H09" with a citation.
- For **product teams**: the named gaps and the named fix pattern give you a Monday-morning action.

## Contribute a teardown

1. Copy `_template/` to `/teardowns/<product-slug>/`.
2. Fill in `analysis.md` — every section is required.
3. Fill in `score.json` — schema-validated in CI.
4. Submit a PR. Review happens in the open.

## Schema validation

```bash
npx agent-ux-teardowns validate ./teardowns/**
```

Fails on missing sections, invalid heuristic IDs, or out-of-range scores.

## License

CC BY-NC 4.0 — attribute, non-commercial. Fork, cite, don't resell.

## Related

- **[aux-frameworks](../aux-frameworks)** — the scorecard definitions.
- **[trust-gap-classifier](../trust-gap-classifier)** — the gap names referenced in analyses.
