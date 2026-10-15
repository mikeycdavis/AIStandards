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

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it — a repository that invokes a model, retrieves context for one, or acts on a model's output —
whose model calls are paid for per unit of use, whether by a provider's invoice or by capacity the
project has to provision for the call.

Covers: attributing spend to something a person owns; stating a budget and the behaviour at its
ceiling; bounding the multipliers (retries, fallbacks, repeated calls outside an agent loop, completion length, carried history); what a stated cost
figure must name; and the limit of what this framework can say about any of it.

Two terms, each defined here rather than by the brief:

- A **budget** is a ceiling on spend, tokens or calls over a stated subject and period: a request, a
  run, a user, a tenant, a feature, a day. It is a number someone chose, not a quota the provider
  happens to apply.
- A **multiplier** is anything that causes one logical request to produce more than one billed call or
  more billed units than the request alone implied: a retry, a fallback, a repeated call, a long or unbounded
  completion, a growing conversation history. An agent loop's own step count is a multiplier too and is
  bounded by Standard 23 R1, not here.

It does **not** cover, and claims none of the ground of, the following:

- **Step and tool-call budgets of an agent loop.** [Standard 23](23-agent-execution-security.md) R1
  owns the bound on an agent's own steps and says that cost ceilings are this item's. A single
  mechanism may serve both; this standard does not restate the loop bound.
- **Abuse volume.** [Standard 9](09-misuse-and-abuse-prevention.md) R3 owns the bound against abusive
  volume, and says one limit may serve both. This standard claims only the cost use.
- **Latency.** Item 42, Latency Budgets for AI Interactions, owns time; it is unwritten in this
  release.
- **Environmental impact and provider portability.** Items 43 and 44 own them and are unwritten in this
  release.
- **The design of an evaluation plan.** [Standard 17](17-evaluation-plans-for-generative-systems.md)
  governs it and nothing here restates it. The model calls an evaluation run makes are within this
  standard's scope like any other, and owe R1 to R5 accordingly.

## Requirements

### R1 — Attribute inference spend to a subject someone owns

**A system that states a budget, or reports cost per subject, MUST record the spend of its model calls
against the subject — a feature, a tenant, a user, a job or a run — at every granularity at which it
states a budget or reports a cost figure, and MUST NOT leave
spend attributable only to a provider account or invoice unless that account is itself the subject the
budget or the reported figures are stated over. A system that states neither budgets nor per-subject
figures owes no attribution under this requirement.**

A budget over a subject that spend cannot be attributed to is not a budget, it is an intention. The
requirement does not fix the granularity; it asks that it match the one the budget is stated at. A
project whose budget is stated per provider account, and whose spend is recorded per that account,
meets it: the account is then the budget's subject. A provider account is not a subject when the
budget is stated over something finer.

Spend that cannot be attributed is recorded as unattributed, with its amount, and is not folded into
a subject it does not belong to.

Attribution is a property of the records [Standard 33](33-ai-observability.md) R1 asks each call to
leave. This standard adds the subject; it does not restate what a call record must contain.

### R2 — State each budget with its subject and period, and what happens at the ceiling

**A system that states a budget, or applies a ceiling, for inference spend MUST state the ceiling as a
number over a named subject and period, MUST record where in the call path it is enforced, and MUST define what the system
does when it is reached. The behaviour at the ceiling MUST NOT be "continue and log".**

The behaviours differ in what they cost a user, and the project chooses: refuse, queue, degrade to a
cheaper path, shorten the output, route to a person. The requirement is that one exists, that it is
written down, and that it is not an alert alone. An alert is a statement that someone will be told; it
is not an action of the system.

A ceiling often lives in a gateway, a provider console or deployment configuration rather than in the
repository. The requirement is that the place be named, not that it be in the repository.

