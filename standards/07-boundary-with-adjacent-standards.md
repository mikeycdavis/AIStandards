# Standard 7 — Boundary with Adjacent Standards Packs

This pack did not arrive first. It ships into a portfolio where EngineeringStandards already governs
agent operability and approval for application capabilities, MachineLearningStandards already governs
reproducibility, provenance, evaluation and drift, UIUXDesignStandards already governs accessibility
and how an AI disclosure is presented, and PredictionStandards already governs per-prediction
support.

Two packs governing one repository is not a problem in itself. Two packs governing one repository
while disagreeing about the same requirement is, and there is no mechanism anywhere in the portfolio
to reconcile it: the enforcement layer runs each pack's evaluator and reads each pack's status. If
they contradict, both are reported and nobody is right.

This standard is how that is prevented. It is the only standard in this pack whose subject is other
packs.

Source: item 7 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md).

> **Numbering is frozen by the specification.** Item 7 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. The boundary posture is **O**, evidenced in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json), whose substantive half
> is human judgment and carries `humanSignOff: null`.
>
> **This item is authored, not derived.** The brief does not know the adjacent packs exist and asks
> for nothing about them. Every requirement below is this repository's own claim, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section says so in full rather than
> in part. This is the most important honest disclosure in the catalog: without this standard, the
> pack would restate EngineeringStandards and MachineLearningStandards silently.

## Scope

Applies to every rule and every standard in this pack, and to any proposal to add one.

It does not attempt to bind the other packs. Nothing here obliges EngineeringStandards to change
anything, and nothing here is negotiated with its maintainers — this standard constrains what
*AIStandards* may claim, which is the only thing this repository has the standing to constrain.

## Requirements

### R1 — Ownership is divided, and the division is written down

**This pack MUST record which concerns it owns and which it defers, and the division MUST be
resolvable to a named standard in the owning pack.**

The division below was checked against the named packs on 2026-09-04 and the evidence — the scope
statement read, the commit it was read at — is recorded per item in
[`artifacts/boundary-review.json`](../artifacts/boundary-review.json). Four postures changed on that
evidence and two were narrowed; `node scripts/inventory.mjs` now fails if any deferring item loses
its evidence, or if an item claiming to be owned outright is not on the list of concerns searched
for an owner.

| Concern | Owner | AIStandards' position |
| --- | --- | --- |
| Reproducibility, random seeds, run configuration | MachineLearningStandards | Defers. Adds only remote-endpoint nondeterminism |
| Dataset provenance and versioning, feature lineage | MachineLearningStandards | Defers. Adds only retrieval corpora, prompt fixtures and eval sets |
| Metric selection, calibration, model comparison, drift | MachineLearningStandards | Defers. Adds only generative framing — rubrics, judges, non-numeric output |
| Model cards and dataset cards | MachineLearningStandards | Defers entirely. Cites the templates; copies neither |
| Accessibility, and how a disclosure is presented | UIUXDesignStandards | Defers. Owns only *whether* disclosure is owed |
| Per-prediction support verdicts | PredictionStandards | Defers. Produces no per-output verdict |
| Uncertainty and abstention on a **prediction record** | PredictionStandards | Defers. Owns the general case, because PredictionStandards' rules report not-applicable where no record exists |
| How a citation's sources are presented | UIUXDesignStandards | Defers. Owns only whether a citation is owed and whether it resolves |
| Approval gates for model-initiated actions | **AIStandards** | Owns, canonically. See R3 |
| Prompt, tool, agent and retrieval security | **AIStandards** | Owns. No existing owner in the portfolio |
| AI safety, misuse, human oversight | **AIStandards** | Owns. No existing owner |
| Personal data in prompts, traces and eval sets | **AIStandards** | Owns. No existing owner |
| Grounding and hallucination control | **AIStandards** | Owns outright. No pack governs it; see R3 on the crosswalk that was withdrawn |
| Capability honesty | **AIStandards** | Owns, canonically. See R3 |
| Fairness and harm distribution | **AIStandards** | Owns. No existing owner |
| Inference cost, token budgets, generative latency | **AIStandards** | Owns. No existing owner |

### R2 — Link, do not copy

**Where this pack requires a control another pack owns, it MUST reference that pack's standard and
MUST NOT restate its requirement in local words.**

