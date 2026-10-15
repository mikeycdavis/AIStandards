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
it — a repository that invokes a model, retrieves context for one, or acts on a model's output — to
the extent that a person is, or is claimed to be, positioned to review, correct, approve, pause or stop
what the system produces or does.

Covers: who the overseers are and what they are given; what the overseer may do about what they see;
whether they can act before the effect; how an oversight function that is only nominal is told apart
from one that is exercised; and the limit of what this framework can say about any of it.

Three terms, each defined here rather than by the brief:

- An **overseer** is a person, or a role held by people, who is expected to review or intervene in what
  the system produces or does. A reviewer who is the system's own operator is an overseer; a process
  the system controls is not (see R1).
- An **intervention** is any act of an overseer that changes what happens next: declining or editing
  an output, overriding a decision, pausing a run, or stopping the system. Reading is not intervention.
- An **oversight point** is a place where an overseer is expected to act: before an effect, during a
  run, or after the fact.

It does **not** cover, and claims none of the ground of, the following:

- **How much authority a system holds, and the halt path for a system that acts alone.**
  [Standard 11](11-autonomy-levels-and-delegated-authority.md) owns the autonomy tier, R4 (a committed
  halt record for a system declared at `execute` or `autonomous`) and R5 (approval of a tier increase).
  This standard does not restate them. Where an overseer's stop is the halt path Standard 11 R4 asks
  for, that standard's requirement governs its own subject.
- **Whether an individual action is gated.** [Standard 45](45-approval-gates.md) owns the tool
  permission manifest, impact classes, the approval an irreversible action requires, and the
  requirement that a gate fail closed. This standard asks what the person giving that approval can see
  and do; it does not decide which actions need one.
- **Gates for externally visible actions** — item 46, unwritten in this release.
- **What the system must never do to its overseers.** Item 48, Safety and Oversight Prohibitions, is
  the negative face of this item's token in the specification and is unwritten. This standard states
  the positive obligations and mints no forbidden-level prohibition beyond R3's clause that a decline or
  stop sticks; see Q23 below.
- **Records of what the system did**, and the investigation of what went wrong. Item 36
  (Auditability of AI Actions) and item 34 (AI Incident Response) are unwritten in this release.
- **Whether the overseer is entitled to see the data they are shown.** That is item 16 (Access
  Control for Models, Context, and Tools, unwritten). [Standard 13](13-personal-data-in-ai-systems.md)
  states what records may hold and gives how personal data is shown to a user to
  UIUXDesignStandards. Everything below is subject to them and none of it relaxes them.
- **Safety cases** and the properties they argue for, which are
  [Standard 8](08-ai-safety-requirements-and-safety-cases.md)'s; a case may cite an oversight
  arrangement as evidence, and which arrangement is owed is this standard's.

**Boundary posture O — owned here.** The boundary review lists item 10 among the items for which it
searched the nine packs' rule files and standard filenames and found no owner. That is the entry this
standard reads; it records no precedent and none is cited, and nothing in an adjacent pack was
re-read for this document. [Standard 7](07-boundary-with-adjacent-standards.md) records the
corresponding row ("AI safety, misuse, human oversight" — AIStandards owns). Where a rule from another
pack touches the same ground, the more specialised requirement governs and the stricter compatible one
applies (Standard 7 R5).

**A shared namespace, not a shared id.** Rules for this ground, if later minted, would sit under the
`oversight.` segment this pack reserves and uses for Standard 11. No id is minted here (see
Validation), so none can collide (Standard 7 R4).

## Requirements

### R1 — Name the overseers, and keep them apart from the thing overseen

**Where a system claims human oversight at an oversight point, the project MUST record who the
overseers are — by person or by a role with named holders — and MUST NOT count as an overseer any
process, account or component that the system, or an automated agent acting for the party requesting
the action, controls.**

"A human reviews it" is a claim with no subject. In an incident the question is *which* human, and a
role nobody holds is the usual answer. A role is acceptable where people hold it; an unattended
queue is not a role.

