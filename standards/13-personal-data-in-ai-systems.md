# Standard 13 — Personal Data in AI Systems

An AI system collects personal data without anyone deciding to collect it. A user pastes a customer
complaint into a chat box, and the complaint names the customer. A retrieval step pulls a support
ticket into the context window, and the ticket carries an address. The completion quotes both. None
of this is a data-collection feature; it is the system doing what it was built to do, and the text
it handled goes wherever that system's text goes.

Where it goes is the problem. Prompts and completions are written to debug logs, exported to tracing
services, copied into evaluation sets because they make realistic test cases, embedded into vector
stores, and kept by whichever provider served the request. Each of those stores was usually added by
someone thinking about debugging, quality or latency, not about the people named in the text. A
deletion routine written for the primary database knows about none of them.

The failure this standard is written against is not a breach. It is personal data accumulating, by
default and unexamined, in the places an AI system's text ends up — and then being described as
handled because nobody found any.

Source: item 13 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "Data privacy" token of the "Data privacy, provenance, consent, retention, and access
control" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 13 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded
> in [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) by listing item 13 under
> `notGovernedElsewhere` — the search for an owner that found none — rather than by a posture entry.
> That review's substantive half is human judgment and carries `humanSignOff: null`. No maintainer
> of any adjacent pack has confirmed it.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws
it — anything that sends a prompt to a model, retrieves context for one, or acts on a model's output —
and specifically to the text such a system handles and the stores that text reaches.

Three terms, each defined by this standard rather than by the brief:

- **Personal data** is information about a person who can be identified from it, alone or combined
  with other information the system holds or can obtain. It includes free text a user typed and
  content a retrieval step supplied, whether or not anyone intended it to be there.
- **Real** personal data is personal data about an actual person, including a copy of a production
  record whose direct identifiers have been replaced but whose remaining content still identifies
  someone. Its opposite, for this standard, is **synthetic** data: data generated so that it describes
  no actual person.
- A **model-adjacent store** is any store the system writes prompt, completion, retrieved or trace
  text into, other than its primary database — at minimum prompt logs, traces, evaluation sets and
  vector stores, the four named by R5's rule.

**This standard is not a legal or regulatory standard, and meeting it establishes conformance with no
privacy law.** Nothing below states what any statute requires, and no result this framework reports
under this standard is a legal finding. A project subject to privacy regulation answers to that
regulation separately; this standard neither substitutes for that work nor claims to be part of it.
R6 makes the second half binding on this framework.

**Where each requirement reaches.** R1 reaches systems that keep prompt corpora or evaluation
fixtures. R2 reaches systems that have prompt files or evaluation fixtures, and it concerns
credentials, which are not personal data; why it sits here is stated under R2 and not resolved. R3
reaches systems that log, trace or export prompt or completion text. R4 and R5 reach systems that
keep prompts, completions or traces, or hold personal data in any model-adjacent store. A system with
none of a requirement's subject may declare that rule not-applicable under
[Standard 2](02-ai-risk-tiering-and-applicability.md) R4, with a reason and a `revisitWhen` — and
Standard 2 R4 is explicit that "We have no personal data in fixtures" is a claim, not a finding that
nobody looked.

The boundary with this standard's neighbours, none of whose ground is claimed:

- **Item 12, Context and Corpus Provenance** (unwritten, posture B) — where a corpus, fixture or
  evaluation set came from. R1 asks only whether its content is about real people.
- **Item 14, Consent and Licensing** (unwritten) — whether anyone agreed to their data being used,
  and on what terms. Nothing here makes a use of personal data permissible.
- **Item 15, Retention, Deletion, and Memorization** (unwritten, token `retention`) — see below.
- **Item 16, Access Control for Models, Context, and Tools** (unwritten) — who may read a log, a
  trace, a fixture or a vector store. R3 governs what a log holds, not who can open it.
- **Item 33, AI Observability** (unwritten, posture B) — whether and how inference calls are traced.
  R3 constrains the text a trace holds; it requires no trace to exist.
- **Item 34, AI Incident Response** (unwritten) — what happens once personal data is found somewhere
  it should not be.
- **Item 49, Data and Privacy Prohibitions** (unwritten, class A) — see below.
- **[Standard 21](21-prompt-and-instruction-security.md)** — credentials in model context, which its
  R4 prohibits. R2 here overlaps it, and the overlap is recorded under R2 rather than resolved.
- **UIUXDesignStandards**, which also uses the `privacy.` rule-id segment. Its Standard 25, Privacy
  UX, applies to interfaces that collect, display or share personal or sensitive information, and
  requires that privacy choices be presented honestly; `privacy.sensitive-data-masked` requires
  sensitive values to be masked by default in an interface, and `privacy.no-deceptive-consent`
  forbids consent obtained deceptively. **How personal data is shown to a user, and how a user is
  asked for consent, is that pack's ground.** This standard governs the text an AI system stores and
  sends, which no interface displays.

