// A deliberately small YAML subset parser.
//
// WHY THIS EXISTS. This repository has no third-party dependencies, and a policy file is the
// document that decides what a verdict means. Parsing it with a library would be one dependency;
// parsing it with a permissive hand-rolled parser would be worse, because a permissive parser
// guesses, and a guess about a policy is a guess about a verdict.
//
// SO THIS PARSER REFUSES RATHER THAN GUESSES. Every construct it does not implement raises a
// YamlError naming the line. Block scalars (`|` and `>`), anchors, aliases, tags, flow mappings and
// multi-document streams are all refused explicitly. A policy that needs them is a policy this
// parser must be extended for, deliberately — not one it silently mis-reads.
//
// What it supports, which is all a policy needs: nested block mappings, block sequences, plain and
// quoted scalars, integers, floats, booleans, null, and comments.

export class YamlError extends Error {
  constructor(message, line) {
    super(line == null ? message : `line ${line}: ${message}`);
    this.name = "YamlError";
    this.line = line ?? null;
  }
}

// Constructs that exist in YAML and are not implemented here. Each is refused by name so the
// failure says what was found rather than producing a wrong value.
const REFUSED = [
  [/^\s*[|>][-+0-9]*\s*$/, "block scalars (| and >) are not supported; use a quoted scalar"],
  [/^\s*&\S+/, "anchors (&name) are not supported"],
  [/^\s*\*\S+/, "aliases (*name) are not supported"],
  [/^\s*!!?\S+/, "tags (!tag) are not supported"],
  [/^---\s*$/, "multi-document streams (---) are not supported"],
  [/^\.\.\.\s*$/, "document end markers (...) are not supported"],
];

function refuseUnsupported(raw, lineNo) {
  for (const [pattern, why] of REFUSED) {
    if (pattern.test(raw)) throw new YamlError(why, lineNo);
  }
}

// Strip a trailing comment, but only when the `#` is not inside quotes. A `#` inside a quoted
// scalar is data.
function stripComment(text) {
  let quote = null;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\" && quote === '"') i += 1;
      else if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "#" && (i === 0 || /\s/.test(text[i - 1]))) {
      return text.slice(0, i);
    }
  }
  return text;
}

function parseScalar(text, lineNo) {
  const value = text.trim();
  if (value === "") return null;

  if (value.startsWith('"')) {
    if (!value.endsWith('"') || value.length < 2) {
      throw new YamlError("unterminated double-quoted scalar", lineNo);
    }
    return value
      .slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'") || value.length < 2) {
      throw new YamlError("unterminated single-quoted scalar", lineNo);
    }
    return value.slice(1, -1).replace(/''/g, "'");
  }

  if (value.startsWith("{") || value.startsWith("[")) {
    // Flow collections are refused rather than parsed. `[]` and `{}` are the only exceptions,
    // because an empty collection has exactly one meaning and cannot be mis-read.
    if (value === "[]") return [];
    if (value === "{}") return {};
    throw new YamlError("flow collections are not supported; use block syntax", lineNo);
  }

  if (value === "null" || value === "~") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+$/.test(value)) return Number.parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return Number.parseFloat(value);
  return value;
}

// Split `key: value` at the first colon that is not inside quotes.
function splitKey(text, lineNo) {
  let quote = null;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\" && quote === '"') i += 1;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === ":" && (i + 1 === text.length || /[\s]/.test(text[i + 1]))) {
      return { key: parseScalar(text.slice(0, i), lineNo), rest: text.slice(i + 1) };
    }
  }
  return null;
}

/**
 * Parse a YAML subset into plain JavaScript values.
 * @param {string} text
 * @returns {unknown} the parsed document, or null for an empty one.
 */
