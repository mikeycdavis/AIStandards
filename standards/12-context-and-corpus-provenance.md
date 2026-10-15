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
prompt fixture or evaluation set: a retrieval index or its source documents, a store of examples, a
fixture directory, a held-out set.

Covers: what a provenance statement must say; the distinction between human-authored and
model-generated material; what happens as a source grows after it was first described; how unknown
origin is recorded; where this standard stops and the provenance of training data begins; and the
limit of what this framework can say about any of it.

Two terms, each defined here rather than by the brief:

- A **source** is a body of material the system or its tests consume as input, as
  `dataSources` in [`schemas/ai-system-manifest.schema.json`](../schemas/ai-system-manifest.schema.json)
  uses the word. It is not a model and not a prompt template, which
  [Standard 21](21-prompt-and-instruction-security.md) treats.
- A **provenance statement** is whatever the project records about where a source came from. The form
  is the project's choice; the manifest's `dataSources[].provenance` is a free-text string and fixes
  none.

It does **not** cover, and claims none of the ground of, the following:

- **The use of a source to train, fine-tune, validate, evaluate or calibrate a model the project
  operates.**
  MachineLearningStandards owns that, per the boundary review's recorded owner; see the posture note.
  The same source used as context stays in Scope (R6).
- **Whether anyone agreed to the use, and on what terms.** Item 14, Consent and Licensing, is
  unwritten in this release. A provenance statement may name a licence; it does not establish that
  the use is permitted.
- **Whether a source holds real personal data.** That is
  [Standard 13](13-personal-data-in-ai-systems.md) R1's, through
  `privacy.no-real-personal-data-in-fixtures`.
- **Retention and deletion** (item 15), **access control** for a source (item 16) and
  **contamination of a benchmark** by a provider's training (item 18), all unwritten.
- **What a retrieved passage supports in an output.** That is
  [Standard 25](25-grounding-and-hallucination-control.md)'s.
- **Whether a source is true.** A statement of origin is not a statement of accuracy.

**Boundary posture B — a baseline, with deference.** The boundary review records the owner as
"MachineLearningStandards for training data; AIStandards for retrieval corpora, prompt fixtures and
eval sets". It cites two files of that pack and this standard reads no more than the review records:

- **MachineLearningStandards, `standards/03-dataset-provenance.md`.** Scope: "Applies to every dataset
  used to train, validate, evaluate, or calibrate a model, including datasets assembled by joining or
  filtering others."
- **MachineLearningStandards, `standards/04-dataset-versioning.md`.** Scope: "Applies to any dataset
  whose contents can change over time".

**The review's reasoning is an inference, and this standard does not depend on it.** It reasons that a
retrieval corpus consulted at inference time by a hosted model is not a dataset used to train,
validate, evaluate or calibrate a model, so that pack's standard 3 does not reach it. Whether it does
is not something this repository has established, and nothing was re-read for this document. This
standard therefore (a) applies to every source in Scope regardless, (b) claims no reading of the ML
pack's reach, and (c) makes the project record how each source is used (R6) rather than infer it. Where
both packs govern a concern, the more specialised requirement governs and the stricter compatible one
applies ([Standard 7](07-boundary-with-adjacent-standards.md) R5; its table row on dataset provenance
reads "Defers. Adds only retrieval corpora, prompt fixtures and eval sets").

**A shared namespace is reserved, not used.** `provenance.` is one of the segments this pack reserves
and has no shard. No rule id is minted here (see Validation).

## Requirements

### R1 — Every source is declared, with an origin

**Each source in Scope MUST be declared as such — named, with its kind — and MUST carry a provenance
statement; a source that is used and not declared is a finding, not an exemption.**

The manifest already has the place: `dataSources` lists `name`, `kind`
(`retrieval-index`, `fine-tuning-set`, `evaluation-set`, `prompt-fixture`, `other`), `synthetic` and
`provenance`. Until this standard no requirement asked for any of it to be filled in, so a schema-valid
manifest could list no sources at all and every check would pass. R1 closes that gap on the human side.

A source reached by a path nobody listed is the usual case, not the odd one: the fixture directory
added for one test, the folder the retrieval job also reads, the evaluation set a colleague keeps
outside the repository. The declaration is what makes such a source discoverable by the next person.

### R2 — The statement says where it came from, in a form that can be checked

**A provenance statement MUST say who or what produced the material, how it was obtained, and when,
to the extent each is known, at a granularity from which a reader could find the original; where
any of these is not known, R5 governs that part and the statement says so. "Internal", "curated"
and "public" are not provenance statements.**