**The boundary with item 15 is drawn by this document, and the rule placement behind it is not
explained by anything recorded.** Two rules in `rules/privacy.json` — R4's and R5's — concern
retention and deletion and cite standard 13, while the specification gives item 15 the title
"Retention, Deletion, and Memorization" and the brief token `retention`. This standard states both
rules because their recorded identity cites it. It claims, for R4 and R5, only that retention of
prompts, completions and traces is **declared** and that a deletion path **reaches** the
model-adjacent stores. How long any data should be kept, deletion schedules and their enforcement,
deletion from backups, and memorization of data by a model's weights are item 15's subject and are
not addressed here. Whether the two rules belong to item 15 is an open question this document records
and does not decide; see Additions.

**This standard mints no prohibition, and adds no rule.** The specification lists every must-never
requirement as class-A work in Band L, and its Authored items table names item 49, Data and Privacy
Prohibitions, as the negative face of `Data privacy` — this item's own token. Three rules stated
here, R1's, R2's and R3's, are `forbidden`. They were minted in the Phase 1 shard, before this
document or item 49's existed, and they cite standard 13. Whether they are item 49's prohibitions
stated early, or item 13's rules that happen to be prohibitive, is not decided by the specification
and is not decided here. They are stated as they stand.

**Risk tier does not grade this standard.** Nothing below becomes lighter at a lower tier: Standard 2
R3 forbids a tier from reducing a rule's level, severity or exemptibility, and allows it only to decide
whether a rule's subject is in scope. **This standard does not restate, extend, or rely on Standard 2
R2, and takes no position on the open question recorded as Q7** in
[`artifacts/project-plan-breakdown/08-open-questions.md`](../artifacts/project-plan-breakdown/08-open-questions.md).
Nothing here depends on how Q7, or Q9, is resolved.

## Requirements

### R1 — Keep real personal data out of prompt corpora and evaluation fixtures

**Prompt corpora and evaluation fixtures MUST NOT contain real personal data; they MUST contain
synthetic data.**

Fixtures are the least-protected copy of any data a team holds. They are committed to the repository,
pasted into issues and pull requests, sent to a model provider on every evaluation run, and shared
with anyone who needs to reproduce a result — all because everyone treats them as test material. The
same records in a production database would sit behind access control and a retention policy. The
rule's rationale says exactly this, and it is why the rule is `forbidden` rather than advisory.

**Replacing names is not the same as being synthetic.** A support ticket whose sender's name has been
swapped for a placeholder still describes that person's order, their complaint and often their
address. Under this standard's definitions it is real personal data. What makes a fixture synthetic is
how it was produced — generated to describe nobody — not how realistic or unrealistic it looks.

**A label is a claim, not evidence.** The manifest schema lets a data source be declared with
`synthetic: true`, and the rule's remediation asks for that label. The label records what the project
says; it cannot show that the data was generated rather than copied, and nothing in this framework
reads it. A dataset labelled synthetic that was exported from production fails R1 exactly as an
unlabelled one does.

R1's rule names prompt corpora and evaluation fixtures. It does not reach a fine-tuning set, which the
manifest schema also distinguishes, and this standard does not extend it there: personal data in
training data and its memorization by a model are item 15's subject, and training-data provenance is
item 12's.

Rule `privacy.no-real-personal-data-in-fixtures`.

### R2 — Carry no credentials in prompt assets

**A prompt file or an evaluation fixture MUST NOT contain an API key, token or other credential.**

A credential committed in a prompt asset is replicated into every trace of every call that uses it,
and is reachable by any content that can instruct the model to repeat its context. Where a tool needs
a credential, the tool layer holds it; the model never needs to see it. Removing the credential is not
enough once it has been committed: it remains in repository history and in every log that recorded
it, which is why the rule's remediation says to rotate it.

**A credential is not personal data, and the reason this rule sits under this item is not recorded.**
The rule was placed in the `privacy.` shard, citing standard 13, in Phase 1. Its rationale concerns
replication and injection, not privacy. This document does not supply a justification it cannot find.
The nearest honest description is that R2 and R1 share a subject — what may be committed inside a
prompt asset or fixture — and differ in what they prohibit there.

**R2 overlaps [Standard 21](21-prompt-and-instruction-security.md) R4.** Its rule,
`promptsec.no-secrets-in-context`, prohibits a credential in a prompt, a context window or a retrieved
document. A credential committed in a prompt file falls within both rules' descriptions, and both are
`forbidden`, `error`, `code-analysis` and non-exemptible. Standard 21's rule is the broader, covering
runtime context as well as committed assets; this rule adds evaluation fixtures, which Standard 21's
description does not name. Today the overlap has no effect, because neither rule has a detector. Once
either does, one credential could be reported twice under two standards. **Which rule should own the
committed-asset case, and whether this one should move, is not decided here.**

Rule `privacy.no-credentials-in-prompts`, **non-exemptible**. Its `$exemptibilityNote` records that
no system legitimately requires a live credential inside a prompt asset.

