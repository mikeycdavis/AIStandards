# Standard 46 — Gates for Externally Visible Actions

Most of what an AI system does can be corrected before anyone else sees it. An action that is
externally visible is different in one respect that has nothing to do with whether it can be undone:
somebody outside the organisation has perceived it. A message has been read, a post has been indexed,
a notification has been delivered, a statement has been made in someone's name. A later deletion
removes the artifact. It does not remove the reading.

This standard is about the **gate on that class of action**: that a person with authority stands
between the proposal and the audience, that what they approved is what the audience receives, and
that a gate on one tool is not a gate on the channel. It is not about whether the content was good,
and it is not about whether the action could be reversed.

Source: item 46 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "externally visible actions" token of the "Approval gates for high-impact,
destructive, autonomous, or externally visible actions" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 46 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. The boundary posture is **O**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) as an item for which the nine
> packs were searched and no owner was found; that review's substantive half is human judgment and
> carries `humanSignOff: null`. No maintainer of any adjacent pack has confirmed it.
>
> **The brief supplies a token and this standard supplies the requirements.** The brief names
> "externally visible actions" as a kind of action needing an approval gate and states no requirement
> for it. The item is class `D` because its token is the brief's own; the requirements are this
> repository's judgment, and the [Additions](#additions-this-standard-makes-beyond-the-source)
> section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it
that can take an **externally visible action**: an action by the system, or by a tool it invokes,
whose effect can be perceived by a person or system outside the organisation that operates it.
Posting, publishing, sending a message or notification, commenting on a record others can read, and
speaking in a named person's or organisation's voice are the typical cases.

Terms, each defined once here and used verbatim below:

- **Externally visible** — the class of the same name in [Standard 45](45-approval-gates.md) R2 and in
  `schemas/tool-permissions.schema.json`: someone outside the organisation can see the effect. This
  standard adopts that definition and does not redraw it.
- **Audience** — the persons or systems outside the organisation that can perceive the action's effect
  once it takes place.
- **Channel** — the route by which the effect reaches its audience: an address, a feed, a repository,
  a listing, a notification service.
- **Name** — the identity the action speaks as: a person, a role or the organisation.

It does **not** cover, and claims none of the ground of:

- **The system's reply to the party that invoked it.** A response returned to its caller is the
  system's output, not an action taken on a third party. Whether it is grounded, disclosed as AI
  or honest about capability belongs to [Standard 25](25-grounding-and-hallucination-control.md),
  [Standard 40](40-user-disclosure-of-ai-involvement.md) and item 28.
- **Irreversible, destructive and high-impact actions.** [Standard 45](45-approval-gates.md) owns the
  gate for them, its argument-scoped escalation (R4), the recorded approval (R3), self-approval (R5)
  and fail-closed (R6). An action that is externally visible **and** irreversible is gated by both,
  and the stricter applies, as Standard 45 R2 says of a tool that warrants two classes.
- **Standing authority.** [Standard 11](11-autonomy-levels-and-delegated-authority.md) owns what a
  system is granted to do without asking; this standard does not create, enlarge or end a grant.
- **What the approver is shown and may do.** [Standard 10](10-human-oversight-and-intervention.md) R3 and R4
  own the decision material and the intervention capabilities; how it is presented is UIUXDesignStandards'.
- **Whether the audience is told an AI was involved.** [Standard 40](40-user-disclosure-of-ai-involvement.md).
- **Whether the content is permitted at all**, such as content that is abusive or contains personal data.
  Items 9 and 13 own those.

**Boundary posture O — owned outright.** The boundary review records that no pack in the portfolio
governs this item. Standard 45 R2 defines the class and leaves it with no requirement of its own;
Standard 10 recorded the item as unwritten before this standard existed, and now links it. This document fills that and no more, and adds no
precedent to the review's.

A system whose tool permission manifest declares no tool of impact `externally-visible` and that has no
other path to an audience may record that this standard does not reach it. That record is evidence, and
is withdrawn by the system gaining such a tool or path.

## Requirements

### R1 — Name the audience and the channel

**Every action classed `externally-visible` MUST name its audience and its channel.**

Standard 45 R2 asks that the class be declared; it does not ask who can see the effect. A tool declared
externally visible with no audience gives an approver nothing to authorise and gives R3 nothing to
bind. The audience may be stated as a bound ("subscribers of list X", "anyone with the page URL")
rather than an enumeration, and the bound is what a later invocation is compared with.

