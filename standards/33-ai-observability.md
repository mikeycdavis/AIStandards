# Standard 33 — AI Observability

When an AI system misbehaves, the first question is what it was asked, by what, and what came back.
A conventional service answers that from its request log. A system that calls a model often cannot:
the call goes to a provider, the model identifier is a name that may point at something different
next month, the prompt is assembled from parts at run time, and the failures that matter most — a
refusal, a truncated completion, a retry that quietly produced a second answer, a fallback to a
cheaper model — all arrive as a successful HTTP response.

This standard is about the **inference call** as the unit of observation. It asks that each call
leave a record from which the call can be reconstructed and its outcome told apart from success, and
that the records not be lost in ways that favour the cases nobody wanted to see. It deliberately does
not ask for the monitoring of a *model's own behaviour* — drift, realised performance, segments —
because another pack owns that where a project serves a model, and this pack's job there is to
defer to it.

The failure this standard is written against is observability asserted from the presence of
instruments: a tracing library in the dependency list, a logging call near the model client, a
dashboard that was once built. None of those says that the call a user is complaining about left a
record, or that the record could be told from a success.

Source: item 33 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "Observability" token of the "Observability, incident response, red teaming, and
auditability" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 33 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **B**,
> `CONFIRMED` in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json), whose
> substantive half is human judgment and carries `humanSignOff: null`. No maintainer of any adjacent
> pack has confirmed it.
>
> **The brief supplies one word and this standard supplies the rest.** The brief's bullet names
> "Observability" and states no requirement for it. The item is class `D` because its token is the
> brief's own; the requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it — a repository that invokes a model, retrieves context for one, or acts on a model's output —
at every point where it sends a request to a model, whether the model is hosted by a provider or
served by the project.

Covers: what a record of one inference call must let a reader reconstruct; which outcomes of a call
must be distinguishable from success; how sampling and loss of those records are handled; where this
standard stops and the monitoring of a model's behaviour begins; and the limit of what this framework
can say about any of it.

Two terms, each defined here rather than by the brief:

- An **inference call** is one request from the system to a model, together with each retry or
  fallback it causes. It is not a user session and not an agent's whole run, which may contain many.
- A **trace record** is whatever the system stores about an inference call: a log line, a span, a row,
  an event. The form is the project's choice; this standard fixes none.

It does **not** cover, and claims none of the ground of, the following:

- **Monitoring a deployed model's behaviour** — prediction volume and distribution, input health,
  realised performance, drift, segmented reporting, alert thresholds and owners. That is
  MachineLearningStandards' subject; see the posture note below. Nothing in this standard states or
  restates one of its requirements.
- **Silenced failures in general** — telemetry removed to hide errors, or a system claimed observable
  while its critical failure paths are invisible. EngineeringStandards owns that prohibition for every
  repository; this standard does not restate it and adds only the inference-specific outcomes in R3.
- **Item 34, AI Incident Response**, **item 35, Red Teaming** and **item 36, Auditability of AI
  Actions** — the other subjects of the same bullet, all unwritten in this release. What a project
  does *with* a trace is theirs. Item 36 in particular may require records this standard does not;
  where it does, it states them.
- **What may be recorded.** Whether a prompt or completion may be stored, and in what form, is
  [Standard 13](13-personal-data-in-ai-systems.md) R3's, through `privacy.no-unredacted-prompt-logging`.
  Everything below is subject to it and none of it relaxes it.

**Boundary posture B — a baseline, with deference.** The boundary review records the owner as
"MachineLearningStandards for deployed-model monitoring; EngineeringStandards for silenced failures;
AIStandards for inference-call tracing". Every statement about those packs below was read through git
objects, not working trees:

- **MachineLearningStandards, `standards/24-monitoring.md`.** Its scope reads: "Applies to every
  deployed model from the moment it serves its first prediction". Its R1 to R5 require emitted signals
  with history, realised performance, segmentation, thresholds with named owners, and monitoring of
  the monitoring; its rule is `monitoring.production-monitoring-defined`.
- **MachineLearningStandards, `standards/21-drift.md`.** Its scope reads: "Applies to every model
  serving predictions that influence a decision, from the point of deployment onward."
- **EngineeringStandards, `standards/48-error-handling-and-observability.md`.** Its R4, "Never silence
  a failure path", carries `observability.no-silenced-failures`, `forbidden`, `manual-review`,
  exemptible.