### R3 — Redact prompts and completions before they are logged

**Where a system logs, traces or exports prompt or completion text, that text MUST pass through
redaction first.**

Prompt logs are, as the rule's rationale says, the highest-volume and least-scrutinised store of
user-supplied text in an AI system, kept under a logging policy that was not written with personal
data in mind. The characteristic failure is not a decision to log personal data. It is debug logging
that was switched on to diagnose a problem and never switched off, or a tracing exporter added later
that sends raw request bodies to a third-party service while the application's own logs are redacted.

**Every path counts.** A system whose application logs redact and whose tracing exporter does not has
not met R3. Logs, traces, analytics events and error reports that carry prompt or completion text are
all logging in R3's sense. Logging that carries no prompt or completion text — token counts, latency,
model identifiers, status codes — is outside it.

**Redaction here means removing or replacing personal data and credentials in the text before it
reaches the sink.** R3 does not claim that any redaction step is complete. A redactor removes what it
recognises, and whether it recognises the personal data a given system actually receives is a
question about its behaviour on real inputs. A redaction step's presence is the evidence R3 asks for;
it is not evidence that the resulting logs hold no personal data, and R6 forbids this framework from
presenting it as that.

What a misuse-signal record under [Standard 9](09-misuse-and-abuse-prevention.md) R4 may retain is
bound by this requirement, as Standard 9 states.

Rule `privacy.no-unredacted-prompt-logging`.

### R4 — Declare how long prompts, completions and traces are kept, and what deletes them

**A system that keeps prompts, completions or traces MUST have a committed declaration stating, for
each store that holds them, how long they are kept and what deletes them; and the declaration MUST
state what is known of retention by any model provider the system sends prompts to, or that it is
unknown.**

An undeclared retention period is an indefinite one. It defaults to whatever the logging platform,
the tracing vendor or the provider keeps, and nobody chose any of those numbers with the people named
in the text in mind. The rule's rationale names the consequence: indefinite retention of model context
is what turns a small privacy incident into a large one.

**The provider's copy is part of the answer.** A prompt sent to a hosted model may be kept by the
provider under terms the project does not control. R4 does not require the project to control it. It
requires the declaration to say what the project knows about it, so that "we keep nothing" is not
read as "nothing is kept".

**R4 asks that retention be declared, not that it be short.** What period is appropriate is item 15's
subject and is not stated here.

**The rule's remediation says to declare retention in the manifest, and the manifest cannot hold it.**
`schemas/ai-system-manifest.schema.json` is `additionalProperties: false` and has no field for
retention or deletion. A manifest carrying such a declaration fails schema validation, and with it
`lifecycle.manifest-valid`. A conformant project therefore cannot follow the remediation as written.
Until that changes, R4 is met by a committed document, and this standard does not require the
manifest as its location. The mismatch is recorded under Validation and returned as a proposal; it is
not resolved here.

Rule `privacy.retention-declared`.

### R5 — Make a deletion path reach every model-adjacent store

**A system that holds personal data in any model-adjacent store MUST have a deletion path by which a
request to delete a person's data reaches every such store it controls — at minimum its prompt logs,
traces, evaluation sets and vector stores, not only its primary database — and MUST record a review of
that path against the stores the system currently has.**

Deletion routines are written once, for the database that existed when they were written. A vector
store added a year later, a trace pipeline, an evaluation set assembled from real conversations — each
is a copy the routine does not know about, and, as the rule's rationale says, nothing reports the
omission. The person who asked to be deleted is deleted from the one place they were least likely to
be found.

**The review is part of the requirement because the list of stores changes.** A deletion path that
reached every store when it was written stops doing so the first time a store is added. The record of
review names the stores checked, so that a store missing from it is visible.

R5 reaches stores the system controls. Data held by a model provider under its own retention terms is
R4's declaration, not R5's path. Removing a person's data from a trained model's weights is
memorization, which is item 15's subject and is not claimed.

Rule `privacy.deletion-path-exists`.

### R6 — No component of this framework may report personal data absent, or privacy established

**No detector, heuristic, or audit finding in this framework MAY report personal data or credentials
as absent, logging as redacted, or retention and deletion as adequate, on the basis of a search that
found nothing, a label, or a document's presence; a `passed` result for any rule this standard states
MUST NOT be presented as evidence that no personal data or credential is present; and no output of
this framework MAY present a result under this standard as conformance with any privacy law or
regulation.**

Every check that could be written for this standard's subject is a search for recognisable shapes: an
email address, a card number, a key prefix, a call to a logging function with a prompt variable in
it. A search that finds none of them has found none of them. Real personal data in a free-text field
matches no pattern; a credential with an unfamiliar prefix matches no pattern; a synthetic fixture
built to look realistic matches every pattern. Reporting the silence of such a search as "no personal
data" would be the framework asserting something about people it has no way to know.

The legal clause exists because the words overlap. "Privacy", "retention" and "deletion" are also the
vocabulary of privacy regulation, and a verdict that used them without qualification would be read by
somebody as a compliance statement it is not.

