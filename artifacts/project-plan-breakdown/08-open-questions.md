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

### Q8 — Should the repository pin line endings with a `.gitattributes`? — **ANSWERED 2026-10-14: option A**

**Answer (owner, 2026-10-14): option A.** Keep the vendor-only rule, `scripts/vendor/** text eol=lf`, and add no repository-wide `.gitattributes` rule. Revisit only when a second byte-pinned artifact appears outside `scripts/vendor/`. The decision packet (question as written, options A/B/C, behaviour on Windows `autocrlf=true`/`false` and Linux CI, risks) is `F:\Repos\StandardsPortfolio-evidence\aistandards-125-q8-packet-2026-10-14.md` (owner-side evidence, not part of this repository). The text below is the question as it was asked.

`core.autocrlf` is `true` and no repository-wide `.gitattributes` exists (the one file, added by ST-57, pins only
`scripts/vendor/**` to LF so the vendored parser's recorded hashes do not depend on a checkout, and is not an
answer to this question), so committed bytes are LF and working-tree bytes CRLF. `scripts/fidelity.mjs` declares a CRLF→LF normalization on both sides and reports raw-byte
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
**Impact if unanswered:** none today. [Standard 15](../../standards/15-retention-deletion-memorization.md) is now written and says
it mints no id and moves neither rule; the question stays open.

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
for `misuse.safety-controls-not-disabled`, which is `forbidden` — so it earns no `passed` credit and
holds the status away from `COMPLIANT`. An applicable partial rule stays in `denominator.scored`, so it
lowers the score; `evaluate()` excludes only not-applicable and not-evaluable rules from that
denominator. *Corrected 2026-09-15: this said the result counted toward neither `COMPLIANT` nor the
score.* A confirmed violation still fails, an unknown keeps its own reason, and
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
5 R2's meanings table does not name the case (Q14, resolved 2026-09-15).

### Q14 — Should Standard 5 R2's meanings table name a partial check that ran and found nothing? — **resolved 2026-09-15: yes, as clarification**

R2's table describes `not-evaluated` as "Nobody looked, or a check could not run" and
`prohibited-but-unestablished` as "A `forbidden`-level rule nobody examined". R6 requires `skipped` /
`not-evaluated` where a check "covered less than the rule requires", and since Q13 a partial-assurance
check that ran and found nothing reports exactly that. The table does not name that case. Rewording it
would state what R6 already requires rather than narrow anything, but it changes the normative text of a
standard whose authored content has no owner approval. The human report's heading was renamed from
"Prohibitions nobody examined" to "Prohibitions not established" for the same reason.
**Impact if unanswered:** a reader of R2 alone may take either distinction to mean that no check ran.

**Resolved 2026-09-15 — reworded as clarification of the existing R6 contract, not amended.** On the
owner's instruction that aligning the wording with implemented R6 advances an existing requirement,
Standard 5 R2's meanings table now names every path `evaluateRule()` in `scripts/compliance.mjs` takes to
each distinction. `not-evaluated` (and `prohibited-but-unestablished` at `forbidden` level) covers a rule
no detector examines, a `manual-review` rule not reviewed, a check that could not run, and a check that
ran clean over a declared partial scope. `not-evaluable` rules keep their separate treatment: the same
result and disposition, but outside the scored denominator and without effect on the status (R8). The
`warning` row had said "a level below required", but the code keys on level `recommended` or severity
`warning`; `skipped` is produced only by a not-applicable declaration, and nothing produces `excepted`,
`attested` or `COMPLIANT_WITH_EXCEPTIONS` in this release. A note under R6 states the score precisely: a
clean partial result earns no `passed` credit but stays in `denominator.scored` and lowers the score.
It also gives the status precedence, reading R5's cap as excluding `not-evaluable` rules as R8 and
`evaluate()` both require. The R1–R8 bolded sentences, the headings, the six values and runtime
behaviour are unchanged. Evidence: five tests added to `test/compliance.test.mjs`; the worker reports that
each of the four unit tests failed against at least one mutated copy of `compliance.mjs`, and the fifth,
a property test over every fixture, was not mutation-tested; and the worked example (score 56 for
`q13-synthetic-no-config/`, 100 for `q13-synthetic-full-only/`) matches `validate --json` output. Like
the rest of Standard 5's authored content, the wording has no owner approval.

