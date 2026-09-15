# Standard 17 — Evaluation Plans for Generative Systems

An evaluation of a generative system usually starts as a folder of example inputs and a script that
sends them to a model. Someone reads the outputs, edits the prompt, runs the script again, and reads
the outputs again. After a week the outputs are better, a number is put in a pull request, and the
number is true: the script did produce it. What it measured is how well the prompt was fitted to
that folder.

Each step on the way is ordinary. The bar for "good enough" was decided after the outputs were read.
The inputs that decided which prompt to keep are the inputs the final number was computed on. The
model scoring the outputs had its own prompt edited halfway through, so last week's figure and this
week's were produced by two different instruments. The prior version's score was never written down,
so nobody can say whether this change made anything worse. And the figure in the pull request
description was typed from memory of a run two prompt revisions ago.

The failure this standard is written against is not a bad evaluation. It is an evaluation whose
plan, instrument and subject were never fixed, reported as though they had been.

Source: item 17 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "Model evaluation" token of the "Model evaluation, benchmark integrity, robustness,
and regression testing" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 17 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **B**, recorded
> in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) by a posture entry for
> item 17 with verdict `CONFIRMED`, owner "MachineLearningStandards for metric selection and
> comparison; AIStandards for generative framing", and evidence naming MachineLearningStandards'
> `12-metric-selection.md` and `20-uncertainty.md` read at commit `f3a1258` (version 1.6.0). That
> entry's `verdict` and `reasoning` are the review's inference, it records one unknown that is still
> open (see Scope), and the review carries `humanSignOff: null`. No maintainer of
> MachineLearningStandards has confirmed the division.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it — anything that sends a prompt to a model, retrieves context for one, or acts on a model's output —
whose behaviour is evaluated, or about whose behaviour an evaluation result is reported, compared, or
used to justify a decision.

Four terms, each defined by this standard rather than by the brief:

- An **evaluation result** is a figure, a per-case judgement, or a summary of per-case judgements,
  reported as describing how a system behaves on a set of inputs.
- The **evaluated subject** is what a result describes: each model identifier the system sends
  requests to, each prompt at a specific revision, and any other configuration the plan names as
  affecting output. A change to any of them is a different subject.
- The **held-out set** is the evaluation input a plan reserves for the measurement it reports, as
  distinct from the input used to develop prompts, models and configuration — the "development
  split" named by R4's rule's remediation.
- A **scorer** is whatever turns an output into a judgement: code comparing it with a reference, a
  rubric applied by people, or a model prompted to judge it. A scorer that is a model is a **judge
  model**.

**Where each requirement reaches.** R1, R2 and R6 reach every system whose behaviour is evaluated.
R3 reaches systems that have a prior evaluated version. R4 reaches systems with a held-out set. R5
reaches every system that reports an evaluation number. R7 reaches evaluations scored by a rubric,
by people or by a judge model. R8 reaches evaluations that report a result that is not a figure. R9
constrains this framework and reaches no consuming project. A system with none of a requirement's
subject may declare that rule not-applicable under [Standard 2](02-ai-risk-tiering-and-applicability.md)
R4, with a reason and a `revisitWhen` — and the declaration is the only thing that records the
subject's absence, because no detector in this release would contradict a false one (see Validation).

**The boundary with MachineLearningStandards is the substance of this standard's posture, and it has
an open edge.** Every statement about that pack below was read through git objects at commit
`f3a1258` (1.6.0), the commit the boundary review pins, and every file cited is byte-identical at
`082ecba` (2.0.0), the commit `artifacts/foreign-namespace-inventory.json` pins.

- **What that pack owns, by its own scope statements.** Its Standard 12, Metric Selection, applies
  "to every evaluation of a model" and requires the primary metric to be justified against the cost
  of error (R1) and recorded before the reported evaluation is run (R2); its rule is
  `evaluation.metric-selection-justified`. Its Standard 20, Uncertainty, applies to "every reported
  evaluation figure that will be compared to another"; its rule is `evaluation.uncertainty-reported`.
  Its Standards 5 and 14 separate the test set and forbid using it as a selection signal, under the
  rule `split.no-test-set-tuning`. Its Standard 19 governs model comparison and, at P3, forbids
  fabricated evaluation metrics under `integrity.no-fabricated-evaluation-metrics`. Its Standard 2
  requires a baseline model under `evaluation.baseline-exists`. Its Standard 15 requires the
  experiment configuration to be recorded under `reproducibility.experiment-config-recorded`.
  **This standard restates none of those requirements.** Where they reach a system they govern, and
  the requirements below link to them.
- **What that pack does not state.** Each of those standards says its applicability "is proposed
  by" named triggers, among them `ml-footprint` and `training-code`, and every rule named above lists
  `training-code` among its triggers. Its Standard 2 says a repository holding only inference code
  for a model trained elsewhere "may reasonably declare the rule not-applicable", provided the reason
  names where the baseline comparison lives. None of this is a test for whether an application built
  on a hosted model is a machine-learning system, and this standard does not read it as one.
- **The recorded unknown stays open.** The boundary review records that whether MachineLearningStandards'
  maintainers read "every evaluation of a model" as including a hosted model the project did not train
  is unknown, that the wording admits both readings, and that nothing in that pack resolves it. **A
  hosted model, or the absence of a training pipeline, does not by that fact place a system outside
  MachineLearningStandards, and does not by that fact place it inside.** This standard does not
  decide which.
- **Standard 7 R2's permission is not exercised.** [Standard 7](07-boundary-with-adjacent-standards.md)
  R2 lets this pack define a baseline directly where an AI system is not a machine-learning system.
  Until 2026-09-15 it gave "a retrieval application over a hosted model, which trains nothing" as an
  example; the example was withdrawn when this standard was integrated, because the boundary review's
  unknown leaves open whether MachineLearningStandards reaches such a system. With no test for which
  systems lie outside that pack, this standard restates no ML-owned subject for any system, and the
  gap that leaves is recorded under Additions and as Q22.
- **Where both packs apply**, Standard 7 R5 governs: "Where two packs govern one concern, the more
  specialised pack's requirement governs its own domain; where both genuinely apply, the stricter
  compatible requirement applies." Applied here: MachineLearningStandards' requirements govern
  metric selection and its justification, uncertainty, the conditions of a comparison, test-set
  separation and fabricated metrics for the evaluations they reach. The requirements below are
  additions that stay in force beside them. Where a rule here and one there prohibit the same act —
  R4 and R5 — both are `forbidden` and non-exemptible, they are compatible, and a project meets both.
  A requirement here found to be incompatible with one there would be a boundary defect to fix, as
  Standard 7 R5 says, not a conflict to settle by choosing.
- **Where that pack does not reach a system**, R1 to R8 still apply in full. The ML-owned subjects —
  justifying a metric by the cost of error, quantifying uncertainty, holding a comparison's
  conditions identical — have **no requirement in this pack** for such a system in this release.
  That is a gap, recorded under Additions, not a decision that they do not matter.

The boundary with this standard's other neighbours, none of whose ground is claimed:

- **Item 18, Benchmark Integrity and Contamination** (unwritten, posture B) — whether evaluation
  input has leaked into a model's training data, and whether a public benchmark still measures
  anything. R4 concerns selection against the held-out set by the project, not contamination by a
  provider.
- **Item 19, Robustness Evaluation** (unwritten) — what an evaluation must cover. Nothing here says
  which inputs a plan must include.
- **Item 20, Regression Testing Across Model and Prompt Versions** (unwritten) — when regression
  runs happen, and what difference from a baseline fails a change. R3's rule records a baseline and
  cites this standard; whether it belongs to item 20 is recorded under Additions and not decided.
- **Item 12, Context and Corpus Provenance** (unwritten, posture B) — where an evaluation set came
  from. **[Standard 13](13-personal-data-in-ai-systems.md) R1** governs whether it holds real personal
  data.
- **Items 29, 30 and 31** (unwritten) — versioning and change control, model and prompt lineage, and
  reproducibility under nondeterminism. Re-running a suite against a hosted model can produce a
  different figure from the same subject; R2 asks that the suite can be run, not that its figures
  repeat, and Standard 7 R1 records remote-endpoint nondeterminism as this pack's addition to
  MachineLearningStandards' reproducibility ground.
- **Item 35, Red Teaming** (unwritten) — adversarial exercises, which may be evaluations and whose
  conduct is item 35's subject.
- **Item 50, Evaluation Integrity Prohibitions** (unwritten, class A) — see below.
- **EngineeringStandards**, whose `testing.no-fabricated-results` forbids reporting test, build or
  compilation results for a run that did not happen. R5's rule records it as precedent.

**This standard mints no prohibition, and adds no rule.** The specification lists every must-never
requirement as class-A work in Band L. Its Authored items table names item 50, Evaluation Integrity
Prohibitions, as the negative face of `benchmark integrity` — item 18's token, not this item's
`Model evaluation`. Two rules stated here, R4's and R5's, are `forbidden`. They were minted in the
Phase 1 shard, before this document or item 50's existed, and they cite standard 17. Whether they are
item 50's prohibitions stated early, or item 17's rules that happen to be prohibitive, is not decided
by the specification and is not decided here; that the specification names item 50's positive token
as another item's makes the question less settled than its parallels for items 49 and 51, not more.
They are stated as they stand.

**Risk tier does not grade this standard.** Nothing below becomes lighter at a lower tier: Standard 2
R3 forbids a tier from reducing a rule's level, severity or exemptibility, allows it only to decide
whether a rule's subject is in scope, and says in terms that a `minimal`-tier system may still not
fabricate evaluation results. **This standard does not restate, extend, or rely on Standard 2 R2, and
takes no position on the open question recorded as Q7** in
[`artifacts/project-plan-breakdown/08-open-questions.md`](../artifacts/project-plan-breakdown/08-open-questions.md).
Nothing here depends on how Q7, Q9 to Q12 or Q15 to Q18 is resolved. None of this standard's rules
declares assurance `partial`.

## Requirements

### R1 — Write the evaluation plan before the run it governs

**An evaluation plan MUST state what is measured, on what data, and against what bar, and MUST be
committed before the evaluation run whose results are reported against it.**

A plan written after the numbers is, as the rule's rationale says, a description of the numbers. The
bar settles wherever the system already is, the data becomes whichever inputs the system happened to
handle well, and "what is measured" becomes the measure that came out best. None of that needs anyone
to intend it; it only needs the plan to be written second.

**The plan states three things, and they are the rule's.** *What is measured*: the quantity or
judgement the result reports. *On what data*: the evaluation input, including which of it is the
held-out set R4 protects. *Against what bar*: the threshold or criterion that decides whether the
result is acceptable. A document naming a metric and no bar does not meet R1; neither does one that
names a bar and no data. Where R6, R7 or R8 applies, the plan is also where the evaluated subject, the
scorer and the criterion for a non-numeric result are recorded, and those are their requirements, not
this one's.

**The plan comes before the run, not only before the report.** The rule's description says "before
any result is reported", and its remediation says to commit the plan "before running the suite". This
standard reads R1 as met when the plan is committed before the run whose results are reported, which
satisfies both. A plan revised after results exist does not re-date itself: the revision governs the
next run.

**For an evaluation MachineLearningStandards reaches, the metric is that pack's subject.** Its
Standard 12 requires the primary metric to be justified against the cost of each kind of error and
recorded before the reported evaluation is run, under `evaluation.metric-selection-justified`, and
says how a change of metric is made visible. R1 does not restate that. The plan names the metric; that
pack's record justifies it; the two may be one document.

**A commit is weaker evidence of order than it looks.** A commit shows that a file was in the history
being read; its dates are set by whoever made it. What establishes that a plan preceded a run is the
plan's commit compared with the run's own record, read by someone who can see both.

`schemas/ai-system-manifest.schema.json` accepts the plan's location as `evaluation.planPath`, a
non-empty string. The rule's remediation does not ask for it, and nothing in this framework reads it.
**No schema in this release governs a plan's content or form.**

Rule `eval.plan-exists`.

### R2 — The evaluation suite runs from a declared entrypoint

**A repository whose system is evaluated MUST expose an entrypoint that runs its evaluation suite.**

An evaluation nobody can run again is, in the rule's words, a claim rather than a measurement, and it
stops describing the system the moment a model identifier, a prompt or a scorer changes. The
characteristic failure is not a missing suite. It is a suite that ran once from one person's shell,
with arguments nobody wrote down, against a file that has since moved.

**"Runs the suite" means produces the results the plan names.** An entrypoint that exists and fails,
or that runs a different set of cases from the plan's, does not meet R2. An entrypoint that needs
credentials for a hosted model, or other prerequisites outside the repository, does meet it, provided
the prerequisites are stated beside it. The credentials themselves are not evidence, and a credential
committed in an evaluation fixture is what [Standard 13](13-personal-data-in-ai-systems.md) R2 forbids.

**Runnable is not repeatable.** A suite run twice against a hosted model may produce two different
figures from one subject. R2 asks that it can be run, not that its figures reproduce; nondeterminism
is item 31's subject. For an experiment MachineLearningStandards reaches, the record needed to rerun
it is that pack's Standard 15 R1, under `reproducibility.experiment-config-recorded`, and R2 does not
restate it.

**The rule's remediation says to reference the entrypoint from the manifest.** The manifest schema's
`evaluation.suiteCommand` accepts a non-empty string and is where such a reference fits; the schema
defines nothing about the string's form, and nothing in this framework reads it.

Rule `eval.suite-executable`.

### R3 — Record what the prior version scored

**A committed baseline MUST record what the prior model and prompt version scored.**

Without it, as the rule's rationale puts it, a regression is indistinguishable from a system that was
always this bad, and both look like a passing run. Model and prompt changes are frequent, cheap and
individually plausible; the evidence that one of them made things worse exists only if the previous
result was kept.

**This baseline is not MachineLearningStandards' baseline.** That pack's Standard 2 requires a
baseline *model* — the strongest simple alternative, evaluated identically — under
`evaluation.baseline-exists`. R3's baseline is the prior *version of this system*, as the rule's
description says. They answer different questions, and where both packs apply a project may owe both.

