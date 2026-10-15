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

Four terms, each defined here rather than by the brief:

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
- **Project-held material** is any evaluation material that is not public: see R3.

**Where each requirement reaches.** R1 reaches every system that holds an evaluation set or reports a
result on one. R2 reaches every system that reports a result on a set that a model trained or tuned
by another party could have seen in training, which includes a public benchmark published before
the model's training cutoff or where the cutoff or training period is unknown and a model the project
fine-tunes from a third-party base, and every system whose evaluated model could have had the set's
items or answers in its context at evaluation time. R3 reaches systems that hold project-held
material. R4 reaches a project that reports a contamination check was run. R5 reaches systems that
rely on a benchmark as evidence. R6 constrains this framework and reaches no consuming project. A
system with none of a requirement's subject has nothing to meet: this standard defines no catalog
rule, so there is no rule id under which [Standard 2](02-ai-risk-tiering-and-applicability.md) R4's
not-applicable declaration could be made, and none is asked for. The project may say in its own
evaluation record that the subject does not exist; that is guidance, and no requirement is breached
by silence.

What the project's own training pipeline introduces is MachineLearningStandards' ground (see below).

It does **not** cover, and claims none of the ground of, the following:

- **Selection against the held-out set by the project** — prompts, models or configuration chosen by
  their score on it. That is [Standard 17](17-evaluation-plans-for-generative-systems.md) R4, and the
  contamination described here is distinct from it: a provider that trained on a set has not been
  tuned against it by the project.
- **Leakage introduced by a project's own training pipeline** — preprocessing fitted across a split,
  duplicates spanning partitions, features unavailable at prediction time. That is
  MachineLearningStandards' subject; see the posture note below. Exposure a fine-tuned model
  inherits from its third-party base model is not introduced by that pipeline and stays under R2.
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
  information prediction-time code will not. The boundary review records only the scope sentence;
  this characterisation of R1 to R4, P1 and P2 is this author's read, not reproducible from this
  repository, and no maintainer of that pack has confirmed it.

The review's reasoning is that contamination of a third-party pretrained model by a public
benchmark predates the project, involves no pipeline the project controls, and is outside that
standard's stated path. **That reasoning is an inference, and this standard depends on it only for
where it places requirements.** Whether MachineLearningStandards' evaluation standards reach a
hosted model the project did not train is recorded as unknown for item 17 and is the ground of open
question Q22, and this standard does not read it. Where both packs govern a concern, the more specialised
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

**A system MUST record, for each evaluation set it holds or a reported result uses, where it came
from, whether its content was public and from when, any earlier circulation of its items or answers
that the project knows of, and the model identifiers a result on it was computed for, with the base
model's identifier for a model fine-tuned from another. Where the
project wants R2's unavailability exception, it MUST also record that the items and answers were not
available by any route before each applicable training cutoff, and on what basis.**

The model identifier is the one [Standard 1](01-ai-system-manifest.md) R4 asks the manifest to
pin; without it a record of "published before the model's data was fixed" cannot be read, because
which model is not said. A set the project built from its own task and has never published has a
short record, and that is the point: the record is what lets a reader see that the set is not
public rather than assume it.

The record concerns exposure, not authorship. "Public from 2024-03" and "never published, held in a
private repository" are both complete answers; "unknown" is a third complete answer, for the date
and for earlier circulation alike, and is better than a guess. **A record that is absent is not a
record that the set is private.**

The manifest's `dataSources` entry of kind `evaluation-set` carries only `synthetic` and a free
`provenance` string, with no field for public exposure or its date. Nothing here asks an adopter to
write a field the schema rejects: the record is a document the project names.

### R2 — A result on a set a model may have seen says so

**Where an evaluated model, or the model it was fine-tuned from, was trained or tuned by a party
other than the project, and (1) the evaluation set could have been in that training or tuning data,
a result MUST be reported as a result on a possibly-exposed set; and where (2) the set's items or
answers, or material from which they can be derived, could have reached the model's context at
evaluation time by any route — retrieval, browsing, tools, or placed directly in a prompt, example
or message — other than the item presented to the model under evaluation, as the protocol requires,
to obtain its answer, for any model, including one the project trained, the same applies. Such a result MUST
NOT be reported as free of contamination because none was found, a provider's statement about its
training data MUST NOT be reported as established exposure status, and a public benchmark's result
MUST NOT be presented as capability on the project's own task.**

**The unavailability exception.** Condition (1) is not met for a set whose R1 record shows, with its
basis, that its items and answers were not available by any route before every training cutoff that
applies to the model the record names. A publication date alone is not that record; without it the
exposure is unknown and the result is qualified. The exception does not reach condition (2), and it
ends with the staleness events below.