### Q15 — Does `agent.retrieved-content-not-instruction` belong to item 23? — **partly resolved 2026-10-05: no, it is item 51's; the validation-type question stays open**

The rule cites standard 23. Its subject overlaps Standard 21 R3 and R5 and Standard 11 R6, and its source
of retrieved content is item 24's title, Retrieval and Context Supply Chain. Standard 21's Relationship
section assigns the ground to item 23, so moving the rule would also change Standard 21. On shared ground
the rule is `code-analysis` while `promptsec.template-injection-guarded` is `not-evaluable`; Standard 23
explains the difference as a structural half and a behavioural half and does not decide whether both
types can stand. **Not resolved here, because the answer changes a rule's `standard` field or validation
type.** **Impact if unanswered:** none while no detector binds either rule.

**Partly resolved 2026-10-05.** The owner assigned the rule to Standard 51 (ST-42, #87), so it no longer
belongs to item 23, and Standard 21's Relationship section now names Standard 51. **The validation-type
half is unchanged and still open**: whether the rule's `code-analysis` type and Standard 21 R5's
`not-evaluable` type can both be right on shared ground. It now concerns Standard 51 R2.

### Q16 — Are the two forbidden agent rules item 51's prohibitions? — **resolved 2026-10-05: yes**

Item 51, Agent and Tool Execution Prohibitions, is the authored negative face of `tool, agent, and
retrieval security`. `agent.no-self-modification` and `agent.retrieved-content-not-instruction` are
`forbidden`, were minted in Phase 1 and cite standard 23. The parallel for privacy is Q12.
**Impact if unanswered:** none on the wording of any written standard today. Item 51's document, when
written, will have to say.

**Resolved 2026-10-05.** The owner decided that `agent.no-self-modification` and
`agent.retrieved-content-not-instruction` are Standard 51's (ST-42, #87). Their `standard` field is now 51,
`standards/51-agent-and-tool-execution-prohibitions.md` states them as R1 and R2, Standard 23's R3 and R4
are relocation pointers, and the specification claims the document for item 51. Rule text, ids, levels,
severities, validation types and exemptibility did not change. The decision covers the assignment, not
the wording of the readings that moved with it, which remain authored and without owner approval.

### Q17 — Who states a sandboxing requirement?

Standard 45's Relationship section names item 23 as the owner of sandboxing. No rule in `rules/agent.json`
concerns it, the brief does not mention it, and Standard 23 records the gap rather than authoring a
requirement. Either item 23 gains authored normative content or Standard 45's attribution changes.
**Impact if unanswered:** no written standard requires execution isolation for an agent.

### Q18 — Should Standard 51 R2 (formerly Standard 23 R4) reach tool output other than fetched content?

`agent.retrieved-content-not-instruction` names a retrieval index, a web page and a user document.
Standard 51 reads a tool returning fetched content as within those sources and other tool output, and
the user's own message, as outside them. Whether they should be inside is item 22's and Standard 21's
ground. **Impact if unanswered:** none while no detector binds the rule.

### Q19 — Are the two forbidden evaluation rules item 50's prohibitions?

`eval.no-test-set-tuning` and `eval.no-fabricated-results` are `forbidden`, were minted in Phase 1 and
cite standard 17. Item 50, Evaluation Integrity Prohibitions, is the authored negative face of
`benchmark integrity` — item 18's token, not item 17's `Model evaluation` — so the parallel with Q12
and Q16 is weaker than it looks. **Impact if unanswered:** none on the wording of any written standard
today. Item 50's document, when written, will have to say.

### Q20 — Does `eval.regression-baseline-recorded` belong to item 20?

The rule cites standard 17. Item 20 is Regression Testing Across Model and Prompt Versions; Standard 17
R3 states the rule and leaves when regressions are tested, and what difference fails a change, to item
20. The parallel is Q10. **Not resolved here, because the answer changes a rule's `standard` field.**
**Impact if unanswered:** none while no detector binds the rule.

### Q21 — Can `eval.no-test-set-tuning` stay `code-analysis`?

The selection it forbids is as often a person choosing between runs, which leaves no code, and Standard
17 R4 reads the rule as reaching both. MachineLearningStandards types its related
`split.no-test-set-tuning` as `code-analysis` with `assurance: partial` and attestation, and its
assurance note says the repeated-inspection half "is not code at all". **Not resolved here, because the
answer changes a validation type.** **Impact if unanswered:** none while no detector binds the rule; a
future detector would reach only the loop form.

### Q22 — Should this pack state an evaluation baseline where MachineLearningStandards does not reach a system?

Standard 7 R2 lets this pack define a baseline directly for a system that is not a machine-learning
system. Standard 17 links metric justification (that pack's Standard 12), comparison conditions (19)
and uncertainty (20) and states no requirement on them, so where that pack does not reach a system
neither pack covers them. Which systems those are turns on whether its evaluation standards include a
hosted model the project did not train, recorded as unknown in `artifacts/boundary-review.json` (item
17); a hosted model or an absent training pipeline does not by itself decide it, and Standard 7 R2's
hosted-model example was withdrawn on 2026-09-15 for that reason. **Not resolved here, because an answer
either authors requirements on ground that pack owns or needs its maintainers' reading.** **Impact if
unanswered:** for such systems, no requirement covers justifying a metric by the cost of error,
quantifying uncertainty or holding a comparison's conditions identical.

### Q23 — Is the prohibitive form of human oversight item 48's, or stated in Standard 10?

The specification lists item 48 (Safety and Oversight Prohibitions) as the negative face of the
`human oversight` token. Standard 10 states the positive obligations only; its R5 requires that a
decline or stop stick, which is the only must-not clause on the system's own behaviour it states (R2
and R10 constrain the project). Whether the remaining prohibitive
form, "a system must not disable, evade or degrade its overseers", is item 48's prohibition, or belongs in Standard
10, is undecided. **Not resolved here, because item 48 is unwritten and the placement decides which
standard owns a forbidden-level requirement.** **Impact if unanswered:** a prohibition may be written
twice or in neither place.

### Q24 — Are the general intervention capability and Standard 11's halt record one rule or two?

Standard 11 R4 (rule `oversight.intervention-path-declared`) asks for a committed halt record for
`execute` and `autonomous` systems. Standard 10 R4 asks for the intervention capabilities that apply at each oversight point: before an
effect, decline and, where the output can be edited, correct; after the fact, correct or reverse a
reversible effect; during a run, pause and stop. Whether a rule for the general capability would duplicate or
widen Standard 11's, and in which shard it lives, is undecided. The title of that rule ("A human can
halt the system") also says more than its description (a committed document names the halt path). **Not resolved here, because it
changes an existing rule's scope.** **Impact if unanswered:** no rule covers the general capability;
both requirements are manual review.

### Q25 — Should a model-instance reviewer ever count as an overseer?

Standard 10 R2 does not count a component the system, or an automated agent acting for the requesting
party, controls as an overseer,
including a second instance of a model configured by the same operator. Automated review may be a
legitimate control, and the owner may want it to count in some arrangements. **Not resolved here,
because it is a judgment about what oversight means.** **Impact if unanswered:** a project using
model review still names a person, which may be stricter than intended.
*Numbering reconciled by the integrator at merge.*

### Q26 — Should a structural rule require a provenance statement for each declared data source?

`dataSources[].provenance` exists in the manifest schema as a free-text string and no rule reads it,
as `autonomyTier` was before Standard 11. A rule failing a project for a missing value would be
decidable and would test presence only. Whether it is wanted, at which level, and whether it is this
pack's rule where the entry's kind is `fine-tuning-set`, is undecided. **Not resolved here, because it
is a catalog decision with a level and a validation type.** **Impact if unanswered:** a manifest may
list no sources, or sources with no origin, and every check passes.

### Q27 — Who owns training-data provenance: item 12 or MachineLearningStandards?

Standard 13 says "training-data provenance is item 12's". The boundary review gives training data to
MachineLearningStandards and item 12 to retrieval corpora, prompt fixtures and evaluation sets.
Standard 12 follows the review and does not edit Standard 13's remark. **Not resolved here, because it
concerns what another pack's scope reaches.** **Impact if unanswered:** the two standards disagree on
the owner of training-data provenance.

### Q28 — Where does provenance end and consent and licensing (item 14) begin?

A provenance statement may name a licence. Whether naming it is provenance, or the beginning of item
14's subject, stays undecided. [Standard 14](../../standards/14-consent-and-licensing.md) is now written and leaves it open (it
records this question and does not settle it). **Not resolved here, because the owner has not ruled.** **Impact if unanswered:** a licence named in a statement may be read as establishing
permission, which it does not.

