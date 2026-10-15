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

Covers: that the accessibility obligations the owner states reach AI features; that a project knows
which of its surfaces are AI features; and the limit of what this framework says about any of it.

It does **not** cover, and claims none of the ground of:

- **What accessibility requires.** UIUXDesignStandards owns it: its accessibility standards
  (`03-accessibility-foundations.md`, `04-keyboard-and-focus.md`,
  `05-accessible-component-patterns-and-custom-controls.md`) and the nineteen `accessibility.*` rules
  the boundary review records. Nothing here restates a requirement, a threshold or a success criterion
  of those documents, and [Standard 7](07-boundary-with-adjacent-standards.md) R2 forbids it.
- **How a disclosure is presented.** Standard 7 records that UIUXDesignStandards owns presentation and
  this pack only whether a disclosure is owed. That is item 40.
- **Unequal outcomes between groups.** Whether the system's *result* differs for people, which can
  include people who use assistive technology, is item 37 (Fairness and Harm Distribution, unwritten on this base).
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
document of the owner's says because the question does not arise for them.

### R2 — Know which surfaces are AI features, and cover them in the accessibility record

**A project MUST be able to say which of its interface surfaces are produced or driven by an AI
feature, and its accessibility record under the owner's standards MUST include those surfaces by name
rather than being a statement about "the application" in general.**

An accessibility review of the shell of an application says nothing about a panel a model fills at run
time. Dynamic, generated or streamed content is where an audit of static pages most easily misses, and
the requirement is that the AI surfaces are on the list, not how they are tested. The surface list is
the project's own document; [Standard 1](01-ai-system-manifest.md)'s manifest has no field for it and
none is proposed.

### R3 — Do not cite the feature's own output as the evidence that it is accessible

**A project MUST NOT present text, descriptions, captions or summaries generated by an AI feature as
evidence that the feature, or the content it produces, meets an accessibility requirement, unless the
evidence the owner's standards require for that requirement exists independently of the generated
output.**

A model can be asked to write alternative text for an image it produced, or to describe its own
interface. That output is a claim made by the system under test. It is a candidate for review, in the
same way that [Standard 25](25-grounding-and-hallucination-control.md) treats a grounding statement
made by the system as a statement and not as a check.

### R4 — This framework MUST NOT mint an accessibility rule or report a feature accessible

**No rule, detector, audit finding or generated report in this framework MAY assert that an AI
feature is accessible, and no id in this catalog MAY define an accessibility requirement, because an
owner's rule exists, a component library is imported, or an accessibility statement is present in the
repository.**

This is a constraint on the framework, not on a project. It follows from posture `D`, from Standard 7
R2 (link, do not copy) and R4 (no id may shadow another pack's), and from the same reasoning as the
last requirement of [Standard 25](25-grounding-and-hallucination-control.md) and
item 37 (Fairness and Harm Distribution, unwritten on this base): a presence is not an effect.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| "Generated, so exempt" | The accessibility record excludes the assistant panel because a model fills it | R1 |
| Provider component assumed accessible | A vendor chat widget is embedded and never examined | R1 |
| Record of the shell only | A conformance statement for the application names no AI surface | R2 |
| Unknown surfaces | A project cannot list which screens a model drives | R2 |
| Self-attestation | "The assistant describes its own interface accessibly" offered as the evidence | R3 |
| Generated alt text accepted unreviewed | Descriptions produced by the model accepted as the conformance evidence for the images it produced | R3 |
| Framework-minted accessibility rule | A rule in this catalog restating or varying an owner's requirement | R4 |
| Presence read as accessible | A framework report of "accessible" because a library or a statement is present | R4 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The project's accessibility record under the owner's standards, covering the AI surfaces | The project's accessibility documentation and the owner's own evidence | Human review, by the owner's standards |
| R2 | The list of AI-driven surfaces and the record entries naming them | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R3 | The independent evidence the owner's standards require for the requirement claimed | The project's accessibility evidence | Human review |
| R4 | The absence of any accessibility rule or verdict of this framework's own | This repository's catalog, detectors and tests | Code review; see Implementation |

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
2. **R2 and R3 concern a project's documents and evidence, and no artifact exists for them.** Both
   schemas are closed, so no surface list or accessibility record has a conformant place to live.
   Adding one is a schema-versioning decision outside this slice (plan 02 section 8).
3. **No shard exists and none is proposed.** A rule for R2 or R3 would be a rule about a project's own
   record, not an accessibility requirement; whether one is wanted is not decided here.

**Severity.** R1 to R3 are `manual-review` obligations, carried out under the owner's standards. R4
constrains this framework and has no validation type.

**Exemptibility.** R4 is not exemptible: no circumstance makes it reasonable for this framework to
restate or vary the owner's requirement. R1 to R3 reach a system only where it presents an AI feature
through an interface; a system without one may declare the requirement not-applicable under
[Standard 2](02-ai-risk-tiering-and-applicability.md) R4 with a reason and a `revisitWhen`. No
detector in this release would contradict a false declaration. No level here is lowered by a risk tier
(Standard 2 R3). Whether an exception to the owner's own requirement is available is the owner's to
state, and this pack grants none.

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | The accessibility record includes an AI surface under the owner's standards | A record that excludes an AI surface because it is generated | A project with no AI-facing interface must **not** be failed for lacking a record |
| R2 | The AI surfaces are listed and appear by name in the record | A conformance statement that names no AI surface while the system has one | A static page that merely links to a model-written document must not be required to be listed as an AI surface |
| R3 | The independent evidence for each requirement claimed exists | The generated description of an image is the only evidence it has a text alternative | A generated text alternative that a reviewer then checked is cited with that review, and must **not** be flagged for having been model-written |
| R4 | No rule, detector or report here asserts accessibility or defines an accessibility requirement | A catalog rule restating an owner requirement, or a report of "accessible" from a statement's presence | Reporting that an accessibility statement or an owner rule was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads an accessibility record, and R4 holds by
construction. **A requirement with no falsifier is a requirement nobody can be shown to have broken**,
and that is the honest state of this standard.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R3 in this release, because no rule exists to
except. A project that knowingly does not meet one records that in its own documents.

**What invalidates a record.** An accessibility record of an AI surface describes the surface at one
revision:

- a change of model, prompt or the content the model produces for the surface, since the content is part
  of what is read, heard or operated;
- a new surface, channel or modality, including a voice or agent interaction not previously offered;
- a change of the component library or provider widget that renders it;
- a revision of the owner's standards a record was made against.

**Staleness is asymmetric here.** An interface that is generated changes without a release: the page is
unchanged and the content is new. A record made against last month's output describes last month's
system. Nothing in this release detects the transition.

**Contradicted by operation.** A reported barrier that a project judges well-founded invalidates the
record until re-examined. Operational handling is item 34's subject (AI Incident Response, unwritten
in this release).

