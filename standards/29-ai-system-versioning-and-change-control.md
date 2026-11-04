# Standard 29 — AI System Versioning and Change Control

An AI system changes in more places than its code. The model behind an endpoint can be re-pointed by
its provider, a prompt can be edited in a console, a tool definition can gain a parameter, a retrieval
setting can be tuned, an output check can be loosened. Each of these changes what the system does for
a user, usually by more than a code change does, and most of them never pass through the review that a
code change does. When behaviour shifts, the first question is what changed, and a project that cannot
answer it from a record cannot tell a regression from a fluctuation, a fault from a decision, or its
own change from someone else's.

This standard is about the **record and the path**, not the policy. It asks that the parts of an AI
system that determine its behaviour carry versions, that each release name the versions it is made of,
that a change to any of them be recorded before it takes effect, that a change made upstream be treated
as a change, and that what is deployed be the thing the record says. It does not say how often to
release, who must approve, or what a version scheme looks like.

The failure this standard is written against is "we didn't change anything": a system whose behaviour
moved, whose owners have no record of what it was made of last week, and who therefore cannot say
whether they changed it.

Source: item 29 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "versioning" token of the "Reproducibility, versioning, model/data lineage, and
rollback" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 29 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) as an item for which the review
> searched the nine adjacent packs for an owner and found none, and that review's substantive half is
> human judgment and carries `humanSignOff: null`. No maintainer of any adjacent pack has confirmed it.
>
> **The brief supplies one word and this standard supplies the rest.** The brief's bullet names
> "versioning" among three other subjects and states no requirement, level or evidence for it. The item
> is class `D` because its token is the brief's own; the requirements are this repository's judgment
> about it, and the [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it — a repository that invokes a model, retrieves context for one, or acts on a model's output — that a project releases to users or to other systems.

Covers: which components of the system carry a version; the record of what a release is made of; the record of a change before it takes effect; changes made by someone else to a component the project depends on; whether the deployed system is the recorded one; and the limit of what this framework can say about any of it.

Terms, each defined once here and used verbatim below:

- **Behaviour-determining component** — any of: a model, the instructions given to it, a tool definition it can call, its generation parameters, the retrieval configuration (not the corpus content), and the configuration of an input or output control applied around it.
- **Version identifier** — a value that names one content of a component. The same identifier never names two contents, and a change of content gives a new identifier. A reference the owner of the component can re-point, such as a provider's model alias, is a version identifier only where the record also names what it resolved to and when.
- **Release** — a set of behaviour-determining components, each at a named version identifier, put in front of users or other systems.
- **Release record** — a record naming a release's components and their version identifiers, and the date from which it was in effect.
- **Change** — any difference in the content of a behaviour-determining component between one release and the next, whoever makes it.
- **Change record** — a record of one change: the component, the old and new version identifiers, the reason, who or what authorised it, and the checks run on it with their results, or the statement that none were run.

It does **not** cover, and claims none of the ground of:

- **Reverting a release.** Item 32, Rollback and Recovery, owns it; this standard requires the record a rollback would need and does not require that one be possible.
- **Lineage of models and data.** Item 30, Model and Prompt Lineage, owns where a component came from.
- **Reproducibility.** Item 31 owns whether a run can be repeated. MachineLearningStandards owns it for trained models and, per [Standard 7](07-boundary-with-adjacent-standards.md), dataset provenance and versioning; this standard does not version datasets or corpus content.
- **Whether a change is good.** Items 17 and 20 own evaluating a model or prompt change; R3 requires that a change record say which checks were run and does not set which.
- **Approval of model-initiated actions**, which [Standard 45](45-approval-gates.md) owns, and which is a different subject from a human change to the system.
- **Source-code version control** of the project's ordinary code, which is general engineering.

**Boundary posture O — owned outright.** The boundary review lists this item among those for which no pack in the portfolio was found to own the subject. This document accepts that record for what a repository can establish — the correctness of a version scheme, the truth of a release record, or that a check was adequate — and narrows it there: that a version identifier, a release record and a change record exist and agree is a reviewable record, so R1 to R5 are `manual-review` obligations. It also records two limits the review does not: Standard 7 gives MachineLearningStandards dataset versioning and reproducibility, which are excluded above, and the catalog already holds two rules on the slice of this subject a checkout shows (see Implementation). It adds no precedent to the review's.

## Requirements

### R1 — Give each behaviour-determining component a version identifier

**Each behaviour-determining component of a released system MUST have a version identifier, and a change to its content MUST give it a new one.**

A version that does not move when the content moves is a label, not a version. The requirement does not choose a scheme: a content hash, a tag, a date and a number all serve, so long as one identifier names one content. A model reached through a re-pointable alias has no version identifier of its own until the record names what the alias resolved to.

### R2 — Record what each release is made of

**Each release MUST have a release record, and for any period the system was in service the project MUST be able to name the release record in effect.**

The question after a behaviour shift is which release was serving at the time. A record that lists current components only cannot answer it a week later. The requirement does not say where the record lives or how it is produced; it says that one exists for each release and that periods map to records. What a call record carries about the model that served it is [Standard 33](33-ai-observability.md)'s, and the record there and the record here are meant to be joined, not duplicated.

### R3 — Record a change before it takes effect

**A change to a behaviour-determining component MUST NOT take effect in a release until a change record for it exists.**

A change record is not an approval workflow. It says what changed, why, on whose authority, and what was checked, including "nothing was checked", which is a legitimate entry and a different one from no entry. The requirement does not say who must authorise or what must be checked; it requires that the record exist before the change, so that it is not reconstructed from memory after the shift. A record naming a reviewer, an approval or a check that did not happen is not a change record.

### R4 — Treat an upstream change as a change

**When a component the project does not control changes its content, or is observed or announced to, the project MUST make a change record for the affected release no later than the next release record, and MUST NOT leave the earlier release record describing it as unchanged.**

A provider re-pointing an alias, retiring a model or revising a hosted tool changes the project's system without any act by the project. The requirement is not that the project prevent it, and not that it detect every such change; it is that once the change is known, whether by notice, by an observed difference or by resolving the alias again, it is recorded as a change and its checks (or the lack of them) are stated, as in R3.

### R5 — Keep what is deployed equal to what is recorded

**The components in a deployed system MUST match the release record in effect, and a difference MUST be corrected or recorded as a change under R3, not left as it is.**

A prompt edited in a hosting console, a flag flipped on a running service or a model identifier overridden by an environment variable produces a system no release record describes. The requirement does not forbid emergency changes; it forbids their being invisible. A reviewer compares the record to the deployed values.

### R6 — This framework MUST NOT report change control from the presence of an artifact

**No detector, rule, audit finding or generated report in this framework MAY state that a system is version-controlled, change-controlled, reproducible or release-managed because a pinned identifier, a prompt file, a lockfile, a tag, a changelog or a declaration is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that a model identifier names a dated version or that a prompt lives in a file; it cannot show that a release record exists for each release, that a change record preceded each change, or that the deployed system is the one in the repository. Reporting change control from a presence would turn a file into a process. Reporting that a recognised moving alias was *found* is an observation and is permitted.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Component without a version | A prompt, tool definition or control configuration with no identifier; an identifier that does not change when the content does; a provider alias treated as a version with no record of what it resolved to | R1 |
| Release without a record | A system serving users for which no record names its components, or a period for which no record can be named | R2 |
| Change without a record | A prompt, model, tool or parameter changed in a release with no record of what changed, why or on whose authority; a record written after the change; or a record claiming a check that was not run | R3 |
| Upstream change recorded as no change | A provider retires or re-points a model and the release record continues to describe the earlier one | R4 |
| Deployed system differs from the record | A hot-edited prompt, an override of a recorded parameter, or a model identifier supplied by the environment that differs from the release record | R5 |
| Presence read as control | A framework report of "version-controlled" because a pinned model identifier is declared | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | Each behaviour-determining component with its version identifier and, for a re-pointable reference, what it resolved to and when | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | The release records, and for a sampled period, the record the project names as in effect | The project's release records | Human review |
| R3 | Each change record, with the date it was made set against the date the change took effect | The project's change records and the history of the change | Human review |
| R4 | Each known upstream change, the date it became known, and the change record made for it | The project's change records and provider notices it names | Human review |
| R5 | The deployed values of each component, compared with the release record in effect | The deployed system's configuration and the release record | Human review |
| R6 | The absence of any detector, rule, audit finding or generated report that reports change control from a presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R5 is a human-authored record. A document naming versions establishes that the project wrote them down; whether the running system is made of them is established only by comparing the record with the deployed values, which this framework cannot observe.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 to R4 would look for a version identifier, a release record or a change record, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place to put one; both are closed. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **R3, R4 and R5 concern a process and a deployment, not files.** Whether a record preceded a change, whether an upstream change was recorded, and whether the deployed values equal the recorded ones are not properties of a checkout. A detector would test for a presence, which R6 forbids this framework from reporting as a result.
3. **The slice a checkout does show already has a rule, and a second one here would fork it.** `lifecycle.model-version-pinned` (Standard 1) recognises moving model aliases in the manifest, and `promptsec.prompt-is-versioned-artifact` (Standard 21) recognises inline prompt literals; both are `assurance: partial` and a clean result is not-evaluated. [Standard 7](07-boundary-with-adjacent-standards.md) R2 forbids restating a control in local words, and this standard mints no id. Whether any further rule belongs under this item is the owner's decision; a proposal, if one is natural, is recorded in the pull request that introduced this document for per-rule approval.

**Validation type.** R1 to R5 are `manual-review` obligations in this release; R6 constrains this framework and has no validation type, because the thing it prohibits is a behaviour of the tool. The validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | warning |
| R2 | error |
| R3 | error |
| R4 | warning |
| R5 | error |
| R6 | error |

**Exemptibility.** R6 is not exemptible, for the reason R6 of [Standard 25](25-grounding-and-hallucination-control.md) is not. R1 to R5 reach any released system, since every such system has at least a model. A system not yet released records, in its own documents, that they do not reach it yet and what release will bring them in. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each behaviour-determining component has a version identifier that differs between two contents; a re-pointable reference has a record of what it resolved to and when | A component with no identifier; an identifier shared by two different contents; or a re-pointable reference with no record of its resolution | A component identified by a content hash or a date, and a model named by a dated identifier, must **not** be faulted for the scheme chosen |
| R2 | Each release has a release record naming each component's version identifier and its in-effect date, and a sampled past date maps to one record | A release with no record; a record omitting a component or an identifier; or a past date in service that maps to no record | A record that lists a component unchanged since the previous release must **not** be faulted for repeating it |
| R3 | Each change has a change record dated before the change took effect, naming the component, old and new identifiers, reason, authority and checks run or none | A change with no record, a record dated after the change took effect, or a record claiming a reviewer or check that did not occur | A record stating that no checks were run is a complete record and must **not** be faulted for the absence of checks |
| R4 | Each upstream change the project knows of has a change record no later than the next release record, and the earlier record is not left describing the component as unchanged | A known upstream change with no change record by the next release record, or a release record describing as unchanged a component the project knows changed | A project that records an upstream change it could not check, and says so, must **not** be faulted for not having prevented it |
| R5 | The deployed values of each component equal the release record in effect, or a change record exists for the difference | A deployed component whose value differs from the record in effect with no change record and no correction | An emergency change made directly to the deployed system and recorded as a change under R3 afterwards, with the date, must **not** be faulted under R5 for having been made |
| R6 | No detector, rule, audit finding or generated report in this repository states that a system is version-controlled, change-controlled, reproducible or release-managed from presence | A detector, rule, audit finding or report that states any of these because a pinned identifier, prompt file, lockfile, tag, changelog or declaration is present | Reporting that a recognised moving alias was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries one, so R1 to R5 are enforced by review or not at all, and R6 holds today only because no such detector exists. The falsifiers in the table are available for manual review; what this release lacks is a detector that applies them. A record made stale by the event in the staleness table below does not satisfy the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made. A release record for a past period stays a true statement about that period, and is stale only where it is offered as the record in effect now.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | Any change to anything this record names or relies on, including: a change of content of a component without a new identifier, or a change of what a re-pointable reference resolves to. |
| R2 | Any change to anything this record names or relies on, including: a release, for a record offered as the one in effect. |
| R3 | Any change to anything this record names or relies on, including: a further change to the same component after the record was made. |
| R4 | Any change to anything this record names or relies on, including: a further upstream change to the same component, or a change of what the project learns about the earlier one. |
| R5 | Any change to anything this record names or relies on, including: any deployment since the comparison was made. |
| R6 | A new detector, rule or report that touches versioning or change control. |

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one word, "versioning", inside a bullet of four subjects and states no requirement, level or evidence for it. The item is class `D` because its subject token is derived from the brief; the requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1 to R5 in full**, with the defined terms behaviour-determining component, version identifier, release, release record, change and change record, the list of components, the rule that a re-pointable reference is a version identifier only with its resolution recorded, the ruling that a change record precedes the change, that an upstream change is a change, and that the deployed system must equal the record.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in [Standard 25](25-grounding-and-hallucination-control.md) and [Standard 33](33-ai-observability.md).
- **That this standard sets no scheme, cadence or approver**, and the exclusions in Scope as division lines (including the exclusion of dataset and corpus versioning and the boundary with items 30, 31 and 32), which no one has confirmed.
- **The severity assignments** (one level per requirement, in Validation), the statement that no attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the decision to name no rule id.

Not authored here: the posture, and the record that no owner was found, are the boundary review's.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) lists the subjects this pack owns and the packs that own the others; the boundary review records this item as one for which no owner was found, and Standard 7 R1 gives MachineLearningStandards dataset versioning and reproducibility, which this standard excludes and does not restate. [Standard 1](01-ai-system-manifest.md) declares models and R4 there carries `lifecycle.model-version-pinned`; R1 here depends on that identifier for a model and does not restate it. [Standard 21](21-prompt-and-instruction-security.md) carries `promptsec.prompt-is-versioned-artifact`, which is the checkout-visible part of R1 for instructions. [Standard 33](33-ai-observability.md) governs what a call record carries; R2 here relies on it to join a call to a release and does not restate it. [Standard 45](45-approval-gates.md) governs approval of model-initiated actions and is a different subject from R3. Items 17 and 20 govern evaluating a change, and items 30, 31 and 32 govern lineage, reproducibility and rollback; none is part of this change. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and non-lowering language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests section answers. **Outside this pack.** No adjacent pack's standard is recorded as owning this subject; MachineLearningStandards `04-dataset-versioning.md` is named in Standard 7 and in the boundary review for datasets, and is not claimed or restated. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced as a whole; R6 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R1 (part) | `lifecycle.model-version-pinned` (Standard 1, required, error, `configuration`, `assurance: partial`) recognises moving aliases among model identifiers in the manifest; a match fails and a clean result reports not-evaluated, never passed. `promptsec.prompt-is-versioned-artifact` (Standard 21, required, error, `code-analysis`, `assurance: partial`) recognises inline prompt literals under the same rule. Neither reads a release record or a change record, and neither covers tools, parameters, retrieval configuration or control configuration |
| R6 | **Holds today because no detector states a change-control verdict from a presence; nothing prevents or tests one being added.** The two rules above report a *found* moving alias or inline literal as a failure and a clean result as not-evaluated; neither states that a system is version-controlled. No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` has a concept of a release record, a change record or a deployment comparison |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 to R4 | A place to declare version identifiers, release records and change records: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R5 | A comparison of deployed values with a release record | The deployed system is not in the repository; it needs an evidence source and the Phase 3 detector work |
| R6 | A test asserting no detector, rule, audit finding or report emits a change-control verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system version-controlled, change-controlled, reproducible or release-managed from the presence of a pinned identifier, a prompt file, a lockfile, a tag, a changelog or a declaration. R6 forecloses it, and the foreclosure is the point: a presence is not a process.
