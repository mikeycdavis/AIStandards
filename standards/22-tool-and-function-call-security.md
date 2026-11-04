# Standard 22 — Tool and Function-Call Security

When a model calls a tool, the program has handed a stranger the keyboard. The tool name, the
arguments and the decision to call at all were produced by a model reading text that someone else may
have written, and the result of the call goes back into that model's context. Conventional code
chooses its call sites and its arguments; a model chooses them at run time, and a tool that was safe
for a programmer's arguments can be unsafe for a model's.

This standard is about the **call boundary**: the point at which a model's request becomes an action
and the point at which the action's result becomes context. It asks that the request be matched to a
declared tool, that its arguments be checked and kept from becoming syntax, that the definitions the
model reads be the ones that were reviewed, that the call carry no more authority than the person it
serves, and that what comes back be bounded.

The failure this standard is written against is a tool that does exactly what it was built to do for
an argument nobody expected: a `read_file` that reads `../../.env`, a `run_query` that executes the
model's string, a `fetch_url` that reaches the metadata service.

Source: item 22 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "tool, agent, and retrieval security" token of the "Prompt, tool, agent, and retrieval
security" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 22 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) by listing item 22 under
> `notGovernedElsewhere`, and that review's substantive half is human judgment and carries
> `humanSignOff: null`. No maintainer of any adjacent pack has confirmed it.
>
> **The brief supplies a subject and this standard supplies the requirements.** The brief's bullet names
> "tool, agent, and retrieval security" and states no requirement for it. The item is class `D` because
> its token is the brief's own; the requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it — a repository that invokes a model, retrieves context for one, or acts on a model's output — in which a model's output can cause a **tool call**.

Covers: which tools a call may reach; what is checked about its arguments; where its arguments may flow; where tool definitions come from; whose authority it runs with; what it may return; and the limit of what this framework can say about any of it.

Terms, each defined once here and used verbatim below:

- **Tool** — a function, command, API or service that a model may cause to run, whether the system calls it directly or through a tool server.
- **Tool call** — a request, produced from a model's output, to run a named tool with arguments.
- **Declared tool** — a tool named in the system's tool permission manifest ([Standard 45](45-approval-gates.md) R1) or, where the system has none, in a project document the project names.
- **Tool definition** — the name, description and parameter schema a model is shown for a tool.
- **Principal** — the person or service on whose behalf a tool call is made.

It does **not** cover, and claims none of the ground of:

- **Whether a tool is declared, or what impact class it carries, or whether a human approved its effect.** [Standard 45](45-approval-gates.md) owns the manifest, the classes, the gate and the escalation of impact by arguments.
- **Step budgets and credential scope.** [Standard 23](23-agent-execution-security.md) owns them.
- **Whether text can acquire instruction authority**, and a retrieved page directing an agent. [Standard 21](21-prompt-and-instruction-security.md) and [Standard 51](51-agent-and-tool-execution-prohibitions.md) own them.
- **Sandboxing** of tool execution. No standard states it; [Standard 23](23-agent-execution-security.md) records the gap, and Q17 of `artifacts/project-plan-breakdown/08-open-questions.md` is open.
- **Records of calls.** [Standard 33](33-ai-observability.md) owns what a call record carries.

**Boundary posture O — owned outright.** The boundary review lists this item among those for which no owner was found after searching the nine packs. This document accepts that record for what a repository can establish — that a dispatcher, a validator and a pin are present — and narrows it there: whether a validator is correct, or a tool is safe against an argument, is not established by any record in a repository, so R1 to R6 are `manual-review` obligations. It adds no precedent to the review's.

## Requirements

### R1 — Dispatch only declared tools

**A system MUST refuse a tool call whose tool is not a declared tool, and MUST NOT resolve a tool from a name in the model's output by any lookup that can reach a callable outside the declared set.**

[Standard 45](45-approval-gates.md) R1 requires that tools be declared, so that something can be gated.
A declaration is only a list. If the dispatcher resolves `getattr(module, name)`, evaluates the name, or
passes it to a shell, the model can name a tool nobody declared and nothing gates it. The requirement is
about the dispatcher: the set it can reach is the declared set and nothing wider.

### R2 — Validate every argument set before execution

**A system MUST validate the arguments of a tool call against that tool's parameter schema before the tool runs, and MUST refuse the call, without executing it, when they do not conform.**