### Q29 — Does licensing in Standard 14 reach model-weight and output licences only (R5)?

Standard 14 R5 limits licensing to third-party model weights and their output licences. Widening it to
datasets and software dependencies, or dropping R5, are the alternatives. **Not resolved here, because it
is a scope judgment about the item's title.** **Impact if unanswered:** dataset and dependency licences
have no owner in this pack. Recommended: keep R5 as authored.

### Q30 — Where should a permission, retention, access or retrieval record live?

Standards 14 (R1 to R3 and R5), 15 (R1 to R5), 16 (R1, R5), 20 (R1, R3 to R6), 22 (R2, R4, R6) and 24 (R1 to
R3) each need a record that no closed schema can hold and no rule can find, per each standard's Implementation
table. Options: a schema-versioning change, a named project document a
future rule can find, or prose only. **Not resolved here, because it is a schema-versioning decision that
Phase 2 section 8 puts out of scope.** **Impact if unanswered:** none of those requirements is
machine-checkable. Recommended: a named document first, schema later.

### Q31 — Is the expiry-driven versus request-driven deletion split between Standards 15 and 13 right?

Standard 15 takes expiry-driven deletion, derived copies, backups, provider copies and training use;
Standard 13 R5 takes request-driven deletion. Standard 15 R1, R2 and R4 also overlap Standard 13 R4 (a
declaration of how long prompts, completions and traces are kept, what deletes them, and provider retention);
Standard 15 says it extends that requirement and moves none. This is the placement question Q10 and owner option C
(2026-10-15, #53) keeps open; no rule moved. **Not resolved here, because the owner holds Q10 open.**
**Impact if unanswered:** the split stays provisional.

### Q32 — Should Standard 15 name an interim memorization-test method?

R6 requires a non-memorization claim to name the test it relies on and names none. **Not resolved here,
because a method is an ML-pack matter.** **Impact if unanswered:** claims name private tests.

### Q33 — Where is the line between Standards 16, 22 and 36 on whose rights a tool call is checked against?

Standard 16 R3 (tool use authorised against the requesting principal) and Standard 22 R5 (a call carries
no more authority than its principal) overlap, and Standard 36 will touch audit of the same calls.
**Not resolved here, because the three standards were written concurrently and the owner has not ruled.**
**Impact if unanswered:** one act may be reported under two standards. Recommended: one owner per act.

### Q34 — Which namespace would tool-call rules use, and should the tool-permissions schema gain per-tool fields?

No `tool` namespace is reserved. Standard 22 R2, R4 and R6 would need a parameter schema, a pinned
definition revision and a result limit, which `schemas/tool-permissions.schema.json` cannot hold.
**Not resolved here, because it is a catalog and schema-versioning decision.** **Impact if unanswered:**
Standard 22 stays prose only. Recommended: defer to Phase 3 or later.

### Q35 — Does Standard 51 R2 hand all trust-class ground to item 24, or only part of it?

Standard 24 R4 carries source and trust class to the consumer; Standard 21 R3 and Standard 51 R2 touch the
same ground, and Q18 (is non-fetched tool output within Standard 51 R2) is open. **Not resolved here,
because it concerns the scope of an already-written standard.** **Impact if unanswered:** the split drawn
in Standard 24 is unconfirmed. Recommended: keep the split as drawn.

### Q36 — Is a user-supplied document or a connector a retrieval path (item 24) or a tool surface (item 22)?

Standard 24 treats it as a retrieval path while item 22 was unwritten; Standard 22 now exists.
**Not resolved here, because it is a boundary judgment between two standards.** **Impact if unanswered:**
content fetched by a connector may be owned by both or by neither.

### Q37 — Should Standard 20's "who decided" record (R4) be tied to Standard 45's approval gates?

R4 requires a record naming the decider of an adopted failing change and defines no role.
**Not resolved here, because the author's reading is that Standard 45's reach over model and prompt changes is not
settled by its text; this is a judgment and no passage records it.**
**Impact if unanswered:** the decider may be anyone. Recommended: leave as written.

### Q38 — Which namespace would any uncertainty, reproducibility or lineage rule use?

`uncertainty`, `abstention` and `reproducibility` are other packs' namespaces; `honesty` and `lineage` are
reserved here and have no shard. Standards 26, 30 and 31 mint no rule. **Not resolved here, because
minting a rule or shard is owner-only.** **Impact if unanswered:** those standards stay prose only.
Recommended: mint nothing for now.

### Q39 — Is a self-reported confidence a defensible measure for a generative system (Standard 26)?

The boundary review records this as unknown. Standard 26 R3 and R4 are written not to depend on the answer
(the basis is recorded; a correctness claim names its measurement). **Not resolved here, because it is a
judgment about an evaluation method.** **Impact if unanswered:** none for the text as written.

### Q40 — Is a refusal on misuse, safety or authority grounds an abstention (Standard 26 R1)?

Standard 26 excludes it and points to Standards 9 and 10; Standard 10 R5 says a decline must stick.
**Not resolved here, because it is a boundary judgment.** **Impact if unanswered:** a decline for
authority reasons is outside Standard 26. Recommended: keep the exclusion.

### Q41 — Where does "whether a citation resolves" sit between Standards 25 R4 and 27?

Standard 7 and the boundary review give item 27 "whether a citation is owed and whether it resolves";
Standard 25 R4 requires a generated referent to be resolved before use. Standard 27 leaves resolution to
25 R4. **Not resolved here, because it concerns the scope of an already-written standard.** **Impact if
unanswered:** the Standard 7 boundary table and Standard 27 differ. Recommended: 25 R4 owns resolution;
amend Standard 7 line 63 to say so.

### Q42 — Should a response-inputs record (Standard 27) be a declared artifact?

Standard 27 R2 depends on a record of the sources a response was produced with; the schemas have no
place for it. **Not resolved here, because it is a schema-versioning decision.** **Impact if unanswered:**
those requirements are not machine-checkable. Recommended: leave project-private until Phase 3.

### Q43 — Where is the line between Standards 28, 52 and 25 for claims about capability and the system's own state?

Standard 28 R2 and R3 carry MUST NOT limbs that overlap the prohibition face (item 52, unwritten; its faces
are not yet drawn), and "I did X" claims are also statements of the system's own state (Standard 25
Scope). Item 52 is the future owner of the prohibition face; until it is written nothing states what it
will hold. **Not resolved here, because it concerns two standards' shared ground and one of them does not
exist.** **Impact if unanswered:** one act may be reported under two standards. Recommended: Standard 28
keeps the positive duty and its limbs, and item 52 holds the faces Standard 28 does not state, by
reference, when it is written.

