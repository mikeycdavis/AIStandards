# Standard 52 — Output Honesty Prohibitions

A user reads what a system says it did. "Saved", "sent", "I checked that against the source", "done":
each is a report of an event, and the user acts on it as one. Most of the damage a dishonest output does
is done in the next ten minutes, by a person who believed it and did not repeat the work.

Standard 28 states the positive duty: what a system says it can do must agree with the deployment it is
shown in. This standard holds the other face of the same subject, and holds only the part Standard 28
does not already state. It is not about a capability the deployment lacks, which Standard 28 owns. It is
about outputs that report something that did not happen: an operation the deployment could perform and
did not, a check that never ran, and an instruction in the system's own configuration that tells the
model to say so anyway.

The failure this standard is written against is a report with nothing behind it: a "your booking is
confirmed" returned after a tool call that failed, a "verified" returned where no verification step
exists, a prompt line that says never to admit a lookup returned nothing.

Source: item 52 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
authored as the negative face of the "capability honesty" token of the "Hallucination, uncertainty,
citation, and capability honesty" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 52 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) by listing item 52 under
> `notGovernedElsewhere`, and that review's substantive half is human judgment and carries
> `humanSignOff: null`. No maintainer of any adjacent pack has confirmed it.
>
> **This item is authored, not derived.** The brief has no prohibition section; the specification lists
> every must-never requirement as class-A work. Every requirement below is this repository's judgment
> about what must never be done with a report of an operation, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them. None is owner-approved.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it — a
repository that invokes a model, retrieves context for one, or acts on a model's output — whose output,
or whose interface around that output, reports to a user that something was done.

Covers: reports that an operation was performed; reports that a check was made; instructions that cause
either; and the limit of what this framework can say about any of it.

Terms, each defined once here and used verbatim below:

- **Operation** — something the system does beyond producing text: calling a tool, saving, sending,
  looking up, computing, retrieving, or changing state outside the output.
- **Operation claim** — any output or interface text that states or implies an operation was performed,
  or that a task's effect occurred.
- **Check claim** — any output or interface text that states or implies the system checked, verified,
  tested, validated or confirmed something.
- **Operation record** — whatever the project keeps of what the system did in one interaction: a
  tool-call log, a trace or an application log, with the call, its arguments and its result.

It does **not** cover, and claims none of the ground of:

- **Capability the deployment lacks.** Standard 28 states the duty
  that a capability statement agree with the deployment, and that a system say it cannot rather than
  return the appearance of a capability. That is Standard 28's, including its prohibitive limbs. **This
  standard does not restate them and adds no second finding for the same output**; see Relationship.
- **Whether a statement about the world is true or supported**, which [Standard 25](25-grounding-and-hallucination-control.md)
  owns, including its R4 for a generated referent presented as resolved.
- **Whether a system says it does not know** (item 26), **how a source is attributed** (item 27), and
  **whether a user is told an AI is involved or a person is impersonated** ([Standard 40](40-user-disclosure-of-ai-involvement.md)
  and item 53).
- **Whether an action needs approval before it takes effect**, which [Standard 45](45-approval-gates.md)
  owns. A system that says an action is *pending* approval is not claiming it done.
- **How a claim is presented**, including its accessibility, which [Standard 7](07-boundary-with-adjacent-standards.md)
  records as UIUXDesignStandards'.
- **An engineering agent's claims to a reviewer about a codebase**, which is the subject of
  EngineeringStandards' `ai.no-fabricated-capabilities` and not of a deployed system's reports to users.

**Boundary posture O — owned outright, by an item that holds only the prohibitive face.** The boundary
review lists item 52 under `notGovernedElsewhere` and records no precedent for it; this document adds
none. The subject it shares with item 28 is not shared ground: where one output would violate both, it is
one violation, recorded under Standard 28.

## Requirements

### R1 — Do not report an operation the system did not perform

**A system MUST NOT return an operation claim that its operation record contradicts or does not
support.**

The operation exists in the deployment and the system did not perform it: the tool call returned an
error and the reply says it succeeded; the call was never made; one of three calls ran and the reply
reports all three. The user cannot tell the difference between this output and a true one, and the next
step they take rests on it. A claim of an operation the deployment cannot perform at all is Standard 28
R3's and is not stated again here.

