# Standard 6 — Standard Document Structure and Rule Identity

Two things in this repository are load-bearing in a way that is easy to underestimate: the shape of a
standard document, and the identity of a rule.

The document shape matters because a standard that omits its evidence requirements or its falsifiers
is not a standard — it is an opinion with a number on it. The rule identity matters because a rule id
appears in a policy, a verdict, a crosswalk to another pack and a consumer's dashboard, and every one
of those breaks silently if the id means something different in two places.

Source: item 6 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "Use one numbered normative document per standard" line and the nine required
sections of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 6 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. The boundary posture is **O**, evidenced in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json), whose substantive half
> is human judgment and carries `humanSignOff: null`.

## Scope

Applies to every document in `standards/` and every rule in `rules/`.

It does not apply to the documents in `docs/` or `artifacts/`, which are explanatory rather than
normative, and which are deliberately not numbered so that nobody cites one as a requirement.

## Requirements

### R1 — One numbered document per standard

**Each standard MUST be a single file named `NN-kebab-case-title.md`, with an H1 of the form
`# Standard N — Title`.**

One file per standard, because a standard that shares a file with another cannot be linked to,
diffed independently, or cited without ambiguity.

### R2 — The ten sections

**Each standard MUST carry all ten H2 sections, in order: Scope, Requirements, Failure modes,
Evidence, Validation, severity, and exemptibility, Tests and falsifiers, Exceptions and staleness,
Additions this standard makes beyond the source, Relationship to other standards and ADRs,
Implementation.**

**Ten sections carry the brief's nine requirements, and the arithmetic is stated here so it is not
read as a discrepancy.** Brief requirements 5 (validation type) and 6 (severity and
non-exemptibility) share one section, because both are columns of the same generated table and
splitting them would mean two generated blocks sourced from the same catalog fields — so nine
requirements occupy eight sections. Two further sections are inherited from the archetype and
required by neither the brief nor its list: *Additions*, which is where authored content must
surface, and *Implementation*, which is where the honest limits go.

Conformance is asserted against the brief's nine, not against the section count. A future change that
merges or splits a section must update the mapping the test holds, and the test fails until it does.

