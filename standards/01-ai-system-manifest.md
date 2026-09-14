# Standard 1 — AI System Manifest

Most of what goes wrong with an AI system goes wrong in the gap between what the system is and what
anyone can say about it. Which model is it actually calling today? Which prompt revision produced
last week's evaluation? What can it do to the outside world without asking? These are not hard
questions. They are questions nobody wrote the answer down for, and by the time they are asked —
during an incident, during a review, during a handover — the answers have to be reconstructed from
code by whoever is available.

A manifest is the answer written down. Every other standard in this pack asks a question about a
declared thing, and without a manifest there is nothing to ask about: an evaluator is reduced to
guessing at a system's shape from filenames, which is exactly the inference this pack refuses to
present as fact.

Source: item 1 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "Templates for AI system manifests" line and the lifecycle sentence of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 1 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. The boundary posture is **O**, evidenced in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json), whose substantive half
> is human judgment and carries `humanSignOff: null`.

## Scope

Applies to any repository that implements, hosts or orchestrates an AI system — anything that sends
a prompt to a model, retrieves context for one, or acts on a model's output.

It does not apply to a repository that merely mentions AI, documents it, or depends on a library
that could call a model but does not. The distinguishing question is whether a model is invoked, not
whether one is discussed.

A repository that is not an AI system is out of scope for this standard and for this pack. That is a
statement about the whole pack rather than a per-project declaration, and a project that reaches for
`not-applicable` here should check first whether it is in scope at all.

## Requirements

### R1 — Declare the system

**Every AI system MUST carry a committed manifest at `ai-system.yml` declaring at minimum its name,
its purpose, and every model it invokes.**

The manifest is a repository artifact, not a wiki page and not a diagram. It has to be committed
because it has to be diffable: the question a manifest answers most often is not "what is this
system" but "what changed", and only a versioned file answers that.

Rule `lifecycle.manifest-exists`.

### R2 — Conform to the schema

**The manifest MUST validate against
[`schemas/ai-system-manifest.schema.json`](../schemas/ai-system-manifest.schema.json).**

A manifest that does not parse is not a weaker manifest; it is no manifest at all, because every
check that reads it degrades to unevaluated at once. The schema is closed —
`additionalProperties: false` throughout — so a misspelled key is an error rather than a silently
ignored declaration.

Rule `lifecycle.manifest-valid`.

### R3 — The manifest is written, not generated and left

**A manifest MUST NOT consist of generator scaffolding.**

This requirement exists because of a specific, recorded failure elsewhere in this portfolio: a
bootstrap command wrote placeholder evidence, and the evaluator that ran next accepted it, flipping
required rules from failing to passed with no work having been done. Scaffolding is not evidence,
and a framework that accepts its own output as compliance has stopped measuring anything.

Rule `lifecycle.manifest-not-scaffold`.

### R4 — Pin the models

**Every model identifier the manifest declares MUST name a specific version rather than a moving
alias.**

A floating alias means the system under evaluation is not the system that ships. Every evaluation
result, every approval and every attestation quietly describes a different model the moment the
provider re-points the alias — and nothing in the repository changes, so nothing signals that the
basis for those records has gone.

For a model the project trained itself, reproducibility and run configuration are
MachineLearningStandards' subject and this standard adds nothing there. This requirement covers only
the identifier a deployed system names for a model it consumes.

Rule `lifecycle.model-version-pinned`.

### R5 — Declare the lifecycle stage

**A manifest SHOULD declare which lifecycle stage the system is in.**

Several obligations in this pack apply only at particular stages. A system with no declared stage is
one where nobody can say which obligations are live, and the usual resolution is that none of them
are.

*Should*, not *must*, because a stage is a judgement and a system straddling two of them is common
enough that a hard requirement would be answered with a guess.

Rule `lifecycle.stage-declared`.

### R6 — Plan retirement

**A system SHOULD record how it is decommissioned.**

Retirement is the lifecycle stage most often reached without a plan, and the one where orphaned
model credentials, undeleted personal data and still-wired call paths outlive the system that
justified them.

Rule `lifecycle.retirement-plan-exists`.

## Failure modes

