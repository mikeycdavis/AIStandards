# Standard 27 — Citation and Source Attribution

A citation is a promise made to a reader: *this is where it came from, and you can go and look.* A
language model will write one whether or not the promise is true. It can produce a plausible title,
author and address for a source it never saw, and it can attach a real source to a sentence that the
source does not contain. "The system cites its sources" is a description of a feature, not a
requirement: it names no output, no source the citation must be traceable to and no observation that
would show the promise broken.

Three things are routinely run together. Whether the output **needed** a citation is a decision about
the kind of output. Whether the citation **names a source the system actually used** is a fact about
one response and the inputs recorded for it. Whether that source **supports the claim** is a
grounding question, owned elsewhere. A system with a citation field, a citation instruction in its
prompt or a citation component in its interface is often reported as attributing its sources because
that field exists.

Source: item 27 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "citation" token of the "Hallucination, uncertainty, citation, and capability
honesty" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 27 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **B**
> (baseline), recorded in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) with
> verdict `CHANGED` (the plan had it as `O`), and that review's substantive half is human judgment and
> carries `humanSignOff: null`. No maintainer of UIUXDesignStandards has confirmed it.
>
> **The brief supplies one word and this standard supplies the rest.** The item is class `D` because
> its subject token is the brief's own; the requirements are this repository's judgment, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it
whose output presents, or is relied on as presenting, a statement drawn from a source.

Terms, defined once and used verbatim below:

- **Source** — a document, record, passage, dataset row, tool result or user-supplied item that an
  output draws on, as distinct from the model's training.
- **Citation** — a reference, shown to a reader or carried in the system's data, that names a source
  for an output or a part of one.
- **Response inputs** — the sources a response was actually produced with: what was retrieved, what a
  tool returned and what the user supplied for that response, as the system recorded them.
- **Locator** — what identifies the cited material within a source (a section, page, record key,
  passage offset or timestamp), together with the source's stable identifier.
- **Framework output** — what a detector, catalog rule, audit finding or generated report of this
  framework states, or any other message, score or status it emits.
- **Presence artifact** — a citation field or component, a prompt instruction to cite, a template,
  a heading, or a manifest or policy field or other pointer.

It does **not** cover, and claims none of the ground of:

- **Whether a cited source supports the claim**, and whether the output is anchored to its basis.
  That is [Standard 25](25-grounding-and-hallucination-control.md) (R1 the basis, R3 the check). A
  citation to a real, used source can still be attached to a sentence the source does not support;
  that is a grounding failure, not an attribution one, and it is not restated here.
- **Whether a generated identifier resolves before it is acted on or shown as real.** That is
  Standard 25 R4. A citation the model wrote is a generated referent in that standard's sense, and
  R4 there applies to it as to any other. This standard adds what R4 does not ask: that the source
  was one the response used (R2 below).
- **How a citation is presented** — placement, wording, whether a user can open it from the
  interface. That is UIUXDesignStandards' subject.
- **Item 26, Uncertainty Expression and Abstention** and **item 28, Capability Honesty to Users**,
  both unwritten on this base. Whether a system says it does not know a source is item 26's; this
  standard requires only that it does not name one it did not use.
- **Copyright, licence terms and the legal duty to attribute.** Nothing here is a statement of what
  a licence requires.
- **The provenance of an indexed corpus** — where its documents came from and under what terms. That
  is [Standard 12](12-context-and-corpus-provenance.md).

**Boundary posture B — baseline, with a named half deferred.** The boundary review's owner entry reads
"AIStandards for whether a citation is owed and whether it resolves; UIUXDesignStandards for how
sources are presented", and its reasoning is that the plan marked the item owned outright while
UIUXDesignStandards `standards/26-ai-user-experience.md` already governs the presentation half, so
keeping `O` would leave two packs asserting requirements about citation presentation with no recorded
division. Its one piece of evidence is that standard's R7, recorded as: "Where output cites or draws
on sources, those sources SHOULD be reachable. A citation the user cannot open is a claim, not
evidence." The review records no rule ids for it. [Standard 7](07-boundary-with-adjacent-standards.md)
carries the same division ("How a citation's sources are presented", deferred). Nothing is claimed
here about the sibling pack beyond that record (reviewed 2026-09-04). "Whether it resolves" is split
with Standard 25 R4 as stated above; where the line falls is a judgment this standard makes, and no
one has confirmed it.

