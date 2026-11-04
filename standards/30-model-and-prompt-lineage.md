# Standard 30 — Model and Prompt Lineage

A generative system changes without its code changing. A prompt is edited, a fragment it is assembled
from is swapped, a provider re-points a model name, a fine-tune replaces its base. Each of those is a
step in a history, and the question lineage answers is the one asked after something went wrong or was
praised: which model, instructed by which text, produced this, and what came before it.

Three things are routinely run together, and this standard keeps them apart. A **revision** is one
specific text or model. A **lineage** is the chain of revisions, each pointing to the one it replaced.
And **what a call used** is a fact about one call. Recording what a call used is
[Standard 33](33-ai-observability.md) R1's subject; pinning the model a manifest names is
[Standard 1](01-ai-system-manifest.md) R4's. This standard asks for what neither supplies: that a
revision identifier names exactly one thing, that the chain can be walked, and that a gap in it is
shown as a gap.

Source: item 30 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "model/data lineage" token of the "Reproducibility, versioning, model/data lineage,
and rollback" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 30 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **B**
> (baseline), narrowed rather than changed, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) with verdict `NARROWED`, and
> that review's substantive half is human judgment and carries `humanSignOff: null`. No maintainer of
> MachineLearningStandards has confirmed it.
>
> **The brief supplies one token and this standard supplies the rest.** The item is class `D` because
> its subject token is the brief's own; the requirements are this repository's judgment, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it
that sends a prompt to a model, in production or in an evaluation whose result the project cites.

Terms, defined once and used verbatim below:

- **Prompt revision** — the complete instruction text sent to a model with every user-supplied or
  per-request value left out: the system prompt, the template, each fragment the template is
  assembled from, and any example included in it.
- **Revision identifier** — a value that denotes one prompt revision or one model revision.
- **Model revision** — a specific model, as the provider documents it, whose identifier does not move
  over time (the property [Standard 1](01-ai-system-manifest.md) R4 requires of a declared identifier).
- **Lineage record** — for a revision, its identifier, the revision it replaced, the date it took
  effect, and the reason for the change.
- **Lineage gap** — a point in a chain at which the project cannot say which revision was in force.
- **Lineage verdict** — a statement that a system has, keeps or preserves lineage, or that a lineage
  is complete, whatever its basis.
- **Framework output** — what a detector, catalog rule, audit finding or generated report of this
  framework states, other than text supplied by a target project and clearly attributed to it.

It does **not** cover, and claims none of the ground of:

- **Dataset and feature lineage.** The boundary review's evidence is that MachineLearningStandards
  `04-dataset-versioning.md` states its scope as "Applies to any dataset whose contents can change over
  time" and `17-feature-lineage.md` as "Applies to every feature supplied to a model, including features
  that appear to be raw columns". That is the owner's ground, and nothing here restates it.
  [Standard 7](07-boundary-with-adjacent-standards.md) records this pack as adding only retrieval
  corpora, prompt fixtures and eval sets to that ground. Where such a thing came from is
  [Standard 12](12-context-and-corpus-provenance.md)'s; who owns its versioning or lineage once it
  changes is not settled (Q46) and this standard does not claim it.
- **Which revision a given call used**, which is [Standard 33](33-ai-observability.md) R1's record.
- **Pinning a declared model**, which is [Standard 1](01-ai-system-manifest.md) R4's, and **the prompt
  being a committed file**, which is [Standard 21](21-prompt-and-instruction-security.md) R1's.
- **Versioning and change control as a process** ([Standard 29](29-ai-system-versioning-and-change-control.md)), **reproducibility under nondeterminism**
  ([Standard 31](31-reproducibility-under-nondeterminism.md)) and **rollback** ([Standard 32](32-rollback-and-recovery.md)). Identity overlaps [Standard 29](29-ai-system-versioning-and-change-control.md) R1, which asks a version
  identifier of every behaviour-determining component; the two are written to be met together (see
  R1 and R5 below, and Q45).
- **Training or run configuration of a model the project trains itself**, which is
  MachineLearningStandards' ([Standard 1](01-ai-system-manifest.md) R4 draws the same line).

**Boundary posture B — baseline, narrowed.** The boundary review's owner entry reads
"MachineLearningStandards for feature and dataset lineage; AIStandards outright for prompt lineage".
Its reasoning is that a prompt is not a feature supplied to a model in ML 17's sense, so ML 17 does not
reach prompt lineage, and that deferring the whole item to a standard that does not cover it was the
error in the plan's undifferentiated `B`. The dataset half defers to ML 4. The review records no
evidence about model lineage, and R3 below is this standard's judgment, not a deference
or a finding about the sibling pack. Nothing is claimed here about the sibling pack beyond that record.

