# Standard 16 — Access Control for Models, Context, and Tools

An AI system adds three things to an application that someone must decide who may reach: the model,
the context the model is given, and the tools the model can call. Each is usually wired up by the
person building the feature, with the credentials and the reach that person had at the time. A model
endpoint is paid for with a key that anyone holding it can use. A retrieval index is built by an
account that could read every document, and then answers questions for people who could read some of
them. A tool runs with the system's authority, and the model calls it on behalf of whoever is typing.
In each case the access that was convenient to build with becomes, unexamined, the access the system
grants.

This standard is about **whose access the system uses and what it records about that**. It asks that
a project say, for each model, context store and tool, who or what may use it; that what the system
retrieves and does for a person stay within what that person could do directly; and that the records
the system keeps of its own calls be no more readable than the data they were made from. It does not
prescribe an identity provider, a policy language or an access model.

The failure this standard is written against is borrowed authority: a person who may not read a
document, delete a record or call a model reaching it through the AI feature, because the feature
holds more access than the person does and nothing compares the two.

Source: item 16 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),
derived from the "access control" token of the "Data privacy, provenance, consent, retention, and access
control" bullet of [`artifacts/prompts/original_prompt.md`](../artifacts/prompts/original_prompt.md).

> **Numbering is frozen by the specification.** Item 16 of
> [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md), which
> passed both Phase 2 blocking reviews on 2026-09-04 — `node scripts/fidelity.mjs` and
> `node scripts/inventory.mjs`. Those reviews are mechanical. The boundary posture is **O**, recorded in
> [`artifacts/boundary-review.json`](../artifacts/boundary-review.json) under `notGovernedElsewhere`
> (a search of the nine packs' rules and standards file names found no owner), and that review's
> substantive half is human judgment and carries `humanSignOff: null`. No maintainer of any adjacent
> pack has confirmed it.
>
> **The brief supplies one phrase and this standard supplies the rest.** The brief's bullet names
> "access control" and states no requirement for it. The item is class `D` because its token is the
> brief's own; the requirements are this repository's judgment about it, and the
> [Additions](#additions-this-standard-makes-beyond-the-source) section lists them.

## Scope

Applies to any AI system within this pack's scope as [Standard 1](01-ai-system-manifest.md) draws it — a repository that invokes a model, retrieves context for one, or acts on a model's output — that has more than one principal, or whose resources can be reached by a principal other than its builder.

Covers: the recording of who may use each resource; whether retrieval and tool use stay within the requesting principal's rights; who may read the records of model calls; and the revocation of a grant. It prescribes no identity provider, authentication method, policy language or access model.

Terms, each defined once here and used verbatim below:

- **Resource** — a model endpoint, a context store (a document collection, database, vector index, cache or memory the system retrieves from), or a tool the model may invoke.
- **Principal** — a person, service or agent on whose behalf a request is made, as distinct from the system carrying it out.
- **Grant** — a permission for a principal to use a resource, held directly or by a credential.
- **Access record** — a project document naming each resource and the principals or classes of principal that hold a grant to it, and how a grant is revoked.
- **Call record** — a log, trace, recorded fixture, evaluation set or saved conversation that holds the prompts, completions or tool arguments of a call.

It does **not** cover, and claims none of the ground of:

- **Which tools a model may call, and which need approval.** [Standard 45](45-approval-gates.md) owns the tool permission manifest and the gate.
- **Whether an agent's credentials exceed its declared tools.** [Standard 23](23-agent-execution-security.md) R2 owns it; R3 here asks about the principal and not about the credential's breadth.
- **Whether personal data may be in a call record.** [Standard 13](13-personal-data-in-ai-systems.md) R3 owns what a log holds; R4 here asks only who may open it.
- **The security of a tool itself,** and retrieved content as untrusted input. Items 22 and 24 own them.
- **General application authentication and authorisation,** except where the AI feature reaches a resource on a principal's behalf.

**Boundary posture O — owned outright.** The boundary review lists this item among those for which no owner was found. This document accepts that record for what a repository can establish — whether the access actually enforced matches the access recorded — and narrows it there: that an access record exists and names each resource is a reviewable fact, and that retrieval and tool use respect a requesting principal's rights is testable with two principals. R1 to R5 are therefore `manual-review` obligations, not automated ones. It adds no precedent to the review's.

## Requirements

### R1 — Record who may use each resource

**A project MUST keep an access record naming, for each resource, the principals or classes of principal that hold a grant to it.**

A grant nobody wrote down cannot be reviewed, narrowed or revoked; it can only be discovered, usually
after use. The requirement does not choose a model of access. A record saying "any signed-in user of
the product" is a record, and a reviewer can disagree with it; an absent record leaves nothing to
disagree with.

### R2 — Retrieval is bounded by the requesting principal's rights

**Content returned from a context store MUST NOT include anything the requesting principal could not read directly, including content reached through an embedding, a cache or a summary derived from it.**

A retrieval index is commonly built by an account that sees every document and queried by users who
see a few. If the index returns what matches and nothing filters by principal, the AI feature is a
read path around the permissions of the source. Derived copies inherit the source's restrictions;
an embedding of a restricted document is the restricted document for this purpose. The test needs
two principals and one document only one of them may read.

### R3 — Tool use is authorised against the requesting principal

**A tool invoked on a principal's behalf MUST be authorised against that principal's rights, not only against the system's own.**

A tool that runs with the system's credential will do whatever that credential permits, for whoever
the model is talking to. The model does not know who may do what; the system has to. An agent that
deletes a record because a user asked, where the user could not delete it, has lent the user the
system's authority. This requirement is about whose rights the check uses. How much a credential can
do is [Standard 23](23-agent-execution-security.md) R2's, and whether a human must approve is
[Standard 45](45-approval-gates.md)'s.

### R4 — Restrict call records to those who could see their source

**A call record MUST NOT be readable by a principal who could not have read what it contains.**

Prompts carry the documents retrieved into them, and completions carry what the model said about
them. A log or trace store opened to the whole engineering team, or to an external tracing service,
makes every restricted document it quotes readable by that audience. [Standard 13](13-personal-data-in-ai-systems.md)
asks what a log holds; this asks who can open it. Where a record mixes sources, the strictest
restriction among them governs it.

### R5 — A grant has a revocation path

**The access record MUST state how each grant is revoked, and revoking a grant MUST end the access, including through a long-lived token, cache or session already issued.**

A model key shared in a team chat, an API token with no expiry and a cached retrieval result each
outlive the decision to remove access unless revocation reaches them. The requirement does not set
a lifetime or a rotation interval. It asks that removal be a described action with an effect, and
that the effect include copies of the grant already in circulation.

### R6 — This framework MUST NOT report access as controlled from the presence of a setting

**No detector, rule, audit finding or generated report in this framework MAY state that a system's access is controlled, restricted or secure because an authentication setting, a role name, a permission file or a declaration is present in the repository.**

This is a constraint on the framework, not on a project. A repository can show that a permission
file names a scope or that a role is configured; it cannot show that retrieval filters by principal
or that a revoked token stopped working. Reporting access as controlled from a presence would turn a
setting into an enforcement result.

## Failure modes

| Failure | What it looks like | Requirement |
| --- | --- | --- |
| Resource with no recorded access | A model endpoint, vector store or tool the system uses that the access record does not name, or that it names with no principals | R1 |
| Read path around the source | A user receives, in an answer or a citation, content from a document the user could not open directly; or a derived index serves a restricted document | R2 |
| Borrowed authority | An action taken through a tool at a user's request that the user could not perform directly, because the tool's check used only the system's credential | R3 |
| Open log of restricted text | Prompts or completions quoting restricted documents stored where a wider audience than the source's can read them | R4 |
| Revocation that does not reach | A removed user's token, key or session still works, or a cached result is still served after the grant was withdrawn; or a grant with no stated way to revoke it | R5 |
| Setting read as control | A framework report of "access controlled" because a role name or permission file is present | R6 |

## Evidence

| Requirement | Evidence | Where it lives | Established by |
| --- | --- | --- | --- |
| R1 | The access record, naming each resource and its principals, checked against the resources the system actually uses | A project document the project names — **no manifest or policy field exists for it; see Implementation** | Human review |
| R2 | A test or review record using two principals, one of whom may not read a given document, showing the document absent from that principal's retrieval results, citations and derived copies | The project's tests or review notes | Human review of the record; the behaviour is established only by running the test |
| R3 | A test or review record of a tool invoked for a principal who lacks the underlying right, showing it refused | The project's tests or review notes | Human review of the record; the behaviour is established only by running the test |
| R4 | The access list of each store of call records, compared with the access lists of the sources that appear in it | The logging or tracing configuration and the access record, often outside the repository | Human review, by someone with access to the store |
| R5 | The stated revocation action for each grant, and a record of a revocation followed by an attempted use | The access record and the project's operational notes | Human review of the record |
| R6 | The absence of any detector, rule, audit finding or generated report that reports access as controlled from a setting or presence | This repository's own detectors and tests | Code review; see Implementation |

Evidence for R1 and R5 is a human-authored record, and a record establishes that the project wrote
the grants down, not that the access enforced matches. Evidence for R2 and R3 is a test result a
reviewer reads; a repository holding the test does not establish that it was run or that it passes.
Whether access in a deployed system is as recorded is not-evaluable from the repository alone.

## Validation, severity, and exemptibility

**This standard has no catalog rules of its own in this release.**
The Phase 2 plan (`artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` section 6) asks that every standard cite at least one rule or record in its Validation section why it ships with none; this is that record. [Standard 6](06-standard-structure-and-rule-identity.md) R3 is a different obligation, that each requirement state a falsifier or be declared not-evaluable, and the Tests and falsifiers section below answers it.

Three reasons, stated so a reader can disagree with any one of them:

1. **There is no artifact a rule could read.** A rule for R1 or R5 would look for an access record, and neither `schemas/ai-system-manifest.schema.json` nor `schemas/ai-policy.schema.json` has a place to put one; both are closed. `schemas/tool-permissions.schema.json` records a tool's impact class, approval requirement and a `scope` string, and records no principal and no credential. A rule failing every project for omitting what no schema accepts would measure this framework's own incompleteness and blame the project for it. Adding a schema field is a schema-versioning decision, outside this slice (plan 02 section 8).
2. **The subject is behaviour at run time.** Whether retrieval filters by principal, whether a tool checks the caller's rights and whether a revoked token stops working are properties of a running system and its identity provider, mostly held outside the repository. A detector could only read a setting, which R6 forbids this framework from reporting as a result.
3. **No rule namespace exists for it.** No shard holds an access-control namespace, and this standard mints no id; naming one is a decision for the owner. A proposed rule, if one is natural, is recorded in the pull request that introduced this document for per-rule approval, and not here.

**Validation type.** R1 to R5 are `manual-review` obligations in this release; R6 constrains this framework and has no validation type, because the thing it prohibits is a behaviour of the tool. The validation type and the severity are different things.

**Severity.** One level per requirement, assigned to the requirement as a whole and not to how a finding is phrased. These levels are this repository's judgment, listed in Additions, and are not owner-approved:

| Requirement | Severity |
| --- | --- |
| R1 | warning |
| R2 | error |
| R3 | error |
| R4 | error |
| R5 | warning |
| R6 | error |

**Exemptibility.** R6 is not exemptible, for the reason R6 of [Standard 25](25-grounding-and-hallucination-control.md) is not. R2, R3 and R4 are not exemptible where the system has more than one principal, because an exception would record a project as knowingly letting a principal reach what it may not. R1 and R5 reach a system with a single principal and no resource beyond that principal's own only vacuously, and a system in that position records in its own documents that they do not reach it and why. This release has no policy mechanism for it: [Standard 2](02-ai-risk-tiering-and-applicability.md) R4 dispositions attach to catalog rules, and this standard has none. No level here is lowered by a risk tier (Standard 2 R3).

## Tests and falsifiers

| Requirement | Minimum test | Falsifier | Negative control |
| --- | --- | --- | --- |
| R1 | Each model endpoint, context store and tool the system uses appears in the access record with the principals or classes that hold a grant | A resource the system uses that the access record omits, or names with no principals | A system with one resource whose record says "the deploying service account only" must **not** be faulted for the narrow record |
| R2 | Query with a principal who may not read document D, where D matches the query; D is absent from the answer, the citations and any derived copy returned | D, or text derived from D, returned to that principal | A principal who may read D receiving it must **not** be faulted; a store whose documents are all readable by every principal has nothing to filter and must **not** be faulted |
| R3 | Invoke a tool for a principal lacking the underlying right; the invocation is refused | The invocation succeeds because the system's credential permits it | A principal who holds the right and succeeds must **not** be faulted; a tool with no effect on any restricted resource is out of scope |
| R4 | Compare each store of call records' readers with the readers of the sources appearing in it | A reader of a call record who could not read a source quoted in it | A call record containing only text readable by every principal who can open the record must **not** be faulted |
| R5 | Revoke a grant, then attempt use with a token, key or session issued before the revocation, and with a cached result | The attempt succeeds, or the access record gives no way to revoke the grant | A grant that expired by a stated lifetime before the attempt must **not** be faulted for failing to be revoked by hand |
| R6 | No detector, rule, audit finding or generated report in this repository states that access is controlled, restricted or secure from presence | A detector, rule, audit finding or report that does, because an authentication setting, role name, permission file or declaration is present | Reporting that a permission file was *found*, as an observation with no verdict, is permitted |

**No falsifier is automated in this release.** No rule reads this subject's artifact and no fixture carries one, so R1 to R5 are enforced by review or not at all, and R6 holds today only because no such detector exists. The falsifiers in the table are available for manual review; what this release lacks is a detector that applies them. A record made stale by the event in the staleness table below does not satisfy the minimum test it was offered for until it is re-made.

## Exceptions and staleness

There is no policy-level exception mechanism for R1 to R5 in this release, because no rule exists to except. A project that knowingly does not meet one records that in its own documents; Standard 2's dispositions apply to the application of a rule, and this standard has none.

**Attestations and expiry.** No attestation is produced for these records in this release. [Standard 6](06-standard-structure-and-rule-identity.md) R8 makes `manual-review` rules attestable by default, but it governs catalog rules, none exists here, and the attestation mechanism itself is later work ([Standard 5](05-verdict-vocabulary.md) records the `attested` disposition as not yet produced). No record under this standard expires on a schedule; [Standard 2](02-ai-risk-tiering-and-applicability.md) R5's event-driven expiry concerns applicability declarations and does not apply to these records.

**What makes a record stale.** One event per requirement; a record made before the event describes the earlier arrangement and no longer satisfies the requirement it was offered for until it is re-made.

| Requirement | Event that makes its record stale |
| --- | --- |
| R1 | Any change to anything this record names or relies on, including: a resource added, replaced or removed, or a change of who holds a grant. |
| R2 | Any change to anything this record names or relies on, including: a change to the retrieval path, an index rebuild, or a change to the source's permissions. |
| R3 | Any change to anything this record names or relies on, including: a tool added or changed, or a change of the credential it runs with. |
| R4 | Any change to anything this record names or relies on, including: a new store of call records, or a change to a store's readers. |
| R5 | Any change to anything this record names or relies on, including: a change of identity provider, token type or session lifetime. |
| R6 | A new detector, rule or report that touches access control. |

## Additions this standard makes beyond the source

**Nearly all of it.** The brief contributes two words, "access control", inside a bullet of five subjects and states no requirement, level or evidence for them. The item is class `D` because its subject token is derived from the brief; the requirements are not derived. Specifically authored here, none of it owner-approved:

- **R1 to R5 in full**, with the defined terms resource, principal, grant, access record and call record; the rule that retrieval and derived copies inherit the source's restrictions; the rule that a tool is authorised against the requesting principal; the rule that a call record is no more readable than its sources; and the rule that revocation reaches tokens and caches already issued.
- **R6**, the constraint on this framework, in the same form as the equivalent requirement in [Standard 25](25-grounding-and-hallucination-control.md) and [Standard 33](33-ai-observability.md).
- **That this standard prescribes no identity provider, authentication method, policy language or access model,** and the exclusions in Scope as division lines, which no one has confirmed.
- **The severity assignments** (one level per requirement, in Validation), the statement that no attestation or scheduled expiry exists in this release, and the staleness table.
- **The ruling that this standard ships with no catalog rules**, the three reasons for it, and the decision to name no rule id.

Not authored here: the posture is the boundary review's.

## Relationship to other standards and ADRs

[Standard 7](07-boundary-with-adjacent-standards.md) lists the subjects this pack owns and the packs that own the others; the boundary review records no owner for this item in the portfolio, so it has no counterpart to defer to or crosswalk. [Standard 45](45-approval-gates.md) owns the tool permission manifest and the approval gate; R3 here asks whose rights a tool call is checked against and does not restate either. [Standard 23](23-agent-execution-security.md) R2 compares an agent's credentials with its declared tools and names this item as the owner of who may use a resource; R3 here is that ground, and R2 there is unchanged. [Standard 13](13-personal-data-in-ai-systems.md) R3 governs what a log holds and names this item as the owner of who may read it; R4 here is that ground. [Standard 51](51-agent-and-tool-execution-prohibitions.md) R1 forbids an agent rewriting its own permissions, and R3 here does not depend on it. [Standard 1](01-ai-system-manifest.md) declares models and tools and declares no principal or grant; none is proposed by this standard. [Standard 2](02-ai-risk-tiering-and-applicability.md) R3 and R4 govern the applicability and non-lowering language used above, and [Standard 6](06-standard-structure-and-rule-identity.md) R3 is the requirement the Tests section answers. Items 14, 15, 22, 24 and 36 are not part of this change. **Outside this pack.** No adjacent pack's standard is recorded for this subject. No ADR covers this standard — `artifacts/adr/` does not exist in this release.

## Implementation

**Normative. Nothing about R1 to R5 is enforced; R6 holds today only because no such detector exists.**

Stated as two separate lists, because a reader scanning one table will otherwise carry a proposal away as a capability.

**Implemented today, and re-runnable now:**

| Requirement | State |
| --- | --- |
| R6 | **Holds today because no such detector exists; nothing prevents or tests one being added.** No detector, rule, audit finding or report in `scripts/`, `rules/` or `ai-policy.yml` has a concept of a principal, a grant or access being controlled. |
| Tool permission manifest shape | `schemas/tool-permissions.schema.json` validates each declared tool's `name`, `impact`, `requiresApproval` and `scope` as types, for Standard 45's rules. It records no principal, no grant and no credential, so it cannot hold R1's or R3's record |
| This document | Conformance of structure only, checked by `scripts/standards-sections.mjs`, `scripts/inventory.mjs` and the standards-tables test. That a document exists and is well-formed is not evidence of any project's access practice |

**Proposed, and deliberately absent from this release. None of the following exists:**

| Requirement | What would be needed | Why it is not here |
| --- | --- | --- |
| R1, R5 | A place to declare resources, grants and revocation: a schema change, or a named document a rule can find | Both schemas are closed; a change is a schema-versioning decision and Phase 2 section 8 puts it out of scope |
| R2, R3 | A fixture-based test harness with two principals run against a project's own system | It would execute a consuming project's code, and no such harness exists in this framework |
| R4 | A comparison of a log store's readers with its sources' | The readers are held outside the repository |
| R6 | A test asserting no detector, rule, audit finding or report emits an access verdict | None exists; it would be a regression guard even now, and is proposed here, not built |
| Rule id | A reserved-namespace id and a shard, once an owner decides | Not decided; this standard names none |

**What no future release will implement.** A detector that reports a system's access as controlled, restricted or secure from the presence of an authentication setting, a role name, a permission file or a declaration. R6 forecloses it, and the foreclosure is the point: a presence is not an enforcement.
