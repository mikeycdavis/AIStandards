# Standard 19 — Robustness Evaluation

A system that handles every input in its evaluation set can still fail the first user who types
with a typo, pastes a table, writes in a second language, or asks the same question in a longer
way. The evaluation set was written by people who knew what the system was for, in the form they
expected it to be asked, and a system fitted to that form scores well on it. What the score does
not say is how far from that form the system continues to work.

Robustness evaluation is the practice of moving away from the expected form on purpose and
measuring what changes. It goes wrong in ordinary ways. The variations tried are the ones the
system already handles. The result is one average over all of them, in which the class that breaks
is diluted by the classes that do not. Variants of a held-out item are generated and then used to
tune the prompt. And "robust" is written in the report beside a list of what was tried, as though
the list were the world.

The failure this standard is written against is not a fragile system. It is a claim of robustness
whose coverage nobody stated, measured against a bar nobody fixed, on variations nobody could
reproduce.

Source: item 19 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "robustness" token of the "Model evaluation, benchmark integrity, robustness, and
regression testing" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 19 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, this
> pack's own: [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) carries no
> non-`O` posture entry for item 19 and lists it under `notGovernedElsewhere`, the items recorded
> posture `O` "after searching the nine packs for an owner and finding none", and the review
> carries `humanSignOff: null`.
>
> **The brief supplies one word and this standard supplies the rest.** The brief's bullet names
> "robustness" and states no requirement for it. The item is class `D` because its token is the
> brief's own; the requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it — a repository that invokes a model, retrieves context for one, or acts on a model's output —
that makes a robustness claim, or that reports a result computed on perturbed input.

Covers: how the variations a system must withstand are chosen and recorded; what a robustness
result is measured against; how variations are specified and kept apart from the sets a system is
tuned on; how results are reported; how far a claim of robustness may reach; and the limit of what
this framework can say about any of it.

Three terms, each defined here rather than by the brief:

- A **perturbation class** is a named kind of change to an input that is meant to leave the correct
  output unchanged or changed in a stated way: typographical error, paraphrase, change of
  language, length, formatting or encoding, reordering of options or retrieved passages, and
  similar. A class is identified by what it does, not by the tool that generates it.
- A **paired baseline** is the system's result on the unperturbed items from which a class's
  variants were made, measured with the same scorer and subject
  ([Standard 17](17-evaluation-plans-for-generative-systems.md) R6 and R7).
- A **robustness claim** is any statement that a system is robust, resilient or stable, or that
  its performance holds, under some variation of input.

**Where each requirement reaches.** R1 to R5 reach every system that makes a robustness claim or
reports a result computed on perturbed input. R6 constrains this framework and reaches no consuming project. A
system with none of a requirement's subject has nothing to meet: this standard defines no catalog
rule, so there is no rule id under which [Standard 2](02-ai-risk-tiering-and-applicability.md) R4's
not-applicable declaration could be made, and none is asked for. The project says in its own
evaluation record that the subject does not exist, with the reason.

It does **not** cover, and claims none of the ground of, the following:

- **Adversarial attack and misuse** — an input crafted by someone trying to make the system do what
  it should not. Prompt injection is [Standard 21](21-prompt-and-instruction-security.md)'s and
  [Standard 51](51-agent-and-tool-execution-prohibitions.md)'s subject, misuse is
  [Standard 9](09-misuse-and-abuse-prevention.md)'s, and the conduct of adversarial exercises is
  item 35's (Red Teaming, unwritten). A perturbation class here is a variation a legitimate user
  or an upstream system can produce without intent.
- **The plan, the suite, the baseline and the held-out set as such**
  ([Standard 17](17-evaluation-plans-for-generative-systems.md) R1 to R9). Nothing below relaxes
  them; this standard says what a plan must cover where robustness is claimed, which Standard 17
  leaves to this item.
- **When regressions are tested and what difference fails a change** (item 20, unwritten), and
  **contamination** (item 18, Benchmark Integrity and Contamination).
