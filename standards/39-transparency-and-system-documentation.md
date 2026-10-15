# Standard 39 — Transparency and System Documentation

A system that uses a model is described in two places, and they are routinely run together. The
**model** is described by a model card: what it was trained on, how it performs, where it fails. That
description travels with the model and is written by whoever made it. The **system** around the model
is something else: the instructions it is given, the tools it can call, the sources it retrieves from,
the points where a person must approve, and the people it reaches. No model card describes that,
because the model does not know it.

"The system is transparent" is a description of that gap, not a requirement: it names no document, no
reader and no observation that would show the claim false. A project is more often opaque by omission
than by intent — the knowledge stayed with the team that wrote the code.

Source: item 39 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "transparency" token of the "Accessibility, fairness, transparency, and user
disclosure" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 39 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **B**
> (baseline), recorded in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) with
> verdict `CONFIRMED`, and that review's substantive half is human judgment and carries
> `humanSignOff: null`. No maintainer of MachineLearningStandards has confirmed it.
>
> **The brief supplies one word and this standard supplies the rest.** The item is class `D` because
> its subject token is the brief's own; the requirements are this repository's judgment, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it.

Terms, defined once and used verbatim below:

- **System description** — a document contained in, or pointed to from, the repository that states: the
  system's purpose; the people it is for and the people it affects without using it; what it is
  explicitly not for; who answers for it; for each model, its role and the instructions that govern it
  with where they live; for each tool, its authority; each retrieval source; and each point at which a
  person must act before something happens, in code or in process.
- **Required fact** — any fact the system description is required to state.
- **Shared fact** — any fact both the system description and the manifest (`ai-system.yml`) state.
- **Model claim** — a statement in the system description of a model's capability, limitation,
  performance or training.
- **Change** — an addition, alteration, move or removal of a model, instruction, tool, retrieval source
  or approval point, a model identifier silently re-pointed behind an alias, a difference in who the
  system reaches, or a revision of documentation cited under R4.
- **Framework output** — what a detector, catalog rule, audit finding or generated report of this
  framework states.
- **Presence artifact** — a file, a copied template or a section heading.

It does **not** cover, and claims none of the ground of:

- **The model's own documentation** — model cards, limitations, segment performance and dataset cards
  are MachineLearningStandards' subject. This standard points at that documentation and does not
  restate it ([Standard 7](07-boundary-with-adjacent-standards.md) R2).
- **Item 40, User Disclosure of AI Involvement**: a document for a reader of the repository is not a
  disclosure to a user.
- **The manifest, its schema and its pinned identifiers**, which are
  [Standard 1](01-ai-system-manifest.md); and **items 37 and 38** (unwritten on this base).

**Boundary posture B — baseline, with a named half deferred.** The boundary review's owner entry reads
"MachineLearningStandards for model cards and limitations; AIStandards for system-level
documentation". Its reasoning is that ML 25 owns the model card outright while no ML standard documents
the system around the model, for which this pack cites ML's template (which the review refers to
without naming it) rather than copying it. Its one piece of evidence is MachineLearningStandards
`standards/25-model-limitations.md`, scope "Applies to every model whose output is used by anyone other
than its author", the subject being "a document that accompanies the model — a model card"; the review
records no rule ids for it, and Standard 7 lists "Model cards and dataset cards" as deferred entirely.
Nothing is claimed here about the sibling pack beyond that record (reviewed 2026-09-04).

## Requirements

### R1 — Have a system description

**A project MUST have a system description.**

It is the system-level counterpart of a model card and a different document. A system built on a
third-party model has no model card of its own to write and still has a system to describe. The
template this pack ships, `templates/AI-SYSTEM.md`, is one way to write it; no filename or heading is
fixed.

### R2 — Do not contradict the manifest

**The system description MUST NOT contradict the manifest on any shared fact.**

The manifest is the structured declaration and the narrative says what the structure cannot. Two
statements that disagree leave a reader unable to say which is current.

### R3 — State what is not known

**Each required fact that is not known MUST be stated as unknown, with who could establish it.**

An honest "unknown" is information; a missing section is not, because the reader cannot tell a gap from
an oversight. A fact the standard does not require is outside this clause.

