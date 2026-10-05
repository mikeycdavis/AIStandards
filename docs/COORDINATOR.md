# AIStandards — coordinator brief

> **Written 2026-10-03 for a Claude coordinator starting with no prior context.** This file is the
> *operating procedure*. It holds almost no state on purpose: state lives in
> [`HANDOFF.md`](HANDOFF.md) (what exists and what is verified) and in the GitHub backlog (what remains
> and its liveness), and a third copy would drift. Where this file disagrees with either, they win.
>
> Labels used: **OBSERVED** (read or run on the date above), **INFERRED**, **UNKNOWN**. Nothing here is a
> claim about owner intent beyond what the owner said in chat.

## 1 · Mission, and what "done" can honestly mean

The owner's instruction: work through **every item in the backlog until all phases are complete and no
items are left**, **in tandem with the other standards projects**.

**Read "no items left" as "no *executable* items left", and say so in every report.** Some items cannot
be finished by a coordinator, because finishing them needs a human or another project to decide or act.
Closing them anyway would break the repository's own invariants (§2). A correct finish has every item
either `COMPLETE` with evidence, or `BLOCKED` / `DEFERRED` with the specific human decision named on the
issue. Items that will end this way, **OBSERVED** from the plan files:

| Cannot be completed autonomously | Why | Where recorded |
| --- | --- | --- |
| **Phase 7**, and cutting `1.0.0` | Needs an externally held scope registry, a reviewer already in its `authorisedReviewers`, a route for invoking this pack in a pipeline, and an **observed** enforcement run including a non-passing verdict | Q1, Q2; `07-phase-7-enforcer-integration.md` |
| `humanSignOff` on the boundary review | A claim about who read what; **never set by tooling** | `artifacts/boundary-review.json` |
| Open questions Q7, Q8, Q9–Q12, Q15–Q22 | Owner decisions; several change a rule's `standard` field, a validation type or an already-written standard's wording | `08-open-questions.md` |
| Phase 6 gating decision | Valid only if the honest self-verdict permits it; never reached by lowering anything | `06-phase-6-dogfooding-and-docs.md` |
| Phase 5 digest and hosted CI | The `node:20-bookworm` digest must be read from a registry, not recalled; this repository has no hosted-CI evidence | Q6; `05-phase-5-ci-and-adapter.md` |

**Not authorised by anything you have been given:** pushing, opening a pull request, merging, filing issues
in another repository, editing another repository. `develop` is **12 commits ahead of `origin/develop` and
nothing has been pushed** (OBSERVED 2026-10-03). Ask the owner first, every time.

## 2 · Invariants (from `HANDOFF.md` §10, restated because breaking one is the failure mode)

1. `artifacts/prompts/original_prompt.md` is **never edited** (md5 `6ec4ac9c2617a02d4c23ba7c21441ed9`).
2. Never weaken a test, policy, standard or evidence requirement to make a gate pass.
3. Never invent historical intent, results, approvals, reviewers, model capabilities or compliance
   evidence. Preserve uncertainty explicitly.
4. Zero third-party dependencies, no lockfile. A test enforces it.
5. Crosswalks are semantic, never id reuse. `fidelity`, `inventory` and `attestations` have no write path.
6. The suite runs at `--test-concurrency=1`; the fidelity, inventory and sync suites rewrite real files.
7. A check that could not run is never a pass. **Scaffolding is not evidence** for any rule that reads it.
8. This repository's own verdict is `NON_COMPLIANT` 0 (OBSERVED). That is a result, not a target: neither
   preserve it nor chase `COMPLIANT`.
9. No `.gitattributes` (Q8). Do not hand-patch `docs/architecture.md`; regenerate it.

## 3 · Where state lives

