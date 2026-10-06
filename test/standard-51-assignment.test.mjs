// ST-42 (#87): the two forbidden agent rules are Standard 51's, and every document that says so agrees.
//
// The owner assigned agent.no-self-modification and agent.retrieved-content-not-instruction to
// Standard 51 on 2026-10-05. The assignment is one fact held in several places — the catalog's
// `standard` field, two standards' tables and requirement sections, Standard 21's Relationship
// section, and the specification's Implemented-by cell — and a change that moved only some of them
// would leave a reader of one document contradicting a reader of another. This file asserts the
// places agree. It asserts nothing about what either rule requires: the rule text, level, severity,
// validation type and exemptibility are pinned below only to prove the move changed none of them.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { loadCatalog } from "../scripts/catalog.mjs";
import { REPO, validate, fixture } from "./helpers.mjs";

const read = (rel) => fs.readFileSync(path.join(REPO, rel), "utf8").replace(/\r\n/g, "\n");
const catalog = loadCatalog();

const MOVED = {
  "agent.no-self-modification": { level: "forbidden", validationType: "not-evaluable", nonExemptible: false },
  "agent.retrieved-content-not-instruction": { level: "forbidden", validationType: "code-analysis", nonExemptible: true },
};
const STAYED = ["agent.step-budget-bounded", "agent.least-privilege-declared"];

const DOC51 = "standards/51-agent-and-tool-execution-prohibitions.md";
const DOC23 = "standards/23-agent-execution-security.md";

/** The rule ids in a document's generated table, in order. */
function tableRules(text) {
  return [...text.matchAll(/^\| R\d+ \| `([^`]+)` \|/gm)].map((m) => m[1]);
}

/** The body of the `### R<n> — ` section, up to the next heading. */
function requirementBody(text, n) {
  const m = new RegExp(`^### R${n} — .*\\n([\\s\\S]*?)(?=^#{2,3} )`, "m").exec(text);
  assert.ok(m, `no ### R${n} section`);
  return m[1];
}

test("the two rules cite standard 51, and the two that stayed cite standard 23", () => {
  for (const id of Object.keys(MOVED)) assert.equal(catalog.rules.get(id).standard, 51, `${id} must cite standard 51`);
  for (const id of STAYED) assert.equal(catalog.rules.get(id).standard, 23, `${id} must still cite standard 23`);
});

test("moving the assignment changed nothing else about either rule", () => {
  for (const [id, want] of Object.entries(MOVED)) {
    const rule = catalog.rules.get(id);
    assert.equal(rule.level, want.level, `${id}: level`);
    assert.equal(rule.validationType, want.validationType, `${id}: validationType`);
    assert.equal(rule.nonExemptible, want.nonExemptible, `${id}: nonExemptible`);
    assert.equal(rule.severity, "error", `${id}: severity`);
    assert.equal(rule.assurance, "none", `${id}: assurance`);
  }
});

test("Standard 51 states exactly the two rules, as R1 and R2, in its generated table", () => {
  const text = read(DOC51);
  assert.deepEqual(tableRules(text), ["agent.no-self-modification", "agent.retrieved-content-not-instruction"]);
  assert.match(requirementBody(text, 1), /`agent\.no-self-modification`/);
  assert.match(requirementBody(text, 2), /`agent\.retrieved-content-not-instruction`/);
});

test("Standard 23's table lists exactly the two rules it kept, and R3 and R4 point to Standard 51", () => {
  const text = read(DOC23);
  assert.deepEqual(tableRules(text), STAYED);
  assert.match(text, /^### R3 — Moved to Standard 51 R1$/m);
  assert.match(text, /^### R4 — Moved to Standard 51 R2$/m);
  for (const n of [3, 4]) {
    assert.match(requirementBody(text, n), /\]\(51-agent-and-tool-execution-prohibitions\.md\)/, `R${n} must link to Standard 51`);
    assert.ok(!/\bMUST\b/.test(requirementBody(text, n)) || /now stated by/.test(requirementBody(text, n)), `R${n} must not be a second statement`);
  }
});

test("Standard 21 names Standard 51, not Standard 23, as the owner of retrieved content acquiring authority", () => {
  const text = read("standards/21-prompt-and-instruction-security.md");
  assert.match(text, /Standard 51\]\(51-agent-and-tool-execution-prohibitions\.md\), Agent and Tool Execution Prohibitions, owns retrieved content/);
  assert.ok(!/Standard 23, Agent Execution Security \*\(Phase 2\)\* owns retrieved content/.test(text));
});

test("the specification claims Standard 51's document for item 51", () => {
  const text = read("artifacts/prompts/ai-standards-spec.md");
  assert.match(text, /^\| 51 \| Agent and Tool Execution Prohibitions \| A \| — \| O \| standards\/51-agent-and-tool-execution-prohibitions\.md \|$/m);
});

test("a validation run reports both rules exactly as before, and now says they are item 51's", () => {
  const { json } = validate(fixture("valid-manifest"));
  const byRule = new Map(json.results.map((r) => [r.rule, r]));
  for (const id of Object.keys(MOVED)) {
    const r = byRule.get(id);
    assert.ok(r, `${id} must still appear in the results`);
    assert.equal(r.standardRef, 51, `${id}: standardRef`);
    assert.equal(r.result, "skipped");
    assert.equal(r.disposition, "not-evaluated");
    assert.equal(r.distinction, "prohibited-but-unestablished");
  }
  assert.ok(json.unestablishedProhibitions.some((r) => r.rule === "agent.retrieved-content-not-instruction"));
  assert.ok(json.notEvaluable.some((r) => r.rule === "agent.no-self-modification"));
});
