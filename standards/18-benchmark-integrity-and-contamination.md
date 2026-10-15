# Standard 18 — Benchmark Integrity and Contamination

A benchmark is useful for one reason: a model's answer to it was not already in the model. The
reason is easy to lose without anyone doing anything wrong. A set is published, copied into a
blog post, quoted in a pull request, scraped, and trained on by a model released a year later. The
score that model reports is true. What it measures is partly recall, and nothing in the score says
which part.

The same thing happens at a smaller scale inside a project. A held-out set is committed to a
repository that is later made public, pasted into a prompt sent to a provider, or used as few-shot
examples because they were close to hand. Every later number computed on it is a number about a set
the evaluated model may have seen.

The failure this standard is written against is not contamination, which a project using a model it
did not train cannot rule out. It is a result reported as though contamination had been excluded
when nobody examined whether it could be, and a benchmark kept as evidence long after it stopped
discriminating between anything.

Source: item 18 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "benchmark integrity" token of the "Model evaluation, benchmark integrity,
robustness, and regression testing" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 18 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **B**, recorded
> as `NARROWED` in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json), whose
> substantive half is human judgment and carries `humanSignOff: null`. No maintainer of any adjacent
> pack has confirmed it.
>
> **The brief supplies one word and this standard supplies the rest.** The brief's bullet names
> "benchmark integrity" and states no requirement for it. The item is class `D` because its token is
> the brief's own; the requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it — a repository that invokes a model, retrieves context for one, or acts on a model's output —
wherever it reports a result computed on an evaluation set, and wherever it holds one.

Covers: what is recorded about an evaluation set's origin and exposure; how a result is qualified
when the evaluated model may have seen the set; where a project's own held-out set may and may not
be placed; what a contamination check is entitled to claim; when a benchmark is no longer evidence;
and the limit of what this framework can say about any of it.

Three terms, each defined here rather than by the brief:

- **Contamination** is the presence of an evaluation set's content, or of material from which its
  answers can be derived, in data a model was trained or tuned on, or in a model's context at the
  time it is evaluated, so that a score on the set no longer measures what the plan said it would.
- An **evaluation set** is the input, and where they exist the reference answers, that a result
  is computed on. [Standard 17](17-evaluation-plans-for-generative-systems.md) defines the
  **held-out set** as the part a plan reserves for the measurement it reports; this standard applies
  to both, and to a **public benchmark**, which is an evaluation set whose content its authors or
  anyone else published.
- A **benchmark** is a public benchmark or any evaluation set a project uses as a stand-in for a
  capability it cares about, as opposed to a set built from its own task.

**Where each requirement reaches.** R1 reaches every system that reports a result on an evaluation
set. R2 reaches every system that reports a result on a set a model it does not train could have
seen, which includes every public benchmark. R3 reaches systems that hold a held-out set. R4
reaches a project that states a contamination check was run. R5 reaches systems that rely on a
benchmark as evidence. R6 constrains this framework and reaches no consuming project. A system with
none of a requirement's subject may declare that rule not-applicable under
[Standard 2](02-ai-risk-tiering-and-applicability.md) R4, with a reason and a `revisitWhen`.

It does **not** cover, and claims none of the ground of, the following:

- **Selection against the held-out set by the project** — prompts, models or configuration chosen by
  their score on it. That is [Standard 17](17-evaluation-plans-for-generative-systems.md) R4, and the
  contamination described here is distinct from it: a provider that trained on a set has not been
  tuned against it by the project.
- **Leakage introduced by a project's own training pipeline** — preprocessing fitted across a split,
  duplicates spanning partitions, features unavailable at prediction time. That is
  MachineLearningStandards' subject; see the posture note below.
- **What an evaluation must cover** (item 19, Robustness Evaluation) and **when regressions are
  tested** (item 20, Regression Testing Across Model and Prompt Versions), both unwritten in this
  release.
- **Where an evaluation set came from as a matter of corpus provenance** (item 12, Context and Corpus
  Provenance, unwritten). R1 asks only that the origin be recorded as it bears on exposure.
