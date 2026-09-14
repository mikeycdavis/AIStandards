# AIStandards

Numbered AI engineering standards, and the `audit` and `validate` commands that check a repository
against them.

**Version 0.1.0 — Phase 1 complete, Phase 2 begun.** This is a working CLI with eleven of
fifty-three standards and forty-six of a planned ninety-six rules, nine of which a detector can
actually reach. The catalog's two blocking reviews
have passed, so the fifty-three items and their numbering are settled. What it does, it does
honestly. What it does not do, it reports as not done rather than as passed.

## What this is for

An AI system fails in ways ordinary software does not. It calls a model nobody pinned, on a prompt
nobody versioned, through a tool nobody classified, and the first time anyone asks which of those
changed is during an incident. This pack makes those things declarable, and then checks the
declarations.

## Quick start

```bash
node scripts/standards.mjs audit /path/to/repo
```

Evidence discovery. Needs no policy, produces no verdict, and says so.

```bash
node scripts/standards.mjs validate /path/to/repo --json
```

The policy-aware verdict. Reads `ai-policy.yml` **from the target**, never from this checkout.

Requires Node 18 or later. There are no dependencies to install, and that is a decision rather than
an omission — every import is a `node:` builtin or a local module.

## The part worth reading first

A compliance tool has one way to be dangerous, and it is not being wrong. It is reporting a clean
result for a check that never ran. Three things follow from that, and they shape everything else
here:

**Unknown is never a pass.** A rule with no detector, a check that could not run, or a walk cut short
by an exclusion all report as `not-evaluated`. Not as `passed`. This repository's own verdict is
`NON_COMPLIANT` at 0%, and that is the honest number.

**A prohibition nobody examined is named as such.** `prohibited-but-unestablished` is its own
outcome, reported in its own array, and where the rule is checkable it caps the verdict — because a
`forbidden` rule nobody looked for is not a rule anybody is meeting. A `not-evaluable` prohibition is
reported the same way and, per the next paragraph, does not move the status.

**A requirement this framework cannot check says so.** `not-evaluable` is a first-class validation
type for requirements whose subject is the model's behaviour rather than the repository's contents.
It sits beside the verdict and changes neither the status nor the score, in either direction.

## Vocabulary

| | |
| --- | --- |
| **Status** | `COMPLIANT` · `COMPLIANT_WITH_EXCEPTIONS` · `NON_COMPLIANT` · `NOT_EVALUATED` · `BLOCKED_BY_INVARIANT` |
| **Distinction** | `passed` · `failed` · `warning` · `skipped` · `not-evaluated` · `prohibited-but-unestablished` |
| **Exit codes** | `0` clean · `1` project failure · `2` configuration error · `3` blocked by invariant |

Exit codes are process semantics. The verdict is the `status` field of the JSON report — see
[Standard 5](standards/05-verdict-vocabulary.md).

## What is in this release

**Standards** — [1 AI System Manifest](standards/01-ai-system-manifest.md) ·
[2 AI Risk Tiering and Applicability](standards/02-ai-risk-tiering-and-applicability.md) ·
[3 Machine-Readable AI Policy](standards/03-machine-readable-ai-policy.md) ·
[5 Verdict Vocabulary](standards/05-verdict-vocabulary.md) ·
[6 Standard Structure and Rule Identity](standards/06-standard-structure-and-rule-identity.md) ·
[7 Boundary with Adjacent Standards Packs](standards/07-boundary-with-adjacent-standards.md) ·
[8 AI Safety Requirements and Safety Cases](standards/08-ai-safety-requirements-and-safety-cases.md) ·
[9 Misuse and Abuse Prevention](standards/09-misuse-and-abuse-prevention.md) ·
[11 Autonomy Levels and Delegated Authority](standards/11-autonomy-levels-and-delegated-authority.md) ·
[21 Prompt and Instruction Security](standards/21-prompt-and-instruction-security.md) ·
[45 Approval Gates](standards/45-approval-gates.md)

1, 3, 5, 6 and 7 are machinery — each documents something the code does, so no behaviour ships
undocumented. 21 and 45, written in Phase 1, are the easiest and hardest domain standards, chosen to
prove the document skeleton at both extremes. 2, 8, 9 and 11 are the Phase 2 corpus written so far.