The independence condition is [Standard 45](45-approval-gates.md) R5 applied to oversight in
general: an approval that the requesting system generates, infers or defaults is not oversight of it.
The same holds for a reviewer that is another instance of the same model, configured by the same
operator, reading what the first wrote. Such a component may be a *useful check*; it is not the human
this standard speaks of, and a project that employs one says so and still names the person.

**An overseer who is also the author or beneficiary of the thing reviewed is not excluded** by this
requirement, which asks for named people and independence from the *system*. Whether a second person
is warranted is a risk judgment this standard does not make.

### R2 — The overseer is shown what the judgment needs

**At each oversight point, the overseer MUST be presented with the output or action — as proposed,
before an effect, or as it took effect, after the fact — the inputs it was made from or a route to
them, and any signal the system holds that its output is uncertain or ungrounded; and what is
presented MUST NOT be limited to a summary composed by the system whose output is under review.**

A review of a one-line description of an action that the system wrote about itself is a review of the
system's account of itself. The concrete case is a diff presented as "minor formatting changes", or an
email presented without its recipients. The overseer should be able to reach what the system will
actually do, or the concrete artifact, from where they decide.

Uncertainty belongs here because an overseer who is not told the system was unsure approves at the
same rate as one who is told nothing: the information that would have changed the decision exists and
was withheld by the interface. What counts as an uncertainty signal is item 26's subject (Uncertainty Expression and Abstention,
unwritten, posture B); whether an output is grounded is
[Standard 25](25-grounding-and-hallucination-control.md)'s.

### R3 — The overseer can intervene, not only observe

**At every oversight point before an effect, the overseer MUST be able to decline the output and,
where the output can be edited, to correct it; at an after-the-fact point, MUST be able to correct or
reverse the effect where it is reversible; where the system runs over time, MUST be able to pause and
to stop it; and the system MUST NOT be able to reverse, retry past or silently re-queue an overseer's
decline or stop.**

An oversight function whose only action is "approve" is a logging function with a button. Declining
must be a first-class outcome with the same standing as approving, and a decline or stop must stick: a
system that, on decline, re-submits the same action through another path has turned oversight into a
delay.

This is general. [Standard 11](11-autonomy-levels-and-delegated-authority.md) R4 requires, for
`execute` and `autonomous` systems, a committed record of how a human halts the system, who may, and
what state it is left in. R3 here applies to every oversight point of every system in scope and asks
for the capability, not the record; the two are consistent and neither is a substitute for the other.
A `propose` system's overseer declines by not applying the suggestion — R3 is satisfied there when
nothing applies it without them.

### R4 — The overseer can act before the effect, or the arrangement says it cannot

**Where the effect of an output or action can take place before an overseer is able to act on it,
the project MUST record that the oversight point is after the fact, MUST NOT describe it as
pre-effect oversight, and SHOULD state the window within which an intervention can still change the
outcome.**

Oversight has a timing, and the common failure is to describe an after-the-fact review in the
language of a prior one: "all actions are reviewed", where the review happens the next morning and the
action happened the previous night. After-the-fact oversight is a legitimate design and often the
only one a high-volume system can run. It is a different claim, with different consequences when
something is wrong, and it is a claim that has to be made rather than inferred by a reader.

Where an action is irreversible, [Standard 45](45-approval-gates.md) R3 requires approval *before* it
takes effect; an after-the-fact oversight point does not satisfy it, and this requirement does not
relax it. Whether the gate fails closed when no overseer is available is Standard 45 R6's.

### R5 — Oversight that is never exercised is recorded as such

**A project SHOULD keep, for each oversight point, a record of how many items reached the overseer,
how many were declined, corrected, paused or stopped, and how many were decided without a recorded decision
(timed out, auto-closed or bulk-approved); and a record showing no intervention over a period in which
the system was in use MUST be read as a finding to explain rather than as evidence the system is
well behaved.**

Two explanations produce a zero: nothing needed intervening, or the overseer is not in a position to.
They are indistinguishable from the outside and very different in consequence. The requirement is not
that overseers decline a quota; it is that a function nobody has ever used is not described as one that
works.