## Requirements

### R1 — Give each prompt revision an identifier that names exactly one text

**A system MUST identify each prompt revision by a revision identifier that changes whenever any text of the revision changes, and MUST NOT let one revision identifier denote two texts.**

An identifier chosen by hand ("v3") survives an edit made in place; a content hash or a commit
identifier does not. The requirement is on the binding, not on the scheme. It reaches a revision
assembled from fragments: the identifier covers the assembled whole, so that editing one fragment
changes it. A prompt built so that its parts are separately versioned and nothing identifies the
combination has no revision identifier in this sense. [Standard 29](29-ai-system-versioning-and-change-control.md) R1 asks a version identifier of every
behaviour-determining component; an identifier that meets this requirement meets that one for a prompt,
and this is the stricter statement, since it covers the assembled whole and each fragment.

### R2 — Record what each prompt revision replaced

**A system MUST keep a lineage record for each prompt revision it has put in force, naming the revision it replaced.**

A history that can be walked backward is what turns "the answers changed in March" into a diff. The
record may be a version-control history, provided the commit that replaced the revision states the
reason. A revision with no recorded predecessor is the start of a chain, and the record says so; it is
not silent.

### R3 — Record what each model revision replaced

**A system MUST keep a lineage record for each model revision it has put in force, naming the revision it replaced and, for a derived model (a fine-tune or adapter), the model it derives from and a reference to the record of the data it was derived with.**

This requirement is about the identifier a deployed system names for a model it consumes. The
reference to the data record is a pointer only: what that record contains, and how a dataset is
versioned, is the owner's. A change of provider or of routing is a change of model revision for this
purpose; which model served a given call is [Standard 33](33-ai-observability.md) R2's subject.

### R4 — Keep every revision that anything retained or cited names

**A project MUST retain the text of every prompt revision, and the lineage record of every model revision, that a retained output, a retained call record, or a cited evaluation result names, for as long as that output, record or result is retained or cited.**

A figure quoted in a report names a prompt revision; if the file has since been rewritten and the old
text is not recoverable, the figure describes nothing that can be found
([Standard 17](17-evaluation-plans-for-generative-systems.md) R6 requires the evaluation result to name
the revision, and this requirement asks that the name still resolves). Retaining a prompt revision is
also bound by [Standard 13](13-personal-data-in-ai-systems.md) and
`privacy.no-credentials-in-prompts`: a revision holding either is not retained as it stands. How long a store keeps a revision is
[Standard 15](15-retention-deletion-memorization.md) R1's and what deletes it at the end of the period is its R2's; where that period would end
while something retained or cited still names the revision, it and this requirement disagree, and which
yields is recorded open (Q51), not decided here.

### R5 — Show a lineage gap as a gap

**A project MUST NOT record a moving alias, an unrecorded runtime fetch, or a guess as a revision, and MUST mark a point at which it cannot say which revision was in force as a lineage gap.**

Where a provider re-points a name, or a prompt is fetched at runtime from a place that keeps no
history, the project does not know which revision was in force, and a record that names the alias or
the location has quietly turned an unknown into a fact. [Standard 1](01-ai-system-manifest.md) R4 asks
that a declared identifier be pinned and allows a recorded reason where it cannot be; this requirement
asks that the lineage say where that has left a hole. A gap is a legitimate state. A chain that looks
continuous across one is the failure. [Standard 29](29-ai-system-versioning-and-change-control.md) R1 lets a re-pointable alias serve as a component's version
identifier where the record also names what it resolved to and when; that agrees with this requirement,
because the revision recorded is what the alias resolved to and the alias itself is never recorded as the
revision.

### R6 — This framework MUST NOT report lineage established from a presence

**No detector, rule, audit finding or generated report in this framework MAY state a lineage verdict because a version string, a prompt file, a model identifier or a version-control history is present.**

