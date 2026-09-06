# 06 — Phase 6: Dogfooding, documentation, and the 0.9.0 release candidate

**Status:** not-started
**Depends on:** Phase 5
**Blocks:** Phase 7

## Purpose

Turn the pack on itself, write the adoption and governance documentation, and cut a release
**candidate** — not 1.0.0.

## Deliverables

- `docs/adoption.md`, `reconstruction.md`, `governance.md`, `review-ownership.md`,
  `release-criteria.md`, `relationship-to-machine-learning-standards.md`,
  `crosswalk-engineering-standards.md`, `not-evaluable.md`, and the short boundary notes
- `INSTRUCTIONS.md`, generated rather than authored
- `CHANGELOG.md`
- An honest `ai-policy.yml` with real applicability reasons and any real exceptions
- `test/self-validate.test.mjs`
- The `validate`-gating decision, made against its stated condition
- `VERSION` → **`0.9.0`**

## Acceptance Criteria

- [ ] This repository's own verdict is recorded and reproducible, **including if it is `NON_COMPLIANT`**
- [ ] Every exception carries a real `approvedBy` and `approvedAt`, or does not exist
- [ ] No rule was lowered, excepted, reclassified as not-applicable, or marked not-evaluable in order
      to reach the verdict — asserted by a diff review recorded in `docs/release-criteria.md`
- [ ] The gating decision and its reason are in the CHANGELOG
- [ ] A second `/codebase-docs` run regenerates `docs/architecture.md` against a real architecture,
      labelled distinctly from the 2026-09-03 pre-implementation baseline

## Verification

```bash
./scripts/ci.sh
node scripts/standards.mjs validate . --json
```

## Dependencies

Phase 5's CI and adapter.

## Why 0.9.0 and not 1.0.0

Everything Phase 5 established about the adapter is schema conformance. That is not evidence the
enforcer can run it. Shipping 1.0.0 on schema validation alone would assert an integration nobody has
observed — the exact class of claim this repository exists to refuse.
