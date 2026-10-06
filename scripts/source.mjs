// The use/mention split.
//
// WHY THIS EXISTS. A repository that documents prompt injection, names a floating model alias in a
// README, or explains why disabling a safety setting is dangerous, must not be reported as doing
// those things. Naming a technology is not using it, and a detector that cannot tell the difference
// produces false positives on exactly the repositories that are being careful — which is how a rule
// gets switched off.
//
// This is a lexical split, not a parse. It separates code positions from comments, string literals
// and regular-expression literals, using the comment syntax the file extension implies. Getting the
// syntax wrong corrupts the split: `//` opens a comment in JavaScript and is floor division in
// Python, so a Python file scanned with JavaScript rules loses everything after the first `//`.

const SYNTAX = {
  // line comment, block open, block close, string delimiters, supports regex literals
  c: { line: ["//"], block: [["/*", "*/"]], strings: ["\"", "'", "`"], regex: true },
  hash: { line: ["#"], block: [], strings: ["\"", "'"], regex: false },
  sql: { line: ["--"], block: [["/*", "*/"]], strings: ["'"], regex: false },
  none: { line: [], block: [], strings: ["\"", "'"], regex: false },
};

const BY_EXTENSION = new Map(Object.entries({
  ".js": "c", ".mjs": "c", ".cjs": "c", ".jsx": "c",
  ".ts": "c", ".mts": "c", ".cts": "c", ".tsx": "c",
  ".java": "c", ".c": "c", ".h": "c", ".cc": "c", ".cpp": "c", ".hpp": "c",
  ".cs": "c", ".go": "c", ".rs": "c", ".swift": "c", ".kt": "c", ".scala": "c", ".php": "c",
  ".py": "hash", ".rb": "hash", ".sh": "hash", ".bash": "hash", ".zsh": "hash",
  ".yml": "hash", ".yaml": "hash", ".toml": "hash", ".r": "hash", ".pl": "hash", ".ps1": "hash",
  ".sql": "sql",
  ".json": "none",
}));

/** True when the extension is one whose source can be split. Markdown and prose are not code. */
export function isCode(filePath) {
  const ext = extensionOf(filePath);
  return BY_EXTENSION.has(ext);
}

export function extensionOf(filePath) {
  const base = filePath.replace(/\\/g, "/").split("/").pop() ?? "";
  const dot = base.lastIndexOf(".");
  return dot <= 0 ? "" : base.slice(dot).toLowerCase();
}