**This requirement concerns what a check may claim. It is not a restatement of Standard 2 R2**,
neither narrows nor extends it, and has no bearing on Q7.

There is no rule for R6. It constrains this framework's own implementation rather than a consuming
project, and a project cannot fail it. It is enforced by construction and by review of this
repository, which is named as the weaker mechanism it is in Implementation.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Production as test data | An evaluation set is built by exporting real support conversations, committed, and run against a hosted model on every build | R1 |
| Pseudonymised, still real | Names in a fixture are replaced; the text still describes identifiable people | R1 |
| Labelled synthetic, is not | A data source declared `synthetic: true` was copied from production; nothing reads the label | R1 — **not caught**; see Implementation |
| The key in the prompt | A system prompt carries an API key "for the tool to use" | R2, and Standard 21 R4 |
| The key in the fixture | A recorded request fixture keeps its authorization header | R2 |
| Removed but not rotated | A committed credential is deleted from the file and remains valid, and in history | R2 |
| Debug logging that shipped | Full prompts logged at debug level to diagnose one issue, never turned off | R3 |
| Redaction on one path | Application logs redact; the tracing exporter sends raw prompt text to a third-party service | R3 |
| Redaction taken as removal | A redaction step exists and is read as proof that no personal data is logged | R3, R6 |
| Indefinite by default | No retention is stated; logs and traces are kept as long as the platform's default | R4 |
| The provider's copy | Retention is declared for the system's own stores and says nothing about the hosted provider's | R4 |
| Declared where the schema refuses it | Following the rule's remediation, retention is written into `ai-system.yml`, which then fails `lifecycle.manifest-valid` | R4 — see Validation |
| Deletion that stops at the database | A person's account is deleted; their text remains in the vector store, the traces and an evaluation set | R5 |
| The store added later | A vector store is added after the deletion routine was written, and nobody extends the routine | R5 |
| Silence reported as absence | A scan finds no email-address pattern and a report says the fixtures contain no personal data | R6 |
| A result read as legal compliance | A result under this standard is quoted as evidence of conformance with a privacy regulation | R6 |
| A false not-applicable that nothing contradicts | A policy declares R3's rule not-applicable while the system logs raw prompts, and the result is quietly `skipped` | **Not caught**; see Validation |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | For each prompt corpus and evaluation fixture, how its content was produced, showing it describes no actual person | Committed alongside the data. The manifest's `dataSources` entries can record `kind` and `synthetic`, which is a declaration, not this evidence | Human review of the data and of how it was generated |
| R2 | Prompt files and fixtures free of credentials, and the tool layer holding the credentials the system uses | Committed files, including their history | Human review in this release. No detector |
| R3 | Every place prompt or completion text is written — logs, traces, exports, error reports — and the redaction step in front of each | Code, and logging and tracing configuration, some of which is frequently outside the repository | Code review, by someone who can see each sink's configuration |
| R4 | The retention declaration: for each store, how long prompts, completions and traces are kept and what deletes them; and what is known of provider retention | A committed document. **No manifest field can hold it**: besides its `$scaffold` marker, `schemas/ai-system-manifest.schema.json` has fields for system, models, prompts, tools, data sources and evaluation, and nothing for retention | Human review |
| R5 | The deletion path, the list of model-adjacent stores, and the record of a review of the path against that list | A committed design record or runbook; the stores' configuration | Human review, by someone with access to the stores. Whether a deletion actually occurred is an operational fact the repository does not hold |
| R6 | The detectors bound to this standard's rules — there are none — and the messages the verdict reports for them | `EVALUATED_RULES` in `scripts/standards.mjs`; `evaluateRule()` in `scripts/compliance.mjs` | Code review |

The gap worth naming: **every item of evidence above is located and read by a human, and by nothing
else in this release.** Much of it — a tracing vendor's configuration, a provider's retention terms,
the contents of a vector store — is not in the repository at all.

## Validation, severity, and exemptibility

<!-- BEGIN GENERATED FROM rules/privacy.json — DO NOT EDIT. Verified by test/standards-tables.test.mjs. -->

| Requirement | Rule | Level | Severity | Validation | Exemptible |
| --- | --- | --- | --- | --- | --- |
| R1 | `privacy.no-real-personal-data-in-fixtures` | forbidden | error | code-analysis | yes |
| R2 | `privacy.no-credentials-in-prompts` | forbidden | error | code-analysis | **no** |
| R3 | `privacy.no-unredacted-prompt-logging` | forbidden | error | code-analysis | yes |
| R4 | `privacy.retention-declared` | required | error | document | yes |
| R5 | `privacy.deletion-path-exists` | required | error | manual-review | yes |

<!-- END GENERATED -->

**R6 has no rule, and this is deliberate.** It constrains this framework rather than a consuming
project; a project cannot violate it, and a rule nobody can fail would enlarge the catalog without
adding a check.

