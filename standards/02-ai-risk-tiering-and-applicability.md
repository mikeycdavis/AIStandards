# Standard 2 — AI Risk Tiering and Applicability

A pack of fifty-three standards applied uniformly to every project is a pack that gets switched off.
A read-only summarisation helper and an agent with production database credentials are both AI
systems, and requiring the second one's controls of the first is how a standards pack earns the
reputation that gets it removed from CI.

This standard is how a project says which requirements reach it, and — more importantly — how it is
prevented from saying that about requirements that do reach it. Every mechanism below exists in both
directions: applicability narrows scope, and each narrowing carries a cost in recorded justification
that makes narrowing-by-convenience visible.

The distinction this standard turns on is that **a risk tier is a human determination about
consequences in the world, and this framework reads repositories.** No file in a checkout establishes
who is harmed when the system is wrong. A tier is therefore declared, never derived, and a check that
inferred one would be manufacturing exactly the judgment it is least equipped to make.

Source: item 2 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md).

> **Numbering is frozen by the specification.** Item 2 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. The boundary posture is **O**, evidenced in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json), whose substantive half
> is human judgment and carries `humanSignOff: null`.
>
> **This item is authored, not derived.** The brief names ten subject areas and gives no way to
> decide which apply to a given system. Every requirement below is this repository's own judgment,
> and the [Additions](#additions-this-standard-makes-beyond-the-source) section says so in full
> rather than in part.

## Scope

Applies to every project adopting this pack, without exception, because a project cannot use
applicability to declare the applicability standard inapplicable. That is not a rhetorical flourish:
it is the one place where circularity would let a project switch off the mechanism that records what
it switched off.

Covers: the risk tier and who determines it; which requirements a tier reaches; the four dispositions
a rule can have when it is not simply passed or failed; and the prohibition on inferring a tier from
repository contents.

Does **not** cover: what any specific tier requires — that is each subject standard's business;
autonomy levels and delegated authority, which are item 11's subject
and are declared rather than judged (that standard is unwritten in this release); or model risk in the statistical sense, which
MachineLearningStandards owns.

**Boundary posture O — owned outright.** The boundary review searched the nine adjacent packs for an
owner of AI risk tiering and found none. MachineLearningStandards' evaluation standards concern model
performance rather than deployment consequence, and no pack in the portfolio governs which of its own
requirements reach a given project.

## Requirements

### R1 — The risk tier is declared, and it is a human determination

**Every project adopting this pack MUST declare a risk tier for each AI system it operates, and the
tier MUST be recorded as a determination made by a named person, not as a property computed from the
repository.**

Four tiers, and the discriminator is consequence, never capability:

| Tier | The system's wrong answer | Examples of the discriminator |
| --- | --- | --- |
| `minimal` | Costs the user a moment | Output is discarded or trivially re-run; no external effect |
| `limited` | Costs the user work | Output feeds a human decision that a human still makes |
| `elevated` | Materially affects a person's money, access, health, employment or legal position | The system's output is acted on, or a person is subject to it without choosing to be |
| `critical` | Causes harm that cannot be undone by noticing it later | Safety, irreversible external action, or a population that cannot opt out |

**A larger model, more tools or more autonomy does not raise the tier by itself.** They raise
*likelihood*, and tiering is about consequence. A read-only agent summarising medical records is
`elevated` for what it can leak; an autonomous agent reorganising a scratch directory is `minimal`
for what it can destroy. Conflating the two is the most common tiering error and produces exactly the
inverted priority where the flashy system is governed and the quiet one is not.

### R2 — Tiering is not derived from the repository, and no check may infer one

**No detector, heuristic, or audit finding in this framework MAY assert, propose, or default a risk
tier, and an undeclared tier MUST be reported as undeclared rather than assumed.**

This is the requirement that constrains the framework rather than the project, and it is the reason
this standard exists in an authored form. A repository scan can observe that a system calls a model,
holds credentials, or declares four tools. It cannot observe who depends on the output, whether a
person can contest a decision, or what happens when nobody notices for a week. Those are the facts
tiering is *about*.

A framework that guessed would be wrong in the direction that matters: it would guess from the
signals it can see, which are capability signals, and capability is precisely the wrong
discriminator under R1. The guess would then carry the framework's authority into a judgment no
engineer made.

**An undeclared tier is missing evidence, not `minimal`.** Defaulting to the lowest tier turns
silence into an exemption; defaulting to the highest turns the pack into noise that gets disabled.
Neither is honest, and the correct disposition is the one in R4.

### R3 — A tier narrows what applies; it never lowers what a rule demands

**A risk tier MUST NOT be used to reduce a rule's level, severity, or exemptibility. It may only
determine whether the rule's subject is in scope at all.**

These look similar and are not. "This project has no retrieval corpus, so retrieval rules do not
reach it" is a claim about the project. "This project is low-risk, so its retrieval corpus needs less
provenance" is a negotiation with a requirement, and it is the mechanism by which a standards pack
becomes advisory without anyone deciding that it should.

**A `nonExemptible` rule is unreachable by tiering in either direction.** The prohibitions in Band L
are prohibitions at every tier. A `minimal`-tier system may still not fabricate evaluation results.

### R4 — Four dispositions, and none of them substitutes for another

**A rule that is neither passed nor failed MUST be recorded under exactly one of the four
dispositions below, and a project MUST NOT record one where another is true.**

| Disposition | What is being claimed | What the project owes | Effect on the verdict |
| --- | --- | --- | --- |
| **Justified non-applicability** | The rule's subject does not exist here | A reason, and a `revisitWhen` naming the change that would make it applicable | Excluded from the scored denominator |
| **Missing evidence** | The subject may well exist; nothing established whether the rule is met | Nothing — this is the framework's own report about itself | `not-evaluated`; never a pass, never a failure |
| **Exception** | The subject exists, the rule applies, and the project knowingly does not satisfy it | A named approver, a real date, and a scope | Counted as excepted, and visible as a known gap |
| **Contradicted applicability** | The project declared the subject absent and a check observed it present | A correction to the policy, or to the repository | `BLOCKED_BY_INVARIANT`; no score is emitted |

The substitutions this forbids are specific, and each has a characteristic tell:

- **Non-applicability standing in for an exception** is the common one. It converts a known gap into
  an apparent non-question, and the gap stops being visible to anyone reading the policy. The tell is
  a `revisitWhen` that names no change the project could plausibly make.
- **Non-applicability standing in for missing evidence** claims knowledge the project does not have.
  "We have no personal data in fixtures" is a claim; "nobody has looked" is a different one.
- **An exception standing in for non-applicability** is the harmless-looking inverse, and it is still
  wrong: it records a project as knowingly violating a rule whose subject it does not have, which
  makes the exception list unreadable as a list of real gaps.
- **Missing evidence standing in for a failure** is the framework's own failure mode, not the
  project's, and [Standard 5](05-verdict-vocabulary.md) governs it.

**Contradicted applicability is not a fifth kind of finding — it is a statement that the policy and
the repository describe different projects.** That is why it blocks rather than scores. A score
computed from a policy known to be describing something else is a confident verdict about the wrong
thing.

### R5 — A declaration expires when the project changes, not on a schedule

**Every applicability declaration MUST name the condition that would end it, and a project MUST
re-examine its declarations when that condition occurs.**

A time-based review cadence is the wrong instrument here. Applicability does not decay; it is
falsified by an event — the first retrieval corpus, the first tool with write access, the first
external user. A declaration whose `revisitWhen` says "annually" has recorded a calendar entry rather
than a condition, and the project will be wrong for up to a year without any signal.

**A tier is subject to the same rule.** It changes when the consequence of being wrong changes, which
is usually a deployment decision rather than a code change — and is therefore invisible to everything
in this repository.

### R6 — Undeclared is a reported quantity

**A verdict MUST report how many applicable rules the policy left undeclared, and MUST NOT treat an
undeclared rule as absent, adopted, or excused.**

A policy that mentions nine of thirty-two rules has made a statement about nine. Silence about the
other twenty-three is not adoption and not rejection, and folding it into either produces a number
that reads as coverage without being coverage.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Capability tiering | A tier assigned from model size, tool count or autonomy, so the quiet high-consequence system is under-governed | R1 |
| Inferred tier | A detector, or a person reading a detector's output, proposes a tier from repository signals | R2 |
| Default to minimal | An undeclared tier is treated as the lowest, so silence becomes an exemption | R2 |
| Tier-graded requirements | A rule's severity quietly lowered "because we're low risk" | R3 |
| Prohibition negotiated | A `nonExemptible` rule excepted at a low tier | R3 |
| Applicability as exception | A real, known gap recorded as "not applicable" and thereby made invisible | R4 |
| Applicability as ignorance | "Not applicable" recorded where the truth is that nobody has looked | R4 |
| Contradiction scored | The policy says absent, a check sees present, and a percentage is emitted anyway | R4 |
| Calendar staleness | `revisitWhen` records a review cadence rather than a falsifying condition | R5 |
| Coverage by omission | A policy declaring nine rules reported as though it had considered thirty-two | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The declared tier, the named determiner, and the date | The project's `ai-policy.yml` — **no field exists for this yet; see Implementation** | Human determination |
| R2 | The absence of any tier-inferring code | This repository's own detectors | Test and code review |
| R3 | Rule levels in `rules/*.json` compared against the project's policy | `rules/*.json` and the target policy | Mechanical, once a rule exists |
| R4 | The `applicability` block, its reasons and `revisitWhen` values | The target's `ai-policy.yml` | Partly mechanical — see Implementation |
| R4 (contradiction) | The observation that provoked `invariant.applicability-contradicted` | The validate envelope | **Mechanical, and implemented** |
| R5 | Whether a `revisitWhen` names a condition or a date | The target's `ai-policy.yml` | Human review; no check reads intent |
| R6 | The undeclared count in the envelope | The validate envelope | Mechanical |

The gap in the R1 row is deliberate and is the honest state of this release, not an oversight.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.** [Standard 6](06-standard-structure-and-rule-identity.md)
R3 requires every standard to cite at least one rule or record why it does not; this is that record.

The reason is that the rules R1 and R5 would need do not have an artifact to read. A rule
`lifecycle.risk-tier-declared` would have to look for a risk tier in the target's policy or manifest,
and **neither schema has a field for one** — `schemas/ai-system-manifest.schema.json` and
`schemas/ai-policy.schema.json` are both `additionalProperties: false`, so a project cannot even
record a tier in a conformant file today. Minting a rule that fails every project for not providing
something no schema accepts would be a rule that measures the framework's own incompleteness and
blames the target for it.

The schema change is **not made here**, because adding fields to two schemas, a rule to a shard, and
a detector is Phase 2 and Phase 3 work rather than this slice, and doing it now would put a rule in
the catalog ahead of the tests that prove it can fail.

**R2 is not exemptible, and is a constraint on this framework rather than on any project.** There is
no project circumstance that makes it reasonable for a repository scan to assert a human risk
judgment. R3's prohibition on tier-graded severity is likewise not exemptible: a mechanism for
excepting the rule against negotiating requirements would be self-defeating.

R1, R4, R5 and R6 are `manual-review` obligations in this release, except for the one contradiction
branch noted below, which is already mechanical.

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R2 | No detector emits, defaults or proposes a tier | A detector that did | Detectors may *report* a declared tier verbatim |
| R4 | A policy declaring a rule not-applicable while a check observes it present blocks | It scores instead | A genuine non-applicability must still be excluded and must **not** block |
| R4 | `not-applicable` and `not-evaluated` are separate values | They collapse | Both must be reachable in one report |
| R6 | The undeclared count is present and correct | An undeclared rule counted as adopted | A fully declared policy reports zero |
| R1, R3, R5 | **No falsifier is automated in this release.** No artifact carries a tier | — | — |

The R4 contradiction test exists today: `test/fixtures/applicability-contradiction/` declares a rule
not-applicable in a repository where the rule's subject is demonstrably present, and
`test/fixtures/not-applicable/` is the negative control that must be excluded quietly rather than
blocking. That pair is the part of this standard with real teeth, and it is the pair that would catch
the single most damaging misuse — a project declaring away a rule it is actively violating.

The absence of a falsifier for R1 is worth naming rather than hiding. **A requirement with no
falsifier is a requirement nobody can be shown to have broken**, and until a tier has somewhere to
live, R1 is enforced by review or not at all.

## Exceptions and staleness

R4's dispositions are not exemptible as a set: a project cannot except itself from the requirement to
say which of the four applies, because doing so leaves no record of what it did instead.

Individual applicability declarations are the mechanism this standard describes and are not
themselves subject to exception — a declaration is either true of the project or it is not.

**The staleness risk here is asymmetric, and worth stating plainly.** A declaration becomes false
when a project *gains* a capability, and a project gaining a capability is exactly the moment nobody
is reading the policy. Nothing in this release detects the transition. The `revisitWhen` condition is
therefore a note to a future reader that depends entirely on someone choosing to read it, which is a
weaker guarantee than it appears when written down.

A tier determined during design and never revisited through deployment is the same failure with
larger consequences, and it is equally undetectable from a repository.

## Additions this standard makes beyond the source

**All of it.** This standard corresponds to no line in the brief. The brief names ten subject areas
and says nothing about which reach a given project — applied literally, every requirement applies to
every project equally, which in practice means the whole pack is switched off by the first team it
inconveniences. Specifically authored:

- The four-tier scale in R1, and the decision that **consequence, not capability**, is the
  discriminator. The brief names no tiers and no discriminator.
- R2 in full. The prohibition on inferring a tier is this repository's own constraint on itself, and
  it is the strongest claim in this document: it forecloses a feature that would be easy to build,
  would look valuable, and would be wrong.
- The decision that an undeclared tier is **missing evidence rather than a default**, in either
  direction.
- R3's separation of *narrowing scope* from *lowering a requirement*, and the ruling that
  `nonExemptible` rules are unreachable by tiering.
- R4's four dispositions as a closed set, the four named substitutions it forbids, and the ruling
  that a contradicted applicability **blocks rather than scores**.
- R5's ruling that expiry is conditional rather than scheduled.
- R6's requirement that undeclared rules are counted and reported.
- The admission, in Validation and in Tests, that this standard ships with no rules and no falsifier
  for its central requirement. That admission is authored too — nothing required it to be made.

## Relationship to other standards and ADRs

[Standard 3](03-machine-readable-ai-policy.md) R4 is the narrower, policy-file form of R4 here: it
governs the applicability-versus-exception distinction inside `ai-policy.yml`, where this standard
governs the four-way distinction generally. Where they overlap they agree, and Standard 3 is the one a
policy author reads.

[Standard 5](05-verdict-vocabulary.md) owns the vocabulary this standard's dispositions map onto —
`not-applicable`, `not-evaluated` and `prohibited-but-unestablished` are its terms, not this
standard's. R4 says which situation warrants which; Standard 5 says what each one means in a report.

[Standard 1](01-ai-system-manifest.md) R5 declares a lifecycle stage, and
[Standard 11](11-autonomy-levels-and-delegated-authority.md) R1 declares an autonomy tier. Both are
**declared observable facts** and neither is a risk tier: autonomy is what the system may do, and
risk is what happens when it is wrong. A project at `autonomyTier: read` may be `critical`.

*Corrected 2026-09-06.* This paragraph previously attributed the autonomy tier to Standard 1 R1.
That was wrong: Standard 1 R1 requires name, purpose and models, and until Standard 11 was written
no requirement in this pack mandated `autonomyTier` at all, though the manifest schema has carried
the field since the first release.

[Standard 7](07-boundary-with-adjacent-standards.md) R1 records the search that found no adjacent
owner for this subject, which is what posture **O** rests on.

[Standard 11](11-autonomy-levels-and-delegated-authority.md) was written on 2026-09-06 and its R7
deliberately does **not** carry this standard's R2 in blanket form: R7 prohibits assigning an
autonomy tier authoritatively while leaving a labelled advisory proposal open. The difference is
recorded as Q7 in
[`artifacts/project-plan-breakdown/08-open-questions.md`](../artifacts/project-plan-breakdown/08-open-questions.md)
and is unresolved. Standard 8 (Safety Cases) remains unwritten and is the item now most likely to
reshape this one. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. One branch mechanically enforced; the central requirement is not enforced at all.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal
away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R4, contradiction branch | **Enforced.** `checkApplicabilityContradictions()` in `scripts/standards.mjs` raises `invariant.applicability-contradicted` when the policy declares a rule not-applicable and a detector observed the very thing it says is absent. The result is `BLOCKED_BY_INVARIANT` with a null score |
| R4, disposition separation | **Enforced.** `distinction()` in `scripts/compliance.mjs` keeps `not-applicable`, `not-evaluated` and `skipped` as separate derived values, asserted in both directions by `test/distinction.test.mjs` |
| R6 | **Enforced.** The envelope carries the undeclared count; `test/compliance.test.mjs` asserts it |
| R2 | **Enforced by construction.** No detector emits a tier, because no code in this repository has a concept of one. This is currently a property of the code rather than an assertion about it |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 | A `riskTier` field in the manifest or policy schema, a `lifecycle.risk-tier-declared` rule, and a structural check | Both schemas are `additionalProperties: false`; a project cannot record a tier in a conformant file today. Two schema changes, a shard change and a detector are more than this slice |
| R2 | A test asserting no detector output contains a tier value | The assertion is only meaningful once tiers exist to be asserted about |
| R3 | A check comparing a target policy's levels against the catalog's | Depends on a rule catalog entry that does not exist |
| R5 | A check that `revisitWhen` names a condition rather than a date | Reading intent from a free-text field is a heuristic, and a false positive here teaches a project to write whatever passes |

**What no future release will implement.** A detector that infers, proposes or defaults a risk tier.
R2 forecloses it deliberately, and the foreclosure is the point: a repository cannot see who is
harmed when the system is wrong, and a framework that guessed would put its authority behind a
judgment no engineer made.
