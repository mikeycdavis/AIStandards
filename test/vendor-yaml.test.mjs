// The vendored YAML parser: identity, hashes, notice and isolation (ST-57, #119, decision A).
//
// Invariant 4, as amended: there is no install-time or environment-resolved third-party dependency.
// Vendored parser code is reviewed repository content whose identity, hashes and licence are pinned.
// What these tests make true is the second sentence. They fail when the vendored tree drifts, when its
// notice goes missing, when anything under scripts/ reaches for a package by name, and when a
// dependency key, a lockfile or an install step appears anywhere.

import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { REPO } from "./helpers.mjs";

const VENDOR = path.join(REPO, "scripts", "vendor");
const TREE = path.join(VENDOR, "yaml");
const IDENTITY = JSON.parse(fs.readFileSync(path.join(VENDOR, "yaml.vendor.json"), "utf8"));

function filesUnder(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(full, base));
    else out.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return out.sort();
}

const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

test("the identity pins what was vendored: package, version, licence, source and tarball hashes", () => {
  assert.equal(IDENTITY.name, "yaml");
  assert.equal(IDENTITY.version, "2.9.1");
  assert.equal(IDENTITY.license, "ISC");
  assert.match(IDENTITY.copyright, /^Copyright .+/);
  assert.equal(IDENTITY.source.registryTarball, "https://registry.npmjs.org/yaml/-/yaml-2.9.1.tgz");
  assert.match(IDENTITY.source.tarballIntegritySha512, /^sha512-[A-Za-z0-9+/]{86}==$/);
  assert.match(IDENTITY.source.tarballSha1, /^[0-9a-f]{40}$/);
  assert.match(IDENTITY.source.tarballSha256, /^[0-9a-f]{64}$/);
  assert.equal(IDENTITY.modifications, "none");
  assert.ok(IDENTITY.files.length > 0);
});

test("every vendored file matches its recorded SHA-256, byte for byte", () => {
  for (const entry of IDENTITY.files) {
    assert.match(entry.sha256, /^[0-9a-f]{64}$/, entry.path);
    const full = path.join(TREE, entry.path);
    assert.ok(fs.existsSync(full), `${entry.path} is recorded but missing from the tree`);
    assert.equal(sha256(full), entry.sha256, `${entry.path} has drifted from the pinned release`);
  }
});

test("the vendored tree holds exactly the recorded files: nothing added, nothing removed", () => {
  const onDisk = filesUnder(TREE);
  const recorded = IDENTITY.files.map((f) => f.path).sort();
  assert.deepEqual(onDisk, recorded);
  assert.equal(new Set(recorded).size, recorded.length, "a path is recorded twice");
});

test("scripts/vendor holds only the yaml tree and its identity (a second vendored package needs its own decision)", () => {
  assert.deepEqual(fs.readdirSync(VENDOR).sort(), ["yaml", "yaml.vendor.json"]);
});

test("the upstream licence and copyright notice ship with the tree, and are not abbreviated", () => {
  assert.ok(IDENTITY.files.some((f) => f.path === "LICENSE"));
  const text = fs.readFileSync(path.join(TREE, IDENTITY.licenseFile), "utf8");
  assert.match(text, /^Copyright Eemeli Aro <eemeli@gmail\.com>/);
  assert.match(text, /Permission to use, copy, modify, and\/or distribute this software for any purpose/);
  assert.match(text, /with or without fee is hereby granted, provided that the above copyright notice\nand this permission notice appear in all copies\./);
  assert.match(text, /THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES/);
});

test("the notice is kept next to the code it covers: the identity names it and the tree contains it", () => {
  assert.equal(IDENTITY.licenseFile, "LICENSE");
  assert.ok(fs.existsSync(path.join(TREE, "LICENSE")));
});

test("line endings are LF in the tree, and git is told to keep them LF", () => {
  for (const rel of IDENTITY.files.map((f) => f.path)) {
    const bytes = fs.readFileSync(path.join(TREE, rel));
    assert.equal(bytes.includes(0x0d), false, `${rel} contains a carriage return, so its hash would depend on the checkout`);
  }
  const attributes = fs.readFileSync(path.join(REPO, ".gitattributes"), "utf8");
  assert.match(attributes, /^scripts\/vendor\/\*\* +text +eol=lf$/m);
});

test(".gitattributes is scoped to the vendored tree and decides nothing about the rest of the repository (Q8 stays open)", () => {
  const rules = fs.readFileSync(path.join(REPO, ".gitattributes"), "utf8").split(String.fromCharCode(10)).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  assert.ok(rules.length > 0);
  for (const rule of rules) assert.ok(rule.startsWith("scripts/vendor/"), `a repository-wide or foreign rule would decide Q8: ${rule}`);
});

