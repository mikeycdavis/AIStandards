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

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it — a repository that invokes a model, retrieves context for one, or acts on a model's output —
that depends on a model, a provider, a retrieval store or a tool service it does not itself operate,
or that operates a model or other AI-specific service whose host can fail.

Covers: knowing each dependency, external or self-operated, and what happens when it fails; the degraded service the
system gives and whether it says so; what a fallback must not do; keeping provider-specific behaviour
replaceable; exercising the arrangements; and the limit of what this framework can say about any of
it.

Two terms, each defined here rather than by the brief:

- A **dependency** is a service or host whose failure or change alters what the system produces and
  that is either external to the project, or is a model host or other AI-specific service the project
  itself operates: a model endpoint or the host a self-served model runs on, an embedding service, a
  vector store, a tool API, a moderation service. The project's ordinary infrastructure (its
  databases, queues and application servers) is not a dependency in this sense; Scope excludes it.
- A **degraded mode** is a defined, reduced service the system gives when a dependency is unavailable,
  slow, rate-limited, changed or untrustworthy, which may be to decline.

It does **not** cover, and claims none of the ground of, the following:

- **Ordinary service reliability** — availability targets, redundancy of the project's own
  infrastructure, backup — which is general engineering and not specific to AI use.
- **Rolling a release back.** Item 32, Rollback and Recovery, owns reverting a change this project made.
  A dependency failing is not a project change.
- **Time.** Item 42 owns latency budgets; a timeout is a degradation trigger here and a budget there.
- **Spend.** Item 41 owns cost; a fallback to a dearer model is a cost multiplier there.
- **Responding to an incident**, which is item 34's.

**Boundary posture X — owned canonically here, with a precedent.** The boundary review upholds the
plan's recommendation to claim the item. It records one precedent and only this:

- **EngineeringStandards, `standards/01-human-and-ai-operability.md`, rule `ai.provider-neutral`** —
  required level, severity `error`, validation type `code-analysis`, not non-exemptible. Its
  description: model providers sit behind an abstraction so capabilities remain stable when the model
  changes. The review's reasoning is that provider lock-in is an operational-resilience concern and the
  brief names resilience, and that this pack mints `cost.provider-portable` while the ES rule stays in
  ES.

This standard crosswalks to that rule for R4 only, as a **semantic** correspondence and never as a
reuse of its id. The precedent says nothing about the other five requirements here; they have none in
that pack, and the review records no other.

The precedent was read at EngineeringStandards `3b1b18d` on 2026-10-14. The standard's own text, R4
"Provider neutrality", says application domain logic **SHOULD NOT** depend directly on a specific
provider, while the rule record has level `required` and severity `error`. That difference is observed
and not resolved here; which governs is that pack's to say.

## Requirements

### R1 — Name each dependency, external or self-operated, and what its failure does

**A system MUST record each dependency, as defined in Scope, whose failure or change alters what it
produces, and for each MUST record what the system does under each of four conditions: unavailable,
slow, rate-limited and changed.**

A dependency not enumerated is a failure nobody planned for. The record is a document, not a manifest
field: `schemas/ai-system-manifest.schema.json` is closed and declares `models`, `tools` and
`dataSources`, but not failure behaviour. [Standard 1](01-ai-system-manifest.md) declares the models; this
requirement adds what happens when one is gone, and does not restate the declaration.

### R2 — Define the degraded mode, and say when the system is in it

**For each dependency in R1, and for each of its four conditions that results in reduced service, the
system MUST define a degraded mode, which MAY be to decline, and MUST make it detectable to the caller
or downstream process when a response was produced in a degraded mode. A system MUST NOT present a
degraded response in the same form as a full one.**

A fallback to a smaller model, a retrieval step that returned nothing, a tool that timed out and was
skipped: each produces a response of the usual shape. If the difference is only in a trace nobody reads,
the user and the downstream process cannot discount it. What the distinction is *named* is the
project's choice. Where the degraded system would otherwise **act**, an unavailable approval or an
indeterminate dependency does not proceed; that is [Standard 45](45-approval-gates.md) R6's subject and
is not restated.

