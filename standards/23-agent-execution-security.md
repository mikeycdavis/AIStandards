# Standard 23 — Agent Execution Security

A model call answers once. An agent keeps going. It reads what its last step produced, decides what to
do next, calls a tool, reads the result, and decides again — and at no point in that sequence does
anyone have to agree to the next step for it to happen. That is the point of building one, and it is
also the whole of the problem: every property a single call has for free — it ends, it holds only what
it was handed, it cannot change what it was told — an agent has only if somebody built it in.

Each of those properties fails quietly. A loop with no step limit runs until something outside it
gives out: a quota, a bill, a rate limit, or the thing the agent was editing. A credential issued so
the agent could read one repository turns out to write to all of them, and nobody listed the second
capability because nobody meant to grant it. An agent given a configuration tool so it can adjust one
setting can also reach the file that holds its own instructions. And a web page, a document a user
uploaded, or a passage from a retrieval index says, in plain text, what the agent should do next — and
the agent, which reads everything on one channel, does it.

The failure this standard is written against is not an attack that breaks in. It is an agent that was
never bounded, holding authority nobody enumerated, taking direction from content nobody authorised to
give it.

Source: item 23 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "agent, and retrieval security" token of the "Prompt, tool, agent, and retrieval
security" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 23 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded
> in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) by listing item 23 under
> `notGovernedElsewhere` — the search for an owner that found none — rather than by a posture entry.
> That review's substantive half is human judgment and carries `humanSignOff: null`. No maintainer
> of any adjacent pack has confirmed it.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it — anything that sends a prompt to a model, retrieves context for one, or acts on a model's output —
that runs an agent execution loop, holds credentials for an agent's use, or supplies retrieved content
to a model.

Three terms, each defined by this standard rather than by the brief:

- An **agent execution loop** is a sequence within one execution in which the output of a model call
  decides whether, and how, a further model call or tool invocation happens. A loop exists whether or
  not a person approves individual steps; approval gates what a step may do, not whether the sequence
  ends. A single model call that returns text, or one call followed by one fixed tool invocation the
  model does not choose to repeat, is not a loop.
- An **agent** is the system component that runs such a loop, together with the tools, credentials,
  instructions and budget it runs with.
- **Retrieved content** is content the system obtains, during or before a model call, from a retrieval
  index, a web page, or a user document — the three sources `agent.retrieved-content-not-instruction`
  names. It is distinguished by where it came from, not by what it says: a retrieved passage that
  happens to be harmless is still retrieved content.

