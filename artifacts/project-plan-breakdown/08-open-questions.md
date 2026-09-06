# 08 — Open questions and known unknowns

**Status:** open
**Generated:** 2026-09-03, as post-reconstruction evidence

Only genuine unknowns are listed. Anything resolvable by inspection was resolved and is recorded as
resolved rather than carried as a question.

## Resolved by inspection on 2026-09-03

| Question | Resolution |
|---|---|
| Does the enforcer reserve the contract id? | **No.** A case-insensitive search finds no `ai-engineering`, and **no code enforces uniqueness at all** — `scope.mjs` states "Nothing in this file may know which packs exist." The id is set to `ai`, following the family's repository-name derivation. A collision would not error; the disposition would silently never resolve |
| How is a new pack registered? | An edit to an externally-held scope registry, not a change to StandardsEnforcer. It has no onboarding guide and no "add a pack" entry point, by design |
| Is StandardsOrchestrator usable as an authority? | **No.** `FROZEN.md`: "must not be adopted as one." Frozen 2026-08-10 at v1.0.0 |
| Is an adapter-less pack gracefully skipped? | **No.** `ENFORCEMENT_ERROR`, `passing: false`, exit 4, explicitly not `EVALUATED` |

## Genuinely open

### Q1 — How is AIStandards invoked in a governed pipeline? — **blocks Phase 7**

StandardsEnforcer ships no gate workflow, and M2 is explicitly not established for GitHub Actions. The
CI-integrated invocation exists only in a retired evidence file.
**Impact if unanswered:** Phase 7 cannot start and 1.0.0 cannot be cut. Not answerable from this
repository.

### Q2 — Which scope registry, and which authorised reviewer? — **blocks Phase 7**

Registration requires a `reviewedBy` already present in the registry's `authorisedReviewers`, plus a
`reviewedFootprint` digest.
**Impact if unanswered:** no disposition can be filed. Requires a human decision about governance
ownership.

### Q3 — Is EngineeringStandards' adapter-less state intentional?

ES has no adapter **and no tag at all**, so it cannot form an identity triple. Nothing in
StandardsEnforcer records a decision either way. The owner has directed treating it as unresolved
legacy, which does not require the answer.
**Impact if unanswered:** none on this plan. Recorded for completeness.

### Q4 — Do MachineLearningStandards' maintainers accept `boundary.ml-pack-required`?

The adapter contract has no composition field, so the ML dependency is expressed as a rule instead.
That is unilateral until they agree.
**Impact if unanswered:** the mechanism works regardless, but the boundary is asserted rather than
negotiated.

### Q5 — Should AIStandards also adopt EngineeringStandards as a consumer?

It would carry its own `project-policy.yml` pinning ES 2.0.0 alongside `ai-policy.yml`. The structure
allows it; nothing requires it.
**Impact if unanswered:** none before Phase 6.

### Q6 — The `node:20-bookworm` sha256 digest

Must be read from a registry during Phase 5, never copied from memory.
**Impact if unanswered:** Phase 5 only.

## Not questions

Per-shard rule counts are a plan, not a measurement. The catalog does not exist yet, and
`inventory.mjs` is what will make those numbers true. They are not listed as unknowns because nobody
else can answer them — they are answered by doing the work.
