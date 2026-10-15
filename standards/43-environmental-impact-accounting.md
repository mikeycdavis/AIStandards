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

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it — a repository that invokes a model, retrieves context for one, or acts on a model's output — where the project states, reports or publishes a figure or a claim about the environmental impact of that use: energy, emissions, water, or hardware.

Covers: the boundary of an impact figure; how its inputs and method are labelled; what else it must name; claims of neutrality or low impact; projections; and the limit of what this framework can say about any of it. It sets no target, threshold or method, and asks no project to reduce anything.

Terms, each defined once here and used verbatim below:

- **Impact figure** — any number or qualitative claim about energy, emissions, water or hardware attributed to the project's use of models.
- **Boundary** — whether training is included, which of inference, retrieval, storage, networking and end-user devices are counted, and whether embodied hardware is included.
- **Inputs** — what an impact figure is computed from; each has a status: measured by the project, estimated from a named model, reported by a named source with its disclosure revision or date, or unknown.
- **Account** — its subject (the model identifier or class), its period or workload, and its assumptions; for a calculation that uses a grid or region intensity, that intensity and its date; for any other figure, the conversion factors it relies on.

It does **not** cover, and claims none of the ground of:

- **Whether a project should reduce its impact**, or by how much; this standard sets no target.
- **Spend.** Item 41, Inference Cost and Budget Control, owns cost; cost and energy are correlated and are not the same quantity.
- **Provider resilience and portability.** Item 44 owns it.
- **Impact outside AI use**, such as general infrastructure, unless the figure claims to include it.

**Boundary posture O — owned outright.** The boundary review records that no pack in the portfolio mentions environmental impact and that the item's validation type is not-evaluable. This document accepts that record for what a repository can establish — the correctness of an energy, emissions or water figure — and narrows it there: that a boundary, inputs, method and account are present beside a figure is a reviewable record, so R1 to R5 are `manual-review` obligations. It adds no precedent to the review's.

## Requirements

### R1 — State the boundary of every impact figure

**An impact figure MUST state its boundary.**

Two correct figures with different boundaries differ by orders of magnitude. A comparison or ratio across boundaries is not a comparison unless it says so. The requirement does not choose a boundary; it requires that the one used be written next to the figure.

### R2 — Label each input and name the method

**An impact figure MUST give the status of each input and name the method that combines them, and an unavailable input MUST be recorded as unknown and not replaced by another figure without saying so.**

A hosted model's energy is almost never measured by its user. Substituting the published figure of a similarly sized model is a defensible estimate, and the requirement is that it be called one. An unknown carried as unknown is accounting; an unknown filled with a plausible number and no label is the failure.

### R3 — Name the account of an impact figure

**An impact figure MUST name its account, and MUST NOT be presented as describing the current system when it was computed for an earlier model, period or region.**

A grid intensity varies by region and by hour, and a model identifier can change behind an alias. A figure for last year's model on last year's grid is a statement about that, not about the system now running; a directly metered figure depends on no intensity and names none, and an assumption the figure does not use is not reported.

### R4 — Support a neutrality or low-impact claim

**A project MUST NOT state or imply that its AI use is carbon-neutral, net-zero, green or low-impact unless the statement names an impact figure that meets R1 to R3 and reports any offset separately from the gross figure with what it covers.**

An offset is a claim about something else that happened elsewhere; it does not change what the operation consumed. The requirement is not that offsets be avoided; it is that the gross figure not disappear into them. It sets no threshold and does not define "low".

### R5 — Label a projection and name its assumptions

**A statement about the impact of a planned or projected use MUST be labelled a projection and MUST name every assumption it extrapolates from.**

Usage grows, models change and grids decarbonise or do not; a projection made at one volume describes that volume. Whether a projection will prove right is not a property of a repository; that it is labelled and states its assumptions is, and is what this requirement asks.

### R6 — This framework MUST NOT report environmental impact from the presence of a setting

