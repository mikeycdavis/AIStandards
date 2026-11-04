# Standard 15 — Retention, Deletion, and Memorization

An AI system keeps more than its database. Prompts, completions and traces are written to logs; context is copied into vector stores and caches; interactions become evaluation sets and fine-tuning data; a hosted provider holds its own copy under its own terms; and a model that was trained or fine-tuned on any of it may be able to reproduce it. A deletion routine written for the primary store knows about none of these, and a retention period stated for one of them says nothing of the others.

This standard is about **how long, how it ends, and what survives**. It asks that a project say for what period each model-adjacent store keeps data and on what basis; that something apply the period; that derived copies, backups and provider-held copies be accounted for rather than assumed gone; that the use of data in training be recorded, because a model's weights are a store that deletion does not reach; and that no one claim a model does not remember its training data without a test to point to. It sets no period, no schedule and no memorization threshold.

The failure it is written against is a deletion that is reported as complete: "the user's data has been deleted", "we do not retain prompts", "the model does not memorize customer data". Each may be true of something. None says of what.

Source: item 15 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "retention" token of the "Data privacy, provenance, consent, retention, and access
control" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 15 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) under items posture O after a
> search of the nine packs found no owner, and that review's substantive half is human judgment and
> carries `humanSignOff: null`. No maintainer of any adjacent pack has confirmed it.
>
> **The brief supplies one word and this standard supplies the rest.** The brief's bullet names
> "retention" among five subjects and states no requirement for it; the title's "deletion" and
> "memorization" are the specification's. The item is class `D` because its token is the brief's own;
> the requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.
>
> **The placement of two rules is not decided here.** `privacy.retention-declared` and
> `privacy.deletion-path-exists` cite [Standard 13](13-personal-data-in-ai-systems.md), and nothing
> recorded explains why they do not cite this item. That question is open (Q10 in
> `artifacts/project-plan-breakdown/08-open-questions.md`). This standard moves no rule, reattributes
> none and changes no specification row; it is written as prose, on the owner's decision of 2026-10-15,
> so that the question can be answered with this text in front of the owner.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it — a repository that invokes a model, retrieves context for one, or acts on a model's output — that keeps, or sends to a provider that may keep, prompts, completions, retrieved context, traces, evaluation sets or training data.

Covers: the period and basis of retention for each model-adjacent store; what applies the period; derived copies and backups; provider-held copies; whether data was used in training or fine-tuning; and claims about deletion and about memorization. It sets no retention period, no schedule and no memorization threshold.

Terms, each defined once here and used verbatim below:

- **Store** — any place the system or a provider on its behalf keeps data that came from or goes to a model: prompt and completion logs, traces, caches, vector stores, evaluation sets, fine-tuning sets, exports and backups of any of these.
- **Derived copy** — data computed from another store's content that can identify or reconstruct it: an embedding, a summary, a cache entry, a cleaned or labelled copy, an index.
- **Retention record** — the committed document in which a project states, per store, the period, the event it runs from, the basis for it and what ends it. No manifest or policy field exists for it.
- **Provider-held copy** — data a model provider or other third party keeps under its own terms.
- **Training use** — use of data to train, fine-tune, adapt or align a model, whether by the project or by a provider on its behalf.
- **Memorization test** — a recorded attempt to elicit training or fine-tuning data from a model, naming its method, the model version tested and the date.

It does **not** cover, and claims none of the ground of:

- **Whether a store may hold personal data at all**, or that a deletion path reaches every model-adjacent store on request. [Standard 13](13-personal-data-in-ai-systems.md) states those (R4 and R5 there); this standard does not restate them, and the placement of their rules is open.
- **Consent and licensing.** Item 14 is the unwritten owner of consent to use data, including to train on it.
- **Training-data provenance.** [Standard 12](12-context-and-corpus-provenance.md) and, for training data, the machine-learning pack own it.
- **Who may read a store.** Item 16 owns access control.
- **What a trace or call record contains.** [Standard 33](33-ai-observability.md) governs it.
- **Statutory retention periods or deletion deadlines.** What a law requires is not asserted here.

**Boundary posture O — owned outright.** The boundary review records that a search of the nine packs found no owner for this item. This document accepts that record for what a repository can establish — that a retention record, a mechanism, a coverage statement and a test record exist and say what the requirements ask — and narrows it there: whether data was in fact deleted, whether a provider keeps a copy, and whether a model remembers a given record are not properties of a checkout. R1 to R6 are `manual-review` obligations. It adds no precedent to the review's.

## Requirements

### R1 — Give each store a period, its starting event and its basis

