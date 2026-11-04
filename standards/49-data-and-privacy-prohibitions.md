# Standard 49 — Data and Privacy Prohibitions

[Standard 13](13-personal-data-in-ai-systems.md) states what a system must do about the personal data
its text carries, and it states three rules that forbid: real personal data in fixtures, credentials in
prompt assets, unredacted prompt logging. Those three were minted in Phase 1 and cite Standard 13. Whether
they are this item's prohibitions, stated early, is an open question, and **this standard does not answer
it.** It moves no rule, reattributes none, and restates none of the three as a requirement of its own.

What it does is state two prohibitions that Standard 13's rules do not reach, because they concern a
claim or a route and not a store. A deletion request can be confirmed as complete over a store it never
reached. An evaluation run can read live records from production around a fixture set that is clean.
Both are ways to defeat a data requirement without breaking its letter.

Source: item 49 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
authored as the negative face of the "Data privacy" token of the "Data privacy, provenance, consent,
retention, and access control" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 49 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. The boundary posture is **O**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) by listing item 49 under
> `notGovernedElsewhere`. That review's substantive half is human judgment and carries
> `humanSignOff: null`.
>
> **This item is authored, not derived.** The brief has no prohibition section; the specification lists
> every must-never requirement as class-A work in Band L. R1 and R2 below are this repository's
> judgment, not the brief's words, and none has owner approval; Additions lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it — anything that sends a prompt to a model, retrieves context for one, or acts on a model's output —
that either accepts requests to delete a person's data, or runs evaluation or test runs that read data
from a store.

The terms are [Standard 13](13-personal-data-in-ai-systems.md)'s and are not redefined: **personal
data**, **real** and **synthetic** personal data, and **model-adjacent store**. One term is added.
**Production data source** means a store that holds data about actual people and serves the live
system, such as its primary database or a live support-ticket feed, as distinct from a committed
fixture or a generated set.