- **Whether an evaluation set holds personal data.** [Standard 13](13-personal-data-in-ai-systems.md)
  R1 governs it, and nothing below relaxes it.
- **Prohibitions on tampering with or fabricating evaluation results** (item 50, Evaluation Integrity
  Prohibitions, class `A`, unwritten). See the note on it below.

**Boundary posture B, narrowed — a baseline for one half of the concern, outright for the other.**
The boundary review records the owner as "MachineLearningStandards for train/test leakage;
AIStandards outright for pretraining contamination" and its verdict is `NARROWED`: the plan's
posture assumed MachineLearningStandards covered the whole concern, and the review found it covers
one half. The evidence it records for that is one file.

- **MachineLearningStandards, `standards/08-leakage.md`.** Its scope reads: "Applies to every path
  by which information unavailable at prediction time can reach a model during training". Its R1 to
  R4 concern fitted transformations, duplicate records spanning a split, identifier columns and a
  training pipeline that mirrors inference; its P1 and P2 prohibit preprocessing that sees
  information prediction-time code will not.

The review's reasoning is that contamination of a third-party pretrained model by a public
benchmark predates the project, involves no pipeline the project controls, and is outside that
standard's stated path. **That reasoning is an inference, and this standard depends on it only for
where it places requirements.** Whether MachineLearningStandards' evaluation standards reach a
hosted model the project did not train is recorded as unknown for item 17 and as open question Q22,
and this standard does not read it. Where both packs govern a concern, the more specialised
requirement governs and the stricter compatible one applies
([Standard 7](07-boundary-with-adjacent-standards.md) R5).

That file was re-read for this standard through git objects at `f3a1258` (1.6.0), the commit the
boundary review pins; the quoted scope sentence is verbatim. Nothing else in that pack was read for
this standard, and nothing about it is claimed beyond that file.

**Item 50, and Q19, are not decided here.** The specification's Authored items table names item 50,
Evaluation Integrity Prohibitions, as the negative face of `benchmark integrity` — this item's
token. The two `forbidden` evaluation rules in `rules/eval.json` cite
[Standard 17](17-evaluation-plans-for-generative-systems.md), and whether they are item 50's
prohibitions stated early is open question Q19. This standard states positive requirements and mints
no prohibition and no rule. It does not answer Q19, and its writing does not change the question:
item 50 is still unwritten, and R3 below is a requirement, not one of its prohibitions.

## Requirements

### R1 — The origin and exposure of an evaluation set are recorded

**A system MUST record, for each evaluation set a reported result uses, where it came from, whether
its content was public and from when, and the model identifiers a result on it was computed for.**

The model identifier is the one [Standard 1](01-ai-system-manifest.md) R4 asks the manifest to
pin; without it a record of "published before the model's data was fixed" cannot be read, because
which model is not said. A set the project built from its own task and has never published has a
short record, and that is the point: the record is what lets a reader see that the set is not
public rather than assume it.

The record concerns exposure, not authorship. "Public from 2024-03" and "never published, held in a
private repository" are both complete answers; "unknown" is a third complete answer and is better
than a guess. **A record that is absent is not a record that the set is private.**

The manifest's `dataSources` entry carries `kind: evaluation-set`, `synthetic` and `provenance`, and
no field for public exposure or its date. Nothing here asks an adopter to write a field the schema
rejects: the record is a document the project names, and which document is the project's choice.

### R2 — A result on a set the model may have seen says so

**Where an evaluated model could have been trained on the evaluation set, a result MUST be reported
with that qualification, and MUST NOT be reported as free of contamination because no
contamination was found.**

For a model the project did not train, which is every hosted model, the project usually cannot see
the training data. A provider may state that it filtered named benchmarks, may publish a training
cutoff, or may say nothing. Each of those is a fact to record, and none establishes that a
particular set was not seen: a stated filter is the provider's claim about its own process and is
only as good as the match it used.

**Absence of evidence is reported as unknown.** "No overlap was detected" is a statement about a
check. "The result is uncontaminated" is a statement about the model, and nothing a repository
holds supports it for a model the project does not train.

