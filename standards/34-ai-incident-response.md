# Standard 34 — AI Incident Response

When an AI system does something it should not have, the first hours are usually spent finding out
what it did. A model's output is not an exception in a log: the call succeeded, the response was
well-formed, and the harm is in what the response said or did. Which prompt, which model, which tool
and which data source were involved is not always recorded, and what the project believed about the
system, in its safety case, its oversight design, its documentation, is often the first thing the
event proves wrong.

This standard is about the **record of a response**, not the quality of one. It asks that a project
say in advance what it will treat as an incident and who may declare one, that a declared incident
leave a report in which what is known is told apart from what is guessed, that containment and closure
be stated as what happened and not as what was intended, and that the records the incident contradicts
stop being presented as current. Several other standards of this pack say that an event invalidates a
record and leave "what follows" to this one; this standard is where it is stated.

The failure it is written against is a response declared finished from the presence of activity: a fix
merged, a ticket closed, a template filled in. None of those says that the effect stopped, that the
cause was established and not assumed, or that the documents which said the system could not do this
have been revisited.

Source: item 34 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "incident response" token of the "Observability, incident response, red teaming, and
auditability" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 34 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**; that
> review's substantive half is human judgment and carries `humanSignOff: null`. **This document records
> no human sign-off and claims none.**
>
> **The brief supplies two words and this standard supplies the rest.** The brief's bullet names
> "incident response" and states no requirement for it; its deliverables bullet separately names
> "incident reports" among the templates. The item is class `D` because its token is the brief's own;
> the requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it — a repository that invokes a model, retrieves context for one, or acts on a model's output.

Covers: stating what is an incident and who declares one; what a declared incident's report holds; how containment is recorded; what happens to records an incident contradicts; when an incident may be recorded as resolved; and the limit of what this framework can say about any of it.

Terms, each defined once here and used verbatim below:

- **Incident** — an event the project has declared an incident under its own criteria (R1). An event that has not been declared is not an incident in this standard's sense, and this standard does not require that any occur.
- **Incident report** — the project's record of one incident, in whatever form the project keeps it.
- **Established** — stated with the evidence it rests on. Anything else in a report is a **hypothesis** and is labelled one.
- **Contained** — the effect that led to the declaration is no longer being produced. Whether it has been reversed is a different question and is not asked here.
- **Contradicted record** — a record the project holds under another standard of this pack whose content the incident shows to be wrong or no longer true.

It does **not** cover, and claims none of the ground of:

- **Finding the event.** How a call is traced and a failure told apart from a success is [Standard 33](33-ai-observability.md); this standard begins once someone has declared.
- **Reverting a change.** Item 32 owns rollback; a rollback may be a containment action recorded under R3, and how it is done is not stated here.
- **Halting the system.** The capability to stop it and the record of a halt are [Standard 10](10-human-oversight-and-intervention.md) and [Standard 11](11-autonomy-levels-and-delegated-authority.md); R3 records that it was used, not how it works.
- **Adversarial exercises and audit.** [Standard 35](35-red-teaming.md) and [Standard 36](36-auditability-of-ai-actions.md).
- **What may be written in a report about personal data.** [Standard 13](13-personal-data-in-ai-systems.md); the report refers to where such content is held and does not hold it.
- **Notification of regulators, customers or other third parties.** No written standard of this pack governs it, and whether any is owed is a legal matter this standard does not answer.
- **Incident management for a project's ordinary software**, which is general engineering.

**Boundary posture O — owned outright.** [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) lists this item among those searched across nine packs for an owner and not found, and holds no evidence entry for it, because an owned item has no counterpart to record. This document cites none and claims no adjacent pack's ground. **No human sign-off is recorded or claimed**: `humanSignOff` is `null`.

## Requirements

### R1 — Record what is an incident and who may declare one

**The project MUST record the criteria on which an event is declared an incident, including that an event contradicting a record it holds under another standard of this pack is one, and the roles that may declare it.**

