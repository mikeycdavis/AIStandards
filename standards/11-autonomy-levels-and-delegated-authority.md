# Standard 11 — Autonomy Levels and Delegated Authority

Autonomy is not a property of a model. It is a grant, made by people, of the authority to act
without asking first. The grant is what changes: the same model, with the same weights and the same
prompt, is a different system depending on whether a person reads its output before anything
happens.

Systems rarely acquire that authority in one decision. They acquire it in small ones — a tool added
here, a confirmation step removed there because it was slowing everyone down, a batch job that used
to file a draft and now files the thing itself. Each step is defensible. No step is the step where
someone decided the system could act alone, which is why, when it does, nobody can name when that
was agreed.

This standard makes the grant explicit, bounds it, and requires that raising it be a decision
somebody made on a date. It is not about whether the model is good enough to be trusted.

Source: item 11 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "autonomous" token of the "Approval gates for high-impact, destructive, autonomous,
or externally visible actions" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 11 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **X**,
> evidenced in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json), whose
> substantive half is human judgment and carries `humanSignOff: null`. No maintainer of any adjacent
> pack has confirmed it.

## Scope

Applies to any AI system where a model's output can lead to an effect — a write, a call, a message,
a transaction, a configuration change — with or without a person in between. The tier a system
declares determines *which* of the requirements below reach it, but the obligation to declare one
reaches every such system.

A system whose entire output is text returned to a caller who then decides what to do with it
operates at `propose` and says so. That is a declaration, not an exemption: the difference between
`propose` and `execute` is exactly the thing this standard asks to be written down, so a system
cannot escape the standard by being at its lower end.

A system with no model-initiated effect at all — a classifier whose output is stored and read by
people, never routed to a tool — may declare this standard not-applicable under Standard 2 R4, with
a reason and a `revisitWhen`. Adding a tool that acts is the event that revisits it.

**This pack owns these requirements canonically.** EngineeringStandards' `ai.propose-execute`
covers adjacent ground — it requires a capability surface to separate recommending an action from
applying it — and is recorded as precedent in the crosswalk. That separation is the boundary between
two of the four tiers named here; it is not a definition of the tiers, and
[`artifacts/boundary-review.json`](../artifacts/boundary-review.json) records the verdict as
CONFIRMED on that basis. The foreign identity is not re-minted, and neither version is carried as
independently authoritative. See [Standard 7](07-boundary-with-adjacent-standards.md) R3.

## Requirements

### R1 — Declare the autonomy tier

**Every AI system in scope MUST declare `system.autonomyTier` in its manifest, as one of `read`,
`propose`, `execute`, or `autonomous`.**

The field has existed in
[`schemas/ai-system-manifest.schema.json`](../schemas/ai-system-manifest.schema.json) since the
first release, with that enum and those descriptions. Until this standard, **no rule required it to
be filled in.** A system could ship a schema-valid manifest that said nothing about whether it acts
alone, and every check in the pack would pass on that manifest. R1 closes that gap, which is a real
one and not a hypothetical: it is why this standard ships with rules where
[Standard 2](02-ai-risk-tiering-and-applicability.md) could not.

Rule `oversight.autonomy-tier-declared`. Crosswalks to EngineeringStandards' `ai.propose-execute`
as precedent.

### R2 — The tiers are defined by delegated authority, not by capability

**The tier a system declares MUST be determined by what it is permitted to do without a person
acting, and MUST NOT be determined by what the model is capable of, how many tools exist, or how the
system is built.**

| Tier | What is delegated | The question it answers |
|---|---|---|
| `read` | Nothing. The system observes and reports | Can it change anything? No |
| `propose` | Nothing. It suggests; a person applies | Does a person act between output and effect? Yes, every time |
| `execute` | Authority to act within bounds someone declared | Can it act alone? Yes, inside a stated boundary |
| `autonomous` | Authority to act without per-action review | Does anyone see each action before it happens? No |

The line that matters most is between `propose` and `execute`, because it is the one that gets
crossed by convenience. A `propose` system whose suggestion is applied by a script that always
applies it is an `execute` system with a person-shaped gap in the diagram.

The second line that matters is between `execute` and `autonomous`, and it is about *review*, not
about *bounds*. An `execute` system acts alone but somebody looks; an `autonomous` system acts alone
and nobody does until something surfaces. Both may be tightly bounded. Bounds are not oversight.

There is no rule for R2. It is a definition the other requirements are stated against, and a
definition has no falsifier.

