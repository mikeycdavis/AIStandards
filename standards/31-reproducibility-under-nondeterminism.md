# Standard 31 — Reproducibility Under Nondeterminism

Run the same prompt against a hosted model twice and the two answers may differ, and no setting the
project controls is guaranteed to prevent it. A project that trained its own model controls its seeds
and its run configuration. A project that calls a provider's endpoint controls what it sends, and
nothing else.

This standard is about the second case only. It asks that a result from such an endpoint be reported
as what it is: one draw from a source the project cannot fix, not a reading that a rerun will return.
The failure it is written against is reproducibility asserted from a setting: "temperature zero",
a seed parameter, a pinned identifier, none of which says that two runs agreed.

Source: item 31 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "Reproducibility" token of the "Reproducibility, versioning, model/data lineage, and
rollback" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 31 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **B**
> (baseline), recorded in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) with
> verdict `CONFIRMED` and owner MachineLearningStandards, and that review's substantive half is human
> judgment and carries `humanSignOff: null`. No maintainer of MachineLearningStandards has confirmed it.
>
> **The brief supplies one word and this standard supplies the rest.** The item is class `D` because
> its subject token is the brief's own; the requirements are this repository's judgment, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it
that reports a result, or relies on a comparison between results, produced by calls to a remote
inference endpoint: a provider's hosted model, or any model the project does not itself host, train or
control the serving of.

Terms, defined once and used verbatim below:

- **Endpoint result** — an output, or a figure computed from outputs, produced by calls to a remote inference endpoint.
- **Repeat** — a further run of the same subject on the same input, made to see whether the result agrees with an earlier one.
- **Variation** — the observed difference between the repeats of one endpoint result.
- **Reproducibility claim** — a statement that an endpoint result is reproducible, repeatable or deterministic, or that a rerun will return it.
- **Framework output** — what a detector, catalog rule, audit finding or generated report of this framework states.

It does **not** cover, and claims none of the ground of:

- **Reproducibility of a model the project trains or hosts**, random seeds and run configuration:
  MachineLearningStandards', which [Standard 7](07-boundary-with-adjacent-standards.md) R1 records this
  pack as deferring to, adding only remote-endpoint nondeterminism.
- **What subject served a call and what a call record holds**, which is
  [Standard 33](33-ai-observability.md) R1 and R2, and **how an evaluation names its subject**, which is
  [Standard 17](17-evaluation-plans-for-generative-systems.md) R6.
- **Pinning a model identifier**, which is [Standard 1](01-ai-system-manifest.md) R4.
- **Versioning, model and prompt lineage and rollback**, [Standard 29](29-ai-system-versioning-and-change-control.md), [Standard 30](30-model-and-prompt-lineage.md) and [Standard 32](32-rollback-and-recovery.md).

**Boundary posture B — baseline, deferring the whole of the owner's ground.** The boundary review
confirms the posture with owner MachineLearningStandards. Its evidence is two standards of that pack,
`15-reproducibility.md` (scope: it applies to every experiment whose result is reported, compared
against, or used to justify a decision) and `16-random-seeds.md` (scope: every source of randomness that
affects a reported result; it requires the seed and requires equally that the seed not be treated as a
guarantee it cannot give), with no rule ids recorded (reviewed 2026-09-04). The review's reasoning
is that this item adds only nondeterminism originating at a remote inference endpoint, which no seed the
project controls can remove, and that it must stay the shortest in the catalog. Nothing is claimed here
about the sibling pack beyond that record.

## Requirements

### R1 — Record what was set and what was not

**A project that reports an endpoint result MUST record the decoding and sampling parameters it sent with the calls, including any seed, and MUST record any parameter it left to the provider's default.**

A project cannot say what it controlled without saying what it did not. A parameter left to a default
is a control the provider holds, and the default can change without the project's code changing. The
record is of what was sent, not of what the provider honoured; whether an endpoint honours a seed or a
temperature is the provider's documentation to state and the project's to read, and this standard
states nothing about any provider.

### R2 — A reproducibility claim names its repeats

**A project MUST NOT make a reproducibility claim about an endpoint result unless it names the repeats made, their number and dates, and the variation observed, and MUST NOT make one from a parameter setting alone.**

"Temperature zero" and "we pass a seed" describe a request. They do not describe two runs that agreed.
A claim is supported by repeats of the very subject it is about, and an observed agreement is
a statement about those repeats on those dates: it does not extend to a later day, a later model
behind the same identifier, or a different input. A claim of no variation names how many repeats showed
none.

