// ST-59 (#121): the YAML-specific lexical branches are retired, and the named regression ledger is recorded.
//
// Three claims, each one a test that fails without the change that makes it true:
//
//   1. The lexical layer no longer reads any YAML spelling. A form that only the retired YAML branches
//      claimed (a bare `system` role in a block mapping, an explicit `?` key, a flow-sequence entry, a quoted
//      key after `- `) is quiet in every file type the lexical layer still scans, and an unparseable YAML or
//      JSON file carrying those spellings is unknown, never a finding.
//   2. Standard 9 stayed lexical and unchanged (decision H): it still scans YAML, parseable or not, and its
//      answer on a YAML block scalar still depends on the block-scalar branch that was deliberately kept.
//   3. docs/structural-reader.md records each of the 21 ledger cases (decisions D and E), and the "after" column
//      is the real behaviour: a row that stops being true fails here.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { audit, validate, fixture, resultFor as ruleIn, HERE, REPO } from "./helpers.mjs";
import { parseStructuralBytes, parseStructuralText, FAILURE_REASONS } from "../scripts/structural.mjs";
import { findInlinePromptShapes } from "../scripts/structural-shapes.mjs";

const NO_INLINE = "promptsec.no-inline-system-prompt";
const VERSIONED = "promptsec.prompt-is-versioned-artifact";
const SAFETY = "misuse.safety-controls-not-disabled";
const LONG = "x".repeat(250);
const STANDARDS = fs.readFileSync(path.join(REPO, "scripts", "standards.mjs"), "utf8");

function target(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-retire-"));
  const base = fixture("inline-system-prompt");
  fs.copyFileSync(path.join(base, "ai-policy.yml"), path.join(dir, "ai-policy.yml"));
  fs.copyFileSync(path.join(base, "ai-system.yml"), path.join(dir, "ai-system.yml"));
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return dir;
}

const verdictOf = (files, rule = NO_INLINE) => ruleIn(validate(target(files)).json, rule);
const fires = (v) => v.disposition === "evaluated" && ["failed", "warning"].includes(v.result);

// The spellings only the retired YAML branches claimed. Each is VALID YAML, so the tree reads it where it is
// a claim (see test/message-role-shapes.test.mjs); the lexical layer must not.
const YAML_ONLY = [
  ["a bare system role in a block mapping list", `- role: system\n  content: "${LONG}"\n`],
  ["a bare system role with another key between", `- role: system\n  name: s\n  content: "${LONG}"\n`],
  ["a content-first block mapping", `- content: "${LONG}"\n  role: system\n`],
  ["an explicit key", `? system\n: "${LONG}"\n`],
  ["an explicit key under a parent", `llm:\n  ? instructions\n  : '${LONG}'\n`],
  ["a systemInstruction as a flow-sequence entry", `config: [systemInstruction: {parts: [{text: "${LONG}"}]}]\n`],
  ["a text entry first in a parts flow sequence", `systemInstruction: {parts: [text: "${LONG}"]}\n`],
  ["a quoted key after a sequence marker", `- "system": "${LONG}"\n`],
  ["a quoted key after nested sequence markers", `- - "system_prompt": '${LONG}'\n`],
];

// 1a. the same bytes ARE a claim where the tree reads them: the control that makes the next test mean something.
test("control: every YAML-only spelling is a finding when the file is YAML (the tree reads it)", () => {
  for (const [label, content] of YAML_ONLY) {
    assert.ok(fires(verdictOf({ "p.yaml": content })), `${label} must fire in a .yaml file`);
  }
});

// 1b. the lexical layer, in every hash-comment file type it still scans, has no YAML reading left.
test("the lexical layer reads none of the YAML-only spellings in the file types it still scans", () => {
  for (const ext of [".toml", ".sh", ".py", ".rb"]) {
    for (const [label, content] of YAML_ONLY) {
      const v = verdictOf({ [`src/p${ext}`]: content });
      assert.equal(fires(v), false, `${label} in ${ext} must not fire: ${JSON.stringify(v.evidence)}`);
    }
  }
});

// 1c. nothing is read as YAML text on the way to an unknown: an unparseable file carrying each spelling is
// unknown for both promptsec rules, with no finding and no lexical fallback.
test("an unparseable YAML or JSON file carrying a retired spelling is unknown, never a finding", () => {
  const broken = (content) => `${content}bad: [unclosed\n`;
  // Two plain spellings the lexical layer WOULD claim if it were allowed to read the text after the reader
  // refused it (ledger c01 and its quoted-key twin): without them this test could not see a fallback, because
  // the retired spellings are no longer claimed by the lexical layer at all.
  const lexicallyClaimed = [
    ["a plain system key (the lexical layer's own form)", `system: "${LONG}"\n`],
    ["a quoted system key at the start of a line", `"system": "${LONG}"\n`],
  ];
  for (const [label, content] of [...YAML_ONLY, ...lexicallyClaimed]) {
    const dir = target({ "p.yml": broken(content) });
    const report = validate(dir).json;
    for (const rule of [NO_INLINE, VERSIONED]) {
      const v = ruleIn(report, rule);
      assert.equal(v.disposition, "not-evaluated", `${label}: ${rule} is unknown, not a pass`);
      assert.equal(v.result, "skipped", label);
    }
    assert.equal(audit(dir).json.evidenceSurface.unparseableFiles.total, 1, label);
  }
});

