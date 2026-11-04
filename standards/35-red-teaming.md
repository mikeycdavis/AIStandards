# Standard 35 — Red Teaming

Several standards in this pack end in the same place. A guard against prompt injection, an agent that
cannot widen its own authority, a misuse control that holds at inference time: each is a claim about how
a model behaves on hostile input, and none of them can be settled by reading the repository. Each says
the same thing instead, that the claim is established, if at all, by a recorded adversarial exercise.
This standard is about that record.

A red-team exercise is an attempt to make the system behave badly, made by someone trying to succeed.
What it produces is evidence of what was tried and what happened. It does not produce evidence that
the system is robust: an attempt that failed shows that attempt failed, against that version, by that
tester, in that time. The failure this standard is written against is a report that says "red-teamed,
no issues found" and says nothing of what was tried, against what, by whom, or what became of what was
found.

This standard asks only that an exercise be recorded in a form from which those questions can be
answered. It does not say how an exercise is run, how long it lasts, who may do it, what techniques it
uses, or how often it is repeated.

Source: item 35 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "red teaming" token of the "Observability, incident response, red teaming, and
auditability" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 35 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) under the items searched for an
> owner and not found in any of nine packs, and that review's substantive half is human judgment and
> carries `humanSignOff: null`. No maintainer of any adjacent pack has confirmed it.
>
> **The brief supplies one phrase and this standard supplies the rest.** The brief's bullet names
> "red teaming" and states no requirement for it. The item is class `D` because its token is the brief's
> own; the requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it — a repository that invokes a model, retrieves context for one, or acts on a model's output — where the project records, reports or cites a red-team exercise, or cites one as evidence for a claim.

Covers: what a record of an exercise states about its subject, its scope and its approach; how attempts and outcomes are recorded; what the record may and may not conclude; how findings are dispositioned; how sensitive material produced by the exercise is handled; and the limit of what this framework can say about any of it.

Terms, each defined once here and used verbatim below:

- **Exercise** — a bounded, deliberate attempt by one or more people to make the system behave in a way its owners would not want. An exercise has a **tester**, who is whoever made the attempts, whether a member of the project, an outside party, or a tool run by either.
- **Record** — the project document that describes an exercise. The repository's `templates/RED-TEAM-REPORT.md` is a scaffold for one; a record is a record only once a person has answered its sections.
- **Attempt** — one thing the tester tried: an input, a sequence, a manipulation of context or tools, with the intent of producing a particular bad behaviour.
- **Finding** — an attempt that produced behaviour the project's owners would not want.
- **Disposition** — what became of a finding: fixed, accepted, or open, with who decided.

It does **not** cover, and claims none of the ground of:

- **Whether a project should run an exercise**, how often, or against which threats. This standard sets no cadence and mandates no exercise.
- **Techniques, tooling, or the skill of the tester.** None is prescribed and none is graded.
- **The misuse analysis itself.** Item 9, Misuse and Abuse Prevention, owns what misuse is foreseeable and which controls answer it; this standard owns how an exercise against those controls is recorded.
- **The claim an exercise is offered for.** Items 21 (prompt and instruction security), 23 and 51 (agent execution) name the properties; this standard does not restate them and does not decide whether a record is enough to establish one.
- **Evaluation plans and robustness suites.** Item 17 and item 19 own those; an exercise may be run as part of an evaluation, and the conduct and record of the exercise is this standard's subject, not the plan's.
- **What happens once an exercise discovers a live harm.** Item 34, AI Incident Response, owns that.

**Boundary posture O — owned outright.** The boundary review records that none of nine packs mentions red teaming. This document accepts that for what a repository can establish. That a record states its scope, approach, attempts and dispositions is a reviewable fact, so R1 to R6 are `manual-review` obligations. Whether an exercise was adequate, or whether its results transfer to the system now running, is not a fact a repository can establish. It adds no precedent to the review's.

## Requirements

### R1 — State what was tested, by whom, and when

**A record MUST state the version of the system tested, what was in scope and what was excluded, who the tester was and what access the tester had, and when the exercise took place.**

