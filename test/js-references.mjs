import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Reading JavaScript source for module references and property-setting calls, shared by the vendor
// isolation guard (vendor-yaml.test.mjs) and the repository-wide invariant-4 scan (no-phase-creep.test.mjs).
// Nothing here matches call arguments or import clauses with a regular expression over text: the source is
// tokenized (comments dropped, escapes decoded, string / template / regex literals kept whole) and calls
// are read with a balanced-delimiter argument extractor. Every ambiguity is resolved toward DETECTING.

// Property names that make an element fetch a resource when set (see ASSIGNMENT_FORMS in the vendor test).
export const RESOURCE_PROPS = ["src", "href", "action", "data", "poster", "formAction", "srcset"];

const REGEX_KEYWORDS = new Set(["return", "typeof", "case", "do", "else", "in", "of", "void", "delete", "throw", "new", "yield", "await", "instanceof"]);

// Whether the `)` that ends `before` closes the head of `if`, `while`, `for` or `with`: the statement
// after it begins an expression, so a slash there starts a regex, not a division. An unmatched `)` is
// ambiguous and is also read as a regex (toward detecting).
function closesControlHead(before) {
  let depth = 0;
  for (let k = before.length - 1; k >= 0; k -= 1) {
    if (before[k] === ")") depth += 1;
    else if (before[k] === "(") {
      depth -= 1;
      if (depth === 0) {
        const head = /([A-Za-z_$][\w$]*)\s*$/.exec(before.slice(0, k));
        return head !== null && ["if", "while", "for", "with"].includes(head[1]);
      }
    }
  }
  return true;
}

