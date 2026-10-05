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

test("codeOnly keeps a quoted property NAME and blanks every other string", () => {
  const view = (text, file) => splitSource(text, file).codeOnly;
  // A blanked string keeps only its opening delimiter; its body and closing quote become spaces.
  const blank = (quote, length) => quote + " ".repeat(length - 1);
  assert.equal(view('f({"system": "abc"})', "a.js"), `f({"system": ${blank('"', 5)}})`);
  assert.equal(view("f({'system': 'abc'})", "a.py"), `f({'system': ${blank("'", 5)}})`);
  assert.equal(view('{"a": 1, "b": "x"}', "a.json"), `{"a": 1, "b": ${blank('"', 3)}}`);
  // values, mentions, ternary branches and non-identifier keys are blanked
  assert.equal(view('f("system")', "a.js"), `f(${blank('"', 8)})`);
  assert.equal(view('x = c ? "system" : "abc"', "a.js"), `x = c ? ${blank('"', 8)} : ${blank('"', 5)}`);
  assert.equal(view('{"a": "system", "b": 1}', "a.js"), `{"a": ${blank('"', 8)}, "b": 1}`);
  assert.equal(view('{"x-y": 1}', "a.json"), `{${blank('"', 5)}: 1}`);
  assert.equal(view('// {"system": 1}', "a.js"), " ".repeat(16));
  assert.equal(view('"system": "abc"', "a.yaml"), `"system": ${blank('"', 5)}`);
  // a string that is not followed by a key separator is an array element or an operand, not a key
  assert.equal(view('["a", "system"]', "a.js"), `[${blank('"', 3)}, ${blank('"', 8)}]`);
  assert.equal(view('"system" == 1', "a.py"), `${blank('"', 8)} == 1`);
  assert.equal(view('{"system" = 1}', "a.js"), `{${blank('"', 8)} = 1}`);
  // a TOML key may use `=`
  assert.equal(view('"system" = 1', "a.toml"), '"system" = 1');
  // an unterminated key and a template literal are never keys
  assert.equal(view('{"system\n: 1}', "a.js"), `{${blank('"', 7)}\n: 1}`);
  assert.equal(view("{`system`: 1}", "a.js"), `{${blank("`", 8)}: 1}`);
  assert.equal(view('c ? "a" : "b"', "a.py"), `c ? ${blank('"', 3)} : ${blank('"', 3)}`);
});

test("codeOnly keeps a quoted key after YAML sequence markers, in YAML files only", () => {
  const view = (text, file) => splitSource(text, file).codeOnly;
  const blank = (quote, length) => quote + " ".repeat(length - 1);
  assert.equal(view('- "system": "abc"', "a.yaml"), `- "system": ${blank('"', 5)}`);
  assert.equal(view("- 'system': 'abc'", "a.yml"), `- 'system': ${blank("'", 5)}`);
  assert.equal(view('- - "system": "abc"', "a.yaml"), `- - "system": ${blank('"', 5)}`);
  assert.equal(view('  -   "system" : "abc"', "a.yaml"), `  -   "system" : ${blank('"', 5)}`);
  // only a YAML file has sequences of mappings: the same line in Python, TOML or shell is not a key
  assert.equal(view('- "system": "abc"', "a.py"), `- ${blank('"', 8)}: ${blank('"', 5)}`);
  assert.equal(view('- "system": "abc"', "a.toml"), `- ${blank('"', 8)}: ${blank('"', 5)}`);
  // a dash glued to the literal is not a sequence marker
  assert.equal(view('-"system": "abc"', "a.yaml"), `-${blank('"', 8)}: ${blank('"', 5)}`);
  // a value after the marker, a mention, and text between the marker and the literal are not keys
  assert.equal(view('- "system"', "a.yaml"), `- ${blank('"', 8)}`);
  assert.equal(view('- a "system": 1', "a.yaml"), `- a ${blank('"', 8)}: 1`);
  assert.equal(view('x - "system": 1', "a.yaml"), `x - ${blank('"', 8)}: 1`);
});
