// misuse.safety-controls-not-disabled: the result must follow the setting, not the file's layout.
//
// The detector's off-pattern looks for a recognised key, `:` or `=`, then `false` or a quoted `none`
// or `off`. It used to search the code partition followed by the string partition, which moved every
// quoted value to the end of the searched text. A quoted `off` then matched only when the key and
// separator happened to be the last code in the file and the value its first literal: YAML
// `moderation: 'off'` failed as the only line and passed once any line followed it, and a JavaScript
// object or Python keyword argument never failed at all. The detector now searches the file with
// comments blanked in place, so key, separator and value stay adjacent as written.
//
// Keeping them adjacent exposed two shapes that name a quoted `off` beside a key without assigning
// it: a union type member (`moderation: "off" | "on"`) and a ternary consequent
// (`strict ? moderation : "off"`). The quoted form is guarded against both, and each guard sits
// beside a case of the same shape that does assign `off` and must still fail.
//
// Every non-firing fixture has a firing fixture of the same shape, so a detector that fired on the
// key, on layout, on a type, or on a mention would fail a control, and a guard that swallowed a real
// assignment would fail its pair. Inputs outside what the detector recognises are deliberately NOT
// asserted here: a test that such an input reports `passed` would pin a blind spot as intended
// behaviour.

import { test } from "node:test";
import assert from "node:assert/strict";
import { splitSource } from "../scripts/source.mjs";
import { validate, fixture, resultFor } from "./helpers.mjs";

const RULE = "misuse.safety-controls-not-disabled";

function ruleResult(name) {
  const { json } = validate(fixture(name));
  assert.ok(json, `${name} must produce an envelope`);
  const result = resultFor(json, RULE);
  assert.ok(result, `${name} must report ${RULE}`);
  return { json, result };
}

function assertFires(name, file) {
  const { json, result } = ruleResult(name);
  assert.equal(result.result, "failed", `expected failed, got ${result.result}: ${result.message}`);
  assert.equal(result.distinction, "failed");
  assert.equal(result.disposition, "evaluated");
  assert.ok(
    result.evidence.includes(`${file} (safety control set off)`),
    `evidence must name the off-pattern in ${file}; got ${JSON.stringify(result.evidence)}`,
  );
  assert.equal(json.status, "NON_COMPLIANT", "a failed forbidden rule makes the project non-compliant");
}

// The rule's assurance is partial, so a clean search is not a pass (Standard 5 R6, Q13). A control
// therefore asserts both halves: no violation, and an unestablished prohibition rather than `passed`.
function assertDoesNotFire(name) {
  const { json, result } = ruleResult(name);
  assert.ok(
    !["failed", "warning"].includes(result.result),
    `${RULE} must not fire on ${name}; got ${result.result}: ${result.message}`,
  );
  assert.equal(result.level, "forbidden");
  assert.equal(result.distinction, "prohibited-but-unestablished", `${name}: ${result.message}`);
  assert.equal(result.result, "skipped");
  assert.equal(result.disposition, "not-evaluated");
  assert.ok(json.unestablishedProhibitions.some((p) => p.rule === RULE), `${RULE} must be listed as unestablished`);
  assert.deepEqual(result.evidence, []);
}

// [what, provoking fixture, non-firing fixture of the same shape, file carrying the setting]
const PAIRS = [
  ["a quoted off in YAML followed by harmless lines", "safety-off-yaml-trailing", "safety-on-yaml-trailing", "config.yml"],
  ["a quoted off in YAML preceded by harmless lines, the order swapped", "safety-off-yaml-leading", "safety-on-yaml-leading", "config.yml"],
  ["a quoted off as a value in a JavaScript object", "safety-off-js-object", "safety-on-js-object", "src/config.js"],
  ["a quoted off as a Python keyword argument", "safety-off-python-kwarg", "safety-on-python-kwarg", "src/client.py"],
  ["a TypeScript union type naming off, beside a typed value of off", "safety-off-typed-ts", "safety-union-type-ts", "src/types.ts"],
  ["a ternary whose consequent is the key, beside a ternary that selects off", "safety-off-ternary-js", "safety-ternary-js", "src/cfg.js"],
];

for (const [what, provoking, control, file] of PAIRS) {
  test(`fires on ${what} (${provoking})`, () => assertFires(provoking, file));
  test(`does NOT fire on the non-firing case for ${what} (${control})`, () => assertDoesNotFire(control));
}

// Cases each guard must NOT swallow. They carry the guard's own trigger character and assign off.
test("the union guard does not swallow `\"off\" || fallback`, which evaluates to off (safety-off-or-fallback-js)", () => {
  assertFires("safety-off-or-fallback-js", "src/cfg.js");
});

test("the ternary guard is not applied to a YAML explicit key `? moderation` / `: 'off'` (safety-off-yaml-explicit-key)", () => {
  assertFires("safety-off-yaml-explicit-key", "config.yml");
});

test("the searched view blanks comments in place and keeps code and literals where they were", () => {
  const js = 'const c = { moderation: "on" }; // moderation: "off"\n/* BLOCK_NONE */\nconst d = 1;\n';
  const s = splitSource(js, "x.js");
  assert.equal(s.withoutComments.length, js.length, "offsets must be preserved");
  assert.equal(s.withoutComments.split("\n").length, js.split("\n").length, "line breaks must be preserved");
  assert.ok(s.withoutComments.startsWith('const c = { moderation: "on" };'), "code and literals stay adjacent");
  assert.ok(!s.withoutComments.includes('"off"'), "a line comment must not be searchable");
  assert.ok(!s.withoutComments.includes("BLOCK_NONE"), "a block comment must not be searchable");
  assert.ok(s.withoutComments.endsWith("const d = 1;\n"));

  const py = 'x = 10 // 3  # moderation="off"\ny = client.create(moderation="on")\r\n';
  const p = splitSource(py, "x.py");
  assert.equal(p.withoutComments.length, py.length);
  assert.ok(p.withoutComments.includes("10 // 3"), "Python floor division is code, not a comment");
  assert.ok(!p.withoutComments.includes('"off"'));
  assert.ok(p.withoutComments.includes('moderation="on")\r\n'), "carriage returns are kept");

  assert.equal(splitSource("anything", "x.unknownext").withoutComments, "", "an unusable split has no view");
});
