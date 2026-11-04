// The inline-prompt shapes over the parsed tree (ST-58, #120): decisions C, E and G.
//
// Two layers are exercised. The finder (scripts/structural-shapes.mjs) is called directly over trees from
// the reader, which pins the grammar. The real CLI is then run over temp repositories, which pins the
// wiring: that the audit consumes the tree, that the lexical layer no longer reads structural files for
// these rules, and that the additive report fields exist, are bounded, and validate against closed schemas.
//
// Every firing shape has a twin that must NOT fire. Mutation checks for this file are recorded in the
// pull request, one per behaviour.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { audit, validate, fixture, resultFor as ruleIn, REPO, HERE } from "./helpers.mjs";
import { parseStructuralText } from "../scripts/structural.mjs";
import { findInlinePromptShapes, PARAMETER_KEYS, SHAPES } from "../scripts/structural-shapes.mjs";
import { validate as validateSchema } from "../scripts/jsonschema.mjs";

const NO_INLINE = "promptsec.no-inline-system-prompt";
const VERSIONED = "promptsec.prompt-is-versioned-artifact";
const SAFETY = "misuse.safety-controls-not-disabled";
const LONG = "x".repeat(250);
const T = 200;
const VALIDATE_SCHEMA = JSON.parse(fs.readFileSync(path.join(REPO, "schemas", "validate-report.schema.json"), "utf8"));
const AUDIT_SCHEMA = JSON.parse(fs.readFileSync(path.join(REPO, "schemas", "audit-report.schema.json"), "utf8"));

const read = (text, format = "yaml") => {
  const r = parseStructuralText(format === "json" ? "t.json" : "t.yml", text, format);
  if (r.ok !== true) assert.fail(`fixture must parse: ${r.reason} ${r.code ?? ""} at ${r.line}:${r.column}`);
  return r;
};
const find = (text, format = "yaml", threshold = T) => findInlinePromptShapes(read(text, format), threshold);
const shapesOf = (text, format) => find(text, format).matches.map((m) => `${m.shape}:${m.length}`);

