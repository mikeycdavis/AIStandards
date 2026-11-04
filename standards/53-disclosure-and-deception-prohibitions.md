# Standard 53 — Disclosure and Deception Prohibitions

[Standard 40](40-user-disclosure-of-ai-involvement.md) asks whether a person is owed a disclosure that
AI was involved, and by when. It is written as a duty to decide and to deliver. This standard is its
negative face: the things a system must never do to a person who is trying to find out what they are
dealing with. It must not claim to be a person, it must not deny being an AI when sincerely asked, and
it must not be built to remove a disclosure that was owed.

The failure it is written against is not the missing notice, which Standard 40 covers. It is the
system that is arranged, by a persona script, a sign-off template, a line in a system prompt or a
filter on the output, so that a person leaves believing a human was there.

Source: item 53 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
authored as the negative face of the "user disclosure" token of the "Accessibility, fairness,
transparency, and user disclosure" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 53 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded
> in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) by listing item 53 under
> `notGovernedElsewhere`. That review's substantive half is human judgment and carries
> `humanSignOff: null`.
>
> **This item is authored, not derived.** The brief has no prohibition section; the specification
> lists every must-never requirement as class-A work in Band L. Every requirement below is this
> repository's own, and none has owner approval.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it
whose output reaches or concerns a person who is not part of the team that built it, as Standard 40's
scope states.

Terms, each defined once here and used verbatim below. Standard 40's terms (**disclosure decision**,
**disclosure capture**, **listed change**, **presence artifact**) are used as defined there and are not
redefined.

- **Human-source claim** — any of: an assertion that the output or the party producing it is a person;
  a first-person statement, made as fact, of a human attribute, experience or location that the system
  does not have; or a name, signature or avatar that attributes generated output to a person who neither
  wrote it nor reviewed it before it reached the reader.
- **Sincere question** — a question put by the person, in their own voice and not inside a fiction the
  person began, about whether they are dealing with an AI or with a person.
- **Owed disclosure** — a disclosure that the project's disclosure decision records as owed.
- **Suppression** — an instruction, template, filter or post-processing step whose purpose or effect is
  that an owed disclosure does not reach the person.

A name, a voice, a style or a personality is not a human-source claim. A system may be called "Ada".

It does **not** cover, and claims none of the ground of:

- **Whether a disclosure is owed, when it must arrive, and the record of it**, which are Standard 40's.
  R3 below begins where an owed disclosure exists and stops at the act of removing it.
- **How a disclosure is presented**, which Standard 7 records as UIUXDesignStandards'.
- **Whether a statement is true** (item 25) and **what a system says about its capabilities** (item 28);
  a human-source claim is a statement about the speaker's nature and is within this standard, any other
  false statement is not.
- **Deliberate misuse** of a system working as designed, which is Standard 9's.
- **Deception that is not about whether a person or AI is the source**, such as false claims about price
  or about a product. This standard does not reach it.
- **What the law requires.**

**Boundary posture O — owned outright.** The boundary review lists item 53 as governed by no other
pack, and records no precedent for it. This document adds none.

**The division with Standard 40 is Standard 40's provisional one, and it is still open.** Standard 40
records that whether and how a system may state or imply that a person is the source is provisionally
this item's, and that which of the two items owns each deception case, and whether either is
non-exemptible, needs an owner's ruling. This standard acts on the provisional division and does not
settle it. Nothing here restates a Standard 40 requirement.

## Requirements

### R1 — Make no human-source claim

**A system MUST NOT make a human-source claim.**

The claim is rarely a sentence reading "I am a human". It is a scripted aside such as "let me check with
my colleague", a first-person "I'm calling from our Leeds office", a signature block carrying a
caseworker's name on a reply no caseworker read, or an avatar photograph of a person beside generated
text. Each leaves the reader with a belief about who is there. A persona that is openly an assistant,
with a name and a manner, makes none.

Where a person did review the output before it reached the reader and the name is theirs, the third
limb of the definition is not met. Whether that person's review is itself something the reader is owed
notice of is Standard 40's decision, and nothing here pre-empts it.

### R2 — Do not deny being an AI when sincerely asked

**A system MUST NOT deny being an AI, or answer a sincere question with a human-source claim.**