A restatement is a fork. It drifts on the first amendment to the original, and from then on a project
satisfying one is in breach of the other with no way to tell which is current.

Where an AI system is **not** a machine-learning system, this pack MAY define the applicable baseline
directly, because no ML standard governs it. That is an addition, not a substitution, and it says so
where it appears.

*Corrected 2026-09-15: this paragraph gave "a retrieval application over a hosted model, which trains
nothing" as an example of such a system, and said no ML standard governs a system with no training
run. Neither follows. Using a hosted model, or having no training pipeline, does not by that fact place
a system outside MachineLearningStandards: whether that pack's evaluation standards reach a hosted
model the project did not train is recorded as unknown in
[`artifacts/boundary-review.json`](../artifacts/boundary-review.json) (item 17), and nothing in that
pack resolves it. The permission itself is unchanged.*

### R3 — Canonical AI-facing rules are this pack's, and the crosswalk is semantic

**This pack MUST own its AI-facing rule identities, MUST record the EngineeringStandards rules they
correspond to as crosswalks, and MUST NOT re-mint a foreign id.**

| AIStandards (canonical) | Foreign precedent | Pack |
| --- | --- | --- |
| `gate.actions-classified`, `gate.irreversible-approval` | `ai.destructive-approval`, `ai.propose-execute` | EngineeringStandards |
| `gate.irreversible-approval` | `ai-ux.proposal-vs-execution` | UIUXDesignStandards |
| `gate.no-self-approval` | `ai.no-safety-bypass` | EngineeringStandards |
| `honesty.no-fabricated-capability-claim` *(later phase)* | `ai.no-fabricated-capabilities` | EngineeringStandards |
| `honesty.no-fabricated-capability-claim` *(later phase)* | Standard 26 R8, anthropomorphism | UIUXDesignStandards |
| `eval.no-fabricated-results` | `testing.no-fabricated-results` | EngineeringStandards |
| `cost.provider-portable` *(later phase)* | `ai.provider-neutral` | EngineeringStandards |
| *not claimed* | `ai.non-ui-capabilities` | EngineeringStandards |

**One crosswalk was withdrawn by the boundary review.** The approved plan crosswalked grounding and
hallucination control to `ai.no-fabricated-capabilities`. That rule's subject is an engineering agent
inventing APIs and repository facts, not a deployed system generating ungrounded output for a user,
and recording it would have asserted a correspondence that does not hold. A false crosswalk is worse
than none, because it implies a division of ownership nobody made. Grounding is owned outright, and
UIUXDesignStandards' `ai-ux.no-generated-as-verified` is recorded as an adjacency rather than a
precedent.

`ai.non-ui-capabilities` is deliberately **not** claimed. It is a general software-operability
requirement with no AI-specific content, and EngineeringStandards is its right home. Claiming it
would be scope growth dressed as boundary-drawing.

**Both versions MUST NOT be carried as independently authoritative.** The crosswalk states which pack
is canonical for AI systems, and it is this one; EngineeringStandards' rules remain its own and are
not migrated.

### R4 — Never shadow a foreign identity

**No rule id in this catalog may equal any rule id or alias defined by another pack.**

Enforced at catalog load for the namespace, and by test against a recorded inventory for full ids.
The inventory in [`artifacts/foreign-namespace-inventory.json`](../artifacts/foreign-namespace-inventory.json)
holds **560 ids and aliases across nine packs**, read at recorded commits. No id in this catalog
collides with any of them.

Two namespaces are refused outright at catalog load: `ai.*` and `ai-ux.*`.

**A reserved segment is not an exclusive one.** Six of this pack's seventeen segments are also used
elsewhere — `lifecycle.` and `agent.` (MathematicsStandards), `privacy.` (UIUXDesignStandards),
`observability.` (EngineeringStandards), `disclosure.` (FinancialStandards), `invariant.`
(MachineLearningStandards). R4 forbids a colliding full id, not a shared segment, and no full id
collides. They are listed in `SHARED_SEGMENTS` in `scripts/catalog.mjs` because the approved plan
claimed these segments were disjoint and the boundary review found they are not. An undeclared
overlap is a claim nobody checked; the next `disclosure.*` rule minted here needs to know
FinancialStandards has seven.

