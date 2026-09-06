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

## 2. Current state, verified 2026-09-06

**Written: 8 of 53 standards** — `standards/01-ai-system-manifest.md`,
`02-ai-risk-tiering-and-applicability.md`, `03-machine-readable-ai-policy.md`,
`05-verdict-vocabulary.md`, `06-standard-structure-and-rule-identity.md`,
`07-boundary-with-adjacent-standards.md`, `21-prompt-and-instruction-security.md`,
`45-approval-gates.md`.

**45 standards remain unwritten.**

**Rules: 32 across 7 shards** — `rules/agent.json` (4), `eval.json` (5), `gate.json` (6),
`lifecycle.json` (6), `misuse.json` (1), `privacy.json` (5), `promptsec.json` (5). The plan targets
roughly 96 across 17 namespaces, so 11 shards remain. **Nine** of the 32 are reachable by a detector
(`EVALUATED_RULES`, `scripts/standards.mjs:130`); the other 23 report `skipped / not-evaluated` by
construction. That gap is Phase 3's work, not this phase's.

**Built and passing:** `scripts/inventory.mjs` (385 lines, 8 checks) and `scripts/fidelity.mjs`
(94 lines).

**Not built, despite appearing in the Deliverables list below:** `scripts/sync-rule-tables.mjs`,
`scripts/manifest.mjs`, `scripts/toolperms.mjs`, `scripts/init.mjs`,
`artifacts/standards-source-inventory.json`, and every template. **Do not run
`node scripts/sync-rule-tables.mjs --check`** — the file does not exist and you will get a module-not-
found error, not a check failure. It is listed in §7 Verification as the phase's *exit* command, not
as something runnable today.

---

## 3. Purpose

Write the full normative corpus and prove it traces to the brief. The two blocking catalog reviews
that gate this phase have run and pass mechanically (see §9). The remaining work is the 45 unwritten
standards, the 11 remaining rule shards, the templates, and `init`.

## 4. Deliverables

- `artifacts/prompts/ai-standards-spec.md` — the derived enumeration with its three-class provenance
  block (D derived / V verbatim / A authored). **Exists.** Each item's row gains a path in the
  `Implemented by` column as its standard is written.
- `artifacts/standards-source-inventory.json` — `expectedCount`, `reviewedOn`, and per item
  `{number, title, class, derivedFrom, implementedBy}`. **Not written.**
- All 53 standards, each with the ten H2 sections carrying the brief's nine requirements. **8 done.**
- The remaining 11 rule shards, to roughly 96 rules. **Not started.**
- All templates: manifest, threat model, evaluation plan, tool permissions, incident report,
  red-team report, ADR, starter policy, agent instruction files. **None written.**
- `scripts/inventory.mjs` **(done)**, `fidelity.mjs` **(done)**, `sync-rule-tables.mjs`,
  `manifest.mjs`, `toolperms.mjs`.
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

The guard is not that the corpus is frozen — this phase writes 45 more. It is that a standard
arrives *deliberately*, by being added to that list, rather than by appearing unnoticed.

**Verify (steps 1–5):**

```bash
node scripts/test.mjs && node scripts/fidelity.mjs && node scripts/inventory.mjs
```

Success is all three exiting 0, with the test runner reporting `0` failures and `inventory.mjs`
reporting one more item under `implemented` than before. Use the *semantic* criteria in §6 to judge
the standard itself — a moved counter proves the file was seen, not that it is correct.

### Step 6 — Commit

One standard per commit, message `Standard NN — Title`. Run step 5's verification before committing;
`git status --porcelain` must be empty afterwards.

---

## 6. Acceptance criteria

Semantic, not arithmetic. Counter movement is evidence a file was noticed, never evidence it is
right — do not treat a target number as the goal.

- [ ] Every written standard has all ten H2 sections, present and in the order listed in §5 step 3
- [ ] Each of the brief's nine requirements resolves to a present, non-empty section for every
      standard, via the mapping table held as test data
- [ ] Every rule cites a standard; every standard cites at least one rule **or records in its
      Validation section why it ships with none**
- [ ] **Fidelity review passes** — every class-V block is byte-identical to the brief
- [ ] **Boundary review passes mechanically**, and is separately recorded as lacking human sign-off
- [ ] Every class-A item carries a non-empty `## Additions` section that enumerates its authored
      requirements
- [ ] Generated rule tables match the catalog byte-for-byte *(blocked: `sync-rule-tables.mjs` unwritten)*
- [ ] **`init` output satisfies zero rules**, asserted directly *(blocked: `init.mjs` unwritten)*

## 7. Verification — the phase exit command

Runnable today:

```bash
node scripts/test.mjs && node scripts/inventory.mjs && node scripts/fidelity.mjs
```

The full form, once `sync-rule-tables.mjs` exists, adds `node scripts/sync-rule-tables.mjs --check`.

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

## 11. The next slice

**Standard 8 — AI Safety Requirements and Safety Cases**, or any other unwritten item. Standard 11
(Autonomy Levels and Delegated Authority) was written on 2026-09-06 and is no longer next.

Item 8 is class `D` (token `AI safety`), posture `O`. Being posture `O` it needs no boundary evidence,
which makes it a clean exercise of the §5 procedure without the crosswalk complication. Standard 02
names it as one of the two items its own text most depends on.
