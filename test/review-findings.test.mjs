// Regression controls for the five review findings left on PR #92 after it merged
// (https://github.com/mikeycdavis/AIStandards/pull/92). Each finding has a firing case that failed on
// the merged code and a non-firing case of the same shape, so a repair that fires on everything, or
// that fixes the shape by blinding the detector, fails a control.
//
//   1. an empty --dir (`--dir=`) selected the working directory instead of being refused;
//   2. a root test/fixtures directory withdrew the content-derived rules even where a file that WAS
//      collected plainly violated them;
//   3. an instruction parameter inside a comment (or a string literal) was measured as an inline prompt;
//   4. only the first instruction parameter in a file was measured;
//   5. a repeated key inside a `- key: value` sequence mapping silently kept the last value.
//
// Targets are built in a temp directory from the committed inline-system-prompt fixture's policy and
// manifest, so the only thing that differs between a firing and a non-firing case is the source.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validate, fixture, resultFor as ruleIn, cli, REPO } from "./helpers.mjs";
import { parseYaml } from "../scripts/yaml.mjs";

const VERSIONED = "promptsec.prompt-is-versioned-artifact";
const NO_INLINE = "promptsec.no-inline-system-prompt";
const SAFETY = "misuse.safety-controls-not-disabled";
const LONG = "You are a support triage assistant. ".repeat(8); // 288 characters, over the 200 threshold
const SHORT = "Be brief.";

function target(files, { manifest } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-review-"));
  const base = fixture("inline-system-prompt");
  fs.copyFileSync(path.join(base, "ai-policy.yml"), path.join(dir, "ai-policy.yml"));
  fs.writeFileSync(path.join(dir, "ai-system.yml"), manifest ?? fs.readFileSync(path.join(base, "ai-system.yml"), "utf8"));
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return dir;
}

