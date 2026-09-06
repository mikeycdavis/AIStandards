// The use/mention split.
//
// Naming a technology is not using it. Every test here is really about one question: can a
// repository that DOCUMENTS a problem be distinguished from one that HAS it.

import { test } from "node:test";
import assert from "node:assert/strict";
import { splitSource, isCode, extensionOf } from "../scripts/source.mjs";

test("JavaScript line and block comments are not code", () => {
  const s = splitSource('const a = 1; // BLOCK_NONE\n/* also BLOCK_NONE */\nconst b = 2;\n', "x.js");
  assert.ok(!s.code.includes("BLOCK_NONE"), "a commented mention must not appear in code");
  assert.ok(s.comments.includes("BLOCK_NONE"));
  assert.ok(s.code.includes("const a"));
  assert.ok(s.code.includes("const b"), "parsing must continue past a block comment");
});

test("string literals are separated from code", () => {
  const s = splitSource('const a = "BLOCK_NONE";\n', "x.js");
  assert.ok(!s.code.includes("BLOCK_NONE"));
  assert.ok(s.strings.includes("BLOCK_NONE"));
});

test("PYTHON: // is floor division, NOT a comment", () => {
  // Enabling the wrong comment syntax here would discard everything after `//` and could hide a
  // real finding as easily as invent one.
  const s = splitSource("def halve(n):\n    return n // 2\n# a real comment\n", "x.py");
  assert.ok(s.code.includes("//"), "floor division must survive in code");
  assert.ok(s.code.includes("return n"));
  assert.ok(s.comments.includes("a real comment"));
  assert.ok(!s.code.includes("a real comment"));
});

test("Python hash comments are comments", () => {
  const s = splitSource("x = 1  # BLOCK_NONE\n", "x.py");
  assert.ok(!s.code.includes("BLOCK_NONE"));
  assert.ok(s.comments.includes("BLOCK_NONE"));
});

test("SQL uses -- for comments, not //", () => {
  const s = splitSource("SELECT 1; -- BLOCK_NONE\n", "x.sql");
  assert.ok(!s.code.includes("BLOCK_NONE"));
  assert.ok(s.comments.includes("BLOCK_NONE"));
});

test("regex literals are not code, and division is not a regex", () => {
  const withRegex = splitSource("const re = /BLOCK_NONE/g;\n", "x.js");
  assert.ok(!withRegex.code.includes("BLOCK_NONE"));

  const withDivision = splitSource("const q = total / count;\nconst r = 2;\n", "x.js");
  assert.ok(withDivision.code.includes("total / count"), "division must not be swallowed as a regex");
  assert.ok(withDivision.code.includes("const r"));
});

test("an unterminated quote does not swallow the rest of the file", () => {
  // Otherwise one typo hides every subsequent finding in the file.
  const s = splitSource('const a = "oops\nconst b = 2;\n', "x.js");
  assert.ok(s.code.includes("const b"), "parsing must recover at the newline");
});

test("an unknown file type is UNUSABLE, not empty — they are different values", () => {
  const s = splitSource("anything", "x.unknownext");
  assert.equal(s.usable, false, "a caller must be able to withdraw rather than scan with wrong rules");
  const known = splitSource("x", "x.js");
  assert.equal(known.usable, true);
});

test("isCode distinguishes code from prose", () => {
  assert.equal(isCode("a/b.js"), true);
  assert.equal(isCode("a/b.py"), true);
  assert.equal(isCode("README.md"), false, "Markdown is prose; a mention there is never usage");
  assert.equal(isCode("notes.txt"), false);
});

test("extensionOf handles both separators and dotfiles", () => {
  assert.equal(extensionOf("a/b/c.JS"), ".js");
  assert.equal(extensionOf("a\\b\\c.py"), ".py");
  assert.equal(extensionOf(".gitignore"), "", "a dotfile has no extension");
  assert.equal(extensionOf("noext"), "");
});
