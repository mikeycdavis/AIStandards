# AIStandards — Derived Specification

This file is the enumeration that turns [the brief](original_prompt.md) into fifty-three numbered
items. It is **derived from** the brief and is **not** the brief. The brief is never edited; this
file is edited whenever the enumeration is corrected, and every correction is recorded here.

Two checks read this file and nothing else may substitute for them:

- `node scripts/fidelity.mjs` — every block marked verbatim is the brief's own words.
- `node scripts/inventory.mjs` — every derived item resolves to a real token in the brief, and every
  authored item is declared as authored.

**Neither check can establish that an item is a *good* standard.** They establish only that nothing
was invented and presented as the brief's, and that nothing the brief asked for was dropped.

---

## Provenance classes

Every item and every quoted block carries exactly one class. There are three, one more than the
two-class scheme a sibling pack uses, because that scheme has no way to say "this is ours".

| Class | What it is | How it may be cited | Checked by |
| --- | --- | --- | --- |
| **D — Derived** | An item title standing for a subject token that appears in the brief | as *the brief's subject* — never as the brief's wording | `inventory.mjs`: the token must be a real substring of the brief |
| **V — Verbatim** | The brief's own words, reproduced without alteration | as *the brief's words* | `fidelity.mjs`: byte comparison against the brief |
| **A — Authored** | This repository's own decision. Normative intent, grouping, every prohibition, and the machinery the brief does not describe | as *the specification's* — **never** as the brief's | `inventory.mjs`: must be listed under [Authored items](#authored-items), and the implementing standard must carry a non-empty `## Additions this standard makes beyond the source` section |

**A class-A item is not a lesser item.** It is an item whose authority is this repository's judgment
rather than the brief's instruction, and the only failure available is failing to say so.

### The one normalization applied to verbatim comparison

`original_prompt.md` is stored with CRLF line endings and this repository has no `.gitattributes`
pinning them, so a checkout on another platform may hold the same words with LF. `fidelity.mjs`
therefore normalizes CRLF to LF **on both sides** before comparing, and reports whether the raw
bytes also matched.

This is a declared limitation, not a softening: a line-ending difference is a storage encoding and
not a change of words, and failing on it would make the check fail for a reason unrelated to what it
exists to catch — which is the fastest route to a check being disabled. Every other difference,
including whitespace within a line, fails.

---

## Verbatim material

These blocks are the brief's words. `fidelity.mjs` asserts each appears in `original_prompt.md`
character for character.

### V1 — the subject areas

```verbatim
* AI safety, misuse prevention, and human oversight
* Data privacy, provenance, consent, retention, and access control
* Model evaluation, benchmark integrity, robustness, and regression testing
* Prompt, tool, agent, and retrieval security
* Hallucination, uncertainty, citation, and capability honesty
* Reproducibility, versioning, model/data lineage, and rollback
* Observability, incident response, red teaming, and auditability
* Accessibility, fairness, transparency, and user disclosure
* Cost, latency, environmental impact, and operational resilience
* Approval gates for high-impact, destructive, autonomous, or externally visible actions
```

### V2 — what every standard must state

```verbatim
Use one numbered normative document per standard. Each standard must clearly state:

1. Scope and applicability
2. Normative requirements using MUST, MUST NOT, SHOULD, and MAY
3. Rationale and failure modes
4. Evidence required to demonstrate compliance
5. Automated, manual-review, or not-evaluable validation type
6. Severity and non-exemptibility
7. Minimum tests and falsifiers
8. Exceptions, attestations, expiry, and review-staleness rules
9. Related standards and ADRs
```

### V3 — the six-way distinction

```verbatim
* A clear distinction between passed, failed, warning, skipped, not-evaluated, and prohibited-but-unestablished
```

### V4 — the honesty constraint

```verbatim
Do not invent historical intent, test results, approvals, reviewers, model capabilities, or compliance evidence. Preserve uncertainty explicitly. Never weaken a test, policy, standard, or evidence requirement merely to make a gate pass.
```

V4 governs this file more than any other. An item claiming a derivation it does not have would be
inventing the brief's intent, which is the first thing V4 forbids.

---

## Derivation

### Tokenisation

Each of V1's ten bullets is a comma-and-`and` list of subject tokens. Tokenising all ten yields
**forty** tokens. Each token becomes one item, in the brief's order, with three declared departures.

