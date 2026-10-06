// Controls for the two message-shaped inline-prompt shapes of Standard 21 (R1, R2):
//
//   message role shape   a message object whose `role` is the quoted word `system` and whose `content`
//                        is a quoted literal of 200+ characters, in either key order
//                        (`{"role": "system", "content": "..."}`, and the YAML list-of-messages form);
//   systemInstruction    the Gemini object form `systemInstruction: { parts: [{ text: "..." }] }`,
//   parts shape          also spelled `system_instruction`.
//
// Both are a DISTINCT detection shape from the parameter shape (a listed name, `:` or `=`, then a quoted
// literal), which stays as it was. Until this change these two were pinned as `skipped` claim-boundary
// shapes in review-findings.test.mjs (PR #94 evaluation, PR #95). The evaluation that left them
// AMBIGUOUS is why each firing shape below has a twin that must NOT fire: a role used as a value, a
// short content, a role that is not `system`, an object that is not a message, and text that is not
// inside the `parts` of a `systemInstruction`.
//
// Targets are built in a temp directory exactly as review-findings.test.mjs does.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validate, fixture, resultFor as ruleIn } from "./helpers.mjs";

const VERSIONED = "promptsec.prompt-is-versioned-artifact";
const NO_INLINE = "promptsec.no-inline-system-prompt";
const LONG = "You are a support triage assistant. ".repeat(8); // 288 characters
const SHORT = "Be brief.";
const at = (n) => "x".repeat(n);

