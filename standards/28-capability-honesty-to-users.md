# Standard 28 — Capability Honesty to Users

A user decides what to ask a system, what to rely on it for and what to do next from a picture of what
it can do. That picture is built from the system's own words: an onboarding screen, a persona prompt, a
refusal, a confident "done". When the picture is wrong, the user is not misled about a fact in the
world, as Standard 25 concerns, but about the system they are standing in front of, and every later
decision they make about it inherits the error.

Three different things are routinely run together, and this standard keeps them apart. What the system
**can do** is a property of one deployment at one time: a model, a set of tools, a configuration, a
mode. What the system **says it can do** is text, written once and often not revisited. And what a
reader of the repository **can establish** about either is limited to the second: the text is in the
checkout, and whether the capability is behind it is not.

The failure this standard is written against is a statement of capability that nobody checked against
the deployment it is shown in: a persona that remembers a user the system keeps no record of, a
"search the web" feature on a deployment whose search tool is off, a "done" produced where nothing was
done.

Source: item 28 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "capability honesty" token of the "Hallucination, uncertainty, citation, and capability
honesty" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 28 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **X**, `CONFIRMED`
> in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json), whose substantive half is
> human judgment and carries `humanSignOff: null`. **This document records no human sign-off and claims
> none**; the posture is a unilateral judgment that no maintainer of any adjacent pack has confirmed.
>
> **The brief supplies two words and this standard supplies the rest.** The brief's bullet names
> "capability honesty" and states no requirement for it. The item is class `D` because its subject token
> is the brief's own; the requirements below are this repository's judgment about that subject, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it — a
repository that invokes a model, retrieves context for one, or acts on a model's output — that
communicates with users, whether in a conversation, an interface, a generated message or documentation
shipped with the product.

Covers: the capabilities and limits a system states or implies to its users; their agreement with the
deployment they are shown in; what the system says when it cannot do what was asked; claims about its
own memory, understanding and agency; keeping the statements current as the deployment changes; and the
limit of what this framework can say about any of it.

Terms, each defined once here and used verbatim below:

- **Capability** — something the system can do for or with a user in a given deployment: use a tool,
  accept a modality or language, retain information across interactions, take an action in the world,
  or produce output of a stated kind or quality.
- **Capability statement** — any user-facing text or output that states or implies the system has, or
  lacks, a capability: interface copy, onboarding, the persona and self-description a system prompt
  gives the model, the model's own replies about itself, and user-facing documentation.
- **Deployment** — the model, tool set, configuration, mode and permissions a user's interaction is
  actually served by, including a degraded mode or fallback ([Standard 44](44-operational-resilience-degradation-and-provider-portability.md)).

It does **not** cover, and claims none of the ground of:

- **Whether a statement about the world is true or supported.** Item 25 ([Standard 25](25-grounding-and-hallucination-control.md))
  owns that, including output relied on as a statement of the system's own state. This standard owns
  what the system says about what it *can do*.
- **Whether and how the system says it does not know** ([Standard 26](26-uncertainty-expression-and-abstention.md)), **how a source is attributed** ([Standard 27](27-citation-and-source-attribution.md)), and **whether a user is told they are dealing with an AI** ([Standard 40](40-user-disclosure-of-ai-involvement.md)).
- **How a capability statement is presented**, including marking generated content and its
  accessibility, which [Standard 7](07-boundary-with-adjacent-standards.md) records as
  UIUXDesignStandards'.
- **The prohibitive form.** The specification lists item 52, Output Honesty Prohibitions (class `A`,
  unwritten on this base), as the negative face of this same token, and item 53 for deception about
  whether a person or an AI is the source. This standard states the duty; whether a prohibition on a
  fabricated capability claim is item 52's, and how the two avoid stating one violation twice, is
  recorded open and not decided here.
- **An engineering agent's claims to a reviewer about a codebase**, which is the subject of
  EngineeringStandards' `ai.no-fabricated-capabilities` and not of a deployed system's statements to its
  users.

**Boundary posture X — owned canonically here, with two precedents.** The boundary review confirms the
plan's recommendation to claim the item and records two standards as evidence, only these:

- **EngineeringStandards, `standards/53-ai-engineering-honesty.md`, rule `ai.no-fabricated-capabilities`**
  — level `forbidden`, severity `error`, nonExemptible `true`, validation type `manual-review`,
  assurance `none`, with the note that detecting a fabricated API means resolving every symbol against
  every dependency's real surface, which is a type checker's job and one this framework does not do.
- **UIUXDesignStandards, `standards/26-ai-user-experience.md`, R8** — recorded with no rule id. Its text
  as the review records it: language implying memory, intent, understanding or agency the system does not
  have misleads users about what it will do; personality is permitted, misrepresentation is not.