An event nobody is authorised to name is argued about while it continues. The criteria are the project's to choose and may be broad; the requirement is that they exist before the event and that one is not left to whoever notices. Roles are named as roles, not as people, and a project does not invent a role it has not assigned.

### R2 — Report each incident with what is known told apart from what is not

**Each incident MUST have an incident report that gives a timeline with the source of each entry, who or what was affected, the model, prompt, tool or data source involved, the cause with each statement marked established or hypothesis, and each follow-up with its owner or the record that it has none.**

The repository's `templates/INCIDENT-REPORT.md` has headings for most of these: a timeline with a source column, the model, prompt, tool or data source involved, established evidence and hypothesis under Cause, and a follow-up with an owner. It has no place for the record that a follow-up has none. It is a scaffold and not evidence: a copy that still carries its scaffold marker, or that answers a heading with a placeholder, is not a report. The involved components are named as the project's manifest names them, so the report can be read against [Standard 1](01-ai-system-manifest.md); a cause stated as fact with no evidence is the failure, not a cause that is not yet known.

### R3 — Record containment as what was done

**The incident report MUST record each action taken to contain the incident, by whom and when, and what is not yet contained.**

Containment is stated as actions and not as status. "Contained" with no action behind it cannot be checked, and a report that omits what is not yet contained reads as complete while the effect continues. Reverting a change, halting a path, disabling a tool and withdrawing an output are all containment actions; this requirement does not choose among them.

### R4 — Mark the records an incident contradicts

**The incident report MUST name each record the incident contradicts, and a contradicted record MUST NOT be presented as current until it has been re-examined and re-made.**

This is the requirement the "Contradicted by operation" and staleness passages of other standards defer to. A safety case, an oversight design, a system description or a data-source declaration that the incident disproves goes on being quoted unless something marks it. A report naming no contradicted record is a stated finding that there is none, and not an omission.

### R5 — Do not record an incident resolved without evidence the effect stopped

**An incident MUST NOT be recorded as resolved unless its report states the evidence that the effect has stopped, or states that this is unknown, in which case its status is not resolved.**

A merged change establishes that the project changed something. It does not establish that the system stopped doing what it did, and for a model the usual confirmation is a request that now behaves differently. The evidence is whatever the project can point to, and recording that none exists is permitted; recording resolution on the strength of the change alone is not.

### R6 — This framework MUST NOT report incident readiness from the presence of a template or the absence of incidents

**No detector, rule, audit finding or generated report in this framework MAY state that a system is prepared for incidents, has responded adequately to one, or has had none, because an incident-report template, an incident-response document or an empty incident log is present or absent in the repository.**

This is a constraint on the framework, not on a project. A repository can show that a template exists or that no report was filed; it cannot show that the criteria in R1 were applied, that an event was noticed, or that a filed report is true. The absence of a report is not evidence of the absence of an incident, and a template is a scaffold by its own marker.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Nothing declared in advance | No record of what counts as an incident, or of who may declare one; an event argued over for hours before anyone names it | R1 |
| Report that cannot be read | A timeline with no sources, a cause stated as fact with no evidence, no components named, or a template with its scaffold marker still on it | R2 |
| Containment as a status | "Contained" with no action, actor or time; or no statement of what remains uncontained | R3 |
| Stale record kept in circulation | A safety case or system description the incident contradicts, still presented as current after the report is closed | R4 |
| Resolved by the merge | An incident closed because a change was merged, with no statement that the effect stopped | R5 |
| Readiness read from a template | A framework report of "prepared" because a template exists, or of "no incidents" because the log is empty | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The criteria and the roles that may declare | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | The incident report, with its sources and the established or hypothesis label on each statement of cause | The project's incident records | Human review |
| R3 | The containment actions with actor and time, and the statement of what is not contained | The incident report | Human review |
| R4 | The contradicted records named in the report and, for each, the mark on it or the date it was re-made | The incident report and the contradicted record | Human review |
| R5 | For a resolved incident, the stated evidence that the effect stopped or the statement that it is unknown | The incident report | Human review |
| R6 | The absence of any detector, rule, audit finding or generated report that reports readiness or absence of incidents from a presence or an absence | This repository's own detectors and tests | Code review; see Implementation |

