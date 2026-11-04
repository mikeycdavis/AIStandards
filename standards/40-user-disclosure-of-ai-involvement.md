# Standard 40 — User Disclosure of AI Involvement

A person who reads a reply, receives a decision or talks to a voice usually cannot tell what produced
it. Whether a model wrote the text, ranked the candidates, drafted the message a human then sent, or
chose which case reaches a reviewer is invisible from the receiving end, and it often matters to what
they do next.

Two questions are routinely run together. **Whether** a person is owed a disclosure that AI was
involved is a decision about the system and its users. **How** it is shown is a question about an
interface. This standard owns the
first; the second belongs to another pack and nothing here restates it. The failure it is written
against is the system whose team never decided: no one recorded whether a disclosure was owed, so none
was made.

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
> **The brief supplies two words and this standard supplies the rest.** The item is class `D` because
> its subject token is the brief's own; the requirements are this repository's judgment, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it
whose output or action reaches or concerns a person who is not part of the team that built it.

Terms, defined once and used verbatim below:

- **Disclosure decision** — for each kind of output or action that reaches such a person (including a person concerned by a decision or action who never interacts with the system): whether that person is owed a
  disclosure that AI produced or materially shaped it, to whom, and the reason. Notice to the operator
  is not notice to the person concerned.
- **Disclosure deadline** — for a person who interacts with or relies on the output, no later than that
  interaction or reliance; for a person concerned by a decision or action who does not interact, no
  later than the earlier of the point at which the decision or action is taken and the point at which it
  is communicated; for a person an output concerns without any decision, action or delivery to them, no later than the point at which the output is produced or first used; for any other person to whom output is delivered or who is exposed to the output or action, no later than that delivery or exposure.
- **Disclosure capture** — a dated copy of what was presented, in the form users received it, with the point in the interaction or delivery at which it was presented.
- **Disclosure verdict** — a statement that a system discloses AI involvement, that a disclosure is
  adequate or timely, or that the system complies with a disclosure obligation.
- **Listed change** — a change of model, prompt, use of the output, audience (including a channel,
  region or language), the interface that presents the disclosure, or the law that applies.
- **Framework output** — what a detector, catalog rule, audit finding or generated report of this
  framework states.
- **Presence artifact** — a notice string, a label, a policy page or a declaration.

**Provisionally not covered, recorded open.** A system asserting that a person, not an AI, produced or
is producing its output is, on this standard's provisional reading, the case item 53 would address. The
specification lists item 53 as "Disclosure and Deception Prohibitions", class `A`, derived from the same `user disclosure`
token and unwritten on this base. Provisionally it is item 53's; the division is recorded open (see
Relationship), and nothing here states, restates or pre-empts such a prohibition.

It does **not** cover, and claims none of the ground of:

- **How a disclosure is presented**, including its accessibility, which [Standard 7](07-boundary-with-adjacent-standards.md) records as UIUXDesignStandards' and records this pack as owning only *whether* disclosure is owed, and the marking of generated content, which the boundary review records as that pack's R1.
- **Whether a statement is true** (item 25) and **what the system says about its capabilities** (item 28).
- **Documentation for a reader of the repository**, which is item 39.
- **What the law requires**, a legal question this standard does not answer.

**Boundary posture B — baseline, with a named half deferred.** The boundary review changed the posture
from `O` because owning the item outright contradicted this pack's own Standard 7: the review's owner entry reads "AIStandards for whether disclosure is owed; UIUXDesignStandards for how it is presented". Its
evidence is `standards/26-ai-user-experience.md` in UIUXDesignStandards, with rules
`ai-ux.no-generated-as-verified`, `ai-ux.ai-failure-states` and `ai-ux.proposal-vs-execution`, and its
lede and R1 as the review records them (reviewed 2026-09-04). Nothing is claimed here about the sibling
pack beyond that record.

## Requirements

### R1 — Have a disclosure decision

**A project MUST have a disclosure decision for each kind of output or action that reaches or concerns a person outside the team.**

"Not owed" is a legitimate answer, recorded with its reason: an autocomplete suggestion the person
accepts or rejects in the act is a different case from a generated reply sent in a person's name. What
is not legitimate is the absence of a decision, because then the answer is whatever the interface
happened to do. It is a document, not a manifest field.

### R2 — Meet the deadline

**A disclosure that is owed MUST reach the person by the disclosure deadline.**

Timing is a property of the decision, not of presentation: a notice shown after the person has acted
is a record of an omission. Where in the interface it appears, and how it is made
perceivable, is not decided here; Standard 7 assigns presentation to UIUXDesignStandards. Whether and how a system
may state its own nature is provisionally item 53's subject, recorded open.