### R5 — Conflicts resolve to the specialist, then to the stricter

**Where two packs govern one concern, the more specialised pack's requirement governs its own domain;
where both genuinely apply, the stricter compatible requirement applies.**

Order matters. Specialisation first, because a general rule that overrode a specialist one would make
the specialist pack pointless. Strictness second, and only among requirements that are compatible —
two requirements that cannot both be satisfied are a boundary defect to be fixed, not a conflict to
be resolved by picking one.

### R6 — StandardsOrchestrator is not an authority

**This pack MUST NOT conform to StandardsOrchestrator.**

Its `FROZEN.md` states plainly that it "is not the portfolio's standards authority, and must not be
adopted as one"; development was frozen on 2026-08-10 at v1.0.0. Its design placed adapters centrally
rather than in the packs; StandardsEnforcer's pack-owned design is the one in use. This pack conforms
to StandardsEnforcer only.

### R7 — The ML dependency is expressed in band

**Where this pack requires a control MachineLearningStandards owns, it MUST express the dependency
through its own verdict, because the enforcement contract has no field for it.**

This is a workaround, and calling it anything else would be dishonest. The adapter schema is
`additionalProperties: false` at every level with only `schemaVersion`, `standard`, `evaluation` and
`result`, and its `$absentByDesign` notes contemplate no composition or dependency field — so a pack
cannot declare that another pack must also govern a repository.

The mechanism instead is a rule, `boundary.ml-pack-required` *(Phase 2)*, which fails when a target
presents machine-learning evidence and carries no MachineLearningStandards policy. The dependency
then rides this pack's own verdict, which the enforcement layer already reads.

**If the enforcement contract later gains composition, migrate to it and deprecate the rule.** A
workaround that outlives its reason becomes a second mechanism nobody remembers the purpose of.

## Failure modes

| Failure | What it looks like | Caught by |
| --- | --- | --- |
| Silent restatement | This pack restates an ML requirement; the two drift on ML's next release | R2 |
| Two owners, one id | Both packs report on `ai.destructive-approval` and disagree | R3, R4 |
| Scope growth | This pack claims a general software rule because it was adjacent | R3 |
| Frozen authority | A pack conforms to a design its own repository disowns | R6 |
| Undeclared dependency | An ML system is governed by this pack alone, and nobody notices ML is absent | R7 |
| Boundary rot | The division is written once and never re-checked against the packs it names | See Implementation |

## Evidence

| Requirement | Evidence | Form | Who can produce it |
| --- | --- | --- | --- |
| R1 | `artifacts/boundary-review.json` — the scope statement read from each named standard, and the commit | Recorded evidence; shape checked by `inventory.mjs`, substance by human review | Human for the judgment |
| R2 | Every deferring standard's Scope section names the owning standard | Human review | Human |
| R3 | `crosswalk` entries in the catalog naming pack, rule and relationship | Committed catalog | Automated for shape |
| R4 | A namespace test, and a full-id check against a recorded foreign inventory | Test | Automated |
| R5 | No evidence is possible in advance; it is a resolution rule, applied when a conflict is found | — | — |
| R6 | The absence of any StandardsOrchestrator conformance | Test | Automated |
| R7 | The rule exists and fires | Test | Automated *(Phase 2)* |

R1's evidence is now two things that must not be confused. The **observation** — that
MachineLearningStandards Standard 15 scopes itself to "every experiment whose result is reported,
compared against, or used to justify a decision" — is recorded and re-readable. The **judgment**
that this pack's Standard 31 therefore defers rather than restates is inference, and
[`artifacts/boundary-review.json`](../artifacts/boundary-review.json) marks it as such and records
`humanSignOff: null`. `inventory.mjs` checks that the evidence exists; no check reads both documents
and decides what they mean.

## Validation, severity, and exemptibility

This standard has no catalog rules of its own in this release; it is enforced through the crosswalk
shape checks at catalog load, the namespace test, and human boundary review.

