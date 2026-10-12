// The structural reader (scripts/structural.mjs): the parser core of ST-57 (#119).
//
// These tests exercise the reader directly. They fix the contract ST-58 and ST-59 build on: the node
// shape, the units of every offset and length, what is and is not decoded, and every way a file can
// fail. A reader that returned a tree for a file it should have refused would be a false pass, so the
// failure cases are as numerous as the success cases.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REPO } from "./helpers.mjs";
import {
  isStructuralScope,
  formatOf,
  codePointLength,
  parseStructuralBytes,
  parseStructuralText,
  walk,
  pathOf,
  FAILURE_REASONS,
} from "../scripts/structural.mjs";

const yaml = (text) => parseStructuralBytes("t.yml", Buffer.from(text, "utf8"));
const json = (text) => parseStructuralBytes("t.json", Buffer.from(text, "utf8"));
const root = (r, doc = 0) => r.documents[doc].root;
const pairs = (node) => node.pairs.map((p) => [p.key?.value, p.value?.value]);

// --- Scope (decision F) -------------------------------------------------------------------------

test("scope: exactly .yml, .yaml and .json, case-insensitively, from the name alone", () => {
  for (const name of ["a.yml", "a.yaml", "a.json", "A.YML", "a.YaMl", "dir/sub/A.Json", "C:\\x\\a.JSON", "a.b.yaml"]) {
    assert.equal(isStructuralScope(name), true, name);
  }
  for (const name of ["a.jsonc", "a.json5", "a.jsonl", "a.ndjson", "a.toml", "a.yml.j2", "a.yaml.tpl", "a.json.bak",
    "a.md", "a.ipynb", "noext", "a.", ".json", ".yml", "dir.json/file", "a.yml/", ""]) {
    assert.equal(isStructuralScope(name), false, JSON.stringify(name));
  }
  assert.equal(isStructuralScope(undefined), false);
  assert.equal(isStructuralScope(null), false);
});

test("scope: it agrees with the lexical layer about what a file's extension is", async () => {
  const { extensionOf } = await import("../scripts/source.mjs");
  for (const name of ["a.yml", ".json", "x/.yaml", "a.YAML", "a.", "a.b.json", "noext"]) {
    const ext = extensionOf(name);
    assert.equal(isStructuralScope(name), [".yml", ".yaml", ".json"].includes(ext), name);
  }
});

test("scope: the format follows the extension and nothing else", () => {
  assert.equal(formatOf("a.JSON"), "json");
  assert.equal(formatOf("a.yml"), "yaml");
  assert.equal(formatOf("a.yaml"), "yaml");
  assert.equal(formatOf("a.toml"), null);
});

test("scope: content is never sniffed. JSON text in a .yml file is read as YAML, and YAML in .json is a failure", () => {
  const asYaml = parseStructuralBytes("a.yml", Buffer.from("{\"a\": 1}"));
  assert.equal(asYaml.ok, true);
  assert.equal(asYaml.format, "yaml");
  const asJson = parseStructuralBytes("a.json", Buffer.from("a: 1\n"));
  assert.equal(asJson.ok, false);
  assert.equal(asJson.reason, "syntax");
});

test("an out-of-scope name is a failure value, not a parse", () => {
  const r = parseStructuralBytes("a.toml", Buffer.from("a = 1"));
  assert.equal(r.ok, false);
});

// --- Units --------------------------------------------------------------------------------------

test("codePointLength counts code points, not UTF-16 units", () => {
  assert.equal(codePointLength(""), 0);
  assert.equal(codePointLength("abc"), 3);
  assert.equal(codePointLength("\u{1F600}"), 1);
  assert.equal(codePointLength("a\u{1F600}b"), 3);
  assert.equal(codePointLength("\ud83d"), 1, "a lone surrogate is one unit and one code point");
  assert.equal(codePointLength("\u00e9"), 1);
});