This is `SHOULD` because the form of the record, and whether collecting it is proportionate, is the
project's. What a project that keeps no such record can honestly say is that oversight is *available*,
not that it is *exercised*, and R6 below keeps this framework from saying more.

### R6 — Overseers are not asked for more than they can do

**Where the volume, speed or complexity of what reaches the overseers exceeds what the people
assigned to that oversight point can review in the time allotted, taken together, the project MUST NOT
present the review as overseeing each item, and SHOULD change the design — by adding reviewers,
sampling, batching, escalation criteria or narrowing the system's authority — and say which it did.**

Review capacity is a property of people and of a queue. The comparison is between the workload and the
**aggregate** capacity of the named holders of the role, which may divide a queue between them; it is not
a single person's threshold. A system that produces five thousand items a day for one reviewer has a
review step whose real function is to be able to say a reviewer exists; the same volume divided among
enough holders, each of whom actually reviews their share, does not. This requirement does not set a
number: no ratio is derived from the brief, and any figure here would be an invention. It asks that the
claim fit the arrangement.

**Sampling is a legitimate design and is not weakened here.** Reviewing a sample with a stated rate is
oversight of the sample and of the process; it is not oversight of each item, and the project says
which it is.

### R7 — This framework MUST NOT report a system overseen from the presence of an oversight artifact

**No detector, audit finding or generated report in this framework MAY state that a system is
subject to human oversight, that an overseer is able to intervene, or that oversight is effective,
because a review step, an approval record, a runbook, a role name, an approval UI or a dashboard is
present in the repository.**

This constrains verdicts the framework reports, not the catalog's statement of what a human reviewer is
asked to confirm. A `manual-review` rule such as Standard 11's `oversight.intervention-path-declared`
states an obligation and leaves the judgment to a reviewer; today it only ever reports skipped or
not-evaluated, and no detector or report in this framework treats a runbook's presence as that rule
passing. The tension between its title and its description is recorded under Q24.

A repository can show that a document names a role, that an approval file exists, or that a
confirmation dialog is called. It cannot show that the role is held, that the person saw what the
system did, that the decline was honoured, or that anyone acted in time. Reporting a pass from any of
those would put this framework's authority behind a property of an organisation, which a repository
does not contain.

Whether oversight is available, informed and exercised is an operational fact about people and a
running system. It is **not-evaluable** from a repository. This is adapted from the equivalent
requirement, which also names a rule, in [Standard 8](08-ai-safety-requirements-and-safety-cases.md),
[Standard 17](17-evaluation-plans-for-generative-systems.md),
[Standard 33](33-ai-observability.md) and [Standard 25](25-grounding-and-hallucination-control.md).

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Unattended role | "A human reviews it", and the review queue has no owner | R1 |
| Self-approval | The system's own output, or its own agent, supplies the approval that lets it proceed | R1 |
| Reviewer of the same kind | A second model instance configured by the same operator is recorded as the human check | R1 |
| Reviewing the self-description | The overseer sees the system's one-line summary of an action, not the action | R2 |
| Withheld doubt | The system held an uncertainty signal; the interface did not show it | R2 |
| Approve-only | The overseer's sole action is to confirm; there is no decline | R3 |
| Decline that does not stick | A declined action is re-submitted by another path or retried until approved | R3 |
| No stop | The system can be observed but not paused or stopped by the person watching it | R3 |
| After-the-fact called before | A next-day review described as "all actions are reviewed" | R4 |
| Zero read as health | No intervention in a year taken as evidence the system is safe | R5 |
| Bulk approval | A queue cleared by a single action, recorded as each item reviewed | R5, R6 |
| Capacity mismatch | Thousands of items a day for one overseer, presented as item-by-item review | R6 |
| Presence read as oversight | A framework report of "overseen" because an approval file or a role name exists | R7 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The recorded overseers, by person or by role with holders, for each oversight point, and the statement of what each point is independent of | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | A sample of what the overseer is shown at an oversight point, set against what the system will do or did | The review interface or its description, and the system's code that produces it | Human review |
| R3 | The overseer's available actions at each oversight point, and the behaviour of the system on a decline or stop | The interface, the code that handles the outcome, and a demonstration | Human review |
| R4 | The recorded timing of each oversight point (before the effect or after), and the stated window where after | A project document the project names | Human review |
| R5 | The counts described, per period, or a statement that none are kept | The project's own records | Human review |
| R5 (the reason for a zero) | None obtainable from a repository | — | **Not-evaluable** |
| R6 | The volume reaching the oversight point, the number of holders and the share each reviews, against the time allotted, and the design chosen where it exceeds it | The project's operating records and documents | Human review |
| R7 | The absence of any detector that reports oversight from presence | This repository's own detectors and tests | Code review; see Implementation |

