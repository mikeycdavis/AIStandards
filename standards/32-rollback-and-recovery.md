# Standard 32 — Rollback and Recovery

A conventional release is reverted by deploying the previous build. An AI system's behaviour is
decided by more than its build: a pinned model, a prompt, a retrieval index, a set of tool permissions
and a handful of thresholds each change what the system does, and none of them is always in the
repository. Rolling back is therefore a question of whether the previous *behaviour* can be put back,
not whether the previous commit can be checked out, and some of what a change did cannot be put back
at all.

Three things are routinely run together, and this standard keeps them apart. A **rollback** is
returning what the system serves to an earlier state. **Recovery** is what is done about the effects
the rollback does not reach. And **a rollback that is available** is one that has been run, which is a
different claim from a rollback that is believed possible.

The failure this standard is written against is rollback asserted from the presence of history: a git
tag, a previous model name in a configuration file, a deploy tool's revert command. None of those says
that the earlier prompt still works with the model now in front of it, that the earlier index still
exists, or that anyone has ever done it.

Source: item 32 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "rollback" token of the "Reproducibility, versioning, model/data lineage, and
rollback" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 32 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, and that
> review's substantive half is human judgment and carries `humanSignOff: null`.
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) holds no evidence entry for this
> item, because an owned item has no counterpart to record. No maintainer of any adjacent pack has
> confirmed the posture.
>
> **The brief supplies one word and this standard supplies the rest.** The brief's bullet names
> "rollback" and states no requirement for it. The item is class `D` because its token is the brief's
> own; the requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it — a repository that invokes a model, retrieves context for one, or acts on a model's output — whose behaviour the project can change and later wishes to undo.

Covers: naming what a change returns to; keeping that state; the procedure and who may invoke it; the effects a rollback does not reach; refusing a state that was withdrawn; confirming what is served afterwards; exercising the rollback; and the limit of what this framework can say about any of it.

Terms, each defined once here and used verbatim below:

- **Release component** — a part of the system the project controls and that changes what it produces: a model identifier or weights the project pins or serves, a prompt or instruction text, a retrieval index or corpus snapshot, a tool set and its permissions, a behaviour-governing configuration such as a threshold or a guardrail policy.
- **Change** — a release component taking a new value in the served system.
- **Rollback target** — the value the release component held immediately before the change.
- **Rollback window** — the period after a change during which the project states that it may return to the rollback target.
- **Withdrawn state** — a value the project removed from service because of a defect, a security finding, a data-subject or legal requirement, or a decision that it must not run again.
- **Exercise** — a test, a drill or an observed real event in which a rollback to a target was carried out and the target was shown to serve, with its date and result.

It does **not** cover, and claims none of the ground of:

- **Recording and approving the change itself.** Item 29 owns versioning and change control and item 30 owns lineage; both are unwritten in this release. This standard needs a change to be identifiable and does not say how it is recorded.
- **A dependency failing.** [Standard 44](44-operational-resilience-degradation-and-provider-portability.md) owns what the system does when a model, provider or service it depends on is unavailable, slow, rate-limited or changed by the provider. A fallback is chosen by the system at run time; a rollback is chosen by a person about a project change.
- **Approval of irreversible actions.** [Standard 45](45-approval-gates.md) R3 owns the gate before an irreversible action; R3 here concerns only recording what a rollback leaves behind.
- **Responding to an incident**, which is item 34's, and **the record of which subject served a call**, which is [Standard 33](33-ai-observability.md) R1 and R2.

**Boundary posture O — owned outright.** [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) holds no evidence entry for this item, because an owned item has no counterpart to record. This document cites none and claims no adjacent pack's ground.

## Requirements

### R1 — Name the rollback target and the procedure for each change

**For each change to a release component, the project MUST record the rollback target, who may invoke the rollback, and the steps that carry it out; or MUST record that no rollback target exists.**

