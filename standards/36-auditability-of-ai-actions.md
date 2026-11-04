# Standard 36 — Auditability of AI Actions

A trace of an inference call says what was asked of a model and what came back. It does not say what
the system then did. When a model's output is turned into a tool call, a write, a sent message or a
request to another service, the effect lands somewhere outside the model, and the question someone
asks afterwards is not "what did the model return" but "what happened to this record, who or what
did it, on whose behalf, under what authority, and can I trust the account I am reading".

This standard is about that account. It asks that an action an AI system takes leave a record made
for someone other than the actor to examine later, that the record name a principal and an authority
and not only a tool, that the actor be unable to edit it, that it be made when the action happens and
not reconstructed from what the model later says it did, and that its retention and readers be
stated. It does not choose a log format, a store or a retention period.

The failure it is written against is the audit trail that the audited party wrote: an agent whose
account of its own work is the only record, or whose credentials can rewrite the table the record
lives in.

Source: item 36 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "auditability" token of the "Observability, incident response, red teaming, and
auditability" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 36 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json), which lists item 36 among the
> items for which it searched the nine packs for an owner and found none. That review's substantive half
> is human judgment and carries `humanSignOff: null`; no maintainer of any adjacent pack has confirmed
> it.
>
> **The brief supplies one word and this standard supplies the rest.** The brief's bullet names
> "auditability" and states no requirement for it. The item is class `D` because its token is the
> brief's own; the requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it — a repository that invokes a model, retrieves context for one, or acts on a model's output — where the system takes an **action**.

Covers: the record an action leaves; whom and what it attributes the action to; who can alter it; when it is made; how long it is kept and who can read it; and the limit of what this framework can say about any of it.

Terms, each defined once here and used verbatim below:

- **Action** — an effect the system has, or attempts, outside its own model call as a consequence of model output: a tool invocation, a write to a store, a message sent, a request to another service, a change of state.
- **Audit record** — a record of one action, kept so that someone other than the actor can examine it later.
- **Actor** — the AI system, agent or run that performed the action.
- **Principal** — the user, service or schedule on whose behalf the actor acted.
- **Authority** — what permitted the action: an approval of that invocation under [Standard 45](45-approval-gates.md) R3, a standing grant, or the autonomy tier declared under [Standard 11](11-autonomy-levels-and-delegated-authority.md).

A system whose entire output is text returned to a caller, and which takes no action as defined above, has no audit record to make and records that in its own documents. That is a statement about the system, and a system that ships a write-capable tool while claiming it has made a false one.

It does **not** cover, and claims none of the ground of:

- **The record of an inference call** — the model requested and the one that served, the prompt revision, the outcome class, sampling and loss of trace records. [Standard 33](33-ai-observability.md) owns it. Standard 33 says item 36 may require records it does not; R1 here states the one it adds, the action, and links it to Standard 33's record and does not restate it.
- **The approval itself** — who must approve what, and what an approval record contains. [Standard 45](45-approval-gates.md) owns it. R2 here asks only that an audit record point at the approval that authorised the action.
- **What may be recorded.** Whether prompt, completion or personal data may enter a record is [Standard 13](13-personal-data-in-ai-systems.md)'s, and nothing below relaxes it.
- **What is done with a record in an incident or an exercise.** Items 34 (AI Incident Response) and 35 (Red Teaming) own that.
- **Who may act at all.** Standing authority is [Standard 11](11-autonomy-levels-and-delegated-authority.md)'s; an agent's credentials are [Standard 23](23-agent-execution-security.md) R2's; an agent rewriting its own permissions is [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1's.
- **The `audit` command of this framework.** `standards audit` discovers evidence in a consuming repository and, per [Standard 5](05-verdict-vocabulary.md), emits no verdict. It shares a word with this subject and nothing else.

**Boundary posture O — owned outright.** The boundary review lists item 36 among the items for which no owner was found after searching rule files and standard filenames across the nine packs; it records no per-item evidence for it. This document accepts that record for what a repository can establish and narrows it there: that an audit record exists, has the fields below, and is held where the actor cannot alter it is a reviewable property of a design, so R1 to R5 are `manual-review` obligations. Whether a given record is complete, unaltered and retained is an operational fact of a running system and is **not-evaluable** from a repository. This document adds no precedent to the review's.

## Requirements

### R1 — Each action leaves an audit record that names what was done

**A system MUST write an audit record for each action it takes or attempts, stating the operation, its target, the arguments or a retrievable reference to them, the time, the outcome, and a correlation identifier shared with the inference call that produced the action.**