### R3 — A fallback must not weaken the controls the primary path carries

**A fallback model, provider or path MUST NOT be used for an interaction unless the controls the
primary path applies — such as redaction, prompt and
instruction handling, output checks and logging — apply to it too, or the system declines.**

A fallback is a second path through the system, and it is the one least reviewed. A secondary provider
that is not under the data-handling arrangement of the first, a fallback model that is not behind the
output check, a path that skips redaction because "it's only for outages": each satisfies resilience by
dropping the control the primary carries. That the substitution happened is recorded under
[Standard 33](33-ai-observability.md) R2; this requirement concerns what the substitute is allowed to
do.

### R4 — Keep provider-specific behaviour replaceable, and say what replacement would require

**Provider-specific behaviour SHOULD live at integration boundaries behind an abstraction, and a project
that claims a provider can be replaced MUST state what would have to change and MUST NOT rest the claim
on the existence of the abstraction alone.**

This is the requirement the EngineeringStandards precedent corresponds to. It is written at SHOULD
because that standard's text is, and the difference from the rule record's level is noted in Scope. The
second half is this standard's addition: an interface with one implementation is a plan, not
portability. Behaviours that differ across providers — tokenisation, context length, tool-calling shape,
refusal behaviour, output format — are what make a swap a change of system, and the claim is about
those.

### R5 — Exercise the degraded and fallback paths, and record that they ran

**Each degraded mode and each fallback MUST be exercised — in a test, a drill or an observed real
event — and the project MUST record when and with what result and state how often it will be exercised
again; a path that has never been exercised, or whose latest recorded exercise is older than its stated
interval, MUST NOT be described as available.**

A fallback that has never run has an unknown failure rate, and the usual way to find it out is the
outage it was written for. The interval is the project's choice; the requirement is that one is stated
and that a dated result is on the record.

### R6 — This framework MUST NOT report resilience or portability from the presence of an arrangement

**No detector, rule, audit finding or generated report in this framework MAY state that a system is
resilient, degrades safely or is provider-portable because a fallback setting, a second provider name, a
retry policy or an adapter interface is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that a fallback model is
named or that an interface exists. It cannot show that the fallback is reachable, that it carries the
controls (R3), or that a second implementation would work. Reporting a pass from a presence would turn
an arrangement into a verdict about an effect.

**A fallback that exists and has never been shown to run is not demonstrated to work.** It is shown by
a request it served.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Unenumerated dependency | A moderation or embedding service whose outage nobody planned for | R1 |
| Failure behaviour left to the exception | What happens on provider failure is whatever the HTTP client's default does | R1 |
| Silent degradation | A response from a weaker model, or with no retrieved context, returned in the usual form | R2 |
| Distinction kept in a trace only | The degraded flag exists in telemetry; the caller never receives it | R2 |
| Degraded mode that acts | A system with a tool that proceeds on an indeterminate dependency | R2, [Standard 45](45-approval-gates.md) R6 |
| Fallback outside the controls | A secondary provider with no redaction, no output check, or different data terms | R3 |
| Fallback chosen for availability only | Failing over to an unreviewed model because it is up, and serving without a control the primary path applies | R3 |
| Abstraction as portability | One adapter implementation presented as provider independence | R4 |
| Unstated swap cost | "We can switch providers" with no account of what behaves differently | R4 |
| Never-run fallback | A failover path last exercised never, found broken in the outage | R5 |
| Arrangement read as resilience | A framework report of "resilient" because a fallback model is configured | R6 |
| Abstraction offered as portability | An interface presented as portability that has never carried a second provider, with no replacement list | R4 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | Each dependency and its failure behaviour | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | Each degraded mode and, where it produces a response, the field, header or shape that carries it with a sample of a degraded response; for a mode that declines, a captured declined outcome and the record that the decline is the mode | The project's output contract and a captured example | Human review |
| R3 | The controls on the primary path and a statement of how each applies to the fallback | Project code, configuration and data-handling terms | Human review |
| R4 | The boundary where provider-specific behaviour sits; and, where the project claims the provider can be replaced, the stated list of what replacement would change | Project code and documentation | Human review |
| R5 | The date and result of each exercise of a degraded or fallback path, and the stated interval; an exercise record without a result is incomplete | Test records, drill records or incident records | Human review of the records |
| R6 | The absence of any detector, rule, audit finding or generated report that reports resilience from a setting or presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R5 is a human-authored record. A document naming a fallback establishes that the
project wrote it down and says nothing about whether the running system takes it; the reviewer reads
what is claimed against the code, configuration and records that would carry it out.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that
every standard cite at least one rule or record in its Validation section why it ships with none; this
is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation,
that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers
section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 or R2 would look for a declared dependency
   inventory or degraded mode, and neither `schemas/ai-system-manifest.schema.json` nor
   `schemas/ai-policy.schema.json` has a place to put one; both are closed. A rule failing every project
   for omitting what no schema accepts would measure this framework's own incompleteness and blame the
   project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02
   section 8).