**Where each requirement reaches.** R1 reaches systems that run an agent execution loop. R2 reaches
systems in which an agent holds a credential. R3 and R4 are relocation pointers to [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1 and R2,
which reach every agent and every system that supplies retrieved content to a model. R5 constrains this
framework and reaches no consuming project. A system with none of a requirement's subject may declare that rule
not-applicable under [Standard 2](02-ai-risk-tiering-and-applicability.md) R4, with a reason and a
`revisitWhen` — and the declaration is the only thing that records the subject's absence, because no
detector in this release would contradict a false one (see Validation).

The boundary with this standard's neighbours, none of whose ground is claimed:

- **[Standard 21](21-prompt-and-instruction-security.md)** governs the instruction channel: versioned
  prompts, the threat model recording where untrusted content enters it (R3), and whether an
  interpolated value can acquire instruction authority (R5, `not-evaluable`). Standard 21's Relationship
  section records that [Standard 51](51-agent-and-tool-execution-prohibitions.md) owns retrieved content acquiring instruction authority as a rule of its
  own, which is that standard's R2. The overlap is set out there and is not resolved.
- **[Standard 11](11-autonomy-levels-and-delegated-authority.md)** governs how much authority a system
  holds in general. Its R3 rule compares tools, credentials, scopes and budgets against a declared
  autonomy tier; its R6 rule forbids acquiring authority beyond the tier while running, naming
  "treating retrieved content as instruction" among the ways. R2 here sits beside its R3, and [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1
  and R2 beside its R6; the overlaps are recorded under each.
- **[Standard 45](45-approval-gates.md)** governs whether an individual action is gated, and its R1
  requires the tool permission manifest that R2 here reads. Standard 45's Relationship section names
  this standard as the owner of sandboxing. **No rule in `rules/agent.json` concerns sandboxing, and
  this document states no sandboxing requirement**; see below.
- **[Standard 9](09-misuse-and-abuse-prevention.md)** governs deliberate misuse through interfaces a
  system offers. An agent that is misused while working as designed is Standard 9's case; an agent made
  to act on content that should not have directed it is [Standard 51](51-agent-and-tool-execution-prohibitions.md) R2's.
- **Unwritten items, whose ground is not claimed:** item 10, Human Oversight and Intervention; item 16,
  Access Control for Models, Context, and Tools (who may use a model, read a context or invoke a tool —
  R2 asks only whether an agent's credentials exceed its declared tools); item 22, Tool and
  Function-Call Security (the security of tools themselves, and of their outputs as inputs); item 24,
  Retrieval and Context Supply Chain (where retrieved content comes from and whether it can be
  trusted — [Standard 51](51-agent-and-tool-execution-prohibitions.md) R2 asks only that it never acquire instruction authority); item 35, Red Teaming (how the
  exercise [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1's rule names is run and recorded); item 36, Auditability of AI Actions; item 41, Inference
  Cost and Budget Control (cost and token budgets, which R1's step budget may share a mechanism with);
  and item 51, Agent and Tool Execution Prohibitions, which is written and states the two prohibitions
  this document stated until 2026-10-05 (below).
- **MathematicsStandards** also uses the `agent.` rule-id segment, for `agent.explainable-findings` and
  `agent.refusal-on-invariant`. This repository records those two ids, in
  `artifacts/foreign-namespace-inventory.json` and `artifacts/boundary-review.json`, and nothing about
  their subject. **Neither rule was read for this document, and nothing here restates, relies on, or
  describes their ground.** No full id collides; [Standard 7](07-boundary-with-adjacent-standards.md)
  R4 forbids a colliding full id, not a shared segment.
- **EngineeringStandards' `ai.*` rules**, which Standard 21's Scope describes as governing an agent
  building software rather than prompts inside a product. This standard governs agents that are part of
  an AI system, not an engineering agent working on a repository; the boundary review records no
  adjacency note for item 23 either way.

**Sandboxing is not addressed, and that is a gap rather than a decision.** Standard 45 attributes
sandboxing to this item. The brief does not mention it, the specification's item title does not name
it, and no rule in the shard concerns it. Minting an execution-isolation requirement here would be
authored normative content with no rule, no precedent in the shard and no owner decision behind it.
Whether item 23 should state one, or Standard 45's attribution should change, is recorded in Additions
and not decided here.

**This standard mints no prohibition, and adds no rule.** The specification lists every must-never
requirement as class-A work in Band L, and its Authored items table names item 51, Agent and Tool
Execution Prohibitions, as the negative face of `tool, agent, and retrieval security`. Two rules this
document first stated, `agent.no-self-modification` and `agent.retrieved-content-not-instruction`, are
`forbidden`. They were minted in the Phase 1 shard, and this document stated them as R3 and R4 while it
was undecided whose they were (Q16). **On 2026-10-05 the owner assigned both to [Standard 51](51-agent-and-tool-execution-prohibitions.md)**, which now
states them as its R1 and R2. This document keeps R3 and R4 as relocation pointers, so that R5's number
and every reference to it stay stable. The rules' wording, levels, severities, validation types and
exemptibility did not change; only their `standard` field did, from 23 to 51.

**Risk tier does not grade this standard.** Nothing below becomes lighter at a lower tier: Standard 2
R3 forbids a tier from reducing a rule's level, severity or exemptibility, and allows it only to decide
whether a rule's subject is in scope. **This standard does not restate, extend, or rely on Standard 2
R2, and takes no position on the open question recorded as Q7** in
[`artifacts/project-plan-breakdown/08-open-questions.md`](../artifacts/project-plan-breakdown/08-open-questions.md).
Nothing here depends on how Q7, Q9, Q10, Q11 or Q12 is resolved. Q13, resolved on 2026-09-14,
concerned partial-assurance rules, and none of this standard's rules is one.

## Requirements

### R1 — Bound every agent loop with a step budget

**Every agent execution loop MUST be bounded by a maximum number of steps or tool calls.**

A loop whose only exit is the model deciding it is finished has no exit the system controls. The
characteristic failure is not a model that refuses to stop; it is a plan that cannot succeed — a tool
that keeps returning an error the model keeps retrying, a search that never finds what it was told to
find, two agents each waiting for the other — running at full speed until something outside the loop
fails. The rule's rationale names both halves of the cost: the bill and the blast radius arrive
together.

**A budget is a number of steps or tool calls.** That is what the rule's description names, and this
standard reads it literally. A wall-clock timeout or a token or cost ceiling may stop a loop too, and a
system may have them; on its own neither meets R1, because a loop of cheap, fast steps can take a
great many actions inside either. Cost ceilings are item 41's subject and are not claimed.

**A budget comes with a defined behaviour on exhaustion.** The rule's remediation asks for it, and this
standard reads it as part of meeting R1: when the budget runs out, what the loop does — stop and report,
hand to a person, return a partial result marked as partial — is stated in code or configuration, not
left to whatever the surrounding code happens to do with an exception. A budget whose exhaustion
silently restarts the loop is not a bound.

**Every loop, not only the outermost one.** An agent that spawns sub-agents, or retries its own
execution from the top, runs more than one loop; the description says every loop is bounded, and each
is. R1 does not require a single aggregate budget across nested loops, and this standard does not add
one; an aggregate limit is where item 41's budgets would sit.

A budget the agent can raise during execution is not a bound on it. That case is [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1's, whose
rule names the step budget among the things an agent must not rewrite.

Rule `agent.step-budget-bounded`.

### R2 — Scope an agent's credentials to the tools it declares

**The credentials an agent holds MUST grant no more than the tools its permission manifest declares.**

Credentials are issued for convenience and scoped for the first use case. A token created so an agent
could read issues in one project is created with the scope the issuing console offered first, which is
frequently write access to every project the issuer can see. The agent's tool list says it reads
issues. Its credential says it can do much more, and — as the rule's rationale puts it — a capability
nobody enumerated is a capability nobody gated.

**The comparison is between two lists: what the credentials permit, and what the declared tools
need.** The permission manifest is the tool permission manifest [Standard 45](45-approval-gates.md) R1
requires, whose shape `schemas/tool-permissions.schema.json` defines. A credential grant exceeding what
every declared tool together requires fails R2, even if no tool ever exercises the excess.

**"Holds" is read as "can use".** A credential is held by an agent if it is available in the agent's
execution environment or used by a tool on the agent's behalf when the agent invokes it. A credential a
tool's implementation uses internally still grants the agent whatever that tool can be made to do with
it, so it is counted.

**Neither schema can record the comparison.** `schemas/tool-permissions.schema.json` gives each tool a
`name`, an `impact` class, an optional `requiresApproval` flag and an optional `scope` string whose
meaning the schema does not define; nothing in it names a credential. `schemas/ai-system-manifest.schema.json`
has no field for credentials either. The evidence for R2 is therefore a committed record of the
review the rule's remediation asks for, and the credential grants themselves, which frequently live in
deployment configuration or a secrets manager outside the repository.

**R2 overlaps [Standard 11](11-autonomy-levels-and-delegated-authority.md) R3.**
`oversight.authority-matches-tier` requires the tools, credentials, scopes and budgets a system holds to
be consistent with its declared autonomy tier. The two compare credentials against different things —
the tier there, the declared tools here — and share their evidence. A system can meet either and fail
the other: a narrowly scoped credential for an `execute` tool declared by a `propose` system meets R2
and fails Standard 11 R3. Who may use a model, context or tool at all is item 16's subject.

Rule `agent.least-privilege-declared`.

### R3 — Moved to Standard 51 R1

**This requirement is now stated by [Standard 51](51-agent-and-tool-execution-prohibitions.md) as its R1:** an agent MUST NOT rewrite its own system prompt,
tool permissions or step budget during execution. Its text, readings and overlaps moved with it and are
not repeated here, because two statements of one prohibition would be two things to keep in step.

Rule `agent.no-self-modification` now cites standard 51. It is `forbidden` and `not-evaluable`, as
before.

### R4 — Moved to Standard 51 R2

**This requirement is now stated by [Standard 51](51-agent-and-tool-execution-prohibitions.md) as its R2:** content fetched from a retrieval index, a web page
or a user document MUST NOT be treated as instruction. Its text, the two-halves account, the three named
sources and the overlaps with Standard 21 and Standard 11 moved with it.

Rule `agent.retrieved-content-not-instruction` now cites standard 51. It is `forbidden`,
`code-analysis` and non-exemptible, as before. **This standard still defines retrieved content** (see
Scope), and [Standard 51](51-agent-and-tool-execution-prohibitions.md) uses that definition.

### R5 — No component of this framework may report an agent bounded, scoped, unmodified or uninjectable from inspection alone

**No detector, heuristic, or audit finding in this framework MAY report an agent loop as bounded, an
agent's credentials as scoped, an agent as unable to modify itself, or retrieved content as unable to
direct an agent, on the basis of a document's or configuration value's presence, a search that found
nothing, or the absence of a code path; and no result for any rule this standard states, or for the two
rules [Standard 51](51-agent-and-tool-execution-prohibitions.md) states, MAY be presented as evidence that a running agent behaves safely.**

Every check that could be written for this standard's subject looks at code and configuration: a loop
with a counter in it, a credential with a scope string, a prompt builder that puts retrieved text in a
separate message. Each of those is real evidence about how the system was built, and none of them is
evidence about what the running agent does. A counter can be reset by the code around it; a scope
string can describe a credential the deployment does not use; a correctly isolated passage can still
be obeyed. An agent loop's safety cannot be established by static inspection alone, and a report that
said otherwise would be the framework asserting a runtime property it never observed.

This constrains how any future detector's result is presented, not which result value it reports. A clean
result from a check that covers less than its rule reports `skipped` / `not-evaluated`, never `passed`
([Standard 5](05-verdict-vocabulary.md) R6; Q13, resolved 2026-09-14), and R5 applies whatever value a
future check reports.

**This requirement concerns what a check may claim. It is not a restatement of Standard 2 R2**,
neither narrows nor extends it, and has no bearing on Q7.

There is no rule for R5. It constrains this framework's own implementation rather than a consuming
project, and a project cannot fail it. **It continues to reach `agent.no-self-modification` and
`agent.retrieved-content-not-instruction`, which [Standard 51](51-agent-and-tool-execution-prohibitions.md) now states**; moving those rules did not move
this constraint, and [Standard 51](51-agent-and-tool-execution-prohibitions.md) does not restate it. It is enforced by construction and by review of this
repository, which is named as the weaker mechanism it is in Implementation.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| The loop with no exit | An agent loops `while` the model has not said it is done; a tool error it keeps retrying runs it for hours | R1 |
| A timeout mistaken for a budget | A loop is bounded only by a ten-minute timeout, inside which it makes thousands of tool calls | R1 |
| Exhaustion undefined | A step counter throws when it is exceeded, and a retry wrapper around the agent catches the exception and starts again | R1 |
| The unbounded sub-agent | The outer loop has a budget; each sub-agent it spawns runs without one | R1 |
| The console's default scope | A token issued for one read tool carries organisation-wide write access | R2 |
| The tool's own credential | A tool's implementation holds an administrator key, and the agent can direct that tool at any resource | R2 |
| Scope recorded, grant broader | `tool-permissions.yml` gives a tool a narrow `scope` string; the credential deployed for it is not narrow | R2 — **not caught**; neither schema records a credential |
| The budget the agent raises | A step budget read from a configuration file the agent can write | R1, and [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1 |
| Isolation read as immunity | Retrieved content is correctly separated, and a report treats that as proof of injection resistance | R5, and [Standard 51](51-agent-and-tool-execution-prohibitions.md) R2 |
| A false not-applicable that nothing contradicts | A policy declares R1's rule not-applicable for a system that loops, and the result is quietly `skipped` | **Not caught**; see Validation |
| A clean scan read as safety | A future check finds a step counter and a report says the agent is bounded | R5 |

The failure modes of the two moved requirements — the prompt file within reach, memory that becomes
instruction, retrieved text in the system position, the instruction in the page — are [Standard 51](51-agent-and-tool-execution-prohibitions.md)'s.

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | Each agent loop, its step or tool-call budget, where the budget is set, and the behaviour on exhaustion | Code and configuration; the budget value may be set in deployment configuration | Code review. No manifest field declares a budget: besides its `$scaffold` marker, `schemas/ai-system-manifest.schema.json` has fields for system, models, prompts, tools, data sources and evaluation, and nothing for loops or budgets |
| R2 | The declared tools; every credential the agent can use, with its grants; and a record of the review comparing the two | `tool-permissions.yml` for the tools; the credential grants frequently in deployment configuration or a secrets manager outside the repository; the review record committed | Human review, by someone with access to the grants. **No schema field records a credential or its scope** |
| R5 | The detectors bound to this standard's rules — there are none — and the messages the verdict reports for them | `EVALUATED_RULES` in `scripts/standards.mjs`; `evaluateRule()` in `scripts/compliance.mjs` | Code review |

The evidence for the moved requirements, R3 and R4, is stated by [Standard 51](51-agent-and-tool-execution-prohibitions.md).

The gap worth naming: **the evidence for R2 is mostly outside the repository, and R1's is code review of
loops no manifest field declares.** Every item of evidence above is located and read by a human, and by
nothing else in this release.

## Validation, severity, and exemptibility

<!-- BEGIN GENERATED FROM rules/agent.json — DO NOT EDIT. Verified by test/standards-tables.test.mjs. -->

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R1 | `agent.step-budget-bounded` | required | error | code-analysis | yes |
| R2 | `agent.least-privilege-declared` | required | error | manual-review | yes |

<!-- END GENERATED -->

**R5 has no rule, and this is deliberate.** It constrains this framework rather than a consuming
project; a project cannot violate it, and a rule nobody can fail would enlarge the catalog without
adding a check.

**Every rule above keeps its Phase 1 identity unchanged.** Both were minted with `introducedIn`
`0.1.0`, cite standard 23, and declare assurance `none`. This document states them; it does not
re-mint, re-level or re-type either, and it adds no rule to `rules/agent.json`. The shard's other two
rules, `agent.no-self-modification` and `agent.retrieved-content-not-instruction`, cite standard 51 and
are stated by [Standard 51](51-agent-and-tool-execution-prohibitions.md); this table lists only the rules that cite standard 23.

**No detector examines either.** Neither is in `EVALUATED_RULES` in `scripts/standards.mjs`, which
lists nine rule ids. What each reports follows from `evaluateRule()` in `scripts/compliance.mjs`:

- **R1's rule** is `code-analysis` and outside the list, so it reports `skipped` with disposition
  `not-evaluated` and the message "No detector in this release examines this rule." Its distinction is
  `not-evaluated`.
- **R2's rule** is `manual-review` and outside the list, so it reports `skipped` / `not-evaluated` with
  the message "Requires human review. No automated check can establish this." Its distinction is
  `not-evaluated`.

R1's and R2's rules, while applicable, each keep the status from `COMPLIANT`.

That was observed rather than inferred, in uncommitted runs of `node scripts/standards.mjs validate
--json` made while this document stated four rules. Against a throwaway copy of
`test/fixtures/valid-manifest/`, whose policy mentions no `agent.` rule, all four were applicable at
their catalog levels and reported as above for R1's and R2's rules, and as [Standard 51](51-agent-and-tool-execution-prohibitions.md) records for the other
two. Against this repository, all four report `skipped` / `not-applicable`, because `ai-policy.yml`
declares each not-applicable with a reason and a `revisitWhen`. Reassigning two rules to [Standard 51](51-agent-and-tool-execution-prohibitions.md) did not
change what any of them reports, because `evaluateRule()`, `distinction()` and `evaluate()` do not read
a rule's `standard` field; the one visible change is that those two rules' entries in `validate --json`
carry `standardRef` 51 where they carried 23.

**A false not-applicable declaration for either of these rules is never contradicted.**
`checkApplicabilityContradictions()` in `scripts/standards.mjs` blocks the verdict only when a detector
has observed a violation of a rule the policy declares not-applicable. No detector observes either
rule, so a policy declaring R1's rule not-applicable for a system that runs an unbounded loop reports
`skipped` / `not-applicable` and nothing else. The declaration's `reason` and `revisitWhen`, and the
human who reads them, are the only check.

**R1 is `code-analysis`, and in this release that names the kind of check intended, not a check that
exists.** It is a question about control flow — whether every loop a model's output drives has a
counted exit. It needs analysis across call sites, and a loop assembled at runtime from configuration
can be invisible to it. The data-flow check that
`agent.retrieved-content-not-instruction` would need is [Standard 51](51-agent-and-tool-execution-prohibitions.md) R2's.

**R2 is `manual-review`.** The comparison it asks for needs the credential grants, which are frequently
outside the repository, and no schema has a field in which a project could declare them. Under
`checkRule()` in `scripts/catalog.mjs` a `manual-review` rule is attestable by default; the attestation
mechanism is Phase 4 and absent.

**R3's former rule is now [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1's**, and its `not-evaluable` type, the line between `not-evaluable` and
`manual-review`, and the absence of any rule examining the exercise record its note names are
discussed there.

**Neither R1's nor R2's rule is `nonExemptible`**, and **the shard records no note saying why**. This
document does not supply a reason as though one had been recorded. The one `nonExemptible` rule in
the shard, `agent.retrieved-content-not-instruction`, is [Standard 51](51-agent-and-tool-execution-prohibitions.md) R2's, and its `$exemptibilityNote`
gives its reason there.

**The four rules in `rules/agent.json` sit in `agent.`**, one of the seventeen namespaces reserved in
`NAMESPACES` in `scripts/catalog.mjs`, and one of the six segments `SHARED_SEGMENTS` there records as also
used by another pack — MathematicsStandards, whose `agent.explainable-findings` and
`agent.refusal-on-invariant` are recorded in `artifacts/foreign-namespace-inventory.json`. No full id
collides, which `test/namespace.test.mjs` asserts against that inventory.

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control | Status in this release |
| --- | --- | --- | --- | --- |
| R1 | Code review of every agent loop | A loop whose continuation is decided by model output with no maximum number of steps or tool calls; a budget whose exhaustion restarts the loop; a sub-agent loop with no budget | A single model call with one fixed tool invocation is out of scope, not failing; a budget read from configuration must **not** be reported missing because no literal sits at the loop | **No detector.** No mechanical falsifier |
| R2 | Human review of the credential grants against the tool permission manifest | A credential the agent can use that permits an operation no declared tool requires | A credential scoped exactly to the declared tools must **not** be reported for being broad-sounding; a system whose agent holds no credential is out of scope, not failing | **No detector.** No mechanical falsifier |
| R5 | No rule in `rules/agent.json` is in `EVALUATED_RULES` | A detector reporting an agent bounded, scoped, unmodifiable or injection-resistant from presence, absence or a clean search; any output presenting a result here as evidence of safe runtime behaviour | The current `skipped` / `not-evaluated` messages for these rules are **not** violations: they report that nobody looked | **Enforced by construction** — no detector reads this standard's subject |

**No requirement in this standard has a mechanical falsifier in this release.** R1 and R2 are stated
with falsifiers a human can apply, and nothing in the suite applies either. R5's footing is the absence
of code, not a test that fails. The falsifiers of the two moved requirements are [Standard 51](51-agent-and-tool-execution-prohibitions.md)'s.

What the existing suite does touch, stated precisely because it is less than it may look:

- **No test asserts a result for any of this shard's rules by id, with one exception that is not about
  this standard.** `test/validate.test.mjs` uses `agent.step-budget-bounded` as the example of a rule a
  fixture policy never mentions, and asserts only that it still appears in the results.
- **`test/namespace.test.mjs` asserts that no `agent.` id collides** with a recorded foreign id,
  including MathematicsStandards' two.
- **`test/distinction.test.mjs` asserts the derivation** that turns a `forbidden` rule nobody examined
  into `prohibited-but-unestablished`. It is general, and names no rule from this standard.
- **`test/standard-51-assignment.test.mjs` asserts the reassignment**: that the two moved rules cite
  standard 51 and not 23, and that this document's table lists exactly the two that remain.
- **No fixture under `test/fixtures/` declares any `agent.` rule in its policy.**

Once this document is in `standards/`, `test/standards-tables.test.mjs` asserts that the generated
table above matches `rules/agent.json` in both directions, and `node scripts/sync-rule-tables.mjs
--check` fails on any drift. Neither says anything about agents.

## Exceptions and staleness

The exception mechanism is item 4's subject and is Phase 4 work; item 4 is unwritten.
`schemas/ai-policy.schema.json` is closed and has no `exceptions` or `attestations` property, and
`test/no-phase-creep.test.mjs` asserts both are absent. **In this release an exception to any rule
above cannot be recorded**, so none is exemptible in practice whatever the table says. A project's
honest options are to meet a rule, to declare its subject absent with a reason and a `revisitWhen`, or
to leave it unmet.

The exceptions the mechanism will take for the two moved rules, one of them non-exemptible and one of
them never attestable, are described by [Standard 51](51-agent-and-tool-execution-prohibitions.md).

When the mechanism exists, an exception to R1 or R2 records a known, approved gap — an unbounded loop or
an over-broad credential — with an approver and a date. It does not bound the loop or narrow the
credential, and it is not a control Standard 9 R1 or Standard 45 can name.

**Staleness is conditional, not scheduled**, following Standard 2 R5. The evidence for R1 and R2
describes a system's loops and credentials, and it stops holding when they change:

- A tool is added to an agent, or an existing tool gains the ability to write files, configuration or
  memory that is loaded back into the agent — which also changes what [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1 is exposed to
- A credential is issued, rotated to a different grant, or broadened, or a tool's implementation starts
  using one on the agent's behalf
- A loop is added or restructured: sub-agents, retries, a planner calling an executor, a budget moved to
  configuration

The staleness triggers for retrieval sources, prompt assembly and model identifiers belong to the moved
R4 and are [Standard 51](51-agent-and-tool-execution-prohibitions.md)'s.

**The staleness risk is asymmetric.** Tools and credentials are added by people
extending what an agent can do, which is the moment nobody is thinking about what else it can now do.
Nothing in this release detects any of these transitions.

## Additions this standard makes beyond the source

The brief contributes one word to this item: **`agent`**, as the third modifier of "Prompt, tool, agent,
and retrieval security". The specification records the item's token as `agent, and retrieval
security`, which is the longest tail of the bullet beginning at that modifier — a tokenisation
convention the specification states for bullet 4, not a claim that this item owns retrieval security;
item 24 derives from `retrieval security`. The brief names agent security as an area to cover. It does
not mention loops, steps, budgets, credentials, least privilege, permission manifests, self-modification,
retrieval indexes, web pages, user documents, instruction authority or sandboxing; its one other use of
"agent" is in "agent instructions", a template it asks for, which is not a security requirement. The title "Agent
Execution Security" is the specification's item title, derived from that token; it is not the brief's
wording. Everything normative here is authored, and none of it has owner approval:

- **The two rules this document states.** Their existence, wording, levels, severities, validation
  types, exemptibility and placement under standard 23 were authored in the Phase 1 shard, not taken from
  the brief. This document states them as recorded and changes neither. The other two rules this
  document used to state moved to [Standard 51](51-agent-and-tool-execution-prohibitions.md) by an owner decision on 2026-10-05 (backlog item ST-42, issue
  #87); the readings that went with them moved too, and are disclosed there.
- **The definitions** of an agent execution loop, an agent and retrieved content, including the rulings
  that a loop exists whether or not steps are approved and that a single call with one fixed tool
  invocation is not a loop.
- **The per-requirement scope decisions**: which systems R1 and R2 reach. The scope decisions for the
  two moved requirements are [Standard 51](51-agent-and-tool-execution-prohibitions.md)'s.
- **R1's readings**: that a budget is a count of steps or tool calls and a time or cost limit alone does
  not meet it; that a defined behaviour on exhaustion, taken from the rule's remediation, is part of
  meeting R1; that every nested loop needs its own budget; and that no aggregate budget is required.
- **R2's readings**: that the permission manifest is Standard 45 R1's tool permission manifest; that
  "holds" means "can use", including credentials a tool uses on the agent's behalf; and that the
  comparison is against what the declared tools together require.
- **R5 in full**, its statement that an agent loop's safety cannot be established by static inspection
  alone, and its explicit separation from Standard 2 R2, Q7 and Q13.
- **The boundary decisions**: that the ground of items 10, 16, 22, 24, 35, 36 and 41 is not claimed;
  that MathematicsStandards' two `agent.` rules were not read and are not described; that the overlap
  of R2 with Standard 11 R3 is recorded rather than resolved. The overlaps of the moved requirements
  with Standard 11 R6 and Standard 21 R3 and R5 are [Standard 51](51-agent-and-tool-execution-prohibitions.md)'s.
- **The decision not to state a sandboxing requirement**, although Standard 45 names this item as
  sandboxing's owner, and the recording of that as a gap.
- **Open questions recorded and not resolved**, each of which changes a rule's `standard` field, a
  rule's validation type, a specification row or another standard's text, and so is a catalog-identity
  or cross-standard decision rather than this document's: whether item 23 should state a sandboxing
  requirement or Standard 45's attribution should change. This is Q17 in
  `artifacts/project-plan-breakdown/08-open-questions.md`. Q16 (whether the two `forbidden` rules are
  item 51's) was answered by the owner on 2026-10-05, and the standard-field half of Q15 with it; what
  remains of Q15 and Q18 concerns the moved rule and is recorded against [Standard 51](51-agent-and-tool-execution-prohibitions.md).
- **The decision not to grade these requirements by risk tier**, on the basis of Standard 2 R3.
- **The admission that no requirement has a mechanical falsifier**, that a false not-applicable
  declaration for any of this shard's rules is never contradicted, and that no rule examines the exercise
  record the moved R3's note names — the per-rule results observed by uncommitted runs rather than
  asserted by the suite.

## Relationship to other standards and ADRs

[Standard 1](01-ai-system-manifest.md) draws the scope this standard applies within. Its manifest
schema declares the tools an agent may invoke; it has no field for a loop, a step budget, a credential
or a retrieval path, so none of the evidence for R1 or R2, or for [Standard 51](51-agent-and-tool-execution-prohibitions.md)'s requirements, can be located from it.

[Standard 2](02-ai-risk-tiering-and-applicability.md) is relied on for its R3 rule that a tier narrows
scope and never lowers a requirement, its R4 dispositions — which are why "no agent loop here" must be a
reasoned declaration — and its R5 conditional expiry. **This standard does not change Standard 2**: it
does not restate or rely on R2, and does not propagate R2's word "propose", pending Q7.

[Standard 5](05-verdict-vocabulary.md) defines `not-evaluated` and `prohibited-but-unestablished`. Its
R5 is why R1's and R2's rules keep a status from `COMPLIANT`; its R4 and R8 account for the two moved
rules, which [Standard 51](51-agent-and-tool-execution-prohibitions.md) describes. [Standard 6](06-standard-structure-and-rule-identity.md)
R3 is why every requirement here states a falsifier or is declared not-evaluable, R5 is why the shared
`agent.` segment is declared rather than assumed exclusive, and R8 is why R2's rule is attestable by
default. [Standard 7](07-boundary-with-adjacent-standards.md) R1 records "Prompt,
tool, agent and retrieval security" as owned by this pack with no existing owner, which is the division
the `notGovernedElsewhere` record for this item evidences; its R4 governs the shared segment.

[Standard 9](09-misuse-and-abuse-prevention.md) governs deliberate misuse of a system working as
designed. An agent directed by retrieved content is [Standard 51](51-agent-and-tool-execution-prohibitions.md) R2's case; the same agent used by its own operator
for harm is Standard 9's.

[Standard 11](11-autonomy-levels-and-delegated-authority.md) is the nearest sibling. **11 governs how
much authority a system is granted and whether it stays inside the grant; 23 governs two specific
bounds on an agent — steps, and credentials against declared tools.** Its R3 overlaps R2 here, as set
out under it. Its R6 overlaps [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1 and R2. None is reconciled.

[Standard 21](21-prompt-and-instruction-security.md) governs the instruction channel. Its Relationship
section names [Standard 51](51-agent-and-tool-execution-prohibitions.md) as the owner of retrieved content acquiring instruction authority, which is that
standard's R2. It named this standard until 2026-10-05; the owner assigned the rule to 51 on that date.
**21 governs whether any value can acquire instruction authority; 51 R2 governs retrieved content
specifically.** The two are not reconciled, and [Standard 51](51-agent-and-tool-execution-prohibitions.md) sets out the overlap.

[Standard 45](45-approval-gates.md) R1 requires the tool permission manifest R2 compares credentials
against, and R5's `gate.no-self-approval` is adjacent to [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1. Its Relationship section names this
standard as the owner of sandboxing, which this document does not address; see Scope.

Unwritten items this standard defers to, by specification number: item 4 (exceptions); item 10 (the
general oversight obligation); item 16 (who may use a model, context or tool); item 22 (tool security,
and whether tool output other than fetched content is within [Standard 51](51-agent-and-tool-execution-prohibitions.md) R2); item 24 (retrieval supply
chain); item 35 (the exercise [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1's rule names); item 36 (the record of what an
agent did); and item 41 (cost and token budgets, and any aggregate budget across nested loops). Item 51, the
prohibitions on bullet 4's ground, is written: [Standard 51](51-agent-and-tool-execution-prohibitions.md) states the two `forbidden` rules this document
stated until 2026-10-05.

Outside this repository: **MathematicsStandards** uses the `agent.` segment for
`agent.explainable-findings` and `agent.refusal-on-invariant`. Neither was read for this document, and
nothing here restates either. **EngineeringStandards'** `ai.*` rules, which Standard 21 describes as
governing an agent building software, are not claimed and are not crosswalked.

No ADR covers this standard. `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. No requirement has a detector. R5's one mechanical guarantee is an absence.**

Stated as separate lists so that a proposal is not read as a capability.

**Implemented today.** (The mechanisms for the two moved rules are listed by [Standard 51](51-agent-and-tool-execution-prohibitions.md).)

| Mechanism | What it does | Where |
| --- | --- | --- |
| Reporting of unexamined rules | R1's and R2's rules report `skipped` / `not-evaluated`, never `passed`, and keep an applicable project from `COMPLIANT` | `evaluateRule()` and `evaluate()` in `scripts/compliance.mjs` |
| Applicability declarations | A rule declared not-applicable with a reason reports `skipped` / `not-applicable` | `applyPolicy()` in `scripts/policy.mjs`; `evaluateRule()` in `scripts/compliance.mjs` |
| Tool permission manifest shape | Validates each declared tool's `name`, `impact`, `requiresApproval` and `scope` as types, for Standard 45's rules; records no credential | `schemas/tool-permissions.schema.json`, through `gate.actions-classified` |
| Catalog invariants | Refuse a malformed rule; default R2's `manual-review` rule to attestable | `checkRule()` in `scripts/catalog.mjs` |
| Namespace and collision checks | Reserve `agent.`, record it as shared with MathematicsStandards, and refuse a colliding full id | `NAMESPACES` and `SHARED_SEGMENTS` in `scripts/catalog.mjs`; `test/namespace.test.mjs` |
| Generated-table verification | Asserts the Validation table and `rules/agent.json` agree in both directions | `scripts/sync-rule-tables.mjs --check`; `test/standards-tables.test.mjs` |
| R5 by construction | `EVALUATED_RULES` lists nine rule ids, none in `agent.`, and no detector reads agent loops, credential grants, prompt assembly or retrieval paths | `EVALUATED_RULES` in `scripts/standards.mjs` |

Every row above is a general mechanism, not work done for this standard.

**What nothing in this release does.** No script identifies an agent loop, reads a step budget, reads a
credential or its grants, or follows retrieved content into a model request. The audit's
`detectToolDefinitions` in `scripts/standards.mjs` lists the tools a manifest declares as a surface
observation and binds it to no rule of this standard; `detectToolPermissions` reads
`tool-permissions.yml` for Standard 45's rules only. And because no detector observes an `agent.` rule,
`checkApplicabilityContradictions()` in `scripts/standards.mjs` can never block on a false not-applicable
declaration for one.

**Proposed, and deliberately absent from this release.**

| Proposed | Why it is not here |
| --- | --- |
| A control-flow check that every loop driven by model output has a counted exit, for R1's rule | Phase 3 detector work; `artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` §8 puts detectors beyond the nine in `EVALUATED_RULES` out of scope for this phase. Agent frameworks express loops in library calls and configuration as often as in `while` statements, so a clean result would describe the loops the check recognised. R5 governs how any result is presented |
| A field declaring credentials and their grants, in the tool permission manifest or the manifest, so that R2's comparison has somewhere to be recorded | A schema change alters what a conformant consuming project may declare. It is a schema-versioning decision, not a side effect of writing this document, and the grants would still usually live outside the repository |
| A field declaring each agent loop's step budget | The same schema-versioning decision. A declared budget would be a claim about the code, not evidence of it |
| Withdrawal of a not-applicable declaration when an agent detector observes the subject | Follows automatically from `checkApplicabilityContradictions()` once any detector above exists; nothing to build for this standard alone |

**What no future release will implement.** A detector or report that states an agent loop is bounded,
an agent's credentials are scoped, an agent cannot modify itself, or retrieved content cannot direct an
agent, from the presence of a counter, a scope string, a document or a separated message, or from a
search that found nothing. R5 forecloses it, and [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1 and R2 explain why the evidence that
would be needed is not in a repository.

**R5 is enforced by review of this repository, which is weaker than a test.** Nothing prevents a future
contributor from rendering a clean result for R1's rule as "agent loops bounded", or [Standard 51](51-agent-and-tool-execution-prohibitions.md) R2's as "injection
resistant"; what stands in the way is this document, the `EVALUATED_RULES` list, and whoever reads the
diff.