test("offsets index the text, so slicing a range gives the source", () => {
  const text = "name: \"caf\u00e9 \u{1F600}\"\nother: plain value\n";
  const r = parseStructuralText("t.yml", text, "yaml");
  const [first, second] = root(r).pairs;
  assert.equal(text.slice(first.value.range.start, first.value.range.end), "\"caf\u00e9 \u{1F600}\"");
  assert.equal(first.value.value, "caf\u00e9 \u{1F600}");
  assert.equal(first.value.length, 6, "code points of the decoded value");
  assert.equal(text.slice(second.value.range.start, second.value.range.end), "plain value");
});

test("line is 1-based on LF, column is 1-based in code points", () => {
  const text = "a: 1\n\u{1F600}\u{1F600}k: v\n";
  const r = parseStructuralText("t.yml", text, "yaml");
  const key = root(r).pairs[1].key;
  assert.equal(key.value, "\u{1F600}\u{1F600}k");
  assert.deepEqual(r.locate(key.range.start), { line: 2, column: 1 });
  assert.deepEqual(r.locate(key.range.end), { line: 2, column: 4 }, "two astral code points and k precede the colon");
});

test("CRLF input has the same line and column numbers as LF, and the same decoded values", () => {
  const lf = parseStructuralText("t.yml", "a: 1\nb:\n  - x\n  - y\nc: |\n  one\n  two\n", "yaml");
  const crlf = parseStructuralText("t.yml", "a: 1\r\nb:\r\n  - x\r\n  - y\r\nc: |\r\n  one\r\n  two\r\n", "yaml");
  assert.equal(lf.ok && crlf.ok, true);
  const flat = (r) => {
    const out = [];
    walk(root(r), (n) => { if (n.kind === "scalar") out.push([n.value, r.locate(n.range.start)]); });
    return out;
  };
  assert.deepEqual(flat(crlf), flat(lf));
});

test("a UTF-8 byte order mark is removed and recorded; offsets are relative to the text without it", () => {
  const r = parseStructuralBytes("t.yml", Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("k: v\n")]));
  assert.equal(r.ok, true);
  assert.equal(r.bom, true);
  assert.equal(r.text, "k: v\n");
  assert.equal(root(r).pairs[0].key.range.start, 0);
  const j = parseStructuralBytes("t.json", Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("{}")]));
  assert.equal(j.ok, true);
  assert.equal(j.bom, true);
});

// --- Failure outcomes (decision D) --------------------------------------------------------------

test("every failure is a value with a reason from the closed list, and nothing throws", () => {
  const cases = [
    ["a.yml", Buffer.from([0xff, 0xfe, 0x6b, 0x00]), "utf-16"],
    ["a.yml", Buffer.from([0xfe, 0xff, 0x00, 0x6b]), "utf-16"],
    ["a.yml", Buffer.from([0x6b, 0x3a, 0x20, 0xe9]), "invalid-utf-8"],
    ["a.yml", Buffer.from([0xc3, 0x28]), "invalid-utf-8"],
    ["a.yml", Buffer.from("k: \u0000\n"), "control-character"],
    ["a.yml", Buffer.from("k: \u0007\n"), "control-character"],
    ["a.yml", Buffer.from("k: \u007f\n"), "control-character"],
    ["a.yml", Buffer.from("a: 1\rb: 2\n"), "lone-cr"],
    ["a.yml", Buffer.from("a: [\n"), "syntax"],
    ["a.yml", Buffer.from("a:\n\tb: 1\n"), "syntax"],
    ["a.yml", Buffer.from("a: \"unterminated\n"), "syntax"],
    ["a.yml", Buffer.from("a: *missing\n"), "undefined-alias"],
    ["a.yml", Buffer.from("*missing\n"), "undefined-alias"],
    ["a.json", Buffer.from(""), "empty-document"],
    ["a.json", Buffer.from("  \n"), "empty-document"],
    ["a.json", Buffer.from("{"), "syntax"],
  ];
  for (const [file, bytes, reason] of cases) {
    const r = parseStructuralBytes(file, bytes);
    assert.equal(r.ok, false, `${file} ${JSON.stringify(bytes.toString("latin1"))}`);
    assert.equal(r.reason, reason, `${file} ${JSON.stringify(bytes.toString("latin1"))}`);
    assert.ok(FAILURE_REASONS.includes(r.reason));
  }
});