| Question | Source | Notes |
| --- | --- | --- |
| What is built, verified, blocked | [`HANDOFF.md`](HANDOFF.md) | §5 built, §6 verified-vs-asserted, §8 human decisions |
| What work remains and its status | **GitHub Issues, `mikeycdavis/AIStandards`** | Authority recorded in `artifacts/backlog/github-mapping.json` (`authority: github`). **Never create item files**; the scripts refuse |
| Why the plan is shaped this way | `artifacts/project-plan-breakdown/` | 02 §5 is the per-standard procedure; §12 is the adoption contract |
| Catalog identity | `artifacts/prompts/ai-standards-spec.md` | 53 items; the `Implemented by` column is claimed per standard |
| Boundary with sibling packs | `artifacts/boundary-review.json`, `artifacts/foreign-namespace-inventory.json` | **Snapshots**, see §7 |

### The backlog, as seeded 2026-09-28 (OBSERVED; re-read it, do not trust this table)

One theme, six initiatives (Phase 2 to Phase 7), thirteen epics (one per catalog band with unwritten
standards, a Phase 2 tooling epic, a Phase 4 epic), thirteen features (required between an epic and its
stories), forty stories (one per unwritten standard, plus `standards-source-inventory.json`).

- **Item ids are sequential, not catalog numbers.** `ST-02` is *Standard 10*, `ST-46` is *Standard 4*.
  Find a standard by its **title**, never by guessing an id. Issue numbers are not ids either.
- Phases 3, 5, 6 and 7 are **bare initiatives**. They were not decomposed, because their plan text is too
  undifferentiated to split without inventing scope. Decompose them from the plan when they become
  executable, through `backlog-gh.mjs create`, with the owner's say-so on the shape.
- The open **questions are not items.** They are decisions, tracked in `08-open-questions.md`.
- **18 duplicate issues were created by an accident (§9). 13 are cancelled and 5 are still OPEN** (state
  read 2026-10-03). Finishing that is your first action (§4a). Do not reopen the cancelled ones.

### Commands (the only sanctioned way to change the backlog)

```bash
node ~/.claude/skills/backlog-validate/scripts/github/backlog-gh.mjs json     --repo=mikeycdavis/AIStandards
node ~/.claude/skills/backlog-validate/scripts/github/backlog-gh.mjs validate --repo=mikeycdavis/AIStandards
node ~/.claude/skills/backlog-validate/scripts/github/backlog-gh.mjs reconcile --repo=mikeycdavis/AIStandards
node ~/.claude/skills/backlog-validate/scripts/github/backlog-gh.mjs update   --repo=mikeycdavis/AIStandards --id=ST-02 --status=COMPLETE --evidence=<commit-or-path> --confirm
```

`create` and `update` are **dry runs unless `--confirm`**. A `COMPLETE` story needs evidence; a
`CANCELLED` item needs a rationale. Read the issue after any change.

## 4a · First actions, in this order