**A project MUST state, in a retention record, for each store that holds prompts, completions, retrieved context, traces, evaluation sets or training data: the retention period, the event it runs from, and the basis for it; a store kept without end MUST be recorded as kept without end, with the reason.**

"Thirty days" without a starting event is two different periods. A period with no basis cannot be reviewed, because nothing says what it was meant to serve. The requirement does not choose a period or accept a reason; it requires that both be written down. "Indefinite" is a permitted answer when it is stated as the answer. A store silent on all three is the failure.

### R2 — Name what applies the period

**A retention record MUST name, for each store with a finite period, the mechanism that deletes data when the period ends, and MUST NOT rely on the period alone.**

A period nobody applies is a wish. The mechanism can be a time-to-live setting, a scheduled job, a lifecycle policy or a documented manual procedure with an owner; the requirement is that one is named. This is the deletion that expiry causes. The deletion a person's request causes is the path of Standard 13 R5, and a store may need both.

### R3 — Account for derived copies and backups

**A retention record MUST state, for each store, whether deletion from it also deletes its derived copies and its backups, and where it does not, the period and mechanism that apply to the copy.**

An embedding of a deleted record is still an embedding of it. A backup is a store with its own period, usually longer than the live one, and a deletion that stops at the live store has changed the answer to "is it kept" without anyone saying so. "Deletion removes the live copy; backups expire at ninety days by lifecycle policy" is a complete statement. A record that names live stores only, with no statement on derived copies or backups, is not.

### R4 — Record provider-held copies as held, not held, or unknown

**A retention record MUST state for each provider that receives data from the system whether a provider-held copy exists, and its period and the terms and revision or date it rests on, or that this is unknown; a deletion MUST NOT be reported as covering a provider-held copy unless the record shows that the provider's deletion was requested or its terms provide for it.**

The project's own deletion cannot reach a copy it does not control, and a provider's terms change. "Zero retention" is a claim about a provider's terms for a given account and endpoint; it names whose terms, which, and at what revision or date, or it is recorded as unknown. An unknown carried as unknown is accounting. An unknown reported as "deleted" is the failure.

### R5 — Record whether data was used in training

**A project MUST record, for each store whose content can be personal, confidential or licensed data, whether it has been used for training use (it has, it has not, or this is unknown), and MUST NOT state or imply that deleting data from a store removed it from a model that had training use of it, unless the record names the model version retrained or replaced after the deletion.**

Deleting a training example does not change weights already trained on it. A model is a store that deletion does not reach; saying so is not an obstacle to deletion but a statement of what the deletion did. Where the answer is "has not" for a hosted provider, it follows R4: whose terms, at what revision or date. The requirement does not forbid training on any data; item 14 and Standard 13 govern whether it may happen.

### R6 — Support a claim that a model does not retain training data

**A project MUST NOT state or imply that a model it trained, fine-tuned or deploys does not memorize, retain or reproduce its training data unless the statement names a memorization test, and the test's model version MUST be the one the statement describes.**

Absence of observed reproduction is a result of a method, not a property of the model. The requirement does not set a test, a threshold or a rate; it requires that the claim name the test it rests on, and that a test of an earlier model version not be offered as evidence about the current one. A project that makes no such claim and records that it has not tested is meeting the standard, not failing it.

### R7 — This framework MUST NOT report retention or deletion from the presence of a setting