export function stripComments(source, keepStrings = false) {
  // Scans `source` as code from `start`. Inside a template literal's `${ ... }` the scan recurses, so an
  // interpolation is CODE (its imports are found, nested templates and comments inside it are handled)
  // and only the literal text segments of a template are blanked.
  function scan(start, inInterpolation) {
    let out = "";
    let i = start;
    let depth = 0;
    const n = source.length;
    while (i < n) {
      const c = source[i];
      const d = source[i + 1];
      if (c === "/" && d === "/") {
        while (i < n && source[i] !== "\n") i += 1;
      } else if (c === "/" && d === "*") {
        i += 2;
        while (i < n && !(source[i] === "*" && source[i + 1] === "/")) i += 1;
        i += 2;
        out += " ";
      } else if (c === "/") {
        // Regex literal or division? A slash after an identifier, number, `)` or `]` is division; after a
        // keyword such as `return`, after an operator or opener (`( , = : ? ! & | ; [ {`), after `}` or at
        // the start of an expression it is a regex. The only genuinely ambiguous case is `}` (a block
        // end or an object literal end), and every ambiguity is resolved toward DETECTING: a regex body
        // is not blanked (it is copied through, never rescanned, so braces and quotes inside it can neither
        // end an interpolation nor open a string). A mis-read costs a false positive, never a missed
        // import.
        const before = out.trimEnd();
        const last = before[before.length - 1];
        let regex;
        if (last === undefined) regex = true;
        else if (last === ")") regex = closesControlHead(before);
        else if (last === "]") regex = false;
        else if (/[\w$]/.test(last)) regex = REGEX_KEYWORDS.has(/[\w$]+$/.exec(before)[0]);
        else regex = true;
        let j = i + 1;
        let closed = false;
        if (regex) {
          let inClass = false;
          while (j < n && source[j] !== "\n") {
            const ch = source[j];
            if (ch === "\\") {
              j += 2;
              continue;
            }
            if (ch === "[") inClass = true;
            else if (ch === "]") inClass = false;
            else if (ch === "/" && !inClass) {
              closed = true;
              break;
            }
            j += 1;
          }
        }
        if (regex && closed) {
          out += source.slice(i, j + 1);
          i = j + 1;
        } else {
          out += c;
          i += 1;
        }
      } else if (c === "`") {
        out += c;
        i += 1;
        while (i < n && source[i] !== "`") {
          if (source[i] === "\\") {
            out += "  ";
            i += 2;
          } else if (source[i] === "$" && source[i + 1] === "{") {
            out += "${";
            const inner = scan(i + 2, true);
            out += inner.out;
            i = inner.next;
            out += "}";
          } else {
            out += keepStrings ? source[i] : " ";
            i += 1;
          }
        }
        if (i < n) out += "`";
        i += 1;
      } else if (c === "'" || c === "\"") {
        // A string is kept only where it can be a module specifier (after `from`, `import` or
        // `import(` / `require(`); any other string is blanked so text inside it is never read as code.
        const keep = keepStrings || /(?:\bfrom|\bimport|\b(?:import|require)\s*\()\s*$/.test(out);
        out += c;
        i += 1;
        while (i < n && source[i] !== c) {
          const piece = source[i] === "\\" ? source.slice(i, i + 2) : source[i];
          out += keep ? piece : " ".repeat(piece.length);
          i += piece.length;
        }
        if (i < n) out += source[i];
        i += 1;
      } else if (inInterpolation && c === "{") {
        depth += 1;
        out += c;
        i += 1;
      } else if (inInterpolation && c === "}") {
        if (depth === 0) return { out, next: i + 1 };
        depth -= 1;
        out += c;
        i += 1;
      } else {
        out += c;
        i += 1;
      }
    }
    return { out, next: i };
  }
  return scan(0, false).out;
}

// --- A token stream and a balanced-delimiter argument extractor ------------------------------------
//
// Call arguments are never matched with a regular expression over text: a `;`, `,` or `)` inside a
// string, a nested function body or a template would end a pattern early. `tokenize` reads the source
// as identifiers (escapes decoded), string / template / regex literals, numbers and single-character
// punctuators, with comments dropped. A template literal is one token; each `${ ... }` interpolation
// follows it as a synthetic `( ... )` group, so the delimiters stay balanced and the code inside is
// scanned like any other. `callArguments` finds the matching `)` of a call by counting (), [] and {}
// and splits the arguments at top-level commas. Anything unbalanced, unterminated or mismatched is
// reported, never skipped: the callers fail toward detecting.
const ID_START = /[\p{ID_Start}$_]/u;
const ID_PART = /[\p{ID_Continue}$‌‍]/u;
const SIMPLE_ESCAPES = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", v: "\v", 0: "\0" };

// Decodes the escape that starts at source[i] === "\\"; returns the value and the next offset.
function decodeEscape(source, i) {
  const c = source[i + 1];
  if (c === "u") {
    if (source[i + 2] === "{") {
      const end = source.indexOf("}", i + 3);
      const hex = end === -1 ? "" : source.slice(i + 3, end);
      if (/^[0-9a-fA-F]+$/.test(hex) && parseInt(hex, 16) <= 0x10ffff) return { value: String.fromCodePoint(parseInt(hex, 16)), next: end + 1 };
    } else if (/^[0-9a-fA-F]{4}$/.test(source.slice(i + 2, i + 6))) {
      return { value: String.fromCharCode(parseInt(source.slice(i + 2, i + 6), 16)), next: i + 6 };
    }
  } else if (c === "x" && /^[0-9a-fA-F]{2}$/.test(source.slice(i + 2, i + 4))) {
    return { value: String.fromCharCode(parseInt(source.slice(i + 2, i + 4), 16)), next: i + 4 };
  } else if (c === "\r" && source[i + 2] === "\n") {
    return { value: "", next: i + 3 };
  } else if (c === "\n" || c === "\r" || c === " " || c === " ") {
    return { value: "", next: i + 2 };
  }
  if (c === undefined) return { value: "", next: i + 1 };
  return { value: SIMPLE_ESCAPES[c] ?? c, next: i + 2 };
}

export function tokenize(source) {
  const toks = [];
  const n = source.length;
  const parens = [];
  let lastCloseControl = false;
  let i = 0;
  let ok = true;

  function lex(untilBrace) {
    let depth = 0;
    while (i < n) {
      const c = source[i];
      const d = source[i + 1];
      if (/\s/.test(c)) {
        i += 1;
        continue;
      }
      if (c === "/" && d === "/") {
        while (i < n && source[i] !== "\n") i += 1;
        continue;
      }
      if (c === "/" && d === "*") {
        const end = source.indexOf("*/", i + 2);
        if (end === -1) {
          ok = false;
          i = n;
          return false;
        }
        i = end + 2;
        continue;
      }
      const s = i;
      const cp = String.fromCodePoint(source.codePointAt(i));
      if (ID_START.test(cp) || (c === "\\" && d === "u")) {
        let name = "";
        while (i < n) {
          if (source[i] === "\\" && source[i + 1] === "u") {
            const r = decodeEscape(source, i);
            name += r.value;
            i = r.next;
            continue;
          }
          const ch = String.fromCodePoint(source.codePointAt(i));
          if (!(ID_START.test(ch) || ID_PART.test(ch))) break;
          name += ch;
          i += ch.length;
        }
        toks.push({ t: "id", v: name, s, e: i });
        continue;
      }
      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(d ?? ""))) {
        while (i < n && /[\w.]/.test(source[i])) i += 1;
        toks.push({ t: "num", v: source.slice(s, i), s, e: i });
        continue;
      }
      if (c === "'" || c === "\"") {
        i += 1;
        let value = "";
        let closed = false;
        while (i < n) {
          const ch = source[i];
          if (ch === c) {
            closed = true;
            i += 1;
            break;
          }
          if (ch === "\n") break;
          if (ch === "\\") {
            const r = decodeEscape(source, i);
            value += r.value;
            i = r.next;
          } else {
            value += ch;
            i += 1;
          }
        }
        if (!closed) {
          ok = false;
          return false;
        }
        toks.push({ t: "str", v: value, s, e: i });
        continue;
      }
      if (c === "`") {
        i += 1;
        const tok = { t: "str", v: "", s, e: s };
        toks.push(tok);
        let closed = false;
        while (i < n) {
          const ch = source[i];
          if (ch === "`") {
            closed = true;
            i += 1;
            break;
          }
          if (ch === "\\") {
            const r = decodeEscape(source, i);
            tok.v += r.value;
            i = r.next;
          } else if (ch === "$" && source[i + 1] === "{") {
            tok.t = "tmpl";
            i += 2;
            toks.push({ t: "punct", v: "(", s: i, e: i, syn: true });
            lex(true); // an interpolation that never closes has already cleared `ok`
            toks.push({ t: "punct", v: ")", s: i, e: i, syn: true });
            lastCloseControl = false;
          } else {
            tok.v += ch;
            i += 1;
          }
        }
        if (!closed) {
          ok = false;
          return false;
        }
        tok.e = i;
        continue;
      }
      if (c === "/") {
        const p = toks[toks.length - 1];
        let regex = true;
        if (p) {
          if (p.t === "punct") regex = p.v === ")" ? lastCloseControl : p.v !== "]";
          else if (p.t === "id") regex = REGEX_KEYWORDS.has(p.v);
          else regex = false;
        }
        if (regex) {
          let j = i + 1;
          let inClass = false;
          let closed = false;
          while (j < n && source[j] !== "\n") {
            const ch = source[j];
            if (ch === "\\") {
              j += 2;
              continue;
            }
            if (ch === "[") inClass = true;
            else if (ch === "]") inClass = false;
            else if (ch === "/" && !inClass) {
              closed = true;
              break;
            }
            j += 1;
          }
          if (closed) {
            const bodyEnd = j;
            j += 1;
            while (j < n && /[\w$]/.test(source[j])) j += 1;
            i = j;
            toks.push({ t: "regex", v: source.slice(s, j), s, e: j });
            // A regex body is also read as code, toward detecting: its tokens follow the literal, flagged so
            // that stray delimiters inside it cannot unbalance an enclosing call.
            const inner = tokenize(source.slice(s + 1, bodyEnd));
            for (const t of inner.tokens) toks.push({ ...t, s: t.s + s + 1, e: t.e + s + 1, inRegex: true });
            continue;
          }
        }
      }
      i += 1;
      if (c === "(") {
        const p = toks[toks.length - 1];
        parens.push(Boolean(p && p.t === "id" && ["if", "while", "for", "with"].includes(p.v)));
      } else if (c === ")") {
        lastCloseControl = parens.length > 0 ? parens.pop() : true;
      } else if (c === "{") {
        depth += 1;
      } else if (c === "}") {
        if (untilBrace && depth === 0) return true;
        if (depth > 0) depth -= 1;
      }
      toks.push({ t: "punct", v: c, s, e: i });
    }
    if (untilBrace) ok = false;
    return !untilBrace;
  }

  lex(false);
  return { tokens: toks, ok };
}

