# Standard 41 — Inference Cost and Budget Control

A call to a model is a line of expenditure whose price is set per unit of text rather than per server,
and whose volume is set by user behaviour, retry logic and the model's own output length. Cost
therefore fails differently from compute cost in a conventional service: a prompt that grows, a retry
that is not capped, a loop that continues because the model asked it to, or a fallback to a larger
model can each multiply spend with no change to the code path anyone reviews.

Three things are routinely run together, and this standard keeps them apart. A **cost record** is what
a call or a run is known to have spent. A **budget** is a ceiling someone chose. And **enforcement** is
the point in the call path where reaching the ceiling changes what the system does. A dashboard of
spend is a cost record; a figure in a planning document is a budget; neither stops a call.

The failure this standard is written against is cost control asserted from the presence of a number: a
`max_tokens` argument, a monthly figure in a document, a provider-side alert, a dashboard. None of those
says what the system does at the ceiling, or that anything was ever shown to stop.

Source: item 41 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "Cost" token of the "Cost, latency, environmental impact, and operational resilience"
bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 41 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, and that
> review's substantive half is human judgment and carries `humanSignOff: null`.
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) holds no evidence entry for this
> item, because an owned item has no counterpart to record. No maintainer of any adjacent pack has
> confirmed the posture.
>
> **The brief supplies one word and this standard supplies the rest.** The brief's bullet names "Cost"
> and states no requirement for it. The item is class `D` because its token is the brief's own; the
> requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it — a repository that invokes a model, retrieves context for one, or acts on a model's output — whose model calls are paid for per unit of use, whether by a provider's invoice or by capacity the project has to provision for the call.

Covers: attributing spend to a spend subject; stating a ceiling and what happens at it; bounding multipliers; labelling spend figures billed or estimated; what a cost claim must name; and the limit of what this framework can say about any of it.

Terms, each defined once here and used verbatim below:

- **Spend subject** — a feature, tenant, user, job, run, or the provider account itself where the project's budget or reported figure is stated over the account.
- **Ceiling** — a number over a spend subject and a period at which the system acts.
- **Multiplier** — a retry, a fallback, the repetition of a call outside an agent loop, and, where the charge is metered by tokens or time, completion length and carried conversation history.
- **Spend figure** — any figure a project reports as an amount spent.

It does **not** cover, and claims none of the ground of:

- **Agent loop steps.** [Standard 23](23-agent-execution-security.md) R1 owns an agent's step and sub-agent bound and leaves cost ceilings to this item.
- **Abuse volume.** [Standard 9](09-misuse-and-abuse-prevention.md) R3 owns the bound against abusive volume and says one limit may serve both; this standard claims only the cost use.
- **Latency, environmental impact, provider portability.** Items 42, 43 and 44 own them and are unwritten in this release.
- **The design of an evaluation plan.** [Standard 17](17-evaluation-plans-for-generative-systems.md) governs it; the model calls an evaluation run makes are in scope here like any other.

**Boundary posture O — owned outright.** [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) holds no evidence entry for this item, because an owned item has no counterpart to record. This document cites none and claims no adjacent pack's ground.

## Requirements

### R1 — Attribute spend to each spend subject the project names

**A system that states a budget, or reports a spend figure, for a spend subject MUST record spend against that spend subject, and MUST show spend that fits none as its own unattributed amount.**

A budget over a spend subject that spend cannot be attributed to is an intention, not a budget. The granularity is the project's; the requirement is that spend can be read back at every granularity it names, and that what cannot be attributed is shown as such and not folded into a subject it does not belong to.

### R2 — Give each stated budget a ceiling that acts

**A system that states a budget MUST apply it as a ceiling whose number, spend subject, period and enforcement point are recorded, whose behaviour at the ceiling is to refuse, queue, degrade, shorten or re-route the call or route it to a person, and whose value the system cannot raise.**