## Additions this standard makes beyond the source

The brief contributes one word, "Accessibility", inside a bullet of four subjects. It states no
requirement, level or evidence. The item is class `D` because its subject token is the brief's own; the
requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1**: that an AI feature is inside the owner's obligations and that "generated" is not an exemption.
- **R2**: that AI surfaces be identifiable and named in the accessibility record.
- **R3**: that a feature's own output is not evidence of its accessibility.
- **R4**: the constraint on this framework, in the form of
  [Standard 25](25-grounding-and-hallucination-control.md) R6, with the additional prohibition on
  minting an accessibility requirement at all, which is posture `D` and Standard 7 R2 and R4 applied.
- **The exclusions in Scope** (what accessibility requires, disclosure presentation, outcome
  disparity, legal conformance) as division lines, unconfirmed by anyone.
- **The ruling that this standard ships with no catalog rules**, and the three reasons for it.
- **The recheck of the owner's rule ids** at the sibling checkout's HEAD, which the boundary review did
  not make.

Not authored here: the posture `D`, the owner and the nineteen rule ids are the boundary review's.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) records that UIUXDesignStandards owns
accessibility and the presentation of a disclosure; R2 there is the link-do-not-copy rule this standard
follows, and R4 there is why no id is minted.

item 37 (Fairness and Harm Distribution, unwritten on this base) governs unequal outcomes; this standard governs
whether the feature can be used. Items 39 (Transparency and System Documentation) and 40 (User
Disclosure of AI Involvement) are unwritten in this release and sit under the same bullet; the line is
provisional until they are.

[Standard 25](25-grounding-and-hallucination-control.md) is the source of R3's reasoning about the
system's statement about itself. [Standard 1](01-ai-system-manifest.md) declares no surface or
accessibility property and none is proposed. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3
and R4 govern applicability and non-lowering. [Standard 6](06-standard-structure-and-rule-identity.md)
R3 is the requirement the Validation section's no-rule record answers.

**Outside this pack.** UIUXDesignStandards' accessibility standards and rules are named in Scope with
what the boundary review recorded. This is a deference, not a crosswalk, and no maintainer of that pack
has confirmed it. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R3 is enforced; R4 holds by construction.**

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R4 | **Holds by construction, not by assertion.** No rule in `rules/` carries an accessibility id and no detector in `scripts/` reports an interface as accessible. No test asserts the absence, so a future rule could break R4 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1, R2 | A place for a surface list and a reference to the project's accessibility record | Both schemas are closed; a schema change is out of scope (plan 02 section 8) |
| R3 | A way to tell generated evidence from independent evidence | Reading intent from free text is a heuristic |
| R4 | A test that no catalog id defines an accessibility requirement | Meaningful only if a rule is ever proposed in the area |

**What no future release will implement.** An accessibility requirement minted in this catalog, or a
verdict that an AI feature is accessible from the presence of a statement, a library or an owner's
rule. Posture `D` and R4 foreclose it.