**The baseline records its subject.** The artifact the suite produces, which the rule's remediation
says to commit, is a baseline for R3 only if it names the evaluated subject it describes (R6) and the
plan revision it was run under (R1). A score with no subject attached cannot be said to be the prior
version's.

**A first version has no prior version.** It has nothing to record under R3; its own committed result
is the baseline the next change is compared with.

**Comparing a new result with the baseline is governed elsewhere.** For comparisons
MachineLearningStandards reaches, that pack's Standard 19 R1 requires identical conditions and its
Standard 20 R1 an indication of uncertainty, and R3 restates neither. A change of scorer between the
baseline and the new run is R7's case. When a regression is checked for and what difference fails a
change are item 20's subject.

The manifest schema accepts the baseline's location as `evaluation.baselinePath`, a non-empty string;
the rule's remediation does not ask for it, and nothing in this framework reads it.

Rule `eval.regression-baseline-recorded`.

### R4 — The held-out set is never a selection signal

**Prompts, models and configuration MUST NOT be selected by their score on the held-out evaluation
set.**

A held-out set tuned against, as the rule's rationale says, stops being held out, and every number
computed on it afterwards overstates the system. In a generative system the tuning rarely looks like
tuning. It is a prompt edited until the evaluation passes, a provider chosen because its model scored
highest on the evaluation set, a temperature setting kept because the last run was better — each an
ordinary engineering decision, and each spending the held-out set.

**The prohibited act is the selection, whoever makes it.** The rule's description names what is
selected and what it is selected by; it does not name a mechanism. A loop that sweeps prompt variants
against the held-out set and a person who re-runs it after each edit and keeps the better prompt
select in the same way. **A judge model's prompt is a prompt**: adjusting it by its effect on
held-out scores is within the rule. The rule's remediation — tune on a development split, and reserve
the held-out set for a single final measurement — is how to comply; R4's prohibition is the selection.

**A held-out set that has been used for selection is no longer held out.** Reporting a figure on it
as a held-out result afterwards reports what the rule's `$exemptibilityNote` calls a number known to
be wrong.

**R4 overlaps MachineLearningStandards' `split.no-test-set-tuning`**, which its Standards 14 P1 and
5 P1 carry and whose description is "No model choice may be made in light of the final test set."
Both rules are `forbidden` and non-exemptible, and where both apply a project meets both. That pack's
Standards 5 and 14 and the rule's description name hyperparameters, thresholds, feature sets, stopping
points and candidate models among what may not be chosen on the test set; none of them names a prompt. Whether "model choice" reaches the selection of a prompt or of a hosted model's
configuration is not stated there, and this standard does not answer for it. How many times a test
set was read, and why, is that pack's Standard 5 R4, and R4 here adds no count.

**Contamination is not R4.** A hosted model whose provider trained it on text overlapping the
evaluation set has not been tuned against it by the project; that is item 18's subject.

**No schema records which set is held out.** The manifest schema's `dataSources[].kind` accepts
`evaluation-set` and has no value distinguishing a development split from a held-out one. The plan
(R1) records the designation; no schema governs its form.

Rule `eval.no-test-set-tuning`, **non-exemptible**. Its `$exemptibilityNote` records that an
exception would be an approval to report a number known to be wrong.

### R5 — Every reported result was produced by a run

**An evaluation number MUST NOT be reported unless it traces to an artifact produced by an actual
run.**

A fabricated number, the rule's rationale says, is worse than no number, because it is acted on. The
forms are rarely invention. They are a figure carried forward from a run of a different subject; a
placeholder written into a draft and never replaced; a result from an earlier plan presented under the
current one; and a figure that appears in a model-written summary of an evaluation and in no artifact
the run produced. Each reads exactly like a measured number.

**The trace is to an artifact, and the artifact is the run's.** The rule's remediation asks for every
reported metric to be linked to the run artifact that produced it. A figure whose only source is a
dashboard screenshot, a chat message, or another document quoting it does not trace to a run.
**No schema in this release governs the form of that link**, and no manifest field records run
artifacts; `evaluation.baselinePath` records one path and is not a general register.

**The rule names numbers, and this standard does not extend it.** A result that is not a figure is
R8's case, which requires its per-case judgements to accompany it.

**R5 overlaps two rules outside this pack.** EngineeringStandards' `testing.no-fabricated-results`
forbids reporting a test, build or compilation result for a run that did not happen; the rule's
crosswalk records it as precedent, and [Standard 7](07-boundary-with-adjacent-standards.md) R3 records
this rule as the canonical AI-facing form. MachineLearningStandards' Standard 19 P3 forbids reporting
an evaluation metric that was not produced by evaluating the model, under
`integrity.no-fabricated-evaluation-metrics`, which the rule's crosswalk does not record (see
Validation). All three are `forbidden`, `manual-review` and non-exemptible, and where both of the ML and
AI rules apply they are compatible.

An evaluation result cited in a safety case under [Standard 8](08-ai-safety-requirements-and-safety-cases.md)
is a reported result, and R5 reaches it.

Rule `eval.no-fabricated-results`, **non-exemptible**. Its `$exemptibilityNote` records that there is
no legitimate reason to report a result that did not happen.

### R6 — Name the evaluated subject in the plan and in every result

**An evaluation plan, and every result reported under it, MUST identify the evaluated subject: each
model identifier as passed to the provider, each prompt by its revision, and any other configuration
the plan names as affecting output.**

A generative system's behaviour is a joint property of the model it calls, the instructions it sends
and the configuration around them. A result that names one of the three describes nothing that can be
found again: the prompt file has changed since, or the provider's alias points somewhere else, and
the figure is still quoted. R3's rule already speaks of the prior "model and prompt version"; R6
makes the subject explicit wherever a result is recorded, so that R3's baseline and R5's trace have
something to attach to.

**The model identifier is the one [Standard 1](01-ai-system-manifest.md) R4 requires to be pinned**,
under `lifecycle.model-version-pinned`; a result recorded against a moving alias describes whatever
the alias pointed at on the day. **The prompt revision** is a revision of the versioned prompt
artifact [Standard 21](21-prompt-and-instruction-security.md) R1 requires, under
`promptsec.prompt-is-versioned-artifact`. **Which other configuration affects output** is a property
of the system, and the plan names it; this standard supplies no list.

**The manifest records the current subject, not an evaluated one.** Its `models[].id` and
`prompts[].path` say what the system uses now; nothing in the schema says which revision a result
described. **No schema governs how a plan or a result records its subject.**

For an experiment MachineLearningStandards reaches, its Standard 15 R1 requires a record naming code
version, data version, hyperparameters, environment and dependency versions, and random seeds. R6 does
not restate that list, and adds the prompt revision and the provider's model identifier, which the list
does not name.

There is no rule for R6.

### R7 — Record the scorer as part of the protocol

**Where an evaluation's outputs are scored by a rubric, by people, or by a judge model, the plan MUST
record the scorer before the run — the rubric's text and scale; for people, how many score each case
and how disagreement is resolved; for a judge model, its identifier, its prompt revision and its
configuration as R6 names them, and whether it is the same model identifier as the evaluated
subject — and a result scored by one scorer MUST NOT be compared with a result scored by another
unless the change of scorer is stated with the comparison.**