**R3, R4 and R6 are not exemptible.** Shadowing a foreign identity, or conforming to a frozen
authority, are not things a project circumstance makes reasonable. R1, R2 and R5 are review
obligations rather than rules, and cannot be excepted because there is nothing to except.

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R3 | Every crosswalk names pack, rule and relationship | An incomplete entry loads | A real crosswalk must load |
| R4 | No id starts with `ai.` or `ai-ux.` | Such an id loads | Every reserved namespace loads |
| R4 | No id equals a recorded foreign id | A collision | — |
| R6 | No file references StandardsOrchestrator as an authority | A conformance reference | Referring to it as *frozen* must be allowed |
| R1, R2 | **No falsifier is automated.** Boundary review is human | — | — |

R6's negative control is not incidental. A test that failed on any mention of StandardsOrchestrator
would fail on this very document, which names it in order to refuse it — the test must distinguish
citing a thing from conforming to it, which is the use/mention split applied to governance.

## Exceptions and staleness

R1's table is the part of this standard most likely to become quietly false, because it describes
other repositories and they change without notice. It is **not** subject to any automated staleness
check in this release, and treating it as current without re-reading the packs it names would be
exactly the unverified inheritance this standard exists to prevent.

The boundary review ran on 2026-09-04 and its evidence is committed. That converts the table from a
proposal into a **dated observation**, which is a smaller claim than it may look: the observation was
true of nine repositories at nine recorded commits, and there is no mechanism anywhere that notices
when one of those scopes is amended. The review itself records this as unresolved. Re-reading the
named standards is a human action, and nothing in this pack will prompt it.

## Additions this standard makes beyond the source

**All of it.** This standard corresponds to no line in the brief, which does not know the adjacent
packs exist. Specifically authored:

- The entire ownership division in R1.
- R2's link-don't-copy rule and the non-ML baseline carve-out.
- R3's crosswalk table, the decision that this pack is canonical for AI-facing rules, and the
  decision **not** to claim `ai.non-ui-capabilities`.
- R4's non-shadow list.
- R5's two-step conflict resolution.
- R6, which is a response to an observed `FROZEN.md` rather than to anything in the brief.
- R7 in full, including the admission that it is a workaround for a contract gap.

## Relationship to other standards and ADRs

[Standard 6](06-standard-structure-and-rule-identity.md) R6 is the general form of R3 and R4; this
standard is the specific list. [Standard 1](01-ai-system-manifest.md) R4 and
[Standard 45](45-approval-gates.md) are the two standards in this release that actually carry
crosswalks, and are the worked examples. [Standard 3](03-machine-readable-ai-policy.md) R1 is why
this pack's policy file cannot merge with EngineeringStandards'.

Outside this repository: **StandardsEnforcer** is the only authority this pack conforms to.
**StandardsOrchestrator** is frozen and is cited here solely in order to refuse it.

## Implementation

**Normative. Enforced mechanically for identity; not at all for the boundary itself.**

| Requirement | State |
| --- | --- |
| R1 | **Evidence enforced, judgment not.** `inventory.mjs` fails if a deferring item records no evidence, if a posture disagrees between the specification and the review, or if an item claiming outright ownership was never searched for an owner. Whether the recorded evidence *supports* the posture is human review |
| R2 | `manual-review`. No check reads two documents and decides whether one restates the other |
| R3 | **Enforced for shape** at catalog load. Whether a crosswalk is *correct* is human review |
| R4 | **Enforced** for namespaces at load, and by test for the recorded foreign ids |
| R5 | Not evaluable. It is a resolution procedure, applied by people when a conflict is found |
| R6 | **Enforced by test** |
| R7 | **Not implemented.** `boundary.ml-pack-required` is Phase 2 |

**Nothing in this release verifies that the boundary holds.** The checks that exist prevent a
*collision* — two packs using one identity — and now also prevent an *unevidenced* deferral: a
posture with no named standard behind it fails `inventory.mjs`. Neither is the substantive half.
Whether this pack restates a requirement another pack owns is a judgement about the meaning of two
documents, and it is made by a human reading both or it is not made at all. The boundary review's
`humanSignOff` is `null` and must not be read as anything else.

The foreign-id inventory the R4 test reads is a checked-in snapshot pinned to the repositories, tags
and commits it was read from. It can only be *behind*, never permissive: a rule added to another pack
after the snapshot would not be caught until the snapshot is refreshed, and refreshing it is a human
action with a changelog entry rather than an automatic one.
