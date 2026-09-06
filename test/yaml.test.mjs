// The YAML subset. The point of these tests is the REFUSALS: a parser that guesses at a policy is
// guessing at a verdict.

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseYaml, YamlError } from "../scripts/yaml.mjs";

test("nested mappings", () => {
  assert.deepEqual(parseYaml("a:\n  b: 1\n  c: two\n"), { a: { b: 1, c: "two" } });
});

test("sequences of scalars", () => {
  assert.deepEqual(parseYaml("a:\n  - one\n  - two\n"), { a: ["one", "two"] });
});

test("sequences of mappings, with members aligned to the first key", () => {
  assert.deepEqual(
    parseYaml("models:\n  - id: x\n    provider: y\n  - id: z\n    provider: w\n"),
    { models: [{ id: "x", provider: "y" }, { id: "z", provider: "w" }] },
  );
});

test("scalar types", () => {
  assert.deepEqual(
    parseYaml("s: text\nq: \"quoted\"\nn: 42\nf: 1.5\nt: true\nf2: false\nz: null\nw: ~\n"),
    { s: "text", q: "quoted", n: 42, f: 1.5, t: true, f2: false, z: null, w: null },
  );
});

test("comments are stripped, but a # inside quotes is data", () => {
  assert.deepEqual(parseYaml("# lead\na: 1 # trailing\nb: \"has # inside\"\n"), { a: 1, b: "has # inside" });
});

test("empty collections are the only flow syntax accepted", () => {
  assert.deepEqual(parseYaml("a: []\nb: {}\n"), { a: [], b: {} });
});

// --- Refusals ---------------------------------------------------------------------------------

const REFUSED = {
  "a block scalar with |": "a: |\n  text\n",
  "a block scalar with >": "a: >\n  text\n",
  "an anchor": "a: 1\n&anchor\n",
  "an alias": "a: 1\n*alias\n",
  "a multi-document stream": "---\na: 1\n",
  "a non-empty flow sequence": "a: [1, 2]\n",
  "a non-empty flow mapping": "a: {b: 1}\n",
  "a tab used for indentation": "a:\n\tb: 1\n",
  "a duplicate key": "a: 1\na: 2\n",
  "an unterminated double quote": 'a: "unterminated\n',
};

for (const [name, text] of Object.entries(REFUSED)) {
  test(`refuses ${name} rather than guessing`, () => {
    assert.throws(() => parseYaml(text), (err) => {
      assert.ok(err instanceof YamlError, `expected YamlError, got ${err}`);
      return true;
    });
  });
}

test("every refusal names a line, so the failure is actionable", () => {
  try {
    parseYaml("a: |\n  x\n");
    assert.fail("should have thrown");
  } catch (err) {
    assert.match(err.message, /line \d+/);
  }
});

test("negative control: valid documents parse, so refusal is not the default", () => {
  // Without this, a parser that threw on everything would pass every test above.
  assert.deepEqual(parseYaml("a: 1\n"), { a: 1 });
  assert.deepEqual(parseYaml("a:\n  - b: 1\n"), { a: [{ b: 1 }] });
});

test("an empty document is null, not an empty object", () => {
  assert.equal(parseYaml(""), null);
  assert.equal(parseYaml("# only a comment\n"), null);
});
