# 03 — Phase 3: Detectors and the evidence-availability architecture

**Status:** not-started
**Depends on:** Phase 2
**Blocks:** Phases 5–7

## Purpose

Add the heuristic detectors and — more importantly — the architecture that makes them safe: an
evidence surface recording every way evidence could be lost, and a withdrawal mechanism that turns
loss into `not-evaluated` rather than a clean report.

## Deliverables

- `scripts/repository.mjs` — the git seam
- `scripts/modelrefs.mjs`, `promptassets.mjs`, `pii.mjs`
- `collectFiles()` with the full evidence-surface object; `readText()` returning
  `{ok, text, truncated, bytes}`; `CONTENT_DERIVED_RULES`; `TRUNCATION_DOMAIN`; `run.unknownChecks`
- The remaining judgmental detectors, each with a `$assuranceNote` naming its blind spot
- Every `not-evaluable` and `manual-review` rule finalised with its note
- All bait fixtures

## Acceptance Criteria

- [ ] Every judgmental detector has a provoking **and** a non-provoking fixture
- [ ] Every bait fixture withdraws its rule rather than reporting clean
- [ ] The aggregation truth table is asserted directly
- [ ] The no-silent-pass property test holds across every fixture

## Verification

```bash
node scripts/test.mjs
node scripts/standards.mjs audit test/fixtures/never-clean --json
```

## Dependencies

Phase 2's complete rule catalog.
