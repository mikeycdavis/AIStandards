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

### Q9 — Does `misuse prevention` have a prohibitive face, and which item owns it?

The specification's must-never items each name the positive tokens they are the negative face of.
Item 48, Safety and Oversight Prohibitions, names `AI safety` and `human oversight`. No prohibition
item names `misuse prevention`, although the brief lists it in the same bullet. Standard 09, written
2026-09-14, therefore mints no prohibition, states its one `forbidden` rule (minted in Phase 1) as it
stands, and records the gap in its Scope and Additions sections rather than resolving it.

**Not resolved here, because the answer changes a specification row.** Whether item 48 takes the
token, or misuse prevention has no prohibitive face, is a catalog-identity decision, not an evidence
correction.
**Impact if unanswered:** none on the wording of any written standard today. Item 48's document, when
written, will have to say whether misuse prohibitions are its ground.

### Q10 — Do the retention and deletion rules belong to item 15 rather than item 13?

`privacy.retention-declared` and `privacy.deletion-path-exists` cite standard 13, while item 15 is
titled "Retention, Deletion, and Memorization" and derives from the brief token `retention`. Nothing
recorded explains the placement. Standard 13, written 2026-09-14, states both rules as their identity
requires, claims for them only that retention is declared and that a deletion path reaches the
model-adjacent stores, and leaves periods, schedules, backups and memorization to item 15.
**Not resolved here, because the answer changes a rule's `standard` field.**
**Impact if unanswered:** none today. Item 15's document, when written, will have to say whether it
takes the two rules.

### Q11 — Should the credentials rule stay under item 13?

`privacy.no-credentials-in-prompts` concerns credentials, which are not personal data, and its rationale
concerns replication and injection. It overlaps Standard 21's `promptsec.no-secrets-in-context` on a
credential committed in a prompt file; both are `forbidden` and non-exemptible. Standard 13 records the
overlap and does not decide which rule owns the committed-asset case.
**Impact if unanswered:** none while neither rule has a detector. Once either does, one credential could
be reported under two standards.

### Q12 — Are the three forbidden privacy rules item 49's prohibitions?

Item 49, Data and Privacy Prohibitions, is the authored negative face of `Data privacy` — item 13's own
token. `privacy.no-real-personal-data-in-fixtures`, `privacy.no-credentials-in-prompts` and
`privacy.no-unredacted-prompt-logging` are `forbidden`, were minted in Phase 1, and cite standard 13.
Unlike Q9, the specification does name the token; what it does not record is whether these rules are
item 49's stated early. Standard 13 states them as they stand.
**Impact if unanswered:** none on the wording of any written standard today. Item 49's document, when
written, will have to say.

### Q13 — May a partial-assurance check's clean result be `passed` and count toward `COMPLIANT`? — **resolved 2026-09-14: no**

Standard 5 R6 says: "Where a check could not run, could not read a file, or covered less than the rule
requires, the result MUST be `skipped` with disposition `not-evaluated`, and MUST NOT be `passed`."
Four rules declare `assurance: partial` — `lifecycle.model-version-pinned`,
`misuse.safety-controls-not-disabled`, `promptsec.prompt-is-versioned-artifact` and
`promptsec.no-inline-system-prompt` — so their detectors cover less than their rules by declaration.
`evaluateRule()` in `scripts/compliance.mjs` reports a clean observation from any of them as `passed`;
`rule.assurance` is copied into the result and read by no decision; and `evaluate()` reaches
`COMPLIANT` when nothing is failed or unestablished. Observed 2026-09-14 with uncommitted probe targets
whose policy declares every rule outside `EVALUATED_RULES` not-applicable: a repository with no
configuration at all, and one whose `.env` sets `SAFETY_SETTINGS=BLOCK_NONE`, each reported
`COMPLIANT` with score 100.

Options identified, none taken:
1. A clean partial-assurance result becomes `skipped` / `not-evaluated` (for a `forbidden` rule,
   `prohibited-but-unestablished`). Conforms the code to R6; `COMPLIANT` becomes unreachable while any
   partial rule applies. Changes the `passed` controls in `test/audit.test.mjs` (`pinned-model`,
   `file-backed-prompt`, `safety-configured`, the `mentions-only` assertions), the controls in
   `test/safety-detector.test.mjs`, and the rules' `$assuranceNote` text and Standards 1, 9 and 21.
2. A new result or distinction value for a clean result within a declared scope. Changes Standard 5 R2's
   six values, `schemas/validate-report.schema.json`, `distinction()` and `test/distinction.test.mjs`.
3. Keep per-rule `passed`, but stop partial clean results from yielding `COMPLIANT` or from counting in
   the score. Changes `evaluate()`, possibly the status set, Standard 5 R5, and compliance and validate
   tests.
4. Amend Standard 5 R2 and R6 so "covered the rule" means the declared assurance scope. No code change,
   but it narrows an evidence requirement so the code meets it, which the brief forbids doing merely to
   make a gate pass; it would need a reason independent of that.