No catalog rule carries R1 or R2; `scripts/standards-sections.mjs` checks them. See
[Implementation](#implementation).

### R3 — Every requirement is falsifiable, or is declared not-evaluable

**Each requirement MUST state the observation that would prove a project non-compliant, and where
none can be written, the requirement MUST be recorded as `not-evaluable` rather than left
unfalsifiable.**

A requirement with no falsifier is not a requirement; it is an aspiration that will be reported as
satisfied by default. The honest alternative to a weak check is not a weak check — it is saying that
the framework states the requirement and cannot check it.

### R4 — Canonical rule identity

**A rule id MUST match `^[a-z][a-z0-9]*(\.[a-z0-9]+(-[a-z0-9]+)*)+$` — a reserved namespace, then
kebab-case.**

camelCase is rejected by the pattern rather than by convention, so a legacy spelling cannot enter the
catalog by being typed.

### R5 — Namespaces are reserved, and foreign ones are refused

**A rule id MUST use a namespace this pack reserves, and MUST NOT use a namespace belonging to
another pack.**

`ai.*` belongs to EngineeringStandards, permanently. Nothing in this catalog may be minted there,
and the catalog loader raises rather than warns.

`eval.` is this pack's namespace for evaluation and `evaluation.` is not, because
MachineLearningStandards already owns `evaluation.*` — a repository governed by both packs would
otherwise carry two similarly-named ids meaning different things, and the failure would surface as a
confusing dashboard rather than an error.

**A reserved namespace is not an exclusive one, and the overlaps are declared.** Six of this pack's
seventeen segments are also used by another pack: `lifecycle.` and `agent.` by MathematicsStandards,
`privacy.` by UIUXDesignStandards, `observability.` by EngineeringStandards, `disclosure.` by
FinancialStandards, and `invariant.` by MachineLearningStandards. What R5 forbids is a colliding
*full* id, which [Standard 7](07-boundary-with-adjacent-standards.md) R4 enforces against a recorded
inventory of nine packs. The segment overlaps are listed in `SHARED_SEGMENTS` in
`scripts/catalog.mjs` because an undeclared overlap is a claim nobody checked — the Phase 2 boundary
review found the approved plan asserting these segments were disjoint, and they are not.

### R6 — A crosswalk is semantic, never an identity

**Where this pack covers ground another pack also covers, the relationship MUST be recorded as a
crosswalk naming the foreign rule, and the foreign id MUST NOT be reused.**

AIStandards owns the canonical AI-facing rules. EngineeringStandards' six `ai.*` rules are precedent
and are recorded as such: `gate.actions-classified` crosswalks to `ai.destructive-approval`,
`gate.no-self-approval` to `ai.no-safety-bypass`. Neither version is carried as independently
authoritative, and the crosswalk says which is which.

The alternative — re-minting the foreign id here — would produce two rules with one name and two
owners, and no mechanism anywhere in the portfolio to reconcile a disagreement between them.

### R7 — Lifecycle fields are present from the first release

**Every rule MUST carry `aliases`, `deprecatedIn`, `supersededBy` and `removedIn`, even when null.**

So that a consumer never has to distinguish "this rule has no successor" from "this catalog predates
the field". The distinction is invisible at the point it matters, which is when a rule is being
retired.

### R8 — Attestability is opt-in outside manual review

**`attestable` MUST default to true only for `manual-review` rules, and any other validation type
MUST opt in explicitly.**

Otherwise attestation becomes a universal override: a human statement that a rule is satisfied would
be able to overrule a check that observed it was not. A `not-evaluable` rule MUST NOT be attestable
at all, because human review *of the repository* cannot establish a fact about model behaviour at
inference time.

## Failure modes

| Failure | What it looks like | Caught by |
| --- | --- | --- |
| Section drift | A standard ships without its evidence or falsifier section | R2 |
| The unfalsifiable requirement | A rule everyone passes because nothing could fail it | R3 |
| Cross-pack id collision | Two packs report on `ai.destructive-approval` and disagree | R5, R6 |
| Namespace confusion | `evaluation.baseline` means one thing here and another in ML | R5 |
| Silent rule retirement | A rule disappears with no successor recorded | R7 |
| Attestation as override | A human statement overrules an observed violation | R8 |
| Table drift | A standard's severity table disagrees with the catalog | R2, and see Implementation |

## Evidence

| Requirement | Evidence | Form | Who can produce it |
| --- | --- | --- | --- |
| R1 | Filenames and H1 forms | Test | Automated |
| R2 | All ten sections present and ordered; the nine brief requirements each resolve | Test | Automated |
| R3 | A falsifier column in every standard's test table | Document | Human review |
| R4 | The id pattern, enforced at catalog load | Test | Automated |
| R5 | A namespace check over the whole catalog | Test | Automated |
| R6 | Crosswalk entries naming pack, rule and relationship | Test for shape; human review for correctness | Both |
| R7 | Lifecycle fields present, enforced at catalog load | Test | Automated |
| R8 | Catalog invariants, enforced at load | Test | Automated |

## Validation, severity, and exemptibility

Like Standards 3 and 5, this standard governs the framework rather than an adopting project, and has
no catalog rules in this release. It is enforced at catalog load — `loadCatalog` throws a
`CatalogError` rather than returning a partial catalog — and by the test suite.

Throwing rather than warning is the right severity for all of R4 through R8. A catalog with a
malformed rule is not a catalog with one bad entry; it is a catalog whose contents cannot be trusted
to mean what they say, and continuing would produce a verdict over it.

**Not exemptible.** These constrain the framework's own vocabulary.

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Every file in `standards/` matches the name and H1 form | A mismatch | — |
| R2 | Every standard has ten sections in order, and the nine brief requirements map | A missing or misordered section | A conforming standard must pass |
| R4 | A camelCase id is rejected at load | It loads | Every real id must load |
| R5 | An `ai.`-prefixed id is rejected | It loads | Every reserved namespace must load |
| R5 | No id collides with a known foreign id | A collision | — |
| R6 | A crosswalk to the rule's own id is rejected | It loads | A real crosswalk must load |
| R7 | A rule missing `supersededBy` is rejected | It loads | — |
| R8 | A `not-evaluable` rule with `attestable: true` is rejected | It loads | A `manual-review` rule must default attestable |
| — | The severity table in each standard matches the catalog | Any divergence | — |

The last row is a mutation test in effect: changing a level in `rules/` without changing the
standard's table fails, and so does the reverse.

## Exceptions and staleness

Not exemptible, per above. The generated-table markers in each standard are checked on every run, so
a drifted table is a build failure rather than a thing someone notices later. Since 2026-09-14 the tables are written by `scripts/sync-rule-tables.mjs`, whose `--check` mode
fails on any drift, and `test/standards-tables.test.mjs` still verifies the same agreement
independently, so a generator defect cannot certify its own output. The generator takes each row's
requirement label from the one `### RN` section that cites the rule id, and refuses rather than
guesses when that citation is missing or ambiguous.

## Additions this standard makes beyond the source

- **The ten-section skeleton.** The brief lists nine things a standard must state; the mapping to ten
  H2 sections, the merge of requirements 5 and 6, and the two inherited sections are this
  repository's own structure.
- **R3's not-evaluable escape.** The brief permits "not-evaluable" as a validation type. The rule
  that an unfalsifiable requirement MUST be recorded as one, rather than left to pass by default, is
  authored.
- **R4 through R8 in their entirety.** The brief says nothing about rule identity, namespaces,
  crosswalks, lifecycle fields or attestability. All of it is this repository's own, and R5 and R6
  exist specifically because this pack ships into a portfolio the brief does not know about.
- **The `eval.` / `evaluation.` decision**, which is a concrete boundary call rather than a general
  rule.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) owns the list of foreign rules that must never
