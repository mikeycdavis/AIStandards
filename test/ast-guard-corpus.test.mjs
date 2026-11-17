// ST-61 (#148): the public-path regression corpus of the 12 review rounds of PR #147 (ST-57), run against the
// parser-backed guard. Every case drives externalReferences / indirectNameReferences / unreviewedImports /
// directCallTexts, the functions the repository-wide invariant-4 scan calls. The cases come from the #147
// red-test corpus (origin/fix/st-57-invariant-4-guard-bypasses, head ec5c1e1e6; that branch stays unmerged).
//
// WHAT CHANGED FROM THE #147 FORMS. #147 asserted properties of a LEXICAL scanner (where a slash starts a
// regex, where a comment ends). With a parser those questions are answered by the grammar, so a case asks the
// question that matters to invariant 4 instead: does the guard fail (VIOLATION or UNKNOWN) on code that runs
// or loads something it must not, and stay clean on code that does not? Four classes of case are adapted, and
// each adapted case says so where it is:
//   - UNPARSEABLE: Acorn cannot parse the text (an unterminated string, or the keyword-after-?. tokenizer quirk
//     in Acorn 8.19.0). The outcome is UNKNOWN, which fails: fail-closed, no clean pass.
//   - AMBIGUOUS-BUT-CLEAN: the grammar says the text is a regex literal or a string, so the "hidden" call is not
//     executed. The guard reports CLEAN, and the case is listed as such.
//   - stripComments assertions moved to the public path (the call that matters is externalReferences).
//   - the token guard keeps running; where it over-reports (a hashbang with a quote) the case asserts the
//     syntax-tree result through analyzeSource.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { externalReferences, directCallTexts, indirectNameReferences, unreviewedImports, analyzeSource } from "./js-references.mjs";

// INVARIANT 4, THE CONTRACT. In a first-party runtime script the only permitted ways to bring in code are
// static imports of node: builtins and of relative paths that land inside the repository (and the literal
// forms of the same). Everything that can start a process, run source text, load native code or change how
// modules load is an offender, whatever its spelling (the full statement is at DYNAMIC_CODE_NAMES in
// js-references.mjs), unless the FILE is on this reviewed allowlist. An entry names the file, why it needs
// the capability, the loader-capable modules it may import, and the EXACT calls to them that were read: any
// other call, or an edit of one of these, no longer matches and the test fails until it is reviewed again.
const RUNTIME_ALLOWLIST = [
  {
    file: "scripts/test.mjs",
    reason: "the test runner starts one child process, node --test over the suite files, and nothing else",
    modules: ["node:child_process"],
    names: ["spawnSync"],
    calls: [
      'spawnSync ( process . execPath , [ "--test" , "--test-concurrency=1" , . . . FILES . map ( ( f ) = > path . join ( TEST_DIR , f ) ) ] , { stdio : "inherit" , cwd : REPO } , )',
    ],
  },
];

// Every JavaScript runtime file under <root>/scripts (.mjs, .js and .cjs, at any depth, node_modules reported
// separately) scanned for references that leave the repository or cannot be read, with the allowlist applied.
const RUNTIME_FILE = /\.(mjs|js|cjs)$/;
function runtimeOffenders(root, allowlist = RUNTIME_ALLOWLIST) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (RUNTIME_FILE.test(entry.name)) {
        const rel = path.relative(root, full).split(path.sep).join("/");
        const text = fs.readFileSync(full, "utf8");
        // The vendored tree is pinned content with its own ambient-access guard (vendor-yaml.test.mjs): it keeps
        // the import and URL rules here, and is exempt from the dynamic-code rules, which first-party scripts keep.
        const vendored = rel.startsWith("scripts/vendor/");
        let found = externalReferences(text, { file: full, root, dynamicCode: !vendored });
        const allowed = allowlist.find((e) => e.file === rel);
        if (allowed) {
          // The import is excused only when every import of the module binds exactly the reviewed names, unaliased.
          found = found.filter((o) => !allowed.modules.some((m) => o.startsWith("import " + m + " is a loader-capable module") && unreviewedImports(text, m, allowed.names).length === 0));
          const calls = directCallTexts(text, allowed.names);
          if (JSON.stringify(calls) !== JSON.stringify(allowed.calls)) found.push("the reviewed calls changed: " + JSON.stringify(calls));
          for (const ref of indirectNameReferences(text, allowed.names)) found.push("a reviewed name is used other than as a direct call (not a direct call): " + ref);
        }
        for (const o of found) out.push(rel + ": " + o);
      }
    }
  };
  if (fs.existsSync(path.join(root, "scripts"))) walk(path.join(root, "scripts"));
  return out.sort();
}
test("invariant 4: built-in module access without an import, reflective lookup with a built key, and a parenthesised computed callee are offenders", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const refs = (src) => externalReferences(src + "\n", where);
  const must = {
    "process.getBuiltinModule of a loader-capable module": 'const cp = process.getBuiltinModule("child_process"); cp.execSync("x");',
    "process.getBuiltinModule of a harmless module (the loader entry point itself is denied)": 'const fs = process.getBuiltinModule("node:fs");',
    "process.getBuiltinModule with a built name": "const m = process.getBuiltinModule(name);",
    "getBuiltinModule held": "const g = process.getBuiltinModule;",
    "getBuiltinModule optionally called": 'process.getBuiltinModule?.("vm");',
    "getBuiltinModule as a computed string": 'const m = process["getBuiltinModule"]("vm");',
    "Reflect.get of a global with a joined name": 'Reflect.get(globalThis, ["ev", "al"].join(""))("import(\\"package\\")");',
    "Reflect.get of a global with a variable key": "const f = Reflect.get(globalThis, name);",
    "Reflect.get of an object with a concatenated key": 'const f = Reflect.get(o, "ev" + "al");',
    "Reflect.get with a spread argument list": "const f = Reflect.get(...args);",
    "Reflect.get with one argument": "const f = Reflect.get(o);",
    "Reflect.getOwnPropertyDescriptor with a built key": "const d = Reflect.getOwnPropertyDescriptor(globalThis, key);",
    "a parenthesised computed callee": 'const [key] = ["constructor"]; ((() => {})[key])("return import(\'package\')")();',
    "a doubly parenthesised computed callee": "((registry[name]))(1);",
    "a parenthesised computed callee called optionally": "(registry[name])?.(1);",
    "a parenthesised computed callee that is constructed": "new (registry[name])(1);",
    "a parenthesised computed callee after return": "function f() { return (registry[name])(1); }",
    "a parenthesised computed callee with a call inside the group": "(make()[name])(1);",
    // review of 4d5a005: a group that follows a control head
    "a grouped computed callee after an if head": 'if (0) ((()=>{})[key])("return 1")();',
    "a grouped computed callee after a while head": 'while (0) (o[k])("x");',
    "a grouped computed callee after a for-of head": 'for (const a of b) (o[k])("x");',
    "a grouped computed callee after else if": 'if (x) {} else if (y) (o[k])("x")',
    "a grouped computed callee after a for-await head": 'async function f() { for await (const a of b) (o[k])("x"); }',
    "a grouped computed callee after a with head": 'with (o) (p[k])("x");',
    // review of 4d5a005: Reflect spelt another way
    "Reflect with a quoted method name": 'Reflect["get"](globalThis, ["ev","al"].join(""))("1");',
    "Reflect.get optionally called": "Reflect.get?.(globalThis, k);",
    "Reflect.get optionally called after a newline": "Reflect.get\n?.(globalThis, k);",
    "Reflect.get handed to Reflect.apply": "Reflect.apply(Reflect.get, Reflect, [globalThis, k]);",
    "Reflect.get held": "const g = Reflect.get;",
    "Reflect.get taken by an optional chain": "Reflect?.get(globalThis, k);",
    "Reflect.get with a quoted method name, optionally called": 'Reflect["get"]?.(globalThis, k);',
    "Reflect.getOwnPropertyDescriptor held": "const g = Reflect.getOwnPropertyDescriptor;",
    "Reflect with a computed method": "Reflect[m](globalThis, k);",
    "Reflect destructured": "const { get } = Reflect;",
    "Reflect aliased": "const R = Reflect; R.get(globalThis, k);",
    // review of 4d5a005: a tagged template calls its tag
    "a computed tag": "o[k]`x`;",
    "a computed tag with a substitution": "o[k]`x${1}`;",
    "a grouped computed tag": "(o[k])`x`;",
    "a grouped computed tag with a substitution": "(o[k])`x${y}`;",
    "a computed tag after a control head": "if (a) (o[k])`x`;",
  };
  assert.deepEqual(Object.entries(must).filter(([, src]) => refs(src).length === 0).map(([label]) => label), [], "forms the scan accepts but must reject");
  const may = {
    "Reflect.get with a string literal key": 'const v = Reflect.get(o, "kind");',
    "Reflect.get with a numeric literal key": "const v = Reflect.get(o, 0);",
    "Reflect.has with a variable key (no value is returned)": "const b = Reflect.has(o, key);",
    "a parenthesised computed read that is not called": "const x = (items[i]);",
    "a parenthesised literal-key callee": 'const r = (handlers["start"])(1);',
    "a computed read passed as an argument to a call": "const r = run(items[i])(1);",
    "a computed read in a control head followed by a parenthesised statement": "if (items[i]) (done)(1);",
    "an argument group after a call, not a control head": "f(a[k])(x);",
    "a computed read in an if head, then a group": "if (a[k]) (x);",
    "a computed read in a while head, then a group": "while (a[k]) (x);",
    "a literal-key tag": 'o["k"]`x`;',
    "a computed read concatenated with a template": "const s = a[k] + `x`;",
    "a computed read inside a template substitution": "const s = `x${a[k]}y`;",
    "a plain tag": "tag`x`;",
    "Reflect.ownKeys": "const ks = Reflect.ownKeys(o);",
    "Reflect.get with a quoted method name and a literal key": 'const v = Reflect["get"](o, "kind");',
    "the word getBuiltinModule in a comment": "// process.getBuiltinModule is denied\nconst a = 1;",
    "an identifier that merely contains the word": "const getBuiltinModules = 1;",
  };
  for (const [label, src] of Object.entries(may)) assert.deepEqual(refs(src), [], "must be accepted: " + label);
});

