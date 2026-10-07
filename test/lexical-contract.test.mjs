// Pins the frozen source-code lexical contract (ST-48, #110; owner decision H of 2026-10-07).
//
// docs/lexical-contract.md enumerates every claimed form, named non-claim and boundary control of the
// source-code lexical detector, and the forms held lexical pending the ST-49 (#111) decision. This file:
//
//   1. parses that enumeration and requires it to equal, entry by entry (id, class, result), the probe
//      table in lexical-contract-probes.mjs, so a form added to either side without the other fails;
//   2. runs every probe through the real CLI and requires the classification the list records, so a form
//      that changes classification fails;
//   3. requires each entry's cited pinning test to still exist in the cited file, so a pin cannot rot;
//   4. requires the detector's parameter-name list and threshold to be the ones the document states, so a
//      regex patch that adds a parameter name fails here and needs the owner decision the document demands;
//   5. requires the stop-extension rule and its stated reasons to remain in the document.
//
// It does not change detector behaviour and does not read YAML or JSON forms: those are excluded from the
// frozen list because they migrate to the structural parser (FE-30).

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validate, fixture, resultFor, REPO } from "./helpers.mjs";
import { PROBES, LONG, PARAMETER_NAMES, THRESHOLD } from "./lexical-contract-probes.mjs";

const VERSIONED = "promptsec.prompt-is-versioned-artifact";
const NO_INLINE = "promptsec.no-inline-system-prompt";
const SAFETY = "misuse.safety-controls-not-disabled";
const DOC = path.join(REPO, "docs", "lexical-contract.md");
const doc = fs.readFileSync(DOC, "utf8").replace(/\r\n/g, "\n");

