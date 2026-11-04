# Standard 20 — Regression Testing Across Model and Prompt Versions

A generative system changes in small, plausible steps. A prompt is reworded to fix one complaint. A
model identifier is moved to a newer release for its price or its context window. A provider
retires a version and the project follows. Each step is reviewed as the thing it was meant to do,
and each one can make something else worse, in a place nobody looked.

Regression testing is the practice of running the same evaluation before and after a change and
reading the difference. It goes wrong in ordinary ways. The run happens for some changes and not for
others, and the others are the ones that broke. The result is compared with a baseline from a
different scorer, a different suite or a different prompt. What counts as a failure is decided after
the numbers are in. A failing change is adopted and the baseline moves with it, so the next change
is compared with the worse system. And "no regression" is written beside a suite that never touched
the behaviour that changed.

The failure this standard is written against is not a system that got worse. It is a change released
with a statement that nothing got worse, where nobody can say which versions were compared, against
what bar, or on what coverage.

Source: item 20 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "regression testing" token of the "Model evaluation, benchmark integrity,
robustness, and regression testing" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 20 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, this
> pack's own: [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) carries no
> non-`O` posture entry for item 20, and the review carries `humanSignOff: null`. No maintainer of any
> adjacent pack has confirmed the posture.
>
> **The brief supplies two words and this standard supplies the rest.** The brief's bullet names
> "regression testing" and states no requirement for it. The item is class `D` because its token is
> the brief's own; the requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it — a repository that invokes a model, retrieves context for one, or acts on a model's output —
that changes a version of its model or its prompt, or that states a result about the effect of such a
change.

Covers: which changes call for a regression run; what a run compares; the criterion that fails a
change, fixed before the run; what is recorded about a failed change; when the baseline is replaced;
how far a statement of "no regression" may reach; and the limit of what this framework can say about
any of it.

Terms, each defined once here and used verbatim below:

- A **version** is the evaluated subject of [Standard 17](17-evaluation-plans-for-generative-systems.md)
  R6: each model identifier as passed to the provider, each prompt by its revision, and any other
  configuration the plan names as affecting output.
- A **version change** is any change to a version.
- A **regression run** is a run of the evaluation suite ([Standard 17](17-evaluation-plans-for-generative-systems.md)
  R2) on a changed version, reported against the baseline of the version it replaced.
- The **baseline** is the record [Standard 17](17-evaluation-plans-for-generative-systems.md) R3
  requires: what the prior model and prompt version scored.
- A **failure criterion** is the stated condition under which a regression run fails the change.
- A **regression claim** is any statement that a version change introduces no regression, preserves
  quality, or is safe to adopt.

**Where each requirement reaches.** R1 to R6 reach every system that makes a version change or a
regression claim. R7 constrains this framework and reaches no consuming project. A system that never
changes a version and makes no regression claim has nothing to meet; this standard defines no catalog
rule, so there is no rule id under which [Standard 2](02-ai-risk-tiering-and-applicability.md) R4's
not-applicable declaration could be made, and none is asked for.

It does **not** cover, and claims none of the ground of:

- **The baseline record itself.** [Standard 17](17-evaluation-plans-for-generative-systems.md) R3
  requires it and carries the rule `eval.regression-baseline-recorded`. Whether that rule belongs to
  this item is open question Q20 and is not answered here; this standard moves and reattributes no
  rule.
- **What the suite must cover.** The plan and the suite are Standard 17's; robustness coverage is
  [Standard 19](19-robustness-evaluation.md)'s. Nothing here says which inputs a suite includes.
- **Exposure of an evaluation set to a model** (item 18,
  [Benchmark Integrity and Contamination](18-benchmark-integrity-and-contamination.md)).
- **Versioning, change control, lineage and rollback** (items 29, 30 and 32, unwritten). This
  standard says a change is tested; how it is approved, recorded in a lineage or reversed is theirs.
