# 02 — Phase 2: The normative corpus

**Status:** in-progress.
**Depends on:** Phase 1 (complete, 2026-09-04).
**Blocks:** Phases 3–7.

**Rewritten for cold-start handoff on 2026-09-06** by the `plan-handoff` skill, against commit
`70832f4`. Every path, function name, line number and command below was verified against the
repository on that date. If a line number has drifted, trust the function name and re-locate it.

---

## 1. What you need to know before touching anything

You are picking this up with none of the conversation that produced it. Read this section fully;
every paragraph exists because skipping it produces a specific, silent failure.

**The governing brief is `artifacts/prompts/original_prompt.md` and is NEVER edited.** Not
reformatted, not line-ending-normalised, not corrected. `scripts/fidelity.mjs` byte-compares blocks
of `artifacts/prompts/ai-standards-spec.md` against it. Editing the brief to make fidelity pass is
the precise failure this repository exists to prevent.

**Three standing constraints from the brief, in force for every step below:**

> Do not invent historical intent, test results, approvals, reviewers, model capabilities, or
> compliance evidence. Preserve uncertainty explicitly.

> Never weaken a test, policy, standard, or evidence requirement merely to make a gate pass.

> Mark every claim as observed, inferred, confirmed by owner, or unknown.

**The repository's own `validate` verdict is `NON_COMPLIANT`.** This is an *observed result*, not a
target and not a permanent requirement. Two routes may legitimately change it: doing what a rule
asks so its evidence exists, and recording in `ai-policy.yml` that a rule's subject genuinely does
not exist here with a real reason and a `revisitWhen`. What is forbidden is *method*, not outcome:
lowering a rule's level, adding an exception with no real approver and date, reclassifying a rule as
not-evaluable to dodge scoring, or writing an untrue applicability reason. Do not preserve
`NON_COMPLIANT` for its own sake, and do not treat `COMPLIANT` as a goal.

**Mechanical checks and human sign-off are two separate statuses and must never be collapsed.**
`artifacts/boundary-review.json` has `humanSignOff: null` and three entries under `unresolved`. Every
boundary posture in it is a unilateral judgment; no maintainer of any adjacent pack has confirmed
any of them. Catalog numbering is *technically* frozen by `artifacts/prompts/ai-standards-spec.md`
and is separately *not* maintainer-approved governance. Report both, never one.

**Zero third-party dependencies, enforced by a test.** `package.json` has no `dependencies` key and
there is no lockfile. `test/no-phase-creep.test.mjs` asserts this. Do not `npm install` anything, do
not add a formatter, do not add a mermaid renderer. If you need to parse something, extend
`scripts/yaml.mjs` or `scripts/jsonschema.mjs`.

**`--test-concurrency=1` is mandatory and already set in `scripts/test.mjs`.** The mutation suites
corrupt a real shared file, assert the check fails, and restore it. Running them in parallel
corrupts the run and produces failures unrelated to your change. Do not "optimise" this away.

**`core.autocrlf` is `true` on this machine and there is no `.gitattributes`.** Committed bytes are
LF; working-tree bytes are CRLF. `scripts/fidelity.mjs` declares a single normalization (CRLF→LF on
both sides) and reports raw-byte matches separately, so this is currently harmless. Do **not** add a
`.gitattributes` as a side effect of other work — it rewrites every file's line endings in one
commit and buries whatever you were actually doing. It is recorded as an open item in
`08-open-questions.md`.

---

## 2. Current state, verified 2026-09-14

**Written: 12 of 53 standards** — `standards/01-ai-system-manifest.md`,
`02-ai-risk-tiering-and-applicability.md`, `03-machine-readable-ai-policy.md`,
`05-verdict-vocabulary.md`, `06-standard-structure-and-rule-identity.md`,
`07-boundary-with-adjacent-standards.md`, `08-ai-safety-requirements-and-safety-cases.md`,
`09-misuse-and-abuse-prevention.md`, `11-autonomy-levels-and-delegated-authority.md`,
`13-personal-data-in-ai-systems.md`, `21-prompt-and-instruction-security.md`, `45-approval-gates.md`.

**41 standards remain unwritten.**

**Rules: 46 across 8 shards** — `rules/agent.json` (4), `eval.json` (5), `gate.json` (6),
`lifecycle.json` (11, five of them Standard 08's), `misuse.json` (5, four of them Standard 09's),
`oversight.json` (5), `privacy.json` (5), `promptsec.json` (5). Nine of the seventeen reserved
namespaces have no shard. **Nine** of the 46 rules are reachable by a detector (`EVALUATED_RULES` in
`scripts/standards.mjs`); the rest report `skipped / not-evaluated` by construction. That gap is Phase 3's work.

