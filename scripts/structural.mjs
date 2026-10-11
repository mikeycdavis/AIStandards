// The structural reader: YAML and JSON as parsed trees, with exact source positions.
//
// WHY THIS EXISTS. The lexical layer (source.mjs) separates code from strings and comments by
// reading characters. That is the right tool for source code, and the wrong one for a configuration
// file, whose meaning is its structure: which key owns which value, where a document ends, what an
// anchor names. Guessing that structure from indentation produced a series of repairs, and #104 was
// the last one allowed. This module reads the structure instead.
//
// WHAT IT IS NOT. It is a reader, not a detector. It decides nothing about prompts, safety controls
// or any rule; it returns a tree, and it returns a FAILURE as a value when it cannot. A file this
// module cannot read is file-scoped unknown, never a pass and never a finding, and there is no
// fallback to lexical scanning, because a guess made after the parser has refused is the guess the
// parser was introduced to stop making.
//
// SCOPE. `.yml`, `.yaml` and `.json`, matched case-insensitively on the file name. Nothing is sniffed
// from content. JSONC, JSON5, JSONL/NDJSON, templates, Markdown fences, notebooks, extensionless files
// and a file whose content does not match its extension are not claimed, and TOML stays on the frozen
// lexical layer. See isStructuralScope.
//
// THE TREE. YAML is parsed by the vendored `yaml` library (scripts/vendor/yaml, identity pinned in
// scripts/vendor/yaml.vendor.json). JSON is parsed by the strict tokenizer below, which is owned here
// because JSON.parse keeps the last of a duplicate key and loses the offsets this layer exists to
// provide. Both produce the SAME node shape, so a consumer reads one tree:
//
//   node = { kind: "map" | "seq" | "scalar" | "alias",
//            range: { start, end },                 UTF-16 offsets into `text`, end exclusive
//            anchor?: { name, offset },             YAML only; offset of the `&` (null if not recovered)
//            tag?: { source, offset },              YAML only; the tag as written
//            // map:    pairs: [{ key, value, merge, range }]  every occurrence, in source order
//            // seq:    items: [node | null]
//            // scalar: value (decoded string), length (code points), style, jsonType? }
//
// Aliases are NOT dereferenced and merge keys (`<<`) are NOT applied: an alias node is a reference
// and is reported, once, as evidence that it was present and not followed. Every scalar is a string;
// a plain `true` or `12` is the text "true" or "12", with no implicit type coercion.
//
// UNITS. `range` offsets index the JS string `text` (UTF-16 code units), so `text.slice(start, end)`
// is exactly the source. `line` is 1-based and counts LF as the break (a CR before it is part of the
// break). `column` is 1-based and counts Unicode code points from the start of the line. `length` is
// in Unicode code points of the DECODED value, which is the unit Standard 21's threshold is stated in.
// A UTF-8 byte order mark is removed before parsing; offsets are relative to the text without it, and
// `bom` records that it was there.
//
// RESOURCES. No size cap and no time limit is chosen here. The caller's existing read bound (which
// reports a truncated read as a failure rather than parsing the cut text) is the only limit in force.
// The parser is synchronous and cannot be interrupted; that is a recorded property, not a decision.

import {
  parseAllDocuments,
  isAlias,
  isMap,
  isScalar,
  isSeq,
} from "./vendor/yaml/browser/index.js";

export const STRUCTURAL_EXTENSIONS = Object.freeze([".yml", ".yaml", ".json"]);

/**
 * The single question "is this file read structurally?". Extension only, case-insensitive, on the
 * final path segment. A file whose name is only the extension (`.json`) has no extension, which is
 * how the lexical layer's extensionOf reads it too, so the two never disagree about a name.
 * Content is never consulted.
 */
export function isStructuralScope(filePath) {
  if (typeof filePath !== "string") return false;
  const base = filePath.replace(/\\/g, "/").split("/").pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return false;
  return STRUCTURAL_EXTENSIONS.includes(base.slice(dot).toLowerCase());
}