The scorer is part of the instrument. A rubric reworded, a second rater added, a judge model's prompt
edited or its alias re-pointed each changes the numbers while the evaluated subject stays exactly as it
was. A regression baseline scored by last month's judge and a new result scored by this month's are two
measurements, and a difference between them may be entirely the scorer's.

**Recording is what R7 requires; it does not require a scorer to be good.** This standard does not
require a judge model's agreement with human scoring to be measured, and it states nothing about
whether any model is, or is not, a reliable judge — it has no evidence about any model's judging
behaviour. Whether the judge is the same model as the subject is recorded because a reader cannot
otherwise tell; this standard draws no conclusion from either answer.

**A scorer tuned against the held-out set is R4's case**, as set out there.

The boundary review's reasoning for this item records rubric and judge-model design as outside what
MachineLearningStandards' Standard 12 covers. That is the review's inference, not that pack's words.
Where a rubric score is reported as a figure for an evaluation that pack reaches, the choice of that
figure as the metric remains its Standard 12's subject.

**No schema governs a scorer's record.**

There is no rule for R7.

### R8 — Decide in advance how a result that is not a figure is reached

**Where an evaluation reports a result that is not a figure — a per-case pass or fail, a category, or
a reviewer's written judgement — the plan MUST state, before the run, the criterion each case is
judged against and how per-case judgements become the reported result; and the reported result MUST
be accompanied by, or traceable to, the per-case judgements it summarises.**

"The outputs looked good" is an evaluation result. It is also the one most exposed to the failures
R1 exists for: with no figure, there is no metric to fix in advance, and the criterion becomes
whatever the reader of the outputs had in mind that afternoon. The aggregation matters as much as the
criterion — "most cases were acceptable" and "no case of this kind was unacceptable" are different
claims about the same judgements.

**Once per-case judgements are counted, the count is a figure.** A pass rate is a number, and R5's
rule reaches it; for an evaluation MachineLearningStandards reaches, its selection as the metric is
that pack's Standard 12. R8 governs the judgements the count is made from, and the result that is
never reduced to one.

The boundary review's reasoning records non-numeric output, "where there is no figure to select a
metric for", as outside MachineLearningStandards' Standard 12. That is the review's inference.

**No schema governs how a criterion or a per-case record is written.**

There is no rule for R8.

### R9 — No component of this framework may report an evaluation sound from inspection alone

**No detector, heuristic, or audit finding in this framework MAY report an evaluation plan as adequate
or as written before its results, a suite as producing the results its plan names, a baseline as
describing the prior version, a held-out set as unused for selection, or a result as produced by a
run, on the basis of a file's or manifest field's presence, a search that found nothing, or a commit
date; and no result for any rule this standard states MAY be presented as evidence of how well a
system performs.**

Every check that could be written for this standard's subject reads a repository: a plan file at the
path `evaluation.planPath` names, a command in `evaluation.suiteCommand`, a baseline file, the absence
of a held-out file name in a tuning script, a figure in a document with a link beside it. Each is real
evidence that something was written down. None is evidence that the plan preceded the numbers, that
the command produces what the plan describes, that the held-out set was never consulted by a person
between runs, or that the linked artifact contains the figure quoted. A report that said otherwise
would be this framework asserting a fact about a sequence of events it never observed.

The second clause exists because the words overlap. A verdict on an evaluation standard is easily
read as a verdict on the evaluation — "the eval rules passed" becomes "the system evaluates well" in
the first summary written about it.

**This requirement concerns what a check may claim. It is not a restatement of Standard 2 R2**,
neither narrows nor extends it, and has no bearing on Q7.

There is no rule for R9. It constrains this framework's own implementation rather than a consuming
project, and a project cannot fail it. It is enforced by construction and by review of this
repository, which is named as the weaker mechanism it is in Implementation.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| The bar found afterwards | The acceptance threshold is written into the plan after the first full run, at just below what the run scored | R1 |
| A plan with no data | The plan names a metric and a target; which inputs it is computed over is whatever the script loads that day | R1 |
| The plan re-dated | A plan is rewritten after results and committed as though it had governed the run | R1 — **not caught**; a commit date is not evidence of order |
| One person's shell | The suite ran once with unrecorded arguments against a file that has since moved | R2 |
| The entrypoint that fails | `evaluation.suiteCommand` names a script that exits with an import error | R2 — **not caught**; nothing reads the field or runs the command |
| No prior score | A prompt change ships; nobody can say what the previous prompt scored | R3 |
| A baseline with no subject | A committed results file records a score and no model identifier or prompt revision | R3, R6 |
| Baseline model mistaken for regression baseline | A constant-output comparator is recorded and read as the prior version's score | R3 |
| Prompt fitted to the held-out set | A prompt is edited and re-run against the evaluation set until it passes | R4 |
| Provider chosen on held-out score | Three hosted models are run on the held-out set and the highest-scoring one is selected and reported on the same set | R4 |
| The judge prompt tuned | A judge model's prompt is adjusted until held-out scores stop looking wrong | R4, R7 |
| The number from two revisions ago | A pull request quotes a figure from a run of an earlier prompt revision | R5, R6 |
| The model-written figure | A model asked to summarise results states a figure no run artifact contains, and the summary is committed | R5 |
| Alias as subject | A result is recorded against a provider alias, which has since been re-pointed | R6 |
| The re-pointed judge | The judge model's alias moves between baseline and new run; the "regression" is the judge's | R7 |
| Rubric reworded | A rubric's scale changes from five points to three between runs, and the results are compared | R7 |
| "Looked good" | A result is reported as "outputs reviewed and acceptable", with no criterion and no per-case record | R8 |
| A pass rate with no cases | A pass rate is reported; the per-case judgements it counts were never kept | R5, R8 |
| A false not-applicable that nothing contradicts | A policy declares R4's rule not-applicable for a system tuned against its evaluation set, and the result is quietly `skipped` | **Not caught**; see Validation |
| A present file read as a sound evaluation | A future check finds a plan at `evaluation.planPath` and a report says the system is evaluated | R9 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The plan, stating what is measured, on what data, against what bar; its commit; and the record of the run it governs | Committed; the run record wherever the suite writes it. `evaluation.planPath` may point to the plan | Human review comparing plan and run. **No schema governs a plan** |
| R2 | The entrypoint, its stated prerequisites, and the results a run of it produced | Committed; prerequisites such as credentials outside the repository. `evaluation.suiteCommand` may reference the entrypoint | Human review, by someone able to run it. Nothing in this framework runs it |
| R3 | The committed baseline artifact, naming its evaluated subject and plan revision | Committed. `evaluation.baselinePath` may point to it | Human review |
| R4 | The plan's designation of development and held-out data; the record of how prompts, models and configuration were chosen, and against what | Committed plan; experiment or tuning records; the history of prompt changes | Human review. The decisions R4 forbids are frequently made by a person between runs and leave no code |
| R5 | For each reported figure, the run artifact that produced it | Committed or retained run artifacts; the documents that quote the figures | Human review. **No schema governs the link**, and no manifest field records run artifacts |
| R6 | The subject recorded in the plan and in each result | Committed plan and result artifacts. The manifest's `models[].id` and `prompts[].path` describe the current system, not an evaluated one | Human review |
| R7 | The scorer's record: rubric, rater arrangement, or judge identifier, prompt revision and configuration | Committed with the plan | Human review. **No schema governs it** |
| R8 | The criterion, the aggregation, and the per-case judgements | Committed plan; retained per-case records | Human review |
| R9 | The detectors bound to this standard's rules — there are none — and the messages the verdict reports for them | `EVALUATED_RULES` in `scripts/standards.mjs`; `evaluateRule()` in `scripts/compliance.mjs` | Code review |

