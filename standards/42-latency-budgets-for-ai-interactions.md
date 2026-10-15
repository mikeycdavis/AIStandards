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

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it — a repository that invokes a model, retrieves context for one, or acts on a model's output —
where a person or another system waits on the result of a model call, whether the wait is on the whole
answer or on its first part.

Covers: stating a budget for each kind of interaction and what it measures; bounding every model call
in time; what the system does when the call limit or the interaction deadline is reached; how a measured figure is described; and the
limit of what this framework can say about any of it.

Two terms, each defined here rather than by the brief:

- An **interaction** is one wait that someone experiences or depends on: a chat turn, a completion
  behind an API, a background job's step. A multi-call workflow is one interaction if a single party
  waits on all of it.
- A **budget** is a time over a named interaction, a named point of measurement (first byte or token,
  or complete answer) and a stated percentile or fraction of requests. It is a number someone chose,
  not a limit a client library defaults to.

It does **not** cover, and claims none of the ground of, the following:

- **Perceived interface performance.** The boundary review records
  UIUXDesignStandards' `standards/19-performance-as-ux.md`, with its rule
  `performance.budgets-testable`, as an adjacency and not as a precedent. Layout stability, input
  acknowledgement and bundle weight are that pack's. This standard concerns the wait on a model call.
- **Cost.** Item 41, Inference Cost and Budget Control, owns spend; a retry or fallback is a
  multiplier of cost as it is of time.
- **Agent loop bounds.** [Standard 23](23-agent-execution-security.md) R1 bounds an agent's steps.
- **Provider portability and degradation.** Item 44, unwritten in this release, owns operational
  resilience; R2 below says only that a behaviour at the call limit and the deadline exists.

**Boundary posture O — owned outright.** The review records no precedent in another pack for inference
latency. It records the one adjacency above, so a future reviewer does not rediscover it as a conflict.
That entry was read in the sibling checkout of UIUXDesignStandards at `7bff2e9` on 2026-10-14: the file
exists, and `performance.budgets-testable` is in its rules and catalog. Its R1 prescribes no universal
millisecond threshold; this standard follows that and sets none either.

## Requirements

### R1 — State each budget over a named interaction, measurement point and percentile

**A system that states a latency budget MUST state it for a named interaction, at a named point of
measurement (first token or byte, or complete answer), over a stated percentile or fraction of
requests, and MUST NOT state it as a single figure with none of these.**

A model's time to first token and its time to a complete answer are different waits, and a streamed
interface can meet one while missing the other. A mean hides the tail where the complaints are. "Under
two seconds" says none of this. The requirement fixes no number: what is acceptable is the project's
judgment about its users.

### R2 — Bound every model call in time, and define what happens at the limit

**A system MUST apply a time limit to each model call it makes that a person or process waits on, MUST
record where in the call path the limit is applied, and MUST define what the system does when that call
limit or the interaction's deadline (R3) is reached, including cancelling the underlying call where the
provider allows it, and MUST record where cancellation is not available. The behaviour MUST NOT be to
wait indefinitely or to leave a caller hanging, and a project MUST NOT describe a limit as working
without a recorded run in which it cut a call or ended the interaction; this applies to the call
limit and to the interaction deadline (R3).**

A call without a limit has no latency budget, only a hope. The behaviours differ in what they cost the
user, and the project chooses: return a partial answer marked as partial, fall back, fail with a
message, queue the work. The requirement is that one is defined and is not "wait". A limit that
ends the wait but leaves the underlying call running to be billed is the failure the cancellation
clause is for; where a provider offers no cancellation, the project records that and the call's cost
is part of what it accepts. A percentile or fraction objective (R1) is not an event inside one request, so it has
no per-request behaviour to define here; what a project does when an aggregate objective is missed is
its own review and is not asserted by this standard.

The limit often lives in a gateway or client configuration rather than in code. The requirement is that
the place be named.

### R3 — Give a retrying interaction a deadline, and count every attempt against it

**Where a system retries a call or falls back to another model, it MUST state a deadline for the whole
interaction — a hard limit, distinct from the percentile or fraction objective of R1 — MUST count the time spent on
every attempt against it, and MUST NOT start a retry or fallback whose own time limit (R2) exceeds what
remains.**

A percentile or fraction objective such as "p95 under two seconds" permits some requests to run longer; it is a
statement about a population, and it leaves no "remaining time" for one request to consume. The deadline
is what a single interaction is held to, and it is the project's choice, including whether it is much
larger than the objective. A system that retries with no deadline of its own has a deadline anyway: the
sum of its attempts. A per-call timeout of ten seconds with three attempts is a thirty-second
interaction that nobody declared. The multiplier is the same one that affects cost; the bound on its count is the subject of
item 41, and this requirement concerns only the time it adds. That a different model answered is
[Standard 33](33-ai-observability.md) R2's subject, and this standard relies on it.

