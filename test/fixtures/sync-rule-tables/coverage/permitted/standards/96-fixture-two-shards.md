# Standard 96 — Fixture Two Shards

A coverage fixture for `test/sync-rule-tables.test.mjs`. It is not a standard. Standard 96's rules
live in two shards, so this document carries two blocks. They appear fairness first, the reverse of
the catalog's shard order, because no ordering between blocks is required.

## Requirements

### R1 — Enforce the cap

**A system MUST enforce its spend cap.**

Rule `cost.fixture-cap-enforced`.

### R2 — Measure and publish parity

The measurement is rule `fairness.fixture-parity-measured`; publication is rule
`fairness.fixture-parity-published`, **non-exemptible**.

## Validation, severity, and exemptibility

<!-- BEGIN GENERATED FROM rules/fairness.json — DO NOT EDIT. Fixture for test/sync-rule-tables.test.mjs. -->

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R2 | `fairness.fixture-parity-measured` | recommended | warning | document | yes |
| R2 | `fairness.fixture-parity-published` | optional | info | manual-review | **no** |

<!-- END GENERATED -->

Prose between the two blocks.

<!-- BEGIN GENERATED FROM rules/cost.json — DO NOT EDIT. Fixture for test/sync-rule-tables.test.mjs. -->

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R1 | `cost.fixture-cap-enforced` | required | error | configuration | yes |

<!-- END GENERATED -->
