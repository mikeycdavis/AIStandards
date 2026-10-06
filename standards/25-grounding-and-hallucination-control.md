# Standard 25 — Grounding and Hallucination Control

A language model produces fluent text whether or not the text is true, and fluency is the one signal
a reader can see. "The system hallucinates" is a description of that gap, and it is not a requirement:
it names no output, no source the output should have agreed with, and no observation that would show
the gap closed. Most systems that claim to have handled hallucination have done one thing — added a
retrieval step, or an instruction to "only use the provided context" — and then treated the existence
of that step as the property.

Three different things are routinely run together, and this standard exists to keep them apart. The
**grounding basis** is what an output is meant to be anchored to: a retrieved passage, a tool result,
text the user supplied, or nothing but what the model absorbed in training. A **grounding check** is a
step that compares an output with that basis. And **the output actually being supported** is a fact
about a single response at inference time, which neither the basis nor the check establishes and
which no reading of a repository can see.

The failure this standard is written against is taking the first for the third: a system with a
retrieval component, a citation instruction or a grounding prompt is reported as grounded because
those things exist.

Source: item 25 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "Hallucination" token of the "Hallucination, uncertainty, citation, and capability
honesty" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 25 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) with verdict `CHANGED` (the plan
> had it as `X`), and that review's substantive half is human judgment and carries
> `humanSignOff: null`. No maintainer of any adjacent pack has confirmed it.
>
> **The brief supplies one word and this standard supplies the rest.** The brief's bullet names
> "Hallucination" and says nothing about what a system must do about it. The item is class `D` because
> its subject token is the brief's own; the requirements below are this repository's judgment about
> that subject, and the [Additions](#additions-this-standard-makes-beyond-the-source) section lists
> them rather than describing them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it — a repository that invokes a model, retrieves context for one, or acts on a model's output —
whose output a person or another system relies on as a statement about the world, about supplied
material, or about the system's own state.

Covers: stating what an output is grounded in; keeping grounded and ungrounded output distinguishable
in the system's own data; checking an output against its basis where grounding is claimed; resolving
generated referents before they are acted on or shown as real; the claims a project may make about
the rate of ungrounded output; and the limit of what this framework can say about any of it.

Two terms, each defined here rather than by the brief:

- **Ungrounded output** is output carrying a claim that its stated basis does not support, or output
  that states a claim with no basis at all while being used as though it had one. A model answering
  from training alone is not thereby ungrounded; it is ungrounded only where the system or its users
  treat the answer as supported by a source it was not checked against.
- A **generated referent** is an identifier, URL, file path, record key, quotation, function name or
  figure that the model produced and that names something expected to exist outside the output.

It does **not** cover, and claims none of the ground of, three items that are unwritten in this
release and that the specification lists under the same bullet:

- **Item 26, Uncertainty Expression and Abstention** — whether and how a system says it does not
  know. This standard says what an output is anchored to; item 26 owns the system's disclosure of
  doubt and its refusal to answer.
- **Item 27, Citation and Source Attribution** — how a source is named and attributed to a reader.
  R1 below requires a *basis* to be stated; it does not require the basis to be shown to a user.
- **Item 28, Capability Honesty to Users** — what a system says about itself.

It also does not cover the **presentation** of generated content. Marking generated output so a user
does not take it for verified fact is UIUXDesignStandards' subject, recorded as an adjacency below, and
nothing here restates it. And it does not cover prompt injection through retrieved content, which
[Standard 21](21-prompt-and-instruction-security.md) and
[Standard 51](51-agent-and-tool-execution-prohibitions.md) govern: a passage that tells the model what to do is a
security matter, and a passage that is wrong is a grounding one.

**Boundary posture O — owned outright, after a correction.** The plan crosswalked this item to
EngineeringStandards' `ai.no-fabricated-capabilities` (posture `X`). The boundary review withdrew that:
the rule's subject is an engineering agent inventing APIs and repository facts, not a deployed system
generating ungrounded output for a user, and a false crosswalk "is worse than none because it implies
a division of ownership nobody made". It records two packs' standards as evidence, and only these:

- **EngineeringStandards, `standards/53-ai-engineering-honesty.md`, `ai.no-fabricated-capabilities`** —
  recorded as *not* a precedent for this subject. This standard does not crosswalk, restate or defer to
  it. Its subject is the coding agent's claims about a codebase.
- **UIUXDesignStandards, `standards/26-ai-user-experience.md`, `ai-ux.no-generated-as-verified`** —
  recorded as an adjacency. Its R1 says where a user could reasonably take generated output for
  verified, human-authored fact, the interface MUST mark it. That is presentation; this standard's R2
  concerns what the system hands to a presentation layer.

Both files exist at the commit the review pinned and at the sibling checkouts' current heads, read
through git objects: UIUXDesignStandards `7bff2e9` and EngineeringStandards `3b1b18d`, on 2026-10-03,
where the same rule id and the same R1 are present. The review's own pins are older
(`3f9cb8e` and `b90b915`, 2026-09-04); this is a recheck of two ids, not a refresh of the inventory.

## Requirements

### R1 — State what each relied-on output is grounded in

**A system MUST record, for each kind of output that a person or system relies on as a statement of
fact, what its grounding basis is — retrieved content, a tool result, user-supplied material, or no
basis beyond the model's own training — and MUST NOT leave the basis implied by the existence of a
retrieval component.**

The four bases are different claims. Retrieved content and tool results can be compared with the
output; user-supplied material can be compared with it too, but is only as true as the user made it;
and *no basis* is a legitimate answer that must be recorded as one. A system that writes "answers come
from our knowledge base" and also lets the model answer from training when retrieval finds nothing has
two bases and has described one.

The declaration is a document, not a manifest field. `schemas/ai-system-manifest.schema.json` is
closed and has no grounding property, and `dataSources` records a source's `name`, `kind`,
`synthetic` and `provenance`, not what any output is anchored to. Nothing in this requirement asks an
adopter to write a field that schema rejects.

### R2 — Keep grounded and ungrounded output distinguishable in the system's own data

**A system that returns output to a presentation layer, a downstream process or a log MUST carry, with
each relied-on output, whether it was produced with its declared basis available and whether any
grounding check ran on it, and MUST NOT merge output produced without its basis into the same
undifferentiated channel as output produced with it.**

A retrieval step that returns nothing and a model that answers anyway produce a response that looks
exactly like a grounded one. If the only record of the difference is in a trace nobody reads, the
presentation layer cannot mark it, the downstream process cannot discount it, and a later review has
no way to count it. Marking the output for a user is UIUXDesignStandards' business; this requirement
ensures the information needed to do so exists at the boundary.

What the distinction is *named* is the project's choice. This standard fixes no field, enum or
header.

### R3 — Where grounding is claimed, check the output against its basis, and say what happens on failure

**A system that claims an output is supported by retrieved content, a tool result or user-supplied
material MUST apply a check of that claim to the output, MUST record the check's method and what it
cannot detect, and MUST define what the system does with an output the check does not support. A
failing output MUST NOT be returned in the same form as a supporting one.**

A check may be code (a quotation present in the source, a figure equal to a returned value), a person,
or a model scoring the output against the passage. The method matters because they fail differently: a
string match misses a paraphrase that reverses the meaning, and a model checker shares the failure
modes of the model it checks. Where the checker is a model, the plan that governs it is
[Standard 17](17-evaluation-plans-for-generative-systems.md) R7, which this standard does not
restate.

"What the system does" is a disposition the project chooses — withhold, regenerate, return flagged,
route to a person. The requirement is that one exists and is not "return it anyway". A check that has
no consequence is a log line.

**A check that ran and found nothing is a statement about that check, not about the output.** It is
recorded as such (see R5 and R6).

### R4 — Resolve a generated referent before acting on it or presenting it as real

**A system MUST NOT act on a generated referent, or present it to a user as naming something that
exists, until it has been resolved against the thing it names; where it cannot be resolved, it MUST be
passed on as unresolved.**

The cheapest hallucination to catch is the one that names an object. A URL either returns or it does
not; a record key either exists in the store or it does not; a file path either resolves in the
repository or it does not. Where a system uses the output of a model as the argument to a tool, an
unresolved referent is both a grounding failure and the beginning of a worse one, which is why the
resolution happens *before* the action and not in a post-hoc review.

This is deliberately narrower than "verify every claim". It applies where the referent has an
authority that can be consulted mechanically. Where none can be, the output is unresolved, and the
requirement is only that it is not described as resolved.

It does not extend to the engineering agent that invents library behaviour while writing code for this
pack's own adopters; that is the subject EngineeringStandards' `ai.no-fabricated-capabilities` governs
and it is not claimed here.

### R5 — Describe the rate of ungrounded output as a measured quantity with a named subject

**A project MUST NOT state or imply that ungrounded output is prevented, eliminated or absent, and a
statement about how often it occurs MUST name the evaluated subject and the measurement it comes
from.**

A grounding control reduces something. Whether it reduces it for the inputs a system actually
receives, on the model identifier and prompt revision in use, is an empirical result, and it moves when
either changes. "Hallucination-free", "guaranteed accurate" and "grounded" used as a flat description
are claims no evaluation can support, because the evaluation can only report cases it ran.

Where a project reports a figure, the plan, the evaluated subject, the scorer and the treatment of
non-numeric results are [Standard 17](17-evaluation-plans-for-generative-systems.md) R1, R6, R7 and R8.
This requirement adds only the prohibition on the unqualified claim and the demand that a stated rate
point at a measurement. It does not set a threshold.

The property of a response being supported is a fact about model behaviour at inference time. It is
**not-evaluable** from a repository, and a project's own statement of its rate is evidence about an
earlier run, not about the next one.

### R6 — This framework MUST NOT report a system grounded from the presence of something

**No detector, rule, audit finding or generated report in this framework MAY state that a system is
grounded, that hallucination is controlled, or that a grounding check works because a retrieval
component, a citation instruction, a grounding prompt, a checker or a declaration is present in the
repository.**

This is a constraint on the framework, not on a project. A repository can show that a retrieval client
is imported, that a system prompt says "answer only from the context", or that a checker function
exists. It cannot show that the retrieval returned anything relevant, that the model obeyed the prompt,
or that the checker was called on the path a user's request takes. Reporting a pass from any of them
would turn the presence of a mechanism into a verdict about its effect, which is the failure this
standard is written against.

**A grounding check that exists and has never been shown to fail is not demonstrated to work.** A
check is shown by an input it rejects.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Basis by implication | "Answers come from the knowledge base" while the model answers from training when retrieval is empty | R1 |
| Unrecorded no-basis | An output with no basis at all described, or treated, as sourced | R1 |
| Silent fallback | A response produced without its basis is indistinguishable, in data and logs, from one produced with it | R2 |
| Distinction kept in a trace only | The flag exists in telemetry; the presentation layer and the downstream process never receive it | R2 |
| Check with no consequence | A grounding score is computed and logged and the response is returned regardless | R3 |
| Unstated checker blindness | A string match, or a model judge, whose misses are never recorded | R3 |
| Failing output returned in passing form | An unsupported answer sent to the user exactly as a supported one would be | R3 |
| Invented referent acted on | A generated URL, record key or path passed to a tool or shown as real without being resolved | R4 |
| Resolution after the fact | Referents checked in a later review, after the action they fed has happened | R4 |
| Elimination claim | "No hallucinations", "fully grounded", "guaranteed accurate" | R5 |
| Unattached rate | A percentage with no evaluated subject, scorer or measurement behind it | R5 |
| Presence read as effect | A framework report of "grounded" because a retrieval client or a grounding prompt exists | R6 |
| Untested check | A grounding check shown to run and never shown to reject anything | R3, R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | A record of each relied-on output kind and its basis | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | The fields, headers or log shape that carry the distinction, and a sample showing both cases | The project's output contract and a captured example of each | Human review |
| R3 | The check's method, its stated blind spots, the disposition on failure, and a run showing an output rejected | The project's evaluation records ([Standard 17](17-evaluation-plans-for-generative-systems.md) governs a plan, if any) | Human review of the records |
| R4 | The point in the call path where each generated referent is resolved, and the unresolved branch | Project code and tests | Human review; a project's own test where one exists |
| R5 | Any published statement of a grounding rate, with its evaluated subject and measurement | The project's documentation and evaluation results | Human review |
| R5 (inference-time property) | None obtainable from a repository | — | **Not-evaluable** |
| R6 | The absence of any detector that reports grounding from presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R4 is a human-authored record. A document naming a basis, a check or a resolution
step establishes that the project wrote it down, and says nothing about whether the running system
does it; the reviewer reads what is claimed against the code that would carry it out.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
[Standard 6](06-standard-structure-and-rule-identity.md) R3 requires every standard to cite at least
one rule or record why it does not; this is that record.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 would look for a declared grounding basis,
   and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a
   place to put one; both are closed. A rule failing every project for omitting what no schema accepts
   would measure this framework's own incompleteness and blame the project for it. Adding a schema
   field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **R3 to R5 concern behaviour, not files.** Whether a check rejects what it should, whether a
   referent is resolved on the path a request takes, and whether a rate was measured on the shipped
   configuration are not properties of a checkout. A detector reading source would be testing for the
   presence of a mechanism, which R6 forbids this framework from reporting as a result.
3. **No rule namespace exists for it.** The `honesty` namespace is reserved
   ([Standard 7](07-boundary-with-adjacent-standards.md) R3 names `honesty.no-fabricated-capability-claim`
   as a later-phase id) and has no shard. This standard mints no id; naming one is for the item that
   owns capability claims or for a later decision, and it needs an owner's ruling on which item owns it,
   as the open questions Q10, Q12, Q15, Q19 and Q20 record for other placements (Q16 was answered on 2026-10-05). No such question
   is recorded for this item, because nothing here needs one answered.

**Severity.** R1 to R5 are `manual-review` obligations in this release. R5's inference-time property
is **not-evaluable** and is not reported as reviewed. R6 constrains this framework and has no
validation type, because the thing it prohibits is a behaviour of the tool.

**Exemptibility.** R6 is not exemptible: no project circumstance makes it reasonable for a scan to
report an effect from a presence, and a mechanism for excepting the prohibition would be
self-defeating. R5's prohibition on an unqualified elimination claim is likewise not exemptible, because
an exception would record a project as knowingly making a claim no evidence can support; a project that
wishes to say something stronger must supply the measurement. R1 to R4 reach a system only where its
subject exists — R3 only where grounding is *claimed*, R4 only where the system produces a referent
— and a system without that subject may declare the requirement not-applicable under
[Standard 2](02-ai-risk-tiering-and-applicability.md) R4 with a reason and a `revisitWhen`. No detector
in this release would contradict a false declaration. No level here is lowered by a risk tier
(Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | A relied-on output kind has a recorded basis among the four | A retrieval component present with no record of what the output is anchored to | A system whose recorded basis is "none beyond the model's training" must **not** be reported as missing a basis |
| R2 | A sample of output produced with its basis and one produced without it differ in the data the system emits | The two samples are byte-identical in the output contract | A system that never has a basis to lose (R1 records none) must not be failed for lacking the distinction |
| R3 | A supplied input the check should reject is rejected and does not reach the user in passing form | The check logs a failure and the output is returned unchanged | A supported output passes without being flagged; a check that rejects everything is not a working check |
| R4 | A generated referent that does not resolve is passed on as unresolved and the action is not taken | A tool call executed with an unresolved referent | A referent that resolves is acted on without being blocked |
| R5 | A published rate names an evaluated subject and a measurement | "Hallucination-free" or a rate with neither | A statement reporting a measured rate on a named subject, with the number and no stronger claim, must **not** be flagged |
| R6 | No detector or report in this repository outputs a grounding verdict from presence | A detector that reported grounded because a retrieval import was present | Reporting that a grounding prompt or retrieval client was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads a grounding artifact and no fixture
carries one, so R1 to R5 are enforced by review or not at all, and R6 holds by construction. The
negative controls state what review must not do to a project that has the right subject and does the
right thing. **A requirement with no falsifier is a requirement nobody can be shown to have broken**,
and that is the honest state of this standard.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to
except. A project that knowingly does not meet one records that in its own documents; Standard 2's
dispositions apply to the application of a rule, and this standard has none.

**What invalidates a recorded basis, check or rate.** Each of these is a different subject, and a
record made before the change describes the earlier one:

- a change of model identifier, or a model silently updated behind an alias
  ([Standard 1](01-ai-system-manifest.md) R4 asks for the identifier to be pinned);
- a change of the retrieval corpus, the index, the chunking or the retrieval parameters;
- a change of the prompt that instructs the model about its basis, or of the checker's own model or
  threshold;
- a change in what a tool returns, since a tool result is a basis;
- the first deployment to users who rely on the output for a decision they were not making before.

**Staleness is asymmetric here.** A grounding record becomes false when a project *changes* something
that feeds the model, and a change to a corpus or a prompt is exactly the sort of edit nobody treats as
a change to the system. Nothing in this release detects the transition; the invalidating events above
are a note to a future reader. A rate measured on last quarter's index describes last quarter's
system.

**Contradicted by operation.** An observed ungrounded output that reached a user is a contradiction of
whatever the project recorded under R3 and R5, and invalidates it until re-examined. What happens
operationally is item 34's subject (AI Incident Response, unwritten in this release); this standard
says only that the record no longer stands.

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one word, "Hallucination", inside a bullet of four
subjects. It states no requirement, level or evidence for any of them. The items that carry it are
class `D` because their subject token is derived from the brief; the requirements are not derived.
Specifically authored here, none of it owner-approved:

- **R1's four bases** (retrieved content, tool result, user-supplied material, none) and the ruling
  that "none" is a legitimate recorded answer, and that the existence of a retrieval component is not
  a statement of basis.
- **R2 in full**: the requirement that the distinction between output produced with and without its
  basis exists in the system's own data, kept separate from the presentation question.
- **R3 in full**, including the requirement that a failing output not be returned in the form of a
  passing one, and that the checker's method and blind spots be recorded. The choice to leave the
  disposition on failure open (withhold, regenerate, flag, route) is a choice.
- **R4's narrowing** to generated referents with a mechanically consultable authority, and its timing
  (before the action, not after).
- **R5's prohibition** on stating that ungrounded output is prevented, eliminated or absent, and the
  rule that it is not exemptible. It sets no rate and no threshold.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in
  [Standard 8](08-ai-safety-requirements-and-safety-cases.md) and
  [Standard 17](17-evaluation-plans-for-generative-systems.md).
- **The four exclusions in Scope** (items 26, 27, 28, and presentation) as division lines. The
  specification lists items 26 to 28 under the same bullet; where this standard stops and each begins
  is unconfirmed by anyone.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the
  decision not to name a rule id in the unsharded `honesty` namespace.
- **The recheck of two sibling ids** at the sibling checkouts' current heads, which the boundary review
  did not make.

Not authored here, and recorded so the reader does not credit this standard with it: the withdrawal of
the `ai.no-fabricated-capabilities` crosswalk and the classification of
`ai-ux.no-generated-as-verified` as an adjacency are the boundary review's, not this document's.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) R3 records the crosswalk this standard's posture
withdrew, and lists `honesty.no-fabricated-capability-claim` as a later-phase id. That id concerns
capability claims (item 28), not grounding, and is not minted or claimed here.

[Standard 17](17-evaluation-plans-for-generative-systems.md) governs how an evaluation of generative
behaviour is planned, scored and reported, and R5 relies on it for any grounding rate. It is where a
judge model's recording lives (R7) and where non-numeric results are handled (R8). Nothing here
restates it, and R3's checker-as-model case points at it.

[Standard 21](21-prompt-and-instruction-security.md) and
[Standard 51](51-agent-and-tool-execution-prohibitions.md) govern content that tells the model what to do. A
retrieved passage that is *wrong* is this standard's subject; one that *instructs* is theirs, and a
passage can be both.

[Standard 8](08-ai-safety-requirements-and-safety-cases.md) R3 and R4 say how a safety case cites
evidence. A grounding check or a measured rate may be cited there, labelled by kind and revision; this
standard does not say when a grounded output is safe.

[Standard 1](01-ai-system-manifest.md) declares models, prompts and data sources, and R1 here depends on
the model identifier it asks to be pinned. It does not declare grounding, and no field is proposed
by this standard. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the
applicability and non-lowering language used above. [Standard 6](06-standard-structure-and-rule-identity.md)
R3 is the requirement the Validation section's no-rule record answers.

Items 26 (Uncertainty Expression and Abstention), 27 (Citation and Source Attribution) and 28
(Capability Honesty to Users) are unwritten in this release; the lines drawn above are provisional until
they are, and the later standards may legitimately move them.

**Outside this pack.** EngineeringStandards' `ai.no-fabricated-capabilities` and UIUXDesignStandards'
`ai-ux.no-generated-as-verified` are named in Scope with what the boundary review recorded about each.
They are not crosswalks, and no maintainer of either pack has confirmed that reading. No ADR covers this
standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds by construction.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away
as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds by construction, not by assertion.** No detector, rule or report in `scripts/`, `rules/` or `ai-policy.yml` has a concept of grounding: a search of `scripts`, `schemas`, `templates`, `rules`, `ai-policy.yml` and `test` for the subject finds no use of it, other than the English word in a comment in `scripts/catalog.mjs`. No test asserts the absence, so a future detector could break R6 without failing one |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's grounding |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 | A grounding-basis declaration with a place to live: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R2 | A convention for the distinction at the output boundary; it cannot be read from a repository without a notion of the output contract | The shape is the project's; this framework would be guessing |
| R3, R4 | Fixtures with a rejected and an accepted case, and a detector that runs project-supplied checks | Phase 3 detector and evidence-availability work; the plan says detectors wait for the corpus |
| R5 | A check that a published rate names a subject and a measurement | Reading intent from free text is a heuristic, and a false positive teaches a project to write whatever passes |
| R6 | A test asserting no detector emits a grounding verdict | Meaningful only once a detector exists for it to constrain |
| Rule id | A reserved-namespace id and a shard, once an owner is decided | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system grounded, or hallucination
controlled, from the presence of a retrieval component, a citation instruction, a grounding prompt or a
declaration. R6 forecloses it, and the foreclosure is the point: a presence is not an effect, and a
framework reporting one would put its authority behind a property of the running system that nothing in
a repository can show.