Evidence is a human-authored record. A report establishes that the project wrote something down and says nothing about whether it is true; the reviewer reads what is claimed against the traces, code and records that would bear it out. A project that has declared no incident has no evidence to offer for R2 to R5 and is not faulted for it; R1 is its record.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 would look for declared criteria and roles, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place to put them; both are closed. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **R2 to R5 concern the truth of a record about an event, not a file.** Whether a timeline is accurate, whether a cause is established, whether an action was taken and whether the effect stopped are not properties of a checkout. A detector could test for headings or the absence of placeholders, which R6 forbids this framework from reporting as a result.
3. **The namespace is reserved and this standard mints nothing in it.** `incident` is a reserved namespace in `scripts/catalog.mjs`; no `incident` shard exists and this standard adds none, so no rule id is minted or claimed. Whether any requirement becomes a rule is the owner's decision; a proposal, if one is natural, is recorded in the pull request that introduced this document for per-rule approval.

**Validation type.** R1 to R5 are `manual-review` obligations in this release; R6 constrains this framework and has no validation type, because the thing it prohibits is a behaviour of the tool. The validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | warning |
| R2 | error |
| R3 | error |
| R4 | error |
| R5 | error |
| R6 | error |

**Exemptibility.** R6 is not exemptible, for the reason R6 of [Standard 25](25-grounding-and-hallucination-control.md) is not. R1 reaches every system within scope. R2 to R5 reach a system only where an incident has been declared, and a system with none records nothing under them; this is a statement of what the requirement reaches and not an exemption from it. This release has no policy mechanism for a further exception: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | A record states the criteria, including contradiction of a record held under another standard, and the roles that may declare | No record, a record with no declaring role, or criteria that omit an event contradicting a held record | Criteria broader than the minimum, and roles named by title, must **not** be faulted |
| R2 | Each incident has a report with sourced timeline, affected parties, involved components, labelled cause statements, and follow-ups with owner or the record of none | A report missing any of these, a cause stated as fact without evidence, or a copy still carrying the scaffold marker | A report whose cause is stated as unknown, and a follow-up recorded as having no owner, must **not** be faulted |
| R3 | The report lists each containment action with actor and time, and what is not contained | "Contained" with no action recorded, or no statement of what remains | A report stating that nothing is yet contained is a complete R3 record and must **not** be faulted |
| R4 | The report names each contradicted record, or states there is none, and each named record is marked or re-made | A contradicted record presented as current after the incident, or a report silent on whether any exists | A record the incident did not contradict must **not** be faulted for carrying no mark |
| R5 | A resolved incident states the evidence the effect stopped; one without it is not resolved | An incident recorded resolved with no such evidence and no statement that it is unknown | An incident held open because the evidence is unknown must **not** be faulted |
| R6 | No detector, rule, audit finding or generated report in this repository states readiness or absence of incidents from a presence or an absence | A detector, rule, audit finding or report that states a system prepared, adequately responded, or incident-free because a template exists, a document exists or a log is empty | Reporting that a template or document was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries one, so R1 to R5 are enforced by review or not at all, and R6 holds today only because no such detector exists. The falsifiers in the table are available for manual review; what this release lacks is a detector that applies them. A record made stale by the event in the staleness table below does not satisfy the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | Any change to anything this record names or relies on, including: the roles, the criteria, or a change that brings a new kind of event within the system's reach. |
| R2 | Any change to anything this record names or relies on, including: new evidence about the cause, timeline or impact of the incident it describes. |
| R3 | Any change to anything this record names or relies on, including: the effect recurring after the containment it records, or a containment action being undone. |
| R4 | Any change to anything this record names or relies on, including: a further record found to be contradicted, or a contradicted record re-made. |
| R5 | Any change to anything this record names or relies on, including: the effect recurring after the incident was recorded resolved. |
| R6 | A new detector, rule or report that touches incident response. |