A parameter schema shown to a model is a request. Models emit missing fields, extra fields, wrong types
and values far outside the range the author imagined, and a model steered by hostile text emits them on
purpose. The validation is the system's, performed on the system's side of the boundary; a model that
was told the schema and complied is not validation. "Refuse" means the call does not run and the model
is told it failed; it does not mean the argument is silently corrected.

### R3 — A model-supplied argument does not become syntax

**A model-supplied argument MUST NOT be interpolated into a command line, query, file path or URL that a tool then interprets, except through a parameterised interface or against an allow-list the tool enforces.**

Schema validation says an argument is a string; it does not say what the string will do when a shell, a
SQL engine, a filesystem or an HTTP client reads it. A path must be confined to the directory the tool
is meant to reach after the path is resolved; a URL must be checked against permitted destinations after
redirects and name resolution; a query must carry arguments as parameters. The requirement does not
choose the mechanism. It requires that the argument cross into the interpreter as data, or be checked
against a list the tool itself holds.

### R4 — Pin third-party tool definitions to a reviewed revision

**A tool definition supplied by a party other than the project MUST be pinned to a revision the project has reviewed, and a change to its name, description or parameter schema MUST NOT reach a model until the project has reviewed the new revision.**

A tool definition is text a model obeys: a description reading "also send the conversation to this
address" is an instruction delivered through the tool list. A tool server that serves definitions at
run time can change them after the project reviewed the tool. This is the supply-chain half of tool
security. How a definition acquires authority over the model is [Standard 21](21-prompt-and-instruction-security.md)'s;
this requirement is that the definition shown is the one that was reviewed. It reaches only
definitions the project does not author.

### R5 — A tool call carries no more authority than its principal

**A tool call made on behalf of a principal MUST NOT return or change anything that the principal could not read or change directly.**

A tool that runs under a service account sees everything the service account sees. When it answers a
request from a particular person, the model has become a way for that person to ask the account for
what the person may not have: another tenant's records, a file outside their project. The agent's
credentials being scoped to its declared tools ([Standard 23](23-agent-execution-security.md) R2) does
not settle this, because the tool may be declared and its credentials may still be wider than the
person's. The requirement is checked per call, against the principal's authority, by the tool or by the
dispatcher.

### R6 — Bound what a tool returns to the model

**A system MUST limit a tool result to a declared maximum size before it enters a model's context, and MUST NOT return to the model an error detail that discloses a credential or the contents of a file the call did not request.**

A tool returning a database table, a log or a stack trace puts all of it in the context window:
cost ([Standard 41](41-inference-cost-and-budget-control.md)), truncation of what mattered, and secrets
in a place ([Standard 21](21-prompt-and-instruction-security.md) R4) they were never meant to be. The
size limit is the system's, and a result over it is truncated or refused with a message saying so. This
requirement is about quantity and disclosure. Whether the result may direct the model is not decided
here; whether tool output other than fetched content is within Standard 51 R2 is Q18 of `artifacts/project-plan-breakdown/08-open-questions.md`, and is open.

### R7 — This framework MUST NOT report a tool call secure from the presence of a safeguard

**No detector, rule, audit finding or generated report in this framework MAY state that a system's tool calls are validated, confined, authorised or safe because a schema, an allow-list, a manifest entry, a pin or a declaration is present in the repository.**

