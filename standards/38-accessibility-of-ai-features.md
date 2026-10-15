# Standard 38 — Accessibility of AI Features

Accessibility has an owner in this portfolio, and it is not this pack. UIUXDesignStandards governs
whether an interface can be perceived, operated and understood by people who use it differently, and
it has nineteen rules and three dedicated standards for it. What it does not say, because it is not its
subject, is that an *AI feature* is an interface like any other. A chat pane, a streamed answer, a
voice surface, a generated summary and an agent that acts on a page are all places where a project can
believe accessibility was handled because the feature is new, generated, or built on a component
nobody wrote.

This standard exists to record one obligation and to name the owner of the rest. It restates none of
the owner's requirements, mints no rule, and adds no detector.

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
> **The brief supplies one word and this standard supplies the obligation.** The brief's bullet names
> "Accessibility" and says nothing about what an AI system must do about it. The item is class `D`
> because its subject token is the brief's own; the requirements below are this repository's judgment,
> and the [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it
that presents an AI feature to people through an interface: a conversational surface, generated or
streamed content, a voice or multimodal channel, or an agent acting on a user's behalf in an interface
they use.

Covers: that the accessibility obligations the owner states reach AI features, and the limit of what this framework says about any of it.

It does **not** cover, and claims none of the ground of:

- **What accessibility requires.** UIUXDesignStandards owns it: its accessibility standards
  (`03-accessibility-foundations.md`, `04-keyboard-and-focus.md`,
  `05-accessible-component-patterns-and-custom-controls.md`) and the nineteen `accessibility.*` rules
  the boundary review records. Nothing here restates a requirement, a threshold or a success criterion
  of those documents, and [Standard 7](07-boundary-with-adjacent-standards.md) R2 forbids it.
- **How a disclosure is presented.** Standard 7 records that UIUXDesignStandards owns presentation and
  this pack only whether a disclosure is owed. That is item 40.
- **Unequal outcomes between groups.** Whether the system's *result* differs for people, which can
  include people who use assistive technology, is item 37 (Fairness and Harm Distribution, unwritten
on this base).
  Whether a person can *use* the feature is this item and its owner.
- **Legal conformance.** Whether a feature meets a legal accessibility obligation is a legal question
  this standard does not answer.

**Boundary posture D — deferred.** The boundary review's reasoning is that this pack MUST NOT mint an
accessibility rule, and that the item exists to record the obligation and name the owner. The evidence
it records is nineteen rule ids across the three standards above. They were rechecked against
UIUXDesignStandards `7bff2e9` (the sibling checkout's HEAD on 2026-10-14, read through git objects):
the set of `accessibility.*` ids in its `rules/` is identical to the nineteen recorded. That is a
recheck of one set, not a refresh of the foreign-namespace inventory.

## Requirements

### R1 — Treat an AI feature's interface as inside the owner's accessibility obligations

**A project with an AI feature that presents an interface to people MUST apply to that interface the
accessibility requirements of UIUXDesignStandards, and MUST NOT treat the feature as outside them
because its content is generated, its surface is conversational or voice-based, or its components were
supplied by a model provider or a library.**

The requirement points; it does not reproduce. What the owner's standards ask is theirs, and a project
reads them there. This standard's only addition is that "it is AI" is not an exemption, which no
document of the owner's says because the question does not arise for them. It is a statement of
reach, not an accessibility control: it adds nothing the owner requires and removes nothing.

### R2 — This framework MUST NOT mint an accessibility rule or report a feature accessible

**No rule, detector, audit finding or generated report in this framework MAY assert that an AI
feature is accessible, and no id in this catalog MAY define an accessibility requirement, because an
owner's rule exists, a component library is imported, or an accessibility statement is present in the
repository.**

This is a constraint on the framework, not on a project. It follows from posture `D`, from Standard 7
R2 (link, do not copy) and R4 (no id may shadow another pack's), and from the same reasoning as the
last requirement of [Standard 25](25-grounding-and-hallucination-control.md) and
item 37 (Fairness and Harm Distribution, unwritten on this base): a presence is not an effect.

### Candidate additions, recorded open and not required here

Two things were drafted as requirements and withdrawn, because a local control for accessibility
would be a second authority beside the owner ([Standard 7](07-boundary-with-adjacent-standards.md) R2,
posture `D`). They are recorded as observations for the owner of the subject to take or leave, not as
obligations of this pack:

- that an accessibility record under the owner's standards name the AI-driven surfaces rather than
  speak of "the application" in general, since a review of the shell says nothing about a panel a model
  fills at run time;
- that text, descriptions or captions generated by the feature are not cited as the evidence that the
  feature meets an accessibility requirement unless the evidence the owner requires exists
  independently of them.

Whether UIUXDesignStandards wants either is its maintainer's decision. Nothing in this repository
asserts that it does, and neither is a requirement of this standard.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| "Generated, so exempt" | The accessibility record excludes the assistant panel because a model fills it | R1 |
| Provider component assumed accessible | A vendor chat widget is embedded and never examined | R1 |
| Conversational surface assumed out of scope | A voice or chat surface is treated as not an interface | R1 |
| Framework-minted accessibility rule | A rule in this catalog restating or varying an owner's requirement | R2 |
| Presence read as accessible | A framework report of "accessible" because a library or a statement is present | R2 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The project's accessibility record under the owner's standards, covering its AI-facing interfaces | The project's accessibility documentation and the owner's own evidence | Human review, by the owner's standards |
| R2 | The absence of any accessibility rule or verdict of this framework's own | This repository's catalog, detectors and tests | Code review; see Implementation |

Whether an accessibility requirement is *met* is the owner's evidence, established under the owner's
standards. This pack holds no evidence of it and does not duplicate any.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release, and posture `D` means it is not
expected to gain an accessibility rule.** [Standard 6](06-standard-structure-and-rule-identity.md) R3
requires every standard to cite at least one rule or record why it does not; this is that record.

Three reasons, stated so a reader can disagree with any one of them:

1. **The owner governs the subject.** Posture `D` is defined as: another pack owns it, this pack names
   the owner and mints no rule. The nineteen owner rules exist; a rule here would be a second source for
   the same requirement, which Standard 7 R2 calls a fork.
2. **R1 concerns a project's own record under the owner's standards.** No artifact exists in this
   pack's closed schemas for it, and the owner's evidence is the owner's to read. Adding a field is a
   schema-versioning decision outside this slice (plan 02 section 8).
3. **No shard exists and none is proposed.** A rule for R1 would be a rule about reach, not an
   accessibility requirement; whether one is wanted is not decided here.

**Severity.** R1 is a `manual-review` obligation under the owner's standards, and a failed review is
severity `error`. R2 constrains this framework and has no validation type or project severity. These
are the levels a rule would carry if one is minted; this release emits no framework finding at them.

**Exemptibility.** R2 is not exemptible: no circumstance makes it reasonable for this framework to
restate or vary the owner's requirement. R1 reaches a system only where it presents an AI feature
through an interface. That is a scope condition, not a disposition: [Standard
2](02-ai-risk-tiering-and-applicability.md) R4's dispositions are recorded against catalog rules,
this standard has none, and the policy schema offers no declaration for it. A project whose system
lacks the subject records why in its own documents, and no detector in this release would contradict
a false record. No level here is lowered by a risk tier (Standard 2 R3). Whether an exception to the
owner's own requirement is available is the owner's to state, and this pack grants none.

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | The accessibility record under the owner's standards includes the AI-facing interface | A record that excludes an AI-facing interface because it is generated, conversational or provider-supplied | A project with no AI-facing interface must **not** be failed for lacking a record |
| R2 | No rule, detector or report here asserts accessibility or defines an accessibility requirement | A catalog rule restating an owner requirement, or a report of "accessible" from a statement's presence | Reporting that an accessibility statement or an owner rule was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads an accessibility record, so no detector
checks R1; it is enforced by review or not at all, and R2 holds by construction. The falsifiers in the
table are observable by a reviewer reading the record: they are manual, not absent. The negative
controls state what review must not do to a project that has the right subject and does the right
thing.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 in this release, because no rule exists to
except. A project that knowingly does not meet it records that in its own documents.

**What invalidates a record.** An accessibility record of an AI-facing interface describes the
interface at one revision, and a material change to the system or to the basis of the assessment makes
it stale:

- a change of model or prompt that changes what kind of content the surface produces or how it is
  structured, as opposed to ordinary variation between responses;
- a new surface, channel or modality, including a voice or agent interaction not previously offered;
- a change of the component library or provider widget that renders it;
- a revision of the owner's standards a record was made against.

**Staleness is asymmetric here.** An interface that is generated can change without a release. Ordinary
response-to-response variation is not a change of the system, and does not by itself invalidate a
record; whether the record's assessment still holds for what the surface now produces is the owner's
method to say, for instance by ongoing sampling, and this standard specifies none. Nothing in this
release detects the transition.

**Contradicted by operation.** A reported barrier that a project judges well-founded invalidates the
record until re-examined. Operational handling is item 34's subject (AI Incident Response, unwritten
in this release).

## Additions this standard makes beyond the source

The brief contributes one word, "Accessibility", inside a bullet of four subjects. It states no
requirement, level or evidence. The item is class `D` because its subject token is the brief's own; the
requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1**: that an AI feature is inside the owner's obligations and that "generated" is not an
  exemption. It is a statement of reach and adds no control.
- **R2**: the constraint on this framework, in the form of
  [Standard 25](25-grounding-and-hallucination-control.md) R6, with the additional prohibition on
  minting an accessibility requirement at all, which is posture `D` and Standard 7 R2 and R4 applied.
- **The severity** in Validation (`error` for a failed R1 review), the level a rule would carry.
- **The exclusions in Scope** (what accessibility requires, disclosure presentation, outcome
  disparity, legal conformance) as division lines, unconfirmed by anyone.
- **The ruling that this standard ships with no catalog rules**, and the three reasons for it.
- **The two withdrawn candidate additions**, recorded under Requirements as open observations, and
  the choice not to make them requirements.
- **The recheck of the owner's rule ids** at the sibling checkout's HEAD, which the boundary review did
  not make.

Not authored here: the posture `D`, the owner and the nineteen rule ids are the boundary review's.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) records that UIUXDesignStandards owns
accessibility and the presentation of a disclosure; R2 there is the link-do-not-copy rule this standard
follows, and R4 there is why no id is minted.

Item 37 (Fairness and Harm Distribution, unwritten on this base) governs unequal outcomes; this
standard governs whether the feature can be used. Items 39 (Transparency and System Documentation) and
40 (User Disclosure of AI Involvement) are unwritten in this release and sit under the same bullet; the
line is provisional until they are.

[Standard 25](25-grounding-and-hallucination-control.md) is the source of R2's form.
[Standard 1](01-ai-system-manifest.md) declares no surface or accessibility property and none is
proposed. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern applicability and
non-lowering. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the
Validation section's no-rule record answers.

**Outside this pack.** UIUXDesignStandards' accessibility standards and rules are named in Scope with
what the boundary review recorded. This is a deference, not a crosswalk, and no maintainer of that pack
has confirmed it. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 is enforced; R2 holds by construction.**

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R2 | **Holds by construction, not by assertion.** No rule in `rules/` carries an accessibility id and no detector in `scripts/` reports an interface as accessible. No test asserts the absence, so a future rule could break R2 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 | A place to reference the project's accessibility record | Both schemas are closed; a schema change is out of scope (plan 02 section 8) |
| R2 | A test that no catalog id defines an accessibility requirement | Meaningful only if a rule is ever proposed in the area |

**What no future release will implement.** An accessibility requirement minted in this catalog, or a
verdict that an AI feature is accessible from the presence of a statement, a library or an owner's
rule. Posture `D` and R2 foreclose it.
