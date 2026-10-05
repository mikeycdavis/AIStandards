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

**Written: 16 of 53 standards** — `standards/01-ai-system-manifest.md`,
`02-ai-risk-tiering-and-applicability.md`, `03-machine-readable-ai-policy.md`,
`05-verdict-vocabulary.md`, `06-standard-structure-and-rule-identity.md`,
`07-boundary-with-adjacent-standards.md`, `08-ai-safety-requirements-and-safety-cases.md`,
`09-misuse-and-abuse-prevention.md`, `11-autonomy-levels-and-delegated-authority.md`,
`13-personal-data-in-ai-systems.md`, `17-evaluation-plans-for-generative-systems.md`,
`21-prompt-and-instruction-security.md`, `23-agent-execution-security.md`, `25-grounding-and-hallucination-control.md`, `33-ai-observability.md`, `45-approval-gates.md`
(Standard 17 added 2026-09-15; Standards 25 and 33 added 2026-10-03).

**37 standards remain unwritten.**

**Rules: 46 across 8 shards** — `rules/agent.json` (4), `eval.json` (5), `gate.json` (6),
`lifecycle.json` (11, five of them Standard 08's), `misuse.json` (5, four of them Standard 09's),
`oversight.json` (5), `privacy.json` (5), `promptsec.json` (5). Nine of the seventeen reserved
namespaces have no shard. **Nine** of the 46 rules are reachable by a detector (`EVALUATED_RULES` in
`scripts/standards.mjs`); the rest report `skipped / not-evaluated` by construction. That gap is Phase 3's work.

**Built and passing:** `scripts/inventory.mjs`, `scripts/fidelity.mjs`, and since 2026-09-14
`scripts/sync-rule-tables.mjs` (writes generated tables; `--check` is read-only; since the second
2026-09-14 batch it also refuses a written standard missing a block for a shard holding its rules) and
`scripts/standards-sections.mjs` (read-only document conformance).

**Built 2026-09-19 (§12):** `scripts/manifest.mjs`, `scripts/toolperms.mjs`, `scripts/init.mjs` and
`templates/` (twelve templates and `index.json`).

**Not built, despite appearing in the Deliverables list below:**
`artifacts/standards-source-inventory.json`.

---

## 3. Purpose

Write the full normative corpus and prove it traces to the brief. The two blocking catalog reviews
that gate this phase have run and pass mechanically (see §9). The remaining work is the 40 unwritten
standards, shards for the nine reserved namespaces that have none, and
`artifacts/standards-source-inventory.json`. `manifest.mjs`, `toolperms.mjs`, the templates and `init`
were built on 2026-09-19.

## 4. Deliverables

- `artifacts/prompts/ai-standards-spec.md` — the derived enumeration with its three-class provenance
  block (D derived / V verbatim / A authored). **Exists.** Each item's row gains a path in the
  `Implemented by` column as its standard is written.
- `artifacts/standards-source-inventory.json` — `expectedCount`, `reviewedOn`, and per item
  `{number, title, class, derivedFrom, implementedBy}`. **Not written.**
- All 53 standards, each with the ten H2 sections carrying the brief's nine requirements. **13 done.**
- Shards for the nine reserved namespaces that have none, to roughly 96 rules. **Eight shards exist,
  46 rules**; Standards 11, 08 and 09 added rules during this phase.
- All templates: manifest, threat model, evaluation plan, tool permissions, incident report,
  red-team report, ADR, starter policy, agent instruction files. **Written 2026-09-19** (§12).
- `scripts/inventory.mjs` **(done)**, `fidelity.mjs` **(done)**, `sync-rule-tables.mjs` **(done 2026-09-14)**,
  `standards-sections.mjs` **(done 2026-09-14)**, `manifest.mjs` and `toolperms.mjs` **(done 2026-09-19)**.
- `scripts/init.mjs` — bootstraps a consuming project, writing scaffold markers. **Done 2026-09-19.**

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
- [x] **`init` output satisfies zero rules**, asserted directly — `test/init-e2e.test.mjs` initialises a
      disposable target from the real templates and asserts no result is `passed`; see §12.6

## 7. Verification — the phase exit command

The full form, runnable since 2026-09-14:

```bash
node scripts/test.mjs && node scripts/inventory.mjs && node scripts/fidelity.mjs && node scripts/sync-rule-tables.mjs --check
```

`node scripts/standards-sections.mjs` runs inside `node scripts/test.mjs` through
`test/standards-sections.test.mjs`, and may also be run directly. Passing this command does not
complete the phase: 37 standards, the nine missing shards and
`artifacts/standards-source-inventory.json` remain.

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
  recorded and not resolved. *Resolved in the fourth batch.*

**2026-09-14, fourth batch — the Q13 correction and Standard 23.** Two sub-agents, each in a git
worktree created outside the repository at `c203d99`; shared cells were edited only during integration.

- **Q13 resolved by option 1.** A clean result from a rule declaring `assurance: partial` reports
  `skipped` / `not-evaluated`, earns no `passed` credit and holds the status away from `COMPLIANT`, while an
  applicable partial rule stays in the scored denominator (corrected 2026-09-15); violations, unknowns and
  full-assurance checks are unchanged. Synthetic reproductions that reported `COMPLIANT` at 100 now
  report `NOT_EVALUATED`, asserted by `test/partial-assurance.test.mjs`. Standard 5's requirement was not
  amended; its R2 wording was open as Q14, clarified on 2026-09-15.
- **Standard 23, "Agent Execution Security."** Class `D` (`agent, and retrieval security`), posture `O`.
  States the four Phase 1 agent rules unchanged (R1 to R4) and adds R5 with no rule; adds no rule and no
  sandboxing requirement. Q15 to Q18 record the placements and boundaries it could not settle.
- **Evidence corrections.** Standards 1, 5, 9 and 21, four rule notes and a code comment restated for the
  new behaviour; three `not-evaluable` notes no longer promise a rule that does not exist.

**2026-09-15, fifth batch — Standard 17 and the Q14 clarification.** Two sub-agents, each in a git
worktree created outside the repository at `82ba7ea`; shared cells were edited only during integration.

- **Standard 17, "Evaluation Plans for Generative Systems."** Class `D` (`Model evaluation`), posture `B`.
  States the five `rules/eval.json` rules unchanged (R1 to R5) and adds R6 to R9 with no rule: the
  evaluated subject, the scorer, non-numeric results, and a bar on this framework reporting an
  evaluation sound from inspection. Links MachineLearningStandards Standards 2, 5, 12, 14, 15, 19 and 20,
  read at the pinned commit, and restates none; states no baseline for those subjects where that pack
  does not reach a system (Q22). Q19 to Q22 record what it could not settle.
- **Q14 resolved as clarification.** Standard 5 R2's meanings table names every path to each
  distinction, including a partial check that ran clean; a note under R6 states that such a result earns
  no `passed` credit but stays in the scored denominator. No bolded requirement changed.
- **Evidence corrections.** The sentence "counts toward neither `COMPLIANT` nor the score" was wrong about
  the denominator and is corrected in Standard 5, the handoff, this plan, Q13's resolution and a comment
  in `scripts/compliance.mjs`. Three crosswalks named MachineLearningStandards ids that exist at neither
  recorded commit (`eval.plan-exists`, `eval.no-test-set-tuning`, `lifecycle.model-version-pinned`) and
  now name real ones. Standard 7 R2's hosted-model example of a non-ML system is withdrawn.

**2026-09-19, sixth batch — the adoption slice.** A coordinator prerequisite, then two sub-agents, each in a
git worktree created outside the repository at `a2d5069`; shared cells were edited only during integration.

- **Prerequisite (`a2d5069`):** scaffold manifests and permission files no longer make the four rules that
  read them pass (§12.1), and the contract in §12 was fixed.
- **`templates/`, `scripts/manifest.mjs`, `scripts/toolperms.mjs`** — twelve templates and a registry;
  classification of the two machine files from text, in one place, called by the detectors.
- **`scripts/init.mjs`**, routed from `standards init` — initialises an explicitly selected target;
  refuses the pack checkout, refuses the whole run on any conflict, rolls back on failure.
- **Integration:** detector wiring, the phase guard (later-phase restrictions retained), runner registration,
  `package.json` command, README, handoff.

## 11. The next slice