**Every rule above keeps its Phase 1 identity unchanged.** All five were minted with
`introducedIn` `0.1.0`, cite standard 13, and declare assurance `none`. This document states them; it
does not re-mint, re-level or re-type any of them, and it adds no rule to `rules/privacy.json`.

**No detector examines any of the five.** None is in `EVALUATED_RULES` in `scripts/standards.mjs`,
which lists nine rule ids. For an applicable rule outside that list, `evaluateRule()` in
`scripts/compliance.mjs` returns `skipped` with disposition `not-evaluated` before any observation is
read, with the message "No detector in this release examines this rule." for R1 to R4's rules and
"Requires human review. No automated check can establish this." for R5's. `distinction()` turns that
into `prohibited-but-unestablished` for the three `forbidden` rules, which `evaluate()` also lists in
`unestablishedProhibitions`, and into `not-evaluated` for the two `required` ones. Any of the five,
while applicable, keeps the status from `COMPLIANT`.

That was observed rather than inferred, in two uncommitted runs of `node scripts/standards.mjs
validate --json` made while writing this document. Against this repository, R1's and R2's rules
report `prohibited-but-unestablished`, and R3's, R4's and R5's report `skipped` / `not-applicable`,
because `ai-policy.yml` declares those three not-applicable. Against a throwaway copy of
`test/fixtures/valid-manifest/`, whose policy declares only R2's rule, all five are applicable at their
catalog levels: the three `forbidden` rules report `prohibited-but-unestablished` and the two
`required` rules `not-evaluated`.

**A false not-applicable declaration for any of these rules is never contradicted.**
`checkApplicabilityContradictions()` in `scripts/standards.mjs` blocks the verdict only when a detector
has observed a violation of a rule the policy declares not-applicable. No detector observes any rule
here, so a policy declaring R3's rule not-applicable for a system that logs raw prompts reports
`skipped` / `not-applicable` and nothing else. The declaration's `reason` and `revisitWhen`, and the
human who reads them, are the only check.

**R4's rule is `document`, and no conformant file can hold the document the rule's remediation
names.** The remediation says "Declare retention and a deletion path in the manifest." The manifest
schema is closed and has no such field. This was checked, not assumed: the throwaway copy of
`valid-manifest/` above, given a top-level `retention` key, reported `lifecycle.manifest-valid`
`failed` with the message that property "retention" is not permitted. A `document` check written
later would also have no declared path to look in. This document does not add the field — a schema
change alters what a conformant consuming project may declare, and is a schema-versioning decision —
and does not edit the remediation; both are returned as proposals.

**R1, R2 and R3 are `code-analysis`, and in this release that names the kind of check intended, not a
check that exists.** Each is a question about the content of committed files or the behaviour of
code: whether fixture content describes real people, whether a string is a live credential, whether
every write of prompt text passes through redaction. The last needs data-flow analysis across the
logging and tracing paths; none of the three has any detector, and R6 bounds what one may claim when
it arrives.

**R5 is `manual-review`.** Whether a deletion path reaches every model-adjacent store requires knowing
which stores exist, some of which are configured outside the repository. Under `checkRule()` in
`scripts/catalog.mjs` a `manual-review` rule is attestable by default; the attestation mechanism is
Phase 4 and absent.

**Only R2's rule is `nonExemptible`**, and its `$exemptibilityNote` gives the reason. The other four
are exemptible, and **the shard records no note saying why**. This document does not supply a reason
as though one had been recorded.

**R2's rule overlaps `promptsec.no-secrets-in-context`**, Standard 21's R4 rule, as set out under R2.
Both are `forbidden`, `error`, `code-analysis`, assurance `none` and non-exemptible, and neither has a
detector.

**The five rules sit in `privacy.`**, one of the seventeen namespaces reserved in `NAMESPACES` in
`scripts/catalog.mjs`, and one of the six segments `SHARED_SEGMENTS` there records as also used by
another pack — UIUXDesignStandards, whose `privacy.sensitive-data-masked` and
`privacy.no-deceptive-consent` are recorded in `artifacts/foreign-namespace-inventory.json`. No full
id collides; [Standard 7](07-boundary-with-adjacent-standards.md) R4 forbids a colliding full id, not
a shared segment.

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control | Status in this release |
| --- | --- | --- | --- | --- |
| R1 | Human review of each corpus and fixture and of how it was produced | A fixture containing, or derived from, a record about an actual person — including one with its names replaced | Synthetic data built to look realistic must **not** be reported as real for its shape; a README describing the format of an email address must **not** fire | **No detector.** No mechanical falsifier |
| R2 | Human review of prompt files and fixtures | A live credential in a prompt file or an evaluation fixture | A placeholder such as `YOUR_API_KEY`, or a reference to an environment variable, must **not** be reported; a credential held by the tool layer must **not** be reported | **No detector.** No mechanical falsifier. Standard 21 records its R4 detector as Phase 3 |
| R3 | Code review of every write of prompt or completion text | A log, trace, export or error report receiving prompt or completion text that has not passed through redaction | Logging of token counts, latency or model identifiers, with no prompt text, must **not** be reported; a system that writes no prompt text anywhere is out of scope, not failing | **No detector.** No mechanical falsifier |
| R4 | Human review of the retention declaration | A store holding prompts, completions or traces with no stated period or deletion mechanism; no statement about provider retention | A declaration in a committed document must **not** be rejected for not being in the manifest, which cannot hold it; a long declared period must **not** fail R4, which asks for declaration, not brevity | **No detector.** No mechanical falsifier |
| R5 | Human review of the deletion path and its review record | A model-adjacent store holding personal data that the path does not reach, or that the review record does not name | A fully synthetic evaluation set holds no person's data and owes no deletion; a provider's store outside the system's control is R4's declaration, not a gap in R5's path | **No detector.** No mechanical falsifier |
| R6 | No rule in `rules/privacy.json` is in `EVALUATED_RULES` | A detector reporting personal data or credentials absent, logging redacted, or retention adequate, from a search's silence, a label or a document's presence; any output presenting a result here as legal conformance | The current `skipped` / `not-evaluated` messages for these rules are **not** violations: they report that nobody looked | **Enforced by construction** — no detector reads this standard's subject |