### Q44 — Does model lineage (Standard 30 R3) belong here or with MachineLearningStandards?

The boundary entry records evidence only for dataset, feature and prompt lineage. Standard 30 R3 also
covers a consumed model's replacement and a derived model's base. **Not resolved here, because it
concerns another pack's scope.** **Impact if unanswered:** overlap with MachineLearningStandards is
possible. Recommended: keep R3 here, check with that pack's maintainers.

### Q45 — Where does item 29 end and items 30, 31 and 32 begin, and does posture O hold for item 29?

Standards 29 to 32 were written concurrently. Standard 29 owns the change record and release record and
asks a version identifier of every behaviour-determining component (R1); 30 owns the lineage chain and,
for a prompt, the stricter identifier rule over the assembled whole (R1) and the refusal of a moving alias
as a revision (R5); 31 owns run parameters and repeat claims; 32 owns the rollback target and procedure.
Identity is therefore shared ground between 29 R1 and 30 R1 and R5, not owned by one: the two are written
to be met together and cross-reference each other, and 29's alias clause and 30 R5 are aligned (the revision
is what the alias resolved to). Two further overlaps are cross-referenced and not owned by either side:
29 R4 against Standard 20 R1 (a re-run observing a change is one way an upstream change becomes known),
and 31 R3 against Standard 20 R3 (20 R3 governs the pass or fail recorded, 31 R3 what the report says a
difference inside the variation is). The boundary review's O record for item 29 is a generic search and
does not address MachineLearningStandards dataset versioning or reproducibility. **Not resolved here,
because the lines are authored and the posture check is a human recheck.** **Impact if unanswered:** shared
ground may be stated twice. Recommended: keep the split as drawn.