A sincere question is the moment at which the person has said what they want to know. A denial then is
the plainest deception the standard names, and it is not excused by a persona, a brand voice, or an
operator instruction to stay in character. A question asked from inside a fiction the person began, such
as a game in which the person asked the system to play a human, is not a sincere question; if the person
steps out of the fiction and asks, it is.

**R2 reaches behaviour at inference time, and a repository can show only part of it.** What a reader can
see is the instruction channel: a prompt that tells the model to say it is human, or to deny being an
AI. What the model does with an unscripted question is decided by the model, its inputs and its
environment, and is not-evaluable from a repository. A recorded exchange in which the system denied being
an AI is a violation. The absence of such a record is not evidence of compliance.

An answer that neither denies nor claims is outside R2. Whether a person is owed an affirmative answer,
and by when, is Standard 40's decision and deadline, and this standard adds no second obligation to give
one.

### R3 — Do not suppress an owed disclosure

**A system MUST NOT be built so that an owed disclosure is suppressed.**

Standard 40 R2 requires an owed disclosure to reach the person by its deadline. That requirement is
violated by omission. This one is violated by an act: a line in a system prompt telling the model never to
mention that it is automated, a post-processing step that strips the notice from replies, a template
that drops the label when the channel is a telephone line, a configuration flag that disables the notice
for a segment of users on the project's own initiative.

Suppression does not need to succeed in every case to be a violation; a mechanism whose purpose is
removal is the violation, and a mechanism with the effect without the purpose is too. A filter that
removes sensitive text and, on one path, removes the notice as well, is within R3 for that path.

The same act can breach Standard 40 R2 and this requirement. Both findings are recorded, because the
first says a disclosure failed and the second says someone arranged it.

### R4 — This framework states no absence-of-deception verdict from an absence

**No framework output MAY state that a system makes no human-source claim, does not deny being an AI, or
suppresses no disclosure, because no prohibited string, instruction or filter was found in the
repository.**

This is a constraint on the framework, not on a project. A search that finds no "I am a human" string
shows only that the search found none: a persona is as often a photograph, a voice or a name as a
sentence, and a model asked an unscripted question may say what no file contains. The framework may
report that a prohibited instruction was *found*, as an observation, and may not turn the converse into a
verdict.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| The scripted human | A chat persona says "let me check with my colleague" when no colleague exists | R1 |
| The invented location | A voice agent says "I'm calling from our Leeds office" | R1 |
| The borrowed signature | A reply is signed with a named caseworker who neither wrote nor reviewed it | R1 |
| The human avatar | A photograph of a person is presented as the author of generated text | R1 |
| The denial | Asked "are you a bot?", the system answers "No, I'm a real person" | R2 |
| The in-character denial | An operator prompt tells the model to stay in persona even if asked, and it denies being an AI | R2, and R1 for the prompt |
| The silent instruction | A system prompt says never to reveal that the replies are automated | R3 |
| The stripped notice | A post-processing step removes the AI label on one channel | R3, and Standard 40 R2 |
| The segment with the flag off | A configuration disables the notice for a group of users, on the project's initiative | R3 |
| A nothing-found verdict | A framework report says a system "does not impersonate a human" because no matching string was found | R4 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | Each persona, script, signature template and avatar the system presents; for a signature, the record of who wrote or reviewed the output | The project's interface, persona and prompt files, and its workflow records | Human review |
| R2 | The instruction channel, read for an instruction to claim to be human or to deny being an AI; and any recorded exchange in which a sincere question was put, with the revision it ran against | Prompt files; a committed record of an exercise, where one exists | Human review for the first. **A recorded exchange establishes behaviour on the questions put and nothing more** |
| R3 | Each instruction, template, filter, post-processing step and configuration flag that bears on a disclosure the disclosure decision records as owed | Prompt files, output-processing code, channel configuration | Human review, with the disclosure decision and disclosure captures of Standard 40 as the reference |
| R4 | The absence of any framework output that states an absence-of-deception verdict from an absence | The catalog, detectors, rules and reports of this framework, and their tests | Code review |

