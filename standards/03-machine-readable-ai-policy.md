# Standard 3 — Machine-Readable AI Policy

A standards pack that decides for itself what applies to a project is not a standards pack; it is an
opinion running in CI. The policy file is where a project says which rules it adopted, at what level,
and which have no subject in its codebase — and it is the reason a verdict is about that project
rather than about the framework's defaults.

The subtler point is what a policy is *not*. Nothing in it asserts compliance. A project can declare
every rule required and meet none of them; the file records intent and applicability, and what is
actually met comes only from a validation run. Files that blur those two are how organisations come
to believe they are compliant because someone filled in a form.

Source: item 3 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "A versioned machine-readable policy schema" and "A policy file selecting applicable
standards and levels" lines of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 3 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. The boundary posture is **O**, evidenced in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json), whose substantive half
> is human judgment and carries `humanSignOff: null`.

## Scope

Applies to any repository evaluated by this pack, and to the framework's own handling of that file.

It does not govern EngineeringStandards' `project-policy.yml`, which is a different file with a
different closed schema, and the two never merge — see R1.

## Requirements

### R1 — The policy is `ai-policy.yml`

**A project's AI policy MUST be a file named `ai-policy.yml`, and MUST NOT be merged into another
pack's policy file.**

This is forced rather than stylistic. EngineeringStandards' policy schema is closed and pins its own
`standardVersion` to the EngineeringStandards release; this pack's schema is closed and pins its own.
A single file cannot satisfy two closed schemas declaring two different framework versions, so a
repository governed by both packs carries both files. The benefit is incidental but real: there is no
document in which a rule id from one pack and a rule id from the other can be siblings, so a typo
cannot silently move a rule between packs.

Rule `policy.file-present`, which does not exist in this release — a missing policy is a
configuration error rather than a rule failure. See R5.

### R2 — Declare the framework version

**A policy MUST declare the `standardVersion` it was written against, and the framework MUST refuse
to emit a verdict when that disagrees with its own `VERSION`.**

Refusing is stronger than warning, and deliberately so. A verdict computed by version 2 of a rule set
against a policy written for version 1 is a statement about rules the project never adopted. Being
wrong about which rules produced a verdict is the same class of error as being wrong about the
verdict.

The refusal is exit 2 — a configuration error — not a compliance failure. The project has not failed
anything; the operator has asked a question that cannot be answered.

### R3 — The policy is resolved against the target

**The policy governing an evaluation MUST be resolved relative to the repository being evaluated, and
MUST NOT be resolved relative to the framework's own checkout.**

This requirement exists because of a specific, recorded failure in a sibling pack, described in the
enforcement layer's own contract schema: absent an explicit policy path, that pack read the policy
from *its own* checkout, labelled the resulting report with *its own* project name, and exited 0. The
schema's phrase for the result is "a confident verdict about the wrong thing", and it is the worst
outcome available to a compliance tool because it is indistinguishable from success.

The countermeasure MUST be structural rather than careful coding.
[`scripts/policy.mjs`](../scripts/policy.mjs)'s `resolvePolicyPath` takes the target and an optional
explicit path — there is no parameter through which the framework's own root could be passed, so a
caller cannot express the request that produces the failure. The report records `policySource` with
exactly two possible values, and there is deliberately no third.

### R4 — Applicability and exception are different mechanisms

**A policy MUST NOT use an applicability declaration to record a rule that applies and is not met.**

They answer different questions. `not-applicable` means the rule's subject does not exist in this
project. An exception means it does exist, the rule applies, and the project knowingly does not
satisfy it. Substituting the first for the second converts a known gap into an apparent
non-question, and the gap stops being visible to anyone reading the policy.

Every applicability declaration MUST carry a reason, and SHOULD carry a `revisitWhen`. A declaration
is a claim about the project that stops being true the moment the project gains the capability;
without a revisit condition it is a claim with no expiry.

### R5 — A missing or malformed policy is a configuration error

**Where no policy can be read, the framework MUST exit 2 without emitting an envelope, and MUST NOT
emit any status.**

Not `NOT_EVALUATED` with exit 0, and not `NON_COMPLIANT`. A verdict was requested and there is
nothing to evaluate against — that is a problem with the invocation, and reporting it as a property
of the project blames the project for the operator's mistake. Emitting no envelope at all is what
stops a consumer from parsing a status out of a run that never happened.

### R6 — A policy naming an unknown rule is an error

**A policy that names a rule id the catalog does not define MUST be refused.**

Silently ignoring it lets a typo look like an adopted rule for as long as nobody checks, which is
indefinitely. The likeliest cause is a rule id from another pack, and the error names that
possibility because it is the mistake worth catching.

### R7 — An undeclared rule is not an absent one

**A rule the policy does not mention MUST be evaluated at its catalog default and MUST be reported as
undeclared.**

Deleting a line from a policy is not a way to switch a rule off. A project is entitled to adopt a
subset, but it does so by declaring the subset, not by silence — and a reader of the verdict is
entitled to see how much of the catalog the project never considered.

## Failure modes

| Failure | What it looks like | Caught by |
| --- | --- | --- |
| Confident verdict about the wrong thing | The pack evaluates its own repository and reports the target's name | R3 |
| Version skew | A verdict cites rules the project never adopted | R2 |
| Exemption by reclassification | A known gap is filed as "no subject here" and stops being visible | R4 |
| Missing policy reads as a result | Exit 0 and a status, for a run with nothing to evaluate against | R5 |
| Cross-pack typo | An EngineeringStandards rule id in an AIStandards policy, silently ignored | R1, R6 |
| Silent subset | A rule is omitted, and nobody can tell whether that was a decision | R7 |