### R4 — Measure on the path a request takes, at a named workload and revision

**A project that reports an aggregate latency figure — a percentile, a mean, a proportion of requests within a threshold or a distribution offered
as evidence of how the system performs or as support for a budget — MUST name the interaction, the
point of measurement (first token or byte, or complete answer), the statistic reported (which
percentile, the mean, the proportion of requests within a stated threshold, or for a distribution its
form, such as histogram buckets or quantiles), the period over which the samples were collected and the number of observations behind the statistic, the
model identifier and prompt revision, the provider, region and service tier it was measured on, and the
workload (request mix, prompt and output lengths, concurrency) — and, where the figure spans more than
one model call or deployment (a fallback, a multi-call interaction), every deployment that took part and
their mixture, or the figure stratified by deployment — and
MUST NOT present a figure measured on a different path than users take as a measurement of the user
path.**

This applies to figures offered as a statement about performance. It does not apply to a per-call
operational record such as the duration field of a trace record
([Standard 33](33-ai-observability.md) R1): a single observation has no percentile and no workload, and
is not a reported figure in this sense. It becomes evidence for R4 only when aggregated into a figure
that is then reported.

A benchmark on short prompts against an idle provider describes a system nobody uses; reported as
such, with its workload named, it is a legitimate figure about that benchmark. The figure moves
when the model, the prompt, the provider's load or the output length does. A measured figure is a
statement about the run that produced it; it is not a statement about the next request.

### R5 — Do not state a latency property that no measurement supports

**A project MUST NOT state or imply that an interaction is "real-time", "instant" or within a budget
unless the statement names the budget (R1) and the measurement it is met under (R4), and is qualified to the workload and path that measurement covers.**

This requirement sets no threshold and prescribes no universal figure.

### R6 — This framework MUST NOT report latency met from the presence of a setting

**No detector, rule, audit finding or generated report in this framework MAY state that a system
meets a latency budget, or that its calls are bounded in time, because a timeout setting, a streaming
flag or a named model is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that a timeout argument
is set. It cannot show that the value is the one in production, that it is on the call that matters, or
that anything observed the wait. Reporting a pass from a presence would turn a setting into a verdict
about an effect.

**A framework report that treats a limit as demonstrated, because a setting is present, is the
presence-as-verdict this requirement forbids.** A limit is shown by a call it cut short, which is R2's
record and not the framework's to infer.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Budget with no point or percentile | "Responses under two seconds" naming neither first token nor tail | R1 |
| Mean as budget | An average met while a tenth of requests wait ten times longer | R1 |
| No timeout | A model call someone waits on with no limit, which can hang a request thread until the provider answers | R2 |
| Wait as behaviour | The call limit or the interaction deadline is reached and the system keeps waiting, or hangs the caller | R2 |
| Cancellation gap unrecorded | A provider offers no cancellation and the project does not record it, or does not record where the limit is applied | R2 |
| Orphaned call | The caller gives up at the limit; the underlying call continues and is billed although the provider allows it to be cancelled | R2 |
| Hidden stack of retries | Three attempts at ten seconds in an interaction declared as ten | R3 |
| Retry past the deadline | A retry started with less time left than its own limit | R3 |
| Objective offered as deadline | A percentile or fraction objective stated in place of an interaction deadline, so no per-request limit is stated | R3 |
| Wrong-path measurement | A figure from short prompts on an idle endpoint, quoted for production | R4 |
| Unattached figure | "p95 is 1.8 s" naming no measurement point, model, prompt revision, deployment or workload, or missing any one of the fields R4 lists (period, sample count, region, tier, or a workload element) | R4 |
| Unqualified claim | "Real-time" or "instant" with no budget behind it | R5 |
| Claim against a missed budget | A "real-time" claim naming a measurement that misses its budget | R5 |
| Claim on a mismatched measurement | A claim whose named measurement has a different point or statistic from the budget (a mean complete-answer figure against a first-token p95), or is of a different workload or path | R5 |
| Limit claimed with no recorded run | A project states that a call limit or interaction deadline works and offers no recorded run in which it cut a call or ended the interaction | R2 |
| Setting reported as bounding calls by a framework | A detector or report states calls bounded in time because a timeout setting is present | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | Each budget as interaction, point of measurement, and percentile or fraction of requests | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | The limit and where it is applied, the behaviour at it as implemented in code or configuration, where cancellation is not available, and, where the limit has been reached, the record of that run | Project code, configuration and the records of a run | Human review of the records |
| R3 | Retry and fallback policy, the interaction deadline, and how what remains is checked before an attempt | Project code and configuration | Human review; a project's own test where one exists |
| R4 | A reported figure with interaction, measurement point, statistic, collection period, sample count, model, prompt revision, provider, region and tier, and workload and, where it spans more than one deployment or model call, every deployment that took part with their mixture, or the figure stratified by deployment | The project's documentation and measurement records | Human review |
| R5 | Any published latency claim with the budget and measurement behind it, and the workload and path the claim is qualified to | The project's documentation | Human review |
| R6 | The absence of any detector, rule, audit finding or generated report that reports latency from a setting or presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R5 is a human-authored record. A document naming a budget or a limit establishes
that the project wrote it down and says nothing about whether the running system waits as long as it
claims; the reviewer reads what is claimed against the code or configuration that would carry it out.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that
every standard cite at least one rule or record in its Validation section why it ships with none; this
is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation,
that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers
section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 would look for a declared budget, and
   neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place to
   put one; both are closed. A rule failing every project for omitting what no schema accepts would
   measure this framework's own incompleteness and blame the project for it. Adding a schema field is a
   schema-versioning decision, outside this slice (plan 02 section 8).
