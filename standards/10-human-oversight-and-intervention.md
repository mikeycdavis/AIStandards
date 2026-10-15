# Standard 10 — Human Oversight and Intervention

A person is "in the loop" the way a smoke detector is "in the building": the claim is true of
something that exists, and silent about whether it can do the one thing it is there for. Most systems
that say they have human oversight can point to a person, a screen or a step. Far fewer can say which
person, shown what, able to do what, and in how much time before the effect lands.

This standard is about oversight as a **capability exercised by identifiable people**, not as a box in
a diagram. It asks that the people be named, that they be shown what they would need to judge, that
they be able to correct, pause and stop the system and not merely watch it, and that where the effect
cannot wait for them the system say so instead of calling the review oversight.

The failure it is written against is oversight asserted from the presence of its furniture: a review
screen nobody is assigned to, an approve button that is the only button, a stop switch known to one
person, a dashboard that is looked at after the fact. None of those says that a person could have
changed the outcome.

Source: item 10 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "human oversight" token of the "AI safety, misuse prevention, and human oversight"
bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 10 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded
> in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) under
> `notGovernedElsewhere`, whose substantive half is human judgment and carries `humanSignOff: null`.
> No maintainer of any adjacent pack has confirmed it.
>
> **The brief supplies two words and this standard supplies the rest.** The brief's bullet names
> "human oversight" and states no requirement for it. The item is class `D` because its token is the
> brief's own; the requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it, to the extent that a person is, or is claimed to be, positioned to review, correct, approve, pause
or stop what the system produces or does.

Defined terms, each used verbatim below:

- **Overseer** — a person, or a role held by named people, expected to review or intervene in what the
  system produces or does.
- **Oversight point** — a place where an overseer is expected to act: *before an effect*, *during a
  run*, or *after the fact*.
- **Decision material** — the output or action (as proposed before an effect, as it is in progress
  during a run, or as it took effect after the fact), the inputs it was made from or a route to them, and any signal the system holds that
  the output is uncertain or ungrounded. A summary composed by the system under review is not decision
  material.
- **Intervention capability** — at an oversight point *before an effect*: decline the output, and
  correct it where it can be edited; *after the fact*: correct or reverse the effect where it is
  reversible; *during a run*: pause and stop it.
- **Aggregate capacity** — the amount of review the named holders of the overseer role can do together
  in the time allotted.

It does **not** cover, and claims none of the ground of:

- **Autonomy tier and the halt record for a system that acts alone** —
  [Standard 11](11-autonomy-levels-and-delegated-authority.md) R1 and R4, and R5 for raising the tier.
- **Whether an individual action is gated** — [Standard 45](45-approval-gates.md) R3 (irreversible
  actions await approval), R5 and R6. This standard asks what the approver is shown and may do.
- **Gates for externally visible actions** — item 46, unwritten.
- **What the system must never do to its overseers** — item 48, Safety and Oversight Prohibitions,
  unwritten and the negative face of this item's token. This standard mints no forbidden-level
  prohibition beyond R5, the only must-not clause on the system's own behaviour (R2 and R10 constrain
  the project; see Q23).
- **Records of what the system did and the investigation of failures** — items 36 and 34, unwritten.
- **Entitlement to view data** — item 16, unwritten. [Standard 13](13-personal-data-in-ai-systems.md)
  states what records may hold and gives how personal data is shown to a user to UIUXDesignStandards.
- **Safety cases** — [Standard 8](08-ai-safety-requirements-and-safety-cases.md); a case may cite an
  oversight arrangement as evidence, and which arrangement is owed is this standard's.

**Boundary posture O — owned here.** The boundary review lists item 10 among the items for which it
searched the nine packs' rule files and standard filenames and found no owner. That entry is the one
read; no precedent is cited and nothing in an adjacent pack was re-read.
[Standard 7](07-boundary-with-adjacent-standards.md) records the row ("AI safety, misuse, human
oversight" — AIStandards owns). Where a rule from another pack touches the same ground, the more
specialised requirement governs and the stricter compatible one applies (Standard 7 R5). No rule id is
minted here (see Validation), so none can collide (Standard 7 R4).

## Requirements

Each requirement has one limb. Each has exactly one failure-mode row, evidence row, test row, severity
row and staleness line below, keyed by its number.

### R1 — Overseers are named

**Where a system claims human oversight at an oversight point, the project MUST record who the
overseers are, by person or by a role with named holders.**

"A human reviews it" is a claim with no subject. A role is acceptable where people hold it; an
unattended queue is not a role.

### R2 — An overseer is independent of the system

**The project MUST NOT count as an overseer any component that the system, or an automated agent acting
for the requesting party, controls.**

This is [Standard 45](45-approval-gates.md) R5 applied to oversight in general. A second instance of a
model configured by the same operator is a useful check and is not the human this standard means. A
named person who is also the operator, author or requester is not excluded.

### R3 — The overseer is given decision material

**At each oversight point the overseer MUST be presented with the decision material.**

A review of a one-line description the system wrote about itself is a review of the system's account
of itself. What counts as an uncertainty signal is item 26's subject (unwritten, posture B); whether an
output is grounded is [Standard 25](25-grounding-and-hallucination-control.md)'s (its Scope defines
ungrounded output and its R2 the signal that carries it).