test("an allowlisted file may not alias, pass on or re-call a reviewed name: only the recorded direct calls are allowed", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-alias-"));
  try {
    const put = (text) => {
      const full = path.join(root, "scripts", "run.mjs");
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, text);
    };
    const list = [{ file: "scripts/run.mjs", reason: "starts the one reviewed child process", modules: ["node:child_process"], names: ["spawnSync"], calls: ['spawnSync ( "git" , [ "status" ] )'] }];
    const header = 'import { spawnSync } from "node:child_process";\n';
    const reviewed = 'spawnSync("git", ["status"]);\n';
    put(header + reviewed);
    assert.deepEqual(runtimeOffenders(root, list), [], "the reviewed form is clean");
    const extra = {
      "an alias then a call": 'const again = spawnSync;\nagain(process.execPath, ["--eval", "import(\\"package\\")"]);\n',
      ".call": 'spawnSync.call(null, "git", ["log"]);\n',
      ".apply": 'spawnSync.apply(null, ["git", ["log"]]);\n',
      "an optional call": 'spawnSync?.("git", ["log"]);\n',
      "a parenthesised call": '(spawnSync)("git", ["log"]);\n',
      "passed on as a value": "run(spawnSync);\n",
      "held in a list": 'const fns = [spawnSync];\nfns[0]("git", ["log"]);\n',
      "re-exported": "export { spawnSync };\n",
      // review of 4d5a005 (Codex): import.meta is not an import declaration and exempts nothing after it
      "an alias after import.meta": 'const url = import.meta.url\nconst again = spawnSync\nagain(process.execPath, ["-e", "1"]);\n',
      "an alias after a dynamic import": 'const m = import("node:fs")\nconst again = spawnSync\nagain("git", ["log"]);\n',
    };
    const missed = [];
    for (const [label, add] of Object.entries(extra)) {
      put(header + reviewed + add);
      if (!runtimeOffenders(root, list).some((o) => o.includes("spawnSync") && o.includes("not a direct call"))) missed.push(label);
    }
    assert.deepEqual(missed, [], "forms the allowlist accepts but must reject");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// Round 2 review of a1dd371 (PR #147): number literals that swallow a member chain, `for await` as a control
// head, process members spelt around `process.binding`, and a grouped callee whose computed member is not last.
test("invariant 4: number literals end before a member access, for await is a control head, process internals are denied however spelt, and a selected computed callee is called", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const refs = (src) => externalReferences(src + "\n", where);
  const must = {
    "a number with an empty fraction, then a member chain": '1..constructor.constructor("return process")();',
    "a hex number, then a member chain": '0x1.constructor.constructor("return process")();',
    "a bigint, then a member chain": '1n.constructor.constructor("return process")();',
    "a separated number with an empty fraction, then a member chain": '1_0..constructor.constructor("return process")();',
    "a decimal fraction, then a member chain": '1.0.constructor.constructor("return process")();',
    "an exponent number, then a member chain": '1e3.constructor.constructor("return process")();',
    "a leading-dot number, then a member chain": '.5.constructor.constructor("return process")();',
    "process[\"binding\"]": 'const b = process["binding"]("natives");',
    "process?.binding": 'const b = process?.binding("natives");',
    "(process).binding": 'const b = (process).binding("natives");',
    "binding destructured from process": 'const { binding } = process; binding("natives");',
    "binding destructured under another name": 'const { binding: b } = process;',
    "binding destructured by a quoted key": 'const { "binding": b } = process;',
    "binding through an alias of process": 'const p = process; p.binding("natives");',
    "an alias member read by a quoted key": 'const p = process; p["binding"]("natives");',
    "process.execve": 'process.execve("/bin/sh", [], []);',
    "process[\"execve\"]": 'process["execve"]("/bin/sh", [], []);',
    "execve destructured from process": "const { execve } = process;",
    "process._linkedBinding": 'process._linkedBinding("x");',
    "process[\"_linkedBinding\"]": 'process["_linkedBinding"]("x");',
    "_linkedBinding through an alias": 'const p = process; p._linkedBinding("x");',
    "a selected computed callee with ??": '(o[k] ?? 0)("1");',
    "a selected computed callee with ||": '(o[k] || 0)("1");',
    "a selected computed callee with &&": '(o[k] && 0)("1");',
    "a computed callee chosen by a conditional": '(c ? o[k] : 0)("1");',
    "a selected computed callee used as a tag": "(o[k] ?? 0)`x`;",
    "a selected computed callee after a control head": 'if (a) (o[k] ?? 0)("1");',
    "a selected computed callee, doubly grouped": '((o[k] ?? 0))("1");',
  };
  assert.deepEqual(Object.entries(must).filter(([, src]) => refs(src).length === 0).map(([label]) => label), [], "forms the scan accepts but must reject");
  const may = {
    "a decimal number": "const a = 1.5;",
    "an exponent number": "const a = 1e3;",
    "an exponent with a sign and a fraction": "const a = 1.5e-3;",
    "a leading-dot number": "const a = .5;",
    "a hex number": "const a = 0xff;",
    "a separated number": "const a = 1_000;",
    "a bigint": "const a = 10n;",
    "a number then a method": "const a = 1.5.toFixed(1);",
    "a number then a method after an empty fraction": "const a = 1..toFixed(1);",
    "a range of numbers in a call": "run(1.5, 2e3, .5, 0xff);",
    "a string that is the word binding as a call argument": 'finding("binding", "a message");',
    "a list of names that includes binding": 'const names = ["binding", "execve"];',
    "process.argv": "const a = process.argv.slice(2);",
    "process.env read by a literal key": 'const e = process.env["HOME"];',
    "a comma group whose computed member is dropped": '(a[k], 0)("1");',
    "an argument group after a call, not a control head": "f(a[k])(x);",
    "a conditional on a computed member whose result is not called": "const v = (c ? o[k] : 0);",
    "a selected computed member that is not called": "const v = (o[k] ?? 0);",
    "a selected computed member in a call's arguments": "run(o[k] ?? 0)(1);",
    "a selected computed member in an if head": "if (o[k] ?? 0) (done)(1);",
    "a selected literal-key member": '(o["k"] ?? 0)("1");',
    "ordinary indexing": "const v = items[i] ?? items[0];",
  };
  const falsePositives = Object.entries(may).filter(([, src]) => refs(src).length > 0).map(([label]) => label);
  assert.deepEqual(falsePositives, [], "forms the scan must accept");
});