## Evidence

| Requirement | Evidence | Form | Who can produce it |
| --- | --- | --- | --- |
| R1 | `ai-policy.yml` present in the target | Committed file | Automated |
| R2 | A refusal when versions disagree | Test, exit code 2 | Automated |
| R3 | The trap test: run from this checkout against a fixture, assert the fixture's project and policy path | Test | Automated |
| R4 | Reason present on every declaration; schema-enforced | Committed schema | Automated |
| R5 | A missing-policy fixture producing exit 2 and no stdout envelope | Test | Automated |
| R6 | A policy naming an unknown id producing exit 2 | Test | Automated |
| R7 | Undeclared rules evaluated at catalog default | Test | Automated |

R3's evidence deserves comment. A unit test on `resolvePolicyPath` would not be sufficient: the
failure it guards against happens in the wiring, not the function. The test therefore runs the real
CLI as a subprocess with the working directory set to this checkout — where a valid `ai-policy.yml`
does exist — against a fixture target, and asserts on the emitted envelope.

## Validation, severity, and exemptibility

This standard governs the framework's handling of the policy file, so like
[Standard 5](05-verdict-vocabulary.md) it has no catalog rules in this release. R1 through R7 are
enforced by the schema and the test suite.

**None of it is exemptible.** Every requirement bounds what the framework may do with a project's
policy, and an exception would be a decision to let the tool misreport which rules governed a run.

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R2 | A `9.9.9` policy exits 2 | An envelope is emitted | A matching version must produce a verdict |
| R3 | Project and policy path are the target's | Either names this checkout | An explicit `--policy` must be honoured and reported as `explicit` |
| R4 | A declaration without a reason is rejected by the schema | It validates | A declaration with one must validate |
| R5 | A target with no policy exits 2, stdout has no envelope | Exit 0, or a parseable status | A target with a policy must exit non-2 |
| R6 | An unknown rule id exits 2 | It is ignored | A policy of known ids must load |
| R7 | An undeclared rule appears in results at catalog level | It is absent from results | — |

The R5 negative control is not decorative: a `resolvePolicyPath` that always failed would satisfy
the positive test.

## Exceptions and staleness

The exception mechanism this standard describes in R4 **does not exist in this release**. It is
Phase 4 scope, deliberately built after the checks rather than before them, so that the escape hatch
cannot precede the thing it is an escape from. Until it lands, a project's honest options are to meet
a rule, declare it not-applicable with a reason, or leave it failing — and this repository's own
policy takes the third option for its manifest rules rather than the second.

Applicability declarations carry `reviewedAt` and `revisitWhen`. Neither is checked for staleness in
this release; digest-based freshness is Phase 4.

## Additions this standard makes beyond the source

- **The filename `ai-policy.yml` (R1)** and the reasoning that forces it. The brief asks for "a
  policy file" and does not name it.
- **R3 in its entirety.** Target-relative resolution is not in the brief. It is authored in response
  to an observed failure in a sibling pack, and it is the single design decision that makes this
  pack enforceable where that one is not.
- **R5's exit-code semantics.** The brief distinguishes six result values; it says nothing about
  process semantics or about the difference between a configuration error and a compliance failure.
- **R4's applicability/exception separation**, R6 and R7 in full.
- **The schema being closed** (`additionalProperties: false` throughout), so a misspelled key is an
  error rather than a silently ignored declaration.

## Relationship to other standards and ADRs

[Standard 5](05-verdict-vocabulary.md) governs what the resulting verdict may say; this standard
governs its input. [Standard 6](06-standard-structure-and-rule-identity.md) owns the rule-id form
this file's keys must match. [Standard 1](01-ai-system-manifest.md) is the artifact the policy's
rules are evaluated against. This standard's R5 is also why `audit` needs no policy at all
and refuses `--policy` rather than accepting and ignoring it: a command that produces no verdict
has nothing to evaluate a policy against.

Outside this repository: **StandardsEnforcer** supplies the policy path explicitly when it runs this
pack, which is the mechanism R3 exists to make safe. **EngineeringStandards** owns
`project-policy.yml`; the two files coexist and never merge.

## Implementation

**Normative, and structurally enforced where it matters most.**

| Requirement | State |
| --- | --- |
| R1 | **Enforced.** `POLICY_BASENAME` is the only default, and it is joined to the target |
| R2 | **Enforced.** `assertVersionIdentity` throws; the CLI maps it to exit 2 |
| R3 | **Enforced structurally.** `resolvePolicyPath(target, explicit)` has no parameter that could name this checkout. `policySource` has two values and no third |
| R4 | **Enforced by schema** for shape. Whether a declaration is *honest* is not checkable and is not claimed to be |
| R5 | **Enforced.** No envelope is constructed on any policy-load failure path |
| R6 | **Enforced.** `applyPolicy` collects unknown ids and throws |
| R7 | **Enforced.** `undeclared` is carried per rule |

**What no check here establishes is whether an applicability declaration is true.** A project that
declares a rule not-applicable while shipping the capability has made a false statement about itself,
and the schema cannot tell. One narrow case *is* caught — where a detector observes the very thing a
declaration says is absent, `invariant.applicability-contradicted` blocks the verdict rather than
scoring it — but that only reaches rules a detector examines, which in this release is nine of
thirty-two.