**No requirement in this standard has a mechanical falsifier in this release.** R1 to R5 are stated
with falsifiers a human can apply, and nothing in the suite applies any of them. R6's footing is the
absence of code, not a test that fails.

What the existing suite does touch, stated precisely because it is less than it may look:

- **No test asserts a result for any of the five rules by id.**
- **`test/binding.test.mjs` uses `privacy.retention-declared` as a phantom id** in its mutation test,
  to show that a rule claiming a detector it does not have is noticed. That is a test of the binding
  check, and depends on the rule having no detector.
- **Seventeen fixture policies under `test/fixtures/` declare `privacy.no-credentials-in-prompts` at
  `forbidden`.** No test examines that rule's result in them.
- **`test/distinction.test.mjs` asserts the derivation** that turns a `forbidden` rule nobody examined
  into `prohibited-but-unestablished`, and that the `unestablishedProhibitions` array agrees with the
  results. It is general, and names no rule from this standard.

Once this document is in `standards/`, `test/standards-tables.test.mjs` asserts that the generated
table above matches `rules/privacy.json` in both directions, and `node scripts/sync-rule-tables.mjs
--check` fails on any drift. Neither says anything about personal data.

## Exceptions and staleness

The exception mechanism is item 4's subject and is Phase 4 work; item 4 is unwritten.
`schemas/ai-policy.schema.json` is closed and has no `exceptions` or `attestations` property, and
`test/no-phase-creep.test.mjs` asserts both are absent. **In this release an exception to any rule
above cannot be recorded**, so none is exemptible in practice whatever the table says. A project's
honest options are to meet a rule, to declare its subject absent with a reason and a `revisitWhen`, or
to leave it unmet.

**R2's rule is non-exemptible, so no exception will reach it when the mechanism exists.** A committed
credential is not made safe by an approval; it is made safe by rotation.

When the mechanism exists, an exception to R1, R3, R4 or R5 records a known, approved gap in how a
system handles personal data, with an approver and a date. It does not make a use of personal data
lawful, consented or appropriate — items 14 and 15, and whatever regulation applies, are unaffected by
it.

**Staleness is conditional, not scheduled**, following Standard 2 R5. R4's declaration and R5's review
record describe a set of stores, and they stop holding when that set, or what flows into it, changes:

- A model-adjacent store is added — a vector store, a trace pipeline, an analytics export, a cache
  that keeps completions
- A logging or tracing destination is added or changed, including a third-party observability service
- A model provider is added or replaced, or a provider's retention terms or the system's retention
  setting with it change
- An evaluation set or prompt corpus is extended with material from a new source
- Personal data is found in a store the declaration or the deletion path does not name — what is done
  about that is item 34's subject, but the declaration no longer holds from the moment it is found

**The staleness risk is asymmetric.** Stores are added by people solving a debugging, quality or
latency problem, which is the moment nobody is thinking about deletion. Nothing in this release
detects any of these transitions.

## Additions this standard makes beyond the source

The brief contributes two words: **`Data privacy`**, as the first subject in the list "Data privacy,
provenance, consent, retention, and access control". It names data privacy as an area to cover. It
does not mention personal data, fixtures, credentials, logging, redaction, traces, vector stores,
providers, retention periods, deletion paths, or any law. The title "Personal Data in AI Systems" is
the specification's item title, derived from that token; it is not the brief's wording. Everything
normative here is authored, and none of it has owner approval:

- **The five rules themselves.** Their existence, wording, levels, severities, validation types,
  exemptibility and placement under standard 13 were authored in the Phase 1 shard, not taken from
  the brief. This document states them as recorded and changes none of them.
- **The definitions** of personal data, real personal data, synthetic data and a model-adjacent store,
  including the ruling that a pseudonymised production record is still real.
