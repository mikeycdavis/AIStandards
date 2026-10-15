# Standard 42 — Latency Budgets for AI Interactions

A model call has no fixed duration. Its time depends on the prompt length, the length of the answer the
model chooses to give, the provider's load, and whether the call was retried or fell back along the
way. A conventional service can be given a latency target and tested against it; an AI interaction
usually cannot be tested to a single number, because the same request legitimately takes two seconds
once and forty the next.

Three things are routinely run together, and this standard keeps them apart. A **latency budget** is a
time someone chose for an interaction. A **timeout** is a limit on one call that ends the wait. And a
**measurement** is what a stated workload was observed to take. A timeout setting is not a budget, and a
budget nobody measured is a wish.

The failure this standard is written against is latency asserted from the presence of a setting: a
timeout argument on the client, a "fast" model named in the configuration, a streaming flag. None of
those says what a user waited, for which fraction of requests, or what the system did when the wait ran
out.

Source: item 42 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "latency" token of the "Cost, latency, environmental impact, and operational
resilience" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 42 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) as an owned item with one noted
> adjacency, and that review's substantive half is human judgment and carries `humanSignOff: null`. No
> maintainer of any adjacent pack has confirmed it.
>
> **The brief supplies one word and this standard supplies the rest.** The brief's bullet names
> "latency" and states no requirement for it. The item is class `D` because its token is the brief's own;
> the requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it — a repository that invokes a model, retrieves context for one, or acts on a model's output — where a person or another system waits on the result of a model call, whether the wait is on the whole answer or on its first part.

Covers: stating a latency budget; limiting every model call and giving a retrying interaction a deadline; what a reported latency figure must name; what a latency claim must name; and the limit of what this framework can say about any of it.

Terms, each defined once here and used verbatim below:

- **Interaction** — one wait that someone experiences or depends on: a chat turn, a completion behind an API, a background job's step; a multi-call workflow is one interaction if a single party waits on all of it.
- **Budget** — an objective someone chose for an interaction: a point of measurement (first token or byte, or complete answer) and a percentile or fraction of requests.
- **Call limit** — a time limit on one model call that a person or process waits on.
- **Interaction deadline** — a hard limit on the whole interaction, stated separately from any budget.
- **Latency figure** — an aggregate figure offered as evidence of how an interaction performs: a percentile, a mean, a proportion within a threshold or a distribution. Its fields are: interaction, point of measurement, statistic, sample count, collection period, model identifier and prompt revision, provider, region and service tier, and workload.

It does **not** cover, and claims none of the ground of:

- **Perceived interface performance.** UIUXDesignStandards' `standards/19-performance-as-ux.md` and its rule `performance.budgets-testable` are recorded by the boundary review as an adjacency, not a precedent, and are not claimed here.
- **Spend.** Item 41, Inference Cost and Budget Control, owns it; a retry or fallback is a multiplier of cost as it is of time.
- **Agent loop bounds.** [Standard 23](23-agent-execution-security.md) R1 bounds an agent's steps.
- **Provider portability and degradation.** Item 44 owns operational resilience.

**Boundary posture O — owned outright.** The review records no precedent in another pack for inference latency and one adjacency, above. That entry was read in the sibling checkout of UIUXDesignStandards at `7bff2e9`: the file exists, and `performance.budgets-testable` is in its rules and catalog. Its R1 prescribes no universal millisecond threshold; this standard follows that and sets none.

## Requirements

### R1 — State a budget over a named interaction, point and percentile or fraction

**A latency budget MUST name its interaction, its point of measurement, and its percentile or fraction of requests.**

Time to first token and time to a complete answer are different waits, and a mean hides the tail where the complaints are. The requirement fixes no number: what is acceptable is the project's judgment about its users. A budget is an objective: it survives a change of provider or model and is what a new deployment is then measured against.

### R2 — Limit every model call in time

**Every model call that a person or process waits on MUST have a call limit, recorded with where in the call path it is applied and with the behaviour when it is reached.**

A call without a limit has no latency budget, only a hope. The behaviours differ in what they cost the user and the project chooses: a partial answer marked as partial, a fallback, a failure with a message, queued work; the requirement is that one is defined and is not "wait". A percentile or fraction objective is not an event inside one request and has no per-request behaviour to define.

### R3 — Give a retrying interaction a deadline

**An interaction that retries or falls back MUST have an interaction deadline, and MUST NOT start an attempt whose call limit exceeds the time left in it.**

A budget leaves no "remaining time" for one request to consume, so a retrying interaction needs a limit of its own. A call limit of ten seconds with three attempts is a thirty-second interaction that nobody declared. That a different model answered is [Standard 33](33-ai-observability.md) R2's subject; the bound on the count of retries is item 41's.