test("invariant 4: for await ( ... ) is a control head, so a slash after it starts a regex that hides nothing", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const found = externalReferences('async function f() { for await (const x of y) /"/.test(z); eval("1"); "}\n', where);
  // UNPARSEABLE: the trailing quote is an unterminated string, so the outcome is UNKNOWN, which fails
  assert.ok(found.length > 0, "the for-await source with a stray quote fails closed: " + JSON.stringify(found));
  // the parseable form: the regex statement hides nothing, so eval after it is reported by the syntax tree
  const ok = analyzeSource('async function f() { for await (const x of y) /"/.test(z); eval("1"); }\n');
  assert.ok(ok.findings.some((f) => f.rule === "V-DYN-NAME"), "eval after a for-await regex statement is reported: " + JSON.stringify(ok.findings));
  const plain = externalReferences('for (const x of y) /"/.test(z); eval("1"); "\n', where);
  assert.ok(plain.length > 0, "the for head baseline fails closed: " + JSON.stringify(plain));
  // the import after the regex statement is still read
  const src = 'async function f() { for await (const x of y) /"/.test(z); }\nimport "package";\n';
  assert.ok(externalReferences(src, where).some((o) => o.includes("import package")), "the import after the regex is read");
});

// Round 3 review of 4557d13 (PR #147): comment ends, postfix ++ before a slash, and the Codex findings.
test("invariant 4: a line comment ends at any JavaScript line terminator, in the token scan and in the import scan", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const refs = (src) => externalReferences(src + "\n", where);
  const must = {
    "a comment ended by a carriage return": '// x\reval("1")',
    "a comment ended by U+2028": '// x\u2028eval("1")',
    "a comment ended by U+2029": '// x\u2029eval("1")',
    "code, then a comment ended by a carriage return": 'const a = 1; // c\rglobalThis.eval("1");',
    "a comment ended by CRLF": '// x\r\neval("1")',
    "a comment ended by a line feed": '// x\neval("1")',
  };
  assert.deepEqual(Object.entries(must).filter(([, src]) => !refs(src).some((o) => o.includes("eval"))).map(([label]) => label), [], "the code after the comment must be read");
  const may = {
    "eval inside a comment on one line": '// x eval("1")',
    "eval inside a comment before the end of a CRLF line": '// x eval("1")\r\nconst a = 1;',
    "a comment ended by U+2028 followed by harmless code": "// x\u2028const a = 1;",
  };
  assert.deepEqual(Object.entries(may).filter(([, src]) => refs(src).length > 0).map(([label]) => label), [], "text inside a comment is not code");
  for (const [label, sep] of [["CR", "\r"], ["LS", "\u2028"], ["PS", "\u2029"]]) {
    const after = externalReferences("// c" + sep + 'import x from "package";\n', where);
    assert.ok(after.some((o) => o.includes("import package")), "the import after a " + label + " line end is read: " + JSON.stringify(after));
  }
  assert.deepEqual(externalReferences('// c import x from "package";\n', where), [], "an import inside a one-line comment is not read");
});

test("invariant 4: a slash after a postfix ++ or -- is division, so the code after it is not hidden as a regex", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const refs = (src) => externalReferences(src + "\n", where);
  const must = {
    "binding destructured after a postfix increment": 'let i=0; i++ / 2; const {binding} = process; binding("spawn_sync") / 3',
    "execve destructured after a postfix increment": 'let i=0; i++ / 2; const {execve} = process; execve("/bin/sh") / 3',
    "an alias of process after a postfix increment": 'let i=0; i++ / 2; const p=process; p.binding("x") / 3',
    "Reflect.get with a built key after a postfix increment": 'let i=0; i++ / 2; Reflect.get(f, k)("x") / 3',
    "a postfix decrement": 'let i=0; i-- / 2; const {binding} = process; binding("x") / 3',
    "a postfix increment on a member": 'o.n++ / 2; const {binding} = process; binding("x") / 3',
    "a postfix increment on a parenthesised operand": '(i)++ / 2; const {binding} = process; binding("x") / 3',
    // an ambiguous slash is read as a regex, but its body is still scanned as code
    "a slash after a closing brace whose body names eval": '{} /eval("1")/.test(x);',
  };
  assert.deepEqual(Object.entries(must).filter(([, src]) => refs(src).length === 0).map(([label]) => label), [], "forms the scan accepts but must reject");
  const may = {
    "a regex literal naming binding after an operator": 'const r = /binding/.test(s);',
    "a regex literal naming binding after a comma": "f(a, /binding/);",
    "a regex literal after return": "function f() { return /execve/.test(s); }",
    "a regex literal after a control head": 'if (x) /execve/.test(y);',
    "division after a postfix increment": "let i = 0; const h = i++ / 2; const k = 4 / 2;",
    "a unary plus before a regex after a binary plus": "const n = a + +/x/.source.length;",
    "division after a closing bracket": "const q = a[0] / 2 / 3;",
  };
  assert.deepEqual(Object.entries(may).filter(([, src]) => refs(src).length > 0).map(([label]) => label), [], "forms the scan must accept");
});

// Round 4 review of be0215c (PR #147): keyword member names, export default / extends, ambiguous slashes, module
// subpaths, hashbang lines.
test("invariant 4: a keyword used as a member name does not start a regex, and default / extends do", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const refs = (src) => externalReferences(src + "\n", where);
  // The guard accepts the text: neither a finding nor an UNKNOWN. (`o?.case / 2` and its kin are UNPARSEABLE in
  // Acorn 8.19.0, whose tokenizer reads the slash after `?.` plus a keyword as a regex start: UNKNOWN, which fails.)
  const hidesEval = (src) => refs(src).length === 0;
  const keywords = ["case", "default", "delete", "do", "else", "extends", "in", "instanceof", "new", "return", "throw", "typeof", "void", "yield", "await", "of", "if", "while", "for", "with"];
  const missed = [];
  for (const k of keywords) {
    for (const dot of [".", "?."]) {
      if (hidesEval(`o${dot}${k} / 2; const s = "/"; eval("1"); // "`)) missed.push(`o${dot}${k} / 2`);
      if (hidesEval(`o${dot}${k}++ / 2; const s = "/"; eval("1"); // "`)) missed.push(`o${dot}${k}++ / 2`);
    }
    for (const k2 of ["if", "while", "for", "with"]) {
      if (hidesEval(`o.${k2}(x) / 2; const s = "/"; eval("1"); // "`)) missed.push(`o.${k2}(x) / 2`);
    }
    if (hidesEval(`o.${k}(x) / 2; const s = "/"; eval("1"); // "`)) missed.push(`o.${k}(x) / 2`);
  }
  assert.deepEqual([...new Set(missed)], [], "member names after which the scan lost track of strings and comments");
  const must = {
    "export default then a regex with a quote": 'export default /"/; eval("1"); const q = "x"; const r = /"/;',
    "export default then a regex with a single quote": "export default /'/; eval(\"1\"); const q = 'x'; const r = /'/;",
    "export default then a regex with a backtick": "export default /`/; eval(\"1\"); const q = `x`; const r = /`/;",
    "export default with a flag and a test": 'export default /"/g.test(1) || eval("1") || /"/;',
    "extends then a regex": 'class A extends /"/ {} ; eval("1"); const q = "x"; const r = /"/;',
    "extends then a regex with a single quote": "class A extends /'/ {} ; eval(\"1\"); const q = 'x'; const r = /'/;",
    "return then a regex": 'function f() { return /"/; } eval("1"); const q = "x"; const r = /"/;',
    "typeof then a regex": 'const t = typeof /"/; eval("1"); const q = "x"; const r = /"/;',
  };
  assert.deepEqual(Object.entries(must).filter(([, src]) => hidesEval(src)).map(([label]) => label), [], "forms that hide eval");
  const may = {
    "default as a member then division": "const a = o.default / 2 / 3;",
    "extends as a member then division": "const a = o.extends / 2 / 3;",
    "a regex after export default": "export default /abc/.test(s);",
    "a regex after extends": "class A extends /abc/ {}",
  };
  assert.deepEqual(Object.entries(may).filter(([, src]) => refs(src).length > 0).map(([label]) => label), [], "forms the scan must accept");
});