The review's reasoning, which this standard adopts: the first is genuine precedent for refusing a
capability claim nobody checked, and this pack is canonical because its subject is what a deployed
system tells its users and not what an engineering agent tells a reviewer; the second is a precedent the
plan had not recorded. Both are **semantic** correspondences and neither is a reuse of an id. The
crosswalk is in the table below. The two files were read by the boundary review at the pinned commits
EngineeringStandards `b90b915` and UIUXDesignStandards `3f9cb8e`; this standard has not re-read them and
cites nothing about either beyond that record. **No human sign-off is recorded or claimed**:
`humanSignOff` is `null`.

| This standard | Precedent | Pack | Relationship |
| --- | --- | --- | --- |
| R2, R3 | `ai.no-fabricated-capabilities` | EngineeringStandards | Same prohibition on asserting a capability nobody checked, moved from an engineering agent's claims about a codebase to a deployed system's claims to its users. Semantic only |
| R4 | R8, anthropomorphism *(no rule id recorded)* | UIUXDesignStandards | Same concern: a claim of memory, intent, understanding or agency the system lacks. R4 adds the recorded truth it is tested against and the persona carve-out R8 states |
| R1, R5, R6 | — | — | **No precedent recorded.** The record, the re-check and the framework constraint are authored here |

[Standard 7](07-boundary-with-adjacent-standards.md) R3 lists `honesty.no-fabricated-capability-claim`
*(later phase)* as the id corresponding to both precedents. It is neither minted nor claimed here, and
which requirement above it would carry is the owner's to say. The differences in level and in
exemptibility between the foreign rule (`forbidden`, non-exemptible) and the requirements here are
observed and not resolved: which governs is each pack's to say, and nothing here weakens the foreign
rule.

## Requirements

### R1 — Record the capabilities and limits the system presents to users

**The project MUST keep a record of each capability the system presents to its users and of each limit
it states, with the deployment each holds in and the exercise that shows it.**

A capability statement is checked against something, or it is checked against nothing. The record is a
project document, not a manifest field: `schemas/ai-system-manifest.schema.json` is closed, and
[Standard 1](01-ai-system-manifest.md) declares models, tools and data sources, not what the system tells
users about them. An *exercise* is a test, a demonstration or an observed interaction in which the
capability was used, with its date and result. A capability presented to users that has no entry is
the violation; a limit is recorded in the same place so that a statement of absence is as checkable as a
statement of presence.

### R2 — Make each capability statement agree with the deployment it is shown in

**A capability statement MUST agree with the deployment that serves the interaction it appears in, and
a capability the deployment lacks MUST NOT be stated or implied as available.**

The deployment is the unit, not the product. A statement correct on the flagship deployment is wrong on
the fallback model that lacks the modality, the tenant whose tool permission is off, the mode that
disables retention. Where the system prompt hands the model a self-description, that description is a
capability statement and is subject to this requirement as much as interface copy is. A statement in
documentation applies to the deployment the documentation names, and a statement that names none
applies to all of them.

### R3 — Decline what the deployment cannot do and do not produce its appearance

**When a request needs a capability the deployment lacks, the system MUST say that it cannot, and MUST
NOT return output that presents the capability as having been exercised.**

This is the capability statement a model makes in the moment: "I've saved that", "I looked that up",
"I'll remember that" where no save, lookup or retention happened. A refusal of this kind is a statement
about the system, and it is the one a user acts on immediately. The requirement is met by saying so; it
does not require the system to say why, and it does not require a substitute. Whether the underlying
claim about the world is supported is [Standard 25](25-grounding-and-hallucination-control.md)'s subject.
That an action requires approval before it takes effect is [Standard 45](45-approval-gates.md)'s, and a
system that says an action is *pending* approval is not stating it done.

### R4 — State memory, understanding and agency only as the record has them

**A capability statement that attributes memory, intent, understanding or agency to the system MUST be
one the project's R1 record holds true of the deployment.**

Language of the first person is not forbidden, and a persona is not a misrepresentation. "I remember
your last order" is a claim about a retention store; "I'll try again" is a claim about a retry the
system will make. Where the record has no retention, or no retry, the sentence describes something that
will not happen. A persona's tone, name and style assert nothing about capability, and are not the
subject of this requirement.

### R5 — Re-check the statements when the deployment changes

**A change to the model, tool set, permissions, mode or fallback that serves users MUST be followed by a
re-check of the capability statements that depend on it, before the changed deployment serves users, or
the statement MUST be treated as unverified.**

A record made against the earlier deployment describes the earlier deployment. The commonest source of
a false capability statement is a true one that outlived a model swap or a removed tool. A statement
treated as unverified is withdrawn from the interface or flagged to the user as unchecked; it is not
left as it was.