A change with no recorded target is one that can only be undone by working out what was there. A component the project does not pin, such as a provider alias that moves without a project change, has no target the project controls, and saying so is a complete record: that case is [Standard 44](44-operational-resilience-degradation-and-provider-portability.md)'s "changed" condition and not a gap here. The record is a project document; no manifest field exists for it.

### R2 — Keep the rollback target available through the rollback window

**The project MUST NOT retire, overwrite or delete a rollback target before the end of its rollback window, and MUST state the window.**

An index rebuilt in place, a prompt edited rather than versioned, or a model deployment removed when the new one goes live each make the stated window false. Where a provider withdraws the target during the window, the target is no longer available and the record under R1 is updated to say so.

### R3 — Record the effects a rollback does not reach

**The project MUST record, for each release component, the effects of running under the changed value that a rollback does not reverse, and the recovery step for each or the statement that there is none.**

Putting the old prompt back does not retract answers already given, actions an agent already took, rows already written, entries already added to a memory or an index, or weights already trained on new data. Recovery for those is a separate act with its own owner. Whether an action may be taken at all is [Standard 45](45-approval-gates.md) R3's subject and is not restated; a rollback that cannot reach a consequence is what this requirement records.

### R4 — Do not roll back to a withdrawn state

**A rollback MUST NOT return the system to a withdrawn state unless the record states why the reason for withdrawal does not apply.**

The previous value is the usual target and is the one most likely to have been withdrawn: a prompt replaced because it leaked an instruction, a model version removed after a finding, an index containing data a subject asked to have deleted ([Standard 13](13-personal-data-in-ai-systems.md) R5 concerns the path that reaches such stores). Rolling back is the fastest way to reintroduce them.

### R5 — Confirm what is served after a rollback

**After a rollback, the project MUST record that the value now served is the rollback target, by an identifier the running system reports.**

A command that returned success does not say that every replica, cache, queued job and long-running agent run switched. The identifiers a call record carries are [Standard 33](33-ai-observability.md) R1 and R2's subject; this requirement relies on them and states only that the rollback is not complete until one has been read back.

### R6 — Exercise the rollback, and keep the result current

**Each rollback described as available MUST have an exercise recorded with its date, result and an interval, and MUST NOT be described as available unless its latest exercise succeeded within that interval and postdates the latest change to the release component or to anything the target depends on.**

The earlier prompt may no longer work with the current model, the earlier index with the current embedding model, the earlier configuration with the current schema. The interval is the project's choice. This has the same shape as [Standard 44](44-operational-resilience-degradation-and-provider-portability.md) R5 and a different object: the path exercised there is the system's own fallback, and the one exercised here is a person's reversion of a change.

### R7 — This framework MUST NOT report rollback capability from the presence of history

