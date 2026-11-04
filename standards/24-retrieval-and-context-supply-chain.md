# Standard 24 — Retrieval and Context Supply Chain

A retrieval system is a supply chain that ends in a context window. Content is written somewhere,
copied by an ingestion job, split and turned into vectors, stored, queried, and handed to a model that
treats what it receives as something to rely on. Every link is a place where the content can be
replaced, poisoned, quietly changed upstream, or kept after it should have been removed, and by the
time a model reads a passage the chain that delivered it is usually invisible: the passage arrives as
text, with no author, no revision and no indication of who could have written it.

This standard is about the **path content takes into the context** and what survives the journey. It
asks that each retrieval path be named with what feeds it, that an index say how it was built, that a
stored item be traceable to the upstream revision it came from, that the source and trust class travel
with the item to whoever consumes it, and that a source found unsafe can be withdrawn and the
withdrawal recorded.

The failure it is written against is a store that is trusted because it is internal: an index built
from a shared wiki that anyone in the company can edit, queried as if it were the project's own text,
with no way to say which revision of which page produced a given passage.

Source: item 24 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "retrieval security" token of the "Prompt, tool, agent, and retrieval security" bullet
of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 24 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) as an item for which the search
> of the nine packs found no owner, and that review's substantive half is human judgment and carries
> `humanSignOff: null`. No maintainer of any adjacent pack has confirmed it.
>
> **The brief supplies two words and this standard supplies the rest.** The brief's bullet names
> "retrieval security" and states no requirement for it. The item is class `D` because its token is the
> brief's own; the requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it that places content in a model's context by retrieval: from an index or store, from a live fetch, from a user-supplied document, or through a connector to another system.

Covers: naming each retrieval path and its feeds; recording how a store was built; tracing a stored item to its upstream revision; carrying source and trust class to the consumer; withdrawing a source; and the limit of what this framework can say about any of it.

Terms, each defined once here and used verbatim below:

- **Retrieval path** — a route by which content other than the project's own prompt text reaches a model's context at inference time, selected by a query or a fetch: a store (below), a fetch of a URL or API, a user-supplied document read into context, or a connector to a third-party system. A tool whose output is fetched content is a retrieval path, as [Standard 51](51-agent-and-tool-execution-prohibitions.md) R2 reads it.
- **Store** — an index, database or cache that holds ingested content or representations derived from it (chunks, embeddings, summaries) to be queried later. The manifest's `retrieval-index` data source kind is one.
- **Feed** — an upstream source a retrieval path reads from, together with the process and the identity that copy it into the store.
- **Item** — the unit a store returns: a chunk, a record, a page.
- **Trust class** — the project's label for who can change a feed's content. It must at least separate content only the project can change from content that anyone outside the project can change.
- **Withdrawal** — removing a source or an item from what retrieval can return, including the copies derived from it.

It does **not** cover, and claims none of the ground of:

- **Where a source came from and whether a model wrote it.** [Standard 12](12-context-and-corpus-provenance.md) owns the origin statement; this standard owns the path from the feed into the context and what travels with an item. A project satisfies Standard 12 R3 without satisfying R3 here.
- **Retrieved content acquiring instruction authority.** [Standard 51](51-agent-and-tool-execution-prohibitions.md) R2 owns it, and [Standard 21](21-prompt-and-instruction-security.md) R3 and R5 own the trust boundary in the prompt and interpolated values. This standard supplies the trust class those requirements can depend on and does not restate their prohibition.
- **Who may read a store or invoke a retrieval tool**, and per-tenant separation within one ([Standard 16](16-access-control-for-models-context-and-tools.md)), and whether a fetch tool call is authorised ([Standard 22](22-tool-and-function-call-security.md); [Standard 23](23-agent-execution-security.md) R2 for credentials).
- **What a retrieved passage supports in an output.** [Standard 25](25-grounding-and-hallucination-control.md).
- **Personal data in a store** ([Standard 13](13-personal-data-in-ai-systems.md)), **consent** ([Standard 14](14-consent-and-licensing.md)), and **retention** ([Standard 15](15-retention-deletion-memorization.md)).
- **Whether a source is true.** A traced item is traced; it is not correct.