export function formatOf(filePath) {
  if (!isStructuralScope(filePath)) return null;
  return filePath.toLowerCase().endsWith(".json") ? "json" : "yaml";
}

/** Unicode code points in a string, without allocating an array. */
export function codePointLength(text) {
  let n = 0;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length) {
      const d = text.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) i += 1;
    }
    n += 1;
  }
  return n;
}

// Offsets to line and column, built once per file.
class LocationIndex {
  constructor(text) {
    this.text = text;
    this.lineStarts = [0];
    for (let i = text.indexOf("\n"); i !== -1; i = text.indexOf("\n", i + 1)) this.lineStarts.push(i + 1);
  }

  locate(offset) {
    const o = Math.max(0, Math.min(offset, this.text.length));
    let lo = 0;
    let hi = this.lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.lineStarts[mid] <= o) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, column: codePointLength(this.text.slice(this.lineStarts[lo], o)) + 1 };
  }
}

// --- Failure outcomes ---------------------------------------------------------------------------

// Every way a file in scope can fail to yield a tree. A failure is a value, never an exception that
// escapes: the caller decides what file-scoped unknown means for its rules.
export const FAILURE_REASONS = Object.freeze([
  "read-failure",       // the file could not be read
  "truncated",          // the read was cut at the byte bound, so the tail was never seen
  "utf-16",             // a UTF-16 byte order mark: not UTF-8, not read
  "invalid-utf-8",      // bytes that are not valid UTF-8 (a lossy decode would invent text)
  "control-character",  // a character the format does not allow outside an escape
  "lone-cr",            // a carriage return that is not part of CRLF (YAML line breaks are not ambiguous here)
  "syntax",             // the parser reported an error
  "empty-document",     // JSON only: a document must contain a value
  "undefined-alias",    // YAML: an alias whose anchor was never defined before it
  "parser-exception",   // the parser threw
]);

function failure(file, reason, extra = {}) {
  return { ok: false, file, reason, ...extra };
}

// --- Decoding -----------------------------------------------------------------------------------

const UTF8 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

/**
 * Bytes to text, strictly. Returns { text, bom } or a failure. A lossy decode is refused: replacing
 * invalid bytes with U+FFFD makes a binary or wrongly-encoded file look like readable text that
 * contains nothing, which is the shape of a false pass.
 */
export function decodeStrict(file, bytes) {
  if (bytes.length >= 2 && ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff))) {
    return failure(file, "utf-16", { offset: 0 });
  }
  let text;
  try {
    text = UTF8.decode(bytes);
  } catch {
    return failure(file, "invalid-utf-8");
  }
  const bom = text.charCodeAt(0) === 0xfeff;
  return { ok: true, text: bom ? text.slice(1) : text, bom };
}

// YAML 1.2 c-printable, as a "this is NOT allowed" test: C0 controls other than TAB, LF and CR;
// DEL; the C1 range except NEL; and the two non-characters at the end of the BMP. The vendored
// parser does not report these, so they are found here.
// eslint-disable-next-line no-control-regex
const YAML_FORBIDDEN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u0080-\u0084\u0086-\u009F￾￿]/;

function firstLoneCr(text) {
  for (let i = text.indexOf("\r"); i !== -1; i = text.indexOf("\r", i + 1)) {
    if (text[i + 1] !== "\n") return i;
  }
  return -1;
}

// --- JSON: the owned strict parser --------------------------------------------------------------

const HEX = /^[0-9A-Fa-f]{4}$/;
const NUMBER = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y;
const SIMPLE_ESCAPE = { "\"": "\"", "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" };

class JsonSyntax extends Error {
  constructor(code, offset) {
    super(code);
    this.code = code;
    this.offset = offset;
  }
}

