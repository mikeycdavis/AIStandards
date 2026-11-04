# Standard 26 — Uncertainty Expression and Abstention

A system that answers every question in the same fluent register tells its reader nothing about which
answers to trust. Two things can be done about that: the system can say how sure it is, and it can
decline to answer when it has too little to go on. Both are easy to claim and hard to observe. A
sentence such as "I'm not certain, but" can be generated whatever the model's state, a percentage can
be printed beside any answer, and a fallback string can stand in for an answer that was never produced.

This standard is about the **decisions and records** around those two behaviours, not about whether a
model's doubt is real. It asks that a project decide whether and when its system abstains, keep an
abstention distinguishable from an answer in the system's own data, say what any uncertainty signal is
derived from, and describe how well confidence tracks correctness only as a measured quantity with a
named subject. It does not set a threshold, a calibration method or a wording.

The failure this standard is written against is a signal with no source: a confidence figure, a hedge or
an "I don't know" that exists because the interface or the prompt produces it, reported as if it were the
system's knowledge of its own limits.

Source: item 26 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "uncertainty" token of the "Hallucination, uncertainty, citation, and capability
honesty" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 26 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **B**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) with verdict `CHANGED` (the plan
> had it as `D`), and that review's substantive half is human judgment and carries
> `humanSignOff: null`. No maintainer of any adjacent pack has confirmed it.
>
> **The brief supplies one word and this standard supplies the rest.** The brief's bullet names
> "uncertainty" and says nothing about what a system must do about it, and it does not use the word
> "abstention". The item is class `D` because its subject token is the brief's own; the requirements
> below are this repository's judgment about that subject, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it
— a repository that invokes a model, retrieves context for one, or acts on a model's output — whose
output a person or another system relies on as an answer, a statement or a decision input.

Terms, defined once and used verbatim below:

- **Abstention** — the system's act of not giving the substantive answer or result that was asked for,
  because it has too little basis to give one, and saying or recording that it has not. A refusal on
  misuse, safety or authority grounds is not an abstention here.
- **Uncertainty signal** — anything the system emits or shows that indicates an output may be wrong or
  incomplete: a confidence figure or label, a hedge the system generates, a flag, a ranking of
  alternatives, or an abstention.
- **Signal basis** — what an uncertainty signal is derived from: the model's own stated self-assessment,
  token probabilities, a retrieval score, a verifier or judge, disagreement between samples or models, a
  rule, or a fixed template.
- **Abstention decision** — for each kind of output that a person or system relies on: whether the
  system may abstain, on what condition, and what it does instead, or that it never abstains and the
  reason.
- **Listed change** — a change of model, prompt, retrieval corpus, threshold, or the use made of the
  output.
- **Framework output** — what a detector, catalog rule, audit finding or generated report of this
  framework states.
- **Presence artifact** — a hedging instruction in a prompt, a threshold constant, a confidence field, an
  "I don't know" string or a declaration.

It does **not** cover, and claims none of the ground of:

- **Uncertainty and abstention on a prediction record.** Where a system emits prediction records,
  PredictionStandards owns the requirements on them. The boundary review records its
  `02-uncertainty.md` (rules `uncertainty.interval-present` and `uncertainty.interval-coherent`, with the
  scope "Applies to every prediction. Abstentions are outside it") and its `17-abstention.md` (rules
  `abstention.first-class-output`, `abstention.no-manufactured-prediction` and `abstention.valid-shape`,
  with the scope "Applies to every record and to the systems that produce them"). Nothing here restates
  those rules. The requirements below apply to a system's output that is not such a record.
- **How uncertainty is conveyed in an interface**, which the boundary review assigns to
  UIUXDesignStandards, whose `26-ai-user-experience.md` R6 it records as reading: "Where a system has a
  defensible measure of its own confidence, the interface SHOULD convey it. An interface MUST NOT invent a
  confidence indication that the underlying system does not produce." Nothing here restates it.
- **Whether an output is anchored to a basis**, which is [Standard 25](25-grounding-and-hallucination-control.md),
  and **how a source is named to a reader** (item 27) and **what a system says about its capabilities**
  (item 28).
- **Refusals on misuse, safety or authority grounds**, which belong to
  [Standard 9](09-misuse-and-abuse-prevention.md) and [Standard 10](10-human-oversight-and-intervention.md).