function target(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-role-"));
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

function resultFor(files, rule) {
  const dir = target(files);
  try {
    const { json } = validate(dir);
    assert.ok(json, "must produce an envelope");
    return ruleIn(json, rule);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const call = (body) => `export const call = () => client.chat.completions.create({\n${body}\n});\n`;

const ROLE_FIRING = [
  ["role before content, double-quoted keys", "src/a.js", call(`  messages: [{ "role": "system", "content": "${LONG}" }],`)],
  ["role before content, bare keys", "src/a.js", call(`  messages: [{ role: "system", content: "${LONG}" }],`)],
  ["content before role, bare keys", "src/a.js", call(`  messages: [{ content: "${LONG}", role: "system" }],`)],
  ["content before role, quoted keys", "src/a.js", call(`  messages: [{ "content": "${LONG}", "role": "system" }],`)],
  ["single-quoted keys and values", "src/a.js", call(`  messages: [{ 'role': 'system', 'content': '${LONG}' }],`)],
  ["a TypeScript const assertion on the role", "src/a.ts", call(`  messages: [{ role: "system" as const, content: "${LONG}" }],`)],
  ["another key between role and content", "src/a.js", call(`  messages: [{ role: "system", name: "s", content: "${LONG}" }],`)],
  ["a nested object before a top-level content", "src/a.js", call(`  messages: [{ role: "system", meta: { content: "${SHORT}" }, content: "${LONG}" }],`)],
  ["the system message after a short user message", "src/a.js", call(`  messages: [{ role: "user", content: "${SHORT}" }, { role: "system", content: "${LONG}" }],`)],
  ["a multi-line object", "src/a.js", call(`  messages: [\n    {\n      role: "system",\n      content: "${LONG}",\n    },\n  ],`)],
  ["an escaped quote inside the content", "src/a.js", call(`  messages: [{ role: "system", content: "${"a\\\"b".repeat(80)}" }],`)],
  ["a JSON array, role first", "src/m.json", `[{"role": "system", "content": "${LONG}"}]\n`],
  ["a JSON array, content first", "src/m.json", `[{"content": "${LONG}", "role": "system"}]\n`],
  ["a multi-line JSON object", "src/m.json", `{\n  "messages": [\n    {\n      "role": "system",\n      "content": "${LONG}"\n    }\n  ]\n}\n`],
  ["a Python dict, double-quoted", "src/a.py", `client.chat.completions.create(messages=[{"role": "system", "content": "${LONG}"}])\n`],
  ["a Python dict, single-quoted", "src/a.py", `client.chat.completions.create(messages=[{'role': 'system', 'content': '${LONG}'}])\n`],
  ["a Python dict, content first", "src/a.py", `messages = [{"content": "${LONG}", "role": "system"}]\n`],
  ["a multi-line Python dict", "src/a.py", `messages = [\n    {\n        "role": "system",\n        "content": "${LONG}",\n    },\n]\n`],
  ["a YAML list of messages, role first", "src/p.yaml", `messages:\n  - role: system\n    content: "${LONG}"\n`],
  ["a YAML list of messages, content first", "src/p.yaml", `messages:\n  - content: "${LONG}"\n    role: system\n`],
  ["a YAML list with quoted keys and values", "src/p.yaml", `- "role": "system"\n  "content": '${LONG}'\n`],
  ["a YAML list, system after a user message", "src/p.yml", `- role: user\n  content: "${SHORT}"\n- role: system\n  content: "${LONG}"\n`],
  ["a YAML list with CRLF line endings", "src/p.yaml", `- role: system\r\n  content: "${LONG}"\r\n`],
  ["a YAML list with another key between", "src/p.yaml", `- role: system\n  name: s\n  content: "${LONG}"\n`],
  ["a YAML flow mapping in a list", "src/p.yaml", `- {role: system, content: "${LONG}"}\n`],
  ["a TypeScript const assertion after content-first order", "src/a.ts", call(`  messages: [{ content: "${LONG}", role: "system" as const }],`)],
  ["a role followed by a newline and the closing brace", "src/a.js", call(`  messages: [{ content: "${LONG}", role: "system"\n  }],`)],
  ["a comment between the role literal and the comma", "src/a.js", call(`  messages: [{ role: "system" /* the role */, content: "${LONG}" }],`)],
  ["a YAML quoted role with a trailing comment", "src/p.yaml", `- role: "system" # the role\n  content: "${LONG}"\n`],
  ["a Python dict whose role literal ends the entry", "src/a.py", `messages = [{"role": "system"  # x\n, "content": "${LONG}"}]\n`],
  ["exactly the threshold", "src/a.js", call(`  messages: [{ role: "system", content: "${at(200)}" }],`)],
];

for (const [label, file, source] of ROLE_FIRING) {
  test(`message role shape: ${label} carrying a long content is an inline prompt`, () => {
    for (const rule of [VERSIONED, NO_INLINE]) {
      const r = resultFor({ [file]: source }, rule);
      assert.equal(r.result, rule === VERSIONED ? "failed" : "warning", `${rule}: ${r.result}: ${r.message}`);
      assert.ok(r.evidence.some((e) => e.startsWith(`${file} (`) && e.includes("message role shape")), JSON.stringify(r.evidence));
    }
  });
}

const GEMINI_FIRING = [
  ["bare keys", "src/a.js", call(`  systemInstruction: { parts: [{ text: "${LONG}" }] },`)],
  ["quoted keys in JSON", "src/g.json", `{"systemInstruction": {"parts": [{"text": "${LONG}"}]}}\n`],
  ["the REST snake-case spelling with parts as an object", "src/g.json", `{"system_instruction": {"parts": {"text": "${LONG}"}}}\n`],
  ["a Python dict assigned with =", "src/a.py", `model = Model(system_instruction={"parts": [{"text": "${LONG}"}]})\n`],
  ["a Python dict inside a config dict", "src/a.py", `config = {"system_instruction": {"parts": [{"text": "${LONG}"}]}}\n`],
  ["a multi-line object", "src/a.js", call(`  systemInstruction: {\n    parts: [\n      { text: "${LONG}" },\n    ],\n  },`)],
  ["the second of two parts", "src/a.js", call(`  systemInstruction: { parts: [{ text: "${SHORT}" }, { text: "${LONG}" }] },`)],
  ["a YAML flow mapping", "src/p.yaml", `systemInstruction: {parts: [{text: "${LONG}"}]}\n`],
  ["a key after a ternary value in the same object", "src/a.js", call(`  k: ok ? 1 : 2, systemInstruction: { parts: [{ text: "${LONG}" }] },`)],
  ["a quoted key after a ternary value", "src/a.js", call(`  k: ok ? 1 : 2, "systemInstruction": { parts: [{ text: "${LONG}" }] },`)],
  ["a ternary that holds a real systemInstruction object", "src/a.js", call(`  config: ok ? { systemInstruction: { parts: [{ text: "${LONG}" }] } } : {},`)],
  ["a JavaScript assignment", "src/a.js", `const systemInstruction = { parts: [{ text: "${LONG}" }] };\n`],
  ["exactly the threshold", "src/a.js", call(`  systemInstruction: { parts: [{ text: "${at(200)}" }] },`)],
];

for (const [label, file, source] of GEMINI_FIRING) {
  test(`systemInstruction parts shape: ${label} carrying a long text is an inline prompt`, () => {
    for (const rule of [VERSIONED, NO_INLINE]) {
      const r = resultFor({ [file]: source }, rule);
      assert.equal(r.result, rule === VERSIONED ? "failed" : "warning", `${rule}: ${r.result}: ${r.message}`);
      assert.ok(r.evidence.some((e) => e.startsWith(`${file} (`) && e.includes("systemInstruction parts shape")), JSON.stringify(r.evidence));
    }
  });
}

const NOT_FIRING = [
  // the role as a VALUE somewhere else, and a role that is not `system`
  ["a role assigned to a variable, with an unrelated long string after it", "src/a.js", `export const role = "system";\nexport const note = "${LONG}";\n`],
  ["a role variable inside a function that also holds an object with content", "src/a.js", `export function f() {\n  const role = "system";\n  return { content: "${LONG}" };\n}\n`],
  ["a Python role variable followed by a long string", "src/a.py", `role = "system"\nnote = "${LONG}"\n`],
  ["a user message", "src/a.js", call(`  messages: [{ role: "user", content: "${LONG}" }],`)],
  ["an assistant message", "src/a.js", call(`  messages: [{ role: "assistant", content: "${LONG}" }],`)],
  ["a tool message", "src/a.js", call(`  messages: [{ role: "tool", content: "${LONG}" }],`)],
  ["content before a role that is not system", "src/a.js", call(`  messages: [{ content: "${LONG}", role: "user" }],`)],
  ["content before a role that is not system, JSON", "src/m.json", `[{"content": "${LONG}", "role": "assistant"}]\n`],
  ["a YAML user message", "src/p.yaml", `- role: user\n  content: "${LONG}"\n`],
  ["a YAML message whose role merely starts with system", "src/p.yaml", `- role: system-admin\n  content: "${LONG}"\n`],
  ["a quoted role that merely starts with system", "src/a.js", call(`  messages: [{ role: "systems", content: "${LONG}" }],`)],
  // Codex review of PR #97: the role literal must END the value; a composed value is not the word `system`
  ["a role composed by concatenating a literal (Codex review of PR #97)", "src/a.js", call(`  messages: [{ role: "system" + "-admin", content: "${LONG}" }],`)],
  ["a role composed with content first", "src/a.js", call(`  messages: [{ content: "${LONG}", role: "system" + "-admin" }],`)],
  ["a role concatenated with a variable", "src/a.js", call(`  messages: [{ role: "system" + suffix, content: "${LONG}" }],`)],
  ["a role concatenated across a line break", "src/a.js", call(`  messages: [{ role: "system"\n    + "-admin", content: "${LONG}" }],`)],
  ["a role with a method call on the literal", "src/a.js", call(`  messages: [{ role: "system".toUpperCase(), content: "${LONG}" }],`)],
  ["a role with an index on the literal", "src/a.js", call(`  messages: [{ role: "system"[0], content: "${LONG}" }],`)],
  ["a role that is a logical expression", "src/a.js", call(`  messages: [{ role: "system" || other, content: "${LONG}" }],`)],
  ["a role that is a nullish expression", "src/a.js", call(`  messages: [{ role: "system" ?? other, content: "${LONG}" }],`)],
  ["a role that is a ternary condition", "src/a.js", call(`  messages: [{ role: "system" ? a : b, content: "${LONG}" }],`)],
  ["a role that is a TypeScript as-expression to another type", "src/a.ts", call(`  messages: [{ role: "system" as Role, content: "${LONG}" }],`)],
  ["a role composed in a single-quoted dict", "src/a.py", `messages = [{'role': 'system' + '-admin', 'content': '${LONG}'}]\n`],
  ["a Python conditional role", "src/a.py", `messages = [{"role": "system" if admin else "user", "content": "${LONG}"}]\n`],
  ["a YAML flow role followed by trailing text", "src/p.yaml", `- {role: "system" x, content: "${LONG}"}\n`],
  // short content, at and below the boundary
  ["content one character under the threshold", "src/a.js", call(`  messages: [{ role: "system", content: "${at(199)}" }],`)],
  ["short content, content first", "src/a.js", call(`  messages: [{ content: "${SHORT}", role: "system" }],`)],
  ["short YAML content", "src/p.yaml", `- role: system\n  content: "${SHORT}"\n`],
  // a role in an object that is not a message
  ["an object with a role and no content", "src/a.js", call(`  user: { role: "system", description: "${LONG}" },`)],
  ["an RBAC object with permissions and a long unrelated field", "src/a.js", call(`  grant: { "role": "system", "permissions": ["read"], "note": "${LONG}" },`)],
  ["an RBAC object, JSON", "src/rbac.json", `{"role": "system", "permissions": ["read"], "description": "${LONG}"}\n`],
  ["a content that belongs to a nested object", "src/a.js", call(`  m: { role: "system", meta: { content: "${LONG}" } },`)],
  ["a content that belongs to the next object", "src/a.js", call(`  m: [{ role: "system", name: "x" }, { content: "${LONG}" }],`)],
  ["a content in the previous object", "src/a.js", call(`  m: [{ content: "${LONG}" }, { role: "system", name: "x" }],`)],
  ["a YAML content in the next list item", "src/p.yaml", `- role: system\n- content: "${LONG}"\n`],
  ["a YAML content in a nested mapping", "src/p.yaml", `- role: system\n  meta:\n    content: "${LONG}"\n`],
  ["a YAML content in the previous list item", "src/p.yaml", `- content: "${LONG}"\n- role: system\n`],
  // scope: the content must belong to the mapping that holds the role
  ["a content in a later object after a gap key", "src/a.js", call(`  m: [{ role: "system", name: "x" }, { name: "y", content: "${LONG}" }],`)],
  ["a role inside a call's arguments rather than an object", "src/a.js", call(`  m: f(a, role: "system", content: "${LONG}"),`)],
  ["a role in a list rather than an object", "src/a.js", call(`  m: [1, role: "system", content: "${LONG}"],`)],
  ["a quoted-system role under a Python list marker, which is not YAML", "src/a.py", `- role: "system"
  content: "${LONG}"
`],
  ["a YAML content in a later item reached after a shallower line", "src/p.yaml", `- role: system
- name: x
  content: "${LONG}"
`],
  ["a YAML content in an earlier item above the role's own item", "src/p.yaml", `- content: "${LONG}"
- name: a
  role: system
`],
  ["a YAML content under a different parent below", "src/p.yaml", `a:
  role: system
b:
  content: "${LONG}"
`],
  ["a YAML content under a different parent above", "src/p.yaml", `a:
  content: "${LONG}"
b:
  role: system
`],
  ["a YAML role and content in different documents, content after", "src/p.yaml", `role: system
---
content: "${LONG}"
`],
  ["a YAML role and content in different documents, content before", "src/p.yaml", `content: "${LONG}"
---
role: system
`],
  ["a systemInstruction whose parts is nested under another key", "src/a.js", call(`  systemInstruction: { other: { parts: [{ text: "${LONG}" }] } },`)],
  // Codex review of PR #97: a ternary operand is not a mapping key
  ["a systemInstruction identifier as a ternary operand (Codex review of PR #97)", "src/a.js", `const x = ok ? systemInstruction : { parts: [{ text: "${LONG}" }] };\n`],
  ["a ternary operand inside a call", "src/a.js", `call(ok ? systemInstruction : { parts: [{ text: "${LONG}" }] });\n`],
  ["a snake-case ternary operand", "src/a.js", `const x = ok ? system_instruction : { parts: [{ text: "${LONG}" }] };\n`],
  ["a quoted ternary operand", "src/a.js", `const x = ok ? "systemInstruction" : { parts: [{ text: "${LONG}" }] };\n`],
  ["a ternary operand after an operator", "src/a.js", `const x = ok ? !systemInstruction : { parts: [{ text: "${LONG}" }] };\n`],
  ["a ternary operand on its own line", "src/a.js", `const x = ok\n  ? systemInstruction\n  : { parts: [{ text: "${LONG}" }] };\n`],
  ["a YAML plain scalar that contains the ternary text", "src/p.yaml", `note: ok ? systemInstruction : {parts: [{text: "${LONG}"}]}\n`],
  ["a labelled block", "src/a.js", `systemInstruction: { parts: [{ text: "${LONG}" }] }\n`],
  // The same ternary-operand class in the parameter shape (found re-checking the neighbouring grammar)
  ["a parameter name as a ternary operand", "src/a.js", `const x = ok ? system : "${LONG}";\n`],
  ["an instructions name as a ternary operand", "src/a.js", `const x = ok ? instructions : "${LONG}";\n`],
  ["a systemInstruction name as a ternary operand with a literal alternative", "src/a.js", `const x = ok ? systemInstruction : "${LONG}";\n`],
  ["a parameter name as a ternary operand on its own line", "src/a.js", `const x = ok\n  ? system_prompt\n  : "${LONG}";\n`],
  ["a systemInstruction text in a ternary inside parts", "src/a.js", call(`  systemInstruction: { parts: [{ k: cond ? text : "${LONG}" }] },`)],
  ["a prefixed systemInstruction name", "src/a.js", call(`  my_systemInstruction: { parts: [{ text: "${LONG}" }] },`)],
  ["a prefixed system_instruction name in Python", "src/a.py", `m = Model(my_system_instruction={"parts": [{"text": "${LONG}"}]})
`],
  ["a hyphenated systemInstruction name in YAML", "src/p.yaml", `x-systemInstruction: {parts: [{text: "${LONG}"}]}
`],
  // use and mention
  ["a JS comment quoting the message", "src/a.js", `// { "role": "system", "content": "${LONG}" }\nexport const x = 1;\n`],
  ["a block comment quoting the message", "src/a.js", `/* { role: "system", content: "${LONG}" } */\nexport const x = 1;\n`],
  ["a Python comment quoting the message", "src/a.py", `# {"role": "system", "content": "${LONG}"}\nx = 1\n`],
  ["a YAML comment quoting the message", "src/p.yaml", `# - role: system\n#   content: "${LONG}"\nx: 1\n`],
  ["a single-quoted string quoting the message", "src/a.js", `export const docs = '{"role": "system", "content": "${at(250)}"}';\n`],
  ["a template string quoting the message", "src/a.js", "export const docs = `{\"role\": \"system\", \"content\": \"" + at(250) + "\"}`;\n"],
  ["a Python string quoting the message", "src/a.py", `docs = '{"role": "system", "content": "${at(250)}"}'\n`],
  // keys that only look like the pair
  ["a hyphenated role key", "src/a.js", call(`  m: { "x-role": "system", content: "${LONG}" },`)],
  ["a prefixed role key", "src/a.js", call(`  m: { user_role: "system", content: "${LONG}" },`)],
  ["a prefixed content key", "src/a.js", call(`  m: { role: "system", user_content: "${LONG}" },`)],
  ["a role in a ternary branch", "src/a.js", call(`  m: { k: cond ? role : "system", content: "${LONG}" },`)],
  ["a YAML-looking list marker in a file that is not YAML", "src/a.py", `- role: system
  content: "${LONG}"
`],
  ["a role in a ternary consequent", "src/a.js", call(`  m: { k: x ? role : "system" },\n  note: { content: "${LONG}" },`)],
  // systemInstruction controls
  ["a systemInstruction with no parts", "src/a.js", call(`  systemInstruction: { text: "${LONG}" },`)],
  ["a systemInstruction with an unrelated nested text", "src/a.js", call(`  systemInstruction: { other: { text: "${LONG}" } },`)],
  ["text beside parts rather than inside it", "src/a.js", call(`  systemInstruction: { parts: [{ inline: 1 }], extra: { text: "${LONG}" } },`)],
  ["a short systemInstruction text", "src/a.js", call(`  systemInstruction: { parts: [{ text: "${SHORT}" }] },`)],
  ["a systemInstruction text one character under the threshold", "src/a.js", call(`  systemInstruction: { parts: [{ text: "${at(199)}" }] },`)],
  ["a user turn's parts", "src/a.js", call(`  contents: [{ role: "user", parts: [{ text: "${LONG}" }] }],`)],
  ["a similarly named key", "src/a.js", call(`  systemInstructions: { parts: [{ text: "${LONG}" }] },`)],
  ["a hyphenated systemInstruction key", "src/a.js", call(`  "x-systemInstruction": { parts: [{ text: "${LONG}" }] },`)],
  ["a systemInstruction in a comment", "src/a.js", `// systemInstruction: { parts: [{ text: "${LONG}" }] }\nexport const x = 1;\n`],
  ["a systemInstruction quoted in a string", "src/a.js", `export const docs = 'systemInstruction: { parts: [{ text: "${at(250)}" }] }';\n`],
  ["a systemInstruction whose text is a variable", "src/a.js", call(`  systemInstruction: { parts: [{ text: PROMPT }] },`)],
];

for (const [label, file, source] of NOT_FIRING) {
  test(`message shapes control: ${label} is not an inline prompt`, () => {
    for (const rule of [VERSIONED, NO_INLINE]) {
      const r = resultFor({ [file]: source }, rule);
      assert.ok(!["failed", "warning"].includes(r.result), `${rule}: ${r.result}: ${r.message}`);
      assert.equal(r.result, "skipped");
    }
  });
}

// Still outside the claim after this change, pinned so that widening it later is deliberate. Each is a
// long literal at a system role or system instruction that the two shapes do NOT follow.
const STILL_OUTSIDE = [
  ["a template-literal content", "src/a.js", call("  messages: [{ role: \"system\", content: `" + LONG + "` }],")],
  ["a role held in a variable", "src/a.js", call(`  messages: [{ role: SYSTEM, content: "${LONG}" }],`)],
  ["a bare system word in JavaScript, which is a variable", "src/a.js", call(`  messages: [{ role: system, content: "${LONG}" }],`)],
  ["the developer role, which newer OpenAI models use as the system role", "src/a.js", call(`  messages: [{ role: "developer", content: "${LONG}" }],`)],
  ["a content that is an array of typed parts", "src/a.js", call(`  messages: [{ role: "system", content: [{ type: "text", text: "${LONG}" }] }],`)],
  ["a content built by concatenation from a variable", "src/a.js", call(`  messages: [{ role: "system", content: PREFIX + "${LONG}" }],`)],
  ["keyword arguments in a constructor", "src/a.py", `SystemMessage = ChatMessage(role="system", content="${LONG}")\n`],
  ["a dict built by dict()", "src/a.py", `m = dict(role="system", content="${LONG}")\n`],
  ["a TOML array of tables", "src/a.toml", `[[messages]]\nrole = "system"\ncontent = "${LONG}"\n`],
  ["a YAML block scalar content", "src/p.yaml", `- role: system\n  content: |\n    ${LONG}\n`],
  ["a block-style YAML systemInstruction", "src/p.yaml", `systemInstruction:\n  parts:\n    - text: "${LONG}"\n`],
  ["a Python Part call", "src/a.py", `config = Config(system_instruction=Content(parts=[Part(text="${LONG}")]))\n`],
  ["a plain string system_instruction", "src/a.py", `config = Config(system_instruction="${LONG}")\n`],
  ["a systemInstruction whose parts is a variable", "src/a.js", call(`  systemInstruction: { parts: PARTS, note: { text: "${LONG}" } },`)],
];

for (const [label, file, source] of STILL_OUTSIDE) {
  test(`message shapes claim boundary: ${label} is not claimed and reports skipped`, () => {
    for (const rule of [VERSIONED, NO_INLINE]) {
      assert.equal(resultFor({ [file]: source }, rule).result, "skipped", rule);
    }
  });
}

test("the parameter shape keeps its evidence spelling, and a file with both shapes reports both", () => {
  const param = call(`  system: "${LONG}",`);
  const rp = resultFor({ "src/a.js": param }, VERSIONED);
  assert.deepEqual(rp.evidence, [`src/a.js (${LONG.length} chars)`]);

  const both = param + call(`  messages: [{ role: "system", content: "${LONG}" }],`) + call(`  systemInstruction: { parts: [{ text: "${LONG}" }] },`);
  const rb = resultFor({ "src/a.js": both }, VERSIONED);
  assert.deepEqual(rb.evidence, [
    `src/a.js (${LONG.length} chars)`,
    `src/a.js (${LONG.length} chars, message role shape)`,
    `src/a.js (${LONG.length} chars, systemInstruction parts shape)`,
  ]);
});

test("the reported length is the content's own length, and the longest of several is reported", () => {
  const source = call(`  messages: [{ role: "system", content: "${at(210)}" }, { role: "system", content: "${at(260)}" }],`);
  assert.deepEqual(resultFor({ "src/a.js": source }, VERSIONED).evidence, ["src/a.js (260 chars, message role shape)"]);
});

test("a short message earlier in a file does not describe a long one later", () => {
  const source = call(`  messages: [{ role: "system", content: "${SHORT}" }],`) + `// { role: "system", content: "${LONG}" }\n` + call(`  messages: [{ role: "system", content: "${LONG}" }],`);
  assert.equal(resultFor({ "src/a.js": source }, VERSIONED).result, "failed");
});

// The parameter shape must keep firing where the name really is a key, next to the ternary cases above.
const PARAM_STILL_FIRING = [
  ["a key after a ternary value in the same object", "src/a.js", call(`  k: ok ? 1 : 2, system: "${LONG}",`)],
  ["a key inside an object held by a ternary branch", "src/a.js", `const x = ok ? { system: "${LONG}" } : {};\n`],
  ["a quoted key after a ternary value", "src/a.js", call(`  k: ok ? 1 : 2, "system": "${LONG}",`)],
  ["an assignment after a ternary statement", "src/a.js", `const k = ok ? 1 : 2;\nconst system = "${LONG}";\n`],
];

for (const [label, file, source] of PARAM_STILL_FIRING) {
  test(`parameter shape beside a ternary: ${label} still reports`, () => {
    const r = resultFor({ [file]: source }, VERSIONED);
    assert.equal(r.result, "failed", `${r.result}: ${r.message}`);
    assert.deepEqual(r.evidence, [`${file} (${LONG.length} chars)`]);
  });
}

// Codex review of PR #98, two P2 findings. Both are YAML spellings of a key that the ternary guard and the
// entry-opening check of that revision discarded, so a long literal the parent revision detected reported
// `skipped` instead of `failed`.
const YAML_KEY_FIRING = [
  // P2 scripts/standards.mjs:719, "Preserve YAML explicit mapping keys": `?` at the start of a YAML line is
  // the explicit-key indicator, not a ternary's `?`.
  ["a YAML explicit mapping key", "src/p.yaml", `? system\n: "${LONG}"\n`, ""],
  ["a YAML explicit key inside a sequence item", "src/p.yaml", `- ? system_prompt\n  : "${LONG}"\n`, ""],
  ["a YAML explicit key, indented under a parent", "src/p.yml", `llm:\n  ? instructions\n  : '${LONG}'\n`, ""],
  ["a YAML explicit key in a flow mapping", "src/p.yaml", `{? system : "${LONG}"}\n`, ""],
  ["a YAML explicit key separated by a tab", "src/p.yaml", `?	system
: "${LONG}"
`, ""],
  ["a YAML explicit key whose name is on the next line", "src/p.yaml", `?
  system
: "${LONG}"
`, ""],
  ["a YAML explicit key after a comma in a flow mapping", "src/p.yaml", `{a: 1, ? system : "${LONG}"}\n`, ""],
];
const YAML_SEQ_FIRING = [
  // P2 scripts/standards.mjs:653, "Accept YAML flow-sequence mapping entries": an implicit single-pair
  // mapping may be the first item of a flow sequence, so `[` opens an entry in YAML.
  ["a systemInstruction as the first entry of a YAML flow sequence", "src/p.yaml", `config: [systemInstruction: {parts: [{text: "${LONG}"}]}]\n`],
  ["a snake-case system_instruction in a YAML flow sequence", "src/p.yml", `config: [system_instruction: {parts: [{text: "${LONG}"}]}]\n`],
  ["a systemInstruction after another entry of a YAML flow sequence", "src/p.yaml", `config: [a: 1, systemInstruction: {parts: [{text: "${LONG}"}]}]\n`],
  ["a text entry first in the parts flow sequence", "src/p.yaml", `systemInstruction: {parts: [text: "${LONG}"]}\n`],
];
const YAML_KEY_NOT_FIRING = [
  ["a YAML plain scalar with a ternary mark", "src/p.yaml", `note: ok ? system : "${LONG}"\n`],
  ["a YAML explicit key whose literal is short", "src/p.yaml", `? system\n: "${SHORT}"\n`],
  ["a JS ternary on its own lines", "src/a.js", `const x = ok\n  ? system\n  : "${LONG}";\n`],
  ["a JS ternary after a statement start", "src/a.js", `cond\n? system : "${LONG}";\n`],
  // Codex review of PR #103: a block or flow explicit-key indicator needs separation, so `?system` is a plain key
  ["a YAML plain key that starts with a question mark", "src/p.yaml", `?system: "${LONG}"
`],
  ["a YAML plain key with a question mark after a sequence marker", "src/p.yaml", `- ?system_prompt: "${LONG}"
`],
  ["a YAML plain key with a question mark in a flow mapping", "src/p.yaml", `{?system: "${LONG}"}
`],
  ["a YAML plain key with a question mark after a comma", "src/p.yaml", `{a: 1, ?instructions: "${LONG}"}
`],
  ["a JS array does not open an entry", "src/a.js", `const x = [systemInstruction: { parts: [{ text: "${LONG}" }] }];\n`],
  ["a YAML flow sequence whose entry is not a systemInstruction", "src/p.yaml", `config: [other: {parts: [{text: "${LONG}"}]}]\n`],
];

for (const [label, file, source] of YAML_KEY_FIRING) {
  test(`explicit YAML key: ${label} reports`, () => {
    for (const rule of [VERSIONED, NO_INLINE]) {
      const r = resultFor({ [file]: source }, rule);
      assert.equal(r.result, rule === VERSIONED ? "failed" : "warning", `${rule} ${r.result}: ${r.message}`);
      assert.ok(r.evidence.some((e) => e.startsWith(`${file} (${LONG.length} chars`)), JSON.stringify(r.evidence));
    }
  });
}
for (const [label, file, source] of YAML_SEQ_FIRING) {
  test(`YAML flow sequence entry: ${label} reports`, () => {
    for (const rule of [VERSIONED, NO_INLINE]) {
      const r = resultFor({ [file]: source }, rule);
      assert.equal(r.result, rule === VERSIONED ? "failed" : "warning", `${rule} ${r.result}: ${r.message}`);
      assert.deepEqual(r.evidence, [`${file} (${LONG.length} chars, systemInstruction parts shape)`]);
    }
  });
}
for (const [label, file, source] of YAML_KEY_NOT_FIRING) {
  test(`YAML key forms: ${label} does not report`, () => {
    const r = resultFor({ [file]: source }, VERSIONED);
    assert.notEqual(r.result, "failed", `${r.result}: ${JSON.stringify(r.evidence)}`);
  });
}
