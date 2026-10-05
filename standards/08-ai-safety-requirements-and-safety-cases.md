# Standard 8 — AI Safety Requirements and Safety Cases

"The system is safe" is not a requirement. It names no harm, no condition, and no observation that
would show it to be false, so nothing can ever be shown to have broken it. Most AI systems that are
described as safe are described that way in this sense: an adjective, applied once, never checked.

Three different things are routinely called "safety", and this standard exists to keep them apart.
A **safety requirement** says what must hold. A **safety case** is an argument that it holds — a
structured chain from each claim to the specific evidence that supports it, scoped to a declared
context. And **the property actually holding while the system runs** is a fact about model behaviour
at inference time, which no document establishes and no reading of a repository can see.

The failure this standard is written against is the collapse of the three into one: a requirements
document that is taken as a case, and a case that is taken as proof. A document's existence is not
evidence that its argument is sound, and a sound argument is not evidence that the running system
behaves as argued.

Source: item 8 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "AI safety" token of the "AI safety, misuse prevention, and human oversight" bullet
of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 8 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded
> in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) by listing item 8 under
> `notGovernedElsewhere` — the search for an owner that found none — rather than by a posture entry.
> That review's substantive half is human judgment and carries `humanSignOff: null`. No maintainer
> of any adjacent pack has confirmed it.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it — a repository that invokes a model, retrieves context for one, or acts on a model's output.

Covers: stating what a system must not cause and what must hold to prevent it; binding those
statements to the context they were made for; the safety case that argues they hold; what may count
as evidence inside that case; and the limit of what this framework can say about any of it.

"Safety" here means harm to people, property, or the environment arising from the system operating as
intended or failing to — a wrong, missing, late, or excessive output or effect. It does **not** cover,
and this standard claims none of the ground of, five items that are unwritten in this release:

- **Item 9, Misuse and Abuse Prevention** — which controls a system must have against deliberate
  misuse. It already owns `misuse.safety-controls-not-disabled`. A safety case may cite a misuse
  control as evidence; which controls are owed is item 9's to state.
- **Item 10, Human Oversight and Intervention** — the general oversight obligation.
- **Item 34, AI Incident Response** — what happens when a claim is contradicted in operation. This
  standard says only that such an event invalidates the case (see Exceptions and staleness).
- **Item 35, Red Teaming** — how adversarial exercises are run and recorded. This standard says only
  what kind of evidence their records are.
- **Item 48, Safety and Oversight Prohibitions** — the class-A must-never requirements the
  specification lists as the negative face of the `AI safety` token. This standard states safety
  positively and mints no prohibition; see R5.

**R1 reaches every system in scope, and "we found no hazard" is an answer to it, not an exit from
it.** A system whose analysis identifies no safety requirement records that, with its reasoning, and
that record is R1's evidence. Declaring R1 not-applicable under
[Standard 2](02-ai-risk-tiering-and-applicability.md) R4 would claim the subject — an AI system — does
not exist, which is a claim about whether the repository is in this pack's scope at all. R3 and R4
reach only systems whose R1 record states at least one safety requirement; with none, there is no
claim for a case to argue, and the R1 record is what shows it.

**Risk tier does not grade this standard, and the decision is deliberate.** Nothing below becomes
lighter at a lower tier. Standard 2 R3 forbids a tier from reducing what a rule demands — it may only
decide whether a rule's subject is in scope — and a "light" safety case for low tiers would be
exactly that reduction. Separately, no schema carries a risk tier: both
[`schemas/ai-system-manifest.schema.json`](../schemas/ai-system-manifest.schema.json) and
[`schemas/ai-policy.schema.json`](../schemas/ai-policy.schema.json) are `additionalProperties: false`
with no tier field, so no rule could read one. Where a project has made a tier determination under
Standard 2 R1, it belongs in the declared context under R2 as a stated fact about the deployment.

This standard relies on Standard 2 only for that declaration requirement and for R3's
scope-not-severity rule. **It does not restate Standard 2 R2, does not extend R2's prohibition on a
detector proposing a tier into this subject, and takes no position on the open question recorded as
Q7** in [`artifacts/project-plan-breakdown/08-open-questions.md`](../artifacts/project-plan-breakdown/08-open-questions.md).
Nothing here depends on how Q7 is resolved.