- **Reproducibility under nondeterminism** (item 31, unwritten). R3 asks that a perturbation be
  reproducible; whether a hosted model's answers repeat is item 31's subject.
- **Prohibitions on tampering with or fabricating evaluation results** (item 50, Evaluation
  Integrity Prohibitions, class `A`, unwritten). Nothing here is one of its prohibitions, and R3's
  ban on choosing variants by failure is a requirement of this standard, not a statement of what
  item 50 will prohibit; Q19 is open and not answered here.
- **Operational resilience** — latency, failover, outage behaviour. A system's tolerance of a
  provider being down is not a property of its input handling.

**Boundary posture O.** The boundary review records item 19 as one of the items posture `O` after
a search of the nine packs for an owner that found none, which its comment calls "the negative
control of the boundary review". This standard relies on that recorded search and repeats none of
it, so it names no adjacent pack as governing or not governing perturbation testing. The search carries no human
sign-off, so the posture is a recorded finding and not a confirmed one. Where a project is also
governed by a pack that does cover it, Standard 7 R5 orders the two and a boundary defect is for the
maintainers to fix.

## Requirements

### R1 — Name the perturbation classes the system must withstand, and why

**A system that makes a robustness claim, or reports a result computed on perturbed input, MUST
record the perturbation classes the claim or the result concerns (its claimed classes), MUST give
for each the reason it is expected in operation, MUST record the classes it considered and set
aside, with the reason, and MUST move a claimed class on which no perturbed result was computed or reported to the
set-aside list.**

A list of classes taken from a library's menu is a list of what the library does. The classes that
matter are the ones the system's users and upstream producers actually generate: the input channel
(voice transcripts, OCR, pasted tables), the languages and registers of its users, the documents
retrieval can return, the ordering of options a caller supplies. The reason is the project's, and a
short one is enough: "users paste from spreadsheets" is a reason; "standard practice" is not.

**A class with no stated reason is a class nobody decided to care about.** It does not meet R1,
and a claim may not rely on it.

Three terms are used from here on. A **claimed class** is one named under R1 as concerned by the
claim or result. A **tested class** is a claimed class on which a perturbed result was computed or reported,
whether or not R2 was then met; R2 and R4 bind it from that point. A **set-aside class** is one the
project considered and listed as not tested. A claimed class on which no perturbed result was
computed or reported is a set-aside class and is listed as one; a claim reaches only tested classes
(R5).

**The set-aside list is what makes "not tested" finite.** The project cannot enumerate every
variation there is, and this standard does not ask it to. It asks for the classes the project
actually thought of and set aside — a language it does not yet serve, a length it does not yet
handle — each with a reason. A class on neither list was not considered, and the claim says its
lists are not exhaustive (R5).

### R2 — Measure each class against a paired baseline and a stated bar

**For each tested class the project MUST state before the run its bar — a floor on the result, a
permitted drop in absolute scorer units, or both, in which case the class meets its bar only when
both hold — and the range of the scorer, or record that the scorer is unbounded and no range is stated;
MUST measure the unperturbed items from which its variants
were made with the same subject and scorer; MUST report the result as a difference from that
baseline; and MUST record the class's bar status, its loss where defined and its headroom, and its margin where
the class meets its bar.**

A robustness figure alone says only how well the system did on awkward input; it does not say
whether awkward input made it worse. A set of misspelled questions answered at 78 percent is a
good result for a system that scores 80 on the clean forms and a bad one for a system that scores
97. The paired baseline is what makes the figure a statement about the perturbation.

**Quantities, defined once so that every class is ordered the same way.** Metrics are oriented so
that higher is better: a lower-is-better metric is mapped by x' = a·x + b with a < 0 (negation is
a = −1, b = 0), and a higher-is-better metric is left as it is or mapped with a > 0. The map is
applied to the result, the baseline and any floor; a permitted drop and the range are scaled by |a|
only, since an offset does not change a difference. Then, for each tested class:

- the **drop** is the baseline less the result, and zero where the result is not lower;
- the **range** is |a| × (the maximum less the minimum the scorer can return), taken in the oriented
  units; a scorer with no natural bound has a range the project states before the run, and a stated
  range of zero or below is not a range;
- the **loss** is the drop divided by the range, a unitless figure comparable across scorers and in
  [0, 1] for a bounded scorer; it is **undefined** where no range was stated before the run or the
  stated range is zero or below, and the class is then reported by its drop in oriented scorer
  units, a drop beyond a stated range of an unbounded scorer is reported as it is and not
  clamped;
- the class **meets its bar** when the result is at or above any floor and the drop is at or below
  any permitted drop, and is otherwise **breached**; a class whose baseline is already below its
  floor is reported as **failing on the clean items** and is breached;
- the **headroom** is the baseline less the floor for a floor bar and the permitted drop for a drop
  bar, the smaller of the two where both are stated, and is reported beside the result;
- the **margin**, for a class that meets its bar, is 1 − (drop ÷ headroom), a figure in [0, 1]; where
  the headroom is zero the class meets its bar only with zero drop and its margin is 1.

A zero permitted drop ("no degradation") is a drop bar with zero headroom: met with no drop, and
breached, with its loss recorded, by any drop. A met zero bar is not a breach. A class with very
little headroom swings widely in margin; the report gives the headroom for that reason.

This standard fixes no number for any bar, because that number would be this repository's invention.
It requires only that the bar exist before the result does
([Standard 17](17-evaluation-plans-for-generative-systems.md) R1), and that the baseline be the same
items, not a different clean sample.

### R3 — Specify each perturbation so it can be regenerated, and keep variants in their split

**A perturbation MUST be specified well enough to regenerate the same variants; the draw of the
variants behind a reported or held-out result MUST be fixed before the run and recorded with the
number generated and the number kept with the reason for each variant not kept, and MUST NOT be
chosen or adjusted by looking at which
variants the system fails; and a variant of an item MUST stay in the split its source item belongs to.**

A class specified as "some typos added" cannot be rerun, and its next run measures a different set.
Recording the generator, its parameters and any seed, or committing the variants, and the selection
record described above, is the minimum.
Where a variant was produced by a model, the model identifier is recorded
([Standard 17](17-evaluation-plans-for-generative-systems.md) R6).

**Choosing variants by failure is selection against the evaluation.** If the variants kept are the
ones that broke the system, the figure is a count of known failures and the bar was set by them.
Where finding such failures is the aim, that is an exercise to be recorded as one, not a measurement
reported as a rate. Adjusting a generator against the development split while building it is
development and is outside the clause; the clause concerns the variants whose result is reported or
held out.

**A variant of a held-out item is held-out.** A paraphrase of an item that sits in the held-out set,
used to tune a prompt, is the item itself under another surface form. This is
[Standard 17](17-evaluation-plans-for-generative-systems.md) R4 applied to derived items, and it
is stated here because robustness work is where derived items are made in quantity.

### R4 — Report per class, and name the worst

**A robustness result MUST be reported for each tested class separately, MUST name the worst class
of each group under the order below and every class tied for it, MUST name every class that failed on the clean
items or whose loss is undefined, MUST state the number of variants behind each class's result, and
MUST NOT be presented only as one aggregate over classes.**

**The order, which is total up to ties.** Breached classes come before classes that meet their bar.
Breached classes are ordered in two groups that are not comparable with each other, because a loss
on a stated range and a drop in raw scorer units share no scale: classes with a defined loss, where
the larger loss is worse, and classes with an undefined loss, where the larger drop in oriented
scorer units is worse. Among classes that meet their bar, the smaller margin is worse. Equal values
are tied. The report names the worst class of each breached group that is non-empty, and every class
tied for it; where there are no breached classes it names the worst class that meets its bar. This
is an ordering of the report, not a claim that a margin and a loss are on one scale: a breach is
always worse than a met bar.