test("a truncated read is refused, not parsed", () => {
  const r = parseStructuralBytes("a.yml", Buffer.from("a: 1\n"), { truncated: true });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "truncated");
});

test("a failure carries a position, and never the parser's own message (which can quote file text)", () => {
  const r = yaml("system: \"secret text here\"\nbad: [\n");
  assert.equal(r.ok, false);
  assert.equal(typeof r.offset, "number");
  assert.equal(typeof r.line, "number");
  assert.equal(JSON.stringify(r).includes("secret text here"), false);
  assert.equal(Object.hasOwn(r, "message"), false);
});

test("the first failing position across documents is reported with its document index", () => {
  const r = yaml("a: 1\n---\nb: 2\n---\nc: [\n");
  assert.equal(r.ok, false);
  assert.equal(r.documentIndex, 2);
});

test("control characters are refused in YAML, and tab, LF and CR-LF are not control characters", () => {
  assert.equal(yaml("a:\t1\n").ok, true);
  assert.equal(yaml("a: 1\r\n").ok, true);
  assert.equal(yaml("a: \u0086\n").ok, false, "a C1 control");
  assert.equal(yaml("a: \u0085\n").ok, true, "NEL is c-printable in YAML 1.2");
  assert.equal(yaml("a: \u00e9\u2603\u{1F600}\n").ok, true);
});

// --- Strict JSON (decision B) -------------------------------------------------------------------

test("JSON: duplicate members are all kept, in source order, with their own offsets", () => {
  const text = "{\"a\": 1, \"b\": 2, \"a\": 3}";
  const r = parseStructuralText("t.json", text, "json");
  const members = root(r).pairs;
  assert.deepEqual(members.map((m) => [m.key.value, m.value.value]), [["a", "1"], ["b", "2"], ["a", "3"]]);
  assert.equal(text.slice(members[2].key.range.start, members[2].key.range.end), "\"a\"");
  assert.equal(text.slice(members[2].value.range.start, members[2].value.range.end), "3");
});

test("JSON: escapes are decoded and the measured length is in decoded code points", () => {
  const raw = String.raw`"A\n😀\"\\\/"`;
  const text = `{"k": ${raw}}`;
  const r = parseStructuralText("t.json", text, "json");
  const v = root(r).pairs[0].value;
  assert.equal(v.value, "A\n\u{1F600}\"\\/");
  assert.equal(v.length, 6);
  assert.equal(text.slice(v.range.start, v.range.end), raw, "range spans the raw literal including quotes");
});

test("JSON: a lone surrogate escape is syntactically valid and is one code point", () => {
  const r = json("[\"\\ud800\"]");
  assert.equal(r.ok, true);
  assert.equal(root(r).items[0].length, 1);
});

test("JSON: every value type is a string-valued scalar with its type recorded, never coerced", () => {
  const r = json("[1, -0.5e+3, true, false, null, \"s\"]");
  assert.deepEqual(root(r).items.map((n) => [n.value, n.jsonType]), [
    ["1", "number"], ["-0.5e+3", "number"], ["true", "boolean"], ["false", "boolean"], ["null", "null"], ["s", "string"],
  ]);
});

test("JSON: the grammar is RFC 8259 and nothing more", () => {
  const accept = ["{}", "[]", "0", "-0", "1.5", "1e5", "1E-5", "\"\"", "true", "null", " \t\r\n[ 1 , 2 ]\n",
    "{\"a\":{\"b\":[]}}", "\"\\u00e9\"", "[[[]]]"];
  const reject = ["{,}", "[1,]", "{\"a\":1,}", "[,1]", "{'a':1}", "{a:1}", "[1 2]", "{\"a\" 1}", "{\"a\":}", "01", "1.", ".5",
    "+1", "1e", "-", "NaN", "Infinity", "undefined", "tru", "\"\\x41\"", "\"\\u12\"", "\"a\nb\"", "\"a\tb\"", "[1] [2]", "{} x",
    "// c\n{}", "{/* c */}", "[1,\n2", "\"unterminated", "{\"a\":1 \"b\":2}", "{\"a\"", "\u2028{}", "\ufeff\ufeff{}"];
  for (const text of accept) assert.equal(json(text).ok, true, `should accept ${JSON.stringify(text)}`);
  for (const text of reject) assert.equal(json(text).ok, false, `should reject ${JSON.stringify(text)}`);
});