/**
 * Strict RFC 8259 JSON, iterative (no recursion, so nesting depth is not a stack hazard). No comments,
 * no trailing commas, no single quotes, no bare words, no NaN, exactly one value and nothing after it.
 * Duplicate member names are all kept, in order.
 */
function parseJsonText(text) {
  const n = text.length;
  let i = 0;
  const skipWs = () => {
    while (i < n) {
      const c = text.charCodeAt(i);
      if (c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d) i += 1;
      else break;
    }
  };

  const readString = () => {
    const start = i;
    i += 1; // opening quote
    let out = "";
    let chunk = i;
    for (;;) {
      if (i >= n) throw new JsonSyntax("unterminated-string", start);
      const c = text.charCodeAt(i);
      if (c === 0x22) {
        out += text.slice(chunk, i);
        i += 1;
        return { value: out, start, end: i };
      }
      if (c < 0x20) throw new JsonSyntax("control-character-in-string", i);
      if (c === 0x5c) {
        out += text.slice(chunk, i);
        const e = text[i + 1];
        if (e === undefined) throw new JsonSyntax("unterminated-string", start);
        if (e === "u") {
          const hex = text.slice(i + 2, i + 6);
          if (!HEX.test(hex)) throw new JsonSyntax("bad-escape", i);
          out += String.fromCharCode(parseInt(hex, 16));
          i += 6;
        } else if (Object.hasOwn(SIMPLE_ESCAPE, e)) {
          out += SIMPLE_ESCAPE[e];
          i += 2;
        } else {
          throw new JsonSyntax("bad-escape", i);
        }
        chunk = i;
      } else {
        i += 1;
      }
    }
  };

  const scalarNode = (value, start, end, jsonType) => ({
    kind: "scalar",
    range: { start, end },
    value,
    length: codePointLength(value),
    style: jsonType === "string" ? "json-string" : "json-literal",
    jsonType,
  });

  let root = null;
  const stack = []; // open containers: { node, isMap, key }

  const attach = (node) => {
    const top = stack[stack.length - 1];
    if (!top) {
      root = node;
    } else if (top.isMap) {
      top.node.pairs.push({ key: top.key, value: node, merge: false, range: { start: top.key.range.start, end: node.range.end } });
      top.key = null;
    } else {
      top.node.items.push(node);
    }
  };

  // mode: "value" expects a value; "key" expects a member name; "after" expects , or a closer.
  let mode = "value";
  for (;;) {
    skipWs();
    if (mode === "after") {
      if (stack.length === 0) {
        if (i < n) throw new JsonSyntax("trailing-content", i);
        break;
      }
      const top = stack[stack.length - 1];
      const c = text[i];
      if (c === ",") {
        i += 1;
        mode = top.isMap ? "key" : "value";
      } else if ((c === "}" && top.isMap) || (c === "]" && !top.isMap)) {
        i += 1;
        stack.pop();
        top.node.range.end = i;
        attach(top.node);
      } else {
        throw new JsonSyntax(i >= n ? "unexpected-end" : "unexpected-token", i);
      }
      continue;
    }

    if (mode === "key") {
      if (text[i] !== "\"") throw new JsonSyntax(i >= n ? "unexpected-end" : "unexpected-token", i);
      const s = readString();
      skipWs();
      if (text[i] !== ":") throw new JsonSyntax(i >= n ? "unexpected-end" : "unexpected-token", i);
      i += 1;
      stack[stack.length - 1].key = scalarNode(s.value, s.start, s.end, "string");
      mode = "value";
      continue;
    }

    // mode === "value"
    if (i >= n) throw new JsonSyntax(root === null && stack.length === 0 ? "empty-document" : "unexpected-end", i);
    const c = text[i];
    if (c === "{" || c === "[") {
      const isMapNode = c === "{";
      const node = isMapNode
        ? { kind: "map", range: { start: i, end: i + 1 }, pairs: [] }
        : { kind: "seq", range: { start: i, end: i + 1 }, items: [] };
      i += 1;
      skipWs();
      if (text[i] === (isMapNode ? "}" : "]")) {
        i += 1;
        node.range.end = i;
        attach(node);
        mode = "after";
      } else {
        stack.push({ node, isMap: isMapNode, key: null });
        mode = isMapNode ? "key" : "value";
      }
    } else if (c === "\"") {
      const s = readString();
      attach(scalarNode(s.value, s.start, s.end, "string"));
      mode = "after";
    } else if (c === "-" || (c >= "0" && c <= "9")) {
      NUMBER.lastIndex = i;
      const m = NUMBER.exec(text);
      if (!m) throw new JsonSyntax("bad-number", i);
      attach(scalarNode(m[0], i, i + m[0].length, "number"));
      i += m[0].length;
      mode = "after";
    } else if (text.startsWith("true", i)) {
      attach(scalarNode("true", i, i + 4, "boolean"));
      i += 4;
      mode = "after";
    } else if (text.startsWith("false", i)) {
      attach(scalarNode("false", i, i + 5, "boolean"));
      i += 5;
      mode = "after";
    } else if (text.startsWith("null", i)) {
      attach(scalarNode("null", i, i + 4, "null"));
      i += 4;
      mode = "after";
    } else {
      throw new JsonSyntax("unexpected-token", i);
    }
  }
  return root;
}