**Not recorded, and no longer decided by rule ownership.** With Standard 17 written on 2026-09-15, every
item that owns catalog rules has a document, so the rule that picked items 23 and 17 picks nothing.
Re-run `/whats-next` before starting; `docs/HANDOFF.md` §9 lists the candidates (inferred).

Q7, Q9 to Q12 and Q15 to Q22 remain open.

## 12. The adoption slice contract

**Fixed 2026-09-19, before any of it was built.** The plan lists `templates/`, `scripts/manifest.mjs`,
`scripts/toolperms.mjs` and `scripts/init.mjs` as Phase 2 deliverables (§4) and names no file set, marker
form, conflict behaviour or module boundary. Each decision below is inferred from the evidence cited and
is the coordinator's, not the owner's; the owner may reverse any of them. **Completing this slice does not
complete Phase 2**: 37 standards, shards for nine namespaces and the foreign-crosswalk id check remain.

### 12.1 Why detectors changed first

A scaffold manifest is schema-valid by construction. Before this slice `validate` reported four of the five
`assurance: full` rules **passed** on it — `lifecycle.manifest-exists`, `lifecycle.manifest-valid`, and both
`gate.` rules vacuously, because a scaffold declares no tools — and `test/scaffolding.test.mjs` tolerated a
score rise of up to 20. That is the incident `scripts/scaffolding.mjs` exists to prevent, and it makes "`init`
output satisfies zero rules" (§6) false for any `init` that writes a manifest. So the four rules now report
`skipped` / `not-evaluated` while the file they read is a scaffold, and only `lifecycle.manifest-not-scaffold`
reports on it, as `failed`. A violation the file genuinely contains still stands. A freshly initialised
target is therefore `NON_COMPLIANT` — honestly, because a required rule fails — with **zero** passed results.

### 12.2 Files, markers and groups

`templates/index.json` is the registry, `{"schemaVersion":"1.0","templates":[{source, destination, group,
format, marker}]}`, one entry per file in `templates/` and no file unlisted. `group` is `core`, `docs` or
`reference`; `destination` is `null` exactly for `reference`.

| Source in `templates/` | Destination in the target | Group | Format | Marker |
| --- | --- | --- | --- | --- |
| `ai-system.yml` | `ai-system.yml` | core | yaml | `$scaffold: true` as the first key |
| `tool-permissions.yml` | `tool-permissions.yml` | core | yaml | `$scaffold: true` as the first key |
| `ai-policy.yml` | `ai-policy.yml` | core | yaml | comment `# AISTANDARDS-SCAFFOLD` on the first non-blank line |
| `AI-SYSTEM.md`, `THREAT-MODEL.md`, `EVALUATION-PLAN.md`, `INCIDENT-REPORT.md`, `RED-TEAM-REPORT.md`, `ADR.md` | `docs/ai/<same name>` | docs | markdown | `<!-- AISTANDARDS-SCAFFOLD ... -->` on the first non-blank line |
| `AGENTS.md`, `CLAUDE.md`, `copilot-instructions.md` | none | reference | markdown | as above |

- **Marker representations** are `SCAFFOLD_MARKER`, `SCAFFOLD_TEXT_MARKER` and `hasScaffoldTextMarker()` in
  `scripts/scaffolding.mjs`. The policy schema is closed and has no slot, so its marker is a comment; it
  selects rules and is evidence of nothing either way.
- **`ai-policy.yml`** lists every catalog rule at its catalog level, with `standardVersion` equal to `VERSION`,
  **no `applicability` block and no `project`**: nothing is lowered and nothing is declared not-applicable. A
  test keeps it equal to `rules/*.json`; `init` copies it byte for byte.
- **`ai-system.yml`** carries only `system.name`, `system.purpose`, `models[0].id` and `models[0].provider`,
  all `REPLACE-ME`. It declares **no** lifecycle stage, autonomy tier, tool, prompt, data source or evaluation
  path: each would be an invented declaration or a path to a file that does not exist.
- **`tool-permissions.yml`** is `tools: []`. The schema's `impact` enum has no placeholder value, so any tool
  entry would be a fabricated classification.
- **No `evaluation-plan.yml`**, although the approved plan lists one: no schema for it exists, and Standard 17
  R1 records that none governs a plan's form. `EVALUATION-PLAN.md` may name only the manifest's real
  `evaluation.planPath`, `suiteCommand` and `baselinePath`.