**Boundary posture O — owned outright.** The boundary review records that no adjacent pack governs this item, after searching for it. This document accepts that record for what a repository can establish — that a path, a build record, a back-reference, a trust class and a withdrawal procedure are present and written down — and narrows it there: those are reviewable records, so R1 to R5 are `manual-review` obligations. Whether a store is in fact free of poisoned content is not a property of a checkout. This standard adds no precedent to the review's.

## Requirements

Each requirement has exactly one failure-mode row, evidence row, test row, severity row and staleness line below, keyed by its number.

### R1 — Name each retrieval path and what feeds it

**The project MUST record, for each retrieval path, its feeds, the process and identity that write into any store, and, for a live fetch, the origins it may contact.**

A path the project cannot list is a path nobody reviews. The requirement is not that feeds be trustworthy; it is that they be named, so that "the knowledge base" stops meaning whatever the pipeline happens to read this week. A feed whose upstream is editable by people outside the project is named as such, which R4 then carries forward.

### R2 — Record how each store was built

**The project MUST record, for each store, the revision or snapshot of each feed it was built from, the parsing and chunking configuration, the embedding model as [Standard 1](01-ai-system-manifest.md) R4 pins it, and the date of the build.**

An index built from last month's feed with a different chunker and a replaced embedding model is a different index under the same name. The record is what lets a later reader say what the store contained when a bad passage was served. It does not require rebuilds to be reproducible bit for bit; it requires that what went in be written down.

### R3 — Tie each stored item to the upstream revision it came from

**Each item MUST be traceable to the upstream item and revision it was ingested from, and the ingested content or the snapshot holding it MUST have a recorded digest.**

Without the link, a passage found to be wrong cannot be traced to a page, and a feed changed after ingestion cannot be told from an unchanged one. The digest is what makes "unchanged" a checkable statement. [Standard 12](12-context-and-corpus-provenance.md) R9 asks when a source-level statement is re-read; this asks that each item point back, so the question can be asked of one item.

### R4 — Carry source and trust class with the item to its consumer

**Each retrieval result MUST reach the code that consumes it with its source identifier, its revision and its trust class, and the trust class MUST separate content that parties outside the project can change from content that they cannot.**

Text alone loses everything the earlier requirements recorded. If the application receives only a string, it cannot cite, filter, down-rank or refuse on trust, and [Standard 51](51-agent-and-tool-execution-prohibitions.md) R2's isolation has nothing to key on. The requirement concerns what the application receives; it does not say what the model is shown, and it does not make a labelled item safe.

### R5 — Be able to withdraw a source, and record that it was done

**The project MUST have a written means of withdrawing a source or an item from retrieval, covering the copies derived from it, and MUST record each withdrawal with what was removed, when and why.**

A poisoned page removed from the wiki is still in the index, in the embeddings, and in any cache keyed on it. The trigger here is content found unsafe or wrong; retention and deletion for time or legal reasons are item 15's, and the same mechanism may serve both. This standard does not decide that. A written means that rebuilds the store from a snapshot without the item satisfies it.

### R6 — This framework MUST NOT report retrieval secure from the presence of a control

