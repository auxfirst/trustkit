# aux-audit

Score an agent product against the 10 AUX Heuristics and the Trust Architecture.

```bash
npm --prefix packages/aux-audit ci
npm --prefix packages/aux-audit run build
node packages/aux-audit/dist/cli.js run ./agent-spec.yaml
```

Once the package is on npm:

```bash
npx aux-audit run ./agent-spec.yaml
```

## Contract

- **Input:** an agent spec matching [`schemas/agent-spec.v0.yaml`](../schemas/agent-spec.v0.yaml). The canonical [`agent-spec.schema.yaml`](../schemas/agent-spec.schema.yaml) is now v1.0; aux-audit 0.1.x does not score it yet and says so plainly rather than reporting missing fields — see [MIGRATION.md](../schemas/MIGRATION.md) and [#10](https://github.com/auxfirst/trustkit/issues/10).
- **Output:** `score`, `grade`, `trust_stage`, `issues[]`, `recommendations[]`.
- **Formats:** Markdown (default), JSON, SARIF 2.1.0.
- **Exit codes:** `0` clean · `1` findings at or above `--fail-on` · `2` invalid spec (nothing graded).

The audit grades the **spec**, not the running product. Level 3 (“robust”) is
unreachable without evaluation transcripts. `evolution_stage` is always `null`:
capability is what a product *does*, which a spec cannot state, so it is
assessed by a human in a teardown ([#5](https://github.com/auxfirst/trustkit/issues/5)).

## GitHub Action

```yaml
- uses: auxfirst/trustkit@v0.2
  with:
    spec: ./agent-spec.yaml
    fail-on: high
```

Default `version: local` runs the CLI shipped in this repository. Pin a semver
only after `aux-audit` is published to npm.

Copy-paste workflow: [`onboarding/forwardables/A3-aux-audit.yml`](../onboarding/forwardables/A3-aux-audit.yml).

Package README: [`packages/aux-audit/README.md`](../packages/aux-audit/README.md).
