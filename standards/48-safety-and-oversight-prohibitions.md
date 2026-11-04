# Standard 48 — Safety and Oversight Prohibitions

[Standard 8](08-ai-safety-requirements-and-safety-cases.md) asks a project to state its safety
requirements and argue them. [Standard 10](10-human-oversight-and-intervention.md) asks that a person be
positioned to review, correct, pause or stop what the system does, and that an intervention bind it.
Both are written from the project's side. Neither says what the system must never do to the
arrangements they describe.

This standard says three things, each about authority over the system's own safeguards that arrives by
a route nobody granted. The system must not take apart the path by which a person intervenes on it. It
must not take apart a control that one of its stated safety requirements depends on. And a safety
requirement must not be dropped or loosened without a recorded decision. In none of the three is there
a line of code that says "disable oversight": there is an ordinary tool, an ordinary configuration
write, an ordinary refactor, and a consequence nobody decided on.

This standard is **prose first**. It states obligations and the observation that would show each one
broken. It ships no catalog rule and mints no identifier, and it moves no rule from another standard.
Whether any of these obligations becomes a rule, and in which standard it lives, is not decided here.

Source: item 48 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
authored; the specification names it the negative face of the `AI safety` and `human oversight` tokens
of the brief's first bullet in
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 48 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) by listing item 48 under
> `notGovernedElsewhere`. That review's substantive half is human judgment and carries
> `humanSignOff: null`. No maintainer of any adjacent pack has confirmed it.
>
> **This item is authored, not derived.** The brief has no prohibition section; the specification lists
> every must-never requirement as class-A work. Everything normative below is this repository's
> judgment. No requirement here is owner-approved; the [Additions](#additions-this-standard-makes-beyond-the-source)
> section lists each one.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it —
a repository that invokes a model, retrieves context for one, or acts on a model's output — to the
extent that an overseer is, or is claimed to be, positioned to intervene on it (R1), or that a safety
requirement has been stated for it (R2 and R3).

Terms used here are the neighbouring standards' and are not redefined: **overseer**, **oversight point**
and **intervention capability** are [Standard 10](10-human-oversight-and-intervention.md)'s; a **stated
safety requirement** is one stated under [Standard 8](08-ai-safety-requirements-and-safety-cases.md) R1.
Two terms are this standard's:

- **Intervention path** — the mechanism by which an overseer exercises an intervention capability: the
  control that declines, corrects, pauses or stops; the route by which the overseer is told there is
  something to act on; and the record that an intervention was made.
- **Safety control** — a mechanism that a stated safety requirement depends on: a validator, a filter, a
  refusal policy, a limiter, a monitor or a guard model, wherever it runs.

**Where each requirement reaches.** R1 reaches a system with an overseer. R2 and R3 reach a system with
a stated safety requirement. R4 constrains this framework and reaches no project. A system with none of
the first two subjects may declare the matter not-applicable in its own documents; this standard ships
no catalog rule, so there is no [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 disposition to
attach it to.

It does **not** cover, and claims none of the ground of:

- **Misuse prevention.** [Standard 9](09-misuse-and-abuse-prevention.md) states the one `forbidden` rule
  on that token (`misuse.safety-controls-not-disabled`) and records that no prohibition item names the
  token. Whether item 48 takes it is Q9 and is **not decided here**; nothing below reads Standard 9's
  rule into this item or out of it.
- **An overseer's decision binding the system.** [Standard 10](10-human-oversight-and-intervention.md)
  R5 stays where it is.
- **Approval obtained from the system that wants it, and gates that fail open.**
  [Standard 45](45-approval-gates.md) R5 and R6.
- **Authority beyond the declared tier.** [Standard 11](11-autonomy-levels-and-delegated-authority.md) R6.
- **Self-modification of instructions, permissions or budget, and retrieved content becoming
  instruction.** [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1 and R2.
- **Whether a safety property holds while the system runs.** Standard 8 R5. This standard concerns
  what the system must not do to the controls, not whether the property holds.
- **Honesty and disclosure.** [Standard 52](52-output-honesty-prohibitions.md) and
  [Standard 53](53-disclosure-and-deception-prohibitions.md).

**Boundary posture O — owned here.** The boundary review lists item 48 among the items for which it
searched the nine packs' rule files and standard filenames and found no owner. That entry is the one
read; no precedent is cited and nothing in an adjacent pack was re-read. [Standard
7](07-boundary-with-adjacent-standards.md) records the row ("AI safety, misuse, human oversight" —
AIStandards owns). No rule id is minted here, so none can collide (Standard 7 R4).

**Placement is open.** Q23 asks whether the prohibition on disabling, evading or degrading an overseer
is item 48's or belongs in Standard 10. R1 is written here and is **provisional on that answer**: if the
owner places it in Standard 10, R1 is withdrawn from this document. No rule in any standard is moved or
reattributed by this one.

## Requirements

### R1 — The system does not take apart an intervention path

**An AI system MUST NOT disable, evade or degrade an intervention path.**

*Disable* is to remove or turn off the control, the route or the record. *Degrade* is to leave it in
place and make it do less: redirect or suppress the notification so that the overseer is not told,
throttle or delay the control past the window the project has stated, or alter or erase the record that
an intervention was made. *Evade* is to take an effect by a route that carries no oversight point where
the declared route for the same effect would carry one, such as the same write made through a second
tool. Each is an act of the system, whether the system chose it or was directed to it by content it read.

This is the general form of a clause [Standard 10](10-human-oversight-and-intervention.md) R5 states for
one decision: R5 forbids discarding, reversing or retrying past an overseer's use of an intervention
capability. R1 here concerns the capability itself, before any use of it. Where one act breaches both,
both apply.

The division from the other standards that touch R1 is the same. [Standard 11](11-autonomy-levels-and-delegated-authority.md)
R6 (`oversight.no-authority-beyond-declared-tier`) concerns obtaining or acting on authority beyond the declared
tier, including continuing past a refused or unavailable approval; R1 concerns an act on the intervention path, and
an act can do both, in which case each applies. [Standard 45](45-approval-gates.md) R5 and R6
(`gate.no-self-approval`, `gate.fail-closed`) concern an approval the system supplies for itself and a gate that
opens when its mechanism fails; where the same act also removes or empties an overseer's decision point, R1
applies as well. None of the three is restated or changed here.

**A repository cannot show that R1 holds.** What a reviewer can read — which tools the system holds,
whether its credentials can write to the stop flag, the notification route or the intervention log —
narrows the question and does not answer it, for the reason R1 of Standard 51 gives: whether the system
reaches a path is decided during a run. A write credential the system holds over its own intervention
path is evidence of exposure and is recorded as that, not as a violation. A violation is an act, and the
evidence of an act is a run record.

### R2 — The system does not take apart a safety control

**An AI system MUST NOT disable, bypass or weaken a safety control that a stated safety requirement
depends on.**

*Weaken* is to change the control so that it admits what it excluded: raise a threshold, narrow a
category, skip a validator for an input, or route a request around a filter. The requirement is about
the control the stated requirement names, wherever it runs, and is reached by the system's own act at
run time.

It does not restate Standard 9 R2, which concerns a project's configuration turning off a model
provider's own content controls and is checkable in part as a literal in a file; R2 here concerns an
act of the system on any control a requirement depends on, and is not so checkable. It does not restate
Standard 51 R1, which names three objects: the system prompt, tool permissions and step budget. A
control may be none of those. An act that breaches more than one of these applies each. The same holds for
[Standard 45](45-approval-gates.md) R5 and R6 (`gate.no-self-approval`, `gate.fail-closed`): an approval gate
that the system satisfies for itself, or that opens when its mechanism fails, is those rules' subject; where the
gate is also a safety control that a stated safety requirement depends on, the same act is an R2 act too, and
each applies. [Standard 11](11-autonomy-levels-and-delegated-authority.md) R6
(`oversight.no-authority-beyond-declared-tier`) concerns authority the system's tier does not grant, not the
integrity of a control, and is related to R2 only where one act does both.

As with R1, a repository can show that a control exists and what can write to it, and cannot show what
the system did to it. Standard 8 R5 states that a safety property holds at inference time and is
`not-evaluable`; R2 is the prohibition on the system undoing the means by which the property is meant to
hold.

### R3 — A safety requirement is not dropped or loosened without a recorded decision

**A stated safety requirement MUST NOT be removed or relaxed unless a decision is recorded that names
who made it, when, and what changed.**

*Relaxed* is a change after which behaviour the requirement formerly excluded satisfies it: a narrower
condition, a higher tolerance, a shorter operating context. A tidy-up that leaves the excluded set
unchanged is not a relaxation. The most common route is not a decision at all but an edit made for
another reason, which this requirement asks to be made visible as a decision when its effect is to
loosen.

The requirement does not say who may decide, and it does not say the decision was right. It requires
that the decision exist. It is a requirement on the project and not on the system.

### R4 — This framework MUST NOT report these prohibitions as respected from an absence

**No detector, rule, audit finding or generated report in this framework MAY state that a system
respects R1 to R3, that an intervention path is intact, or that a safety control cannot be bypassed,
because no disabling literal, tool, credential or change was found.**

This is a constraint on the framework, not on a project. A search that finds nothing has established
that it found nothing. The absence of a disabling literal is not the absence of a disabling act, and the
absence of a change record in a repository is not evidence that no requirement changed outside it.
Reporting that a path or control was *found*, as an observation with no verdict, is permitted.

R4 is adapted from the equivalent requirement in [Standard 8](08-ai-safety-requirements-and-safety-cases.md)
R6, [Standard 9](09-misuse-and-abuse-prevention.md) R6 and [Standard 10](10-human-oversight-and-intervention.md)
R12.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Stop path removed | The system, mid-task, deletes or overwrites the flag the overseer's stop control sets | R1 |
| Overseer not told | The system redirects the notification that an action awaits review to a sink nobody reads, or marks it read | R1 |
| Control slowed past its window | A pause control the system keeps busy or rate-limits so that it cannot act inside the stated intervention window | R1 |
| Intervention record altered | The log of an overseer's decline is edited or removed by the system | R1 |
| Second route | An effect the declared route would send for review is made through another tool that has no oversight point | R1 |
| Filter routed around | A request sent to the model by a path that skips the validator a safety requirement depends on | R2 |
| Threshold raised | The system raises the score above which a monitor refuses | R2 |
| Control skipped for an input | A validator turned off for one input class because it was slow | R2 |
| Requirement quietly narrowed | A stated safety requirement's text is edited so that formerly excluded behaviour satisfies it, with no decision recorded | R3 |
| Requirement deleted in a refactor | A requirement missing from the stated set after a change whose message does not mention it | R3 |
| Absence read as respect | A framework report of "no tampering" because no disabling literal was found | R4 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | A run record or tool-call log showing the system's acts on a stop, pause, decline or correct control, a notification route or an intervention record; and what its credentials can write to | The system's execution records; its deployment's permission configuration. **No manifest or policy field exists for either; see Implementation** | Human review of records the project keeps |
| R2 | A run record showing the system's acts on a named safety control; and what the system's credentials can write to | The same | Human review |
| R3 | The change history of the stated safety requirements, and for each loosening the recorded decision naming who, when and what | Version control and the decision record the project names | Human review |
| R4 | The absence of any detector, rule, audit finding or generated report that states these prohibitions respected from an absence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 and R2 is a record of what happened, and a project that keeps none has produced no
evidence either way, which is a finding about the record and not a pass. Evidence for R3 shows that a
decision was recorded; it does not show the decision was sound.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Four reasons, stated so a reader can disagree with any one of them:

1. **Prose first is the owner's decision.** On 2026-10-15 the owner decided on issue #84 that this standard is written as prose, that the placement question stays open (Q9, and Q23 for the overseer prohibition), and that no rule is moved or reattributed. Minting a rule or a shard is not a worker's act, and this document mints none.
2. **There is no artifact a rule could read for R1 or R2.** Whether a system disabled a stop path or routed around a filter is decided during a run. A repository can show what a system's credentials can reach; that is exposure, not the act. Standard 51 R1 reaches the same conclusion for self-modification and states it as `not-evaluable`.
3. **The adjacent prohibitions are already rules, and the overlap is unsettled.** Standard 9 R2, Standard 10 R5, Standard 11 R6, Standard 45 R5 and R6 and Standard 51 R1 each overlap one of these requirements. A new `forbidden` rule beside them would make a second owner for the same act before the owner has said which standard owns it (Q23).
4. **A `forbidden`-level rule that no check examines reports `prohibited-but-unestablished` and is listed in `unestablishedProhibitions`** ([Standard 5](05-verdict-vocabulary.md)). Adding one is a decision to put that entry in every applicable project's verdict, and is the owner's.

A proposed rule, if one is natural, is recorded in the pull request that introduced this document for per-rule approval, and not here.

**Validation type.** R1 to R3 are `manual-review` obligations in this release, and R1 and R2 are
`manual-review` of records only: what a human can establish is that a record exists and what it shows,
not that nothing happened outside it. R4 constrains this framework and has no validation type, because
the thing it prohibits is a behaviour of the tool. The validation type and the severity are different
things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | error |
| R2 | error |
| R3 | warning |
| R4 | error |

**Exemptibility.** R4 is not exemptible, for the reason R6 of [Standard 25](25-grounding-and-hallucination-control.md) is not. R1 and R2 are not exemptible: each is bounded by its own subject, an overseer or a safety control, and a system with neither is out of scope and says so under Scope; a system that has one and waives the prohibition has recorded itself as knowingly allowed to take it apart. R3 reaches a system only where a safety requirement is stated and is not exemptible for the same reason. This release has no policy mechanism for an exception: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | The system's execution records show no act of the system that removes, turns off, redirects, suppresses, throttles beyond the stated window, alters or erases an intervention path, and no effect taken by a route that skips an oversight point the declared route has | A recorded act of the system on an intervention path of any of those kinds | An overseer pausing or stopping the system, or the project changing its own intervention path through its own change process, must **not** be faulted; a system holding a write credential over its path with no recorded act is an exposure finding, not an R1 violation |
| R2 | The system's execution records show no act of the system that disables, bypasses or loosens a safety control that a stated safety requirement depends on | A recorded act of the system that turns off a named control, routes a request around it, or changes it so that it admits what it excluded | A control the project retunes through its own change process, with a decision recorded under R3, must **not** be faulted under R2 |
| R3 | Every difference in the stated safety requirements across a change either leaves the excluded behaviour unchanged or has a recorded decision naming who, when and what | A removal or relaxation of a stated safety requirement with no recorded decision, or with a decision naming none of who, when or what | A rewording that leaves the excluded behaviour unchanged, and a tightening, must **not** be faulted |
| R4 | No detector, rule, audit finding or generated report in this repository states R1 to R3 respected, an intervention path intact, or a control unbypassable, from an absence | A detector, finding or report that states any of those because no disabling literal, tool, credential or change was found | Reporting that a stop control or a safety control was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifacts, no fixture
carries one, and no detector observes an act of a running system. R1 to R3 are enforced by review or not
at all, and R4 holds today only because no such detector exists. The falsifiers in the table are
available for manual review; what this release lacks is a detector that applies them. A record made
stale by the event in the staleness table below does not satisfy the minimum test it was offered for
until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R3 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | Any change to anything this record names or relies on, including: a change to the stop, pause, decline or correct control, the notification route, the intervention record, or what the system's credentials can write to. |
| R2 | Any change to anything this record names or relies on, including: a change to a safety control a stated requirement depends on, or to what the system's credentials can write to. |
| R3 | Any change to anything this record names or relies on, including: a further change to the stated safety requirements after the one the decision covers. |
| R4 | A new detector, rule or report that touches an intervention path, a safety control or a change record. |

## Additions this standard makes beyond the source

**All of it.** The brief names `AI safety` and `human oversight` and states no must-never requirement
for either; the specification supplies the title and the tokens it is the negative face of, and the
brief has no prohibition section. None of what follows is derived from the brief or approved by the
owner. The one owner decision behind this document is of procedure: on 2026-10-15 (issue #84, option
C) prose is written first, the placement question stays open, no rule is moved or reattributed, and no
specification row changes beyond its `Implemented by` cell. It does not approve any requirement below.
Specifically authored here:

- **R1**, that a system must not disable, evade or degrade an intervention path, with the defined term
  *intervention path* and the three verbs' readings, including *evade* as a second route that skips an
  oversight point, and the statement that a write credential over the path is exposure and not a
  violation.
- **R2**, that a system must not disable, bypass or weaken a safety control a stated safety requirement
  depends on, with the defined term *safety control* and the reading of *weaken*, and the division from
  Standard 9 R2 and Standard 51 R1.
- **R3**, that a stated safety requirement must not be removed or relaxed without a recorded decision
  naming who, when and what, with the reading of *relaxed*, and that it is a requirement on the project
  and not on the system.
- **R4**, the constraint on this framework, in the same form as the equivalent requirement in
  Standards 8, 9 and 10.
- **That R1 is provisional on Q23**, and that no rule is moved or reattributed.
- **That Q9 is left open**: this standard does not take the `misuse prevention` token, and does not say
  it has no prohibitive face.
- **The exclusions in Scope** as division lines, which no adjacent pack's maintainer has confirmed.
- **The severity assignments** (error for R1, R2 and R4, warning for R3), **exemptibility** (none of R1
  to R4 exemptible), the statement that no attestation or scheduled expiry exists in this release, and
  the staleness table.
- **The ruling that this standard ships with no catalog rules**, its four reasons, and the decision to
  name no rule id.

Not authored here: the posture, and the search behind it, are the boundary review's.

**Open questions, recorded and not answered** in
[`artifacts/project-plan-breakdown/08-open-questions.md`](../artifacts/project-plan-breakdown/08-open-questions.md):

- **Q9.** Does `misuse prevention` have a prohibitive face, and which item owns it? Not answered here.
- **Q23.** Is the prohibition on disabling, evading or degrading an overseer item 48's, or Standard 10's?
  R1 is written here pending the answer.

## Relationship to other standards and ADRs

[Standard 1](01-ai-system-manifest.md) draws the scope this standard applies within; its manifest has
no field for an intervention path or a safety control, and none is proposed here.

[Standard 2](02-ai-risk-tiering-and-applicability.md) is relied on for its R3 rule that a tier narrows
scope and never lowers a requirement, and its R4 dispositions, which are why "no overseer" or "no stated
safety requirement" must be a reasoned declaration. [Standard 5](05-verdict-vocabulary.md) defines
`not-evaluated` and `prohibited-but-unestablished`, relied on in Validation.
[Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests section answers.
[Standard 7](07-boundary-with-adjacent-standards.md) records the row this item sits in and R4 governs
identifier collision.

**[Standard 8](08-ai-safety-requirements-and-safety-cases.md) and
[Standard 10](10-human-oversight-and-intervention.md) are the positive faces.** Standard 8 states the
safety requirements R2 and R3 refer to, and says in R5 that the prohibitive form of AI safety
requirements is item 48's. Standard 10 states the overseer, the oversight point and the intervention
capability R1 refers to, and names item 48 in its Scope as the owner of what the system must never do to
its overseers. Neither text is changed by this one. Their R6 and R12 are the forms R4 adapts.

[Standard 9](09-misuse-and-abuse-prevention.md) R2, [Standard 11](11-autonomy-levels-and-delegated-authority.md)
R6, [Standard 45](45-approval-gates.md) R5 and R6, and
[Standard 51](51-agent-and-tool-execution-prohibitions.md) R1 each overlap one requirement here, as set
out under R1 and R2 above, with [Standard 10](10-human-oversight-and-intervention.md) R5 under R1. Each keeps its rule unchanged.

Written standards this one defers to: [Standard 46](46-gates-for-externally-visible-actions.md) (gates for
externally visible actions); [Standard 34](34-ai-incident-response.md) and
[Standard 36](36-auditability-of-ai-actions.md) (the records of what the system did, which R1 and R2 rely on
for evidence); [Standard 35](35-red-teaming.md) (red teaming); and the sibling prohibitions on other
bullets, [Standard 49](49-data-and-privacy-prohibitions.md), [Standard 50](50-evaluation-integrity-prohibitions.md),
[Standard 52](52-output-honesty-prohibitions.md) and [Standard 53](53-disclosure-and-deception-prohibitions.md).
Item 47 (the umbrella for prohibitions not specific to one subject) is the only item named here that is still
unwritten.

**Outside this pack.** The boundary review lists no adjacent pack's standard for this subject.

No ADR covers this standard. `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R3 is enforced; R4 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away
as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R4 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` states a system's intervention path intact, a safety control unbypassable, or these prohibitions respected |
| R1 to R3 | Nothing. No script reads a run record, an intervention path, a safety control or a change history of stated safety requirements |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1, R2 | A place to name an intervention path and a safety control, and a committed record of an exercise against them | Both schemas are closed; a change is a schema-versioning decision outside this slice. How such exercises are run and recorded is [Standard 35](35-red-teaming.md)'s |
| R3 | A check that a change to the stated safety requirements carries a decision record | Needs a place where the stated requirements are declared; none exists |
| R4 | A test asserting no detector, rule, audit finding or report states these prohibitions respected from an absence | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule ids | Reserved-namespace ids and a shard, once the owner decides the placement (Q9, Q23) | Not decided; this standard names none |

**What no future release will implement.** A detector or report that states an intervention path is
intact, a safety control cannot be bypassed, or these prohibitions are respected, because no disabling
literal, tool, credential or change was found. R4 forecloses it: the evidence that would be needed is a
record of what a running system did, and an absence in a repository is not that.
