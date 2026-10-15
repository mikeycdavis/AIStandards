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
in time; what the system does when the budget is exhausted; how a measured figure is described; and the
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
  resilience; R2 below says only that a behaviour at the budget exists.

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
record where in the call path the limit is applied, and MUST define what the system does when the limit
or the budget is reached. The behaviour MUST NOT be to wait indefinitely or to leave a caller hanging.**

A call without a limit has no latency budget, only a hope. The behaviours differ in what they cost the
user, and the project chooses: return a partial answer marked as partial, fall back, fail with a
message, queue the work. The requirement is that one is defined and is not "wait". A limit that
ends the wait but leaves the underlying call running to be billed is a separate failure, recorded in
the table below.

The limit often lives in a gateway or client configuration rather than in code. The requirement is that
the place be named.

### R3 — Give a retrying interaction a deadline, and count every attempt against it

**Where a system retries a call or falls back to another model, it MUST state a deadline for the whole
interaction — a hard limit, distinct from the percentile objective of R1 — or a time allotted to each
attempt, MUST count the time spent on every attempt against it, and MUST NOT start a retry or fallback
whose own time limit (R2) exceeds what remains.**

A percentile objective such as "p95 under two seconds" permits some requests to run longer; it is a
statement about a population, and it leaves no "remaining time" for one request to consume. The deadline
is what a single interaction is held to, and it is the project's choice, including whether it is much
larger than the objective. A system that retries with no deadline of its own has a deadline anyway: the
sum of its attempts. A per-call timeout of ten seconds with three retries is a thirty-second interaction
that nobody declared. The multiplier is the same one that affects cost; the bound on its count is the subject of
item 41, and this requirement concerns only the time it adds. That a different model answered is
[Standard 33](33-ai-observability.md) R2's subject, and this standard relies on it.

### R4 — Measure on the path a request takes, at a named workload and revision

**A project that reports an aggregate latency figure — a percentile, a mean or a distribution offered
as evidence of how the system performs or as support for a budget — MUST name the interaction, the
percentile, the model identifier and prompt revision it was measured on, and the workload (request mix,
prompt and output lengths, concurrency), and MUST NOT report a figure from a different path than users
take.**

This applies to figures offered as a statement about performance. It does not apply to a per-call
operational record such as the duration field of a trace record
([Standard 33](33-ai-observability.md) R1): a single observation has no percentile and no workload, and
is not a reported figure in this sense. It becomes evidence for R4 only when aggregated into a figure
that is then reported.

A benchmark on short prompts against an idle provider describes a system nobody uses. The figure moves
when the model, the prompt, the provider's load or the output length does. A measured figure is a
statement about the run that produced it; it is not a statement about the next request.

### R5 — Do not state a latency property that no measurement supports

**A project MUST NOT state or imply that an interaction is "real-time", "instant" or within a budget
unless the statement names the budget (R1) and the measurement it is met under (R4).**

This requirement sets no threshold and prescribes no universal figure.

### R6 — This framework MUST NOT report latency met from the presence of a setting

**No detector, rule, audit finding or generated report in this framework MAY state that a system
meets a latency budget, or that its calls are bounded in time, because a timeout setting, a streaming
flag or a named model is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that a timeout argument
is set. It cannot show that the value is the one in production, that it is on the call that matters, or
that anything observed the wait. Reporting a pass from a presence would turn a setting into a verdict
about an effect.