function readJson(file, text) {
  let root;
  try {
    root = parseJsonText(text);
  } catch (error) {
    if (error instanceof JsonSyntax) {
      const reason = error.code === "empty-document" ? "empty-document" : "syntax";
      return failure(file, reason, { code: error.code, offset: error.offset });
    }
    return failure(file, "parser-exception", { code: error?.name ?? "Error" });
  }
  return { documents: [{ index: 0, range: { start: 0, end: text.length }, explicitStart: false, root }], aliases: [], merges: [], warnings: [] };
}

// --- YAML: the vendored parser, adapted to the same node shape ----------------------------------

const YAML_STYLE = {
  PLAIN: "plain",
  QUOTE_DOUBLE: "double-quoted",
  QUOTE_SINGLE: "single-quoted",
  BLOCK_LITERAL: "block-literal",
  BLOCK_FOLDED: "block-folded",
};

const isWs = (c) => c === " " || c === "\t" || c === "\n" || c === "\r";

// The `&anchor` and `!tag` that decorate a node sit immediately before it, separated by blanks. The
// parser reports the name and the resolved tag but not where they were written, and the position is
// the evidence, so it is recovered by reading backwards from the node's start and checked against
// the name the parser reported. A property that cannot be matched keeps its name and has offset null:
// absent evidence is stated, not guessed.
function propsBefore(text, start, anchorName, hasTag) {
  let anchor = null;
  let tag = null;
  let pos = start;
  for (let guard = 0; guard < 8 && (anchorName !== null && anchor === null || hasTag && tag === null); guard += 1) {
    let end = pos;
    while (end > 0 && isWs(text[end - 1])) end -= 1;
    let begin = end;
    while (begin > 0 && !isWs(text[begin - 1])) begin -= 1;
    if (begin === end) break;
    const word = text.slice(begin, end);
    if (word[0] === "&" && anchorName !== null && anchor === null && word === `&${anchorName}`) {
      anchor = { name: anchorName, offset: begin };
    } else if (word[0] === "!" && hasTag && tag === null) {
      tag = { source: word, offset: begin };
    } else {
      break;
    }
    pos = begin;
  }
  return { anchor: anchor ?? (anchorName !== null ? { name: anchorName, offset: null } : null), tag };
}

