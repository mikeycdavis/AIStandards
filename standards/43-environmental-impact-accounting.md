# Standard 43 — Environmental Impact Accounting

Running a model consumes energy and, through the energy, causes emissions; the hardware that runs it
and the water that cools it carry costs of their own. Almost none of that is visible to the project
that makes the call. A hosted model reports a token count and an invoice, not a joule. The grid that
served the request, the utilisation of the machine, the model's size and whether the training is
counted are all held by someone else, and the figures that circulate are estimates of different things
under different boundaries, quoted as if they were one quantity.

This standard is about the **accounting**, not the number. It asks that a project which says anything
about the environmental impact of its AI use say what it counted, how, from what, and what it left out,
so that two figures can be told apart and a missing figure is recorded as missing. It does not set a
target, a threshold or a method, and it does not ask a project to reduce anything.

The failure this standard is written against is a figure with no boundary: "our AI is carbon-neutral",
"each query uses as much energy as a lightbulb for a minute", "we run on a green region". Each may be
true of something. None says of what.

Source: item 43 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "environmental impact" token of the "Cost, latency, environmental impact, and
operational resilience" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 43 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) with the note that no pack in
> the portfolio mentions environmental impact, and that review's substantive half is human judgment and
> carries `humanSignOff: null`. No maintainer of any adjacent pack has confirmed it.
>
> **The brief supplies one word and this standard supplies the rest.** The brief's bullet names
> "environmental impact" and states no requirement for it. The item is class `D` because its token is
> the brief's own; the requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it — a repository that invokes a model, retrieves context for one, or acts on a model's output —
where the project states, reports or publishes a figure or a claim about the environmental impact of
that use: energy, emissions, water, or hardware.

Covers: the boundary of what is accounted; the method and the status of each input; how a reported
figure is described; claims of neutrality or low impact; and the limit of what this framework can say
about any of it.

Two terms, each defined here rather than by the brief:

- An **impact figure** is any number or qualitative claim about energy, emissions, water or hardware
  attributed to the project's use of models.
- A **boundary** is the list of what the figure includes and excludes: inference only or also
  training; the model host's data centre only or also networking and end-user devices; operational
  energy only or also embodied hardware.

It does **not** cover, and claims none of the ground of, the following:

- **Whether a project should reduce its impact**, or by how much. This standard sets no target.
- **Spend.** Item 41, Inference Cost and Budget Control, owns cost. Cost and energy are correlated and
  are not the same quantity; neither stands in for the other here.
- **Provider resilience and portability.** Item 44 owns it.
- **Impact outside AI use**, such as a project's general infrastructure, unless the figure claims to
  include it.

**Boundary posture O — owned outright.** The boundary review records that no pack in the portfolio
mentions environmental impact, and that the item's validation type is not-evaluable. This document
accepts that record for what a repository can establish — the *correctness* of an energy, emissions or
water figure — and narrows it there: that a boundary, method, assumptions and labels are present beside
a figure is a reviewable record, so R1 to R5 are `manual-review` obligations (see Validation). It adds
no precedent to the review's.

## Requirements

### R1 — State the boundary of every impact figure

**A project that reports an impact figure MUST state its boundary — at least whether training is
included, which operations are counted (inference, retrieval, storage, networking, end-user devices),
and whether embodied hardware is included — and MUST NOT present a figure without one, nor compare or
ratio two figures with different boundaries without stating the difference.**

Two correct figures with different boundaries differ by orders of magnitude. A per-query energy number
for inference alone, set beside a total for a training run, is not a comparison. The requirement does
not choose a boundary; it requires that the one used be written next to the figure, and that a
comparison across boundaries say so.

### R2 — Name the method and label each input as measured, estimated, reported or unknown

**Each input to an impact figure MUST be labelled by its status — measured by the project, estimated
by the project from a stated model, reported by a provider or third party, or unknown — and the method
that combines them MUST be named. A reported input MUST name its source and the revision or date of the
disclosure it is taken from. An input that is not available MUST be recorded as unknown and
MUST NOT be replaced by a figure for another model, region or period without saying so.**

