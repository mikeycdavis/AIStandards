# Standard 9 — Misuse and Abuse Prevention

Misuse does not need a broken system. The person who asks a writing assistant for a convincing
phishing message, or for a thousand distinct product reviews of a product nobody has used, is usually
an ordinary user of an ordinary interface, receiving the kind of output the system exists to produce.
Nothing was injected, escalated, or bypassed. The system worked.

That is what makes misuse hard to own. Security work looks for the place the system was made to do
something it should not be able to do; there is no such place here. Safety work looks for the harm a
system causes when it goes wrong; here nothing went wrong. What is left is a question nobody
downstream of the model answers by default: **what harmful use is this system exposed to, what stands
in the way of each one, what happens to the person who keeps trying, and does any of it work.**

Most systems have a partial answer, because the model provider ships a content filter. The failure this
standard is written against is taking that filter for the whole answer — a control nobody matched to a
misuse case, in front of a system nobody watches, whose effectiveness nobody has tested.

Source: item 9 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "misuse prevention" token of the "AI safety, misuse prevention, and human oversight"
bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 9 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded
> in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) by listing item 9 under
> `notGovernedElsewhere` — the search for an owner that found none — rather than by a posture entry.
> That review's substantive half is human judgment and carries `humanSignOff: null`. No maintainer
> of any adjacent pack has confirmed it.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it — anything that sends a prompt to a model, retrieves context for one, or acts on a model's output.

Two terms, both defined by this standard rather than by the brief:

- **Misuse** is use of a system through an interface it offers and within permissions it grants, to
  obtain an output or effect that causes harm or that the system's operators have declared
  unacceptable.
- **Abuse** is misuse whose harm depends on scale, automation, or evasion — the same request made at
  volume, from many identities, or as a sequence of rephrasings no single one of which reveals it.

The distinguishing feature of both is that **the system is not broken.** That is where the boundary
with this standard's neighbours falls, and none of their ground is claimed:

- **[Standard 8](08-ai-safety-requirements-and-safety-cases.md)** governs harm arising from the system
  operating as intended or failing to, and states that which controls a system owes against deliberate
  misuse is this item's. A safety case may cite a control required here as evidence; Standard 8 R4
  governs how.
- **[Standard 21](21-prompt-and-instruction-security.md)** governs whether content arriving on the
  model's instruction channel can acquire instruction authority. An attempt to make a model disregard
  its instructions through its input — including what is commonly called a jailbreak, a word Standard
  21 does not use — is a question about who may give the model orders, and it is read here as
  Standard 21's. A misuse case may be *carried out* by such an attempt; R1 records the case, and the
  control on the instruction channel is Standard 21's to require. Neither its R3 threat model nor its
  R5 is restated here.
- **[Standard 11](11-autonomy-levels-and-delegated-authority.md)** and
  **[Standard 45](45-approval-gates.md)** govern how much authority a system holds and whether an
  individual action is gated. A misuse case whose harm is an effect rather than an output is bounded
  in part by them, and R1 may name a gate as a control.