The gap worth naming: **every item of evidence above is located and read by a human, and by nothing
else in this release.** The part that matters most for R1, R4 and R5 — the order in which things
happened, and what a person looked at before deciding — is not in any file.

## Validation, severity, and exemptibility

<!-- BEGIN GENERATED FROM rules/eval.json — DO NOT EDIT. Verified by test/standards-tables.test.mjs. -->

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R1 | `eval.plan-exists` | required | error | document | yes |
| R2 | `eval.suite-executable` | required | error | structural | yes |
| R3 | `eval.regression-baseline-recorded` | required | error | document | yes |
| R4 | `eval.no-test-set-tuning` | forbidden | error | code-analysis | **no** |
| R5 | `eval.no-fabricated-results` | forbidden | error | manual-review | **no** |

<!-- END GENERATED -->

**R6, R7 and R8 have no rule.** Each is an addition this standard makes for generative evaluation;
a rule for any of them would be a catalog addition, which this document does not make. They are stated
with evidence and falsifiers a human can apply, and nothing in this release applies them.

**R9 has no rule, and this is deliberate.** It constrains this framework rather than a consuming
project; a project cannot violate it, and a rule nobody can fail would enlarge the catalog without
adding a check.

**Every rule above keeps its Phase 1 identity unchanged.** All five were minted with `introducedIn`
`0.1.0`, cite standard 17, and declare assurance `none`. This document states them; it does not
re-mint, re-level or re-type any of them, and it adds no rule to `rules/eval.json`.

**No detector examines any of the five.** None is in `EVALUATED_RULES` in `scripts/standards.mjs`,
which lists nine rule ids. None is `not-evaluable`. What each reports follows from `evaluateRule()` and
`distinction()` in `scripts/compliance.mjs`:

- **R1's and R3's rules** are `document`, and **R2's** is `structural`. Each is outside the list, so each
  reports `skipped` with disposition `not-evaluated` and the message "No detector in this release
  examines this rule." Their distinction is `not-evaluated`.
- **R4's rule** is `code-analysis` and outside the list: `skipped` / `not-evaluated`, the same message,
  and — because it is `forbidden` — distinction `prohibited-but-unestablished`. `evaluate()` lists it in
  `unestablishedProhibitions`.
- **R5's rule** is `manual-review` and outside the list: `skipped` / `not-evaluated` with the message
  "Requires human review. No automated check can establish this.", distinction
  `prohibited-but-unestablished`, listed in `unestablishedProhibitions`.

Any of the five, while applicable, keeps the status from `COMPLIANT`, as
[Standard 5](05-verdict-vocabulary.md) R5 requires; R4's and R5's are reported as unexamined
prohibitions, as its R4 requires.

That was observed rather than inferred, in two uncommitted runs of `node scripts/standards.mjs validate
--json` made on 2026-09-15 while writing this document. Against a throwaway copy of
`test/fixtures/valid-manifest/`, whose policy names only R1's rule, all five were applicable at their
catalog levels and reported exactly as listed above, with status `NOT_EVALUATED`. Against this
repository, whose `ai-policy.yml` lists all five and declares none not-applicable — and says that
R5's rule stays applicable because a contributor could fabricate a result here — all five reported
the same way.

**A false not-applicable declaration for any of these rules is never contradicted.**
`checkApplicabilityContradictions()` in `scripts/standards.mjs` blocks the verdict only when a detector
has observed a violation of a rule the policy declares not-applicable. No detector observes any rule
here, so a policy declaring R4's rule not-applicable for a system whose prompts were tuned against its
evaluation set reports `skipped` / `not-applicable` and nothing else. The declaration's `reason` and
`revisitWhen`, and the human who reads them, are the only check.

**What each rule's remediation asks for, against what the schemas accept.**

- R1's remediation — write a plan and commit it before running the suite — asks for nothing a schema
  must hold. `evaluation.planPath` exists and the remediation does not mention it.
- R2's remediation says to reference the entrypoint from the manifest. `evaluation.suiteCommand`
  accepts a non-empty string, which fits a command; the remediation names neither the field nor what
  form the reference takes.
- R3's remediation — commit the baseline artifact the suite produces — needs no schema.
  `evaluation.baselinePath` exists and the remediation does not mention it.
- R4's remediation names a development split and a held-out set. No schema field distinguishes the
  two; `dataSources[].kind` has a single `evaluation-set` value.
- R5's remediation asks for every reported metric to be linked to its run artifact. **No schema
  governs that link.**

None of the three `evaluation` fields is read by any script in `scripts/`; the manifest schema,
through `lifecycle.manifest-valid`, validates only that each is a non-empty string. Wording changes to
the remediations are returned as proposals and not made here.

**Two of the shard's three crosswalks named rule ids that do not exist, and were corrected on
2026-09-15.** R1's rule crosswalked to MachineLearningStandards' `evaluation.metric-selection`, and
R4's to `leakage.target-leakage`. Neither id is in that pack's `rules/` at `f3a1258` or `082ecba`, nor
among its 53 ids in `artifacts/foreign-namespace-inventory.json`. They now name
`evaluation.metric-selection-justified` and — by subject rather than by name — `split.no-test-set-tuning`:
`leakage.no-target-in-features`, the nearest by name, forbids the target entering a model's features,
which is not R4's subject. R4's crosswalk note had said that pack's rules "do not reach" prompt and
configuration selection; it now says only that its texts do not name prompts and that whether its rule
reaches them is not stated (see R4). R5's rule still records no crosswalk to
`integrity.no-fabricated-evaluation-metrics`; which `relationship` value would describe it is not
settled, and none is added. `checkRule()` in `scripts/catalog.mjs` checks a crosswalk's shape — that it
names a pack, a rule and a relationship, and not its own id — and no test checks that a foreign id
exists, which is how the two wrong ids loaded.

**R1's and R3's rules are `document`, and R2's is `structural`; in this release those name the kind of
check intended, not a check that exists.** A `document` check could find a plan or a baseline file; a
`structural` check could find a declared entrypoint. Neither could establish that a plan preceded its
run, that a baseline describes the prior version, or that an entrypoint runs, and R9 governs how any
such result is presented.

**R4's rule is `code-analysis`.** A tuning loop that scores candidates on a held-out file is visible in
code. The selection R4 forbids is as often made by a person between runs, which leaves no code at all.
This document does not change the rule's type; whether `code-analysis` can stand for a prohibition
whose usual form is not in code is returned as an open question.