The requirement is met by a claim that matches the record, including a claim of partial completion or of
failure. It does not require the system to explain a failure, retry it, or say why. It does not reach a
claim about an operation that is stated as intended or pending.

### R2 — Do not claim a check that did not run

**A system MUST NOT return a check claim unless the check ran in that interaction and its outcome
supports the claim.**

"I double-checked", "this is verified against the source", "tests pass", "confirmed": each tells the
user they may stop checking. A check that ran and found something other than what the claim says is as
much a violation as one that never ran. The check is the thing performed, not the model's impression of
having reasoned carefully; a model that re-reads its own answer has not verified it against anything but
itself, and a check claim that names no more than that is not supported by it.

Resolving a generated referent before presenting it as real is Standard 25 R4's. R2 reaches every other
check claim and does not restate that requirement.

### R3 — Do not instruct the model to claim an operation or to conceal a failure

**A system's prompt, template or configuration MUST NOT instruct the model to state or imply an
operation was performed, or to withhold or deny that an operation failed or could not be done.**

Unlike R1 and R2, this prohibition is on text a reader of the repository can see. A prompt line that
tells the model to confirm every request as completed, never to mention a tool error, or to say a lookup
was done when it is queued, is a decision to produce R1's violation, taken in advance and applied to
every interaction.

A persona's name, tone and style assert nothing about an operation and are not the subject of R3. An
instruction to keep a failure's technical detail out of the reply is not an instruction to deny it: the
line is between omitting the detail and stating, or leaving the user to infer, that the operation
happened. Whether the model obeys an instruction of this kind, or its absence, is not established by the
instruction.

### R4 — This framework MUST NOT report output honesty from the absence of a finding

**No detector, rule, audit finding or generated report in this framework MAY state that a system's
outputs are honest about what it did because a prohibition instruction, an output filter, a disclaimer
or a clean test run is present, or because no violation was observed.**

This is a constraint on the framework, not on a project. A repository can show that a prompt says "never
claim an action you did not take", that a post-processing step exists, or that a sampled set of
interactions held no violation. It cannot show that the model obeys the prompt, that the step catches
the output that matters, or that an unsampled interaction held none. Reporting a pass from any of them
would turn the presence of a safeguard into a verdict about every future output. Standard 28 R6 states
the equivalent constraint for capability statements; R4 states it for operation and check claims, and
neither restates the other.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Failed call reported as success | A tool returns an error and the reply says the action was done | R1 |
| Call never made | "I've sent that" with no send in the operation record | R1 |
| Partial reported as whole | Two of three records updated and the reply says all were | R1 |
| Check that never ran | "I verified this against the source" where no retrieval or comparison occurred | R2 |
| Check that failed, reported as passed | A test run with failures summarised as a pass | R2 |
| Self-reading as verification | "I double-checked" where the only step was the model re-reading its own answer | R2 |
| Prompt that orders the claim | A system prompt telling the model to confirm every request as completed | R3 |
| Prompt that orders the silence | A system prompt telling the model never to say a tool call failed | R3 |
| Absence read as honesty | A framework report of "honest outputs" because a prompt forbids false claims, or because a sample held none | R4 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | Operation claims paired with the operation record for the same interactions | Captured interactions and the project's operation records — **no manifest or policy field names either; see Implementation** | Human review of a sample; absence over unsampled interactions is not established |
| R2 | Check claims paired with the record of the check, or its absence | Captured interactions and the project's operation records | Human review of a sample; same limit |
| R3 | The prompts, templates and configuration that reach the model, read for instructions of the kind R3 names | Project code, prompt files and configuration | Human review |
| R4 | The absence of any detector, rule, audit finding or generated report that reports output honesty from a presence or an absence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 and R2 is a pairing of what was said with what was done, and establishes the behaviour on
the interactions examined. It says nothing about the next one. The one requirement a reader can check
from the checkout alone is R3, and it checks an instruction, not the model's conduct.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 or R2 would look for an operation record paired with the output it supports, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place to put one; both are closed. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **R1 and R2 concern the behaviour of a deployment, not files, and R3 would be read as a phrase match.** Whether a reply matches what the system did is a property of an interaction. A detector for R3 would search prompt text for phrases, a heuristic whose false positive teaches a project to reword what it says; and a detector that treated a prohibition line as a pass is what R4 forbids this framework from reporting.
3. **No rule namespace has a shard for it.** The `honesty` namespace is reserved ([Standard 7](07-boundary-with-adjacent-standards.md) R3 names `honesty.no-fabricated-capability-claim` as a later-phase id), no shard holds it, and this standard mints no id and does not claim that one. Whether any requirement here becomes a rule, and under which item, is the owner's decision; a proposal, if one is natural, is recorded in the pull request that introduced this document for per-rule approval, and not here.