export function parseYaml(text) {
  if (typeof text !== "string") throw new YamlError("expected a string to parse");

  // Tabs are never valid YAML indentation, and a tab that reaches the indentation counter would
  // silently produce the wrong nesting.
  const lines = [];
  text.split(/\r\n|\r|\n/).forEach((raw, index) => {
    const lineNo = index + 1;
    if (/^\s*$/.test(raw)) return;
    if (/^\s*#/.test(raw)) return;
    refuseUnsupported(raw, lineNo);
    const body = stripComment(raw);
    if (/^\s*$/.test(body)) return;
    const indentMatch = /^[ \t]*/.exec(body)[0];
    if (indentMatch.includes("\t")) {
      throw new YamlError("tab used for indentation; YAML indentation must be spaces", lineNo);
    }
    lines.push({ indent: indentMatch.length, body: body.trimEnd(), lineNo });
  });

  if (lines.length === 0) return null;

  let cursor = 0;

  function parseBlock(indent) {
    if (cursor >= lines.length) return null;
    return lines[cursor].body.trimStart().startsWith("- ") ||
      lines[cursor].body.trim() === "-"
      ? parseSequence(indent)
      : parseMapping(indent);
  }

  function parseSequence(indent) {
    const out = [];
    while (cursor < lines.length) {
      const line = lines[cursor];
      if (line.indent < indent) break;
      if (line.indent > indent) {
        throw new YamlError("unexpected indentation inside a sequence", line.lineNo);
      }
      const trimmed = line.body.trimStart();
      if (!trimmed.startsWith("- ") && trimmed !== "-") break;

      const inline = trimmed === "-" ? "" : trimmed.slice(2);
      cursor += 1;

      if (inline.trim() === "") {
        const nested = cursor < lines.length && lines[cursor].indent > indent
          ? parseBlock(lines[cursor].indent)
          : null;
        out.push(nested);
        continue;
      }

      const pair = splitKey(inline, line.lineNo);
      if (pair) {
        // `- key: value` opens a mapping whose first key sits on the dash line. Its remaining
        // members line up with that first key, which is two columns past the dash — `indent`
        // already counts the leading whitespace, so only the "- " is added.
        const memberIndent = indent + 2;
        const item = {};
        item[pair.key] = pair.rest.trim() === ""
          ? (cursor < lines.length && lines[cursor].indent > indent
            ? parseBlock(lines[cursor].indent)
            : null)
          : parseScalar(pair.rest, line.lineNo);
        while (cursor < lines.length && lines[cursor].indent === memberIndent) {
          const memberLine = lines[cursor];
          const memberPair = splitKey(memberLine.body.trimStart(), memberLine.lineNo);
          if (!memberPair) break;
          cursor += 1;
          item[memberPair.key] = memberPair.rest.trim() === ""
            ? (cursor < lines.length && lines[cursor].indent > memberIndent
              ? parseBlock(lines[cursor].indent)
              : null)
            : parseScalar(memberPair.rest, memberLine.lineNo);
        }
        out.push(item);
        continue;
      }

      out.push(parseScalar(inline, line.lineNo));
    }
    return out;
  }

  function parseMapping(indent) {
    const out = {};
    while (cursor < lines.length) {
      const line = lines[cursor];
      if (line.indent < indent) break;
      if (line.indent > indent) {
        throw new YamlError("unexpected indentation inside a mapping", line.lineNo);
      }
      const trimmed = line.body.trimStart();
      if (trimmed.startsWith("- ")) break;

      const pair = splitKey(trimmed, line.lineNo);
      if (!pair) throw new YamlError(`expected "key: value", found ${JSON.stringify(trimmed)}`, line.lineNo);
      if (Object.prototype.hasOwnProperty.call(out, pair.key)) {
        // A duplicate key in a policy silently discards one of two declarations. Refuse.
        throw new YamlError(`duplicate key ${JSON.stringify(pair.key)}`, line.lineNo);
      }
      cursor += 1;

      if (pair.rest.trim() === "") {
        out[pair.key] = cursor < lines.length && lines[cursor].indent > indent
          ? parseBlock(lines[cursor].indent)
          : null;
      } else {
        out[pair.key] = parseScalar(pair.rest, line.lineNo);
      }
    }
    return out;
  }

  const result = parseBlock(lines[0].indent);
  if (cursor < lines.length) {
    throw new YamlError("trailing content could not be parsed", lines[cursor].lineNo);
  }
  return result;
}
