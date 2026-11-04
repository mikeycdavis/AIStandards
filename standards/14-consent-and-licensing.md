# Standard 14 — Consent and Licensing

An AI system is built from, and fed with, material other people made or other people are about:
documents a model was trained on, records a model retrieves, messages users typed into a product, and
the weights of a model someone else released. Whether the project may use that material in the way it
does depends on a permission: a person's consent, a rights holder's licence, or a contract. That
permission is held by someone else, is usually granted for one purpose, and can end. The project that
relies on it often cannot say, a year later, what it relied on.

This standard is about the **record of the permission**, not the permission. It asks that a project
using material in an AI system write down, for each use, what it relies on, what that covers, and when
it ends, so that a use with no recorded basis is visible as one. It does not say what the law requires,
does not decide whether a licence permits a particular use, and does not make any use permissible.

The failure this standard is written against is a permission assumed from a circumstance: "it was on
the public web", "it has an open licence", "users accepted the terms". Each may be true of something.
None says of what use.

Source: item 14 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "consent" token of the "Data privacy, provenance, consent, retention, and access
control" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 14 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passes the two Phase 2 blocking reviews — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded
> in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) as an item for which the
> review searched the nine packs and found no owner, and that review's substantive half is human
> judgment and carries `humanSignOff: null`. No maintainer of any adjacent pack has confirmed it.
>
> **The brief supplies one word and this standard supplies the rest.** The brief's bullet names
> "consent" and states no requirement for it. The word "licensing" is in the specification's title for
> the item and is not a token of the brief. The item is class `D` because its token is the brief's
> own; the requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it — a repository that invokes a model, retrieves context for one, or acts on a model's output — where the project relies on a permission, or on the absence of a need for one, to use material in that system.

Covers: the record of the basis on which material is used; the scope of what that basis covers; the end of a basis; the circumstance of being publicly available; the terms of a model used under licence; and the limit of what this framework can say about any of it. It gives no legal advice and decides no lawfulness.

Terms, each defined once here and used verbatim below:

- **Use** — what the project does with material in or for the AI system: train, fine-tune, evaluate, retrieve into context, send to a third-party provider, retain for improving a model, or publish or redistribute.
- **Permission basis** — what the project relies on for a use: a person's consent, a licence, a contract or terms, a statement that no permission is needed with the reason, or **unknown**.
- **Grant scope** — the uses a permission basis covers, as written in the consent, licence or terms it came from.
- **Permission record** — for one source and one use: the source, the use, the permission basis, who granted it, the grant scope, and the revision or date of the document it rests on.

It does **not** cover, and claims none of the ground of:

- **Where material came from.** [Standard 12](12-context-and-corpus-provenance.md), Context and Corpus Provenance, owns the statement of origin. A provenance statement that names a licence is a statement of origin, and is not a permission record.
- **Whether personal data may be stored or sent.** [Standard 13](13-personal-data-in-ai-systems.md) owns what an AI system holds about real people; nothing here makes a use of personal data permissible.
- **How a user is asked for consent**, or how consent is displayed. That is UIUXDesignStandards' ground, under `privacy.no-deceptive-consent`; this standard asks only whether a basis is recorded.
- **Retention, deletion and unlearning.** Item 15, Retention, Deletion, and Memorization, owns what happens to data after a permission ends.
- **Who may read a source.** Item 16, Access Control for Models, Context, and Tools, owns it.
- **Software dependency licences** and the licence of the project's own code, which are not an AI-specific subject.

**Boundary posture O — owned outright.** The boundary review lists item 14 among the items for which it searched every pack's rules and standards file names for the subject's terms and found no owner. This document accepts that record for what a repository can establish — whether a permission really exists, covers the use, and is valid — and narrows it there: that a permission record is present, names its scope and states its end is a reviewable record, so R1 to R5 are `manual-review` obligations. It adds no precedent to the review's.

## Requirements

### R1 — Record the permission basis for each use

**Each use of a source in or for the AI system MUST have a permission record, and a use whose basis is not known MUST be recorded as unknown and not as permitted.**

A project that has no record cannot tell whether it has no permission or has not looked. Recording **unknown** is accounting; an unknown filled in with a plausible basis and no label is the failure. The requirement does not ask the project to have a permission for every use, and does not judge a basis; it asks that the one relied on be written next to the use. A source the project does not hold, such as the training data of a hosted model, is recorded as unknown for the project's own uses of it and need not be investigated by this standard.

### R2 — Name what the grant covers and the use made

**A permission record MUST state the grant scope, and a basis MUST NOT be recorded as covering a use its grant scope does not name.**

A consent given to receive a service is not a consent to train on what was said; a licence to read a work is not a licence to train a model on it; terms for a model's output are not terms for its weights. The requirement does not decide whether a scope reaches a use. It requires that the scope be written down, so that a reader can compare the two and a use outside it is seen as outside it. A use that is a different use from the one the basis was recorded for is a use with no record.

### R3 — State when a permission ends and who is affected by it

