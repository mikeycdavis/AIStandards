# 02 — Phase 2: The normative corpus

**Status:** in-progress. The two blocking catalog reviews passed on 2026-09-04 and the numbering is
frozen; the remaining 46 standards, 11 rule shards, templates and `init` are not started.
**Depends on:** Phase 1
**Blocks:** Phases 3–7

## Purpose

Write the full normative corpus and prove it traces to the brief. The phase opens with the two
blocking catalog reviews, which have now run: the 53-item catalog is settled and its numbering is
frozen by `artifacts/prompts/ai-standards-spec.md`. The remaining 46 standards, the remaining 11 rule
shards, the templates and `init` follow.

## Deliverables

- `artifacts/prompts/ai-standards-spec.md` — the derived enumeration with its three-class provenance
  block (D derived / V verbatim / A authored)
- `artifacts/standards-source-inventory.json` — `expectedCount`, `reviewedOn`, and per item
  `{number, title, class, derivedFrom, implementedBy}`
- All 53 standards, each with the ten H2 sections carrying the brief's nine requirements
- The remaining 11 rule shards, to roughly 96 rules
- All templates: manifest, threat model, evaluation plan, tool permissions, incident report,
  red-team report, ADR, starter policy, agent instruction files
- `scripts/inventory.mjs`, `fidelity.mjs`, `sync-rule-tables.mjs`, `manifest.mjs`, `toolperms.mjs`
- `scripts/init.mjs` — bootstraps a consuming project, writing scaffold markers

## Acceptance Criteria

- [ ] Every standard has all ten H2 sections, in order
- [ ] Each of the brief's nine requirements resolves to a present, non-empty section for every
      standard, via the mapping table held as test data
- [ ] Every rule cites a standard; every standard cites at least one rule or records why not
- [ ] **Fidelity review passes** — every class-V block is byte-identical to the brief
- [ ] **Boundary review passes** — every deferring standard checked against the actual named standard
      in the owning pack and confirmed to defer rather than restate
- [ ] Every class-A item carries a non-empty `## Additions` section
- [ ] Generated rule tables match the catalog byte-for-byte
- [ ] **`init` output satisfies zero rules**, asserted directly

## Verification

```bash
node scripts/test.mjs
node scripts/inventory.mjs
node scripts/fidelity.mjs
node scripts/sync-rule-tables.mjs --check
```

## Dependencies

Phase 1's catalog machinery, rule-ID pattern, and document-structure standard.

## Outcome of the two blocking reviews — 2026-09-04

Both pass. `node scripts/fidelity.mjs` compares four verbatim blocks to the brief character for
character; `node scripts/inventory.mjs` resolves 44 derived items to real tokens, checks 9 authored
items are declared as authored, and requires recorded evidence for every non-`O` boundary posture.

What they changed, none of it preserved for convenience:

- The plan's token count of 37 was wrong. It is 40; the item total of 39 is unchanged because the
  merge departure absorbs the difference.
- The plan's "six mapped line-by-line, one authored" machinery split was wrong. Item 2 has no token
  in the brief and is authored. Five derived, two authored.
- Four boundary postures changed on evidence — 25 X→O, 26 D→B, 27 O→B, 40 O→B — and two were
  narrowed, 18 and 30, where the named MachineLearningStandards standard covers half the concern.
- One crosswalk was withdrawn: grounding to `ai.no-fabricated-capabilities`, which the evidence does
  not support.
- The plan's claim that the 17 reserved rule namespaces were disjoint from other packs' is false for
  six of them. No **full id** collides, verified across nine packs and 560 recorded ids, so
  Standard 7 R4 holds; the overlap is now declared rather than denied.
- Standard 3's title in the plan disagreed with the shipped document. The document won.
- The `B` posture legend was ML-specific and could not express deference to UIUXDesignStandards or
  PredictionStandards. It now names an owner per item.

**What did not change:** the item count, the band structure, and the five owner decisions —
MachineLearningStandards owns reproducibility, provenance, evaluation and drift; AIStandards owns
the canonical AI-facing rules; EngineeringStandards ids are crosswalk references only;
`ai.non-ui-capabilities` stays an EngineeringStandards concern; StandardsOrchestrator is excluded as
an authority.
