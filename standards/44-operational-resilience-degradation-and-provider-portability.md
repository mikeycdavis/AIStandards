# Standard 44 — Operational Resilience, Degradation, and Provider Portability

A system that calls a hosted model has taken on a dependency it cannot repair. The provider can be
slow, unavailable, rate-limited, deprecated, repriced or changed behind a name. A conventional service
fails in ways its operators can usually reach into. An AI system's most important component fails in a
place they cannot, and a failure is not always an error: a fallback that quietly answers from a weaker
model is a response that looks like any other.

Three things are routinely run together, and this standard keeps them apart. **Resilience** is what the
system does when a dependency misbehaves. **Degradation** is the reduced service it chooses to give
instead of none, and whether anyone is told. **Portability** is whether the dependency can be replaced,
and at what cost. A project can have a fallback and no portability, or an adapter layer that has never
carried a second provider; each is a different claim.

The failure this standard is written against is resilience asserted from the presence of an
arrangement: a fallback model named in a configuration, an adapter interface with one implementation, a
"multi-provider" line in a design document. None of those says what happened the last time the primary
failed, or that anyone has run the path.

Source: item 44 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "operational resilience" token of the "Cost, latency, environmental impact, and
operational resilience" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 44 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **X**, `CONFIRMED`
> in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json), whose substantive half is
> human judgment and carries `humanSignOff: null`. **This document records no human sign-off and claims
> none**; the posture is a unilateral judgment that no maintainer of any adjacent pack has confirmed.
>
> **The brief supplies two words and this standard supplies the rest.** The brief's bullet names
> "operational resilience" and states no requirement for it. The title's "degradation" and "provider
> portability" are the specification's, not the brief's. The item is class `D` because its token is the
> brief's own; the requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it — a repository that invokes a model, retrieves context for one, or acts on a model's output — that depends on a model, a provider, a retrieval store or a tool service it does not itself operate, or that operates a model or other AI-specific service whose host can fail.

Covers: knowing each dependency and what happens under each condition; the degraded mode and its signal; what a fallback must not do; keeping provider-specific behaviour behind an abstraction; exercising the arrangements; and the limit of what this framework can say about any of it.

Terms, each defined once here and used verbatim below:

- **Dependency** — a service or host whose failure or change alters what the system produces and that is either external to the project, or is a model host or other AI-specific service the project operates: a model endpoint or the host a self-served model runs on, an embedding service, a vector store, a tool API, a moderation service. The project's ordinary infrastructure is not a dependency in this sense.
- **Condition** — one of: unavailable, slow, rate-limited, changed.
- **Degraded mode** — a defined, reduced service the system gives under a condition, which may be to decline.
- **Fallback** — a model, provider or path the system uses when its primary path is in a condition.
- **Exercise** — a test, a drill or an observed real event in which a degraded mode or fallback ran, with its date and result.

It does **not** cover, and claims none of the ground of:

- **Ordinary service reliability** — availability targets, redundancy of the project's own infrastructure, backup — which is general engineering.
- **Rolling a release back.** Item 32 owns reverting a change this project made; a dependency failing is not a project change.
- **Time and spend.** Item 42 owns latency budgets and item 41 owns cost; a timeout is a condition trigger here and a budget there.
- **Responding to an incident**, which is item 34's.

**Boundary posture X — owned canonically here, with a precedent.** The boundary review upholds the plan's recommendation to claim the item and records one precedent, only this: EngineeringStandards, `standards/01-human-and-ai-operability.md`, rule `ai.provider-neutral` (required level, severity `error`, validation type `code-analysis`, not non-exemptible; description: model providers sit behind an abstraction so capabilities remain stable when the model changes). This standard crosswalks to it for R4 only, as a **semantic** correspondence and never as a reuse of its id; [Standard 7](07-boundary-with-adjacent-standards.md) R3 lists `cost.provider-portable` as the later-phase id for it, which is neither minted nor claimed here. The precedent was read at EngineeringStandards `3b1b18d` on 2026-10-14. That standard's own text says application domain logic **SHOULD NOT** depend directly on a specific provider while the rule record has level `required` and severity `error`; the difference is observed and not resolved here, and which governs is that pack's to say. **No human sign-off is recorded or claimed**: `humanSignOff` is `null`.

## Requirements

### R1 — Record each dependency's behaviour under each condition

**The project MUST record, for each dependency, what the system does under each condition.**

A dependency not enumerated is a failure nobody planned for. The record is a document, not a manifest field: `schemas/ai-system-manifest.schema.json` is closed and declares `models`, `tools` and `dataSources`, but not failure behaviour. [Standard 1](01-ai-system-manifest.md) declares the models; this requirement adds what happens when one is in a condition.

### R2 — Make each reduced service a signalled degraded mode

**Each behaviour recorded under R1 that gives reduced service MUST be a degraded mode, and a response produced in a degraded mode MUST carry a signal that a full response does not.**

A fallback to a smaller model, a retrieval step that returned nothing, a tool that timed out and was skipped each produce a response of the usual shape; if the difference is only in a trace nobody reads, the user and the downstream process cannot discount it. What the signal is *named* is the project's choice. Where the degraded system would otherwise act, an unavailable, timed-out or indeterminate approval mechanism does not proceed; that is [Standard 45](45-approval-gates.md) R6's subject and is not restated.