Both ML files are byte-identical at `f3a1258` (1.6.0, the commit the review pins), `80a5a82` (that
repository's `main`) and `43fe0c5` (the head of its current feature branch, read through git);
the EngineeringStandards file is byte-identical at `b90b915` (the pin) and `3b1b18d` (its current head).
Read on 2026-10-03. The review's pins are from 2026-09-04; this is a recheck of three files, not a
refresh of the inventory.

**The review's reasoning is an inference, and this standard does not depend on it.** The review
reasons that a project calling a hosted model deploys no model of its own, so the two ML standards do
not reach it. Whether they reach a hosted model the project did not train is not something either
pack says, and the same question for MachineLearningStandards' evaluation standards is recorded as
unknown for item 17 and as open question Q22. This standard therefore (a) applies to every inference
call regardless, (b) claims no reading of the ML pack's reach, and (c) makes the project declare
which case it is in (R4) rather than infer it. Where both packs govern a concern, the more specialised
requirement governs and the stricter compatible one applies
([Standard 7](07-boundary-with-adjacent-standards.md) R5).

**A shared namespace, not a shared id.** `observability.` is one of the six segments this pack
reserves and another pack also uses — EngineeringStandards, per
[Standard 6](06-standard-structure-and-rule-identity.md) R5. No rule id is minted here (see
Validation), so no full id can collide ([Standard 7](07-boundary-with-adjacent-standards.md) R4).

## Requirements

### R1 — Each inference call leaves a record that can reconstruct it

**A system MUST record, for each inference call, enough to reconstruct what was asked of which model
and what the outcome was: a correlation identifier shared with the work that caused the call, the
model identifier the request named, the revision of the prompt used, the start time and duration, and
the outcome class defined in R3. It MUST NOT depend on the provider's own logs as the only record.**

The correlation identifier is what turns a user's complaint into one call: without it the record is a
pile. The model identifier is the one [Standard 1](01-ai-system-manifest.md) R4 asks the manifest to
pin, and the prompt revision is the committed artifact
[Standard 21](21-prompt-and-instruction-security.md) asks for; a record that names neither describes
a call whose subject cannot be recovered, which is the problem
[Standard 17](17-evaluation-plans-for-generative-systems.md) R6 states for an evaluation result and
this requirement states for a single call.

**A provider's log is a second witness, not the record.** It is retained on the provider's terms,
indexed by the provider's identifier, and unavailable in the case that most needs it: the provider
being down, or the project changing provider.

Whether the *content* of the prompt and completion is stored is not decided here. A record that
holds none of it still satisfies this requirement, and one that holds it does so only as
`privacy.no-unredacted-prompt-logging` permits.

### R2 — The record names the subject that actually served the call

**Where the model that served a call can differ from the one requested — an alias that resolved, a
router, a fallback — the record MUST carry what served it, as well as what was requested, and a change
in either MUST be visible by comparing records.**

A project that pins an identifier (Standard 1 R4) and then records the pin from configuration has
recorded what it intended. The only record that tells the truth about a call is one that carries what
the provider reported back, where the provider reports one. Where the provider reports nothing, the
record says so; it does not repeat the request's identifier as though it had been confirmed.

This is the same distinction as R1's, applied at the point where it breaks most often: a silent model
swap shows up in a trace as a change in behaviour with no change in the record, and R2 is what makes it
show up as a change in the record.

### R3 — Outcomes that are not success are told apart from it

**A system MUST record the outcome of each inference call as one of a set that distinguishes at
least: completed, refused or filtered by the provider or by the system, truncated, failed with a
provider or transport error, timed out, and retried or fallen back (with the call that resulted), and
MUST NOT record a call as completed because a response was received.**

These are the cases where the transport reports success and the call did not do what was wanted. A
truncated completion presented as a whole one is a failure; so is a refusal read as an answer.
Which names the project uses is its own choice — the requirement is that the set separates these
outcomes and that the record carries one.

This is an inference-specific naming of outcomes, not the general prohibition on silencing failure
paths, which EngineeringStandards' `observability.no-silenced-failures` states for every repository
and which this standard neither restates nor weakens. Where a project breaches that prohibition it
breaches it independently of whether R3 is met.

**A retry or fallback is part of the call, not a second call that erases the first.** A call that
failed and was retried successfully is a different fact from one that succeeded, and the record
carries both.

### R4 — Say which case applies, and where the model is the project's, defer

**A project MUST record whether its inference calls go to a model it hosts or trains, to a provider's
hosted model, or both, and where a model is the project's own, the monitoring of that model's
behaviour is governed by MachineLearningStandards; this standard MUST NOT be offered as satisfying
it.**

The declaration is the project's, not a finding. An absent training pipeline, a vendor-hosted weights
file or an API client does not by itself decide the case — the repository shows which clients are
imported and says nothing about who operates the model — and
[Standard 17](17-evaluation-plans-for-generative-systems.md) and Q22 record the same caution for
evaluation. A project that records "both" has recorded a fact, not hedged.

Where the project's model is its own, R1 to R3 still apply to each call the system makes to it,
because a call is a call; what changes is that the model's behaviour over time is another pack's
subject. Where the two overlap, the more specialised requirement governs and the stricter compatible
one applies (Standard 7 R5).

The record is a document. `schemas/ai-system-manifest.schema.json` is closed and has no place for the
case; `models` carries `id`, `provider` and `role`. Nothing here asks an adopter to write a field that
schema rejects.

### R5 — Sampling and loss never remove the failure cases, and are themselves recorded

**Where trace records are sampled, dropped or truncated for volume or cost, the policy MUST be
recorded with its rate, MUST NOT discard records of calls whose outcome is not completed, and loss of
records, by export failure or by exceeding a limit, MUST be detectable.**

Sampling that is uniform over calls keeps the failure cases at the rate they occur and loses most of
them. A system whose failures are one call in two hundred and whose trace sample is one in ten has
observed one failure in two thousand. The point of keeping the not-completed outcomes whole is that
they are the records an investigation reads.

This is the same shape as the EngineeringStandards concern with telemetry removed "to hide errors or
noise" and, like it, is not offended by reducing volume while the failure signal survives. This
requirement states the form for inference records and does not restate it.

**A record that was never written cannot be shown absent from the record.** Detectable loss means a
count somewhere — emitted against received, a gap in a sequence, an exporter error that is itself
recorded — so that an absence of records for a time window can be told from an absence of calls.

### R6 — This framework MUST NOT report a system observable from the presence of instruments

**No detector, rule, audit finding or generated report in this framework MAY state that a system is
observable, that its inference calls are traced, or that its trace records are complete, because a
tracing or logging library, a configuration, an exporter or a dashboard definition is present in the
repository.**

A repository can show that a tracing library is imported, that a logger is called beside a model
client, or that a dashboard definition exists. It cannot show that the call path a user took called
the logger, that the exporter delivered, that the records were retained, or that anyone reads them.
Reporting a pass from any of those would turn the presence of an instrument into a verdict about what it
captured.

Whether trace records are complete, retained for the period anyone needs and reachable by the person
investigating is an operational fact about a running system. It is **not-evaluable** from a repository.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Orphan record | Calls logged with no identifier shared with the request that caused them, so a complaint cannot be traced to one | R1 |
| Provider as the only record | Reconstructing a call requires the provider's logs, which are unavailable when the provider is | R1 |
| Subject not recorded | The record names neither the model identifier nor the prompt revision | R1 |
| Intent recorded as fact | The pinned identifier copied from configuration into every record, so a silent swap leaves the record unchanged | R2 |
| Fallback invisible | A call served by a different model than requested is recorded as the requested one | R2 |
| Response as success | A refusal, truncation or filtered completion recorded as completed because HTTP returned 200 | R3 |
| Retry erases the first call | A failure retried successfully leaves one success and no trace of the failure | R3 |
| Case inferred | A project's model-ownership case concluded from imports, with the ML pack's subject assumed covered or not | R4 |
| Observability offered as monitoring | Per-call tracing presented as satisfying the monitoring of a model the project serves | R4 |
| Uniform sampling | Failure records kept at the sampling rate and so mostly lost | R5 |
| Silent loss | Records dropped by an exporter or a limit with no count anywhere, so absence of records reads as absence of calls | R5 |
| Presence read as capture | A framework report of "observable" because a tracing library or dashboard exists | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | A sample trace record for one call, showing each field, and the path that produces it | The project's trace store and the code that writes it | Human review |
| R2 | Two sample records for a call that was served by a different model than requested, or a statement that the provider reports none | The project's trace store and its provider documentation | Human review |
| R3 | The outcome set the project uses, and a sample record for each of the listed outcomes that the system can produce | The project's trace store and code | Human review |
| R4 | The recorded case: own model, provider-hosted, or both | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human determination |
| R5 | The sampling policy with its rate, and the count or gap by which loss is detected | The project's telemetry configuration and its documentation | Human review |
| R5 (completeness) | None obtainable from a repository | — | **Not-evaluable** |
| R6 | The absence of any detector that reports observability from presence | This repository's own detectors and tests | Code review; see Implementation |

A document that describes a trace record, an outcome set or a sampling policy establishes that the
project wrote it. It does not establish that the system produces such records; the reviewer reads the
document against the code and a sample from the store.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
[Standard 6](06-standard-structure-and-rule-identity.md) R3 requires every standard to cite at least
one rule or record why it does not; this is that record.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R4 would look for a declared case, and
   neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place for
   one; both are closed. A rule failing every project for omitting what no schema accepts would measure
   this framework's own incompleteness and blame the project for it. Adding a schema field is a
   schema-versioning decision, outside this slice (plan 02 section 8).
2. **R1 to R3 and R5 concern what a running system writes.** Whether each call reaches a record,
   whether a refusal is told from a completion, and whether sampling spares failures are properties of
   behaviour and of a store, not of source text. A detector reading source would test for the presence
   of a logging call, which R6 forbids this framework from reporting as a result.
3. **No id is minted in a namespace another pack also uses.** `observability.` is reserved here and
   used by EngineeringStandards. Standard 7 R4 forbids only a colliding full id, so an id could be
   chosen; naming one is a decision about which pack's rule a gap belongs to, and that decision is not
   made here. No open question is recorded for it, because nothing in this standard needs one answered.

**Severity.** R1 to R5 are `manual-review` obligations in this release. R5's completeness is
**not-evaluable** and is not reported as reviewed. R6 constrains this framework and has no validation
type, because the thing it prohibits is a behaviour of the tool.

**Exemptibility.** R6 is not exemptible: no project circumstance makes it reasonable for a scan to
report an effect from a presence, and a mechanism for excepting the prohibition would be
self-defeating. R3's requirement not to record a received response as completed is likewise not
exemptible, because an exception would record a project as knowingly mislabelling its failures. R1,
R2, R4 and R5 reach a system only where their subject exists — R2 only where the served model can
differ from the requested one, R5 only where records are sampled or can be lost — and a system without
that subject may declare the requirement not-applicable under
[Standard 2](02-ai-risk-tiering-and-applicability.md) R4 with a reason and a `revisitWhen`. No detector
in this release would contradict a false declaration. No level here is lowered by a risk tier
(Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | From one trace record, the model identifier, prompt revision, outcome and correlation identifier are all recoverable | A record carrying none of the identifiers, or one that can be reconstructed only from the provider's log | A record that stores no prompt or completion text must **not** be failed for that |
| R2 | A call served by a model other than the requested one yields a record that differs from the requested-only record | The two records identical | A provider that reports nothing, with the record saying so, must not be failed for lacking a served-model value |
| R3 | A truncated completion and a provider refusal each produce an outcome other than completed | Either recorded as completed because a response arrived | A call that completed produces completed and is not flagged |
| R4 | The recorded case is present and is not derived from imports | A case inferred from the dependency list | A project recording "both", or "provider-hosted", with a reason, must **not** be treated as hedging |
| R5 | With a one-in-ten sample, a failing call is recorded and an exporter failure leaves a count | A failed call dropped by the sample, or loss with no count | A sample that drops completed calls at its stated rate and keeps every other outcome must **not** be flagged |
| R6 | No detector or report in this repository outputs an observability verdict from presence | A detector that reported traced because a tracing import was present | Reporting that a tracing library was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads a trace artifact and no fixture carries
one, so R1 to R5 are enforced by review or not at all, and R6 holds by construction. The negative
controls state what review must not do to a project that has the right subject and does the right
thing. **A requirement with no falsifier is a requirement nobody can be shown to have broken**, and
that is the honest state of this standard.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to
except. A project that knowingly does not meet one records that in its own documents; Standard 2's
dispositions apply to the application of a rule, and this standard has none.

**What invalidates a recorded trace design, case or sampling policy.** Each of these changes what a
record means, and a design made before the change describes the earlier system:

- a change of provider, of model identifier, or of the routing or fallback rule that picks a model;
- a change of the client library or wrapper that issues the call, since the record is usually written
  there;
- the introduction of an agent loop, retries, streaming or tool calls, each of which changes what one
  call is;
- a change of the sampling rate, the exporter or the retention period;
- the project beginning to serve a model of its own, which makes R4's recorded case false at once.

**Staleness is asymmetric here.** A trace design becomes false when a project adds a feature that
issues model calls by another path, and a new path is exactly what nobody checks the logging for.
Nothing in this release detects the transition; the events above are a note to a future reader.

**Contradicted by operation.** An incident in which a call could not be found, or a failure was found
to have been recorded as a success, contradicts what the project recorded under R1 to R3 and
invalidates it until re-examined. What happens operationally is item 34's subject (AI Incident
Response, unwritten in this release); this standard says only that the record no longer stands.

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one word, "Observability", inside a bullet of four
subjects. It states no requirement, level or evidence for any of them. The item is class `D` because
its subject token is derived from the brief; the requirements are not derived. Specifically authored
here, none of it owner-approved:

- **The inference call as the unit of observation**, and its definition including retries and
  fallbacks. The brief does not say what is observed.
- **R1's field list** (correlation identifier, requested model identifier, prompt revision, timing,
  outcome class) and the ruling that the provider's own log is a witness and not the record. The
  brief names no field.
