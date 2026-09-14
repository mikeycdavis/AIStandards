# Standard 2 — Second Example, With Punctuation

A fixture for `test/standards-sections.test.mjs`. Its Validation section carries a generated block,
and its Source line ends with a full stop rather than a continuation.

Source: item 2 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md).

## Scope

Applies to the fixture.

## Requirements

### R1 — Example

**The fixture MUST be conforming.**

```text
confirmed + unknown -> failed
```

## Failure modes

| Failure | What it looks like | Caught by |
| --- | --- | --- |
| Example | Example | R1 |

## Evidence

| Requirement | Evidence | Form | Who can produce it |
| --- | --- | --- | --- |
| R1 | The fixture | Test | Automated |

## Validation, severity, and exemptibility

<!-- BEGIN GENERATED FROM rules/example.json — DO NOT EDIT. Fixture only. -->

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R1 | `example.fixture` | required | error | structural | yes |

<!-- END GENERATED -->

Prose after the table.

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | The checker passes | It fails | — |

## Exceptions and staleness

Not exemptible.

## Additions this standard makes beyond the source

None.

## Relationship to other standards and ADRs

[Standard 1](01-first-example.md).

## Implementation

**Not evaluated in this release.**