- **The method of calibration or metric selection**, which [Standard 7](07-boundary-with-adjacent-standards.md)
  records as MachineLearningStandards'.

**Boundary posture B — baseline, with named halves deferred.** The boundary review changed the posture
from `D`: PredictionStandards' rules are scoped to prediction records and report not-applicable in their
absence, so an assistant that hedges in prose and emits no record would otherwise be governed by nobody.
This standard states the general requirement and defers to PredictionStandards for a system that emits
prediction records, and to UIUXDesignStandards for presentation. The review's owner entry reads
"PredictionStandards for systems emitting prediction records; AIStandards otherwise;
UIUXDesignStandards for how it is conveyed in an interface". Nothing is claimed here about those packs
beyond that record (reviewed 2026-09-04). The review also records one unknown: whether a generative
system's self-reported confidence is a defensible measure at all. This standard does not answer it,
and R3 and R4 are written so that they do not need the answer.

## Requirements

### R1 — Have an abstention decision

**A project MUST have an abstention decision for each kind of output that a person or system relies on.**

"Never abstains" is a legitimate decision, recorded with its reason: a system that must return a
best-effort draft for a human to edit is a different case from one whose output is acted on unseen.
What is not legitimate is the absence of a decision, because then the answer to "what happens when the
system has nothing to go on" is whatever the model happened to generate. The decision is a document, not
a manifest field.

### R2 — Keep an abstention distinct from an answer in the system's own data

**Where the system abstains, the abstention MUST reach every downstream consumer in a form that cannot be
read as an answer, and the system MUST NOT substitute a default, a guess or a placeholder presented as the
answer.**

An empty string, a zero, a generic apology returned with a success status, or a fallback value that a
consumer parses as a result is an answer from the consumer's side. Whether the abstention is a distinct
status, a distinct type or a flagged field is not decided here; what matters is that a consumer, human or
program, can tell the two apart without inspecting the wording.

### R3 — State the basis of each uncertainty signal

**Each uncertainty signal the system emits or shows MUST have a recorded signal basis, and a signal
produced by a fixed template MUST be recorded as one.**

A hedge the model generates from its own text, a threshold on a retrieval score and a fixed footer
reading "AI can make mistakes" are three different signals, and a reader or reviewer cannot weigh them
without knowing which one they are looking at. A signal whose basis is the model's own stated
self-assessment is recorded as that; this standard does not decide whether such a basis is sound (the
boundary review records that as unknown), only that it is not passed off as another one.

### R4 — Describe confidence tracking correctness only as a measured quantity

**A project MUST NOT state or imply that its system's expressed confidence or abstentions are reliable,
calibrated or well-judged unless the statement names the measurement: which outputs, over what period or
workload, what counted as correct, and the result.**

"Calibrated" and "knows when it doesn't know" are claims about a rate, and a rate has a denominator. A
figure computed on an earlier model, prompt or corpus and presented as describing the current system is
a statement about a different system. How the measurement is made, and which metric is used, is not
decided here (Standard 7 gives metric selection and calibration to MachineLearningStandards).

### R5 — Revisit the record on a listed change

**On each listed change the abstention decision and the signal-basis record MUST be revised, or recorded
as re-examined and affirmed, with its date.**

A threshold chosen for one model and one corpus does not carry over to another, and the interface that
shows a signal can keep showing it after the thing that produced it has changed. The decision is written
once and the model is swapped quarterly.

### R6 — This framework MUST NOT report a system's uncertainty handling from the presence of something

**No framework output MAY state that a system expresses uncertainty appropriately, abstains correctly or
has calibrated confidence because a presence artifact is present.**

This is a constraint on the framework, not on a project. A repository can show that a prompt says "say
when you are unsure", that a threshold constant exists or that an "I don't know" string is defined. It
cannot show that the model hedges when it should, that the threshold is reached on any path a user's
request takes, or that the string is returned instead of a guess. Reporting a pass from any of them would
turn the presence of a mechanism into a verdict about its effect. This is the form of
[Standard 25](25-grounding-and-hallucination-control.md) R6.

## Failure modes