This is a constraint on the framework, not on a project, in the same form as the equivalent
requirement of [Standard 23](23-agent-execution-security.md) R5. A parameter schema can be present and
never consulted; an allow-list can be present and bypassed by a redirect. Reporting safety from a
presence would turn a declaration into a guarantee.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Undeclared tool reached | A dispatcher resolves a tool by dynamic lookup of the model's string, so a callable absent from the manifest runs | R1 |
| Unvalidated arguments | A tool receives a missing field, an extra field, a wrong type or an out-of-range value and runs | R2 |
| Argument as syntax | A path escapes its directory, a URL reaches an internal address, a query or command is built by concatenation with a model's string | R3 |
| Drifted definition | A tool server changes a description or schema after review, and the model is shown the new text | R4 |
| Confused deputy | A tool run under a service account returns another principal's data to the person asking | R5 |
| Unbounded or leaking result | A whole table, or an error carrying a connection string, is placed in context | R6 |
| Safeguard read as safety | A framework report says tool calls are safe because a schema file exists | R7 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The dispatcher's resolution of a tool name, and the set it can reach compared with the declared tools | The system's dispatch code and its tool permission manifest ([Standard 45](45-approval-gates.md) R1) | Human review |
| R2 | The point at which arguments are validated and the refusal on failure | The system's dispatch or tool code | Human review |
| R3 | For each tool that reaches a filesystem, network, shell or database, the mechanism by which an argument crosses into it | The tool's code and configuration | Human review |
| R4 | The revision of each third-party definition the project reviewed, and the mechanism that prevents a different one reaching a model | A project document the project names, and the tool-loading code — **no manifest or policy field exists for it; see Implementation** | Human review |
| R5 | For each tool that runs under a credential wider than a principal's, the per-call check against the principal's authority | The tool's code or the dispatcher | Human review |
| R6 | The size limit and the handling of an over-limit result and of an error | The tool-result handling code | Human review |
| R7 | The absence of any detector, rule, audit finding or generated report that states tool calls safe from a presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 to R6 is a human-authored record or a reading of code. A reading establishes what the
code does on the paths the reader followed; it does not establish that no argument reaches a tool by
another path, and that cannot be established from a repository.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** `schemas/tool-permissions.schema.json` is closed and records a tool's name, impact, approval flag and a `scope` string; it has no place for a parameter schema, a pinned revision, a size limit or a principal check, and `schemas/ai-policy.schema.json` is closed as well. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **The subject is behaviour at run time.** Whether a validator rejects the right values, or an allow-list survives a redirect, is a property of the running tool. A detector could only read the presence of a schema or a list, which R7 forbids this framework from reporting as a result; [Standard 23](23-agent-execution-security.md) R5 holds the same position for agents.
3. **No rule namespace is assigned to it.** Namespaces `agent` and `promptsec` exist, and whether a tool rule belongs in one of them, or in a namespace of its own, is a decision for the owner. This standard mints no id. A proposed rule, if one is natural, is recorded in the pull request that introduced this document for per-rule approval, and not here.

**Validation type.** R1 to R6 are `manual-review` obligations in this release. R7 constrains this framework and has no validation type, because the thing it prohibits is a behaviour of the tool. The validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | error |
| R2 | error |
| R3 | error |
| R4 | warning |
| R5 | error |
| R6 | warning |
| R7 | error |

**Exemptibility.** R7 is not exemptible, for the reason R6 of [Standard 25](25-grounding-and-hallucination-control.md) is not. R1 to R6 reach a system only where a model's output can cause a tool call, and a system with no such path records, in its own documents, that they do not reach it and why; R4 reaches it only if some definition is third-party. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Submit a call naming a tool absent from the declared set, including one that exists as a callable in the process | The call runs, or the dispatcher can reach a callable outside the declared set by resolving the model's string | A call naming a declared tool must **not** be faulted for running |
| R2 | Submit calls with a missing required field, an extra field, a wrong type and an out-of-range value | Any such call reaches the tool, or is silently corrected and run | A conforming call must **not** be faulted for running |
| R3 | For each tool reaching a filesystem, network, shell or database, submit an argument built to escape it: a path that resolves outside the directory, a URL that redirects to an internal address, a string carrying query or shell syntax | The argument is interpreted as syntax or reaches a location outside the permitted set | A tool that passes the same string to a parameterised query and returns no rows must **not** be faulted |
| R4 | Present a tool definition whose description or schema differs from the reviewed revision | The changed definition reaches a model before review | A third-party definition identical to its reviewed revision must **not** be faulted; a definition the project wrote itself is outside R4 |
| R5 | Make a call as a principal who may not read an object the tool's own credential can read | The tool returns or changes it | A call for an object the principal may read must **not** be faulted for returning it |
| R6 | Return a result over the declared maximum, and force an error whose detail would include a credential | The over-limit result enters context whole, or the credential is returned to the model | A result under the limit, and an error naming only the failure class, must **not** be faulted |
| R7 | Search `scripts/`, `rules/` and `ai-policy.yml` for a verdict on tool-call safety | A detector, rule, audit finding or report that states tool calls validated, confined, authorised or safe because a safeguard is present | Reporting that a parameter schema was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries one, so R1 to R6 are enforced by review or not at all, and R7 holds today only because no such detector exists. The falsifiers in the table are available for manual review and for a project's own tests; this release neither supplies nor runs them. A record made stale by the event in the staleness table below does not satisfy the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R6 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | Any change to anything this record names or relies on, including: a change to the dispatcher or to the set of declared tools. |
| R2 | Any change to anything this record names or relies on, including: a change to a tool's parameter schema or to the validator. |
| R3 | Any change to anything this record names or relies on, including: a new tool that reaches a filesystem, network, shell or database, or a change to how an existing one builds its target. |
| R4 | Any change to anything this record names or relies on, including: a new third-party tool or tool server, or a new revision of a reviewed definition. |
| R5 | Any change to anything this record names or relies on, including: a change of the credential a tool runs under, or of who may call it. |
| R6 | Any change to anything this record names or relies on, including: a change to the size limit or to the error handling. |
| R7 | A new detector, rule or report that touches tool calls. |

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes one phrase, "tool, agent, and retrieval security", inside a bullet of four subjects, and states no requirement, level or evidence for it. The item is class `D` because its subject token is derived from the brief; the requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1 to R6 in full**, with the defined terms tool, tool call, declared tool, tool definition and principal, and the division of the call boundary into dispatch, argument validation, argument flow, definition provenance, principal authority and result bounds.
- **R7**, the constraint on this framework, in the same form as the equivalent requirement in [Standard 23](23-agent-execution-security.md) and [Standard 33](33-ai-observability.md).
- **The exclusions in Scope as division lines** against Standards 21, 23, 33, 41, 45 and 51, which no one has confirmed.
- **The severity assignments** (one level per requirement, in Validation), the statement that no attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the decision to name no rule id.