**A ceiling the system can raise for itself during a run is not a bound on it, and MUST NOT be
treated as the ceiling.** [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1 prohibits an
agent rewriting its own step budget; it does not name a cost ceiling, and this standard does not
extend it. The case of a spend ceiling the system can itself rewrite is R2's.

### R3 — Bound every multiplier

**A system MUST bound each multiplier on its model calls — retries, fallbacks, the repetition of any
call that is not an agent loop, and, where the charge is metered by tokens or time, completion length
and carried conversation history — and MUST NOT leave one governed only by the budget that sits above
it. The step and sub-agent bound of an agent loop
is [Standard 23](23-agent-execution-security.md) R1's and is not restated here.**

A request budget does not bound a retry loop that spends it faster than anyone looks. The bounds need
not be numerically the same as the budget in R2; they need to exist, one per multiplier the system has.
Where a system has no instance of a multiplier (it never retries, it has no fallback), that is a
statement the project can make; it is not a gap.

A fallback is a multiplier twice over: it adds a second call, and the second call is frequently to a
more expensive model. Recording that a different model answered is
[Standard 33](33-ai-observability.md) R2's subject, and this standard relies on it rather than
restating it.

### R4 — Reconcile recorded spend against what was actually charged, and say how often

**A project MUST NOT report a figure drawn only from its own estimates as the amount spent,
whether or not it states a budget; and a project that states a budget MUST record how recorded spend is
reconciled with the amount actually billed or, for provisioned or owned capacity, with the capacity's
accounting cost or measured utilisation, and at what interval.**

An estimate computed from token counts and a price list is a model of the bill. It diverges from the
bill when the price changes, when a model is substituted, when a count excludes system or tool tokens
the provider charges for, and when a call is billed that the system's own record never saw. The
requirement is not that the two agree; it is that nobody believes they do without having looked.

### R5 — Describe cost as a measured quantity with a named subject, model and price date

**A project MUST NOT state or imply that inference cost is capped or bounded unless the statement
names the enforcing mechanism (R2), and MUST NOT state or imply that it is negligible unless the
statement names the measurement it rests on; and a stated cost per unit MUST name the model
identifier and the date of the price it assumes, and, where the figure depends on a workload — a cost
per request, per conversation or per job — the workload it was measured on.**

A cost per request is a function of the model, its price on a date, the prompt and the output. It moves
when any of them does, and a figure measured on last quarter's prompt describes last quarter's system.
"Costs a few cents per conversation" is a claim with no subject. A provider's published price per
million tokens depends on a model and a date and on no workload, and needs only those two.

This requirement sets no threshold and no price.

### R6 — This framework MUST NOT report cost controlled from the presence of a setting

**No detector, rule, audit finding or generated report in this framework MAY state that a system's
cost is controlled, capped or bounded because a token limit, a budget figure, a rate limit or an
alert is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that `max_tokens` is
set, that a budget figure is written in a document, or that a limiter is configured. It cannot show
that the value is the one used in production, that the limiter sits on the path a request takes, or that
exhausting the budget does anything. Reporting a pass from any of them would turn the presence of a
setting into a verdict about its effect.

**A framework report that treats a ceiling as demonstrated because a setting is present is the
presence-as-verdict this requirement forbids.** A ceiling is shown by observing the behaviour R2 defined
for it — a call refused, degraded, queued, shortened, re-routed or routed to a person — at the ceiling,
which is R2's record and not the framework's to infer.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Spend unattributed | One provider invoice for a platform serving many features, with no way to say which spent it, while a budget or cost figure is stated per feature | R1 |
| Budget over a subject nothing is attributed to | A per-tenant monthly figure in a plan; spend recorded only per API key | R1 |
| Misattributed remainder | Unattributed spend folded into the largest subject so totals reconcile | R1 |
| Alert as enforcement | A notification at 80% of budget and no action at 100% | R2 |
| Continue and log | Budget exhaustion is recorded and the call proceeds unchanged, whether or not "continue and log" is the written-down behaviour | R2 |
| Ceiling in an unnamed place | "The gateway handles it" with no record of which gateway or setting | R2 |
| Self-raised ceiling | A budget read from configuration the system can raise during a run | R2 |
| Uncapped retry | Retry-on-error with no maximum, each attempt billed | R3 |
| Expensive fallback | A fallback to a larger model after a failure, with no bound on how often | R3 |
| Unbounded output or history | Where billing is by tokens or time: no completion limit; a conversation resent in full every turn | R3 |
| Estimate reported as spend | A figure computed from token counts presented as the amount spent | R4 |
| Never reconciled | Estimates and invoice never compared, so divergence is not known | R4 |
| Cap claim without mechanism | "Cost is capped" with nothing enforcing it | R5 |
| Unattached unit cost | "Roughly $0.02 per request" naming none, or only some, of model, price date and (where it depends on one) workload | R5 |
| Negligibility claim without measurement | "Inference cost is negligible" naming no measurement | R5 |
| Setting read as control | A framework report of "cost controlled" because a token limit is present | R6 |
| Cap claim with no mechanism named | A project states that spend is capped and names no enforcing mechanism, configuration or run | R5 |
| Ceiling reported as bounding spend by a framework | A detector or report states spend bounded because a limit setting is present | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The subject each model call's spend is attributed to, the unattributed remainder, and each granularity at which a budget is stated or a cost figure reported | A project document the project names, and the cost records it points at — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | Each budget as number, subject and period; where it is enforced; the behaviour at the ceiling as implemented in code or configuration; that the system cannot raise the ceiling's value (it is held where the system cannot write it, or the system can only lower it); and, where the ceiling has been reached, the record of that run | Project configuration and code, gateway configuration, and the records of a run | Human review of the records |
| R3 | Each multiplier the system has and the bound on it, or the statement that it has none | Project code and configuration | Human review; a project's own test where one exists |
| R4 | Where a budget is stated, the reconciliation of recorded spend with the billed amount, or with the capacity's accounting cost or utilisation, and its interval; for any published spend figure, its source, so a billed amount can be told from an estimate | Finance or operations records the project names | Human review |
| R5 | Any published unit-cost figure, with model identifier and price date, and the workload where the figure depends on one (an aggregate billed total is R4's and needs only its source); any cap or bound claim with the enforcing mechanism it names (R2); any negligibility claim with the measurement it rests on | The project's documentation | Human review |
| R6 | The absence of any detector, rule, audit finding or generated report that reports cost controlled from a setting or presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R5 is a human-authored record. A document naming a budget or a bound establishes
that the project wrote it down and says nothing about whether the running system stops; the reviewer
reads what is claimed against the code or configuration that would carry it out.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that
every standard cite at least one rule or record in its Validation section why it ships with none; this
is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation,
that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers
section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 or R2 would look for a declared
   attribution subject or budget, and neither `schemas/ai-system-manifest.schema.json` nor
   `schemas/ai-policy.schema.json` has a place to put one; both are closed. A rule failing every project
   for omitting what no schema accepts would measure this framework's own incompleteness and blame the
   project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02
   section 8).
2. **R3 to R5 concern behaviour and records, not files.** Whether a retry is bounded on the path a
   request takes, whether recorded spend matches an invoice, and whether a figure was measured on the
   shipped configuration are not properties of a checkout. A detector reading source would be testing
   for the presence of a setting, which R6 forbids this framework from reporting as a result.
3. **No rule namespace exists for it.** The `cost` namespace is reserved
   ([Standard 7](07-boundary-with-adjacent-standards.md) names `cost.provider-portable` as a
   later-phase id, which is item 44's) and has no shard. This standard mints no id; naming one is a
   decision for the owner. A proposed rule, if one is natural, is recorded in the pull request that
   introduced this document for per-rule approval, and not here, so that this document does not
   describe a rule that does not exist.

**Severity.** A finding is reported at **warning** severity where a record, statement or label the
requirement asks for is missing or incomplete, even where the Tests table lists that absence as a
falsifier: the system may behave well, and what is missing is the account of it. A finding is reported at
**error** severity for each of: a ceiling reached without the recorded behaviour, a defined behaviour that
is continue-and-log or an alert alone, or a ceiling the system can raise for itself (R2); a multiplier
with no bound of its own in code or configuration, including one governed only by the budget above it (R3); spend folded into a
subject it does not belong to (R1); a cap, bound or negligibility claim with no mechanism or measurement
(R5); an estimate presented as the amount spent (R4); or a violation of R6 by any detector, rule, audit finding or generated report. Every other
finding is a warning, including a unit cost missing its model, price date or workload label (R5). The
two lists do not overlap: each falsifier in the Tests table is assigned to exactly one. These levels are this repository's judgment, listed in Additions, and are not
owner-approved. R1 to R5 are also `manual-review` obligations in this release; the validation type and
the severity are different things. R6 constrains this framework and has no validation type, because the
thing it prohibits is a behaviour of the tool.

**Exemptibility.** R6 is not exemptible: no project circumstance makes it reasonable for a scan to
report an effect from a presence, and a mechanism for excepting the prohibition would be
self-defeating. R5's prohibitions on a cap or bound claim with no mechanism and on a negligibility claim with no measurement are likewise not exemptible, because an
exception would record a project as knowingly making a claim nothing supports; a project that wishes
to say something stronger must name the mechanism. R1 to R4 reach a system only where their subject
exists — R2 only where a budget is stated or a ceiling applied, R3 only for the multipliers it has — and a system
without that subject records, in its own documents, that the requirement does not reach it and why.
This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4
dispositions attach to catalog rules, and this standard has none. No detector in this release would
contradict a false statement. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Spend can be read back from the system's own records at every granularity at which a budget is stated or a cost figure is reported, and spend that cannot be attributed appears as an unattributed amount | Spend recorded only per account or API key while budgets are stated, or cost figures reported, per tenant or per feature; or unattributed spend folded into a named subject | A system whose budgets are stated per account, and whose spend is recorded per account, must **not** be reported missing a per-user attribution |
| R2 | The ceiling is stated with its number, subject and period, its enforcement point is named, the system cannot raise its value (it is held where the system cannot write it, or the system can only lower it), and the configured behaviour is implemented; where the ceiling has been reached, the run shows the behaviour recorded for it (refused, queued, degraded, shortened, re-routed or routed to a person) and the call not made as before | The ceiling is reached and the call proceeds unchanged, with at most an alert and none of the recorded behaviour; the ceiling's value is read from configuration the system can raise during a run; or a ceiling stated without number, subject or period, without a named enforcement point, or with no defined behaviour; or a defined behaviour at the ceiling that is to continue and log, or to alert alone | A system that states no budget and applies no ceiling is out of scope for R2, not failing it; a ceiling reached and acted on must not be flagged for also alerting; a ceiling value the system cannot raise (read-only, or lower-only) must not be flagged |
| R3 | Each multiplier the system has has a stated bound; a reviewed static bound (a fixed completion limit, a retry maximum in configuration) establishes it without an execution record | A retry, fallback or repeated call with no maximum; no completion limit or history bound where billing is by tokens or time; or a multiplier governed only by the budget above it | A system that never retries, and says so, must **not** be reported as lacking a retry bound |
| R4 | Where a budget is stated, a record of how spend is reconciled exists with its method and interval, and the reconciliation has been performed within that interval; with or without a budget, no estimate is reported as the amount spent | A figure drawn only from estimates is reported as the amount spent, a stated budget with no reconciliation, an overdue reconciliation, or a reconciliation with no stated interval | A project that states no budget must **not** be failed for lacking a reconciliation; a project that states a budget and labels its figure an estimate avoids the misreporting finding only, and still owes the reconciliation record and interval |
| R5 | A published unit cost names model and price date, and workload where it depends on one; a cap or bound claim names the enforcing mechanism; a negligibility claim names its measurement | "Costs pennies per query"; a unit cost missing its model identifier, its price date or, where it depends on a workload, the workload; a figure whose model, price or workload has since changed; a cap claim with no mechanism; or "negligible" with no measurement | A statement of a measured figure with its model, date and workload, and no stronger claim, must **not** be flagged |
| R6 | No detector, rule, audit finding or generated report in this repository states a cost verdict from presence | A detector, rule, audit finding or report that stated cost controlled, capped or bounded because a token limit, budget figure, rate limit or alert was present | Reporting that a token limit or budget figure was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads a cost artifact and no fixture carries
one, so R1 to R5 are enforced by review or not at all, and R6 holds by construction. The negative
controls state what review must not do to a project that has the right subject and does the right
thing. **A requirement with no falsifier is a requirement nobody can be shown to have broken**, and that
is the honest state of this standard.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to
except. A project that knowingly does not meet one records that in its own documents; Standard 2's
dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release.
[Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by
default and `not-evaluable` ones never attestable, but it governs catalog rules, none exists here, and
the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the
`attested` disposition as not yet produced). No record under this standard expires on a schedule the framework sets; a reconciliation interval is the project's own under R4, and a reconciliation not repeated within it is stale;
[Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability
declarations and does not apply to these records. Review-staleness is event-driven, except that a reconciliation not repeated within its own interval is
stale; a record is otherwise stale when one of the events below occurs, and nothing in this release
detects either.

**What invalidates a recorded measurement, unit cost, attribution, reconciliation, run record or bound.** A stated budget or bound is a limit
someone chose; it is not made false by a change of model or price, and is revised by a decision or when
the subject it limits changes. A *measurement* of spend, a *unit cost*, and the *sufficiency* of a bound
are records about a configuration, and each event below makes the earlier record describe a different
subject:

- a change of model identifier, or a model silently updated behind an alias
  ([Standard 1](01-ai-system-manifest.md) R4 asks for the identifier to be pinned);
- a change of the provider's price, or of how the provider counts billed units;
- a change of the prompt, the retrieval parameters or the completion limit, each of which moves the
  billed units per request;
- a change of the retry, fallback or loop policy, or an observed retry, fallback or completion exceeding its stated bound;
- a change to a ceiling's value, subject, period, enforcement point or behaviour, to who can write it, to
  the history or truncation policy, or to provisioned capacity;
- a new subject (a feature, tenant or billing account) or a change of billing account, which makes
  earlier attribution and reconciliation records describe a different arrangement;
- a change in traffic shape: a new class of user, or a feature that makes a call per item rather than
  per request.

**A stale record is treated as missing.** A record made stale by an event above, or a reconciliation not
repeated within its interval, no longer satisfies the requirement it was offered for and is a missing
account (warning) until re-examined; a unit cost whose model, price or workload has since changed, and
an overdue reconciliation, are falsifiers of R5 and R4 respectively.

**Staleness is asymmetric here.** A cost record becomes false when something that feeds the bill
changes, and a price change at the provider is a change nobody in the project made. Nothing in this
release detects the transition; the events above are a note to a future reader.

**Contradicted by operation.** The recorded behaviour not occurring at the ceiling, or spend continuing
past a hard ceiling (a refusal, a stop, or routing to a person) as though none applied, contradicts the record made under R2
and invalidates it until re-examined. A soft ceiling (degrade, shorten, queue, re-route) may be crossed by the
call that triggered it, and the final bill exceeding the figure by that call is not itself a
contradiction; spend that keeps rising unaffected after the action is. What follows operationally is item 34's
subject (AI Incident Response, unwritten in this release); this standard says only that the record no
longer stands.

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one word, "Cost", inside a bullet of four subjects. It
states no requirement, level or evidence for any of them. The item is class `D` because its subject
token is derived from the brief; the requirements are not derived. Specifically authored here, none of
it owner-approved:

- **R1 in full**: attribution of spend to a project-owned subject at the budget's granularity, and the
  recording of unattributed spend as such rather than folded in.
- **R2 in full**, including the ruling that behaviour at the ceiling must not be "continue and log",
  that an alert alone is not an action, and that the enforcement point must be named even where it is
  outside the repository.
- **R3 in full**: the enumeration of multipliers (retries, fallbacks, repeated calls,
  completion length, carried history), the requirement that each be bounded independently of the budget
  above it, and the statement that having none is a legitimate answer.
- **R4 in full**: reconciliation of recorded spend with the billed amount (or, for provisioned or owned
  capacity, its accounting cost or utilisation), and its interval.
- **R5's prohibition** on a cap or bound claim with no enforcing mechanism and a negligibility claim with no measurement, the names a
  unit cost must carry (model, price date, and workload where one applies), and the ruling that it is not
  exemptible. It sets no price and no
  threshold.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in
  [Standard 25](25-grounding-and-hallucination-control.md) and
  [Standard 33](33-ai-observability.md).
- **The five exclusions in Scope** as division lines. The specification lists items 42 to 44 under the
  same bullet; where this standard stops and each begins is unconfirmed by anyone, and the lines to
  Standards 9 and 23 follow what those standards themselves say about item 41.
- **The severity assignments** (warning for a missing account; error for a ceiling reached without the recorded behaviour or one the system can raise for itself, a
  multiplier with no bound, spend folded into a subject it does not belong to, a cap, bound or
  negligibility claim with no mechanism or measurement, an estimate presented as spend, and a violation
  of R6 by any detector, rule, audit finding or report) and the statement that no attestation or scheduled expiry exists in this release.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the
  decision not to name a rule id in the unsharded `cost` namespace.

Not authored here: Standard 23's statement that cost ceilings are this item's, and Standard 9's
statement that one limit may serve both, are those standards' own and are cited, not restated.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) records inference cost, token budgets and
generative latency as owned by this pack with no existing owner, and lists `cost.provider-portable` as
a later-phase id; that id concerns provider portability (item 44) and is not minted or claimed here.

[Standard 23](23-agent-execution-security.md) R1 bounds an agent's steps and leaves cost ceilings to
this item, noting that an aggregate limit is where item 41's budgets would sit.
[Standard 51](51-agent-and-tool-execution-prohibitions.md) R1 prohibits an agent rewriting its own
step budget; it does not name a cost ceiling. [Standard 9](09-misuse-and-abuse-prevention.md) R3 bounds abusive volume and
says one limit may serve both purposes; this standard claims only the cost use.

[Standard 33](33-ai-observability.md) R1 and R2 govern what a call record contains and the subject that
served the call; R1 here adds attribution to them, and R3 relies on R2 for the recording of a
substitution. Its R5 concerns records dropped for cost, which is a different spend from the one governed
here.

[Standard 11](11-autonomy-levels-and-delegated-authority.md) R3 requires budgets a system holds to be
consistent with its declared tier; this standard does not restate it. [Standard 1](01-ai-system-manifest.md)
declares models, and R5 depends on the identifier it asks to be pinned. It does not declare budgets, and
no field is proposed by this standard. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4
govern the applicability and non-lowering language used above.
[Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests and falsifiers
section answers.

Items 42 (Latency Budgets for AI Interactions), 43 (Environmental Impact Accounting) and 44
(Operational Resilience, Degradation, and Provider Portability) are unwritten in this release; the lines
drawn above are provisional until they are, and the later standards may legitimately move them.

**Outside this pack.** The boundary review records no adjacent pack's standard as a precedent or
adjacency for this item. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds by construction.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away
as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds by construction, not by assertion.** No detector, rule or report in `scripts/`, `rules/` or `ai-policy.yml` has a concept of inference cost or budget in the sense of this standard. The rule `agent.step-budget-bounded` reads an agent's step budget, which [Standard 23](23-agent-execution-security.md) R1 states is not a cost ceiling; it is not a cost verdict. No test asserts the absence, so a future detector could break R6 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's cost control |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1, R2 | A place to declare attribution subjects and budgets: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R3 | Detectors for unbounded retry, fallback and completion length, each language-specific | Phase 3 detector work; a literal-reading heuristic would report a presence, which R6 forbids as a verdict |
| R4 | A convention for where reconciliation is recorded | The record is a finance or operations artifact outside the repository; this framework would be guessing |
| R5 | A check that a published unit cost names a model, date and workload | Reading intent from free text is a heuristic, and a false positive teaches a project to write whatever passes |
| R6 | A test asserting no detector emits a cost verdict | Meaningful only once a detector exists for it to constrain |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system's cost controlled, capped or
bounded from the presence of a token limit, a budget figure, a limiter configuration or an alert. R6
forecloses it, and the foreclosure is the point: a presence is not an effect, and a framework reporting
one would put its authority behind a property of the running system that nothing in a repository can
show.