## Requirements

### R1 — Decide, per kind of output, whether a citation is owed

**A system MUST record, for each kind of output it presents as drawn from sources, whether a citation
is owed to the reader, and when none is owed, why.**

A system that answers from retrieved documents, a tool result and its own training in the same
response has outputs of different kinds, and the reader cannot tell which sentence came from where. A
decision that is not recorded is made afresh by whoever edits the prompt. "None owed" is a legitimate
answer: a user's own text returned to them in a summary is the user's, and a paraphrase of common
knowledge may rest on no source. The requirement is that the answer exists and is not left implied by
the presence of a retrieval component. It is a document, not a manifest field: both schemas are
closed, and `dataSources` records a source's `name`, `kind`, `synthetic` and `provenance`, not whether
any output owes it a citation.

### R2 — Cite only a source among the response inputs

**A system MUST NOT present a citation for a source that is not among that response's inputs.**

This is the central obligation. A model that has seen a thousand papers can name one that fits; if the
system did not retrieve it, was not given it and did not receive it from a tool for this response, the
citation is a recollection dressed as a reference. A citation produced by the model is checked against
the recorded inputs before it is shown or acted on, or the system assembles the citation from the
inputs itself; either satisfies the requirement. Where the model's training is the only basis, the
output carries no citation, or states that it is from training and names no source. Which output
carries no citation is R1's decision. That a named source is real is not enough: a real source the
response never used is a false attribution.

### R3 — Give a citation a locator and, where the source can change, its revision

**A citation MUST carry a locator sufficient to find the cited material in the source, and the
revision of the source the system used where the source can change.**

"According to the handbook" names a document and not a place. A reader who cannot find the passage
cannot check it, and a source that is edited after the answer was given no longer says what the answer
cited. The locator is whatever the source supports: a record key suffices for a record, a page or
section for a document. A revision is a version, hash or retrieval timestamp, whichever the system
holds. A source that cannot change, or whose system holds no finer identifier than the whole item,
satisfies this by naming the whole item; the requirement does not ask for a locator the system does
not have.

### R4 — Keep the attribution in the system's own data

**A system that returns output to a presentation layer, a downstream process or a log MUST carry each
citation with the output or span it attaches to, and MUST NOT drop it, merge it into another
output's citations, or move it to a different span when the output is transformed.**

Summarising, truncating, translating or caching a response can strip a citation or reattach it to the
wrong sentence, and the presentation layer, however well it presents, can only show what it was given.
How the attachment is represented is the project's choice; this standard fixes no field, header or
format. Where a transformation cannot preserve the attachment, the citation is withheld or the output
is passed on as lacking one; it is not passed on with a citation that now points at the wrong claim.

### R5 — This framework states no attribution verdict from a presence artifact

**No framework output MAY state that a system attributes its sources, that its citations are accurate,
or that they resolve, because a presence artifact is present.**

This is a constraint on the framework, not on a project. A repository can show that a citation field
exists, that a prompt says "cite your sources" or that a citation component is imported. It cannot
show that a given citation names a source the response used, that it locates the cited material, or
that it survived the path to the reader. Reporting a pass from a presence would turn a mechanism into a
verdict about its effect. Reporting that a citation instruction or field was *found*, as an
observation with no verdict, is permitted.

## Failure modes