### R3 — Keep a current capture

**Where a disclosure was presented, the project MUST have a disclosure capture, and on each listed
change MUST replace it or record it as re-confirmed, with its date.**

Without the shipped text and where it appeared, a later review cannot tell whether it was shown, and a
change to the interface can remove it without anyone changing the decision. A decision recorded "not
owed" has no notice to capture.

### R4 — Keep the record current

**On each listed change the disclosure decision MUST be revised, or recorded as re-examined and
affirmed, with its date.**

### R5 — This framework states no disclosure verdict from a presence artifact

**No framework output MAY state a disclosure verdict because a presence artifact is present.**

This is a constraint on the framework, not on a project. A repository can show that a string such as
"generated by AI" exists; it cannot show that the string is rendered, on which path, to whom or before
what.

## Failure modes

| Requirement | Failure |
| --- | --- |
| R1 | No disclosure decision exists, or the disclosure decision records notice to the operator as notice to the person concerned |
| R2 | A disclosure that is owed reaches the person after the disclosure deadline |
| R3 | A disclosure was presented and there is no disclosure capture, or the capture predates a listed change and was neither replaced nor re-confirmed |
| R4 | A listed change occurred and the disclosure decision was neither revised nor recorded as re-examined and affirmed |
| R5 | A framework output states a disclosure verdict because a presence artifact is present |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The disclosure decision | A project document the project names; **no manifest or policy field exists for it** | Human review |
| R2 | The point at which the disclosure appears relative to the disclosure deadline, from the specified point, the disclosure captures and, for a person who does not interact, a sample of what is sent or delivered | The project's interface, its disclosure captures and its operations records | Human review |
| R3 | The disclosure capture, with its re-confirmation or replacement dates | Version control and the project's records | Human review |
| R4 | The dated revision or re-examination records of the disclosure decision | Version control and the project's records | Human review |
| R5 | The absence of any framework output that states a disclosure verdict from a presence artifact | The catalog, detectors, rules and reports of this framework, and their tests | Code review |

A document establishes that the project wrote a decision down; only a capture of what a person saw
shows it. That a given person received a disclosure at run time is not-evaluable from a repository and
is not claimed.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
[Plan 02 section 6](../artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md) requires every
standard to cite at least one rule or record in its Validation section why it ships with none; this is
that record.

1. **There is no artifact a rule could read.** Both schemas are closed and have no place for a
   disclosure decision; adding one is a schema-versioning decision outside this slice (plan 02
   section 8).
2. **R2, R3 and R4 concern what a person saw, not what a file says.** A detector reading source would
   test for a presence artifact, which R5 forbids this framework to report as a result.
3. **No id is minted and the namespace is crowded.** `disclosure` is a reserved segment of this pack
   that FinancialStandards also uses (`SHARED_SEGMENTS` in `scripts/catalog.mjs`; seven ids per
   Standard 7 R4). Whether to place a rule there, with what meaning, is not decided here.

**Validation type and severity.**

| Requirement | Validation type | Severity |
| --- | --- | --- |
| R1 | `manual-review` | `error` |
| R2 | `manual-review` | `error` |
| R3 | `manual-review` | `error` |
| R4 | `manual-review` | `error` |
| R5 | none (a constraint on the framework) | none |

R2's reach is reviewed from the specified point of disclosure and the disclosure captures R3 requires,
which are repository evidence; an owed disclosure missing from a captured path is an R2 violation. A clean review
is a statement about those paths and is not proof of receipt. These are the levels a rule would carry
if one is minted; this release emits no framework finding at them.

**Exemptibility.** R5 is not exemptible. Each other requirement arises only on its condition: R1 where
output or action reaches a person outside the team (the condition in Scope); R2 where a disclosure is
owed; R3 where a disclosure was presented; R4 wherever R1 applies. Where a condition does not
hold the requirement does not arise. That is a scope condition, not a disposition:
[Standard 2](02-ai-risk-tiering-and-applicability.md) R4's dispositions are recorded against catalog
rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each such kind of output or action has a disclosure decision | Output or action that reaches a person outside the team with no disclosure decision, or a disclosure decision that treats notice to the operator as notice to the person concerned | A disclosure decision "not owed — suggestion the user accepts or rejects in the act" is a disclosure decision |
| R2 | A disclosure capture, or the sample R2's evidence names for a person who does not interact, shows the disclosure presented no later than the disclosure deadline | The presented point falls after the disclosure deadline, none is shown on the reviewed path, or the notice was specified but never presented | A disclosure at the first point of interaction, in whatever form, is not failed for its form here |
| R3 | Each presented disclosure has a disclosure capture, replaced or re-confirmed on each listed change | A presented disclosure with no disclosure capture, or one neither replaced nor re-confirmed after a listed change | A project that presents no disclosure has nothing to capture |
| R4 | After each listed change the disclosure decision is revised or dated as re-examined and affirmed | A listed change with neither | A change outside the listed changes needs no entry |
| R5 | No framework output states a disclosure verdict because a presence artifact is present | A framework output that did so because a presence artifact was found | Reporting that a presence artifact was *found*, as an observation with no disclosure verdict, is not a disclosure verdict |