// --- The import guard ---------------------------------------------------------------------------
//
// Every way a module can name another module, found in CODE (comments are removed first, strings are
// blanked unless they can be specifiers): static `import ... from "x"`, the side-effect form `import "x"`, `export ... from "x"`,
// dynamic `import("x")`, and `require("x")`. A specifier must be relative and resolve to an existing
// file inside the vendored tree. A dynamic import or require whose argument is not a string literal
// cannot be checked, so it is itself an offender, as is `createRequire` (a require by another name).

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

function stripComments(source) {
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
            out += " ";
            i += 1;
          }
        }
        if (i < n) out += "`";
        i += 1;
      } else if (c === "'" || c === "\"") {
        // A string is kept only where it can be a module specifier (after `from`, `import` or
        // `import(` / `require(`); any other string is blanked so text inside it is never read as code.
        const keep = /(?:\bfrom|\bimport|\b(?:import|require)\s*\()\s*$/.test(out);
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

/** Every module specifier a JavaScript source names, and every reference it makes that cannot be read. */
export function moduleReferences(source) {
  const code = stripComments(source);
  const specifiers = [];
  const unreadable = [];
  for (const m of code.matchAll(/\bimport\s*(?:[^;'"()]*?\bfrom\s*)?(['"])([^'"]+)\1/g)) specifiers.push({ form: "import", specifier: m[2] });
  for (const m of code.matchAll(/\bexport\s*(?:\*(?:\s*as\s+[\w$]+)?|\{[^}]*\})\s*from\s*(['"])([^'"]+)\1/g)) specifiers.push({ form: "export-from", specifier: m[2] });
  for (const m of code.matchAll(/\bimport\s*\(\s*(['"])([^'"]+)\1\s*[,)]/g)) specifiers.push({ form: "dynamic-import", specifier: m[2] });
  for (const m of code.matchAll(/\brequire\s*\(\s*(['"])([^'"]+)\1\s*\)/g)) specifiers.push({ form: "require", specifier: m[2] });
  for (const m of code.matchAll(/\bimport\s*\(\s*(?!['"])/g)) unreadable.push({ form: "dynamic-import", specifier: `non-literal at offset ${m.index}` });
  for (const m of code.matchAll(/\brequire\s*\(\s*(?!['"])/g)) unreadable.push({ form: "require", specifier: `non-literal at offset ${m.index}` });
  for (const m of code.matchAll(/\bcreateRequire\b/g)) unreadable.push({ form: "createRequire", specifier: `at offset ${m.index}` });
  return { specifiers, unreadable };
}

/** Offenders in a set of files under `treeDir`: anything that is not a relative path to a file inside it. */
export function importOffenders(treeDir, relFiles) {
  const offenders = [];
  for (const rel of relFiles) {
    const dir = path.dirname(path.join(treeDir, rel));
    const { specifiers, unreadable } = moduleReferences(fs.readFileSync(path.join(treeDir, rel), "utf8"));
    for (const u of unreadable) offenders.push(`${rel}: ${u.form} ${u.specifier}`);
    for (const { form, specifier } of specifiers) {
      if (!specifier.startsWith(".")) {
        offenders.push(`${rel}: ${form} ${specifier}`);
        continue;
      }
      const target = path.resolve(dir, specifier);
      if (!target.startsWith(treeDir + path.sep) || !fs.existsSync(target)) offenders.push(`${rel}: ${form} ${specifier} does not resolve inside the tree`);
    }
  }
  return offenders;
}

const SCRIPT = /\.(?:js|mjs|cjs)$/;

test("the vendored tree imports only itself: relative specifiers that resolve inside the tree", () => {
  const onDisk = filesUnder(TREE).filter((p) => SCRIPT.test(p));
  assert.ok(onDisk.length > 0);
  assert.deepEqual(importOffenders(TREE, onDisk), []);
});

test("the import guard itself: each way of naming a module outside the tree is an offender", () => {
  const tree = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-vendor-guard-"));
  try {
    fs.mkdirSync(path.join(tree, "browser"));
    fs.writeFileSync(path.join(tree, "browser", "ok.js"), "export const ok = 1;\n");
    // A file that exists next to the tree: only the containment check can reject a path to it.
    const outsideName = `${path.basename(tree)}-outside.js`;
    const outsidePath = path.join(path.dirname(tree), outsideName);
    fs.writeFileSync(outsidePath, "export const outside = 1;\n");
    const must = {
      "side-effect import of a package": "import \"package\";\n",
      "side-effect import outside the tree": `import "../../${outsideName}";\n`,
      "static import of a package": "import x from \"package\";\n",
      "namespace import of a package": "import * as x from \"package\";\n",
      "named import of a package": "import { a, b } from \"package\";\n",
      "import across lines": "import {\n  a,\n  b,\n} from \"package\";\n",
      "re-export star": "export * from \"package\";\n",
      "re-export named outside the tree": `export { a } from "../../${outsideName}";\n`,
      "re-export namespace": "export * as ns from \"package\";\n",
      "dynamic import of a package": "export const p = import(\"package\");\n",
      "dynamic import outside the tree": `export const p = import("../../${outsideName}");\n`,
      "dynamic import with a non-literal argument": "const n = \"pack\" + \"age\";\nexport const p = import(n);\n",
      "require of a package": "const x = require(\"package\");\n",
      "require with a non-literal argument": "const x = require(name);\n",
      "createRequire": "export const r = createRequire(import.meta.url);\n",
      "relative import of a file that does not exist": "import \"./missing.js\";\n",
      "a node: builtin": "import fs from \"node:fs\";\n",
      "a mention hidden by a comment on the same line": "import \"package\"; // ./ok.js\n",
      "dynamic import inside a template interpolation": "const x = `${import(\"package\")}`;\n",
      "require inside a template interpolation": "const x = `a${require(\"package\")}b`;\n",
      "non-literal dynamic import inside an interpolation": "const x = `${import(name)}`;\n",
      "dynamic import inside a nested template": "const x = `a${`b${import(\"package\")}`}`;\n",
      "import after braces and a string inside an interpolation": "const x = `${ ({ a: \"}\" }).a + (await import(\"package\")) }`;\n",
      "import after a comment inside an interpolation": "const x = `${ /* } */ import(\"package\") }`;\n",
      "regex containing a brace after an opener": "const x = `${ /}/.test(x) ? import(\"package\") : 1 }`;\n",
      "regex after a comma": "const x = `${ f(/}/, import(\"package\")) }`;\n",
      "regex after an equals sign": "const x = `${ (y = /}/, import(\"package\")) }`;\n",
      "regex after return": "const x = `${ (() => { return /}/.test(a) && import(\"package\"); })() }`;\n",
      "regex after a keyword at the top of an interpolation": "const x = `${ typeof /}/ === \"x\" && import(\"package\") }`;\n",
      "regex after the void keyword": "const x = `${ void /}/, import(\"package\") }`;\n",
      "regex after the head of an if statement": "const x = `${ (() => { if (x) /}/.test(y); })(), import(\"package\") }`;\n",
      "regex after the head of a while statement": "const x = `${ (() => { while (x) /}/.test(y); })(), import(\"package\") }`;\n",
      "regex after the head of a for statement": "const x = `${ (() => { for (;;) /}/.test(y); })(), import(\"package\") }`;\n",
      "regex after the head of a with statement": "const x = `${ (() => { with (o) /}/.test(y); })(), import(\"package\") }`;\n",
      "regex after a nested control head": "const x = `${ (() => { if ((a) && f(b)) /}/.test(y); })(), import(\"package\") }`;\n",
      "regex after an unmatched parenthesis (ambiguous, so read as a regex)": "const x = `${ a) /}/.test(b) && import(\"package\") }`;\n",
      "regex after a question mark": "const x = `${ ok ? /}/ : import(\"package\") }`;\n",
      "regex after a colon": "const x = `${ ok ? 1 : /}/.test(a) && import(\"package\") }`;\n",
      "regex with a quote in a class": "const x = `${ /[\"']/.test(a) && import(\"package\") }`;\n",
      "regex with a slash and a brace inside a class": "const x = `${ /[/]}/.test(a) && import(\"package\") }`;\n",
      "regex with an escaped slash and a brace": "const x = `${ /a\\/}/.test(a) && import(\"package\") }`;\n",
      "regex at top level hiding a quote": "const re = /[\"']/; import \"package\";\n",
      "division after an identifier": "const x = `${ a / b + import(\"package\") }`;\n",
      "division after a parenthesis": "const x = `${ (a) / 2 / 3 + import(\"package\") }`;\n",
      "division after a bracket": "const x = `${ y[0] / 2 + import(\"package\") }`;\n",
      "an import call written inside a regex body is reported (fail toward detecting)": "const x = /import(\"package\")/;\n",
      "outside the tree via an interpolation": "const x = `${import(\"../../" + outsideName + "\")}`;\n",
    };
    for (const [label, text] of Object.entries(must)) {
      fs.writeFileSync(path.join(tree, "browser", "bad.js"), text);
      assert.notDeepEqual(importOffenders(tree, ["browser/bad.js"]), [], `must be an offender: ${label}`);
    }
    const may = {
      "relative import of a file in the tree": "import { ok } from \"./ok.js\";\nexport { ok };\n",
      "side-effect import of a file in the tree": "import \"./ok.js\";\n",
      "re-export from a file in the tree": "export * from \"./ok.js\";\nexport { ok as again } from \"./ok.js\";\n",
      "dynamic import of a file in the tree": "export const p = import(\"./ok.js\");\n",
      "a mention in a block comment": "/* import \"package\"; import x from \"package\"; require(\"package\") */\nexport const a = 1;\n",
      "a mention in a line comment": "// import \"package\";\nexport const a = 1;\n",
      "the word import inside a string": "export const s = \"import 'package' from here\";\n",
      "the word import inside template literal text": "export const s = `import \"package\"; require(\"x\")`;\n",
      "a relative dynamic import inside an interpolation": "export const p = `${import(\"./ok.js\")}`;\n",
      "a comment mentioning a package inside an interpolation": "export const s = `${ /* import(\"package\") */ 1 }`;\n",
      "a line comment mentioning a package inside an interpolation": "export const s = `${ // import(\"package\")\n 1 }`;\n",
      "division after a parenthesised expression": "export const s = `${ (a) / 2 }`;\n",
      "division after a call, twice": "export const s = `${ f(x) / y / z }`;\n",
      "division after a call that is an argument of if": "export const s = `${ (() => { if (f(x) / y) return 1; return 2; })() }`;\n",
      "a regex with braces and quotes and no import": "export const s = `${ /[\"'{}]/.test(a) ? 1 : 2 }`;\n",
      "a regex literal containing a slash in a class": "export const r = /[/]x/;\nexport const q = 1;\n",
      "division with braces nearby": "export const s = `${ ({ a: 4 }).a / 2 }`;\n",
      "a nested template with only text": "export const s = `a${`b${1}c`}d`;\n",
    };
    for (const [label, text] of Object.entries(may)) {
      fs.writeFileSync(path.join(tree, "browser", "good.js"), text);
      assert.deepEqual(importOffenders(tree, ["browser/good.js"]), [], `must be accepted: ${label}`);
    }
  } finally {
    fs.rmSync(tree, { recursive: true, force: true });
    fs.rmSync(path.join(os.tmpdir(), `${path.basename(tree)}-outside.js`), { force: true });
  }
});

test("the vendored tree performs no network, process or filesystem access of its own", () => {
  const offenders = [];
  for (const rel of IDENTITY.files.map((f) => f.path).filter((p) => p.endsWith(".js"))) {
    const text = fs.readFileSync(path.join(TREE, rel), "utf8");
    for (const pattern of [/\brequire\s*\(/, /\bchild_process\b/, /\bfetch\s*\(/, /\bXMLHttpRequest\b/, /\bprocess\.(?:env|exit|argv|binding)/, /from\s*['"]node:/, /\beval\s*\(/, /new Function\s*\(/]) {
      if (pattern.test(text)) offenders.push(`${rel}: ${pattern}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("the reader imports the vendored parser by a relative path, and the strict manifest parser does not", () => {
  const reader = fs.readFileSync(path.join(REPO, "scripts", "structural.mjs"), "utf8");
  assert.match(reader, /from "\.\/vendor\/yaml\/browser\/index\.js"/);
  const manifestParser = fs.readFileSync(path.join(REPO, "scripts", "yaml.mjs"), "utf8");
  assert.equal(/vendor|structural/.test(manifestParser.split("\n").filter((l) => /^\s*import\b/.test(l)).join("\n")), false,
    "scripts/yaml.mjs is the strict policy and manifest parser and stays separate (decision H)");
});

test("nothing outside the vendored tree imports the vendored parser except the structural reader", () => {
  const users = [];
  const scan = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (full === VENDOR || entry.name === "node_modules" || entry.name === ".git" || entry.name === "fixtures") continue;
        scan(full);
      } else if (/\.(mjs|js|cjs)$/.test(entry.name) && /vendor\/yaml/.test(fs.readFileSync(full, "utf8"))) {
        users.push(path.relative(REPO, full).split(path.sep).join("/"));
      }
    }
  };
  scan(path.join(REPO, "scripts"));
  assert.deepEqual(users.sort(), ["scripts/structural.mjs"]);
});