### R3 — Delegated authority must not exceed the declared tier

**The tools, credentials, scopes and budgets a system holds MUST be consistent with its declared
tier, and a system declaring `read` or `propose` MUST hold no capability that produces an effect
without a person acting.**

This is the requirement that makes R1 mean something. A declaration that bounds nothing is a label,
and the drift it fails to catch is ordinary: a system declared at `propose` acquires a write-capable
tool in a later change, the manifest is not revisited because nobody thought of it as an autonomy
change, and the declaration goes on asserting a separation that no longer exists.

Where the tool permission manifest required by [Standard 45](45-approval-gates.md) R1 exists, it is
the artifact this is checked against. Where it does not, the comparison is against whatever the
system actually holds, and the missing manifest is Standard 45's finding rather than this one's.

Rule `oversight.authority-matches-tier`.

### R4 — A human can halt the system, and the path is written down

**A system declared at `execute` or `autonomous` MUST have a committed record naming how a human
halts it, who is permitted to, and what state the system is left in.**

Delegated authority is revocable or it was not delegated. The failure this addresses is not that no
halt mechanism exists — usually one does — but that it exists as knowledge held by the person who
built the system, and is needed at 3am by someone else.

"What state the system is left in" is not a formality. A halt that leaves a half-applied change is a
different operational event from one that leaves nothing applied, and the person deciding whether to
pull the lever needs to know which they are choosing.

`read` and `propose` systems are outside this requirement because a person is already between the
output and the effect; the halt is declining to act.

Rule `oversight.intervention-path-declared`.

### R5 — Raising the tier requires a recorded approval

**A change moving the declared tier toward `autonomous` MUST carry an approval naming a real
approver and a real date, recorded before the change takes effect.**

This is the requirement that addresses the pattern in this standard's lede. Autonomy is acquired in
small steps, and a small step with an approval attached is no longer a step nobody decided to take.

The step from `execute` to `autonomous` deserves particular weight: it removes per-action review,
which is the largest change that can be made to a system's risk profile without changing a line of
model-facing code.

**An approval recorded after the change is a record of the change, not an approval of it.** Standard
45 R5 applies here in full — the approver may not be the system requesting the increase, and may not
be a process the requesting system controls.

Lowering a tier needs no approval. Narrowing delegated authority cannot make a system more dangerous,
and requiring sign-off to reduce risk is how reduction stops happening.

Rule `oversight.autonomy-increase-approved`.

### R6 — The system must not acquire authority its tier does not grant

**A system MUST NOT obtain, escalate to, or act on authority beyond its declared tier while
running** — by chaining permitted tools into an effect none of them individually grants, by treating
retrieved content as instruction, or by continuing past a refused or unavailable approval.

This is the requirement everything above exists to make meaningful, and **this framework cannot check
it.** It is stated anyway, at `forbidden` level and `not-evaluable` validation type, because a
prohibition that is stated and unexamined is reported as `prohibited-but-unestablished` and caps the
verdict, whereas an unstated one is invisible. See [Standard 5](05-verdict-vocabulary.md).

Rule `oversight.no-authority-beyond-declared-tier`, **forbidden** and **not-evaluable**. Its
`$notEvaluableNote` names what would make it checkable: a committed adversarial exercise record from
a named harness at a recorded revision.

### R7 — No component of this framework may assign a system's autonomy tier

**No detector, heuristic, or audit finding in this framework MAY assign a system's autonomy tier
authoritatively, and an undeclared tier MUST be reported as undeclared rather than defaulted in
either direction.**

A repository scan can see tools, credentials and call sites. It cannot see whether a person reads
the output before anything happens, which is the whole discriminator under R2. A framework that
inferred a tier from what it could see would be inferring from capability, and would carry its own
authority into a judgment nobody made.

**This requirement is deliberately narrower than
[Standard 2](02-ai-risk-tiering-and-applicability.md) R2, and the difference is not an oversight.**
Standard 2 R2 forbids a detector to "assert, propose, or default" a risk tier. The reasoning printed
beneath it supports *assert* and *default*; it does not reach *propose*, because a clearly labelled
advisory suggestion that a human must explicitly accept carries no framework authority into the
record — the human's acceptance is the determination. Standard 2 R2 is class `A` in full and
self-disclosed as authored; the brief contains no requirement of either shape. Rather than propagate
an unapproved blanket prohibition into a second standard, **R7 prohibits authoritative assignment
and leaves labelled advisory proposal open**, pending an owner ruling recorded as Q7 in
[`artifacts/project-plan-breakdown/08-open-questions.md`](../artifacts/project-plan-breakdown/08-open-questions.md).