The outcome distinguishes at least: attempted and not taken (refused by a gate, blocked, not approved), taken, and failed. A record of a blocked action is as much the point as a record of a completed one, because the attempt is what an investigation needs when the gate held. The correlation identifier is the one [Standard 33](33-ai-observability.md) R1 asks of an inference record; it is what lets a reviewer step from an effect to the call that proposed it and then to the model and prompt revision that call used. This requirement does not ask the audit record to carry them.

The form is the project's. An audit record may be a row, an event or a line in a log; it may share a store with trace records. What it may not do is exist only as the model's account of itself, which R4 addresses.

### R2 — The record names a principal and an authority, not only a tool

**An audit record MUST identify the principal on whose behalf the action was taken and the authority under which it was taken, and, where [Standard 45](45-approval-gates.md) R3 required an approval, MUST reference that approval record.**

A record reading "agent called `send_email`" is true and leaves out the two things a reviewer asks first: for whom, and who allowed it. Where a user's request started the run, the user is the principal; where a schedule or another system started it, that is. Where an actor acts for no identifiable principal, the record says so and does not name the actor as its own principal, because a record that cannot tell a user's action from the system's own initiative cannot support either account.

The authority is stated as what permitted the action: the approval, the standing grant, or the declared tier. The audit record points at an approval record and does not copy or replace it, so that an approval cannot be edited in one place and left standing in the other. An action with no authority to name is recorded as that; the record does not supply one.

### R3 — The actor MUST NOT be able to alter or delete its own audit record

**The credentials, roles and tool permissions an AI system acts with MUST NOT permit it to modify or delete audit records, and any correction to a record MUST be made as a further record that names what it corrects.**

An audit record written by the party it describes, in a store that party can edit, is a claim. The requirement is about the capability the actor holds, not about its intent: an agent that is well behaved today and holds delete rights on its own record is one prompt injection away from an unreliable trail. Append-only storage, a separate write path or a store the actor cannot reach all satisfy it; this standard chooses none.

A record is corrected by adding to it. Where an error in a record is real, the correction is itself recorded, so that the earlier state remains readable. The requirement does not forbid an operator, acting as a person with their own identity under their own authority, from retention-driven expiry of old records under R5; it forbids the actor from doing so.

