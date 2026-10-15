# Standard 40 — User Disclosure of AI Involvement

A person who reads a reply, receives a decision or talks to a voice usually cannot tell what produced
it. Whether a model wrote the text, ranked the candidates, drafted the message a human then sent, or
chose which case reaches a reviewer is invisible from the receiving end, and it often matters to what
they do next: how far they rely on it, whether they ask a person, whether they object.

Two questions are routinely run together, and this standard exists to separate them. **Whether** a
person is owed a disclosure that AI was involved is a decision about the system and its users. **How**
that disclosure is shown — its wording, placement, visual treatment, whether it can be perceived by
everyone — is a question about an interface. This standard owns the first. The second belongs to
another pack, and nothing here restates it.

The failure it is written against is the system whose team never decided: no one recorded whether a
disclosure was owed, so none was made, and the decision was taken by default.

Source: item 40 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "user disclosure" token of the "Accessibility, fairness, transparency, and user
disclosure" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 40 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **B**
> (baseline), recorded in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) with
> verdict `CHANGED` (the plan had it as `O`), and that review's substantive half is human judgment and
> carries `humanSignOff: null`. No maintainer of UIUXDesignStandards has confirmed it.
>
> **The brief supplies two words and this standard supplies the rest.** The brief's bullet names "user
> disclosure" and says nothing about when one is owed or what must be true of it. The item is class `D`
> because its subject token is the brief's own; the requirements below are this repository's judgment,
> and the [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it
whose output, or whose action, reaches a person who is not part of the team that built it: a user
interacting with it, a person it produces content for, or a person a decision or action concerns.

Covers: deciding, and recording, whether a person is owed a disclosure that AI was involved; when a
disclosure owed must reach them; whether a person who is the *subject* of an AI-assisted decision is
told; keeping the record of
what was shown; and the limit of what this framework can say about any of it.

It does **not** cover, and claims none of the ground of:

- **How a disclosure is presented.** Wording, placement, marking of generated content, and the
  accessibility of the notice are UIUXDesignStandards' subject (below). [Standard
7](07-boundary-with-adjacent-standards.md)
  records it as deferred, and this pack "owns only *whether* disclosure is owed".
- **Deception and denial of AI involvement.** A system asserting that a person, not an AI, produced or
  is producing its output is the prohibitive face of this item's subject. The specification lists it
  as item 53, "Disclosure and Deception Prohibitions", class `A`, derived from the same `user
  disclosure` token and unwritten on this base. It belongs there, and nothing here states, restates
  or pre-empts it; see Relationship below.
- **Whether a statement is true.** A claim the system makes about the world is item 25's subject, and
  what it says about its own capabilities is item 28's.
- **Documentation for a reader of the repository.** That is item 39, item 39 (Transparency and
System Documentation, unwritten on this base)
  where written; a document in a repository is not a disclosure to a user.
- **What the law requires.** Some jurisdictions require disclosure in particular settings, and which
  settings is a legal question this standard does not answer and must not be read as answering.

**Boundary posture B — baseline, with a named half deferred.** The boundary review changed the posture
from `O` because owning the item outright contradicted this pack's own Standard 7: the owner entry
reads "AIStandards for whether disclosure is owed; UIUXDesignStandards for how it is presented". Its
evidence is one standard in UIUXDesignStandards, and only this:

- **UIUXDesignStandards, `standards/26-ai-user-experience.md`**, with rules
  `ai-ux.no-generated-as-verified`, `ai-ux.ai-failure-states` and `ai-ux.proposal-vs-execution`. Its
  lede, as the review records it: "This standard owns presentation; authorization, attribution, and
  auditability of AI actions belong to EngineeringStandards and are referenced rather than
  restated." Its R1 requires generated content be marked where a user could take it for verified fact.