A public benchmark's score is therefore reported as a score on a public benchmark, with its
exposure as R1 records it. This does not ask a project to stop using one. It asks that the number
not carry a claim about capability on the project's own task that the set's exposure leaves open.

### R3 — A project's own held-out set stays out of reach of models it will evaluate

**A project MUST NOT place its held-out set, or reference answers from it, where a model it will
evaluate may ingest it, and MUST record which routes it relied on being closed: public
repositories and mirrors, requests to a provider on terms that permit retention or training, and
data used to fine-tune or to select few-shot examples.**

This is the part of the concern a project controls. A held-out set committed to a repository
that is later made public, or to a repository that a coding assistant indexes, or pasted into a
prompt, is a set an evaluated model may have seen the next time it is trained. What the project can
do is keep it out and record what it did.

**Which provider terms apply is the project's fact to record, not this standard's to assume.**
Whether a provider retains requests, whether it trains on them and under which plan are matters of
that provider's published terms and the project's agreement with it, and they change. The
requirement is that the project looked and wrote down what it relied on.

The set used to select few-shot examples, or any reference answers placed in a prompt, is inside
the requirement. A held-out set whose items appear in a prompt is a set the model was shown, and
the result computed on it has measured how well the prompt carried the answers.

**R3 states what is placed where; it does not restate [Standard 17](17-evaluation-plans-for-generative-systems.md)
R4.** Selecting by score on the held-out set is R4's subject and is an act of the project's;
exposing the set to a model that is later evaluated is this requirement's, and a project can
breach either without the other.

### R4 — A contamination check states its method and what it cannot establish

**Where a project reports that a contamination check was run, it MUST record the method, the
data it was able to examine, and the limits of what a negative result establishes, and MUST NOT
describe a negative result as showing the set was not in a model's training data.**

Common methods are overlap between evaluation items and a corpus the project can see, planted
canary strings that a model is then asked to complete, comparing performance on items with their
paraphrases, and comparing performance before and after a set's publication date. Each examines
something other than the model's training data, and each can miss contamination that has been
paraphrased, translated or partially included.

**A check examines a proxy.** A check against a corpus the project holds says that corpus does not
contain the items. A canary string absent from completions says the model did not reproduce it.
Both are worth recording and neither is a finding about the model's training data, which for a
hosted model the project does not have.

The requirement does not ask a project to run a check. It asks that one that was run be described
by what it did.

### R5 — A benchmark that no longer discriminates is not kept as evidence

**A project MUST record when a benchmark it relies on has stopped distinguishing the systems it
compares or has been found to have a defect that undermines it, and MUST NOT continue to report
it as evidence of the capability it was adopted for without saying so.**

The ways a public benchmark stops measuring anything are ordinary: scores sit at the ceiling so
that candidates are indistinguishable, the items and answers have circulated widely enough that
contamination is likely whatever any one check says, a defect in the items or the reference answers
is found, or the capability it stood in for is no longer the one the project cares about.

[Standard 17](17-evaluation-plans-for-generative-systems.md) assigns "whether a public benchmark
still measures anything" to this item, and this is the requirement that carries it. What this
requirement asks is a record and a qualification, not a threshold: it names no score above which a
benchmark is saturated, because that figure would be this repository's invention.

### R6 — This framework MUST NOT report an evaluation set uncontaminated or a benchmark valid from a repository

**No detector, rule, audit finding or generated report in this framework MAY state that an
evaluation set is uncontaminated, that a model has not seen it, or that a benchmark remains valid,
because a document, a configuration, a file path, a check's output or an absence of overlap is
present in the repository.**

A repository can show that a document names an evaluation set, that a field records a date, that a
script computes n-gram overlap against a local corpus, and that the overlap was zero. It cannot show
that the corpus is what a model was trained on, that the date is the one that matters, or that a
paraphrase was not seen. Reporting a pass from any of those would turn the presence of a record
into a verdict about a model's training data.