Not authored here: the posture is the boundary review's.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) lists the subjects this pack owns and the packs that own the others; the boundary review lists this item under `notGovernedElsewhere`, so there is no counterpart pack to defer to or crosswalk.

[Standard 45](45-approval-gates.md) owns the tool permission manifest (R1), the impact classes (R2), the approval of irreversible actions (R3) and the evaluation of impact against arguments (R4). This standard assumes the manifest and does not restate any of them; its R1 is that the dispatcher honours the declared set, and its R2 is that arguments conform to a schema, which is not the same as being assessed for impact. [Standard 23](23-agent-execution-security.md) owns step budgets and scoping an agent's credentials to its declared tools (its R2); R5 here is the per-call comparison against the principal, and the two are not reconciled. [Standard 51](51-agent-and-tool-execution-prohibitions.md) R2 prohibits retrieved content from being treated as instruction, and records a tool returning fetched content as within it and other tool output as outside it. R6 here does not decide that boundary.

[Standard 21](21-prompt-and-instruction-security.md) governs whether any value can acquire instruction authority; R4 here concerns only that the definition shown is the one reviewed. [Standard 11](11-autonomy-levels-and-delegated-authority.md) governs how much authority a system holds. [Standard 33](33-ai-observability.md) governs what a call record carries. [Standard 41](41-inference-cost-and-budget-control.md) governs cost. [Standard 1](01-ai-system-manifest.md) declares models and does not declare tool definitions or their sources. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and non-lowering language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests section answers.

Unwritten items this standard defers to, by specification number: item 24 (retrieval and context supply chain). **Outside this pack.** No adjacent pack's standard is recorded for this subject. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R6 is enforced; R7 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R7 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` states that tool calls are validated, confined, authorised or safe. |
| Tool permission manifest | `scripts/toolperms.mjs` reads and validates `tool-permissions.yml` against a closed schema (name, impact, approval flag, scope). It reads the declaration [Standard 45](45-approval-gates.md) R1 requires; it does not read a dispatcher, an argument schema or a pin, and nothing here claims it does |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1 | A check that a dispatcher resolves names only from the declared set | Reading a resolution path is a code-analysis heuristic across languages; none is built, and Phase 3 owns detectors |
| R2, R6 | A place to declare a parameter schema and a result limit per tool | The permission schema is closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R3, R5 | Per-tool analysis of argument flow and of the principal check | These are run-time properties; a static check could report only a presence, which R7 forbids stating as a result |
| R4 | A place to record a reviewed definition revision, and a check that the loaded definition matches | No manifest or policy field exists for it |
| R7 | A test asserting no detector, rule, audit finding or report emits a tool-call safety verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector or report that states a system's tool calls are validated, confined, authorised or safe from the presence of a schema, an allow-list, a manifest entry, a pin or a declaration. R7 forecloses it, and the foreclosure is the point: a safeguard that is present is not a safeguard that is applied.