### R4 — The overseer has the intervention capabilities

**At each oversight point the overseer MUST have the intervention capabilities that apply to it.**

An oversight function whose only action is "approve" is a logging function with a button. Declining
is a first-class outcome with the same standing as approving. This is general; Standard 11 R4 requires
for `execute` and `autonomous` systems a committed record of the halt path, and the two are consistent.
A `propose` system's overseer declines by not applying the suggestion, and R4 is met there when nothing
applies it without them.

### R5 — An intervention binds the system

**The system MUST NOT reverse, retry past or re-queue an overseer's decline, pause or stop.**

A system that, on decline, re-submits the same action by another path has turned oversight into a
delay.

### R6 — An oversight point is recorded at its true timing

**Where an effect can occur before an overseer is able to act, the project MUST record the oversight
point as after the fact.**

"All actions are reviewed", where the review is next morning and the action was last night, describes
a different claim. After-the-fact oversight is a legitimate design. Irreversible actions need approval
before the effect under Standard 45 R3, which this requirement does not relax.

### R7 — The intervention window is stated

**The project SHOULD state, for an oversight point after the fact, the window within which an
intervention can still change the outcome.**

### R8 — Interventions are counted

**The project SHOULD keep, for each oversight point, a record of items that reached the overseers, items
declined, corrected, paused or stopped, and items decided without a recorded decision.**

The form of the record and whether it is proportionate is the project's. Without it a project can say
oversight is *available*, not that it is *exercised*.

### R9 — A zero is a finding

**A record showing no intervention over a period of use MUST be reported as a finding to explain.**

Two explanations produce a zero: nothing needed intervening, or the overseer is not in a position to.
They are indistinguishable from outside. The requirement is not a quota; it is that a function nobody
has used is not described as one that works.

### R10 — Item-by-item review is not claimed beyond capacity

**The project MUST NOT claim item-by-item review where the volume, speed or complexity of the items
exceeds the aggregate capacity.**

The comparison is with the aggregate capacity of the named holders, who may divide a queue between
them; it is not one person's threshold. No number is derived from the brief and none is stated.
Reviewing a sample at a stated rate is oversight of the sample and of the process, and is not claimed
as each item.

### R11 — Capacity exceeded leads to a stated design change

**Where the volume, speed or complexity of the items exceeds the aggregate capacity, the project SHOULD
state which design change it chose: added reviewers, sampling, batching, escalation criteria or
narrowed authority.**

### R12 — This framework does not report oversight from presence

**No detector, audit finding or generated report in this framework MAY state that a system is subject
to human oversight, that an overseer is able to intervene, or that oversight is effective, because a
review step, an approval record, a runbook, a role name, an approval UI or a dashboard is present in
the repository.**

A repository can show that a document names a role or that an approval file exists. It cannot show
that the role is held, that the person saw what the system did, or that anyone acted in time. This
constrains verdicts the framework reports, not the catalog's statement of what a reviewer is asked to
confirm: a `manual-review` rule such as Standard 11's `oversight.intervention-path-declared` states an
obligation and today only ever reports skipped or not-evaluated. The tension between that rule's title
and its description is recorded under Q24. Reporting that a file was *found*, as an observation with no
verdict, is permitted. R12 is adapted from the equivalent requirement in
[Standard 8](08-ai-safety-requirements-and-safety-cases.md) R6,
[Standard 17](17-evaluation-plans-for-generative-systems.md) R9,
[Standard 25](25-grounding-and-hallucination-control.md) R6 and
[Standard 33](33-ai-observability.md) R6; Standards 25 and 33 also name a rule, which R12 omits for the
reason above.

## Failure modes