test("invariant 4: a slash the scan cannot place, whose two readings disagree about strings or comments, is unreadable", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const refs = (src) => externalReferences(src + "\n", where);
  const must = {
    "an object end divided, then a string and a comment": 'x = {} / 2; const s = "/"; eval("1"); // "',
    "an object end divided, single quotes": "x = {} / 2; const s = '/'; eval(\"1\"); // '",
    "an object end divided, a template": "x = {} / 2; const s = `/`; eval(\"1\"); const t = `",
    "a prefix decrement before a slash": 'x = --/2; const s = "/"; eval("1"); // "',
  };
  assert.deepEqual(Object.entries(must).filter(([, src]) => refs(src).length === 0).map(([label]) => label), [], "forms the scan accepts but must reject");
  const may = {
    "a member divided after an object": "const o = {}; const n = o.a / 2;",
    "a block then a plain regex": "function f() {}\n/abc/.test(s);",
    "an object end divided, no strings": "x = {} / 2; const y = 3 / 4;",
    "a block then a regex with a class": "if (a) {}\n/[a-z]+/.test(s);",
  };
  assert.deepEqual(Object.entries(may).filter(([, src]) => refs(src).length > 0).map(([label]) => label), [], "forms the scan must accept");
});

test("invariant 4: loader-capable modules are matched with their subpaths, and a hashbang line is a comment", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const refs = (src) => externalReferences(src + "\n", where);
  const must = {
    "a static import of inspector/promises": 'import "inspector/promises";',
    "a node: static import of inspector/promises": 'import "node:inspector/promises";',
    "a dynamic import of inspector/promises": 'import("node:inspector/promises");',
    "a named import of a subpath": 'import { Session } from "node:inspector/promises";',
    "a subpath of worker_threads": 'import("worker_threads/x");',
    "a require of a subpath": 'require("node:child_process/x");',
  };
  assert.deepEqual(Object.entries(must).filter(([, src]) => !refs(src).some((r) => r.includes("loader-capable"))).map(([label]) => label), [], "subpaths that pass as ordinary modules");
  assert.deepEqual(refs('import "node:fs/promises";'), [], "an ordinary node: subpath stays accepted");
  assert.deepEqual(refs('import "node:inspectorx";').filter((r) => r.includes("loader-capable")), [], "only a / boundary extends a module name");
  // The syntax tree treats the hashbang line as a comment. The older token reading may still over-report it,
  // which is the defense-in-depth direction (it can only add a failure), so the tree result is asserted here.
  const hashAst = analyzeSource('#!/usr/bin/env node "\neval("1");');
  assert.ok(hashAst.findings.some((f) => f.rule === "V-DYN-NAME"), "the code after a hashbang line is scanned");
  assert.ok(!hashAst.findings.some((f) => f.rule === "U-PARSE"), "a quote in a hashbang line is not an unterminated string");
  assert.ok(refs('#!/usr/bin/env node "\neval("1");').length > 0, "the combined guard fails on it");
  assert.deepEqual(refs("#!/usr/bin/env node\nconst a = 1;"), [], "a plain hashbang is accepted");
  assert.deepEqual(analyzeSource('#!/usr/bin/env node "\nimport x from "package";\n').specifiers, [{ form: "import", specifier: "package" }], "the hashbang line is skipped and the import after it is read");
});

// Round 5 review of a2c9e51 (PR #147): optional-chained computed reads, regex bodies before a slash, keyword-named
// identifiers, spreads, HTML-like comments and legacy octal escapes.
test("invariant 4: round 5 - optional-chained computed reads, a slash after a regex literal, keyword-named identifiers, spreads", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const refs = (src) => externalReferences(src + "\n", where);
  const must = {
    "x?.[eval]": 'x?.["eval"]("1");',
    "o?.[constructor]": 'o?.["constructor"]("1")();',
    "process?.[binding]": 'process?.["binding"]("fs");',
    "a division after a regex literal": 'x = /a+/ / 2; q = "/"; eval("1"); /* " */',
    "a division after an alternation regex": 'x = /a|b+/ / 2; q = "/"; eval("1"); /* " */',
    "a division after a class regex": 'x = /\\d+/ / 2; q = "/"; eval("1"); /* " */',
    "of as a variable": 'let of = 4; q = of / 2; r = "/"; eval("1"); /* " */',
    "a private name in": 'class A { #in = 1; f() { return this.#in / 2; } } r = "/"; eval("1"); /* " */',
    "a private name of": 'class A { #of = 1; f() { return this.#of / 2; } } r = "/"; eval("1"); /* " */',
    "a private name return": 'class A { #return = 1; f() { return this.#return / 2; } } r = "/"; eval("1"); /* " */',
    "a private name default after ?.": 'class A { #default = 1; f(o) { return o?.#default / 2; } } r = "/"; eval("1"); /* " */',
    "a parameter named of": 'const f = (of) => of / 2; r = "/"; eval("1"); /* " */',
    "yield as a variable": 'var yield = 4; q = yield / 2; r = "/"; eval("1"); /* " */',
    "await as a variable": 'var await = 4; q = await / 2; r = "/"; eval("1"); /* " */',
    "a spread of typeof then a regex": "[...typeof /'/, eval(\"1\"), /'/]",
    "a spread of void then a regex": "[...void /'/, eval(\"1\"), /'/]",
    "a spread of await then a regex": 'async function f() { return [...await /"/, eval("1"), /"/]; }',
    "a spread of typeof then a backtick regex": "[...typeof /\u0060/, eval(\"1\"), /\u0060/]",
    "a legacy octal escape for eval": 'globalThis["\\145val"]("1");',
    "a legacy octal escape inside a name": 'process["bi\\156ding"]("fs");',
    "a legacy octal escape of three digits": 'globalThis["\\145\\166\\141\\154"]("1");',
    "an HTML-like comment hiding a block comment": '<!-- /*\neval("x");\n--> */',
    "a closing HTML-like comment line": 'a = 1;\n--> /*\neval("x");\n*/ x = "',
  };
  assert.deepEqual(Object.entries(must).filter(([, src]) => !refs(src).some((r) => /eval|constructor|binding|execSync|unparseable|\bimport\b/.test(r))).map(([label]) => label), [], "forms the scan accepts but must reject");
  const may = {
    "a spread array of names": "const a = [...['x', 'y']];",
    "division after a regex literal, no strings": "const x = /a+/.source.length / 2;",
    "for of over a regex match": "for (const m of s.matchAll(/a/g)) f(m);",
    "an optional-chained numeric index": "const v = a?.[0] / 2;",
    "an optional-chained literal key": 'const v = a?.["name"];',
    "an octal escape that is plain text": 'const s = "\\101\\102";',
    "a NUL escape": 'const s = "a\\0b";',
    "a plain regex after return": "function f() { return /ab+/.test(s); }",
  };
  assert.deepEqual(Object.entries(may).filter(([, src]) => refs(src).length > 0).map(([label]) => label), [], "forms the scan must accept");
});

// Round 6 review of 0bf32b7 (PR #147): a slash that automatic semicolon insertion or a prefix operator makes a regex.
const ROUND11 = () => ({
  where: { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } },
});
const round11 = (must, may, label) => {
  const { where } = ROUND11();
  const caught = (src) => externalReferences(src + "\n", where).length > 0;
  assert.deepEqual(Object.entries(must).filter(([, src]) => !caught(src)).map(([k]) => k), [], "forms that hide a read: " + label);
  assert.deepEqual(Object.entries(may).filter(([, src]) => caught(src)).map(([k]) => k), [], "clean forms that are reported: " + label);
};

