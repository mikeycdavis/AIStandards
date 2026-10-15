# Standard 12 — Context and Corpus Provenance

An AI system is shaped by text it did not write: a document index it retrieves from, prompt fixtures
someone pasted from a ticket, an evaluation set assembled last spring, a folder of examples. Each of
those has an origin. A year later the origin is usually what nobody can say — who produced it, how it
was obtained, whether a model wrote it, whether it was ever checked — and the question arrives at the
worst moment, as a complaint, a leak or a result that will not reproduce.

This standard is about the **origin of what the system consumes as context, corpus, fixture or
evaluation input**. It asks that each such source say where it came from, in words a later reader can
test, that the statement distinguish what people wrote from what a model produced, that it be
revisited when the source changes, and that an unknown origin be recorded as unknown rather than
filled in with a plausible one.

The failure it is written against is provenance asserted from the presence of a field: a manifest
entry whose `provenance` string says "internal", a README line that says the corpus is "curated". A
non-empty string is a statement; it is not an origin that anyone verified.

Source: item 12 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "provenance" token of the "Data privacy, provenance, consent, retention, and access
control" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 12 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **B**,
> `CONFIRMED` in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json), whose
> substantive half is human judgment and carries `humanSignOff: null`. No maintainer of any adjacent
> pack has confirmed it.
>
> **The brief supplies one word and this standard supplies the rest.** The bullet names "provenance"
> and states no requirement for it. The item is class `D` because its token is the brief's own; the
> requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it, for each source the system draws on as context at inference time, or that the project uses as a
prompt fixture or evaluation set.

Defined terms, each used verbatim below:

- **Source** — a body of material the system or its tests consume as input, as `dataSources` in
  [`schemas/ai-system-manifest.schema.json`](../schemas/ai-system-manifest.schema.json) uses the word.
  Not a model and not a prompt template ([Standard 21](21-prompt-and-instruction-security.md)).
- **Provenance statement** — whatever the project records about where a source came from; the
  manifest's `dataSources[].provenance` is a free-text string and fixes no form.
- **Origin** — who or what produced the material, how it was obtained, and when.
- **Use** — one of: *context use* (read as inference-time context or used as a prompt fixture);
  *evaluation use* (used to evaluate a model); *development use* (used to train, fine-tune, validate or
  calibrate a model). A source may have more than one.
- **Revisit event** — any of: (a) the revision, snapshot or period the statement names is advanced or
  replaced, unless the statement says it covers the new contents; (b) material is added to, removed
  from or replaced in the source by a path or process the statement does not name; (c) the source is
  regenerated, re-filtered or re-chunked by a different process; (d) the system that produced the
  material changes; (e) the source is put to a use the statement did not contemplate; (f) the terms
  under which the source was obtained change.

It does **not** cover, and claims none of the ground of:

- **MachineLearningStandards' own requirements for a dataset with an evaluation use or a development
  use.** The boundary review gives that pack "training data"; a source with such a use stays in Scope
  for the requirements below, which are not offered in place of that pack's (R11).
- **Whether anyone agreed to the use, and on what terms** — item 14, unwritten.
- **Whether a source holds real personal data** — [Standard 13](13-personal-data-in-ai-systems.md) R1.
- **Retention and deletion** (item 15), **access control** (item 16), **benchmark contamination**
  (item 18), all unwritten.
- **What a retrieved passage supports in an output** — [Standard 25](25-grounding-and-hallucination-control.md).
- **Whether a source is true.** A statement of origin is not a statement of accuracy.

**Boundary posture B — a baseline, with deference.** The boundary review records the owner as
"MachineLearningStandards for training data; AIStandards for retrieval corpora, prompt fixtures and
eval sets", citing two files of that pack, and this standard reads no more than the review records:

- **MachineLearningStandards, `03-dataset-provenance.md`.** Scope: "Applies to every dataset
  used to train, validate, evaluate, or calibrate a model, including datasets assembled by joining or
  filtering others."
- **MachineLearningStandards, `04-dataset-versioning.md`.** Scope: "Applies to any dataset
  whose contents can change over time".

The review's reasoning that a retrieval corpus consulted by a hosted model is not within the first
scope is an inference, and this standard does not depend on it: it applies to every source in Scope,
claims no reading of that pack's reach, and has the project record each source's use (R10) rather than
infer it. Whether that pack's provenance standards reach an evaluation of a hosted model is not recorded
for item 12 (whose `unknowns` is empty); item 17's `unknowns` records the analogous question for that
pack's evaluation standards and is cited only as a parallel. Where both packs govern a concern the more
specialised requirement governs and the stricter compatible one applies
([Standard 7](07-boundary-with-adjacent-standards.md) R5; its table row on dataset provenance reads
"Defers. Adds only retrieval corpora, prompt fixtures and eval sets").

