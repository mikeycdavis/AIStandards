# Standard 90 — Fixture Cost Controls

Malformed on purpose: `cost.fixture-spend-alerting` is cited in both R1 and R3, so its label is ambiguous.

## Requirements

### R1 — Declare a budget

Rule `cost.fixture-budget-declared`, which works alongside `cost.fixture-spend-alerting`.

### R2 — No unbounded loops

Rule `cost.fixture-no-unbounded-loop`.

### R3 — Alert on spend, and name an owner

Rules `cost.fixture-owner-named` and `cost.fixture-spend-alerting`.

## Validation, severity, and exemptibility

<!-- BEGIN GENERATED FROM rules/cost.json — DO NOT EDIT. Fixture for test/sync-rule-tables.test.mjs. -->

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R1 | `cost.fixture-budget-declared` | required | error | structural | yes |
| R2 | `cost.fixture-no-unbounded-loop` | forbidden | error | manual-review | **no** |
| R3 | `cost.fixture-spend-alerting` | recommended | warning | configuration | yes |
| R3 | `cost.fixture-owner-named` | optional | info | document | yes |

<!-- END GENERATED -->