test("invariant 4: round 12 - from as a binding name in an import or export clause", () => {
  round11({
    "an import binding named from": "import from from \"node:child_process\";\nfrom.execSync(\"echo PWNED\");",
    "a binding named from, then a named list": "import from, { a } from \"node:child_process\";",
    "a binding named from from vm": "import from from \"node:vm\";",
    "a namespace named from": "import * as from from \"node:child_process\";",
    "an export of from from a loader": "export { from } from \"node:child_process\";",
    "a binding named from and a name list": "import from, * as ns from \"node:worker_threads\";",
  }, {
    "an import binding named from of a clean module": "import from from \"node:fs\";\nfrom.readFileSync(\"x\");",
    "a plain default import": "import fs from \"node:fs\";",
    "a namespace import": "import * as p from \"node:path\";",
    "an export of a name from a clean module": "export { join } from \"node:path\";",
  }, "from");
});

test("invariant 4: round 12 - a class body is the brace that opens the class, not any brace in its heritage", () => {
  round11({
    "a heritage function with a brace block": "class A extends (function () { var g = function () {}[\"const\" + \"ructor\"](\"globalThis.PWNED = 42\")\n{}\n g(); return Object; })() {}",
    "a heritage arrow with a built access": "class B extends (() => { return {}[\"ev\" + \"al\"](\"1\")\n{}\n })() {}",
    "a heritage call holding a function": "class C extends f(function () { return {}[\"Fun\" + \"ction\"](\"1\")\n{}\n }) {}",
    "a constructor call in a heritage function": "class D extends (function () { constructor(\"return 7\")\n{}\n return Object; })() {}",
  }, {
    "a derived class with a call heritage": "class E extends f(1) { m() {}\n [a]() {} }",
    "a derived class with a name heritage": "class F extends G { m() {}\n [a]() {} constructor() { super(); } }",
    "a class with a field and a method": "class H { x = 1;\n m() {} [k]() {} }",
  }, "heritage");
});

test("invariant 4: round 12 - a quoted destructuring key is read like an identifier key", () => {
  round11({
    "a quoted Reflect key": "const { \"Reflect\": R } = globalThis;\nR.get(globalThis, \"ev\" + \"al\")(\"40+2\");",
    "a single-quoted Reflect key": "const { 'Reflect': R } = self;\nR.get(self, k);",
    "an assigned quoted Reflect key": "var R;\n({ \"Reflect\": R } = globalThis);\nR.get(globalThis, k);",
    "a quoted require key": "const { \"require\": r } = module;\nr(\"child_process\");",
    "a quoted require key in a function parameter": "function f({ \"require\": r }) { return r(\"child_process\"); }\nf(module);",
    "a quoted createRequire key": "const { \"createRequire\": c } = m;\nc(__filename)(\"child_process\");",
  }, {
    "a quoted key that is not a loader": "const { \"name\": n } = o;",
    "an unrelated quoted object key": "const o = { \"a\": 1, \"b\": 2 };",
    "a quoted key naming a version": "const { \"version\": v } = process;",
  }, "quoted key");
});

test("invariant 4: round 12 - the module instance members that run code", () => {
  round11({
    "module._compile": "module._compile(\"globalThis.PWNED = 1\", \"x.js\");",
    "module string _compile": "module[\"_compile\"](\"globalThis.PWNED = 1\", \"x.js\");",
    "Module._extensions": "Module._extensions[\".js\"](module, \"x.js\");",
    "Module string _extensions": "Module[\"_extensions\"][\".js\"](module, \"x.js\");",
    "module.load": "module.load(\"x.js\");",
    "module string load": "module[\"load\"](\"x.js\");",
    "Module.prototype.load": "Module.prototype.load.call(m, \"x.js\");",
    "prototype string load": "Module.prototype[\"load\"].call(m, \"x.js\");",
    "module optional load": "module?.load(\"x.js\");",
    "Module.runMain": "Module.runMain(\"x.js\");",
    "Module._preloadModules": "Module._preloadModules([\"x\"]);",
  }, {
    "a method named load on a plain object": "yaml.load(text);",
    "a method named load defined": "const loader = { load(x) { return x; } };",
    "a function named load": "function load(x) { return x; }\nload(1);",
    "a cache load": "cache.load(\"x\");",
    "a window load event": "window.addEventListener(\"load\", f);",
  }, "module members");
});

test("invariant 4: round 11 - the third dot of a spread is not a member dot", () => {
  round11({
    "an object spread of a data: import": "var o = {...import(\"data:text/javascript,globalThis.__x=9\")};",
    "an argument spread of a data: import": "f(...import(\"data:text/javascript,1\"));",
    "an object spread of a node: import": "var o = {...import(\"node:child_process\")};",
    "an object spread of a run-time import": "var o = {...import(u)};",
    "an array spread of a data: import": "var a = [...import(\"data:text/javascript,1\")];",
    "an array spread of Reflect.get": "var a = [...Reflect.get(globalThis, \"ev\" + \"al\")(\"__x=1; []\")];",
    "an object spread of Reflect.get": "var o = {...Reflect.get(globalThis, \"ev\" + \"al\")(\"__x=1\")};",
    "an argument spread of Reflect.get": "f(...Reflect.get(globalThis, \"ev\" + \"al\")(\"1\"));",
    "a spread of a string-named Reflect.get": "var a = [...Reflect[\"get\"](globalThis, \"ev\" + \"al\")(\"1\")];",
    "a spread of a process binding": "var a = [...Reflect.get(globalThis, \"binding\")];",
  }, {
    "a member named import": "const m = o.import(\"data:text/javascript,1\");",
    "an optional member named import": "const m = o?.import(\"data:text/javascript,1\");",
    "an object spread of a name": "const o = {...a, ...b};",
    "an array spread of a name": "const x = [...a, ...b];",
    "an argument spread of a call": "f(...g(1));",
    "a member named Reflect": "const v = lib.Reflect;",
  }, "spread");
});

test("invariant 4: round 11 - a bracket after a closing brace is a computed access", () => {
  round11({
    "an object literal with a built key": "{__proto__: globalThis}[\"ev\" + \"al\"](\"__x=2\");",
    "an object literal with a template key": "{__proto__: globalThis}[`ev${\"al\"}`](\"1\");",
    "an empty literal with a built Function": "{}[\"Fun\" + \"ction\"](\"return 7\")();",
    "new on an object literal member": "new {__proto__: globalThis}[\"Fun\" + \"ction\"](\"return 7\");",
    "a process literal with a template key": "{__proto__: process}[`bind${\"ing\"}`](\"fs\");",
    "a process literal with an array key": "{__proto__: process}[[\"binding\"]](\"fs\");",
    "an assigned object literal": "var x = {__proto__: globalThis}[\"ev\" + \"al\"](\"1\");",
    "after an if block": "if (a) {}\n[\"Fun\" + \"ction\"](\"x\")();",
    "after a function body": "function f() {}\n[\"ev\" + \"al\"](\"1\");",
  }, {
    "a class with a computed method": "class A { m() {}\n [Symbol.iterator]() { return []; } }",
    "a class with a computed method after a field": "class B { x = 1;\n [k]() {} }",
    "a class with two computed methods": "class C { m() {} [a]() {} [b]() {} }",
    "an array statement after a block": "if (a) { b(); }\n[1, 2].forEach(f);",
    "an array of names after a function": "function f() {}\nconst names = [\"x\", \"y\"];",
    "an object member with a literal key": "const v = {a: 1}[\"a\"];",
  }, "brace");
});