`provenance.` is one of the segments this pack reserves, is not shared with another pack, and has no
shard. No rule id is minted here (see Validation).

## Requirements

Each requirement has one limb. Each has exactly one failure-mode row, evidence row, test row, severity
row and staleness line below, keyed by its number.

### R1 — Every source is declared

**Each source in Scope MUST be declared with its name and kind.**

The manifest has the place: `dataSources` lists `name`, `kind` (`retrieval-index`, `fine-tuning-set`,
`evaluation-set`, `prompt-fixture`, `other`), `synthetic` and `provenance`. Until this standard no
requirement asked for any of it to be filled in. A source reached by a path nobody listed is the usual
case: the fixture directory added for one test, the folder the retrieval job also reads.

### R2 — Every declared source carries a statement

**Each declared source MUST carry a provenance statement.**

A declared source with no statement is a gap in the record. It is distinct from a statement that the
origin is unknown (R7).

### R3 — The statement says the origin

**A provenance statement MUST say the origin, to the extent known, at a granularity from which a reader
could find the original.**

"Internal", "curated" and "public" describe a property of the source, not an origin. The test is that a
reader who disagrees could go and look: a named system and export, a repository and revision, a vendor
and delivery, a named author group and period.

### R4 — The statement divides by origin

**A provenance statement for material of more than one origin MUST divide it by origin.**

A source of three origins with one origin recorded has been described as the most reassuring of them.

### R5 — Model-produced material is marked synthetic

**A source known to contain material produced by a model MUST be declared `synthetic`.**

Synthetic material repeats its generator's errors with confidence and can be fed back into the system
that made it; an evaluation set written by the model under test measures agreement with itself. A source
a human edited from model output is still in part model-produced. `synthetic` is a boolean; where it is
not known whether a model produced any of the material, `synthetic` is omitted and the unknown is
recorded under R7, because `false` is a claim that no model produced it.

### R6 — The generator is named

**Where the generator of model-produced material is known, the statement MUST name it.**

The manifest has no place for the generator; the name belongs in the statement. Where it is not known,
R7 applies.

### R7 — Unknown is recorded as unknown

**Where any part of the origin is not known, the statement MUST say so and say what is known.**

This is the repository's standing instruction — do not invent historical intent — applied to data. "Unknown,
found at this path in this month" is a true and useful record and tells the next reader the source is
untrusted. A statement completed from a guess, from the source's location, or from the name of the person
who added it has not recorded the unknown.

### R8 — The statement names what it describes

**A provenance statement MUST name the revision, snapshot or period it describes.**

Where the origin is unknown, the date the statement was written about satisfies this requirement.
MachineLearningStandards' `04-dataset-versioning.md` scopes itself to "any dataset whose contents can
change over time"; whether that reaches a retrieval index is not established here, and this requirement
states only that a statement is dated to what it described.

### R9 — The statement is revisited on a revisit event

**A provenance statement MUST be revisited, and the re-read recorded, on each revisit event.**

A retrieval index is rarely static: the initial import is documented and the connector added later is
not. The requirement is not that every addition be recorded; it is that the statement's age is visible
and a new path is a reason to read it again. A documented re-read that concludes no textual change is
needed satisfies it.

### R10 — Each use is recorded

**The project MUST record each source's use or uses.**

The manifest's `fine-tuning-set` kind suggests a development use; it does not record one, and the
repository shows which sets are listed and says nothing about what they train. A source recorded with
two uses has recorded a fact, not hedged.

### R11 — This standard is not offered in place of the ML pack's requirements

**For a source with an evaluation use or a development use, this standard MUST NOT be offered as
satisfying MachineLearningStandards' dataset provenance and versioning requirements.**

The split is by what the *source* is used for, not by who operates the model that consumes it. A
retrieval corpus read by a model the project trained is a context use and stays in Scope; the same
corpus used to fine-tune that model also has a development use. This standard's own requirements apply
to the source either way.

### R12 — This framework does not report provenance from presence

**No detector, audit finding or generated report in this framework MAY state that a source's provenance
is established or verified because a `provenance` string, a data card, a licence file or a README line is
present in the repository.**

A repository can show that a field is non-empty. It cannot show that the statement is true, that it
describes the current contents, or that the material was obtained as stated. A report MAY state, worded
as presence only, that a statement is present. Whether a statement of origin is true is **not-evaluable**
from a repository.