**No detector, rule, audit finding or generated report in this framework MAY state that data is deleted, that retention is bounded or adequate, that a provider keeps no copy, or that a model does not memorize, because a time-to-live value, a delete endpoint, a zero-retention flag, a lifecycle policy or a declaration is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that a retention setting exists; it cannot show that data was deleted, that a backup expired or that a provider honoured its terms. Reporting a deletion or an absence of memorization from a presence would turn a setting into an outcome. Reporting that a setting was *found*, as an observation with no verdict, is permitted.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Store without a period or basis | A log, trace or vector store with no stated period, or a period with no starting event or no basis; or indefinite retention not recorded as such | R1 |
| Period nobody applies | A finite period with no named mechanism, or a mechanism named for some stores and not others | R2 |
| Deletion that stops at the live store | A record naming primary stores only; embeddings, caches, summaries or backups kept after the source is deleted, with no statement | R3 |
| The provider's copy assumed gone | A deletion reported as complete where a provider received the data and its retention is not recorded; "zero retention" with no terms, revision or date | R4 |
| Weights treated as deleted | A fine-tuned model still in service after the data it was tuned on was deleted, described as no longer containing it; training use of a store not recorded | R5 |
| Memorization denied without a test | "The model does not memorize our data" naming no test; a test of an earlier model version offered for the current one | R6 |
| Setting read as outcome | A framework report of "retention bounded" or "data deleted" because a time-to-live value or a delete endpoint is present | R7 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The retention record: each store with its period, starting event and basis, or its recorded absence of an end and the reason | A committed document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | The mechanism named for each finite period, and the configuration it names | The retention record; the store's lifecycle or job configuration | Human review. Whether the mechanism ran is an operational fact the repository does not hold |
| R3 | The statement, per store, on derived copies and backups, and the period and mechanism for each copy kept | The retention record | Human review |
| R4 | Per provider: the held, not-held or unknown statement, and the terms with revision or date it rests on; any request made for a deletion | The retention record; the provider's terms as the project cites them | Human review |
| R5 | Per store, the training-use statement; where a deletion is described, the model version retrained or replaced | The retention record; the model's release or registry record | Human review |
| R6 | Each non-retention claim with the memorization test it names, its method, model version and date | The project's documentation and public statements | Human review |
| R7 | The absence of any detector, rule, audit finding or generated report that reports deletion, bounded retention or non-memorization from a setting | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R6 is a human-authored record. A document stating a period and a mechanism establishes that the project wrote them down. That data was deleted, that a backup expired, that a provider honoured its terms and that a model does not reproduce a record are not established by any record in a repository, and are not-evaluable here.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 to R5 would look for a retention record, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place to put one; both are closed. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. [Standard 13](13-personal-data-in-ai-systems.md) records the same fact about `privacy.retention-declared`. Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **The subject is an outcome this framework cannot observe.** Deletion, expiry, a provider's conduct and a model's memory are not properties of a checkout. A detector could only read a setting, which R7 forbids this framework from reporting as a result.
3. **The rule placement is an open question, and this standard does not pre-empt it.** `privacy.retention-declared` and `privacy.deletion-path-exists` already exist under Standard 13; whether they belong here is Q10. Minting a rule for R1 or R2 would either duplicate those two or decide the question. This standard mints no id and moves none; naming one is a decision for the owner. A proposed rule, if one is natural, is recorded in the pull request that introduced this document for per-rule approval, and not here.

**Validation type.** R1 to R6 are `manual-review` obligations in this release; R7 constrains this framework and has no validation type, because the thing it prohibits is a behaviour of the tool. The validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | warning |
| R2 | warning |
| R3 | warning |
| R4 | error |
| R5 | error |
| R6 | error |
| R7 | error |

