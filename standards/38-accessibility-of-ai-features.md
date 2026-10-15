# Standard 38 — Accessibility of AI Features

Accessibility has an owner in this portfolio, and it is not this pack. UIUXDesignStandards governs
whether an interface can be perceived, operated and understood by people who use it differently, and
it has, as recorded on 2026-09-04, nineteen rules and three dedicated standards for it. This
standard is about *AI features* as interfaces: a chat pane, a streamed answer, a
voice surface, a generated summary and an agent that acts on a page are all places where a project can
believe accessibility was handled because the feature is new, generated, or built on a component
nobody wrote.

This standard records that reach and names the owner of the rest. It restates none of the owner's
requirements, creates no accessibility control of its own, mints no rule, and adds no detector.

Source: item 38 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "Accessibility" token of the "Accessibility, fairness, transparency, and user
disclosure" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 38 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **D**
> (deferred), recorded in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) with
> verdict `CONFIRMED` and owner UIUXDesignStandards, and that review's substantive half is human
> judgment and carries `humanSignOff: null`. No maintainer of UIUXDesignStandards has confirmed it.
>
> **The brief supplies one word and this standard supplies the rest.** The brief's bullet names
> "Accessibility" and says nothing about what an AI system must do about it. The item is class `D`
> because its subject token is the brief's own; what is written below is this repository's judgment,
> and the [Additions](#additions-this-standard-makes-beyond-the-source) section lists it.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it
that presents an AI feature to people through an interface: a conversational surface, generated or
streamed content, a voice or multimodal channel, or an agent acting on a user's behalf in an interface
they use.

**Reach.** The accessibility requirements of UIUXDesignStandards apply to an AI feature's interface as
they do to any other. That its content is generated, its surface is conversational or voice-based, or
its components were supplied by a model provider or a library is not an exemption. This is a statement
of where the owner's requirements reach, not an obligation of this pack and not an accessibility
control: it adds nothing the owner requires and removes nothing.

It does **not** cover, and claims none of the ground of:

- **What accessibility requires.** UIUXDesignStandards owns it: its accessibility standards
  (`03-accessibility-foundations.md`, `04-keyboard-and-focus.md`,
  `05-accessible-component-patterns-and-custom-controls.md`) and the nineteen `accessibility.*` rules
  the boundary review records. Nothing here restates a requirement, a threshold or a success criterion
  of those documents, and [Standard 7](07-boundary-with-adjacent-standards.md) R2 forbids it.
- **How a disclosure is presented.** Standard 7 records that UIUXDesignStandards owns presentation and
  this pack only whether a disclosure is owed. That is item 40.
- **Unequal outcomes between groups.** Whether the system's *result* differs for people is item 37
  (Fairness and Harm Distribution, unwritten on this base). Whether a person can *use* the feature
  is the owner's.
- **How long accessibility evidence remains valid, what is a barrier, and what an exception is.** Each
  is the owner's to state.
- **Legal conformance.** Whether a feature meets a legal accessibility obligation is a legal question
  this standard does not answer.

**Boundary posture D — deferred.** The boundary review's reasoning is that this pack MUST NOT mint an
accessibility rule, and that the item exists to record the obligation and name the owner. The evidence
it records is nineteen rule ids across the three standards above, as the boundary review and
`artifacts/foreign-namespace-inventory.json` record them (reviewed 2026-09-04). Nothing is claimed
here about the sibling pack beyond what the boundary review recorded on 2026-09-04, and the Reach
statement, which is authored here and unconfirmed.

## Requirements

### R1 — This framework MUST NOT mint an accessibility rule or report a feature accessible

**No id in this catalog MAY define an accessibility requirement. No rule, detector, audit finding or
generated report in this framework MAY assert that an AI feature is accessible, whether from the
presence of an owner's rule, a component library or an accessibility statement, from an imported
owner result, or from any other basis; the accessibility verdict is the owner's.**

This is a constraint on the framework, not on a project. It follows from posture `D`, from Standard 7
R2 (link, do not copy), from Standard 6 R5 (a namespace this pack does not reserve is refused at
catalog load), and from the same reasoning as the last requirement of
[Standard 25](25-grounding-and-hallucination-control.md): a presence is not an effect.

There is no project requirement in this standard (see Additions).
## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Framework-minted accessibility rule | A rule in this catalog restating or varying an owner's requirement | R1 |
| Presence read as accessible | A framework report of "accessible" because a library or a statement is present | R1 |

Failures of a project to meet the owner's requirements, including treating a generated or
conversational interface as out of scope, are the owner's failure modes and are not listed here.

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The absence of any accessibility rule or verdict of this framework's own | This repository's catalog, detectors and tests | Code review; see Implementation |

Whether an accessibility requirement is *met* is the owner's evidence, established under the owner's
standards. This pack holds none and duplicates none.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release, and posture `D` means it is not
expected to gain an accessibility rule.** [Plan 02 section
6](../artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md)
requires every standard to cite at least one rule or record in its Validation section why it ships
with none; this is that record.

Three reasons, stated so a reader can disagree with any one of them:

1. **The owner governs the subject.** Posture `D` is defined as: another pack owns it, this pack names
   the owner and mints no rule. The nineteen owner rules exist; a rule here would be a second source for
   the same requirement, which Standard 7 R2 calls a fork.
2. **Nothing in this pack reads an accessibility record.** Both schemas are closed, and the owner's
   evidence is the owner's to read. Adding a field is a schema-versioning decision outside this slice
   (plan 02 section 8 states the same exclusion for risk-tier fields).
3. **No shard exists and none is proposed.** Whether any rule is wanted for reach is not decided here.

**Validation type and severity.** R1 constrains this framework. Because this standard has no rule it
has no catalog validation type; R1 is held by code review of this repository, and it carries no
project severity. Neither the reach statement nor the owner's requirements are given a framework
severity, so that this framework does not create a second pass or fail beside the owner's.

**Exemptibility.** R1 is not exemptible: no circumstance makes it reasonable for this framework to
restate or vary the owner's requirement. This standard defines no project exception mechanism and no
recording duty; what an exception to the owner's requirements is, is the owner's to state. This
standard defines no level for a risk tier to lower ([Standard
2](02-ai-risk-tiering-and-applicability.md) R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | No rule, detector or report here asserts accessibility or defines an accessibility requirement | A catalog rule restating an owner requirement, or a report of "accessible" from a statement's presence | Reporting that an accessibility statement or an owner rule was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads an accessibility record, and R1 holds
because no such detector or rule exists. This standard defines no test, falsifier or negative control
for the owner's requirements; those are the owner's.

## Exceptions and staleness

This standard defines no exception mechanism and no invalidating event. What re-examination stale
accessibility evidence needs, and how a reported barrier is handled, is the owner's to state;
nothing here detects staleness. Operational
handling of incidents is item 34's subject (AI Incident Response, unwritten in this release).

## Additions this standard makes beyond the source

The brief contributes one word, "Accessibility", inside a bullet of four subjects. It states no
requirement, level or evidence. The item is class `D` because its subject token is the brief's own.
Specifically authored here, none of it owner-approved:

- **The Reach statement**: that an AI feature is inside the owner's obligations and that "generated"
  is not an exemption. It adds no control.
- **R1**: the constraint on this framework, in the form of
  [Standard 25](25-grounding-and-hallucination-control.md) R6, with the additional prohibition on
  minting an accessibility requirement at all, which is posture `D`, Standard 7 R2 and Standard 6 R5
  applied.
- **The exclusions in Scope** (what accessibility requires, disclosure presentation, outcome
  disparity, evidence validity and exceptions, legal conformance) as division lines, unconfirmed by
  anyone.
- **The ruling that this standard ships with no catalog rules and no project requirement**, and the
  three reasons for it.
- **Two withdrawn drafts**, recorded as open observations for the owner and not as requirements:
that an accessibility record name the AI-driven surfaces rather than speak of "the application", and
that text generated by the feature not be cited as evidence of its own accessibility. Whether
UIUXDesignStandards wants either is its maintainer's decision, and nothing in this repository
asserts that it does.

Not authored here: the posture `D`, the owner and the nineteen rule ids are the boundary review's.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) records that UIUXDesignStandards owns
accessibility and the presentation of a disclosure; R2 there is the link-do-not-copy rule this standard
follows.

Item 37 (Fairness and Harm Distribution, unwritten on this base) governs unequal outcomes; this
standard concerns reach into the owner's accessibility requirements. Items 39 (Transparency and System
Documentation) and 40 (User Disclosure of AI Involvement) are unwritten in this release and sit under
the same bullet; the line is provisional until they are.

[Standard 25](25-grounding-and-hallucination-control.md) is the source of R1's form.
[Standard 1](01-ai-system-manifest.md) declares no accessibility property and none is proposed.
[Standard 2](02-ai-risk-tiering-and-applicability.md) R3 governs non-lowering.
[Standard 6](06-standard-structure-and-rule-identity.md) R3 (each requirement carries a falsifier or is
declared not-evaluable) is what the Tests section answers.

**Outside this pack.** UIUXDesignStandards' accessibility standards and rules are named in Scope with
what the boundary review recorded. This is a deference, not a crosswalk, and no maintainer of that pack
has confirmed it. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. R1 holds because no such rule or detector exists; nothing else here is enforced.**

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R1 | No rule in `rules/` carries an accessibility id and no detector in `scripts/` reports an interface as accessible. An `accessibility.*` id is refused at catalog load (`NAMESPACES` in `scripts/catalog.mjs`: unreserved namespace), and no test uses an `accessibility.*` id (the general refusal is asserted in `test/catalog.test.mjs` with a placeholder namespace); a requirement placed in a namespace this pack does reserve (for example `fairness.*` or `disclosure.*`) is not detected, and no test asserts it |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 | A test that no id in a reserved namespace defines an accessibility requirement | Whether a reserved-namespace id restates an owner requirement is a judgment a test cannot make without a list of owner requirements, and carrying one would be this framework supplying the owner's judgment, against posture `D` |

**What no future release will implement.** An accessibility requirement minted in this catalog, or a
verdict that an AI feature is accessible from the presence of a statement, a library or an owner's
rule. Posture `D` and R1 foreclose it.