- **The statement that this is not a legal or regulatory standard**, and R6's clause forbidding this
  framework from presenting a result here as legal conformance.
- **The per-requirement scope decisions**: which systems R1 to R5 reach, and the reading that a system
  producing no prompt text in any log is out of R3's scope rather than failing it.
- **R1's readings**: that synthetic is a matter of how data was produced rather than how it looks; that
  the manifest's `synthetic` label is a claim and not evidence; and that R1's rule does not reach a
  fine-tuning set.
- **R2's framing** as sharing R1's subject — what may be committed in a prompt asset — and the explicit
  statement that the reason a credentials rule sits under a personal-data item is not recorded.
- **R3's readings**: that traces, analytics events and error reports carrying prompt text are logging;
  that metadata-only logging is outside it; what redaction means; and that a redaction step's
  presence does not establish that logs hold no personal data.
- **R4's additions to its rule's description**: per-store declaration, the obligation to state what is
  known of provider retention, the ruling that R4 asks for declaration and not brevity, and the
  decision that a committed document meets it while the manifest cannot hold it.
- **R5's additions to its rule's description**: "every such store it controls" as a reading of the
  rule's title, the four named stores as a minimum rather than a complete list, the review record
  naming the stores checked, and the exclusion of provider-held data and model weights.
- **R6 in full**, and its explicit separation from Standard 2 R2 and Q7.
- **The boundary decisions**: that the ground of items 12, 14, 15, 16, 33, 34 and 49 is not claimed;
  that R4 and R5 claim declaration and reach while periods, schedules, backups and memorization are
  item 15's; that how personal data is displayed and how consent is asked are UIUXDesignStandards'
  ground; and that the overlap of R2 with Standard 21 R4 is recorded rather than resolved.
- **Three open questions recorded and not resolved**: whether R4's and R5's rules belong to item 15;
  whether R2's credentials rule belongs under this item or with Standard 21's rule; and whether the
  three `forbidden` rules are item 49's prohibitions — Q10, Q11 and Q12 in
  `artifacts/project-plan-breakdown/08-open-questions.md`. Each changes a rule's `standard` field or a
  specification row, which is a catalog-identity decision rather than a document's.
- **The decision not to grade these requirements by risk tier**, on the basis of Standard 2 R3.
- **The admission that no requirement has a mechanical falsifier**, that a false not-applicable
  declaration for any of these rules is never contradicted, and that R4's remediation cannot be
  followed by a conformant manifest — the last observed by an uncommitted run rather than asserted by
  the suite.

## Relationship to other standards and ADRs

[Standard 1](01-ai-system-manifest.md) draws the scope this standard applies within. Its manifest
schema's `dataSources` entries can declare a `kind` — including `prompt-fixture` and
`evaluation-set` — and a `synthetic` flag, which R1 treats as a claim; the schema has no field for R4's
declaration or R5's path. Its R6 retirement plan is where undeleted personal data outliving a system is
named, and R5's deletion path is what such a plan would cite.

[Standard 2](02-ai-risk-tiering-and-applicability.md) is relied on for its R3 rule that a tier narrows
scope and never lowers a requirement, its R4 dispositions — which are why "no personal data here" must
be a reasoned declaration and not a default — and its R5 conditional expiry. **This standard does not
change Standard 2**: it does not restate or rely on R2, and does not propagate R2's word "propose",
pending Q7.

[Standard 5](05-verdict-vocabulary.md) defines `not-evaluated` and `prohibited-but-unestablished`. Its
R4 is why the three `forbidden` rules here report as unexamined prohibitions rather than disappearing
into the general unevaluated pile, and its R5 is why any of the five keeps a status from `COMPLIANT`.
[Standard 6](06-standard-structure-and-rule-identity.md) R3 is why every requirement here states a
falsifier, R5 is why the shared `privacy.` segment is declared rather than assumed exclusive, and R8 is
why R5's rule is attestable by default. [Standard 7](07-boundary-with-adjacent-standards.md) R1 records
"Personal data in prompts, traces and eval sets" as owned by this pack with no existing owner, which is
the division the `notGovernedElsewhere` record for this item evidences; its R4 governs the shared
segment.

[Standard 9](09-misuse-and-abuse-prevention.md) R4 requires misuse signals to be recorded and states
that a record holding prompt or completion text is subject to R3's rule, which it leaves to this item.
A misuse log is a model-adjacent store, so R4 and R5 here reach it too.

[Standard 21](21-prompt-and-instruction-security.md) R4 prohibits credentials in model context.
`promptsec.no-secrets-in-context` and R2's rule overlap on a credential committed in a prompt file, as
set out under R2. **21 governs what may enter a model's context at runtime; R2 here governs what may be
committed in a prompt asset or fixture**, and the two are not reconciled.

Unwritten items this standard defers to, by specification number: item 4 (exceptions); item 12
(provenance of corpora and fixtures); item 14 (consent and licensing); item 15 (retention periods,
deletion schedules and memorization, and the open question of R4's and R5's rules); item 16 (who may
read a store); item 33 (whether inference calls are traced); item 34 (what follows a privacy incident);
and item 49 (prohibitions on bullet 2's ground, whose relationship to the three `forbidden` rules here
the specification does not record).