### R3 — A comparison reports its variation

**A comparison between endpoint results, or a decision taken on one, MUST report the number of runs behind each figure and the variation among them, and MUST NOT report a difference smaller than the observed variation as a change.**

Two single runs that differ show that two draws differ. A prompt change, a model change or a regression
is a claim that the subject differs, and it needs the spread of the source to be read against. This
requirement sets no threshold, no number of runs and no statistic; the project states which it used.
[Standard 17](17-evaluation-plans-for-generative-systems.md) R3 records what a prior version scored and
R6 names the evaluated subject; neither asks how many runs a figure rests on.

[Standard 20](20-regression-testing.md) R3 fixes a regression criterion before a run and requires each run reported as pass or fail against it; that is a decision rule, and this requirement does not displace it. Where a criterion sits inside the observed variation, Standard 20 R3 governs the pass or fail recorded, and this requirement governs what the report says the difference is: it does not call a difference inside the variation an improvement or a regression of the subject. A criterion the project fixed below the variation remains a criterion and is not a finding that the subject changed.

### R4 — This framework MUST NOT report a result reproducible from the presence of a setting

**No detector, rule, audit finding or generated report in this framework MAY state that an endpoint result is reproducible, repeatable or deterministic because a temperature, seed, pinned identifier or similar parameter is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that a seed is passed or a
temperature is set to zero; it cannot show that the endpoint honoured either, or that two runs agreed.
Whether an endpoint result reproduces is R2's record, and not the framework's to infer from a setting.

## Failure modes

| Requirement | Failure |
| --- | --- |
| R1 | A reported endpoint result with no record of the parameters sent, or with a parameter left to the provider's default and not recorded as such |
| R2 | "Deterministic" or "reproducible" stated because temperature is zero or a seed is passed; or a claim naming no repeats, number, dates or variation |
| R3 | A prompt or model change reported as an improvement or regression from one run per side, or from a difference inside the observed variation |
| R4 | A framework report of "reproducible" because a seed or temperature parameter is present |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The parameters sent with the calls behind each reported endpoint result, and those left to default | Project code, configuration, or the run record the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | The repeats a claim names, with number, dates and observed variation | A project document the project names | Human review |
| R3 | The number of runs and the variation for each compared figure | The project's comparison or decision record | Human review |
| R4 | The absence of any detector, rule, audit finding or generated report that reports reproducibility from a setting | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R3 is a human-authored record. A document naming a seed establishes that the project
wrote it down and says nothing about whether the endpoint honoured it; the reviewer reads what is
claimed against the records of the repeats that would carry it.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 would look for a declared parameter record, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place to put one; both are closed. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **R2 and R3 concern behaviour and records, not files.** Whether repeats were made, or a figure rests on several runs, is not a property of a checkout. A detector reading source would test for the presence of a setting, which R4 forbids this framework from reporting as a result.
3. **The namespace is another pack's.** MachineLearningStandards owns `reproducibility.*` ([Standard 6](06-standard-structure-and-rule-identity.md) records it), and this standard mints no id. A proposed rule, if one is natural, is recorded in the pull request that introduced this document for per-rule approval, and not here.

**Validation type.** R1 to R3 are `manual-review` obligations in this release; R4 constrains this framework and has no validation type, because the thing it prohibits is a behaviour of the tool. The validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | warning |
| R2 | error |
| R3 | error |
| R4 | error |

