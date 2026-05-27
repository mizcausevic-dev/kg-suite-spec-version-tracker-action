# kg-suite-spec-version-tracker-action

[![CI](https://github.com/mizcausevic-dev/kg-suite-spec-version-tracker-action/actions/workflows/ci.yml/badge.svg)](https://github.com/mizcausevic-dev/kg-suite-spec-version-tracker-action/actions/workflows/ci.yml)
[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)

GitHub Action that walks a **mixed-protocol** directory of [Kinetic Gain Suite](https://suite.kineticgain.com/) JSON documents (AgentCards, MCP Tool Cards, prompt-provenance, evidence bundles, OTLP traces, MCP `tools/list`), groups each doc by `(protocol, spec_version)`, and **fails the build** when one protocol has ≥ 2 distinct spec versions in use (silent migration debt).

Wraps [`kg-suite-spec-version-tracker`](https://github.com/mizcausevic-dev/kg-suite-spec-version-tracker) — same routing + drift detection, vendored into the action for self-contained execution.

**Cross-protocol governance gate** — different from the per-protocol fleet-summary actions, this one looks at the *fleet of protocols* and catches the case where some teams are on v0.1 of a spec while others are on v0.2.

Part of the [Kinetic Gain Suite](https://suite.kineticgain.com/).

---

## Usage

```yaml
name: Suite spec-version governance
on:
  pull_request:
    paths: ["governance-docs/**"]

jobs:
  spec-tracker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: mizcausevic-dev/kg-suite-spec-version-tracker-action@v0.1-shipped
        with:
          dir: governance-docs/
          fail-on-drift: true   # default
```

## Inputs

| input            | required | default       | description |
|---|---|---|---|
| `dir`            | ✓        | —             | Directory containing `*.json` Suite documents (mixed protocols supported). |
| `comment-on-pr`  |          | `auto`        | `auto` posts only on `pull_request` events; `true`/`false` force the behavior. |
| `fail-on-drift`  |          | `true`        | Fail the run when any protocol has ≥ 2 distinct spec versions in use. |
| `github-token`   |          | `${{ github.token }}` | Token used to post the PR comment. |

## Outputs

| output               | description |
|---|---|
| `total-files`        | Number of JSON files analyzed. |
| `protocols-detected` | Number of distinct Suite protocols detected. |
| `drift-buckets`      | Number of protocols with version drift. |
| `unknown-docs`       | Number of JSON files that did not match any known Suite spec. |

## What it flags

| Code | Severity | Rule |
|---|---|---|
| `version-drift` | 🟠 | A protocol has ≥ 2 distinct spec versions in use (e.g., AgentCard v0.1 + v0.2 mixed). **The fail trigger.** |
| `low-confidence-routing` | 🟡 | A doc was routed by shape signals only (no version discriminator). |
| `unknown-protocol-document` | 🟡 | A JSON file in the dir didn't match any known Suite spec. |
| `no-version-discriminator` | ℹ️ | A doc has no explicit `*_version` field. |

## Composes with

- [**`kg-suite-spec-version-tracker`**](https://github.com/mizcausevic-dev/kg-suite-spec-version-tracker) — the library this wraps.
- [**`kg-protocol-detect`**](https://github.com/mizcausevic-dev/kg-protocol-detect) — the routing primitive used internally.
- [**`kg-suite-conformance-runner`**](https://github.com/mizcausevic-dev/kg-suite-conformance-runner) — companion validator (required blocks per spec).
- [**`agent-card-fleet-summary-action`**](https://github.com/mizcausevic-dev/agent-card-fleet-summary-action) · [**`mcp-tool-card-fleet-summary-action`**](https://github.com/mizcausevic-dev/mcp-tool-card-fleet-summary-action) · [**`prompt-provenance-fleet-summary-action`**](https://github.com/mizcausevic-dev/prompt-provenance-fleet-summary-action) · [**`evidence-bundle-fleet-summary-action`**](https://github.com/mizcausevic-dev/evidence-bundle-fleet-summary-action) — per-protocol governance gates.

## License

[AGPL-3.0-or-later](LICENSE)