## Requirements

### R1 — State the safety requirements

**Every AI system in scope MUST have a committed safety requirements record that, for each hazard
identified, names the harm, the safety property the system is required to hold to prevent it, and the
observation that would show the property violated; where no hazard is identified, the record MUST
say so and state how that conclusion was reached.**

Three parts, because each one fails differently when omitted. A harm with no property is a worry. A
property with no harm is a design preference nobody can prioritise. And a property whose violation
could not be observed — "the system behaves responsibly" — is the adjective from this standard's
lede, restated in a longer sentence. The test of a written safety property is whether a person
watching the system could say "that was a violation". If they could not, it is not yet a requirement.

The "no hazard identified" branch matters as much as the main one. A repository with no safety
record is indistinguishable from a repository whose team looked carefully and found nothing; the
first is missing evidence and the second is a finding, and Standard 2 R4 forbids one to stand in for
the other. Writing the negative finding down is the only thing that separates them.

The record may be a standalone document or a section of another committed one. **No field in the
manifest schema can point to it** — the schema has an `evaluation.planPath` and nothing for safety —
so locating it is part of the human review, and that is one reason this rule is `manual-review`.

Rule `lifecycle.safety-requirements-stated`.

### R2 — Bind the requirements to a declared operating context, and name what ends it

**The safety requirements record and any safety case MUST state the operating context they hold
for — who the system serves, what it is used for, and which effects its outputs can reach — and MUST
name the changes to that context, or to the system, that would make them no longer hold.**

A safety claim with no context is unfalsifiable in a quieter way than R1's adjective: every
counterexample can be answered with "that is not how it was meant to be used". Stating the context
turns that answer from an excuse into a checkable fact — either the deployment is inside the declared
context, or the case does not cover it.

The context is where facts declared elsewhere in this pack meet the safety argument: the models the
manifest names, the autonomy tier declared under
[Standard 11](11-autonomy-levels-and-delegated-authority.md) R1, the tools classified under
[Standard 45](45-approval-gates.md) R2, and a risk tier where a named person has determined one under
Standard 2 R1. R2 does not require any of those to exist; it requires that whatever the argument
assumes about them be written down.

Naming the invalidating changes follows Standard 2 R5: a safety case does not decay on a calendar, it
is falsified by an event, and a case that cannot say which events is a case nobody will know to
revisit.

Rule `lifecycle.safety-context-declared`.

### R3 — Argue every stated requirement in a safety case

**Where the safety requirements record states at least one safety property, the system MUST have a
committed safety case in which every stated property is the subject of a claim, every claim is
decomposed until each part cites specific evidence, and every claim or part that no evidence
supports is marked as unsupported rather than omitted.**

This is the requirement that separates a safety case from a safety document. A document lists
reasons to believe a system is safe. A case makes each belief traceable: this property holds, because
these narrower conditions hold, because this record shows each of them. A reader can then disagree
with a specific link rather than with the whole document, and a reviewer can find the link that is
missing.

**Marking a gap is compliant; hiding one is not.** The characteristic failure is not a wrong
argument — it is a case that looks complete because the claims nobody could support were left out. A
case that says "claim 4 is unsupported in this revision" is an honest case with a known gap. A case
that silently drops claim 4 is a false one, and it reads better.

R3 asks that the argument be made and be inspectable. It does not ask that it be correct, because
whether the argument is sound is a judgment a human reviewer makes, and R6 forbids this framework to
make it on anyone's behalf.

Rule `lifecycle.safety-case-argued`.

### R4 — Identify every piece of evidence by kind and revision, and never cite the argument as its own support

**Each citation in a safety case MUST identify its evidence as one of: a design or configuration fact
observable in the repository; a record of an executed test, evaluation, or exercise, naming the model
identifiers, prompt revisions, and configuration it was produced against; or an assumption about the
operating context. A safety case MUST NOT cite a record produced against a different system revision
as current evidence, and MUST NOT cite itself, the safety requirements record, or any other statement
of intent as evidence that a claim holds.**

