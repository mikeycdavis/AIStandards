# 07 — Phase 7: Real StandardsEnforcer integration, then 1.0.0

**Status:** not-started
**Depends on:** Phase 6
**Blocks:** nothing

## Purpose

Establish that the pack is actually enforceable — observed, not inferred — and only then cut 1.0.0.

## Unblocking tasks

Both are currently unknown, and neither is unilateral.

1. **Establish how AIStandards is invoked in a governed pipeline.** StandardsEnforcer ships no gate
   workflow, and its M2 milestone is explicitly not established for GitHub Actions; the CI-integrated
   invocation survives only in a retired file preserved as evidence.
2. **Identify the scope registry and an authorised reviewer.** Registration cannot proceed without a
   `reviewedBy` already present in that registry's `authorisedReviewers`.

## Deliverables

- A tagged `0.9.x` release whose recorded SHA equals `git rev-list -n 1 <tag>` — **not** `rev-parse`
- A scope-registry disposition, held outside the governed repository
- An actual enforcement run
- `artifacts/enforcement/first-run.json` — the run transcript
- First consuming repository adopted via `init`

## Acceptance Criteria — 1.0.0 is cut only when every item is observed

- [ ] A disposition exists in an externally-held scope registry, keyed by platform identity, carrying
      `reviewedBy` (an authorised reviewer), `reviewedAt`, `reason`, and
      `reviewedFootprint{surface, kinds, digest}` — plus `policyPath` on **every** pack's disposition
      if the target is governed by two or more
- [ ] StandardsEnforcer **executes** the adapter against a real target that is not AIStandards, and
      the run completes
- [ ] The status read back is one of the five declared in `result.statuses`
- [ ] **At least one run returns a non-passing status and the enforcer treats it as non-passing** — a
      pack only ever observed to pass has not demonstrated it can fail closed
- [ ] The target's own policy governed the run: `policyPath` resolves under the target, and `project`
      is the target's name, not `AIStandards`
- [ ] The first adoption does **not** flip any rule from failing to passed purely through `init` output
- [ ] The run transcript is committed

## Verification

Enforcer-side. The literal command is unknown until the unblocking tasks are complete; it is recorded
in `docs/release-criteria.md` once known.

## Dependencies

Phase 6, plus two external dependencies this repository does not control.

## Failure handling

If any criterion fails, `VERSION` stays on `0.9.x` and the failure is recorded in
`docs/release-criteria.md`. No criterion is waived, softened, or satisfied by a simulated enforcer, a
stub, or a local re-implementation of one.
