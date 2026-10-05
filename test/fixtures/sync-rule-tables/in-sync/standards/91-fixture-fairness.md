# Standard 91 — Fixture Fairness

A fixture document for `test/sync-rule-tables.test.mjs` carrying two generated blocks from two shards.

## Requirements

### R1 — Set a disparity threshold

An example, fenced so that its heading-shaped line is not read as a heading:

```text
### R9 — this is not a requirement heading
```

Rule `fairness.fixture-disparity-threshold`.

### R2 — Cover a rule for this standard held in another standard's shard

Rule `cost.fixture-other-standard`.

### Notes

A non-requirement H3 ends R2 and opens nothing. This note mentions `cost.fixture-model-behaviour`, and
that mention must not count as a second requirement section.

### R3 — Model behaviour

Rule `cost.fixture-model-behaviour`, not-evaluable.

## Validation, severity, and exemptibility

<!-- BEGIN GENERATED FROM rules/cost.json — DO NOT EDIT. Fixture for test/sync-rule-tables.test.mjs. -->

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R2 | `cost.fixture-other-standard` | required | error | document | yes |
| R3 | `cost.fixture-model-behaviour` | required | error | not-evaluable | yes |

<!-- END GENERATED -->

Prose between the two blocks.

<!-- BEGIN GENERATED FROM rules/fairness.json — DO NOT EDIT. Fixture for test/sync-rule-tables.test.mjs. -->

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R1 | `fairness.fixture-disparity-threshold` | required | error | configuration | yes |

<!-- END GENERATED -->