### R2 — Hold the action until a person with authority has approved it

**An externally visible action MUST NOT take effect until a human with authority to act in the
action's name and over its channel has approved that invocation, and the approval MUST be recorded
with the approver's identity, the time, and the content and audience approved.**

Three phrases carry it. *Authority in the name and over the channel*: an approval by someone who may
not speak as the organisation, or may not publish to that channel, is a signature and not a decision.
*That invocation*: a standing permission to post is a grant (Standard 11's), not an approval.
*Recorded*: the elements are those Standard 45 R3 names, with content and audience in place of
arguments.

A gate the system can satisfy itself, or that lets the action through when the approval cannot be
obtained, is not a gate for the purposes of this requirement. This repeats the reasoning of [Standard 45](45-approval-gates.md)
R5 and R6, which are worded for "the approval its own action requires" and for any approval mechanism that is
unavailable, and are not worded for irreversible actions only; this requirement adds no rule of its own beyond
the approver's authority and the recording. Whether those two rules should be read as reaching an approval that
Standard 45 R3 does not require is open question Q55.

### R3 — The approval binds the content and the audience it was given for

**An externally visible action MUST NOT take effect with content or an audience that differs from what
was approved.**

The gap between approval and effect is where a draft is regenerated, a template is re-rendered, a
recipient list is refreshed or a retry re-runs the model. An approval of the text shown, delivered as
different text, is not an approval of what was delivered. Where the content or audience changes after
approval, the changed invocation is a new one and needs its own approval.

### R4 — Gate the channel, not the tool

**Every path by which the system can reach a channel an externally visible action uses MUST be
subject to the gate, including a second tool, a plugin, a sub-agent, a script the system may run and a
retry or scheduled path.**

A gate attached to the tool named `send_email` does not govern a shell tool that can call the mail
service, or an agent that can invoke another which holds the permission. Standard 45 R1 and R2
enumerate and classify tools; this requirement is that the *reach* of a channel, and not only a tool
name, be what is gated.

### R5 — Retractability is not a reason to omit the gate

**A project MUST NOT omit the gate for an externally visible action on the ground that the action can
be retracted, deleted or corrected afterwards.**

Retraction removes the artifact and not the audience's perception of it: copies exist, feeds
deliver, search indexes and caches hold it, and a statement made in a name stays made. This is the
specific case in which Standard 45's `reversible` class and the `externally-visible` class both
apply to one tool and the stricter must be declared.

### R6 — A held action is not perceivable by its audience

**A proposed externally visible action awaiting approval MUST NOT be perceivable by its audience.**

A draft saved in a shared space, a preview reachable by URL, a notification that "a post is pending"
and a message queued for delivery on a timer the approval does not control are each effects
on the audience before any approval. A scheduled action is gated at the time it is scheduled and is
not later released without the approval having covered the time.

### R7 — This framework MUST NOT report an action gated from the presence of a setting

**No detector, rule, audit finding or generated report in this framework MAY state that an externally
visible action is gated, approved or reviewed because a field, a class or a declaration is present in
the repository.**

This is a constraint on the framework, not on a project. The tool permission schema carries an
optional `requiresApproval` and a free-text `scope`, and the class `externally-visible`; a repository
can show that they are declared. It cannot show who approved an invocation, whether what was
delivered is what was approved, or whether another path reaches the same channel. Reporting a gate
from a declaration would turn a setting into a control.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Audience unnamed | A tool classed externally visible whose audience and channel are written nowhere; the approver is asked about "post_update" | R1 |
| Wrong approver | A reviewer with no authority to speak as the organisation approves the post; or the approver is the requesting user's own session | R2 |
| Approval not recorded | The approval exists as a chat message; the audit asks for approver, time and content and there is none | R2 |
| Approved text, delivered text | The reviewed draft is regenerated at send time; a refreshed list adds recipients the approver did not see | R3 |
| Second route to the channel | `send_email` is gated; a shell tool or a sub-agent reaches the same mail service | R4 |
| Gate waived as undoable | "It can be deleted" is the stated reason no approval is required for a public post | R5 |
| Leak before approval | The draft is publicly reachable by link, or a pending-item notification reaches subscribers | R6 |
| Setting read as a gate | A framework report states a gate exists because `requiresApproval: true` is set | R7 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The audience and channel written for each externally visible tool | A project document the project names — **no manifest or schema field exists for it; see Implementation** | Human review |
| R2 | Approval records for executed externally visible actions, with the approver's authority over the name and channel | Runtime audit records; the project's statement of who may speak in each name | The running system; human review |
| R3 | The approved content and audience held beside what was delivered, and the handling of a change after approval | Runtime audit records; the send path | Human review of the send path |
| R4 | The list of every route to each channel and the gate on each | A project document the project names | Human review |
| R5 | The recorded reason for each classification, containing no retractability ground for an omitted gate | The tool classification record | Human review |
| R6 | Where a proposed action is held and who can reach that place | The staging mechanism | Human review |
| R7 | The absence of any detector, rule, audit finding or generated report that states a gate from a setting | This repository's own detectors and tests | Code review; see Implementation |

R2's approver authority and R3's equality of approved and delivered content are claims about a running
system, not about a checkout. A record that shows an approval exists does not show the approver understood
what was approved; Standard 10 R3 owns that.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 would look for a named audience and channel, and `schemas/tool-permissions.schema.json` has only `name`, `impact`, `requiresApproval` and `scope`, and is closed. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. Adding a field is a schema-versioning decision, outside this slice (plan 02 section 8). No rule reads `requiresApproval` today.
2. **The subject is a behaviour of a running system.** Who approved an invocation, whether delivery matched approval and whether a second route exists are not properties of a checkout. A detector could only read a declaration, which R7 forbids this framework from reporting as a result.
3. **No rule identity is claimed.** The `gate` shard holds Standard 45's rules; this standard mints no id and proposes no shard, and naming one is a decision for the owner. A proposed rule, if one is natural, is recorded in the pull request that introduced this document for per-rule approval, and not here.

**Validation type.** R1 to R6 are `manual-review` obligations in this release; R7 constrains this framework and has no validation type, because the thing it prohibits is a behaviour of the tool. The validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | warning |
| R2 | error |
| R3 | error |
| R4 | error |
| R5 | error |
| R6 | error |
| R7 | error |

**Exemptibility.** R1 to R7 are not exemptible. Each is bounded by a qualifier internal to it, *an externally visible action*, *that approval*, *a channel an action uses*, so a project without such an action is out of scope under Scope, which is a different mechanism from an exception, and a project with one has no third case. This release has no policy mechanism for dispositions on this standard: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each tool classed externally visible has its audience and its channel written down | An externally visible tool with no audience, or no channel | A tool classed `none` or `reversible` that names no audience must **not** be faulted |
| R2 | Each externally visible action executed has a record of an approver with authority over the name and channel, a time, and the content and audience approved | An externally visible action that took effect with no matching record; an approver with no authority over the name or channel; a gate the system satisfies itself or that opens when approval is unavailable | An action whose audience is solely the party that invoked the system must **not** be faulted for lacking an approval |
| R3 | The content and audience delivered are compared with those recorded as approved | A delivery whose content or audience differs from the record without a new approval | A delivery identical to the approved content, retried after a transient failure, must **not** be faulted |
| R4 | For each channel, every route the system can use to reach it is listed and gated | A route to a gated channel that bypasses the gate | A tool that cannot reach any externally visible channel must **not** be faulted for having no gate |
| R5 | The classification record for each externally visible tool is read for the stated reason | A record that omits or relaxes the gate because the action can be retracted, deleted or corrected | A record that notes retractability as a fact, with the gate in place, must **not** be faulted |
| R6 | The place a proposed action waits is checked for audience reach, including notification and links | A proposed action, a link to it or a notice of it reachable by its audience before approval | A draft held where only the operating organisation can reach it must **not** be faulted |
| R7 | No detector, rule, audit finding or generated report in this repository states a gate from a setting | A detector, rule, finding or report that states an external action is gated, approved or reviewed because `requiresApproval`, a class or a declaration is present | Reporting that `requiresApproval: true` was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries one, so R1 to R6 are enforced by review or not at all, and R7 holds today only because no such detector exists. The falsifiers in the table are available for manual review; what this release lacks is a detector that applies them. A record made stale by the event in the staleness table below does not satisfy the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for this standard in this release, because no rule exists to except. A project that knowingly does not meet a requirement records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | Any change to anything this record names or relies on, including: a change of the audience or channel of a tool. |
| R2 | Any change to anything this record names or relies on, including: a change of who holds authority over the name or channel, or of the approval mechanism. |
| R3 | Any change to anything this record names or relies on, including: a change to how content is generated or rendered, or an audience computed, between approval and delivery. |
| R4 | Any change to anything this record names or relies on, including: a tool, plugin, sub-agent or script that gains or loses a route to the channel. |
| R5 | Any change to anything this record names or relies on, including: a change of the stated reason for a classification. |
| R6 | Any change to anything this record names or relies on, including: a change of where a proposed action is staged. |
| R7 | A new detector, rule or report that touches gating of externally visible actions. |

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes the phrase "externally visible actions" inside a list of
four kinds of action needing an approval gate, and states no requirement, level or evidence for it. The
item is class `D` because its token is derived from the brief; the requirements are not derived.
Specifically authored here, none of it owner-approved:

- **R1 to R6 in full**, with the defined terms audience, channel and name, and the rule that an
  approval is by a person with authority over the name and the channel.
- **R3, the binding of an approval to content and audience**, and **R4, the gating of a channel and
  not a tool name.** Neither is in the brief or in Standard 45.
- **R5, that retractability is no ground to omit the gate.** The brief makes no statement about it.
- **R6, that a held action is not perceivable by its audience.**
- **R7**, the constraint on this framework, in the same form as the equivalent requirements in
  [Standard 25](25-grounding-and-hallucination-control.md) and [Standard 43](43-environmental-impact-accounting.md).
- **The adoption of Standard 45's definition** of externally visible, and the exclusion of a system's
  reply to its invoking party, which are boundary judgments no one has confirmed.
- **The severity assignments** (one level per requirement, in Validation), the statement that no
  attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the
  decision to name no rule id.

Not authored here: the posture and the class definition are the boundary review's and Standard 45's.

## Relationship to other standards and ADRs

[Standard 45](45-approval-gates.md) defines the `externally-visible` class in R2 and gates only
irreversible actions in R3; this standard supplies the gate for the class Standard 45 classifies and
names, and deliberately restates none of Standard 45's rules.
[Standard 10](10-human-oversight-and-intervention.md) owns what the approver is shown and may do, and
links this item. [Standard 11](11-autonomy-levels-and-delegated-authority.md) owns standing
authority; a grant there does not satisfy R2 for a given invocation unless Standard 11 records it as the
approval, and this standard does not decide that. [Standard 40](40-user-disclosure-of-ai-involvement.md)
owns whether an audience is told an AI was involved. [Standard 51](51-agent-and-tool-execution-prohibitions.md)
owns an agent not rewriting its own permissions, which is how a gate would be removed from inside.
[Standard 1](01-ai-system-manifest.md) holds the declarations R1 reads and declares no audience field;
none is proposed here. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the
Tests section answers. [Standard 36](36-auditability-of-ai-actions.md) R1 and R2 govern the audit record of an action and the principal and
authority it names, including a reference to the approval record under Standard 45 R3; R2 and R3 here depend on
that record and do not specify it. Standard 36 leaves the form of the record to the project.

**Outside this pack.** No adjacent pack's standard is recorded for this subject.
UIUXDesignStandards owns how an approval is presented, as the boundary review records for Standard 45. No ADR
covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R6 is enforced; R7 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| Class and fields | `schemas/tool-permissions.schema.json` accepts the impact class `externally-visible`, an optional boolean `requiresApproval` and an optional free-text `scope` per tool. `gate.actions-classified` checks that each declared tool carries a class and not whether it is right |
| R7 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` reads `requiresApproval` or states a gate for an externally visible action |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 | A place to declare audience and channel: a schema change or a named document a rule can find | The schema is closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R2 to R6 | Approval records and send-path behaviour of a running system | Not properties of a checkout; no runtime component exists in this repository |
| R7 | A test asserting no detector, rule, audit finding or report emits a gating verdict from a setting | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | A shard and an id, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports an externally visible action gated,
approved or reviewed because `requiresApproval`, an impact class or a declaration is present. R7
forecloses it, and the foreclosure is the point: a declaration is not a control.