**Contradicted by operation.** An incident whose report was closed and whose effect later recurs contradicts the R5 record that closed it. That record no longer stands until re-examined; what the project then does is a new declaration under R1, not an amendment of the earlier report.

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes two words, "incident response", inside a bullet of four subjects and states no requirement, level or evidence for them. The item is class `D` because its subject token is derived from the brief; the requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1 to R5 in full**, with the defined terms incident, incident report, established, contained and contradicted record, the ruling that criteria must reach an event contradicting a held record, that cause statements are labelled established or hypothesis, that containment is recorded as actions, that a contradicted record is not presented as current, and that resolution needs evidence the effect stopped or a statement that it is unknown.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in [Standard 25](25-grounding-and-hallucination-control.md) and [Standard 33](33-ai-observability.md), extended to the absence of incidents.
- **The exclusions in Scope** as division lines, including the exclusion of third-party notification; where this standard stops and Standards 32, 35, 36, 10, 11, 13 and 33 begin is unconfirmed by anyone.
- **The reading of `templates/INCIDENT-REPORT.md`** as the heading source for R2 and as a scaffold and not evidence. The template pre-dates this standard and was not written against it; the match between its headings and R2 is observed, not designed.
- **The severity assignments** (one level per requirement, in Validation), the statement that no attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the decision to name no rule id.

Not authored here: the posture and the observation that no pack in the portfolio owns the item are the boundary review's, and its `humanSignOff` is `null`.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) lists the subjects this pack owns and the packs that own the others; the boundary review records no pack as owning this item, so there is no counterpart to defer to or crosswalk. [Standard 33](33-ai-observability.md) governs the call record a report relies on to reconstruct what happened; R2 here depends on it and does not restate it. [Standard 10](10-human-oversight-and-intervention.md) and [Standard 11](11-autonomy-levels-and-delegated-authority.md) govern halting; R3 records its use. [Standard 13](13-personal-data-in-ai-systems.md) governs personal data a report might otherwise hold. [Standard 1](01-ai-system-manifest.md) declares the components R2 names and declares no incident field; none is proposed by this standard. The staleness passages of Standards 8, 9, 10, 12, 13, 19, 25, 33, 37, 38 and 39, among others, each name an event that invalidates a record and leave what follows to item 34; R4 is that statement. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and non-lowering language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests section answers. [Standard 32](32-rollback-and-recovery.md), [Standard 35](35-red-teaming.md) and [Standard 36](36-auditability-of-ai-actions.md) are written and own their own subjects. **Outside this pack.** No adjacent pack's standard is recorded for this subject. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` emits a verdict about incident readiness, response adequacy or the absence of incidents. |
| Template | `templates/INCIDENT-REPORT.md` exists and carries the scaffold marker `AISTANDARDS-SCAFFOLD`, which `scripts/scaffolding.mjs` defines. That is the whole of what exists: a file, not a report, and no part of this release reads a project's incident records |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 | A place to declare criteria and declaring roles: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R2 to R5 | Fixtures of a report and a contradicted record, and a check that applies the falsifiers to project-supplied records | Phase 3 detector and evidence-availability work; reading truth from free text is a heuristic, and a false positive teaches a project to write whatever passes |
| R6 | A test asserting no detector, rule, audit finding or report emits an incident-readiness verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | A reserved-namespace id (`incident`) and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system prepared for incidents, as having responded adequately, or as having had none, from the presence of a template, a response document or an empty log. R6 forecloses it, and the foreclosure is the point: a presence is not a practice, and silence is not safety.