| Requirement | Failure |
| --- | --- |
| R1 | A kind of output is presented as drawn from sources and nothing records whether a citation is owed, or the record says none is owed with no reason given |
| R2 | A citation names a source that was not among the response's inputs, including a real source the model recalled from training |
| R3 | A citation names a document and no locator, or names a source that can change without the revision used |
| R4 | A citation is present when the output is generated and absent, merged with another's or attached to a different span when the output reaches the presentation layer, a downstream process or the log |
| R5 | A framework output states a system attributes its sources, or its citations are accurate or resolve, because a presence artifact is present |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The per-kind decision on whether a citation is owed, with a reason where none is | A project document the project names; **no manifest or policy field points to it** | Human review |
| R2 | A citation set read against the response's recorded inputs for sampled responses | The system's output and the recorded inputs; the inputs record exists only if the project keeps one | Human review |
| R3 | A sample of citations, each opened at its locator | The system's output and the source | Human review |
| R4 | A response at generation and the same response at the presentation layer, downstream process or log | The system's data at each boundary | Human review |
| R5 | The absence of any framework output of the kind R5 forbids | This repository's catalog, detectors, reports and tests | Code review |

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 would look for a declared decision, and R2 to R4 need a record of a response's inputs and its outputs; neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place for either, and both are closed. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **R2 to R4 are properties of individual responses at inference time, not of a checkout.** A detector could only read a field or an instruction, which R5 forbids this framework from reporting as a result.
3. **No rule namespace exists for it.** This standard mints no id and edits no shard; naming one is a decision for the owner. A proposed rule, if one is natural, is recorded in the pull request that introduced this document for per-rule approval, and not here.

**Validation type and severity.** The levels below are this repository's judgment, listed in Additions, and are not owner-approved. The validation type and the severity are different things.

| Requirement | Validation type | Severity |
| --- | --- | --- |
| R1 | `manual-review` | `warning` |
| R2 | `manual-review` | `error` |
| R3 | `manual-review` | `warning` |
| R4 | `manual-review` | `warning` |
| R5 | none (a constraint on the framework) | none |

These are the levels a rule would carry if one is minted; this release emits no framework finding at
them.

**Exemptibility.** R5 is not exemptible. R1 to R4 apply to every system within this pack's scope; a
repository with no AI system is outside this standard, not exempted from it. No policy declaration
exists for them: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4's dispositions are recorded
against catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2
R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each kind of output presented as drawn from sources has a recorded decision on whether a citation is owed, and a reason where none is | A kind of output presented as drawn from sources with no recorded decision, or "none owed" with no reason | A kind of output the system does not present as drawn from sources needs no entry |
| R2 | Each citation in a sampled response names a source among that response's recorded inputs | A citation naming a source that is not among them, including a real one | A response carrying no citation, with the output stated to be from training, is not failed |
| R3 | Each sampled citation, opened at its locator, reaches the cited material, and carries the revision used where the source can change | A citation that names a document and no locator where the source supports one, or an editable source with no revision | A whole-item identifier for a source the system holds no finer identifier for is complete |
| R4 | Each citation is present at the boundary, on the output or span it was generated for | A citation missing, merged or moved between generation and the boundary | An output the system withheld, or passed on as lacking a citation, because the attachment could not be kept is not failed |
| R5 | No framework output states a system attributes its sources, or its citations are accurate or resolve, because a presence artifact is present | A framework output that did so because a presence artifact was found | Reporting that a citation instruction or field was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads a citation, a response input record or a
boundary, so no detector checks R1 to R4; they are held by review, and R5 holds today because no such
framework output exists. The falsifiers are manual, not absent. R2 to R4 are not-evaluable from a
repository alone; they can be established only from sampled responses and the project's own records.

## Exceptions and staleness

There is no policy-level exception mechanism in this release, because no rule exists to except.

| Requirement | Invalidated by |
| --- | --- |
| R1 | A new kind of output presented as drawn from sources; a new source kind; a change to the instructions that govern citing |
| R2 | A change to the retrieval, tool or user-input path that changes what a response's inputs are; a model identifier re-pointed behind an alias |
| R3 | A change to how sources are identified or versioned; a source moved or renamed |
| R4 | A change to any step between generation and the reader (summarising, truncating, translating, caching, formatting) |
| R5 | Nothing: it constrains this repository |

A sampled response establishes the state at the time it was sampled; it says nothing about the next
one.

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one word, "citation", inside a bullet of four subjects. It
states no requirement, level or evidence for any of them. Specifically authored here, none of it
owner-approved:

- **R1 in full**: that whether a citation is owed is decided per kind of output and recorded, and that
  "none owed" is a legitimate answer with a reason.
- **R2 in full**: that a citation must name a source among the response's inputs, and that a real
  source the response did not use is a false attribution.
- **R3 in full**: the locator, and the revision where the source can change, with the allowance for a
  source that offers no finer identifier.
- **R4 in full**: that the attribution survives transformation in the system's own data, kept separate
  from the presentation question.
- **R5**, the constraint on this framework, in the same form as the equivalent requirement in
  [Standard 25](25-grounding-and-hallucination-control.md) and
  [Standard 39](39-transparency-and-system-documentation.md).
- **The division from Standard 25 R4** (this standard asks whether the source was used; that one asks
  whether a generated identifier resolves) and **the other exclusions in Scope** as division lines,
  unconfirmed by anyone.
- **The severity and validation types**, **the ruling that this standard ships with no catalog rules**
  and the invalidation table.

Not authored here, and recorded so the reader does not credit this standard with it: posture `B`, the
split of ownership between the two packs and the recorded evidence (UIUXDesignStandards `26` R7) are
the boundary review's.

## Relationship to other standards and ADRs

[Standard 25](25-grounding-and-hallucination-control.md) is the closest sibling and the one with which
the line is finest. It requires a basis to be recorded (R1), a claimed basis to be checked against the
output (R3) and a generated referent to be resolved before use (R4). This standard requires that a
citation name a source the response used, with a locator, preserved to the reader. A citation can pass
here and fail there, and the reverse. Nothing is restated.

[Standard 7](07-boundary-with-adjacent-standards.md) records "How a citation's sources are presented"
as deferred to UIUXDesignStandards, with this pack owning whether a citation is owed and whether it
resolves. [Standard 12](12-context-and-corpus-provenance.md) governs where an indexed source came from;
a citation here points at a source and does not vouch for its origin.
[Standard 8](08-ai-safety-requirements-and-safety-cases.md) R3 and R4 govern how a safety case cites
evidence, which is a different use of the word. [Standard 1](01-ai-system-manifest.md) declares data
sources and declares no citation duty, and none is proposed. [Standard 2](02-ai-risk-tiering-and-applicability.md)
R3 governs non-lowering, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 (each
requirement carries a falsifier or is declared not-evaluable) is what the Tests section answers.

Items 26 and 28 are unwritten on this base; the lines drawn above are provisional until they are.
**Outside this pack:** UIUXDesignStandards' `standards/26-ai-user-experience.md` R7 is named in Scope
with what the boundary review recorded; this is a deference, not a crosswalk, and no maintainer has
confirmed it. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R4 is enforced; R5 holds today because no such framework output exists.**

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R5 | **Holds by construction, not by assertion.** No detector, rule or report in `scripts/`, `rules/` or `ai-policy.yml` has a concept of a system's citations: a search of `scripts`, `schemas`, `templates`, `rules` and `ai-policy.yml` for the word finds the safety-case citation language of the lifecycle shard (Standard 8's subject), a comment in `scripts/inventory.mjs` about numbering, and nothing about an AI output's sources. No test asserts the absence, so a future detector could break R5 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's attribution |

**Proposed, and deliberately absent. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 | A named document a rule can find, or a manifest or policy field recording the decision | Both schemas are closed; a change is a schema-versioning decision and plan 02 section 8 puts it out of scope |
| R2, R3 | Fixtures with a rejected and an accepted citation, and a detector that runs project-supplied checks against recorded response inputs | Phase 3 detector and evidence-availability work; the plan says detectors wait for the corpus |
| R4 | A convention for the attachment at the output boundary | The shape is the project's; this framework would be guessing |
| R5 | A test asserting no framework output states an attribution verdict | Meaningful only once a detector exists for it to constrain |
| Rule id | A reserved-namespace id and a shard, once an owner is decided | Not decided; this standard names none |

**What no future release will implement.** A framework output that states a system attributes its
sources, or its citations are accurate or resolve, from the presence of a citation field, an
instruction to cite or a citation component. R5 forecloses it.