be shadowed; R6 is the general form and Standard 7 is the specific list.
[Standard 3](03-machine-readable-ai-policy.md) consumes the rule identity R4 defines, as the keys of
a policy. [Standard 5](05-verdict-vocabulary.md) consumes it as the key of every result.
[Standard 45](45-approval-gates.md) is the worked example of R6, carrying two crosswalks to
EngineeringStandards precedents.

Outside this repository: **EngineeringStandards** owns `ai.*` and `testing.*`;
**MachineLearningStandards** owns `evaluation.*`, `data.*` and `reproducibility.*`;
**MathematicsStandards** owns `agent.explainable-findings` and `agent.refusal-on-invariant`, neither
of which any id here collides with.

## Implementation

**Normative. Enforced at catalog load for rule identity; enforced by test for document structure.**

| Requirement | State |
| --- | --- |
| R1 | **Checked** for this repository's documents by `scripts/standards-sections.mjs`: filename, H1, Source line and specification row agree |
| R2 | **Checked** for every written standard by `scripts/standards-sections.mjs`: ten sections present, once each, in order, non-empty, and each brief requirement resolves through the mapping. Unwritten items are not required to exist |
| R3 | `manual-review`. Whether a falsifier is a real falsifier is a judgement about the domain |
| R4 | **Enforced.** `RULE_ID` at load; `CatalogError` on mismatch |
| R5 | **Enforced.** `NAMESPACES` and `FOREIGN_NAMESPACES` at load |
| R6 | **Enforced for shape.** A crosswalk must name pack, rule and relationship, and may not name its own id. Whether the mapping is *correct* is human review |
| R7 | **Enforced.** Missing lifecycle fields raise at load |
| R8 | **Enforced.** The `not-evaluable` invariants raise at load |

**R1 and R2 are checked mechanically as of 2026-09-14, and only mechanically.**
`scripts/standards-sections.mjs`, run by `test/standards-sections.test.mjs`, rejects a missing,
duplicated, reordered or empty section, resolves each of the brief's nine requirements to its section
through a mapping held as data, and checks each document's filename, H1 and Source line against its
specification row. It reads this repository's written standards only; an unwritten item is not
required to exist. It establishes that a section exists, is in order and is not empty — not that what
the section says is adequate, which remains human review. Before that date this paragraph recorded
R1 and R2 as stated and unenforced: the documents written until then conformed because they were
written to conform, and the checker found all nine conforming when it first ran.
