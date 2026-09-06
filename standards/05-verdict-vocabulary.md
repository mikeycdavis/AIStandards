# Standard 5 — Verdict Vocabulary

A compliance tool has exactly one way to be dangerous, and it is not being wrong. It is being
confidently silent: reporting a clean result for a check that never ran, a rule nobody examined, or
a repository it could not fully read. A wrong answer gets argued with. A false green gets acted on.

This standard defines the vocabulary that keeps the difference visible. It exists because the words
"passed" and "not failed" are not synonyms, and because a tool that conflates them will eventually
certify a repository it never opened.

Source: item 5 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "A clear distinction between passed, failed, warning, skipped, not-evaluated, and
prohibited-but-unestablished" line of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 5 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. The boundary posture is **O**, evidenced in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json), whose substantive half
> is human judgment and carries `humanSignOff: null`.

## Scope

Applies to every verdict this framework emits, and to any consumer that reads one — including
StandardsEnforcer.

It does not apply to `audit`, which emits no verdict at all. That separation is why the audit
envelope's schema structurally forbids a `status` field rather than merely omitting it, and why the
command prints "This is evidence, not a verdict." in both its human and machine output.

## Requirements

### R1 — Four vocabularies, not one

**A verdict MUST report status, per-rule result, per-rule disposition and per-rule distinction as
four separate values, and MUST NOT collapse them.**

The temptation to merge them is constant, because four fields where one would do looks like
over-engineering. It is not. Merging them is what makes "skipped because this rule has no subject
here" indistinguishable from "skipped because nobody looked", and those demand opposite responses
from whoever reads the report.