### R3 — Keep the primary path's controls on a fallback

**A fallback MUST NOT serve an interaction without the controls the primary path applies, and the system MUST decline instead.**

A fallback is a second path through the system and the one least reviewed: a secondary provider not under the first's data-handling arrangement, a model not behind the output check, a path that skips redaction "because it is only for outages". That the substitution happened is [Standard 33](33-ai-observability.md) R2's subject; this requirement concerns what the substitute is allowed to do.

### R4 — Keep provider-specific behaviour behind an abstraction

**Provider-specific behaviour SHOULD sit at an integration boundary behind an abstraction.**

This is the requirement the EngineeringStandards precedent corresponds to, written at SHOULD because that standard's text is. A provider SDK imported inside a domain module is the signal it exists to catch. An interface with one implementation is a plan, not portability, and nothing here asks a project to claim otherwise.

### R5 — Exercise each degraded mode and fallback, and keep the result current

**Each degraded mode and each fallback MUST be exercised with its date and result recorded and an interval stated, and MUST NOT be described as available unless its latest exercise succeeded within that interval and postdates the latest change to the path.**

A fallback that has never run has an unknown failure rate, and the usual way to find it out is the outage it was written for. The interval is the project's choice; an exercise that ran before a change to the path says nothing about the path as it now is.

### R6 — This framework MUST NOT report resilience or portability from the presence of an arrangement

**No detector, rule, audit finding or generated report in this framework MAY state that a system is resilient, degrades safely or is provider-portable because a fallback setting, a second provider name, a retry policy or an adapter interface is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that a fallback model is named or that an interface exists; it cannot show that the fallback is reachable, that it carries the controls, or that a second implementation would work. A fallback is shown by a request it served, which is R5's record and not the framework's to infer.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Dependency without a recorded behaviour | A retrieval or moderation service, or a self-hosted model's host, with no record under one or more conditions; or "whatever the HTTP client's default does" | R1 |
| Reduced service without a signal | A response from a weaker model, or with no retrieved context, returned in the usual form; or a reduced behaviour recorded under R1 that is not a defined degraded mode | R2 |
| Fallback outside the controls | A fallback that serves an interaction without redaction, output check or logging that the primary path applies | R3 |
| Provider behaviour in domain logic | A provider SDK call or a provider-specific request shape embedded in domain logic | R4 |
| Path without a current exercise | A fallback that has never run, whose latest exercise failed, is overdue, or predates a change to the path, and is still described as available; or an exercise record with no result or interval | R5 |
| Arrangement read as resilience | A framework report of "resilient" because a fallback model is configured | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | Each dependency and its behaviour under each of the four conditions | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | Each degraded mode and, for one that produces a response, the field, header or shape that carries its signal; for a mode that declines, the record that it declines | The project's output contract and a captured example | Human review |
| R3 | The primary path's controls and, for each, where it applies on the fallback path, or the record that the request is declined before the fallback can serve it | Project code, configuration and data-handling terms | Human review |
| R4 | Where provider-specific calls and request shapes sit, and the abstraction in front of them | Project code and documentation | Human review |
| R5 | The date, result and stated interval of each exercise and, for a path described as available, the date of the latest change to the path | Test records, drill records or incident records | Human review |
| R6 | The absence of any detector, rule, audit finding or generated report that reports resilience from a presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R5 is a human-authored record. A document naming a fallback establishes that the project wrote it down and says nothing about whether the running system takes it; the reviewer reads what is claimed against the code, configuration and records that would carry it out.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 or R2 would look for a declared dependency inventory or degraded mode, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place to put one; both are closed. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **R2, R3 and R5 concern behaviour and records, not files.** Whether a degraded response is signalled on the path a request takes, whether a fallback is behind the controls, and whether it ever ran are not properties of a checkout. A detector would test for the presence of a setting, which R6 forbids this framework from reporting as a result.
3. **The crosswalked rule's id is not this standard's to mint here.** [Standard 7](07-boundary-with-adjacent-standards.md) R3 lists `cost.provider-portable` as the later-phase id corresponding to `ai.provider-neutral`; no `cost` shard exists and this standard adds none, so that id is neither minted nor claimed. Whether R4 becomes a rule under that id is the owner's decision; a proposal, if one is natural, is recorded in the pull request that introduced this document for per-rule approval.

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