- **Reproducibility under nondeterminism** (item 31, unwritten). A hosted model's answers may differ
  between two runs of one version; how that difference enters a failure criterion is item 31's
  subject, and R3 asks only that the project say what it did.
- **Prohibitions on tampering with or fabricating results** (item 50, Evaluation Integrity
  Prohibitions, unwritten). R4's refusal of a criterion changed after the run is a requirement of this
  standard, not a statement of what item 50 will prohibit; Q19 is open and not answered here.
- **Detecting a change the project cannot see**, such as a provider replacing the model behind an
  identifier it does not publish a version for. R1 asks that the project say how it handles that
  case and claims no ability to detect it.

**Boundary posture O.** The boundary review lists no non-`O` entry for item 20. This standard relies
on that record and repeats none of it, so it names no adjacent pack as governing or not governing
regression testing. Where a project is also governed by a pack that does cover it,
[Standard 7](07-boundary-with-adjacent-standards.md) R5 orders the two and a boundary defect is for
the maintainers to fix. The record carries no human sign-off, so the posture is a recorded finding
and not a confirmed one.

## Requirements

### R1 — Record which version changes trigger a regression run

**A project MUST record which version changes trigger a regression run, and MUST record, for a model
identifier the provider can re-point without the project changing it, how a change behind that
identifier is handled: a scheduled re-run with its interval, or a statement that none is made.**

A rule of "run it when it seems risky" is decided by the person least able to see the risk, after
the change that looked harmless. The list can be short: a model identifier, a prompt revision and the
other configuration the plan names. What it cannot be is absent, because then every run is a
judgment and every skipped run is unremarkable.

**A pinned identifier is not a regression-free one.**
[Standard 1](01-ai-system-manifest.md) R4 asks that a model identifier be pinned. Where it is not, or
where a provider can change what a pinned name resolves to, the project cannot observe the
change from its own repository. R1 does not ask the project to detect it; it asks the project to
write down what it does instead, including that it does nothing. That is a record of a gap, not a
failure to have closed it.

### R2 — Compare the changed version with the baseline of the version it replaced

**Each regression run MUST name the changed version and the baseline version it is reported against,
MUST state the plan revision and scorer used for each side, and MUST state any difference in suite,
plan revision or scorer between the two sides alongside the result.**

A figure with no second figure beside it says only how the new version did. A comparison whose sides
were scored by different judges, or run on suites that differ by a handful of cases, is two
measurements, and a difference between them may be the instrument's. [Standard 17](17-evaluation-plans-for-generative-systems.md)
R7 treats a change of scorer between baseline and new run; R2 adds that the same statement is made
for the suite and the plan, and does not restate R7.

**A first version has no baseline to compare with.** It has nothing to report under R2, and its own
committed result is the baseline the next change is compared with (Standard 17 R3).

For comparisons MachineLearningStandards reaches, that pack's Standard 19 R1 requires identical
conditions and its Standard 20 R1 an indication of uncertainty. R2 restates neither, and adds that the
differences be stated where conditions were not identical.

### R3 — Fix the failure criterion before the run

**For each metric a regression run reports, the project MUST state its failure criterion before the
run, in the scorer's own terms — a permitted drop or rise from the baseline in the scorer's bad
direction, a floor or ceiling, or, for a categorical, rubric or other non-numeric result, a pass
condition declared in advance — and MUST report each run as pass or fail against it.**

A difference read after the fact is read by someone who has seen the numbers and wants the change to
have been a good idea. "Within noise" and "not significant" are criteria when written down in
advance and rationalisations when written afterwards. This standard does not set a tolerance and
does not say any particular size of drop is acceptable; the project chooses, and the requirement is
that the choice precede the figure.

**A metric with no criterion is reported as having none, and not as passing.** A change that improves
one metric while worsening another has no verdict until the criterion says how the two are read; this
standard states no such rule and does not define a combined score.