### R6 — This framework MUST NOT report capability honesty from the presence of a statement

**No detector, rule, audit finding or generated report in this framework MAY state that a system is
honest about its capabilities because a capability list, a disclaimer, a persona instruction or a
limitations page is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that a disclaimer string
exists or that a system prompt says "you cannot browse the internet". It cannot show that the disclaimer
is displayed on the deployment a user is in, that the model obeys the prompt, or that the capabilities a
page lists are the ones a deployment has. Reporting a pass from any of them would turn the presence of a
statement into a verdict about its truth, which is the failure this standard is written against.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Capability presented, no record | Interface copy or a persona line claiming a capability that appears in no project record | R1 |
| Statement correct elsewhere | The flagship deployment's "analyses images" shown on a fallback that cannot | R2 |
| Self-description in the prompt, wrong | A system prompt telling the model it can browse, with the search tool disabled | R2 |
| Simulated capability | "I've booked it" or "I looked that up" returned where no call was made | R3 |
| Refusal that hides the gap | A vague answer in place of "I cannot do that here", leaving the user to infer a capability | R3 |
| Remembered nothing | "I remember you" from a deployment with no retention | R4 |
| Stale statement | A "supports PDFs" line surviving the removal of the tool | R5 |
| Presence read as honesty | A framework report of "capabilities disclosed" because a limitations page exists | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The record of presented capabilities and limits, each with deployment and exercise date and result | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | Each capability statement mapped to the deployment it appears in, and the configuration of that deployment | Project code, configuration, system prompts, interface copy | Human review |
| R3 | A request needing an absent capability and the system's response to it | A captured interaction or test | Human review |
| R4 | Each statement of memory, intent, understanding or agency and the R1 entry that holds it true | Persona prompts, interface copy, captured interactions | Human review |
| R5 | For each change to the deployment, the date of the re-check and the statements it covered | Change records and R1 record dates | Human review |
| R6 | The absence of any detector, rule, audit finding or generated report that reports capability honesty from a presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R5 is a human-authored record or a captured interaction. A limitations page
establishes that the project wrote one and says nothing about whether it is true of the deployment; the
reviewer reads what is claimed against the code, configuration and interactions that would carry it out.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 would look for a declared capability record, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place to put one; both are closed. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **R2 to R5 concern the behaviour of a deployment, not files.** Whether a statement agrees with the deployment it is shown in, and whether a system declines what it cannot do, are not properties of a checkout. A detector would test for the presence of a disclaimer or a prompt line, which R6 forbids this framework from reporting as a result; the foreign rule's own assurance note records that the equivalent check there is a type checker's job and that this framework does not do it.
3. **The crosswalked id is not this standard's to mint here.** [Standard 7](07-boundary-with-adjacent-standards.md) R3 lists `honesty.no-fabricated-capability-claim` as the later-phase id for both precedents; no `honesty` shard exists and this standard adds none, so that id is neither minted nor claimed. Whether any requirement becomes a rule under it, and whether it is item 52's, is the owner's decision; a proposal, if one is natural, is recorded in the pull request that introduced this document for per-rule approval.

**Validation type.** R1 to R5 are `manual-review` obligations in this release; R6 constrains this framework and has no validation type, because the thing it prohibits is a behaviour of the tool. The validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | warning |
| R2 | error |
| R3 | error |
| R4 | error |
| R5 | warning |
| R6 | error |