| Requirement | Failure | What it looks like |
| --- | --- | --- |
| R1 | Unattended role | "A human reviews it", and the review queue has no owner |
| R2 | Self-approval | The system, or its agent for the requester, supplies the approval it needs, or a second model instance is recorded as the human check |
| R3 | Reviewing the self-description | The overseer sees the system's summary of an action, not the action, its inputs or a held doubt |
| R4 | Approve-only | The overseer can confirm but lacks an intervention capability that applies at the point |
| R5 | Intervention that does not bind | A declined action is re-submitted by another path, or a paused or stopped run resumes without the overseer |
| R6 | After-the-fact called before | A next-day review is described as pre-effect, or no timing is recorded where the effect can precede the overseer |
| R7 | Window unstated | An after-the-fact point with no statement of when an intervention could still help |
| R8 | No counts | Oversight claimed with no record of how many items were declined, corrected, paused or stopped |
| R9 | Zero read as health | No intervention in a year taken as evidence the system is safe |
| R10 | Capacity mismatch | Thousands of items a day for one overseer, presented as item-by-item review |
| R11 | No remedy | Capacity exceeded and no design change stated |
| R12 | Presence read as oversight | A framework report of "overseen" because an approval file or role name exists |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The recorded overseers for each oversight point, or the record that no oversight point exists | A project document the project names (no manifest or policy field exists; see Implementation) | Human review |
| R2 | The recorded overseers set against the components the system or its requester's agents control | The same document and the system's configuration | Human review |
| R3 | A sample of what the overseer is shown, set against what the system will do or did | The review interface or its description, and the code that produces it | Human review |
| R4 | The intervention capabilities that apply at each oversight point | The interface and a demonstration | Human review |
| R5 | The behaviour of the system after a decline or stop | The code that handles the outcome, and a demonstration | Human review |
| R6 | The recorded timing of each point whose effect can precede the overseer | A project document the project names | Human review |
| R7 | The stated window for each after-the-fact point | The same document | Human review |
| R8 | The counts per period, or a statement that none are kept | The project's own records | Human review |
| R9 | The record read for a period of use, and the explanation of any zero | The project's own records | Human review |
| R10 | The volume, speed and complexity of the items, the holders and the share each reviews, and the time allotted | The project's operating records and documents | Human review |
| R11 | The design change chosen where capacity is exceeded | The same | Human review |
| R12 | The absence of any detector that reports oversight from presence | This repository's own detectors and tests | Code review; see Implementation |

A document that names overseers or states a timing establishes that the project wrote it. It does not
establish that the people exist, saw what is described or acted in time; the reviewer reads the
document against the interface, the code and a sample of actual decisions. **Whether oversight is
actually exercised is not-evaluable from a repository.**

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.** Section 6 of
[plan 02](../artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md) requires every standard to
cite at least one rule or record in its Validation section why it ships with none; this is that record.
The reasons:

1. **No artifact an automated rule could read.** Neither schema has a place for overseers or timing and
   both are closed; plan 02 section 8 records the same boundary for risk-tier fields. A `manual-review`
   rule needs no schema field, and whether one is wanted rests on reasons 3 and 4 and the owner's
   per-rule decision.
2. **The subject is people and a running system**, not source text; a detector would test for the
   presence of an approval function, which R12 forbids reporting as a result.
3. **The nearest rules are Standard 11's** (`oversight.intervention-path-declared`) and a rule for the
   general obligation would duplicate or widen them; that is Q24.
4. **Where the prohibitive face belongs is open** (Q23); a rule minted here would pre-empt it.

Proposed rules are in the pull request description for per-rule owner decision and are not in `rules/`.

No rule exists, so the following states what each requirement is and the severity a breach would carry
were a rule minted. Every row is `manual-review` except R12, which is code review of this repository.