An exercise is a statement about something specific. "The model was red-teamed" does not say which model, which prompt, which tools, which deployment, or whether the tester could see the system prompt or only the public interface; and those determine what the result means. The requirement does not choose a scope or an access level. It requires that the ones used be written down, and that exclusions be written beside inclusions, because a reader of a record sees only what it names.

### R2 — State the approach, including what was not attempted

**A record MUST state the kinds of attempt made and why those, and MUST state what was not attempted.**

A list of what was tried says little without a list of what was not. An exercise that tried prompt injection through user input and never through a retrieved document is a different exercise from one that tried both, and a reader who sees only the first list cannot tell them apart. An exercise that attempted nothing in an area records that as not attempted. It does not record it as clean.

### R3 — Record each attempt and its outcome

**A record MUST list each attempt or group of attempts made, state what was done and what happened, and state whether the outcome was reproducible, and an attempt that produced no finding MUST be recorded and not omitted.**

An exercise reported only through its findings reports the successes of the attack and hides its coverage. Ten attempts that found nothing and ten that found nothing because none was seriously tried look the same in a list of findings. The requirement does not ask for every keystroke; a group of attempts that share a method may be recorded together, if the record says how many and what varied. Where an outcome was not reproduced, or was not tried again, the record says so, and does not state it as reproducible.

### R4 — Conclude only what was tried

**A record MUST NOT state or imply that the system is secure, safe, robust, resistant or free of a class of vulnerability because an exercise produced no finding, and any conclusion MUST be confined to the attempts the record lists.**

Failing to find something is a statement about the search. A tester who tried forty injection prompts and succeeded with none has shown that forty did not succeed; the forty-first, a different tester, or the next model version may. The requirement does not ask a record to avoid a conclusion; "none of the 40 attempts listed under R3 produced a finding" is a conclusion, and a good one. What it forbids is the step from there to a property of the system.

### R5 — Give every finding a disposition and say who decided

**Each finding in a record MUST have a disposition of fixed, accepted or open, and an accepted or open finding MUST name the person or role that decided it, and a fixed finding MUST state how the fix was re-tested.**

A finding with no disposition is a finding nobody owns. A finding recorded as accepted with no name is indistinguishable from a finding nobody looked at again. The requirement does not decide which findings should be fixed, in what order, or at what severity; the severity in a record is the tester's or project's own judgment and is labelled as such. It asks that every finding end somewhere, and that where it ends can be traced to a decision-maker the record names. A decision-maker not known is recorded as not known, and is not filled in. A fixed finding states whether it was re-tested and how; a fix re-tested by repeating the attempt that found it is recorded as that, and a fix not re-tested is recorded as not re-tested.

### R6 — Handle what the exercise produced

**A record MUST state where the exercise's transcripts and artefacts are kept and who can read them, and MUST state whether any harmful output was produced and how it was handled.**

An exercise that works produces the thing the system was meant not to: instructions, content, a leaked prompt, a working exploit string. Those artefacts are stored somewhere, and a record that does not say where leaves the project unable to answer who can read them. The requirement does not say where they should be stored. It requires that the place and the readers be named, and that a record state "none produced" where none was, not leave the question unanswered.

### R7 — An exercise describes the version it tested

**A project MUST NOT present a record as describing a later version of the system than the one the record states it tested, and a record presented as current MUST be accompanied by the statement of what has changed since, or of the absence of change.**

A model alias can point at a different model next month, a prompt can be edited, a tool can be added. An exercise run against last quarter's configuration is a true statement about last quarter's. This requirement does not say that a change requires a new exercise; whether it does is the project's call and Standard 6 does not ask for one. It says a record cannot be cited as covering a system it did not test.

### R8 — This framework MUST NOT report a system as red-teamed or resistant from the presence of a record

**No detector, rule, audit finding or generated report in this framework MAY state that a system has been red-teamed, that it resists a class of attack, or that an exercise's findings are resolved, because a file, template, heading, link or declaration is present in the repository.**