function parseList(text) {
  const entries = [];
  for (const line of text.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    // | id | class | result | form | pinned by |
    if (cells.length >= 7 && /^L[CNXH]-\d+$/.test(cells[1])) {
      const [file, label] = cells[5].replace(/`/g, "").split(" :: ");
      entries.push({ id: cells[1], cls: cells[2], expect: cells[3], pin: [file, label] });
    }
  }
  return entries;
}

function runProbe(p) {
  if (p.fixture) {
    const { json } = validate(fixture(p.fixture));
    return { s9: resultFor(json, SAFETY) };
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-lex-"));
  try {
    const base = fixture("inline-system-prompt");
    fs.copyFileSync(path.join(base, "ai-policy.yml"), path.join(dir, "ai-policy.yml"));
    fs.copyFileSync(path.join(base, "ai-system.yml"), path.join(dir, "ai-system.yml"));
    const full = path.join(dir, p.file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, p.source);
    const { json } = validate(dir);
    return { versioned: resultFor(json, VERSIONED), noInline: resultFor(json, NO_INLINE) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const listed = parseList(doc);

test("the document enumerates exactly the probe table: same ids, classes, results and pins, in order", () => {
  assert.ok(listed.length > 0, "docs/lexical-contract.md must enumerate the frozen forms");
  const fromDoc = listed.map((e) => `${e.id}|${e.cls}|${e.expect}|${e.pin.join(" :: ")}`);
  const fromProbes = PROBES.map((p) => `${p.id}|${p.cls}|${p.expect}|${p.pin.join(" :: ")}`);
  assert.deepEqual(fromDoc, fromProbes);
  assert.equal(new Set(PROBES.map((p) => p.id)).size, PROBES.length, "probe ids must be unique");
});

test("the document states the count of frozen forms and it matches the list", () => {
  const m = doc.match(/Frozen forms: (\d+) \((\d+) claimed, (\d+) non-claims, (\d+) boundary controls, (\d+) held pending ST-49\)/);
  assert.ok(m, "the document must state `Frozen forms: N (a claimed, b non-claims, c boundary controls, d held pending ST-49)`");
  const count = (cls) => PROBES.filter((p) => p.cls === cls).length;
  assert.deepEqual(m.slice(1).map(Number), [PROBES.length, count("claimed"), count("non-claim"), count("boundary"), count("held")]);
});

test("every class is used and only the four known classes appear", () => {
  assert.deepEqual([...new Set(PROBES.map((p) => p.cls))].sort(), ["boundary", "claimed", "held", "non-claim"]);
});

test("the claim classification implies the result: claimed fires; non-claims and boundary controls are skipped", () => {
  for (const p of PROBES) {
    if (p.cls === "claimed") assert.equal(p.expect, "fires", p.id);
    if (p.cls === "non-claim" || p.cls === "boundary") assert.equal(p.expect, "skipped", p.id);
  }
});

for (const p of PROBES) {
  test(`${p.id} (${p.cls}): ${p.desc}`, () => {
    const r = runProbe(p);
    if (p.expect === "fires") {
      assert.equal(r.versioned.result, "failed", `${VERSIONED}: ${r.versioned.result}: ${r.versioned.message}`);
      assert.equal(r.noInline.result, "warning", `${NO_INLINE}: ${r.noInline.result}: ${r.noInline.message}`);
      for (const x of [r.versioned, r.noInline]) {
        assert.ok(x.evidence.some((e) => e.startsWith(`${p.file} (`)), JSON.stringify(x.evidence));
      }
    } else if (p.expect === "skipped") {
      assert.equal(r.versioned.result, "skipped", `${VERSIONED}: ${r.versioned.result}`);
      assert.equal(r.noInline.result, "skipped", `${NO_INLINE}: ${r.noInline.result}`);
    } else if (p.expect === "s9-fires") {
      assert.equal(r.s9.result, "failed", `${SAFETY}: ${r.s9.result}: ${r.s9.message}`);
      assert.ok(r.s9.evidence.includes(`${p.evidenceFile} (safety control set off)`), JSON.stringify(r.s9.evidence));
    } else if (p.expect === "s9-clear") {
      assert.ok(!["failed", "warning"].includes(r.s9.result), `${SAFETY}: ${r.s9.result}`);
      assert.equal(r.s9.result, "skipped");
      assert.equal(r.s9.distinction, "prohibited-but-unestablished");
    } else {
      assert.fail(`unknown expectation ${p.expect}`);
    }
  });

  test(`${p.id}: the pinning test it cites still exists`, () => {
    const [file, label] = p.pin;
    const full = path.join(REPO, file);
    assert.ok(fs.existsSync(full), `${file} must exist`);
    assert.ok(fs.readFileSync(full, "utf8").includes(label), `${file} must still contain "${label}"`);
  });
}

test("the detector's instruction-parameter names and threshold are the ones the document freezes", () => {
  const src = fs.readFileSync(path.join(REPO, "scripts", "standards.mjs"), "utf8");
  const names = src.match(/const INSTRUCTION_PARAM = [^\n]*?\\b\(([^)]*)\)/);
  assert.ok(names, "INSTRUCTION_PARAM must still declare its listed names");
  assert.deepEqual(names[1].split("|"), PARAMETER_NAMES, "a parameter name was added or removed without a new owner decision");
  const threshold = src.match(/const INLINE_THRESHOLD = (\d+);/);
  assert.ok(threshold && Number(threshold[1]) === THRESHOLD, "the 200-character threshold changed without a new owner decision");
  assert.ok(doc.includes(`Instruction parameter names: ${PARAMETER_NAMES.map((n) => `\`${n}\``).join(", ")}.`), "the document must list the same parameter names");
  assert.ok(doc.includes(`Threshold: ${THRESHOLD} characters.`), "the document must state the same threshold");
});

test("the stop-extension rule and the reasons for it are in the document", () => {
  assert.ok(doc.includes("## The stop-extension rule"));
  for (const phrase of [
    "frozen",
    "not added by regex patches",
    "new owner decision",
    "#93",
    "#104",
    "13 Codex",
    "ST-49",
    "#111",
  ]) {
    assert.ok(doc.includes(phrase), `the document must keep: ${phrase}`);
  }
});

test("a probe literal is long enough that the threshold, not the length, decides each claimed form", () => {
  assert.ok(LONG.length > THRESHOLD);
});