function target(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-shapes-"));
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

// --- The parameter shape ------------------------------------------------------------------------------

test("parameter: every listed name fires at a scalar value of 200 code points, and not at 199", () => {
  for (const name of PARAMETER_KEYS) {
    assert.deepEqual(shapesOf(`${name}: "${"y".repeat(200)}"\n`), ["parameter:200"], name);
    assert.deepEqual(shapesOf(`${name}: "${"y".repeat(199)}"\n`), [], `${name} at 199`);
  }
  assert.deepEqual(shapesOf(`systemPrompt: "${"y".repeat(200)}"\n`).length, 1);
});

test("parameter: the name list is the one the lexical layer uses", () => {
  const source = fs.readFileSync(path.join(REPO, "scripts", "standards.mjs"), "utf8");
  const m = /const INSTRUCTION_PARAM = \/[^\n]*\(([^)]*)\)\["']\?/.exec(source);
  assert.ok(m, "INSTRUCTION_PARAM not found");
  assert.deepEqual(m[1].split("|").sort(), [...PARAMETER_KEYS].sort());
});

test("parameter: a name that only contains a listed name, or differs in case, is not a parameter", () => {
  for (const name of ["my_system", "system_prompts", "System", "SYSTEM", "systeminstruction", "x-system", "instruction"]) {
    assert.deepEqual(shapesOf(`${name}: "${LONG}"\n`), [], name);
  }
});

test("parameter: the value may be any scalar style, and every style is a decoded scalar", () => {
  const body = "z".repeat(210);
  assert.deepEqual(shapesOf(`system: ${body}\n`), ["parameter:210"], "plain");
  assert.deepEqual(shapesOf(`system: '${body}'\n`), ["parameter:210"], "single quoted");
  assert.deepEqual(shapesOf(`system: "${body}"\n`), ["parameter:210"], "double quoted");
  assert.deepEqual(shapesOf(JSON.stringify({ system: body }), "json"), ["parameter:210"], "JSON string");
});

test("parameter: a YAML block scalar is a named non-claim (Standard 21), and the reader still decodes it", () => {
  const body = "z".repeat(210);
  for (const header of ["|", "|-", "|+", ">", ">-", ">+"]) {
    assert.deepEqual(shapesOf(`system: ${header}\n  ${body}\n`), [], header);
    assert.deepEqual(shapesOf(`- role: system\n  content: ${header}\n    ${body}\n`), [], `content ${header}`);
  }
  const parsed = read(`system: |-\n  ${body}\n`);
  assert.equal(parsed.documents[0].root.pairs[0].value.length, 210, "decoded, so lifting the non-claim is a one-line decision");
});

test("parameter: a value that is not a scalar is not a literal (a map, a sequence, an alias)", () => {
  assert.deepEqual(shapesOf(`system:\n  - "${LONG}"\n`), []);
  assert.deepEqual(shapesOf(`system:\n  text: "${LONG}"\n`), []);
  assert.deepEqual(shapesOf(`a: &a "${"q".repeat(20)}"\nsystem: *a\n`), []);
});

test("parameter: it is found at any depth, in a sequence item and under another key", () => {
  assert.deepEqual(shapesOf(`a:\n  b:\n    - c: 1\n    - system: "${LONG}"\n`), ["parameter:250"]);
});

// --- Decoding before measuring (decision E) -----------------------------------------------------------

test("length is the DECODED value in Unicode code points: JSON escapes that shrink 300 raw characters to 50 do not fire", () => {
  const raw = `{"system": "${"\\u0041".repeat(50)}"}`;
  assert.ok(raw.length > 300);
  assert.deepEqual(shapesOf(raw, "json"), []);
  const atThreshold = `{"system": "${"\\u0041".repeat(200)}"}`;
  assert.deepEqual(shapesOf(atThreshold, "json"), ["parameter:200"], "200 decoded fires even though raw is 1200");
});

test("length counts an astral character once, not as two UTF-16 units", () => {
  const emoji = "\u{1F600}";
  assert.deepEqual(shapesOf(`system: "${emoji.repeat(199)}"\n`), [], "199 code points is 398 UTF-16 units");
  assert.deepEqual(shapesOf(`system: "${emoji.repeat(200)}"\n`), ["parameter:200"]);
});

test("length is measured after YAML folding: a folded double-quoted scalar loses its line breaks", () => {
  const folded = `system: "${"a".repeat(100)}\n  ${"b".repeat(99)}"\n`; // 100 + one space + 99 = 200
  assert.deepEqual(shapesOf(folded), ["parameter:200"]);
  const short = `system: "${"a".repeat(100)}\n  ${"b".repeat(98)}"\n`;
  assert.deepEqual(shapesOf(short), []);
});

test("a plain multi-line scalar is one decoded scalar", () => {
  assert.deepEqual(shapesOf(`system: aaaa\n  bbb${LONG}\n`), ["parameter:258"]);
});

test("keys are decoded before they are compared: an escaped key is the key", () => {
  assert.deepEqual(shapesOf(`{"sys\\u0074em": "${LONG}"}`, "json"), ["parameter:250"], "JSON escape");
  assert.deepEqual(shapesOf(`"sys\\x74em": "${LONG}"\n`), ["parameter:250"], "YAML escape");
  assert.deepEqual(shapesOf(`{"role":"\\u0073ystem","content":"${LONG}"}`, "json"), ["message-role:250"], "escaped role value");
});

test("an anchor or a tag on a value does not change what the value is", () => {
  assert.deepEqual(shapesOf(`system: &a "${LONG}"\n`), ["parameter:250"]);
  assert.deepEqual(shapesOf(`system: !!str "${LONG}"\n`), ["parameter:250"]);
  assert.deepEqual(shapesOf(`system: !custom &a ${LONG}\n`), ["parameter:250"]);
  assert.deepEqual(shapesOf(`&k system: "${LONG}"\n`), ["parameter:250"], "an anchor on the key");
});

test("no implicit type coercion: a plain number or boolean is its text, and an empty value has no length", () => {
  const r = find(`system: ${"9".repeat(220)}\nother: true\nsystem2:\n`);
  assert.deepEqual(r.matches.map((m) => m.length), [220]);
  assert.deepEqual(shapesOf("system:\n"), []);
  assert.deepEqual(shapesOf("system: null\n"), []);
});

// --- The message role shape ---------------------------------------------------------------------------

test("message role: role system with content, in either key order, YAML and JSON", () => {
  assert.deepEqual(shapesOf(`- role: system\n  content: "${LONG}"\n`), ["message-role:250"]);
  assert.deepEqual(shapesOf(`- content: "${LONG}"\n  role: system\n`), ["message-role:250"]);
  assert.deepEqual(shapesOf(`[{"role": "system", "content": "${LONG}"}]`, "json"), ["message-role:250"]);
  assert.deepEqual(shapesOf(`[{"content": "${LONG}", "role": "system"}]`, "json"), ["message-role:250"]);
  assert.deepEqual(shapesOf(`- {role: system, content: "${LONG}"}\n`), ["message-role:250"], "flow mapping");
});

test("message role: the twins that must not fire", () => {
  assert.deepEqual(shapesOf(`- role: user\n  content: "${LONG}"\n`), [], "another role");
  assert.deepEqual(shapesOf(`- role: developer\n  content: "${LONG}"\n`), [], "developer is not system");
  assert.deepEqual(shapesOf(`- role: System\n  content: "${LONG}"\n`), [], "case matters");
  assert.deepEqual(shapesOf(`- role: system-admin\n  content: "${LONG}"\n`), [], "not the whole value");
  assert.deepEqual(shapesOf(`- role: system\n  content: "short"\n`), [], "short content");
  assert.deepEqual(shapesOf(`- role: system\n`), [], "no content");
  assert.deepEqual(shapesOf(`- role: system\n- content: "${LONG}"\n`), [], "content in a neighbouring mapping");
  assert.deepEqual(shapesOf(`- role: system\n  nested:\n    content: "${LONG}"\n`), [], "content in a nested mapping");
  assert.deepEqual(shapesOf(`- role: system\n  content:\n    - type: text\n      other: "${LONG}"\n`), [], "content that is an array of parts");
  assert.deepEqual(shapesOf(`role: system\n`), []);
});

test("message role: the role is a scalar value of its own mapping, so a role quoted differently is the same role", () => {
  assert.deepEqual(shapesOf(`- role: 'system'\n  content: ${LONG}\n`), ["message-role:250"]);
  assert.deepEqual(shapesOf(`- "role": "system"\n  "content": ${LONG}\n`), ["message-role:250"]);
});

// --- The systemInstruction parts shape ----------------------------------------------------------------

test("systemInstruction parts: a text literal inside the parts, either spelling, YAML and JSON", () => {
  assert.deepEqual(shapesOf(`systemInstruction: {parts: [{text: "${LONG}"}]}\n`), ["system-instruction-parts:250"]);
  assert.deepEqual(shapesOf(`system_instruction: {parts: [{text: "${LONG}"}]}\n`), ["system-instruction-parts:250"]);
  assert.deepEqual(shapesOf(`{"systemInstruction": {"parts": [{"text": "${LONG}"}]}}`, "json"), ["system-instruction-parts:250"]);
  assert.deepEqual(shapesOf(`systemInstruction: {parts: {text: "${LONG}"}}\n`), ["system-instruction-parts:250"], "parts as a mapping");
  assert.deepEqual(shapesOf(`systemInstruction: {parts: [{extra: 1, inner: {text: "${LONG}"}}]}\n`), ["system-instruction-parts:250"], "text deeper inside the parts");
});

test("systemInstruction parts: the twins that must not fire", () => {
  assert.deepEqual(shapesOf(`systemInstruction: {text: "${LONG}"}\n`), [], "text outside the parts");
  assert.deepEqual(shapesOf(`contents:\n  - role: user\n    parts:\n      - text: "${LONG}"\n`), [], "a user turn's parts");
  assert.deepEqual(shapesOf(`other:\n  parts:\n    - text: "${LONG}"\n`), [], "parts of something else");
  assert.deepEqual(shapesOf(`systemInstruction: {parts: [{text: "short"}]}\n`), [], "short text");
  assert.deepEqual(shapesOf(`systemInstruction: {parts: [{text: "x"}], text: "${LONG}"}\n`), [], "text beside the parts");
  assert.deepEqual(shapesOf(`systemInstruction: {config: {parts: [{text: "${LONG}"}]}}\n`), [], "parts not a key of the systemInstruction itself");
});

test("systemInstruction parts: a block-style YAML systemInstruction is a named non-claim (Standard 21); the flow form and JSON are claimed", () => {
  assert.deepEqual(shapesOf(`systemInstruction:\n  parts:\n    - text: "${LONG}"\n`), []);
  assert.deepEqual(shapesOf(`system_instruction:\n  parts: [{text: "${LONG}"}]\n`), [], "a block mapping with a flow parts");
  assert.deepEqual(shapesOf(`systemInstruction: {parts: [{text: "${LONG}"}]}\n`), ["system-instruction-parts:250"], "flow mapping");
  assert.deepEqual(shapesOf(`systemInstruction: &g {parts: [{text: "${LONG}"}]}\n`), ["system-instruction-parts:250"], "flow mapping with an anchor");
  assert.deepEqual(shapesOf(`{"systemInstruction": {"parts": [{"text": "${LONG}"}]}}`, "json"), ["system-instruction-parts:250"], "JSON has one style");
});

test("systemInstruction given as a plain scalar is the PARAMETER shape, not the parts shape", () => {
  assert.deepEqual(shapesOf(`systemInstruction: "${LONG}"\n`), ["parameter:250"]);
});

// --- Aliases, merge keys, anchors (decision C) --------------------------------------------------------

test("an anchor definition is scanned where it is written, and an alias to it is not a second finding", () => {
  const r = find(`base: &b\n  system: "${LONG}"\nuse: *b\n`);
  assert.equal(r.matches.length, 1);
  assert.equal(r.matches[0].line, 2);
});

test("an alias is not dereferenced: a literal supplied through one is a non-claim, and the alias is listed", () => {
  const text = `lit: &lit "${LONG}"\nsystem: *lit\n`;
  const parsed = read(text);
  assert.deepEqual(findInlinePromptShapes(parsed, T).matches, []);
  assert.equal(parsed.aliases.length, 1);
});

test("a merge key is not applied: content or role supplied through one does not complete a shape", () => {
  const viaMerge = `base: &b\n  content: "${LONG}"\nmsg:\n  role: system\n  <<: *b\n`;
  const parsed = read(viaMerge);
  assert.deepEqual(findInlinePromptShapes(parsed, T).matches, [], "no role in `base`, no content authored in `msg`");
  assert.equal(parsed.merges.length, 1);
  const roleViaMerge = `base: &b\n  role: system\nmsg:\n  <<: *b\n  content: "${LONG}"\n`;
  assert.deepEqual(find(roleViaMerge).matches, []);
});

test("a mapping merged inline IS authored, and is scanned", () => {
  assert.deepEqual(shapesOf(`msg:\n  <<: {role: system, content: "${LONG}"}\n`), ["message-role:250"], "a complete shape written inside the merge value");
  assert.deepEqual(shapesOf(`msg:\n  <<: {system: "${LONG}"}\n`), ["parameter:250"], "a parameter inside the merged flow mapping is a literally authored node");
});

// --- Documents (decision C) ---------------------------------------------------------------------------

test("documents are scanned independently and evidence is never combined across a boundary", () => {
  assert.deepEqual(shapesOf(`role: system\n---\ncontent: "${LONG}"\n`), [], "role in one document, content in the next");
  assert.deepEqual(shapesOf(`content: "${LONG}"\n---\nrole: system\n`), []);
  assert.deepEqual(shapesOf(`systemInstruction:\n  parts: []\n---\n- text: "${LONG}"\n`), []);
});

test("every document is read and carries its own index", () => {
  const r = find(`system: "short"\n---\nsystem: "${LONG}"\n---\nrole: system\ncontent: "${LONG}"\n`);
  assert.deepEqual(r.matches.map((m) => [m.documentIndex, m.shape]), [[1, "parameter"], [2, "message-role"]]);
});

// --- Duplicate keys (decision E) ----------------------------------------------------------------------

test("a duplicate key is evaluated at every occurrence, whichever comes first", () => {
  const longFirst = find(`system: "${LONG}"\nsystem: "short"\n`);
  assert.equal(longFirst.matches.length, 1);
  assert.equal(longFirst.matches[0].duplicate, true);
  const longLast = find(`system: "short"\nsystem: "${LONG}"\n`);
  assert.equal(longLast.matches.length, 1);
  assert.equal(longLast.matches[0].line, 2);
  const both = find(`system: "${LONG}"\nsystem: "${LONG}y"\n`);
  assert.deepEqual(both.matches.map((m) => m.length), [250, 251]);
});

test("a role that is system on ANY occurrence, and a duplicate content, are evaluated", () => {
  const r = find(`role: system\nrole: user\ncontent: "${LONG}"\ncontent: "short"\n`);
  assert.equal(r.matches.length, 1);
  assert.equal(r.matches[0].shape, SHAPES.messageRole);
  assert.equal(r.matches[0].duplicate, true);
  const lastWins = find(`role: user\nrole: system\ncontent: "${LONG}"\n`);
  assert.equal(lastWins.matches.length, 1, "system on the last occurrence is as good as on the first");
  const none = find(`role: user\nrole: assistant\ncontent: "${LONG}"\n`);
  assert.deepEqual(none.matches, []);
});

test("duplicate keys are reported as evidence, for the examined keys only, with the occurrence count", () => {
  const r = find(`system: a\nsystem: b\nsystem: c\nunrelated: 1\nunrelated: 2\nrole: x\n`);
  assert.deepEqual(r.duplicates.map((d) => [d.key, d.occurrences, d.line]), [["system", 3, 1]]);
});

test("duplicates are decided after decoding: an escaped spelling of the same key is a duplicate", () => {
  const r = find(`{"system": "a", "sys\\u0074em": "${LONG}"}`, "json");
  assert.equal(r.duplicates.length, 1);
  assert.equal(r.matches.length, 1);
  assert.equal(r.matches[0].duplicate, true);
});

test("the same key in different mappings is not a duplicate", () => {
  assert.deepEqual(find(`a:\n  system: x\nb:\n  system: y\n`).duplicates, []);
});

// --- Complex keys (decision E non-claim) --------------------------------------------------------------

test("a system mapping nested inside a complex key is a documented non-claim", () => {
  assert.deepEqual(shapesOf(`? {system: "${LONG}"}\n: value\n`), []);
  assert.deepEqual(shapesOf(`? - role: system\n    content: "${LONG}"\n: value\n`), []);
  assert.deepEqual(shapesOf(`? simple\n: {system: "${LONG}"}\n`), ["parameter:250"], "the VALUE of an explicit key is scanned");
});

// --- Locations (decision G) ---------------------------------------------------------------------------

test("a match carries line, column, key, path, shape, length and the document index", () => {
  const text = `---\nlist:\n  - name: a\n    system: "${LONG}"\n`;
  const [m] = find(text).matches;
  assert.deepEqual(
    { shape: m.shape, length: m.length, documentIndex: m.documentIndex, line: m.line, column: m.column, key: m.key, path: m.path, duplicate: m.duplicate },
    { shape: "parameter", length: 250, documentIndex: 0, line: 4, column: 13, key: "system", path: ["list", 0, "system"], duplicate: false },
  );
});

test("the column counts code points: an astral character earlier on the line counts once", () => {
  const prefix = `{"😀": 1, system: `;
  const [m] = find(`${prefix}"${LONG}"}`).matches;
  assert.equal(m.column, Array.from(prefix).length + 1);
  assert.notEqual(m.column, prefix.length + 1, "not UTF-16 units");
});

test("a message role match is located at the content literal and a parts match at the text literal", () => {
  const [a] = find(`- role: system\n  content: "${LONG}"\n`).matches;
  assert.deepEqual([a.key, a.path, a.line], ["content", [0, "content"], 2]);
  const [b] = find(`systemInstruction: {parts: [{text: "${LONG}"}]}\n`).matches;
  assert.deepEqual([b.key, b.path, b.line], ["text", ["systemInstruction", "parts", 0, "text"], 1]);
});

test("every over-threshold literal is a match, in source order, so a short one before a long one does not hide it", () => {
  const r = find(`a:\n  system: "short"\nb:\n  system: "${LONG}"\nc:\n  instructions: "${LONG}${LONG}"\n`);
  assert.deepEqual(r.matches.map((m) => [m.key, m.line, m.length]), [["system", 4, 250], ["instructions", 6, 500]]);
});

// --- Hostile and resource inputs ----------------------------------------------------------------------

test("hostile: a 20000-deep JSON nesting is walked without recursion and the path is bounded", () => {
  const depth = 20000;
  const text = `${"[".repeat(depth)}{"system": "${LONG}"}${"]".repeat(depth)}`;
  const parsed = read(text, "json");
  const [m] = findInlinePromptShapes(parsed, T).matches;
  assert.equal(m.length, 250);
  assert.equal(m.path.length <= 64, true, "the path is cut to its last 64 steps");
  assert.equal(m.pathTruncated, true);
  assert.equal(m.path.at(-1), "system");
});

test("hostile: a very long key is clipped in the path, never copied whole", () => {
  const key = "k".repeat(100000);
  const [m] = find(`{"${key}": {"system": "${LONG}"}}`, "json").matches;
  assert.equal(m.path[0].length <= 129, true);
  assert.ok(m.path[0].endsWith("…"));
});

test("hostile: a file of thousands of literals is scanned in one pass", () => {
  const rows = [];
  for (let i = 0; i < 2000; i += 1) rows.push(`- system: "${LONG}"`);
  const started = Date.now();
  const r = find(`${rows.join("\n")}\n`);
  assert.equal(r.matches.length, 2000);
  assert.ok(Date.now() - started < 10000, "linear, not quadratic");
});

test("hostile: a mapping of twenty thousand keys with no shape finds nothing", () => {
  const body = Array.from({ length: 20000 }, (_, i) => `k${i}: v`).join("\n");
  const r = find(`${body}\n`);
  assert.deepEqual(r.matches, []);
});

// --- Through the CLI ----------------------------------------------------------------------------------

test("CLI: a parsed YAML or JSON file is read from the TREE for the inline-prompt rules, with evidence strings in their existing form", () => {
  const dir = target({
    "param.yml": `system: "${LONG}"\n`,
    "role.json": `[{"role": "system", "content": "${LONG}"}]\n`,
    "gem.yaml": `systemInstruction: {parts: [{text: "${LONG}"}]}\n`,
  });
  const result = ruleIn(validate(dir).json, NO_INLINE);
  assert.equal(result.disposition, "evaluated");
  assert.deepEqual([...result.evidence].sort(), [
    "gem.yaml (250 chars, systemInstruction parts shape)",
    "param.yml (250 chars)",
    "role.json (250 chars, message role shape)",
  ]);
  assert.equal(ruleIn(validate(dir).json, VERSIONED).evidence.length, 3, "both rules carry it");
});

test("CLI: the compatibility change from raw-source measurement: escapes that shrink below 200 no longer fire, and folded or tagged literals now do", () => {
  const shrinks = verdictOf({ "p.json": `{"system": "${"\\u0041".repeat(50)}"}\n` });
  assert.equal(shrinks.disposition, "not-evaluated");
  assert.deepEqual(shrinks.evidence, []);
  assert.equal(shrinks.result, "skipped");
  for (const [name, content] of Object.entries({
    "anchored.yml": `system: &a "${LONG}"\n`,
    "tagged.yml": `system: !!str "${LONG}"\n`,
    "escaped-key.json": `{"sys\\u0074em": "${LONG}"}\n`,
    "escaped-key.yml": `"sys\\x74em": "${LONG}"\n`,
    "escaped-role.json": `{"role":"\\u0073ystem","content":"${LONG}"}\n`,
    "folded.yml": `system: "aaaa\n  bbb${LONG}"\n`,
    "plain.yml": `system: aaaa\n  bbb${LONG}\n`,
  })) {
    const r = verdictOf({ [name]: content });
    assert.equal(r.disposition, "evaluated", name);
    assert.ok(["failed", "warning"].includes(r.result), name);
    assert.equal(r.evidence.length, 1, name);
  }
});

test("CLI: structural files are not scanned lexically for these rules at all: a long literal the tree does not see is not found by text", () => {
  // A YAML comment is invisible to the tree and to the lexical layer alike; a literal that exists only as
  // the KEY of a deeper mapping is the case the lexical layer used to see by indentation and the tree does not.
  const r = verdictOf({ "a.yml": `# system: "${LONG}"\nk: v\n` });
  assert.equal(r.disposition, "not-evaluated");
  assert.deepEqual(r.evidence, []);
});

test("CLI: every location is a structured entry beside the unchanged evidence strings", () => {
  const dir = target({
    "p.yml": `---\nsystem: "short"\n---\nitems:\n  - system: "${LONG}"\n`,
    "r.json": `{"msgs": [{"content": "${LONG}", "role": "system"}]}\n`,
  });
  const json = validate(dir).json;
  const r = ruleIn(json, NO_INLINE);
  assert.deepEqual(r.locations, [
    { file: "p.yml", documentIndex: 1, line: 5, column: 13, key: "system", path: ["items", 0, "system"], shape: "parameter", length: 250, duplicate: false },
    { file: "r.json", line: 1, column: 23, key: "content", path: ["msgs", 0, "content"], shape: "message-role", length: 250, duplicate: false },
  ]);
  assert.equal(r.locationsOmitted, 0);
  assert.deepEqual(r.evidence.sort(), ["p.yml (250 chars)", "r.json (250 chars, message role shape)"]);
  assert.deepEqual(validateSchema(json, VALIDATE_SCHEMA), []);
});

test("CLI: a rule with no location carries an empty list and a zero count, not an absent field", () => {
  const json = validate(target({ "a.yml": "k: v\n" })).json;
  for (const r of json.results) {
    assert.ok(Array.isArray(r.locations), r.rule);
    assert.equal(r.locationsOmitted, 0, r.rule);
  }
});

test("CLI: locations are bounded at 50 per result and the rest are counted", () => {
  const rows = Array.from({ length: 80 }, () => `- system: "${LONG}"`).join("\n");
  const json = validate(target({ "many.yml": `${rows}\n` })).json;
  const r = ruleIn(json, NO_INLINE);
  assert.equal(r.locations.length, 50);
  assert.equal(r.locationsOmitted, 30);
  assert.deepEqual(validateSchema(json, VALIDATE_SCHEMA), []);
});

test("CLI: a lexically scanned file (source code) has evidence strings and no location, because the lexical layer has none", () => {
  const dir = target({ "app.js": `const x = { system: "${LONG}" };\n` });
  const r = ruleIn(validate(dir).json, NO_INLINE);
  assert.deepEqual(r.evidence, ["app.js (250 chars)"]);
  assert.deepEqual(r.locations, []);
});

test("CLI: a refused file stays file-scoped unknown, a violation elsewhere stands, and neither gains a location from the other", () => {
  const dir = target({ "bad.yml": `system: "${LONG}"\nbad: [\n`, "good.yml": `system: "${LONG}"\n` });
  const r = ruleIn(validate(dir).json, NO_INLINE);
  assert.equal(r.disposition, "evaluated");
  assert.deepEqual(r.locations.map((l) => l.file), ["good.yml"]);
});

test("CLI: Standard 9 is unchanged and still reads a structural file lexically", () => {
  const r = verdictOf({ "cfg.yml": "moderation: \"off\"\n" }, SAFETY);
  assert.equal(r.disposition, "evaluated");
  assert.deepEqual(r.locations, []);
});

test("CLI: the validate report is schemaVersion 1.1, the locations schema is closed, and a 1.0 envelope is refused", () => {
  const json = validate(target({ "p.yml": `system: "${LONG}"\n` })).json;
  assert.equal(json.schemaVersion, "1.1");
  assert.deepEqual(validateSchema(json, VALIDATE_SCHEMA), []);
  const withExtraLocation = structuredClone(json);
  ruleIn(withExtraLocation, NO_INLINE).locations[0].extra = 1;
  assert.ok(validateSchema(withExtraLocation, VALIDATE_SCHEMA).length > 0, "a location is a closed object");
  const missing = structuredClone(json);
  delete ruleIn(missing, NO_INLINE).locations;
  assert.ok(validateSchema(missing, VALIDATE_SCHEMA).length > 0, "locations is required in 1.1");
  const badShape = structuredClone(json);
  ruleIn(badShape, NO_INLINE).locations[0].shape = "other";
  assert.ok(validateSchema(badShape, VALIDATE_SCHEMA).length > 0, "shape is an enumeration");
  assert.ok(validateSchema({ ...json, schemaVersion: "1.0" }, VALIDATE_SCHEMA).length > 0);
});

test("CLI: the audit report lists duplicate keys it evaluated, bounded, and is schemaVersion 1.2", () => {
  const dir = target({ "d.yml": "system: a\nsystem: b\n", "j.json": "{\"role\": \"x\", \"role\": \"y\"}\n" });
  const { json } = audit(dir);
  assert.equal(json.schemaVersion, "1.2");
  assert.deepEqual(validateSchema(json, AUDIT_SCHEMA), []);
  const dup = json.structuralSurface.duplicateKeysEvaluated;
  assert.equal(dup.total, 2);
  assert.equal(dup.omitted, 0);
  assert.deepEqual(dup.listed.map((d) => [d.file, d.key, d.occurrences]).sort(), [["d.yml", "system", 2], ["j.json", "role", 2]]);
  const { structuralSurface, ...without } = json;
  const { duplicateKeysEvaluated, ...surfaceWithout } = structuralSurface;
  assert.ok(duplicateKeysEvaluated !== undefined);
  assert.ok(validateSchema({ ...without, structuralSurface: surfaceWithout }, AUDIT_SCHEMA).length > 0, "required in 1.2");
});

test("CLI: duplicate evidence is bounded at 50 listed and the total stays exact", () => {
  const lines = [];
  for (let i = 0; i < 70; i += 1) lines.push(`- {system: a, system: b}`);
  const { json } = audit(target({ "many.yml": `${lines.join("\n")}\n` }));
  const dup = json.structuralSurface.duplicateKeysEvaluated;
  assert.equal(dup.total, 70);
  assert.equal(dup.listed.length, 50);
  assert.equal(dup.omitted, 20);
});

test("CLI: the ST-58 ledger cases have the outcome the owner accepted", () => {
  const ledger = JSON.parse(fs.readFileSync(path.join(HERE, "fixtures", "structural-ledger", "ledger.json"), "utf8"));
  const expectFires = new Set(["b02", "b03", "d06", "d07", "d08", "d17", "d18"]);
  const expectQuiet = new Set(["d09", "d09b", "d19"]);
  let seen = 0;
  for (const e of ledger.entries.filter((x) => x.completedBy === "ST-58 and ST-59")) {
    const r = verdictOf({ [e.file]: e.content.replaceAll("<L>", LONG) });
    if (expectFires.has(e.id)) {
      assert.equal(r.disposition, "evaluated", e.id);
      assert.ok(["failed", "warning"].includes(r.result), e.id);
      assert.equal(r.locations.length, 1, e.id);
    } else {
      assert.ok(expectQuiet.has(e.id), `unclassified ledger case ${e.id}`);
      assert.equal(r.disposition, "not-evaluated", e.id);
      assert.deepEqual(r.locations, [], e.id);
    }
    seen += 1;
  }
  assert.equal(seen, expectFires.size + expectQuiet.size);
});

test("duplicate context reaches the parts shape: a duplicated parts or systemInstruction key flags the match", () => {
  const dupParts = find(`{"systemInstruction":{"parts":[{"text":"${LONG}"}],"parts":[]}}`, "json").matches;
  assert.deepEqual(dupParts.map((m) => m.duplicate), [true]);
  const dupInstruction = find(`{"systemInstruction":{"parts":[{"text":"${LONG}"}]},"systemInstruction":{}}`, "json").matches;
  assert.deepEqual(dupInstruction.map((m) => m.duplicate), [true]);
  const clean = find(`{"systemInstruction":{"parts":[{"text":"${LONG}"}]}}`, "json").matches;
  assert.deepEqual(clean.map((m) => m.duplicate), [false]);
  const unrelated = find(`{"other":1,"other":2,"systemInstruction":{"parts":[{"text":"${LONG}"}]}}`, "json").matches;
  assert.deepEqual(unrelated.map((m) => m.duplicate), [false], "a duplicate that is not on the path does not flag it");
});

// --- Review repairs (independent review of fbe4e34) ---------------------------------------------------

test("hostile: a minified 500 KB JSON of duplicated objects on one line is not quadratic", () => {
  const text = `[${Array.from({ length: 17000 }, () => '{"system":"a","system":"b"}').join(",")}]`;
  assert.ok(Buffer.byteLength(text) < 512 * 1024);
  const parsed = read(text, "json");
  const started = Date.now();
  const r = findInlinePromptShapes(parsed, T);
  assert.equal(r.duplicates.length, 17000);
  assert.ok(Date.now() - started < 3000, `took ${Date.now() - started} ms; locating every entry would take seconds`);
  const first = r.duplicates[0];
  assert.deepEqual([first.line, first.column], [1, 3], "an entry is still located when it is read");
});

test("hostile: thousands of literals on one line are located only when read", () => {
  const text = `[${Array.from({ length: 3500 }, () => `{"system":"${LONG}"}`).join(",")}]`;
  const parsed = read(text, "json");
  const started = Date.now();
  const r = findInlinePromptShapes(parsed, T);
  assert.equal(r.matches.length, 3500);
  assert.ok(Date.now() - started < 3000, `took ${Date.now() - started} ms`);
  assert.equal(r.matches[1].column, 1 + 1 + `{"system":"${LONG}"},`.length + `{"system":`.length);
});

test("CLI: the same minified file is reported in bounded time, with exact totals and 50 listed", () => {
  const text = `[${Array.from({ length: 12000 }, () => '{"system":"a","system":"b"}').join(",")}]`;
  const dir = target({ "min.json": text });
  const started = Date.now();
  const { json } = audit(dir);
  assert.ok(Date.now() - started < 15000);
  assert.equal(json.structuralSurface.duplicateKeysEvaluated.total, 12000);
  assert.equal(json.structuralSurface.duplicateKeysEvaluated.listed.length, 50);
});

test("a clipped path step never ends in half of a surrogate pair, and is clipped by code points", () => {
  const key = `a${"\u{1F600}".repeat(200)}`;
  const [m] = find(`{"${key}": {"system": "${LONG}"}}`, "json").matches;
  const step = m.path[0];
  assert.ok(step.endsWith("…"));
  assert.equal(step.isWellFormed ? step.isWellFormed() : !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(step), true, "well-formed UTF-16");
  assert.equal(Array.from(step).length, 129, "128 code points and the ellipsis");
});

test("a duplicated role alone flags the message-role match", () => {
  const [m] = find(`role: user\nrole: system\ncontent: "${LONG}"\n`).matches;
  assert.equal(m.duplicate, true);
  const [clean] = find(`role: system\ncontent: "${LONG}"\n`).matches;
  assert.equal(clean.duplicate, false);
});

test("the report schemas pin what a location and a duplicate entry must carry, and the 50 bound", () => {
  const json = validate(target({ "p.yml": `system: "${LONG}"\n` })).json;
  const base = ruleIn(json, NO_INLINE);
  for (const field of ["file", "line", "column", "key", "path", "shape", "length", "duplicate"]) {
    const copy = structuredClone(json);
    delete ruleIn(copy, NO_INLINE).locations[0][field];
    assert.ok(validateSchema(copy, VALIDATE_SCHEMA).length > 0, `a location without ${field} is refused`);
  }
  const over = structuredClone(json);
  ruleIn(over, NO_INLINE).locations = Array.from({ length: 51 }, () => structuredClone(base.locations[0]));
  assert.ok(validateSchema(over, VALIDATE_SCHEMA).length > 0, "51 listed locations are refused");

  const a = audit(target({ "d.yml": "system: a\nsystem: b\n" })).json;
  for (const field of ["file", "key", "occurrences", "line", "column", "path"]) {
    const copy = structuredClone(a);
    delete copy.structuralSurface.duplicateKeysEvaluated.listed[0][field];
    assert.ok(validateSchema(copy, AUDIT_SCHEMA).length > 0, `a duplicate entry without ${field} is refused`);
  }
  const tooMany = structuredClone(a);
  tooMany.structuralSurface.duplicateKeysEvaluated.listed = Array.from({ length: 51 }, () => structuredClone(a.structuralSurface.duplicateKeysEvaluated.listed[0]));
  assert.ok(validateSchema(tooMany, AUDIT_SCHEMA).length > 0, "51 listed duplicates are refused");
});

test("a JSON duplicate entry carries no documentIndex and a YAML one does", () => {
  const { json } = audit(target({ "d.yml": "system: a\nsystem: b\n", "j.json": "{\"role\": \"x\", \"role\": \"y\"}\n" }));
  const byFile = Object.fromEntries(json.structuralSurface.duplicateKeysEvaluated.listed.map((d) => [d.file, d]));
  assert.equal("documentIndex" in byFile["j.json"], false);
  assert.equal(byFile["d.yml"].documentIndex, 0);
});

test("hostile: duplicates at every level of a deeply nested file are not quadratic in depth", () => {
  const depth = 18000;
  const text = '{"role":0,"role":1,"x":'.repeat(depth) + "0" + "}".repeat(depth);
  const parsed = read(text, "json");
  const started = Date.now();
  const r = findInlinePromptShapes(parsed, T);
  assert.equal(r.duplicates.length, depth);
  assert.ok(Date.now() - started < 600, `took ${Date.now() - started} ms`);
  const last = r.duplicates.at(-1);
  assert.equal(last.path.length, 64);
  assert.equal(last.pathTruncated, true);
  const shallow = r.duplicates[10];
  assert.equal(shallow.path.length, 10, "a path under the limit is whole and not marked truncated");
  assert.equal("pathTruncated" in shallow, false);
  assert.equal(r.duplicates[64].path.length, 64, "exactly 64 steps is not truncated");
  assert.equal("pathTruncated" in r.duplicates[64], false);
  assert.equal(r.duplicates[65].pathTruncated, true);
});

test("an entry keeps no reference to the parsed result: it locates through the standalone locator only", () => {
  const parsed = read(`system: "${LONG}"\n`);
  const { matches } = findInlinePromptShapes(parsed, T);
  parsed.locate = () => { throw new Error("the entry must not reach back into the parsed result"); };
  parsed.documents = null;
  parsed.text = null;
  assert.deepEqual([matches[0].line, matches[0].column], [1, 9]);
});

test("hostile: a very long ancestor key shared by many entries is clipped in bounded work", () => {
  const key = "k".repeat(200000);
  const kids = Array.from({ length: 1000 }, () => '{"role":0,"role":1}').join(",");
  const parsed = read(`{"${key}":[${kids}]}`, "json");
  const started = Date.now();
  const r = findInlinePromptShapes(parsed, T);
  assert.equal(r.duplicates.length, 1000);
  assert.ok(Date.now() - started < 600, `took ${Date.now() - started} ms`);
  assert.equal(Array.from(r.duplicates[0].path[0]).length, 129);
});

test("clipping by code points: exactly 128 points is whole, 129 is cut, a pair on the boundary is never split", () => {
  const whole = "a".repeat(127) + "\u{1F600}"; // 128 code points, 129 UTF-16 units
  const [a] = find(`{"${whole}": {"system": "${LONG}"}}`, "json").matches;
  assert.equal(a.path[0], whole);
  const cut = "a".repeat(128) + "b";
  const [b] = find(`{"${cut}": {"system": "${LONG}"}}`, "json").matches;
  assert.equal(b.path[0], `${"a".repeat(128)}…`);
  const boundary = "a".repeat(127) + "\u{1F600}" + "z";
  const [c] = find(`{"${boundary}": {"system": "${LONG}"}}`, "json").matches;
  assert.equal(c.path[0], `${"a".repeat(127)}\u{1F600}…`);
});
