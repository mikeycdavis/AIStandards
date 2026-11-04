# Standard 50 — Evaluation Integrity Prohibitions

An evaluation result is worth what its instrument and its selection were worth. Two things spoil one
without changing a single number: the instrument is altered after the outcome is known, or the
outcome is chosen from several that were produced. In both, every figure in the report may trace to a
real run, and the report still describes a measurement that was shaped to read well.

This standard states two prohibitions against those, and one constraint on this framework. They are the
negative face of the "benchmark integrity" token: what a project must never do to the evaluation it
reports, whatever the evaluation was built with. They are stated as prose requirements. **This standard
mints no rule, no prohibition id and no shard.**

Two prohibitive evaluation rules already exist, `eval.no-test-set-tuning` and
`eval.no-fabricated-results`, minted in Phase 1 and stated by [Standard 17](17-evaluation-plans-for-generative-systems.md)
as its R4 and R5. **Whether they are this item's prohibitions is open question Q19. The owner decided on
2026-10-15 (option C) to write this standard first, as prose, keeping the placement question open and
moving or re-attributing no rule. This standard does that and nothing else: it does not restate those two
rules, does not claim them, and does not change their `standard` field.**

Source: item 50 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
authored as the negative face of the "benchmark integrity" token of the "Model evaluation, benchmark
integrity, robustness, and regression testing" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 50 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. The boundary posture is **O**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) by listing item 50 under
> `notGovernedElsewhere`. That review's substantive half is human judgment and carries
> `humanSignOff: null`.
>
> **This item is authored, not derived.** The brief has no prohibition section; the specification lists
> every must-never requirement as class-A work in Band L. The requirements below are this repository's
> judgment, and the [Additions](#additions-this-standard-makes-beyond-the-source) section lists them. None
> is owner-approved.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it — a
repository that invokes a model, retrieves context for one, or acts on a model's output — where the
project reports an evaluation result for it.

Terms, each defined once here and used verbatim below:

- **Instrument** — the evaluation set's items, its reference answers, its scorer (a rubric, a metric
  implementation, a judge model and its prompt) and its bar (the threshold or criterion that decides
  whether a result is acceptable).
- **Reported result** — an evaluation figure or judgement that the project states, publishes or cites as
  describing its system.
- **Run set** — every run of an evaluation, on a given evaluated subject, that was executed against one
  version of the instrument and whose results exist as artifacts.

It does **not** cover, and claims none of the ground of:

- **Selection of prompts, models or configuration by held-out score**, and **reporting a number no run
  produced.** [Standard 17](17-evaluation-plans-for-generative-systems.md) R4 and R5 state those. They
  stay where they are.
- **Contamination, exposure of an evaluation set to a model, and a benchmark that no longer serves.**
  [Standard 18](18-benchmark-integrity-and-contamination.md) owns them.
- **Writing the plan before the run, naming the evaluated subject, and recording the scorer.** Standard 17
  R1, R6 and R7 own them. A plan revised after results exist is already read there as governing the next
  run only; R1 below asks that the revision be visible, not that it be forbidden.
- **What an evaluation must cover** ([Standard 19](19-robustness-evaluation.md)) and **when regressions are
  tested and what difference fails a change** ([Standard 20](20-regression-testing.md)); the overlap with
  Standard 20 R3, R4 and R6 is set out below.

**Where this standard and Standard 17 meet.** A scorer adjusted until held-out scores look right is
Standard 17's R4 case, and it is also an alteration of the instrument after the outcome was seen, so R1
here reaches it too. The two are compatible and a project meets both; neither narrows the other. A
reported result drawn from a run set by its outcome is not a fabricated number, since each figure traces
to a run, and is R2's case here and not Standard 17 R5's.