If the owner affirms the blanket form, R7 tightens to match. If the owner distinguishes advisory from
authoritative, Standard 2 R2 loses the word "propose". Until then the two standards differ on
adjacent ground and this paragraph is the record of why.

There is no rule for R7. It constrains this framework's own implementation, not a consuming project,
and a consuming project cannot fail it. It is enforced by review of this repository, which is a
weaker mechanism than a test and is named as such in Implementation.

## Failure modes

| Failure | What it looks like | Requirement |
|---|---|---|
| Undeclared autonomy | A schema-valid manifest that says nothing about whether the system acts alone. Every check passes | R1 |
| Silent promotion | A `propose` system gains a write-capable tool in an unrelated change. The manifest still says `propose` | R3 |
| The person-shaped gap | A `propose` system whose output is applied by a script that always applies it. A human is in the diagram and not in the loop | R2, R3 |
| Bounds mistaken for oversight | A tightly scoped `autonomous` system declared `execute` because "it can only touch one table". Nobody reviews its actions | R2 |
| Unreachable halt | A halt mechanism that exists, and is known only to its author, and is needed by someone else | R4 |
| Retroactive approval | The tier was raised in March; the approval is dated when someone noticed in July | R5 |
| Capability inference | A detector reads four tools and a credential and concludes `autonomous`, and the report carries it as fact | R7 |
| Tool chaining | Each granted tool is individually within tier; their composition is not | R6 |

## Evidence

| Evidence | Establishes | Where |
|---|---|---|
| `system.autonomyTier` in `ai-system.yml` | A tier was declared | The manifest, committed |
| The tool permission manifest (Standard 45 R1) | What the system may actually invoke | `tool-permissions.yml`, committed |
| Credential and scope grants | What authority exists outside the tool list | Deployment configuration; often **not** in the repository, which limits R3 |
| A halt runbook | The intervention path, its authorised users, and the resulting state | Committed, referenced from the manifest |
| An approval record for a tier increase | That a named person agreed, on a date, before the change | Committed alongside the manifest change |
| An adversarial exercise record | That R6 was tested rather than assumed | Does not exist in any release of this pack yet |

The gap worth naming: **credentials and scopes frequently live outside the repository**, in
deployment configuration this framework never sees. R3 is therefore checkable by a human with access
to both, and only partially by anyone reading the repository alone. That is why it is
`manual-review` and not `structural`.

## Validation, severity, and exemptibility

<!-- BEGIN GENERATED FROM rules/oversight.json — DO NOT EDIT. Verified by test/standards-tables.test.mjs. -->

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R1 | `oversight.autonomy-tier-declared` | required | error | structural | yes |
| R3 | `oversight.authority-matches-tier` | required | error | manual-review | yes |
| R4 | `oversight.intervention-path-declared` | required | error | manual-review | yes |
| R5 | `oversight.autonomy-increase-approved` | required | error | manual-review | yes |
| R6 | `oversight.no-authority-beyond-declared-tier` | forbidden | error | not-evaluable | yes |

<!-- END GENERATED -->

**R2 and R7 have no rule and this is deliberate.** R2 is a definition, and a definition has no
falsifier. R7 constrains this framework rather than a consuming project, and a project cannot fail
it; minting a rule a project can never violate would inflate the catalog and the denominator without
adding a check.

**R1 is `structural` and `full` assurance on a technicality worth stating plainly.** It checks that a
tier *was declared*, not that the declared tier is *correct*. A system that acts without review and
declares `propose` passes R1 and fails R3, where a human is the only reader. **A declaration is not
evidence that a bound is enforced**, and nothing in this standard's automated half establishes that
it is.

**R6 is `not-evaluable` rather than `manual-review`, and the distinction was checked rather than
assumed.** A human reading this repository can establish which tools are granted — that is R3, and it
is `manual-review` for exactly that reason. What a human reading the repository cannot establish is
whether the running system composes those tools into an effect its tier forbids, because that is
decided by the model and its environment during a run. Under Standard 5, `not-evaluable` changes
neither status nor score in either direction, and can never be attested away.

**None of the five rules is `nonExemptible`.** An exception requires a real approver and a real date
under Standard 4; that mechanism is Phase 4 and does not exist yet, so in this release an exception
cannot in fact be recorded. Marking these rules non-exemptible to compensate would be using
exemptibility as a severity dial, which it is not.