const CLOSERS = { "(": ")", "[": "]", "{": "}" };

// The arguments of the call whose `(` is tokens[open]: an array of token arrays split at top-level
// commas, or null when the delimiters do not balance. A trailing comma adds no argument.
export function callArguments(tokens, open, info = null) {
  const stack = [];
  const args = [[]];
  for (let k = open + 1; k < tokens.length; k += 1) {
    const tk = tokens[k];
    if (tk.inRegex) {
      args[args.length - 1].push(tk);
      continue;
    }
    if (tk.t === "punct") {
      if (CLOSERS[tk.v]) {
        stack.push(CLOSERS[tk.v]);
      } else if (tk.v === ")" || tk.v === "]" || tk.v === "}") {
        if (stack.length === 0) {
          if (tk.v !== ")") return null;
          if (args.length > 1 && args[args.length - 1].length === 0) args.pop();
          if (args.length === 1 && args[0].length === 0) args.pop();
          if (info) info.end = k;
          return args;
        }
        if (stack.pop() !== tk.v) return null;
      } else if (tk.v === "," && stack.length === 0) {
        args.push([]);
        continue;
      }
    }
    args[args.length - 1].push(tk);
  }
  return null;
}

// The callee of the call whose `(` is tokens[open]: `name(...)`, `obj.name(...)` or `obj["name"](...)`.
function calleeAt(tokens, openAt) {
  if (tokens[openAt].syn) return null;
  // An optional call `f?.(...)`: the callee ends before the `?.`.
  const optional = tokens[openAt - 1] && tokens[openAt - 1].t === "punct" && tokens[openAt - 1].v === "." && tokens[openAt - 2] && tokens[openAt - 2].t === "punct" && tokens[openAt - 2].v === "?";
  const open = optional ? openAt - 2 : openAt;
  const p = tokens[open - 1];
  if (!p) return null;
  const objectAt = (k) => (tokens[k] && tokens[k].t === "id" ? tokens[k].v : null);
  if (p.t === "id") {
    const dot = tokens[open - 2];
    const member = Boolean(dot && dot.t === "punct" && dot.v === ".");
    return { name: p.v, member, object: member ? objectAt(open - 3) : null };
  }
  if (p.t === "punct" && p.v === "]") {
    const key = tokens[open - 2];
    const bracket = tokens[open - 3];
    if (key && key.t === "str" && bracket && bracket.t === "punct" && bracket.v === "[") return { name: key.v, member: true, object: objectAt(open - 4) };
  }
  return null;
}

// Calls that set a property by name. `set` is only the Reflect one: Map.set and friends are everywhere.
function isKeyedCall(callee) {
  if (["assign", "defineProperty", "defineProperties", "setAttribute", "setAttributeNS"].includes(callee.name)) return true;
  return callee.name === "set" && callee.member && callee.object === "Reflect";
}

// Resource property names an argument names: the argument itself being the literal name (setAttribute,
// Reflect.set, defineProperty), or a key of an object literal anywhere inside it, however deeply nested:
// `{ src: u }`, `{ "src": u }`, `{ src }`, `{ src() {} }`, `{ get src() {} }`, `{ ["src"]: u }`.
function resourceKeysIn(arg, isNameArgument) {
  const hits = [];
  if (isNameArgument && arg.length === 1 && arg[0].t === "str" && RESOURCE_PROPS.includes(arg[0].v)) hits.push(arg[0].v);
  for (let k = 0; k < arg.length; k += 1) {
    const tk = arg[k];
    if ((tk.t !== "id" && tk.t !== "str") || !RESOURCE_PROPS.includes(tk.v)) continue;
    const before = arg[k - 1];
    const after = arg[k + 1];
    const bv = before ? before.v : null;
    const computed = bv === "[" && after && after.v === "]";
    const open = bv === "{" || bv === "," || bv === "*" || (before && before.t === "id" && ["get", "set", "async", "static"].includes(bv)) || computed;
    if (!open) continue;
    const next = computed ? arg[k + 2] : after;
    if (next && next.t === "punct" && [":", ",", "}", "("].includes(next.v)) hits.push(tk.v);
  }
  return hits;
}