For a model the project did not train, which is every hosted model, the project usually cannot see
the training data. A provider may state that it filtered named benchmarks, may publish a training
cutoff, or may say nothing. Each of those is a fact to record, and none establishes that a
particular set was not seen: a stated filter is the provider's claim about its own process and is
only as good as the match it used.

**Absence of evidence is reported as unknown.** "No overlap was detected" is a statement about a
check. "The result is uncontaminated" is a statement about the model, and nothing a repository
holds supports it for a model the project does not train.

A model the project trains entirely itself from data it holds is outside condition (1); what its
pipeline lets in is MachineLearningStandards' subject. A model the project fine-tunes is inside it
for what the base model saw: the project's pipeline did not introduce that exposure and cannot see
it. A public benchmark's score is reported as a score on a public benchmark, with its exposure as
R1 records it; this does not ask a project to stop using one.

### R3 — Project-held evaluation material stays out of reach of models it will evaluate

**A project MUST NOT place project-held material where a model it will evaluate may ingest it,
other than as the evaluation itself: presenting an item to the evaluated model to obtain its
answer, or presenting an item, its reference answer and any scoring rubric or scorer instruction to a judge or scorer to score that answer.
It MUST record the routes it relied on being closed — public repositories and mirrors; fine-tuning data; a prompt or few-shot example set, including a system prompt; and a store that a coding assistant or other tool indexes and may share — and, for each provider or judge that received an item or answer, the terms it
relied on.**

**Project-held material** is any evaluation material that is not public: a set built from the
project's own task, a privately held or licensed benchmark, and reference answers, splits or other
material the project added to a public benchmark. A public benchmark's own items and answers are not
project-held; their content is public by construction, nothing the project does places it there,
and such a set falls under R2.

This is the part of the concern a project controls. Project-held material committed to a
repository that is later made public, or indexed by a tool that shares it, or pasted into a prompt
as an example, is material an evaluated model may have seen the next time it is trained. What the
project can do is keep it out and record what it did.

**Which provider terms apply is the project's fact to record, not this standard's to assume.**
Whether a provider retains requests, whether it trains on them and under which plan are matters of
that provider's published terms and the project's agreement with it, and they change. The carve-out
for the evaluation call removes the prohibition for the act of evaluating, not the duty to record
what happens to the request afterwards, and the same holds for a judge or scorer call.

**R3 states what is placed where; it does not restate
[Standard 17](17-evaluation-plans-for-generative-systems.md) R4.** Selecting by score on the
held-out set is R4's subject and is an act of the project's; exposing the material to a model that is
later evaluated is this requirement's, and a project can breach either without the other.

### R4 — A contamination check states its method and what it cannot establish

**Where a project reports that a contamination check was run, it MUST record the method, the data it
was able to examine and the limits of what a negative result establishes, and MUST NOT describe a
negative result as showing the set was not in a model's training data unless the data examined is
shown to be the complete training data of a model the project trained from scratch and the method is capable of supporting the
conclusion, and then only for the form of overlap the method detects.**

Common methods are overlap between evaluation items and a corpus the project can see, planted
canary strings that a model is then asked to complete, comparing performance on items with their
paraphrases, and comparing performance before and after a set's publication date. The last three
examine something other than the model's training data, and every method can miss contamination
that has been paraphrased, translated or partially included.

**A check examines a proxy.** A check against a corpus the project holds says that corpus does not
contain the items. A canary string absent from completions says the model did not reproduce it.
Both are worth recording and neither is a finding about the model's training data, which for a
hosted model the project does not have. **An overlap check over the complete training corpus of a
model the project trained from scratch is the one case that is not a proxy for the corpus**: where
the project can show the corpus examined is the whole of what the model was trained on, a negative
result may be described as a finding about that model's training data for the form of overlap the
method detects. An exact-match or n-gram search of a complete corpus shows no verbatim or
near-verbatim presence; it does not exclude a paraphrase or a translation, and the description says
so. The corpus, its completeness, the method and the form of overlap checked are recorded.

The requirement does not ask a project to run a check. It asks that one that was run be described
by what it did.

### R5 — A benchmark that no longer serves is not kept as evidence

**A project MUST record, with its date, when it finds or observes that a benchmark it relies on has stopped
distinguishing the systems it compares, has been found to have a defect that undermines it, or no longer stands in for the
capability the project cares about, and MUST NOT continue to report it as evidence of the capability
it was adopted for without saying so.**