## Tests and falsifiers

| What is asserted | How | Status |
|---|---|---|
| The generated table above matches `rules/oversight.json` in both directions | `test/standards-tables.test.mjs` | **Passing.** A rule added to the shard for this standard and omitted from the table fails the build |
| Every catalog invariant holds for the new shard | `test/catalog.test.mjs` via `loadCatalog()` | **Passing** |
| `oversight.no-authority-beyond-declared-tier` is not attestable, not `nonExemptible`, declares assurance `none`, and carries a note explaining why repository review is insufficient | `test/validation-type.test.mjs` | **Passing** |
| That rule never reports `passed`, and appears in the `notEvaluable` array | `test/validation-type.test.mjs` | **Passing** |
| It is excluded from the scored denominator in both directions | `test/validation-type.test.mjs` | **Passing** |
| No `oversight.*` id collides with a full id in any of the nine recorded packs | `test/namespace.test.mjs` against `artifacts/foreign-namespace-inventory.json` | **Passing** |
| This document is claimed by specification item 11 and its title matches | `test/inventory.test.mjs` | **Passing** |
| **NEGATIVE CONTROL** — a repository that merely *discusses* autonomy tiers produces no finding | `test/fixtures/mentions-only/` via `scripts/source.mjs` | **Passing**, and vacuously so: no detector reads autonomy tiers, so nothing could fire either way |
| R1 fails when a manifest omits `system.autonomyTier` | — | **No falsifier exists.** No detector implements R1 |
| R3, R4, R5 | — | **No falsifier exists**, and none is intended: all three are `manual-review` |
| R6 | — | **No falsifier is possible from this repository.** That is what `not-evaluable` means |
| R7 | — | **No falsifier exists.** Enforced by review of this repository's own code |

**Four of seven requirements have no mechanical falsifier in this release, and one never will.**
Stating that here rather than in a footnote is the point of this section.

## Exceptions and staleness

The exception mechanism (Standard 4) is Phase 4 and is not implemented. In this release an exception
to any rule above **cannot be recorded**, so no rule here is currently exemptible in practice
regardless of what the table says.

When it exists, the staleness rule for this standard is **conditional, not scheduled**, following
[Standard 2](02-ai-risk-tiering-and-applicability.md) R5. A declared autonomy tier does not expire
with time; it is invalidated by an event. The events that invalidate it:

- A tool is added, or an existing tool gains a side effect it did not have
- A credential or scope is granted or broadened
- A human review step is removed from a path the system uses
- The system begins acting on content it did not previously receive

An approval under R5 is likewise not time-limited. It approved a specific increase, and it remains
the record of that increase; a later increase needs its own approval rather than a renewal of this
one.

A not-applicable declaration under Scope is invalidated by the system gaining any model-initiated
effect, and that is the `revisitWhen` a project should record.

## Additions this standard makes beyond the source

The brief contributes one word: **`autonomous`**, appearing in the list "high-impact, destructive,
autonomous, or externally visible actions". It names autonomy as a category of action requiring an
approval gate. It does not define autonomy, does not say it comes in levels, and does not say the
level should be declared. Everything structural here is authored:

- **The four-tier scale** `read` / `propose` / `execute` / `autonomous`. The enum is inherited from
  `schemas/ai-system-manifest.schema.json`, which is itself this repository's authored artifact, not
  the brief's.
- **R2's discriminator** — that a tier is determined by delegated authority and never by model
  capability, tool count, or architecture. The brief names no discriminator.
- **The claim that the `execute`/`autonomous` boundary is about review rather than bounds**, and the
  corollary that a tightly bounded system may still be `autonomous`.
- **R3 in full**, including the ruling that a `read` or `propose` system may hold *no* effect-producing
  capability, and the decision to check it against Standard 45 R1's tool permission manifest where
  one exists.
- **R4's three components** — how, who, and resulting state — and the decision to exempt `read` and
  `propose` systems.
- **R5's asymmetry:** raising a tier requires approval and lowering one does not. Nothing required
  that asymmetry to be stated; the alternative reading, that any tier change needs sign-off, is what
  stops reduction happening.
- **The ruling that a retroactive approval is not an approval.**
- **R6's classification as `not-evaluable` rather than `manual-review`**, and the argument in
  Validation for why repository review is insufficient for it but sufficient for R3.
