# Standard 97 — Fixture Fairness Only

A coverage fixture for `test/sync-rule-tables.test.mjs`. It is not a standard. Malformed on purpose:
Standard 97's rules live in one shard, and this document omits that shard's block while the other
documents in this root carry valid, in-sync blocks.

## Requirements

### R1 — Schedule an audit

**A system MUST schedule a fairness audit.**

Rule `fairness.fixture-audit-scheduled`.

## Validation, severity, and exemptibility

The table that belongs here was never added.