An alert is a statement that someone will be told, not an action of the system; "continue and log" is not a behaviour at a ceiling. The enforcement point often lives in a gateway or deployment configuration, and it is the place that must be named, not that it be in the repository. [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1 prohibits an agent rewriting its own step budget and does not name a cost ceiling; a spend ceiling the system can raise is R2's case.

### R3 — Bound every multiplier on its own

**A system MUST give each multiplier it has a limit of its own, in code or configuration, that is not merely the budget above it.**

A request budget does not bound a retry loop that spends it faster than anyone looks. A fallback is a multiplier twice over: it adds a call, and the call is frequently to a dearer model. That a different model answered is [Standard 33](33-ai-observability.md) R2's subject.

### R4 — Say whether a spend figure is billed or estimated

**A project MUST label each spend figure it reports as billed or estimated, and MUST NOT present an estimate as the amount spent.**

An estimate computed from token counts and a price list is a model of the bill. It diverges when the price changes, a model is substituted, a count omits tokens the provider charges for, or a call is billed that the system never saw. For provisioned or owned capacity, "billed" means the capacity's accounting cost.

### R5 — Name the support for a cost claim

**A project MUST NOT state that cost is capped or bounded without naming the ceiling (R2), MUST NOT state that it is negligible without naming the measurement, and MUST NOT state a cost per unit without naming the model identifier and the date of the price and, where the figure depends on a workload (a cost per request, conversation or job), the workload it was measured on.**

A cost per request is a function of the model, its price on a date, the prompt and the output; "costs a few cents per conversation" is a claim with no subject. A dated price-sheet entry kept as a historical figure, and not stated as the cost of a call, is not a cost per unit under this requirement. This requirement sets no threshold and no price.

### R6 — This framework MUST NOT report cost controlled from the presence of a setting

**No detector, rule, audit finding or generated report in this framework MAY state that a system's cost is controlled, capped or bounded because a token limit, a budget figure, a rate limit or an alert is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that `max_tokens` is set or a limiter configured; it cannot show that the value is the one in production, that the limiter sits on the path a request takes, or that reaching the ceiling does anything. Whether a ceiling acts is R2's record, and not the framework's to infer from a setting.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Spend not attributable to a named spend subject | A budget or reported figure is stated per tenant or feature and spend is recorded only per API key; or unattributed spend is folded into the largest spend subject | R1 |
| Ceiling that does not act | A notification at 80% and no action at 100%; "continue and log"; a ceiling read from configuration the system can raise; or no named enforcement point | R2 |
| Unbounded multiplier | A retry with no maximum; a fallback with no bound on how often; no completion limit or history bound where billing is by tokens or time; or a multiplier governed only by the budget above it | R3 |
| Estimate presented as spend | A figure computed from token counts is shown as the amount spent, or a spend figure carries no label | R4 |
| Cost claim without support | "Cost is capped" naming no ceiling; "negligible" naming no measurement; or "$0.02 per request" naming no model, price date or workload | R5 |
| Setting read as control | A framework report of "cost controlled" because a token limit is present | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | Spend per spend subject the project names, and the unattributed amount | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | The ceiling's number, spend subject, period and enforcement point; the behaviour as implemented in code or configuration; and where the system cannot raise the value | Project code and configuration, gateway configuration | Human review |
| R3 | Each multiplier the system has and the limit of its own, or the statement that it has none | Project code and configuration, gateway configuration | Human review |
| R4 | Each reported spend figure with its label | The project's documentation and finance or operations records the project names | Human review |
| R5 | Each published cost claim with the ceiling, measurement, or model, price date and workload it names | The project's documentation | Human review |
| R6 | The absence of any detector, rule, audit finding or generated report that reports cost controlled from a setting | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R5 is a human-authored record. A document naming a ceiling or a limit establishes that the project wrote it down and says nothing about whether the running system acts; the reviewer reads what is claimed against the code or configuration that would carry it out.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 or R2 would look for a declared spend subject or ceiling, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place to put one; both are closed. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **R3 to R5 concern behaviour and records, not files.** Whether a retry is bounded on the path a request takes, or a figure was labelled, is not a property of a checkout. A detector reading source would test for the presence of a setting, which R6 forbids this framework from reporting as a result.
3. **No rule namespace exists for it.** The `cost` namespace is reserved ([Standard 7](07-boundary-with-adjacent-standards.md) names `cost.provider-portable` as a later-phase id; the boundary review ties it to item 44) and has no shard. This standard mints no id; a proposed rule, if one is natural, is recorded in the pull request that introduced this document for per-rule approval, and not here.

**Validation type.** R1 to R5 are `manual-review` obligations in this release; R6 constrains this framework and has no validation type, because the thing it prohibits is a behaviour of the tool. The validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | error |
| R2 | error |
| R3 | error |
| R4 | error |
| R5 | error |
| R6 | error |

**Exemptibility.** R6 is not exemptible: no project circumstance makes it reasonable for a scan to report an effect from a presence. R5 is not exemptible, because an exception would record a project as knowingly making a claim nothing supports. R1 to R4 reach a system only where their subject exists, and a system without that subject records, in its own documents, that the requirement does not reach it and why. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Spend can be read back for every spend subject a budget or spend figure names, and unattributed spend appears as its own amount | A named spend subject with no spend record, or unattributed spend folded into a named subject | A system whose budget and figures are stated per provider account, and whose spend is recorded per account, must **not** be faulted for lacking finer attribution |
| R2 | The ceiling record is complete, its behaviour is one of those listed and is implemented, and the system cannot raise the value | A ceiling record missing a number, spend subject, period or enforcement point; a behaviour that is continue-and-log or an alert alone; or a value the system can raise | A system that states no budget is out of scope for R2; a ceiling the system can only lower, or cannot write, must **not** be faulted for that |
| R3 | Each multiplier the system has has a limit of its own stated in code or configuration; a reviewed static limit establishes it without a run | A multiplier the system has with no limit of its own, including one governed only by the budget above it | A system that never retries or falls back, and says so, must **not** be faulted for lacking a retry limit |
| R4 | Every reported spend figure carries a billed or estimated label, and no estimate is presented as the amount spent | A spend figure with no label, or an estimate presented as the amount spent | A project that labels its figure an estimate must **not** be faulted for lacking a billed figure it never claimed |
| R5 | Each cap or bound claim names its ceiling, each negligibility claim names its measurement, and each cost per unit names model and price date, and workload where it depends on one | A cap or bound claim, a negligibility claim, or a cost per unit missing what R5 requires it to name (model, price date, and workload where it depends on one) | A provider price-sheet rate that names model and price date, and a dated rate kept as a historical figure, must **not** be faulted for lacking a workload |
| R6 | No detector, rule, audit finding or generated report in this repository states a cost verdict from presence | A detector, rule, audit finding or report that states cost controlled, capped or bounded because a token limit, budget figure, rate limit or alert is present | Reporting that a token limit or budget figure was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries one, so R1 to R5 are enforced by review or not at all, and R6 holds today only because no such detector exists. The falsifiers in the table are available for manual review; what this release lacks is a detector that applies them. A record made stale by the event in the staleness table below does not satisfy the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made. A reconciliation or measurement of spend is a record about one configuration.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | A new spend subject or a change of billing account. |
| R2 | A change to the ceiling's value, spend subject, period, enforcement point or behaviour, or to who can write it. |
| R3 | A change of retry, fallback or loop policy, or an observed multiplier exceeding its limit. |
| R4 | A change of how the provider counts billed units, for an estimate computed from them. |
| R5 | A change of model, price or workload, for a cost per unit stated as the current cost of a call; or a change to what the measurement named by a negligibility claim measured. |
| R6 | A new detector, rule or report that touches cost. |

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one word, "Cost", inside a bullet of four subjects and states no requirement, level or evidence for it. The item is class `D` because its subject token is derived from the brief; the requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1 to R5 in full**, with the defined terms spend subject, ceiling, multiplier and spend figure, and the rulings that an alert is not an action, that "continue and log" is not a behaviour at a ceiling, and that a figure is labelled billed or estimated.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in [Standard 25](25-grounding-and-hallucination-control.md) and [Standard 33](33-ai-observability.md).
- **The four exclusions in Scope** as division lines; where this standard stops and items 42 to 44 begin is unconfirmed by anyone.
- **The severity assignments** (one level per requirement, in Validation), the statement that no attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the decision to name no rule id.

Not authored here: Standard 23's statement that cost ceilings are this item's, and Standard 9's statement that one limit may serve both, are those standards' own and are cited, not restated.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) records inference cost, token budgets and generative latency as owned by this pack with no existing owner. [Standard 23](23-agent-execution-security.md) R1 bounds an agent's steps and leaves cost ceilings to this item; [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1 prohibits an agent rewriting its own step budget and does not name a cost ceiling; [Standard 9](09-misuse-and-abuse-prevention.md) R3 bounds abusive volume. [Standard 33](33-ai-observability.md) R1 and R2 govern what a call record contains and the subject that served the call, and R1 here adds attribution to them. [Standard 1](01-ai-system-manifest.md) declares models and does not declare budgets; no field is proposed by this standard. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and non-lowering language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests section answers. Items 42 (Latency Budgets for AI Interactions), 43 (Environmental Impact Accounting) and 44 (Operational Resilience, Degradation, and Provider Portability) are unwritten in this release. **Outside this pack.** No adjacent pack's standard is recorded for this item. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` has a concept of inference cost or budget in the sense of this standard. The rule `agent.step-budget-bounded` reads an agent's step budget, which [Standard 23](23-agent-execution-security.md) R1 states is not a cost ceiling; it is not a cost verdict; `oversight.authority-matches-tier` mentions budgets granted among authority and reports no cost verdict. |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1, R2 | A place to declare spend subjects and ceilings: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R3 | Detectors for an unbounded retry, fallback or completion, each language-specific | Phase 3 detector work; a literal-reading heuristic would report a presence, which R6 forbids as a verdict |
| R4, R5 | A check that a spend figure is labelled and a claim names its support | Reading intent from free text is a heuristic, and a false positive teaches a project to write whatever passes |
| R6 | A test asserting no detector, rule, audit finding or report emits a cost verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system's cost controlled, capped or bounded from the presence of a token limit, a budget figure, a limiter configuration or an alert. R6 forecloses it, and the foreclosure is the point: a presence is not an effect.
