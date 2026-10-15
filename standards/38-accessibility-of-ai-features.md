# Standard 38 — Accessibility of AI Features

Accessibility has an owner in this portfolio, and it is not this pack. UIUXDesignStandards governs
whether an interface can be perceived, operated and understood by people who use it differently; as
recorded by the boundary review on 2026-09-04 it has nineteen rules across three dedicated standards.
This standard is about AI features as interfaces: a chat pane, a streamed answer, a voice surface, a
generated summary, an agent that acts on a page.

It records where the owner's requirements reach and names the owner of the rest. It creates no
accessibility control of its own, mints no rule, and adds no detector.

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
> **The brief supplies one word and this standard supplies the rest.** The item is class `D` because
> its subject token is the brief's own; what is written here is this repository's judgment, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists it.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it
that presents an AI feature to people through an interface.

Terms, defined once and used verbatim below:

- **Framework output** — what a detector, catalog rule, audit finding or generated report of this
  framework states.
- **Accessibility verdict** — a statement that an AI feature is, or is not, accessible or conformant to accessibility requirements, whatever its basis: the presence of an owner's rule, a component library or an accessibility statement, an imported owner result, or anything else.
- **Accessibility definition** — a catalog id that defines an accessibility requirement.

**Reach.** This standard does not decide whether a generated, conversational, voice-based or
provider-supplied AI feature is inside or outside the owner's accessibility requirements; the owner's
requirements and exceptions apply to such an interface as the owner states. This is a statement of
where this standard stops, not an obligation of this pack and not an accessibility control.

It does **not** cover, and claims none of the ground of:

- **What accessibility requires**, its evidence, how long evidence remains valid, what a barrier or an
  exception is: the owner's. Nothing here restates a requirement of the owner's documents, and
  [Standard 7](07-boundary-with-adjacent-standards.md) R2 forbids it.
- **How a disclosure is presented**, which Standard 7 records as UIUXDesignStandards' and which is
  item 40.
- **Unequal outcomes between groups**, which is item 37 (unwritten on this base).
- **Legal conformance**, a legal question this standard does not answer.

**Boundary posture D — deferred.** The boundary review's reasoning is that this pack MUST NOT mint an
accessibility rule and that the item exists to record the obligation and name the owner. Its evidence
is nineteen rule ids across `03-accessibility-foundations.md`, `04-keyboard-and-focus.md` and
`05-accessible-component-patterns-and-custom-controls.md`, as the review and
`artifacts/foreign-namespace-inventory.json` record them (reviewed 2026-09-04). Nothing is claimed here
about the sibling pack beyond that record and the Reach statement, which is authored here and
unconfirmed.

## Requirements

### R1 — This framework defines no accessibility requirement and issues no accessibility verdict

**No accessibility definition MAY exist in this catalog, and no framework output MAY state an
accessibility verdict.**

This is a constraint on the framework, not on a project, and there is no project requirement in this
standard. It follows from posture `D`, from Standard 7 R2 (link, do not copy), and from Standard 6 R5
(a namespace this pack does not reserve is refused at catalog load); the presence-based part follows
the reasoning of [Standard 25](25-grounding-and-hallucination-control.md) R6: a presence is not an
effect.

## Failure modes

| Requirement | Failure |
| --- | --- |
| R1 | An accessibility definition exists in this catalog, or a framework output states an accessibility verdict |

Failures of a project to meet the owner's requirements, including treating a generated or
conversational interface as out of scope, are the owner's failure modes and are not listed here.

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The absence of any accessibility definition or accessibility verdict in this framework | This repository's catalog, detectors, reports and tests | Code review |

Whether an accessibility requirement is *met* is the owner's evidence. This pack holds none.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release, and posture `D` means it is not
expected to gain an accessibility rule.**
[Plan 02 section 6](../artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md) requires every
standard to cite at least one rule or record in its Validation section why it ships with none; this is
that record.

1. **The owner governs the subject.** A rule here would be a second source for the owner's requirement,
   which Standard 7 R2 calls a fork.
2. **Nothing in this pack reads an accessibility record.** The manifest and policy schemas are closed;
   adding a field is a schema-versioning decision outside this slice (plan 02 section 8 states the same
   exclusion for risk-tier fields).