**No detector, rule, audit finding or generated report in this framework MAY state that a retrieval path is secure, trusted or free of poisoning because a vector store, an allowlist, a checksum, a sanitiser, a trust label or a declaration is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that an index is configured and that an allowlist names three hosts; it cannot show that the content is unpoisoned or that the pipeline honours the list. Reporting a path secure from a presence would turn a setting into an assurance.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Unnamed path | A retrieval call, a fetch or a connector in code with no entry for its feeds, its writer, or its permitted origins; a `retrieval-index` data source with no record of what feeds it | R1 |
| Store with no build record | An index with no record of the feed revisions, the chunking and parsing configuration, the embedding model or the build date; an embedding model changed with no rebuild recorded | R2 |
| Item with no way back | A stored item that cannot be traced to an upstream item and revision; no digest of what was ingested; a feed that changed after ingestion and cannot be told from one that did not | R3 |
| Trust lost in transit | A retrieval function returning text only; a result whose source or trust class is dropped before the consuming code; one trust class for a store that mixes project-writable and outside-writable feeds | R4 |
| Unremovable content | No written means of withdrawal; a source removed upstream and still returned; embeddings or a cache left behind; a withdrawal with no record | R5 |
| Presence read as assurance | A framework report of "retrieval secure" because a vector store or an allowlist is configured | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The list of retrieval paths, each with feeds, writing process and identity, and permitted origins for a live fetch, compared with the retrieval calls the code makes | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | The build record of each store | The same document, or the build pipeline's output | Human review |
| R3 | One item chosen from each store, traced to an upstream item and revision, and its digest compared with the upstream content or snapshot | The store and the build record | Human review |
| R4 | The retrieval function's return type, and the consuming code, read for source identifier, revision and trust class | The code that calls retrieval | Human review |
| R5 | The written means, and the record of each withdrawal | A project document the project names | Human review |
| R6 | The absence of any detector, rule, audit finding or generated report that reports a retrieval path secure from a presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R5 is a human-authored record, and for R3 and R4 a reading of what the store and the code do. A document naming feeds and a build record establish that the project wrote them down. Whether the content in a store is free of poisoning, or whether a feed's trust class is correctly assigned, is not established by any record in a repository and is not-evaluable.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** `dataSources` in `schemas/ai-system-manifest.schema.json` carries a name, a kind, a synthetic flag and a free-text provenance string, and is closed; it has no place for a feed, a writer, a build record or a trust class. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness. Adding a field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **The subject is largely not a property of a checkout.** Whether a store holds poisoned content, or whether a pipeline copies what it says it copies, is a property of running systems. A detector could read a configured store or an allowlist, which R6 forbids this framework from reporting as a result.
3. **No rule namespace exists for it.** No shard holds a retrieval namespace, and this standard mints no id; naming one is a decision for the owner. A proposed rule, if one is natural, is recorded in the pull request that introduced this document for per-rule approval, and not here.

**Validation type.** R1 to R5 are `manual-review` obligations in this release; R6 constrains this framework and has no validation type, because the thing it prohibits is a behaviour of the tool. The validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | warning |
| R2 | warning |
| R3 | warning |
| R4 | warning |
| R5 | warning |
| R6 | error |

**Exemptibility.** R6 is not exemptible, for the reason R6 of [Standard 25](25-grounding-and-hallucination-control.md) is not. R1 to R5 reach a system only where it places retrieved content in a context, and a system that retrieves nothing records, in its own documents, that they do not reach it and why. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Every retrieval call, fetch and connector in the code has an entry naming its feeds, the writing process and identity, and, for a live fetch, its permitted origins | A retrieval path with no entry, an entry without a writer, or a live fetch with no permitted origins recorded | A path whose only feed is a directory in the project's own repository, entered with that feed and no external origins, must **not** be faulted for listing none |
| R2 | Each store has a record of the feed revisions, parsing and chunking configuration, embedding model and build date | A store missing any of the four, or an embedding model replaced with no record of the rebuild | A store rebuilt weekly from a snapshot, with the snapshot identifier and configuration in each build's output, must **not** be faulted for rebuilding often |
| R3 | One item per store traced to an upstream item and revision, with a recorded digest of the ingested content or its snapshot | An item that cannot be traced, or a store with no digest of either kind | A store recording the upstream path of each item and a digest of the snapshot in which every path resolves must **not** be faulted for having no per-item digest |
| R4 | The retrieval function returns source identifier, revision and trust class to its caller, and the trust class separates outside-writable from project-only content | A retrieval result reaching its caller as text alone; a result dropping any of the three; a store mixing feeds of both kinds under one class | A store whose every feed is project-only, carrying one recorded store-level class, must **not** be faulted for having no per-item class |
| R5 | A written means of withdrawal that names the derived copies it covers; a record of each withdrawal | No written means; derived copies unaddressed; a withdrawal with no record | A written means that rebuilds the store from a snapshot without the item must **not** be faulted for lacking an in-place delete |
| R6 | No detector, rule, audit finding or generated report in this repository states a retrieval path secure from presence | A detector, rule, audit finding or report that states a path secure, trusted or unpoisoned because a store, allowlist, checksum, sanitiser, trust label or declaration is present | Reporting that a retrieval index was *found* in the manifest, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries one, so R1 to R5 are enforced by review or not at all, and R6 holds today only because no such detector exists. The falsifiers in the table are available for manual review; what this release lacks is a detector that applies them. A record made stale by the event in the staleness table below does not satisfy the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | Any change to anything this record names or relies on, including: a retrieval path, feed, writing process or identity, or permitted origin added, removed or replaced. |
| R2 | Any change to anything this record names or relies on, including: a rebuild, or a change of feed revision, parsing or chunking configuration, or embedding model. |
| R3 | Any change to anything this record names or relies on, including: a change of the upstream content after ingestion, or of the way items are identified. |
| R4 | Any change to anything this record names or relies on, including: a change of the retrieval function's return shape, or of the class a feed is assigned. |
| R5 | Any change to anything this record names or relies on, including: a new store, cache or derived copy the written means does not cover. |
| R6 | A new detector, rule or report that touches retrieval or context supply. |

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes two words, "retrieval security", inside a bullet of four subjects and states no requirement, level or evidence for them. The item is class `D` because its subject token is derived from the brief; the requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1 to R5 in full**, with the defined terms retrieval path, store, feed, item, trust class and withdrawal, the minimum separation a trust class must make, and the choice to treat a user-supplied document and a connector as retrieval paths.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in [Standard 25](25-grounding-and-hallucination-control.md) and [Standard 33](33-ai-observability.md).
- **The division from Standards 12, 21, 23, 25 and 51** in Scope and Relationship, which no one has confirmed. Standard 51 R2 records that "where retrieved content comes from, and whether a source can be trusted at all, is item 24's subject"; the split here between that ground and Standard 12's origin statement is this standard's reading.
- **The severity assignments** (one level per requirement, in Validation), the statement that no attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the decision to name no rule id.