**Where each requirement reaches.** R1 reaches systems that accept deletion requests. R2 reaches
systems that run evaluation or test runs reading from any store. A system with neither subject may
declare the matter not-applicable in its own documents; this standard ships no catalog rule, so there is
no [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 disposition to attach it to.

**Where the three forbidden privacy rules stand.** `privacy.no-real-personal-data-in-fixtures`,
`privacy.no-credentials-in-prompts` and `privacy.no-unredacted-prompt-logging` are stated by
Standard 13 as its R1, R2 and R3 and stay there. Their placement, and whether this item should state
them, is the open question recorded as Q12 in
[`artifacts/project-plan-breakdown/08-open-questions.md`](../artifacts/project-plan-breakdown/08-open-questions.md).
The owner decided on 2026-10-15, on issue #85, to write this standard prose-first and keep Q12 open.
Nothing below depends on how Q12 is resolved; if it is resolved in favour of item 49, R1 and R2 stand
beside the three rules and neither replaces them.

The boundary with this standard's neighbours, none of whose ground is claimed:

- **[Standard 13](13-personal-data-in-ai-systems.md)** governs what is kept out of fixtures, prompt
  assets and logs, and that retention and a deletion path are declared and reviewed. R1 here concerns
  what is *said* about a deletion, and R2 what an evaluation run *reads*; neither restates a Standard 13
  requirement.
- **[Standard 12](12-context-and-corpus-provenance.md)** governs where a corpus or evaluation set came
  from. R2 asks only whether a run reads live records about people.
- **[Standard 14](14-consent-and-licensing.md), Consent and Licensing**, **[Standard 15](15-retention-deletion-memorization.md),
  Retention, Deletion, and Memorization**, **[Standard 16](16-access-control-for-models-context-and-tools.md),
  Access Control for Models, Context, and Tools** — whether a use was agreed, how long
  data is kept and how deletion is enforced, and who may read a store. R1 does not state a deletion
  schedule or enforce deletion.
- **[Standard 52](52-output-honesty-prohibitions.md), Output Honesty Prohibitions**, and
  **[Standard 53](53-disclosure-and-deception-prohibitions.md), Disclosure and Deception Prohibitions** — honesty of a system's outputs and disclosures generally. R1 concerns one claim, a
  deletion confirmation, and claims no wider ground.
- **UIUXDesignStandards**, which uses the `privacy.` rule-id segment, governs how personal data is shown
  to a user and how consent is asked for. Nothing here does either.

**This standard is not a legal or regulatory standard, and meeting it establishes conformance with no
privacy law.** A project subject to privacy regulation answers to that regulation separately.

**Risk tier does not grade this standard.** Nothing below becomes lighter at a lower tier: Standard 2
R3 forbids a tier from reducing a requirement. **This standard does not restate, extend, or rely on
Standard 2 R2, and takes no position on Q7.**

## Requirements

### R1 — A deletion request is not confirmed complete over a store it did not reach

**A system MUST NOT report a request to delete a person's data as complete while any model-adjacent
store named in its most recent Standard 13 R5 review record has not been reached by that request, unless
the report names each such store.**

A deletion routine that deletes from some stores and says "done" is worse than one that says nothing.
The person who asked is told they are gone and stops looking. Standard 13 R5 requires that the path
reach every store the system controls and that the review be recorded; it does not constrain what is
said when the path, in a given case, does not: a store whose deletion call failed and was caught, a
store added after the routine was written, a store skipped because a record was not found there.

**A report is any statement that a deletion is finished.** It includes a response to the requester, a
status field set to complete, a ticket closed as done, a log line a person will read as confirmation.
A report that names the stores not reached is not a violation, and neither is one that says deletion is
partial. The requirement does not ask that deletion succeed; it asks that the statement not outrun it.

**R1 does not require a deletion path, a schedule or enforcement.** Whether one exists is Standard 13
R5's; how long data is kept and how deletion is enforced is item 15's. Where the system holds no review
record, R5 is unmet and R1 has no list to be measured against; it is not a second finding on the same
omission.

### R2 — Evaluation and test runs do not read live production personal data

**An evaluation or test run MUST NOT read real personal data from a production data source, or send it
to a model, unless the run is the system's own production traffic.**

Standard 13 R1 keeps real personal data out of the prompt corpora and fixtures a project commits. It
says nothing of a harness that reads the fixtures' place from a live database at run time: the
committed set is clean, and every run pulls real records, sends them to a provider, and writes the
results to a report. The least-protected copy of the data is then made on each run and kept wherever the
results are kept.

**What counts as a run's input is what it reads, not what it is called.** A "sample" query against the
support-ticket store, a dump refreshed nightly into an evaluation bucket, and a connection string to
a replica all read from a production data source. A run against a copy whose records were generated to
describe nobody does not. A copy with direct identifiers replaced but whose content still identifies
someone is real personal data under Standard 13's definition.

**Production traffic is excluded because a run is not then an evaluation.** A system that, as part of
serving users, samples live requests for an online quality check is operating, and the data it handles is
Standard 13 R3's and R4's. R2 is about runs made *about* the system, not those made *by* it.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Done over a missed store | A deletion response says complete after the vector store's call failed and the error was logged | R1 |
| A store added later | A trace pipeline added after the routine was written is not in it; the routine still reports complete | R1, and Standard 13 R5 |
| Complete as a default | A status field defaults to complete and is changed only on an error the routine raises | R1 |
| The live replica | An evaluation harness connects to a read replica of the production database | R2 |
| The nightly dump | An evaluation bucket is refreshed from production each night and labelled "test data" | R2 |
| Clean fixtures, live runs | Committed fixtures are synthetic, and a second, uncommitted path reads live records | R2 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The deletion routine's completion report paired with the review record's store list; for each store, whether the report can be emitted without it | Code that issues the report; the Standard 13 R5 review record | Human review of the code path; a run with one store's deletion made to fail shows the report |
| R2 | Each evaluation or test run's data sources, and for each whether it is a production data source | Harness code, job configuration, connection settings, the datasets a run is given | Human review |

Evidence for both is a human reading of code and configuration. Whether a store was in fact reached for a
real request, and whether a dataset in fact holds real people, is not established by anything in a
repository; the second is the limit Standard 13 R1 already records for a `synthetic` label.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **The owner decided prose first.** On 2026-10-15, on issue #85, the owner decided that this standard states its content in prose, keeps the placement of the three forbidden privacy rules (Q12) open, and moves or reattributes no rule. Minting a rule for R1 or R2 is the owner's decision, not this document's.
2. **There is no artifact a rule could read.** A rule for R1 would need the review record's store list in a place a check can find, and a rule for R2 would need each run's data sources declared; neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place for either, and both are closed. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness. Adding a schema field is a schema-versioning decision outside this slice.
3. **The subject is partly runtime.** Whether a deletion is reported over a store it missed is decided by a failing call at run time, and whether a dataset holds real people is not a property of a checkout.

**Validation type.** R1 and R2 are `manual-review` obligations in this release. The validation type and the severity are different things.

**Severity.** One level per requirement. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | error |
| R2 | error |

**Exemptibility.** This standard assigns none. No catalog rule exists to carry an exemptibility flag, no exception mechanism exists to use one (see Exceptions and staleness), and the question of whether either requirement could ever be excepted is left to whoever mints a rule. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | With one store named in the review record made to fail, the routine's completion report either is not emitted or names that store | A completion report, produced with a store in the review record not reached, that does not name the store | A report that says "deletion partial; vector store not reached" must **not** be faulted; a report issued after every named store was reached must **not** be faulted |
| R2 | Each evaluation or test run's data sources are listed, and none is a production data source holding real people | A run reading real personal data from a production database, replica, live feed or a dump refreshed from one | A run reading a generated set, or a copy built by a documented process that describes nobody, must **not** be faulted; a system sampling its own live traffic for an online check must **not** be faulted under R2 |

**No falsifier is automated in this release.** No rule reads the artifacts these falsifiers need, and no
fixture carries them. They are available for manual review; what this release lacks is a detector that
applies them.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 or R2 in this release, because no rule exists to
except. `schemas/ai-policy.schema.json` is closed and has no `exceptions` or `attestations` property,
and `test/no-phase-creep.test.mjs` asserts both are absent. A project that knowingly does not meet a
requirement records that in its own documents.

**No record under this standard expires on a schedule.** A record is stale once its subject changes:

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | A store is added to, or removed from, the system's model-adjacent stores; or the code that issues a deletion report changes |
| R2 | A new evaluation or test run, or a change to an existing run's data source, including a change to the contents a dump or replica is refreshed from |

## Additions this standard makes beyond the source

The brief contributes no prohibition to this item. Its only use of the item's token is "Data privacy"
inside a bullet of five subjects, and the specification records the negative face of that token as this
item. The title is the specification's, not the brief's. Everything normative here is authored, and none
of it has owner approval, except the one decision named first:

- **The scope decision.** On 2026-10-15, on issue #85, the owner decided that this standard is written
  prose-first, that the placement question (Q12) stays open, and that no rule is moved or reattributed.
  That is the only owner decision behind this document; it covers the approach, not the wording below.
- **R1 in full**: a deletion confirmation must not outrun the stores reached; the definition of a
  report, which includes status fields and log lines a person will read as confirmation; the carve-out
  for a report that names the stores not reached; and the rule that it relies on Standard 13 R5's review
  record as its measure and is silent where none exists.
- **R2 in full**: no evaluation or test run reads real personal data from a production data source; the
  term **production data source**; that what counts is what a run reads, not what it is called; and the
  exclusion of a system's own production traffic.
- **The choice not to restate Standard 13's three forbidden rules** as requirements here, so that no
  prohibition would be reported under two standards while Q12 is open.
- **The severity assignments** (error, both) and the statement that no exemptibility is assigned.
- **The staleness events** in the table above.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the
  decision to name no rule id and no shard.

Not authored here: the posture, which is the boundary review's.

## Relationship to other standards and ADRs

[Standard 13](13-personal-data-in-ai-systems.md) is the sibling this item sits beside. It states the
three forbidden privacy rules, the retention declaration and the deletion path; R1 here relies on its R5
review record, and R2 extends the reach of its R1 from what is committed to what is read at run time.
It named item 49 as unwritten before this document existed and now links it; this document edits nothing else there. [Standard 12](12-context-and-corpus-provenance.md)
governs origin of corpora, which R2 does not. [Standard 1](01-ai-system-manifest.md) draws the scope.
[Standard 2](02-ai-risk-tiering-and-applicability.md) R3 is relied on for the rule that a tier does not
lower a requirement; this standard does not rely on its R2. [Standard 5](05-verdict-vocabulary.md) and
[Standard 6](06-standard-structure-and-rule-identity.md) govern verdicts and structure; R3 of Standard 6
is the requirement the Tests section answers. [Standard 7](07-boundary-with-adjacent-standards.md)
governs the shared `privacy.` rule-id segment, which UIUXDesignStandards also uses; this standard uses no
id in it.

[Standard 51](51-agent-and-tool-execution-prohibitions.md) is the parallel item for agents, where the
owner did move two rules (Q16). This standard differs: it moves none.

Written standards this one defers to: [Standard 14](14-consent-and-licensing.md) (consent),
[Standard 15](15-retention-deletion-memorization.md) (retention and deletion enforcement),
[Standard 16](16-access-control-for-models-context-and-tools.md) (access), and [Standard 52](52-output-honesty-prohibitions.md)
and [Standard 53](53-disclosure-and-deception-prohibitions.md) (honesty and disclosure prohibitions). No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Neither requirement is enforced, and nothing detects a violation of either.**

Stated as two separate lists, so that a proposal is not read as a capability.

**Implemented today, and re-runnable now:**

| What | State |
| --- | --- |
| Structure of this document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |
| The three forbidden privacy rules | Stated by Standard 13, report `skipped` / `not-evaluated` and `prohibited-but-unestablished`; unchanged by this standard |

No script reads a deletion routine, a review record, an evaluation harness or a connection setting.

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 | A committed, machine-readable review record of model-adjacent stores, and a check that a completion report cannot be issued without them | Both schemas are closed; a schema field is a versioning decision, and Phase 2 section 8 puts it out of scope |
| R2 | A place to declare each run's data sources, and a check against known production data sources | The same, and recognising a production data source from a connection string is a heuristic whose false positives teach a project to rename its sources |
| Rules | A rule for R1, a rule for R2, and a decision on Q12 | The owner's, not this document's; this standard names no rule id |

**What no future release will implement.** A report that a system's deletions are complete, or that its
evaluation runs read no real personal data, because no failing call or production connection was found.
The absence of a finding is not the absence of a store missed or a record read.