The three kinds are not ranked; they support different things. A design fact — "the tool permission
manifest classes `delete_record` as `irreversible`" — supports a claim about what the system is built
to do. An executed record supports a claim about what the system did, on the inputs exercised, at
that revision, and nothing wider. An assumption supports nothing: it is a condition the argument
depends on, and listing it as evidence is how "operators will review every output" comes to be read as
though somebody observed it.

**Revision binding is what keeps executed evidence honest over time.** An evaluation run against a
previous model identifier describes a different system. [Standard 1](01-ai-system-manifest.md) R4
requires the manifest's models to be pinned precisely so that a record can name the model it
describes; R4 here requires the case to use that name, so that a reviewer can see when the system has
moved and its evidence has not.

**Circular citation is the specific form of "a document's existence is not evidence".** A case that
supports "outputs are never shown unfiltered" by citing the requirements record that says outputs
must never be shown unfiltered has restated the requirement and called it proof. The same applies to
a design document describing intended behaviour, and to the case citing an earlier section of itself.

Rule `lifecycle.safety-evidence-traceable`.

### R5 — The stated safety properties hold at inference time

**Every safety property stated under R1 MUST hold while the system runs, in the operating context
declared under R2.**

This is the requirement R1 through R4 exist to serve, and **this framework cannot check it.** Whether
a property holds is decided by the model, its inputs, and its environment during a run. A human
reading the repository can establish whether the case argues each claim and cites real evidence —
that is R3 and R4, and they are `manual-review` for exactly that reason. The same human cannot
establish that the running system keeps the property, because that is not in the repository.

Even the strongest evidence a case can cite does not close this gap. A record of an executed
evaluation or adversarial exercise establishes behaviour on the inputs exercised, at the revision
recorded. It does not establish the property in general, and it is not treated here as doing so.

Stated anyway, at `required` level and `not-evaluable` validation type, so that the requirement is
visible in every verdict rather than implied by the presence of a case. **It is `required` and not
`forbidden` by decision:** the prohibitive form of AI safety requirements is item 48's, which is
class `A`, unwritten, and listed by the specification as the negative face of this item's token.
Minting a `forbidden` rule here would take a decision that belongs to that item.

Rule `lifecycle.safety-properties-hold-at-inference`, **not-evaluable**. Its `$notEvaluableNote`
names what would make part of it checkable: a committed record of an executed evaluation or
adversarial exercise against the stated properties, from a named harness at a recorded system
revision.

### R6 — No component of this framework may report a safety case as sound or a safety property as holding

**No detector, heuristic, or audit finding in this framework MAY report a safety requirement as met,
a safety case as sound, or a safety property as holding on the basis of a document's presence,
structure, or wording, and a safety case no human has reviewed MUST be reported as not evaluated
rather than as satisfied.**

A detector could find a file called `safety-case.md`, confirm it has headings named "Claims" and
"Evidence", and count the citations. Every one of those observations is true and none of them bears
on whether the argument is sound. Reporting them as compliance would convert the one thing this
standard insists on — that a document is not its own evidence — into a check that treats a document as
exactly that.

**This requirement concerns the soundness of a safety argument, not the assignment of a risk tier,
and it is not a restatement of Standard 2 R2.** It neither narrows nor extends that requirement and
has no bearing on Q7.