**A permission record MUST state the condition under which its basis ends, whether by expiry, withdrawal, revocation or a change of terms, or that no condition is stated, and MUST name the uses that rest on it.**

Consent can be withdrawn, a licence can lapse or be changed, and a provider's terms are revised. The requirement is not that a project act on an ending; deleting data or removing a model's reliance on it is item 15's ground. It is that the record say what would end the basis, so that an ending is not discovered after the use has continued. "No condition is stated" is a legitimate entry and is different from leaving the field out.

### R4 — Do not record availability as a permission basis

**A permission record MUST NOT give as its basis only that the source is publicly available, publicly accessible, indexed, scraped or downloadable.**

Being able to fetch material is not a grant to use it. A source may well carry a permission, and a record may name it; what the requirement forbids is recording the circumstance in place of the basis. Where the project relies on a statement that no permission is needed, R1 allows it to say so with the reason; the reason is then the basis, and availability alone is not a reason.

### R5 — Record the terms of a model used under licence

**Each third-party model whose weights or output the project uses MUST have its licence or terms of use named in a record, with the revision or date, and each restriction the record's author knows to bear on the project's use MUST be listed.**

Model licences differ in attribution, redistribution, acceptable-use and output-use conditions, and a model's identifier can change behind an alias. The requirement does not interpret the licence. It requires that the document be named, dated and read for restrictions, and that a restriction found be written down beside the use it bears on. A record with an empty restriction list records that none was found by its author, and is a statement and not a finding.

### R6 — This framework MUST NOT report a permission from the presence of a file or flag

**No detector, rule, audit finding or generated report in this framework MAY state that a use is permitted, licensed, consented to or lawful because a licence file, a licence identifier, a consent flag, a terms-accepted field or a declaration is present in the repository.**

This is a constraint on the framework, not on a project, in the same form as
[Standard 12](12-context-and-corpus-provenance.md) R12. A repository can show that a licence file is present or that a field is true. It cannot show that the licence is the source's, that its terms cover the use, that anyone consented, or that the consent is still in force. A report MAY state, worded as presence only, that a licence file or a record is present. Whether a permission exists and covers a use is **not-evaluable** from a repository.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Use with no permission record | A source fine-tuned on, retrieved from or sent to a provider with nothing recorded against that use; or a basis left blank, or an unknown recorded as permitted | R1 |
| Basis stretched past its grant | A record naming a licence or consent whose written scope does not name the use made; a record with no grant scope; or a basis for one use recorded as covering another | R2 |
| Permission with no end | A record naming no condition for expiry, withdrawal, revocation or a change of terms and not saying that none is stated; or one that names no uses resting on it | R3 |
| Availability recorded as the basis | A record whose only basis is "public", "scraped", "downloadable" or "indexed" | R4 |
| Model licence unrecorded | A third-party model in use with no licence or terms named; a licence with no revision or date; or a known restriction not listed beside the use it bears on | R5 |
| Permission read from a file | A framework report that a use is licensed or consented to because a licence file or a flag is present | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | A permission record for each use of each source, with unknown entered as unknown | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | The grant scope in each record, and each use made checked against it | The same document | Human review |
| R3 | The ending condition in each record, and the uses named as resting on the basis | The same document | Human review |
| R4 | The basis in each record, read for a basis that is only availability | The same document | Human review |
| R5 | The licence or terms of each third-party model, with revision or date, and the restriction list | A project document the project names; Standard 1's manifest declares models and carries no field for it | Human review |
| R6 | The absence of any detector, rule, audit finding or generated report that reports a permission from presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R5 is a human-authored record. A document naming a consent or a licence establishes that the project wrote it down. Whether the permission exists, is valid, is the source's, and covers the use is not established by any record in a repository, and is not-evaluable; this framework cannot observe whether anyone agreed.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 to R3 or R5 would look for a permission record, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place to put one; both are closed. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **The subject is a fact this framework cannot observe.** Whether a person consented, or a licence covers a use, is not a property of a checkout. A detector could only read a file or a flag, which R6 forbids this framework from reporting as a result; the boundary review records the item as an own-ground item with no existing rule to defer to.
3. **No rule namespace exists for it.** The one foreign rule near the subject, `privacy.no-deceptive-consent`, is UIUXDesignStandards' and concerns how consent is obtained in an interface; this standard mints no id, and naming one is a decision for the owner. A proposed rule, if one is natural, is recorded in the pull request that introduced this document for per-rule approval, and not here.

**Validation type.** R1 to R5 are `manual-review` obligations in this release; R6 constrains this framework and has no validation type, because the thing it prohibits is a behaviour of the tool. The validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | warning |
| R2 | warning |
| R3 | warning |
| R4 | error |
| R5 | warning |
| R6 | error |