**R5's rule is `manual-review`.** Under `checkRule()` in `scripts/catalog.mjs` a `manual-review` rule is
attestable by default; the attestation mechanism is Phase 4 and absent.

**R4's and R5's rules are `nonExemptible`**, and each `$exemptibilityNote` gives the reason. R1's, R2's
and R3's are exemptible, and **the shard records no note saying why**. This document does not supply a
reason as though one had been recorded.

**The five rules sit in `eval.`**, one of the seventeen namespaces reserved in `NAMESPACES` in
`scripts/catalog.mjs`. It is not in `SHARED_SEGMENTS`. [Standard 6](06-standard-structure-and-rule-identity.md)
R5 records why this pack uses `eval.` and not `evaluation.`. One final segment is shared:
`eval.no-test-set-tuning` and MachineLearningStandards' `split.no-test-set-tuning` differ only in their
namespace and prohibit closely related acts. No full id collides, which is what
[Standard 7](07-boundary-with-adjacent-standards.md) R4 forbids.

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control | Status in this release |
| --- | --- | --- | --- | --- |
| R1 | Human review of the plan against the record of the run it governs | A reported result with no plan; a plan missing its measure, data or bar; a plan first committed after the run it governs | A plan revised after a run, whose revision governs only later runs, must **not** be reported as re-dated; a plan held in a document other than `evaluation.planPath` must **not** be rejected for its location | **No detector.** No mechanical falsifier |
| R2 | Human review, by running the entrypoint with its stated prerequisites | No entrypoint; an entrypoint that fails, or runs cases other than the plan's | A suite needing hosted-model credentials stated as a prerequisite must **not** be reported unrunnable; two runs yielding different figures from a hosted model must **not** fail R2 | **No detector.** No mechanical falsifier |
| R3 | Human review of the committed baseline | A changed model or prompt with no committed record of the prior version's score; a baseline naming no subject | A system's first evaluated version owes no baseline; a baseline model under MachineLearningStandards' Standard 2 must **not** be accepted as, or reported missing for want of, R3's baseline | **No detector.** No mechanical falsifier |
| R4 | Human review of how prompts, models and configuration were chosen | A prompt, model or configuration kept because of its score on the held-out set, by a loop or by a person | Selection on a designated development split must **not** be reported; a single final run on the held-out set must **not** be reported; overlap between the held-out set and a provider's training data is item 18's, not a violation here | **No detector.** No mechanical falsifier; the common form leaves no code |
| R5 | Human review tracing each reported figure to its run artifact | A reported figure found in no run artifact, or in the artifact of a different subject or plan | A figure copied exactly from its run artifact into several documents must **not** be reported; an explicitly labelled target or bar in a plan is not a reported result | **No detector.** No mechanical falsifier |
| R6 | Human review of plan and result records | A result recording no model identifier, or no prompt revision | A result naming a pinned identifier and a prompt commit must **not** be reported for omitting configuration the plan does not name | **No detector. No rule.** |
| R7 | Human review of the scorer's record, and of any comparison across runs | A rubric, rater arrangement or judge not recorded before the run; two results under different scorers compared with no statement of the change | An evaluation scored only by code against a reference owes no R7 record; a judge model that is the same as the subject, so recorded, must **not** be reported as failing | **No detector. No rule.** |
| R8 | Human review of the criterion, the aggregation and the per-case record | A non-numeric result with no prior criterion, no stated aggregation, or no per-case judgements | A result that is a figure is R5's and not R8's; a per-case record kept outside the repository and referenced from the result must **not** be reported missing | **No detector. No rule.** |
| R9 | No rule in `rules/eval.json` is in `EVALUATED_RULES` | A detector reporting a plan adequate or prior, a suite working, a baseline valid, a held-out set unused or a result genuine, from presence, absence, a date or a clean search; any output presenting a result here as evidence of system performance | The current `skipped` / `not-evaluated` messages for these rules are **not** violations: they report that nobody looked | **Enforced by construction** — no detector reads this standard's subject |

**No requirement in this standard has a mechanical falsifier in this release.** R1 to R8 are stated
with falsifiers a human can apply, and nothing in the suite applies any of them. R9's footing is the
absence of code, not a test that fails.

What the existing suite does touch, stated precisely because it is less than it may look:

- **No test asserts an evaluated result for any of the five rules.** `test/validate.test.mjs` asserts
  that R1's rule reports disposition `not-applicable` in the `not-applicable` fixture, whose policy
  declares it so; that is a test of applicability declarations, not of evaluation plans.
- **34 fixture policy files under `test/fixtures/` name R1's rule; three name all five.** The three,
  `q13-synthetic-no-config/`, `q13-synthetic-env-block-none/` and `q13-synthetic-full-only/`, declare
  all five not-applicable, with a reason stating that the declarations are synthetic test input that
  isolates the verdict path and is not an applicability approval.
- **`test/distinction.test.mjs` asserts the derivation** that turns a `forbidden` rule nobody examined
  into `prohibited-but-unestablished`. It is general, and names no rule from this standard.
- **`test/namespace.test.mjs` asserts that a crosswalk names a foreign rule rather than one of this
  pack's**, and that no id collides with a recorded foreign id. It does not check that a crosswalk's
  foreign id exists, which is how the two defects corrected under Validation had loaded.

Once this document is in `standards/`, `test/standards-tables.test.mjs` asserts that the generated
table above matches `rules/eval.json` in both directions, and `node scripts/sync-rule-tables.mjs
--check` fails on any drift. Neither says anything about evaluation.

## Exceptions and staleness

The exception mechanism is item 4's subject and is Phase 4 work; item 4 is unwritten.
`schemas/ai-policy.schema.json` is closed and has no `exceptions` or `attestations` property, and
`test/no-phase-creep.test.mjs` asserts both are absent. **In this release an exception to any rule
above cannot be recorded**, so none is exemptible in practice whatever the table says. A project's
honest options are to meet a rule, to declare its subject absent with a reason and a `revisitWhen`, or
to leave it unmet.

**R4's and R5's rules are non-exemptible, so no exception will reach them when the mechanism exists.**
An approved exception to R4 would approve reporting a figure computed on a set the project knows it
selected against; one to R5 would approve reporting a result that did not happen. Neither is a bounded
risk.

When the mechanism exists, an exception to R1, R2 or R3 records a known, approved gap — results
reported without a prior plan, a suite that cannot be re-run, a change shipped with no prior score —
with an approver and a date. It does not make the results evidence of anything. R6 to R8 have no rule,
so nothing records an exception to them.

**Staleness is conditional, not scheduled**, following Standard 2 R5. The evidence for R1 to R8
describes one evaluated subject, one instrument and one set of data, and it stops holding when any of
them changes:

- A model identifier changes, or a provider re-points one — the subject R6 names is no longer the
  system, and R3's baseline describes a different subject
- A prompt is revised, or configuration the plan names changes
- The evaluation data is extended, replaced or re-split, or a held-out set is used for a selection —
  the last is permanent, because a held-out set does not become held out again
- A rubric, rater arrangement, judge model, judge prompt or judge configuration changes, so that
  results before and after are different measurements (R7)