function resultFor(files, rule, options) {
  const dir = target(files, options);
  try {
    const { json } = validate(dir);
    assert.ok(json, "must produce an envelope");
    return ruleIn(json, rule);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const call = (body) => `export const call = () => client.messages.create({\n${body}\n});\n`;

// --- 1. empty --dir -----------------------------------------------------------------------------

test("finding 1: an empty --dir is a configuration error, not the working directory", () => {
  for (const command of ["validate", "audit"]) {
    // cwd is this repository, which has a valid policy: the wrong answer would be a real envelope.
    const r = cli([command, "--dir=", "--json"]);
    assert.equal(r.code, 2, `${command} --dir= must exit 2; got ${r.code}: ${r.stdout.slice(0, 120)}`);
    assert.equal(r.stdout, "", `${command} --dir= must emit no envelope`);
    assert.match(r.stderr, /--dir|empty/i);
  }
});

test("finding 1: an empty positional target is refused the same way", () => {
  const r = cli(["validate", "", "--json"]);
  assert.equal(r.code, 2, `got ${r.code}: ${r.stdout.slice(0, 120)}`);
  assert.equal(r.stdout, "");
});

test("finding 1 control: a named --dir and a named positional target still resolve", () => {
  assert.ok(validate(fixture("valid-manifest")).json, "--dir=<fixture> must produce an envelope");
  const r = cli(["validate", fixture("valid-manifest"), "--json"]);
  assert.ok(JSON.parse(r.stdout).results.length > 0);
  const implicit = cli(["validate", "--json"]);
  assert.equal(implicit.code === 2, false, "no target at all still means the working directory");
});

// --- 2. test/fixtures must not suppress findings -------------------------------------------------

const FIXTURES_DIR = { "test/fixtures/sample.txt": "unrelated fixture data\n" };

test("finding 2: a violation in a collected file is still a failure beside a root test/fixtures", () => {
  const files = { ...FIXTURES_DIR, "src/config.js": 'export const cfg = { moderation: "off" };\n' };
  const r = ruleIn(validate(target(files)).json, SAFETY);
  assert.equal(r.result, "failed", r.message);
  assert.equal(r.distinction, "failed");
  assert.ok(r.evidence.includes("src/config.js (safety control set off)"));

  const prompt = ruleIn(validate(target({ ...FIXTURES_DIR, "src/agent.js": call(`  system: "${LONG}",`) })).json, VERSIONED);
  assert.equal(prompt.result, "failed", prompt.message);
  assert.equal(prompt.distinction, "failed");
});

test("finding 2 control: a clean walk shortened by test/fixtures is STILL unestablished, never passed", () => {
  for (const rule of [SAFETY, VERSIONED, NO_INLINE]) {
    const r = resultFor({ ...FIXTURES_DIR, "src/ok.js": 'export const cfg = { moderation: "on" };\n' }, rule);
    assert.equal(r.result, "skipped", `${rule}: ${r.message}`);
    assert.equal(r.disposition, "not-evaluated");
    assert.match(r.message, /shortened by a framework exclusion/);
  }
});

test("finding 2 control: without test/fixtures the same violation and the same clean file behave as before", () => {
  assert.equal(resultFor({ "src/config.js": 'export const cfg = { moderation: "off" };\n' }, SAFETY).result, "failed");
  const clean = resultFor({ "src/ok.js": 'export const cfg = { moderation: "on" };\n' }, SAFETY);
  assert.match(clean.message, /No recognised disabled-safety literal/);
});

test("finding 2 control: a violation INSIDE test/fixtures is not read (the exclusion still excludes)", () => {
  const files = { "test/fixtures/bad/config.js": 'export const cfg = { moderation: "off" };\n', "src/ok.js": "export const x = 1;\n" };
  const r = resultFor(files, SAFETY);
  assert.equal(r.result, "skipped");
  assert.match(r.message, /shortened by a framework exclusion/);
});

// --- 3. comments are not inline prompts ----------------------------------------------------------

const NOT_FIRING = [
  ["a // line comment", "src/a.js", call(`  // system: "${LONG}",\n  model: "m",`)],
  ["a /* block comment */", "src/a.js", call(`  /* system: "${LONG}" */\n  model: "m",`)],
  ["a # comment in Python", "src/a.py", `# system = "${LONG}"\nx = 1\n`],
  ["a string that quotes the parameter", "src/a.js", `export const docs = 'system: "${"x".repeat(250)}"';\n`],
  ["a template string that quotes the parameter", "src/a.js", "export const docs = `system: \"" + "x".repeat(250) + "\"`;\n"],
];

for (const [label, file, source] of NOT_FIRING) {
  test(`finding 3 control: ${label} naming an inline system prompt is a mention, not a violation`, () => {
    for (const rule of [VERSIONED, NO_INLINE]) {
      const r = resultFor({ [file]: source }, rule);
      assert.ok(!["failed", "warning"].includes(r.result), `${rule}: ${r.result}: ${r.message}`);
      assert.equal(r.result, "skipped");
    }
  });
}

test("finding 3: the same literal in code fires, so the comment controls are not blind", () => {
  assert.equal(resultFor({ "src/a.js": call(`  system: "${LONG}",`) }, VERSIONED).result, "failed");
  assert.equal(resultFor({ "src/a.py": `client.create(system="${LONG}")\n` }, VERSIONED).result, "failed");
  // A comment beside real code does not hide the code.
  assert.equal(resultFor({ "src/a.js": call(`  // system: "x"\n  system: "${LONG}",`) }, VERSIONED).result, "failed");
});

// --- 4. every instruction parameter is measured --------------------------------------------------

test("finding 4: a short instruction first does not hide a long one later in the same file", () => {
  const source = call(`  system: "${SHORT}",`) + call(`  system: "${LONG}",`);
  const r = resultFor({ "src/a.js": source }, VERSIONED);
  assert.equal(r.result, "failed", r.message);
  assert.ok(r.evidence.some((e) => e.startsWith("src/a.js (")), JSON.stringify(r.evidence));
  // A different parameter name, and a Python keyword argument.
  assert.equal(resultFor({ "src/a.js": call(`  instructions: "${SHORT}",`) + call(`  systemPrompt: "${LONG}",`) }, VERSIONED).result, "failed");
  assert.equal(resultFor({ "src/a.py": `a(system="${SHORT}")\nb(system="${LONG}")\n` }, VERSIONED).result, "failed");
});

test("finding 4: a commented long literal between two short ones is skipped and a later real one still fires", () => {
  const source = call(`  system: "${SHORT}",`) + `// system: "${LONG}"\n` + call(`  system: "${LONG}",`);
  assert.equal(resultFor({ "src/a.js": source }, VERSIONED).result, "failed");
});

test("finding 4 control: only short instructions, however many, are not a violation", () => {
  const source = call(`  system: "${SHORT}",`) + call(`  system: "${SHORT}",`) + call(`  instructions: "${SHORT}",`);
  const r = resultFor({ "src/a.js": source }, VERSIONED);
  assert.equal(r.result, "skipped");
  assert.match(r.message, /No long instruction literal/);
});

test("findings 3 and 4: a literal that is one character under the threshold is not a violation, at the threshold it is", () => {
  const under = call(`  system: "${"x".repeat(199)}",`);
  const at = call(`  system: "${"x".repeat(200)}",`);
  assert.equal(resultFor({ "src/a.js": under }, VERSIONED).result, "skipped");
  assert.equal(resultFor({ "src/a.js": at }, VERSIONED).result, "failed");
});

// --- 5. duplicate keys inside sequence mappings --------------------------------------------------

test("finding 5: a repeated key inside a sequence mapping is refused, as in an ordinary mapping", () => {
  assert.throws(() => parseYaml("items:\n  - id: first\n    id: second\n"), /duplicate key "id"/);
  assert.throws(() => parseYaml("- id: first\n  name: a\n  id: second\n"), /duplicate key "id"/);
  assert.throws(() => parseYaml("- a: 1\n  b:\n    c: 1\n  a: 2\n"), /duplicate key "a"/);
  // The existing guard for ordinary mappings is unchanged.
  assert.throws(() => parseYaml("a: 1\na: 2\n"), /duplicate key "a"/);
});

test("finding 5: the error names the line of the repeated key", () => {
  try {
    parseYaml("- id: first\n  other: x\n  id: second\n");
    assert.fail("must throw");
  } catch (cause) {
    assert.match(String(cause.message), /duplicate key/);
    assert.match(String(cause.message), /3/);
  }
});

test("finding 5 control: the same key in DIFFERENT sequence items, or only mentioned in a value, is fine", () => {
  assert.deepEqual(parseYaml("- id: a\n  n: 1\n- id: b\n  n: 2\n"), [{ id: "a", n: 1 }, { id: "b", n: 2 }]);
  assert.deepEqual(parseYaml('- id: a\n  note: "id: b"\n'), [{ id: "a", note: "id: b" }]);
  assert.deepEqual(parseYaml("- id: a\n  inner:\n    id: nested\n"), [{ id: "a", inner: { id: "nested" } }]);
  assert.deepEqual(parseYaml("- id: a\n  tags:\n    - id: x\n    - id: y\n"), [{ id: "a", tags: [{ id: "x" }, { id: "y" }] }]);
});

test("finding 5: lifecycle.manifest-valid does not pass an ambiguous manifest", () => {
  const manifest = fs.readFileSync(path.join(fixture("valid-manifest"), "ai-system.yml"), "utf8")
    .replace(/(  - id: "claude-sonnet-4-5-20250929"\r?\n)/, '$1    id: "claude-sonnet-latest"\n');
  assert.notEqual(manifest, fs.readFileSync(path.join(fixture("valid-manifest"), "ai-system.yml"), "utf8"), "the fixture edit must apply");
  const r = resultFor({}, "lifecycle.manifest-valid", { manifest });
  assert.notEqual(r.result, "passed", r.message);
  assert.match(r.message + JSON.stringify(r.evidence), /duplicate key/i);
});

test("finding 5 control: the unmodified manifest still passes lifecycle.manifest-valid", () => {
  const manifest = fs.readFileSync(path.join(fixture("valid-manifest"), "ai-system.yml"), "utf8");
  assert.equal(resultFor({}, "lifecycle.manifest-valid", { manifest }).result, "passed");
});

// --- 6. quoted instruction keys (Codex P2 on PR #93, discussion_r4186553274) ---------------------
//
// The code-only view blanks the body of every string literal, which also blanked a QUOTED property
// name: `{"system": "..."}` stopped matching the instruction parameter. Only the key position may be
// preserved; a string that merely mentions the pair, or any string used as a value, stays blanked.

const KEYED_FIRING = [
  ["a double-quoted JS key", "src/a.js", call(`  "system": "${LONG}",`)],
  ["a single-quoted JS key", "src/a.js", call(`  'system': "${LONG}",`)],
  ["a quoted key with a single-quoted value", "src/a.js", call(`  "systemPrompt": '${LONG}',`)],
  ["a quoted key after other properties", "src/a.js", call(`  "model": "m", "max_tokens": 5, "instructions" : "${LONG}"`)],
  ["a Python dict with a double-quoted key", "src/a.py", `client.create(**{"system": "${LONG}"})
`],
  ["a Python dict with a single-quoted key", "src/a.py", `client.create(**{'system': "${LONG}"})
`],
  ["a multi-line Python dict", "src/a.py", `payload = {
    "model": "m",
    "system": "${LONG}",
}
`],
  ["a JSON file", "src/prompt.json", `{"model": "m", "system": "${LONG}"}
`],
  ["a pretty-printed JSON file", "src/prompt.json", `{
  "model": "m",
  "system": "${LONG}"
}
`],
  ["a quoted key in YAML", "src/prompt.yaml", `"system": "${LONG}"\n`],
  ["a quoted key in TOML", "src/prompt.toml", `"system" = "${LONG}"\n`],
];

for (const [label, file, source] of KEYED_FIRING) {
  test(`finding 6: ${label} carrying a long instruction is an inline prompt`, () => {
    for (const rule of [VERSIONED, NO_INLINE]) {
      const r = resultFor({ [file]: source }, rule);
      // The versioned-artifact rule is a requirement and fails; the no-inline rule is advisory and warns.
      assert.equal(r.result, rule === VERSIONED ? "failed" : "warning", `${rule}: ${r.result}: ${r.message}`);
      assert.ok(r.evidence.some((e) => e.startsWith(`${file} (`)), JSON.stringify(r.evidence));
    }
  });
}

const KEYED_NOT_FIRING = [
  ["a short quoted-key instruction", "src/a.js", call(`  "system": "${SHORT}",`)],
  ["a short quoted-key instruction in a JSON file", "src/p.json", `{"system": "${SHORT}"}
`],
  ["a quoted key one character under the threshold", "src/a.js", call(`  "system": "${"x".repeat(199)}",`)],
  ["a // comment quoting the pair", "src/a.js", call(`  // "system": "${LONG}",
  model: "m",`)],
  ["a /* block */ comment quoting the pair", "src/a.js", call(`  /* "system": "${LONG}" */
  model: "m",`)],
  ["a Python # comment quoting the pair", "src/a.py", `# {"system": "${LONG}"}
x = 1
`],
  ["a single-quoted string quoting the pair", "src/a.js", `export const docs = '{"system": "${"x".repeat(250)}"}';
`],
  ["a double-quoted string quoting the pair", "src/a.js", `export const docs = "{\\"system\\": \\"${"x".repeat(250)}\\"}";
`],
  ["a template string quoting the pair", "src/a.js", "export const docs = `{\"system\": \"" + "x".repeat(250) + "\"}`;\n"],
  ["a Python string quoting the pair", "src/a.py", `docs = '{"system": "${"x".repeat(250)}"}'
`],
  ["a key that only ends in the parameter name", "src/a.js", call(`  "x_system": "${LONG}",`)],
  ["a hyphenated key that ends in the parameter name", "src/a.js", call(`  "x-system": "${LONG}",`)],
  ["a key whose text merely contains the pair", "src/a.js", call(`  "note system: '${LONG}'": 1,`)],
  ["a ternary whose branch is the parameter name", "src/a.js", `export const v = cond ? "system" : "${LONG}";
`],
  ["a ternary branch that starts its own line", "src/a.js", `export const v = cond ?\n  "system"\n  : "${LONG}";\n`],
  ["a value that is the word system", "src/a.js", call(`  "role": "system", "text": "${SHORT}"`)],
  ["a JSON file that only mentions the pair in a value", "src/p.json", `{"note": "\\"system\\": \\"${"x".repeat(250)}\\""}
`],
];

for (const [label, file, source] of KEYED_NOT_FIRING) {
  test(`finding 6 control: ${label} is not an inline prompt`, () => {
    for (const rule of [VERSIONED, NO_INLINE]) {
      const r = resultFor({ [file]: source }, rule);
      assert.ok(!["failed", "warning"].includes(r.result), `${rule}: ${r.result}: ${r.message}`);
      assert.equal(r.result, "skipped");
    }
  });
}

test("finding 6: a quoted-key literal after a short one, and after a commented one, is still measured", () => {
  const source = call(`  "system": "${SHORT}",`) + `// "system": "${LONG}"
` + call(`  'system': "${LONG}",`);
  assert.equal(resultFor({ "src/a.js": source }, VERSIONED).result, "failed");
});

// --- 7. quoted keys in YAML sequences, hyphenated names, and the claim boundary (PR #94 evaluation) --
//
// PR #94 kept a quoted key only after `{`, `,` or at the start of a line, so the most common prompt-YAML
// shape, a list of mappings whose first key follows `- `, was still reported `skipped`. The same pass
// found the converse: an UNquoted hyphenated key (`x-system: "..."`) fired although its quoted twin does
// not, because `\b` matches between `-` and `s`.

const SEQUENCE_FIRING = [
  ["a double-quoted key after a sequence marker", "src/p.yaml", `- "system": "${LONG}"\n`],
  ["a single-quoted key after a sequence marker", "src/p.yaml", `- 'system': "${LONG}"\n`],
  ["a quoted key after a sequence marker in a .yml file", "src/p.yml", `- "instructions": '${LONG}'\n`],
  ["a quoted key after a wide sequence marker", "src/p.yaml", `steps:\n  -   "system": "${LONG}"\n`],
  ["a quoted key after nested sequence markers", "src/p.yaml", `- - "system": "${LONG}"\n`],
  ["a spaced quoted key after a sequence marker", "src/p.yaml", `- "system" : "${LONG}"\n`],
  ["a quoted key after a sequence marker with CRLF line endings", "src/p.yaml", `- "system": "${LONG}"\r\n`],
  ["a quoted key after a sequence marker, second line of a mapping", "src/p.yaml", `- role: user\n  "system": "${LONG}"\n`],
  ["an unquoted key after a sequence marker", "src/p.yaml", `- system: "${LONG}"\n`],
  ["an indented quoted key", "src/p.yaml", `a:\n  "system": "${LONG}"\n`],
  ["a spaced quoted key in YAML", "src/p.yaml", `"system" : "${LONG}"\n`],
  ["a JSON key with a newline before the colon", "src/p.json", `{"system"\n: "${LONG}"}\n`],
  ["a Python keyword argument", "src/a.py", `client.create(model="m", system="${LONG}")\n`],
  ["a Python keyword argument with spaces and a newline", "src/a.py", `client.create(\n  model="m",\n  system = "${LONG}",\n)\n`],
  ["a shell flag that is exactly --system", "src/a.sh", `llm --system="${LONG}" "hi"\n`],
];

for (const [label, file, source] of SEQUENCE_FIRING) {
  test(`finding 7: ${label} carrying a long instruction is an inline prompt`, () => {
    for (const rule of [VERSIONED, NO_INLINE]) {
      const r = resultFor({ [file]: source }, rule);
      assert.equal(r.result, rule === VERSIONED ? "failed" : "warning", `${rule}: ${r.result}: ${r.message}`);
    }
  });
}

const SEQUENCE_NOT_FIRING = [
  ["a quoted hyphenated key after a sequence marker", "src/p.yaml", `- "x-system": "${LONG}"\n`],
  ["an unquoted hyphenated key after a sequence marker", "src/p.yaml", `- x-system: "${LONG}"\n`],
  ["an unquoted hyphenated key in YAML", "src/p.yaml", `x-system: "${LONG}"\n`],
  ["an unquoted hyphenated name in a JS ternary", "src/a.js", `export const v = cond ? a-system : "${LONG}";\n`],
  ["a sequence-marker quoted key in a file that is not YAML", "src/a.py", `- "system": "${LONG}"\n`],
  ["a sequence item whose value is the word system", "src/p.yaml", `- "role": "system"\n- text: "${SHORT}"\n`],
  ["a sequence item that only mentions the pair", "src/p.yaml", `- "note system: '${LONG}'"\n`],
  ["a bare quoted sequence item", "src/p.yaml", `- "system"\n- "${LONG}"\n`],
  ["a short instruction after a sequence marker", "src/p.yaml", `- "system": "${SHORT}"\n`],
  ["a sequence marker in a YAML comment", "src/p.yaml", `# - "system": "${LONG}"\nx: 1\n`],
];

for (const [label, file, source] of SEQUENCE_NOT_FIRING) {
  test(`finding 7 control: ${label} is not an inline prompt`, () => {
    for (const rule of [VERSIONED, NO_INLINE]) {
      const r = resultFor({ [file]: source }, rule);
      assert.ok(!["failed", "warning"].includes(r.result), `${rule}: ${r.result}: ${r.message}`);
      assert.equal(r.result, "skipped");
    }
  });
}

// The claim boundary, pinned so that widening it is a deliberate change and not an accident. Each shape
// is a long literal near the word `system` that the detector does NOT claim: its grammar is a listed
// parameter NAME, then `:` or `=`, then a quoted literal (Standard 21, "The detector for R1 and R2 finds
// one shape of one problem"). They report `skipped`, never `passed`.
// The message-role shapes (`{"role": "system", "content": "..."}` and Gemini `systemInstruction` with `parts`)
// were pinned here until they became their own detection shape; their firing cases and the controls that
// bound them are in message-role-shapes.test.mjs.
const OUTSIDE_THE_CLAIM = [
  ["a template-literal key (not valid JavaScript)", "src/a.js", call("  `system`: \"" + LONG + "\",")],
  ["a computed key", "src/a.js", call(`  [\`system\`]: "${LONG}",`)],
  ["a hyphenated quoted key that is not a listed name", "src/a.js", call(`  "system-prompt": "${LONG}",`)],
  ["a Python tuple pair", "src/a.py", `dict([("system", "${LONG}")])\n`],
  ["a LangChain role tuple", "src/a.py", `ChatPromptTemplate.from_messages([("system", "${LONG}")])\n`],
  ["a YAML block scalar", "src/p.yaml", `system: |\n  ${LONG}\n`],
];

for (const [label, file, source] of OUTSIDE_THE_CLAIM) {
  test(`finding 7 claim boundary: ${label} is not claimed and reports skipped`, () => {
    for (const rule of [VERSIONED, NO_INLINE]) {
      assert.equal(resultFor({ [file]: source }, rule).result, "skipped", rule);
    }
  });
}

test("the working directory is this repository (guards finding 1's setup)", () => {
  assert.ok(fs.existsSync(path.join(REPO, "ai-policy.yml")));
});