A document that names overseers, states a timing or describes a review interface establishes that the
project wrote it. It does not establish that the people exist, saw what is described or acted in time;
the reviewer reads the document against the interface, the code and a sample of actual decisions.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
Section 6 of [plan 02](../artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md) requires
every standard to cite at least one rule or record in its Validation section why it ships with none;
this is that record.

Four reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact an automated rule could read.** A structural rule for R1 or R4 would look for
   a recorded set of overseers or a timing, and neither `schemas/ai-system-manifest.schema.json` nor
   `schemas/ai-policy.schema.json` has a place for one; both are closed. Such a rule would fail every
   project for omitting what no schema accepts and would measure this framework's own incompleteness.
   Adding a schema field is a schema-versioning decision; plan 02 section 8 records the same boundary
   for risk-tier fields. A `manual-review` rule needs no schema field, and whether one is wanted rests
   on reasons 3 and 4 and the owner's per-rule decision.
2. **R2, R3, R5 and R6 concern people and a running system.** What an overseer is shown, whether a
   decline is honoured and how many items reach the overseers are properties of an interface, an
   organisation and a queue, not of source text. A detector reading source would test for the presence
   of an approval function, which R7 forbids this framework from reporting as a result.
3. **The nearest rules are Standard 11's, and are not extended.** `oversight.intervention-path-declared`
   covers the halt record for `execute` and `autonomous` systems. A rule for the general obligation
   would either duplicate it or widen it, and which is owed is a decision about Standard 11's rules, not
   a side effect of writing this document.
4. **Where the prohibitive face belongs is open.** Whether "the system must not disable, evade or
   degrade oversight" is stated here or as item 48's prohibition is undecided (Q23). A rule minted here
   would pre-empt that.

**Proposed rules are in the pull request, not in `rules/`.** Whether any is wanted is a per-rule
decision for the owner; none is added to a shard by this change.

**Severity and validation type.** No rule exists, so none of the following is a reported result in
this release; the table states what each requirement is and the severity a breach would carry were a
rule minted, so that a consumer classifies it consistently.

| Requirement | Validation type | Severity of a breach | Not-applicable declaration | Exception for a knowing breach |
| --- | --- | --- | --- | --- |
| R1 | manual-review | error | yes, where there is no oversight point | the independence condition: no; the rest: yes |
| R2 | manual-review | error | yes, as R1 | yes |
| R3 | manual-review | error | yes, as R1 | the requirement that a decline or stop stick: no; the rest: yes |
| R4 | manual-review | error for presenting an after-the-fact point as before the effect, or for recording no timing where the effect can precede the overseer; warning for omitting the intervention window (`SHOULD`) | yes, as R1 | the clause that an after-the-fact point is not described as pre-effect: no; the rest: yes |
| R5 (a zero read as evidence of good behaviour, `MUST`) | manual-review | error | yes, as R1 | no |
| R5 (the record exists, `SHOULD`) | manual-review | warning | yes, as R1 | yes |
| R5 (the reason for a zero) | not-evaluable | none reported; not scored | yes, as R1 | exemptible (a not-evaluable rule cannot be non-exemptible); not attestable |
| R6 | manual-review | warning for the `SHOULD` design change, error for presenting review as item-by-item beyond capacity | yes, as R1 | the clause that review is not presented as item-by-item beyond capacity: no; the rest: yes |
| R7 | manual-review (code review of this repository, since it constrains this framework) | error for this repository's changes; not applicable to a consuming project | not applicable | no |