test("JSON: control characters inside a string are refused, escaped ones are not", () => {
  for (let c = 0; c < 0x20; c += 1) {
    assert.equal(json(`"a${String.fromCharCode(c)}b"`).ok, false, `U+${c.toString(16)}`);
  }
  assert.equal(json("\"a\\u0000b\"").ok, true);
});

test("JSON: nesting depth is not a stack hazard", () => {
  const depth = 200000;
  const r = json("[".repeat(depth) + "]".repeat(depth));
  assert.equal(r.ok, true);
  let seen = 0;
  walk(root(r), () => { seen += 1; });
  assert.equal(seen, depth);
  assert.equal(json("[".repeat(depth)).ok, false);
});

test("JSON: the reader never delegates meaning to JSON.parse (last-wins would erase a duplicate)", () => {
  const source = fs.readFileSync(path.join(REPO, "scripts", "structural.mjs"), "utf8");
  const code = source.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  assert.equal(/JSON\.parse\s*\(/.test(code), false);
});

// --- YAML (decisions A and C) -------------------------------------------------------------------

test("YAML: every scalar is a string, with no implicit type coercion", () => {
  const r = yaml("a: true\nb: 12\nc: ~\nd: null\ne: 1.5\nf: 0x1F\ng: 2001-01-01\nh: no\n");
  assert.deepEqual(pairs(root(r)), [["a", "true"], ["b", "12"], ["c", "~"], ["d", "null"], ["e", "1.5"], ["f", "0x1F"], ["g", "2001-01-01"], ["h", "no"]]);
});

test("YAML: an empty value is the empty string and says so", () => {
  const r = yaml("a:\nb: ''\n");
  const [a, b] = root(r).pairs;
  assert.equal(a.value.value, "");
  assert.equal(a.value.style, "empty");
  assert.equal(b.value.style, "single-quoted");
});

test("YAML: duplicate keys are all kept (a duplicate is evidence, not an error)", () => {
  const r = yaml("k: 1\nk: 2\nk: 3\n");
  assert.equal(r.ok, true);
  assert.deepEqual(pairs(root(r)), [["k", "1"], ["k", "2"], ["k", "3"]]);
});

test("YAML: aliases are references, not dereferenced, and are reported", () => {
  const r = yaml("base: &b\n  role: system\nuse: *b\n");
  assert.equal(r.ok, true);
  const use = root(r).pairs[1].value;
  assert.equal(use.kind, "alias");
  assert.equal(use.name, "b");
  assert.equal(Object.hasOwn(use, "pairs"), false, "an alias node has no members of its own");
  assert.deepEqual(r.aliases.map((a) => [a.name, a.documentIndex]), [["b", 0]]);
});

test("YAML: merge keys are recorded, not applied", () => {
  const r = yaml("base: &b\n  content: x\nuse:\n  role: system\n  <<: *b\n");
  const use = root(r).pairs[1].value;
  assert.deepEqual(use.pairs.map((p) => [p.key.value, p.merge]), [["role", false], ["<<", true]]);
  assert.equal(use.pairs.length, 2, "the anchored map's members were not merged in");
  assert.equal(r.merges.length, 1);
});

test("YAML: a quoted << is an ordinary key, not a merge key", () => {
  const r = yaml("\"<<\": *a\nx: &a 1\n");
  assert.equal(r.ok, false, "alias before its anchor is undefined");
  const ok = yaml("x: &a 1\n\"<<\": *a\n");
  assert.equal(root(ok).pairs[1].merge, false);
});

test("YAML: anchors and tags carry the position where they were written", () => {
  const text = "a: &x !!str \"v\"\n&k key2: !t &y\n  c: 1\n";
  const r = parseStructuralText("t.yml", text, "yaml");
  const [a, k] = root(r).pairs;
  assert.deepEqual(a.value.anchor, { name: "x", offset: 3 });
  assert.deepEqual(a.value.tag, { source: "!!str", offset: 6 });
  assert.equal(text.slice(a.value.anchor.offset, a.value.anchor.offset + 2), "&x");
  assert.deepEqual(k.key.anchor, { name: "k", offset: 16 });
  assert.equal(k.value.anchor.name, "y");
  assert.equal(k.value.tag.source, "!t");
  assert.equal(r.counts.anchors, 3);
});

// The tag and anchor are reported as WRITTEN (source spelling and offset), not as resolved, in block and
// in flow context alike. A property that directly follows a flow indicator has no blank before it.
test("YAML: tags and anchors keep their source spelling and offset in flow collections", () => {
  const cases = [
    ["a: [!!str 1]\n", [["1", "!!str", null]]],
    ["a: {b: !!str 1}\n", [["1", "!!str", null]]],
    ["a: [ !!str 1, !local x ]\n", [["1", "!!str", null], ["x", "!local", null]]],
    ["a: [!!str 1,!local x]\n", [["1", "!!str", null], ["x", "!local", null]]],
    ["a: [[!!str 1], {k: &a !!str v}]\n", [["1", "!!str", null], ["v", "!!str", "a"]]],
    ["a: [&x !!str 1, *x]\n", [["1", "!!str", "x"]]],
    ["a: &a !!str 1\n", [["1", "!!str", "a"]]],
    ["a: !<tag:x> 1\n", [["1", "!<tag:x>", null]]],
    ["a: [!<tag:x> 1]\n", [["1", "!<tag:x>", null]]],
    ["a: {!!str k: !<tag:y> v}\n", [["k", "!!str", null], ["v", "!<tag:y>", null]]],
  ];
  for (const [text, expected] of cases) {
    const r = parseStructuralText("t.yml", text, "yaml");
    assert.equal(r.ok, true, text);
    const seen = [];
    walk(root(r), (n) => {
      if (n.tag === undefined && n.anchor === undefined) return;
      seen.push([n.value, n.tag?.source ?? null, n.anchor?.name ?? null]);
      if (n.tag) {
        assert.notEqual(n.tag.offset, null, `${text}: tag offset recovered`);
        assert.equal(text.slice(n.tag.offset, n.tag.offset + n.tag.source.length), n.tag.source, `${text}: offset points at the spelling`);
      }
      if (n.anchor) {
        assert.notEqual(n.anchor.offset, null, `${text}: anchor offset recovered`);
        assert.equal(text.slice(n.anchor.offset, n.anchor.offset + 1 + n.anchor.name.length), `&${n.anchor.name}`, `${text}: anchor offset`);
      }
    });
    const tagged = seen.filter((x) => x[1] !== null || x[2] !== null);
    assert.deepEqual(tagged.map(([v, t, a]) => [v, t, a]), expected.map(([v, t, a]) => [v, t, a]), text);
  }
});

test("YAML: a tag whose spelling cannot be recovered is flagged resolved, never reported as written", () => {
  // A comment between the tag and its node hides the spelling from a backwards read.
  const r = parseStructuralText("t.yml", "a: !!str # note\n  1\n", "yaml");
  let tag;
  walk(root(r), (n) => { if (n.tag) tag = n.tag; });
  assert.equal(tag.resolved, true);
  assert.equal(tag.offset, null);
  assert.equal(tag.source, "tag:yaml.org,2002:str");
  const written = parseStructuralText("t.yml", "a: [!!str 1]\n", "yaml");
  walk(root(written), (n) => { if (n.tag) assert.equal(n.tag.resolved, undefined, "a recovered spelling is not flagged"); });
});

test("YAML: the same tag has the same source spelling in block and flow form", () => {
  const block = parseStructuralText("t.yml", "a: !!str 1\n", "yaml");
  const flow = parseStructuralText("t.yml", "a: [!!str 1]\n", "yaml");
  const tagOf = (r) => {
    let found;
    walk(root(r), (n) => { if (n.tag) found = n.tag.source; });
    return found;
  };
  assert.equal(tagOf(block), "!!str");
  assert.equal(tagOf(flow), "!!str");
});

test("YAML: a tagged or anchored scalar is its decoded scalar value", () => {
  const r = yaml("a: &x !!str 123\nb: !custom plain text\nc: !!binary aGk=\n");
  assert.deepEqual(pairs(root(r)), [["a", "123"], ["b", "plain text"], ["c", "aGk="]]);
});

test("YAML: an unresolved tag is a warning, not a failure", () => {
  const r = yaml("a: !Ref thing\n");
  assert.equal(r.ok, true);
  assert.deepEqual(r.warnings.map((w) => w.code), ["TAG_RESOLVE_FAILED"]);
});

test("YAML: duplicate anchor definitions are legal YAML and parse (a later alias means the later anchor)", () => {
  const r = yaml("a: &x 1\nb: &x 2\nc: *x\n");
  assert.equal(r.ok, true);
});

test("YAML: every document of a stream is read, independently, with its own index", () => {
  const r = yaml("role: system\n---\ncontent: x\n...\n---\nz: 1\n");
  assert.equal(r.ok, true);
  assert.equal(r.documents.length, 3);
  assert.deepEqual(r.documents.map((d) => d.index), [0, 1, 2]);
  assert.deepEqual(r.documents.map((d) => pairs(d.root)[0][0]), ["role", "content", "z"]);
  assert.equal(r.documents[1].explicitStart, true);
});

test("YAML: anchors do not leak across documents (an alias in document 2 cannot use document 1's anchor)", () => {
  const r = yaml("a: &x 1\n---\nb: *x\n");
  assert.equal(r.ok, false);
  assert.equal(r.reason, "undefined-alias");
  assert.equal(r.documentIndex, 1);
});

test("YAML: an empty stream and a comment-only stream parse with no documents", () => {
  assert.equal(yaml("").documents.length, 0);
  assert.equal(yaml("# nothing\n").documents.length, 0);
});

test("YAML: block scalars are decoded to their semantic value; length is in decoded code points; the source range is kept", () => {
  const text = "p: |\n  line one\n  caf\u00e9 \u{1F600}\nq: >-\n  folded\n  text\nr: |+\n  keep\n\ns: |2\n    indented\n";
  const r = parseStructuralText("t.yml", text, "yaml");
  const [p, q, rr, s] = root(r).pairs.map((x) => x.value);
  assert.equal(p.value, "line one\ncaf\u00e9 \u{1F600}\n");
  assert.equal(p.length, codePointLength(p.value));
  assert.equal(p.style, "block-literal");
  assert.equal(text.slice(p.range.start, p.range.start + 1), "|");
  assert.ok(p.range.end > p.range.start + 20, "the range covers the scalar's source, not its decoded length");
  assert.equal(q.value, "folded text");
  assert.equal(q.style, "block-folded");
  assert.equal(rr.value, "keep\n\n");
  assert.equal(s.value, "  indented\n");
});

test("YAML: quoted and plain multi-line scalars fold to one line, escapes decode, and raw length is not the measure", () => {
  const text = "a: \"one\n  two\\n\\u0041\"\nb: plain\n  continued\n  here\nc: 'it''s'\n";
  const r = parseStructuralText("t.yml", text, "yaml");
  assert.deepEqual(pairs(root(r)), [["a", "one two\nA"], ["b", "plain continued here"], ["c", "it's"]]);
  const a = root(r).pairs[0].value;
  assert.ok(a.range.end - a.range.start > a.length, "the raw literal is longer than the decoded value");
});

test("YAML: complex keys are kept as nodes, not flattened to text", () => {
  const r = yaml("? [a, b]\n: value\n? {x: y}\n: other\n");
  assert.equal(r.ok, true);
  assert.deepEqual(root(r).pairs.map((p) => p.key.kind), ["seq", "map"]);
});

test("YAML: flow collections and block collections give the same node shape", () => {
  const a = yaml("k: {a: 1, b: [x, y]}\n");
  const b = yaml("k:\n  a: 1\n  b:\n    - x\n    - y\n");
  const shape = (r) => {
    const out = [];
    walk(root(r), (n, f) => out.push([n.kind, n.value ?? null, JSON.stringify(pathOf(f))]));
    return out;
  };
  assert.deepEqual(shape(a), shape(b));
});

test("walk visits parents before children, keys before values, in source order, and pathOf names the route", () => {
  const r = yaml("a:\n  - x\n  - b: y\n");
  const seen = [];
  walk(root(r), (n, f) => seen.push(`${n.kind}:${n.value ?? ""}@${JSON.stringify(pathOf(f))}`));
  assert.deepEqual(seen, [
    "map:@[]",
    "scalar:a@[{\"key\":\"a\",\"role\":\"key\"}]",
    "seq:@[{\"key\":\"a\",\"role\":\"value\"}]",
    "scalar:x@[{\"key\":\"a\",\"role\":\"value\"},{\"index\":0}]",
    "map:@[{\"key\":\"a\",\"role\":\"value\"},{\"index\":1}]",
    "scalar:b@[{\"key\":\"a\",\"role\":\"value\"},{\"index\":1},{\"key\":\"b\",\"role\":\"key\"}]",
    "scalar:y@[{\"key\":\"a\",\"role\":\"value\"},{\"index\":1},{\"key\":\"b\",\"role\":\"value\"}]",
  ]);
});

// --- Hostile input ------------------------------------------------------------------------------

test("hostile: a billion-laughs alias bomb parses to a small tree because aliases are never expanded", () => {
  let text = "a: &a [\"lol\",\"lol\",\"lol\",\"lol\",\"lol\",\"lol\",\"lol\",\"lol\",\"lol\"]\n";
  for (let i = 0; i < 9; i += 1) {
    const prev = String.fromCharCode(97 + i);
    const name = String.fromCharCode(98 + i);
    text += `${name}: &${name} [${Array(9).fill(`*${prev}`).join(",")}]\n`;
  }
  const r = yaml(text);
  assert.equal(r.ok, true);
  let nodes = 0;
  walk(root(r), () => { nodes += 1; });
  assert.ok(nodes < 500, `tree has ${nodes} nodes`);
  assert.equal(r.aliases.length, 81);
});

test("hostile: a large number of aliases to one anchor is counted, not expanded", () => {
  const r = yaml("a: &a 1\n" + "- *a\n".repeat(0) + Array.from({ length: 5000 }, (_, i) => `k${i}: *a`).join("\n") + "\n");
  assert.equal(r.ok, true);
  assert.equal(r.aliases.length, 5000);
});

test("hostile: deeply nested YAML is a failure value, not an exception or a hang", () => {
  for (const text of ["[".repeat(20000) + "]".repeat(20000) + "\n", "- ".repeat(3000) + "x\n"]) {
    const r = yaml(text);
    assert.equal(typeof r.ok, "boolean");
    if (!r.ok) assert.ok(FAILURE_REASONS.includes(r.reason));
  }
});

test("hostile: binary content is refused, not read as an empty document", () => {
  const bytes = Buffer.alloc(4096);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = (i * 131 + 7) & 0xff;
  const r = parseStructuralBytes("a.yml", bytes);
  assert.equal(r.ok, false);
});

test("the module is a pure reader: no filesystem, network, process or dynamic code", () => {
  const source = fs.readFileSync(path.join(REPO, "scripts", "structural.mjs"), "utf8");
  const code = source.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  for (const forbidden of [/\bnode:fs\b/, /\bchild_process\b/, /\bfetch\s*\(/, /\beval\s*\(/, /new Function/, /\bprocess\./, /\.toJS\s*\(/, /\bimport\s*\(/]) {
    assert.equal(forbidden.test(code), false, String(forbidden));
  }
});