2. **R2, R3 and R5 concern behaviour and records, not files.** Whether a degraded response is
   distinguishable on the path a request takes, whether a fallback is behind the controls, and whether it
   ever ran are not properties of a checkout. A detector would test for the presence of a setting, which
   R6 forbids this framework from reporting as a result.
3. **The crosswalked rule is not this pack's to re-mint, and its id is not decided.**
   [Standard 7](07-boundary-with-adjacent-standards.md) R3 lists `cost.provider-portable` as a
   *later-phase* id corresponding to `ai.provider-neutral`. No `cost` shard exists, and this standard
   adds none, so that id is neither minted nor claimed here. Whether R4 becomes a rule, under that id or
   another, is the owner's decision; a proposal, if one is natural, is recorded in the pull request that
   introduced this document for per-rule approval.

**Severity.** A finding is reported at **error** severity when review observes one of: a fallback
serving an interaction without a control the primary path applies (R3); a degraded response presented in
the form of a full one (R2); a degraded mode or fallback described as available that has never been
exercised or whose latest exercise is older than its stated interval (R5); or a detector's violation of R6. **Every other finding is reported at warning
severity**, including a missing or incomplete record, statement or label (R1 to R5), a missing
statement of how a fallback's controls apply, and provider-specific behaviour embedded in domain logic
under R4's abstraction clause, which is a SHOULD. The assignment is exhaustive and does not depend on
how the finding is phrased. These levels are this repository's judgment, listed in Additions, and are
not owner-approved. R1 to R5 are also `manual-review` obligations in this release; the validation type
and the severity are different things. R6 constrains this framework and has no validation type, because
the thing it prohibits is a behaviour of the tool.