Not authored here: the posture is the boundary review's.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) lists the subjects this pack owns and the packs that own the others; the boundary review records no owner among the nine packs for this item, so there is nothing to defer to or crosswalk. [Standard 12](12-context-and-corpus-provenance.md) states a source's origin and revisit events; R2 and R3 here depend on its source declaration and do not restate it. [Standard 21](21-prompt-and-instruction-security.md) R3 records the trust boundary in the prompt, and [Standard 51](51-agent-and-tool-execution-prohibitions.md) R2 forbids retrieved content from becoming instruction; R4 here supplies the trust class they can key on and neither is restated. [Standard 23](23-agent-execution-security.md) R2 governs credentials scoped to a tool, which includes a retrieval tool's. [Standard 25](25-grounding-and-hallucination-control.md) governs what a retrieved passage supports in an output. [Standard 1](01-ai-system-manifest.md) R4 pins the embedding model R2 names. [Standard 13](13-personal-data-in-ai-systems.md) governs personal data a store may hold. [Standard 14](14-consent-and-licensing.md), [Standard 15](15-retention-deletion-memorization.md), [Standard 16](16-access-control-for-models-context-and-tools.md) and [Standard 22](22-tool-and-function-call-security.md) are written in the same pull request and are cited only as the owners of ground this standard leaves to them. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests section answers. **Outside this pack.** No adjacent pack's standard is recorded for this subject. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` reports a retrieval path secure, trusted or unpoisoned |
| Manifest | `dataSources` can list a `retrieval-index` by name with a free-text `provenance`. It records that an index exists; it holds no feed, writer, build record or trust class |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 to R3 | A place to declare feeds, writers, build records and digests: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R4 | A check of a retrieval function's return shape | Recognising a retrieval call across frameworks is a heuristic, and a false positive teaches a project to write whatever passes |
| R5 | A check that a withdrawal procedure exists and covers derived copies | The procedure is prose and operational; the copies are a property of a running system |
| R6 | A test asserting no detector, rule, audit finding or report emits a retrieval-security verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a retrieval path secure, trusted or free of poisoning from the presence of a store, an allowlist, a checksum, a sanitiser or a trust label. R6 forecloses it, and the foreclosure is the point: a control that is present is not a control that held.