R7 constrains a behaviour of the tool, which a consuming project cannot breach; it is reviewed in this
repository's own changes.

**Exemptibility.** R7 is not exemptible: no project circumstance makes it reasonable for a scan to
report oversight from a presence, and a mechanism for excepting the prohibition would be
self-defeating. R1's independence condition, R3's requirement that a decline or stop stick, R5's requirement that a zero
not be read as good behaviour, R4's
requirement not to describe an after-the-fact point as pre-effect and R6's requirement not to present
review as item-by-item beyond capacity are likewise not exemptible, because an exception would record a
project as knowingly describing a system as overseen that its overseers cannot change. R1 to R6 reach
a system only where its subject exists: a system with no oversight point records in its own documents
that none exists and what would create one, which is the shape of a
[Standard 2](02-ai-risk-tiering-and-applicability.md) R4 declaration should a rule be minted. A system
that has no oversight point is not thereby overseen; it should say what it is. No detector in this
release would contradict a false declaration. No level here is lowered by a risk tier
(Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each oversight point names a person or a role with at least one holder, and no listed overseer is a component the system, or an agent acting for the requester, controls | A role with no holder, or an approval generated by the system or by an automated agent acting for the requesting party | A reviewer who is the system's operator and is named must **not** be failed for that |
| R2 | From the decision or review point the overseer can reach the concrete artifact or action, the inputs it was made from (or a route to them), and any uncertainty signal the system holds | A decision or review screen that shows only a description the system wrote, or that hides the inputs or a held uncertainty signal | A summary that links to the full artifact must **not** be flagged for being a summary |
| R3 | Before an effect, a decline stops the action and the system does not re-submit it by another path, and an editable output can be corrected; after the fact, a reversible effect can be corrected or reversed; where the system runs over time, the overseer can pause it and stop it, and it does not resume or re-queue without them | An action that proceeds after a decline, or a decline overwritten by a retry; an editable output with no correction path; a running system that cannot be paused or stopped by the overseer; a run that resumes after a stop without the overseer; an after-the-fact point at which a reversible effect cannot be corrected or reversed | A `propose` system whose output is simply not applied must **not** be failed for lacking a decline button |
| R4 | Each point whose effect can precede the overseer is recorded as after the fact, is not described as before, and the window within which an intervention can still change the outcome is stated (its absence is the warning) | A next-day review described as pre-effect (error); a point whose effect can precede the overseer with no recorded timing (error); an after-the-fact point with no stated window (warning) | A stated after-the-fact design must **not** be failed for its timing alone (Standard 45 R3 separately governs irreversible actions) |
| R5 | Counts per period exist, including stops; a statement that none are kept is reported as the warning, not as a pass | A claim that oversight "works" resting on a record with no interventions and no explanation | A system with a recorded, explained zero must **not** be flagged |
| R6 | The reviewer can compare the volume and time allotted with the aggregate capacity of the holders, the claim fits them, and where the volume exceeds the aggregate capacity the design change chosen (added reviewers, sampling, batching, escalation criteria or narrowed authority) is stated | Item-by-item review claimed for a volume the assigned holders together cannot review (error); capacity exceeded with no design change or remedy stated (warning) | A stated sampling design with a rate must **not** be flagged as weaker oversight; a queue divided among enough holders to review every item must **not** be failed for its volume |
| R7 | No detector or report in this repository outputs an oversight verdict from presence | A detector that reported "overseen" because an approval file existed | Reporting that an approval file was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads an oversight record and no fixture
carries one, so each falsifier above is applied by review or not at all for R1 to R6, and R7 holds by construction. The
negative controls state what review must not do to a project that has the right subject and does the
right thing. **A falsifier nobody applies is a requirement nobody can be shown to have broken**,
and that is the honest state of this standard.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R6 in this release, because no rule exists to
except, and the exception mechanism of item 4 is Phase 4 work and not implemented. A project that
knowingly does not meet one records that in its own documents.

**Attestation.** None exists in this release (item 4, Phase 4). Under
[Standard 6](06-standard-structure-and-rule-identity.md) R8 a `manual-review` rule defaults to
attestable, and attestability is independent of exemptibility: if a rule were minted, R1 to R6 would be
attestable, including the clauses marked not exemptible above, since non-exemptibility bars approving a
known breach and not supplying human evidence of compliance. The reason for a zero in R5 is
not-evaluable and cannot be attested. R7, if minted, would carry `attestable: false`: it constrains this
framework and no project can attest to it.

**What invalidates a recorded oversight arrangement.** Each of these changes who is overseeing or
what they can do, and an arrangement recorded before the change describes the earlier system:

- a change in the holders of a named role, in the team that owns the queue, or in who is on call;
- a change to the interface or channel in which the overseer sees the output;
- a change in volume that the capacity in R6 was recorded against;
- a change in how quickly the effect follows the output, which moves the timing recorded in R4;
- a tool added, or an existing tool gaining a side effect, which creates an oversight point nobody
  recorded;
- a change to the code or path that handles a decline, pause or stop;
- an automated approver or agent becoming able to supply an approval at an oversight point;
- a change of declared autonomy tier under [Standard 11](11-autonomy-levels-and-delegated-authority.md);
- a detector or report being added that states oversight as a result, which invalidates the reading of R7
  above.

**Staleness is not a calendar.** An arrangement does not expire with time; it stops being true when one
of the above happens, and nobody is prompted. Nothing in this release detects the transition; the
events above are a note to a future reader.

**Contradicted by operation.** An incident in which an overseer could not stop the system, was not shown
what it did, or never saw the item contradicts what the project recorded under R1 to R4 and invalidates
it until re-examined. What happens operationally is item 34's subject (AI Incident Response, unwritten
in this release); this standard says only that the record no longer stands.

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes two words, "human oversight", in the bullet "AI safety,
misuse prevention, and human oversight". It states no requirement, level or evidence for them. The item
is class `D` because its subject token is derived from the brief; the requirements are not derived.
Specifically authored here, none of it owner-approved:

- **The three terms** overseer, intervention and oversight point, and the ruling that reading is not
  intervention. The brief defines none.
- **R1 in full**: that overseers are named by person or by role with holders, and that nothing the
  system or an automated agent acting for the requesting party controls counts as one, including a
  second instance of a model.
- **R2 in full**: that the overseer is shown the artifact or a route to it, any uncertainty signal,
  and more than the system's own summary.
- **R3 in full**: the three capabilities of decline or correct, pause and stop; the requirement that a
  decline or stop stick; and its relation to Standard 11 R4 as general to specific.
- **R4's separation of before-effect from after-the-fact oversight**, the ruling that the latter must
  be called what it is, and the `SHOULD` statement of the window.
- **R5's counts and the ruling that a zero is a finding to explain**; its `SHOULD` level.
- **R6's capacity requirement** and its deliberate refusal to state a number.
- **R7**, the constraint on this framework, adapted from the equivalent requirement (which also names a
  rule; R7 omits it, see R7) in
  [Standard 8](08-ai-safety-requirements-and-safety-cases.md),
  [Standard 17](17-evaluation-plans-for-generative-systems.md),
  [Standard 25](25-grounding-and-hallucination-control.md) and
  [Standard 33](33-ai-observability.md).
- **The exclusions in Scope** as division lines, including the lines against Standards 11 and 45 and
  items 34, 36, 46 and 48. Where each begins is unconfirmed by anyone.
- **The ruling that this standard ships with no catalog rules**, the four reasons for it, and the
  decision to mint no id in the `oversight.` namespace.
- **The questions recorded below as open.**

Not authored here: the posture `O` and the search that supports it are the boundary review's.

**Open questions, recorded and not answered** (Q23 to Q25 in
[`artifacts/project-plan-breakdown/08-open-questions.md`](../artifacts/project-plan-breakdown/08-open-questions.md)):