### R4 — Point at model documentation; do not restate or invent

**Each model claim MUST be a reference to the model's documentation, by name and, where it carries one,
revision, or to the project's own observation record.**

A restatement in the project's own words is a fork, and it drifts when the original is revised. Where
no documentation exists the reference is to an observation record, and where neither exists there is
no model claim to make; "not published" is stated as an unknown under R3.

### R5 — Revise on change

**The system description MUST be revised on each change.**

The system around a model changes more often than the model does: a prompt edit, a new tool or a new
source alters the system without anyone filing a change to the document.

### R6 — This framework states no transparency verdict from a presence artifact

**No framework output MAY state that a system is transparent, that its documentation is adequate, or
that its description is accurate or current, because a presence artifact is present.**

This is a constraint on the framework, not on a project. A repository can show that a document exists
and has the headings of the template; it cannot show that the content is true, that a person answered
it, or that it describes the system as it now stands. A copied template is not documentation. The
scaffold marker in `templates/AI-SYSTEM.md` is a signal to the person who copies it; `scripts/scaffolding.mjs`
exports a Markdown-marker check, `hasScaffoldTextMarker`, but no detector in this release calls it on a
description, so this standard does not rely on it.

## Failure modes

| Requirement | Failure |
| --- | --- |
| R1 | The only description of what the system is for and what it must not do lives in a slide, a thread or one engineer's head, or in a document the repository neither contains nor points to |
| R2 | The system description states a shared fact differently from the manifest |
| R3 | A required fact the project did not know that is omitted, guessed, or stated as unknown with no one named who could establish it |
| R4 | A model claim that is not a reference to the model's documentation (by name and, where it carries one, revision) or to the project's own observation record |
| R5 | A change occurred and the system description was not revised |
| R6 | A framework output states a system transparent, its documentation adequate, or its description accurate or current because a presence artifact is present |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The system description | A project document the project names; **no manifest or policy field points to it** | Human review |
| R2 | The system description read against `ai-system.yml` | The description and the manifest | Human review |
| R3 | The unknown-fact entries, each with who could establish it | The description | Human review |
| R4 | Each model claim's reference: the cited model documentation by name and revision, or the observation record | The description, the cited documentation, the observation record | Human review |
| R5 | The description's revision history against the change records, including provider documentation where the change is outside the repository | Version control and the project's records | Human review |
| R6 | The absence of any framework output of the kind R6 forbids | This repository's catalog, detectors, reports and tests | Code review |

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
[Plan 02 section 6](../artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md) requires every
standard to cite at least one rule or record in its Validation section why it ships with none; this is
that record.

1. **There is no artifact a rule could read.** Neither schema has a place to point at a system
   description, and both are closed; adding a field is a schema-versioning decision outside this slice
   (plan 02 section 8 excludes risk-tier fields on the same ground).
2. **R2 to R5 concern the truth of a document, not its existence.** A heading check would test for a
   presence artifact, which R6 forbids this framework to report as a result.
3. **No shard or namespace has been decided for it.** This standard mints no id and edits no shard.

**Validation type and severity.**

| Requirement | Validation type | Severity |
| --- | --- | --- |
| R1 | `manual-review` | `error` |
| R2 | `manual-review` | `error` |
| R3 | `manual-review` | `error` |
| R4 | `manual-review` | `error` |
| R5 | `manual-review` | `error` |
| R6 | none (a constraint on the framework) | none |

These are the levels a rule would carry if one is minted; this release emits no framework finding at
them.

