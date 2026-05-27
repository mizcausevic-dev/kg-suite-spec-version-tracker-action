# Changelog

## v0.1.0 — 2026-05-27

- Initial release: GitHub Action wrapping `kg-suite-spec-version-tracker` as a cross-protocol governance gate.
- Inputs: `dir` (required), `comment-on-pr` (auto/true/false), `fail-on-drift` (default true), `github-token`.
- Outputs: `total-files`, `protocols-detected`, `drift-buckets`, `unknown-docs`.
- Vendored detect + track + format logic — same routing semantics as `kg-protocol-detect`, same drift detection as `kg-suite-spec-version-tracker`.
- Posts per-PR Markdown comment when run on `pull_request` events with a valid token.
- Fails the run (exit 1) when any protocol has ≥ 2 distinct spec versions in use, unless `fail-on-drift: false`.
- Composite Node 20 action with `dist/index.js` committed for SHA/tag pinning.
- 9-document mixed-protocol fixture corpus (every Suite protocol + deliberate v0.1/v0.2 drift on agent-cards-spec).
- Cross-protocol companion to the 4-protocol fleet-summary action quartet.
- Node 20/22 CI (lint, typecheck, coverage, build, `npm audit`), AGPL-3.0-or-later, Dependabot.
