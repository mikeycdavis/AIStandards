// The JSON Schema subset.
//
// The load-bearing test here is the LAST one: an unimplemented keyword must THROW, never be
// ignored. A validator that silently skips a keyword reports "valid" for a document it never
// checked, which is the false pass this repository exists to refuse.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { validate, assertValid, SchemaError } from "../scripts/jsonschema.mjs";
import { REPO } from "./helpers.mjs";

test("type checking", () => {
  assert.deepEqual(validate("x", { type: "string" }), []);
  assert.equal(validate(1, { type: "string" }).length, 1);
  assert.deepEqual(validate(1, { type: "integer" }), []);
  assert.equal(validate(1.5, { type: "integer" }).length, 1);
  assert.deepEqual(validate(null, { type: ["string", "null"] }), []);
});

test("required, additionalProperties and propertyNames", () => {
  const schema = {
    type: "object",
    required: ["a"],
    additionalProperties: false,
    properties: { a: { type: "integer" } },
  };
  assert.deepEqual(validate({ a: 1 }, schema), []);
  assert.match(validate({}, schema)[0], /missing required property/);
  assert.match(validate({ a: 1, b: 2 }, schema)[0], /not permitted here/);

  const names = { type: "object", propertyNames: { pattern: "^[a-z]+$" } };
  assert.deepEqual(validate({ abc: 1 }, names), []);
  assert.equal(validate({ ABC: 1 }, names).length, 1);
});

test("enum, const, pattern, and numeric bounds", () => {
  assert.deepEqual(validate("a", { enum: ["a", "b"] }), []);
  assert.equal(validate("c", { enum: ["a", "b"] }).length, 1);
  assert.deepEqual(validate("1.0", { const: "1.0" }), []);
  assert.equal(validate("x", { pattern: "^\\d+$" }).length, 1);
  assert.equal(validate(0, { minimum: 1 }).length, 1);
  assert.deepEqual(validate(2, { minimum: 1, maximum: 3 }), []);
});

test("arrays: items, minItems, uniqueItems", () => {
  assert.deepEqual(validate([1, 2], { type: "array", items: { type: "integer" } }), []);
  assert.equal(validate([1, "x"], { type: "array", items: { type: "integer" } }).length, 1);
  assert.equal(validate([], { type: "array", minItems: 1 }).length, 1);
  assert.equal(validate([1, 1], { type: "array", uniqueItems: true }).length, 1);
});

test("combinators", () => {
  assert.deepEqual(validate("x", { anyOf: [{ type: "string" }, { type: "integer" }] }), []);
  assert.equal(validate(true, { anyOf: [{ type: "string" }, { type: "integer" }] }).length, 1);
  assert.deepEqual(validate("x", { oneOf: [{ type: "string" }, { type: "integer" }] }), []);
  assert.equal(validate("x", { oneOf: [{ type: "string" }, { minLength: 0 }] }).length, 1, "two matches is not one");
  assert.equal(validate("x", { not: { type: "string" } }).length, 1);
});

test("$ref resolves against $defs", () => {
  const schema = {
    $defs: { id: { type: "string", pattern: "^[a-z]+$" } },
    type: "object",
    properties: { a: { $ref: "#/$defs/id" } },
  };
  assert.deepEqual(validate({ a: "abc" }, schema), []);
  assert.equal(validate({ a: "ABC" }, schema).length, 1);
});

test("AN UNIMPLEMENTED KEYWORD THROWS — it is never ignored", () => {
  assert.throws(
    () => validate("x", { type: "string", contentEncoding: "base64" }),
    (err) => {
      assert.ok(err instanceof SchemaError);
      assert.match(err.message, /does not implement/);
      assert.match(err.message, /skipped keyword is an unchecked document/);
      return true;
    },
  );
});

test("negative control: a schema of only implemented keywords does not throw", () => {
  assert.doesNotThrow(() => validate({ a: 1 }, { type: "object", properties: { a: { type: "integer" } } }));
});

test("every schema this repository ships uses only implemented keywords", () => {
  // If this fails, a schema was written against a keyword the validator cannot check — which would
  // mean part of that schema was never enforced.
  const dir = path.join(REPO, "schemas");
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const schema = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    assert.doesNotThrow(
      () => validate({}, schema),
      `schemas/${file} uses a keyword the validator does not implement`,
    );
  }
});

test("assertValid throws with every violation listed", () => {
  assert.throws(
    () => assertValid({}, { type: "object", required: ["a", "b"] }, "probe"),
    (err) => {
      assert.match(err.message, /probe is not valid/);
      assert.match(err.message, /"a"/);
      assert.match(err.message, /"b"/);
      return true;
    },
  );
});