There is no rule for R6. It constrains this framework's own implementation rather than a consuming
project, and a project cannot fail it. It is enforced by construction and by review of this
repository, which is named as the weaker mechanism it is in Implementation.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Safety by adjective | "The system is designed to be safe and responsible." No property, no observable violation | R1 |
| Silence read as safety | No record exists; nobody can tell "no hazards" from "nobody looked" | R1 |
| Context drift | The case was written for internal analysts; the system now answers the public, and the case is still cited | R2 |
| The excuse context | Every counterexample is met with "that is not the intended use", and the intended use was never written down | R2 |
| Case as paperwork | A document titled "Safety Case" whose claims cite nothing specific | R3 |
| The omitted gap | A claim nobody could support is dropped, so the case reads as complete | R3 |
| Circular evidence | A claim is supported by the requirements record that states it, or by a design intent | R4 |
| Stale evidence | The cited evaluation ran against the previous model identifier and prompt revision | R4 |
| Assumption as evidence | "Operators review every output" listed alongside test records as though observed | R4 |
| Argument mistaken for behaviour | A well-argued case read as proof that the running system keeps its properties | R5 |
| Presence as compliance | A check finds the case file and reports the safety requirement as met | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The safety requirements record: harms, properties, observable violations — or the reasoned finding that none were identified | A committed document. **No manifest field references it**, so it must be located by the reviewer | Human review |
| R2 | The declared operating context and the named invalidating changes | Within the record and the case | Human review |
| R3 | The safety case: claims, their decomposition, citations, and marked gaps | A committed document | Human review |
| R4 | Each citation's kind, and for executed records the model identifiers, prompt revisions and configuration they were produced against | Within the case, checked against the manifest's `models[].id` and the cited artifacts | Human review; comparison against the manifest is mechanical in principle and not built |
| R5 | A committed record of an executed evaluation or adversarial exercise against the stated properties, at a recorded revision | Committed alongside the case | **Does not establish R5.** It establishes behaviour on the exercised inputs, and no rule in this release checks for it |
| R6 | The absence of any detector bound to this standard's rules | `EVALUATED_RULES` in `scripts/standards.mjs`, and this repository's code | Code review |

The gap worth naming: **a safety case can be located and read by a human, and by nothing else in
this release.** The manifest schema has no field pointing to a safety requirements record or a
safety case, and adding one is a schema change — it alters what a conformant consuming project may
declare — that is not made by writing this document. Until one exists, any automated attempt to find
a case would be guessing from filenames.

## Validation, severity, and exemptibility

<!-- BEGIN GENERATED FROM rules/lifecycle.json — DO NOT EDIT. Verified by test/standards-tables.test.mjs. -->

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R1 | `lifecycle.safety-requirements-stated` | required | error | manual-review | yes |
| R2 | `lifecycle.safety-context-declared` | required | error | manual-review | yes |
| R3 | `lifecycle.safety-case-argued` | required | error | manual-review | yes |
| R4 | `lifecycle.safety-evidence-traceable` | required | error | manual-review | yes |
| R5 | `lifecycle.safety-properties-hold-at-inference` | required | error | not-evaluable | yes |

<!-- END GENERATED -->

**R6 has no rule, and this is deliberate.** It constrains this framework rather than a consuming
project; a project cannot violate it, and a rule nobody can fail would enlarge the catalog without
adding a check.

**The rules sit in `lifecycle.` because there is no `safety.` namespace and none is added.** The
seventeen reserved namespaces are fixed in `NAMESPACES` in `scripts/catalog.mjs`. A safety
requirements record and a safety case are system-level documents written at design and maintained
through deployment, which is the ground `lifecycle.` already holds for the manifest and the
retirement plan under Standard 1. `misuse.` is item 9's and `oversight.` is Standard 11's and item
10's; using either would imply a claim on their subject. `lifecycle.` is a segment MathematicsStandards
also uses, and no full id here collides with one of theirs.

**R1 through R4 are `manual-review`, not `structural` or `document`.** Each asks a question about
content — whether a property's violation is observable, whether a context is stated, whether a claim
is decomposed to evidence, whether a citation is circular — and in every case the answer is in the
words, not in the presence of a file. A presence check would also have nowhere to look, since no
manifest field declares a path. Under `scripts/compliance.mjs`, a `manual-review` rule no detector
examines reports `skipped` with disposition `not-evaluated`, and while it is applicable it keeps a
project's status from reaching `COMPLIANT`.

**R5 is `not-evaluable` rather than `manual-review`, and the line between them is R4.** A human
reading the repository can establish what a case cites and whether the citations are real — that is
R4. A human reading the repository cannot establish that the running system keeps the property —
that is R5. Under [Standard 5](05-verdict-vocabulary.md) R8, a not-evaluable rule changes neither
status nor score, and under the catalog invariants it declares assurance `none` and cannot be
attested.