/** Problems with property-setting calls in a source: unreadable structure, and resource names set. */
export function keyedCallProblems(source) {
  const { tokens, ok } = tokenize(source);
  const problems = [];
  if (!ok) problems.push("unparseable source (unterminated string, template, regex or comment)");
  for (let k = 0; k < tokens.length; k += 1) {
    if (tokens[k].t !== "punct" || tokens[k].v !== "(") continue;
    const callee = calleeAt(tokens, k);
    if (!callee || !isKeyedCall(callee)) continue;
    const args = callArguments(tokens, k);
    if (args === null) {
      problems.push(`unparseable call: ${callee.name} at offset ${tokens[k].s}`);
      continue;
    }
    // Which argument holds the property name: setAttribute(name, v), setAttributeNS(ns, name, v),
    // Reflect.set(o, name, v), defineProperty(o, name, d). Object keys are checked in every argument.
    const nameAt = { setAttribute: 0, setAttributeNS: 1, set: 1, defineProperty: 1 }[callee.name];
    args.forEach((arg, index) => {
      for (const key of resourceKeysIn(arg, index === nameAt)) problems.push(`${callee.name} sets ${key}`);
    });
  }
  return problems;
}

// Statement-level module references (`import ... from`, `import "x"`, `export ... from`) are read from the
// same token stream: after `import` / `export`, the clause may hold identifiers, `,`, `*`, `as`, string
// names and one `{ ... }` group; the specifier is the string after `from` (or the string right after a
// side-effect `import`). Import attributes (`with { type: "json" }`) follow the specifier and are ignored.
function statementSpecifier(tokens, at, isImport) {
  const first = tokens[at + 1];
  if (!first) return null;
  if (isImport) {
    if (first.t === "str") return { spec: first.v, end: at + 1 };
    if (first.t === "punct" && (first.v === "(" || first.v === ".")) return null;
  }
  let depth = 0;
  for (let j = at + 1; j < tokens.length; j += 1) {
    const tk = tokens[j];
    if (tk.inRegex) continue;
    if (tk.t === "punct") {
      if (tk.v === "{") depth += 1;
      else if (tk.v === "}") {
        depth -= 1;
        if (depth < 0) return null;
      } else if (tk.v !== "," && tk.v !== "*") {
        return null;
      }
    } else if (tk.t === "id" && tk.v === "from" && depth === 0) {
      const spec = tokens[j + 1];
      return spec && spec.t === "str" ? { spec: spec.v, end: j + 1 } : null;
    } else if (tk.t !== "id" && tk.t !== "str") {
      return null;
    }
  }
  return null;
}

// Members of URL that do not turn a path into a URL: `canParse` only answers a boolean, and the object-URL
// pair manages blob URLs. `URL.parse(input, base)` (Node 22.1+) resolves like the constructor, so it is read
// with the constructor's rules, not exempted.
const URL_STATIC_SAFE = ["canParse", "createObjectURL", "revokeObjectURL"];

// The index of the `(` that opens the argument list when the `URL` identifier at `k` is the constructor of a
// `new` expression (otherwise -1), in any spelling that keeps the name visible: `new URL(`, `new globalThis.URL(`, `new window.URL(`, `new (URL)(`, `new (self.URL)(`.
function isConstructedAt(tokens, k) {
  let start = k;
  let end = k;
  const punctAt = (i, v) => tokens[i] && tokens[i].t === "punct" && tokens[i].v === v;
  for (;;) {
    while (punctAt(start - 1, ".") && tokens[start - 2] && tokens[start - 2].t === "id") start -= 2;
    if (punctAt(start - 1, "(") && !tokens[start - 1].syn && punctAt(end + 1, ")")) {
      start -= 1;
      end += 1;
      continue;
    }
    break;
  }
  const before = tokens[start - 1];
  const isNew = before && before.t === "id" && before.v === "new" && punctAt(end + 1, "(") && !tokens[end + 1].syn;
  return isNew ? end + 1 : -1;
}

// Reads the argument list of a URL construction (or of `URL.parse`) as a whole and accepts only shapes that can
// be justified:
//   ("literal", import.meta.url)   a file next to this one: the literal is checked for containment
//   ("file:...")                   a file URL names a file system path: checked for containment too
//   ("scheme:...")                 any other absolute URL names no file of this module; its base is ignored
// Everything else (a variable, member, call, template or concatenation for either argument, no arguments,
// a third argument, a relative literal with another base or none, import.meta["url"], an alias of
// import.meta.url) is unreadable: it cannot be shown to stay here.
function readUrlConstruction(tokens, open, offset, specifiers, unreadable) {
  const args = callArguments(tokens, open);
  const bad = (why) => unreadable.push({ form: "url", specifier: `${why} at offset ${offset}` });
  if (args === null) return bad("unparseable construction");
  if (args.length === 0 || args.length > 2) return bad("construction with no arguments or with extra arguments");
  if (!(args[0].length === 1 && args[0][0].t === "str")) return bad("non-literal first argument");
  const literal = args[0][0].v;
  // The URL parser strips leading and trailing C0 controls and spaces and deletes tabs and newlines, and the
  // scheme is case-insensitive: decide on that form.
  const normal = literal.replace(/[\t\n\r]/g, "").replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, "");
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(normal)) {
    if (/^file:/i.test(normal)) specifiers.push({ form: "file-url", specifier: literal });
    return undefined;
  }
  if (args.length === 1) return bad("relative literal with no base");
  if (args[1].map((t) => t.v).join("") === "import.meta.url") specifiers.push({ form: "url", specifier: literal });
  else bad("base is not the literal import.meta.url");
  return undefined;
}