**No detector, rule, audit finding or generated report in this framework MAY state that a system can be rolled back, or recovered, because a version tag, a previous model or prompt identifier, a deploy tool's revert command or a retained artifact is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that an earlier value is named or that a command exists; it cannot show that the earlier value is still served by anything, that it is not withdrawn, or that the reversion has worked. A rollback is shown by one that was done, which is R6's record and not the framework's to infer.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Change with no target | A prompt, model, index, tool permission or threshold changed with no record of what it was before, who may revert it, or how | R1 |
| Target gone inside its window | An index rebuilt in place, a prompt edited without a retained prior version, or a superseded deployment removed while the window is stated open | R2 |
| Consequences assumed reversed | A rollback described as having "undone" the change while answers, actions, writes or trained weights from the changed period stand with no recovery step | R3 |
| Withdrawn state restored | A rollback to a prompt, model or index removed for a defect, a finding or a deletion requirement, with no record that the reason no longer applies | R4 |
| Success reported, state not read | A rollback recorded as complete on the strength of a command result, while some replica, cache or running job still serves the changed value | R5 |
| Rollback never run, or run before the path changed | A rollback described as available with no exercise, a failed latest exercise, an overdue one, or one that predates a change to the component or its dependencies | R6 |
| History read as capability | A framework report of "rollback-ready" because a tag or previous identifier exists | R7 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | For each change: the rollback target, the roles that may invoke the rollback and its steps, or the statement that no target exists | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | The stated rollback window and the retention of the target across it | Project code, deployment and index configuration, and retention settings | Human review |
| R3 | The effects a rollback does not reverse and the recovery step or statement for each | A project document the project names | Human review |
| R4 | The record of withdrawn states and, for any rollback to one, the stated reason it does not apply | A project document the project names | Human review |
| R5 | The identifier the running system reported after the rollback and where it was read | Trace or call records, release records | Human review |
| R6 | The date, result and stated interval of each exercise and the date of the latest change to the component | Test records, drill records or incident records | Human review |
| R7 | The absence of any detector, rule, audit finding or generated report that reports rollback capability from a presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R6 is a human-authored record. A document naming a previous version establishes that the project wrote it down and says nothing about whether anything still serves it; the reviewer reads what is claimed against the code, configuration and records that would carry it out.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 to R4 would look for a declared target, window or withdrawn-state record, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place to put one; both are closed. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **R2, R5 and R6 concern the running system and its records, not files.** Whether a target is still served, whether every replica switched and whether a rollback ever worked are not properties of a checkout. A detector would test for the presence of a tag or a command, which R7 forbids this framework from reporting as a result.
3. **No rule namespace exists for it.** No shard holds a rollback or change-control namespace, and this standard mints no id; naming one is a decision for the owner. A proposed rule, if one is natural, is recorded in the pull request that introduced this document for per-rule approval, and not here.

**Validation type.** R1 to R6 are `manual-review` obligations in this release; R7 constrains this framework and has no validation type, because the thing it prohibits is a behaviour of the tool. The validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | warning |
| R2 | error |
| R3 | warning |
| R4 | error |
| R5 | warning |
| R6 | error |
| R7 | error |