**A limit that exists and has never been shown to end a wait is not demonstrated to work.** A limit is
shown by a call it cut short.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Budget with no point or percentile | "Responses under two seconds" naming neither first token nor tail | R1 |
| Mean as budget | An average met while a tenth of requests wait ten times longer | R1 |
| No timeout | A model call with no limit, hanging a request thread until the provider answers | R2 |
| Wait as behaviour | The limit is reached and the system keeps waiting, or hangs the caller | R2 |
| Orphaned call | The caller gives up at the limit; the underlying call continues and is billed | R2 |
| Hidden stack of retries | Three attempts at ten seconds in an interaction declared as ten | R3 |
| Retry past the deadline | A retry started with less time left than its own limit | R3 |
| Objective read as deadline | A percentile objective used as the per-request cutoff, so the tail the objective permits is cut off, or never stated as a separate deadline | R1, R3 |
| Wrong-path measurement | A figure from short prompts on an idle endpoint, quoted for production | R4 |
| Unattached figure | "p95 is 1.8 s" naming no model, prompt revision or workload | R4 |
| Unqualified claim | "Real-time" or "instant" with no budget behind it | R5 |
| Setting read as bound | A framework report of "bounded in time" because a timeout argument is present | R6 |
| Untested limit | A timeout shown to exist and never shown to cut a call | R2, R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | Each budget as interaction, point of measurement and percentile | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | The limit and where it is applied, the behaviour at it, and a run in which it was reached | Project code, configuration and the records of a run | Human review of the records |
| R3 | Retry and fallback policy, the interaction deadline or per-attempt allotment, and how what remains is checked before an attempt | Project code and configuration | Human review; a project's own test where one exists |
| R4 | A reported figure with interaction, percentile, model, prompt revision and workload | The project's documentation and measurement records | Human review |
| R5 | Any published latency claim with the budget and measurement behind it | The project's documentation | Human review |
| R6 | The absence of any detector that reports latency from a setting | This repository's own detectors and tests | Code review; see Implementation |

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

**Severity.** R1 to R5 are `manual-review` obligations in this release. How long a future request will take is not
a property of a repository, and no requirement here asks a reviewer to establish it. R6 constrains this framework and has no
validation type, because the thing it prohibits is a behaviour of the tool.

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
| R1 | A stated budget names interaction, point of measurement and percentile | "Fast" or "under two seconds" with none of the three | A budget stated as complete-answer p95 for a named interaction, with no first-token figure, must **not** be reported as missing one it never claimed |
| R2 | A call that exceeds the limit is cut and handled as recorded | The limit is reached and the call hangs the caller, or proceeds as before | A system whose only model call is a background step nobody waits on is out of scope for R2, not failing it |
| R3 | A retry is declined when the interaction's remaining deadline is shorter than its own limit | Three attempts at the per-call limit inside an interaction with a deadline of one | A system that never retries or falls back, and says so, must **not** be failed for lacking a deadline; a request that exceeds a p95 objective but is inside its deadline must **not** be reported as a violation of R3 |
| R4 | A reported aggregate figure names interaction, percentile, model, prompt revision and workload | A figure with a number and nothing else | A figure on a named workload that says it was measured on an idle endpoint must **not** be flagged for admitting it; a per-call duration in a trace record must **not** be flagged for lacking a percentile or workload |
| R5 | A published claim names the budget and measurement | "Real-time" or "instant" with neither | A statement of a measured figure on a named workload and no stronger claim must **not** be flagged |
| R6 | No detector or report in this repository outputs a latency verdict from presence | A detector that reported a bound because a timeout argument was present | Reporting that a timeout setting was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads a latency artifact and no fixture carries
one, so R1 to R5 are enforced by review or not at all, and R6 holds by construction. **A requirement
with no falsifier is a requirement nobody can be shown to have broken**, and that is the honest state of
this standard.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to
except. A project that knowingly does not meet one records that in its own documents; Standard 2's
dispositions apply to the application of a rule, and this standard has none.

**What invalidates a recorded budget or measurement.** Each is a different subject, and a record made
before the change describes the earlier one:

- a change of model identifier, or a model silently updated behind an alias
  ([Standard 1](01-ai-system-manifest.md) R4 asks for the identifier to be pinned);
- a change of the provider, its region, its tier or its load at the time of measurement;
- a change of the prompt, the retrieval step or the output length limit, each of which moves the time
  taken;
- a change of the retry, fallback or timeout policy;
- a change in traffic shape: longer prompts, higher concurrency, a new class of interaction.

**Staleness is asymmetric here.** A latency record becomes false when something outside the project
changes: a provider's load and a silent model update are changes nobody in the project made. Nothing in
this release detects the transition; the events above are a note to a future reader.

**Contradicted by operation.** An observed wait that exceeded a stated budget, or a call that hung past
its stated limit, contradicts the record made under R1 and R2 and invalidates it until re-examined. What
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
  ruling that the behaviour at the limit must not be to wait.
- **R3 in full**: a per-interaction deadline or per-attempt allotment distinct from the percentile
  objective, counting retries and fallbacks against it, and declining an attempt the remainder cannot
  cover.
- **R4 in full**: the five things a reported figure must name, and the requirement that it be measured
  on the path users take.
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