> **Correction, 2026-09-04.** The approved plan recorded thirty-seven tokens. It was marked inferred
> and had not been counted against the text. The count is forty; the plan's arithmetic was wrong and
> is corrected here rather than preserved. The **item** total is unchanged at thirty-nine, because
> the departures below absorb the difference — but the discrepancy is recorded rather than smoothed
> over, since a count nobody checked is exactly what this review exists to catch.

**Departure 1 — merge.** `high-impact` and `destructive` are one gate with two triggers, not two
gates. They become item 45 together, and its recorded token spans both. **−1 item.** This is the
only departure that changes the count.

**Departure 2 — relocation, not a count change.** Bullet 10's `autonomous` becomes item 11, in Band
B beside human oversight, rather than sitting among the approval gates. Autonomy level is the
property that decides *whether* a gate is owed; grouping it with the gates would make the gates
define their own trigger. The token keeps its 1:1 item; only its position moves.

**Departure 3 — nothing is dropped.** A token whose subject another pack owns still gets an item,
whose Scope section defers. A silently dropped token is precisely what `inventory.mjs` exists to
catch, and an item that says "this is deferred to MachineLearningStandards Standard 15" is a
coverage record; an absent item is a hole nobody can see.

40 − 1 = **39 domain items**, covering all forty tokens. One item (45) carries a token spanning two
of them; every other item is 1:1.

### Machinery and prohibitions

**Seven machinery items (1–7).** Five derive from the brief's "Also create" list and its section
list; two are authored.

> **Correction, 2026-09-04.** The plan recorded "six mapped line-by-line, one authored". Item 2 (AI
> Risk Tiering and Applicability) has no corresponding token anywhere in the brief. It is authored.
> The split is five derived and two authored.

**Seven prohibition items (47–53).** Class A in full. The brief contains no prohibition section, so
every must-never requirement is this repository's own. Each names the positive token it is the
negative face of; a prohibition that cannot name one is rejected during authoring, because it would
be a rule with no subject in the brief and no declared author either.

**7 + 39 + 7 = 53 items.**

The coincidence with EngineeringStandards' fifty-three is arithmetic accident. Nothing follows from
it and nothing should be read into it.

---

## Boundary posture

Recorded per item, and evidenced in
[`artifacts/boundary-review.json`](../boundary-review.json), which names the adjacent-pack standard
and the commit it was read at.

| Posture | Meaning |
| --- | --- |
| **O** | Owned outright. No other pack in the portfolio governs any part of it |
| **B** | Baseline. This pack states the requirement and defers a **named** half to the pack that owns it |
| **X** | Crosswalked. This pack is canonical; a foreign rule is recorded as precedent, never re-minted |
| **D** | Deferred. Another pack owns it; this pack states the obligation, names the owner, and mints no rule |

> **The `B` legend was generalised by the boundary review.** The plan defined `B` as
> "baseline for non-ML AI systems, defers to ML for ML systems". The review found three items whose
> deference is to UIUXDesignStandards or PredictionStandards rather than MachineLearningStandards,
> which the ML-specific wording could not express. `B` now names its own owner per item.

---

## The catalog

