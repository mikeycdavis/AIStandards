# Standard 39 — Transparency and System Documentation

A system that uses a model is described in two places, and they are routinely run together. The
**model** is described by a model card: what it was trained on, how it performs, where it fails.
That description travels with the model and is written by whoever made it. The **system** around the
model is something else: the instructions it is given, the tools it can call, the sources it
retrieves from, the points where a person must approve, and the people it reaches. No model card
describes that, because the model does not know it, and the people who built the system are usually
the only ones who do.

"The system is transparent" is a description of the second gap, and it is not a requirement: it names
no document, no reader, and no observation that would show the claim false. A project is more often
opaque by omission than by intent — the knowledge simply stayed with the team that wrote the code.

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
> **The brief supplies one word and this standard supplies the rest.** The brief's bullet names
> "transparency" and says nothing about what a system must document. The item is class `D` because its
> subject token is the brief's own; the requirements below are this repository's judgment about that
> subject, and the [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it
— a repository that invokes a model, retrieves context for one, or acts on a model's output.

Covers: a written description of the system as a whole, aimed at a reader who was not on the team —
its purpose, who it reaches, what it is not for, which models it invokes and in what role, the
instructions, tools, retrieval sources and approval points around them, and what is not known — and
that the description is kept consistent with the manifest and current with the system.

It does **not** cover, and claims none of the ground of:

- **The model's own documentation.** Model cards, limitations, segment-level performance and dataset
  cards are MachineLearningStandards' subject (below). This standard asks a project to point at that
  documentation where it exists, and does not restate it.
- **Item 40, User Disclosure of AI Involvement** — what a person interacting with the system is told.
  A document for a reader of the repository is not a disclosure to a user, and neither satisfies the
  other.
- **How the structured declaration is validated.** The manifest, its schema and its pinned model
  identifiers are [Standard 1](01-ai-system-manifest.md). This standard governs the narrative that
  accompanies it.
- **Unequal outcomes and accessibility**, which are items 37 and 38.

**Boundary posture B — baseline, with a named half deferred.** The boundary review's owner entry
reads "MachineLearningStandards for model cards and limitations; AIStandards for system-level
documentation", and its reasoning is that ML 25 owns the model card outright while no ML standard
documents the system around the model, for which this pack cites ML's template rather than copying it.
It records one piece of evidence:

- **MachineLearningStandards, `standards/25-model-limitations.md`** — scope: "Applies to every model
  whose output is used by anyone other than its author", the subject being "a document that
  accompanies the model — a model card or an equivalent". The review records no rule ids for it.
  [Standard 7](07-boundary-with-adjacent-standards.md) lists "Model cards and dataset cards" as
  deferred entirely, citing the templates and copying neither.

That file and a `templates/MODEL-CARD.md` exist at MachineLearningStandards `af4120f` (the sibling
checkout's HEAD on 2026-10-14, branch `design/publication-state-correction`, read through git objects),
and the scope text is the same. This is a recheck of one file, not a refresh of the inventory, and
the sibling's own state is not a claim about its release.

## Requirements

### R1 — Describe the system around the model in a document a stranger can find

**A project MUST maintain a written description of the system that states its purpose, the people it
is for and the people it affects without using it, and what it is explicitly not for, in a document
discoverable from the repository, and MUST NOT leave that description to exist only in the heads of
the team, a chat thread or a slide.**

This is the system-level counterpart of a model card, and it is a different document. A system
built on a third-party model has no model card of its own to write and still has a system to describe.
The narrative template this pack ships, `templates/AI-SYSTEM.md`, is one way to answer these
questions; this standard fixes no filename or heading, because the requirement is on the content and
its findability, not on the form.

### R2 — Cover what the model does not know about the system

**The description MUST state, for the system as built, the role each model plays, the instructions
that govern it and where they live, the tools it can invoke and the authority each carries, the
sources it retrieves from, and the points at which a person must act before something happens.**

These are the properties no model card can supply, and they are the ones a reviewer, an auditor or an
incident responder needs first. Authority and approval points are governed in their own right
([Standard 11](11-autonomy-levels-and-delegated-authority.md), [Standard 45](45-approval-gates.md));
this requirement is only that the description says what they are, so that a reader does not have to
reconstruct them from code.

### R3 — Do not copy or invent the model's documentation; point at it

**Where a model's own documentation exists, the system description MUST reference it by name and
revision and MUST NOT restate its limitations, performance or training claims in the project's own
words; where it does not exist, the description MUST say so and MUST NOT supply capabilities or
limitations the project has not established.**

A restatement is a fork, and it drifts the moment the original is revised ([Standard
7](07-boundary-with-adjacent-standards.md)
R2). For a model the project trained, the owner's model card (MachineLearningStandards 25) is where
limitations live. For a third-party model, the project records which provider documentation it
relied on and at which revision, and records "not published" where nothing is. A capability the
project has not observed and the provider has not documented is not written down as fact.

### R4 — Keep it consistent with the manifest, and say "unknown" where it is

**The description MUST NOT contradict the system's manifest on the models, tools and data sources it
declares, and where a fact is not known the description MUST say that it is unknown and who could
establish it, rather than omitting the question or guessing.**

The manifest is the structured declaration and the narrative says what the structure cannot. Two
statements about the same system that disagree leave a reader unable to say which is current. An honest
"unknown" is information; a missing section is not — the reader cannot tell a gap from an oversight.

### R5 — Name an owner, and revise the description when the system changes

**The description MUST name who answers for it, and MUST be revised when a model, an instruction, a
tool, a retrieval source or an approval point it describes is changed.**

A description with no owner has no one whose job it is to change it, and the system around a model
changes more often than the model does: a prompt edit, a new tool or a new source alters the system
without anyone filing a change to the document.

### R6 — This framework MUST NOT report a system transparent or documented from the presence of a document

**No detector, rule, audit finding or generated report in this framework MAY state that a system is
transparent, that its documentation is adequate, or that its description is accurate or current,
because a file of that kind is present, because a template has been copied, or because a section
heading exists.**

This is a constraint on the framework, not on a project. A repository can show that a document exists
and has the headings of the template. It cannot show that the content is true, that it was answered
by a person, or that it describes the system as it now stands. **A template carrying the scaffold
marker is not documentation**: `scripts/scaffolding.mjs` and the scaffold
comment exist so that a copied template is not read as an answer. Reporting a pass from the presence of
a document would turn the existence of a file into a statement about a system.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Knowledge in heads | The only description of what the system is for and what it must not do lives with one engineer | R1 |
| Model card mistaken for system description | A provider's card is the only documentation, and nothing says which tools or sources the system adds | R1, R2 |
| Hidden authority | Tools and approval points exist and the description names none | R2 |
| Retrieval unnamed | A system answers from sources the description never lists | R2 |
| Restated limitations | The project's own paraphrase of a model card, drifted from the original | R3 |
| Invented capability | A capability stated as fact that nobody observed and no provider documented | R3 |
| Description contradicts manifest | The document names one model and the manifest another | R4 |
| Guess in place of unknown | A plausible answer written where the team did not know | R4 |
| Orphaned document | No owner; the prompt changed twice since it was written | R5 |
| Scaffold read as answer | A copied template, unanswered, counted as the description | R1, R6 |
| Presence read as transparency | A framework report of "documented" because a file exists | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The system description, discoverable from the repository | A project document the project names — **no manifest or policy field points to it; see Implementation** | Human review |
| R2 | The roles, instructions, tools, sources and approval points stated in it, checked against the code that carries them | The description and the project's code and configuration | Human review |
| R3 | The reference to the model documentation by name and revision, or the statement that none exists | The description | Human review |
| R4 | The description read against the manifest, and any recorded unknowns | The description and `ai-system.yml` | Human review |
| R5 | A named owner and a revision history that follows system changes | The description and version control | Human review |
| R6 | The absence of any detector that reports transparency from presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R5 is a human-authored record. A document establishes that the project wrote
something down and says nothing about whether it is true; the reviewer reads what is claimed against
the code that would carry it out.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
[Standard 6](06-standard-structure-and-rule-identity.md) R3 requires every standard to cite at least
one rule or record why it does not; this is that record.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** Neither `schemas/ai-system-manifest.schema.json` nor
   `schemas/ai-policy.schema.json` has a place to point at a system description, and both are closed. A
   rule failing every project for omitting what no schema accepts would measure this framework's own
   incompleteness. Adding a field is a schema-versioning decision, outside this slice (plan 02
   section 8).
2. **R2 to R5 concern the truth of a document, not its existence.** A detector can see a file and its
   headings. A heading check would be testing for the presence of a document, which R6 forbids this
   framework from reporting as a result — and the owner's own heading detector for a model card is
   explicitly a structural check, not an adequacy one.
3. **No shard or namespace has been decided for it.** This standard mints no id and edits no shard.
   Whether any of its requirements belongs in a rule at all, and in which reserved namespace, is not
   decided here.

**Severity.** R1 to R5 are `manual-review` obligations in this release. R6 constrains this framework
and has no validation type.

**No severity is assigned to R1 to R5 in this release.** A severity belongs to a rule's finding, and
no rule exists here to produce one. A failed manual review is a finding for the reviewer, made under
the standards the project and its owner apply, not a framework finding; if a rule is later minted
for any of these requirements its severity is decided then and recorded in its shard.

**Exemptibility.** R6 is not exemptible: no circumstance makes it reasonable for a scan to report an
effect from a presence. R1 to R5 reach a system only where it has a system to describe. That is a
scope condition, not a disposition: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4's
dispositions are recorded against catalog rules, this standard has none, and the policy schema
offers no declaration for it. A project whose system lacks the subject records why in its own
documents, and no detector in this release would contradict a false record. No level here is lowered
by a risk tier
(Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | A document states purpose, users, affected non-users and exclusions | The description exists only in a slide, a thread or someone's head, or is a document that omits any of the four | A short document, including a README passage, that answers all four and is findable must **not** be failed for brevity or form |
| R2 | Each model, tool, source and approval point in the code appears in the description | A tool callable in code that the description never mentions | A system with no tools or retrieval, said to have none, must not be failed for the empty sections |
| R3 | The model documentation is referenced by name and revision, or "none" is recorded | A paraphrase of a model card's limitations in the project's words | A reference that names a provider document and its revision, with nothing copied, must **not** be flagged |
| R4 | No contradiction with the manifest; unknowns carry an owner | A model named in one place and a different one in the other | A section reading "unknown — the vendor does not say; ask the account owner" must **not** be treated as missing |
| R5 | An owner is named and a recent system change has a matching revision | A prompt changed twice since the description was last edited | A change with no effect on anything the description states needs no revision |
| R6 | No detector or report here outputs a transparency verdict from presence | A detector that reported "documented" because a file was found | Reporting that a system description was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads a system description, so no detector
checks R1 to R5; they are enforced by review or not at all, and the last requirement holds by
construction. The falsifiers in the table are observable by a reviewer reading the record or the
running system: they are manual, not absent. The negative controls state what review must not do to
a project that has the right subject and does the right thing.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to
except. A project that knowingly does not meet one records that in its own documents.

**What invalidates the description.** Each of these changes a subject the document states, and a
description written before the change describes the earlier system:

- a change of model identifier, or a model silently updated behind an alias
  ([Standard 1](01-ai-system-manifest.md) R4);
- a change to the instructions or prompts, or to where they live;
- a tool added, removed or given different authority;
- a retrieval source added, replaced or re-indexed;
- an approval point moved or removed, or a change in who the system reaches;
- a revision of the model documentation the description cites.

**Staleness is asymmetric.** The code changes in review and the description does not: nobody's pull
request fails for leaving a document behind. A description of last quarter's tools is wrong in a way
that looks exactly like a correct one. Nothing in this release detects the transition.

**Contradicted by operation.** An incident in which the system did something its description said it
could not invalidates the description until re-examined. Operational handling is item 34's subject (AI
Incident Response, unwritten in this release).

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one word, "transparency", inside a bullet of four
subjects. It states no requirement, level or evidence. The item is class `D` because its subject token
is derived from the brief; the requirements are not derived. Specifically authored here, none of it
owner-approved:

- **R1 in full**: that the system, as distinct from the model, has a written description, and the
  requirement that it be findable.
- **R2 in full**: the list of what the description must cover (roles, instructions, tools and
  authority, retrieval sources, approval points).
- **R3**: that model documentation is referenced and not restated, and that capabilities are not
  invented. It applies Standard 7 R2 to this subject; the deference to MachineLearningStandards is the
  boundary review's.
- **R4**: the consistency requirement with the manifest and the "unknown, and who could establish it"
  discipline.
- **R5**: the owner and revision requirement.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in
  [Standard 25](25-grounding-and-hallucination-control.md), together with the statement that a copied
  scaffold is not documentation.
- **The exclusions in Scope** (model documentation, item 40, validation of the manifest, items 37 and
  38) as division lines, unconfirmed by anyone.
- **The ruling that this standard ships with no catalog rules**, and its three reasons.
- **The recheck of one sibling file** at the sibling checkout's HEAD, which the boundary review did not
  make.

Not authored here: the posture `B`, the split of ownership between the two packs and the recorded
evidence are the boundary review's.

## Relationship to other standards and ADRs

[Standard 1](01-ai-system-manifest.md) is the structured declaration this description accompanies, and
R4 depends on it. [Standard 7](07-boundary-with-adjacent-standards.md) R2 (link, do not copy) is the
reason R3 points at the model documentation and does not restate it, and its table lists model cards
as deferred entirely.

[Standard 11](11-autonomy-levels-and-delegated-authority.md) and
[Standard 45](45-approval-gates.md) govern authority and approval; R2 asks only that the description
name them. [Standard 13](13-personal-data-in-ai-systems.md) governs the personal data a description
might otherwise carry: describing a data source does not license copying records into the document.
[Standard 25](25-grounding-and-hallucination-control.md) is the closest sibling in form.
[Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern applicability and non-lowering,
and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Validation
section's no-rule record answers.

Items 34 (AI Incident Response), 37 (Fairness and Harm Distribution), 38 (Accessibility of AI
Features) and 40 (User Disclosure of AI Involvement) are unwritten on this base; the lines drawn above
are provisional until they are.

**Outside this pack.** MachineLearningStandards' `25-model-limitations.md` and its model-card template
are named in Scope with what the boundary review and the recheck recorded. This is a deference, not a
crosswalk, and no maintainer of that pack has confirmed it. No ADR covers this standard —
`artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds by construction.**

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R1 to R2 (aid only) | `templates/AI-SYSTEM.md` is a narrative template with questions on purpose, users, models, prompts, tools, data and ownership, and carries the scaffold marker. It is an aid to writing the description, not a check that one exists |
| R6 | **Holds by construction, not by assertion.** No detector, rule or report in `scripts/`, `rules/` or `ai-policy.yml` reports a system transparent or documented. The scaffold marker is what makes an unanswered template count for nothing. I found no test asserting the absence, so a future detector could break R6 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 | A manifest or policy field that points at the description, so a rule can find it | Both schemas are closed; a schema change is out of scope (plan 02 section 8) |
| R2, R4 | A comparison of the description with the manifest and the code | Reading free text for coverage is a heuristic; a false positive teaches a project to write whatever passes |
| R3 | A check that a model reference names a revision | Meaningful only once R1's pointer exists |
| R5 | A check that a system change touched the description | Needs a notion of which change matters, which is a judgment |
| R6 | A test asserting no detector emits a transparency verdict | Meaningful only once a detector exists for it to constrain |
| Rule id | A reserved-namespace id and a shard, once an owner is decided | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system transparent, or its
documentation adequate, from the presence of a file, a heading or a copied template. R6 forecloses it:
a document's existence is not a statement about the system it describes.