- **R7 in full, and specifically its narrower scope than Standard 2 R2.** The decision not to
  propagate a blanket prohibition on advisory proposal, because that prohibition is itself authored
  and unapproved, is a judgment made here and recorded as Q7 rather than silently applied.
- **The admission that four of seven requirements have no mechanical falsifier and one never will.**
  Nothing required that admission to be made in this form.

## Relationship to other standards and ADRs

[Standard 45](45-approval-gates.md) is the closest neighbour and the boundary is worth stating
exactly: **45 governs whether an individual action is gated; 11 governs how much authority the system
holds in general.** A system can satisfy 45 for every action it takes and still have acquired
`autonomous` authority nobody agreed to, because 45 asks about actions and 11 asks about the grant.
Standard 45 R5 (never obtain the approval from the system that wants it) is imported wholesale by R5
here rather than restated.

[Standard 2](02-ai-risk-tiering-and-applicability.md) is the parallel structure and the contrast is
instructive. Both concern a declared tier a repository scan must not infer. They differ in that
**Standard 2's tier has nowhere to live** — neither schema has a risk-tier field and both are
`additionalProperties: false` — so it ships with no rules, while `autonomyTier` already exists in the
manifest schema, so this standard ships with five. Standard 2 R2 and R7 here also differ in scope;
see R7.

[Standard 1](01-ai-system-manifest.md) is the manifest requirement this depends on. **A correction
belongs here:** Standard 2's cross-reference previously stated that Standard 1 R1 declares an
autonomy tier. It does not — R1 requires name, purpose and models, and R5 covers the lifecycle
stage. No requirement anywhere in this pack mandated `autonomyTier` before R1 of this standard. That
error has been corrected in Standard 2.

[Standard 5](05-verdict-vocabulary.md) defines what `prohibited-but-unestablished` and `not-evaluable`
mean in a report, which is what R6 relies on to be worth stating at all.

**Item 10, Human Oversight and Intervention, is unwritten.** R4 covers only the autonomy-tier form of
intervention — the halt path for a system that acts alone. The general oversight obligation is item
10's and is not claimed here. Where the two overlap when 10 is written, the more specific requirement
governs its own subject and neither is carried as independently authoritative.

No ADR has been written for this standard. The ADR corpus (0001–0024 in the plan) is Phase 6.

## Implementation

**Implemented today.**

| Mechanism | What it does | Where |
|---|---|---|
| The `autonomyTier` enum | Constrains a declared tier to the four values in R2, and rejects any other | `schemas/ai-system-manifest.schema.json`, `system.autonomyTier` |
| Catalog invariants for R6 | Enforce that a `not-evaluable` rule declares assurance `none`, is not attestable, is not `nonExemptible`, and carries a substantive note | `scripts/catalog.mjs:124-148` |
| Generated-table verification | Asserts the Validation table and `rules/oversight.json` agree, in both directions | `test/standards-tables.test.mjs` |
| Namespace refusal | Makes minting `ai.propose-execute` here a catalog load failure rather than a convention | `FOREIGN_NAMESPACES`, `scripts/catalog.mjs:50` |
| R7 by construction | No detector reads or writes an autonomy tier. `EVALUATED_RULES` contains nine ids, none in `oversight.*` | `scripts/standards.mjs:130` |

**Proposed, and deliberately absent from this release.**

| Proposed | Why it is not here |
|---|---|
| A detector for R1 (manifest declares a tier) | Straightforward and genuinely useful. It is Phase 3 work, and adding it here would be the phase creep `test/no-phase-creep.test.mjs` exists to catch |
| A detector comparing granted tools against the declared tier (R3) | Would see only the repository half. Credentials and scopes usually live in deployment configuration, so a clean result would mean "no contradiction visible here", which reads as "consistent" and is not |
| A detector for the halt runbook (R4) | Would check that a file exists, not that the path works. File presence is the weakest possible proxy for an operational capability, and passing it would be more misleading than the current unexamined state |

**What no future release will implement.** A detector that assigns a tier. R7 forecloses it, and R2
explains why any inference would be drawn from the wrong signals. If a later release adds a labelled
advisory proposal, that depends on the owner ruling in Q7 and on R7 being amended first — not on a
detector being written and the standard being adjusted afterward.

**R7 is enforced by review of this repository, which is weaker than a test.** No mechanism prevents a
future contributor from writing a tier-assigning detector; what exists is this document, the
`EVALUATED_RULES` list, and whoever reads the diff. That is stated rather than dressed up.
