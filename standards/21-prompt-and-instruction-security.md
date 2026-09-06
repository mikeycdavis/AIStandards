# Standard 21 — Prompt and Instruction Security

A prompt is the largest untested surface in most AI systems. It is edited more often than the code
around it, reviewed less, versioned rarely, and it changes behaviour more than most code changes do —
a sentence added to a system prompt can alter what a system refuses, what it discloses, and what
tools it reaches for, with no diff anyone treated as a behaviour change.

Underneath that is a harder problem. A model has one channel, and everything arriving on it competes
for authority: the developer's instructions, the user's message, a retrieved document, a tool's
output. Prompt injection is not an exotic attack. It is the default behaviour of a system that never
decided which of those things is allowed to give orders.

Source: item 21 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "Prompt, tool, agent, and retrieval security" bullet of
[`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 21 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. The boundary posture is **O**, evidenced in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json), whose substantive half
> is human judgment and carries `humanSignOff: null`.

## Scope

Applies to any system that constructs a prompt — which includes any system that concatenates a user
message, a retrieved document or a tool result into what it sends a model.

It does not apply to a repository that stores prompt text without sending it anywhere, such as a
prompt library or this repository's own documentation. The distinguishing question is whether an
instruction channel exists.

This standard has **no existing owner in the portfolio**. MachineLearningStandards contains no
prompt-as-subject content, and EngineeringStandards' `ai.*` rules govern an agent building software
rather than prompts inside a product. Nothing here defers.

## Requirements

### R1 — Prompts are versioned artifacts

**A system prompt MUST be stored as a committed file that can be diffed, reviewed and rolled back.**

A literal buried in a call site has no version, no reviewer and no rollback path. When behaviour
changes and someone asks what changed, a file-backed prompt answers in a diff; an inline one requires
reconstructing history from memory.

Rule `promptsec.prompt-is-versioned-artifact`.

### R2 — Instruction text does not live at the call site

**Instruction text passed to a model SHOULD NOT be an inline literal.**

*Should*, not *must*, and the difference is deliberate. A short inline instruction is sometimes the
honest shape of a small system, and a required rule here would be switched off rather than met —
which would cost more than the rule is worth. R1 carries the requirement; this carries the advice,
and it reports as a warning.

Rule `promptsec.no-inline-system-prompt`.

### R3 — Write down the trust boundary

**A system MUST maintain a threat model recording where untrusted content enters the instruction path
and what bounds its authority.**

Prompt injection is not a bug class that testing finds incidentally, because there is no crash and no
error — the system does exactly what the injected text said. A system with no written trust boundary
has one anyway; it is simply unstated, and therefore unreviewed and unable to be violated on purpose.

Rule `promptsec.threat-model-exists`.

### R4 — Secrets never enter context

**A credential MUST NOT be placed into a prompt, a context window, or a retrieved document.**

A secret in a context window is a secret in every trace, every log, every eval fixture and every
provider's retention window — and it is extractable by precisely the injection this standard exists
to bound. Where a tool needs a credential, the tool holds it; the model asks the tool.

Rule `promptsec.no-secrets-in-context`, **non-exemptible**. The bounding qualifier is internal to the
requirement: there is no system that legitimately needs a live credential inside model context, so
there is no situation an exception would describe.

### R5 — Interpolated values do not become instructions

**A value interpolated into a prompt template MUST NOT be able to acquire instruction authority.**

This is the requirement most systems fail, and the one this framework cannot check. Whether a guard
holds is a property of the model's behaviour on adversarial input, not of the guard's source code —
a delimiter scheme that looks rigorous in a diff may be ignored by the model under a long enough
prefix.

Rule `promptsec.template-injection-guarded`, **`not-evaluable`**. See
[Implementation](#implementation) for what that means and does not mean.

## Failure modes

| Failure | What it looks like | Caught by |
| --- | --- | --- |
| Untracked behaviour change | Output changes; nobody can point at what altered | R1 |
| Prompt archaeology | Reconstructing last month's prompt from a chat log | R1 |
| Unstated trust boundary | Retrieved content is instruction, and nobody decided that | R3 |
| Credential exfiltration | An injected instruction returns the key that was in context | R4 |
| Delimiter theatre | A guard that reads as rigorous and is ignored by the model | R5 — and **not** by any check |
| Assembled prompt | A prompt built from fragments; every static check misses it | Not caught. See Implementation |

## Evidence

| Requirement | Evidence | Form | Who can produce it |
| --- | --- | --- | --- |
| R1 | Prompt files under version control, loaded by reference | Committed files | Automated, partially |
| R2 | Absence of a long instruction literal at a call site | Detector output | Automated, partially |
| R3 | A threat model naming the untrusted inputs and their bounds | Document | Human review |
| R4 | Absence of credential shapes in prompt assets | Detector output *(Phase 3)* | Automated, partially |
| R5 | **Nothing in the repository suffices.** A recorded adversarial exercise against the running system | Red-team artifact *(Phase 2 standard)* | An exercise, not a reader |

R5's row is the honest one and is stated rather than softened. There is no artifact in a repository
that demonstrates a model resists injection, because the artifact a resistant system produces looks
exactly like the artifact a vulnerable one produces. What can be produced is a *record of an attempt*
— which is a different rule, in a different standard, about a different object.

## Validation, severity, and exemptibility

<!-- BEGIN GENERATED FROM rules/promptsec.json — DO NOT EDIT. Verified by test/standards-tables.test.mjs. -->

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R1 | `promptsec.prompt-is-versioned-artifact` | required | error | code-analysis | yes |
| R2 | `promptsec.no-inline-system-prompt` | recommended | warning | code-analysis | yes |
| R3 | `promptsec.threat-model-exists` | required | error | document | yes |
| R4 | `promptsec.no-secrets-in-context` | forbidden | error | code-analysis | **no** |
| R5 | `promptsec.template-injection-guarded` | required | error | not-evaluable | yes |

<!-- END GENERATED -->

R1 and R2 are `partial` assurance because the detector recognises literals. A prompt assembled from
concatenated fragments, loaded from a database, or fetched at runtime is invisible to it — so
**absence of a finding is not evidence that prompts are file-backed**, and the rule's
`$assuranceNote` says exactly that.

R5's `not-evaluable` is not a weaker version of `manual-review`. Manual review would mean a human can
establish it by reading the repository; `not-evaluable` means no one can, because the subject is not
in the repository.

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | A 200+ character literal at a `system:` parameter fails | Such a literal | `file-backed-prompt/` must pass |
| R2 | The same fixture warns rather than fails | It reports `failed` | — |
| R1, R2 | Prose and comments describing inline prompts do not fire | A finding on `mentions-only/` | **This is the control that matters** |
| R3 | No detector in this release | — | — |
| R4 | No detector in this release. Phase 3 | — | — |
| R5 | **No falsifier exists, and none is invented** | — | — |

The `mentions-only/` control is the one that decides whether these rules survive contact with a real
repository. A codebase whose README explains why inline prompts are a bad idea, and whose comments
record that one was removed, must produce zero findings — including a Python file where `//` is floor
division rather than a comment, since scanning it with JavaScript rules would discard the rest of the
file and could just as easily hide a real finding as invent one.

## Exceptions and staleness

R1, R2, R3 and R5 are exemptible. R4 is not, per above.

The exception mechanism does not exist in this release — Phase 4 — so a project's honest options are
to meet a rule, declare it not-applicable with a reason, or leave it failing.

R3's threat model is the artifact here most prone to going stale, because it describes a trust
boundary that moves whenever a new data source is added. No staleness check exists for it in this
release; digest-based review freshness is Phase 4, and until then a threat model's date is the only
signal and nothing enforces it.

## Additions this standard makes beyond the source

- **The R1/R2 split.** The brief names "prompt security" as a subject. Making prompt versioning a
  required rule and inline-literal avoidance a recommended one — rather than a single requirement —
  is this repository's own decision, taken because a single required rule would be routed around.
- **R4's non-exemptibility**, and the internal-qualifier argument for it.
- **R5's `not-evaluable` classification.** The brief permits the validation type; the decision that
  injection resistance falls into it, rather than into manual review, is authored, and it is the
  clearest instance in this release of refusing to claim a check the framework cannot make.
- **The 200-character threshold**, which is a chosen number and not a derived one. It is the point
  below which an inline instruction is more likely a label than a prompt; it will be wrong in some
  direction for some codebase.

## Relationship to other standards and ADRs

[Standard 1](01-ai-system-manifest.md) holds the prompt declarations this standard's evidence refers
to. Standard 23, Agent Execution Security *(Phase 2)* owns retrieved content acquiring
instruction authority, which is R5's most dangerous instance and is a rule of its own there.
[Standard 45](45-approval-gates.md) is what stands between a successful injection and an effect in
the world — this standard reduces the chance of the first, and that one bounds the consequence.
[Standard 5](05-verdict-vocabulary.md) governs how R5's `not-evaluable` status is reported: beside
the verdict, changing neither status nor score.
Standard 35, Red Teaming *(Phase 2, not yet written)*, will own the exercise that is R5's only real
evidence.

Outside this repository: nothing. This standard has no counterpart in any adjacent pack, and defers
to none of them.

## Implementation

**Normative. Two of five requirements have a detector, one is honestly unevaluable, and two await
Phase 3.**

| Requirement | Rule | State |
| --- | --- | --- |
| R1 | `promptsec.prompt-is-versioned-artifact` | **Evaluated, partially.** Recognises a long literal at a known instruction parameter |
| R2 | `promptsec.no-inline-system-prompt` | **Evaluated, partially.** Same detection, warning severity |
| R3 | `promptsec.threat-model-exists` | **Not evaluated in this release.** Reported unevaluated, never passed. Phase 3 |
| R4 | `promptsec.no-secrets-in-context` | **Not evaluated in this release.** `forbidden` and unexamined, so it reports `prohibited-but-unestablished` and caps the verdict rather than passing quietly |
| R5 | `promptsec.template-injection-guarded` | **`not-evaluable`.** No detector, and none is planned |

**The detector for R1 and R2 finds one shape of one problem.** It matches an instruction parameter
followed by a long literal. It does not follow variables, does not resolve concatenation, does not
read templates, and does not know whether a file-backed prompt is *reviewed* — only that it is a
file. A system that assembles its prompt from three fragments passes this check and may satisfy
nothing the standard actually asks for.

**R4 is worth reading carefully as an example of the verdict vocabulary working.** It is a
`forbidden` rule that nothing in this release examines. It does not pass. It reports as
`prohibited-but-unestablished` and prevents a `COMPLIANT` status — because a prohibition nobody
looked for is not a prohibition anybody is meeting, and the alternative is a clean report for a
repository with a credential in a prompt file.