**Not resolved here, because every option changes the verdict contract or a normative standard.** The
2026-09-14 detector repair fixed a layout-dependent defect for supported input and did not touch this.
**Impact if unanswered:** a narrow literal scan can report a forbidden rule `passed` over a repository
it cannot see into, and that result can contribute to `COMPLIANT`. It does not reach this repository's
own verdict, which is `NON_COMPLIANT`, and it blocks nothing in Phase 2 — but it must be settled before
`validate` can gate anything (Phase 6).

**Resolved 2026-09-14 — option 1.** The owner instructed that Standard 5 R6 already requires incomplete
coverage to stay unevaluated, so conforming the implementation is a correction, not a contract change;
Standard 5 was not amended. `evaluateRule()` in `scripts/compliance.mjs` now reports a clean result from
a rule declaring `assurance: partial` as `skipped` / `not-evaluated` — `prohibited-but-unestablished`
for `misuse.safety-controls-not-disabled`, which is `forbidden` — so it counts toward neither
`COMPLIANT` nor the score. A confirmed violation still fails, an unknown keeps its own reason, and
clean full-assurance checks still pass. Committed regressions: `test/fixtures/q13-synthetic-no-config/`
and `q13-synthetic-env-block-none/`, synthetic inputs whose not-applicable declarations isolate the
verdict path and are not applicability approvals, now report `NOT_EVALUATED` where they reported
`COMPLIANT` at 100; `q13-synthetic-full-only/` still reports `COMPLIANT` at 100; and a property test
asserts that no fixture reports a partial-assurance result `passed` (`test/partial-assurance.test.mjs`).
Those tests and the rewritten controls fail against the previous `compliance.mjs`.

What the resolution does not cover: coverage is keyed on the *declared* assurance, not measured, so a
`full`-assurance check's own blind spots and a file a detector skips as unreadable are still Phase 3's
evidence-availability work; `COMPLIANT` is unreachable while any partial-assurance rule applies; a rule
added to `EVALUATED_RULES` with `assurance: none` is refused by a test rather than handled; and Standard
5 R2's meanings table does not name the case (Q14).

### Q14 — Should Standard 5 R2's meanings table name a partial check that ran and found nothing?

R2's table describes `not-evaluated` as "Nobody looked, or a check could not run" and
`prohibited-but-unestablished` as "A `forbidden`-level rule nobody examined". R6 requires `skipped` /
`not-evaluated` where a check "covered less than the rule requires", and since Q13 a partial-assurance
check that ran and found nothing reports exactly that. The table does not name that case. Rewording it
would state what R6 already requires rather than narrow anything, but it changes the normative text of a
standard whose authored content has no owner approval. The human report's heading was renamed from
"Prohibitions nobody examined" to "Prohibitions not established" for the same reason.
**Impact if unanswered:** a reader of R2 alone may take either distinction to mean that no check ran.

### Q15 — Does `agent.retrieved-content-not-instruction` belong to item 23?

The rule cites standard 23. Its subject overlaps Standard 21 R3 and R5 and Standard 11 R6, and its source
of retrieved content is item 24's title, Retrieval and Context Supply Chain. Standard 21's Relationship
section assigns the ground to item 23, so moving the rule would also change Standard 21. On shared ground
the rule is `code-analysis` while `promptsec.template-injection-guarded` is `not-evaluable`; Standard 23
explains the difference as a structural half and a behavioural half and does not decide whether both
types can stand. **Not resolved here, because the answer changes a rule's `standard` field or validation
type.** **Impact if unanswered:** none while no detector binds either rule.

### Q16 — Are the two forbidden agent rules item 51's prohibitions?

Item 51, Agent and Tool Execution Prohibitions, is the authored negative face of `tool, agent, and
retrieval security`. `agent.no-self-modification` and `agent.retrieved-content-not-instruction` are
`forbidden`, were minted in Phase 1 and cite standard 23. The parallel for privacy is Q12.
**Impact if unanswered:** none on the wording of any written standard today. Item 51's document, when
written, will have to say.

### Q17 — Who states a sandboxing requirement?

Standard 45's Relationship section names item 23 as the owner of sandboxing. No rule in `rules/agent.json`
concerns it, the brief does not mention it, and Standard 23 records the gap rather than authoring a
requirement. Either item 23 gains authored normative content or Standard 45's attribution changes.
**Impact if unanswered:** no written standard requires execution isolation for an agent.

### Q18 — Should Standard 23 R4 reach tool output other than fetched content?

`agent.retrieved-content-not-instruction` names a retrieval index, a web page and a user document.
Standard 23 reads a tool returning fetched content as within those sources and other tool output, and
the user's own message, as outside them. Whether they should be inside is item 22's and Standard 21's
ground. **Impact if unanswered:** none while no detector binds the rule.

## Not questions

Per-shard rule counts are a plan, not a measurement. The catalog does not exist yet, and
`inventory.mjs` is what will make those numbers true. They are not listed as unknowns because nobody
else can answer them — they are answered by doing the work.