- **Unwritten items, whose ground is not claimed:** item 10, Human Oversight and Intervention (the
  general oversight obligation); item 13, Personal Data in AI Systems (what a misuse log may retain);
  item 16, Access Control for Models, Context, and Tools (who may use the system at all); items 22,
  23 and 24 (tool, agent and retrieval security — attacks on the system's components); item 34, AI
  Incident Response (what happens once a misuse event is declared an incident); item 35, Red Teaming
  (how the adversarial exercises R5 names are run and recorded); item 41, Inference Cost and Budget
  Control (budgets whose mechanism R3's bound may share); and item 48, Safety and Oversight
  Prohibitions (below).

**R1 reaches every system in scope, and "we identified no foreseeable misuse" is an answer to it, not
an exit from it.** A system whose analysis finds no case records that, with its reasoning, and the
record is R1's evidence. R3 reaches only systems that accept requests from people or processes outside
their operating team; a system with no such caller may declare R3's rule not-applicable under
[Standard 2](02-ai-risk-tiering-and-applicability.md) R4, with a reason and a `revisitWhen`. R4 and R5
reach only systems whose R1 analysis names at least one case; with none, there is nothing to signal
and no control to exercise, and the R1 record is what shows it.

**This standard mints no prohibition.** The specification groups items 8 to 11 under the heading
"Band B — Safety, misuse, oversight · bullet 1", and lists every must-never requirement as class-A
work in Band L. The Band L item whose title covers safety and oversight is item 48, Safety and
Oversight Prohibitions. Its row under the specification's Authored items names `AI safety` and
`human oversight` as the tokens it is the negative face of. It does not name `misuse prevention`, and no prohibition item
does. Whether misuse prevention has a prohibitive face, and which item would own it, is therefore not
decided by the specification, and this standard does not decide it. The one `forbidden` rule under
this standard, R2's, was minted in Phase 1 before this document existed; it is stated here as it
stands, and no further `forbidden` rule is added.

**Risk tier does not grade this standard.** Nothing below becomes lighter at a lower tier: Standard 2
R3 forbids a tier from reducing a rule's level, severity or exemptibility, and allows it only to decide
whether a rule's subject is in scope. **This standard does not restate, extend, or rely on Standard 2
R2, and takes no position on the open question recorded as Q7** in
[`artifacts/project-plan-breakdown/08-open-questions.md`](../artifacts/project-plan-breakdown/08-open-questions.md).
Nothing here depends on how Q7 is resolved.

## Requirements

### R1 — Identify the foreseeable misuse, and name a control or an acceptance for each case

**Every AI system in scope MUST have a committed misuse analysis that names, for each foreseeable
misuse or abuse case, who could attempt it, the harmful output or effect sought, and the interface it
would be attempted through, and that records against each case either the control that addresses it
or a reasoned acceptance; where no case is identified, the analysis MUST say so and state how that
conclusion was reached.**

Three parts to each case, because each changes what a control has to do. *Who* — an anonymous member
of the public, an authenticated customer, and an employee attempting the same request are different
cases with different controls available. *The harmful output or effect sought* is what would count as
the misuse having succeeded, and it is exactly what an exercise under R5 would look for. *The
interface* — a chat surface, an API, a batch upload, a tool the model can call — is where a control
can sit.

**A reasoned acceptance is compliant; a case with neither a control nor an acceptance is not.** Some
misuse is tolerable for some systems, and an operator may decide so. What R1 refuses is the case
nobody decided about, because that case is indistinguishable from one nobody noticed.

**A provider's default safety setting counts as a control only for a case the analysis shows it
addresses.** This is the specific form of the failure in this standard's lede. A filter named against
every case, with no statement of which case falls within what it is built to catch, is not a set of
controls; it is one control and a list of hopes. The analysis does not have to establish that the
filter works — that is R5, and it cannot be established from a document — but it has to say why the
filter is the control for *this* case.

The "no case identified" branch matters as much as the main one. A repository with no misuse analysis
is indistinguishable from a repository whose team looked and found nothing; the first is missing
evidence and the second is a finding, and Standard 2 R4 forbids one to stand in for the other.

The analysis may be a standalone document or a section of another committed one, including the record
Standard 8 R1 requires or the threat model Standard 21 R3 requires, provided each of R1's questions is
answered in it. **No field in the manifest schema can point to it**, so locating it is part of the
human review, and that is one reason this rule is `manual-review`.

Rule `misuse.misuse-cases-identified`.

### R2 — Do not turn off a model provider's safety controls

**Configuration MUST NOT turn off a model provider's content filtering, moderation, or safety
settings.**

A disabled safety control is a decision with a blast radius, and it is characteristically made to
unblock a test and then not reverted: the setting outlives the reason. It also removes a control R1
may have named, silently, in a file that is not the misuse analysis.

R2 is about turning a control **off**. A setting lowered but not off is not what R2's rule looks for,
and whether a lowered setting still addresses the cases it is named against is R1's question.

**The rule is exemptible deliberately.** Its recorded exemptibility note says that research and
red-team systems have a genuine reason to lower a safety setting, and that a rule refusing to hear it
would be routed around rather than met. In this release that reason cannot yet be recorded: the exception mechanism is item 4's and does
not exist. Declaring the rule not-applicable while a detector observes a disabled setting is the
contradicted applicability of Standard 2 R4, and blocks the verdict. Such a system today reports
`failed` on this rule, which is the accurate report of what it has done.

**The check behind this rule is narrower than the sentence above.** It recognises a short list of
literal spellings in a limited set of file types, and a clean result means only that none of them
was found — not that any control is enabled — and is reported as not established rather than `passed`. What it does exactly, and what it misses, is set out
under [Implementation](#implementation).

Rule `misuse.safety-controls-not-disabled`, `forbidden`, the only rule in this standard with a
detector.

### R3 — Attribute use to an identity, and bound what any one identity can obtain

**A system that accepts requests from people or processes outside its operating team SHOULD attribute
each request to an identity or source, SHOULD bound the volume of use any one identity or source can
obtain, and SHOULD record each bound and where it is enforced.**

Abuse is frequently misuse at volume. An output that is tolerable once can be harmful ten thousand
times, and an unbounded path to it is the cheapest one to automate. Attribution is the precondition
for everything after it: without it, no bound can be applied to anyone in particular, and R4's
enforcement action has nothing to act on.

*Should*, not *must*, and the difference is authored. The right bound depends on the system's use, and
a required rule would be met by a number nobody derived. **Where R1's analysis names a case whose harm
depends on volume, a bound is how that case is controlled, and R1 already requires the control to be
named** — so the obligation is firm exactly where the analysis says it matters, and advisory
elsewhere. R3's rule reports at warning severity.

A bound frequently lives in gateway or deployment configuration rather than in the repository. R3 asks
that the bound be recorded and that the record say where it is enforced, not that it be in the
repository. The same mechanism may also serve a cost budget under item 41; one limit may be evidence
for both, and this standard claims only its use against abuse.

Rule `misuse.abuse-volume-bounded`.

### R4 — Record the signals of attempted misuse, name who reviews them, and have an action to take

**Where the misuse analysis names at least one case, the system MUST record the events by which an
attempt at a named case would be recognised, MUST name the role that reviews those records, and MUST
provide at least one enforcement action against an identity or source that the reviewer can apply.**

A control that blocks one request does nothing about whoever sends the next, rephrased. Misuse that is
filtered and never reviewed is misuse the operator has arranged not to know about; a reviewer who
recognises a pattern and has no action available can only watch it continue. The three parts close
those three gaps in order: something is recorded, someone looks, and looking can lead somewhere.

The events are the system's own: filter hits, refusals, bound breaches under R3, reports from users or
recipients. The action need not be drastic — restricting an identity, lowering its bound, or suspending
it all qualify — but it must be applicable by the named reviewer, to an identity or source, rather
than only to the request in front of them.

**Recording misuse signals does not suspend the pack's rules on logged content.** A record that holds
prompt or completion text is subject to `privacy.no-unredacted-prompt-logging`, which belongs to item
13 and is not restated here. What happens once a reviewer declares an incident is item 34's subject;
R4 stops at recognisable, reviewed, and actionable.

Rule `misuse.misuse-signals-acted-on`.

### R5 — The named controls hold at inference time

**Every control named under R1 MUST prevent or bound the misuse case it is named against while the
system runs.**

This is the requirement R1 through R4 exist to serve, and **this framework cannot check it.** Whether
a filter stops a request, whether a bound defeats an automated campaign, whether a reviewer's action
stops the person behind it — each is decided by the model, the adversary's inputs, and the running
environment. A human reading the repository can establish which controls are named and how they are
configured; that is R1, and it is `manual-review` for that reason. The same human cannot establish
that the controls work against someone trying to get past them.

Even the strongest evidence available does not close the gap. A record of an adversarial exercise
establishes behaviour on the inputs exercised, at the revision recorded, and nothing wider. How such
exercises are run and recorded is item 35's subject.

Stated anyway, at `required` level and `not-evaluable` validation type, so that the requirement is
visible in every verdict rather than implied by the presence of controls. **It is `required` and not
`forbidden` because this standard mints no prohibition**; see Scope.

Rule `misuse.controls-effective-at-inference`, **not-evaluable**. Its `$notEvaluableNote` names what
would make part of it checkable: a committed record of an adversarial exercise against each named
misuse case, from a named harness at a recorded system revision.

### R6 — No component of this framework may report a misuse control as enabled or effective from a presence or an absence

**No detector, heuristic, or audit finding in this framework MAY report a misuse control as enabled
or effective, or a misuse case as addressed, on the basis of a document's presence, a configuration
value's presence, or the absence of a disabling literal; and a `passed` result for R2's rule MUST NOT
be presented as evidence that any provider control is enabled.**

The detector bound to R2 records a clean observation whenever it does not recognise a disabling spelling —
including for a spelling it has never heard of, a file type it does not read, and a repository with no
configuration at all. That result does not claim that any control is enabled; since the Q13 correction on 2026-09-14 it is reported `skipped` / `not-evaluated`, with the distinction `prohibited-but-unestablished`, and not `passed`, because Standard 5 R6 forbids `passed` for a check that covered less than the rule requires. *Corrected 2026-09-14: this sentence had called the result honest about what it is.* It would become dishonest the moment
anything in this framework rendered it as "safety controls enabled", or counted a misuse analysis's
existence as misuse prevented.

**This requirement concerns what a check may claim about misuse controls. It is not a restatement of
Standard 2 R2**, neither narrows nor extends it, and has no bearing on Q7.

There is no rule for R6. It constrains this framework's own implementation rather than a consuming
project, and a project cannot fail it. It is enforced by construction and by review of this
repository, which is named as the weaker mechanism it is in Implementation.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| The filter is the plan | Every misuse case, where any is written down, names the provider's default filter as its control | R1 |
| Silence read as safety | No analysis exists; nobody can tell "no foreseeable misuse" from "nobody looked" | R1 |
| The case nobody decided about | A case is listed with neither a control nor an acceptance | R1 |
| The test setting that shipped | A safety setting turned off to unblock an evaluation, never reverted | R2 |
| Disabled under another spelling | A setting turned off with a value or key the detector does not recognise, reported as an unestablished prohibition rather than a failure | R2 — **not caught**; see Implementation |
| Misuse at volume | One identity generates output at a rate no human use would need, and nothing bounds it | R3 |
| Unattributable use | A shared credential means no request can be traced to anyone, so no one can be restricted | R3 |
| Filtered and forgotten | Blocked requests are dropped; the same identity rephrases until one gets through, and nobody sees the pattern | R4 |
| A reviewer with no lever | The pattern is seen, and no action exists except blocking the next single request | R4 |
| Monitoring that leaks | The misuse log keeps full prompts, unredacted, indefinitely | R4, and item 13's rule |
| Configuration mistaken for prevention | Controls named, configured and reviewed, and read as proof that misuse is prevented | R5 |
| Absence reported as enablement | A report says "provider safety controls enabled" because no disabling literal was found | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The misuse analysis: each case's actor, sought harm and interface, with its control or reasoned acceptance — or the reasoned finding that no case was identified | A committed document. **No manifest field references it**: besides its `$scaffold` marker, `schemas/ai-system-manifest.schema.json` has fields for system, models, prompts, tools, data sources and evaluation, and nothing for misuse | Human review |
| R2 | The provider safety configuration in effect | Configuration in the repository, and wherever else the provider is configured | The detector, **partially**: recognised literals, in recognised file types, in files naming a recognised key. Human review for everything else |
| R3 | The attribution scheme, each bound, and where each is enforced | Frequently gateway or deployment configuration outside the repository, with a committed record of it | Human review, by someone with access to the enforcing configuration |
| R4 | The list of misuse signals, the reviewing role, the enforcement action, and how signal records meet the logging rules | A committed runbook or design record; the records themselves are runtime data | Human review. Whether review actually happens is an operational fact the repository does not hold |
| R5 | A committed record of an adversarial exercise against each named case, at a recorded revision | Committed alongside the analysis | **Does not establish R5.** It establishes behaviour on the exercised inputs, and no rule in this release checks for it |
| R6 | The detectors bound to this standard's rules, and what their results say | `EVALUATED_RULES` and `detectDisabledSafetyControls` in `scripts/standards.mjs` | Code review |

The gap worth naming: **a safety setting made anywhere other than a searched file in the repository is
invisible to this framework**, and a clean result for R2's rule says nothing about it. The rest of this
standard's evidence is located and read by a human, and by nothing else in this release.

## Validation, severity, and exemptibility

<!-- BEGIN GENERATED FROM rules/misuse.json — DO NOT EDIT. Verified by test/standards-tables.test.mjs. -->

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R1 | `misuse.misuse-cases-identified` | required | error | manual-review | yes |
| R2 | `misuse.safety-controls-not-disabled` | forbidden | error | configuration | yes |
| R3 | `misuse.abuse-volume-bounded` | recommended | warning | manual-review | yes |
| R4 | `misuse.misuse-signals-acted-on` | required | error | manual-review | yes |
| R5 | `misuse.controls-effective-at-inference` | required | error | not-evaluable | yes |

<!-- END GENERATED -->

**R6 has no rule, and this is deliberate.** It constrains this framework rather than a consuming
project; a project cannot violate it, and a rule nobody can fail would enlarge the catalog without
adding a check.

**R2's rule keeps its Phase 1 identity unchanged** — id, `forbidden` level, `error` severity,
`configuration` validation type, `partial` assurance, exemptible, standard 9. This document states it;
it does not re-mint or re-level it.

**The four rules this standard adds sit in `misuse.`**, one of the seventeen namespaces reserved in
`NAMESPACES` in `scripts/catalog.mjs`, which Standard 8 records as item 9's, and which already holds
R2's rule. It is not one of the six segments `SHARED_SEGMENTS` records as used by another pack.

**R1 and R4 are `manual-review`, not `structural` or `document`.** Each asks a question about content
— whether a case names its actor and harm, whether a provider default is shown to address the case it
is named against, whether a named reviewer has an action — and the answer is in the words, not in the
presence of a file. A presence check would also have nowhere to look, since no manifest field declares
a path. **R3 is `manual-review`** because its evidence is frequently outside the repository.

**R3's `recommended` level changes nothing in the verdict in this release, and that was checked
rather than assumed.** In `evaluate()` in `scripts/compliance.mjs`, an applicable rule that no
detector examines is unestablished whatever its level, and any unestablished applicable rule keeps the
status from `COMPLIANT` — at `NOT_EVALUATED`, unless a confirmed failure elsewhere makes it
`NON_COMPLIANT`. The level would matter only for a confirmed violation, which `evaluateRule()`
reports as `warning` rather than `failed` for a `recommended` rule — and no detector can confirm one.
The level records the authored strength of R3; it is not a way of making the rule quieter.

**R2's `forbidden` level has two observed effects.** When the detector confirms a violation, the
result is `failed` and the status `NON_COMPLIANT`. When the rule is withdrawn, the result is `skipped`
with disposition `not-evaluated`, the distinction is `prohibited-but-unestablished`, and the rule is
listed in `unestablishedProhibitions`. That is this repository's own result for it: `test/validate.test.mjs`
asserts the result, the disposition and the withdrawal message, and the distinction follows from
`distinction()` in `scripts/compliance.mjs`.

**R5 is `not-evaluable` rather than `manual-review`, and the line between them is R1.** A human reading
the repository can establish which controls are named and configured; that is R1. A human reading the
repository cannot establish that those controls stop an adversary; that is R5. Under
[Standard 5](05-verdict-vocabulary.md) R8 a not-evaluable rule changes neither status nor score, and
under the catalog invariants it declares assurance `none` and cannot be attested.

**None of the five rules is `nonExemptible`.** The catalog forbids it outright for R5. R2's rule is
exemptible by its own recorded note, for research and red-team systems. For R1, R3 and R4, an
exception is a recorded, approved decision to live with a known gap in misuse controls, and there are
legitimate ones; marking the rules non-exemptible would use exemptibility as a severity dial.

**R2's assurance note as first written was wrong about its own blind spot.** The rule's
`$assuranceNote` said that an unrecognised provider spelling "appears as not-evaluated rather than as a
pass". The code does the opposite: `detectDisabledSafetyControls` records an observation with no
violation and no unknown, and `evaluateRule()` in `scripts/compliance.mjs` turns exactly that into
`passed`. `test/audit.test.mjs` asserts `passed` for the `safety-configured` and `mentions-only`
fixtures, and neither contains a disabling literal. This document states what the code does, and the
note is corrected to match it in the same change. *Superseded later on 2026-09-14 by the Q13
correction: `evaluateRule()` now reports that clean observation as `skipped` / `not-evaluated`, the
tests assert `prohibited-but-unestablished` with no violation, and the note was corrected again.*

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control | Status in this release |
| --- | --- | --- | --- | --- |
| R1 | Human review of the analysis | No analysis; a case with neither control nor acceptance; a provider default named against a case the analysis does not show it addresses | A reasoned finding that no case was identified must **not** be reported missing; a reasoned acceptance must **not** be reported as a missing control | **No detector.** `manual-review` |
| R2 | `disabled-safety/` reports a violation | A recognised disabling literal in a code or string position of a searched file that names a recognised safety key | `safety-configured/` must not fire and must report `prohibited-but-unestablished`, not `passed`; `mentions-only/`, which names `BLOCK_NONE` in a comment and in a README, the same | **Detector, partial.** A clean result, blind spots included, reports `prohibited-but-unestablished`; see Implementation |
| R3 | Human review of the attribution scheme and bounds | A system taking requests from outside its operating team with no attribution, or with no bound on any one identity | A system whose every caller is its operating team is out of scope, not failing; a bound enforced in deployment configuration must not be rejected for being outside the repository | **No detector.** `manual-review` |
| R4 | Human review of the signal list, role and action | A named case with no recognisable signal; no reviewing role; no action applicable to an identity or source | A system whose R1 analysis names no case owes none of this | **No detector.** `manual-review` |
| R5 | — | **No falsifier is possible from this repository.** That is what `not-evaluable` means | The rule must never report `passed`, whatever controls and records exist | Catalog invariants apply once the rule is in the catalog |
| R6 | None of the four rules this standard adds is in `EVALUATED_RULES` | A detector reporting a misuse control enabled or effective, or a case addressed, from presence or absence | R2's clean result — `prohibited-but-unestablished`, with the message that an unlisted spelling would not be seen — is **not** a violation: it reports the absence of a recognised literal, not an enabled control | **Enforced by construction** — no detector reads a misuse analysis or reports on enablement |

What the existing suite asserts about R2, stated precisely because it is narrower than the rule:

- **The detector fires on one shape.** `test/audit.test.mjs` pairs the rule with `disabled-safety/`,
  whose `src/config.js` sets `threshold: "BLOCK_NONE"` inside `safetySettings`, and asserts a
  violation.
- **Two controls must not fire, and neither may pass.** The same pairing asserts no violation and the
  distinction `prohibited-but-unestablished` for `safety-configured/`, whose threshold is
  `"BLOCK_MEDIUM_AND_ABOVE"`, and a separate test asserts the same for `mentions-only/`; until the
  2026-09-14 Q13 correction both asserted `passed`. Neither result says a control is enabled: no
  disabling literal is present, and the detector does not recognise an
  enabled setting — it recognises none.
- **`test/partial-assurance.test.mjs`, added 2026-09-14, asserts that no partial-assurance result is
  `passed` in any fixture**, and that `test/fixtures/q13-synthetic-env-block-none/` — a synthetic input
  whose `.env` sets `SAFETY_SETTINGS=BLOCK_NONE` in a file type the detector does not read — reports this
  rule `prohibited-but-unestablished` and the project `NOT_EVALUATED`, where it had reported `COMPLIANT`.
- **The self-walk is withdrawn, not passed.** `test/validate.test.mjs` asserts that this repository's
  own result for the rule is `skipped` / `not-evaluated`, with the framework-exclusion message.
- **A false not-applicable declaration blocks.** `test/validate.test.mjs` asserts
  `BLOCKED_BY_INVARIANT` for `applicability-contradiction/`, whose policy declares the rule
  not-applicable and whose `src/config.js` sets `BLOCK_NONE`.
- **`test/source.test.mjs` asserts that the use/mention split moves `BLOCK_NONE` out of the code text**
  when it appears in a comment, a string or a regular-expression literal.
- **`test/safety-detector.test.mjs`, added 2026-09-14, asserts the quoted form of the off-pattern**
  through the CLI: a quoted `off` fails in YAML with lines before or after it, in a JavaScript or
  TypeScript object, and as a Python keyword argument; the union-type and ternary guards hold, while a
  `||` fallback, an assignment inside a ternary and a YAML explicit key still fail. Each non-firing case
  is paired with a firing one, and the controls name the disabling spelling in a comment or README.
- **Nothing in the suite exercises** the `OFF` literal, the `false` form of the off-pattern, the
  requirement that a safety key appear in the same file, a file type outside the searched set, a
  truncated file, or an unrecognised spelling.

The behaviour described under Implementation for those untested paths was observed while writing this
document, by running `node scripts/standards.mjs validate --json` against throwaway target directories.
Those runs are not committed and are not part of the suite; they are recorded so that the description
can be checked, not as coverage.

Once the four added rules are in `rules/misuse.json`, the suite would also assert: that the table above
matches the shard in both directions (`test/standards-tables.test.mjs`); that every catalog invariant
holds, including R5's rule declaring assurance `none`, being neither attestable nor `nonExemptible`,
and carrying a note of at least forty characters (`loadCatalog()` in `scripts/catalog.mjs`); that
R5's note says why the subject is outside the repository and names what would make it checkable
(`test/validation-type.test.mjs`); and that no new id collides with a recorded foreign id
(`test/namespace.test.mjs`). As with Standard 8's not-evaluable rule, the "never reports `passed`"
assertion in `test/validation-type.test.mjs` would reach R5's rule by construction — `evaluateRule()`
returns `skipped` for every not-evaluable rule before any detector is consulted — and examines nothing
about misuse.

**Four of six requirements have no mechanical falsifier in this release, and one never will from a
repository. The fifth, R2, has a partial one, whose clean result — blind spots included — reports as an unestablished
prohibition, not a pass.** R6's footing is the
absence of code rather than a test that fails.

## Exceptions and staleness

The exception mechanism is item 4's subject and is Phase 4 work; item 4 is unwritten. **In this
release an exception to any rule above cannot be recorded**, so none is exemptible in practice whatever
the table says. For R2 this has a sharp consequence, set out under R2: a research or red-team system
that disables a setting for a real reason reports `failed`, and cannot honestly report anything else.
When the mechanism exists, an exception to R2 records why the setting is off and what compensates for
it, with an approver and a date. It does not turn an uncontrolled misuse case into a controlled one,
and an exception is not a control R1 can name.

R5's rule can never be attested and never be made `nonExemptible`; both are catalog invariants for
`not-evaluable` rules, enforced when the catalog loads.

**Staleness is conditional, not scheduled**, following Standard 2 R5. A misuse analysis does not
expire on a date; it stops holding when the system's exposure changes. The events that invalidate it:

- The system gains a new population of users or callers — a public release, an opened API, a partner
  integration
- A new interface, tool or output type changes what output or effect can be obtained through it
- A model identifier in the manifest changes, or a provider re-points one, so that a control named as
  the provider's behaviour may no longer behave as it did
- A provider safety setting, or a bound under R3, is changed or removed
- A misuse signal under R4 shows a case the analysis does not name, or a named control failing — what
  is done about that event is item 34's subject, but the analysis no longer holds from the moment it
  occurs

**The staleness risk is asymmetric.** The analysis is invalidated at the moment the system's exposure
widens, which is the moment people are thinking about the launch and not about the analysis. Nothing
in this release detects any of these transitions.

## Additions this standard makes beyond the source

The brief contributes two words: **`misuse prevention`**, as the second subject in the list "AI safety,
misuse prevention, and human oversight". It names misuse prevention as an area to cover. It does not
mention abuse, misuse cases, controls, provider settings, attribution, volume, monitoring,
enforcement, or effectiveness; the word "abuse" does not appear in the brief. The title "Misuse and
Abuse Prevention" is the specification's item title, derived from that token; it is not the brief's
wording. Everything normative here is authored, and none of it has owner approval:

- **The definitions of misuse and abuse**, and the organising claim that in both the system is not
  broken — which is where this standard draws its boundaries with Standards 8, 21, 11 and 45.
- **The reading that an attempt to override a model's instructions through its input, including a
  jailbreak, is Standard 21's subject** rather than this standard's. Standard 21 does not use the word,
  and the reading is this document's.
- **R1 in full**: the actor / harm / interface form, the control-or-acceptance requirement, the ruling
  that a reasoned acceptance is compliant, the ruling that a provider default counts as a control only
  for a case the analysis shows it addresses, and the requirement that a finding of no case be recorded
  with its reasoning.
- **R2's statement and its limits.** The rule itself, its `forbidden` level and its exemptibility were
  authored in the Phase 1 shard, not taken from the brief. This document's additions are the
  on/off reading of it, the account of what a research system can and cannot do about it in this
  release, and the refusal to read a `passed` result as enablement.
- **The proposed correction of R2's `$assuranceNote`**, made because the note contradicted the code.
- **R3 in full**: attribution and per-identity bounds, their scope to systems with callers outside the
  operating team, the `SHOULD` strength, the argument that R1 makes the obligation firm where volume is
  the harm, and the `recommended` / `warning` classification.
- **R4 in full**: signals, a named reviewing role and an enforcement action against an identity or
  source, its condition on R1 naming a case, and the ruling that misuse monitoring does not suspend the
  logging rule owned by item 13.
- **R5's statement at `required` level and `not-evaluable` type**, and the decision not to use
  `forbidden`.
- **R6 in full**, and its explicit separation from Standard 2 R2 and Q7.
- **The decision to mint no prohibition**, and the observation that the specification's item 48 names
  `AI safety` and `human oversight` but not `misuse prevention` as its positive tokens — recorded, not
  resolved.
- **The scope decisions**: that R1 reaches every system in scope, that R3 reaches only systems with
  callers outside their operating team, that R4 and R5 are conditional on R1 naming a case, and that
  the ground of items 10, 13, 16, 22–24, 34, 35, 41 and 48 is not claimed.
- **The decision not to grade misuse controls by risk tier**, on the basis of Standard 2 R3.
- **The placement of the four added rules in `misuse.`**, the classification of R1, R3 and R4 as
  `manual-review`, and the decision that none of the five rules is `nonExemptible`.
- **The admission that four of six requirements have no mechanical falsifier**, that R2's detector
  reported its blind spots as passes until the Q13 correction, and that the untested detector behaviour described below was
  observed by uncommitted runs rather than asserted by the suite.
- **The 2026-09-14 corrections after the detector repair**: Implementation items 2 and 5 and their line
  numbers restated from the repaired code, the suite list extended, and R6's description of R2's
  `passed` result no longer called honest, pending Q13. These are evidence corrections made during
  integration, not owner-approved content.
- **The corrections after the Q13 correction, the same day**: R2's clean result described as
  `prohibited-but-unestablished` rather than `passed` wherever this document described it, the controls
  restated, and an Implementation row added. Evidence corrections, not owner-approved content.

## Relationship to other standards and ADRs

[Standard 1](01-ai-system-manifest.md) draws the scope this standard applies within. Its manifest
schema has no place to reference a misuse analysis, which is why R1 is located by a reviewer.

[Standard 2](02-ai-risk-tiering-and-applicability.md) is relied on for its R3 rule that a tier narrows
scope and never lowers a requirement, its R4 dispositions — which are why "no case identified" is a
recorded finding, and why a false not-applicable declaration for R2's rule blocks — and its R5
conditional expiry. **This standard does not change Standard 2**: it does not restate or rely on R2,
and does not propagate R2's word "propose", pending Q7.

[Standard 5](05-verdict-vocabulary.md) defines `passed`, `not-evaluated` and
`prohibited-but-unestablished`. Its R6 truth table is what turns R2's detector's clean observation into
`passed` and its withdrawal into `not-evaluated`; its R8 is why R5 can be stated without moving the
verdict. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is why every requirement here
carries a falsifier or is declared not-evaluable, and its R8 is why R5's rule cannot be attested.
[Standard 7](07-boundary-with-adjacent-standards.md) R1 records "AI safety, misuse, human oversight" as
owned by this pack with no existing owner, which is the division the `notGovernedElsewhere` record for
this item evidences.

[Standard 8](08-ai-safety-requirements-and-safety-cases.md) is the nearest sibling and the structural
precedent: its R5 and R6 have the same shape as R5 and R6 here. **8 governs whether a safety claim is
stated, argued and evidenced; 9 governs which controls stand against deliberate misuse.** Standard 8
leaves the second to this item by name. A safety case may cite a control required here, and its R4
evidence kinds govern that citation; a misuse analysis is not a safety requirements record, because
misuse needs an adversary and a hazard does not.

[Standard 21](21-prompt-and-instruction-security.md) governs the instruction channel. Its R3 threat
model records where untrusted content enters that channel; R1 here records who could use the system for
harm and what stands in the way. The two may share a document, and neither substitutes for the other.
[Standard 11](11-autonomy-levels-and-delegated-authority.md) bounds the authority a misused system can
exercise, and [Standard 45](45-approval-gates.md) gates the individual actions a misuse case may try to
cause; either may be named as a control under R1.

Unwritten items this standard defers to, by specification number: item 4 (exceptions, which R2's
exemptibility needs); item 10 (the general oversight obligation); item 13, whose shard
`rules/privacy.json` already carries `privacy.no-unredacted-prompt-logging`, which governs R4's records;
item 16 (who may use the system at all); items 22, 23 and 24 (tool, agent and retrieval security);
item 34 (what follows a misuse incident); item 35 (the adversarial exercises R5 names); item 41 (budget
mechanisms R3's bounds may share); and item 48 (prohibitions on bullet 1's ground, whose relationship to
`misuse prevention` the specification does not record).

No ADR covers this standard. `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. One requirement has a detector, and it is partial. Four have none. R6's one mechanical
guarantee is an absence.**

Stated as separate lists so that a proposal is not read as a capability.

**Implemented today.**

| Mechanism | What it does | Where |
| --- | --- | --- |
| `detectDisabledSafetyControls` | Examines R2's rule, as described exactly below | `scripts/standards.mjs`, lines 423–493 |
| Withdrawal on a framework exclusion | Withdraws R2's rule, without scanning, when the walk was shortened by a framework exclusion | `SKIP` and `CONTENT_DERIVED_RULES`, lines 54–58 and 121–125; the `withdrawn` flag, line 534 |
| Contradicted applicability | Blocks the verdict when R2's rule is declared not-applicable and the detector observes a violation | `checkApplicabilityContradictions()`, lines 500–514 |
| Reporting of R2's clean result | Because the rule declares `assurance: partial`, a clean observation reports `skipped` / `not-evaluated`, distinction `prohibited-but-unestablished`, never `passed`, and keeps an applicable project from `COMPLIANT`; a recognised literal still fails. Since the 2026-09-14 Q13 correction | `evaluateRule()` in `scripts/compliance.mjs`; `test/partial-assurance.test.mjs` |
| Reporting of unexamined `manual-review` rules | R1, R3 and R4 report `skipped` / `not-evaluated`, never `passed`, and keep an applicable project from `COMPLIANT` | `evaluateRule()` and `evaluate()` in `scripts/compliance.mjs` |
| Reporting of `not-evaluable` rules | R5 is reported and listed in `notEvaluable`, outside the scored denominator, without effect on status | `scripts/compliance.mjs` |
| `not-evaluable` catalog invariants | Refuse a not-evaluable rule that claims assurance, is attestable, is `nonExemptible`, or lacks a substantive note | `checkRule()` in `scripts/catalog.mjs` |
| Generated-table verification | Asserts the Validation table and `rules/misuse.json` agree in both directions | `test/standards-tables.test.mjs` |
| R6 by construction | `EVALUATED_RULES` lists nine rule ids; R2's is the only one from this standard, and no detector reads a misuse analysis | `scripts/standards.mjs`, lines 130–140 |

The last four apply to the added rules only once they are in `rules/misuse.json`; they are general
mechanisms, not work done for this standard.

**What the detector for R2 does, exactly.** Read from the code, and where the suite is silent,
confirmed by the uncommitted runs described under Tests and falsifiers. *Items 2 and 5 were corrected
on 2026-09-14 after the detector was repaired; they had described a layout-dependent result the repair
removed, and every line number below was updated with them.*

1. **Which files.** Every file the walk collects — which skips `.git` and `node_modules` at any depth —
   whose extension `scripts/source.mjs` maps to a comment syntax: the JavaScript and TypeScript
   families, Java, C, C++, C#, Go, Rust, Swift, Kotlin, Scala, PHP, Python, Ruby, shell, YAML, TOML, R,
   Perl, PowerShell, SQL and JSON. Anything else is never read by this rule. `.env`, `.ini`, `.tf` and
   Markdown files were each observed to report `passed` with a disabling literal in them.
2. **Which text.** Each file is split lexically into code, comments, and string and regular-expression
   literals, and the detector searches the whole file with every comment blanked to spaces in place and
   code and literals left where they were written (`split.withoutComments`, line 473). **Comments
   are never searched**, which is the use/mention split `mentions-only/` exists to test.
3. **The key gate.** A file is skipped unless its searched text contains one of nine key spellings —
   `safety_settings`, `safetySettings`, `moderation`, `content_filter`, `contentFilter`, `safety_mode`,
   `safetyMode`, `harm_block_threshold`, `harmBlockThreshold` (line 430). **The key and the literal need
   only be in the same file, anywhere in it.** A key in one file and `"BLOCK_NONE"` in another reports
   `passed`; a key present only in a comment reports `passed`; and a file that names `safetySettings`
   and also contains an unrelated `"OFF"`, or an error message reading `"BLOCK_NONE is not allowed"`,
   reports `failed`.
4. **The literal list.** Two whole-word, case-sensitive literals: `BLOCK_NONE` and `OFF` (lines
   426–429, 475). `"block_none"` reports `passed`. In YAML, unquoted `safety_mode: OFF` reports `failed`
   and unquoted `safety_mode: off` reports `passed`. The code does not record which provider either
   literal belongs to.
5. **The off-pattern.** Independently of the list, a case-insensitive match for `moderation`,
   `content_filter`, `contentFilter`, `safety_mode` or `safetyMode`, then `:` or `=`, then `false` or a
   quoted `none` or `off` (defined at lines 432–448, applied at line 483). Because the searched text
   keeps code and literals in place, key, separator and value are matched as written, wherever they sit
   in the file: `moderation: 'off'` in YAML reports `failed` whatever lines precede or follow it, and so
   do `{ moderation: "off" }` in JavaScript and `moderation="off"` as a Python keyword argument. **It
   does not fire in JSON**, where the key is quoted and its closing quote stands between key and
   separator. Two guards apply to the quoted form only: a value followed by a single `|`, as in a union
   type `moderation: "off" | "on"`, does not match, while `"off" || fallback` does; and outside YAML, a
   key directly after `?` with `:` as its separator, as in a ternary branch `strict ? moderation :
   "off"`, does not match. Consequences observed by uncommitted runs: a TypeScript type with a single
   literal, `interface S { moderation: "off" }`, reports `failed`; a Python conditional
   `moderation="off" if strict else "on"` reports `failed`; a shell pipeline `moderation='off' | tee log`
   reports `passed`; the unguarded `false` form makes `moderation: false | true` in a type report
   `failed`; and a value that reaches the key through a variable is not seen. The quoted form and both
   guards are asserted by `test/safety-detector.test.mjs`. A hyphenated `content-filter` is not a
   recognised key.
6. **Withdrawal.** When the walk was shortened by a framework exclusion — in this release, only a
   `test/fixtures` directory at the target's root — the rule is observed as unknown **without any file
   being scanned** (lines 452–455), so a disabling literal elsewhere in the repository is not reported
   either. The result is `skipped` / `not-evaluated`, the distinction `prohibited-but-unestablished`,
   and the status cannot reach `COMPLIANT`.
7. **Everything else is not established.** When no hit is found and the rule was not withdrawn, the
   detector records an observation with neither a violation nor an unknown (line 492), and
   `evaluateRule()` in `scripts/compliance.mjs` reports that as `skipped` / `not-evaluated`, distinction
   `prohibited-but-unestablished`, because the rule declares `assurance: partial` (Standard 5 R6; until
   the 2026-09-14 Q13 correction it reported `passed`). This includes an unrecognised spelling, key or file
   type; a repository with no searched files at all; a file that could not be read, which is skipped at
   line 461 without recording an unknown; and anything past the first 524,288 characters of a file larger
   than 512 KiB, which `readText()` truncates and the detector does not check for. The message carried into the result
   itself says that "a provider spelling not on the maintained list would not be seen".

The last item is the one R6 exists for. Standard 5 R6 requires a check that could not read a file to
report `not-evaluated`, and Standard 5's own Implementation records unreadable-file withdrawal and
truncation domains as Phase 3 work. This detector is an instance of that recorded gap, not an exception
to Standard 5. Since the Q13 correction neither an unread file nor a clean search reports `passed`, but
the two still produce the same result and message.

**Proposed, and deliberately absent from this release.**

| Proposed | Why it is not here |
| --- | --- |
| Withdraw R2's rule to `not-evaluated` when a searched file is unreadable or truncated | Standard 5's Implementation places the evidence-availability architecture in Phase 3. Doing it for one detector first would give this rule a different withdrawal behaviour from its neighbours. Since the Q13 correction neither case yields `passed`; what is missing is a result that tells them apart |
| Report a configuration file of an unrecognised type as unexamined rather than silently skipping it | The same Phase 3 work. Until then an unread `.env` and a clean one are indistinguishable in the result |
| Require the literal to be the value assigned to the key, rather than anywhere in the same file | Needs a parse of each configuration format rather than a lexical split. It would remove the `"OFF"` false positive, the JSON `false` false negative and the single-literal type false positive, and it is Phase 3 detector work |
| Tests pinning the `OFF` literal, the `false` form of the off-pattern, the key gate and the truncation path | Each is behaviour the detector has and no test asserts. The quoted form of the off-pattern has been pinned by `test/safety-detector.test.mjs` since the 2026-09-14 repair; the rest is Phase 3 work, and a test asserting that a blind spot reports `passed` would pin it as intended behaviour |
| A manifest field declaring the path of the misuse analysis | A schema change alters what a conformant consuming project may declare. It is a schema-versioning decision, not a side effect of writing this document |
| A detector that the misuse analysis, the bounds record, or the signal runbook exists | Would establish file presence, which R6 forbids reporting as more. With no path field it would have to guess filenames |
| A rule checking that an adversarial exercise record against the named cases exists and is current | Would give R5 a route out of `not-evaluable` for the exercised inputs. How such records are produced and kept is item 35's subject, and item 35 is unwritten |

**What no future release will implement.** A detector that reports a misuse control enabled or
effective, or a misuse case addressed, from the presence of a document or a setting or from the absence
of a finding. R6 forecloses it, and R5 explains why the evidence that would be needed is not in a
repository.

**R6 is enforced by review of this repository, which is weaker than a test.** Nothing prevents a future
contributor from rendering R2's `passed` as "controls enabled", or from adding a detector for R1; what
stands in the way is this document, the `EVALUATED_RULES` list, and whoever reads the diff.