`Class` is D, V or A. `Derived from` is the exact substring of the brief a class-D item resolves to —
`inventory.mjs` asserts it is present in `original_prompt.md`. Class-A items carry `—` and appear
under [Authored items](#authored-items).

### Band A — Foundations

| # | Title | Class | Derived from | Posture | Implemented by |
| --- | --- | --- | --- | --- | --- |
| 1 | AI System Manifest | D | `AI system manifests` | O | standards/01-ai-system-manifest.md |
| 2 | AI Risk Tiering and Applicability | A | — | O | standards/02-ai-risk-tiering-and-applicability.md |
| 3 | Machine-Readable AI Policy | D | `machine-readable policy schema` | O | standards/03-machine-readable-ai-policy.md |
| 4 | Evidence, Attestations, Expiry, and Review Staleness | D | `attestations, expiry, and review-staleness rules` | O | — |
| 5 | Verdict Vocabulary | D | `passed, failed, warning, skipped, not-evaluated, and prohibited-but-unestablished` | O | standards/05-verdict-vocabulary.md |
| 6 | Standard Document Structure and Rule Identity | D | `one numbered normative document per standard` | O | standards/06-standard-structure-and-rule-identity.md |
| 7 | Boundary with Adjacent Standards Packs | A | — | O | standards/07-boundary-with-adjacent-standards.md |

### Band B — Safety, misuse, oversight · bullet 1

| # | Title | Class | Derived from | Posture | Implemented by |
| --- | --- | --- | --- | --- | --- |
| 8 | AI Safety Requirements and Safety Cases | D | `AI safety` | O | standards/08-ai-safety-requirements-and-safety-cases.md |
| 9 | Misuse and Abuse Prevention | D | `misuse prevention` | O | standards/09-misuse-and-abuse-prevention.md |
| 10 | Human Oversight and Intervention | D | `human oversight` | O | — |
| 11 | Autonomy Levels and Delegated Authority | D | `autonomous` | X | standards/11-autonomy-levels-and-delegated-authority.md |

### Band C — Data · bullet 2

| # | Title | Class | Derived from | Posture | Implemented by |
| --- | --- | --- | --- | --- | --- |
| 12 | Context and Corpus Provenance | D | `provenance` | B | — |
| 13 | Personal Data in AI Systems | D | `Data privacy` | O | standards/13-personal-data-in-ai-systems.md |
| 14 | Consent and Licensing | D | `consent` | O | — |
| 15 | Retention, Deletion, and Memorization | D | `retention` | O | — |
| 16 | Access Control for Models, Context, and Tools | D | `access control` | O | — |

### Band D — Evaluation · bullet 3

| # | Title | Class | Derived from | Posture | Implemented by |
| --- | --- | --- | --- | --- | --- |
| 17 | Evaluation Plans for Generative Systems | D | `Model evaluation` | B | standards/17-evaluation-plans-for-generative-systems.md |
| 18 | Benchmark Integrity and Contamination | D | `benchmark integrity` | B | — |
| 19 | Robustness Evaluation | D | `robustness` | O | — |
| 20 | Regression Testing Across Model and Prompt Versions | D | `regression testing` | O | — |

### Band E — Prompt, tool, agent, retrieval security · bullet 4

| # | Title | Class | Derived from | Posture | Implemented by |
| --- | --- | --- | --- | --- | --- |
| 21 | Prompt and Instruction Security | D | `Prompt, tool, agent, and retrieval security` | O | standards/21-prompt-and-instruction-security.md |
| 22 | Tool and Function-Call Security | D | `tool, agent, and retrieval security` | O | — |
| 23 | Agent Execution Security | D | `agent, and retrieval security` | O | standards/23-agent-execution-security.md |
| 24 | Retrieval and Context Supply Chain | D | `retrieval security` | O | — |

> Bullet 4 shares one head noun across four modifiers. Each item's token is the longest tail of the
> bullet beginning at its own modifier, so every token is a real substring and each names its own
> subject. A tokenisation that recorded bare `tool` would resolve against `tool-permissions` and
> similar text elsewhere in the brief, and would prove nothing.

### Band F — Honesty · bullet 5

| # | Title | Class | Derived from | Posture | Implemented by |
| --- | --- | --- | --- | --- | --- |
| 25 | Grounding and Hallucination Control | D | `Hallucination` | O | standards/25-grounding-and-hallucination-control.md |
| 26 | Uncertainty Expression and Abstention | D | `uncertainty` | B | — |
| 27 | Citation and Source Attribution | D | `citation` | B | — |
| 28 | Capability Honesty to Users | D | `capability honesty` | X | — |

### Band G — Lineage, reproducibility, rollback · bullet 6

| # | Title | Class | Derived from | Posture | Implemented by |
| --- | --- | --- | --- | --- | --- |
| 29 | AI System Versioning and Change Control | D | `versioning` | O | — |
| 30 | Model and Prompt Lineage | D | `model/data lineage` | B | — |
| 31 | Reproducibility Under Nondeterminism | D | `Reproducibility` | B | — |
| 32 | Rollback and Recovery | D | `rollback` | O | — |

### Band H — Observability, incident, red team, audit · bullet 7

| # | Title | Class | Derived from | Posture | Implemented by |
| --- | --- | --- | --- | --- | --- |
| 33 | AI Observability | D | `Observability` | B | — |
| 34 | AI Incident Response | D | `incident response` | O | — |
| 35 | Red Teaming | D | `red teaming` | O | — |
| 36 | Auditability of AI Actions | D | `auditability` | O | — |

### Band I — Accessibility, fairness, transparency, disclosure · bullet 8

| # | Title | Class | Derived from | Posture | Implemented by |
| --- | --- | --- | --- | --- | --- |
| 37 | Fairness and Harm Distribution | D | `fairness` | O | — |
| 38 | Accessibility of AI Features | D | `Accessibility` | D | — |
| 39 | Transparency and System Documentation | D | `transparency` | B | — |
| 40 | User Disclosure of AI Involvement | D | `user disclosure` | B | — |

### Band J — Cost, latency, environment, resilience · bullet 9

| # | Title | Class | Derived from | Posture | Implemented by |
| --- | --- | --- | --- | --- | --- |
| 41 | Inference Cost and Budget Control | D | `Cost` | O | — |
| 42 | Latency Budgets for AI Interactions | D | `latency` | O | — |
| 43 | Environmental Impact Accounting | D | `environmental impact` | O | — |
| 44 | Operational Resilience, Degradation, and Provider Portability | D | `operational resilience` | X | — |

### Band K — Approval gates · bullet 10

| # | Title | Class | Derived from | Posture | Implemented by |
| --- | --- | --- | --- | --- | --- |
| 45 | Approval Gates for High-Impact, Destructive, and Irreversible Actions | D | `high-impact, destructive` | X | standards/45-approval-gates.md |
| 46 | Gates for Externally Visible Actions | D | `externally visible actions` | O | — |

### Band L — Prohibitions

| # | Title | Class | Derived from | Posture | Implemented by |
| --- | --- | --- | --- | --- | --- |
| 47 | AI Engineering Invariants | A | — | O | — |
| 48 | Safety and Oversight Prohibitions | A | — | O | — |
| 49 | Data and Privacy Prohibitions | A | — | O | — |
| 50 | Evaluation Integrity Prohibitions | A | — | O | — |
| 51 | Agent and Tool Execution Prohibitions | A | — | O | — |
| 52 | Output Honesty Prohibitions | A | — | O | — |
| 53 | Disclosure and Deception Prohibitions | A | — | O | — |

---

## Authored items

Every class-A item, with what authored it and — for the prohibitions — the positive token it is the
negative face of. `inventory.mjs` asserts this list and the class-A rows above name the same items,
in both directions.

| # | Title | Authored because | Negative face of |
| --- | --- | --- | --- |
| 2 | AI Risk Tiering and Applicability | The brief names ten subject areas and no way to decide which apply to a given system. Without tiering, every requirement applies to every project equally, which in practice means the whole pack is switched off by the first team it inconveniences | — |
| 7 | Boundary with Adjacent Standards Packs | The brief does not know the adjacent packs exist and asks for nothing about them. Every requirement in this standard is this repository's own claim about what it may and may not assert | — |
| 47 | AI Engineering Invariants | Umbrella. The brief has no prohibition section at all; this item holds the prohibitions that are not specific to one subject area | — |
| 48 | Safety and Oversight Prohibitions | Authored | `AI safety`, `human oversight` |
| 49 | Data and Privacy Prohibitions | Authored | `Data privacy` |
| 50 | Evaluation Integrity Prohibitions | Authored | `benchmark integrity` |
| 51 | Agent and Tool Execution Prohibitions | Authored | `tool, agent, and retrieval security` |
| 52 | Output Honesty Prohibitions | Authored | `capability honesty` |
| 53 | Disclosure and Deception Prohibitions | Authored | `user disclosure` |

---

## What these checks do not establish

Stated plainly, because a check whose limits are unwritten gets read as proving more than it does.

- **That an item is well drafted.** `inventory.mjs` proves a token exists in the brief. It says
  nothing about whether the standard written under that token addresses it.
- **That the tokenisation is the only reasonable one.** It is a reading of a prose list, recorded so
  it can be argued with. Another reading is possible; an unrecorded one is not.
- **That a class-A item is a good idea.** The check proves it is *declared* as authored.
- **That the boundary holds.** That is the separate review recorded in
  `artifacts/boundary-review.json`, and its substantive half is human judgment.
- **That the numbering is final.** It is frozen by this file, and it may be changed by a later
  correction recorded here with its reason.