This is a constraint on the framework, not on a project. A file at `docs/ai/RED-TEAM-REPORT.md` may be the unmodified scaffold, which carries a marker saying it is a template and not evidence; it may be a record of an exercise against a version long gone; it may state findings that were never dispositioned. Presence does not distinguish them. A framework report of "red-teamed" from a file turns a placeholder into an assurance. Reporting that a file was *found*, as an observation with no verdict, is permitted.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| The unscoped exercise | "Red-teamed in Q3", naming no version, scope, access, tester or date | R1 |
| The approach nobody can see | A record that lists techniques tried and says nothing of what was not, or lists neither | R2 |
| Findings only | A record of the attacks that worked, with no count or list of those that did not | R3 |
| The clean bill of health | "No vulnerabilities found" or "the guard is robust", stated from an empty findings list | R4 |
| The orphan finding | A finding with no disposition, or one marked accepted or open naming no decision-maker, or a fixed one with no re-test statement | R5 |
| The exploit in the shared drive | Transcripts holding working injections or harmful output with no stated location or readers | R6 |
| The old record on the new system | A record of an exercise against an earlier model, prompt or toolset cited as current evidence | R7 |
| Template read as assurance | A framework report of "red-teamed" because the report file exists | R8 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The version, scope, exclusions, tester, access and date stated in the record | The project's record of the exercise — `docs/ai/RED-TEAM-REPORT.md` is the default destination of the template; **no manifest or policy field points to it; see Implementation** | Human review |
| R2 | The kinds of attempt, the reasons, and the not-attempted list | The record | Human review |
| R3 | The list of attempts and outcomes, including those that produced no finding, with reproducibility stated | The record | Human review |
| R4 | Each conclusion in the record checked against the attempts listed under R3 | The record | Human review |
| R5 | Each finding with its disposition, the decider named, and for a fixed finding the re-test statement | The record, and the project's change record for a fix | Human review |
| R6 | The stated location and readers of transcripts and artefacts, and the statement on harmful output | The record | Human review |
| R7 | The system version the record states, compared with the version of the system it is presented as describing | The record, and the project's version record | Human review |
| R8 | The absence of any detector, rule, audit finding or generated report that reports a red-team result from presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R7 is a human-authored record. A record that states a scope, attempts and dispositions establishes that the project wrote them down. It does not establish that the attempts were made, that the tester tried in good faith, that the findings are complete, or that the system behaves as the record says it did; no document in a repository can, and those questions are not-evaluable here.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 to R7 would look for a record at a known place, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place to point at one; both are closed. The template names a default destination, and a project is not required to use it. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **The subject is not a property of a checkout.** Whether the attempts were made, in good faith and with skill, is not visible in a document. A detector could read headings, and a record that carries all the headings and no substance would pass it; R8 forbids this framework from reporting that as a result, and the boundary review records the same, on the same reasoning, for the neighbouring subjects.
3. **No rule namespace is decided for it.** `agent.no-self-modification` and `promptsec.template-injection-guarded` are `not-evaluable` and name a recorded red-team exercise as the way to establish them; their notes say a separate rule would examine such a record and that none exists. This standard is the document such a rule would cite, and this release mints no id and no shard, because doing so is a decision for the owner. A proposed rule, if one is natural, is recorded in the pull request that introduced this document for per-rule approval, and not here.

**Validation type.** R1 to R7 are `manual-review` obligations in this release; R8 constrains this framework and has no validation type, because the thing it prohibits is a behaviour of the tool. The validation type and the severity are different things.

**What this standard does not change.** A `not-evaluable` rule that names a red-team exercise as its way of being established stays `not-evaluable` ([Standard 5](05-verdict-vocabulary.md) R6: unknown is never a pass). A record satisfying R1 to R7 does not turn such a rule into a pass, and this standard does not ask any detector to treat it as one.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | warning |
| R2 | warning |
| R3 | warning |
| R4 | error |
| R5 | warning |
| R6 | warning |
| R7 | error |
| R8 | error |