Evidence for R1 to R3 is read by a human and by nothing else in this release. A document listing
personas and templates establishes that the project wrote them down; it does not establish what a
model said to a person at run time, which is not-evaluable from a repository and is not claimed.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that
every standard cite at least one rule or record in its Validation section why it ships with none; this is
that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that
each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section
below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** Neither `schemas/ai-system-manifest.schema.json` nor
   `schemas/ai-policy.schema.json` has a place for a persona, a signature template or the disclosure
   decision R3 depends on, and both are closed. A rule failing every project for omitting what no schema
   accepts would measure this framework's incompleteness. Adding a field is a schema-versioning decision
   outside this slice (plan 02 section 8).
2. **What the prohibitions concern is what a person was told, not what a file says.** A detector reading
   source would look for a string, which is a presence artifact, and R4 forbids this framework to report
   its absence as a result.
3. **No id is minted and the namespace is shared.** Whether to place a rule in `disclosure.`, a reserved
   segment of this pack that FinancialStandards also uses (`SHARED_SEGMENTS` in `scripts/catalog.mjs`),
   or elsewhere, with what meaning, is a decision for the owner. A proposed rule, if one is natural, is
   recorded in the pull request that introduced this document for per-rule approval, and not here.

**Validation type.** R1 to R3 are `manual-review` obligations in this release, with R2's behavioural
half not-evaluable. R4 constrains this framework and has no validation type, because the thing it
prohibits is a behaviour of the tool.

**Severity.** One level per requirement. These levels are this repository's judgment, listed in
Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | error |
| R2 | error |
| R3 | error |
| R4 | error |