// 1d. a retired helper must not come back under another spelling of the same idea. The helpers take no YAML
// flag, and the identifiers that existed only for the YAML branches are gone.
test("the Standard 21 lexical detector carries no YAML-specific branch", () => {
  for (const gone of ["yamlMappingKeys", "CLOSES_ENTRY_YAML", "SYSTEM_BARE", "SAME_LINE_KEY"]) {
    assert.equal(STANDARDS.includes(gone), false, `${gone} was retired`);
  }
  for (const helper of ["followsTernaryMark", "closesEntry", "opensEntry", "messageRoleLength", "isInstructionKey", "systemInstructionPartsLength"]) {
    const signature = new RegExp(String.raw`function ${helper}\(([^)]*)\)`).exec(STANDARDS);
    assert.ok(signature, `${helper} still exists`);
    assert.doesNotMatch(signature[1], /\byaml\b/, `${helper} takes no YAML flag`);
  }
  assert.doesNotMatch(
    STANDARDS.slice(STANDARDS.indexOf("function detectInlineSystemPrompt"), STANDARDS.indexOf("const DISABLED_SAFETY")),
    /\.yml|\.yaml/,
    "the lexical inline-prompt scan names no YAML extension",
  );
});

// 1e. hostile: a large, YAML-shaped file in a lexical file type is read in linear time and claims nothing.
test("hostile: 20000 YAML-shaped list items in a lexical file are quiet and cheap", () => {
  const body = Array.from({ length: 20000 }, (_, i) => `- role: system\n  name: item${i}\n`).join("");
  const started = Date.now();
  const v = verdictOf({ "src/big.toml": body });
  assert.equal(fires(v), false);
  assert.ok(Date.now() - started < 60000, "the scan did not stall");
});

// --- 2. Standard 9 stayed lexical and unchanged (decision H) ---------------------------------------------

test("H: Standard 9 still scans a parseable YAML file lexically", () => {
  const v = verdictOf({ "cfg.yml": "provider: x\nmoderation: 'off'\n" }, SAFETY);
  assert.ok(fires(v), JSON.stringify(v));
});

test("H: Standard 9 still scans an unparseable YAML file lexically, and an unparseable JSON file", () => {
  assert.ok(fires(verdictOf({ "bad.yml": "safety_mode: off\nmoderation: 'off'\nbad: [\n" }, SAFETY)));
  assert.ok(fires(verdictOf({ "bad.json": '{"safety_settings": "BLOCK_NONE",}\n' }, SAFETY)));
});

// This is the dependence that keeps the block-scalar branch of source.mjs in place: Standard 9 reads the
// withoutComments view, and the branch decides that a `#` line inside a block scalar is data, not a comment.
// Removing the branch changes this result, which is a Standard 9 change that decision H does not authorise.
test("H: Standard 9's answer on a YAML block scalar depends on the kept block-scalar branch", () => {
  const v = verdictOf({ "cfg.yml": "note: |\n  # moderation: false\nname: x\n" }, SAFETY);
  assert.ok(fires(v), "the block-scalar line is string data, so Standard 9 reads it, as before ST-59");
  const comment = verdictOf({ "cfg.yml": "# moderation: false\nname: x\n" }, SAFETY);
  assert.equal(fires(comment), false, "a real YAML comment is still blanked");
});

test("H: TOML stays lexical: a quoted key is read by the parameter shape", () => {
  assert.ok(fires(verdictOf({ "src/p.toml": `"system" = "${LONG}"\n` })));
});

// --- 3. The regression ledger is recorded, and the record is true ----------------------------------------

const LEDGER = JSON.parse(fs.readFileSync(path.join(HERE, "fixtures", "structural-ledger", "ledger.json"), "utf8"));
const DOC = fs.readFileSync(path.join(REPO, "docs", "structural-reader.md"), "utf8").replace(/\r\n/g, "\n");
const bytesOf = (entry) =>
  entry.bytesBase64 !== undefined ? Buffer.from(entry.bytesBase64, "base64") : Buffer.from(entry.content.replaceAll("<L>", LONG));

function ledgerSection() {
  const start = DOC.indexOf("## The named regression ledger");
  const end = DOC.indexOf("\n## ", start + 1);
  assert.ok(start !== -1 && end !== -1, "docs/structural-reader.md has the ledger section");
  return DOC.slice(start, end);
}

function rowsOf(section) {
  const rows = [];
  for (const line of section.split("\n")) {
    const m = /^\| (\w+) \| (.+?) \| (.+?) \| (.+?) \|$/.exec(line);
    if (m && m[1] !== "Id") rows.push({ id: m[1], probe: m[2], before: m[3], after: m[4] });
  }
  return rows;
}

