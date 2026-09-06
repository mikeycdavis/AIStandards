# 08 — Open questions and known unknowns

**Status:** open
**Generated:** 2026-09-03, as post-reconstruction evidence

Only genuine unknowns are listed. Anything resolvable by inspection was resolved and is recorded as
resolved rather than carried as a question.

## Resolved by inspection on 2026-09-03

| Question | Resolution |
|---|---|
| Does the enforcer reserve the contract id? | **No.** A case-insensitive search finds no `ai-engineering`, and **no code enforces uniqueness at all** — `scope.mjs` states "Nothing in this file may know which packs exist." The id is set to `ai`, following the family's repository-name derivation. A collision would not error; the disposition would silently never resolve |
| How is a new pack registered? | An edit to an externally-held scope registry, not a change to StandardsEnforcer. It has no onboarding guide and no "add a pack" entry point, by design |
| Is StandardsOrchestrator usable as an authority? | **No.** `FROZEN.md`: "must not be adopted as one." Frozen 2026-08-10 at v1.0.0 |
| Is an adapter-less pack gracefully skipped? | **No.** `ENFORCEMENT_ERROR`, `passing: false`, exit 4, explicitly not `EVALUATED` |

## Genuinely open

### Q1 — How is AIStandards invoked in a governed pipeline? — **blocks Phase 7**

StandardsEnforcer ships no gate workflow, and M2 is explicitly not established for GitHub Actions. The
CI-integrated invocation exists only in a retired evidence file.
**Impact if unanswered:** Phase 7 cannot start and 1.0.0 cannot be cut. Not answerable from this
repository.

### Q2 — Which scope registry, and which authorised reviewer? — **blocks Phase 7**

Registration requires a `reviewedBy` already present in the registry's `authorisedReviewers`, plus a
`reviewedFootprint` digest.
**Impact if unanswered:** no disposition can be filed. Requires a human decision about governance
ownership.

### Q3 — Is EngineeringStandards' adapter-less state intentional?

ES has no adapter **and no tag at all**, so it cannot form an identity triple. Nothing in
StandardsEnforcer records a decision either way. The owner has directed treating it as unresolved
legacy, which does not require the answer.
**Impact if unanswered:** none on this plan. Recorded for completeness.

### Q4 — Do MachineLearningStandards' maintainers accept `boundary.ml-pack-required`?

The adapter contract has no composition field, so the ML dependency is expressed as a rule instead.
That is unilateral until they agree.
**Impact if unanswered:** the mechanism works regardless, but the boundary is asserted rather than
negotiated.

### Q5 — Should AIStandards also adopt EngineeringStandards as a consumer?

It would carry its own `project-policy.yml` pinning ES 2.0.0 alongside `ai-policy.yml`. The structure
allows it; nothing requires it.
**Impact if unanswered:** none before Phase 6.

### Q6 — The `node:20-bookworm` sha256 digest

Must be read from a registry during Phase 5, never copied from memory.
**Impact if unanswered:** Phase 5 only.

### Q7 — Does Standard 02's R2 forbid *proposing* a risk tier, or only assigning one?

Raised 2026-09-06 while writing Standard 11. `standards/02-ai-risk-tiering-and-applicability.md` R2
reads:

> **No detector, heuristic, or audit finding in this framework MAY assert, propose, or default a risk
> tier, and an undeclared tier MUST be reported as undeclared rather than assumed.**

The reasoning printed beneath it argues that a guess would be drawn from capability signals, which
R1 makes the wrong discriminator, and would carry the framework's authority into a judgment no
engineer made. **That argument supports *assert* and *default*. It does not reach *propose*.** An
advisory suggestion a human must explicitly accept, clearly labelled as not a determination, carries
no framework authority into the record — the human's acceptance is the determination.

**Evidence on its status.** Item 2 is class `A` in the specification; the brief contains no
occurrence of "risk", "tier", or "advisory", and its only use of "propose" concerns producing a
proposed plan. Standard 02's own Additions section declares "R2 in full" as authored. So the blanket
form is a **newly authored restriction, not an approved requirement**, and it is unilateral.

**Not resolved here, because it is a substantive design decision, not an evidence correction.**
Standard 02 was left exactly as written. Standard 11's R3 was scoped to prohibit *authoritative
assignment* of an autonomy tier while leaving a labelled advisory proposal open, so the unapproved
blanket form was not propagated.

**Impact if unanswered:** the two standards differ in strictness on adjacent ground. If the owner
affirms the blanket form, Standard 11 R3 tightens to match. If the owner distinguishes advisory from
authoritative, Standard 02 R2 loses the word "propose" and gains the distinction.

### Q8 — Should the repository pin line endings with a `.gitattributes`?

`core.autocrlf` is `true` and no `.gitattributes` exists, so committed bytes are LF and working-tree
bytes CRLF. `scripts/fidelity.mjs` declares a CRLF→LF normalization on both sides and reports raw-byte
matches separately, so nothing currently breaks. Adding one would rewrite every file's line endings
in a single commit, which is why it has not been done as a side effect of other work.
**Impact if unanswered:** none today. It becomes real in Phase 5, where `ci-context` sets
`core.autocrlf=false` when materialising the clone, so container bytes and host bytes will differ.

## Not questions

Per-shard rule counts are a plan, not a measurement. The catalog does not exist yet, and
`inventory.mjs` is what will make those numbers true. They are not listed as unknowns because nobody
else can answer them — they are answered by doing the work.