**Exemptibility.** R7 is not exemptible, for the reason R6 of [Standard 25](25-grounding-and-hallucination-control.md) is not. R4, R5 and R6 are not exemptible, because an exception would record a project as knowingly making a claim nothing supports. R1 to R3 reach a system only where it keeps a store, and a system that keeps none, and sends none to a provider that may, records in its own documents that they do not reach it and why. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each store holding prompts, completions, retrieved context, traces, evaluation sets or training data has a period, a starting event and a basis, or is recorded as kept without end with a reason | A store with no period; a period with no starting event or no basis; or indefinite retention not recorded as indefinite | A store recorded as kept without end, with the reason, must **not** be faulted for the length of the retention; a long stated period must **not** be faulted |
| R2 | Each store with a finite period names the mechanism that applies it | A finite period with no named mechanism | A store recorded as kept without end must **not** be faulted for naming no expiry mechanism |
| R3 | For each store, the record states whether deletion reaches its derived copies and its backups and, where it does not, the period and mechanism for the copy | A record naming no derived-copy or backup treatment for a store; or a copy kept with no period or mechanism | A backup recorded as expiring on its own longer period, with the mechanism, must **not** be faulted for outliving the live store |
| R4 | Each provider receiving data has a held, not-held or unknown statement, with period and terms and revision or date where held or not held; a deletion described as covering a provider copy shows the request or the terms | A provider with no statement; "zero retention" or "not held" with no named terms or no revision or date; a deletion reported as covering a provider-held copy with neither a request nor terms | A provider recorded as unknown, with no claim made about its copy, must **not** be faulted |
| R5 | Each store whose content can be personal, confidential or licensed has a training-use statement; a description of a deletion's effect on a model names the retrained or replaced version | A store with no training-use statement; a deletion described as having removed data from a model with no named retrained or replaced version | A store recorded as used in training, with the model version, must **not** be faulted for having been used |
| R6 | Each claim that a model does not memorize, retain or reproduce training data names a memorization test whose model version is the one described | Such a claim naming no test, or naming a test of a different model version | A project making no such claim and recording that it has not tested must **not** be faulted |
| R7 | No detector, rule, audit finding or generated report in this repository states deletion, bounded retention, absence of a provider copy or non-memorization from presence | A detector, rule, finding or report that states any of these because a time-to-live value, delete endpoint, zero-retention flag, lifecycle policy or declaration is present | Reporting that a retention setting was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries one, so R1 to R6 are enforced by review or not at all, and R7 holds today only because no such detector exists. The falsifiers in the table are available for manual review; what this release lacks is a detector that applies them. A record made stale by the event in the staleness table below does not satisfy the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R6 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | Any change to anything this record names or relies on, including: a new store, or a change of a store's period, starting event or basis. |
| R2 | Any change to anything this record names or relies on, including: a change of the mechanism or of the store it applies to. |
| R3 | Any change to anything this record names or relies on, including: a new derived copy or backup, or a change to a backup's period. |
| R4 | Any change to anything this record names or relies on, including: a new provider or a new revision of a provider's terms. |
| R5 | Any change to anything this record names or relies on, including: a new training or fine-tuning run, or a change of the data feeding one. |
| R6 | Any change to anything this record names or relies on, including: a new model version, for a claim that describes the current one. |
| R7 | A new detector, rule or report that touches retention, deletion or memorization. |

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one word, "retention", inside a bullet of five subjects and states no requirement, level or evidence for it; "deletion" and "memorization" come from the specification's title. The item is class `D` because its subject token is derived from the brief; the requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1 to R6 in full**, with the defined terms store, derived copy, retention record, provider-held copy, training use and memorization test, the three-part statement of a period (length, starting event, basis), the permission to record a store as kept without end, and the held, not-held or unknown statement for providers.
- **R7**, the constraint on this framework, in the same form as the equivalent requirement in [Standard 25](25-grounding-and-hallucination-control.md), [Standard 33](33-ai-observability.md) and [Standard 43](43-environmental-impact-accounting.md).
- **The division from Standard 13**: that expiry-driven deletion (R2) is this standard's and request-driven deletion is Standard 13 R5's, and that this standard restates neither of that standard's rules. The division is a drafting choice and has not been confirmed by the owner.
- **The exclusions in Scope as division lines**, including the exclusion of statutory periods, which no one has confirmed.
- **That this standard sets no period, schedule or memorization threshold.**
- **The severity assignments** (one level per requirement, in Validation), the statement that no attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the decision to name no rule id.

Not authored here: the posture, and the observation that no pack owns the subject, are the boundary review's. The question whether Standard 13's two rules belong to this item is not answered by this standard.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) lists the subjects this pack owns and the packs that own the others; the boundary review records that no pack owns this item, so it has no counterpart to defer to or crosswalk. [Standard 13](13-personal-data-in-ai-systems.md) states `privacy.retention-declared` (R4) and `privacy.deletion-path-exists` (R5) and leaves periods, schedules, backups and memorization to this item; R1 to R6 here build on a retention declaration and a deletion path and do not restate them, and where Standard 13 asks that retention be declared, R1 here asks what the declaration contains. Whether those two rules move is open (Q10) and is not decided here. [Standard 12](12-context-and-corpus-provenance.md) governs where context and corpora come from. [Standard 33](33-ai-observability.md) governs what a call record carries; R1 and R3 here depend on its trace stores being identified and do not restate it. Item 14 (consent and licensing) and item 16 (access control) are unwritten and are not part of this change. [Standard 1](01-ai-system-manifest.md) declares models, prompts, data sources and tools and declares no retention field; none is proposed by this standard. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and non-lowering language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests section answers. **Outside this pack.** No adjacent pack's standard is recorded for this subject. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R6 is enforced; R7 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R7 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` reports deletion, bounded retention, provider non-retention or non-memorization from a setting. |
| Existing rules | `privacy.retention-declared` and `privacy.deletion-path-exists` exist in `rules/privacy.json` under Standard 13. Neither has a detector; each reports not-evaluated. This standard adds nothing to them |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 to R5 | A place to declare a retention record: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R6 | A check that a non-memorization claim names a test | Reading intent from free text is a heuristic, and a false positive teaches a project to write whatever passes |
| R7 | A test asserting no detector, rule, audit finding or report emits a deletion, retention or memorization verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | A reserved-namespace id and a shard, or a decision to move Standard 13's two rules, once an owner decides | Not decided (Q10); this standard names none |

**What no future release will implement.** A detector that reports data as deleted, retention as bounded, a provider as holding no copy, or a model as not memorizing, from the presence of a time-to-live value, a delete endpoint, a zero-retention flag, a lifecycle policy or a declaration. R7 forecloses it, and the foreclosure is the point: a presence is not an outcome.
