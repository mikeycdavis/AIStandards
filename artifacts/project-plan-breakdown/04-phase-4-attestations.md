# 04 — Phase 4: Attestations, exceptions and staleness

**Status:** not-started
**Depends on:** Phase 3
**Blocks:** Phases 6–7

## Purpose

Build the human-evidence mechanism — deliberately after the automated checks, never before, so the
escape hatch cannot precede the thing it is an escape from.

## Deliverables

- Attestation history in `schemas/ai-policy.schema.json` — append-only, current derived and never
  stored, with `reviewedAgainst{paths, digest, digestAlgorithm, source, revision}`
- `scripts/reviews.mjs`; `scripts/attestations.mjs` (read-only, **no write path**)
- `judgeAttestation()` with the full judgment order
- `FRESHNESS` classification via the git seam
- All policy fixtures covering the attestation matrix

## Acceptance Criteria

- [ ] Every branch of the judgment order is asserted
- [ ] Every `FRESHNESS` value is asserted, including that `legacy-unverifiable` is classified and
      never compared or upgraded
- [ ] An attestation on a `not-evaluable` rule is `failed` / `invalid-attestation`
- [ ] `attestations.mjs` reports "0 safely auto-upgradable" as a structural fact and has no write path
- [ ] This repository's own attestations record digests and are live, not stale
- [ ] The `unrecorded`-digest hole is named explicitly in a test, not discovered by accident

## Verification

```bash
node scripts/test.mjs
node scripts/attestations.mjs
```

## Dependencies

Phase 3's git seam and detector results — an attestation must be contradictable by an observation.