A hosted model's energy is almost never measured by its user. Substituting the published figure of a
different, similarly sized model is a common and defensible estimate, and the requirement is that it
be called one. An unknown that is carried as unknown is accounting; an unknown filled with a plausible
number and no label is the failure.

### R3 — Name the subject, period and assumptions

**A reported figure MUST name the model identifier or class it applies to, the period or workload it
was computed over, and the assumptions it depends on: where the calculation uses a grid or region
intensity (an emissions figure derived from energy, or an energy figure estimated from a region's
supply), that intensity and its date; and for any other figure the conversion factors it relies on. A
figure from a direct measurement, such as a metered quantity of energy, depends on no intensity and
names none. An assumption the figure does not use is not reported.**

Grid intensity varies by region and by hour, and a model identifier can change behind an alias. A figure
for last year's model on last year's grid is a statement about that, not about the system now running.

### R4 — Do not claim neutrality, or low impact, without the figure and its boundary behind it

**A project MUST NOT state or imply that its AI use is carbon-neutral, net-zero, green or low-impact
unless the statement names the figure (R1 to R3) and any offset or credit is reported separately from
the gross figure, with what it covers.**

An offset is a claim about something else that happened elsewhere. It does not change what the
operation consumed. The requirement is not that offsets be avoided; it is that the gross figure not
disappear into them.

This requirement sets no threshold and does not define what "low" is.

### R5 — A figure for the future is an estimate, and is called one

**A statement about the impact of a planned or projected use MUST be labelled a projection and MUST
name the assumptions it extrapolates from.**

Usage grows, models change and grids decarbonise or do not. A projection made at one volume describes
that volume. Whether a projection will prove right is not a property of a repository; that it is
labelled and states its assumptions is, and is what this requirement asks.

### R6 — This framework MUST NOT report environmental impact from the presence of a setting

