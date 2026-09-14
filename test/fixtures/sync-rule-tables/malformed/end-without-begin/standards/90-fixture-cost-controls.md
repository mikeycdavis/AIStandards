# Standard 90 — Fixture Cost Controls

Malformed on purpose: the END marker below has no BEGIN.

## Requirements

### R1 — Declare a budget

Rule `cost.fixture-budget-declared`.

### R2 — No unbounded loops

Rule `cost.fixture-no-unbounded-loop`.

### R3 — Alert on spend, and name an owner

Rules `cost.fixture-owner-named` and `cost.fixture-spend-alerting`.

## Validation, severity, and exemptibility

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R1 | `cost.fixture-budget-declared` | required | error | structural | yes |

<!-- END GENERATED -->