// A YAML block-scalar header ends its line with `|` or `>`, optional chomping (`+`/`-`) and indentation
// (`1`-`9`) indicators in either order, optionally behind an anchor or tag and a trailing comment, and
// follows `:` or a `-` sequence marker (or opens the line).
const BLOCK_HEADER = /(?:^|[:-]\s+)(?:[&!]\S*\s+)*[|>](?:[+-][1-9]?|[1-9][+-]?)?[ \t]*(?:#.*)?$/;

// If the line that ends at `newline` is a block-scalar header, return the offset of the newline that ends
// the scalar's content (the last non-blank content line); otherwise return `newline`. The content is every
// following line that is blank or indented at least as deep as the first non-blank line, and that first
// line must be indented deeper than the node that owns the header (so an empty scalar, `key: |` followed
// by a dedented key, has no content). It ends by dedent, never by what a line says.
function yamlBlockScalarEnd(text, newline) {
  const lineStart = text.lastIndexOf("\n", newline - 1) + 1;
  const header = text.slice(lineStart, newline).replace(/\r$/, "");
  if (!BLOCK_HEADER.test(header) || /^\s*#/.test(header)) return newline;
  // An unclosed quote before the indicator means the `|` sits inside a string, not after a key.
  const indicator = header.search(/[|>][+\-1-9 \t]*(?:#.*)?$/);
  const before = header.slice(0, indicator).replace(/\\./g, "");
  if ((before.match(/"/g) || []).length % 2 || (before.match(/'/g) || []).length % 2) return newline;
  // A `#` after whitespace before the indicator opens a comment, and the indicator is inside it.
  if (/\s#/.test(before)) return newline;

  const indentOf = (line) => /^ */.exec(line)[0].length;
  // The owning node's column: the key's own when the header follows `- key:` (the key may be quoted; that
  // is what makes an explicit indentation indicator count from the key and not from the dash), else the
  // line's indentation.
  const marker = /^ *(?:- +)+(?=(?:"(?:[^"\\]|\\.)*"|'(?:[^']|'')*')[ \t]*: |[^\s#"'[\]{}|>&!-][^#]*: )/.exec(header);
  const parent = marker ? marker[0].length : indentOf(header);
  const explicit = /[1-9]/.exec(header.slice(indicator));

  let contentIndent = explicit ? parent + Number(explicit[0]) : -1;
  let end = newline;
  let pos = newline + 1;
  while (pos <= text.length) {
    let next = text.indexOf("\n", pos);
    if (next === -1) next = text.length;
    const line = text.slice(pos, next).replace(/\r$/, "");
    if (line.trim() !== "") {
      const depth = indentOf(line);
      if (contentIndent === -1) {
        if (depth <= parent) break;
        contentIndent = depth;
      } else if (depth < contentIndent) {
        break;
      }
      end = next;
    }
    if (next >= text.length) break;
    pos = next + 1;
  }
  return end;
}

/**
 * Split source text into the parts a detector may treat as usage, and the parts it must not.
 *
 * @returns {{code: string, comments: string, strings: string, withoutComments: string, usable: boolean}}
 *   `usable` is false for a file whose syntax is unknown, so a caller can withdraw rather than
 *   scan it with the wrong rules. An unknown file is not an empty file.
 *
 *   `withoutComments` is the whole text with every comment blanked to spaces IN PLACE (line breaks
 *   kept), and code, string and regular-expression literals left where they were written.
 *
 *   `codeOnly` is the same in-place view with string and regular-expression literals blanked too
 *   (a string keeps only its opening delimiter; a string literal in property-NAME position, such as
 *   `"system"` in `{"system": "..."}`, is kept whole), so an index into it is an index into the original
 *   text AND is known to sit in a code position. A caller that must confirm a match begins in code,
 *   not in a comment or a quoted mention, searches this view and measures in the original.
 *
 *   The partitions lose adjacency: `code` has a hole where each literal was, and `strings` has no
 *   record of what preceded it. A caller that needs a key and the literal assigned to it to stay
 *   next to each other must search this view, not a concatenation of the partitions.
 */
export function splitSource(text, filePath) {
  const kind = BY_EXTENSION.get(extensionOf(filePath));
  if (!kind) return { code: "", comments: "", strings: "", withoutComments: "", codeOnly: "", usable: false };

  const syntax = SYNTAX[kind];
  const code = [];
  const comments = [];
  const strings = [];
  const inPlace = [];
  const codeOnly = [];
  const isYaml = [".yml", ".yaml"].includes(extensionOf(filePath));
  const blank = (s) => s.replace(/[^\r\n]/g, " ");

  let i = 0;
  const n = text.length;

  // Tracks whether a `/` could open a regex literal rather than divide. A regex may follow an
  // operator or an opening bracket, never an identifier or a closing bracket.
  let regexAllowed = true;

  const lastSignificant = () => {
    for (let k = code.length - 1; k >= 0; k -= 1) {
      const ch = code[k];
      if (!/\s/.test(ch)) return ch;
    }
    return "";
  };

  // A string literal in KEY position keeps its text in the code-only view: `{"system": "..."}`. Three
  // things must all hold, so that only a property NAME is preserved and never a value or a mention:
  //   - the literal is terminated by its own quote and its body is a plain identifier, so a key whose
  //     text merely contains `system: '...'` stays blanked and `x-system` never reads as `system`;
  //   - the next non-blank character is `:` (or `=`, not `==`, for the `hash` syntaxes, where TOML
  //     writes `"system" = ...`);
  //   - it opens a mapping entry: the previous code character is `{` or `,`, or, in the `hash`
  //     syntaxes, the literal begins its line (a YAML or TOML key) or, in YAML only, follows `- `
  //     sequence markers on its own line (`- "system": ...`, a list of mappings). A ternary branch `c ? "a" : b`
  //     follows `?` and is a value.
  const isQuotedKey = (start, end, quote) => {
    if (quote === "`" || end - start < 3 || text[end - 1] !== quote) return false;
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(text.slice(start + 1, end - 1))) return false;
    let k = end;
    while (k < n && /[ \t\r\n]/.test(text[k])) k += 1;
    const separator = text[k] === ":" || (kind === "hash" && text[k] === "=" && text[k + 1] !== "=");
    if (!separator) return false;
    const prev = lastSignificant();
    if (prev === "{" || prev === ",") return true;
    if (kind !== "hash") return false;
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const before = text.slice(lineStart, start);
    return before.trim() === "" || (isYaml && /^\s*(-\s+)+$/.test(before));
  };

  while (i < n) {
    let matched = false;

    for (const [open, close] of syntax.block) {
      if (text.startsWith(open, i)) {
        const end = text.indexOf(close, i + open.length);
        const stop = end === -1 ? n : end + close.length;
        comments.push(text.slice(i, stop));
        inPlace.push(blank(text.slice(i, stop)));
        codeOnly.push(blank(text.slice(i, stop)));
        i = stop;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    for (const marker of syntax.line) {
      if (text.startsWith(marker, i)) {
        let end = text.indexOf("\n", i);
        if (end === -1) end = n;
        comments.push(text.slice(i, end));
        inPlace.push(blank(text.slice(i, end)));
        codeOnly.push(blank(text.slice(i, end)));
        i = end;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const ch = text[i];

    // The lines after a YAML block-scalar header (`key: |`, `- >-`) are string data, however much they
    // look like keys, sequence items, quotes or comments. The whole extent is one string: kept in the
    // string and in-place views, blank in the code-only view, so no key inside it is ever recognised.
    if (isYaml && ch === "\n") {
      const stop = yamlBlockScalarEnd(text, i);
      if (stop > i + 1) {
        strings.push(text.slice(i + 1, stop));
        inPlace.push(text.slice(i, stop));
        codeOnly.push(text[i] + blank(text.slice(i + 1, stop)));
        i = stop;
        continue;
      }
    }

    if (syntax.strings.includes(ch)) {
      const quote = ch;
      let j = i + 1;
      while (j < n) {
        if (text[j] === "\\") { j += 2; continue; }
        if (text[j] === quote) { j += 1; break; }
        // A newline terminates a non-template string; without this an unterminated quote would
        // swallow the rest of the file and hide every subsequent finding.
        if (text[j] === "\n" && quote !== "`") { break; }
        j += 1;
      }
      strings.push(text.slice(i, Math.min(j, n)));
      inPlace.push(text.slice(i, Math.min(j, n)));
      codeOnly.push(isQuotedKey(i, j, quote) ? text.slice(i, j) : text[i] + blank(text.slice(i + 1, Math.min(j, n))));
      i = Math.min(j, n);
      regexAllowed = false;
      continue;
    }

    if (syntax.regex && ch === "/") {
      const prev = lastSignificant();
      const canOpen = regexAllowed || prev === "" || "(,=:[!&|?{};+-*%~^".includes(prev);
      if (canOpen) {
        let j = i + 1;
        let closed = false;
        let inClass = false;
        while (j < n) {
          if (text[j] === "\\") { j += 2; continue; }
          if (text[j] === "[") inClass = true;
          else if (text[j] === "]") inClass = false;
          else if (text[j] === "\n") break;
          else if (text[j] === "/" && !inClass) { j += 1; closed = true; break; }
          j += 1;
        }
        if (closed) {
          while (j < n && /[a-z]/.test(text[j])) j += 1; // flags
          strings.push(text.slice(i, j));
          inPlace.push(text.slice(i, j));
          codeOnly.push(blank(text.slice(i, j)));
          i = j;
          regexAllowed = false;
          continue;
        }
      }
    }

    code.push(ch);
    inPlace.push(ch);
    codeOnly.push(ch);
    if (!/\s/.test(ch)) regexAllowed = !/[A-Za-z0-9_$)\]]/.test(ch);
    i += 1;
  }

  return {
    code: code.join(""),
    comments: comments.join("\n"),
    strings: strings.join("\n"),
    withoutComments: inPlace.join(""),
    codeOnly: codeOnly.join(""),
    usable: true,
  };
}