An average over fifteen classes in which fourteen are untouched and one collapses reports a system
that has a small problem. The class that collapses is the one a user in that class meets, and for
that user the system is not robust. The aggregate may be given beside the per-class results; it may
not replace them.

The number of variants behind each class's result is stated for every class, not only small ones,
because whether a count is small enough to be noise is the reader's judgment to make and the reader
cannot make it without the number. This standard does not set a minimum count.

### R5 — A claim of robustness reaches only what was tested

**A statement of robustness MUST be bounded to the tested classes, MUST name the set-aside classes,
MUST say that its lists of classes are not exhaustive, MUST name the subject it was measured on, and
MUST NOT be worded as general.**

"Robust to the perturbations in the table, at the stated bars" is a claim. "Robust" is not. A
system that was tested for typos and passed has been shown tolerant of typos; the claim does not
extend to a different language, a longer document or a reordered option list because those were not
looked at, and a reader of the unqualified word will assume they were.

The subject is the one of [Standard 17](17-evaluation-plans-for-generative-systems.md) R6. A change
of model identifier or prompt revision makes a robustness result a result about a different system,
and it ages with the change (see Exceptions and staleness).

### R6 — This framework MUST NOT report a system robust from the presence of anything

**A detector, rule, audit finding or generated report in this framework MUST NOT state that a
system is robust, or that its robustness was evaluated, because a perturbation test, a fixture, a
generator library, a plan section or a robustness document is present in the repository.**

A repository can show that a file of perturbed inputs exists, that a library for generating them is
imported, or that a plan names classes. It cannot show that the variants were run against the
current subject, that the baseline was paired, that the bar preceded the result, or that the classes
reflect real input. Reporting a pass from any of those would turn the presence of a test into a
verdict about a system's behaviour.

Whether a system is robust is a property of a running system on input that has not yet been
seen. It is **not-evaluable** from a repository.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Menu coverage | Perturbations taken from a generator library's defaults, with no account of what input the system meets | R1 |
| Unreasoned classes | Classes listed with no reason they are expected, so nobody can tell which matter | R1 |
| Figure without baseline | "78 percent on perturbed input" with no measurement of the same items clean | R2 |
| Moving bar | A permitted degradation chosen after the result, at the value the system reached | R2 |
| Different clean sample | A baseline measured on other items than the ones perturbed | R2 |
| Unrepeatable variants | "Typos were added" with no generator, seed or committed set | R3 |
| Failure-selected variants | Only the variants that broke the system kept and counted as a rate | R3 |
| Derived items tuned on | Paraphrases of held-out items used to adjust a prompt | R3 |
| Diluted worst class | One aggregate across classes hides the class that collapses | R4 |
| Unreported reason for a dropped variant | Variants generated and not scored with no reason recorded | R3 |
| Range not stated | A loss computed for an unbounded scorer with no range fixed before the run | R2 |
| Unnamed subject or set-aside classes | A claim that does not name the subject it was measured on, or the set-aside classes, or omits that its lists are not exhaustive | R5 |
| Unstated sample size | A class result from a handful of variants reported without the count | R4 |
| Set-aside classes unlisted | Classes the project set aside, or claimed and did not test, not recorded, so "not tested" has no edge | R1 |
| Worst class or undefined loss hidden | The worst class, a tie for it, or a class failing on the clean items left out of the report | R4 |
| General claim from narrow test | "Robust" written beside a list of three tested classes | R5 |
| Stale subject | A robustness result carried across a model or prompt change | R5 |
| Presence read as robustness | A framework report of "robustness evaluated" because a fixture or generator is in the repository | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The claimed classes each with the reason it is expected in operation, and the set-aside classes each with a reason; no claimed class is untested and unlisted | The evaluation plan, or a document it names | Human review |
| R2 | For each tested class: the bar and the scorer range (or the record that the scorer is unbounded and no range is stated), dated before the run; baseline and perturbed results over the same items with the same subject and scorer; the difference; bar status, loss (or its being undefined), headroom and margin where it meets its bar | The evaluation plan and the run's record | Human review |
| R3 | The generator, parameters and seed, or the committed variants; the split each variant is in; and the selection record: how the variants were drawn, fixed before the run, the number generated and kept, and the reason for each variant not kept | The suite, its data and the plan | Human review; split membership is checkable by reading |
| R4 | Per-class results with bar status, loss (or its being undefined), headroom and margin where the bar is met, the worst class of each non-empty breached group (or of the met classes) and every class tied for it named, each class failing on the clean items or with undefined loss named, and the count of variants per class | The evaluation report | Human review |
| R5 (wording) | The claim as worded, read for whether it names the tested classes, the set-aside classes, the non-exhaustiveness statement and the subject measured | The report, manifest or documentation that states it | Human review |
| R5 (robustness beyond the tested inputs) | None obtainable from a repository | — | **Not-evaluable** |
| R6 | The absence of any detector that reports robustness from presence | This repository's own detectors and tests | Code review; see Implementation |