Outside this repository: **UIUXDesignStandards** uses the `privacy.` segment for
`privacy.sensitive-data-masked`, under its Standard 25, Privacy UX, and `privacy.no-deceptive-consent`,
which its catalog cites to its Standard 29. Its Standard 25 applies to interfaces that collect, display
or share personal or sensitive information, and states that it is not a compliance framework for any
privacy regulation. Its catalog file and Standard 25 were read for this document at commit `86a7cd4`;
`git diff` shows neither changed since `3f9cb8e`, the commit the boundary review recorded. Nothing
here restates either rule.

No ADR covers this standard. `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. No requirement has a detector. R6's one mechanical guarantee is an absence.**

Stated as separate lists so that a proposal is not read as a capability.

**Implemented today.**

| Mechanism | What it does | Where |
| --- | --- | --- |
| Reporting of unexamined rules | R1 to R5's rules report `skipped` / `not-evaluated`, never `passed`, and keep an applicable project from `COMPLIANT` | `evaluateRule()` and `evaluate()` in `scripts/compliance.mjs` |
| Unexamined prohibitions | R1, R2 and R3's rules report `prohibited-but-unestablished` and are listed in `unestablishedProhibitions` | `distinction()` and `evaluate()` in `scripts/compliance.mjs` |
| Applicability declarations | A rule declared not-applicable with a reason reports `skipped` / `not-applicable` | `applyPolicy()` in `scripts/policy.mjs`; `evaluateRule()` in `scripts/compliance.mjs` |
| Manifest shape | Validates `dataSources[].kind` and `dataSources[].synthetic` as types, and refuses any undeclared field — including a retention field | `schemas/ai-system-manifest.schema.json`, through `lifecycle.manifest-valid` |
| Catalog invariants | Refuse a malformed rule; default `manual-review` rules to attestable | `checkRule()` in `scripts/catalog.mjs` |
| Generated-table verification | Asserts the Validation table and `rules/privacy.json` agree in both directions | `scripts/sync-rule-tables.mjs --check`; `test/standards-tables.test.mjs` |
| R6 by construction | `EVALUATED_RULES` lists nine rule ids, none in `privacy.`, and no detector reads fixture content for personal data, prompt assets for credentials, logging paths, or retention and deletion records | `EVALUATED_RULES` in `scripts/standards.mjs` |

The last three are general mechanisms, not work done for this standard.

**What nothing in this release does.** No script reads the manifest's `synthetic` flag; a search of
`scripts/` finds no occurrence of "synthetic", "redact", "retention" or "personal". The audit's
`detectPromptAssets` in `scripts/standards.mjs` lists files whose paths look like prompt assets as a
surface observation, and reads none of their content; it is bound to no rule. And because no detector
observes a privacy rule, `checkApplicabilityContradictions()` in `scripts/standards.mjs` can never block
on a false not-applicable declaration for one.

**Proposed, and deliberately absent from this release.**

| Proposed | Why it is not here |
| --- | --- |
| A credential detector over prompt assets and evaluation fixtures, for R2's rule | Phase 3 detector work; `artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` §8 lists `promptassets.mjs` as out of scope for this phase. It would serve Standard 21 R4's rule as well, and which rule it binds to depends on the open question under R2 |
| A personal-data pattern detector over fixtures, for R1's rule | Phase 3; the same §8 lists `pii.mjs`. A pattern match establishes shape, not whether a person is real: it fires on realistic synthetic data and misses real data in free text. Under `evaluateRule()` a clean observation reports `passed`, so R6 would govern how that result is presented |
| A check that prompt and completion text passes through redaction before every sink, for R3's rule | Needs data-flow analysis across logging and tracing paths, some configured outside the repository. Phase 3 at the earliest |
| Manifest fields for retention and a deletion path | A schema change alters what a conformant consuming project may declare. It is a schema-versioning decision, not a side effect of writing this document, and until it is made R4's remediation cannot be followed |
| A `document` check that a retention declaration exists | Would establish file presence, which R6 forbids reporting as adequacy, and with no path field it would have to guess filenames |
| Withdrawal of a not-applicable declaration when a privacy detector observes the subject | Follows automatically from `checkApplicabilityContradictions()` once any detector above exists; nothing to build for this standard alone |

**What no future release will implement.** A detector or report that states personal data or
credentials are absent, logging is redacted, or retention and deletion are adequate, from a search that
found nothing or from a document's presence; or that presents any result under this standard as
conformance with a privacy law. R6 forecloses both.

**R6 is enforced by review of this repository, which is weaker than a test.** Nothing prevents a future
contributor from rendering a `passed` result as "no personal data found", or from describing this
standard's verdict in regulatory terms; what stands in the way is this document, the `EVALUATED_RULES`
list, and whoever reads the diff.