**Exemptibility.** R6 is not exemptible, for the reason R6 of
[Standard 25](25-grounding-and-hallucination-control.md) is not. R3 is not lowered by an outage: a
fallback that drops a control is the case the requirement exists for, and a project that cannot apply
the control on the fallback declines rather than recording an exception. R1, R2, R4 and R5 reach a
system only where its dependencies and fallbacks exist, and a system without that subject records, in
its own documents, that the requirement does not reach it and why. This release has no policy mechanism
for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules,
and this standard has none. No detector in this release would contradict a false statement. No level
here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each dependency, including a self-served model's host, has a recorded behaviour for each of the four conditions: unavailable, slow, rate-limited, changed | A dependency in use with no record, or a record covering only a total outage | A system whose record states, for the model dependency, that the degraded mode under each condition is to decline, recorded as its degraded mode, must **not** be reported missing a degraded mode |
| R2 | Every R1 condition that results in reduced service is defined as a degraded mode, and a response produced in a degraded mode carries the recorded field, header or distinct response shape that a full response does not | A reduced-service behaviour in the R1 record that is not defined as a degraded mode, no such signal recorded, or the signal absent from a degraded response (comparing the generated text of the two does not establish a signal) | A system whose recorded degraded mode is to decline must **not** be failed for lacking a separate marker on responses it never produces in a degraded form; a system that declines without recording the decline as its degraded mode fails R2 |
| R3 | A request served by the fallback passes through the controls of the primary, or is declined | A fallback that serves an interaction without a control the primary path applies (no redaction, no output check) | A fallback behind the same controls must **not** be flagged for being a different model |
| R4, replacement claim | A stated list of what replacement would change exists beside the claim | "Provider-agnostic" with one adapter and no list | A project that makes no portability claim and says so must **not** be failed for lacking a replacement list |
| R4, abstraction | Provider-specific calls and request shapes sit at an integration boundary behind an interface | Provider-specific behaviour (a provider SDK call, a provider-specific request shape) embedded in domain logic | A provider SDK used only inside the adapter or integration module must **not** be flagged |
| R5 | A dated record of an exercise, with its result, and a stated interval, exist for each degraded mode and each fallback, and the latest exercise falls within the interval, or the path is not described as available until it is exercised again | A degraded mode or fallback with no record of ever running, or with no stated interval, or whose record of an exercise gives no result, or whose latest exercise is older than its interval and which is still described as available | A degraded mode exercised only in a test, and recorded as such, must **not** be flagged for not having been used in production |
| R6 | No detector, rule, audit finding or generated report in this repository states a resilience verdict from presence | A detector, rule (a rule that treats a presence as establishing the property), audit finding or report that reported resilient because a fallback model was configured | Reporting that a fallback setting was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads a resilience artifact and no fixture
carries one, so R1 to R5 are enforced by review or not at all, and R6 holds by construction. **A
requirement with no falsifier is a requirement nobody can be shown to have broken**, and that is the
honest state of this standard.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to
except. A project that knowingly does not meet R1, R2, R4 or R5 records that in its own documents; R3 admits no
exception and is met by declining; Standard 2's
dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release.
[Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by
default and `not-evaluable` ones never attestable, but it governs catalog rules, none exists here, and
the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the
`attested` disposition as not yet produced). No record under this standard expires on a schedule;
[Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability
declarations and does not apply to these records. Review-staleness is event-driven only: a record is
stale when one of the events below occurs, and nothing in this release detects that.

**What invalidates a recorded dependency inventory, degraded mode or exercise.** Each is a different
subject, and a record made before the change describes the earlier one:

- a change of model identifier, or a model silently updated behind an alias
  ([Standard 1](01-ai-system-manifest.md) R4 asks for the identifier to be pinned);
- a provider's deprecation, change of terms, rate limits or data-handling arrangement;
- the addition of a dependency, tool or retrieval store, or a change in what a tool returns;
- a change to the controls on the primary path, which a fallback must now match (R3);
- a change of the retry, fallback or timeout policy.

**Staleness is asymmetric here.** A resilience record becomes false when the primary path gains a
control the fallback does not have, and a provider's change is one nobody in the project made. Nothing
in this release detects the transition; the events above are a note to a future reader. An exercise
that ran before such a change says nothing about the path as it now is.

**Contradicted by operation.** An outage in which the system failed in a way the record did not
describe, or a fallback that proved unavailable, contradicts the record and invalidates it until
re-examined. What follows operationally is item 34's subject (AI Incident Response, unwritten in this
release); this standard says only that the record no longer stands.

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes two words, "operational resilience", inside a bullet of four
subjects. It states no requirement, level or evidence for them, and the specification's title adds
"degradation" and "provider portability". The item is class `D` because its subject token is derived
from the brief; the requirements are not derived. Specifically authored here, none of it
owner-approved:

- **R1 in full**: the dependency inventory and the recorded failure behaviour.
- **R2 in full**: the defined degraded mode (which may be to decline), its detectability downstream, and
  the ruling that a degraded response must not be presented in the form of a full one.