Those three words describe a property of the source, not an origin. The test of a statement is that a
reader who disagrees could go and look: a named system and export, a repository and revision, a
vendor and delivery, a named author group and period. Where the material is a mixture, the statement
says so and divides it, because a source of three origins with one origin recorded has been described
as the most reassuring of them.

### R3 — Model-generated material is marked, with the generator

**A source that contains material produced by a model MUST be declared `synthetic`, MUST name the
model or system that produced it where known, and MUST NOT be described as human-authored; a source of
mixed authorship MUST say which part is which.**

The reason is practical. Synthetic material has different failure properties: it repeats its
generator's errors with confidence, it can be fed back into the system that made it, and an evaluation
set written by the model under test measures agreement with itself. None of that is visible in the text.

`synthetic` is a boolean in the manifest, and the schema has no place for the generator; the name
belongs in the provenance statement. A source that a human edited from model output is still, in part,
model-generated, and says so.

### R4 — The statement tracks the source as it changes

**A provenance statement MUST name the revision, snapshot or period it describes, and MUST be
revisited when material is added to, removed from or replaced in the source, when the source is
regenerated, re-filtered or re-chunked, when the system that produced the material changes, when the
source is put to a use the statement did not contemplate, or when the terms under which it was
obtained change.**

A retrieval index is rarely static. The initial import is documented; the connector added later, the
user uploads, the nightly sync from a wiki are not, and a statement written on day one goes on
describing a source that has since taken in three more. The requirement is not that every addition be
individually recorded; it is that the statement say what it was written about, so that its age is
visible and a new ingestion path is a reason to read it again.

