# Standard 37 — Fairness and Harm Distribution

An AI system's output is rarely wrong in the same way for everyone. A model that is right 95% of the
time can be right 99% of the time for one group of people and 80% of the time for another, and the
average hides that gap by construction. "The system is fair" is a description of that hidden
distribution, and it is not a requirement: it names no group, no harm, no measure, and no observation
that would show the claim false.

Three things are routinely run together. A **harm** is something a person bears because of what the
system output or did. A **disparity** is a difference in how often or how severely a harm falls on
different groups. **Fairness** is a judgment about whether a disparity is acceptable, and it depends on
a chosen measure, a chosen comparison and a context; the system cannot emit it by itself.

Source: item 37 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "fairness" token of the "Accessibility, fairness, transparency, and user
disclosure" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 37 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) under `notGovernedElsewhere`
> after a search of nine packs found no owner, and that review's substantive half is human judgment and
> carries `humanSignOff: null`. No maintainer of any adjacent pack has confirmed it.
>
> **The brief supplies one word and this standard supplies the rest.** The item is class `D` because
> its subject token is the brief's own; the requirements are this repository's judgment, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it
whose output or action affects people, directly or through a decision another person or system makes
from it.

Terms, defined once and used verbatim below:

- **Fairness record** — for each output or action that affects a person, directly or through a decision another person or system makes from it, the groups it reaches, the harm, and who bears it, including people who are not users of the system; it may conclude that no individual consequence arises.
- **Fairness basis** — the measure used, the reason that measure was chosen, the groups compared, the
  data it was computed from and the criterion applied, in a dated record that precedes the result.
- **Fairness statement** — a statement that a system, model, component or output is fair, unbiased, equitable or non-discriminatory, does not disadvantage a group, or treats people or groups equally, comparably or without bias.
- **Reported value** — a quality, error rate, harm rate, measure of disparity or outcome of a system.
- **Group report** — a reported value given, for every group in the fairness record or named in a distribution record, either as a figure with the size of the group it was computed on or as "not measured" with the reason; a group that was not measured is never presented as parity, and where the fairness record names no group the figure is labelled an aggregate.
- **Distribution record** — for each harm in the fairness record: which groups bear it and how, how proxies were looked for, each proxy identified, and, where a mitigation shifts a harm to another group, to people outside any group in the fairness record, or into a different harm, where the shift falls.
- **Fairness verdict** — a fairness statement, a statement that disparity is absent, a statement that an evaluation of a system's fairness or disparity was adequate, or a statement that a mitigation of a disparity works.
- **Presence artifact** — a fairness document, a bias test, an evaluation tool, a declared group list, a stated metric, or a project's own fairness record, fairness basis or group report.
- **Fairness stand-in** — a list of protected characteristics, a preferred measure, a reference dataset or benchmark, or a numeric threshold that would take the place of the project's own record.
- **Framework output** — what a detector, catalog rule, audit finding or generated report of this framework states, or any other message, score or status it emits.
- **Prohibited framework output** — a framework output that states a fairness verdict, whatever its basis, or that supplies a fairness stand-in.

It does **not** cover, and claims none of the ground of:

- **Accessibility** and **user disclosure**, which are items 38 and 40; unequal *outcome* is this item,
  and whether a person can use a feature is not.
- **Documentation for a reader** of the repository, which is item 39.
- **Personal data in prompts, traces and evaluation fixtures**, which is
  [Standard 13](13-personal-data-in-ai-systems.md). Whether a group attribute may lawfully be collected
  is a legal matter no written standard of this pack governs.
- **Evaluation planning**, which is [Standard 17](17-evaluation-plans-for-generative-systems.md); a
  group report is an evaluation result and inherits it.
- **Legal compliance**, which this standard does not answer.

**Boundary posture O — owned outright.** The boundary review lists this item among those searched
across nine packs for an owner and not found; [Standard 7](07-boundary-with-adjacent-standards.md)
records "Fairness and harm distribution — AIStandards — Owns. No existing owner". The review records
no adjacent standard as evidence for this item, and none is cited here.

## Requirements

### R1 — Keep a fairness record