A document that lists classes establishes that the project wrote it. It does not establish that
the classes reflect the input the system meets, or that the run happened. The reviewer reads the
plan against the run's own record.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 acceptance criteria (plan 02 section 6) require every standard to cite at least one rule
or to record in its Validation section why it ships with none; this is that record.
[Standard 6](06-standard-structure-and-rule-identity.md) R3 separately requires each requirement to be
falsifiable or declared not-evaluable, which the Tests and falsifiers section answers.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 would look for a list of classes with
   reasons, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json`
   has a place for one: `evaluation` carries `planPath`, `suiteCommand` and `baselinePath`, and both
   schemas are closed. A rule failing every project for omitting what no schema accepts would
   measure this framework's own incompleteness and blame the project for it. Adding a schema field
   is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **The requirements concern the content and order of evidence, which source text does not show.**
   Whether a bar preceded a result, whether a baseline used the same items, and whether variants
   were chosen by failure are properties of a run and its history. A detector reading source would
   test for the presence of a fixture or a library, which R6 forbids this framework from reporting
   as a result.
3. **The namespace is shared with a question that is open.** `eval.` is minted for
   [Standard 17](17-evaluation-plans-for-generative-systems.md), and whether its two `forbidden`
   rules are item 50's prohibitions is open question Q19. A rule here would add to a namespace whose
   ownership is unsettled; choosing a name is a decision this standard does not make, and it does
   not answer Q19.

**Severity.** R1 to R5 are `manual-review` obligations in this release, including the check that
R5's claim is worded as bounded, which a reviewer can make and can fail. What is
**not-evaluable** is whether the system is robust beyond the tested inputs, and that is not
reported as reviewed. R6 constrains this framework and has no
validation type, because the thing it prohibits is a behaviour of the tool.

**Exemptibility.** R6 is not exemptible: no project circumstance makes it reasonable for a scan to
report a system robust from a presence, and a mechanism for excepting the prohibition would be
self-defeating. R5's ban on an unbounded claim is likewise not exemptible, because an exception
would record a project as knowingly publishing a claim its test does not support. R1 to R4 reach a
system only where it makes a robustness claim or evaluates under perturbation, and a system without
that subject records the absence and its reason in its own evaluation record. There is no policy
declaration for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4's not-applicable
disposition applies to a catalog rule id, and this standard has none. No detector in this release
would contradict a false record. No level here is lowered by a risk
tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each claimed class carries a reason tied to operation, each set-aside class a reason, and no claimed class is untested and unlisted | A class list with no reasons, or reasons that name only a library; no set-aside list; a claimed class that was never tested and is not listed as set aside | A short, specific reason must **not** be failed for brevity |
| R2 | Each tested class has a bar and a scorer range dated before the run (or the record that the scorer is unbounded and no range is stated), a baseline over the same items with the same subject and scorer, the result reported as a difference, and bar status, headroom and, where the range is stated, loss; a margin where the class meets its bar | A perturbed figure with no baseline, a baseline on other items or another scorer, a result not given as a difference, no bar status or headroom, a loss claimed with no range fixed before the run, a margin given for a breached class, or a bar written after the result | A project whose bar is "no degradation" must **not** be failed for having no numeric tolerance, a met zero bar must **not** be called a breach, an unbounded scorer with no stated range must **not** be failed for lacking a loss when it says so, and a breached class must **not** be failed for lacking a margin |
| R3 | The variants can be regenerated or are committed; every variant is in the split of its source item; the selection record shows the draw fixed before the run, the generated and kept counts and a reason for each variant not kept | "Typos added" with no generator; a variant of a held-out item in the development split, or of a development item in the held-out set; a generated pool of which only the variants the system failed were kept, with no record of the draw or of why others were dropped | A class made of variants all in the same split as their sources must **not** be flagged; adjusting a generator on the development split while building it must **not** be flagged |
| R4 | Results per tested class with bar status, headroom, loss where defined and margin where the bar is met; the worst class of each non-empty breached group (or, with no breach, of the met classes) and every class tied for it named; classes failing on the clean items or with undefined loss named; counts given | One aggregate only; a tie for worst reported as one class; a class failing on the clean items or with undefined loss left out; a class result with no variant count or no headroom | An aggregate reported beside the per-class results must **not** be flagged |
| R5 | The claim is bounded to the tested classes, names the set-aside classes and the subject, and says its lists are not exhaustive | An unqualified "robust"; a claim that omits the non-exhaustiveness statement, the subject or the set-aside classes; a claim that reaches a class on which no perturbed result was computed | A narrow, bounded claim that says its lists are not exhaustive must **not** be failed for being narrow |
| R6 | No detector or report in this repository outputs a robustness verdict from presence | A detector that reported robustness evaluated because a fixture directory existed | Reporting that a perturbation fixture was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads a plan's class list and no fixture
carries one, so R1 to R5 are enforced by review or not at all, and R6 holds today because no detector has this subject, and no test guards it. The
negative controls state what review must not do to a project that has the right subject and does
the right thing. **A requirement with no falsifier is a requirement nobody can be shown to have
broken**, and that is the honest state of this standard.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to
except. A project that knowingly does not meet R1 to R4 records that in its own documents; for R5
the only remedy is to remove or bound the claim, because R5 is not exemptible; Standard 2's
dispositions apply to the application of a rule, and this standard has none.

**What invalidates a recorded robustness result.** Each of these changes what the result describes:

- a change of model identifier, provider, model version or prompt revision;
- a change to the system's pre- or post-processing — input normalisation, chunking, retrieval,
  output parsing — because those are what many perturbations act on;
- a change in the input the system receives: a new channel, a new language, a new document source,
  which makes R1's classes incomplete at once;
- a change to the scorer or the bar;
- a change to the generator, its parameters or its seed.

**Staleness is asymmetric here.** The list of classes becomes false when a new input channel is
added, and a new channel is exactly what nobody tests, because it is not in the list. Nothing in
this release detects the transition; the events above are a note to a future reader.

**Contradicted by operation.** A production failure on input of a kind the project claimed to
withstand contradicts the result for that class and invalidates it until re-examined. What follows
operationally is item 34's subject (AI Incident Response, unwritten in this release).

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one word, "robustness", inside a bullet of four subjects.
It states no requirement, level or evidence for any of them. The item is class `D` because its
subject token is derived from the brief; the requirements are not derived. Specifically authored
here, none of it owner-approved:

- **The definition of a perturbation class and a robustness claim**, and the exclusion of
  adversarial input from the term. The brief does not say what robustness is robustness to.
- **R1's** requirement that classes be recorded with a reason tied to operation, the set-aside list
  that makes "not tested" finite, and the terms claimed, tested and set-aside class, including the
  rule that a claimed class with no perturbed result moves to the set-aside list.
- **R2's** paired baseline and its rule that the bar precede the result, the refusal to fix a
  tolerance, and every defined quantity: orientation by an affine map, drop, range, loss, bar status,
  headroom and margin, with their edge cases (zero permitted drop, baseline below floor, zero
  headroom, unbounded scorer).
- **R3's** reproducibility requirement, the selection record (draw fixed before the run, generated
  and kept counts, reason for each variant not kept), the ban on choosing variants by failure, and
  the ruling that a variant of a held-out item is held-out and a development item's variant is not.
- **R4's** per-class reporting, the total order (breached before met; loss for breached, margin for
  met; ties all named), the naming of classes failing on the clean items or with undefined loss, and
  the variant count for every class.
- **R5's** bounding of the claim to tested classes, the naming of set-aside classes and the
  subject, the non-exhaustiveness statement, and its non-exemptibility.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in
  [Standard 8](08-ai-safety-requirements-and-safety-cases.md),
  [Standard 17](17-evaluation-plans-for-generative-systems.md),
  [Standard 25](25-grounding-and-hallucination-control.md) and
  [Standard 33](33-ai-observability.md).
- **The exclusions in Scope** as division lines, including the line between robustness to ordinary
  variation and adversarial input, and items 20, 31 and 35. Where each begins is unconfirmed by
  anyone.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the
  decision to mint no id in the `eval.` namespace and to take no position on Q19.

Not authored here, and recorded so the reader does not credit this standard with it: the posture
`O` and the numbering are the specification's.

## Relationship to other standards and ADRs

[Standard 17](17-evaluation-plans-for-generative-systems.md) assigns "what an evaluation must
cover" to this item. R1 to R5 are that coverage for the case where robustness is claimed, and they
sit inside Standard 17's plan (R1), subject (R6), scorer (R7) and held-out set (R4) requirements,
restating none. Item 18 (Benchmark Integrity and Contamination) governs exposure of an
evaluation set to a model; R3 here governs variants a project derives. [Standard 21](21-prompt-and-instruction-security.md),
[Standard 51](51-agent-and-tool-execution-prohibitions.md) and
[Standard 9](09-misuse-and-abuse-prevention.md) own the adversarial ground this standard excludes.

[Standard 7](07-boundary-with-adjacent-standards.md) R5 orders a conflict between packs.
[Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and
non-lowering language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is
the requirement the Tests and falsifiers section answers, and the Validation section records why no
rule is shipped, as plan 02 section 6 asks.

Items 20, 31, 34 and 35 are unwritten in this release; the lines drawn above are provisional until
they are, and the later standards may legitimately move them. Open question Q19 (whether the two
forbidden evaluation rules are item 50's prohibitions) is recorded open and not answered here.
No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds today because no detector has this subject, and no test guards it.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away
as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds today, unguarded.** No detector, rule or report in `scripts/`, `rules/`, `schemas/`, `templates/` or `ai-policy.yml` has a concept of robustness as a subject; a case-insensitive search of those paths for `robust` found one use, in `templates/RED-TEAM-REPORT.md`, as a caution against inferring robustness from a failed attempt, and no check. No test asserts the absence, so a future detector could break R6 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's robustness |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1, R2, R4, R5 | A place to record classes, bars and per-class results: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R3 | A way to read a suite's generator and split membership | Suite layout is the project's; a source scan would be a presence check R6 forbids reporting as a verdict |
| R6 | A test asserting no detector emits a robustness verdict | Meaningful only once a detector exists for it to constrain |
| Rule ids | Ids in a namespace once Q19 is decided | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system robust, or its
robustness evaluated, from the presence of a perturbation test, a fixture, a generator library or a
robustness document. R6 forecloses it, and the foreclosure is the point: a test's presence is not
what it measured, and a framework reporting it would put its authority behind a property of a
running system that nothing in a repository can show.