Where repeated runs of one version are known to differ, the criterion records how that difference
was handled, or that it was not. Nothing in R3 requires it to have been handled well.

### R4 — Record a failed change, and do not move the criterion after the run

**A regression run that fails its criterion MUST be recorded with the failing results retained, a
change adopted despite a failing run MUST carry a record of that decision and of the person or role
who made it, and a failure criterion, suite, baseline or scorer MUST NOT be changed after a run to
alter that run's verdict unless the change and its reason are recorded with the verdict.**

Adopting a failing change can be the right call: the regression may be in a metric the project has
decided it can afford to lose. What cannot be right is a project that has no record of having made
the call. The failure this requirement closes is the quiet one — a threshold loosened, a case
dropped from the suite, a rubric reworded until the run passes — which produces a pass that describes
a different test from the one that failed.

**The decider is whoever the project says it is.** This standard names no approver and no role and
does not define who may adopt a failing change. It asks that the record name one.

### R5 — Replace the baseline only by a recorded decision

**A baseline MUST NOT be replaced by the result of a changed version without a record that names the
version it now describes and the regression run, if any, that preceded it, and a result of a version
that failed its criterion MUST NOT become the baseline without the R4 decision record.**

If each adopted change becomes the new baseline, a series of changes each within tolerance can add up
to a loss no comparison shows: every step is measured against the step before it. A baseline moved
inside the same change as the thing it measures makes the run a comparison of a version with itself.
The record that a baseline moved, and why, is what lets a later reader tell a deliberate re-baseline
from a drift.

**Keeping an earlier baseline is not required.** R5 asks for a record of the move and does not ask the
project to retain every prior result or to compare against anything older than the version it
replaced. A project that wants to compare against a longer history decides that itself.

### R6 — A regression claim reaches only what the run covered

**A regression claim MUST name the suite, the changed version, the baseline version and the failure
criterion it rests on, MUST be bounded to the behaviour the suite exercises, and MUST NOT be stated
for a version change whose regression run failed or was not made.**

"No regression" means the suite found none against that baseline under that criterion. It does not
mean the system is unchanged where the suite does not look. A claim that drops the suite's name has
turned a measurement into a reassurance. A project that did not run the suite has no result to report
and has to say so; a statement such as "tested, no issues" without a run behind it is not a
regression claim this standard recognises as met.

**The claim is bounded, not hedged.** R6 does not ask for a disclaimer on every sentence. It asks that
the sentence stating the result carry, or point to, the four names above, and that the scope of what
it says stop at what was run. This requirement is not exemptible.

### R7 — This framework MUST NOT report a system regression-tested from the presence of anything