function readYaml(file, text, index) {
  const lone = firstLoneCr(text);
  if (lone !== -1) return failure(file, "lone-cr", { offset: lone });
  const forbidden = YAML_FORBIDDEN.exec(text);
  if (forbidden) return failure(file, "control-character", { offset: forbidden.index });

  let parsed;
  try {
    // uniqueKeys:false keeps every duplicate occurrence (a duplicate is evidence, not an error);
    // prettyErrors:false keeps the parser's message, which can quote file text, out of anything
    // this module returns; only its error code and position are used.
    parsed = parseAllDocuments(text, { uniqueKeys: false, prettyErrors: false });
  } catch (error) {
    return failure(file, "parser-exception", { code: error?.name ?? "Error" });
  }
  const docs = Array.isArray(parsed) ? parsed : [parsed];

  let firstError = null;
  docs.forEach((doc, documentIndex) => {
    for (const e of doc.errors) {
      const offset = Array.isArray(e.pos) ? e.pos[0] : 0;
      if (firstError === null || offset < firstError.offset) firstError = { code: e.code, offset, documentIndex };
    }
  });
  if (firstError !== null) return failure(file, "syntax", firstError);

  const aliases = [];
  const merges = [];
  const warnings = [];
  const documents = [];
  let anchorCount = 0;
  let tagCount = 0;

  for (let d = 0; d < docs.length; d += 1) {
    const doc = docs[d];
    for (const w of doc.warnings) warnings.push({ code: w.code, offset: Array.isArray(w.pos) ? w.pos[0] : 0, documentIndex: d });
    const defined = new Set();
    let undefinedAlias = null;

    const convert = (n) => {
      if (n === null || n === undefined) return null;
      const [start, , end] = n.range ?? [0, 0, 0];
      if (isAlias(n)) {
        const node = { kind: "alias", range: { start, end: Math.max(start, n.range?.[1] ?? end) }, name: n.source };
        aliases.push({ documentIndex: d, name: n.source, offset: start });
        if (!defined.has(n.source) && undefinedAlias === null) undefinedAlias = { code: n.source, offset: start, documentIndex: d };
        return node;
      }
      const anchorName = typeof n.anchor === "string" && n.anchor !== "" ? n.anchor : null;
      const hasTag = typeof n.tag === "string" && n.tag !== "";
      const { anchor, tag } = propsBefore(text, start, anchorName, hasTag);
      if (anchor) {
        defined.add(anchor.name);
        anchorCount += 1;
      }
      if (tag || hasTag) tagCount += 1;
      const withProps = (node) => {
        if (anchor) node.anchor = anchor;
        if (tag) node.tag = tag;
        else if (hasTag) node.tag = { source: n.tag, offset: null };
        return node;
      };
      if (isMap(n)) {
        const node = withProps({ kind: "map", range: { start, end }, pairs: [] });
        for (const p of n.items) {
          const key = convert(p.key);
          const merge = key !== null && key.kind === "scalar" && key.style === "plain" && key.value === "<<" && key.tag === undefined;
          const value = convert(p.value);
          if (merge) merges.push({ documentIndex: d, offset: key.range.start });
          const rs = key ? key.range.start : value ? value.range.start : start;
          const re = value ? value.range.end : key ? key.range.end : end;
          node.pairs.push({ key, value, merge, range: { start: rs, end: re } });
        }
        return node;
      }
      if (isSeq(n)) {
        const node = withProps({ kind: "seq", range: { start, end }, items: [] });
        for (const item of n.items) node.items.push(convert(item));
        return node;
      }
      if (isScalar(n)) {
        // `source` is the decoded text for every style (escapes resolved, lines folded, chomping
        // applied); `value` is the schema's coerced value and is never used. Empty nodes have none.
        const value = typeof n.source === "string" ? n.source : "";
        const style = YAML_STYLE[n.type] ?? "plain";
        return withProps({
          kind: "scalar",
          range: { start, end: Math.max(start, n.range?.[1] ?? end) },
          value,
          length: codePointLength(value),
          style: value === "" && start === (n.range?.[1] ?? start) ? "empty" : style,
        });
      }
      return null;
    };

    let root;
    try {
      root = convert(doc.contents);
    } catch (error) {
      return failure(file, "parser-exception", { code: error?.name ?? "Error", documentIndex: d });
    }
    if (undefinedAlias !== null) return failure(file, "undefined-alias", undefinedAlias);
    const r = doc.range ?? [0, 0, 0];
    documents.push({
      index: d,
      range: { start: r[0], end: r[2] ?? r[1] },
      explicitStart: Boolean(doc.directives?.docStart),
      root,
    });
  }
  return { documents, aliases, merges, warnings, counts: { anchors: anchorCount, tags: tagCount } };
}