### R4 — Name the fields of a latency figure

**A reported latency figure MUST name every field of a latency figure, and where it spans more than one deployment MUST name each with its share, and MUST NOT present a figure measured on another path as a measurement of the path users take.**

A figure moves when the model, the prompt, the provider's load or the output length does. A benchmark on short prompts against an idle provider describes a system nobody uses; reported as such, with its workload named, it is a legitimate figure about that benchmark. A per-call duration in a trace record ([Standard 33](33-ai-observability.md) R1) is an observation, not a latency figure.

### R5 — Support a latency claim with a figure that meets the budget

**A claim that an interaction is real-time, instant or within budget MUST name its budget and a latency figure that meets that budget for the same interaction, point of measurement and statistic, on the workload and path the claim is about.**

This requirement sets no threshold and prescribes no universal figure. A claim about production traffic is not supported by a figure measured on a different workload or path, and a measurement of a different interaction or statistic does not support a budget.

### R6 — This framework MUST NOT report latency met from the presence of a setting

**No detector, rule, audit finding or generated report in this framework MAY state that a system meets a latency budget, or that its calls are bounded in time, because a timeout setting, a streaming flag or a named model is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that a timeout argument is set; it cannot show that the value is the one in production, that it is on the call that matters, or that anything observed the wait. A call limit is shown by a call it cut short, which is R2's record and not the framework's to infer.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Budget with a field missing | "Responses under two seconds" naming no interaction, point or percentile; or an average offered as the budget | R1 |
| Call without a limit | A model call someone waits on with no limit, or with a limit whose location or behaviour is not recorded, which can hang a request thread until the provider answers | R2 |
| Retrying interaction with no deadline | Three attempts at ten seconds in an interaction declared as ten; or an attempt started with less time left than its own call limit | R3 |
| Latency figure missing a field | "p95 is 1.8 s" naming no point, sample count, model, provider, region, service tier or workload; or a figure from an idle endpoint quoted for production | R4 |
| Latency claim without support | "Real-time" naming no budget or figure; a figure that misses its budget; or a figure for a different interaction, statistic, workload or path | R5 |
| Setting read as bound | A framework report of "bounded in time" because a timeout argument is present | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | Each budget as interaction, point of measurement, and percentile or fraction | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | Each call limit, where it is applied, and the behaviour at it as implemented in code or configuration | Project code, configuration and the records of a run | Human review |
| R3 | The interaction deadline and how the time left is checked before an attempt | Project code, configuration and the records of a run | Human review |
| R4 | Each reported latency figure with its fields (interaction, point of measurement, statistic, sample count, collection period, model identifier and prompt revision, provider, region and service tier, and workload) and, for a multi-deployment figure, each deployment's share | The project's documentation and measurement records | Human review |
| R5 | Each published latency claim with the budget and the latency figure behind it | The project's documentation | Human review |
| R6 | The absence of any detector, rule, audit finding or generated report that reports latency from a setting | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R5 is a human-authored record. A document naming a budget or a call limit establishes that the project wrote it down and says nothing about whether the running system waits as long as it claims; the reviewer reads what is claimed against the code or configuration that would carry it out.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 would look for a declared budget, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place to put one; both are closed. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **R2 to R5 concern behaviour and records, not files.** Whether a call limit is on the call a request takes, or a figure was measured on the shipped path, is not a property of a checkout. A detector would test for the presence of a setting, which R6 forbids this framework from reporting as a result.
3. **No rule namespace exists for it.** No shard holds a latency or performance namespace, and this standard mints no id; naming one is a decision for the owner, who must also decide it against the `performance.*` ids another pack already uses. A proposed rule, if one is natural, is recorded in the pull request that introduced this document for per-rule approval, and not here.

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