Rule `invariant.vocabulary-separate`, which does not exist in this release. See
[Implementation](#implementation).

### R2 — The six distinctions

**Every rule result MUST carry exactly one distinction from: `passed`, `failed`, `warning`,
`skipped`, `not-evaluated`, `prohibited-but-unestablished`.**

Their meanings, which are not interchangeable:

| Distinction | Means |
| --- | --- |
| `passed` | A check ran, covered the rule, and found no violation |
| `failed` | A check ran and confirmed a violation |
| `warning` | A check confirmed a violation of a rule the project adopted at a level below required |
| `skipped` | The rule was not evaluated for a stated reason that is not ignorance — most often that the project declared it not-applicable |
| `not-evaluated` | Nobody looked, or a check could not run. **This is not a pass** |
| `prohibited-but-unestablished` | A `forbidden`-level rule nobody examined |

### R3 — Distinction is derived, never stored

**The distinction MUST be a pure function of result, disposition and level.**

Storing it would create a fifth vocabulary that could drift from the four it summarises, and a
summary that disagrees with what it summarises is worse than no summary. Because it is derived, it
can never carry information the other three do not already hold — and a test recomputes it
independently for every result in every fixture and compares.

### R4 — A prohibition nobody examined is reported as such

**Where a rule's level is `forbidden` and no check established its state, the distinction MUST be
`prohibited-but-unestablished` and MUST NOT be `not-evaluated`.**

This is a branch-ordering requirement in the derivation, and it is load-bearing. A consumer scanning
for unexamined prohibitions filters on this value; reporting such a rule as merely `not-evaluated`
hides it in the general population of things nobody checked. The brief names this distinction
separately for exactly that reason.

The list MUST also be reported as its own array, always present and empty when there are none, so a
consumer can distinguish "no prohibition went unexamined" from "this validator predates the field".

### R5 — Unestablished caps the status

**Where any applicable rule is unestablished, the status MUST NOT be `COMPLIANT`.**

A project cannot be called compliant with a rule nobody examined. The honest status is
`NOT_EVALUATED`, which says what is true: an answer was not reached.

### R6 — Unknown is never a pass

**Where a check could not run, could not read a file, or covered less than the rule requires, the
result MUST be `skipped` with disposition `not-evaluated`, and MUST NOT be `passed`.**

The aggregation this implies is stated in full in
[`scripts/compliance.mjs`](../scripts/compliance.mjs):

```text
confirmed violation + unknown check    -> failed, carrying ONLY the confirmed finding
no violation       + unknown check     -> not-evaluated
no violation       + everything known  -> passed
```

The middle row is the requirement. The first row matters too, and is subtler: a confirmed violation
stands even when a different check for the same rule could not run, because an unknown elsewhere does
not un-observe what was observed — but only the confirmed findings are carried as evidence, so the
report never presents an unknown as the reason for a failure.

### R7 — An invariant breach blocks rather than scores

**Where a structural integrity breach is found, the status MUST be `BLOCKED_BY_INVARIANT` and the
score MUST be null.**

A percentage beside a blocked status undercuts the status. The reader's eye takes the number, and the
number is meaningless when the basis for computing it is known to be broken.

### R8 — Coverage and unverifiability sit outside the verdict

**Framework coverage and the not-evaluable list MUST travel beside the status, and MUST change
neither the status nor the score.**

This is symmetric and both halves matter. Growing the catalog must never look like a project getting
worse; admitting a blind spot must never look like a project getting worse either. A requirement this
framework states and structurally cannot check is a fact about the framework, and putting it inside
the verdict would make it a fact about the project.

## Failure modes

| Failure | What it looks like | Caught by |
| --- | --- | --- |
| The false green | A repository is certified against checks that never ran | R5, R6 |
| Hidden prohibition | A forbidden rule nobody examined sits in the general unevaluated pile | R4 |
| Vocabulary collapse | "Skipped" means both "not applicable" and "nobody looked" | R1, R2 |
| Drifting summary | A stored distinction disagrees with the result it summarises | R3 |
| Confident blocked verdict | `BLOCKED_BY_INVARIANT` printed beside "83%" | R7 |
| Coverage as compliance | Adding a detector lowers the score, so nobody adds detectors | R8 |

## Evidence

| Requirement | Evidence | Form | Who can produce it |
| --- | --- | --- | --- |
| R1, R2 | The envelope schema, which is closed and enumerates each vocabulary | Committed schema | Automated |
| R3 | A test recomputing the distinction independently for every fixture result | Test | Automated |
| R4 | Fixtures reaching `prohibited-but-unestablished`, and a bidirectional array check | Test | Automated |
| R5 | A fixture with an unestablished rule reporting `NOT_EVALUATED` | Test | Automated |
| R6 | A fixture where a check cannot run, reporting unevaluated rather than passed | Test | Automated |
| R7 | A fixture reaching `BLOCKED_BY_INVARIANT` with a null score | Test | Automated |
| R8 | A test mutating the not-evaluable list and asserting status and score are unchanged | Test | Automated |

## Validation, severity, and exemptibility

This standard governs the framework rather than an adopting project, so it has no rules in the
catalog in this release. That is a genuine gap and is named as one rather than papered over: the
`invariant.*` shard that would carry these is Phase 2 scope.

What enforces this standard today is the test suite, not the catalog. That is weaker in one specific
way — a consuming project cannot be reported against it — and stronger in another, because the tests
run on every commit and a catalog rule with no detector would not.

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R2 | Fixtures reach all six distinction values | Any value unreachable | — |
| R3 | Recompute distinction from `(result, disposition, level)` and compare, for every result | Any mismatch | — |
| R4 | A forbidden rule with no detector reports `prohibited-but-unestablished` | It reports `not-evaluated` | A forbidden rule that IS evaluated must not appear in the array |
| R4 | The array and the filtered results agree in both directions | Either contains something the other does not | — |
| R5 | An unestablished applicable rule prevents `COMPLIANT` | Status is `COMPLIANT` anyway | A fixture with nothing unestablished must be able to reach `COMPLIANT` |
| R6 | A withdrawn check reports unevaluated | It reports `passed` | — |
| R7 | The invariant fixture reports null score | A score is present | A fixture with no breach must carry a score |
| R8 | Mutating `notEvaluable` leaves status and score byte-identical | Either changes | — |

The R4 negative control and the R5 negative control are the ones that keep these from being
vacuous. A derivation that returned `prohibited-but-unestablished` for everything would satisfy the
positive test; a status function that never returned `COMPLIANT` would satisfy R5's.

## Exceptions and staleness

**None of this standard is exemptible, and the reason is structural rather than a claim about
importance.** Every requirement here bounds what the framework may *say*. An exception would be a
recorded decision to let this tool report something untrue, and there is no project circumstance that
makes that useful — a project that dislikes its verdict can change the project or change its policy,
both of which are visible, rather than changing what the words mean.

## Additions this standard makes beyond the source

- **The four-vocabulary separation (R1).** The brief names six distinctions and says nothing about
  how they are represented. The separation, and the decision to derive rather than store the sixth,
  are this repository's own.
- **R3 in full**, and the test that recomputes it.
- **R6's aggregation truth table.** The brief requires that unavailable evidence never becomes a
  false pass; the three-row table is the authored mechanism for it.
- **R7 and `BLOCKED_BY_INVARIANT`.** The status is not in the brief. It is adopted from a sibling
  pack's precedent and recorded as an addition, not as the brief's word.
- **R8's symmetry.** The brief does not mention coverage. The rule that unverifiability must not
  move the verdict in *either* direction is authored, and it is the reason `not-evaluable` exists as
  a validation type rather than as a status.

## Relationship to other standards and ADRs

[Standard 3](03-machine-readable-ai-policy.md) R5 governs the configuration errors that produce no
verdict at all, which is the boundary of this vocabulary's reach.
[Standard 6](06-standard-structure-and-rule-identity.md)
governs the rule identity every result is keyed by.
[Standard 3](03-machine-readable-ai-policy.md) governs the policy that decides which rules are
applicable, which is the input to `skipped`.
Standard 47, AI Engineering Invariants *(Phase 2, not yet written)*, will own the `forbidden` level and
the cap in R5.

## Implementation

**Normative, and enforced by tests rather than by the catalog.**

| Requirement | State |
| --- | --- |
| R1 | **Enforced.** [`schemas/validate-report.schema.json`](../schemas/validate-report.schema.json) is closed and enumerates each vocabulary separately |
| R2 | **Enforced.** All six values are reachable across the fixtures, asserted directly |
| R3 | **Enforced.** `distinction()` is a pure function; the test recomputes it independently |
| R4 | **Enforced.** Branch order is asserted, and the array is checked bidirectionally |
| R5 | **Enforced** |
| R6 | **Enforced** for the checks that exist. The broader evidence-availability architecture — read budgets, truncation domains, unreadable-file withdrawal — is Phase 3 |
| R7 | **Enforced.** One invariant exists in this release: `invariant.applicability-contradicted` |
| R8 | **Enforced** |

**No rule in the catalog binds to this standard, so no consuming project can be reported against
it.** That is the honest state at v0.1.0 and it is a real limitation: this standard constrains the
framework, and a framework cannot be audited by itself in the way a project can. The `invariant.*`
shard arriving in Phase 2 closes part of the gap; the rest is closed by the tests, which is a
different kind of assurance and is not the same thing.