The ways a public benchmark stops measuring anything are ordinary: scores sit where candidates are
no longer distinguishable, a defect in the items or the reference answers is found, or the
capability it stood in for is no longer the one the project cares about. Wide circulation of its
items and answers is a further reason to doubt it, and that exposure is R2's; R5 records the
observation and any decision to stop relying on the set.

[Standard 17](17-evaluation-plans-for-generative-systems.md) assigns "whether a public benchmark
still measures anything" to this item, and this is the requirement that carries it. What this
requirement asks is a record and a qualification, not a threshold: it names no score above which a
benchmark is saturated, because that figure would be this repository's invention.

### R6 — This framework MUST NOT report an evaluation set uncontaminated or a benchmark valid from a repository

**A detector, rule, audit finding or generated report in this framework MUST NOT state that an
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
| Exposure unrecorded | A held or used set with no record of origin, public status and date, or of known earlier circulation, so a reader assumes it is private | R1 |
| Absence read as privacy | A set with no exposure record treated as one that was never published | R1 |
| Model not named | Where a result has been computed or reported, a record of when a set was published with no model identifier, so it cannot be read against a training cutoff | R1 |
| Unavailability without basis | A claim that a set was unavailable before the cutoff with no basis recorded | R1 |
| Exposure unqualified | A result on a set that could have been in third-party training or tuning data (a public benchmark not shown by an R1 record to be unavailable before every applicable cutoff, or any set with no unavailability record), from a model another party trained or tuned, reported with no possibly-exposed qualification | R2 |
| Clean by search | A score reported as uncontaminated because a search of a corpus the project holds found no overlap | R2 |
| Provider claim as fact | A provider's statement that benchmarks were filtered reported as the set not being seen | R2 |
| Public score as task capability | A public benchmark number reported as the system's capability on the project's own task | R2 |
| Context-time exposure unqualified | Items or answers placed in a prompt, retrieved or browsed, and the result reported with no qualification | R2 |
| Project-held material published | Own-task sets, a licensed benchmark or answers the project wrote in a public repository or mirror, or in a store a tool indexes and may share | R3 |
| Answers in the prompt | Project-held items or answers placed in a prompt or few-shot example set, including a system prompt, or in fine-tuning data | R3 |
| Routes or terms not recorded | The routes relied on being closed, or a provider's or judge's terms, assumed and not written down | R3 |
| Proxy as proof | A canary string not reproduced, or zero n-gram overlap, reported as the set not being in the training data | R4 |
| Complete corpus overclaimed | A complete-corpus search described as excluding paraphrase, translation or partial inclusion, a method that cannot support the conclusion, or a fine-tuning corpus described as the whole training data | R4 |
| Method not stated | "Checked for contamination" with no method, corpus or limit | R4 |
| Retirement unrecorded | A benchmark's loss of discrimination, a defect or loss of standing that is not recorded anywhere, or no date | R5 |
| No longer distinguishing | A benchmark on which candidates are no longer distinguishable still reported as a differentiator | R5 |
| Known-defective item set | A benchmark found to have wrong reference answers still cited with no qualification | R5 |
| No longer stands in | A benchmark kept as evidence of a capability the project no longer cares about | R5 |
| Presence read as clean | A detector, rule, audit finding or report that states a set uncontaminated, a model not to have seen it, or a benchmark valid because a document, configuration, file path, check output or absence of overlap is present | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | For each evaluation set held or used: origin, public status with a date or "not published", any known earlier circulation (or "unknown"), the model identifiers a result is for with the base model of a fine-tune, and where the exception is wanted the unavailability record with its basis | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | The reported result with its qualification; the provider statements, cutoff and unavailability record relied on, each marked as the provider's claim or the project's; the routes by which items or answers could reach the model's context | The evaluation report and the project's notes on the provider | Human review |
| R2 (exposure) | None obtainable from a repository | — | **Not-evaluable** |
| R3 | The project-held material and where it lives; the routes relied on being closed; each provider's or judge's terms relied on | A project document the project names, the repository and its hosting settings | Human review |
| R4 | The check's method, the data examined, its limits and, where a training-data claim is made, the corpus, its completeness and the form of overlap | The report of the check | Human review |
| R5 | The observation that led to a benchmark's retirement or qualification (stopped distinguishing, defect, no longer stands in), with its date | The evaluation report or a decision record | Human review |
| R6 | The absence of any detector that reports contamination or benchmark validity from presence | This repository's own detectors and tests | Code review; see Implementation |