**Exemptibility.** R6 is not exemptible, for the reason R6 of [Standard 25](25-grounding-and-hallucination-control.md) is not. R4 is not exemptible, because an exception would record a project as knowingly relying on availability as a permission. R1 to R3 and R5 reach a system only where it uses material or a third-party model, and a system that does neither records, in its own documents, that they do not reach it and why. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each use of each source has a permission record, and each source whose basis is not known is recorded as unknown | A use with no record, a record with no basis, or an unknown recorded as permitted | A project that records the training data of its hosted model as unknown, and makes no use of that data of its own, must **not** be faulted under R1 |
| R2 | Each record states a grant scope, and each use made is among the uses the scope names | A record with no grant scope, or a basis recorded as covering a use its stated scope does not name | A record whose scope names the use, even where a reviewer would read the licence more narrowly, must **not** be faulted under R2; the requirement is that the scope be written, not that it be right |
| R3 | Each record states its ending condition, or that none is stated, and names the uses that rest on the basis | A record with no ending condition and no statement that none is stated, or naming no uses resting on it | A record stating "no condition stated" with its uses must **not** be faulted for the permission being open-ended |
| R4 | No record's basis is only that the source is public, accessible, indexed, scraped or downloadable | A record whose only basis is one of those circumstances | A record that notes a source is public and also names a licence or consent as its basis must **not** be faulted |
| R5 | Each third-party model whose weights or output are used has its licence or terms named with revision or date, and a restriction list | A model used with no licence or terms named, a licence with no revision or date, or a restriction known to the author and not listed | A record with an empty restriction list, stated as "none found", must **not** be faulted |
| R6 | No detector, rule, audit finding or generated report in this repository states a permission verdict from presence | A detector, rule, audit finding or report that states a use is permitted, licensed, consented to or lawful because a licence file, licence identifier, consent flag, terms-accepted field or declaration is present | Reporting that a licence file was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries one, so R1 to R5 are enforced by review or not at all, and R6 holds today only because no such detector exists. The falsifiers in the table are available for manual review; what this release lacks is a detector that applies them. A record made stale by the event in the staleness table below does not satisfy the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | Any change to anything this record names or relies on, including: a new source, or a new use of an existing one. |
| R2 | Any change to anything this record names or relies on, including: a revision of the consent, licence or terms the grant scope was read from. |
| R3 | Any change to anything this record names or relies on, including: a change of the ending condition, or a change to the uses resting on the basis. |
| R4 | Any change to anything this record names or relies on, including: a change of the basis the record gives. |
| R5 | Any change to anything this record names or relies on, including: a change of the model, its version or alias target, or a revision of its licence or terms. |
| R6 | A new detector, rule or report that touches consent or licensing. |

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one word, "consent", inside a bullet of five subjects, and states no requirement, level or evidence for it. The item is class `D` because its subject token is derived from the brief; the requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1 to R5 in full**, with the defined terms use, permission basis, grant scope and permission record, the rule that an unknown basis is recorded as unknown, the rule that a basis does not cover a use outside its grant scope, the ending-condition record, the ban on recording availability as a basis, and the model-licence record.
- **"Licensing" as a subject.** The word is in the specification's title for the item and is not a token of the brief; its inclusion, and the choice to reach third-party model licences in R5 and not software dependency licences, are this repository's judgment.
- **R6**, the constraint on this framework, in the same form as [Standard 12](12-context-and-corpus-provenance.md) R12 and the equivalent requirement in [Standard 25](25-grounding-and-hallucination-control.md).
- **That this standard gives no legal advice and decides no lawfulness**, and the exclusions in Scope as division lines, which no one has confirmed.
- **The severity assignments** (one level per requirement, in Validation), the statement that no attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the decision to name no rule id.

Not authored here: the posture, and the observation that the item has no existing owner among the nine packs, are the boundary review's.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) lists the subjects this pack owns and the packs that own the others. The boundary review lists item 14 among the items searched for an owner and found to have none, so this item has no counterpart to defer to. [Standard 12](12-context-and-corpus-provenance.md) governs the statement of where a source came from; whether a provenance statement that names a licence is provenance or this standard's subject is recorded as an open question in `artifacts/project-plan-breakdown/08-open-questions.md` and is not settled here, and R4 and R6 only ensure that naming a licence is not read as establishing a permission. [Standard 13](13-personal-data-in-ai-systems.md) governs personal data held or sent and says that nothing there makes a use permissible; this standard records what a project relies on and does not make a use permissible either. Item 15 governs what is done once a basis ends; R3 only asks that the ending be recorded. [Standard 1](01-ai-system-manifest.md) declares models and data sources and declares no permission field; none is proposed by this standard. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and non-lowering language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests section answers. **Outside this pack.** UIUXDesignStandards owns how consent is asked of a user in an interface; its `privacy.no-deceptive-consent` is recorded in `artifacts/foreign-namespace-inventory.json` and is neither imported nor restated here. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` has a concept of consent or of a licence verdict. |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 to R3, R5 | A place to declare a permission record: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R4 | A check that a record's basis is not only availability | Reading a basis from free text is a heuristic, and a false positive teaches a project to write whatever passes |
| R6 | A test asserting no detector, rule, audit finding or report emits a permission verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a use as permitted, licensed, consented to or lawful from the presence of a licence file, a licence identifier, a consent flag, a terms-accepted field or a declaration. R6 forecloses it, and the foreclosure is the point: a file is not a permission.