### Q46 — Should retrieval corpus versioning fall under item 29, item 12 or 30, or MachineLearningStandards?

Standard 29 covers retrieval configuration and excludes corpus content. Standard 7 records this pack as adding
retrieval corpora, prompt fixtures and eval sets to MachineLearningStandards' dataset ground; Standard 12
covers where they came from, and Standard 30 does not claim their lineage. **Not resolved here, because it
concerns three owners' scope.** **Impact if unanswered:** corpus content has no versioning owner.

### Q47 — Should a change, rollback target or release record have a declared home?

Standards 29 (R2, R3), 30 (R2, R3, R5) and 32 (R1, R2, R6) each need a record the closed schemas cannot
hold. Same shape as Q30. **Not resolved here, because it is a schema-versioning decision.** **Impact if
unanswered:** not machine-checkable. Recommended: a named document first.

### Q48 — Is the rollback versus fallback split between Standards 32 and 44 right?

Standard 44 covers system-chosen run-time fallback and provider-side change; Standard 32 covers
person-invoked reversion of a project change. **Not resolved here, because it is a boundary judgment.**
**Impact if unanswered:** the two exercise requirements (44 R5, 32 R6) may drift. Recommended: keep the
split and cross-reference.

### Q49 — Should a requirement that constrains the framework carry a severity?