**No falsifier is automated in this release.** No rule reads a disclosure decision, so no detector
checks R1 to R4; they are held by review, and R5 holds today because no such framework output exists.
The falsifiers are manual, not absent.

## Exceptions and staleness

There is no policy-level exception mechanism in this release, because no rule exists to except.

| Requirement | Invalidated by |
| --- | --- |
| R1 | A listed change |
| R2 | A listed change, or a revision of the disclosure decision |
| R3 | A listed change, or a revision of the disclosure decision |
| R4 | A listed change |
| R5 | Nothing: it constrains this repository |

A person's report that they did not know AI was involved, in a case where the record says they were
told, contradicts the record until it is re-examined. The decision is written once and the interface
changes weekly: a redesign removes a notice and nothing
records that a decision depended on it. A change in the law is not detected by this release. Incident
handling is item 34's subject (AI Incident Response, unwritten in this release).

## Additions this standard makes beyond the source

The brief contributes two words, "user disclosure", inside a bullet of four subjects. It states no
requirement, level or evidence. Specifically authored here, none of it owner-approved:

- **Every defined term and R1 to R4**, including that "not owed" with a reason is a legitimate decision
  while an absent decision is not; the deadline for non-interacting and passive recipients; that notice
  to the operator is not notice to the person; that an unshown disclosure is not demonstrated; and the
  listed changes.
- **The severity and validation types** in Validation.
- **The exclusions in Scope** as division lines, unconfirmed by anyone.
- **The provisional division of the deception case with item 53**, recorded open and owner-unconfirmed.
- **The ruling that this standard ships with no catalog rules**, the decision to mint no id in the
  shared `disclosure` segment, and the invalidation table.

Not authored here: posture `B`, the division of ownership with UIUXDesignStandards and its recorded
evidence are the boundary review's, and Standard 7's table is where the line was first drawn.

## Relationship to other standards and ADRs

**Item 53, Disclosure and Deception Prohibitions** is listed by the specification as derived from the same `user disclosure` token: class `A`, authored, posture `O`, unwritten on this base. This
standard says whether a disclosure is owed and when it must arrive; whether and how a system may state
or imply that a person rather than an AI is the source is provisionally item 53's. The line is
provisional until item 53 is written; **it is recorded open, not decided**. Which of the two items owns
each deception case, and whether either is non-exemptible, needs an owner's ruling and is not settled
by this document.

[Standard 7](07-boundary-with-adjacent-standards.md) records that UIUXDesignStandards owns how a
disclosure is presented and this pack whether one is owed; R2 there (link, do not copy) is why presentation is not restated here, and no `disclosure.*` id is minted here (Standard 6 R5 reserves the
namespace, and Standard 7 R4 forbids only a colliding full id). Item 39 is Transparency and System Documentation
per the specification and is unwritten on this base. [Standard 13](13-personal-data-in-ai-systems.md) governs
any personal data a capture would contain. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3
governs non-lowering, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 (each requirement
carries a falsifier or is declared not-evaluable) is what the Tests section answers.

Items 25, 28, 34 and 53 are named in Scope or here and are not restated. **Outside this pack:**
UIUXDesignStandards' `26-ai-user-experience.md` is named in Scope with what the boundary review
recorded; this is a deference, not a crosswalk, and no maintainer has confirmed it. UIUXDesignStandards'
R8 (anthropomorphism) is crosswalked to item 28 in the boundary review and is not cited as precedent.
No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R4 is enforced; R5 holds today because no such framework output exists.**

| Requirement | State |
| --- | --- |
| R1 to R4 | Not enforced; held by review |
| R5 | No detector, rule or report in `scripts/`, `rules/`, `test/` or `templates/` states a disclosure verdict. No test asserts the absence |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test |

**Proposed, and deliberately absent. None of the following exists:** a place for the disclosure decision
(a schema change); captured interaction fixtures showing when a disclosure appears (Phase 3 detector
work, needing a running system); and a test that no framework output states a disclosure verdict from a
presence artifact.

**What no future release will implement.** A framework output that states a system discloses AI
involvement, or that a disclosure is adequate, timely or compliant, from a presence artifact. R5
forecloses it.