test("invariant 4: round 11 - of is a keyword only right after the binding of a for-of head", () => {
  round11({
    "a variable named of in a for update": "for (var of = globalThis, i = 0; i < 1; i++, of[\"ev\" + \"al\"](\"__x=1\")) {}",
    "an arrow parameter named of in a for head": "for (var f = of => of[\"ev\" + \"al\"](\"__x=1\"), r = f(globalThis); ;) break;",
    "a variable named of in a for initialiser": "for (var of = process, b = of[\"binding\"](\"fs\"); ;) break;",
    "an iterable named of": "var of = globalThis;\nfor (var q of of[\"ev\" + \"al\"](\"[]\")) {}",
    "a let named of": "for (let of = globalThis; ; of[\"ev\" + \"al\"](\"1\")) break;",
  }, {
    "of after a name": "for (const n of [\"eval\", \"binding\"]) log(n);",
    "of after an assigned name": "for (n of [\"eval\"]) log(n);",
    "of after a destructure": "for (const [a, b] of [[\"eval\", 1]]) log(a, b);",
    "of after an object destructure": "for (const { a } of [{ a: 1 }]) log(a);",
    "for await of": "async function f() { for await (const n of [\"eval\"]) log(n); }",
    "of after a member": "for (o.k of [\"eval\"]) log(o.k);",
  }, "of");
});

test("invariant 4: round 11 - Reflect reached through a held or grouped global object", () => {
  round11({
    "a parenthesised global": "(globalThis).Reflect.get(globalThis, \"ev\" + \"al\")(\"1\");",
    "a sequence holding the global": "(0, globalThis).Reflect.get(globalThis, \"ev\" + \"al\")(\"1\");",
    "an array holding the global": "[globalThis][0].Reflect.get(globalThis, \"ev\" + \"al\")(\"1\");",
    "the global reached through itself": "globalThis[\"globalThis\"].Reflect.get(globalThis, \"ev\" + \"al\")(\"1\");",
    "a parenthesised optional global": "(globalThis)?.Reflect.get(globalThis, \"ev\" + \"al\")(\"1\");",
  }, {
    "a plain member named Reflect": "const v = lib.Reflect;",
    "a bare Reflect with a literal key": "const v = Reflect.get(o, \"name\");",
    "a parenthesised global Reflect with a literal key": "const v = (globalThis).Reflect.get(o, \"name\");",
  }, "reflect");
});

test("invariant 4: round 11 - an await or yield group is a group", () => {
  round11({
    "an await group": "async function f() { return (await (o[k]))(1); }",
    "a yield group": "function* g() { return (yield (o[k]))(1); }",
    "an await call group": "async function f() { return (await o[k])(1); }",
  }, {
    "an await of a call": "async function f() { return (await g(1))(2); }",
    "an await of a literal member": "async function f() { return (await o[\"a\"])(2); }",
  }, "await");
});

test("invariant 4: round 10 - a keyword used as a member or variable name before a bracket is an operand", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const refs = (src) => externalReferences(src + "\n", where);
  const caught = (src) => refs(src).length > 0;
  const must = {
    "a default namespace member": "import * as ns from \"node:process\";\nns.default[\"getBuiltinModule\"](\"child_process\");",
    "a default namespace member, binding": "import * as ns from \"node:process\";\nns.default[\"binding\"](\"natives\");",
    "a default namespace member, run-time key": "import * as ns from \"node:process\";\nns.default[k](\"x\");",
    "an object member default, run-time key": "const o = { default: globalThis };\no.default[k](\"x\");",
    "a variable named of": "const of = process;\nof[\"binding\"](\"fs\");",
    "a variable named of, eval": "const of = globalThis;\nof[\"eval\"](\"1\");",
    "a private name in": "class A { #in = process; m() { return this.#in[\"getBuiltinModule\"](\"child_process\"); } }",
    "an optional member of": "const o = { of: globalThis };\no?.of[\"eval\"](\"1\");",
    "a member in an array key": "const o = { in: globalThis };\no.in[[\"eval\"]](\"1\");",
  };
  for (const w of ["of", "return", "in", "delete", "typeof", "new", "else", "void", "case", "do", "throw", "instanceof", "debugger", "break", "continue", "extends", "export", "default"]) {
    must["a member named " + w + ", eval"] = "const o = {};\no." + w + "[\"eval\"](\"1\");";
    must["a member named " + w + ", binding"] = "const o = {};\no." + w + "[\"binding\"](\"fs\");";
    must["a member named " + w + ", run-time key"] = "const o = {};\no." + w + "[k](\"x\");";
    must["a member named " + w + ", array key"] = "const o = {};\no." + w + "[[\"Function\"]](\"x\");";
  }
  assert.deepEqual(Object.entries(must).filter(([, src]) => !caught(src)).map(([label]) => label), [], "keyword-named operands that hide a member read");
  const may = {
    "of in a for head": "for (const n of [\"eval\", \"binding\"]) log(n);",
    "of in a for head with a destructure": "for (const [a, b] of [[\"eval\", 1]]) log(a, b);",
    "return of an array": "function f() { return [\"eval\", \"binding\"]; }",
    "typeof then an array": "const t = typeof [\"eval\"];",
    "in then an array": "const t = \"a\" in [\"eval\"];",
    "an array after default": "export default [\"eval\", \"binding\"];",
    "a plain array": "const n = [\"eval\", \"Function\", \"binding\"];",
  };
  assert.deepEqual(Object.entries(may).filter(([, src]) => caught(src)).map(([label]) => label), [], "clean forms that are reported");
});

test("invariant 4: round 10 - Reflect reached through a global object is analysed like a bare Reflect", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const refs = (src) => externalReferences(src + "\n", where);
  const caught = (src) => refs(src).length > 0;
  const must = {
    "globalThis.Reflect, built key": "globalThis.Reflect.get(globalThis, \"ev\" + \"al\")(\"1\");",
    "globalThis?.Reflect, built key": "globalThis?.Reflect.get(globalThis, \"ev\" + \"al\")(\"2+2\");",
    "globalThis.Reflect, process binding": "globalThis.Reflect.get(process, \"binding\")(\"fs\");",
    "self.Reflect, process execve": "self.Reflect.get(process, \"execve\");",
    "window.Reflect, run-time key": "window.Reflect.get(process, k);",
    "global.Reflect, run-time key": "global.Reflect.get(process, k);",
    "globalThis string Reflect, run-time key": "globalThis[\"Reflect\"].get(process, k);",
    "globalThis string Reflect, process binding": "globalThis[\"Reflect\"].get(process, \"binding\");",
    "globalThis.Reflect, descriptor": "globalThis.Reflect.getOwnPropertyDescriptor(process, \"binding\").value(\"fs\");",
    "globalThis optional string Reflect, built key": "globalThis?.[\"Reflect\"].get(globalThis, \"ev\" + \"al\")(\"1\");",
    "globalThis.Reflect held": "const R = globalThis.Reflect;",
    "globalThis.Reflect, method not called": "const g = globalThis.Reflect.get;",
  };
  assert.deepEqual(Object.entries(must).filter(([, src]) => !caught(src)).map(([label]) => label), [], "global Reflect forms that hide a lookup");
  const may = {
    "a bare Reflect with a literal key": "const v = Reflect.get(o, \"name\");",
    "a global Reflect with a literal key": "const v = globalThis.Reflect.get(o, \"name\");",
    "a global Reflect has": "const v = globalThis.Reflect.has(o, \"name\");",
    "a member named Reflect of an unrelated object": "const v = lib.Reflect;",
  };
  assert.deepEqual(Object.entries(may).filter(([, src]) => caught(src)).map(([label]) => label), [], "clean forms that are reported");
});

test("invariant 4: round 10 - constructor is exempt only as a method of a class body", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const refs = (src) => externalReferences(src + "\n", where);
  const caught = (src) => refs(src).length > 0;
  const must = {
    "with an arrow function": "with (() => {}) { console.log(constructor(\"return 7\")()); }",
    "with after a statement": "with (() => {}) { a(); constructor(\"return 7\"); }",
    "a bare block": "{ constructor(\"return 7\"); }",
    "a function body": "function f() { constructor(\"return 7\"); }",
    "after a semicolon": "a();\nconstructor(\"return 7\");",
    "a with inside a class method": "class A { m() { with (() => {}) { constructor(\"return 7\"); } } }",
    "an if block": "if (a) { constructor(\"return 7\"); }",
  };
  assert.deepEqual(Object.entries(must).filter(([, src]) => !caught(src)).map(([label]) => label), [], "constructor calls outside a class body");
  const may = {
    "a class constructor": "class A { constructor() { this.a = 1; } }",
    "a derived class constructor": "class B extends A { constructor() { super(); } }",
    "a class with fields before": "class C { a = 1; constructor() {} }",
    "a class with a method before": "class D { m() {} constructor() {} }",
    "a class expression": "const E = class { constructor() {} };",
    "a class with a semicolon before": "class F { a = 1;\n constructor() {} }",
  };
  assert.deepEqual(Object.entries(may).filter(([, src]) => caught(src)).map(([label]) => label), [], "class constructors that are reported");
});