Standards 25, 33, 39 and 40 give their framework-constraint requirement no severity; Standards 41 and 44 and
the batch 2 standards 26 to 32 give it `error`. Both readings are in the repository. **Not resolved here,
because it is a convention across written standards.** **Impact if unanswered:** the same kind of
requirement is tabled differently. Recommended: `error` for all, since each is non-exemptible and no
rule yet carries it.

### Q50 — Is "no later than the next release record" the right deadline for a change outside a release?

Standard 29 R3 requires a change record before a change takes effect in a release, which cannot be met by a
change made directly on a running system or by someone else. R4 gives an upstream change the deadline of the
next release record, and R5 gives an out-of-release change the same one. That deadline is authored here, not
derived. **Not resolved here, because it is a normative judgment.** **Impact if unanswered:** a hot edit may
go unrecorded for as long as the project does not release. Recommended: keep it, and review a tighter
deadline for changes to safety-relevant components.

### Q51 — Which yields when a retention period ends while a revision is still named (Standard 30 R4 against Standard 15 R1)?

Standard 30 R4 requires a prompt revision to be kept as long as a retained output, call record or cited
result names it; Standard 15 R1 and R2 give the store holding it a period and a mechanism that deletes at
its end. The two can disagree. **Not resolved here, because it concerns two standards' shared ground.**
**Impact if unanswered:** a cited figure may name a revision the retention mechanism has deleted.
Recommended: the period of the thing that names a revision should not outlast the revision's.

## Not questions

Per-shard rule counts are a plan, not a measurement. The catalog does not exist yet, and
`inventory.mjs` is what will make those numbers true. They are not listed as unknowns because nobody
else can answer them — they are answered by doing the work.