**No detector, rule, audit finding or generated report in this framework MAY state a system's environmental impact, or that it is efficient or low-impact, because a region name, a model name, a quantisation flag, a caching layer or a declaration is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that a region string names a "low-carbon" region or that a smaller model is configured; it cannot show what the system consumed. Reporting an impact from a presence would turn a setting into a measurement.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Figure without a boundary | A per-query energy number, or a claim such as "our water use increased", that does not say whether training is included, what is counted, or whether hardware is included | R1 |
| Input without a status or a source | An input with no status; an estimate described as measured; an estimate naming no model; a "reported" input naming no source or revision or date; an unknown replaced silently; or no method named | R2 |
| Figure without its account | A figure naming no model, no period or workload, or only some of the assumptions or conversion factors it relies on; a calculated figure using a grid intensity it does not name or date; or an earlier figure presented as current | R3 |
| Claim without a supporting figure | "Carbon-neutral" or "green" naming no figure, naming a figure that fails R1 to R3, or reporting only a net figure; an offset with no stated coverage | R4 |
| Projection without label or assumptions | A forecast written as a present result, or a labelled forecast naming none, or only some, of the assumptions it extrapolates from | R5 |
| Setting read as impact | A framework report of "low-impact" because a region name or a small model is configured | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The boundary written beside each impact figure | The document or report carrying the figure | Human review |
| R2 | The method, and each input's status with, for an estimated input, its model and, for a reported input, its source and disclosure revision or date | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R3 | The account written beside each impact figure, and any current-system presentation checked against the figure's stated subject, period or workload and, where it names one, region | The report carrying the figure | Human review |
| R4 | Each claim with the impact figure it names, the evidence that figure meets R1 to R3, and the separately reported offset and what it covers | The project's documentation and public statements | Human review |
| R5 | Each projection, labelled, with its assumptions | The project's documentation | Human review |
| R6 | The absence of any detector, rule, audit finding or generated report that reports impact from a setting or presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R5 is a human-authored record. A document stating a boundary, inputs and a method establishes that the project wrote them down. Whether the figure is correct is not established by any record in a repository, and is not-evaluable; this framework cannot observe the energy a model used.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 or R2 would look for a declared boundary or method, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place to put one; both are closed. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **The subject is a quantity this framework cannot observe.** Energy and emissions are not properties of a checkout. A detector could only read a setting, which R6 forbids this framework from reporting as a result; the boundary review records the same.
3. **No rule namespace exists for it.** No shard holds an environmental namespace, and this standard mints no id; naming one is a decision for the owner. A proposed rule, if one is natural, is recorded in the pull request that introduced this document for per-rule approval, and not here.

**Validation type.** R1 to R5 are `manual-review` obligations in this release; R6 constrains this framework and has no validation type, because the thing it prohibits is a behaviour of the tool. The validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | warning |
| R2 | warning |
| R3 | warning |
| R4 | error |
| R5 | warning |
| R6 | error |