**No detector, rule, audit finding or generated report in this framework MAY state that a system has
been regression-tested, or that a change is free of regression, because an evaluation suite, a
baseline file, a manifest field, a CI job or a test directory is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that a baseline file
exists and a suite is declared; it cannot show that the suite was run on the changed version, against
that baseline, under a criterion fixed beforehand. Reporting the presence as the practice would put
this framework's authority behind a property of a run that nothing in a checkout shows.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| The unscheduled change | A model identifier or prompt revision changes in history with no regression run naming it and no recorded rule that excused it | R1 |
| The unseen provider change | An alias the provider can re-point, with no recorded handling, so a behavioural change appears as nothing in the repository | R1 |
| The apples-to-oranges comparison | A new result set beside a baseline scored by a different judge, run on a different suite, or under a different plan revision, with no difference stated | R2 |
| The version-less result | A regression result naming neither the changed version nor the baseline version | R2 |
| The criterion after the figure | A tolerance written or adjusted once the numbers were known | R3 |
| The unjudged metric | A metric reported with no criterion and read as passing | R3 |
| The quiet adoption | A change with a failing run released, with no record of who accepted it | R4 |
| The moved goalpost | A threshold loosened, a case removed from the suite or a rubric reworded after a failing run, with the verdict changed and no record | R4 |
| The ratchet | Each adopted change becomes the new baseline, so a slow loss is never compared with anything | R5 |
| The self-comparison | A baseline file replaced in the same change that alters the version it measures | R5 |
| The unbounded all-clear | "No regressions" with no suite, version or criterion named, or stated after a failed or absent run | R6 |
| Presence read as practice | A framework report of "regression tested" because a suite directory or baseline file exists | R7 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The trigger list and, for each re-pointable identifier, the recorded handling | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | The regression result naming the changed and baseline versions, plan revision and scorer of each side, and any stated difference | The report or file carrying the result | Human review |
| R3 | The failure criterion for each metric, dated or committed before the result, and the pass or fail verdict | The plan or the result record | Human review |
| R4 | The retained failing result, the adoption record naming the decider, and any record of a criterion, suite, baseline or scorer changed after a run | Version-control history and the project's decision records | Human review |
| R5 | The record of each baseline replacement naming the version it describes and the preceding run | Version-control history and the baseline's own record | Human review |
| R6 | Each regression claim with the four names it rests on | The project's documentation and release statements | Human review |
| R7 | The absence of any detector, rule, audit finding or generated report that reports a regression result from a presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R6 is a human-authored record or a version-control history. A baseline file and a
passing result establish that a project recorded them. They do not establish that the comparison was
fair or that the suite saw the behaviour that changed; that is not-evaluable from a repository.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 acceptance criteria (plan 02 section 6) require every standard to cite at least one rule
or to record in its Validation section why it ships with none; this is that record.
[Standard 6](06-standard-structure-and-rule-identity.md) R3 separately requires each requirement to be
falsifiable or declared not-evaluable, which the Tests and falsifiers section answers.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 would look for a trigger list, and one
   for R3 for a criterion; neither `schemas/ai-system-manifest.schema.json` nor
   `schemas/ai-policy.schema.json` has a place for either. `evaluation` carries `planPath`,
   `suiteCommand` and `baselinePath`, and both schemas are closed. A rule failing every project for
   omitting what no schema accepts would measure this framework's own incompleteness and blame the
   project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02
   section 8).
2. **The requirements concern the order and content of events, which source text does not show.**
   Whether a criterion preceded a result, whether a baseline moved with the change it measures, and
   whether a verdict was altered afterwards are properties of a history. A detector reading source
   would test for the presence of a baseline file or a suite, which R7 forbids this framework from
   reporting as a result.
3. **The namespace and its nearest rule are the subject of an open question.** `eval.` is minted for
   [Standard 17](17-evaluation-plans-for-generative-systems.md), and whether
   `eval.regression-baseline-recorded` belongs to this item is open question Q20. A new rule here
   would add to a namespace while that placement is undecided. This standard mints no id, moves no
   rule, and does not answer Q20.

**Validation type.** R1 to R6 are `manual-review` obligations in this release; whether a regression
suite saw the behaviour that changed is not-evaluable and is not reported as reviewed. R7 constrains
this framework and has no validation type, because the thing it prohibits is a behaviour of the tool.
The validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a
finding is phrased. These levels are this repository's judgment, listed in Additions, and are not
owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | warning |
| R2 | error |
| R3 | error |
| R4 | error |
| R5 | warning |
| R6 | error |
| R7 | error |