**Exemptibility.** R6 is not exemptible, for the reason R6 of [Standard 25](25-grounding-and-hallucination-control.md) is not. R5 is not exemptible, because an exception would record a project as knowingly making a claim nothing supports. R1 to R4 reach a system only where their subject exists, and a system without that subject records, in its own documents, that the requirement does not reach it and why. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | A stated budget names its interaction, point of measurement, and a percentile or fraction of requests | A budget missing any of the three, or a mean or other statistic in place of a percentile or fraction | A complete-answer p95 for a named interaction with no first-token figure must **not** be faulted for lacking one it never claimed |
| R2 | Each call someone waits on has a call limit, a recorded location and a defined behaviour at the limit, and the behaviour is not to wait | A call someone waits on with no call limit, no recorded location, no defined behaviour, or a behaviour that is to wait or hang the caller | A model call that is a background step nobody waits on is out of scope for R2, not failing it |
| R3 | An interaction that retries or falls back has an interaction deadline, and an attempt is declined, or given a call limit no longer than the time left, when the time left is shorter than its call limit | A retrying interaction with no interaction deadline, a budget stated as the deadline, or an attempt started with less time left than its own call limit | A system that never retries or falls back, and says so, must **not** be faulted for lacking a deadline; a request longer than a percentile budget but inside its deadline must **not** be reported as violating R3 |
| R4 | A reported latency figure names every field, each deployment with its share where it spans more than one, and is not presented as a measurement of the path users take | A latency figure missing a field, a multi-deployment figure naming deployments but not their share, or a figure measured on another path presented as the user path | A figure that names every field and says it was measured on an idle endpoint with its workload, and a per-call duration in a trace record, must **not** be faulted |
| R5 | A latency claim names a budget and a latency figure, they match in interaction, point and statistic, the figure meets the budget, and the claim is about the figure's workload and path | A latency claim naming no budget or no figure, a figure that misses its budget, or a mismatch of interaction, point, statistic, workload or path | A statement of a measured figure on a named workload and no stronger claim must **not** be faulted |
| R6 | No detector, rule, audit finding or generated report in this repository states a latency verdict from presence | A detector, rule, audit finding or report that states a latency budget met, or calls bounded in time, because a timeout setting, a streaming flag or a named model is present | Reporting that a timeout setting was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries one, so R1 to R5 are enforced by review or not at all, and R6 holds today only because no such detector exists. The falsifiers in the table are available for manual review; what this release lacks is a detector that applies them.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made. A budget is an objective and is not made stale by a change of deployment; a latency figure is a record about one deployment.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | A change of the interaction the budget names, or a decision to change the objective. |
| R2 | A change of provider, gateway, client or call path. |
| R3 | A change of retry, fallback or timeout policy. |
| R4 | A change of model, prompt, provider, region, tier, workload or call path. |
| R5 | A change that makes the named latency figure stale (R4). |
| R6 | A new detector, rule or report that touches latency. |

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one word, "latency", inside a bullet of four subjects and states no requirement, level or evidence for it. The item is class `D` because its subject token is derived from the brief; the requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1 to R5 in full**, with the defined terms interaction, budget, call limit, interaction deadline and latency figure, the field list of a latency figure, and the rulings that a call without a limit has no budget, that a retrying interaction needs a deadline separate from its budget, and that a claim needs a figure that meets its budget.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in [Standard 25](25-grounding-and-hallucination-control.md) and [Standard 33](33-ai-observability.md).
- **The four exclusions in Scope** as division lines, and the reading of the UIUXDesignStandards adjacency as a difference of subject. **The recheck** of the adjacent file and rule id at UIUXDesignStandards `7bff2e9`, which the boundary review did not make.
- **The severity assignments** (one level per requirement, in Validation), the statement that no attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the decision to name no rule id.

Not authored here: the classification of UIUXDesignStandards 19 as an adjacency is the boundary review's.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) records inference cost, token budgets and generative latency as owned by this pack; that is this item's posture. [Standard 33](33-ai-observability.md) R1 to R3 govern what a call record carries, including timeouts and fallbacks; R2 and R3 here rely on them and do not restate them. [Standard 23](23-agent-execution-security.md) R1 bounds an agent's steps; a step bound and a time budget are different bounds. [Standard 9](09-misuse-and-abuse-prevention.md) R3 bounds abusive volume. [Standard 1](01-ai-system-manifest.md) declares models and does not declare budgets; no field is proposed by this standard. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and non-lowering language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests section answers. Items 41, 43 and 44 are not part of this change; the lines drawn above are provisional until they are written. **Outside this pack.** UIUXDesignStandards' `performance.budgets-testable` is named in Scope with what the boundary review recorded about it; it is an adjacency, not a crosswalk. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` has a concept of latency or a time budget on a model call. |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 | A place to declare budgets: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R2, R3 | Detectors for a model call with no time limit, and for retry policy | Phase 3 detector work; reading a timeout setting would report a presence, which R6 forbids as a verdict |
| R4, R5 | A check that a published figure or claim names its fields and support | Reading intent from free text is a heuristic, and a false positive teaches a project to write whatever passes |
| R6 | A test asserting no detector, rule, audit finding or report emits a latency verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system within its latency budget, or its calls bounded in time, from the presence of a timeout setting, a streaming flag or a named model. R6 forecloses it, and the foreclosure is the point: a presence is not an effect.