## Failure modes

| Requirement | Failure | What it looks like |
| --- | --- | --- |
| R1 | Undeclared source | A folder read by the retrieval job and listed nowhere |
| R2 | Gap in the record | A declared source with no statement at all |
| R3 | Origin by adjective | `provenance: curated internal data` |
| R4 | The reassuring part | A three-origin source described by its most trusted origin |
| R5 | Model output as human | Generated Q&A pairs stored as "support team answers", or a self-grading evaluation set not marked synthetic |
| R6 | Generator unnamed | A known generating model absent from the statement |
| R7 | Guess as origin | "Probably the 2023 export" written into the record |
| R8 | Undated statement | A statement that does not say which snapshot or period it describes |
| R9 | Stale statement | A day-one description of an index that has since taken in uploads and a sync |
| R10 | Use unrecorded | A fine-tuning set described only as context, or no use recorded |
| R11 | Substitution | A source with an evaluation use or a development use, described under this standard and offered as satisfying the ML pack |
| R12 | Presence read as provenance | A framework report of "documented" because the string is non-empty |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The list of sources, set against what the system and its tests read | `dataSources` in `ai-system.yml`, and the code and configuration that read data | Human review |
| R2 | The statement for each declared source | The manifest's `provenance` or the document it names | Human review |
| R3 | For each known component of origin, the original the statement points to | The statement and the project's production records | Human review |
| R4 | The division of a multi-origin source by origin | The statement | Human review |
| R5 | The `synthetic` declaration (or `synthetic` omitted with the unknown recorded under R7) set against how the material was made | The manifest and the production records | Human review |
| R6 | The generator named where known | The statement | Human review |
| R7 | Each component recorded as unknown, and what is known | The statement | Human review |
| R8 | The revision, snapshot or period named, or, where the origin is unknown, the date the statement was written about | The statement | Human review |
| R9 | The recorded re-read on each revisit event | The statement's history or the project's change record | Human review |
| R10 | The recorded use or uses of each source | A project document the project names — no manifest field exists (see Implementation) | Human determination |
| R11 | The recorded use set against any claim of satisfying the ML pack | The same document | Human review |
| R12 | The absence of any detector that reports provenance from presence | This repository's own detectors and tests | Code review; see Implementation |

A manifest entry establishes that the project wrote a statement. It does not establish that the
material came from where it says; the reviewer reads the statement against the source, the ingestion
code and the production records. **The truth of a statement is not-evaluable from a repository.**

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.** Section 6 of
[plan 02](../artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md) requires every standard to
cite at least one rule or record in its Validation section why it ships with none; this is that record.
The reasons:

1. **The one field that exists is free text and a rule over it would test presence.**
   `dataSources[].provenance` has `minLength` 1, which `lifecycle.manifest-valid` already enforces by
   schema conformance for an empty value; nothing requires the field to be present. A rule failing a
   project for a missing value is decidable and would be a structural check, as
   `oversight.autonomy-tier-declared` is for Standard 11. Whether it is wanted, and whose it is where the
   kind is `fine-tuning-set`, is Q26 and Q27; the proposed rule is described under Q26 and is not added.
2. **R3 to R9 concern whether a statement is true and current**, not source text; a detector would test
   that a string is non-empty, which R12 forbids reporting as a result.
3. **No id is minted in a reserved namespace that has no shard**; naming the first id is a catalog
   decision made once, with the rule's level and validation type.

No rule exists, so the following states what each requirement is and the severity a breach would carry
were a rule minted. Every row is `manual-review` except R12, which is code review of this repository.