**The consequence of choosing `required` over `forbidden` for R5 was checked rather than assumed.**
In `evaluate()` in `scripts/compliance.mjs`, a not-evaluable rule is excluded from the set of
unestablished rules that holds status at `NOT_EVALUATED`, whatever its level. A `forbidden`
not-evaluable rule is additionally reported with distinction `prohibited-but-unestablished` and listed
in `unestablishedProhibitions`; a `required` one is reported `not-evaluated` and listed in
`notEvaluable`. Choosing `forbidden` would therefore have changed which array R5 appears in, not the
status. The choice is made on subject — item 48 owns the prohibitive form — and not on verdict
effect.

**None of the five rules is `nonExemptible`.** The catalog forbids it outright for R5. For R1 through
R4, an exception is a recorded, approved decision to live with a known gap in a safety argument, and
there are legitimate ones — evidence produced by a supplier that cannot name the revision it ran
against, for example. Marking the rules non-exemptible would use exemptibility as a severity dial.

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control | Status in this release |
| --- | --- | --- | --- | --- |
| R1 | Human review of the record | No record; or a stated property whose violation no observer could identify | A record stating, with reasoning, that no hazard was identified must **not** be reported as missing | **No detector.** `manual-review` |
| R2 | Human review of the record and case | No stated context; or the system deployed in a context the case excludes | A narrow context must not be treated as deficient for being narrow | **No detector.** `manual-review` |
| R3 | Human review of the case | A stated property that is the subject of no claim; a claim with no cited evidence and no unsupported marking | A case that openly marks a claim unsupported must **not** be reported as violating R3 — the gap is disclosed, not hidden | **No detector.** `manual-review` |
| R4 | Human review of each citation | A self- or intent-citation; an executed record whose revision differs from the manifest's current models, cited as current; an assumption cited as evidence | A design fact visible in the repository must not be rejected for not being a test record; a record at the current pinned revision must not be flagged stale | **No detector.** `manual-review` |
| R5 | — | **No falsifier is possible from this repository.** That is what `not-evaluable` means | The rule must never report `passed`, whatever documents and records exist | Catalog invariants apply once the rule is in the catalog; see below |
| R6 | Every rule this standard names is absent from `EVALUATED_RULES` | A detector that reports any of them `passed` from a document's presence, structure or wording | `audit` may report that a document exists as evidence — audit emits no verdict, so reporting presence is not reporting soundness | **Enforced by construction** — no detector reads safety documents |

What the existing suite would assert once the five rules are in `rules/lifecycle.json`, stated
precisely because some of it is weaker than it sounds:

- **The generated table above matches the catalog in both directions** —
  `test/standards-tables.test.mjs`.
- **Every catalog invariant holds**, including that R5's rule declares assurance `none`, is not
  attestable, is not `nonExemptible`, and carries a note of at least forty characters —
  `loadCatalog()` in `scripts/catalog.mjs`.
- **R5's note says why the subject is outside the repository and names what would make it
  checkable** — `test/validation-type.test.mjs`, which asserts both across every not-evaluable rule in
  the catalog.
- **No proposed id collides with a recorded foreign id** — `test/namespace.test.mjs` against
  `artifacts/foreign-namespace-inventory.json`.
- **The "never reports `passed`" and "listed in `notEvaluable`" assertions in
  `test/validation-type.test.mjs` would reach R5's rule, but they hold by construction.** Those tests
  validate the `valid-manifest` fixture, whose policy names no rule from this standard; `applyPolicy()`
  in `scripts/policy.mjs` still resolves every catalog rule, so R5's rule appears in the results as
  undeclared, and `evaluateRule()` in `scripts/compliance.mjs` returns `skipped` for every
  not-evaluable rule before any detector is consulted. The assertions confirm the reporting path.
  They examine nothing about safety, and are recorded here so they are not read as coverage.

**Five of six requirements have no mechanical falsifier in this release, and one never will from a
repository.** R6 is the only one with any mechanical footing, and that footing is the absence of code
rather than a test that fails.

## Exceptions and staleness