test("invariant 4: round 9 - a code-running name inside a computed member bracket is reported even as an array element", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const refs = (src) => externalReferences(src + "\n", where);
  const caught = (src) => refs(src).length > 0;
  const must = {};
  for (const name of ["constructor", "eval", "Function", "getBuiltinModule", "dlopen", "_load", "runInContext", "compileFunction", "NODE_OPTIONS", "setTimeout"]) {
    const q = JSON.stringify(name);
    must["array key " + name] = "const h = o[[" + q + "]];";
    must["array key, called " + name] = "o[[" + q + "]]('return 7');";
    must["conditional element " + name] = "const h = o[[1 ? " + q + " : 2]];";
    must["second element " + name] = "const h = o[[x, " + q + "]];";
    must["function value " + name] = "const f = () => {};\nconst h = f[[" + q + "]];";
    must["parenthesised function " + name] = "const h = (() => {})[[" + q + "]];";
  }
  must["chained constructor"] = "const h = [][[\"at\"]][[\"constructor\"]];";
  must["async function constructor"] = "const h = (async () => {})[[\"constructor\"]];";
  assert.deepEqual(Object.entries(must).filter(([, src]) => !caught(src)).map(([label]) => label), [], "array keys that hide a code-running member");
  const may = {
    "a bare array of names": "const names = [\"eval\", \"Function\", \"constructor\"];",
    "an array in a call": "log([\"eval\"]);",
    "an indexed slot assigned an array": "const x = [];\nx[0] = [\"eval\"];",
    "an array after return": "function f() { return [\"eval\", \"setTimeout\"]; }",
    "an array in an object": "const o = { list: [\"eval\", \"dlopen\"] };",
    "an array indexed by a number": "const a = [\"eval\"];\nconst b = a[0];",
  };
  assert.deepEqual(Object.entries(may).filter(([, src]) => caught(src)).map(([label]) => label), [], "clean forms that are reported");
});

test("invariant 4: round 8 - a denied process name anywhere inside a computed member bracket is reported", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const refs = (src) => externalReferences(src + "\n", where);
  const caught = (src) => refs(src).some((r) => /binding|_linkedBinding|execve|unparseable/.test(r));
  const head = "import p from 'node:process';\n";
  const must = {};
  for (const name of ["binding", "_linkedBinding", "execve"]) {
    const q = JSON.stringify(name);
    must["parenthesised " + name] = head + "p[(" + q + ")];";
    must["double parenthesised " + name] = head + "p[((" + q + "))]('x');";
    must["array wrapped " + name] = head + "p[[" + q + "]];";
    must["parenthesised, then call " + name] = head + "p[(" + q + ")].call(p, 'x');";
    must["parenthesised, then apply " + name] = head + "p[(" + q + ")].apply(p, ['x']);";
    must["passed as a value " + name] = head + "['x'].map(p[(" + q + ")]);";
    must["a parenthesised object " + name] = head + "(process)[(" + q + ")]('x');";
    must["a ternary " + name] = head + "p[1 ? " + q + " : 'y']('x');";
    must["a ternary, else branch " + name] = head + "p[0 ? 'y' : " + q + "]('x');";
    must["a sequence " + name] = head + "p[(0, " + q + ")]('x');";
    must["a template " + name] = head + "p[`" + name + "`]('x');";
    must["a call result " + name] = head + "p[String(" + q + ")]('x');";
    must["an optional chain " + name] = head + "p?.[(" + q + ")]('x');";
    must["a logical or " + name] = head + "p[" + q + " || 'y']('x');";
  }
  assert.deepEqual(Object.entries(must).filter(([, src]) => !caught(src)).map(([label]) => label), [], "bracket forms that hide a denied process member");
  const may = {
    "a bare array of names": "const names = [\"binding\", \"execve\"];",
    "an array in a call": "log([\"binding\"]);",
    "an argument list": "log(a, \"binding\");",
    "a text constant": "const s = \"binding\";",
    "an array assigned to an indexed slot": "const t = [];\nt[0] = [\"binding\"];",
    "an array after return": "function f() { return [\"binding\"]; }",
    "an array in an object": "const o = { list: [\"binding\", \"x\"] };",
    "an export alias": "const x = 1;\nexport { x as \"binding\" };",
    "an index with a denied-looking word only in a comment": "const a = [1];\nconst b = a[0]; // [\"binding\"]",
  };
  assert.deepEqual(Object.entries(may).filter(([, src]) => caught(src)).map(([label]) => label), [], "clean forms that are reported");
});

test("invariant 4: round 7 - a quoted name in an import or export specifier list reads a denied process member", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const refs = (src) => externalReferences(src + "\n", where);
  const caught = (src) => refs(src).some((r) => /binding|_linkedBinding|execve|dlopen|unparseable/.test(r));
  const must = {};
  for (const name of ["binding", "_linkedBinding", "execve"]) {
    must["import { \"" + name + "\" as b } from node:process"] = "import { \"" + name + "\" as b } from \"node:process\";\nb(\"natives\");";
    must["import { \"" + name + "\" as b } from process"] = "import { \"" + name + "\" as b } from \"process\";\nb(\"natives\");";
    must["import { a, \"" + name + "\" as b } from"] = "import { a, \"" + name + "\" as b } from \"node:process\";";
    must["import d, { \"" + name + "\" as b } from"] = "import d, { \"" + name + "\" as b } from \"node:process\";";
    must["export { \"" + name + "\" as b } from"] = "export { \"" + name + "\" as b } from \"node:process\";";
    must["export { \"" + name + "\" } from"] = "export { \"" + name + "\" } from \"node:process\";";
    must["export { a, \"" + name + "\" } from"] = "export { a, \"" + name + "\" } from \"node:process\";";
  }
  must["dlopen is an identifier"] = "import { \"dlopen\" as d } from \"node:process\";\nd();";
  assert.deepEqual(Object.entries(must).filter(([, src]) => !caught(src)).map(([label]) => label), [], "specifier forms that hide a denied process member");
  // Adjacent: names that are not denied, a denied name only as an export alias, a string that is not in a specifier list.
  const may = {
    "a non-denied import name": "import { \"other\" as b } from \"node:process\";",
    "a denied name as the exported alias of a local": "const x = 1;\nexport { x as \"binding\" };",
    "a denied name as the import side of a plain list string": "const t = { a: 1, b: \"x\" };",
    "a denied name in a call argument list": "log(a, \"binding\");",
    "a denied name in a text constant": "const s = \"binding\";",
    "a denied name in an array of names": "const names = [\"binding\", \"execve\"];",
  };
  assert.deepEqual(Object.entries(may).filter(([, src]) => caught(src)).map(([label]) => label), [], "clean forms that are reported");
});