| Requirement | Severity of a breach | Not-applicable where no source is in Scope | Exemptible | Attestable |
| --- | --- | --- | --- | --- |
| R1 | error | yes | yes | yes |
| R2 | error | yes | yes | yes |
| R3 | error | yes | yes | yes |
| R4 | error | yes | yes | yes |
| R5 | error | yes | yes | yes |
| R6 | error | yes | yes | yes |
| R7 | error | yes | **no** | yes |
| R8 | warning | yes | yes | yes |
| R9 | warning | yes | yes | yes |
| R10 | error | yes | yes | yes |
| R11 | error | yes | **no** | yes |
| R12 | error (this repository's changes) | not applicable | **no** | no |

**Non-exemptible rows** are R7, R11 and R12: an exception would record a project as knowingly inventing a
history or as substituting this standard for another pack's requirements, and a scan reporting an origin
from a string cannot be excused. Non-exemptibility bars approving a known breach; it does not bar
supplying evidence of compliance, so attestability is independent
([Standard 6](06-standard-structure-and-rule-identity.md) R8: `manual-review` defaults to attestable). An
attestation would attest that a review took place, never that a statement of origin is true. A system
with no source in Scope records in its own documents that it has none and what would create one — the
shape of a [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 declaration should a rule be minted.
No level is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Every path read as inference-time context, prompt fixture or evaluation input corresponds to a declared source | A directory read by the retrieval job that no declaration names | A source declared and not currently read must **not** be failed |
| R2 | Each declared source carries a statement | A declared source with no statement | A statement "unknown, found at this path in this month" must **not** be failed for being unknown |
| R3 | For each known component of origin a reader can locate the original | A statement of only an adjective such as "internal" or "curated" | A statement naming a system, an export and a date must **not** be failed for being short; a component recorded as unknown under R7 must **not** be failed for lacking its original |
| R4 | A source of more than one origin is divided by origin in the statement | A multi-origin source described by one origin | A single-origin source must **not** be failed for lacking a division |
| R5 | A source known to contain model output is `synthetic` | Model output with `synthetic` absent or false | A source known to be human-written and declared `synthetic: false` must **not** be flagged; a source of unknown authorship with `synthetic` omitted and the unknown recorded under R7 must **not** be failed |
| R6 | The generator is named where known | A known generator absent from the statement | A statement recording the generator as unknown under R7 must **not** be failed for lacking a name |
| R7 | Each unknown component is stated as unknown with what is known | A guess recorded as an origin | A statement "unknown, found at this path in this month" must **not** be failed for being unknown |
| R8 | The statement names a revision, snapshot or period | A statement with none | An unknown-origin statement dated to the day it was written about must **not** be failed for naming no revision |
| R9 | Each revisit event is followed by a recorded re-read | A revisit event with no recorded re-read, other than a snapshot advance the statement says it covers | A statement that says it covers each new snapshot of a named sync must **not** be flagged when one arrives; a documented re-read concluding no change is needed must **not** be failed; a source with no revisit event must **not** be flagged for age |
| R10 | Each source's use or uses are recorded, not derived from a `kind` value or a file name | A use inferred from a `fine-tuning-set` entry, or a source with no recorded use | A source recorded with both a context use and a development use, with a reason, must **not** be treated as hedging; a corpus read by the project's own model and not used to train it must **not** be failed |
| R11 | No claim that this standard satisfies the ML pack's requirements for a source with an evaluation or development use | A source with an evaluation use or a development use offered as satisfying the ML pack | A source with only a context use must **not** be flagged |
| R12 | No detector or report outputs a provenance verdict from presence | A detector reporting an origin established because a `provenance` string was non-empty | Reporting that a field was *found*, with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads a provenance statement and no fixture
carries one, so each falsifier is applied by review or not at all, and R12 holds by construction.

## Exceptions and staleness

There is no policy-level exception mechanism in this release, because no rule exists to except and the
mechanism of item 4 is Phase 4 work. A project that knowingly does not meet a requirement records that
in its own documents. No attestation mechanism exists either (item 4, Phase 4).

**What invalidates a recorded statement, by requirement.** Staleness is not a calendar; a statement
stops being true on a revisit event and nothing prompts anyone.

| Requirement | Invalidated by |
| --- | --- |
| R1 | a source added by a path nobody listed |
| R2 | a source declared and its statement removed |
| R3 | a revisit event (b), (c) or (d) |
| R4 | a revisit event (b) adding material of another origin |
| R5 | a revisit event (b) adding model-produced material, or (d) |
| R6 | a revisit event (d) |
| R7 | the origin becoming known, which makes the unknown record stale |
| R8 | a revisit event (a) |
| R9 | any revisit event |
| R10 | a revisit event (e) |
| R11 | a revisit event (e) |
| R12 | a detector or report being added that states provenance as a result |

**Contradicted by operation.** Finding that a source came from somewhere other than recorded
contradicts the statement and everything resting on it (an evaluation result, a grounding claim) until
re-examined. What follows is item 34's subject (unwritten).

## Additions this standard makes beyond the source

The brief contributes one word, "provenance", inside a bullet of five subjects. It states no requirement,
level or evidence. Authored here, none of it owner-approved:

- **The defined terms** source, provenance statement, origin, use and revisit event, and the scope
  limited to context, corpus, fixture and evaluation input.
- **R1 to R4**: declaration, statement, origin to the extent known, and division by origin.
- **R5 and R6**: marking model-produced material and naming the generator where known.
- **R7 and R8**: unknown recorded as unknown, distinct from an absent statement; the statement names
  what it describes.
- **R9**: the six revisit events and the recorded re-read.
- **R10 and R11**: each use recorded, and the deference to the ML pack, whose form here is this
  document's (the deference itself is the boundary review's).
- **R12**, adapted from the equivalent requirement in Standards 8, 17, 25 and 33.
- **The severities** (R8 and R9 warnings, the rest errors), **exemptibility** (R7, R11, R12 not
  exemptible), **attestability** (all attestable except R12, attesting review and not truth) and the
  **staleness table**.
- **The ruling that this standard ships with no catalog rules**, its three reasons, and no id minted in
  `provenance.`.
- **The exclusions in Scope** as division lines (items 14, 15, 16, 18); where each begins is
  unconfirmed by anyone.

Not authored here: the posture `B`, the owner division and the two sibling files cited are the boundary
review's.

**Open questions, recorded and not answered** (Q26 to Q28 in
[`artifacts/project-plan-breakdown/08-open-questions.md`](../artifacts/project-plan-breakdown/08-open-questions.md)):

- **Q26.** Should a structural rule require `dataSources[].provenance` to be present for each declared
  source, as Standard 11 did for `autonomyTier`, and if so is it this pack's rule when the kind is
  `fine-tuning-set`? The field exists and no rule reads its presence.
- **Q27.** Standard 13 says "training-data provenance is item 12's" while the boundary review gives
  training data to MachineLearningStandards and item 12 to retrieval corpora, fixtures and evaluation
  sets. This standard follows the review and records the discrepancy; Standard 13's remark is not
  edited here.
- **Q28.** Where does provenance end and consent and licensing (item 14) begin, for a statement that
  names a licence?

## Relationship to other standards and ADRs

[Standard 1](01-ai-system-manifest.md) owns the manifest and its `dataSources` field, where R1 to R8 land; R10 has
no field. [Standard 13](13-personal-data-in-ai-systems.md) R1 asks whether a fixture holds real personal
data, a different question about the same source; its remark on training-data provenance is Q27.
[Standard 17](17-evaluation-plans-for-generative-systems.md) records an evaluated subject; where an
evaluation set is one, its origin is this standard's and what it is measured against is that one's.
[Standard 25](25-grounding-and-hallucination-control.md) asks what an output rests on; a retrieved
passage's origin is an input to that question and not its answer.
[Standard 21](21-prompt-and-instruction-security.md) treats a prompt as a committed artifact and
retrieved content as untrusted; nothing here makes any origin trusted.
[Standard 7](07-boundary-with-adjacent-standards.md) R4 and R5 order conflicts and keep ids from
colliding, and [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability
and non-lowering language used above.

Items 14, 15, 16, 18 and 34 are unwritten; the lines drawn above are provisional until they are.
**Outside this pack.** MachineLearningStandards' `03-dataset-provenance.md` and
`04-dataset-versioning.md` are named in Scope with what the boundary review recorded; they are not
crosswalks, nothing in them is restated, and no maintainer has confirmed this reading. No ADR covers this
standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R11 is enforced; R12 holds by construction.**

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R1 to R8 (the place) | `dataSources` exists in `schemas/ai-system-manifest.schema.json` with `name`, `kind`, `synthetic` and `provenance`, and rejects other properties. The schema constrains shape; it does not require any entry or any value to be true |
| R12 | No detector, rule or report in `scripts/`, `rules/` or `ai-policy.yml` reads `dataSources` beyond schema conformance (`lifecycle.manifest-valid`) or reports provenance as a subject; `provenance` in `scripts/catalog.mjs` is the reserved namespace name. No test asserts the absence, so a future detector could break R12 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs` and `scripts/inventory.mjs`. That a document exists is not evidence of any project's provenance |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R2 (presence of a statement) | A structural rule over `dataSources[].provenance`, and an owner decision on Q26 | Decidable and useful; a catalog decision outside this slice, and it would test presence only |
| R3 to R9 | A way to read a project's own production records | The form is the project's; Phase 3 follows the corpus |
| R10, R11 | A place to record each source's use: a schema change or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and plan 02 section 8 records the same boundary for risk-tier fields |
| R12 | A test asserting no detector emits a provenance verdict | Meaningful only once a detector exists for it to constrain |

**What no future release will implement.** A detector that reports a source's provenance established or
verified from a non-empty field, a data card, a licence file or a README line. R12 forecloses it: the
presence of a statement is not the truth of it.