Versioning of a dataset a model is trained on is MachineLearningStandards' subject
(its standard 4, by the boundary review's entry). This requirement states only that a statement is
dated to what it described.

### R5 — Unknown is recorded as unknown

**Where a source's origin is not known, the statement MUST say it is unknown and say what is known
about it; it MUST NOT be completed from a plausible guess, from the source's location, or from the
name of the person who added it.**

This is the repository's standing instruction — do not invent historical intent — applied to data. A
corpus found in a shared drive, a fixture inherited from a previous team and an evaluation set whose
author left are common, and "unknown, found at this path in this month" is a true and useful record.
It tells the next reader that the source is untrusted rather than reassuring them with a guess.

**Absence of a statement is not the same as "unknown".** One is a gap in the record and is a finding
under R1; the other is a fact about the source, and a source declared with a statement that its origin
is unknown satisfies R1 and R5 and is read as an untrusted source, not as a defect in the record.

### R6 — Say how each source is used, and where it develops the project's own model, defer

**A project MUST record, for each source, whether the source itself is used only as context or
fixture input, or is also used to train, fine-tune, validate, evaluate or calibrate a model, and for
any use of the second kind this standard MUST NOT be offered as satisfying MachineLearningStandards'
dataset provenance and versioning requirements.**

The split is by what the *source* is used for, not by who operates the model that consumes it. A
retrieval corpus read at inference time by a model the project trained itself is context, and is in
this standard's Scope; the same corpus used to fine-tune that model, or an evaluation set used to
evaluate a model, is also a development or evaluation source, and the project does not offer this
standard in place of the other pack's requirements for that use. Whether that pack reaches an
evaluation of a hosted model the project did not train is the boundary review's inference and is
recorded as unknown (see the posture note); the requirement is only that the use is stated and no
substitution is claimed. This standard's own requirements apply to the source either way.

The declaration is the project's, not a finding. The manifest's `fine-tuning-set` kind is the signal
that the second use exists, and its presence in a manifest does not by itself decide who operates the
model; the repository shows which sets are listed and says nothing about who trains what. A project
that records both uses for one source has recorded a fact, not hedged.

Where a source has both uses — a corpus that is retrieved from and also used for fine-tuning — each
use is described, and the more specialised requirement governs the training use (Standard 7 R5).

### R7 — This framework MUST NOT report provenance established from the presence of a field

**No detector, rule, audit finding or generated report in this framework MAY state that a source's
provenance is established, documented or verified because a `provenance` string, a data card, a
licence file or a README line is present in the repository.**

A repository can show that a field is non-empty or that a file with a plausible name exists. It cannot
show that the statement is true, that it describes the current contents, or that the material was
obtained as stated. Reporting a pass from presence would put this framework's authority behind a claim
about the world, which is what R5 forbids a project to do with a guess.

Whether a statement of origin is true is a fact about how material was obtained. It is
**not-evaluable** from a repository. Reporting that a field was *found*, as an observation with no
verdict, remains permitted.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Undeclared source | A folder read by the retrieval job and listed nowhere | R1 |
| Origin by adjective | `provenance: curated internal data` | R2 |
| The reassuring part | A three-origin source described by its most trusted origin | R2 |
| Model output as human | Generated Q&A pairs stored as "support team answers" | R3 |
| Self-grading set | An evaluation set generated by the model under test, not marked synthetic | R3 |
| Stale statement | A day-one description of an index that has since taken in uploads and a sync | R4 |
| Guess as origin | "Probably the 2023 export" written into the record | R5 |
| Gap read as unknown | No statement at all, treated as though the origin were known to be unknown | R1, R5 |
| Training use treated as context | A source also used to fine-tune a model, described under this standard and offered as satisfying the ML pack | R6 |
| Presence read as provenance | A framework report of "documented" because the string is non-empty | R7 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The list of sources, set against what the system and its tests actually read | `dataSources` in `ai-system.yml`, and the code and configuration that read data | Human review |
| R2 | The statement for each source, and the original it points to | The manifest's `provenance` or the project document it names | Human review |
| R3 | The `synthetic` declaration and the generator named, set against how the material was made | The manifest and the project's own production records | Human review |
| R4 | The revision or period each statement names, and the list of ingestion paths | The manifest or named document, and the ingestion configuration | Human review |
| R5 | Each statement that says "unknown", and what it records instead | The same | Human review |
| R6 | The recorded use or uses of each source | A project document the project names — **no manifest field exists for it; see Implementation** | Human determination |
| R2 to R5 (truth of the statement) | None obtainable from a repository | — | **Not-evaluable** |
| R7 | The absence of any detector that reports provenance from presence | This repository's own detectors and tests | Code review; see Implementation |

A manifest entry establishes that the project wrote a statement. It does not establish that the
material came from where the statement says; the reviewer reads the statement against the source, the
ingestion code and, where they exist, the project's own production records.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
[Standard 6](06-standard-structure-and-rule-identity.md) R3 requires every standard to cite at least
one rule or record why it does not; this is that record.

Three reasons, stated so a reader can disagree with any one of them:

1. **The one field that exists is free text, and a rule over it would test presence.** The manifest
   carries `dataSources[].provenance` as a non-empty string. A rule that failed a project for an empty
   or missing value is decidable and would be a genuine structural check, as
   `oversight.autonomy-tier-declared` is for Standard 11. It is not added here because whether such a
   rule is wanted, at which level, and whether it is this pack's or the ML pack's where `fine-tuning-set`
   appears, is a decision recorded as Q26 and Q27 below, not a side effect of writing this document. The
   owner's per-rule approval is the route; a proposed rule is in the pull request.
2. **R2 to R5 concern whether a statement is true and current.** That is a property of how material was
   obtained and how a source has changed since, not of source text. A detector reading the repository
   would test that a string is non-empty or that a licence file exists, which R7 forbids this framework
   from reporting as a result.
3. **No id is minted in a reserved namespace that has no shard.** `provenance.` is reserved and unused;
   naming the first id is a catalog decision made once, with the rule's level and validation type, not
   made here.

**Severity and validation type.** No rule exists, so none of the following is a reported result in
this release; the table states what each requirement is and the severity a breach would carry were a
rule minted, so that a consumer classifies it consistently.

| Requirement | Validation type | Severity of a breach | Not-applicable declaration | Exception for a knowing breach |
| --- | --- | --- | --- | --- |
| R1 | manual-review | error | yes, where no source is in Scope | yes |
| R2 | manual-review | error | yes, as R1 | yes |
| R3 | manual-review | error | yes, as R1 | yes |
| R4 | manual-review | warning | yes, as R1 | yes |
| R5 | manual-review | error | yes, as R1 | no |
| R6 | manual-review | error | yes, as R1 | yes |
| Truth and currency of any statement (R2 to R5) | not-evaluable | none reported; not scored | yes, as R1 | not attestable |
| R7 | manual-review (code review of this repository, since it constrains this framework) | error for this repository's changes; not applicable to a consuming project | not applicable | no |

R7 constrains a behaviour of the tool, which a consuming project cannot breach; it is reviewed in this
repository's own changes. An exception mechanism does not exist in this release (Standard 4 is Phase 4),
so the right-hand column states what would be permitted, not what can be recorded.

**Exemptibility.** R7 is not exemptible: no project circumstance makes it reasonable for a scan to
report an origin from a string, and a mechanism for excepting the prohibition would be
self-defeating. R5's prohibition on completing an unknown origin from a guess is likewise not
exemptible, because an exception would record a project as knowingly inventing a history. R1 to R4 and
R6 reach a system only where it has a source in Scope, and a system with none may declare the
requirement not-applicable under [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 with a reason
and a `revisitWhen`; adding a retrieval index or an evaluation set is that event. No detector in this
release would contradict a false declaration. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Every path the system and its tests read as data corresponds to a declared source | A directory read by the retrieval job that no declaration names | A source declared and not currently read must **not** be failed for that |
| R2 | For each component of origin that is known, a reader can locate the original from the statement; each component that is not known is stated as unknown under R5 | A statement consisting of an adjective such as "internal" or "curated" | A statement naming a system, an export and a date must **not** be failed for being short |
| R3 | A source containing model output is `synthetic` and names its generator | A source of generated pairs declared human-authored | A human-written source declared `synthetic: false` must **not** be flagged |
| R4 | The statement names a revision or period, and each listed event (addition, removal, replacement, regeneration, a changed generator, a new use, changed terms) prompts a re-read | A statement older than an event it does not mention | A source whose statement names its snapshot and has had none of those events must **not** be flagged for age |
| R5 | An unknown origin is stated as unknown, with what is known | A guess recorded as an origin | A statement "unknown, found at this path" must **not** be failed for being unknown |
| R6 | The recorded use is present for each source and not derived from file names | A use inferred from the presence of a `fine-tuning-set` entry | A source recorded as used both as context and for fine-tuning, with a reason, must **not** be treated as hedging; a corpus read by the project's own model and not used to train it must **not** be failed |
| R7 | No detector or report in this repository outputs a provenance verdict from presence | A detector that reported "documented" because a `provenance` string was non-empty | Reporting that a field was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads `dataSources` and no fixture carries a
provenance statement, so R1 to R6 are enforced by review or not at all, and R7 holds by construction.
The negative controls state what review must not do to a project that has the right subject and does
the right thing. **A requirement with no falsifier is a requirement nobody can be shown to have
broken**, and that is the honest state of this standard.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R6 in this release, because no rule exists to
except, and the exception mechanism of Standard 4 is Phase 4 work and not implemented. A project that
knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the
application of a rule, and this standard has none.

**What invalidates a recorded provenance statement.** Each of these changes what the source is, and a
statement made before the change describes the earlier source:

- material added to or removed from a source by a path the statement did not name — a connector, an
  upload, a sync, a re-export;
- the source being regenerated, re-filtered or re-chunked by a different process;
- a change of the system that produced the material, including a change of the generating model;
- the source being used for a purpose the statement did not contemplate, such as a retrieval corpus
  being used to fine-tune, which makes R6's recorded use false at once;
- a licence or terms change in the origin, which is item 14's subject and is noted here only because it
  makes the origin statement incomplete.

**Staleness is not a calendar.** A statement does not expire with time; it stops being true when one
of the above happens, and nothing prompts anyone. Nothing in this release detects the transition; the
events above are a note to a future reader.

**Contradicted by operation.** Finding that a source's content came from somewhere other than recorded
contradicts the statement and invalidates it until re-examined, and everything resting on the source —
an evaluation result, a grounding claim — is affected. What happens operationally is item 34's subject
(AI Incident Response, unwritten in this release); this standard says only that the record no longer
stands.

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one word, "provenance", inside a bullet of five subjects.
It states no requirement, level or evidence for any of them. The item is class `D` because its subject
token is derived from the brief; the requirements are not derived. Specifically authored here, none of
it owner-approved:

- **The terms** source and provenance statement, and the scope limited to context, corpus, fixture and
  evaluation input. The brief does not say whose data or which uses.
- **R1 in full**: that each source is declared and carries a statement, and that an undeclared source
  is a finding.
- **R2's test** that a reader could find the original, and the ruling that "internal", "curated" and
  "public" are not provenance statements.
- **R3 in full**: that model-generated material is marked, with its generator, and that mixed
  authorship says which part is which.
- **R4 in full**: that a statement names the revision or period it describes and is revisited on a new
  ingestion path.
- **R5 in full**: that unknown is recorded as unknown and distinguished from an absent statement.
- **R6's declaration** of how each source is used, split by the source's use rather than by who trained the model, and the deference for a training use.
  The deference is the boundary review's finding; its form in R6 is this document's.
- **R7**, the constraint on this framework, in the same form as the equivalent requirement in
  [Standard 8](08-ai-safety-requirements-and-safety-cases.md),
  [Standard 17](17-evaluation-plans-for-generative-systems.md),
  [Standard 25](25-grounding-and-hallucination-control.md) and
  [Standard 33](33-ai-observability.md).
- **The exclusions in Scope** as division lines, including items 14, 15, 16 and 18. Where each begins
  is unconfirmed by anyone.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it and the
  decision to mint no id in the reserved `provenance.` namespace.
- **The open questions below.**

Not authored here: the posture `B`, the owner division and the two sibling files cited are the
boundary review's. The statement of the review's reasoning as an inference is this document's.

**Open questions, recorded and not answered** (Q26 to Q28 in
[`artifacts/project-plan-breakdown/08-open-questions.md`](../artifacts/project-plan-breakdown/08-open-questions.md)):

- **Q26.** Should a structural rule require `dataSources[].provenance` to be present for each declared
  source, as Standard 11 did for `autonomyTier`, and if so is it this pack's rule when the entry's kind
  is `fine-tuning-set`? The field exists and no rule reads it.
- **Q27.** Standard 13 says "training-data provenance is item 12's" while the boundary review gives
  training data to MachineLearningStandards and item 12 to retrieval corpora, fixtures and evaluation
  sets. Which is intended? This standard follows the review and records the discrepancy; Standard 13
  is not edited here.
- **Q28.** Where does provenance end and consent and licensing (item 14) begin, for a statement that
  names a licence?

## Relationship to other standards and ADRs

[Standard 1](01-ai-system-manifest.md) owns the manifest and its `dataSources` field, which is where
R1 to R3 land; this standard asks that the field be used and says what a statement in it must contain.
[Standard 13](13-personal-data-in-ai-systems.md) R1 asks whether a fixture holds real personal data,
which is a different question about the same source; its remark on training-data provenance is
Q27 here. [Standard 17](17-evaluation-plans-for-generative-systems.md) records an evaluated subject;
where an evaluation set is one, its origin is this standard's and what it is measured against is
that one's. [Standard 25](25-grounding-and-hallucination-control.md) asks what an output rests on, and
a retrieved passage's origin is the input to that question without being its answer.

[Standard 21](21-prompt-and-instruction-security.md) treats a prompt as a committed artifact and
retrieved content as untrusted; a source's declared origin is one fact a reader may use to decide how
far to trust it, and nothing here makes any origin trusted. [Standard 7](07-boundary-with-adjacent-standards.md)
R4 and R5 order conflicts and keep ids from colliding, and
[Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and
non-lowering language used above.

Items 14, 15, 16, 18 and 34 are unwritten in this release; the lines drawn above are provisional until
they are, and the later standards may legitimately move them.

**Outside this pack.** MachineLearningStandards' standards 3 (dataset provenance) and 4 (dataset
versioning) are named in Scope with what the boundary review recorded. They are not crosswalks, nothing
in them is restated, and no maintainer of that pack has confirmed this reading. No ADR covers this
standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R6 is enforced; R7 holds by construction.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away
as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R1 to R3 (the place) | `dataSources` exists in `schemas/ai-system-manifest.schema.json` with `name`, `kind`, `synthetic` and `provenance`, and rejects other properties. The schema constrains shape; it does not require any entry or any value to be true |
| R7 | **Holds by construction, not by assertion.** No detector, rule or report in `scripts/`, `rules/` or `ai-policy.yml` reads `dataSources` or reports provenance as a subject; the string `provenance` in `scripts/catalog.mjs` is the reserved namespace name and names an identifier prefix and no check. No test asserts the absence, so a future detector could break R7 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's provenance |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 (presence of a statement) | A structural rule over `dataSources[].provenance`, and an owner decision on Q26 | Decidable and useful; adding it is a catalog decision outside this slice, and it would test presence only |
| R2 to R5 | A way to read a project's own production records | The form is the project's; Phase 3 detector and evidence-availability work follows the corpus |
| R6 | A place to record each source's use: a schema change or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R7 | A test asserting no detector emits a provenance verdict | Meaningful only once a detector exists for it to constrain |

**What no future release will implement.** A detector that reports a source's provenance established,
documented or verified from a non-empty field, a data card, a licence file or a README line. R7
forecloses it, and the foreclosure is the point: the presence of a statement is not the truth of it,
and a framework reporting otherwise would put its authority behind a claim about how material was
obtained that nothing in a repository can show.