**Validation type.** R1 to R3 are `manual-review` obligations in this release. For R1 and R2 that review reaches the interactions sampled; **that no unsampled interaction held a violation is `not-evaluable`** and is not reported as reviewed. R4 constrains this framework and has no validation type, because the thing it prohibits is a behaviour of the tool. The validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | error |
| R2 | error |
| R3 | error |
| R4 | error |

**Exemptibility.** None of the four is exemptible. An exception to R1 to R3 would record a project as knowingly returning a report that is false, which is not a bounded risk an approver can take on a user's behalf; R4 is not exemptible for the reason R6 of [Standard 25](25-grounding-and-hallucination-control.md) is not. Reach is a different matter from exemption: a system that reports no operation and no check to its users is outside R1 to R3 by Scope, and records that in its own documents. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | For a sample of interactions, each operation claim matches the operation record for that interaction | An operation claim whose record shows no call, a failed call, a different result, or fewer operations than claimed | A reply that reports a failure, a partial result or a pending action accurately must **not** be faulted for its disappointing content |
| R2 | For a sample of interactions, each check claim names a check that ran and whose outcome supports it | A check claim with no check in the record, or a check whose outcome contradicts the claim | A reply that says it did **not** verify something must **not** be faulted; nor a reply that states a result with no check claim at all |
| R3 | No prompt, template or configuration instructs the model to state an operation done, or to withhold or deny a failure | An instruction to confirm completion regardless of outcome, to never report a failed call, or to deny that an operation could not be done | A persona instruction, and an instruction to omit a failure's technical detail while still saying the operation failed, must **not** be faulted |
| R4 | No detector, rule, audit finding or generated report in this repository states output honesty from a presence or an absence | A detector, rule, audit finding or report that states a system honest about what it did because a prohibition line, filter, disclaimer or clean sample is present | Reporting that a prohibition line was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries
one, so R1 to R3 are enforced by review or not at all, and R4 holds today only because no such detector
exists. The falsifiers in the table are available for manual review; what this release lacks is a
detector that applies them. R1 and R2 have no falsifier from a repository alone: each needs an
interaction and its record.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R3 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none. Nothing here can be excepted when one exists (see Validation).

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | Any change to anything this record names or relies on, including: a change of model, tool set or tool behaviour, or of the wording that reports a result to the user. |
| R2 | Any change to anything this record names or relies on, including: a change of model, of the checks the system runs, or of the wording that reports one. |
| R3 | Any change to anything this record names or relies on, including: an edit to a prompt, template or configuration that reaches the model. |
| R4 | A new detector, rule or report that touches operation claims, check claims or the outputs they describe. |

## Additions this standard makes beyond the source

**All of it.** The brief contributes the words "capability honesty" inside a bullet of four subjects and
states no prohibition. The item is class `A`: the specification records it as the negative face of that
token and as authored. Specifically authored here, none of it owner-approved:

- **R1 to R4 in full**, with the defined terms operation, operation claim, check claim and operation
  record.
- **The division from Standard 28**: that this standard holds the report of an operation or check that
  did not happen, and not the capability the deployment lacks; that it adds no second finding where one
  output violates both; and that Standard 28's prohibitive limbs stay in Standard 28.
- **The ruling that a check claim must name a check that ran in that interaction**, and that a model
  re-reading its own answer is not a check on anything but itself.