**Exemptibility.** R7 is not exemptible, for the reason R6 of [Standard 25](25-grounding-and-hallucination-control.md) is not. R4 is not exemptible, because an exception would record a project as knowingly restoring a state it withdrew. R1 to R3, R5 and R6 reach a system only where it has release components it can change and wishes to undo, and a system that records, in its own documents, that it has none, and why, is out of scope and not exempt. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each change to a release component has a record of its rollback target, who may invoke the rollback and its steps, or of there being no target | A change with none of these recorded, or a record missing the target, the invoker or the steps | A record stating that no rollback target exists is a complete R1 record and must **not** be faulted |
| R2 | The rollback target for each change in its window still exists and is servable on the last day of the window | A target retired, overwritten or deleted inside its stated window, or a change with no stated window | A target retired after its window ended must **not** be faulted |
| R3 | Each release component's record lists what a rollback leaves in place and a recovery step or a statement that there is none | A release component with no such list, or a listed effect with neither a recovery step nor the statement | A record that states there is nothing a rollback fails to reach, with the reason, must **not** be faulted for listing no effects |
| R4 | Every rollback performed was checked against the record of withdrawn states | A rollback to a withdrawn state with no stated reason the withdrawal no longer applies | A rollback to a state never withdrawn must **not** be faulted for lacking such a statement |
| R5 | After each rollback an identifier reported by the running system is recorded and equals the target's | A rollback recorded complete with no identifier read back, or with one that differs from the target | An identifier read from the running system that equals the target satisfies R5 and must **not** be faulted for a further check |
| R6 | Each rollback described as available has a dated exercise with result and interval; the latest succeeded within the interval and postdates the latest change to the component or its dependencies | A rollback described as available with no exercise, no result or no interval, whose latest exercise failed, is overdue, or predates such a change | A rollback not described as available, and one exercised only in a test and recorded as such, must **not** be faulted for lacking a production use |
| R7 | No detector, rule, audit finding or generated report in this repository states a rollback or recovery verdict from presence | A detector, rule, audit finding or report that states a system able to be rolled back or recovered because a tag, previous identifier, revert command or retained artifact is present | Reporting that a tag or previous identifier was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries one, so R1 to R6 are enforced by review or not at all, and R7 holds today only because no such detector exists. The falsifiers in the table are available for manual review; what this release lacks is a detector that applies them. A record made stale by the event in the staleness table below does not satisfy the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R6 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | Any change to anything this record names or relies on, including: a further change to the same release component, a change in who may invoke the rollback, or a change to its steps. |
| R2 | Any change to anything this record names or relies on, including: a change to the stated window, or to the retention or deployment arrangement that keeps the target. |
| R3 | Any change to anything this record names or relies on, including: a new kind of effect the changed system can produce, such as a new tool, store or memory. |
| R4 | Any change to anything this record names or relies on, including: a state newly withdrawn, or a withdrawal reason that no longer holds. |
| R5 | Any change to anything this record names or relies on, including: a change to how the system is deployed, replicated or cached, or to the identifier it reports. |
| R6 | Any change to anything this record names or relies on, including: a change to the release component, to the model, schema, index or configuration the target depends on, or to the rollback procedure. |
| R7 | A new detector, rule or report that touches rollback or recovery. |

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one word, "rollback", inside a bullet of four subjects and states no requirement, level or evidence for it, and the specification's title adds "recovery". The item is class `D` because its subject token is derived from the brief; the requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1 to R6 in full**, with the defined terms release component, change, rollback target, rollback window, withdrawn state and exercise; the ruling that a missing target is a complete record when stated; that a target must outlive its stated window; that effects a rollback leaves in place are recorded with a recovery step; that a withdrawn state is not a rollback target without a stated reason; that completion is read back from the running system; and that an exercise must postdate the latest change.
- **R7**, the constraint on this framework, in the same form as the equivalent requirement in [Standard 25](25-grounding-and-hallucination-control.md), [Standard 33](33-ai-observability.md) and [Standard 44](44-operational-resilience-degradation-and-provider-portability.md).
- **The exclusions in Scope** as division lines; where this standard stops and items 29, 30 and 34 and Standards 44 and 45 begin is unconfirmed by anyone.
- **The severity assignments** (one level per requirement, in Validation), the statement that no attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the decision to name no rule id.

Not authored here: the posture is the boundary review's, which holds no entry for an owned item, and its `humanSignOff` is `null`.

## Relationship to other standards and ADRs

[Standard 44](44-operational-resilience-degradation-and-provider-portability.md) R5 requires a fallback to be exercised and its result kept current; R6 here has the same shape over a different object, and the two are cross-referenced and not merged. Standard 44's Scope assigns the reversion of a project change to this item. [Standard 45](45-approval-gates.md) R3 governs the approval before an irreversible action; R3 here records what a rollback cannot reach and does not restate it. [Standard 33](33-ai-observability.md) R1 and R2 govern the identifiers a call record carries, which R5 relies on. [Standard 13](13-personal-data-in-ai-systems.md) R5 governs the deletion path across model-adjacent stores, whose result R4 must not undo. [Standard 1](01-ai-system-manifest.md) R4 asks the manifest to pin the model, which makes a model a release component with a target; it declares no rollback fields and none is proposed here. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and non-lowering language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests section answers. Items 29, 30 and 34 are not part of this change. No pack outside this repository is cited, and no crosswalk is claimed. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R6 is enforced; R7 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R7 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` emits a verdict about rollback or recovery capability. |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 to R4 | A place to declare rollback targets, windows and withdrawn states: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R5, R6 | Fixtures with a rollback carried out and an identifier read back, and a detector that runs project-supplied checks | Phase 3 detector and evidence-availability work |
| R7 | A test asserting no detector, rule, audit finding or report emits a rollback or recovery verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system able to be rolled back or recovered from the presence of a tag, a previous identifier, a revert command or a retained artifact. R7 forecloses it, and the foreclosure is the point: a history is not a reversion.
