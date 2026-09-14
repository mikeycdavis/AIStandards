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

/**
 * Split source text into the parts a detector may treat as usage, and the parts it must not.
 *
 * @returns {{code: string, comments: string, strings: string, withoutComments: string, usable: boolean}}
 *   `usable` is false for a file whose syntax is unknown, so a caller can withdraw rather than
 *   scan it with the wrong rules. An unknown file is not an empty file.
 *
 *   `withoutComments` is the whole text with every comment blanked to spaces IN PLACE (line breaks
 *   kept), and code, string and regular-expression literals left where they were written. The
 *   partitions lose adjacency: `code` has a hole where each literal was, and `strings` has no
 *   record of what preceded it. A caller that needs a key and the literal assigned to it to stay
 *   next to each other must search this view, not a concatenation of the partitions.
 */
export function splitSource(text, filePath) {
  const kind = BY_EXTENSION.get(extensionOf(filePath));
  if (!kind) return { code: "", comments: "", strings: "", withoutComments: "", usable: false };

  const syntax = SYNTAX[kind];
  const code = [];
  const comments = [];
  const strings = [];
  const inPlace = [];
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

  while (i < n) {
    let matched = false;

    for (const [open, close] of syntax.block) {
      if (text.startsWith(open, i)) {
        const end = text.indexOf(close, i + open.length);
        const stop = end === -1 ? n : end + close.length;
        comments.push(text.slice(i, stop));
        inPlace.push(blank(text.slice(i, stop)));
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
        i = end;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const ch = text[i];

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
          i = j;
          regexAllowed = false;
          continue;
        }
      }
    }

    code.push(ch);
    inPlace.push(ch);
    if (!/\s/.test(ch)) regexAllowed = !/[A-Za-z0-9_$)\]]/.test(ch);
    i += 1;
  }

  return {
    code: code.join(""),
    comments: comments.join("\n"),
    strings: strings.join("\n"),
    withoutComments: inPlace.join(""),
    usable: true,
  };
}