- **R3 in full**: that a fallback must not weaken the controls of the primary path, and that where it
  would, the system declines.
- **R4's second half**: the requirement to state what replacement would change, and the ruling that an
  abstraction alone is not a portability claim. The first half corresponds to the EngineeringStandards
  precedent and is written at its SHOULD.
- **R5 in full**: exercising degraded and fallback paths and recording when.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in
  [Standard 25](25-grounding-and-hallucination-control.md) and
  [Standard 33](33-ai-observability.md).
- **The exclusions in Scope** as division lines. Where this standard stops and items 32, 34, 41 and 42
  begin is unconfirmed by anyone.
- **The recheck of the precedent** at EngineeringStandards `3b1b18d` on 2026-10-14, including the
  observation that the standard's text and the rule record differ in level, which the boundary review
  did not make.
- **The severity assignments** (error for an observed fallback serving without a primary-path control,
  an observed degraded response in full form, a path described as available that was never exercised or is overdue,
  and a detector's violation of R6; warning for every other finding) and the statement that no
  attestation or scheduled expiry exists in this release.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the
  decision to mint no id.

Not authored here: the classification of `ai.provider-neutral` as a precedent and the posture itself are
the boundary review's, and its `humanSignOff` is `null`.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) R3 records the crosswalk between
`cost.provider-portable` (a later-phase id, neither minted nor claimed here) and
EngineeringStandards' `ai.provider-neutral`. It is a correspondence of subject, not of id.

[Standard 45](45-approval-gates.md) R6 requires a gate to fail closed; R2 here defers to it for any
degraded mode that would otherwise act. [Standard 33](33-ai-observability.md) R2 and R3 govern the
record of which subject served a call and of outcomes that are not success; R2 and R3 here rely on them
and do not restate them. [Standard 23](23-agent-execution-security.md) governs the controls on agent
execution that a fallback path must also carry (R3).

[Standard 1](01-ai-system-manifest.md) declares models, tools and data sources, and R1 depends on that
declaration. It does not declare failure behaviour, and no field is proposed by this standard.
[Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and
non-lowering language used above. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the
requirement the Tests and falsifiers section answers.

Items 32 (Rollback and Recovery), 34 (AI Incident Response), 41 (Inference Cost and Budget Control) and
42 (Latency Budgets for AI Interactions) are not part of this change; the lines drawn above are
provisional until they are written, and the later standards may legitimately move them.

**Outside this pack.** EngineeringStandards' `ai.provider-neutral` is named in Scope with what the
boundary review recorded about it. It is a crosswalk to this pack's R4 only, in the sense above, and no
maintainer of that pack has confirmed the reading. No ADR covers this standard — `artifacts/adr/` does
not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds by construction.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away
as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds by construction, not by assertion.** No detector, rule or report in `scripts/`, `rules/` or `ai-policy.yml` emits a verdict about model, provider or dependency fallback, degradation or portability. No test asserts the absence, so a future detector could break R6 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's resilience |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1, R2 | A place to declare dependencies and degraded modes: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R3, R5 | Fixtures with a fallback served and a control applied, and a detector that runs project-supplied checks | Phase 3 detector and evidence-availability work |
| R4 | A detector for provider SDK use inside domain modules, and the rule id that would carry it | Language-specific, and the id (`cost.provider-portable` or another) is the owner's decision; it would report a presence unless it also read a recorded replacement list |
| R6 | A test asserting no detector emits a resilience verdict | Meaningful only once a detector exists for it to constrain |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none and mints none |

**What no future release will implement.** A detector that reports a system resilient, degrading safely
or provider-portable from the presence of a fallback setting, a second provider name, a retry policy or
an adapter interface. R6 forecloses it, and the foreclosure is the point: an arrangement is not an
effect, and a framework reporting one would put its authority behind a property of the running system
that nothing in a repository can show.