- **Q23.** Is the remaining prohibitive form — a system must not disable, evade or degrade its
  overseers — item 48's, as the specification's "negative face of `human oversight`" suggests, or is it
  stated here? This standard states positive obligations and relies on R3's clause that a decline or stop
  sticks; the remaining prohibitive form (disable, evade, degrade) is the open part.
- **Q24.** Should the general intervention capability (R3) and the halt record (Standard 11 R4) be one
  rule or two, and in which standard's shard does it live? Relatedly, the title of
  `oversight.intervention-path-declared` ("A human can halt the system") says more than its description
  (a committed document names the halt path), which R7 would not allow a report to state from a
  runbook's presence.
- **Q25.** Is R1's exclusion of a model-instance reviewer from the meaning of "overseer" what the owner
  wants, given that automated review may be a legitimate control?

## Relationship to other standards and ADRs

[Standard 11](11-autonomy-levels-and-delegated-authority.md) is the closest neighbour and the boundary
is worth stating exactly: **11 governs how much authority the system holds and requires a halt record
where it acts alone; 10 governs whether the people who are supposed to be watching can see, decide
and act.** A system can declare its tier and hold a halt runbook and still present its overseer with a
self-written summary and no way to decline. Where the two overlap, the more specific requirement governs
its own subject and neither is carried as independently authoritative.

[Standard 45](45-approval-gates.md) governs which actions are gated, requires irreversible actions to
await approval and requires the gate to fail closed; R5 there (never obtain the approval from the
system that wants it) is the independence R1 here applies generally. This standard asks what the
approver is shown and may do; it decides no gate.

[Standard 8](08-ai-safety-requirements-and-safety-cases.md) may cite an oversight arrangement as
evidence in a safety case, and [Standard 9](09-misuse-and-abuse-prevention.md) and
[Standard 23](23-agent-execution-security.md) each record this item as the general obligation they do
not claim. Item 26 (unwritten) will define what an uncertainty signal is, which R2 asks to be shown, and
[Standard 25](25-grounding-and-hallucination-control.md)'s Scope defines ungrounded output and its R2 the
signal that carries it.
[Standard 13](13-personal-data-in-ai-systems.md) governs what a stored or sent record may contain;
entitlement to view it is item 16's. [Standard 7](07-boundary-with-adjacent-standards.md) R4 and R5 order conflicts and keep
ids from colliding, and [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the
applicability and non-lowering language used above.

Items 34, 36, 46 and 48 are unwritten in this release; the lines drawn above are provisional until they
are, and the later standards may legitimately move them. Standards 8, 9, 11 and 23, which said item 10 was unwritten, are updated in the same change to
point here. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R6 is enforced; R7 holds by construction.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away
as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R7 | **Holds by construction, not by assertion.** No `oversight.*` id is in `EVALUATED_RULES` in `scripts/standards.mjs`, so the manual-review rules of that shard report skipped or not-evaluated and no detector reports oversight as a result. No test asserts the absence, so a future detector could break R7 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs`. That a document exists and is well-formed is not evidence of any project's oversight |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1, R4 | A place to record overseers and timing: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and plan 02 section 8 records the same boundary for risk-tier fields, the same reasoning applying, so it is out of scope for this slice |
| R2, R3, R5, R6 | A way to read a project's own review interface and decision records | The form is the project's; a repository scan cannot read a queue or a person, and Phase 3 detector and evidence-availability work follows the corpus |
| Rule ids | An owner decision on Q23 and Q24, and a shard placement | Not decided; this standard names none |
| R7 | A test asserting no detector emits an oversight verdict | Meaningful only once a detector exists for it to constrain |

**What no future release will implement.** A detector that reports a system overseen, an overseer able
to intervene, or oversight effective from the presence of a review step, an approval record, a runbook,
a role name, an approval UI or a dashboard. R7 forecloses it, and the foreclosure is the point: the
artifact's presence is not the exercise of the function it names, and a framework reporting it would put
its authority behind a property of an organisation that nothing in a repository can show.