- The plan is revised, which governs later runs and not earlier ones
- The suite's entrypoint or its prerequisites change
- MachineLearningStandards amends a scope this standard links to; the boundary review is a snapshot at
  a pinned commit and nothing here notices the change

**The staleness risk is asymmetric.** Models, prompts and judges are changed by people improving the
system, which is the moment the old baseline and the old plan look least relevant and are least likely
to be kept. Nothing in this release detects any of these transitions.

## Additions this standard makes beyond the source

The brief contributes two words to this item: **`Model evaluation`**, as the first subject of the
bullet "Model evaluation, benchmark integrity, robustness, and regression testing". It names model
evaluation as an area to cover. It does not mention plans, bars, suites, entrypoints, baselines,
held-out or development sets, tuning, fabrication, rubrics, judges, raters, prompts as evaluated
subjects, or non-numeric results. The title "Evaluation Plans for Generative Systems" is the
specification's item title, derived from that token; it is not the brief's wording. Everything
normative here is authored, and none of it has owner approval:

- **The five rules themselves.** Their existence, wording, levels, severities, validation types,
  exemptibility, crosswalks and placement under standard 17 were authored in the Phase 1 shard, not
  taken from the brief. This document states them as recorded and changes none of them.
- **The definitions** of an evaluation result, the evaluated subject, the held-out set and a scorer,
  including the rulings that a change to any part of the subject is a different subject and that a
  judge model is a scorer.
- **The per-requirement scope decisions**: which systems R1 to R8 reach, and that a first version owes
  no R3 baseline.
- **R1's readings**: that the plan's three elements are the rule's and that lacking any one fails R1;
  that R1 is met by a plan committed before the run it governs, reconciling the rule's description and
  remediation; that a later revision governs later runs; and that a commit date is not proof of order.
- **R2's readings**: that "runs the suite" means producing the results the plan names; that stated
  external prerequisites do not defeat R2; that runnable is not repeatable; and that
  `evaluation.suiteCommand` is where the remediation's manifest reference fits.
- **R3's readings**: that its baseline is the prior version of the system and not a baseline model;
  that a baseline must name its subject and plan revision; and the first-version ruling.
- **R4's readings**: that the prohibited act is the selection whoever makes it, including a person
  re-running by hand; that a judge model's prompt is a prompt within the rule; that a held-out set used
  for selection is no longer held out; and that contamination by a provider is item 18's.
- **R5's readings**: the enumerated quiet forms of fabrication, including a figure appearing only in a
  model-written summary; that a quotation of a quotation does not trace to a run; and that the rule
  names numbers and is not extended to other results.
- **R6, R7 and R8 in full.** Naming the evaluated subject; recording the scorer and forbidding
  undisclosed cross-scorer comparison; and fixing a non-numeric criterion and aggregation in advance with
  per-case records. The shard's `$comment` and R1's crosswalk note name "rubric and judge protocols, and
  non-numeric outputs", and Standard 7 R1 names "rubrics, judges, non-numeric output"; the requirements'
  content is this document's.
- **The decision not to require a judge model's agreement with human scoring to be measured**, and not
  to state anything about any model's reliability as a judge.
- **R9 in full**, its statement that this framework cannot establish an evaluation's soundness from a
  repository, and its explicit separation from Standard 2 R2 and Q7.
- **The boundary decisions**: that MachineLearningStandards' Standards 2, 5, 12, 14, 15, 19 and 20 are
  linked and not restated; that Standard 7 R5 governs where both packs apply; that a hosted model or an
  absent training pipeline does not by itself decide whether that pack applies, and the recorded unknown
  is left open; that Standard 7 R2's permission to define a baseline directly for a system that is not a
  machine-learning system is not exercised, because nothing here decides which systems those are; that the ground of items 12, 18, 19, 20, 29 to 31, 35 and
  50 is not claimed; and that the overlaps of R4 with `split.no-test-set-tuning` and of R5 with
  `integrity.no-fabricated-evaluation-metrics` and `testing.no-fabricated-results` are recorded rather
  than resolved.
- **A recorded gap**: for a system MachineLearningStandards does not reach, no requirement in this pack
  covers justifying a metric by the cost of error, quantifying uncertainty, or holding a comparison's
  conditions identical.
- **The observation of two crosswalk defects** — ids that exist at neither pinned MachineLearningStandards
  commit — and of a crosswalk note that stated as fact what that pack does not state. Both were
  corrected in `rules/eval.json` when this standard was integrated on 2026-09-15; this document records
  the correction and does not itself edit the shard.
- **Open questions recorded and not resolved**, each of which changes a rule's `standard` field or
  validation type, or decides whether this pack states requirements on ground another pack owns:
  **Q19**, whether the two `forbidden` rules here are item 50's prohibitions, given that item 50's
  recorded positive token is item 18's; **Q20**, whether R3's rule belongs to item 20; **Q21**, whether
  R4's rule's `code-analysis` type can stand for a prohibition usually enacted outside code; and
  **Q22**, whether this pack should state a baseline for metric justification, uncertainty and
  comparison conditions where MachineLearningStandards does not reach a system. All four are in
  `artifacts/project-plan-breakdown/08-open-questions.md`.
- **The decision not to grade these requirements by risk tier**, on the basis of Standard 2 R3.
- **The admission that no requirement has a mechanical falsifier**, that a false not-applicable
  declaration for any of these rules is never contradicted, and that the part of R1, R4 and R5 that
  matters most is not in any file — the per-rule results observed by uncommitted runs rather than
  asserted by the suite.

## Relationship to other standards and ADRs

[Standard 1](01-ai-system-manifest.md) draws the scope this standard applies within. Its manifest
schema has an `evaluation` object with `planPath`, `suiteCommand` and `baselinePath`, and a
`dataSources[].kind` value `evaluation-set`; R1 to R4 name where each fits, and nothing reads any of
them. Its R4 pins the model identifiers R6 records.

[Standard 2](02-ai-risk-tiering-and-applicability.md) is relied on for its R3 rule that a tier narrows
scope and never lowers a requirement, its R4 dispositions — which are why "we do not evaluate" must be
a reasoned declaration — and its R5 conditional expiry. **This standard does not change Standard 2**:
it does not restate or rely on R2, and does not propagate R2's word "propose", pending Q7.

[Standard 5](05-verdict-vocabulary.md) defines `not-evaluated` and `prohibited-but-unestablished`. Its
R4 is why R4's and R5's rules report as unexamined prohibitions, and its R5 is why any of the five,
while applicable, keeps a status from `COMPLIANT`. [Standard 6](06-standard-structure-and-rule-identity.md)
R3 is why every requirement here states a falsifier, R5 is why these rules use `eval.` and not
`evaluation.`, R6 is why ML's ids are crosswalked and never re-minted, and R8 is why R5's rule is
attestable by default. [Standard 7](07-boundary-with-adjacent-standards.md) R1 records "Metric
selection, calibration, model comparison, drift" as MachineLearningStandards' with this pack adding
"only generative framing — rubrics, judges, non-numeric output"; its R2 is the link-don't-copy rule
this standard follows, and its permission to define a non-ML baseline directly is not exercised here
(see Scope); its R5 is the conflict
rule applied under Scope; its R7 describes `boundary.ml-pack-required`, a Phase 2 rule that does not
exist in `rules/` in this release, so nothing reports a system governed by this pack and not by
MachineLearningStandards.