**Rules** — 46 across eight shards; **9 have a detector**. The rest report as unevaluated. That ratio
is not a defect to be hidden: an AI standards pack is mostly manual review, and a design claiming
otherwise would be claiming detectors nobody has written.

**Not in this release, deliberately.** `init` (later in Phase 2), attestations and exceptions (Phase 4),
containers, workflows and the StandardsEnforcer adapter (Phase 5). The escape hatch is built after
the checks it is an escape from, never before — a sibling pack in this portfolio records what
happened when its bootstrap wrote evidence its own evaluator then accepted. `test/no-phase-creep.test.mjs`
enforces these boundaries rather than trusting anyone to remember them.

## The catalog, and what its two reviews did and did not settle

[`artifacts/prompts/ai-standards-spec.md`](artifacts/prompts/ai-standards-spec.md) is the record of
identity: fifty-three items, each classed **Derived** from a token in the brief, **Verbatim** from
its words, or **Authored** by this repository. Two commands gate it, and both pass:

```bash
node scripts/fidelity.mjs
```

Every block the specification presents as the brief's words is compared to
[the brief](artifacts/prompts/original_prompt.md) character for character.

```bash
node scripts/inventory.mjs
```

Every derived item resolves to a real token in the brief; every authored item is declared as
authored and surfaces in its standard's Additions section; every item that defers to another pack
carries recorded evidence naming that pack's standard.

**Numbering is now settled**, and the reviews changed things to get there: the plan's token count
was wrong, four boundary postures changed on evidence, two were narrowed, one crosswalk was
withdrawn as unsupported, and the plan's claim that this pack's seventeen rule namespaces were
disjoint from every other pack's turned out to be false for six of them. Each correction is recorded
where it was made rather than quietly applied.

**What the reviews do not establish.** That any item is well drafted. That the tokenisation is the
only reasonable reading of a prose list. That the boundary actually holds — the mechanical half is
checked, and the substantive half is a judgment about the meaning of two documents.
[`artifacts/boundary-review.json`](artifacts/boundary-review.json) records `humanSignOff: null`, and
that is not a placeholder to be filled in by anyone who has not read the nine packs.

The coincidence that fifty-three is also EngineeringStandards' count is arithmetic accident. Nothing
should be read into it.

## Where this sits

This pack ships into a portfolio that already has owners for adjacent ground.
[Standard 7](standards/07-boundary-with-adjacent-standards.md) is the whole answer, but in short:
**MachineLearningStandards** owns reproducibility, provenance, evaluation and drift, and this pack
links rather than copies. **EngineeringStandards** owns the `ai.*` namespace permanently, and
**UIUXDesignStandards** owns `ai-ux.*`; where this pack covers the same ground it mints its own
identity and records a semantic crosswalk, never a reuse. **UIUXDesignStandards** owns accessibility
and how a disclosure is presented; **PredictionStandards** owns uncertainty on a prediction record.
**StandardsOrchestrator is frozen** and is not an authority — this pack conforms to
**StandardsEnforcer** only.

Each of those divisions is evidenced against a real standard at a recorded commit in
[`artifacts/boundary-review.json`](artifacts/boundary-review.json), across nine packs.

## Repository layout

```
standards/    numbered normative documents
rules/        rule identity and metadata — the catalog
schemas/      policy, manifest, tool permissions, and both report envelopes
scripts/      the CLI and its modules. ESM, zero dependencies
test/         node:test suites and detector fixtures
artifacts/    the governing prompt, the derived specification, the boundary review,
              the plan breakdown, the foreign-namespace snapshot (560 ids, nine packs)
docs/         architecture, captured as a pre-implementation baseline
ai-policy.yml this repository's own policy
```

## Running the tests

```bash
node scripts/test.mjs
```

An explicit file list, no globs: a glob matching nothing looks exactly like a suite that passed. Zero
discovered files is exit 2. Every detector is asserted twice — once on a fixture that must provoke it
and once on a fixture that must not — and the second assertion is the one that matters.

The suite runs at concurrency 1. The fidelity and inventory suites corrupt a real file, assert the
specific failure, and restore it; two of those running in parallel overwrite each other's restore,
and the symptom is a test failing for a reason unrelated to what it asserts.