1. **Finish the duplicate cleanup.** Five empty duplicate features are still open (OBSERVED: no children).
   Cancel each, **one process, sequentially, dry run first**, then re-read the issue:

   | Cancel (duplicate) | Keep (twin) |
   | --- | --- |
   | `FE-16` (#36) | `FE-17` (#37) |
   | `FE-18` (#38) | `FE-19` (#39) |
   | `FE-20` (#40) | `FE-21` (#41) |
   | `FE-22` (#42) | `FE-23` (#43) |
   | `FE-24` (#44) | `FE-25` (#45) |

   ```bash
   node ~/.claude/skills/backlog-validate/scripts/github/backlog-gh.mjs update --repo=mikeycdavis/AIStandards \
     --id=FE-16 --status=CANCELLED --rationale="Duplicate of FE-17 (#37): the same item created twice by two overlapping seeding runs on 2026-09-28. Cancelled, not deleted; nothing differs between the two." --confirm
   ```

   The command is idempotent ("nothing to change") and a run that was stopped mid-update may have landed or
   not, so check each issue's state before and after. Then run `validate`: it was last run **before** these
   cancellations (91 items, 0 problems), so the cancelled state is unverified by it.
2. **Ask the owner what "in tandem with the other standards projects" means** (§7) and record the answer.
3. **Regenerate `docs/architecture.md`** with `/codebase-docs` (§6).
4. **Run `/whats-next`** and start the loop below.

## 4 · The loop

Repeat until nothing executable remains:

1. **Re-read state in this turn.** `git status`, `git log`, `json`, `validate`. Do not carry state across
   turns; a label can change on GitHub with no local trace.
2. **Run `/whats-next`** against the fresh state. Take its `recommended`, its `parallel_groups` and its
   constraints as the plan for this batch. Its relations are INFERRED unless it says OBSERVED.
3. **Fix the assignments before spawning.** For each worker: objective, evidence to read, **exclusive file
   scope**, acceptance criteria, validation to run, and the structured report you require.
4. **Provision workspaces yourself** and outside the repository, at a verified commit:
   `git worktree add -b wt/<name> <scratchpad>/wt/<name> <HEAD-sha>`. **Do not use the Agent tool's
   `isolation` option:** it creates worktrees inside the repo, where `audit` scans them. Spawn agents
   without it and give each its absolute path.
5. **Verify every report against the actual diff**, not its summary. Re-run the claimed checks yourself on
   anything load-bearing. Verification in earlier batches found stale crosswalk ids and a misdescribed
   example; a worker's own falsification run found a vacuous test.
6. **Integrate centrally**: `git cherry-pick --no-commit <worker-sha>`, then apply the shared edits
   (§5), then run the full suite, `fidelity`, `inventory`, `standards-sections`,
   `sync-rule-tables --check` and any CLI example whose behaviour changed, **one at a time**.
7. **Commit one coherent change**, record pre-commit and post-commit results separately, update the issue
   with `--evidence=<commit>`, then remove the worktrees and branches **after** diffing them against HEAD.
8. **Sync `HANDOFF.md` and the memory note once per batch**, not per item.

**Concurrency limits, learned the hard way:**
- **One writer to the GitHub backlog at a time.** Two overlapping seeders created 18 duplicates (§9). No
  worker touches the backlog; only the coordinator does, from one process.
- GitHub secondary rate limits and transient network timeouts both occurred during seeding. Retrying a
  failed `create` is safe only after you **list the issues and confirm it did not land**.
- **Every batch so far used two workers** (OBSERVED, six batches). Larger batches are untested and
  multiply the shared-edit integration; scale up deliberately, and measure the integration cost.

## 5 · Writing one standard (the dominant work: 39 standards)

Follow `artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md` **§5 exactly**. In short: read the
spec row and the boundary-review entry; ten H2 sections in order; a generated rule block if any rule cites
the standard (run `node scripts/sync-rule-tables.mjs`, then `--check`); claim the document in the spec's
`Implemented by` cell; add the file to the list in `test/no-phase-creep.test.mjs`.

**Disciplines that earlier batches had to learn:**
- **Link, do not copy** a sibling pack's requirement (Standard 7 R2). A hosted model or a missing training
  pipeline does **not** by itself make a system non-ML; Standard 17 and Q22 record why.
- **Disclose every authored element** in `## Additions`; none of it is owner-approved.
- **Cite code by symbol name, never line number.** State what has **no rule** instead of implying one.
- **Never claim a partial-assurance check passes.** A clean `assurance: partial` result is
  `not-evaluated`, earns no credit, and stays in the score's denominator (Standard 5 R6).
- **Check every remediation against the schemas.** Do not tell an adopter to write a field they reject.
- **Do not resolve a Q.** If a standard needs one answered, record it in `08-open-questions.md`.
- A rule's `standard`, `level`, `validationType` and `nonExemptible` fields are **not yours to change**
  while writing prose. Propose; do not edit.

**Coordinator-owned shared surfaces** (workers return proposed text; they never edit these): the spec's
`Implemented by` cell, `test/no-phase-creep.test.mjs`, `scripts/test.mjs`, `rules/*.json`, `ai-policy.yml`,
`README.md` counts, `docs/HANDOFF.md`, the plan files, `08-open-questions.md`, the memory note. Counts such
as "14 of 53" recur across README, plan 00 and 02, HANDOFF and `docs/architecture.md`; update them in one
pass and grep for the old number.

## 6 · Phase order and what can run in parallel

Plan dependencies are strictly serial: **P3 needs P2, P4 needs P3, P5 needs P4, P6 needs P5, P7 needs P6**.
Only Phase 2 has wide parallelism (the standards). The plan says detectors wait for the corpus. If you
believe Phase 3 detector work can start earlier, **propose it to the owner with the surface analysis; do not
change the plan unilaterally.**

| Phase | State (OBSERVED 2026-10-03) | Needs from a human before it can finish |
| --- | --- | --- |
| 2 | 14 of 53 standards; 39 unwritten; 9 namespaces have no shard; `standards-source-inventory.json` unwritten | Q-decisions only where a standard depends on one |
| 3 | not started; detectors, evidence-availability architecture, bait fixtures | none known |
| 4 | not started; includes **Standard 4** and the attestation mechanism | none known |
| 5 | not started; containers, adapter, `diagrams`, workflows | Q6 digest read from a registry; Q8 if line endings matter |
| 6 | not started; docs corpus, `0.9.0`, gating decision | the ADR 0021 decision must be honest |
| 7 | not started | **Q1, Q2**; an enforcer run; a reviewer; owner |

**Not done and owed:** regenerate `docs/architecture.md` with `/codebase-docs` (stale in the places
`HANDOFF.md` §1 names, and it predates the adoption slice). Do this early; it is cheap and other work cites it.

## 7 · In tandem with the other standards projects

**What was established, and what was not.** The owner's phrase was not defined. I read it as: this pack is
one of several, its standards defer to or crosswalk the others, and **work must not contradict or outrun
them.** **UNKNOWN:** whether the owner also means a shared programme board or simultaneous coordinators in
other repositories. **Ask once, at the start, and record the answer here.**

Sibling checkouts under `F:\Repos`, OBSERVED 2026-10-03 (branch, version, uncommitted-file count):

| Pack | Branch | Version | Dirty |
| --- | --- | --- | --- |
| MachineLearningStandards | `design/publication-state-correction` | 3.0.0 | **13** |
| EngineeringStandards | `plan/38-complete-and-recount` | 2.0.0 | 1 |
| FinancialStandards | `main` | 1.1.0 | 1 |
| BettingStandards | `release/2.0.0` | 2.0.0 | 1 |
| MathematicsStandards | `chore/backlog-github-authority` | 3.0.0 | 0 |
| UIUXDesignStandards | `chore/backlog-to-github-issues` | 1.0.0 | 0 |
| HealthAndFitnessAndNutritionStandards | `main` | 1.1.1 | 0 |
| InnovationStandards | `main` | 1.0.2 | 0 |
| PredictionStandards | `main` | 1.2.0 | 0 |
| StandardsEnforcer | many sibling worktree directories (`-adapter`, `-enforcement`, `-integration`, …) | — | — |

Rules for working beside them:

1. **Read-only toward every sibling.** Other people's uncommitted work is in several of them. Never edit,
   stage, switch branches in, or run mutating commands in a sibling checkout.
2. **Read siblings through git objects at a named commit** (`git -C <repo> show <sha>:<path>`), **never from
   the working tree.** The ML working tree is dirty and sits on a feature branch.
3. **Our pins are stale.** `foreign-namespace-inventory.json` and `boundary-review.json` were read on
   2026-09-04 at older commits (for example ML at 1.6.0 / 2.0.0; ML is now 3.0.0). Before a standard relies
   on a sibling requirement, re-read it at a current commit and **say which commit.** Refreshing the
   inventory is a human action with a changelog entry (its own header says so), so propose it; do not do
   it silently. A crosswalk check that every foreign id exists is still unbuilt, and three wrong ids were
   found by hand: until it exists, verify each foreign id yourself.
4. **Boundary postures are unilateral.** No sibling's maintainers have confirmed any division (Q3, Q4).
   Never write "agreed with" or "owned by" as settled; write what the review observed.
5. **StandardsEnforcer is the Phase 7 counterpart and is moving.** Read it; do not assume its contract has
   stayed as the vendored-schema plan describes.
6. Anything that needs a **change or an issue in a sibling repository** is an owner decision. List it in
   your report instead of filing it.

## 8 · Environment and pitfalls (all OBSERVED here)

- **Windows host, Git Bash and PowerShell.** `node` needs **Windows-style paths** (`C:/Users/...`); the
  MSYS form `/c/Users/...` fails inside `node -e`/`require`. Shell heredocs mangle backslashes and regexes
  (one broke a source file): write scripts with the Write tool instead.
- **Working-directory drift.** A `cd` persists between calls; use absolute paths and `git -C`.
- **Line endings.** `core.autocrlf=true`: LF in git, CRLF in the working tree. Compare bytes with Node, not
  with Git Bash `grep`, which hides carriage returns. Do not "fix" it (Q8).
- **Node 18** is checked through the local Docker image:
  `MSYS_NO_PATHCONV=1 docker run --rm --pull=never --network none -v "F:/Repos/AIStandards:/src:ro" node:18-alpine sh -c '<copy tree to /w, then node --test ...>'`.
  Images present: node 18, 20, 22, 24 variants. Report which versions you actually ran.
- **The suite refuses to start** if a test file exists that is not listed in `scripts/test.mjs`. Register
  new files there.
- `.claude/settings.local.json` is untracked and hidden only by the owner's global ignore, so a clean
  `git status` here is not portable evidence, and `audit` counts it.

## 9 · Incident to learn from (2026-09-28)

I seeded the backlog with a script and, after one failure, re-ran it with a stray `&` on a command the tool
was also backgrounding. Part of the run then created the same items twice, producing **18 duplicate
issues** (91 instead of the intended 73), in consecutive-number pairs from `#22` to `#57`. **The cause is
INFERRED** from that pairing and from my own double invocation; no log of a second process survives. They
were found only because I compared the issue count with the number I intended. Resolution is cancelling the
lower-numbered twin of each pair with the sanctioned `update --status=CANCELLED` and a rationale, never
deleting. **It is incomplete:** the owner stopped the run after 13 of 18, leaving five features (§4a).
Lessons, already folded into §4: one writer; confirm by listing before
retrying; check counts after any bulk create; never background a command twice.

## 10 · Separate threads — do not fold in

- **AgentRelay draft PR #36** (`mikeycdavis/AgentRelay`, worktree `F:\Repos\AR-aistd`): a different
  repository's adoption of this pack, deliberately strict and unmerged. Merging it is the owner's decision
  (ST-61 there). Do not touch it.
- **A spawned fix for the shared skill script** `~/.claude/skills/backlog-validate/scripts/backlog.mjs`
  (it silently starts a file-mode backlog when neither store exists). Global infrastructure used by other
  repositories; it is not AIStandards work.

## 11 · What to report, and when to stop

Report per batch: what ran and what passed or failed, **pre-commit and post-commit separately**; commits;
issues updated with their evidence; what you did **not** verify; decisions you need. Stop and ask the
owner when: a standard cannot be written without answering a Q, a sibling's current text contradicts a
recorded posture, a gate fails and the only fix would weaken something, the next item needs a human
(Phase 7), or an action would leave this repository (push, PR, merge, sibling edit).

**Finished means:** `validate` reports 0 problems; every item is `COMPLETE` with evidence or `BLOCKED` /
`DEFERRED` with its named human decision; `humanSignOff` is still `null` unless the owner set it; and the
final report separates **what is mechanically verified** from **what no human has approved.**