// Names through which a module can run code that this scan cannot read, so a module that uses them could
// reach a loader the scan never sees (`eval('require("package")')`). Any occurrence is an unreadable
// reference, whatever precedes it: `eval`, `Function` (`new Function(...)`, `Function(...)`,
// `.constructor("...")`), `importScripts`, and the vm entry points that compile or run source text. A
// worker started with `{ eval: true }` contains the identifier `eval` and is caught by the same rule.
const DYNAMIC_CODE_NAMES = ["eval", "Function", "importScripts", "runInContext", "runInNewContext", "runInThisContext", "compileFunction", "SourceTextModule", "SyntheticModule", "NODE_OPTIONS", "NODE_PATH"];
// Timers that accept source text as their first argument, and child processes that can be told to evaluate
// source (`node -e`, `--eval`, `-p`, `--print`). Seen only through literals: a command held in a variable
// is a stated limit.
const TIMER_NAMES = ["setTimeout", "setInterval", "setImmediate"];
const CHILD_PROCESS_NAMES = ["exec", "execSync", "execFile", "execFileSync", "spawn", "spawnSync", "fork"];
// A shell removes quotes and backslashes before a program sees its words, so `node "-e" "..."` is the same
// invocation as `node -e 1`: a command string is read with them removed and split into words. Node (and
// every other program a script might start) takes options that evaluate source (-e, -p), preload code
// (-r / --require, --import, --loader / --experimental-loader), change how files are read (--input-type,
// --experimental-default-type, --env-file) or run another entry point. Rather than list the options that do
// harm, an option-shaped literal in a child-process call is classified: only the options on this list are
// known to be harmless, and every other literal word that begins with `-` is unreadable. Words that are not
// literals (a variable, a spread of a computed list) are paths and values the scan cannot see; that is the
// boundary of reading text, stated in the PR body.
const SAFE_CHILD_OPTION = /^(--test|--test-concurrency=\d+)$/;
const unquoted = (text) => text.replace(/["'`\\]/g, "");

// The indexes of string tokens that are direct ELEMENTS of an array literal (`["a", "eval"]`): a list of names is
// data. A `[` after an identifier, a string, a number or a closing delimiter is a member access (`o["eval"]`),
// not a literal, and a `[` after a keyword such as `return` is one.
const LITERAL_PRECEDERS = new Set([...REGEX_KEYWORDS, "default", "export", "else", "extends"]);
function arrayElementStrings(tokens) {
  const out = new Set();
  const stack = [];
  for (let k = 0; k < tokens.length; k += 1) {
    const tk = tokens[k];
    if (tk.inRegex) continue;
    if (tk.t === "punct" && (tk.v === "(" || tk.v === "[" || tk.v === "{")) {
      const prev = tokens[k - 1];
      const literal = tk.v === "[" && (!prev || (prev.t === "punct" && ![")", "]", "}"].includes(prev.v)) || (prev.t === "id" && LITERAL_PRECEDERS.has(prev.v)));
      stack.push(literal);
    } else if (tk.t === "punct" && (tk.v === ")" || tk.v === "]" || tk.v === "}")) {
      stack.pop();
    } else if (tk.t === "str" && stack.length > 0 && stack[stack.length - 1] === true) {
      out.add(k);
    }
  }
  return out;
}

// Objects whose properties are the global scope and its loaders: a computed access on them with a key that is
// not a literal can reach eval, Function, require, process.binding and the rest by a name built at run time.
const GLOBAL_OBJECTS = ["globalThis", "global", "self", "window", "process", "module", "exports", "this"];

// The index of the `]` that closes the `[` at `open`, or -1.
function closeBracketIndex(tokens, open) {
  let depth = 0;
  for (let k = open; k < tokens.length; k += 1) {
    const t = tokens[k];
    if (t.inRegex || t.t !== "punct") continue;
    if (t.v === "[" || t.v === "(" || t.v === "{") depth += 1;
    else if (t.v === "]" || t.v === ")" || t.v === "}") {
      depth -= 1;
      if (depth === 0) return t.v === "]" ? k : -1;
    }
  }
  return -1;
}

// Whether the token at `k` is directly called: `x(...)` or `x?.(...)`.
function isCalledAt(tokens, k) {
  const a = tokens[k + 1];
  if (a && a.t === "punct" && a.v === "(" && !a.syn) return true;
  const b = tokens[k + 2];
  const c = tokens[k + 3];
  return Boolean(a && a.v === "?" && b && b.v === "." && c && c.v === "(" && !c.syn);
}

/**
 * Every module specifier a JavaScript source names, and every reference it makes that cannot be read.
 * `require` is Node's loader under any spelling, so every reference to it that is not a direct call with a
 * literal first argument is reported as unreadable, never skipped: `(require)("x")`, `(0, require)("x")`,
 * `require.call(null, "x")` / `.apply` / `.bind`, `const r = require`, `module.require`, `o["require"]`.
 * A direct call is `require("x")`, `require?.("x")`, `module.require("x")` and `o["require"]("x")`.
 */
export function moduleReferences(source, options = {}) {
  // `dynamicCode: false` turns the dynamic-code rules off. The vendored parser is pinned, hash-checked content
  // with its own ambient-access guard (vendor-yaml.test.mjs), and it legitimately holds `coll.constructor`;
  // first-party scripts keep every rule.
  const checkDynamicCode = options.dynamicCode !== false;
  const specifiers = [];
  const unreadable = [];
  const { tokens, ok } = tokenize(source);
  if (!ok) unreadable.push({ form: "source", specifier: "unparseable (unterminated string, template, regex or comment)" });
  const inClause = new Set();
  const arrayElements = arrayElementStrings(tokens);
  const nameStrings = new Set([...DYNAMIC_CODE_NAMES, "constructor", ...TIMER_NAMES, ...CHILD_PROCESS_NAMES]);
  const urlConstructions = new Set();
  for (let k = 0; k < tokens.length; k += 1) {
    const tk = tokens[k];
    if (tk.t === "id" && tk.v === "createRequire") unreadable.push({ form: "createRequire", specifier: `at offset ${tk.s}` });
    const dynamic = (why) => {
      if (checkDynamicCode) unreadable.push({ form: "dynamic-code", specifier: `${why} at offset ${tk.s}` });
    };
    if (tk.t === "id" && DYNAMIC_CODE_NAMES.includes(tk.v)) dynamic(`reference to ${tk.v}, which runs source text`);
    // A string equal to one of these names is a way of naming the property or function without writing it as an
    // identifier ("eval": true as an object key, o["execSync"], Reflect.get(f, "constructor")). It is reported
    // wherever it appears except as an element of an array literal, which is a list of names, not a use.
    if (tk.t === "str" && nameStrings.has(tk.v) && !arrayElements.has(k)) {
      dynamic(`the string "${tk.v}" naming a code-running or process-starting member`);
    }
    // A computed member access whose key is not a literal names its member at run time. It is unreadable when
    // the result is called (`x[name](...)`, `new x[name](...)`) or when the object is the global scope or a
    // module-level loader holder (`globalThis[name]`), because the name can be assembled to spell eval,
    // Function or a loader. A key that is a single string or number literal is read by the string rule above.
    if (tk.t === "punct" && tk.v === "[" && !tk.syn) {
      const prev = tokens[k - 1];
      const access = prev && (prev.t === "str" || prev.t === "num" || (prev.t === "punct" && (prev.v === ")" || prev.v === "]")) || (prev.t === "id" && !LITERAL_PRECEDERS.has(prev.v)));
      const close = access ? closeBracketIndex(tokens, k) : -1;
      if (close !== -1) {
        const key = tokens.slice(k + 1, close);
        const literalKey = key.length === 1 && (key[0].t === "str" || key[0].t === "num");
        if (!literalKey && isCalledAt(tokens, close)) dynamic("a computed member called, whose name is built at run time");
        else if (!literalKey && prev.t === "id" && GLOBAL_OBJECTS.includes(prev.v)) dynamic(`computed access on ${prev.v} with a key built at run time`);
      }
    }
    if (tk.t === "id" && tk.v === "Script" && tokens[k - 1] && (tokens[k - 1].v === "new" || (tokens[k - 1].v === "." && tokens[k - 2] && tokens[k - 2].v === "vm"))) {
      dynamic("vm.Script, which compiles source text");
    }
    // `.constructor` reaches Function (`fn.constructor("code")`, `(fn.constructor)("code")`,
    // `fn.constructor.call(null, "code")`, `const C = fn.constructor`). It is positively classified safe only
    // when it is compared (`x.constructor === Y`) or its `.name` is read; every other use is unreadable.
    if (tk.t === "id" && tk.v === "constructor" && tokens[k - 1] && tokens[k - 1].v === ".") {
      const n1 = tokens[k + 1];
      const n2 = tokens[k + 2];
      const n3 = tokens[k + 3];
      const named = (n1 && n1.v === "." && n2 && n2.t === "id" && n2.v === "name") || (n1 && n1.v === "?" && n2 && n2.v === "." && n3 && n3.t === "id" && n3.v === "name");
      const compared = n1 && (n1.v === "=" || n1.v === "!") && n2 && n2.v === "=";
      if (!named && !compared) dynamic(".constructor used other than compared or named, which reaches Function");
    }
    // Timers and child processes: a direct call is read (source text, evaluation flags); a reference that is
    // not a direct call ((execSync)(...), const r = spawn, passing setTimeout on) cannot be read and is
    // unreadable. An import clause naming them is neither.
    if (tk.t === "id" && (TIMER_NAMES.includes(tk.v) || CHILD_PROCESS_NAMES.includes(tk.v))) {
      if (inClause.has(k)) {
        // `import { execSync }` is a plain import. A rename (`import { execSync as run }`) hides the call from
        // the name checks, so it is unreadable.
        if (tokens[k + 1] && tokens[k + 1].t === "id" && tokens[k + 1].v === "as") dynamic(`${tk.v} imported under another name`);
      } else if (!isCalledAt(tokens, k)) {
        dynamic(`reference to ${tk.v} that is not a direct call`);
      } else {
        const open = tokens[k + 1].v === "(" ? k + 1 : k + 3;
        const callArgs = callArguments(tokens, open);
        if (callArgs === null) {
          dynamic(`unparseable ${tk.v} call`);
        } else if (TIMER_NAMES.includes(tk.v)) {
          const first = callArgs[0] ?? [];
          if (first.some((t) => t.t === "str" || t.t === "tmpl")) dynamic(`${tk.v} with source text`);
        } else {
          for (const arg of callArgs) {
            for (const t of arg) {
              if (t.t !== "str") continue;
              for (const word of unquoted(t.v).split(/\s+/)) {
                if (word.startsWith("-") && !SAFE_CHILD_OPTION.test(word)) dynamic(`${tk.v} given the option "${word.slice(0, 30)}", which is not known to be harmless`);
              }
            }
          }
        }
      }
    }
    const memberOf = tokens[k - 1] && tokens[k - 1].t === "punct" && tokens[k - 1].v === ".";
    if (tk.t === "id" && tk.v === "require" && !isCalledAt(tokens, k)) {
      unreadable.push({ form: "require", specifier: `reference that is not a literal call at offset ${tk.s}` });
    }
    if (tk.t === "str" && tk.v === "require" && tokens[k - 1] && tokens[k - 1].v === "[" && tokens[k + 1] && tokens[k + 1].v === "]" && !isCalledAt(tokens, k + 1)) {
      unreadable.push({ form: "require", specifier: `computed reference that is not a literal call at offset ${tk.s}` });
    }
    if (tk.t === "id" && (tk.v === "import" || tk.v === "export") && !memberOf) {
      const found = statementSpecifier(tokens, k, tk.v === "import");
      if (found !== null) {
        specifiers.push({ form: tk.v === "import" ? "import" : "export-from", specifier: found.spec });
        for (let j = k; j <= found.end; j += 1) inClause.add(j);
      }
    }
    // `URL` is how a module names a file next to itself (`new URL("./x", import.meta.url)`). Anything that
    // is not a recognised construction (an alias, Reflect.construct, a value passed on) is unreadable, never
    // skipped. Only the static members that cannot make a URL from a path (URL_STATIC_SAFE) and an import
    // clause naming it are not references; `URL.bind(...)`, `.call`, `.apply`, `.prototype` and any other
    // member are, because each can hand back a constructor for a later `new`.
    const staticSafe = tokens[k + 1] && tokens[k + 1].t === "punct" && tokens[k + 1].v === "." && tokens[k + 2] && tokens[k + 2].t === "id" && URL_STATIC_SAFE.includes(tokens[k + 2].v);
    if (tk.t === "id" && tk.v === "URL" && !inClause.has(k) && !staticSafe) {
      const open = isConstructedAt(tokens, k);
      const parseAt = tokens[k + 1] && tokens[k + 1].v === "." && tokens[k + 2] && tokens[k + 2].v === "parse" && tokens[k + 3] && tokens[k + 3].v === "(" && !tokens[k + 3].syn ? k + 3 : -1;
      if (open !== -1) {
        urlConstructions.add(open);
        readUrlConstruction(tokens, open, tk.s, specifiers, unreadable);
      } else if (parseAt !== -1) {
        urlConstructions.add(parseAt);
        readUrlConstruction(tokens, parseAt, tk.s, specifiers, unreadable);
      } else {
        unreadable.push({ form: "url", specifier: `reference to URL that is not a literal construction at offset ${tk.s}` });
      }
    }
    // fileURLToPath turns a file URL into a path and pathToFileURL a path into one. The module's own
    // location (`fileURLToPath(import.meta.url)`), a literal file URL, a construction already read above
    // and the entry-point test `pathToFileURL(x).href === import.meta.url` are the only justified uses.
    if (tk.t === "id" && (tk.v === "fileURLToPath" || tk.v === "pathToFileURL") && !inClause.has(k)) {
      if (!isCalledAt(tokens, k)) {
        unreadable.push({ form: "url", specifier: `reference to ${tk.v} that is not a call at offset ${tk.s}` });
      } else {
        const open = tokens[k + 1].v === "(" ? k + 1 : k + 3;
        const info = {};
        const args = callArguments(tokens, open, info);
        const joined = args === null ? "" : args.map((a) => a.map((t) => t.v).join("")).join(",");
        if (args === null) {
          unreadable.push({ form: "url", specifier: `unparseable ${tk.v} call at offset ${tk.s}` });
        } else if (tk.v === "fileURLToPath") {
          if (args.length === 1 && joined === "import.meta.url") {
            // the module's own location
          } else if (args.length === 1 && args[0].length === 1 && args[0][0].t === "str") {
            specifiers.push({ form: "file-url", specifier: args[0][0].v });
          } else if (args.length === 1 && args[0][0] && args[0][0].v === "new" && args[0][1] && args[0][1].v === "URL") {
            // a construction, read on its own
          } else {
            unreadable.push({ form: "url", specifier: `fileURLToPath of something other than import.meta.url, a literal or a URL construction at offset ${tk.s}` });
          }
        } else {
          const after = tokens.slice(info.end + 1, info.end + 12).map((t) => t.v).join("");
          if (!/^\.href(?:===|!==|==|!=)import\.meta\.url/.test(after)) {
            unreadable.push({ form: "url", specifier: `pathToFileURL outside the entry-point comparison at offset ${tk.s}` });
          }
        }
      }
    }
    // import.meta.resolve("x") resolves like an import (a relative literal is checked, a bare one is an
    // offender, a non-literal is unreadable); any other way into import.meta is unreadable.
    if (tk.t === "id" && tk.v === "import" && tokens[k + 1] && tokens[k + 1].v === "." && tokens[k + 2] && tokens[k + 2].v === "meta") {
      const member = tokens[k + 3];
      if (member && member.t === "punct" && member.v === "[") {
        unreadable.push({ form: "url", specifier: `computed import.meta member at offset ${tk.s}` });
      } else if (member && member.v === "." && tokens[k + 4] && tokens[k + 4].v === "resolve" && !(tokens[k + 5] && tokens[k + 5].v === "(" && !tokens[k + 5].syn)) {
        unreadable.push({ form: "url", specifier: `import.meta.resolve that is not called at offset ${tk.s}` });
      }
    }
    if (tk.t !== "punct" || tk.v !== "(" || tk.syn) continue;
    // Any call whose second argument is `import.meta.url` resolves its first argument against this file,
    // whatever the callee is spelled: `new URL(x, import.meta.url)`, `new (URL)(...)`, `new g.URL(...)`,
    // a helper. A literal first argument is a reference to check; anything else is unreadable.
    if (tokens[k - 1] && tokens[k - 1].v === "resolve" && tokens[k - 2] && tokens[k - 2].v === "." && tokens[k - 3] && tokens[k - 3].v === "meta" && tokens[k - 4] && tokens[k - 4].v === "." && tokens[k - 5] && tokens[k - 5].v === "import") {
      const rargs = callArguments(tokens, k);
      if (rargs === null) unreadable.push({ form: "resolve", specifier: `unparseable call at offset ${tokens[k].s}` });
      else if (rargs.length >= 1 && rargs[0].length === 1 && rargs[0][0].t === "str") specifiers.push({ form: "resolve", specifier: rargs[0][0].v });
      else unreadable.push({ form: "resolve", specifier: `non-literal at offset ${tokens[k].s}` });
    }
    const urlArgs = urlConstructions.has(k) ? null : callArguments(tokens, k);
    if (urlArgs !== null && urlArgs[1]) {
      const base = urlArgs[1].map((t) => t.v).join("");
      if (base === "import.meta.url") {
        if (urlArgs[0].length === 1 && urlArgs[0][0].t === "str") specifiers.push({ form: "url", specifier: urlArgs[0][0].v });
        else unreadable.push({ form: "url", specifier: `non-literal at offset ${tokens[k].s}` });
      } else if (base.startsWith("import.meta")) {
        unreadable.push({ form: "url", specifier: `base is import.meta used in a form other than import.meta.url at offset ${tokens[k].s}` });
      }
    }
    const callee = calleeAt(tokens, k);
    if (!callee) continue;
    const dynamicImport = callee.name === "import" && !callee.member;
    if (!dynamicImport && callee.name !== "require") continue;
    const form = dynamicImport ? "dynamic-import" : "require";
    const args = callArguments(tokens, k);
    if (args === null) {
      unreadable.push({ form, specifier: `unparseable call at offset ${tokens[k].s}` });
    } else if (args.length > 0 && args[0].length === 1 && args[0][0].t === "str") {
      specifiers.push({ form, specifier: args[0][0].v });
    } else {
      unreadable.push({ form, specifier: `non-literal at offset ${tokens[k].s}` });
    }
  }
  return { specifiers, unreadable };
}

/**
 * Every reference in `source` (the text of `where.file`) that is not a `node:` builtin or a plain relative
 * path that lands inside `where.root`: what a repository-wide invariant-4 scan reports. Unreadable
 * references (a non-literal require, createRequire, an unparseable call or source) are reported too, never
 * skipped. A relative specifier is resolved against the importing file: it is an offender when it holds
 * `\`, `%`, `?` or `#` (a relative specifier is a URL to Node), when it lands outside the root
 * (`../../outside.mjs`), when its real path does (an in-repository link whose target is outside), or when
 * it does not exist (containment cannot be proved). Literal `new URL(x, import.meta.url)` is read the same
 * way; a non-literal one is unreadable. `where.io` is an injectable file system (existsSync, realpathSync).
 */
export function externalReferences(source, where) {
  // where.dynamicCode === false switches the dynamic-code rules off for one file (the pinned vendored tree).
  if (!where || typeof where.file !== "string" || typeof where.root !== "string") throw new TypeError("externalReferences needs { file, root }");
  const io = where.io ?? fs;
  const real = (p) => (io.realpathSync.native ?? io.realpathSync)(p);
  let root = null;
  try {
    root = real(path.resolve(where.root));
  } catch {
    root = null;
  }
  // "ok", "missing" (containment cannot be proved), "unresolvable" or "outside"; case-insensitive file
  // systems are handled by comparing REAL paths with path.relative, never a string prefix.
  const place = (target) => {
    try {
      if (!io.existsSync(target)) return "missing";
      if (root === null) return "unresolvable";
      const rel = path.relative(root, real(target));
      return rel !== "" && rel.split(path.sep)[0] !== ".." && !path.isAbsolute(rel) ? "ok" : "outside";
    } catch {
      return "unresolvable";
    }
  };
  const { specifiers, unreadable } = moduleReferences(source, { dynamicCode: where.dynamicCode !== false });
  const out = unreadable.map((u) => `${u.form} ${u.specifier}`);
  for (const { form, specifier } of specifiers) {
    if (specifier.startsWith("node:")) continue;
    if (form === "file-url") {
      // A file URL names a file system path: decide it like any other target, on its real path.
      let target = null;
      try {
        target = fileURLToPath(new URL(specifier));
      } catch {
        target = null;
      }
      const placed = target === null ? "unresolvable" : place(target);
      if (placed === "missing") out.push(`${form} ${specifier} does not exist, so containment cannot be proved`);
      else if (placed !== "ok") out.push(`${form} ${specifier} is not a file inside the repository`);
      continue;
    }
    // `new URL(x, import.meta.url)` resolves x as a URL reference: a bare "data/x.json" is relative, and
    // an absolute URL (any scheme) is not a path in this repository.
    const urlForm = form === "url";
    const relative = urlForm ? !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(specifier) && !specifier.startsWith("/") : specifier.startsWith(".");
    if (!relative) {
      out.push(`${form} ${specifier}`);
    } else if (/[\\%?#]/.test(specifier)) {
      out.push(`${form} ${specifier} is not a plain relative path`);
    } else {
      const where2 = place(path.resolve(path.dirname(where.file), specifier));
      if (where2 === "missing") out.push(`${form} ${specifier} does not exist, so containment cannot be proved`);
      else if (where2 !== "ok") out.push(`${form} ${specifier} lands outside the repository or cannot be resolved`);
    }
  }
  return out;
}