| Requirement | Severity of a breach | Not-applicable where no oversight point | Exemptible | Attestable |
| --- | --- | --- | --- | --- |
| R1 | error | yes | yes | yes |
| R2 | error | yes | **no** | yes |
| R3 | error | yes | yes | yes |
| R4 | error | yes | yes | yes |
| R5 | error | yes | **no** | yes |
| R6 | error | yes | **no** | yes |
| R7 | warning | yes | yes | yes |
| R8 | warning | yes | yes | yes |
| R9 | error | yes | **no** | yes |
| R10 | error | yes | **no** | yes |
| R11 | warning | yes | yes | yes |
| R12 | error (this repository's changes) | not applicable | **no** | no |

**Non-exemptible rows** (R2, R5, R6, R9, R10) are those whose breach records a project as knowingly
describing a system as overseen that its overseers cannot change; R12 is non-exemptible because a scan
reporting an effect from a presence cannot be excused. Non-exemptibility bars approving a known breach;
it does not bar supplying evidence of compliance, so attestability is independent
([Standard 6](06-standard-structure-and-rule-identity.md) R8: `manual-review` defaults to attestable).
A system with no oversight point records in its own documents that none exists and what would create
one, the shape of a [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 declaration should a rule be
minted; having none does not make it overseen. No level is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each oversight point names a person, or a role with at least one named holder | A role with no holder | A named person who is also the operator must **not** be failed; a system recording that it has no oversight point must **not** be failed |
| R2 | No listed overseer is a component the system, or an automated agent for the requester, controls | An approval generated by the system or by such an agent | A named person who is the requester must **not** be failed |
| R3 | At the decision or review point the overseer is presented with the decision material | A screen showing only a description the system wrote, or hiding the inputs or a held uncertainty signal | A summary shown together with the full output must **not** be flagged for being a summary |
| R4 | The overseer has each intervention capability that applies to the point | A point lacking one that applies | A `propose` system whose output is simply not applied must **not** be failed for lacking a decline button |
| R5 | A decline, pause or stop is not reversed, retried past or re-queued by the system | An action that proceeds after a decline, or a run that resumes after a pause or stop without the overseer | A system that asks the overseer again, who then approves, must **not** be failed |
| R6 | Each point whose effect can precede the overseer is recorded as after the fact | A next-day review described as pre-effect, or such a point with no recorded timing | A stated after-the-fact design must **not** be failed for its timing alone |
| R7 | Each after-the-fact point states its window | An after-the-fact point with no window (warning) | A point whose window is stated as "none" must **not** be failed |
| R8 | Counts per period exist for each point | No record of counts for a point, or a record omitting stops (warning) | A record in a form of the project's choosing must **not** be failed for its form |
| R9 | A zero over a period of use is reported as a finding with an explanation sought | A claim that oversight "works" resting on a zero | A recorded, explained zero must **not** be flagged |
| R10 | The claim of item-by-item review fits the volume, speed and complexity against the aggregate capacity | Item-by-item review claimed beyond aggregate capacity | A stated sampling design must **not** be flagged as weaker; a queue divided among enough holders must **not** be failed for volume |
| R11 | Where capacity is exceeded, the design change is stated | Capacity exceeded and no design change stated (warning) | A system within capacity must **not** be flagged |
| R12 | No detector or report outputs an oversight verdict from presence | A detector reporting "overseen" because an approval file existed | Reporting that a file was *found*, with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads an oversight record and no fixture
carries one, so each falsifier is applied by review or not at all, and R12 holds by construction.

## Exceptions and staleness

There is no policy-level exception mechanism in this release, because no rule exists to except and the
mechanism of item 4 is Phase 4 work. A project that knowingly does not meet a requirement records that
in its own documents. No attestation mechanism exists either (item 4, Phase 4).

**What invalidates a recorded arrangement, by requirement.** Staleness is not a calendar; nothing here
detects the transition and nobody is prompted.

| Requirement | Invalidated by |
| --- | --- |
| R1 | a change in the holders of a named role, the owning team, or who is on call |
| R2 | an automated approver or agent becoming able to supply an approval |
| R3 | a change to the interface or channel in which the overseer sees the output |
| R4 | a tool added, or gaining a side effect, which creates an oversight point nobody recorded; a change of declared autonomy tier under Standard 11 |
| R5 | a change to the code or path that handles a decline, pause or stop |
| R6 | a change in how quickly the effect follows the output |
| R7 | a change in how quickly the effect follows the output |
| R8 | a change of the interface or process that produces the counts |
| R9 | the system gaining use in a period the record did not cover |
| R10 | a change in the volume, speed or complexity of the items, or in the time allotted |
| R11 | the same change as R10 |
| R12 | a detector or report being added that states oversight as a result |

**Contradicted by operation.** An incident in which an overseer could not stop the system, was not shown
what it did, or never saw the item contradicts what the project recorded and invalidates it until
re-examined. What follows is item 34's subject (unwritten).

## Additions this standard makes beyond the source

The brief contributes two words, "human oversight", and no requirement, level or evidence. Authored
here, none of it owner-approved:

- **The defined terms** overseer, oversight point, decision material, intervention capability and
  aggregate capacity, and that reading is not intervention.
- **R1 and R2**: named overseers; the exclusion of any component the system or an automated agent for
  its requester controls, including a second model instance.
- **R3 and R4**: what the overseer is given and may do, and the three-part definition of
  intervention capability.
- **R5**: that an intervention binds the system.
- **R6 and R7**: the before/after-the-fact separation and the `SHOULD` window.
- **R8 and R9**: the counts (`SHOULD`) and the ruling that a zero is a finding.
- **R10 and R11**: capacity against aggregate holders, no number stated, and the `SHOULD` design change.
- **R12**, adapted from the equivalent requirement in Standards 8, 17, 25 and 33; 25 and 33 also name a
  rule, which R12 omits.
- **The severities** (error, warning for R7, R8 and R11), **exemptibility** (R2, R5, R6, R9, R10, R12
  not exemptible), **attestability** (all attestable except R12) and the **staleness table**.
- **The ruling that this standard ships with no catalog rules**, its four reasons, and no id minted in
  `oversight.`.
- **The exclusions in Scope** as division lines; where each begins is unconfirmed by anyone.

Not authored here: the posture `O` and its search are the boundary review's.

**Open questions, recorded and not answered** (Q23 to Q25 in
[`artifacts/project-plan-breakdown/08-open-questions.md`](../artifacts/project-plan-breakdown/08-open-questions.md)):

- **Q23.** Is the remaining prohibitive form — a system must not disable, evade or degrade its
  overseers — item 48's, or stated here? R5 is the only must-not clause on the system's own behaviour (R2 and R10 constrain the project).
- **Q24.** Should the general intervention capability (R4) and the halt record (Standard 11 R4) be one
  rule or two, and in which shard? The title of `oversight.intervention-path-declared` ("A human can
  halt the system") says more than its description.
- **Q25.** Is R2's exclusion of a model-instance reviewer what the owner wants, given that automated
  review may be a legitimate control?

## Relationship to other standards and ADRs

[Standard 11](11-autonomy-levels-and-delegated-authority.md) is the closest neighbour: **11 governs how
much authority the system holds and requires a halt record where it acts alone; 10 governs whether the
people supposed to be watching can see, decide and act.** Where they overlap the more specific
requirement governs its own subject. [Standard 45](45-approval-gates.md) governs which actions are
gated; its R5 is the independence R2 applies generally. [Standard 8](08-ai-safety-requirements-and-safety-cases.md)
may cite an oversight arrangement as evidence, and [Standard 9](09-misuse-and-abuse-prevention.md) and
[Standard 23](23-agent-execution-security.md) each record this item as the general obligation they do
not claim. Item 26 (unwritten) will define what an uncertainty signal is;
[Standard 25](25-grounding-and-hallucination-control.md) defines ungrounded output.
[Standard 13](13-personal-data-in-ai-systems.md) governs what a record may contain; entitlement to view
it is item 16's. [Standard 7](07-boundary-with-adjacent-standards.md) R4 and R5 order conflicts and keep
ids from colliding, and [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the
applicability and non-lowering language used above.

Items 34, 36, 46 and 48 are unwritten; the lines drawn above are provisional until they are. Standards
8, 9, 11 and 23, which said item 10 was unwritten, are updated in the same change to point here. No ADR
covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R11 is enforced; R12 holds by construction.**

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R12 | No `oversight.*` id is in `EVALUATED_RULES` in `scripts/standards.mjs`, so the manual-review rules of that shard report skipped or not-evaluated and no detector reports oversight as a result. No test asserts the absence, so a future detector could break R12 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs` and `scripts/inventory.mjs`. That a document exists is not evidence of any project's oversight |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1, R6, R7 | A place to record overseers and timing: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision, and plan 02 section 8 records the same boundary for risk-tier fields |
| R2 to R5, R8 to R11 | A way to read a project's own review interface and decision records | The form is the project's; a repository scan cannot read a queue or a person, and Phase 3 follows the corpus |
| Rule ids | An owner decision on Q23 and Q24, and a shard placement | Not decided; this standard names none |
| R12 | A test asserting no detector emits an oversight verdict | Meaningful only once a detector exists for it to constrain |

**What no future release will implement.** A detector that reports a system overseen, an overseer able
to intervene, or oversight effective from the presence of a review step, an approval record, a
runbook, a role name, an approval UI or a dashboard. R12 forecloses it: an artifact's presence is not the
exercise of the function it names.
