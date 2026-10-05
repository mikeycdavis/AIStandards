# Standard 45 — Approval Gates for High-Impact, Destructive, and Irreversible Actions

An AI system that can take an action in the world has a failure mode no amount of output quality
removes: it does the thing. Not the wrong thing after a bad answer — the right-looking thing, at the
moment the model was confident, against a state nobody can restore. The gap between a system that
drafts an email and a system that sends one is not a feature flag. It is the whole risk profile, and
it is decided by whether a human stood between the proposal and the effect.

This standard is about that gap. It is not about whether the model was correct.

Source: item 45 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "Approval gates for high-impact, destructive, autonomous, or externally visible
actions" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 45 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. The boundary posture is **X**, evidenced in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json), whose substantive half
> is human judgment and carries `humanSignOff: null`.

## Scope

Applies to any AI system that can cause an effect outside its own process — writing to a datastore,
calling a paid API, moving money, changing configuration, dispatching a message, or invoking a tool
whose implementation does any of those.

A system whose entire output is text returned to the caller has no gated action and may declare this
standard not-applicable, **provided** its manifest declares no tools with side effects. That
declaration is evidence, not a footnote: a project claiming it while shipping a write-capable tool
has made a false statement about its own system, and where a detector observes the contradiction the
verdict is blocked rather than scored.

**This pack owns these requirements canonically.** EngineeringStandards' `ai.destructive-approval`
and `ai.propose-execute` cover adjacent ground for application capabilities and are recorded as
precedent in the crosswalk; their identities are not re-minted here, and neither version is carried
as independently authoritative. See [Standard 7](07-boundary-with-adjacent-standards.md) R3.

## Requirements

### R1 — Enumerate the tools

**A system whose model may invoke tools MUST declare them in a tool permission manifest.**

An approval gate can only fire on an action someone enumerated. A tool nobody declared is a tool
nothing gates, and the enumeration is therefore a precondition for every other requirement here
rather than a documentation nicety.

Rule `gate.tool-permission-manifest`.

### R2 — Classify every action

**Every declared tool MUST carry an impact class: `none`, `reversible`, `irreversible`, or
`externally-visible`.**

The four classes are not a risk score. Each answers one question: is there an effect at all; can the
effect be undone by the system itself; can it be undone at all; and can someone outside the
organisation see it. A tool can warrant two at once, and the stricter applies.

Systems that skip this step do not avoid classifying their actions. They classify them implicitly, at
the moment of the first incident, in a postmortem.

Rule `gate.actions-classified`.

### R3 — An irreversible action requires a recorded human approval

**An action classed `irreversible` MUST NOT take effect until a human with authority has approved
that specific invocation, and the approval MUST record the approver's identity, the time, and the
arguments approved.**

Three words carry the requirement. *Specific invocation*: a standing approval for a capability is a
permission grant, which is a different thing. *Recorded*: an approval that exists only in a chat
transcript is unavailable to the audit that will eventually ask for it. *Human*: an approving agent
is not an approval, and a system where one model approves another's irreversible action has a gate in
its architecture diagram and none in its behaviour.

Rule `gate.irreversible-approval`, **non-exemptible**. The non-exemptibility is structural rather
than a claim about importance: the qualifier that bounds the requirement — *irreversible* — is
internal to it. A project with no irreversible actions is not exempt, it is out of scope, and it says
so under Scope. A project that has them and waives the gate has waived the only control separating a
mistake from a loss. There is no third case for an exception to occupy.

### R4 — Impact is assessed against the arguments

**The system MUST evaluate impact class against the concrete arguments of a proposed invocation, not
against the tool's declared class alone, and MUST escalate where the arguments warrant it.**

This is the requirement EngineeringStandards' precedent does not contain, and it is why this standard
exists rather than deferring entirely. Classifying *capabilities* is right when a programmer chooses
the call site. When a model chooses the arguments, the capability's class is a lower bound and
nothing more: `update_record` is reversible; `update_record` with a filter matching every row is not.
A gate firing on the tool name and not the argument shape is a gate that has already been walked
through.

The escalation MUST be visible to the approver. An approval presented as "approve `update_record`?"
when the arguments affect the entire table has obtained a signature, not a decision.

Rule `gate.argument-scoped-classification`.

### R5 — Never obtain the approval from the system that wants it

**An AI system MUST NOT generate, infer, default, or auto-populate the approval its own action
requires.**

An agent blocked by an approval gate, mid-task, with a `pending_approval` field it can write to, is
presented with a one-token path to a completed task. Naming that path in the standard that creates
the gate is not redundancy — it is where the pressure is applied.