// --- Entry points -------------------------------------------------------------------------------

/**
 * Parse already-decoded text. `format` is "yaml" or "json". Returns either
 *   { ok: true, file, format, text, bom, documents, aliases, merges, warnings, locate(offset) }
 * or { ok: false, file, reason, ... } with reason one of FAILURE_REASONS.
 */
export function parseStructuralText(file, text, format, { bom = false } = {}) {
  const outcome = format === "json" ? readJson(file, text) : readYaml(file, text);
  if (outcome.ok === false) return finishFailure(outcome, text);
  const index = new LocationIndex(text);
  return {
    ok: true,
    file,
    format,
    text,
    bom,
    documents: outcome.documents,
    aliases: outcome.aliases,
    merges: outcome.merges,
    warnings: outcome.warnings,
    counts: outcome.counts ?? { anchors: 0, tags: 0 },
    locate: (offset) => index.locate(offset),
  };
}

function finishFailure(outcome, text) {
  if (typeof outcome.offset === "number" && text !== undefined) {
    const where = new LocationIndex(text).locate(outcome.offset);
    return { ...outcome, line: where.line, column: where.column };
  }
  return outcome;
}

/**
 * Parse a file's bytes. `truncated` is the caller's report that `bytes` is a cut of a larger file; a
 * cut file is refused outright rather than parsed, because the tail it lost may hold anything.
 */
export function parseStructuralBytes(file, bytes, { truncated = false } = {}) {
  const format = formatOf(file);
  if (format === null) return failure(file, "syntax", { code: "out-of-scope" });
  if (truncated) return failure(file, "truncated");
  const decoded = decodeStrict(file, bytes);
  if (decoded.ok === false) return decoded;
  return parseStructuralText(file, decoded.text, format, { bom: decoded.bom });
}

// --- Tree helpers consumers share ---------------------------------------------------------------

/**
 * Visit every node in source order: a parent before its children, a map's key before its value.
 * Iterative, so depth is not a stack hazard. `frame` links to the parent's frame and says how this
 * node was reached ({ key, role } inside a map, { index } inside a sequence); pathOf() flattens it.
 */
export function walk(root, visit) {
  if (root === null || root === undefined) return;
  const pending = [{ node: root, frame: { parent: null } }];
  while (pending.length > 0) {
    const { node, frame } = pending.pop();
    visit(node, frame);
    const children = [];
    if (node.kind === "map") {
      for (const pair of node.pairs) {
        const label = pair.key && pair.key.kind === "scalar" ? pair.key.value : null;
        if (pair.key) children.push({ node: pair.key, frame: { parent: frame, key: label, role: "key" } });
        if (pair.value) children.push({ node: pair.value, frame: { parent: frame, key: label, role: "value" } });
      }
    } else if (node.kind === "seq") {
      node.items.forEach((item, index) => {
        if (item) children.push({ node: item, frame: { parent: frame, index } });
      });
    }
    for (let k = children.length - 1; k >= 0; k -= 1) pending.push(children[k]);
  }
}

/** The path from the document root to a frame, as an array of { key, role } and { index } steps. */
export function pathOf(frame) {
  const steps = [];
  for (let f = frame; f && f.parent !== null; f = f.parent) {
    steps.push(f.index !== undefined ? { index: f.index } : { key: f.key, role: f.role });
  }
  return steps.reverse();
}