| Failure | What it looks like | Caught by |
| --- | --- | --- |
| No declaration | Nobody can say which model is in production without reading code | R1 |
| Manifest drift | The manifest names a model the system stopped using two releases ago | Not caught. See [Implementation](#implementation) |
| Silent model swap | A floating alias re-points; evaluations and approvals now describe a different model | R4 |
| Bootstrap compliance | `init` writes a manifest, the evaluator accepts it, the score rises with no work done | R3 |
| Misspelled key | A declaration is silently ignored because the schema was open | R2 |
| Orphaned retirement | The system is switched off; its credentials and vector store are not | R6 |

## Evidence

| Requirement | Evidence | Form | Who can produce it |
| --- | --- | --- | --- |
| R1 | `ai-system.yml` at the repository root | Committed file | Automated |
| R2 | A clean schema validation | Validator output | Automated |
| R3 | Absence of the scaffold marker and of placeholder-only content | Validator output | Automated |
| R4 | Model identifiers that match no known alias shape | Validator output | Automated, partially |
| R5 | A `lifecycleStage` field | Committed file | Automated |
| R6 | A retirement plan referenced from the manifest | Document | Human review |

Note what none of this evidence establishes: that the manifest is **true**. Every check here reads
the manifest against itself or against a schema. Whether the declared models are the models actually
called is not established by any of it, and the [Implementation](#implementation) section says so
rather than leaving a reader to assume otherwise.

## Validation, severity, and exemptibility

<!-- BEGIN GENERATED FROM rules/lifecycle.json — DO NOT EDIT. Verified by test/standards-tables.test.mjs. -->

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R1 | `lifecycle.manifest-exists` | required | error | structural | yes |
| R2 | `lifecycle.manifest-valid` | required | error | structural | yes |
| R3 | `lifecycle.manifest-not-scaffold` | required | error | structural | yes |
| R4 | `lifecycle.model-version-pinned` | required | error | configuration | yes |
| R5 | `lifecycle.stage-declared` | recommended | warning | structural | yes |
| R6 | `lifecycle.retirement-plan-exists` | recommended | warning | manual-review | yes |

<!-- END GENERATED -->

R1 through R3 are the only rules in this release that earn `full` assurance, and it is worth being
clear about why so few do: each checks a file that this framework itself defines the shape of. That
is the only class of thing a repository scanner can be certain about. R4 is `partial` because alias
recognition is a maintained list, not a decision procedure — an unrecognised spelling is not seen,
and that gap reports as `passed`, not as not-evaluated: a pass means no recognised moving alias was
found. *Corrected 2026-09-14: this sentence previously said an unrecognised spelling appears as
unevaluated. `detectFloatingModelAlias` records a clean observation for it, which `evaluateRule()` in
`scripts/compliance.mjs` reports as `passed`.*

Nothing here is non-exemptible. A project can have a real reason a specific model identifier cannot
be pinned, and recording that reason is better than a requirement routed around.

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | A repository with no manifest fails | No `ai-system.yml` | `valid-manifest/` must pass |
| R2 | A manifest missing a required field fails | Any schema violation | `valid-manifest/` must pass |
| R3 | A scaffold manifest fails | The marker, or placeholder-only content | A partially-filled manifest must **not** be reported as scaffolding |
| R4 | `claude-sonnet-latest` fails | An identifier matching a known alias shape | `pinned-model/` must pass, and prose naming an alias must not fire |
| R5 | A manifest with no stage warns | No `lifecycleStage` | — |
| R6 | No falsifier is automated | — | — |

The R3 negative control is the one that matters. A threshold of "most values are placeholders" would
fire on a project halfway through adoption, which is the honest state of every project on its first
day, and a rule that punishes the honest halfway state gets switched off.

## Exceptions and staleness

Every rule here is exemptible. The exception and attestation mechanisms themselves are Phase 4 scope
and do not exist in this release; until they do, a project's only honest options are to meet a rule,
to declare it not-applicable with a reason, or to leave it failing.

An applicability declaration is a claim about the project, not about the rule. It stops being true
the moment the project gains the capability, which is what `revisitWhen` records. A declaration
without one is a claim with no expiry, and the schema requires a reason precisely so that an entry
nobody can justify is visibly different from a rule somebody forgot.

## Additions this standard makes beyond the source

- **The manifest's field set** — models, prompts, tools, data sources, autonomy tier, lifecycle
  stage. The brief asks for "templates for AI system manifests" and does not say what a manifest
  contains. The contents are this repository's own claim.
- **R3 in its entirety.** Scaffolding-is-not-evidence is not in the brief. It is authored, and the
  reason it exists in the first release rather than after an incident is recorded in
  [`scripts/scaffolding.mjs`](../scripts/scaffolding.mjs).
- **R4's presence in this standard rather than in a lineage standard.** Model pinning belongs to
  Standard 30 conceptually; it is required here because in this release the manifest is the only
  place a model is declared at all. This is a structural decision, not a claim about where the
  requirement belongs long-term.
- **R5 and R6**, which decompose the brief's lifecycle sentence into two declarations. The brief
  names the lifecycle; the obligations are authored.

## Relationship to other standards and ADRs

[Standard 3](03-machine-readable-ai-policy.md) governs the policy that selects this standard for a
project. [Standard 5](05-verdict-vocabulary.md) governs what a failure here reports as.
[Standard 45](45-approval-gates.md) reads the manifest's tool list, and its
`gate.tool-permission-manifest` is owed only when this manifest declares tools — which is why an
unreadable manifest withdraws that rule rather than failing it.
[Standard 7](07-boundary-with-adjacent-standards.md) records why R4 defers to
MachineLearningStandards for trained models.

Outside this repository: **MachineLearningStandards** owns dataset provenance, dataset versioning,
feature lineage and reproducibility. Where this standard names a data source, it is recording that
the source exists; it is not restating ML's requirements about it, and a project that trains models
answers to ML's standards for that work.

## Implementation

**Normative. Four of six requirements have a detector, and none of them establishes that the
manifest is true.**

| Requirement | Rule | State |
| --- | --- | --- |
| R1 | `lifecycle.manifest-exists` | **Evaluated.** Checks for a file at a known name |
| R2 | `lifecycle.manifest-valid` | **Evaluated.** Schema conformance |
| R3 | `lifecycle.manifest-not-scaffold` | **Evaluated.** Marker plus placeholder-substance |
| R4 | `lifecycle.model-version-pinned` | **Evaluated, partially.** Matches a maintained list of alias shapes |
| R5 | `lifecycle.stage-declared` | **Not evaluated in this release.** Reported unevaluated, never passed |
| R6 | `lifecycle.retirement-plan-exists` | `manual-review`. No detector, here or planned |

**`standards audit` cannot detect manifest drift, and this standard does not pretend otherwise.** A
manifest naming a model the system stopped calling looks identical to a correct one: both are
well-formed files with a plausible identifier. Establishing that the declared models are the invoked
models requires reading call sites and resolving the identifiers they pass, which is Phase 3 work
and is not claimed here.

What the checks in this release do establish is narrower and worth stating plainly: that a project
has *declared* its system, in a form that parses and is not a template. That is a precondition for
the declaration being true, and it is not the same thing.