**No detector, rule, audit finding or generated report in this framework MAY state a system's
environmental impact, or that it is efficient or low-impact, because a region name, a model name, a
quantisation flag, a caching layer or a declaration is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that a region string
names a "low-carbon" region or that a smaller model is configured. It cannot show what the system
consumed. Reporting an impact from a presence would turn a setting into a measurement.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Figure without a boundary | A per-query energy number that does not say whether training is included | R1 |
| Mixed boundaries compared | An inference-only figure set beside a training total as though comparable | R1 |
| Unknown filled silently | A hosted model's energy taken from another model's published figure with no label | R2 |
| Estimate presented as measurement | A figure computed from token counts and a published coefficient described as measured | R2 |
| Method unnamed | A single number with no account of how inputs were combined | R2 |
| Stale or foreign basis | A figure for an earlier model or another region quoted for the current system | R3 |
| Grid assumed silently | "Runs on renewables" with no region, date or intensity | R3 |
| Neutrality by offset alone | "Carbon-neutral AI" with the gross figure absent | R4 |
| Low-impact claim with no figure | "Efficient" or "green" used as a description | R4 |
| Projection stated as fact | A forecast of next year's impact written as a present result | R5 |
| Setting read as impact | A framework report of "low-impact" because a region name or a small model is configured | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The boundary written beside each reported figure | The document or report carrying the figure | Human review |
| R2 | The method, and each input's status | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R3 | The subject, period and assumptions, including grid intensity and its date where the calculation uses one | The report carrying the figure | Human review |
| R4 | Any neutrality or low-impact claim, with the figure and the separately reported offset | The project's documentation and public statements | Human review |
| R5 | Any projection, labelled, with its assumptions | The project's documentation | Human review |
| The correctness of a figure, and of a projection, as a statement about energy actually used | None obtainable from a repository | — | **Not-evaluable** |
| R6 | The absence of any detector, rule, audit finding or generated report that reports impact from a setting or presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R5 is a human-authored record. A document stating a boundary and a method establishes
that the project wrote them down. Whether the figure is correct is not established by any record in a
repository; this framework cannot observe the energy a model used.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that
every standard cite at least one rule or record in its Validation section why it ships with none; this
is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation,
that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers
section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 or R2 would look for a declared boundary
   or method, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json`
   has a place to put one; both are closed. A rule failing every project for omitting what no schema
   accepts would measure this framework's own incompleteness and blame the project for it. Adding a
   schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **The subject is a quantity this framework cannot observe.** Energy and emissions are not
   properties of a checkout. A detector could only read a setting, which R6 forbids this framework from
   reporting as a result. The boundary review records the same: the item is not-evaluable.
3. **No rule namespace exists for it.** No shard holds an environmental namespace, and this standard
   mints no id; naming one is a decision for the owner. A proposed rule, if one is natural, is recorded
   in the pull request that introduced this document for per-rule approval, and not here.

**Severity.** Every requirement here asks for a record, statement or label, so a finding against R1,
R2, R3 or R5 is reported at **warning** severity: the figure may still be honest, and what is missing is
the account of it. A finding against R4, which prohibits a claim made with nothing behind it, is
reported at **error** severity, as is a detector's violation of R6. The assignment is per requirement
and does not depend on how the finding is phrased. These levels are this repository's judgment, listed
in Additions, and are not owner-approved. R1 to R5 are also `manual-review` obligations where a
figure, claim or projection exists; the validation type and the severity are different things.
Whether a figure or a projection is *correct* is **not-evaluable** and is not reported as reviewed. R6
constrains this framework and has no validation type, because the thing it prohibits is a behaviour of
the tool.

**Exemptibility.** R6 is not exemptible, for the reason R6 of
[Standard 25](25-grounding-and-hallucination-control.md) is not. R4's prohibition on a neutrality or
low-impact claim with no figure behind it is likewise not exemptible, because an exception would record
a project as knowingly making a claim nothing supports. R1 to R3 and R5 reach a system only where it
reports a figure or a projection, and a system that makes no environmental claim of any kind may declare
them out of scope by saying so in its own documents, with a reason. This release has no policy
mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to
catalog rules, and this standard has none. A project that has made no claim has nothing here to fail;
one that later makes a claim is bound by these requirements from that point. No level here is lowered
by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | A reported figure states whether training is in or out, which of inference, retrieval, storage, networking and end-user devices are counted, and whether embodied hardware is in or out | A number with no boundary, or one that states only some of the three | A figure that states "training excluded; inference counted, retrieval, storage, networking and end-user devices excluded; operational energy only, embodied hardware excluded" must **not** be faulted for the narrow boundary |
| R2 | Each input has a status label and the method is named | An estimate described as measured, or an unknown replaced silently | A project that records its hosted model's energy as "unknown" and reports no figure must **not** be reported as failing R2 |
| R3 | A figure names model or class, period and its assumptions, including the grid intensity and its date where the calculation uses one | A figure with a number and no subject, period or assumptions, or a calculated emissions figure whose calculation uses a grid intensity and names none | A figure that names an old model and an old period, and says so, must **not** be flagged as stale |
| R4 | A neutrality or low-impact claim cites the figure, with offsets reported separately and what each covers | "Carbon-neutral" with the gross figure absent | A project that publishes a gross figure and separately lists an offset must **not** be flagged for having one |
| R5 | A projection is labelled as one and names its assumptions | A projection with no projection label, or with no named assumptions | A labelled projection with assumptions must **not** be flagged for being uncertain |
| R6 | No detector, rule, audit finding or generated report in this repository states an impact verdict from presence | A detector, rule (a rule that treats a presence as establishing the property), audit finding or report that reported low-impact because a region name was present | Reporting that a region setting was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads an accounting artifact and no fixture
carries one, so R1 to R5 are enforced by review or not at all, and R6 holds by construction. The
falsifiers in the table are available for manual review; what this release lacks is a detector that
applies them. **A requirement nobody can be shown to have broken is a requirement with no falsifier**,
and each requirement above has one.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to
except. A project that knowingly does not meet one records that in its own documents; Standard 2's
dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release.
[Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by
default and `not-evaluable` ones never attestable, but it governs catalog rules, none exists here, and
the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the
`attested` disposition as not yet produced). No record under this standard expires on a schedule;
[Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability
declarations and does not apply to these records. Review-staleness is event-driven only: a record is
stale when one of the events below occurs, and nothing in this release detects that.

**What invalidates a recorded figure.** A figure that names a completed period remains a true statement
about that period after any change below; it stops describing the system as it now runs, and it is
stale only where it is presented as current or is a projection whose basis has changed. Each of the
following is a different subject, and a record made before the change describes the earlier one:

- a change of model identifier, or a model silently updated behind an alias
  ([Standard 1](01-ai-system-manifest.md) R4 asks for the identifier to be pinned);
- a change of provider, region or hosting arrangement, or of the grid intensity of the region;
- a change in how the provider reports or estimates energy, or the withdrawal of a figure it published;
- a change of prompt, output length, caching or batching, each of which changes the work done per request;
- a change of volume, which moves a projection's basis.

**Staleness is asymmetric here.** A figure presented as current becomes stale when something outside the
project changes: a grid's mix and a provider's hardware are changes nobody in the project made. Nothing in this release
detects the transition; the events above are a note to a future reader.

**Contradicted by operation.** A provider's revised disclosure, or a measurement that departs from an
estimate the project published, contradicts the record and invalidates it until re-examined. This
standard says only that the record no longer stands.

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes two words, "environmental impact", inside a bullet of four
subjects. It states no requirement, level or evidence for them. The item is class `D` because its
subject token is derived from the brief; the requirements are not derived. Specifically authored here,
none of it owner-approved:

- **R1 in full**: the requirement that every figure carry a boundary, and the three boundary
  questions (training, operations counted, embodied hardware).
- **R2 in full**: the four-way status of an input (measured, estimated, reported, unknown), the
  naming of the method, and the ruling that an unavailable input is recorded as unknown and not
  silently substituted.
- **R3 in full**: the three things a figure must name, including grid intensity and its date.
- **R4 in full**: the prohibition on neutrality or low-impact claims with no figure behind them, the
  separate reporting of offsets, and the ruling that it is not exemptible.
- **R5 in full**: labelling a projection as one.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in
  [Standard 25](25-grounding-and-hallucination-control.md) and
  [Standard 33](33-ai-observability.md).
- **The severity assignments** (warning for R1, R2, R3 and R5; error for R4 and for a detector's
  violation of R6) and the statement that no attestation or scheduled expiry exists in this release.
- **That this standard sets no target, threshold or method**, and the exclusions in Scope as division
  lines, which no one has confirmed.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the
  decision not to name a rule id.

Not authored here: the posture, and the observation that the item is not-evaluable, are the boundary
review's.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) lists the subjects this pack owns and the packs
that own the others; the boundary review records that no pack in the portfolio mentions environmental
impact, so this item has no counterpart to defer to or crosswalk.

[Standard 33](33-ai-observability.md) governs what a call record carries; R2 and R3 here depend on
that record for the model that served a call and do not restate it. Item 41, Inference Cost and Budget
Control, governs spend; a project that attributes spend per subject has the grouping an impact figure
may reuse, and nothing here requires it.

[Standard 1](01-ai-system-manifest.md) declares models, and R3 depends on the identifier it asks to be
pinned. It declares no environmental field, and none is proposed by this standard.
[Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and
non-lowering language used above. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the
requirement the Tests and falsifiers section answers.

Items 41 and 44 are not part of this change; the lines drawn above are provisional until they are
written, and the later standards may legitimately move them.

**Outside this pack.** No adjacent pack's standard is recorded for this subject. No ADR covers this
standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds by construction.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away
as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds by construction, not by assertion.** No detector, rule or report in `scripts/`, `rules/` or `ai-policy.yml` has a concept of environmental impact, energy or emissions. No test asserts the absence, so a future detector could break R6 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's accounting |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 to R3 | A place to declare a boundary, method and assumptions: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R4, R5 | A check that a published claim names its figure, or that a projection is labelled | Reading intent from free text is a heuristic, and a false positive teaches a project to write whatever passes |
| R6 | A test asserting no detector emits an impact verdict | Meaningful only once a detector exists for it to constrain |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system's environmental impact, or
that it is efficient or low-impact, from the presence of a region name, a model name, a quantisation
flag or a declaration. R6 forecloses it, and the foreclosure is the point: a presence is not a
measurement, and a framework reporting one would put its authority behind a quantity that nothing in a
repository can show.