**Exemptibility.** R7 is not exemptible, because a mechanism for excepting the prohibition would be
self-defeating. R6 and the second limb of R4, the ban on altering a verdict by an unrecorded change,
are not exemptible, because an exception would record a project as knowingly publishing a claim its
test does not support. R1 to R5 reach a system only where it makes a version change or a regression
claim, as Scope says, and have no exemption mechanism in this release: a project that does not meet
one records that in its own documents. There is no policy declaration for a system without that
subject: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4's not-applicable disposition applies
to a catalog rule id, and this standard has none. No level here is lowered by a risk tier (Standard 2
R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | A trigger list exists; each re-pointable identifier has recorded handling | No trigger list; a model identifier or prompt revision changed in history with no run and no recorded exclusion; a re-pointable identifier with no recorded handling | A project that records "no scheduled re-run" for its alias must **not** be faulted for having none |
| R2 | Each run names the changed and baseline versions, the plan revision and scorer on each side, and states differences | A run naming neither version; a run whose sides differ in scorer, suite or plan revision with no stated difference | A run that states "suite gained three cases; baseline re-scored on the new suite" must **not** be faulted for the differing suite |
| R3 | Each metric has a criterion committed or dated before its result, and each run has a pass or fail verdict | A metric with a result and no earlier criterion; a criterion committed after the result; a metric with no criterion reported as passing | A project whose criterion is a loose tolerance, stated first, must **not** be faulted for its looseness |
| R4 | A failing run's results are retained; an adoption despite failure has a decision record naming a decider; a post-run change to criterion, suite, baseline or scorer has a record | A failing run with no retained result; an adoption with no record, or one naming no decider; a verdict that changes with an unrecorded change to the criterion, suite, baseline or scorer | A change adopted despite a failing run, with a record naming its decider, must **not** be faulted for being adopted |
| R5 | Each baseline replacement has a record naming the version it describes and the preceding run; a failing-run result replacing the baseline has the R4 record | A baseline replaced with no record; a baseline replaced in the same change as the version it measures with no preceding run named; a failed version's result as baseline with no R4 record | A recorded deliberate re-baseline after a passing run must **not** be faulted for moving the baseline |
| R6 | Each regression claim names the suite, changed version, baseline version and criterion, and stops at what the suite exercises | A claim naming none or only some of the four; a claim after a failed or absent run; a claim of general quality from a suite that exercises one behaviour | A claim "suite S, v2 vs v1, criterion C: no metric dropped past C" must **not** be faulted for being narrow |
| R7 | No detector, rule, audit finding or generated report in this repository states a regression-tested verdict from presence | A detector or report that states a system is regression-tested, or a change free of regression, because a suite, baseline file, manifest field, CI job or test directory is present | Reporting that a baseline path was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture
carries one, so R1 to R6 are enforced by review or not at all, and R7 holds today only because no such
detector exists. The falsifiers in the table are available for manual review; what this release lacks
is a detector that applies them. A record made stale by an event in the table below does not satisfy
the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R6 in this release, because no rule exists to
except. A project that knowingly does not meet one of R1 to R5 records that in its own documents; for
R6 the only remedy is to withdraw or bound the claim. Standard 2's dispositions apply to the
application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release.
[Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by
default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later
work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced).
No record under this standard expires on a schedule.

**What makes a record stale.** One event per requirement. A regression result describes the two
versions it names and stays true of them; it is stale only where it is presented as describing a later
version.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | A new kind of configuration the plan names as affecting output, or a change of provider or of the identifier's re-pointing behaviour |
| R2 | A change of suite, plan revision or scorer after the comparison was made, for a result presented as current |
| R3 | A change of metric, scorer or what the metric measures, for a criterion offered as covering the new definition |
| R4 | A retrospective correction to the failing result or to the decision record |
| R5 | A further version change after the replacement, for a baseline presented as describing the system now running |
| R6 | A version change, or a change to the suite, baseline or criterion the claim names |
| R7 | A new detector, rule or report that touches regression testing |

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes two words, "regression testing", inside a bullet of four
subjects. It states no requirement, level or evidence for any of them. The item is class `D` because
its subject token is derived from the brief; the requirements are not derived. Specifically authored
here, none of it owner-approved:

- **The definitions** of version change, regression run, failure criterion and regression claim, and
  the adoption of Standard 17's terms for version and baseline.
- **R1's** trigger list, and the handling record for an identifier a provider can re-point.
- **R2's** naming of both versions, and the statement of any difference in suite, plan revision or
  scorer between the sides.
- **R3's** failure criterion fixed before the run, the pass or fail verdict, the refusal to fix a
  tolerance, and the rule that a metric with no criterion is not reported as passing.
- **R4's** retention of failing results, the adoption record naming a decider, and the ban on an
  unrecorded post-run change to criterion, suite, baseline or scorer.
- **R5's** record of each baseline replacement and its bar on a failed version's result becoming the
  baseline without the R4 record.
- **R6's** bounded regression claim and its four names.
- **R7**, the constraint on this framework, in the same form as the equivalent requirement in
  [Standard 17](17-evaluation-plans-for-generative-systems.md),
  [Standard 19](19-robustness-evaluation.md), [Standard 25](25-grounding-and-hallucination-control.md)
  and [Standard 33](33-ai-observability.md).
- **The exclusions in Scope** as division lines, including the line between this item and Standard 17
  R3's baseline record. Where each begins is unconfirmed by anyone.
- **The severity assignments** (one level per requirement, in Validation), the statement that no
  attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the
  decision to mint no id and to take no position on Q19 or Q20.

Not authored here, and recorded so the reader does not credit this standard with it: the posture `O`
and the numbering are the specification's.

## Relationship to other standards and ADRs

[Standard 17](17-evaluation-plans-for-generative-systems.md) assigns "when regression runs happen, and
what difference from a baseline fails a change" to this item. R1 to R6 are that content. They sit
inside Standard 17's plan (R1), suite (R2), baseline (R3), subject (R6) and scorer (R7) requirements
and restate none. `eval.regression-baseline-recorded` stays attributed to Standard 17, which cites it
under R3; whether it belongs here is Q20 and is open.
[Standard 19](19-robustness-evaluation.md) says what a suite must cover where robustness is claimed;
its R2 is the model for R3's criterion fixed in advance, and R3 here concerns a version change, not a
class of input. Item 18 governs exposure of an evaluation set to a model.
[Standard 1](01-ai-system-manifest.md) R4 and [Standard 21](21-prompt-and-instruction-security.md) R1
supply the pinned identifier and the versioned prompt that a version is made of.

[Standard 7](07-boundary-with-adjacent-standards.md) R5 orders a conflict between packs.
[Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and
non-lowering language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is
the requirement the Tests and falsifiers section answers, and the Validation section records why no
rule is shipped, as plan 02 section 6 asks.

Items 29, 30, 31, 32 and 50 are unwritten in this release; the lines drawn above are provisional until
they are, and the later standards may legitimately move them. Open questions Q19 (whether the two
forbidden evaluation rules are item 50's prohibitions) and Q20 are recorded open and not answered
here. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R6 is enforced; R7 holds today because no detector has this subject, and no test guards it.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away
as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R7 | **Holds today, unguarded.** No detector, rule or report in `scripts/` or `schemas/` has a concept of regression testing as a subject; a case-insensitive search of `scripts/`, `schemas/`, `templates/` and `ai-policy.yml` for `regress` found only the policy entries for `eval.regression-baseline-recorded`, which ships no detector, and no check. No test asserts the absence, so a future detector could break R7 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's regression testing |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1, R3, R4, R5, R6 | A place to record triggers, criteria, decisions, baseline moves and claims: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R2 | A way to read the versions and scorer a result names | Result layout is the project's; a source scan would be a presence check R7 forbids reporting as a verdict |
| R3, R4, R5 | A reader of version-control history that orders a criterion, a result and a baseline change | Ordering of events is not in a checkout's current state; no such reader exists |
| R7 | A test asserting no detector emits a regression verdict | Meaningful only once a detector exists for it to constrain |
| Rule ids | Ids in a namespace once Q19 and Q20 are decided | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system regression-tested, or a
change free of regression, from the presence of a suite, a baseline file, a manifest field, a CI job
or a test directory. R7 forecloses it, and the foreclosure is the point: a baseline's presence is not
a comparison, and a framework reporting it would put its authority behind a property of a run that
nothing in a repository can show.