- **The `reference` group is not written by `init`.** `AGENTS.md`, `CLAUDE.md` and `copilot-instructions.md`
  belong at conventional locations that are usually occupied, so `init` never touches them.
- **No template prescribes a field the schemas reject**, and none contains a fixed line number.

### 12.3 Module roles

- `scripts/manifest.mjs` — `MANIFEST_NAMES`; `classifyManifest(text)` returning parse result, schema problems,
  scaffold inspection and one status (`unparseable`, `invalid`, `scaffold` or `ok`); `manifestToolNames()`.
  Pure over text; no file reads.
- `scripts/toolperms.mjs` — `TOOLPERM_NAMES`; `classifyToolPermissions(text)` likewise; and a comparison of
  its tool names with a declared list. Pure over text.
- The coordinator wires both into the detectors in `scripts/standards.mjs`, replacing the inline copies, with
  the existing suite as the guard.
- `scripts/init.mjs` — runnable as `node scripts/init.mjs <target> [flags]` and exporting
  `runInitCommand(args, io)`, which owns `init`'s argument parsing and returns an exit code; the coordinator
  routes `standards init` to it. It reads `templates/index.json` and copies files.

### 12.4 `init` behaviour

- **Target:** required and explicit. No target, a missing directory, a file, or the pack checkout itself
  (compared by real path) is exit 2 with nothing written. It never defaults to the working directory.
- **Options:** `--docs` also writes the `docs` group; `--dry-run` writes nothing and reports the plan;
  `--force-overwrite=<destination>` (repeatable) permits replacing one named, differing file; `--json`.
- **Existing files:** a destination byte-identical to its template is `unchanged`. A differing one is a
  **conflict**, and any conflict refuses the whole run: exit 2, nothing written, every conflict listed.
  `--force-overwrite` naming a path outside the plan is an error, so a typo cannot silently do nothing.
  Repeating a successful run is therefore exit 0 with every file `unchanged`, and never touches a user's edit.
- **Writing:** all destinations are verified first; no destination or parent may be a symlink; files are written
  through a temporary file and renamed; on any failure everything created or replaced is put back.
- **Exit codes:** 0 done, including nothing to do and dry runs; 2 invocation, conflict or write error.

### 12.5 What this does not do

Fill `humanSignOff`, decide hosted-model applicability, assert any applicability, or make a schema-valid file
count as evidence. The foreign-crosswalk id check stays pending. Cross-references in the templates to
MachineLearningStandards follow Standard 17's pinned-source findings and add no ML-owned requirement.

### 12.6 Outcome, 2026-09-19

Built to §12.2–§12.4. Decisions the workers made beyond the contract, each inferred and reversible:

- **`init` refuses a registry with no core `ai-policy.yml` entry**, and refuses a starter policy whose
  `standardVersion` differs from `VERSION`: either would make every `validate` of the adopter exit 2.
- **Registry destinations are refused if absolute, drive-lettered, containing `..`, a backslash or a colon,
  or duplicated case-insensitively.**
- **`--force-overwrite` naming a destination outside the selected plan is an error**, so a typo cannot
  silently do nothing; naming an in-plan file that already matches is accepted as harmless.
- **`classifyManifest()` and `classifyToolPermissions()` expose `scaffold` separately from `status`.**
  A schema-invalid file that also carries the marker is `invalid`, and the detectors still treat it as a
  scaffold for the rules that read it, exactly as before; using `status` alone would have changed that.
- **The human report's closing NOTE also prints on a refused run**, where nothing was written. Cosmetic.

**Known limits.** Templates are LF in git and CRLF in this Windows working tree, and `init` copies
working-tree bytes, so a target inherits the checkout's line endings. Repeating `init` is unchanged within
one checkout. No `.gitattributes` was added (Q8). `init` writes no `evaluation-plan.yml`, no `.gitignore`
entry and nothing outside the three core files and the optional `docs/ai/` set. The file set, marker forms,
destination and conflict behaviour are the coordinator's inference from the plan, the schemas and Standard 17;
the owner may reverse any of them.

**What proves §6's criterion.** `node --test --test-concurrency=1 test/init-e2e.test.mjs` (real templates, with
and without `--docs`); `test/init.test.mjs` covers the same property on synthetic templates.