The exception mechanism is item 4's subject and is Phase 4 work; item 4 is unwritten. **In this
release an exception to any rule above cannot be recorded**, so none is exemptible in practice
whatever the table says. When the mechanism exists, an exception to R1 through R4 records a known gap
in a safety argument with an approver and a date. It does not turn an unsupported claim into a
supported one, and a case citing an exception as evidence would violate R4.

R5's rule can never be attested and never be made `nonExemptible`; both are catalog invariants for
`not-evaluable` rules, enforced when the catalog loads.

**Staleness is conditional, not scheduled**, following Standard 2 R5. A safety case does not expire
on a date; it stops holding when something it depends on changes. The events that invalidate it, and
that R2 requires a case to name in its own terms:

- A model identifier in the manifest changes, or a provider re-points one
- A prompt the case depends on is revised
- A tool is added, or an existing tool's impact class changes
- The system reaches users, uses, or effects outside its declared context
- A cited executed record is superseded, rerun, or found not to correspond to a real run
- An observed event contradicts a claim — what is done about that event is item 34's subject, but
  the case no longer holds from the moment it occurs

**The staleness risk is asymmetric**, and Standard 2 names the same shape. The case is invalidated at
the moment the system changes, which is the moment people are thinking about the change and not about
the case. Nothing in this release detects any of these transitions; R4's revision binding makes the
first two visible to a reviewer who looks, and nothing makes anyone look.

## Additions this standard makes beyond the source

The brief contributes two words: **`AI safety`**, as the first subject in the list "AI safety,
misuse prevention, and human oversight". It names safety as an area to cover. It does not mention
safety requirements, safety cases, hazards, evidence kinds, or operating contexts. The phrase "Safety
Requirements and Safety Cases" is the specification's item title, derived from that token; it is not
the brief's wording. Everything normative here is authored:

- **The three-way distinction** between a safety requirement, a safety case, and the property holding
  at inference time — the organising claim of this standard.
- **R1 in full**, including the harm / property / observable-violation form and the requirement that a
  finding of no hazard be recorded with its reasoning rather than left as silence.
- **R2 in full** — binding requirements and case to a declared operating context, and requiring the
  invalidating changes to be named.
- **R3's structure**: every stated property the subject of a claim, decomposition to cited evidence,
  and the ruling that an unsupported claim is marked rather than omitted.
- **R4's three evidence kinds**, the requirement that executed records name the revision they ran
  against, the ban on citing a record from another revision as current, the ban on circular and
  intent-based citation, and the ruling that an assumption is not evidence.
- **R5's statement at `required` level and `not-evaluable` type**, and the decision not to use
  `forbidden` because the prohibitive form belongs to item 48.
- **R6 in full**, and its explicit separation from Standard 2 R2 and Q7.
- **The scope decisions**: that R1 reaches every system in scope, that R3 and R4 are conditional on
  R1 stating a property, and that item 9, 10, 34, 35 and 48 ground is not claimed.
- **The decision not to grade safety-case rigour by risk tier**, on the basis of Standard 2 R3 and the
  absence of any tier field.
- **The placement of the rules in `lifecycle.`**, the classification of R1–R4 as `manual-review`, and
  the decision that none is `nonExemptible`.
- **The admission that five of six requirements have no mechanical falsifier**, and that the existing
  test assertions reaching R5's rule hold by construction rather than by examining anything.

## Relationship to other standards and ADRs

[Standard 1](01-ai-system-manifest.md) supplies the pinned model identifiers R4 binds executed
evidence to, and its R4 is what makes that binding possible. It supplies no place to reference a
safety case, which is why R1 through R4 are located by a reviewer.

[Standard 2](02-ai-risk-tiering-and-applicability.md) is relied on for its R1 declaration, its R3
rule that a tier narrows scope and never lowers a requirement, its R4 dispositions — which is why "no
hazard identified" is a recorded finding and not a non-applicability — and its R5 conditional expiry.
Standard 2 records this item as the one most likely to reshape it. **This standard does not change
Standard 2**: it leaves R2 as written and does not propagate R2's word "propose", pending Q7.