**Where this standard and Standard 20 meet.** [Standard 20](20-regression-testing.md) R3 requires the failure
criterion of a regression run to be fixed before the run, R4 forbids changing a criterion, suite, baseline or
scorer after a run to alter its verdict unless the change and its reason are recorded with the verdict, and R6
bounds a regression claim to the suite, versions and criterion it names. R1 here reaches the same ground from the
reported result's side: a bar moved from 90 to 85, an item dropped or a scorer reworded after a result was seen is
both a change recorded with the verdict under Standard 20 R4 and a change after which the reported result names the
instrument version it was obtained under, under R1 here. Standard 20 governs the regression run, its criterion and
its verdict; R1 here governs any reported evaluation result, whether or not a regression run is involved, and the
instrument version it names. The two are compatible, a project meets both, and neither narrows the other. Whether
one owner should hold the act is Q58 and is not answered here.

**Boundary posture O — owned outright.** The boundary review lists this item as one for which no pack in
the portfolio was found to hold an owner. This document accepts that record for what a repository can
establish, and narrows it there: that an instrument's history and a run set are on record is a reviewable
fact, so R1 and R2 are `manual-review` obligations. It adds no precedent to the review's, and no other
pack was read for this standard. The rules `eval.no-test-set-tuning` and `eval.no-fabricated-results`
carry crosswalk entries to other packs; those are Standard 17's records, were not re-read here, and
nothing below relies on them.

## Requirements

### R1 — Do not alter the instrument after seeing a result without recording it

**A reported result MUST NOT be presented as obtained under an instrument that was changed after a result
on the earlier version was seen, unless the change is recorded with its date and the reported result names
the instrument version it was obtained under.**

The alterations are ordinary: an item dropped as "ambiguous" after the system failed it, a reference
answer corrected towards what the system said, a rubric reworded, a judge prompt edited, a bar moved from
90 to 85. Each may be justified. The requirement does not forbid any of them; it requires that the
result not be carried under the old name. A pass rate on the revised set is a statement about the revised
set.

**The prohibited act is the presentation, not the change.** A corrected reference answer found by
independent review before any run is not covered. A change made after a result on the earlier version was
seen, and not recorded, is. The record needs a date and what changed; it does not need a justification,
and whether a justification is good is not a property of a repository.

**A scorer re-pointed without edit is a change.** A judge model alias that resolves to a different model, as
Standard 17 R7 observes, changes the numbers while nothing in the repository's text does. Whether the
project can see that it happened is its own record's matter; a change it knew of and did not record is
within R1.

### R2 — Do not report a selection from the run set as the result without saying so

**A reported result MUST state how many runs of the run set it was drawn from, and where it is the best,
the worst, a subset or an exclusion of that run set, MUST say so and give the basis of the selection.**

An evaluation run several times, against a hosted model whose output varies, yields several figures. A
report of the highest one, of the runs that finished, of the cases that did not time out, or of the seeds
that "worked" is a report of a choice. Every figure traces to a run, so a trace is not what is missing; the
choice is.

**Excluding cases or runs is allowed, and so is reporting a best run.** The requirement asks that the report
say it: the count, what was set aside, and the rule that set it aside. A rule stated before the run set
existed and applied unchanged is the clearest basis, and the requirement does not demand one. A single run
reported as a single run satisfies the requirement and needs no further statement.

**This is not a requirement to report variation.** This standard states nothing about how uncertainty is quantified or shown. R2 concerns only whether the
selection made is visible.

### R3 — This framework MUST NOT report an evaluation honest from the presence of a record