A document that records an evaluation set's exposure establishes that the project wrote it down. It
does not establish that the record is true or that the model did not see the set. A reviewer reads
the record against the set's actual publication history and the repository's visibility.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 acceptance criteria (plan 02 section 6) require every standard to cite at least one rule
or to record in its Validation section why it ships with none; this is that record.
[Standard 6](06-standard-structure-and-rule-identity.md) R3 separately requires each requirement to be
falsifiable or declared not-evaluable, which the Tests and falsifiers section answers.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 would look for an exposure record, and
   neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place
   for one: the `dataSources[]` entry of kind `evaluation-set` carries only `synthetic` and a free
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
prohibition would be self-defeating. R2 is likewise not exemptible in whole: the clean-result prohibition and the public-score
prohibition would each, if excepted, record a project as knowingly reporting an unsupported claim
about a model. R1 and R3 to R5 reach a system as Scope says, and
there is no policy declaration for a system without their subject:
[Standard 2](02-ai-risk-tiering-and-applicability.md) R4's not-applicable disposition applies to a
catalog rule id, and this standard has none. No level here is lowered by a risk tier (Standard 2
R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | For one held or used evaluation set: origin, public status with a date or "not published", and known earlier circulation are recoverable from the record, and, where a result has been computed or reported on it, the model identifiers (with a fine-tune's base model); where the exception is wanted, the unavailability record carries its basis | A held or used set with no exposure record; a record missing the origin, the public date or the earlier circulation; a set with a computed or reported result and no model identifier; an unavailability claim with no basis | A set recorded as "not published" with a stated reason, or with "unknown" for its date or for earlier circulation, must **not** be failed; a held set with no result yet must **not** be failed for lacking a model identifier |
| R2 | (a) For a model or base model trained or tuned by another party: a result on a set that could have been in third-party training or tuning data (a public benchmark not shown by an R1 record to be unavailable before every applicable cutoff, or any set with no unavailability record) carries the possibly-exposed qualification; (b) for any model, including one the project trained: a result whose items or answers could reach the context by any route other than the item presented for the evaluation itself carries it; a provider's statement about its training data is not reported as established exposure status; a public score is not presented as capability on the project's own task | A result described as uncontaminated because a search found no overlap; a result in (a) or (b) reported with no qualification; a provider's filter statement reported as established status; a public score reported as capability on the project's own task | A project that reports "exposure unknown" must **not** be failed for not having excluded contamination; a result on a set whose R1 record shows, with its basis, unavailability before every applicable cutoff for the model the record names, with no context-time exposure and no staleness event since, must **not** be failed under (a); a model the project trained from scratch on data it holds must **not** be failed under (a); the item presented to the model under evaluation, as the protocol requires, must **not** be flagged under (b) |
| R3 | No project-held material is in public repositories and mirrors; fine-tuning data; a prompt or few-shot example set, including a system prompt; and a store that a coding assistant or other tool indexes and may share, other than the item presented to the evaluated model, and the item, reference answer and any rubric or scorer instruction presented to a judge, for the evaluation itself; the routes relied on and each provider's or judge's terms are recorded | Project-held material in any of those routes; no record of the routes relied on or of a provider's or judge's terms | A set held privately with no model-facing use must **not** be flagged for existing; the item presented to the model under evaluation, and the item with its answer and rubric presented to a judge, must **not** be flagged; few-shot exemplars drawn from a separate development split that is not held out are not project-held evaluation material and must **not** be flagged; a public benchmark's own items in a public repository must **not** be flagged |
| R4 | A reported check names its method, what it examined and what a negative result does not show; a training-data claim names the corpus shown to be complete, a method capable of the conclusion and the form of overlap | "Checked, no contamination" with no method; a complete-corpus negative from a method that cannot support the conclusion, or described for a form of overlap the method does not detect (including paraphrase, translation or partial inclusion); a fine-tuning corpus described as the whole training data; a canary or paraphrase check described as showing absence | A project that ran no check and says so must **not** be failed for not running one; a negative result over a corpus shown to be the complete training corpus of a model the project trained from scratch, by a method capable of the conclusion and described only for the form of overlap it detects, must **not** be failed |
| R5 | A benchmark that stopped distinguishing, was found to have a defect that undermines it or no longer stands in for the capability is recorded as such, with its date, and reported with that qualification | A benchmark on which candidates are no longer distinguishable, that has a known defect that undermines it or that no longer stands in for the capability, reported as evidence with no note; a loss the project has observed and not recorded | A benchmark still discriminating between candidates must **not** be flagged for being old or public |
| R6 | No detector, rule, audit finding or generated report in this repository states a contamination or benchmark-validity verdict from presence | Any detector, rule, audit finding or report that states a set uncontaminated, a model not to have seen it, or a benchmark valid because a document, configuration, file path, check output or absence of overlap is present | Reporting that an exposure record was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads an exposure record and no fixture
carries one, so R1 to R5 are enforced by review or not at all, and R6 holds at this commit by
inspection only. The negative controls state what review must not do to a project that has the right
subject and does the right thing. **A falsifier no tool applies is applied by review or not at
all**, and that is the honest state of this standard.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to
except. A project that knowingly does not meet R1, R3, R4 or R5 records that in its own documents;
R2 and R6 are not exemptible, and for R2 the remedies are to qualify the result, to meet the unavailability exception for
condition (1) through R1's record, to close the context-time route so condition (2) is not met, or to
stop presenting a public score as task capability; a record of non-conformance is not an exception; Standard 2's dispositions apply to the application of a
rule, and this standard has none.

**What invalidates a recorded exposure statement, unavailability record or contamination check.**
Each of these changes what the record means, and a record made before the change describes the
earlier situation:

- a change of model identifier, provider or model version, or an alias updated after the cutoff,
  since a set that was after one model's cutoff may be before the next's;
- the evaluation set being published, mirrored, quoted or committed to a repository that is or
  becomes public, or reaching a provider on terms that permit retention;
- a change in a provider's published terms, which R3's recorded route depends on;
- a change to prompts, few-shot examples, retrieval sources or tools that changes whether the set's
  items or answers can reach the model's context;
- a change to the corpus examined or to the method of a recorded contamination check, including a
  corpus that was complete ceasing to be;
- a new tool or store that indexes the repository, or a change to which route the project relied on
  being closed;
- a change in the benchmark itself: items added or removed, reference answers corrected;
- the project beginning to train or fine-tune a model of its own, which brings what its training
  pipeline introduces into MachineLearningStandards' ground; exposure inherited from a third-party
  base model stays under R2;
- for R5, a new candidate set that changes whether the benchmark discriminates, a correction of its
  items or answers, or a re-baselining of the scores it was judged on, each of which makes a recorded
  saturation or defect observation describe an earlier benchmark.

R6 has no staleness event of its own: it constrains this framework and changes only when a detector
is added.

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
  time and not only through training data, and of project-held material.
- **R1's record**, the unavailability record with its basis, and the ruling that an absent record is
  not a record of privacy.
- **R2 in full**: the qualification of a result on a set a model may have seen, both conditions, the
  unavailability exception, the ruling that "no overlap found" is a statement about a check and not
  about a model, and the ban on presenting a public score as task capability, including its
  non-exemptibility.
- **R3's requirement** that a project keep project-held material out of reach of models it will
  evaluate, the carve-out for the evaluation and judge calls (item, reference answer and rubric), the single route list and the record
  of provider and judge terms. The brief names no placement.
- **R4's limits** on what a contamination check may claim, including the complete-corpus case; the
  list of methods is illustrative and not a required set.
- **R5's** requirement that a benchmark that no longer serves be recorded, with its three
  conditions, and the refusal to set a saturation threshold. The assignment of "whether a public
  benchmark still measures anything" to this item is
  [Standard 17](17-evaluation-plans-for-generative-systems.md)'s statement of the boundary, not the
  brief's.
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
[Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests and
falsifiers section answers, and the Validation section records why no rule is shipped, as plan 02
section 6 asks.

Items 12, 19, 20 and 50 are unwritten in this release; the lines drawn above are provisional until
they are, and the later standards may legitimately move them. Open questions Q19 (whether the two
forbidden evaluation rules are item 50's prohibitions) and Q22 (whether this pack should state an evaluation baseline where MachineLearningStandards does not
reach a system) are recorded open and not answered here.

**Outside this pack.** MachineLearningStandards' Standard 8 (Leakage) is named in Scope with what the
boundary review recorded and what was read. It is not a crosswalk, nothing in it is restated, and no
maintainer of that pack has confirmed this reading. No ADR covers this standard —
`artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds at this commit by inspection only, and no test guards it.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away
as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds at this commit, by inspection only.** No detector, rule or report in `scripts/`, `rules/`, `schemas/`, `templates/` or `ai-policy.yml` has a concept of contamination or benchmark integrity; a case-insensitive search of those paths for `contamin` and `benchmark` found no use of either as a subject; reports are written by `scripts/`, and no other path generates one. No test asserts the absence, so a future detector could break R6 without failing one |
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
