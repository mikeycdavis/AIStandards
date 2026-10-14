import fs from "node:fs";
import path from "node:path";

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
export function callArguments(tokens, open) {
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
    if (first.t === "str") return first.v;
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
      return spec && spec.t === "str" ? spec.v : null;
    } else if (tk.t !== "id" && tk.t !== "str") {
      return null;
    }
  }
  return null;
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
export function moduleReferences(source) {
  const specifiers = [];
  const unreadable = [];
  const { tokens, ok } = tokenize(source);
  if (!ok) unreadable.push({ form: "source", specifier: "unparseable (unterminated string, template, regex or comment)" });
  for (let k = 0; k < tokens.length; k += 1) {
    const tk = tokens[k];
    if (tk.t === "id" && tk.v === "createRequire") unreadable.push({ form: "createRequire", specifier: `at offset ${tk.s}` });
    const memberOf = tokens[k - 1] && tokens[k - 1].t === "punct" && tokens[k - 1].v === ".";
    if (tk.t === "id" && tk.v === "require" && !isCalledAt(tokens, k)) {
      unreadable.push({ form: "require", specifier: `reference that is not a literal call at offset ${tk.s}` });
    }
    if (tk.t === "str" && tk.v === "require" && tokens[k - 1] && tokens[k - 1].v === "[" && tokens[k + 1] && tokens[k + 1].v === "]" && !isCalledAt(tokens, k + 1)) {
      unreadable.push({ form: "require", specifier: `computed reference that is not a literal call at offset ${tk.s}` });
    }
    if (tk.t === "id" && (tk.v === "import" || tk.v === "export") && !memberOf) {
      const spec = statementSpecifier(tokens, k, tk.v === "import");
      if (spec !== null) specifiers.push({ form: tk.v === "import" ? "import" : "export-from", specifier: spec });
    }
    if (tk.t !== "punct" || tk.v !== "(") continue;
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
 * (`../../outside.mjs`), or when, existing, its real path does (a link). `where.io` is an injectable
 * file system (existsSync, realpathSync).
 */
export function externalReferences(source, where) {
  if (!where || typeof where.file !== "string" || typeof where.root !== "string") throw new TypeError("externalReferences needs { file, root }");
  const io = where.io ?? fs;
  const real = (p) => (io.realpathSync.native ?? io.realpathSync)(p);
  const settle = (p) => {
    try {
      return io.existsSync(p) ? real(p) : p;
    } catch {
      return null;
    }
  };
  const root = settle(path.resolve(where.root));
  const inside = (p) => {
    if (p === null || root === null) return false;
    const rel = path.relative(root, p);
    return rel !== "" && rel.split(path.sep)[0] !== ".." && !path.isAbsolute(rel);
  };
  const { specifiers, unreadable } = moduleReferences(source);
  const out = unreadable.map((u) => `${u.form} ${u.specifier}`);
  for (const { form, specifier } of specifiers) {
    if (specifier.startsWith("node:")) continue;
    if (!specifier.startsWith(".")) {
      out.push(`${form} ${specifier}`);
    } else if (/[\\%?#]/.test(specifier)) {
      out.push(`${form} ${specifier} is not a plain relative path`);
    } else if (!inside(settle(path.resolve(path.dirname(where.file), specifier)))) {
      out.push(`${form} ${specifier} lands outside the repository`);
    }
  }
  return out;
}