**Exemptibility.** R6 is not exemptible. R1 to R5 apply to every system within this pack's scope; a
repository with no AI system is outside this standard, not exempted from it. No policy declaration
exists for them: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4's dispositions are recorded
against catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2
R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | A system description exists, in or pointed to from the repository | None exists, or it is only in a slide, a thread or a head, or the repository neither contains nor points to it | A short document, including a README passage, that is a system description is not failed for brevity or form |
| R2 | No shared fact differs between the description and the manifest | Any shared fact that differs | A fact the manifest does not state is not a shared fact |
| R3 | Each required fact the project did not know is stated as unknown with who could establish it | A required fact the project did not know that is omitted, guessed, or stated as unknown with no one named | "Unknown — the vendor does not say; ask the account owner" is complete |
| R4 | Each model claim is a reference to the model's documentation or to the project's observation record, as R4 states | A model claim that is not such a reference, or documentation that carries a revision cited without it | A reference that names provider documentation and its revision, with nothing copied, is not flagged |
| R5 | Each change has a matching revision of the system description | A change with no revision since | A difference that is not a change as defined in Scope needs no revision |
| R6 | No framework output states a system transparent, its documentation adequate, or its description accurate or current because a presence artifact is present | A framework output that did so because a presence artifact was found | Reporting that a system description was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads a system description, so no detector
checks R1 to R5; they are held by review, and R6 holds today because no such framework output exists.
The falsifiers are manual, not absent.

## Exceptions and staleness

There is no policy-level exception mechanism in this release, because no rule exists to except.

| Requirement | Invalidated by |
| --- | --- |
| R1 | A change |
| R2 | A change |
| R3 | A change |
| R4 | A change, including a revision of cited documentation |
| R5 | A change |
| R6 | Nothing: it constrains this repository |

An incident in which the system did something its description said it could not invalidates the
description until it is re-examined. The code changes in review and the description does not: nobody's
pull request fails for leaving a document behind. Nothing in this release detects the transition. Incident handling is item 34's subject
(AI Incident Response, unwritten in this release).

## Additions this standard makes beyond the source

The brief contributes one word, "transparency", inside a bullet of four subjects. It states no
requirement, level or evidence. Specifically authored here, none of it owner-approved:

- **Every defined term and R1 to R6**, including that the system, as distinct from the model, has a
  description; that unknowns are stated, not omitted; and that model claims are references.
- **The severity and validation types** in Validation.
- **The exclusions in Scope** as division lines, unconfirmed by anyone.
- **The ruling that this standard ships with no catalog rules**, and the invalidation table.

Not authored here: posture `B`, the split of ownership between the two packs and the recorded evidence
are the boundary review's.

## Relationship to other standards and ADRs

[Standard 1](01-ai-system-manifest.md) is the structured declaration this description accompanies, and
R2 depends on it. [Standard 7](07-boundary-with-adjacent-standards.md) R2 (link, do not copy) is why R4
points and does not restate. [Standard 11](11-autonomy-levels-and-delegated-authority.md) and
[Standard 45](45-approval-gates.md) govern authority and approval; the system description only names
them. [Standard 25](25-grounding-and-hallucination-control.md) is the closest sibling in form.
[Standard 2](02-ai-risk-tiering-and-applicability.md) R3 governs non-lowering, and
[Standard 6](06-standard-structure-and-rule-identity.md) R3 (each requirement carries a falsifier or is
declared not-evaluable) is what the Tests section answers.

Items 34, 37, 38 and 40 are unwritten on this base; the lines drawn above are provisional until they
are. **Outside this pack:** MachineLearningStandards' `25-model-limitations.md` is named in Scope with
what the boundary review recorded; this is a deference, not a crosswalk, and no maintainer has
confirmed it. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds today because no such framework output exists.**

| Requirement | State |
| --- | --- |
| R1 (aid only) | `templates/AI-SYSTEM.md` is a narrative template with questions on purpose, users, ownership, models and their roles, prompts and where they live, tools, and data (it asks to name each source). Its nearest approval-point question is "What can the system do without a human acting?", it prompts nothing for R4, and it asks nothing about revising the description on change (it does ask who answers for the system and where instructions live). It is an aid, not a check that a description exists |
| R6 | No framework output in `scripts/`, `rules/` or `ai-policy.yml` states a system transparent or documented, and no detector calls the scaffold-marker check on a Markdown description. No test asserts the absence |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test |

**Proposed, and deliberately absent. None of the following exists:** a manifest or policy field that
points at the description (a schema change); a comparison of the description with the manifest and the
code, which reads free text for coverage and is a heuristic; and a test that no framework output states
a transparency verdict from a presence artifact.

**What no future release will implement.** A framework output that states a system transparent, or its
documentation adequate, from a presence artifact. R6 forecloses it.