**No detector, rule, audit finding or generated report in this framework MAY state that an evaluation was
untampered, unselected, or reported honestly, because a plan file, a hash, a lock file, a signed commit, a
results file or a declaration is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that a results file is
committed and that a hash was written beside it. It cannot show that the instrument was not altered
before the hash was taken, or that the run set was complete. Reporting integrity from a presence would turn
a record into a finding, and give a clean verdict to the evaluations most carefully dressed.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| A result under a changed instrument carried under the old name | A set loses its failed items, or a bar moves, after a first run, and the later pass rate is reported against the original plan with no record of the change | R1 |
| A reference answer moved towards the system | A reference answer rewritten after a run to match the system's output, and the score reported as for the original set | R1 |
| A judge changed after the outcome | A judge prompt edited after a run looked wrong, the new scores reported with no record of the edit and no instrument version | R1 |
| Best of several reported as the result | Five runs executed; the highest is reported with no count and no statement that it is the highest | R2 |
| Exclusions with no stated basis | Cases that errored or timed out are dropped from the denominator and the report does not say so | R2 |
| Integrity read from a presence | A framework report of "evaluation intact" because a results hash or a lock file is committed | R3 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The instrument's version history; a dated record of each change made after a result on the earlier version was seen; the instrument version named in each reported result | The repository's history of the evaluation set, reference answers, scorer and plan; the document carrying the result | Human review. **No manifest or policy field exists for the record; see Implementation** |
| R2 | The run set's artifacts, the count and basis stated in the report, and a comparison of the two | Retained run artifacts; the document carrying the result | Human review |
| R3 | The absence of any detector, rule, audit finding or generated report that reports an evaluation's integrity from a presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 and R2 is a human-authored record read against the history. A history showing no change,
and run artifacts showing one run, establish that no change and no selection is on record. They do not
establish that none occurred: run artifacts can be discarded, and the history can be rewritten. That part
is not-evaluable from a repository.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 would look for a dated change record and an
   instrument version in a result, and for R2 a run count and a stated basis. Neither
   `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place for them;
   both are closed. A rule failing every project for omitting what no schema accepts would measure this
   framework's own incompleteness and blame the project for it. Adding a schema field is a
   schema-versioning decision, outside this slice (plan 02 section 8).
2. **The subject is the history of a decision, and a repository holds only some of it.** Whether an
   instrument was altered after a result was seen turns on the order of events in a person's working
   session; whether a run set was complete turns on runs that may leave nothing behind. A detector
   could only read what survives, and R3 forbids this framework from reporting that as a verdict.
3. **The namespace and the placement question are not settled.** `eval.` was minted for
   [Standard 17](17-evaluation-plans-for-generative-systems.md), and whether its two `forbidden` rules are
   this item's prohibitions is open question Q19. A rule here would be either a new prohibition in this
   item's ground or a new requirement in item 17's namespace, and choosing between them is the owner's.
   This standard mints no id. A proposed rule, if one is natural, is recorded in the pull request that
   introduced this document for per-rule approval, and not here.

**Validation type.** R1 and R2 are `manual-review` obligations in this release; R3 constrains this
framework and has no validation type, because the thing it prohibits is a behaviour of the tool. The
validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding
is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | error |
| R2 | error |
| R3 | error |

**Exemptibility.** None of R1 to R3 is exemptible. An exception to R1 or R2 would record a project as
knowingly presenting a result as something it was not, which is the same reason `eval.no-test-set-tuning`
and `eval.no-fabricated-results` are non-exemptible, though this standard does not rely on those rules.
R3 is not exemptible, for the reason R6 of [Standard 18](18-benchmark-integrity-and-contamination.md) is
not. This release has no policy mechanism for an exception regardless: [Standard 2](02-ai-risk-tiering-and-applicability.md)
R4 dispositions attach to catalog rules, and this standard has none. A system that reports no evaluation
result records, in its own documents, that R1 and R2 do not reach it and why. No level here is lowered by
a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | For each reported result, compare the instrument's version at the run with the version named in the report, and read the history between the earliest result on the earlier version and the run for changes to the items, answers, scorer or bar | A reported result presented under an instrument that the history shows was changed after an earlier result was seen, where no dated record of the change exists or the result names no instrument version | A result on a set whose reference answer was corrected before any run, or one that names the revised version and links a dated change record, must **not** be faulted for the change |
| R2 | For each reported result, count the runs in the run set, compare with the count stated, and check that a best, worst, subset or exclusion is labelled with its basis | A result drawn from more runs than it states, a best or worst run not labelled as such, or an exclusion with no stated basis | A single run reported as one run, and a best run labelled as best with its count, must **not** be faulted |
| R3 | No detector, rule, audit finding or generated report in this repository states an integrity verdict from presence | A detector, rule, audit finding or report that states an evaluation was untampered, unselected or honest because a plan file, hash, lock file, signed commit, results file or declaration is present | Reporting that a results file was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries
one, so R1 and R2 are enforced by review or not at all, and R3 holds today only because no such detector
exists. The falsifiers in the table are available for manual review; what this release lacks is a detector
that applies them. A record made stale by the event in the staleness table below does not satisfy the
minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 or R2 in this release, because no rule exists to
except. A project that knowingly does not meet one records that in its own documents; Standard 2's
dispositions apply to the application of a rule, and this standard has none. R1 to R3 are not exemptible
(see Validation), and a record of non-conformance is not an exception.

**Attestations and expiry.** No attestation is produced for these records in this release.
[Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by
default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later
work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No
record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md)
R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the
earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made. A
result for a completed run stays a true statement about that run after a later change, and is stale only
where it is presented as current.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | Any change to anything this record names or relies on, including: a further change to the items, answers, scorer or bar after the record was made, or a judge alias resolving to a different model. |
| R2 | Any change to anything this record names or relies on, including: a further run added to the run set, or a run artifact removed from it. |
| R3 | A new detector, rule or report that touches evaluation integrity. |

## Additions this standard makes beyond the source

**All of it.** The brief names "benchmark integrity" and states no requirement for it, and has no
prohibition section. The item is class `A`: the specification authors it as the negative face of that
token. Specifically authored here, none of it owner-approved:

- **R1**, the prohibition on presenting a result under an instrument changed after a result was seen
  without a dated record, with the defined terms instrument and reported result, and the ruling that the
  prohibited act is the presentation and not the change.
- **R2**, the requirement that a selection from a run set be stated with a count and a basis, with the
  defined term run set, and the ruling that it is not a requirement to report variation.
- **R3**, the constraint on this framework, in the same form as the equivalent requirement in
  [Standard 18](18-benchmark-integrity-and-contamination.md) and [Standard 25](25-grounding-and-hallucination-control.md).
- **The choice of which prohibitions this standard states.** Alteration of the instrument and selection
  from the run set are chosen because Standard 17 R4 and R5 do not state them. No other prohibition was
  considered or excluded by any source; the list is this author's.
- **The division from Standards 17, 18 and 20** in Scope, which no one has confirmed, and the statement that
  R1 and R2 are compatible with Standard 17 R4 and R5, and R1 with Standard 20 R3, R4 and R6, and a project meets all.
- **The severity assignments**, the non-exemptibility of R1 to R3, the statement that no attestation or
  scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the
  decision to name no rule id.

Not authored here: the posture is the boundary review's, and the placement question Q19 is the owner's. Its
option C, recorded on 2026-10-15, is what this standard follows.

## Relationship to other standards and ADRs

[Standard 17](17-evaluation-plans-for-generative-systems.md) states, as R4 and R5, the two `forbidden`
evaluation rules whose placement is open question Q19, and states the plan, subject and scorer
requirements R1 here connects to; nothing in this standard restates, moves or re-attributes them.
[Standard 18](18-benchmark-integrity-and-contamination.md) owns contamination and the validity of a
benchmark; its R6 is the model for R3 here. [Standard 7](07-boundary-with-adjacent-standards.md) R5 orders
a conflict between packs, and no conflict is asserted here. [Standard 1](01-ai-system-manifest.md) declares
the evaluation paths and no field for a change record or run count; none is proposed by this standard.
[Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and non-lowering
language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the
Tests section answers. [Standard 19](19-robustness-evaluation.md) and [Standard 20](20-regression-testing.md) are written, and the Standard 20 R3, R4 and R6 overlap is set out in Scope. Open question Q19 stays open.
**Outside this pack.** No adjacent pack's standard is recorded for this item, and none was read for it. No
ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 or R2 is enforced; R3 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as
a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R3 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` states an evaluation's integrity from a presence |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's evaluation integrity |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 | A place to record an instrument version and a dated change: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R2 | A convention for how a result carries its run count and the basis of a selection | The shape is the project's; whether a report says it is a reading of prose |
| R3 | A test asserting no detector, rule, audit finding or report emits an integrity verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule ids | Ids, a shard and an owner, once Q19 and the namespace are decided | Not decided; this standard names none |

**What no future release will implement.** A detector that reports an evaluation untampered, unselected or
honest from the presence of a plan file, a hash, a lock file, a signed commit, a results file or a
declaration. R3 forecloses it, and the foreclosure is the point: a record is not the history that
produced it.