This is a constraint on the framework, not on a project. A repository can show a prompt file or a
pinned-looking identifier; it cannot show that the identifier names exactly one text, that the chain is
unbroken, or that what production used is what the repository holds. This is the form of
[Standard 25](25-grounding-and-hallucination-control.md) R6 and [Standard 41](41-inference-cost-and-budget-control.md)
R6: a presence is not an effect.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Identifier reused for different text | A prompt labelled "v3" edited in place; a fragment changed under an unchanged identifier | R1 |
| Combination unidentified | Each fragment versioned and the assembled prompt identified by nothing | R1 |
| Chain that cannot be walked | A prompt revision with no recorded predecessor and no statement that it is the first; a model swap with no record of what was replaced | R2, R3 |
| Derivation not recorded | A fine-tuned model in use whose record names neither its base nor any data record | R3 |
| Cited revision unrecoverable | An evaluation result or a retained output naming a revision whose text is gone | R4 |
| Unknown recorded as known | A lineage record naming `latest`, or a path whose content is fetched at run time and kept nowhere, as the revision in force | R5 |
| Presence read as lineage | A framework report of "lineage preserved" because a prompt file exists | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The scheme by which the identifier is derived, and for a pair of different texts, different identifiers | Version control, the prompt store, project documentation | Human review |
| R2 | The lineage record of each prompt revision put in force | Version-control history, a change record the project names | Human review |
| R3 | The lineage record of each model revision put in force, with base and data-record reference for a derived model | A project document the project names — **no manifest field exists for it; see Implementation** | Human review |
| R4 | For each retained output, call record or cited result, the retrieved text of the revision it names | The prompt store and retention records | Human review |
| R5 | Each lineage gap as marked, and for each identifier recorded as a revision, the documented version it denotes | A project document the project names | Human review |
| R6 | The absence of any detector, rule, audit finding or generated report that states a lineage verdict | This repository's own detectors and tests | Code review; see Implementation |

A record that a revision exists establishes that the project wrote it down. It does not establish that
the revision is the one that was in force; the reviewer reads the record against the history that would
carry it.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R2 or R3 would look for a lineage record, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place for one; both are closed. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. A schema field is a schema-versioning decision outside this slice (plan 02 section 8).
2. **R1, R4 and R5 concern a binding, a retention and an honesty, not a file.** Whether an identifier names exactly one text across history is not a property of a checkout. A detector would test for the presence of a version string, which R6 forbids this framework from reporting as a result.
3. **The `lineage` namespace is reserved and has no shard.** This standard mints no id; a proposed rule, if one is natural, is recorded in the pull request that introduced this document for per-rule approval, and not here. Existing rules `promptsec.prompt-is-versioned-artifact` and `lifecycle.model-version-pinned` belong to Standards 21 and 1, and are not cited as this standard's.

**Validation type.** R1 to R5 are `manual-review` obligations in this release; R6 constrains this framework and has no validation type. The validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | error |
| R2 | error |
| R3 | error |
| R4 | error |
| R5 | error |
| R6 | error |

**Exemptibility.** R5 and R6 are not exemptible: an exception to R5 would record a project as knowingly presenting an unknown as known, and an exception to R6 would let a scan report an effect from a presence. R1 to R4 reach a system only where their subject exists (no model derivation, no retained output), and a system without that subject records in its own documents that the requirement does not reach it and why. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Two prompt texts that differ in any character, including in a fragment, have different identifiers across the project's history | One identifier denoting two texts; or an edit to a revision, or to a fragment of it, that leaves its identifier unchanged | A revision whose identifier is a commit hash, with the file untouched since, must **not** be faulted for lacking a separate version label |
| R2 | Every prompt revision put in force has a record naming its predecessor, or stating that it is the first | A revision with neither | A revision stated to be the first must **not** be faulted for naming no predecessor |
| R3 | Every model revision put in force has a record naming its predecessor and, if derived, its base and a data-record reference | A model revision with no recorded predecessor and no statement that it is the first; or a derived model whose base or data-record reference is missing | A system that has only ever used one model, and says so, must **not** be faulted for lacking a predecessor; a model the project trained itself is not within R3 |
| R4 | For each retained output, call record or cited result, the revision it names can be retrieved | A named revision whose text, or model lineage record, cannot be retrieved while the thing naming it is retained or cited | A revision no retained or cited thing names must **not** be faulted for being absent |
| R5 | No record names a moving alias, a runtime location or a guess as a revision, and each point at which the revision is unknown is marked | A lineage record naming an alias or a location as a revision; or an unmarked point at which the project cannot say which revision was in force | A lineage gap marked as a gap must **not** be faulted for being one |
| R6 | No detector, rule, audit finding or generated report in this repository states a lineage verdict from presence | One that states lineage preserved, complete or established because a version string, file, identifier or history is present | Reporting that a prompt file or a model identifier was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads a lineage record and no fixture carries one, so R1 to R5 are enforced by review or not at all, and R6 holds today only because no such detector exists. The falsifiers in the table are available for manual review; what this release lacks is a detector that applies them.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R4 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism is later work. No record under this standard expires on a schedule.

**What makes a record stale.** A lineage record describes the chain as it stood. The events below make a record made before them describe an earlier arrangement, and it does not satisfy the requirement it was offered for until it is re-made.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | A change of the scheme by which identifiers are derived, or of what the assembled prompt is built from |
| R2 | A prompt revision put in force that the record does not contain |
| R3 | A model revision put in force that the record does not contain, including a provider's change behind an identifier the record names |
| R4 | A change of the retention of what names a revision, or a deletion of a stored revision |
| R5 | A gap closed or opened: a runtime fetch added, or an alias replaced by a documented version |
| R6 | A new detector, rule or report that touches lineage |