The file and those three rule ids were rechecked against UIUXDesignStandards `7bff2e9` (the sibling
checkout's HEAD on 2026-10-14, branch `chore/backlog-to-github-issues`, read through git objects): the
set of `ai-ux.*` ids in its `rules/` is exactly those three, and the lede and R1 are as recorded. Its
R8 (the system not anthropomorphized in ways that misrepresent capability) is adjacent to R2 below and
is **not** cited as precedent here. This is a recheck of one file, not a refresh of the inventory.

## Requirements

### R1 — Decide, and record, whether each person-facing output is owed a disclosure

**A project MUST record, for each kind of output or action that reaches a person outside the team,
whether that person is owed a disclosure that AI produced or materially shaped it, to whom, and the
reason — and MUST NOT leave the question undecided because no disclosure was designed.**

"Not owed" is a legitimate answer and is recorded as one, with the reason: an autocomplete suggestion
the person accepts or rejects in the act, or a spell-check, is a different case from a generated
reply sent in a person's name. What is not legitimate is the absence of a decision, because then the
answer is whatever the interface happened to do.

The record is a document, not a manifest field. `schemas/ai-system-manifest.schema.json` is closed and
has no property for it, and nothing in this requirement asks an adopter to write a field that schema
rejects.

### R2 — Where a disclosure is owed, it MUST precede reliance

**A disclosure that is owed MUST reach the person no later than the point at which they interact or
rely, and, for a person who does not interact with the system (R3), no later than the point at which
the decision or action concerning them is taken or communicated.**

Timing is a property of the decision, not of presentation: a notice shown after the person has acted
on the output is a record of an omission. Where in the interface it appears, and how it is made
perceivable and readable, is the owner's matter ([Standard 7](07-boundary-with-adjacent-standards.md)),
and no requirement of location or legibility is made here.

"No later than" is a constraint on when, and a project may meet it in any way the owner's standards
allow. What the system must not *say* about its own nature is the prohibitive item 53, not this one.

### R3 — Decide whether a person who is the subject of an AI-assisted decision is told

**Where AI contributes to a decision or action that concerns a person, and that person is not the one
interacting with the system, the project MUST record whether that person is told that AI contributed,
and MUST NOT treat telling the operator as having told the person.**

A person denied a service, ranked, flagged or described by a system they never used has no interface
in which a disclosure could appear. The operator knows; the person does not. Whether they are owed an
account, and in what form, is the project's decision to make and record, and the law of the place may
have already made it.

### R4 — Do not restate how it is presented; reference the owner

**A project that presents a disclosure MUST be able to name the UIUXDesignStandards standards its
presentation evidence sits under, and MUST NOT offer its disclosure decision as evidence that those
presentation requirements are met; this framework MUST NOT restate them.**

Deciding that a disclosure is owed and presenting it so that it can be perceived and understood are
two obligations, owned by two packs. A project that wrote "we disclose AI use in the footer" has
answered the first and has not shown the second, and a footer is the textbook case of a notice no one
reads before relying. The owner's standards say what presentation requires, and a project reads them
there ([Standard 7](07-boundary-with-adjacent-standards.md) R2).

### R5 — Keep what was shown, and revise the decision when the system changes

**Where a disclosure was presented or is owed, a project MUST be able to show what was presented, in
the form users received it, at a given time, and MUST revise the decision under R1 and R3, and
replace the capture, when a model, a prompt, a use of the output, an audience, the interface that
presents the disclosure, or the law that applies changes.**

A decision recorded as "owed, shown" is a claim about the interface at the time. Without the shipped
text and where it appeared, a later review cannot tell whether it was shown, and a change to the
interface can remove it without anyone changing the decision. The record asked for is the artifact
users saw — a copy of the text and its position — and not the intent of it.

### R6 — This framework MUST NOT report a disclosure made, adequate or lawful from the presence of a string

**No detector, rule, audit finding or generated report in this framework MAY state that a system
discloses AI involvement, that a disclosure is adequate or timely, or that the system complies with a
disclosure obligation, because a notice string, a label, a policy page or a declaration is present in
the repository.**

This is a constraint on the framework, not on a project. A repository can show that a string such as
"generated by AI" exists. It cannot show that the string is rendered, on which path, to whom, before
what. A pass reported from the string would turn the
presence of text into a statement about what people were told.

**A disclosure that has never been shown to reach a person is not demonstrated.** It is shown by the
capture of what a user saw.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Undecided by default | No record of whether anyone is owed a disclosure; none exists because none was designed | R1 |
| Decided by implication | "Everyone knows it is AI" written as the reason, with no look at who the users are | R1 |
| After the fact | The notice appears once the person has acted on the output | R2 |
| Not before reliance | The only disclosure is in a document the person is not shown before they interact or rely | R2 |
| Operator told, subject not | A decision concerning a person is documented in the operator's console and nowhere the person can find | R3 |
| Decision read as presentation | "We decided it is owed" offered as showing the notice can be perceived | R4 |
| No record of the shipped text | No one can say what users saw in March | R5 |
| Stale decision | The system was extended to a new audience; the record describes the old one | R5 |
| Presence read as disclosure | A framework report of "discloses AI" because a notice string exists | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | A record per person-facing output kind: owed or not, to whom, why | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | The point in the interaction, or for a non-interacting subject the point of the decision or action, at which the disclosure appears, relative to interaction, reliance or that decision | The project's interface and a captured example | Human review |
| R3 | The decision for each AI-assisted decision about a person, and what that person receives | The project's documents and a sample of what is sent | Human review |
| R4 | The reference to the owner's standards, and the project's own presentation evidence under them | The project's accessibility and interface records | Human review, by the owner's standards |
| R5 | Where a disclosure was presented or is owed, a capture of the shipped disclosure and its date; in every case, the revision history of the decision | Version control and the project's records | Human review |
| R6 | The absence of any detector that reports disclosure from presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R5 is a human-authored record or a capture. A document naming a decision
establishes that the project wrote it down; only a capture of what a person saw, in the path they
took, shows it.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
[Plan 02 section 6](../artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md) requires
every standard to cite at least one rule or record in its Validation section why it ships with none;
this is that record.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 would look for a recorded decision, and
   neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place for
   one; both are closed. A rule failing every project for omitting what no schema accepts would measure
   this framework's own incompleteness. Adding a field is a schema-versioning decision, outside this
   slice (plan 02 section 8).
2. **R2, R3 and R5 concern what a person saw, not what a file says.** Whether a disclosure precedes
   reliance, reaches the subject of a decision, or was shown in March is a property of the running
   system. A detector reading source would be testing for the presence of a string, which R6 forbids
   this framework from reporting as a result.
3. **No id is minted and the namespace is crowded.** `disclosure` is a reserved segment of this pack
   that FinancialStandards also uses (seven ids, per Standard 7 R4 and `SHARED_SEGMENTS` in
   `scripts/catalog.mjs`). This standard names no id and edits no shard; whether to place a rule there,
   with what meaning, is a decision this release does not take.

**Severity.** R1 to R5 are each `manual-review` obligations, and a failed review of any of them is
severity `error`. R2's reach is reviewed from the specified point of disclosure and the captures R5
requires, which are repository evidence; an owed disclosure missing from a captured path is an R2
violation. A repository cannot show that every person on every path received a disclosure, so a
clean review is a statement about the specified and captured paths and is not reported as proof of
receipt; receipt by a given person at run time is **not-evaluable** and is not claimed. R6
constrains this framework and has no validation type or project severity. These are the levels a
rule would carry if one is minted; this release emits no framework finding at them.

**Exemptibility.** R6 is not exemptible: no circumstance makes it reasonable for a scan to report an
effect from a presence. R1, R3 and R5 reach a system only where output or action reaches a person
outside the team. That is a scope condition, not a disposition: [Standard
2](02-ai-risk-tiering-and-applicability.md) R4's dispositions are recorded against catalog rules,
this standard has none, and the policy schema offers no declaration for it. A project whose system
lacks the subject records why in its own documents, and no detector in this release would contradict
a false record. No level here
is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each person-facing output kind has an owed-or-not decision with a reason | A system that emits generated messages in a person's name with no record of the question | A recorded "not owed — suggestion the user accepts or rejects in the act" must **not** be failed |
| R2 | The disclosure precedes interaction or reliance on the path a user takes; for a subject who does not interact, it is delivered no later than the decision or action concerning them | A notice shown only after the output is acted on, or a subject's disclosure owed and never delivered at or before the decision | A disclosure delivered at the first point of interaction, in whatever form the owner's standards allow, must **not** be failed for its form here |
| R3 | An AI-assisted decision about a person records whether they are told | A person denied a service with the operator informed and the person not, and no record of deciding | A decision recorded "not told, reason" with an authority behind it is a recorded decision, not a failure of this requirement |
| R4 | The project names the owner's standards its presentation evidence sits under, and does not offer this decision as that evidence | "Disclosure is in the footer" offered as showing it can be perceived, or a project that presents a disclosure and names no owner standard | A project that cites the owner's standards by name and does not restate them must **not** be flagged |
| R5 | Where a disclosure was presented or is owed, a capture of the shipped notice exists with a date and the decision has revisions | A decision unchanged across a new audience, or a disclosure owed and presented with no capture | A decision recorded "not owed" has no notice to capture and must **not** be failed for lacking one; a system whose notice never changed needs one capture, not one per release |
| R6 | No detector or report here outputs a disclosure verdict from presence | A detector that reported "discloses AI" because a notice string was found | Reporting that a notice string was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads a disclosure record, so no detector
checks R1 to R5; they are enforced by review or not at all, and R6 holds by construction. The
falsifiers in the table are observable by a reviewer reading the record or the running system: they
are manual, not absent. The negative controls state what review must not do to a project that has
the right subject and does the right thing.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to
except. A project that knowingly does not meet one records that in its own documents.

**What invalidates a decision or a capture.** Each of these is a different subject, and a record made
before the change describes the earlier system:

- a new audience, channel, region or language, since who is owed a disclosure depends on who is there;
- a new use of the output — one that was suggestion becomes sent in the person's name, or becomes an
  input to a decision about them;
- a change of model or prompt that changes how much the output is shaped by AI,;
- a change to the interface that moves or removes the disclosure;
- a change in the law that applies where the system operates, which this release does not detect.

**Staleness is asymmetric.** The decision is written once and the interface changes weekly: a redesign
removes a notice and nothing records that a decision depended on it. A capture from the previous
design describes the previous design.

**Contradicted by operation.** A person's report that they did not know AI was involved, in a case
where the record says they were told, contradicts the record until re-examined. Operational handling
is item 34's subject (AI Incident Response, unwritten in this release).

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes two words, "user disclosure", inside a bullet of four
subjects. It states no requirement, level or evidence. The item is class `D` because its subject token
is derived from the brief; the requirements are not derived. Specifically authored here, none of it
owner-approved:

- **R1 in full**: the requirement to decide and record, and the ruling that "not owed" with a reason is
  a legitimate record while an absent decision is not.
- **R2 in full**: that a disclosure owed precedes reliance, with a deadline tied to the decision for
a non-interacting subject, and nothing about where or how it appears.
  An earlier draft also placed a prohibition on denying AI involvement here; it is withdrawn and
  recorded under Relationship as item 53's, unanswered.
- **R3 in full**: the extension to a person who is the subject of an AI-assisted decision and is not a
  user.
- **R4**: that a decision is not evidence of presentation, and that this framework restates no
  presentation requirement.
- **R5**: the capture of what users saw, and revision on a change of audience, use or model.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in
  [Standard 25](25-grounding-and-hallucination-control.md).
- **The exclusions in Scope** (presentation, truthfulness, repository documentation, legal compliance)
  as division lines, unconfirmed by anyone.
- **The severity** in Validation (`error` for a failed review of R1 to R5) and the single validation
type assigned to each requirement; they are this repository's judgment.
- **The ruling that this standard ships with no catalog rules**, and its three reasons, including the
  decision to mint no id in the shared `disclosure` segment.
- **The recheck of one sibling file and three rule ids** at the sibling checkout's HEAD, which the
  boundary review did not make.

Not authored here: the posture `B`, the division of ownership with UIUXDesignStandards and its recorded
evidence are the boundary review's, and Standard 7's table is where the line was first drawn.

## Relationship to other standards and ADRs

**Item 53, Disclosure and Deception Prohibitions** is the negative face of this item's `user
disclosure` token: class `A`, authored, posture `O`, unwritten on this base. This standard says
whether a disclosure is owed and that it precedes reliance; whether and how a system may state or
imply that a person rather than an AI is the source is item 53's. The line is drawn here and is
provisional until item 53 is written; **it is recorded open, not decided**. Which of the two items
owns each deception case, and whether either is non-exemptible, needs an owner's ruling and is not
settled by this document.

[Standard 7](07-boundary-with-adjacent-standards.md) records that UIUXDesignStandards owns how a
disclosure is presented and this pack whether one is owed; R2 there (link, do not copy) is why R4
points and does not restate; no `disclosure.*` id is minted here (Standard 6 R5 reserves the
namespace, and Standard 7 R4 forbids only a colliding full id).

item 39 (Transparency and System Documentation, unwritten on this base) governs the document a reader of the
repository sees; this standard governs what a person using or affected by the system is told. They
are different readers and neither satisfies the other. Items 37 (Fairness and Harm Distribution) and
38 (Accessibility of AI Features) sit under the same bullet; item 38 concerns whether a person can
perceive and operate the feature, which includes the notice this standard asks for, and is the owner's
subject by deference. Items 25 (Grounding and Hallucination Control), 28 (Capability Honesty to Users)
and 34 (AI Incident Response) are named in Scope and are not restated.

[Standard 1](01-ai-system-manifest.md) declares models and prompts and no disclosure; none is
proposed. [Standard 13](13-personal-data-in-ai-systems.md) governs any personal data a capture of what
a user saw would contain. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern
applicability and non-lowering, and [Standard 6](06-standard-structure-and-rule-identity.md) R3
(each requirement carries a falsifier or is declared not-evaluable) is what the Tests section
answers.

Items 25, 28, 34, 37, 38 and 53 are not all written on this base; the lines drawn above are provisional
until they are, and the later standards may legitimately move them.

**Outside this pack.** UIUXDesignStandards' `26-ai-user-experience.md` and its three `ai-ux.*` rules are
named in Scope with what the boundary review and the recheck recorded. This is a deference, not a
crosswalk, and no maintainer of that pack has confirmed it. No ADR covers this standard —
`artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds by construction.**

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds by construction, not by assertion.** No detector, rule or report in `scripts/`, `rules/` or `ai-policy.yml` reports that a system discloses AI involvement. I found no test asserting the absence, so a future detector could break R6 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence that any project discloses anything |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1, R3 | A place for the decision record: a schema change, or a named document a rule can find | Both schemas are closed; a schema change is out of scope (plan 02 section 8) |
| R2, R5 | Captured interaction fixtures showing when a disclosure appears | Phase 3 detector and evidence-availability work; needs a running system |
| R4 | A reference check that evidence sits under the owner's standards | Meaningful only once a decision record is findable |
| R6 | A test asserting no detector emits a disclosure verdict | Meaningful only once a detector exists for it to constrain |
| Rule id | A reserved-namespace id and a shard, once an owner is decided and the shared `disclosure` segment is considered | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system discloses AI involvement,
or that a disclosure is adequate, timely or compliant, from the presence of a string, a label or a
policy page. R6 forecloses it: a string in a repository is not what a person was shown.