2. **R2 to R5 concern behaviour and records, not files.** Whether a limit is on the call a request
   takes, whether remaining time is checked before a retry, and whether a figure was measured on the
   shipped path are not properties of a checkout. A detector reading source would test for the presence
   of a setting, which R6 forbids this framework from reporting as a result.
3. **No rule namespace exists for it.** No shard holds a latency or performance namespace, and this
   standard mints no id; naming one is a decision for the owner, and the owner must also decide
   it against the `performance.*` ids another pack already uses. A proposed rule, if one is natural, is
   recorded in the pull request that introduced this document for per-rule approval, and not here.

**Severity.** A finding is reported at **warning** severity where a record, statement or label the
requirement asks for is missing or incomplete, except the items listed as error below: the system may
behave well, and what is missing is the account of it. A finding is reported at
**error** severity for each of: a model call someone waits on that has no time limit, or whose limit is
reached without the recorded behaviour, or an interaction whose deadline is reached with no defined
behaviour or a hung caller, or an underlying call that continues where the provider allows
cancellation (R2); a retry or fallback started past the interaction's
deadline, or started with less time remaining than its own limit (R3); a claim R5 prohibits — "real-time",
"instant" or "within budget" with the budget or the measurement not named, a named measurement whose
point or statistic differs from the budget's, a named measurement that misses the
budget, or a claim about production traffic supported only by a measurement of a different workload or
path (R5); a figure presented as a measurement of the user path that was measured elsewhere (R4); or a
violation of R6 by any detector, rule, audit finding or generated report. Every other finding is a
warning, including a figure with a missing or mislabelled field other than one that presents it as the user path (R4) and a limit described as working
with no record of its behaviour (R2). The two lists do not overlap: each falsifier in the Tests table is assigned to
exactly one. These levels are this repository's judgment, listed in Additions, and are not
owner-approved. R1 to R5 are also `manual-review` obligations in this release; the validation type and
the severity are different things. R6 constrains this framework and has no validation type, because the
thing it prohibits is a behaviour of the tool.