**Exemptibility.** R4 is not exemptible: no project circumstance makes it reasonable for a scan to report an effect from a presence. R2 is not exemptible, because an exception would record a project as knowingly making a claim nothing supports. R1 and R3 reach a system only where an endpoint result is reported or compared, and a system with none records, in its own documents, that the requirement does not reach it and why. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | For each reported endpoint result, the parameters sent are recorded and each parameter left to a default is recorded as such | A reported endpoint result with no parameter record, or a default not recorded as a default | A project that reports no endpoint result is out of scope and must **not** be faulted for lacking a parameter record |
| R2 | Each reproducibility claim names its repeats, their number and dates, and the observed variation | A reproducibility claim resting on a setting alone, or naming no repeats, number, dates or variation | A statement that a parameter was set, with no claim that results repeat, must **not** be faulted |
| R3 | Each comparison or decision states the runs behind each figure and the variation, and reports no change inside the variation | A change reported from one run per side, or from a difference smaller than the stated variation | A comparison whose stated variation is zero over a named number of repeats must **not** be faulted for lacking a spread; a pass or fail against a criterion fixed in advance under [Standard 20](20-regression-testing.md) R3 must **not** be faulted for being a verdict, provided the report states the variation and does not call a difference inside it a change |
| R4 | No detector, rule, audit finding or generated report in this repository states a reproducibility verdict from presence | A detector, rule, audit finding or report that states an endpoint result reproducible because a seed, temperature or pinned identifier is present | Reporting that a seed or temperature parameter was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries one, so R1 to R3 are enforced by review or not at all, and R4 holds today only because no such detector exists. The falsifiers in the table are available for manual review; what this release lacks is a detector that applies them. A record made stale by the event in the staleness table below does not satisfy the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R3 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made. Repeats made before a change describe the subject before it.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | Any change to anything this record names or relies on, including: a change to a parameter sent, or to a default the provider applies. |
| R2 | Any change to anything this record names or relies on, including: a change of model, of what served the call ([Standard 33](33-ai-observability.md) R2), of prompt, of parameters, or of input class since the repeats were made. |
| R3 | Any change to anything this record names or relies on, including: a change to either compared subject, or to the input set, since the runs behind the variation were made. |
| R4 | A new detector, rule or report that touches reproducibility. |

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one word, "Reproducibility", inside a bullet of four subjects and states no requirement, level or evidence for it. The item is class `D` because its subject token is derived from the brief; the requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1 to R3 in full**, with the defined terms endpoint result, repeat, variation and reproducibility claim, and the rulings that a parameter setting is not a repeat and that a difference inside the observed variation is not a change.
- **R4**, the constraint on this framework, in the same form as the equivalent requirement in [Standard 25](25-grounding-and-hallucination-control.md) and [Standard 33](33-ai-observability.md).
- **The exclusions in Scope** as division lines; where this standard stops and items 29, 30 and 32 begin, and the order given to Standard 20 R3 in R3's body, are unconfirmed by anyone.
- **The severity assignments** (one level per requirement, in Validation), the statement that no attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the decision to name no rule id.

Not authored here: the posture, its owner and the two evidence entries are the boundary review's, and its `humanSignOff` is `null`. Standard 7 R1's statement that this pack adds only remote-endpoint nondeterminism is that standard's own, cited and not restated.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) R1 records reproducibility, random seeds and run configuration as MachineLearningStandards', with this pack adding only remote-endpoint nondeterminism. [Standard 17](17-evaluation-plans-for-generative-systems.md) leaves to this item whether a hosted model's results repeat (its R2 asks that a suite be runnable, not that figures reproduce), and [Standard 19](19-robustness-evaluation.md) does the same for a perturbed result; R2 and R3 here are what they defer to. [Standard 33](33-ai-observability.md) R1 and R2 govern the record of which subject served a call, and R2's staleness rule relies on them. [Standard 1](01-ai-system-manifest.md) R4 asks for the pinned identifier; a pin names a version and does not make its output repeat, which is R2's reading. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and non-lowering language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests section answers. [Standard 29](29-ai-system-versioning-and-change-control.md), [Standard 30](30-model-and-prompt-lineage.md) and [Standard 32](32-rollback-and-recovery.md) were written in the same batch as this standard and the lines between them are unconfirmed by anyone (Q45). [Standard 20](20-regression-testing.md) R3 fixes a criterion before a run, and R3 here is set against it in R3's body. **Outside this pack.** MachineLearningStandards' `15-reproducibility.md` and `16-random-seeds.md` are named in Scope with what the boundary review recorded; this is a deference, not a crosswalk, and no maintainer has confirmed it. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R3 is enforced; R4 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R4 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` emits a verdict about whether a model result is reproducible, repeatable or deterministic. |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 | A place to declare the parameters sent: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R2, R3 | A check that a claim names its repeats, or a comparison its variation | Reading intent from free text is a heuristic, and a false positive teaches a project to write whatever passes |
| R4 | A test asserting no detector, rule, audit finding or report emits a reproducibility verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | A reserved-namespace id and a shard, once an owner decides; `reproducibility.*` is another pack's | Not decided; this standard names none |

**What no future release will implement.** A detector that reports an endpoint result reproducible, repeatable or deterministic from the presence of a temperature, seed, pinned identifier or similar parameter. R4 forecloses it, and the foreclosure is the point: a presence is not an effect.