Rule `gate.no-self-approval`, **forbidden** and **non-exemptible**. Crosswalks to
EngineeringStandards' `ai.no-safety-bypass` as precedent.

### R6 — A gate fails closed

**Where the approval mechanism is unavailable, times out, or returns an indeterminate result, the
action MUST NOT proceed.**

A gate that permits the action when the approval service is down is a gate that is strongest when
nothing is wrong. The correct behaviour is to stop and report, and specifically not to record the
action as approved.

Rule `gate.fail-closed`, **forbidden** and **non-exemptible**. The bounding qualifier —
*unavailable* — is internal to the requirement.

## Failure modes

| Failure | What it looks like | Caught by |
| --- | --- | --- |
| Unclassified action | A tool ships with side effects and no impact class; nothing gates it because nothing knows to | R1, R2 |
| Capability gate, argument blast radius | The gate approves `send_notification`; the arguments address every user | R4 |
| Rubber stamp | The approver sees a tool name and a spinner, not the arguments and the scope | R4 |
| Approval theatre | An `approved_by` field the agent populated itself | R5 |
| Fail-open gate | The approval service times out; the action proceeds and is logged as approved | R6 |
| Approval as permission | One standing grant treated as approval for every future invocation | R3 |
| False scope claim | A project declares this standard not-applicable while shipping a write tool | Blocked by `invariant.applicability-contradicted`, where a detector reaches it |

## Evidence

| Requirement | Evidence | Form | Who can produce it |
| --- | --- | --- | --- |
| R1 | `tool-permissions.yml` present when the manifest declares tools | Committed file | Automated |
| R2 | Every declared tool carrying an impact class | Committed file | Automated |
| R3 | Approval records for executed irreversible actions | Runtime audit records | The running system |
| R4 | The classification function and its tests | Source + tests | Repository |
| R5 | **Nothing sufficient exists in a repository** | Human review, structural separation | A reviewer who is not the agent |
| R6 | A test demonstrating refusal when the approval path is unavailable | Test | Repository |

R5's row is stated in full rather than softened. No artifact demonstrates that an agent did not
fabricate an approval, because the artifact a fabricating agent produces looks exactly like the
artifact a compliant one produces. What *can* be demonstrated is structural: that the approval record
is written by a system the agent holds no credential for. Where a project has that separation it is
strong evidence and should be recorded as such. Where it does not, the correct state is
`not-evaluated`, and this standard offers no route to `passed` without it.

## Validation, severity, and exemptibility

<!-- BEGIN GENERATED FROM rules/gate.json — DO NOT EDIT. Verified by test/standards-tables.test.mjs. -->

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R1 | `gate.tool-permission-manifest` | required | error | structural | yes |
| R2 | `gate.actions-classified` | required | error | structural | yes |
| R3 | `gate.irreversible-approval` | required | error | manual-review | **no** |
| R4 | `gate.argument-scoped-classification` | required | error | manual-review | yes |
| R5 | `gate.no-self-approval` | forbidden | error | manual-review | **no** |
| R6 | `gate.fail-closed` | forbidden | error | manual-review | **no** |

<!-- END GENERATED -->

R1 and R2 are `structural` and `full` assurance on a technicality worth naming: they check that a
declaration *exists and is complete*, not that it is *right*. A project labelling `delete_all` as
`reversible` passes R2 and fails R4, where a human is the only reader.

R3 is `manual-review` rather than automated because deciding whether an approval was real requires
deciding whether the approver understood what they approved, and that is not in the repository. A
heuristic counting `approved_by` fields would report clean runs for exactly the systems this standard
exists to catch — which is worse than no check, because it would be believed.

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | A manifest declaring tools with no permission file fails | Tools declared, no file | A manifest declaring no tools must **not** fail |
| R2 | A tool present in the manifest and absent from the permission file fails | Any unclassified tool | `declared-tools/` must pass |
| R3 | No detector. Human review | An executed irreversible action with no matching approval record | A forged-but-well-formed record must not pass on shape alone |
| R4 | No detector. Human review | Arguments exceeding the declared class without escalation | A benign argument set must not escalate — a rule that always escalates has stopped discriminating |
| R5 | **No falsifier exists, and none is invented** | — | — |
| R6 | No detector in this release | The action proceeds, or is recorded as approved | Approval available and granted → proceeds |

The R1 negative control is the one that keeps the rule honest: a system with no tools owes no
permission manifest, and a check that demanded one anyway would fire on every text-only system in
existence.