3. **No shard exists and none is proposed.**

**Validation type and severity.** R1 constrains this framework: an accessibility definition or an
accessibility verdict is a defect of this repository, held by code review, and it carries no catalog
validation type and no project severity. No framework severity is given to the owner's requirements,
so that this framework does not create a second pass or fail beside the owner's.

**Exemptibility.** R1 is not exemptible. This standard defines no project exception mechanism and no
recording duty; what an exception to the owner's requirements is, is the owner's to state. This
standard defines no level for a risk tier to lower ([Standard 2](02-ai-risk-tiering-and-applicability.md)
R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | No accessibility definition exists in the catalog and no framework output states an accessibility verdict | An accessibility definition, or a framework output that states an accessibility verdict | Reporting that an accessibility statement or an owner rule was *found*, as an observation with no accessibility verdict, is not an accessibility verdict |

**No falsifier is automated in this release.** R1 holds today because no such rule or detector exists.
This standard defines no test, falsifier or negative control for the owner's requirements.

## Exceptions and staleness

This standard defines no exception mechanism and no invalidating event. R1 constrains this repository:
an accessibility definition or accessibility verdict is invalidated by nothing, because it is never
valid. How long accessibility evidence remains valid, and how a reported
barrier is handled, is the owner's to state; incident handling is item 34's subject (AI Incident
Response, unwritten in this release).

## Additions this standard makes beyond the source

The brief contributes one word, "Accessibility", inside a bullet of four subjects. It states no
requirement, level or evidence. Specifically authored here, none of it owner-approved:

- **The Reach statement**, which adds no control and decides nothing.
- **R1 and the three defined terms**, in the form of Standard 25 R6, with the additional prohibition on
  an accessibility definition, which is posture `D`, Standard 7 R2 and Standard 6 R5 applied.
- **The exclusions in Scope** as division lines, unconfirmed by anyone.
- **The ruling that this standard ships with no catalog rules and no project requirement.**
- **Two withdrawn drafts**, recorded as open observations for the owner and not as requirements: that
  an accessibility record name the AI-driven surfaces rather than speak of "the application", and that
  text generated by the feature not be cited as evidence of its own accessibility. Whether
  UIUXDesignStandards wants either is its maintainer's decision.

Not authored here: posture `D`, the owner and the nineteen rule ids are the boundary review's.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) records that UIUXDesignStandards owns
accessibility and the presentation of a disclosure. [Standard 25](25-grounding-and-hallucination-control.md)
is the source of R1's form. [Standard 6](06-standard-structure-and-rule-identity.md) R3 (each requirement
carries a falsifier or is declared not-evaluable) is what the Tests section answers.
[Standard 1](01-ai-system-manifest.md) declares no accessibility property and none is proposed.

Items 34, 37, 39 and 40 are unwritten in this release; the lines drawn above are provisional until they
are. **Outside this pack:** UIUXDesignStandards' standards are named in Scope with what the boundary
review recorded; this is a deference, not a crosswalk, and no maintainer has confirmed it. No ADR covers
this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. R1 holds today because no such rule or detector exists; nothing else here is enforced.**

| Requirement | State |
| --- | --- |
| R1 | No rule in `rules/` carries an accessibility id and no detector in `scripts/` states an AI feature accessible. An `accessibility.*` id is refused at catalog load (`NAMESPACES` in `scripts/catalog.mjs`: unreserved namespace); no test uses an `accessibility.*` id, and the general refusal is asserted in `test/catalog.test.mjs` with a placeholder namespace. A requirement placed in a namespace this pack does reserve (for example `fairness.*` or `disclosure.*`) is not detected, and no test asserts it |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test |

**Proposed, and deliberately absent. None of the following exists:** a test that no id in a reserved
namespace is an accessibility definition. Whether a reserved-namespace id restates an owner
requirement is a judgment a test cannot make without a list of owner requirements, and carrying one
would be this framework supplying the owner's judgment, against posture `D`.

**What no future release will implement.** An accessibility definition in this catalog, or a framework
output that states an accessibility verdict. Posture `D` and R1 foreclose it.
