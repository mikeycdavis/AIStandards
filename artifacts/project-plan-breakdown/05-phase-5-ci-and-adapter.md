# 05 — Phase 5: CI, containers and the adapter

**Status:** not-started
**Depends on:** Phase 4
**Blocks:** Phases 6–7

## Purpose

Make the pack reproducibly verifiable and structurally enforceable. Adapter work here proves **schema
conformance only** — not integration.

## Deliverables

- `scripts/pipeline.mjs` — `STAGES`, the single source of truth for CI
- `ci/Dockerfile` (`node:20-bookworm` pinned by sha256, no install step), `compose.ci.yml`
  (`network_mode: none`, no volumes, no bind mounts), `.dockerignore`, `.gitattributes`
- `scripts/ci.sh` / `ci.ps1`, `ci-context.sh` / `.ps1`, `submit-gate.mjs`
- Three workflows; the dogfood workflow pinned to a 40-character SHA
- `standards-adapter.json` — `standard.id` `"ai"`, `schemaVersion` `1.1.0`
- Vendored `schemas/standards-adapter.schema.json` and `artifacts/adapter-contract-provenance.json`
- `scripts/adapter.mjs`, `scripts/diagrams.mjs`
- `docs/local-ci.md`, `docs/adoption-flow.mmd`

## Acceptance Criteria

- [ ] Containerized CI passes from a clean clone with only Docker and git
- [ ] A dirty tree is refused; a linked worktree is refused
- [ ] `artifacts/local-ci/latest.json` is produced **inside** the container; a pass without it is exit 2
- [ ] The adapter validates against the vendored schema and agrees with the code's `STATUS` set in
      both directions
- [ ] The pack-side conformance test **executes the adapter's own declared argv** against a fixture
      target and asserts the returned top-level `status` is in the declared vocabulary
- [ ] The workflow ↔ `STAGES` test fails when either side is mutated
- [ ] No workflow and no Dockerfile contains an install step

## Verification

```bash
./scripts/ci.sh
node scripts/test.mjs
```

## Dependencies

Phases 1–4. The `--policy` flag and target-relative resolution from Phase 1 are what make a
conformant `1.1.0` adapter expressible at all.

## Limit

Enforcer-side conformance remains unproven after this phase. Schema conformance is not integration.
