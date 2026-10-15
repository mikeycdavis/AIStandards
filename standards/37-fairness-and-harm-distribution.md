# Standard 37 — Fairness and Harm Distribution

An AI system's output is rarely wrong in the same way for everyone. A model that is right 95% of the
time can be right 99% of the time for one group of people and 80% of the time for another, and the
figure a project reports — the average — hides that gap by construction. "The system is fair" is a
description of that hidden distribution, and it is not a requirement: it names no group, no harm, no
measure, and no observation that would show the claim false.

Three different things are routinely run together, and this standard exists to keep them apart. A
**harm** is something a person bears because of what the system output or did: a denied service, a
wrong label, a worse answer, an exposure. A **disparity** is a difference in how often, or how
severely, that harm falls on different groups. And **fairness** is a *judgment* about whether a
disparity is acceptable — a judgment that depends on a chosen measure, a chosen comparison and a
context, and that is not a number the system can emit by itself.

The failure this standard is written against is taking the aggregate for the distribution, and a
statement that a system was "tested for bias" for a finding that it treats groups acceptably.

Source: item 37 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "fairness" token of the "Accessibility, fairness, transparency, and user disclosure"
bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 37 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) under `notGovernedElsewhere`
> after a search of nine packs found no owner, and that review's substantive half is human judgment and
> carries `humanSignOff: null`. No maintainer of any adjacent pack has confirmed it.
>
> **The brief supplies one word and this standard supplies the rest.** The brief's bullet names
> "fairness" and says nothing about what a system must do about it. The item is class `D` because its
> subject token is the brief's own; the requirements below are this repository's judgment about that
> subject, and the [Additions](#additions-this-standard-makes-beyond-the-source) section lists them
> rather than describing them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it — a repository that invokes a model, retrieves context for one, or acts on a model's output —
whose output or action affects people, directly or through a decision another person or system makes
from it.

Covers: naming who is affected and how; the measure and the comparison behind any fairness claim;
reporting results by group instead of only in aggregate; how harm is distributed, including harm that
moves rather than disappears when a mitigation is applied; a route for a disparate outcome to be
raised; and the limit of what this framework can say about any of it.

Two terms, each defined here rather than by the brief:

- An **affected group** is any set of people the system's output reaches that a project, a
  regulator, an affected person or a reviewer could reasonably distinguish and compare: by a
  characteristic the law protects in some jurisdiction, by language, by region, by device, by how
  long they have used the system, or by any other division along which outcomes could differ. This
  standard supplies no list. Which characteristics are protected is a matter of law and context, and
  differs between jurisdictions.
- A **harm distribution** is how a given harm falls across affected groups: how often, how severely,
  and with what means of recourse.

It does **not** cover, and claims none of the ground of:

- **Item 38, Accessibility of AI Features** — whether people with disabilities can use the feature.
  Unequal *usability* is item 38's subject; unequal *outcome* is this one's. A system can fail in
  both ways, and each standard keeps its own half.
- **Item 39, Transparency and System Documentation** and **item 40, User Disclosure of AI
  Involvement** — what is documented and what a user is told. R1 below asks for a record of affected
  groups and harms; it does not ask that the record be shown to a user.
- **Personal data handling.** Collecting a group attribute to measure disparity is a personal-data
  act, and [Standard 13](13-personal-data-in-ai-systems.md) governs it. This standard does not
  restate that, and R3 depends on it.
- **Evaluation planning.** How an evaluation is planned, scored and reported is
  [Standard 17](17-evaluation-plans-for-generative-systems.md). A per-group result is an evaluation
  result and inherits those requirements.
- **Legal compliance.** Whether a disparity is lawful in a jurisdiction is a legal question this
  standard does not answer and must not be read as answering.

**Boundary posture O — owned outright.** The boundary review lists this item among those searched
across nine packs for an owner and not found. [Standard 7](07-boundary-with-adjacent-standards.md)
records the ownership line "Fairness and harm distribution — AIStandards — Owns. No existing owner".
The boundary review records no adjacent standard as evidence for this item, and none is cited here.

## Requirements

### R1 — Name the affected groups and the harm before claiming anything about fairness

**A system whose output reaches people MUST record, for each kind of output or decision that a person
bears a consequence from, which groups it is expected to reach, what harm an error or a poor outcome
would be, and who would bear it, and MUST NOT describe a system as fair, unbiased or equitable without
that record.**

Fairness has no meaning without a subject. "Fair to whom, about what?" is the question every later
requirement answers, and a system that cannot answer it has no basis for the claim and no basis for
the test. The record may legitimately say that no individual-level consequence arises — a system that
only reorders internal tickets — and that is a reasoned finding, not a gap; it is recorded as one.

The record is a document, not a manifest field. `schemas/ai-system-manifest.schema.json` is closed and
has no property for it, and nothing in this requirement asks an adopter to write a field that schema
rejects.

### R2 — Name the measure and the comparison behind any fairness or parity claim

**A statement that a system treats groups equally, comparably or without bias MUST name the measure
used, the groups compared, the data it was computed from and the threshold or criterion that was
applied, and MUST NOT be stated as an unqualified property of the system.**

Fairness measures are not interchangeable and, in general, cannot all hold at once: equal selection
rates, equal error rates and equal calibration are different claims, and satisfying one can require
violating another. Which to prefer is a judgment about the context, and it is the project's to make
and to record. This standard does not choose a measure and does not fix a threshold; it asks that the
choice be visible so that a reader can disagree with it.

A parity figure with no named measure is not wrong, it is unreadable: it cannot be compared with the
next run, and it cannot be held to a claim.

### R3 — Report results by group, and record where a group cannot be measured

**Where a system's quality, error rate or outcome is reported, the report MUST NOT be limited to an
aggregate when an affected group recorded under R1 can be measured; and where a group cannot be
measured, the report MUST record that as a limit of the evaluation and MUST NOT present the absence
of a measurement as parity.**

An aggregate is dominated by the largest group. A group that is a small fraction of the evaluation
set can be wrong in most of its cases and move the headline by less than its noise. The requirement is
the disaggregated figure, with group sizes, because a rate computed on a handful of cases is a
different claim from one computed on thousands.

A group often cannot be measured: the attribute was never collected, may not be lawfully collected,
or may be collected only in a form that is itself unreliable. That is a real constraint and the
requirement is only that it be stated. "No disparity found" is a finding about a measured group; for
an unmeasured one the honest entry is "not measured", with the reason.

Collecting or inferring a group attribute to do this is subject to
[Standard 13](13-personal-data-in-ai-systems.md) and to the law that governs it. This requirement does
not ask anyone to collect a sensitive attribute they may not, and it does not treat an inferred one as
a record of the person's characteristic.

### R4 — Record how the harm is distributed, and where a mitigation moves it

**A project MUST record, for each harm identified under R1, which groups bear it and how, MUST record
any proxy through which a group difference could reach an outcome without the group attribute being
an input, and MUST record where a mitigation reduces a harm for one group by shifting it to another.**

Removing a sensitive attribute from the inputs does not remove it from the outcomes: postcode, device,
language and purchase history correlate with groups, and a model finds those correlations whether or
not anyone asked it to. "The model does not use X" is a claim about inputs; the harm is a property of
outputs.

A mitigation is also a change, and a change has a distribution. A threshold lowered to reduce one
group's false rejections raises another group's false acceptances; a filter that removes harmful
output removes some groups' dialects more than others. Recording the shift is the requirement; the
acceptability of it is a decision, and it is a human one.

Harm also reaches people who are not the system's users — a person who is described, scored, searched
for or identified by a system they never touched. R1 and R4 apply to them.

### R5 — Provide a route by which a disparate outcome can be raised and examined

**A system SHOULD give affected people, operators and reviewers a route by which a suspected
disparate or unfair outcome can be reported, and SHOULD record what happens to such a report,
including when it is found to be well-founded.**

Pre-deployment measurement covers the groups and cases a project thought of. The cases it did not are
found by the people they happen to, and a route that exists but ends in no action is a log line. This
requirement is a SHOULD because what a route looks like depends on the system — a public interface, an
internal review queue, an operator escalation — and because incident handling is its own subject
(item 34, unwritten in this release). Where a report is found well-founded, the record R1 and R4
describe no longer stands (see Exceptions and staleness).

### R6 — This framework MUST NOT report a system fair, or a disparity absent, from the presence of something

**No detector, rule, audit finding or generated report in this framework MAY state that a system is
fair, unbiased or free of disparity, that a fairness or bias evaluation was adequate, or that a
mitigation works, because a fairness document, a bias test, an evaluation tool, a declared group list
or a stated metric is present in the repository. This framework MUST NOT supply a list of protected
characteristics, a preferred measure or a numeric threshold that would stand in for the project's
own record under R1 and R2.**

This is a constraint on the framework, not on a project. A repository can show that a fairness
document exists, that a bias-testing library is imported, or that a metric is named. It cannot show
that the groups chosen were the groups that matter, that the data measured the people the system
reaches, or that the system's behaviour in use resembles its behaviour in the test. Reporting a pass
from any of them would turn the presence of an exercise into a verdict about people.

The second sentence is a boundary of competence. Which attributes the law protects, and which measure
is appropriate, are contextual and jurisdictional, and a framework that shipped a list or a threshold
would present a judgment from one context as a standard for all of them.

**A fairness evaluation that has never been shown to detect a disparity is not demonstrated to
work.** A check is shown by a disparity it finds in a case where one was put there.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Fairness without a subject | "Our system is fair" with no group, harm or decision named | R1 |
| Harm unexamined because unnoticed | No record of who bears an error; the consequence is discovered by the person it fell on | R1 |
| Unreadable parity | "Parity achieved" or "bias score 0.02" with no measure, groups, data or threshold | R2 |
| Measure shopping | A measure chosen after the run because it passed, never recorded as a choice | R2 |
| Aggregate as verdict | A single accuracy figure reported while one group's error rate is several times another's | R3 |
| Unmeasured read as equal | No group-level figure exists and the report says no disparity was found | R3 |
| Tiny-group figure | A rate reported for a group of a few cases with no size alongside it | R3 |
| Proxy ignored | The sensitive attribute is dropped from inputs and the outcome still tracks it | R4 |
| Harm moved, reported as reduced | A mitigation lowers one group's rate and raises another's, and only the first is reported | R4 |
| Non-user left out | The person scored or described by the system is not in any record | R1, R4 |
| Route ending in nothing | Reports are received, logged and never examined | R5 |
| Presence read as outcome | A framework report of "fair" because a fairness document or a bias library is present | R6 |
| Framework-supplied list | A fixed list of protected attributes or a threshold applied to projects in other jurisdictions | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | A record of each output kind with its affected groups, harm and bearer, or a reasoned no-individual-consequence finding | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | The measure, groups, data, criterion and the reason for the choice, for each fairness claim | The project's evaluation records and published statements | Human review |
| R3 | Per-group results with group sizes, and a statement of each group that was not measured and why | The project's evaluation results ([Standard 17](17-evaluation-plans-for-generative-systems.md) governs a plan, if any) | Human review of the records |
| R4 | The harm-by-group record, the proxies considered, and the effect of each mitigation on each group | The project's analysis documents and evaluation results | Human review |
| R5 | The route, and a record of what became of reports received | Project operations records | Human review |
| R6 | The absence of any detector that reports fairness from presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R5 is a human-authored record. A document naming a group, a measure or a route
establishes that the project wrote it down, and says nothing about whether the running system treats
those groups as claimed; the reviewer reads what is claimed against the results that would show it.

**Fairness of a running system is not evaluable from a repository.** A project's own account of its
measurements is evidence about an earlier run, a particular population and a particular configuration.
The property of the next response, to the next person, is not-evaluable.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
[Standard 6](06-standard-structure-and-rule-identity.md) R3 requires every standard to cite at least
one rule or record why it does not; this is that record.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 would look for a record of affected
   groups and harms, and neither `schemas/ai-system-manifest.schema.json` nor
   `schemas/ai-policy.schema.json` has a place to put one; both are closed. A rule failing every
   project for omitting what no schema accepts would measure this framework's own incompleteness and
   blame the project for it. Adding a schema field is a schema-versioning decision, outside this slice
   (plan 02 section 8).
2. **R2 to R5 concern analysis and behaviour, not files.** Whether a measure suits a context, whether a
   group was the right one to compare, and whether a route leads to action are not properties of a
   checkout. A detector reading source would be testing for the presence of an exercise, which R6
   forbids this framework from reporting as a result, and any detector would have to embed a list of
   groups or a threshold, which R6 also forbids.
3. **No shard exists for the namespace.** `fairness` is a reserved segment in `scripts/catalog.mjs` and
   has no shard. This standard mints no id and edits no shard. Whether a rule is wanted, which
   validation type it would take and what it would read are decisions this release does not take.

**Severity.** R1 to R4 are `manual-review` obligations in this release; R5 is a `SHOULD` and is
reviewed, not required. The inference-time property of a system treating groups as claimed is
**not-evaluable** and is not reported as reviewed. R6 constrains this framework and has no validation
type, because the thing it prohibits is a behaviour of the tool.

**No severity is assigned to R1 to R5 in this release.** A severity belongs to a rule's finding, and
no rule exists here to produce one. A failed manual review is a finding for the reviewer, made under
the standards the project and its owner apply, not a framework finding; if a rule is later minted
for any of these requirements its severity is decided then and recorded in its shard.

**Exemptibility.** R6 is not exemptible: no project circumstance makes it reasonable for a scan to
report an effect from a presence, or to apply one jurisdiction's list to another's, and a mechanism
for excepting the prohibition would be self-defeating. R2's prohibition on an unqualified fairness
claim is likewise not exemptible, because an exception would record a project as knowingly making a
claim no evidence can support; a project that wishes to say something stronger must supply the
measurement. R1, R3 and R4 reach a system only where its output affects people. That is a scope
condition, not a disposition: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4's
dispositions are recorded against catalog rules, this standard has none, and the policy schema
offers no declaration for it. A project whose system lacks the subject records why in its own
documents, and no detector in this release would contradict a false record. No level here is lowered
by a risk tier
(Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | An output kind that affects people has a recorded group set, harm and bearer | A system that scores or classifies people with no record of who bears an error | A system recording a reasoned "no individual consequence" finding must **not** be reported as missing a record |
| R2 | A fairness claim names a measure, the groups, the data and a criterion | "Fair" or "bias-free" with none of them | A statement reporting a named measure on named groups with the number and no stronger claim must **not** be flagged |
| R3 | A report carries per-group figures with sizes, or states which group was not measured and why | An aggregate-only report where a recorded group was measurable | A report stating "not measured, attribute not lawfully collected" must **not** be read as a failure to evaluate; a group with a very small size reported as such is not a defect |
| R4 | A mitigation's effect is recorded on each group, and at least one proxy is considered | A mitigation reported with its benefit to one group and no recorded effect on another | A project recording that no proxy was identified, with how it looked, must **not** be failed for the empty list |
| R5 | A route exists and a report received has a recorded disposition | A route that discards or never reads reports | A system with no individual-level consequence (R1) must not be failed for having no route |
| R6 | No detector or report in this repository outputs a fairness verdict from presence, or supplies a protected-attribute list or threshold | A detector that reported fair because a bias-testing import was present | Reporting that a fairness document or library was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads a fairness artifact, so no detector
checks R1 to R5; they are enforced by review or not at all, and the last requirement holds by
construction. The falsifiers in the table are observable by a reviewer reading the record or the
running system: they are manual, not absent. The negative controls state what review must not do to
a project that has the right subject and does the right thing.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to
except. A project that knowingly does not meet one records that in its own documents; Standard 2's
dispositions apply to the application of a rule, and this standard has none.

**What invalidates a recorded group set, measure or result.** Each of these is a different subject, and
a record made before the change describes the earlier one:

- a change of model identifier, or a model silently updated behind an alias
  ([Standard 1](01-ai-system-manifest.md) R4 asks for the identifier to be pinned);
- a change of training, fine-tuning, retrieval or evaluation data, or of how it was sampled;
- a change of the decision the output feeds, the threshold applied to it, or the people it reaches —
  a new region, language, customer segment or channel;
- a mitigation, which changes the distribution it was meant to improve (R4);
- a change in what the system does with a group attribute, or in what may lawfully be collected.

**Staleness is asymmetric here.** A fairness record becomes false when a population or a configuration
changes, and expanding to a new group of users is the edit nobody treats as a change to the system. A
parity figure measured on last year's population describes last year's system. Nothing in this release
detects the transition; the events above are a note to a future reader.

**Contradicted by operation.** A report, complaint or observation of a disparate outcome that a
project judges well-founded contradicts whatever it recorded under R2 to R4 and invalidates it until
re-examined. What happens operationally is item 34's subject (AI Incident Response, unwritten in this
release); this standard says only that the record no longer stands.

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one word, "fairness", inside a bullet of four subjects. It
states no requirement, level or evidence for any of them. The item is class `D` because its subject
token is derived from the brief; the requirements are not derived. Specifically authored here, none of
it owner-approved:

- **R1 in full**: the requirement to record affected groups, harm and bearer, and the ruling that a
  reasoned finding of no individual consequence is a legitimate record.
- **R2 in full**, including the ruling that a fairness claim is not exemptible when unqualified, and the
  decision to leave the choice of measure and threshold to the project.
- **R3 in full**: disaggregated reporting with group sizes, and the rule that an unmeasured group is
  reported as unmeasured and not as parity.
- **R4 in full**: the harm-by-group record, the proxy requirement and the requirement to record a
  harm shifted by a mitigation. The extension to people who are not users is a choice.
- **R5**: the route for raising a disparate outcome, and the choice to make it a `SHOULD`.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in
  [Standard 8](08-ai-safety-requirements-and-safety-cases.md),
  [Standard 17](17-evaluation-plans-for-generative-systems.md) and
  [Standard 25](25-grounding-and-hallucination-control.md), together with its additional prohibition
  on supplying a protected-attribute list, a preferred measure or a threshold.
- **The exclusions in Scope** (items 38, 39 and 40, personal data handling, evaluation planning and
  legal compliance) as division lines. The specification lists items 38 to 40 under the same bullet;
  where this standard stops and each begins is unconfirmed by anyone.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the
  decision not to name a rule id in the unsharded `fairness` namespace.

**Recorded as open, not answered here.** Whether the framework should ever supply a reference list of
characteristics or a default measure as a non-binding aid, against R6's prohibition; whether R5's route
belongs here or wholly to item 34; and whether a rule is wanted in the `fairness` namespace and what
artifact it would read. Each needs an owner's ruling, and none is recorded in
`artifacts/project-plan-breakdown/08-open-questions.md` by this document.

Not authored here, and recorded so the reader does not credit this standard with it: the posture `O`
and the ownership line in Standard 7 are the boundary review's and Standard 7's, not this document's.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) records the ownership line for this item. It
mints no rule id and crosswalks nothing for it.

[Standard 13](13-personal-data-in-ai-systems.md) governs the collection, retention and redaction of the
personal data a per-group measurement may require; R3 here depends on it and does not restate it.

[Standard 17](17-evaluation-plans-for-generative-systems.md) governs how an evaluation is planned,
scored and reported, and R2 and R3 rely on it for any figure a project reports. It is where the
evaluated subject (R6 there) and the scorer (R7) are recorded.

[Standard 25](25-grounding-and-hallucination-control.md) is the closest sibling in form: a standard
about a property that no repository reading can establish, with a constraint on the framework in its
last requirement.

[Standard 8](08-ai-safety-requirements-and-safety-cases.md) R3 and R4 say how a safety case cites
evidence. A per-group result or a harm record may be cited there, labelled by kind and revision; this
standard does not say when a distribution of harm is acceptable.

[Standard 1](01-ai-system-manifest.md) declares models, prompts and data sources; it declares no
affected group and this standard proposes no field. [Standard 2](02-ai-risk-tiering-and-applicability.md)
R3 and R4 govern the applicability and non-lowering language used above.
[Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Validation
section's no-rule record answers.

Items 38 (Accessibility of AI Features), 39 (Transparency and System Documentation), 40 (User
Disclosure of AI Involvement) and 34 (AI Incident Response) are unwritten in this release; the lines
drawn above are provisional until they are, and the later standards may legitimately move them.

**Outside this pack.** No adjacent pack is cited: the boundary review found none that governs this
subject. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds by construction.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away
as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds by construction, not by assertion.** No detector, rule or report in `scripts/`, `rules/` or `ai-policy.yml` has a concept of fairness, bias or protected characteristics, and no list or threshold of the kind R6 forbids is shipped. No test asserts the absence, so a future detector could break R6 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's fairness |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 | A declaration of affected groups and harms with a place to live: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R2, R3, R4 | Fixtures with a disclosed and an undisclosed measure, and a detector that runs project-supplied checks | Phase 3 detector and evidence-availability work; the plan says detectors wait for the corpus. Any such detector must carry no group list or threshold of its own (R6) |
| R5 | A way to find a route and its dispositions | Reading intent from free text is a heuristic, and a false positive teaches a project to write whatever passes |
| R6 | A test asserting no detector emits a fairness verdict | Meaningful only once a detector exists for it to constrain |
| Rule id | A reserved-namespace id and a shard, once an owner is decided | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system fair, unbiased or free of
disparity from the presence of a fairness document, a bias-testing library, a declared group list or a
stated metric; and a framework-supplied list of protected characteristics or threshold applied to
every project. R6 forecloses both, and the foreclosure is the point: the presence of an exercise is not
an outcome for the people the system reaches, and a framework reporting one would put its authority
behind a judgment that nothing in a repository can show.