**A system whose output or action affects people MUST have a fairness record that covers each such output or action.**

A record may legitimately say that no individual consequence arises; that is a finding, and it is
recorded as one. It is a document, not a manifest field: `schemas/ai-system-manifest.schema.json` is
closed and has no property for it.

### R2 — Back every fairness verdict with the record and the basis

**A fairness verdict MUST be accompanied by the fairness record and the fairness basis.**

Fairness measures are not interchangeable and cannot all hold at once; which to prefer is the
project's judgment, and this standard fixes neither a measure nor a threshold. A figure with no named
measure is unreadable: it cannot be compared with the next run.

### R3 — Report by group

**Every reported value MUST be a group report.**

An aggregate is dominated by the largest group. "Not measured" is a finding about the evaluation, not
a finding of parity.

### R4 — Keep a distribution record

**Each harm in the fairness record MUST have a distribution record.**

Removing a sensitive attribute from the inputs does not remove it from the outcomes: a model finds
correlates such as postcode, device or language whether or not anyone asked it to.

### R5 — This framework issues no fairness verdict and carries no fairness stand-in

**No framework output MAY be a prohibited framework output.**

This is a constraint on the framework, not on a project. A repository can show that a fairness document
exists; it cannot show that the groups chosen were the groups that matter, that the data measured the
people the system reaches, or that behaviour in use resembles behaviour in the test. Which attributes
the law protects and which measure suits a context are contextual and jurisdictional.

## Failure modes

| Requirement | Failure |
| --- | --- |
| R1 | Output or action that affects people that the fairness record does not cover, including people affected who never use the system |
| R2 | A fairness verdict without the fairness record or the fairness basis, including a basis dated after the result it judged |
| R3 | A reported value that is not a group report: an aggregate only, a group with neither a figure nor a not-measured entry with its reason, a figure with no size, or a group not measured presented as parity |
| R4 | A harm in the fairness record with no distribution record, or one missing an element of its definition |
| R5 | A prohibited framework output |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The fairness record | A project document the project names; **no manifest or policy field exists for it** | Human review |
| R2 | The fairness record and the fairness basis, dated before the result | The project's evaluation records and published statements | Human review |
| R3 | The group reports and the not-measured entries with reasons | The project's evaluation results | Human review |
| R4 | The distribution records | The project's analysis documents | Human review |
| R5 | The absence of any prohibited framework output | The catalog, detectors, rules and reports of this framework | Code review |

A document establishes only that the project wrote something down. Whether a running system treats
groups as claimed is not-evaluable from a repository.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
[Plan 02 section 6](../artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md) requires every
standard to cite at least one rule or record in its Validation section why it ships with none; this is
that record.

1. **There is no artifact a rule could read.** `schemas/ai-system-manifest.schema.json` and
   `schemas/ai-policy.schema.json` are closed and have no place for a fairness record. Adding a field
   is a schema-versioning decision outside this slice (by the same reasoning as plan 02 section 8).
2. **R2 to R4 concern analysis and behaviour, not files.** A detector reading source would test for a
   presence artifact, which R5 forbids this framework to report as a result, and would have to carry a
   fairness stand-in, which R5 also forbids.
3. **No shard exists for the namespace.** `fairness` is a reserved segment in `scripts/catalog.mjs` with
   no shard. This standard mints no id.

**Validation type and severity.**

| Requirement | Validation type | Severity |
| --- | --- | --- |
| R1 | `manual-review` | `error` |
| R2 | `manual-review` | `error` |
| R3 | `manual-review` | `error` |
| R4 | `manual-review` | `error` |
| R5 | none (a constraint on the framework) | none |

These are the levels a rule would carry if one is minted; this release emits no framework finding at
them.