Whether a hosted model was trained on a set is **not-evaluable** from a repository. This is the
unknown the boundary review itself records: "Pretraining contamination is not detectable from a
repository at all."

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Exposure unrecorded | A result reported on a set whose public status and date nobody wrote down, so a reader assumes it is private | R1 |
| Model not named | A record of when a set was published with no model identifier, so it cannot be read against a training cutoff | R1 |
| Absence read as privacy | A set with no exposure record treated as one that was never published | R1 |
| Clean by search | A score reported as uncontaminated because a search of a corpus the project holds found no overlap | R2 |
| Provider claim as fact | A provider's statement that benchmarks were filtered reported as the set not being seen | R2 |
| Public score as task capability | A public benchmark number reported as the system's capability on the project's own task | R2 |
| Held-out set published | The set committed to a repository later made public, or indexed by a tool that shares it | R3 |
| Answers in the prompt | Held-out items or answers used as few-shot examples or placed in a system prompt | R3 |
| Terms assumed | A project's held-out set sent to a provider on an assumption about retention that nobody recorded | R3 |
| Proxy as proof | A canary string not reproduced, or zero n-gram overlap, reported as the set not being in the training data | R4 |
| Method not stated | "Checked for contamination" with no method, corpus or limit | R4 |
| Ceiling kept | A benchmark on which every candidate scores within noise of the top, still reported as a differentiator | R5 |
| Known-defective item set | A benchmark found to have wrong reference answers still cited with no qualification | R5 |
| Presence read as clean | A framework report that a set is uncontaminated because a record or an overlap check exists | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | For each evaluation set a result uses: origin, public status with a date or "not published", and the model identifiers the result is for | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | The reported result with its qualification, and the provider statements or cutoff relied on, each marked as the provider's claim | The evaluation report and the project's notes on the provider | Human review |
| R2 (exposure) | None obtainable from a repository | — | **Not-evaluable** |
| R3 | The routes the project relied on being closed, and the terms it read for each provider the set was sent to | A project document the project names | Human review |
| R3 (placement) | Whether the held-out set is in a repository that is or becomes public, or in a prompt: a statement of fact the reviewer checks against the repository's visibility and prompt files | The repository and its hosting settings | Human review |
| R4 | The check's method, the corpus or model examined, and the limits stated | The report of the check | Human review |
| R5 | The observation that led to a benchmark's retirement or qualification, with its date | The evaluation report or a decision record | Human review |
| R6 | The absence of any detector that reports contamination or benchmark validity from presence | This repository's own detectors and tests | Code review; see Implementation |

A document that records an evaluation set's exposure establishes that the project wrote it down. It
does not establish that the record is true or that the model did not see the set. A reviewer reads
the record against the set's actual publication history and the repository's visibility.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
[Standard 6](06-standard-structure-and-rule-identity.md) R3 requires every standard to cite at least
one rule or record why it does not; this is that record.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 would look for an exposure record, and
   neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place
   for one: `dataSources[].kind` has the single value `evaluation-set`, with `synthetic` and a free
   `provenance` string, and both schemas are closed. A rule failing every project for omitting what
   no schema accepts would measure this framework's own incompleteness and blame the project for it.
   Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **R2 and R6's subject cannot be read from a repository at all.** Whether a hosted model was
   trained on a set is the unknown the boundary review records, and R3 and R4 concern where a
   set was placed and what a check examined, which are facts about a hosting setting, a provider's
   terms and a process. A detector reading source would test for the presence of a filename or a
   phrase, which R6 forbids this framework from reporting as a result.
3. **The namespace and the prohibition question are not settled.** `eval.` is minted for
   [Standard 17](17-evaluation-plans-for-generative-systems.md), and whether its two `forbidden`
   rules are item 50's prohibitions is open question Q19. A rule here would be either a new
   prohibition in item 50's ground or a new requirement in item 17's namespace, and choosing between
   them is a decision this standard does not make.

**Severity.** R1 to R5 are `manual-review` obligations in this release. The exposure subject of R2
is **not-evaluable** and is not reported as reviewed. R6 constrains this framework and has no
validation type, because the thing it prohibits is a behaviour of the tool.