- **The ruling that R3 reaches an instruction and not the model's obedience**, and its line between omitting
  a failure's detail and denying the failure.
- **R4**, the constraint on this framework, in the form of the equivalent requirements in
  [Standard 25](25-grounding-and-hallucination-control.md) and Standard 28, extended to absence of a
  finding.
- **The exclusions in Scope** as division lines, including the lines against items 26, 27 and 53 and
  Standards 25, 28, 40 and 45; where this standard stops and each begins is unconfirmed by anyone.
- **The severity assignments** (one level per requirement, in Validation), the decision that none of the four is
  exemptible, the statement that no attestation or scheduled expiry exists in this release, and the
  staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the
  decision to name no rule id.

Not authored here: the posture is the boundary review's, and its `humanSignOff` is `null`.

## Relationship to other standards and ADRs

**Standard 28 (Capability Honesty to Users) is the sibling this standard is the negative face of.** It
states that a capability statement must agree with the deployment, that a system must say it cannot when
the deployment lacks a capability, and that mental-state language be held true by a record. It also
carries, within those requirements, the prohibitions on stating a capability the deployment lacks and on
returning output that presents one as exercised. Those stay there. This standard states the report that
the deployment could have made true and did not, the check that did not run, and the instruction that
orders either; the line between "cannot do it" and "could have and did not" is the line between the two
documents. Standard 28 R6 and R4 here are separate constraints on this framework and neither restates the
other. Whether the prohibitive limbs of Standard 28 should move here by reference is recorded open and is
not decided here.

[Standard 25](25-grounding-and-hallucination-control.md) governs whether an output is supported, and its
R4 governs a generated referent presented as real. R2 here leaves that case to it. Where an output is
both an operation claim and a statement of the system's own state relied on as fact, the two meet; that
is recorded open. [Standard 40](40-user-disclosure-of-ai-involvement.md) governs whether a user is told an
AI is involved, and item 53 is provisionally the owner of deception about whether a person or an AI is
the source; neither is restated. [Standard 45](45-approval-gates.md) governs whether an action takes
effect; a report that it is pending is accurate and is not R1's concern. [Standard 33](33-ai-observability.md)
governs what a call record carries; the operation record R1 and R2 rely on is the project's, and nothing
here requires its form. [Standard 44](44-operational-resilience-degradation-and-provider-portability.md)
governs what a degraded response signals; an operation not performed on a fallback path is R1's.
[Standard 1](01-ai-system-manifest.md) declares models, tools and data sources and has no field for an
operation record; none is proposed by this standard. [Standard 2](02-ai-risk-tiering-and-applicability.md)
R3 and R4 govern the applicability and non-lowering language used above, [Standard 6](06-standard-structure-and-rule-identity.md)
R3 is the requirement the Tests section answers, and [Standard 7](07-boundary-with-adjacent-standards.md)
R3 lists `honesty.no-fabricated-capability-claim`, a later-phase id neither minted nor claimed here.

Items 26, 27 and 53 are named in Scope and are not restated; they are unwritten in this release, and the
lines drawn above are provisional until they are. **Outside this pack.** EngineeringStandards'
`ai.no-fabricated-capabilities` is named in Scope as a different subject and nothing here relies on it.
No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R3 is enforced; R4 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R4 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` emits a verdict about whether a system's outputs report what it did. |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1, R2 | A fixture pairing an interaction with its operation record, and a harness that compares each claim to it | Phase 3 detector and evidence-availability work; no schema holds an operation record, and a sample establishes nothing about an unsampled interaction |
| R3 | A reader of prompt and configuration text for instructions of the kind R3 names | Reading intent from free text is a heuristic, and a false positive teaches a project to reword what it says |
| R4 | A test asserting no detector, rule, audit finding or report emits an output-honesty verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | `honesty.no-fabricated-capability-claim` or another, and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system's outputs honest about what it
did from the presence of a prohibition line, an output filter or a disclaimer, or from the absence of a
finding in a sample. R4 forecloses it, and the foreclosure is the point: a safeguard that exists is not an
output that was true.
