# Standard 90 — Fixture Cost Controls

A fixture document for `test/sync-rule-tables.test.mjs`. It is not a standard. This lede cites
`cost.fixture-budget-declared` outside any requirement section, which must not count as a label.

## Scope

Nothing real.

## Requirements

### R1 — Declare a budget

**A system MUST declare a spend budget.**

Rule `cost.fixture-budget-declared`.

### R2 — No unbounded loops

**A system MUST NOT loop without a bound.**

Rule `cost.fixture-no-unbounded-loop`, **non-exemptible**.

### R3 — Alert on spend, and name an owner

The owner is rule `cost.fixture-owner-named`; the alert is rule `cost.fixture-spend-alerting`.
This section cites the later shard position first, so document order and shard order disagree.

## Failure modes

| Failure | Caught by |
| --- | --- |
| Runaway spend | R1 — `cost.fixture-budget-declared` |

## Validation, severity, and exemptibility

Prose before the block, with trailing spaces on this line.   
	And a tab-indented line.

<!-- BEGIN GENERATED FROM rules/cost.json — DO NOT EDIT. Fixture for test/sync-rule-tables.test.mjs. -->

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R1 | `cost.fixture-budget-declared` | required | error | structural | yes |
| R2 | `cost.fixture-no-unbounded-loop` | required | error | manual-review | **no** |
| R3 | `cost.fixture-spend-alerting` | recommended | warning | configuration | yes |
| R3 | `cost.fixture-owner-named` | optional | info | document | yes |

<!-- END GENERATED -->

Prose after the block — unchanged by any write.