- **R2 in full**: the requested-versus-served distinction and the requirement that a record not repeat
  the request as though confirmed.
- **R3's outcome set** and the ruling that receipt of a response is not completion; the non-exemptibility
  of that ruling.
- **R4's declaration** of which model-ownership case applies, and the rule that it is declared, not
  inferred. The deference to MachineLearningStandards where the model is the project's is the boundary
  review's finding, not this document's; the form it takes in R4 is.
- **R5's ban on discarding non-completed records** and its requirement that loss be detectable.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in
  [Standard 8](08-ai-safety-requirements-and-safety-cases.md),
  [Standard 17](17-evaluation-plans-for-generative-systems.md) and
  [Standard 25](25-grounding-and-hallucination-control.md).
- **The exclusions in Scope** as division lines, including items 34, 35 and 36. Where each begins is
  unconfirmed by anyone.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it and the
  decision to mint no id in the shared `observability.` namespace.
- **The recheck of three sibling files** at current heads, and the observation that the review's
  hosted-model reasoning is an inference this standard does not rely on. Neither is the boundary
  review's.

Not authored here, and recorded so the reader does not credit this standard with it: the posture `B`,
the three-way owner division and the sibling evidence are the boundary review's.

## Relationship to other standards and ADRs

[Standard 1](01-ai-system-manifest.md) R4 pins the model identifier and
[Standard 21](21-prompt-and-instruction-security.md) makes the prompt a committed artifact; R1 and R2
here record, per call, the two things those requirements pin.
[Standard 13](13-personal-data-in-ai-systems.md) R3 governs what a record may contain and is not
relaxed by anything above. [Standard 17](17-evaluation-plans-for-generative-systems.md) R6 states the
evaluated-subject problem that R1 states for one call.

