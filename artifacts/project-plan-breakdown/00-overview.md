# 00 — Overview

> **Post-reconstruction evidence, generated 2026-09-03.** This breakdown was produced from the
> approved plan on the date shown. It is **not** pre-existing planning history, and no part of it
> should be read as a record of what anyone intended before that date. Nothing here asserts a test
> result, an approval, a reviewer, a model capability, or a compliance verdict.

## Purpose

AIStandards is a machine-checkable AI engineering standards pack, modelled structurally on
EngineeringStandards and enforceable by StandardsEnforcer. It defines how AI systems are designed,
built, evaluated, deployed, monitored, governed and retired.

Governing inputs, in precedence order:

1. `artifacts/prompts/original_prompt.md` — the design brief. **Never edited.**
2. The approved plan (`create-a-repository-of-snuggly-cake.md`, held outside this repository).

## Glossary

Terms a reader would genuinely misread without a definition. Everything else is left unglossed.

- **Pack** — one domain standards repository (AIStandards, MachineLearningStandards, …). A pack owns
  rule identity for its domain and publishes an evaluator.
- **Adapter** — `standards-adapter.json` at a pack's repository root. The contract StandardsEnforcer
  reads to learn how to run the pack's evaluator and how to interpret its status.
- **Distinction** — the six-way presentation value the brief requires (`passed`, `failed`,
  `warning`, `skipped`, `not-evaluated`, `prohibited-but-unestablished`). Derived, never stored.
- **Prohibited-but-unestablished** — a `forbidden`-level rule that nobody examined. It caps the
  verdict at `NOT_EVALUATED` rather than passing quietly.
- **Not-evaluable** — a validation type for a requirement this framework states and structurally
  cannot check, because its subject is model behaviour rather than repository content. It changes
  neither status nor score, and can never be attested.
- **Evidence surface** — the record of every way evidence could have been lost during a run:
  exclusions, truncation, read-budget exhaustion, unreadable files.
- **Crosswalk** — a semantic mapping from an AIStandards rule to an EngineeringStandards rule that
  covers adjacent ground. Never an identity reuse.
- **Scaffolding** — framework-generated placeholder content, marked so it can never satisfy the rule
  it was generated for.

## Phase index

| File | Phase | Status |
|---|---|---|
| [01-phase-1-cli-and-core.md](01-phase-1-cli-and-core.md) | 1 — CLI, catalog, policy, core detectors | **complete** (2026-09-04) |
| [02-phase-2-normative-corpus.md](02-phase-2-normative-corpus.md) | 2 — 53 standards, templates, `init` | **in-progress** — the two blocking reviews passed 2026-09-04 (mechanical only, no human sign-off); Standards 02 and 11 written 2026-09-06; Standard 08, `sync-rule-tables.mjs` and `standards-sections.mjs` added 2026-09-14; 43 standards, shards for nine namespaces, `manifest.mjs`, `toolperms.mjs`, templates and `init` remain |
| [03-phase-3-detectors-and-evidence.md](03-phase-3-detectors-and-evidence.md) | 3 — detectors, evidence availability | not-started |
| [04-phase-4-attestations.md](04-phase-4-attestations.md) | 4 — attestations, exceptions, staleness | not-started |
| [05-phase-5-ci-and-adapter.md](05-phase-5-ci-and-adapter.md) | 5 — CI, containers, adapter | not-started |
| [06-phase-6-dogfooding-and-docs.md](06-phase-6-dogfooding-and-docs.md) | 6 — docs, self-verdict, `0.9.0` | not-started |
| [07-phase-7-enforcer-integration.md](07-phase-7-enforcer-integration.md) | 7 — real integration, `1.0.0` | not-started |
| [08-open-questions.md](08-open-questions.md) | Cross-cutting unknowns and blockers | open |

## Standing constraints

These bind every phase and are not renegotiable by any of them.

1. **No fabricated evidence.** Never invent historical intent, test results, approvals, reviewers,
   model capabilities or compliance evidence. Preserve uncertainty explicitly.
2. **Never weaken to pass.** No test, policy, standard or evidence requirement may be weakened,
   narrowed, reclassified or excepted in order to make a gate pass. If a phase cannot meet its
   acceptance criteria, the criteria stand and the phase is re-planned.
3. **Unknown is never a pass.** Unavailable, excluded, truncated or unreadable evidence withdraws the
   affected rule to `not-evaluated`. It never produces `passed`.
4. **Zero third-party dependencies.** Node built-ins and local modules only. No lockfile. Structurally
   enforced by CI having no install step.
5. **Target-relative policy.** A target's policy is resolved against the target, never against the
   AIStandards checkout. There is no fallback path.
6. **Boundaries hold.** MachineLearningStandards owns reproducibility, provenance, evaluation and
   drift/monitoring — link, never copy. EngineeringStandards rule IDs are crosswalked semantically
   and never reused. StandardsOrchestrator is frozen and must not be adopted as an authority.
7. **The catalog was provisional** until the fidelity and boundary reviews passed. Both passed on
   2026-09-04 (`node scripts/fidelity.mjs`, `node scripts/inventory.mjs`) and
   `artifacts/prompts/ai-standards-spec.md` is now the record of identity. The reviews changed four
   boundary postures, narrowed two, withdrew one crosswalk, corrected the plan's token count, and
   replaced the plan's false claim that this pack's rule namespaces were disjoint from every other
   pack's. The boundary review's substantive half remains human judgment and records
   `humanSignOff: null`.
