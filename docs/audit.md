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

- **Input:** an agent spec matching [`schemas/agent-spec.schema.yaml`](../schemas/agent-spec.schema.yaml).
- **Output:** `score`, `grade`, `trust_stage`, `issues[]`, `recommendations[]`.
- **Formats:** Markdown (default), JSON, SARIF 2.1.0.
- **Exit codes:** `0` clean · `1` findings at or above `--fail-on` · `2` invalid spec (nothing graded).

The audit grades the **spec**, not the running product. Level 3 (“robust”) is
unreachable without evaluation transcripts. `evolution_stage` stays `null` until
an Evolution Curve schema is published.

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