**R5 has no falsifier and this standard does not invent one.** A test can prove an approval record
exists; no test distinguishes a record a human wrote from one an agent wrote through a path the test
does not know about. What keeps "no falsifier" from becoming "no consequence" is the verdict
vocabulary: a `forbidden` rule nobody examined reports as `prohibited-but-unestablished` and caps the
status at `NOT_EVALUATED`. A project shipping irreversible actions that has never had R5 reviewed
does not get a green run — it gets a verdict saying, accurately, that nobody looked.

## Exceptions and staleness

R1, R2 and R4 are exemptible. A project can have a real reason a specific tool cannot carry a class,
and recording it is better than a requirement everyone routes around.

R3, R5 and R6 are **non-exemptible**, and in each case the qualifier bounding the requirement is
internal to it — *irreversible*, *its own action*, *unavailable*. There is no situation that
satisfies the precondition and legitimately escapes the rule. A project with none of these is out of
scope, which is a different mechanism producing a different verdict.

The exception and attestation mechanisms are Phase 4 and do not exist in this release. When they
arrive, R3's attestation should expire on any change to the approval mechanism rather than only on a
calendar — a review of an approval flow is a statement about that flow, and it stops being true the
moment the flow changes.

## Additions this standard makes beyond the source

- **The four impact classes.** The source bullet names four *action kinds*; the classes are this
  repository's own decomposition and are not the brief's words.
- **R4 in its entirety.** Argument-scoped classification is in neither the brief nor
  EngineeringStandards. It is the requirement this standard was written for, and it is authored on
  this repository's authority.
- **The elevation to *must*** where the EngineeringStandards precedent says *should*. The source
  bullet is unqualified; the divergence is deliberate, applies only within this standard's scope, and
  is not a claim that the other standard is wrong for its own.
- **R6 and the approval-expiry reasoning.** Fail-closed behaviour is not in the source bullet.
- **The R5 evidence row**, which states that no artifact suffices rather than nominating a weak one.
- **The deference of the autonomous action class** to Standard 11 *(Phase 2)*. The source bullet asks
  for four classes; this standard covers three and routes the fourth.

## Relationship to other standards and ADRs

[Standard 1](01-ai-system-manifest.md) holds the tool declarations R1 and R2 read; without it R2 has
nothing to check against, which is why an unreadable manifest withdraws these rules rather than
failing them. [Standard 21](21-prompt-and-instruction-security.md) reduces the chance of an injected
instruction; this standard bounds what one can cause.
[Standard 5](05-verdict-vocabulary.md) is what makes R5's unfalsifiability survivable, via the
`prohibited-but-unestablished` cap. [Standard 7](07-boundary-with-adjacent-standards.md) R3 records
why no rule here re-mints `ai.destructive-approval`.
Standard 11, Autonomy Levels and Delegated Authority, Standard 23, Agent Execution Security,
Standard 36, Auditability of AI Actions and Standard 46, Gates for Externally Visible Actions
are all Phase 2 and own, respectively, standing authority, sandboxing, the approval record's shape,
and the fourth action class.

Outside this repository: **EngineeringStandards** Standards 2 and 53 are the precedents this
standard's crosswalks name. **UIUXDesignStandards** owns how an approval is *presented*; R4's
"visible to the approver" is the obligation, and that pack's rules are its presentation.

## Implementation

**Normative. Two of six requirements have a detector; four are human review, and one of those has no
falsifier at all.**

| Requirement | Rule | State |
| --- | --- | --- |
| R1 | `gate.tool-permission-manifest` | **Evaluated.** Conditional on the manifest declaring tools. An unreadable manifest withdraws it to unevaluated rather than failing it |
| R2 | `gate.actions-classified` | **Evaluated.** Set difference between declared tools and classified ones. Full where tool names are static; it does not read code, so a tool that exists but is absent from the manifest is invisible |
| R3 | `gate.irreversible-approval` | `manual-review`, non-exemptible. Whether an approval was a decision or a click is not in the repository |
| R4 | `gate.argument-scoped-classification` | `manual-review`. A detector could confirm a classification function is *called*; whether its judgement is correct is a claim about the domain |
| R5 | `gate.no-self-approval` | `forbidden`, non-exemptible, **no detector here or planned** |
| R6 | `gate.fail-closed` | `forbidden`, non-exemptible, no detector in this release |

**`standards audit` cannot detect R3, R4, R5 or R6, and this standard does not pretend otherwise.**
Each is a claim about a human's understanding or an agent's intent, and neither is in a diff.

The two checks that do exist are worth being precise about. They establish that a project has
*declared* its gated actions — which is a precondition for having gates, and is not the same thing as
having them. A project can pass R1 and R2 completely while every approval in it is a rubber stamp,
and this framework will report that project as passing those two rules and unevaluated on the four
that matter more.