**Exemptibility.** R6 is not exemptible, for the reason R6 of [Standard 25](25-grounding-and-hallucination-control.md) is not. R4 is not exemptible, because an exception would record a project as knowingly making a claim nothing supports. R1 to R3 and R5 reach a system only where it reports a figure or a projection, and a system that makes no environmental claim of any kind records, in its own documents, that they do not reach it and why. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each impact figure, numeric or qualitative, states whether training is included, which operations are counted, and whether embodied hardware is included | An impact figure, numeric or qualitative, that states none or only some of the three parts of its boundary | A figure that states "training excluded; inference counted; retrieval, storage, networking and end-user devices excluded; embodied hardware excluded" must **not** be faulted for the narrow boundary |
| R2 | Each input has a status; an estimated input names its model; a reported input names its source and disclosure revision or date; an unavailable input is recorded as unknown; and the method is named | An input with no status, an estimate described as measured, an estimate naming no model, a reported input with no source or no revision or date, an unknown replaced silently, or no method named | A project that records its hosted model's energy as unknown and reports no figure must **not** be faulted under R2 |
| R3 | Each impact figure names its subject, its period or workload, every assumption or conversion factor it uses (with a grid intensity and its date where the calculation uses one), and is not presented as current when computed for an earlier basis | An impact figure omitting its subject, naming neither its period nor its workload, or omitting any assumption or conversion factor it uses; a grid intensity used but not named or dated; or an earlier figure presented as describing the current system | A figure that names an old model and an old period, and says so, and a directly metered figure that names no grid intensity, must **not** be faulted |
| R4 | Each claim names an impact figure that meets R1 to R3, and any offset is reported separately from the gross figure with what it covers | A claim of carbon-neutral, net-zero, green or low-impact, stated or implied, naming no figure or one that fails R1 to R3, with the gross figure absent, or an offset netted into it or with no stated coverage | A project that publishes a gross figure meeting R1 to R3 and separately lists an offset with its coverage must **not** be faulted for having one |
| R5 | Each projection is labelled as one and names every assumption it extrapolates from | A projection with no projection label, with no named assumptions, or naming only some of the assumptions it extrapolates from | A labelled projection with its assumptions must **not** be faulted for being uncertain |
| R6 | No detector, rule, audit finding or generated report in this repository states an impact verdict from presence | A detector, rule, audit finding or report that states an environmental impact, or that the system is efficient or low-impact, because a region name, model name, quantisation flag, caching layer or declaration is present | Reporting that a region setting was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries one, so R1 to R5 are enforced by review or not at all, and R6 holds today only because no such detector exists. The falsifiers in the table are available for manual review; what this release lacks is a detector that applies them. A record made stale by the event in the staleness table below does not satisfy the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made. A figure for a completed period stays a true statement about that period after a prospective change, and is stale only where it is presented as current; a retrospective correction of the disclosure it rests on invalidates the figure itself.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | A change of what the figure counts. |
| R2 | A change of provider disclosure for the period the figure covers. |
| R3 | A change of model, provider, region or hosting arrangement, for a figure presented as current. |
| R4 | A change of the figure the claim names. |
| R5 | A change of volume, model, grid or any other assumption the projection extrapolates from. |
| R6 | A new detector, rule or report that touches environmental impact. |

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes two words, "environmental impact", inside a bullet of four subjects and states no requirement, level or evidence for them. The item is class `D` because its subject token is derived from the brief; the requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1 to R5 in full**, with the defined terms impact figure, boundary, inputs and account, the four-way input status, the rule that an unavailable input is recorded as unknown, the ban on presenting an earlier figure as current, and the offset-reporting rule.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in [Standard 25](25-grounding-and-hallucination-control.md) and [Standard 33](33-ai-observability.md).
- **That this standard sets no target, threshold or method**, and the exclusions in Scope as division lines, which no one has confirmed.
- **The severity assignments** (one level per requirement, in Validation), the statement that no attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the decision to name no rule id.

Not authored here: the posture, and the observation that the item is not-evaluable, are the boundary review's.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) lists the subjects this pack owns and the packs that own the others; the boundary review records that no pack in the portfolio mentions environmental impact, so this item has no counterpart to defer to or crosswalk. [Standard 33](33-ai-observability.md) governs what a call record carries; R2 and R3 here depend on that record for the model that served a call and do not restate it. Item 41, Inference Cost and Budget Control, governs spend. [Standard 1](01-ai-system-manifest.md) declares models and declares no environmental field; none is proposed by this standard. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and non-lowering language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests section answers. Items 41 and 44 are not part of this change. **Outside this pack.** No adjacent pack's standard is recorded for this subject. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` has a concept of environmental impact, energy or emissions. |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 to R3 | A place to declare a boundary, inputs and account: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R4, R5 | A check that a published claim names its figure, or that a projection is labelled | Reading intent from free text is a heuristic, and a false positive teaches a project to write whatever passes |
| R6 | A test asserting no detector, rule, audit finding or report emits an impact verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system's environmental impact, or that it is efficient or low-impact, from the presence of a region name, a model name, a quantisation flag or a declaration. R6 forecloses it, and the foreclosure is the point: a presence is not a measurement.