**Exemptibility.** R6 is not exemptible: no project circumstance makes it reasonable for a scan to
report a model unexposed or a benchmark valid from a record, and a mechanism for excepting the
prohibition would be self-defeating. R2's requirement not to report a clean result because nothing
was found is likewise not exemptible, because an exception would record a project as knowingly
reporting an unsupported claim about a model. R1, R3, R4 and R5 reach a system only where their
subject exists — R3 only where a held-out set is held, R4 only where a check is reported, R5 only
where a benchmark is relied on — and a system without that subject may declare the requirement
not-applicable under [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 with a reason and a
`revisitWhen`. No detector in this release would contradict a false declaration. No level here is
lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | For one evaluation set, origin, public status with a date or "not published", and the model identifiers are all recoverable from the record | A result reported on a set with no exposure record, or a record naming no model | A set recorded as "not published" with a stated reason must **not** be failed for lacking a publication date |
| R2 | A result on a public benchmark carries the qualification, and a provider statement is marked as the provider's | A result described as uncontaminated because a search found no overlap | A project that reports "exposure unknown" and the score must **not** be failed for not having excluded contamination |
| R3 | The held-out set is absent from public repositories and from prompts, and the routes relied on are recorded | The set in a repository that is public, or its items in a few-shot prompt | A set held in a private repository with no model-facing use must **not** be flagged for existing |
| R4 | A reported check names its method, what it examined, and what a negative result does not show | "Checked, no contamination" with no method | A project that ran no check and says so must **not** be failed for not running one |
| R5 | A benchmark found saturated or defective is recorded as such and is reported with that qualification | A benchmark on which every candidate scores at the ceiling reported as a differentiator with no note | A benchmark still discriminating between candidates must **not** be flagged for being old or public |
| R6 | No detector or report in this repository outputs a contamination or benchmark-validity verdict from presence | A detector that reported a set uncontaminated because an overlap check's output was zero | Reporting that an exposure record was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads an exposure record and no fixture
carries one, so R1 to R5 are enforced by review or not at all, and R6 holds by construction. The
negative controls state what review must not do to a project that has the right subject and does
the right thing. **A requirement with no falsifier is a requirement nobody can be shown to have
broken**, and that is the honest state of this standard.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to
except. A project that knowingly does not meet one records that in its own documents; Standard 2's
dispositions apply to the application of a rule, and this standard has none.

**What invalidates a recorded exposure statement or contamination check.** Each of these changes
what the record means, and a record made before the change describes the earlier situation:

- a change of model identifier, provider or model version, since a set that was after one model's
  cutoff may be before the next's;
- the evaluation set being published, mirrored, quoted or committed to a repository that is or
  becomes public, or reaching a provider on terms that permit retention;
- a change in a provider's published terms, which R3's recorded route depends on;
- a change in the benchmark itself: items added or removed, reference answers corrected;
- the project beginning to train or fine-tune a model of its own, which brings the training pipeline
  into MachineLearningStandards' ground.

**Staleness is asymmetric here.** A "private" record becomes false the moment a set leaves the
repository by a route nobody listed, and nothing in a repository shows the set was copied. Nothing
in this release detects the transition; the events above are a note to a future reader.

**Contradicted by evidence.** A model reproducing a canary string, a provider disclosing that a
benchmark was in its training data, or an item found verbatim in a public corpus contradicts what the
project recorded under R1 and R2 and invalidates it until re-examined, and results computed on that
set before the finding are not rescued by re-recording it.

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes two words, "benchmark integrity", inside a bullet of four
subjects. It states no requirement, level or evidence for them. The item is class `D` because its
subject token is derived from the brief; the requirements are not derived. Specifically authored
here, none of it owner-approved:

- **The definition of contamination** as including exposure through a model's context at evaluation
  time and not only through training data. The brief does not define the term.
- **R1's record** and the ruling that an absent record is not a record of privacy.
- **R2 in full**: the qualification of a result on a set a model may have seen, and the ruling that
  "no overlap found" is a statement about a check and not about a model, including its
  non-exemptibility.
- **R3's requirement** that a project keep its own held-out set out of reach of models it will
  evaluate, the list of routes, and the inclusion of few-shot examples and prompts. The brief names
  no placement.
- **R4's limits** on what a contamination check may claim, and the list of methods named in the
  text, which is illustrative and not a required set.
- **R5's** requirement that a benchmark that no longer discriminates be recorded, and the refusal to
  set a saturation threshold. The assignment of "whether a public benchmark still measures anything"
  to this item is [Standard 17](17-evaluation-plans-for-generative-systems.md)'s statement of the
  boundary, not the brief's.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in
  [Standard 8](08-ai-safety-requirements-and-safety-cases.md),
  [Standard 17](17-evaluation-plans-for-generative-systems.md),
  [Standard 25](25-grounding-and-hallucination-control.md) and
  [Standard 33](33-ai-observability.md).
- **The exclusions in Scope** as division lines, including items 12, 19, 20 and 50. Where each
  begins is unconfirmed by anyone.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the
  decision to mint no id in the `eval.` namespace and to take no position on Q19.
- **The recheck of one sibling file** at the commit the review pins, and the observation that the
  review's reasoning about hosted models is an inference this standard does not rely on beyond
  placing requirements. Neither is the boundary review's.

Not authored here, and recorded so the reader does not credit this standard with it: the posture `B`,
the `NARROWED` verdict, the two-way owner division and the sibling evidence are the boundary
review's.

## Relationship to other standards and ADRs

[Standard 17](17-evaluation-plans-for-generative-systems.md) names this item as the owner of
contamination and of whether a public benchmark still measures anything, and R4 there concerns the
project's own selection against the held-out set; R3 here concerns exposing the same set to a
model, and neither restates the other. Its R6, on the evaluated subject, is what R1's model
identifiers connect to. [Standard 1](01-ai-system-manifest.md) R4 pins the model identifier R1
refers to. [Standard 13](13-personal-data-in-ai-systems.md) R1 governs personal data in an
evaluation set and is not relaxed by anything above.

[Standard 7](07-boundary-with-adjacent-standards.md) R5 orders a conflict between packs, specialist
first and then the stricter compatible requirement. [Standard 2](02-ai-risk-tiering-and-applicability.md)
R3 and R4 govern the applicability and non-lowering language used above, and
[Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Validation section
answers by recording why no rule is shipped.

Items 12, 19, 20 and 50 are unwritten in this release; the lines drawn above are provisional until
they are, and the later standards may legitimately move them. Open questions Q19 (whether the two
forbidden evaluation rules are item 50's prohibitions) and Q22 (whether MachineLearningStandards'
evaluation standards reach a hosted model) are recorded open and not answered here.

**Outside this pack.** MachineLearningStandards' Standard 8 (Leakage) is named in Scope with what the
boundary review recorded and what was read. It is not a crosswalk, nothing in it is restated, and no
maintainer of that pack has confirmed this reading. No ADR covers this standard —
`artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds by construction.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away
as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds by construction, not by assertion.** No detector, rule or report in `scripts/`, `rules/`, `schemas/`, `templates/` or `ai-policy.yml` has a concept of contamination or benchmark integrity; a case-insensitive search of those paths for `contamin` and `benchmark` found no use of either as a subject. No test asserts the absence, so a future detector could break R6 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's evaluation integrity |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 | A place to record an evaluation set's origin and exposure: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R2, R4 | A convention for how a result carries its qualification and a check its limits | The shape is the project's; whether a report says what it must is a reading of prose |
| R3 | A way to see whether a set is in a public repository or a prompt | Repository visibility is a hosting fact, not a file; a prompt scan would be a presence check that R6 forbids reporting as a verdict |
| R5 | A convention for recording a benchmark's retirement | Needs R1's record to exist first |
| R6 | A test asserting no detector emits a contamination or benchmark-validity verdict | Meaningful only once a detector exists for it to constrain |
| Rule ids | Ids and an owner, once Q19 and the namespace are decided | Not decided; this standard names none |

**What no future release will implement.** A detector that reports an evaluation set uncontaminated,
a model not to have seen it, or a benchmark valid from the presence of a record, a configuration, a
file path or an overlap check's output. R6 forecloses it, and the foreclosure is the point: a record
is not what the model was trained on, and a framework reporting it would put its authority behind a
property of a model's training data that nothing in a repository can show.