**Exemptibility.** R8 is not exemptible, for the reason R6 of [Standard 25](25-grounding-and-hallucination-control.md) is not. R4 and R7 are not exemptible, because an exception would record a project as knowingly drawing a conclusion the record does not support. R1 to R3, R5 and R6 reach a system only where it has a record or cites one, and a system with none, which cites none, records in its own documents that they do not reach it and why. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | A record states the version tested, what was in scope, what was excluded, the tester, the tester's access, and the date | A record naming none, or only some, of the version, the scope, the exclusions, the tester, the access and the date | A record of a narrow exercise, with a narrow scope stated beside its exclusions, must **not** be faulted for being narrow |
| R2 | A record states the kinds of attempt, why, and what was not attempted | A record with no approach, with no reason for it, or with no not-attempted statement | A record stating that nothing was left unattempted within its scope, and naming that scope, must **not** be faulted under R2 |
| R3 | Each attempt or group of attempts is listed with what was done, what happened and reproducibility, including those with no finding; a group states how many and what varied | A record listing only findings; an attempt with no outcome; or an outcome with no reproducibility statement | A record in which every listed attempt produced no finding, and says so, must **not** be faulted under R3 |
| R4 | Every conclusion in a record is confined to the attempts the record lists | A record stating or implying the system is secure, safe, robust or free of a vulnerability class from an empty findings list, or a conclusion about attempts the record does not list | "None of the attempts listed produced a finding" must **not** be faulted |
| R5 | Each finding has a disposition of fixed, accepted or open; an accepted or open finding names who decided; a fixed finding states how it was re-tested | A finding with no disposition, an accepted or open finding naming no decider, or a fixed finding with no re-test statement | A finding recorded as open, naming its decider and why it remains open, must **not** be faulted for being unresolved |
| R6 | A record states where transcripts and artefacts are kept, who can read them, and whether harmful output was produced and how it was handled | A record naming no location or readers, or silent on harmful output | A record that states no harmful output was produced must **not** be faulted for having nothing to handle |
| R7 | A record presented as current states what changed since the tested version, or that nothing did | A record presented as describing a version it does not state it tested, with no statement of change | A record presented as describing the version it tested, as a statement about that version, must **not** be faulted when the system has since moved on |
| R8 | No detector, rule, audit finding or generated report in this repository states a red-team result from presence | A detector, rule, audit finding or report stating that a system is red-teamed, resists a class of attack, or that findings are resolved, because a file, template, heading, link or declaration is present | Reporting that a record file was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries one, so R1 to R7 are enforced by review or not at all, and R8 holds today only because no such detector exists. The falsifiers in the table are available for manual review; what this release lacks is a detector that applies them. A record made stale by the event in the staleness table below does not satisfy the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R7 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made. A record of a completed exercise stays a true statement about that exercise after the system changes, and is stale only where it is presented as current (R7).

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | Any change to anything this record names or relies on, including: a change of the system version, deployment or toolset the record states it tested, where the record is presented as current. |
| R2 | Any change to anything this record names or relies on, including: a new capability, tool, data source or user population that falls outside the approach the record states. |
| R3 | Any change to anything this record names or relies on, including: a correction to the outcome of an attempt, or a later reproduction that disagrees with the record. |
| R4 | Any change to anything this record names or relies on, including: a later finding in the area the record concluded about. |
| R5 | Any change to anything this record names or relies on, including: a change of a finding's disposition, of its decider, or of the fix it rests on. |
| R6 | Any change to anything this record names or relies on, including: a change of where the artefacts are kept or of who can read them. |
| R7 | A change of the system's model, prompt, tools, data sources or deployment after the version the record states it tested. |
| R8 | A new detector, rule or report that touches red-team records or results. |

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes two words, "red teaming", inside a bullet of four subjects and states no requirement, level or evidence for them. The item is class `D` because its subject token is derived from the brief; the requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1 to R7 in full**, with the defined terms exercise, tester, record, attempt, finding and disposition; the requirement that what was not attempted be recorded; the requirement that an attempt without a finding be recorded; the three dispositions fixed, accepted and open, and the requirement that a decider be named and not invented; the requirement that a fixed finding state its re-test; and the requirement that a record not be presented as describing a later version.
- **R4**, the limit on what a record may conclude from an empty findings list, which is this repository's judgment about what such a list establishes.
- **R8**, the constraint on this framework, in the same form as the equivalent requirement in [Standard 25](25-grounding-and-hallucination-control.md) and [Standard 33](33-ai-observability.md), and the treatment of the unmodified scaffold as not being a record.
- **That this standard mandates no exercise and sets no cadence, technique or tester qualification**, and the exclusions in Scope as division lines, which no one has confirmed.
- **The reading of `templates/RED-TEAM-REPORT.md`** as a scaffold whose sections R1 to R6 follow; the template's own text says it is only evidence of what was tried, and this standard builds on that and does not extend it.
- **The severity assignments** (one level per requirement, in Validation), the statement that no attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the decision to name no rule id.