| Requirement | Failure |
| --- | --- |
| R1 | A relied-on kind of output has no abstention decision, or the decision is recorded for the system as a whole while kinds of output differ |
| R2 | An abstention is returned as an empty value, a default or a placeholder a consumer reads as an answer; or the system, instead of abstaining, produces a guess presented as an answer |
| R3 | A confidence figure, label or hedge is shown with no recorded basis; or a fixed template is recorded as, or presented as, a measurement the system made |
| R4 | "Well calibrated" or "knows when it doesn't know" is stated with no named measurement, or with a measurement of an earlier model, prompt or corpus presented as current |
| R5 | A listed change occurred and the decision and basis record were neither revised nor recorded as re-examined and affirmed |
| R6 | A framework output states a system's uncertainty handling is adequate because a presence artifact is present |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The abstention decision for each relied-on kind of output | A project document the project names; **no manifest or policy field exists for it** | Human review |
| R2 | The abstention's representation at each consumer boundary, and a captured abstention passed through to the consumer | The project's interfaces, schemas and sample outputs | Human review |
| R3 | The signal-basis record for each emitted uncertainty signal | A project document the project names | Human review |
| R4 | Each reliability claim with the measurement it names | The project's documentation and public statements | Human review |
| R5 | The dated revision or re-examination records | Version control and the project's records | Human review |
| R6 | The absence of any framework output that states an uncertainty-handling verdict from a presence artifact | The catalog, detectors, rules and reports of this framework, and their tests | Code review |

A document establishes that the project wrote a decision down; a captured abstention reaching a consumer
shows R2. Whether a model abstains when it should, or whether its confidence tracks correctness at
inference time, is not-evaluable from a repository and is not claimed.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
[Plan 02 section 6](../artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md) requires every
standard to cite at least one rule or record in its Validation section why it ships with none; this is
that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that
each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section
below answers it.

1. **There is no artifact a rule could read.** Both `schemas/ai-system-manifest.schema.json` and
   `schemas/ai-policy.schema.json` are closed and have no place for an abstention decision or a signal
   basis; adding one is a schema-versioning decision outside this slice (plan 02 section 8).
2. **The subject is behaviour at inference time.** Whether the system abstains when it should or whether
   its confidence tracks correctness is not a property of a checkout. A detector could only read a prompt
   string or a threshold, which R6 forbids this framework to report as a result; the boundary review
   records the same expectation.
3. **No id is minted.** `uncertainty` and `abstention` are the namespaces PredictionStandards' rules use,
   and neither is a segment this pack reserves. Which reserved namespace a rule would sit in, if one is
   warranted, is the owner's to decide; the integrator records any proposal.

**Validation type and severity.** R1 to R5 are `manual-review` obligations in this release; R6
constrains this framework and has no validation type. These levels are this repository's judgment, listed
in Additions, and are not owner-approved:

| Requirement | Validation type | Severity |
| --- | --- | --- |
| R1 | `manual-review` | `warning` |
| R2 | `manual-review` | `error` |
| R3 | `manual-review` | `warning` |
| R4 | `manual-review` | `error` |
| R5 | `manual-review` | `warning` |
| R6 | none (a constraint on the framework) | none |

**Exemptibility.** R6 is not exemptible, for the reason R6 of Standard 25 is not. R4 is not exemptible,
because an exception would record a project as knowingly making a claim nothing supports. R1 to R3 and R5
arise only where the system produces output a person or system relies on (the condition in Scope); R3
arises only where an uncertainty signal is emitted, R5 only where R1 or R3 applies. Where a condition does
not hold the requirement does not arise, which is a scope condition and not a disposition:
[Standard 2](02-ai-risk-tiering-and-applicability.md) R4's dispositions attach to catalog rules, and this
standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each relied-on kind of output has an abstention decision | A relied-on kind of output with no decision | A decision "never abstains — best-effort draft a human edits" is a decision |
| R2 | A captured abstention, followed to each consumer, is distinguishable from an answer without reading its wording; no default or placeholder is returned in place of it | An abstention that a consumer receives in the form of an answer, or a guess returned where the decision says abstain | A system that returns a distinct abstention status and a human-readable explanation must **not** be faulted for the explanation |
| R3 | Each emitted uncertainty signal has a recorded signal basis, and a fixed template is recorded as one | An emitted signal with no recorded basis, or a template recorded as a measurement | A footer recorded as "fixed template" with no claim about the answer must **not** be faulted for being fixed |
| R4 | Each reliability claim names which outputs, the period or workload, what counted as correct and the result, and is not an earlier basis presented as current | A reliability claim naming none or only some of them, or an earlier figure presented as current | A project that makes no reliability claim and records its signal basis as unvalidated must **not** be faulted |
| R5 | After each listed change the decision and basis record are revised or dated as re-examined and affirmed | A listed change with neither | A change outside the listed changes needs no entry |
| R6 | No framework output states an uncertainty-handling verdict from a presence artifact | A framework output that did so because a presence artifact was found | Reporting that a threshold constant was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads these records and no fixture carries one,
so R1 to R5 are held by review, and R6 holds today only because no such framework output exists. The
falsifiers are manual, not absent. A record made stale by the event in the staleness table does not
satisfy the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism in this release, because no rule exists to except. A
project that knowingly does not meet a requirement records that in its own documents.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | A listed change |
| R2 | A change of the interface, schema or consumer that carries the abstention |
| R3 | A listed change, or a change of how a signal is produced or shown |
| R4 | A listed change, for a claim presented as current; a claim about a completed period stays true of that period |
| R5 | The next listed change |
| R6 | A new detector, rule or report that touches uncertainty or abstention |

