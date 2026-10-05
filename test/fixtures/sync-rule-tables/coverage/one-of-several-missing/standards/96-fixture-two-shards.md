# Standard 96 — Fixture Two Shards

A coverage fixture for `test/sync-rule-tables.test.mjs`. It is not a standard. Malformed on purpose:
Standard 96's rules live in two shards, and this document carries only the rules/cost.json block,
which is itself in sync. The rules/fairness.json block is missing.

## Requirements

### R1 — Enforce the cap

**A system MUST enforce its spend cap.**

Rule `cost.fixture-cap-enforced`.

### R2 — Measure and publish parity

The measurement is rule `fairness.fixture-parity-measured`; publication is rule
`fairness.fixture-parity-published`, **non-exemptible**.

## Validation, severity, and exemptibility

<!-- BEGIN GENERATED FROM rules/cost.json — DO NOT EDIT. Fixture for test/sync-rule-tables.test.mjs. -->

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R1 | `cost.fixture-cap-enforced` | required | error | configuration | yes |

<!-- END GENERATED -->