**Built and passing:** `scripts/inventory.mjs`, `scripts/fidelity.mjs`, and since 2026-09-14
`scripts/sync-rule-tables.mjs` (writes generated tables; `--check` is read-only; since the second
2026-09-14 batch it also refuses a written standard missing a block for a shard holding its rules) and
`scripts/standards-sections.mjs` (read-only document conformance).

**Not built, despite appearing in the Deliverables list below:** `scripts/manifest.mjs`,
`scripts/toolperms.mjs`, `scripts/init.mjs`, `artifacts/standards-source-inventory.json`, and every
template.

---

## 3. Purpose

Write the full normative corpus and prove it traces to the brief. The two blocking catalog reviews
that gate this phase have run and pass mechanically (see §9). The remaining work is the 41 unwritten
standards, shards for the nine reserved namespaces that have none, `manifest.mjs`, `toolperms.mjs`,
the templates, and `init`.

## 4. Deliverables

- `artifacts/prompts/ai-standards-spec.md` — the derived enumeration with its three-class provenance
  block (D derived / V verbatim / A authored). **Exists.** Each item's row gains a path in the
  `Implemented by` column as its standard is written.
- `artifacts/standards-source-inventory.json` — `expectedCount`, `reviewedOn`, and per item
  `{number, title, class, derivedFrom, implementedBy}`. **Not written.**
- All 53 standards, each with the ten H2 sections carrying the brief's nine requirements. **12 done.**
- Shards for the nine reserved namespaces that have none, to roughly 96 rules. **Eight shards exist,
  46 rules**; Standards 11, 08 and 09 added rules during this phase.
- All templates: manifest, threat model, evaluation plan, tool permissions, incident report,
  red-team report, ADR, starter policy, agent instruction files. **None written.**
- `scripts/inventory.mjs` **(done)**, `fidelity.mjs` **(done)**, `sync-rule-tables.mjs` **(done 2026-09-14)**,
  `standards-sections.mjs` **(done 2026-09-14)**, `manifest.mjs`, `toolperms.mjs`.
- `scripts/init.mjs` — bootstraps a consuming project, writing scaffold markers. **Not written.**

---

## 5. The procedure for writing one standard

This is the repeatable unit of work in this phase. Follow it exactly; the ordering matters because
step 5 fails if step 4 was skipped, and the failure message does not say so.

### Step 1 — Read the specification row for the item

```bash
grep -n "^| N " artifacts/prompts/ai-standards-spec.md
```