No attestation is produced for these records in this release, and none expires on a schedule.
[Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by
default, but it governs catalog rules and none exists here. Incident handling is item 34's subject (AI
Incident Response).

## Additions this standard makes beyond the source

The brief contributes one word, "uncertainty", inside a bullet of four subjects. It states no
requirement, level or evidence, and the word "abstention" in the title is the specification's, not the
brief's. Specifically authored here, none of it owner-approved:

- **Every defined term and R1 to R5**, including that "never abstains" with a reason is a legitimate
  decision while an absent decision is not; the rule that an abstention reaches consumers in a form not
  readable as an answer; the signal-basis record and the fixed-template case; the rule that a
  reliability claim is a measured quantity with a named subject; and the listed changes.
- **R6**, in the form of Standard 25 R6 and Standard 40 R5, and the definition of presence artifact.
- **The definition of abstention** as excluding refusals on misuse, safety or authority grounds.
- **The severity and validation types** in Validation, and the staleness table.
- **The exclusions in Scope** as division lines, unconfirmed by anyone.
- **The ruling that this standard ships with no catalog rules**, and the decision to mint no id.

Not authored here: posture `B`, the owner entry and the recorded evidence from PredictionStandards and
UIUXDesignStandards are the boundary review's.

## Relationship to other standards and ADRs

[Standard 25](25-grounding-and-hallucination-control.md) says what an output is anchored to and is the
source of R6's form; this standard says what the system does about an output it cannot support.
[Standard 7](07-boundary-with-adjacent-standards.md) records that PredictionStandards owns uncertainty
and abstention on a prediction record and that this pack owns the general case, and gives calibration
and metric selection to MachineLearningStandards; its R2 (link, do not copy) is why none is restated.
[Standard 40](40-user-disclosure-of-ai-involvement.md) is the structural precedent for the decision,
record and listed-change requirements. [Standard 1](01-ai-system-manifest.md) declares no abstention or
uncertainty property, and none is proposed. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and
R4 govern the non-lowering and disposition language used above, and
[Standard 6](06-standard-structure-and-rule-identity.md) R3 is what the Tests section answers.

Items 27, 28 and 34 are named in Scope or above and are not restated. **Outside this pack:**
PredictionStandards' `02-uncertainty.md` and `17-abstention.md` and UIUXDesignStandards'
`26-ai-user-experience.md` are named in Scope with what the boundary review recorded; this is a
deference, not a crosswalk, and no maintainer has confirmed it. No ADR covers this standard —
`artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds today only because no such framework output exists.**

Stated as two separate lists, so that a proposal is not carried away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R1 to R5 | Not enforced; held by review |
| R6 | **Holds today because no such framework output exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` has a concept of uncertainty, confidence or abstention |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1, R3, R5 | A place to declare an abstention decision and signal basis: a schema change or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R2 | Captured abstention fixtures passed through a consumer boundary | Needs a running system, which is Phase 3 detector work |
| R4 | A check that a reliability claim names its measurement | Reading intent from free text is a heuristic, and a false positive teaches a project to write whatever passes |
| R6 | A test asserting no framework output emits an uncertainty-handling verdict | None exists; proposed here, not built |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A framework output that states a system expresses uncertainty
appropriately, abstains correctly or has calibrated confidence from the presence of a prompt instruction,
a threshold, a confidence field or a string. R6 forecloses it: a presence is not a behaviour.