**Exemptibility.** R6 is not exemptible, for the reason R6 of [Standard 25](25-grounding-and-hallucination-control.md) is not. R3 admits no exception and is met by declining. R1, R2, R4 and R5 reach a system only where its dependencies and fallbacks exist, and a system without that subject records, in its own documents, that the requirement does not reach it and why. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each dependency has a recorded behaviour under each of unavailable, slow, rate-limited and changed | A dependency in use with no record, or a record that omits any of the four conditions | A record stating that the behaviour under each condition is to decline is a complete R1 record and must **not** be faulted |
| R2 | Each reduced-service behaviour in the R1 record is a defined degraded mode, and a degraded response carries a signal that a full response does not | A reduced-service behaviour not defined as a degraded mode, or a degraded response that carries no signal that a full response does not | A declined outcome that is itself distinguishable from a full response satisfies R2, and must **not** be faulted for lacking a further marker |
| R3 | A request served by a fallback passes through every control the primary path applies, or is declined | A fallback serving an interaction without a control the primary path applies | A fallback behind the same controls must **not** be faulted for being a different model |
| R4 | Provider-specific calls and request shapes sit at an integration boundary behind an interface | Provider-specific behaviour embedded in domain logic | A provider SDK used only inside the adapter or integration module must **not** be faulted |
| R5 | Each degraded mode and fallback has a dated exercise record with a result and a stated interval; and it is not described as available unless the latest exercise succeeded within the interval and postdates the latest change to the path | A degraded mode or fallback with no exercise, no result or no stated interval; or one described as available whose latest exercise failed, is overdue, or predates a change to the path | A path not described as available, and a degraded mode exercised only in a test and recorded as such, must **not** be faulted for lacking a production use |
| R6 | No detector, rule, audit finding or generated report in this repository states a resilience verdict from presence | A detector, rule, audit finding or report that states a system resilient, degrading safely or provider-portable because a fallback setting, second provider name, retry policy or adapter interface is present | Reporting that a fallback setting was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries one, so R1 to R5 are enforced by review or not at all, and R6 holds today only because no such detector exists. The falsifiers in the table are available for manual review; what this release lacks is a detector that applies them. A record made stale by the event in the staleness table below does not satisfy the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made. An exercise that ran before a change describes the earlier path.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | The addition of a dependency, a change in what a dependency returns or in its terms, or a change to the system's own behaviour under a condition. |
| R2 | A change of the model or provider that produces the response, or of the degraded-mode routing or the response contract. |
| R3 | A change to the controls on the primary path, to the fallback policy, or to the fallback provider or its terms. |
| R4 | A change of provider or of the integration boundary. |
| R5 | For a path described as available, any change to the path since its latest exercise: a model, provider, terms, primary-path control or fallback policy. |
| R6 | A new detector, rule or report that touches resilience. |

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes two words, "operational resilience", inside a bullet of four subjects and states no requirement, level or evidence for them, and the specification's title adds "degradation" and "provider portability". The item is class `D` because its subject token is derived from the brief; the requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1 to R5 in full**, with the defined terms dependency, condition, degraded mode, fallback and exercise, the four conditions, the ruling that a reduced response must be signalled, that a fallback must not weaken the primary path's controls, and that an exercise must postdate the latest change to the path.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in [Standard 25](25-grounding-and-hallucination-control.md) and [Standard 33](33-ai-observability.md).
- **The exclusions in Scope** as division lines; where this standard stops and items 32, 34, 41 and 42 begin is unconfirmed by anyone. **The recheck of the precedent** at EngineeringStandards `3b1b18d` on 2026-10-14, including the observed difference in level between that standard's text and its rule record, which the boundary review did not make.
- **The severity assignments** (one level per requirement, in Validation), the statement that no attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the decision to name no rule id.

Not authored here: the classification of `ai.provider-neutral` as a precedent and the posture itself are the boundary review's, and its `humanSignOff` is `null`.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) R3 records the crosswalk between `cost.provider-portable` (a later-phase id, neither minted nor claimed here) and EngineeringStandards' `ai.provider-neutral`; it is a correspondence of subject, not of id. [Standard 45](45-approval-gates.md) R6 requires an approval mechanism to fail closed; R2 here defers to it for any degraded mode that would otherwise act. [Standard 33](33-ai-observability.md) R2 and R3 govern the record of which subject served a call and of outcomes that are not success; R2 and R3 here rely on them and do not restate them. [Standard 23](23-agent-execution-security.md) governs the controls on agent execution that a fallback path must also carry (R3). [Standard 1](01-ai-system-manifest.md) declares models, tools and data sources and does not declare failure behaviour; no field is proposed by this standard. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and non-lowering language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests section answers. Items 32, 34, 41 and 42 are not part of this change. **Outside this pack.** EngineeringStandards' `ai.provider-neutral` is named in Scope with what the boundary review recorded about it; it is a crosswalk to R4 only, and no maintainer of that pack has confirmed the reading. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` emits a verdict about model, provider or dependency fallback, degradation or portability. |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1, R2 | A place to declare dependencies and degraded modes: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R3, R5 | Fixtures with a fallback served and a control applied, and a detector that runs project-supplied checks | Phase 3 detector and evidence-availability work |
| R4 | A detector for provider SDK use inside domain modules, and the rule id that would carry it | Language-specific, and the id is `cost.provider-portable` per Standard 7 R3, and whether and when it is minted is the owner's decision; it would report a presence unless it also read a recorded abstraction |
| R6 | A test asserting no detector, rule, audit finding or report emits a resilience verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system resilient, degrading safely or provider-portable from the presence of a fallback setting, a second provider name, a retry policy or an adapter interface. R6 forecloses it, and the foreclosure is the point: an arrangement is not an effect.