Not authored here: the posture is the boundary review's.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) lists the subjects this pack owns and the packs that own the others; the boundary review records that none of nine packs mentions red teaming, so this item has no counterpart to defer to or crosswalk. Several written standards name this one as the owner of the exercise their claims rest on, and each keeps its own subject: [Standard 21](21-prompt-and-instruction-security.md) R5 (interpolated values do not become instructions), [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1 (an agent does not rewrite its own authority) and R2, and [Standard 9](09-misuse-and-abuse-prevention.md) R5 (the named controls hold at inference time) each say a recorded exercise is how the property is established; this standard says what such a record states and does not say whether the property holds. [Standard 8](08-ai-safety-requirements-and-safety-cases.md) R4 requires evidence cited in a safety case to be identified by kind and revision, and a record under this standard is evidence of that kind, cited as the exercise it describes. [Standard 23](23-agent-execution-security.md) governs agent execution, and this standard governs how an exercise against it is recorded. [Standard 17](17-evaluation-plans-for-generative-systems.md) and [Standard 19](19-robustness-evaluation.md) own evaluation plans and robustness, and an exercise may be part of one. [Standard 33](33-ai-observability.md) governs the call record from which an attempt may be reconstructed; this standard does not require one. Item 34, AI Incident Response, and item 36, Auditability of AI Actions, are not part of this change. [Standard 1](01-ai-system-manifest.md) declares models and declares no field for an exercise; none is proposed by this standard. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and non-lowering language used above, [Standard 5](05-verdict-vocabulary.md) R6 governs how an unestablished result is reported, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests section answers. **Outside this pack.** No adjacent pack's standard is recorded for this subject. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R7 is enforced; R8 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R1 to R6 | **A scaffold exists; it enforces nothing.** `templates/RED-TEAM-REPORT.md` is written by `scripts/init.mjs` to `docs/ai/RED-TEAM-REPORT.md` and carries a marker saying it is a template and not evidence, with sections for scope, approach, findings, handling of sensitive material, response and limits. No reader in `scripts/` or `rules/` examines a record, and the scaffold has no section for the R7 statement of change since the tested version |
| R8 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` states a red-team result. The two `not-evaluable` rules that name a red-team exercise in their remediation report it as an instruction and read no record |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 to R7 | A place to point at a record: a schema change, or a named document a rule can find; and a way to tell an answered record from the scaffold | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R3, R4 | A check that a record lists attempts without findings, or that a conclusion stays within them | Reading intent from free text is a heuristic, and a false positive teaches a project to write whatever passes |
| R5 | A check that each finding has a named decider | The structure of findings in a record is not fixed by any schema |
| R7 | A template section for change since the tested version | Template content is a separate change from this document |
| R8 | A test asserting no detector, rule, audit finding or report emits a red-team verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system as red-teamed, as resistant to a class of attack, or as having its findings resolved, from the presence of a file, a template, a heading or a declaration. R8 forecloses it, and the foreclosure is the point: a placeholder is not an exercise, and an exercise that found nothing is not a proof.