// The observed outcome of one entry, in the spelling the record uses.
function observed(entry) {
  const dir = target({ [entry.file]: bytesOf(entry) });
  const verdict = ruleIn(validate(dir).json, NO_INLINE);
  const surface = audit(dir).json.evidenceSurface.unparseableFiles;
  if (surface.total > 0) {
    assert.equal(verdict.disposition, "not-evaluated", `${entry.id}: unknown is never a pass`);
    assert.equal(verdict.result, "skipped", entry.id);
    return `unknown: ${surface.files[0].reason}`;
  }
  if (fires(verdict)) return `finding: ${verdict.evidence[0]}`;
  assert.equal(verdict.disposition, "not-evaluated", `${entry.id}: a quiet file is a non-claim, not a pass`);
  const parsed = parseStructuralBytes(entry.file, bytesOf(entry));
  assert.equal(parsed.ok, true, entry.id);
  const lengths = findInlinePromptShapes(parsed, 1).matches.map((m) => m.length);
  return `quiet: decoded ${Math.max(...lengths)} code points`;
}

test("the record has one row per ledger case, in ledger order", () => {
  const rows = rowsOf(ledgerSection());
  assert.deepEqual(rows.map((r) => r.id), LEDGER.entries.map((e) => e.id));
  assert.equal(rows.length, 21);
});

test("every row's 'after' is the behaviour the CLI has now", () => {
  const rows = rowsOf(ledgerSection());
  for (const entry of LEDGER.entries) {
    const row = rows.find((r) => r.id === entry.id);
    assert.equal(row.after, observed(entry), `ledger ${entry.id}: the recorded outcome is not the real one`);
  }
});

// The "before" column cannot be re-run: the lexical YAML and JSON path is gone from the tree. It was measured once,
// at develop 5ecd226, and what this test pins is everything about it that can be checked from here: it agrees
// with what the ledger itself says about each case (the group), with the raw length of the literal (the lexical
// layer measured raw source), and with the tally of cases that changed.
test("every row's 'before' agrees with the ledger's own account of the case, and each changed case changed", () => {
  const rows = rowsOf(ledgerSection());
  const kind = (cell) => cell.split(":")[0];
  const tally = { toUnknown: [], toQuiet: [], toFinding: [], same: [] };
  for (const r of rows) {
    const entry = LEDGER.entries.find((e) => e.id === r.id);
    const b = kind(r.before);
    const a = kind(r.after);
    assert.ok(["finding", "quiet"].includes(b), `${r.id}: before is a finding or quiet`);
    // The ledger groups say what the lexical layer did: a finding for the first two groups, nothing for the third.
    const wasFinding = /^(G1\/C1|D1-vs-D2)/.test(entry.group);
    assert.ok(wasFinding || /^newly found/.test(entry.group), `${r.id}: unclassified ledger group`);
    assert.equal(b, wasFinding ? "finding" : "quiet", `${r.id}: before disagrees with its ledger group`);
    if (b === "finding" && /^G1\/C1/.test(entry.group)) {
      assert.ok(r.before.includes(`${entry.file} (${LONG.length} chars`), `${r.id}: the raw literal is ${LONG.length} characters`);
    }
    if (a === "quiet" && b === "finding") {
      const raw = /^\{"system": "(.*)"\}\n$/s.exec(bytesOf(entry).toString("utf8"))[1].length;
      assert.ok(r.before.includes(`${entry.file} (${raw} chars)`), `${r.id}: before is the RAW length, ${raw}`);
    }
    if (a === "unknown") tally.toUnknown.push(r.id);
    else if (b === "finding" && a === "quiet") tally.toQuiet.push(r.id);
    else if (b === "quiet" && a === "finding") tally.toFinding.push(r.id);
    else tally.same.push(r.id);
  }
  assert.equal(tally.toUnknown.length, 10);
  assert.deepEqual(tally.toQuiet, ["d09", "d09b", "d19"]);
  assert.deepEqual(tally.toFinding, ["b02", "b03", "d06", "d07", "d08", "d17", "d18"]);
  assert.deepEqual(tally.same, ["g07"], "g07 is the one recorded discrepancy");
  assert.match(ledgerSection(), /\*\*g07\*\* is valid YAML/);
  assert.match(ledgerSection(), /\*\*c12\*\* is labelled "invalid UTF-8"/);
});

test("the c12 discrepancy is real: its bytes start with a UTF-16 byte order mark", () => {
  const c12 = LEDGER.entries.find((e) => e.id === "c12");
  const bytes = bytesOf(c12);
  assert.deepEqual([bytes[0], bytes[1]], [0xff, 0xfe]);
  assert.ok(FAILURE_REASONS.includes("utf-16"));
  assert.equal(parseStructuralBytes(c12.file, bytes).reason, "utf-16");
});

test("the decoded lengths the record states for the three shrinking cases are the decoded lengths", () => {
  for (const [id, n] of [["d09", 50], ["d09b", 40], ["d19", 125]]) {
    const entry = LEDGER.entries.find((e) => e.id === id);
    const text = bytesOf(entry).toString("utf8");
    assert.ok(text.length > 200, `${id} measured on raw source is over the threshold (${text.length})`);
    const parsed = parseStructuralText(entry.file, text, "json");
    assert.equal(findInlinePromptShapes(parsed, 1).matches[0].length, n, id);
  }
});