**Exemptibility.** R4 is not exemptible, because it constrains this framework. **Whether R1 to R3 are
exemptible, and whether any is non-exemptible, is not decided here**; Standard 40 records the same
question as needing an owner's ruling, and it is raised, not answered. This release has no policy
mechanism that could record an exception in any case: Standard 2 R4 dispositions attach to catalog rules,
and this standard has none. Each of R1 to R3 arises on its condition: R1 where output reaches a person
outside the team; R2 where a system can be asked a question by one; R3 where a disclosure is owed. Where
the condition does not hold the requirement does not arise; that is a scope condition, not a disposition.
No level is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each persona, script, signature template and avatar the system presents is read against the three limbs of the definition | A persona asserting it is a person; a first-person human attribute stated as fact; a name, signature or avatar on generated output that nobody wrote or reviewed | A named assistant persona that asserts nothing human, and a reply signed by a person who reviewed it, must **not** be faulted |
| R2 | The instruction channel is read for an instruction to claim to be human or to deny being an AI, and any recorded sincere exchange is read | An instruction to do either, or a recorded sincere exchange in which the system denies being an AI or claims to be a person | A fiction the person began, in which the system plays a human at the person's request, must **not** be faulted; nor an answer that neither denies nor claims |
| R3 | Each mechanism bearing on an owed disclosure is read for suppression | An instruction, template, filter, post-processing step or flag whose purpose or effect is that an owed disclosure does not reach the person | A project whose decision records "not owed" has no owed disclosure to suppress; a filter with no effect on the notice must **not** be faulted |
| R4 | No framework output states an absence-of-deception verdict from an absence | A framework output that did so because nothing was found | Reporting that a prohibited instruction was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads a persona, a template or a disclosure
decision, and no fixture carries one, so R1 to R3 are held by review, and R4 holds today because no such
framework output exists. The falsifiers in the table are available for manual review; what this release
lacks is a detector that applies them. R2's behavioural half has no falsifier from a repository at all.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R3 in this release, because no rule exists to
except. A project that knowingly does not meet one records that in its own documents. No attestation is
produced for these records; [Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as
not yet produced. No record under this standard expires on a schedule.

A record made before the event below describes the earlier arrangement and no longer satisfies the
requirement it was offered for until it is re-made.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | A persona, script, signature template or avatar is added or changed, or the workflow that decides who reviews output changes |
| R2 | A listed change (the model, prompt, audience, channel, interface or law), since the instruction channel and the model's behaviour on a sincere question may both have changed |
| R3 | A change to anything that bears on an owed disclosure, including a revision of the disclosure decision and a new channel, template or output-processing step |
| R4 | A new detector, rule or report that touches deception or disclosure |

A person's report that they were told they were speaking to a human contradicts a record that says no
human-source claim exists until the record is re-examined. Incident handling is item 34's subject,
unwritten in this release.

## Additions this standard makes beyond the source

The brief contributes two words, "user disclosure", inside a bullet of four subjects, and no prohibition.
The specification records the negative face of that token as this item and names its title; the title is
the specification's, not the brief's. **Everything normative here is authored, and none of it has owner
approval:**

- **R1 to R4 in full**, including the choice of three prohibitions and the choice to state none of them
  as a duty to disclose, which is Standard 40's.
- **The four defined terms**, and in particular the third limb of the human-source claim (a name,
  signature or avatar on output nobody wrote or reviewed), the exclusion of a name, voice or personality
  from the definition, and the definition of a sincere question, including that a fiction begun by the
  person does not make a question insincere.
- **That an answer which neither denies nor claims is outside R2.**
- **That suppression is judged by purpose or by effect**, and that the same act may be recorded against
  this standard and Standard 40 R2.
- **That R2's behavioural half is not-evaluable from a repository** and that a clean record is not
  evidence of compliance.
- **The severity assignments**, the statement that exemptibility of R1 to R3 is left to the owner, and
  the staleness table.
- **The exclusions in Scope** as division lines, unconfirmed by anyone, including the decision that
  deception not about whether a person or AI is the source is outside this standard.
- **The acting on Standard 40's provisional division**, recorded open and owner-unconfirmed.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the
  decision to name no rule id.

Not authored here: posture `O`, and the finding that no other pack governs the item, are the boundary
review's.

## Relationship to other standards and ADRs

**[Standard 40](40-user-disclosure-of-ai-involvement.md) is the positive face of this item and is not
restated.** It decides whether a disclosure is owed, sets its deadline and requires a current capture;
this standard prohibits claiming a human source, denying being an AI when sincerely asked, and
suppressing what Standard 40 found owed. Standard 40 records the division as provisional and the
ownership of each deception case as awaiting an owner's ruling; that is unchanged here.

[Standard 7](07-boundary-with-adjacent-standards.md) records that UIUXDesignStandards owns how a
disclosure is presented and this pack whether one is owed; R2 there is why presentation is not restated.
Its R4 governs the shared `disclosure.` segment, in which no id is minted here.
[Standard 9](09-misuse-and-abuse-prevention.md) governs deliberate misuse of a system working as designed, which this
standard does not reach. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 governs the non-lowering
language, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests
section answers. [Standard 5](05-verdict-vocabulary.md) defines `not-evaluated`, the verdict this
framework's own reports would carry on R1 to R3.

[Standard 25](25-grounding-and-hallucination-control.md) governs whether a statement is true. Unwritten
items whose ground is not claimed: item 28, Capability Honesty to Users, governs what a system says about
its capabilities; item 34, AI Incident Response, governs handling an incident; and item 52, Output
Honesty Prohibitions, is the sibling prohibition on `capability honesty`.

**Outside this pack:** the boundary review records no adjacent-pack standard for this item, and none is
cited. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R3 is enforced; R4 holds today because no such framework output exists.**

Stated as separate lists so that a proposal is not read as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R1 to R3 | Not enforced; held by review. No detector, rule or script in `scripts/` or `rules/` has a concept of a persona, a human-source claim, a signature template or a suppressed disclosure |
| R4 | **Holds today because no such framework output exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report states an absence-of-deception verdict |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 to R3 | A place to record personas, signature templates and the disclosure decision: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and plan 02 section 8 puts it out of scope |
| R2 | A committed record of sincere questions put to the running system at a recorded revision | Needs a running system and an agreed way to run and record the exercise; it would establish behaviour on the questions put only |
| R3 | A search of prompt files and output-processing code for instructions to withhold AI involvement | A heuristic over free text; a false positive teaches a project to write whatever passes, and a miss is read as a clean result, which R4 forbids it to be |
| R4 | A test asserting no framework output states an absence-of-deception verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector or report that states a system makes no
human-source claim, does not deny being an AI, or suppresses no disclosure, from the absence of a string,
an instruction or a filter. R4 forecloses it: an absence is not an observation of what a person was told.
