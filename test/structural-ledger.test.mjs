// The named regression ledger of decision D, run against the structural reader (ST-57, #119).
//
// The ledger is the list of probe cases the owner accepted would CHANGE OUTCOME when YAML and JSON stop
// being scanned as text: today a lexical finding, afterwards file-scoped unknown or a non-claim. It is
// not derived here. The ids are those of section 8.1 of the structural-parser packets ("Regression
// ledger the owner is asked to accept under G1/C1"), accepted by sections D and G of the decision
// bundle; fixtures/structural-ledger/ledger.json carries each case's input.
//
// What ST-57 can complete is the first group: a file the reader refuses. The other two groups change
// only when a consumer measures decoded values (ST-58), so for them this test pins the OPPOSITE:
// the reader parses them, and the lexical result is unchanged by ST-57. That keeps "not yet moved"
// from being mistaken for "moved".
//
// One ledger entry does not behave as the ledger says. g07 (a duplicate anchor definition) is valid
// YAML, and the vendored parser reads it, so it stays a finding rather than becoming unknown. It is
// recorded as a discrepancy below rather than forced into the expected outcome, because making a
// duplicate anchor a failure would be a rule the owner has not decided.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { audit, validate, fixture, resultFor as ruleIn, HERE } from "./helpers.mjs";
import { parseStructuralBytes } from "../scripts/structural.mjs";

const LEDGER = JSON.parse(fs.readFileSync(path.join(HERE, "fixtures", "structural-ledger", "ledger.json"), "utf8"));
const LONG = "x".repeat(250);
const NO_INLINE = "promptsec.no-inline-system-prompt";

const bytesOf = (entry) =>
  entry.bytesBase64 !== undefined ? Buffer.from(entry.bytesBase64, "base64") : Buffer.from(entry.content.replaceAll("<L>", LONG));

function target(entry) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-ledger-"));
  const base = fixture("inline-system-prompt");
  fs.copyFileSync(path.join(base, "ai-policy.yml"), path.join(dir, "ai-policy.yml"));
  fs.copyFileSync(path.join(base, "ai-system.yml"), path.join(dir, "ai-system.yml"));
  fs.writeFileSync(path.join(dir, entry.file), bytesOf(entry));
  return dir;
}

const FIRST = "G1/C1";
const first = LEDGER.entries.filter((e) => e.group.startsWith(FIRST));
const deferred = LEDGER.entries.filter((e) => !e.group.startsWith(FIRST));

// Cases whose behaviour differs from the ledger's expectation, each with what is actually true.
const DISCREPANCY = {
  g07: "valid YAML: YAML 1.2 allows an anchor to be redefined, so the vendored parser reads the file and the lexical finding stands",
};

test("the ledger is the 21 cases named in the packets, by id", () => {
  assert.deepEqual(LEDGER.entries.map((e) => e.id), [
    "c01", "c02", "c04", "c05", "c07", "c08", "c12", "g05", "g06", "g07", "g08",
    "d09", "d09b", "d19",
    "b02", "b03", "d06", "d07", "d08", "d17", "d18",
  ]);
});

for (const entry of first) {
  if (entry.id in DISCREPANCY) continue;
  test(`ledger ${entry.id} (${entry.label}): the reader refuses it, so it is unknown and no longer a finding`, () => {
    const r = parseStructuralBytes(entry.file, bytesOf(entry));
    assert.equal(r.ok, false, `${entry.id} must not parse`);
    const dir = target(entry);
    const { json } = audit(dir);
    assert.equal(json.evidenceSurface.unparseableFiles.total, 1);
    assert.equal(json.evidenceSurface.unparseableFiles.files[0].file, entry.file);
    const verdict = ruleIn(validate(dir).json, NO_INLINE);
    assert.equal(verdict.result, "skipped");
    assert.equal(verdict.disposition, "not-evaluated", "unknown is never pass");
  });
}

test("ledger g07 is a DISCREPANCY, pinned: a duplicate anchor parses and its lexical finding stands", () => {
  const entry = LEDGER.entries.find((e) => e.id === "g07");
  const r = parseStructuralBytes(entry.file, bytesOf(entry));
  assert.equal(r.ok, true, DISCREPANCY.g07);
  assert.equal(r.counts.anchors, 2);
  const verdict = ruleIn(validate(target(entry)).json, NO_INLINE);
  assert.equal(verdict.disposition, "evaluated");
  assert.ok(["failed", "warning"].includes(verdict.result));
});

for (const entry of deferred) {
  test(`ledger ${entry.id} (${entry.label}): parses; its outcome is unchanged here and completes in ${entry.completedBy}`, () => {
    const r = parseStructuralBytes(entry.file, bytesOf(entry));
    assert.equal(r.ok, true, `${entry.id} is valid, so no failure outcome applies`);
    assert.equal(audit(target(entry)).json.evidenceSurface.unparseableFiles.total, 0);
  });
}

// Existing lexical fixtures that are not valid YAML, found by running the whole suite with the reader
// traced. They are NOT in the named ledger. Each was a lexical control or finding; each is now
// unparseable, so a control built on it no longer reaches the detector. They are listed so the
// vacuity is a recorded fact with an owner (ST-59, which migrates YAML fixtures) and not a silent
// one. If one of them starts to parse, this test says the control is live again.
const NOT_IN_LEDGER_NOW_UNPARSEABLE = [
  ["message-role-shapes.test.mjs", "a YAML flow role followed by trailing text", `- {role: "system" x, content: "${LONG}"}\n`],
  ["message-role-shapes.test.mjs", "a YAML plain scalar that contains the ternary text", `note: ok ? systemInstruction : {parts: [{text: "${LONG}"}]}\n`],
  ["message-role-shapes.test.mjs", "a YAML plain scalar with a ternary mark", `note: ok ? system : "${LONG}"\n`],
  ["review-findings.test.mjs", "finding 8: a sequence-marker key right after a block scalar", `a:\n  documentation: |\n    text\n  - "system": "${LONG}"\n`],
  ["review-findings.test.mjs", "finding 8: a pipe after an unclosed quote is not a block header", `note: "a: |\n  "system": "${LONG}"\n`],
  ["review-findings.test.mjs", "finding 8: a pipe inside a trailing comment is not a block header", `note: a # b: |\n  "system": "${LONG}"\n`],
];

for (const [owner, label, source] of NOT_IN_LEDGER_NOW_UNPARSEABLE) {
  test(`not in the ledger, now unparseable (${owner}): ${label}`, () => {
    const r = parseStructuralBytes("src/p.yaml", Buffer.from(source));
    assert.equal(r.ok, false);
    assert.equal(r.reason, "syntax");
  });
}