[Standard 8](08-ai-safety-requirements-and-safety-cases.md) R4 names a record of an executed test,
evaluation or exercise — naming the model identifiers, prompt revisions and configuration it was
produced against — as one kind of evidence a safety case may cite, and its R5 states that such a record
establishes behaviour only on the inputs exercised, at the revision recorded. R5 here governs whether
an evaluation result a case cites came from a run; R6 asks every result for the same identification
Standard 8 R4 asks of a cited record.

[Standard 13](13-personal-data-in-ai-systems.md) R1 governs whether an evaluation fixture holds real
personal data, and its R2 whether it holds a credential; an evaluation set is one of its
model-adjacent stores. Nothing here restates either.

[Standard 21](21-prompt-and-instruction-security.md) R1 makes prompts versioned artifacts, which is
what gives R6's prompt revision something to name.

Unwritten items this standard defers to, by specification number: item 4 (exceptions); item 12
(provenance of evaluation sets); item 18 (benchmark integrity and contamination); item 19 (what an
evaluation must cover); item 20 (when regressions are tested and what fails a change, and the open
question of R3's rule); items 29, 30 and 31 (versioning, lineage, and nondeterminism of re-runs);
item 35 (adversarial exercises); and item 50 (evaluation integrity prohibitions, whose relationship to
the two `forbidden` rules here the specification does not record).

Outside this repository: **MachineLearningStandards** owns metric selection, uncertainty, comparison,
test-set separation and fabricated metrics for the evaluations it reaches. Its `standards/12-metric-selection.md`
and `standards/20-uncertainty.md` were read in full for this document, and its Standards 2, 5, 8, 9,
14, 15, 19 and 25 and its `rules/evaluation.json`, `integrity.json`, `leakage.json`, `split.json` and
`reproducibility.json` were read for the requirements and rules cited, all through git objects at
commit `f3a1258`; `git diff --stat f3a1258 082ecba` over those paths is empty. That pack's `invariant.`
segment is shared with this pack and no id here uses it. **None of its maintainers has confirmed any
division stated here.** **EngineeringStandards'** `testing.no-fabricated-results`, read in its
`rules/testing.json` at commit `b90b915`, is R5's recorded precedent.

No ADR covers this standard. `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. No requirement has a detector. R9's one mechanical guarantee is an absence.**

Stated as separate lists so that a proposal is not read as a capability.

**Implemented today.**

| Mechanism | What it does | Where |
| --- | --- | --- |
| Reporting of unexamined rules | All five rules report `skipped` / `not-evaluated`, never `passed`, and keep an applicable project from `COMPLIANT` | `evaluateRule()` and `evaluate()` in `scripts/compliance.mjs` |
| Unexamined prohibitions | R4's and R5's rules report `prohibited-but-unestablished` and are listed in `unestablishedProhibitions` | `distinction()` and `evaluate()` in `scripts/compliance.mjs` |
| Applicability declarations | A rule declared not-applicable with a reason reports `skipped` / `not-applicable` | `applyPolicy()` in `scripts/policy.mjs`; `evaluateRule()` in `scripts/compliance.mjs` |
| Manifest shape | Validates `evaluation.planPath`, `suiteCommand` and `baselinePath` as non-empty strings and `dataSources[].kind` against its enum, and refuses any undeclared field | `schemas/ai-system-manifest.schema.json`, through `lifecycle.manifest-valid` |
| Catalog invariants | Refuse a malformed rule or crosswalk shape; default R5's `manual-review` rule to attestable. They do not check that a crosswalk's foreign id exists | `checkRule()` in `scripts/catalog.mjs` |
| Namespace and collision checks | Reserve `eval.`, refuse a crosswalk naming one of this pack's own ids, and refuse a colliding full id | `NAMESPACES` in `scripts/catalog.mjs`; `test/namespace.test.mjs` |
| Generated-table verification | Asserts the Validation table and `rules/eval.json` agree in both directions | `scripts/sync-rule-tables.mjs --check`; `test/standards-tables.test.mjs` |
| R9 by construction | `EVALUATED_RULES` lists nine rule ids, none in `eval.`, and no detector reads a plan, an entrypoint, a baseline, a tuning record or a run artifact | `EVALUATED_RULES` in `scripts/standards.mjs` |

Every row above is a general mechanism, not work done for this standard.

**What nothing in this release does.** No script in `scripts/` reads `evaluation.planPath`,
`evaluation.suiteCommand` or `evaluation.baselinePath`; a search of `scripts/` finds none of the three
names. Nothing runs an evaluation suite, compares a plan's commit with a run, reads a baseline, looks
for held-out data in a selection path, or traces a reported figure to an artifact. And because no
detector observes an `eval.` rule, `checkApplicabilityContradictions()` in `scripts/standards.mjs` can
never block on a false not-applicable declaration for one.

**Proposed, and deliberately absent from this release.** No file in
`artifacts/project-plan-breakdown/` names a detector for any `eval.` rule; each row below is this
document's proposal, not a planned item.

| Proposed | Why it is not here |
| --- | --- |
| A `document` check that a file exists at `evaluation.planPath`, for R1's rule, and at `evaluation.baselinePath`, for R3's | Phase 3 detector work at the earliest; `artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` §8 puts detectors beyond the nine in `EVALUATED_RULES` out of scope for this phase. It would establish presence only, and R9 governs how any result it reports may be presented |
| A `structural` check that `evaluation.suiteCommand` is declared and names a file present in the repository, for R2's rule | The same phase boundary. It could not establish that the command runs; running a target's code is a different contract from reading it, and this release states no position on it |
| A check for held-out-designated data in a tuning or selection loop, for R4's rule | Phase 3 at the earliest, and it would need a declared designation no schema can hold. It could reach only the loop form; a person selecting between runs leaves no code |
| Manifest or plan-schema fields for the held-out designation, the evaluated subject, the scorer, or run artifacts | A schema change alters what a conformant consuming project may declare. It is a schema-versioning decision, not a side effect of writing this document, and §8 records the same boundary for risk-tier fields |
| Withdrawal of a not-applicable declaration when an evaluation detector observes the subject | Follows automatically from `checkApplicabilityContradictions()` once any detector above exists; nothing to build for this standard alone |

**What no future release will implement.** A detector or report that states an evaluation plan is
adequate or preceded its results, a suite produces what its plan names, a baseline describes the prior
version, a held-out set was never used for selection, or a result came from a run, from a file's
presence, a field's value, a commit date or a search that found nothing; or that presents any result
under this standard as evidence of how well a system performs. R9 forecloses both.

**R9 is enforced by review of this repository, which is weaker than a test.** Nothing prevents a future
contributor from rendering a clean result for R1's rule as "evaluation plan in place", or R5's as "no
fabricated results"; what stands in the way is this document, the `EVALUATED_RULES` list, and whoever
reads the diff.