[Standard 7](07-boundary-with-adjacent-standards.md) R5 orders a conflict between packs, specialist
first and then the stricter compatible requirement, and R4 is the full-id rule that the shared
`observability.` segment is checked against; [Standard 6](06-standard-structure-and-rule-identity.md)
R5 declares that overlap. [Standard 25](25-grounding-and-hallucination-control.md) R2 asks that
whether an output was produced with its basis be carried in the system's own data; a trace record is
one place it may be carried, and this standard does not require it. [Standard 2](02-ai-risk-tiering-and-applicability.md)
R3 and R4 govern the applicability and non-lowering language used above.

Items 34 (AI Incident Response), 35 (Red Teaming) and 36 (Auditability of AI Actions) are unwritten in
this release; the lines drawn above are provisional until they are, and the later standards may
legitimately move them.

**Outside this pack.** MachineLearningStandards' Standards 24 (Monitoring) and 21 (Drift) and
EngineeringStandards' Standard 48 R4 are named in Scope with what the boundary review recorded and what
was read. They are not crosswalks, nothing in them is restated, and no maintainer of either pack has
confirmed this reading. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds by construction.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away
as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds by construction, not by assertion.** No detector, rule or report in `scripts/`, `rules/` or `ai-policy.yml` has a concept of observability, tracing or telemetry; a search of `scripts`, `schemas`, `templates`, `rules`, `ai-policy.yml` and `test` found no use of it as a subject other than the reserved namespace name `observability` and its declared overlap in `scripts/catalog.mjs`, which name an identifier prefix and no check. No test asserts the absence, so a future detector could break R6 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's observability |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1, R2, R3 | A convention for the trace record and its outcome set, and a way to read a project's own records | The shape is the project's; a repository scan cannot read a store, and Phase 3 detector and evidence-availability work follows the corpus |
| R4 | A place to record the case: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R5 | A fixture with a sampled and a failing call, and a way to read an exporter's loss count | Needs R1 to R3's artifacts to exist first |
| R6 | A test asserting no detector emits an observability verdict | Meaningful only once a detector exists for it to constrain |
| Rule id | An id in a shared namespace, once an owner is decided | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system observable, its inference
calls traced or its records complete from the presence of a tracing or logging library, a
configuration, an exporter or a dashboard definition. R6 forecloses it, and the foreclosure is the
point: an instrument's presence is not what it captured, and a framework reporting it would put its
authority behind a property of a running system that nothing in a repository can show.