**Exemptibility.** R6 is not exemptible, for the reason R6 of [Standard 25](25-grounding-and-hallucination-control.md) is not. R1 to R5 reach a system only where it communicates capabilities to users, and a system that communicates none records, in its own documents, that the requirement does not reach it and why. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3). The foreign rule is non-exemptible; nothing here is made exemptible by that difference, because nothing here replaces it.

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each capability and limit presented to users has a record entry naming deployment and a dated exercise with result | A presented capability with no entry, or an entry with no exercise, date or result | A capability the system does not present to users needs no entry and must **not** be faulted for lacking one |
| R2 | For each deployment, every capability statement it serves is true of that deployment's configuration | A statement of a capability the serving deployment lacks, including one in the system prompt's self-description | A statement correct for the deployment it appears in must **not** be faulted because another deployment differs |
| R3 | A request needing a capability the deployment lacks is answered by saying the system cannot, and not by output presenting it as done | A response that presents an absent capability as exercised | A response that declines in one sentence without a reason or substitute satisfies R3 and must **not** be faulted for brevity |
| R4 | Each statement of memory, intent, understanding or agency maps to an R1 entry that holds it true | Such a statement with no supporting entry, or one the entry records as absent | A persona's name, tone and style, which assert no capability, must **not** be faulted |
| R5 | Each change to the deployment has a dated re-check covering the statements that depend on it, made before it served users | A statement that outlived a change to the capability it names with no re-check, and not marked unverified | A change that touches no capability a statement names needs no re-check and must **not** be faulted |
| R6 | No detector, rule, audit finding or generated report in this repository states capability honesty from a presence | A detector, rule, audit finding or report that states a system honest about its capabilities because a capability list, disclaimer, persona instruction or limitations page is present | Reporting that a disclaimer string was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries one, so R1 to R5 are enforced by review or not at all, and R6 holds today only because no such detector exists. The falsifiers in the table are available for manual review; what this release lacks is a detector that applies them. A record made stale by the event in the staleness table below does not satisfy the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier deployment and no longer satisfies the requirement it was offered for until it is re-made.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | Any change to anything this record names or relies on, including: a change of model, tool set, permissions or mode, or the addition of a capability statement. |
| R2 | Any change to anything this record names or relies on, including: a change to the deployment's configuration, to the system prompt's self-description, or to the interface copy. |
| R3 | Any change to anything this record names or relies on, including: a change to the capabilities the deployment has, or to the model that produces the response. |
| R4 | Any change to anything this record names or relies on, including: a change to the persona prompt, or to retention, retry or other behaviour the statement attributes. |
| R5 | A further change to the deployment after the re-check. |
| R6 | A new detector, rule or report that touches capability statements. |

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes two words, "capability honesty", inside a bullet of four subjects and states no requirement, level or evidence for them. The item is class `D` because its subject token is derived from the brief; the requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1 to R5 in full**, with the defined terms capability, capability statement and deployment, the ruling that the deployment and not the product is the unit a statement is checked against, that a system must say it cannot rather than return the appearance of a capability, that mental-state language is tested against a recorded fact with a persona carve-out, and that a statement is re-checked on a change to the deployment.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in [Standard 25](25-grounding-and-hallucination-control.md) and [Standard 44](44-operational-resilience-degradation-and-provider-portability.md).
- **The exclusions in Scope** as division lines, including the lines against items 25, 26, 27, 40, 52 and 53; where this standard stops and each of those begins is unconfirmed by anyone.
- **The crosswalk table**, its mapping of precedents to requirements, and the observation about the differences in level and exemptibility.
- **The severity assignments** (one level per requirement, in Validation), the statement that no attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the decision to name no rule id.

Not authored here: the posture, the verdict and the two recorded precedents with their observations are the boundary review's, and its `humanSignOff` is `null`.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) R3 records the crosswalk between `honesty.no-fabricated-capability-claim` (a later-phase id, neither minted nor claimed here) and the two precedents; it is a correspondence of subject, not of id. [Standard 25](25-grounding-and-hallucination-control.md) names this item in its Scope as "what a system says about itself" and withdrew the same EngineeringStandards crosswalk for grounding; it owns whether a statement is supported and this standard owns what the system says it can do, and the two meet where a statement of the system's own state is also a capability claim (recorded open). [Standard 40](40-user-disclosure-of-ai-involvement.md) owns whether a user is told an AI is involved and names this item for capability statements. [Standard 44](44-operational-resilience-degradation-and-provider-portability.md) R2 requires a degraded response to carry a signal; R2 here concerns what a capability statement says on that path and does not restate the signal. [Standard 45](45-approval-gates.md) governs whether an action takes effect; R3 here concerns what the system says about it. [Standard 1](01-ai-system-manifest.md) declares models, tools and data sources and does not declare capability statements; no field is proposed by this standard. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and non-lowering language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests section answers.

Items 26, 27, 52 and 53 are named in Scope and are not restated. [Standard 26](26-uncertainty-expression-and-abstention.md) and [Standard 27](27-citation-and-source-attribution.md) were written in the same batch as this standard and the lines between them are unconfirmed by anyone; items 52 and 53 are unwritten in this release and the lines drawn above against them are provisional until they are. **Outside this pack.** EngineeringStandards' `ai.no-fabricated-capabilities` and UIUXDesignStandards' Standard 26 R8 are named in Scope with what the boundary review recorded about each; each is a crosswalk, and no maintainer of either pack has confirmed that reading. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` emits a verdict about a system's statements of its own capabilities. |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 | A place to declare presented capabilities and limits: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R2 to R5 | Fixtures with a deployment configuration and its statements, and a detector or harness that runs a request needing an absent capability | Phase 3 detector and evidence-availability work; a detector reading a disclaimer would report a presence |
| R6 | A test asserting no detector, rule, audit finding or report emits a capability-honesty verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | `honesty.no-fabricated-capability-claim` or another, and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system honest about its capabilities from the presence of a capability list, a disclaimer, a persona instruction or a limitations page. R6 forecloses it, and the foreclosure is the point: a statement of what a system can do is not evidence that it can.