**Exemptibility.** R6 is not exemptible, for the reason R6 of
[Standard 25](25-grounding-and-hallucination-control.md) is not. R5's prohibition on an unqualified
claim is likewise not exemptible, because an exception would record a project as knowingly making a
claim nothing supports. R1 to R4 reach a system only where their subject exists — R3 only where it
retries or falls back — and a system without that subject records, in its own documents, that the requirement does not reach it
and why. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md)
R4 dispositions attach to catalog rules, and this standard has none. No detector in this release would
contradict a false statement. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | A stated budget names interaction, point of measurement, and a percentile or fraction of requests | "Fast" or "under two seconds" with any of the three missing, or a mean or other statistic in place of a percentile or fraction | A budget stated as complete-answer p95 for a named interaction, with no first-token figure, must **not** be reported as missing one it never claimed |
| R2 | The limit and its location in the call path are recorded, and where cancellation is not available; a call that exceeds the call limit, or an interaction that reaches its deadline, is cut, cancelled where the provider allows it, and handled as recorded | A model call path someone waits on has no time limit, or its limit's location or its behaviour at the limit is not recorded; or the limit is reached and the call hangs the caller, or proceeds as before, or the underlying call continues to completion where cancellation was available; or where cancellation is unavailable or the limit's location is not recorded; or the interaction's deadline is reached with no defined behaviour or a hung caller; or a limit is described as working with no recorded run in which it cut a call | A system whose only model call is a background step nobody waits on is out of scope for R2, not failing it |
| R3 | An interaction that retries or falls back has a stated deadline, and a retry is declined, or given a limit no longer than what remains, when the remaining deadline is shorter than its own limit | Retries or fallbacks with no stated interaction deadline; a retry or fallback started with less time remaining than its own limit; a percentile or fraction objective stated as the deadline; a deadline not reduced by the time already spent on earlier attempts; or three attempts at the per-call limit inside an interaction deadline equal to one such limit | A system that never retries or falls back, and says so, must **not** be failed for lacking a deadline; a request that exceeds a p95 objective but is inside its deadline must **not** be reported as a violation of R3 |
| R4 | A reported aggregate figure names interaction, measurement point, statistic, collection period, sample count, model, prompt revision, provider, region and tier, and workload and, where it spans more than one deployment or model call, every deployment that took part with their mixture (or is stratified by deployment); a figure presented as describing the user path was measured on that path or is labelled with the path it covers | A figure with a number and nothing else, or missing any one of the named fields or workload elements (period, sample count, region, tier, prompt revision, request mix, prompt and output lengths, concurrency, or statistic), a mean reported as a percentile or the reverse, a multi-deployment figure that lists deployments and not their mixture, or a figure measured on a different path (idle endpoint, short prompts, non-production tier) presented as a measurement of the user path | A figure on a named workload that says it was measured on an idle endpoint must **not** be flagged for admitting it; a per-call duration in a trace record must **not** be flagged for lacking a percentile or workload |
| R5 | A published claim names the budget and the measurement, and the measurement's interaction, point, statistic and result are compared with the budget's and meet it, and the claim's operating context matches the measured workload and path or is qualified to it | "Real-time" or "instant" with the budget or the measurement not named, or unqualified to the workload and path; one that names a measurement that misses its budget; one whose measurement's interaction, point or statistic differs from the budget's; or one describing production traffic supported only by a measurement of a different workload or path | A statement of a measured figure on a named workload and no stronger claim must **not** be flagged |
| R6 | No detector, rule, audit finding or generated report in this repository states a latency verdict from presence | A detector, rule, audit finding or report that stated a latency budget met, or calls bounded in time, because a timeout setting, a streaming flag or a named model was present | Reporting that a timeout setting was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads a latency artifact and no fixture carries
one, so R1 to R5 are enforced by review or not at all, and R6 holds by construction. **A requirement
with no falsifier is a requirement nobody can be shown to have broken**, and that is the honest state of
this standard.

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

**What invalidates a recorded measurement, limit or claim.** A budget is an objective someone chose, not an
observation of a deployment: it survives a change of provider or model, and is what the new deployment
is then measured against. It is revised only by a decision to change the objective, or when the
interaction it names changes. A *measurement* is a record about one deployment, and each of the
following makes the earlier one describe a different subject. A published claim under R5 is stale when the
measurement it names is, and a change of provider or model re-opens whether cancellation is available
and where the limit is applied (R2):

- a change of model identifier, or a model silently updated behind an alias
  ([Standard 1](01-ai-system-manifest.md) R4 asks for the identifier to be pinned);
- a change of the provider, its region or its tier, or a known and material change in the provider's load
  regime (a launch, a migration, a stated capacity change);
- a change of the prompt, the retrieval step or the output length limit, each of which moves the time
  taken;