The row's columns are: number · title · **class** (`D` derived / `V` verbatim / `A` authored) ·
**derivedFrom** (the brief's subject token, or `—` for authored items) · **posture**
(`O` own / `B` baseline / `X` crosswalked / `D` deferred) · **Implemented by** (a path, or `—`).

The title in this row is the standard's identity. Do not improve it.

**Decision, not an option:** the standard's H1 must be exactly `# Standard N — Title` with an em
dash (`—`, U+2014), and the title must match the spec row character for character.
`scripts/inventory.mjs`'s `checkImplementations()` (line 152) compares them.

### Step 2 — Read the boundary review entry for the item

```bash
node -e "const b=require('./artifacts/boundary-review.json');console.log(JSON.stringify(b.postures.filter(x=>x.item===N),null,2))"
```

For a non-`O` posture this yields the `evidence` array — the pack, the standard file, the rule IDs
and the observation — plus `reasoning`, `verdict` and `unknowns`. **`inventory.mjs`'s
`checkBoundary()` (line 223) requires recorded evidence for every non-`O` posture.** A `B`, `X` or
`D` standard written without consulting this entry will fail the gate.

Cite only what the entry records. Do not add a precedent it does not name.

### Step 3 — Write the document with exactly ten H2 sections, in this order

The order is fixed by `standards/06-standard-structure-and-rule-identity.md`. Copy the section
headings from an existing standard of the same posture rather than retyping them — the closest
precedents are `standards/01-ai-system-manifest.md` (posture `O`, has rules) and
`standards/45-approval-gates.md` (posture `X`, has a crosswalk table).

1. `## Scope`
2. `## Requirements` — each as `### RN — imperative`, a bolded MUST/MUST NOT/SHOULD/MAY sentence,
   then prose
3. `## Failure modes` (table)
4. `## Evidence` (table)
5. `## Validation, severity, and exemptibility`
6. `## Tests and falsifiers` (table, including a negative control)
7. `## Exceptions and staleness`
8. `## Additions this standard makes beyond the source`
9. `## Relationship to other standards and ADRs`
10. `## Implementation`

Immediately under the H1 and the lede prose, the two-hop source line:

```
Source: item N of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), <the brief's bullet or "authored">
```

**Section 8 is load-bearing, not boilerplate.** For a class-`A` item it must be non-empty and must
not be the string `None.` — `checkAuthoredDeclarations()` (`inventory.mjs:96`) asserts exactly this.
It is where authored requirements are disclosed as this repository's judgment rather than the
brief's words. Enumerate them; a vague paragraph passes the mechanical check and defeats its purpose.

**Section 10 must separate what is implemented today from what is proposed.** Standard 02 does this
with two tables under explicit headings. A standard whose Implementation section describes detectors
that do not exist is asserting a capability nobody built.

### Step 4 — Claim the document in the specification

Edit **one cell**: the `Implemented by` column of item N's row, from `—` to the path.

```bash
git diff --stat artifacts/prompts/ai-standards-spec.md   # must show 1 file changed, 1 insertion, 1 deletion
```

**This is the step that is easy to miss and whose failure is misleading.** Skipping it makes
`inventory.mjs` report the *document* as unclaimed, and three tests fail with messages about the
specification rather than about your new file. That is exactly what happened while writing Standard
02 on 2026-09-06.

### Step 5 — Register the file in the phase-scope guard

`test/no-phase-creep.test.mjs` holds a sorted literal list of the standards that exist, under the
test named `only the standards written so far exist`. Add the new filename in sorted position.

The guard is not that the corpus is frozen — this phase writes the remaining 43. It is that a standard
arrives *deliberately*, by being added to that list, rather than by appearing unnoticed.

**Verify (steps 1–5):**

If the standard ships rules, add them to their shard first, cite each rule id in backticks in exactly
one `### RN` section, and write the table with `node scripts/sync-rule-tables.mjs` rather than by
hand. The generator exits 2 when a rule is cited in no requirement section, or in more than one. It
also exits 2 when a written standard has no block for a shard holding its rules, in both modes: put
the `<!-- BEGIN GENERATED FROM rules/<shard>.json — DO NOT EDIT. Verified by
test/standards-tables.test.mjs. -->` and `<!-- END GENERATED -->` marker lines in the Validation
section yourself, because write mode fills a block but never inserts one.

```bash
node scripts/test.mjs && node scripts/fidelity.mjs && node scripts/inventory.mjs && node scripts/sync-rule-tables.mjs --check && node scripts/standards-sections.mjs
```

Success is all five exiting 0, with the test runner reporting `0` failures, `inventory.mjs` reporting
one more item under `implemented` than before, and `standards-sections.mjs` listing the new document
as conforming. Use the *semantic* criteria in §6 to judge
the standard itself — a moved counter proves the file was seen, not that it is correct.

### Step 6 — Commit

One standard per commit, message `Standard NN — Title`. Run step 5's verification before committing;
`git status --porcelain` must be empty afterwards.

---

## 6. Acceptance criteria

Semantic, not arithmetic. Counter movement is evidence a file was noticed, never evidence it is
right — do not treat a target number as the goal.

- [x] Every written standard has all ten H2 sections, present and in the order listed in §5 step 3 —
      *checked by `scripts/standards-sections.mjs` since 2026-09-14, for the documents written so far*
- [x] Each of the brief's nine requirements resolves to a present, non-empty section for every
      written standard, via the mapping held as data in `scripts/standards-sections.mjs`
- [ ] Every rule cites a standard; every standard cites at least one rule **or records in its
      Validation section why it ships with none**
- [ ] **Fidelity review passes** — every class-V block is byte-identical to the brief
- [ ] **Boundary review passes mechanically**, and is separately recorded as lacking human sign-off
- [ ] Every class-A item carries a non-empty `## Additions` section that enumerates its authored
      requirements
- [x] Generated rule tables match the catalog byte-for-byte — *`node scripts/sync-rule-tables.mjs --check`,
      since 2026-09-14, which also fails a written standard missing a block for a shard holding its
      rules*
- [ ] **`init` output satisfies zero rules**, asserted directly *(blocked: `init.mjs` unwritten)*

## 7. Verification — the phase exit command

The full form, runnable since 2026-09-14:

```bash
node scripts/test.mjs && node scripts/inventory.mjs && node scripts/fidelity.mjs && node scripts/sync-rule-tables.mjs --check
```

`node scripts/standards-sections.mjs` runs inside `node scripts/test.mjs` through
`test/standards-sections.test.mjs`, and may also be run directly. Passing this command does not
complete the phase: 41 standards, the templates and `init` remain.

## 8. Out of scope for this phase — a closed list

Do not build any of these here, even if a standard you are writing would be easier to finish with
one. Each has its own phase file.

Detectors beyond the nine already in `EVALUATED_RULES`, `scripts/repository.mjs`, `modelrefs.mjs`,
`promptassets.mjs`, `pii.mjs`, bait fixtures, the evidence-availability architecture (Phase 3) ·
attestations, `scripts/reviews.mjs`, `scripts/attestations.mjs`, freshness classification, policy
fixtures (Phase 4) · `standards-adapter.json`, the vendored enforcer schema, `ci/Dockerfile`,
`compose.ci.yml`, `scripts/pipeline.mjs`, `scripts/ci.sh`, `scripts/ci.ps1`, `scripts/submit-gate.mjs`,
`scripts/diagrams.mjs`, any GitHub Actions workflow (Phase 5) · the `docs/` corpus beyond keeping
existing files true, `CHANGELOG.md`, `INSTRUCTIONS.md`, the ADR 0021 gating decision, any `VERSION`
bump (Phase 6) · any interaction with StandardsEnforcer, any tag, any scope-registry disposition
(Phase 7).

Also out of scope: adding risk-tier fields to `schemas/ai-system-manifest.schema.json` or
`schemas/ai-policy.schema.json`. Both are `additionalProperties: false`; changing them changes what
a conformant consuming project may declare, and that is a schema-versioning decision, not a
side effect of writing a document.

## 9. Outcome of the two blocking reviews — 2026-09-04

Both pass **mechanically**. `node scripts/fidelity.mjs` compares four verbatim blocks to the brief
character for character; `node scripts/inventory.mjs` resolves 44 derived items to real tokens,
checks 9 authored items are declared as authored, and requires recorded evidence for every non-`O`
boundary posture.

Neither review is a human governance approval. `humanSignOff` is `null`.

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

## 10. Work completed in this phase so far

**Standard 02 — AI Risk Tiering and Applicability** (2026-09-06, commit `70832f4`). Class `A`,
posture `O`, ships with **no catalog rules** by deliberate decision recorded in its Validation
section: neither schema has a risk-tier field and both are `additionalProperties: false`, so a
project cannot declare a tier in a conformant file, and a rule demanding one would fail every
project for the framework's own incompleteness.

**An unresolved substantive question it raised, recorded rather than resolved.** Standard 02's R2
reads:

> **No detector, heuristic, or audit finding in this framework MAY assert, propose, or default a risk
> tier, and an undeclared tier MUST be reported as undeclared rather than assumed.**

The verb **propose** is not supported by the reasoning given beneath it, which argues only that a
guess would carry the framework's authority into a judgment no engineer made. That argument covers
*assert* and *default*. It does not cover a clearly-labelled advisory suggestion a human must
explicitly accept. R2 is class `A` in full and self-disclosed as authored; the brief contains no
occurrence of "risk", "tier", or "advisory". It is therefore a **newly authored restriction, not an
approved requirement**, and it is unilateral.

Do not extend the blanket form into other standards until the owner rules on it. Standard 11 was
deliberately written to prohibit *authoritative assignment* while leaving advisory proposal open.
Logged in `08-open-questions.md`.

**Standard 11 — Autonomy Levels and Delegated Authority** (2026-09-06, commit `fc060bf`). Class `D`,
posture `X`, with the `oversight` shard of five rules.

**2026-09-14 batch — Standard 08, the rule-table generator, and the document-conformance checker.**
Built concurrently by three sub-agents in separate git worktrees, each with an exclusive file scope,
and integrated centrally into one commit. Shared cells — the specification, rule shards, runner list,
phase guard, policy, package scripts, this handoff — were edited only during integration.

- **Standard 08, "AI Safety Requirements and Safety Cases."** Class **D** (`AI safety`), posture **O**
  (item 8 is listed under `notGovernedElsewhere` in the boundary review). Six requirements keep a
  *safety requirement*, a *safety case* and the property *holding at inference time* apart: state each
  requirement with an observable violation, or record a reasoned no-hazard finding (R1); bind them to
  a declared operating context and name what invalidates it (R2); argue every stated property down to
  cited evidence, marking gaps rather than omitting them (R3); label each citation by kind and
  revision, never citing the argument as its own support (R4); the properties hold at inference time,
  `required` and `not-evaluable` (R5); and no part of this framework may report a case sound from a
  document's presence (R6, no rule). Five rules were added to `rules/lifecycle.json` — four
  `manual-review`, one `not-evaluable`. It does not grade safety cases by risk tier, and it neither
  restates nor extends Standard 02 R2; Q7 is untouched.
- **`scripts/sync-rule-tables.mjs`.** Writes each generated table from the catalog; `--check` is
  read-only and exits 1 on drift, 2 on malformed input. A row's requirement label is taken from the
  single `### RN` section that cites the rule id in backticks — a mapping verified against all 22
  pre-existing rows before the tool was written — and the tool refuses rather than guesses when that
  citation is missing or ambiguous. Run in write mode it changed no existing document.
- **`scripts/standards-sections.mjs`.** Rejects a missing, duplicated, out-of-order or empty section in
  any written standard, resolves the brief's nine requirements through a mapping held as data, and
  checks filename, H1, Source line and specification row. All ten documents conform. It checks
  structure, not adequacy. Its identity checks overlap `inventory.mjs`'s; both are kept.
- **Evidence corrections made during integration.** Standard 11 R6, the rationale of
  `oversight.no-authority-beyond-declared-tier` and `README.md` said a forbidden not-evaluable rule
  caps the verdict. `evaluate()` in `scripts/compliance.mjs` excludes not-evaluable rules from the set
  that holds a status, and Standard 5 R8 requires exactly that, so all three were wrong and are
  corrected. Standard 06's R2 prose now spells the Validation heading as every document does, and its
  Implementation section no longer says R1 and R2 are unchecked.

**2026-09-14, second batch — Standard 09 and rule-table coverage.** Two sub-agents, each in a git
worktree created outside the repository at `b408012` with an exclusive file scope; shared cells were
edited only during integration.

- **Standard 09, "Misuse and Abuse Prevention."** Class `D` (`misuse prevention`), posture `O`. Six
  requirements — misuse analysis (R1), provider safety controls not turned off (R2, the Phase 1 rule,
  identity unchanged), per-identity attribution and bounds (R3, `recommended`), misuse signals with a
  reviewer and an enforcement action (R4), controls holding at inference time (R5, `not-evaluable`),
  and no framework report of a control as enabled from presence or absence (R6, no rule). Four rules
  added to `rules/misuse.json`. It mints no prohibition: item 48 does not name `misuse prevention`,
  recorded as Q9 in `08-open-questions.md`.
- **Rule-table coverage.** A written standard missing a block for a shard holding its rules is now
  exit 2 in both modes of `scripts/sync-rule-tables.mjs`; write mode never inserts a block.
- **Evidence corrections.** Three places said an unrecognised spelling reports as not-evaluated; it
  reports `passed`. Corrected in `rules/misuse.json`, Standard 1 and a comment in
  `scripts/standards.mjs`.

**2026-09-14, third batch — Standard 13 and a safety-detector repair.** Two sub-agents, each in a git
worktree created outside the repository at `308a0d7`; shared cells were edited only during integration.

- **Standard 13, "Personal Data in AI Systems."** Class `D` (`Data privacy`), posture `O`. States the
  five Phase 1 privacy rules unchanged (R1 to R5) and adds R6 with no rule; adds no rule and claims no
  legal meaning. Open questions Q10, Q11 and Q12 record the rule placements it could not explain.
- **Safety-detector repair.** `detectDisabledSafetyControls` no longer changes its result when a harmless
  line is added; asserted by `test/safety-detector.test.mjs`. Not the Phase 3 evidence architecture.
- **Q13**, a conflict between Standard 5 R6 and how `evaluate()` treats partial-assurance results, is
  recorded and not resolved.

## 11. The next slice

**Standard 23 — Agent Execution Security.** Standard 13 was written on 2026-09-14 and is no longer
next. This choice is inferred rather than planned; `docs/HANDOFF.md` §9 gives the reasoning.

Items 17 and 23 are the unwritten items that still own catalog rules. Item 23 is posture `O`, so it
needs no boundary evidence; item 17 is posture `B` and does. `rules/agent.json` carries four rules
citing standard 23, so the new document must carry a `rules/agent.json` generated block and cite each of
those ids in backticks in exactly one `### RN` section before `node scripts/sync-rule-tables.mjs` will
pass.

Q7, Q9, Q10, Q11, Q12 and Q13 remain open. None is expected to block item 23 (inferred).
