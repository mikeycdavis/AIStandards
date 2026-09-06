# 01 — Phase 1: A CLI that runs and refuses to lie

**Status:** complete (started 2026-09-03, accepted 2026-09-04). Acceptance was re-verified on
2026-09-04: 225 tests pass, `audit` exits 0, `validate` exits 1 with an honest `NON_COMPLIANT`.
**Depends on:** nothing
**Blocks:** every later phase

## Purpose

Deliver a working zero-dependency CLI with `audit` and `validate`, the catalog and rule-binding
machinery, target-relative policy resolution, the honest six-way distinction, and only those
detectors whose assurance is high enough that the first thing an adopter sees is not a false
positive.

The phase exists to establish the **refusals** before any breadth: unknown never passes, a missing
policy is a configuration error rather than a verdict, an unexamined prohibition caps the result,
and a rule with no detector is reported as unevaluated rather than clean.

## Deliverables

### Machinery
- `package.json` — `type: module`, `bin.standards`, `engines.node >=18`, **no `dependencies` key**
- `VERSION` — `0.1.0`
- `scripts/catalog.mjs` — enums, rule-ID pattern, `assertBindings`, `EVALUATED_RULES`, the
  `not-evaluable` invariants
- `scripts/yaml.mjs` — small YAML subset that **rejects** block scalars rather than guessing
- `scripts/jsonschema.mjs` — hand-rolled draft-2020-12 subset; throws on an unimplemented keyword
- `scripts/source.mjs` — `splitSource()` use/mention split, comment syntax by extension
- `scripts/scaffolding.mjs` — scaffold marker and placeholder recognition
- `scripts/policy.mjs` — target-relative policy loading
- `scripts/compliance.mjs` — `evaluate()`, `envelope()`, `distinction()`, decision order
- `scripts/standards.mjs` — the CLI: `audit`, `validate`; `--dir`, `--policy`, `--json`, `--strict`
- `scripts/test.mjs` — explicit file list, no globs; zero discovered files is exit 2

### Schemas
- `schemas/ai-policy.schema.json`
- `schemas/ai-system-manifest.schema.json`
- `schemas/tool-permissions.schema.json`
- `schemas/audit-report.schema.json`, `schemas/validate-report.schema.json`

### Rules — six shards
`rules/lifecycle.json`, `privacy.json`, `eval.json`, `promptsec.json`, `agent.json`, `gate.json`

### Standards — seven, selected by "the CLI implements it"
01 AI System Manifest · 03 Machine-Readable AI Policy Schema · 05 Verdict Vocabulary ·
06 Standard Document Structure and Rule Identity · 07 Boundary with Adjacent Standards Packs ·
21 Prompt and Instruction Security · 45 Approval Gates

The first five are machinery, so no Phase 1 behaviour ships undocumented. The last two are the
easiest and hardest domain standards, proving the skeleton at both extremes.

### Detectors — high-confidence only
`full` assurance: `detectMissingManifest`, `detectInvalidManifest`, `detectScaffoldManifest`,
`detectMissingToolPermissions`, `detectUndeclaredTool`.
`partial`, exact-literal recognition only: `detectFloatingModelAlias`, `detectInlineSystemPrompt`,
`detectDisabledSafetyControls`.

### Policy
`ai-policy.yml` for this repository — honest, with real applicability reasons or none at all.

## Acceptance Criteria

- [ ] `audit` emits evidence, states explicitly that it is not a verdict, and emits **no** status and
      **no** score
- [ ] `validate --json` emits an envelope that validates against `schemas/validate-report.schema.json`
- [ ] Fixtures reach **all six** distinction values
- [ ] Every catalog rule outside `EVALUATED_RULES` reports `skipped` / `not-evaluated`; every
      `forbidden` rule among them reports `prohibited-but-unestablished`
- [ ] A missing policy exits **2** with no envelope
- [ ] A policy whose `standardVersion` disagrees with `VERSION` exits **2** with no envelope
- [ ] The policy-resolution trap test proves the target's `project` and `policyPath` are reported,
      never AIStandards' own
- [ ] Runtime imports are Node built-ins and local modules only
- [ ] `init` is **not** implemented — it is Phase 2 scope
- [ ] No Phase 2–7 feature is implemented

## Verification

```bash
node scripts/test.mjs
node scripts/standards.mjs audit .
node scripts/standards.mjs validate . --json
grep -rn "from \"[^.]" scripts/ | grep -v "node:"   # must return nothing
```

## Dependencies

None. Phase 1 is the root of the graph.

## Explicitly deferred out of this phase

Heuristic detectors (Phase 3) · attestations and exceptions (Phase 4) · containers, adapter and
workflows (Phase 5) · `init` (Phase 2) · the remaining 46 standards (Phase 2) · the remaining 11
rule shards (Phase 2).