- a change of the retry, fallback or timeout policy;
- a change of the call path (gateway, proxy, client library, cache, or the caller's location);
- a change in traffic shape: longer prompts, higher concurrency, a new class of interaction.

**Staleness is asymmetric here.** A latency record becomes false when something outside the project
changes: a provider's load and a silent model update are changes nobody in the project made. Nothing in
this release detects the transition; the events above are a note to a future reader.

**Contradicted by operation.** A call that hung past its stated limit, or an interaction that ran past its
declared deadline, contradicts the record made under R2 or R3 and invalidates it until re-examined. A
representative measurement that misses an R1 budget's percentile or fraction does not invalidate the
budget, which is an objective and stands for comparison; it contradicts any claim that the budget is met
and makes the measurement the record of a miss. A single wait longer than a percentile objective is
permitted by that objective and is not by itself a contradiction. What
follows operationally is item 34's subject (AI Incident Response, unwritten in this release); this
standard says only that the record no longer stands.

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one word, "latency", inside a bullet of four subjects. It
states no requirement, level or evidence for any of them. The item is class `D` because its subject
token is derived from the brief; the requirements are not derived. Specifically authored here, none of
it owner-approved:

- **R1 in full**: the three things a budget must name (interaction, point of measurement, percentile)
  and the refusal to fix a number.
- **R2 in full**: a time limit on every call someone waits on, a named enforcement place, and the
  ruling that the behaviour at the limit must not be to wait; cancelling the underlying call where the
  provider allows it; and defining the behaviour at the interaction deadline (R3) as well as at the call
  limit.
- **R3 in full**: a per-interaction deadline distinct from the percentile
  objective, counting retries and fallbacks against it, and declining an attempt the remainder cannot
  cover.
- **R4 in full**: the things a reported figure must name (interaction, point of measurement,
  statistic, collection period, number of observations, model and prompt revision, provider, region and
  tier, workload, and the deployments that took part with their mixture or the figure stratified), and the requirement that a figure measured elsewhere
  not be presented as a measurement of the path users take.
- **R5's prohibition** on "real-time" and similar claims with no budget behind them, and the ruling that
  it is not exemptible.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in
  [Standard 25](25-grounding-and-hallucination-control.md) and
  [Standard 33](33-ai-observability.md).
- **The four exclusions in Scope** as division lines, and the reading of the UIUXDesignStandards
  adjacency as a difference of subject (the wait on a model call, not perceived interface performance).
  Where this standard stops and items 41 and 44 begin is unconfirmed by anyone.
- **The recheck of the adjacent file and rule id** at UIUXDesignStandards `7bff2e9` on 2026-10-14,
  which the boundary review did not make.
- **The severity assignments** (warning for a missing account; error for a model call with no time limit or whose limit or deadline is reached without the recorded behaviour, an underlying call that continues where cancellation is available, a
  retry or fallback started past the deadline or with less time than its limit, a claim R5 prohibits, a
  figure presented as measuring the user path that was measured elsewhere, and a violation of R6 by any
  detector, rule, audit finding or report) and the statement that no
  attestation or scheduled expiry exists in this release.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the
  decision not to name a rule id.

Not authored here: the classification of UIUXDesignStandards 19 as an adjacency, which is the boundary
review's.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) records inference cost, token budgets and
generative latency as owned by this pack with no existing owner; that is this item's posture.

[Standard 33](33-ai-observability.md) R1 to R3 govern what a call record carries, including the
outcomes that are not success; R2 and R3 here rely on them for the record of a timeout or a fallback
and do not restate them. [Standard 23](23-agent-execution-security.md) R1 bounds an agent's steps; a
step bound and a time budget are different bounds and one mechanism may serve both.
[Standard 9](09-misuse-and-abuse-prevention.md) R3 bounds abusive volume, which can also appear as
latency under load and is not claimed here.

[Standard 1](01-ai-system-manifest.md) declares models, and R4 depends on the identifier it asks to be
pinned. It does not declare budgets, and no field is proposed by this standard.
[Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and
non-lowering language used above. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the
requirement the Tests and falsifiers section answers.

Items 41 (Inference Cost and Budget Control), 43 (Environmental Impact Accounting) and 44 (Operational
Resilience, Degradation, and Provider Portability) are not part of this change; the lines drawn above are
provisional until they are written, and the later standards may legitimately move them.

**Outside this pack.** UIUXDesignStandards' `performance.budgets-testable` is named in Scope with what
the boundary review recorded about it. It is an adjacency, not a crosswalk, and no maintainer of that
pack has confirmed that reading. No ADR covers this standard — `artifacts/adr/` does not exist in this
release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds by construction.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away
as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds by construction, not by assertion.** No detector, rule or report in `scripts/`, `rules/` or `ai-policy.yml` has a concept of latency or a time budget on a model call. No test asserts the absence, so a future detector could break R6 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's latency |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 | A place to declare budgets: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R2, R3 | Detectors for a model call with no time limit, and for retry policy | Phase 3 detector work; reading a timeout setting would report a presence, which R6 forbids as a verdict |
| R4, R5 | A check that a published figure or claim names its subject, model and workload | Reading intent from free text is a heuristic, and a false positive teaches a project to write whatever passes |
| R6 | A test asserting no detector emits a latency verdict | Meaningful only once a detector exists for it to constrain |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system within its latency budget,
or its calls bounded in time, from the presence of a timeout setting, a streaming flag or a named model.
R6 forecloses it, and the foreclosure is the point: a presence is not an effect, and a framework
reporting one would put its authority behind a property of the running system that nothing in a
repository can show.