test("invariant 4: round 6 - a slash after a line break that ends a statement, or after a prefix ++ / --, starts a regex", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const refs = (src) => externalReferences(src + "\n", where);
  const tail = "/'/.test(1); eval(\"1\"); // '\n";
  const hidden = (src) => !refs(src).some((r) => /eval|unparseable/.test(r));
  const must = {
    "debugger then a line break": "debugger\n" + tail,
    "break then a line break": "a: for (;;) { break a\n" + tail + "}",
    "continue then a line break": "a: for (;;) { continue\n" + tail + "}",
    "a bare break then a line break": "for (;;) { break\n" + tail + "}",
    "a bare continue then a line break": "for (;;) { continue\n" + tail + "}",
    "a line break before a prefix ++": "var a = 1;\na\n++" + tail,
    "a line break before a prefix --": "var a = 1;\na\n--" + tail,
    "a line comment before a prefix ++": "var a = 1;\na //c\n++" + tail,
    "a block comment with a line break before a prefix ++": "var a = 1;\na /*\n*/++" + tail,
    "a call then a line break before a prefix ++": "var f = () => 1;\nf()\n++" + tail,
    "an array then a line break before a prefix ++": "[1]\n++" + tail,
    "a blank before a prefix ++ on the next line": "var a = 1;\na\n ++" + tail,
    "a side-effect import without a semicolon": "import 'node:fs'\n" + tail,
    "a default import without a semicolon": "import a from 'node:fs'\n" + tail,
    "an export star without a semicolon": "export * from 'node:fs'\n" + tail,
    "an export star as a name without a semicolon": "export * as n from 'node:fs'\n" + tail,
    "an export list without a semicolon": "export {a as b} from 'node:fs'\n" + tail,
    "a var without an initializer": "var q\n" + tail,
    "a let without an initializer": "let q\n" + tail,
    "an exported var without an initializer": "export var q\n" + tail,
    "a division whose divisor reads as regex flags": "var a = 1, b = 2;\nvar x = a\n/b/eval(\"1\");",
    "a division whose divisor reads as flags, then code": "var a = 1, b = 2, g = 3;\nvar x = a\n/b/g + eval(\"1\");",
  };
  assert.deepEqual(Object.entries(must).filter(([, src]) => hidden(src)).map(([label]) => label), [], "forms that hide eval");
  const may = {
    "a postfix ++ then division": "let i = 0; const h = i++ / 2; const s = \"/\";",
    "a postfix ++ after a block comment on one line": "let a = 1; a /* c */++ / 2; const s = \"/\";",
    "a side-effect import then a plain regex": "import 'node:fs'\n/x/.test(1);",
    "a var then a plain regex": "var q\n/x/.test(1);",
    "a division continued on the next line": "const t = a\n/ 2 / 3;",
    "a member named break": "const t = o.break / 2 / 3;",
    "a loop with break and continue": "for (;;) { if (a) break; continue; }",
    "a labelled break": "a: for (;;) { break a; }",
    "a prefix ++ on its own line": "let a = 1;\n++a;",
  };
  // the syntax tree is the judge of what is clean; the token reading may over-report a postfix ++ before a slash
  // (defense in depth: it only ever adds a failure), so these forms assert the tree outcome
  assert.deepEqual(Object.entries(may).filter(([, src]) => analyzeSource(src + "\n").outcome !== "CLEAN").map(([label]) => label), [], "forms the guard must accept");
  // and a string statement followed by what reads as a regex is, per the grammar, a division and a string: CLEAN
  assert.equal(analyzeSource("'use strict'\n/'/.test(1); eval(\"1\"); // '\n").outcome, "CLEAN", "the grammar reads the rest of the line as a string");
});

// Codex findings on PR #147, rounds on 4d5a005, a1dd371 and 4557d13.
test("invariant 4: Codex findings - denied process names as reflective keys, a selected callee behind inner groups", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-st57", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-st57"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const refs = (src) => externalReferences(src + "\n", where);
  const must = {
    "Reflect.get of process with a literal binding key": 'Reflect.get(process, "binding")("natives");',
    "Reflect.getOwnPropertyDescriptor of process with a literal binding key": 'const d = Reflect.getOwnPropertyDescriptor(process, "binding");',
    "Reflect.get of process with a literal execve key": 'Reflect.get(process, "execve")("/bin/sh", [], []);',
    "Reflect.get of process with a literal _linkedBinding key": 'Reflect["get"](process, "_linkedBinding");',
    "a member inside inner groups, then a selection": 'const [k] = ["constructor"]; (((()=>{})[k]) ?? 0)("return 1")();',
    "inner groups, then ||": "((o[k]) || 0)(1);",
    "inner groups, then &&": "(((o[k])) && 0)(1);",
    "inner groups inside a conditional": "(c ? (o[k]) : 0)(1);",
    "a selection inside a selection": "(((o[k]) ?? 0) || 1)(1);",
    "inner groups, then a selection, used as a tag": "((o[k]) ?? 0)`x`;",
  };
  assert.deepEqual(Object.entries(must).filter(([, src]) => refs(src).length === 0).map(([label]) => label), [], "forms the scan accepts but must reject");
  const may = {
    "Reflect.get of process with an ordinary literal key": 'const v = Reflect.get(process, "argv");',
    "the word binding in a diagnostic string": 'console.log("binding", "execve");',
    "inner groups with a comma": "((o[k]), 0)(1);",
    "inner groups, not called": "const v = ((o[k]) ?? 0);",
    "inner groups in an if head": "if ((o[k]) ?? 0) (done)(1);",
  };
  assert.deepEqual(Object.entries(may).filter(([, src]) => refs(src).length > 0).map(([label]) => label), [], "forms the scan must accept");
});

// Review of 4d5a005: the allowlist excuses the loader-capable IMPORT only for the exact reviewed names, as
// written. Any other binding of the same module is a function nobody read.
test("an allowlisted file may import only the reviewed names of its module, unaliased", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-import-"));
  try {
    const put = (text) => {
      const full = path.join(root, "scripts", "run.mjs");
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, text);
    };
    const list = [{ file: "scripts/run.mjs", reason: "starts the one reviewed child process", modules: ["node:child_process"], names: ["spawnSync"], calls: ['spawnSync ( "git" , [ "status" ] )'] }];
    const reviewed = 'spawnSync("git", ["status"]);\n';
    const clean = {
      "the reviewed import": 'import { spawnSync } from "node:child_process";\n',
      "the reviewed import over several lines with a trailing comma": 'import {\n  spawnSync,\n} from "node:child_process";\n',
    };
    for (const [label, head] of Object.entries(clean)) {
      put(head + reviewed);
      assert.deepEqual(runtimeOffenders(root, list), [], "must be accepted: " + label);
    }
    const bad = {
      "another named import, called": 'import { spawnSync, execSync } from "node:child_process";\nexecSync("evil");\n',
      "only another named import": 'import { execSync } from "node:child_process";\nexecSync("evil");\n',
      "a namespace import": 'import * as cp from "node:child_process";\ncp.execSync("evil");\n',
      "an aliased import": 'import { spawn as sp } from "node:child_process";\nsp("evil");\n',
      "the reviewed name under an alias": 'import { spawnSync as run } from "node:child_process";\nrun("evil");\n',
      "a default import": 'import cp from "node:child_process";\ncp.execSync("evil");\n',
      "a default and a namespace": 'import cp, * as all from "node:child_process";\n',
      "a side-effect import": 'import "node:child_process";\n',
      // review of a1dd371 (Codex): a quoted import name is a string before the module specifier
      "a quoted import name under an alias": 'import { "execSync" as run } from "node:child_process";\nrun("echo probe");\n',
      "a quoted import name beside the reviewed one": 'import { spawnSync, "execSync" as run } from "node:child_process";\nrun("echo probe");\n',
      "a second import of the module": 'import { spawnSync } from "node:child_process";\nimport { execFileSync } from "node:child_process";\nexecFileSync("evil");\n',
    };
    const missed = [];
    for (const [label, head] of Object.entries(bad)) {
      put(head + reviewed);
      if (!runtimeOffenders(root, list).some((o) => o.includes("node:child_process is a loader-capable module"))) missed.push(label);
    }
    assert.deepEqual(missed, [], "imports the allowlist accepts but must reject");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// A file at <root>/scripts/a.mjs, for the scan's own tests. The injected file system says every path exists
// (except names starting "missing") and has no links, so only the containment logic is under test.
const FAKE_ROOT = path.join(os.tmpdir(), "aistd-scan-root");
const FAKE_IO = {
  existsSync: (p) => !path.basename(p).startsWith("missing"),
  realpathSync: (p) => p,
};
const HERE_FILE = { file: path.join(FAKE_ROOT, "scripts", "a.mjs"), root: FAKE_ROOT, io: FAKE_IO };