**Exemptibility.** R5 is not exemptible, and neither is R2: an exception would record a project as
knowingly making a claim no evidence can support. Each other requirement arises only on its own
condition; where its condition does not hold it does not arise. That is a scope condition, not a
disposition: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4's dispositions are recorded
against catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2
R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each output or action that affects people is covered by the fairness record | Output or action that affects people, including people who never use the system, that the fairness record does not cover | A fairness record that concludes no individual consequence arises is a fairness record |
| R2 | Each fairness verdict is accompanied by the fairness record and the fairness basis | A fairness verdict without either, or with a fairness basis dated after the result | A statement of a named measure on named groups, with the number and no fairness verdict, is not flagged |
| R3 | Each reported value is a group report | A reported value that is not a group report | A "not measured, attribute not lawfully collected" entry is a group report |
| R4 | Each harm in the fairness record has a distribution record | A harm with no distribution record, or one missing an element of its definition | A distribution record of no proxy identified, with how proxies were looked for, and no mitigation shift, is complete |
| R5 | No prohibited framework output exists | A prohibited framework output | Reporting that a presence artifact was *found*, as an observation with no fairness verdict, is not a prohibited framework output |

**No falsifier is automated in this release.** No rule reads a fairness record, so no detector checks
R1 to R4; they are held by review, and R5 holds today because no such framework output exists. The
falsifiers are manual, not absent.

## Exceptions and staleness

There is no policy-level exception mechanism in this release, because no rule exists to except.

| Requirement | Invalidated by |
| --- | --- |
| R1 | A change of model, of the output or action, of the decision it feeds, of the harm or who bears it, or of the people it reaches; and a well-founded report that contradicts the fairness record |
| R2 | A change of model, of the measure, of the reason it was chosen or the context of use, of the groups compared, of the data the figure was computed from, of the criterion, or of the fairness record; and a well-founded report that contradicts the verdict |
| R3 | A change of model, of evaluation data, of the quantity reported, of the reason a group was not measured, of the size of a group, or of the groups in the fairness record; and a well-founded report that contradicts a group report |
| R4 | A change of model, of the input features or data, of the people reached, of the harm, of how proxies were looked for, or a mitigation; and a well-founded report that contradicts a distribution record |
| R5 | A change to the catalog, detectors, rules or reports of this framework |

A well-founded report invalidates only the claim it contradicts. Nothing in this release detects the
transition. Operational handling is item 34's subject.




## Additions this standard makes beyond the source

The brief contributes one word, "fairness", inside a bullet of four subjects. It states no
requirement, level or evidence. Specifically authored here, none of it owner-approved:

- **Every defined term and R1 to R5**, including the rulings that "no individual consequence" is a
  legitimate record, that a fairness basis is recorded before the result, that "not measured" is never
  parity, that the harm of people who are not users is in scope, and that R2 is not exemptible.
- **The severities and validation types** in Validation.
- **The exclusions in Scope** as division lines, unconfirmed by anyone.
- **The ruling that this standard ships with no catalog rules**, and the invalidation table.

Not authored here: posture `O` and the ownership line in Standard 7.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) records the ownership line. R5 has the form of
[Standard 8](08-ai-safety-requirements-and-safety-cases.md) R6, [Standard 17](17-evaluation-plans-for-generative-systems.md)
R9 and [Standard 25](25-grounding-and-hallucination-control.md) R6. Standard 17 governs how a group
report is planned, scored and reported. [Standard 1](01-ai-system-manifest.md) declares no affected
group and none is proposed. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 governs
non-lowering, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 (each requirement carries
a falsifier or is declared not-evaluable) is what the Tests section answers.

Items 34, 38, 39 and 40 are unwritten on this base; the lines drawn above are provisional until they
are. **Outside this pack:** no adjacent pack is cited, and no ADR covers this standard —
`artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R4 is enforced; R5 holds today because no such framework output exists.**

| Requirement | State |
| --- | --- |
| R1 to R4 | Not enforced; held by review |
| R5 | No framework output in `scripts/`, `rules/` or `ai-policy.yml` evaluates fairness, bias or protected characteristics; `fairness` appears only as a reserved namespace segment in `scripts/catalog.mjs`. No test asserts the absence |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test |

**Proposed, and deliberately absent. None of the following exists:** a declaration of affected groups
with a place to live (a schema change); fixtures and a detector that runs project-supplied checks,
which must carry no fairness stand-in; a test that no prohibited framework output exists; and a rule id in the `fairness` namespace once an owner is decided.

**What no future release will implement.** A prohibited framework output. R5 forecloses it.