Incident handling for a lineage discovered to be broken is item 34's subject (AI Incident Response,
unwritten in this release).

## Additions this standard makes beyond the source

The brief contributes one token, "model/data lineage", inside a bullet of four subjects. It states no
requirement, level or evidence. Specifically authored here, none of it owner-approved:

- **R1 to R5 in full**, with the defined terms prompt revision, revision identifier, lineage record and
  lineage gap, and the rulings that an identifier must name exactly one text, that a prompt assembled
  from fragments is identified as a whole, that retention follows what cites a revision, and that an
  unknown is not recorded as a revision.
- **R3 as a whole.** The boundary review records no evidence about model lineage; extending this
  standard to a model revision, and to a derived model's base and data-record reference, is this
  repository's judgment.
- **R6**, the constraint on this framework, in the form of Standard 25 R6 and Standard 41 R6.
- **The exclusions in Scope** as division lines, unconfirmed by anyone.
- **The severity assignments**, the statement that no attestation or scheduled expiry exists in this
  release, and the staleness table.
- **The ruling that this standard ships with no catalog rules** and the decision to mint no id in the
  reserved `lineage` namespace.

Not authored here: posture `B`, its narrowing, the owner entry and the two ML scope sentences quoted in
Scope are the boundary review's; Standard 7's table is where the line was first drawn.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) records that MachineLearningStandards owns dataset
provenance and versioning and feature lineage, and this pack adds retrieval corpora, prompt fixtures and
eval sets. [Standard 1](01-ai-system-manifest.md) R4 pins the declared model identifier and is the
precondition for R3's chain being walkable. [Standard 21](21-prompt-and-instruction-security.md) R1
makes a system prompt a committed file, which is what R1 and R2 build on. [Standard 33](33-ai-observability.md)
R1 records the model identifier and prompt revision on each call, and R4 here asks that those names still
resolve. [Standard 17](17-evaluation-plans-for-generative-systems.md) R6 requires an evaluation result
to name its subject. [Standard 12](12-context-and-corpus-provenance.md) governs where a prompt fixture
came from. [Standard 13](13-personal-data-in-ai-systems.md) governs personal data a retained revision
might hold, and [Standard 15](15-retention-deletion-memorization.md) governs retention periods and deletion for the store that holds it. [Standard 29](29-ai-system-versioning-and-change-control.md) R1 asks for a
version identifier of every behaviour-determining component, and [Standard 20](20-regression-testing.md) R1 asks how a change behind an
identifier the project cannot observe is handled; R1 and R5 here are written to agree with both. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and
non-lowering language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the
requirement the Tests section answers.

[Standard 29](29-ai-system-versioning-and-change-control.md), [Standard 31](31-reproducibility-under-nondeterminism.md) and [Standard 32](32-rollback-and-recovery.md) were written in the same batch as this standard and the lines between them are unconfirmed by anyone (Q45). Item 34 is unwritten in this release; the line drawn above against it is provisional until it is. **Outside this pack:** MachineLearningStandards' `04-dataset-versioning.md` and
`17-feature-lineage.md` are named in Scope with what the boundary review recorded; this is a deference,
not a crosswalk, and no maintainer has confirmed it. No ADR covers this standard — `artifacts/adr/` does
not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds today because no such framework output exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R1 to R5 | Not enforced; held by review. Two existing rules touch adjacent ground and neither reads a lineage record: `lifecycle.model-version-pinned` (Standard 1) recognises alias shapes in a declared identifier and `promptsec.prompt-is-versioned-artifact` (Standard 21) recognises an inline literal; each reports `not-evaluated` rather than `passed` on a clean result |
| R6 | Holds today because no such detector exists; nothing prevents or tests one being added. No detector, rule or report in `scripts/`, `rules/`, `test/` or `templates/` states a lineage verdict. The word `lineage` appears in this repository's code only as a reserved namespace name in `scripts/catalog.mjs`, in a comment in `rules/lifecycle.json`, and in `test/no-phase-creep.test.mjs` as part of this standard's own filename |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R2, R3 | A place to declare lineage records: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R1, R4, R5 | A check over version-control history and a prompt store | Needs project-specific history access; a literal-reading heuristic would report a presence, which R6 forbids as a verdict |
| R6 | A test asserting no detector, rule, audit finding or report emits a lineage verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | An id in the reserved `lineage` namespace and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A framework output that states a system's lineage preserved,
complete or established from the presence of a version string, a prompt file, a model identifier or a
history. R6 forecloses it.