[Standard 5](05-verdict-vocabulary.md) defines what `not-evaluated` and `prohibited-but-unestablished`
mean, and its R8 is why R5 can be stated without moving the verdict.
[Standard 6](06-standard-structure-and-rule-identity.md) R3 is why every requirement here carries a
falsifier or is declared not-evaluable, and its R8 is why R5's rule cannot be attested.
[Standard 7](07-boundary-with-adjacent-standards.md) R1 records "AI safety, misuse, human oversight"
as owned by this pack with no existing owner, which is the division the `notGovernedElsewhere` record
for this item evidences.

[Standard 11](11-autonomy-levels-and-delegated-authority.md) is the structural precedent inside this
repository: its R6 states a runtime requirement as not-evaluable and its R7 constrains the framework
rather than a project. The subjects differ — **11 governs how much authority a system holds; 8 governs
whether a safety claim about the system is stated, argued, and evidenced.** A declared autonomy tier is
part of the context R2 asks a case to state.

[Standard 45](45-approval-gates.md) supplies design facts a case may cite — a tool's impact class, a
gate's existence — and its R5 evidence row is the same observation R4 makes here: an artifact a
system produces about itself is not evidence of what it did.
[Standard 21](21-prompt-and-instruction-security.md) R3's threat model names untrusted inputs; it may
be cited as evidence in a case, and it is not a safety requirements record, because a hazard can
arise with no adversary present.

Item 17, Evaluation Plans for Generative Systems, is unwritten; its shard `rules/eval.json` already
carries `eval.no-fabricated-results`, which governs whether an evaluation result a case cites came from
a real run. Items 9, 10, 34, 35 and 48 are unwritten and their ground is listed under Scope.

No ADR covers this standard. `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. No requirement has a detector. The one mechanical guarantee is an absence.**

Stated as separate lists so that a proposal is not read as a capability.

**Implemented today.**

| Mechanism | What it does | Where |
| --- | --- | --- |
| R6 by construction | No detector reads a safety requirements record or a safety case. `EVALUATED_RULES` lists nine rule ids and none is in this standard | `scripts/standards.mjs` |
| Reporting of unexamined `manual-review` rules | A rule no detector examines reports `skipped` / `not-evaluated`, never `passed`, and keeps an applicable project from `COMPLIANT` | `evaluateRule()` and `evaluate()` in `scripts/compliance.mjs` |
| Reporting of `not-evaluable` rules | Reported and listed in `notEvaluable`, outside the scored denominator, and without effect on status | `scripts/compliance.mjs` |
| `not-evaluable` catalog invariants | Refuse a not-evaluable rule that claims assurance, is attestable, is `nonExemptible`, or lacks a substantive note | `checkRule()` in `scripts/catalog.mjs` |
| Generated-table verification | Asserts the Validation table and the named shard agree in both directions | `test/standards-tables.test.mjs` |

The last three apply to this standard's rules only once they are in `rules/lifecycle.json`; they are
general mechanisms, not work done for this standard.

**Proposed, and deliberately absent from this release.**

| Proposed | Why it is not here |
| --- | --- |
| A manifest field declaring the paths of the safety requirements record and the safety case | A schema change alters what a conformant consuming project may declare. It is a schema-versioning decision, not a side effect of writing this document |
| A detector that the declared record and case exist | Would establish file presence, which R6 forbids reporting as compliance. At most it could supply audit evidence; with no path field it would have to guess filenames |
| A check comparing the revisions a case's executed records name against the manifest's `models[].id` | The one part of R4 that is mechanical in principle. It needs a machine-readable citation format this pack does not define, and it would be Phase 3 detector work |
| A rule checking that an exercise record against the stated properties exists and is current | Would give R5 a route out of `not-evaluable` for the exercised inputs. How such records are produced and kept is item 35's subject, and item 35 is unwritten |

**What no future release will implement.** A detector that reports a safety case sound, or a safety
property holding, from the contents of a document. R6 forecloses it, and R5 explains why the evidence
that would be needed is not in a repository.

**R6 is enforced by review of this repository, which is weaker than a test.** Nothing prevents a
future contributor from adding a detector for these rules; what stands in the way is this document,
the `EVALUATED_RULES` list, and whoever reads the diff.