This is a different concern from [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1, which keeps an agent from rewriting its own instructions, permissions or budget, and from [Standard 23](23-agent-execution-security.md) R2, which scopes credentials to declared tools. Where a project breaches either, it breaches it independently of whether R3 is met.

### R4 — The record is made at the action and is not reconstructed from the model's account

**An audit record MUST be written by the mechanism that performs or gates the action, at the time of the action, and MUST NOT be assembled from a model's later description of what it did.**

A model asked afterwards what it did will produce a fluent account, and that account may be wrong, partial or shaped by what it was told to say. A trail built from it audits the narration. The record that matters is the one the code path that carries out the action writes as it does so, which does not depend on the model reporting faithfully.

The requirement allows the model's own description to be stored alongside the record, labelled as the actor's account. It rules out the description being the only source of what was done, and a record written only after the fact from a summary.

The record may be written when the action is attempted and completed with its outcome afterwards; what matters is that the attempt is on record before its result is known. An action whose record failed to write is itself recorded where the system can, and R5 of [Standard 33](33-ai-observability.md) states the form of loss detection for trace records; this requirement does not restate it.

### R5 — State how long audit records are kept and who can read them

**A project MUST state the retention period of its audit records and who may read them, and the readers MUST include a role that is not the actor and not the person who requested the action under review.**

An audit record kept for an unstated time, or readable only by the system that wrote it, will not be there or will not be believed when needed. The requirement fixes no period and no reader beyond the one it needs: someone independent of both the actor and the requester, so that the account of an action is not held only by the party whose action it is.

The stated retention period sits beside the project's other retention declarations and is reconciled with them; where an audit record holds personal data its retention is also governed by [Standard 13](13-personal-data-in-ai-systems.md) and by `privacy.retention-declared`, and an audit purpose does not by itself justify keeping what that standard would not. Where the two conflict the project states which governs and why.

The record is a document. `schemas/ai-system-manifest.schema.json` is closed and has no field for it. Nothing here asks an adopter to write a field that schema rejects.

### R6 — This framework MUST NOT report a system auditable from the presence of logging

**No detector, rule, audit finding or generated report in this framework MAY state that a system's actions are auditable, logged or traceable to a principal, or that its audit records are complete or unaltered, because a logging library, an audit table, an append-only configuration or a dashboard definition is present in the repository.**

A repository can show that an audit table exists, that a logging call sits beside a tool invocation, or that a store is configured append-only. It cannot show that every action path writes to it, that the actor's credentials in the running system lack the rights R3 requires, that the records were retained, or that anyone reads them. Reporting a pass from any of those would turn the presence of an instrument into a verdict about what it captured, which is the construction [Standard 33](33-ai-observability.md) R6 forecloses for traces.

Whether audit records are complete, unaltered and retained is an operational fact about a running system. It is **not-evaluable** from a repository.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Effect with no record | A tool call that changes a store or sends a message and leaves nothing a reviewer can find; or only completed actions recorded, with blocked and refused attempts absent | R1 |
| Unlinked record | An action record with no correlation identifier shared with the inference call that produced it, or no operation, target, arguments or outcome | R1 |
| Tool without a principal | A record reading "agent called `send_email`" naming no principal and no authority; or the actor named as its own principal for an action a user started | R2 |
| Orphaned approval | An action under a required approval whose record does not reference it, or an approval copied into the audit record so the two can diverge | R2 |
| Self-editable trail | The credentials the agent acts with allow update or delete on the table that holds its audit records; or a record corrected by overwriting it | R3 |
| Trail written from narration | The audit record is generated from the model's summary of its session, or written only afterwards from it | R4 |
| Unstated lifetime or readers | No retention period, or records readable only by the actor, or only by the requester | R5 |
| Logging read as auditability | A framework report of "auditable" because an audit table or logging library is present | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The audit record's fields, and a sample record for each class of action the system takes, including a blocked one | The project's design document and its store | Human review |
| R2 | A sample record showing principal and authority, and for an approved action the reference to the approval record | The audit store and the approval record | Human review |
| R3 | The permissions the actor's credentials hold on the audit store, and how a correction is made | Credential and store configuration the project names | Human review; whether the running system's grants match is not established by a repository |
| R4 | The code path that writes the record and that it is the path that performs or gates the action | Source | Code review |
| R5 | The stated retention period and the named readers, with the independent role identified | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R6 | The absence of any detector, rule, audit finding or generated report that reports auditability from presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R5 is a human-authored record or a reading of source and configuration. A design that states the fields and the grants establishes that the project wrote them down and that the code, as read, does what it says. Whether any running system's records are complete, unaltered and retained is not established by any record in a repository, and is not-evaluable.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1, R2 or R5 would look for a declared record, principal field or retention statement, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place to put one; both are closed. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **The subject is a property of a running system.** Whether an actor's credentials can alter its record, and whether every action path writes one, are facts of a deployment. A detector could only read a configuration or a library import, which R6 forbids this framework from reporting as a result; the boundary review's own posture is that nothing in the repository establishes it.
3. **No rule namespace exists for it.** No shard holds an audit namespace, and this standard mints no id; naming one is a decision for the owner. A proposed rule, if one is natural, is recorded in the pull request that introduced this document for per-rule approval, and not here.

**Validation type.** R1 to R5 are `manual-review` obligations in this release. The completeness of R1's records and the integrity of R3's are **not-evaluable** and are not reported as reviewed. R6 constrains this framework and has no validation type, because the thing it prohibits is a behaviour of the tool. The validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | error |
| R2 | warning |
| R3 | error |
| R4 | error |
| R5 | warning |
| R6 | error |

**Exemptibility.** R6 is not exemptible, for the reason R6 of [Standard 33](33-ai-observability.md) is not: no project circumstance makes it reasonable for a scan to certify what it did not observe. R3 is not exemptible, because an exception would record a project as knowingly letting the actor edit the account of its own actions. R1, R2, R4 and R5 reach a system only where it takes an action; a system that takes none records, in its own documents, that they do not reach it and why. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | For each class of action, a sampled audit record states the operation, target, arguments or a retrievable reference to them, time, outcome and a correlation identifier shared with the producing inference call, and a blocked attempt has a record | An action that takes effect with no audit record; a record missing any of those fields; or a gate-blocked or refused attempt that leaves none | A record that holds a reference to the arguments in a store and not the arguments themselves must **not** be faulted, where the reference resolves |
| R2 | A sampled record names a principal and an authority, and for an action that required an approval under Standard 45 R3 it references that approval record | A record naming only a tool or the actor; an action started by a user recorded with the actor as its own principal; or an approved action whose record does not reference the approval | An action started by a schedule, recorded with the schedule as principal and a standing grant as authority, must **not** be faulted |
| R3 | The actor's credentials have no update or delete right on the audit store, and a correction is a new record naming the one it corrects | Credentials the actor holds that can modify or delete an audit record, or a correction made by overwriting the earlier record | An operator under their own identity expiring old records under the stated R5 period must **not** be faulted under R3 |
| R4 | The record is written by the code path that performs or gates the action, at or before the action completes | An audit record produced from a model's later summary of its actions, or a record with no source other than that summary | A model's account stored beside the record and labelled as the actor's account, with the record written by the action path, must **not** be faulted |
| R5 | A retention period is stated and the readers are named, including a role that is neither the actor nor the requester of the action under review | No retention period; no named readers; or readers limited to the actor and the requester | A project that names a short retention period and states why must **not** be faulted for the period's length |
| R6 | No detector, rule, audit finding or generated report in this repository states an auditability verdict from presence | A detector, rule, audit finding or report that states a system's actions are auditable, logged or complete because an audit table, logging library or append-only configuration is present | Reporting that an audit table was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries one, so R1 to R5 are enforced by review or not at all, and R6 holds today only because no such detector exists. The falsifiers in the table are available for manual review; what this release lacks is a detector that applies them. A record made stale by the event in the staleness table below does not satisfy the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | Any change to anything this record names or relies on, including: a new class of action, or a new path by which an action can be taken. |
| R2 | Any change to anything this record names or relies on, including: a new way a run can be started, or a change in what grants authority. |
| R3 | Any change to anything this record names or relies on, including: a change to the actor's credentials, roles or tool permissions, or to the audit store's access control. |
| R4 | Any change to anything this record names or relies on, including: a change to the code path that performs or gates an action, or to where the record is written. |
| R5 | Any change to anything this record names or relies on, including: a change of retention period, of store, or of who holds the independent reader role. |
| R6 | A new detector, rule or report that touches auditability. |

**Contradicted by operation.** An investigation in which an action could not be found in the audit record, or in which the record was found altered, shows that the design the project recorded did not hold for that action. That is a stronger fact than staleness; it does not wait for a scheduled review.

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one word, "auditability", inside a bullet of four subjects and states no requirement, level or evidence for it. The item is class `D` because its subject token is derived from the brief; the requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1 to R5 in full**, with the defined terms action, audit record, actor, principal and authority, the field list of R1, the recording of blocked attempts, and the separation of principal from authority from actor.
- **R3**, the rule that the actor holds no right to alter or delete its own record and that corrections are further records.
- **R4**, the rule that the record is written by the mechanism that performs or gates the action and is not assembled from the model's own account.
- **R5**, the requirement that readers include a role independent of the actor and the requester, and that no retention period is chosen.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in [Standard 33](33-ai-observability.md) and [Standard 25](25-grounding-and-hallucination-control.md).
- **The division lines in Scope**, between this item, Standard 33's call record and Standard 45's approval record, which no one has confirmed.
- **The severity assignments** (one level per requirement, in Validation), the statement that no attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the decision to name no rule id.

Not authored here: the posture is the boundary review's.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) lists the subjects this pack owns and the packs that own the others; the boundary review records no owner for this item in the portfolio, so it has no counterpart to defer to or crosswalk. [Standard 33](33-ai-observability.md) governs what a record of an inference call carries and says item 36 may require more; R1 here adds the action record and the correlation link, R4 defers to Standard 33 R5 for the form of loss detection, and R6 is the same construction as Standard 33 R6 applied to a different subject. [Standard 45](45-approval-gates.md) R3 requires the approval record whose reference R2 asks for; it is not restated, and nothing here changes what an approval must contain. [Standard 11](11-autonomy-levels-and-delegated-authority.md) names the declared tier that R2 may cite as an authority. [Standard 13](13-personal-data-in-ai-systems.md) governs what a record may contain and for how long, and is not relaxed. [Standard 23](23-agent-execution-security.md) R2 and [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1 constrain the actor's credentials and its authority over itself, and R3 here is a separate obligation about its authority over its own record. [Standard 10](10-human-oversight-and-intervention.md) R6 requires that an oversight point be recorded at its true timing; where review of an audit record is the oversight point, it is recorded as after the fact. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and non-lowering language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests section answers. Items 34 and 35 are unwritten in this release and the lines drawn above are provisional until they are.

**Outside this pack.** No adjacent pack's standard is recorded for this subject, and nothing was read from one for it. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` has a concept of an audit record, an action log or an actor's credentials on a store. The `audit` command emits evidence and no verdict (Standard 5) |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1, R2, R5 | A place to declare the audit record's fields, its principal and authority, its retention and readers: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R3 | A way to read the actor's grants on an audit store | They live in a deployment; a repository can show a configuration, which R6 forbids reporting as a result |
| R4 | A check that a record is written by the action path | Telling the action path from a summary-fed writer is a reading of source, which a heuristic gets wrong in both directions |
| R6 | A test asserting no detector, rule, audit finding or report emits an auditability verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system's actions auditable, logged, complete or unaltered from the presence of a logging library, an audit table, an append-only configuration or a dashboard definition. R6 forecloses it, and the foreclosure is the point: an instrument that is present is not a record that was kept.
