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
import { stripComments, tokenize, callArguments, moduleReferences, keyedCallProblems, RESOURCE_PROPS } from "./js-references.mjs";

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

// Every entry of a tree that is not a regular file or a directory, found with lstat so that a link is
// seen as a link and never followed: symbolic links and junctions, FIFOs, devices, sockets. `io` is an
// injectable file system (readdirSync + lstatSync), so the same logic runs where links cannot be made.
function irregularEntries(dir, io = fs, base = dir) {
  const out = [];
  for (const name of io.readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    const rel = path.relative(base, full).split(path.sep).join("/");
    const st = io.lstatSync(full);
    if (st.isSymbolicLink()) out.push(`${rel} (symbolic link or junction)`);
    else if (st.isDirectory()) out.push(...irregularEntries(full, io, base));
    else if (!st.isFile()) out.push(`${rel} (special file)`);
  }
  return out;
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

test("the vendored tree and scripts/vendor hold regular files and directories only: no link of any kind, whatever its target", () => {
  assert.deepEqual(irregularEntries(VENDOR), []);
});

// An in-memory file system: keys are tree-relative paths, values are "dir", "file", "symlink" or "fifo".
function fakeIo(root, spec, extra = {}) {
  const at = (key) => (key === "" ? root : path.join(root, ...key.split("/")));
  const kinds = new Map(Object.entries(spec).map(([k, v]) => [at(k), v]));
  kinds.set(root, "dir");
  const stat = (kind) => ({
    isFile: () => kind === "file",
    isDirectory: () => kind === "dir",
    isSymbolicLink: () => kind === "symlink",
  });
  return {
    at,
    readdirSync: (d) => [...kinds.keys()].filter((k) => path.dirname(k) === d && k !== d).map((k) => path.basename(k)),
    lstatSync: (f) => stat(kinds.get(f)),
    existsSync: (f) => kinds.has(f) || (extra.exists ?? []).includes(f),
    readFileSync: (f) => (extra.files ?? {})[f] ?? "",
    realpathSync: (f) => {
      if ((extra.throwOn ?? []).includes(f)) throw new Error("EACCES");
      return (extra.real ?? {})[f] ?? f;
    },
  };
}

test("the link guard itself (injected file system): every entry kind that is not a file or a directory is an offender", () => {
  const root = path.join(os.tmpdir(), "aistd-fake-tree");
  const clean = fakeIo(root, { browser: "dir", "browser/a.js": "file", "browser/sub": "dir", "browser/sub/b.js": "file" });
  assert.deepEqual(irregularEntries(root, clean), []);
  const cases = {
    "a symbolic link to a file": { browser: "dir", "browser/a.js": "symlink" },
    "a symbolic link to a directory": { browser: "dir", "browser/sub": "symlink" },
    "a link at the top of the tree": { link: "symlink" },
    "a link nested three levels down": { a: "dir", "a/b": "dir", "a/b/c": "dir", "a/b/c/d.js": "symlink" },
    "a FIFO, device or socket": { browser: "dir", "browser/pipe": "fifo" },
  };
  for (const [label, spec] of Object.entries(cases)) {
    const found = irregularEntries(root, fakeIo(root, spec));
    assert.notDeepEqual(found, [], `must be an offender: ${label}`);
    assert.match(found[0], label.includes("FIFO") ? /special file/ : /symbolic link/, label);
  }
});

test("real links are caught as entries and as import targets (skipped, and reported, where links cannot be created)", (t) => {
  const tree = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-vendor-link-"));
  const outside = `${tree}-outside.js`;
  try {
    fs.mkdirSync(path.join(tree, "browser"));
    fs.writeFileSync(path.join(tree, "browser", "ok.js"), "export const ok = 1;\n");
    fs.writeFileSync(outside, "export const outside = 1;\n");
    try {
      fs.symlinkSync(outside, path.join(tree, "browser", "link.js"));
      fs.symlinkSync(path.join(tree, "browser", "ok.js"), path.join(tree, "browser", "inner.js"));
    } catch (e) {
      t.skip(`symbolic links cannot be created here (${e.code}); the injected file system tests run the same logic`);
      return;
    }
    const found = irregularEntries(tree);
    assert.ok(found.some((e) => e.startsWith("browser/link.js")), "a link to a file outside the tree");
    assert.ok(found.some((e) => e.startsWith("browser/inner.js")), "a link whose target is inside the tree is an offender regardless of its target");
    fs.writeFileSync(path.join(tree, "browser", "good.js"), 'import "./link.js";\n');
    assert.notDeepEqual(importOffenders(tree, ["browser/good.js"]), [], "an import that lands on an outside file through a link");
    assert.notDeepEqual(importOffenders(tree, ["browser/link.js"]), [], "a source file that is itself a link out of the tree");
  } finally {
    fs.rmSync(tree, { recursive: true, force: true });
    fs.rmSync(outside, { force: true });
  }
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

test(".gitattributes is scoped to the vendored tree and decides nothing about the rest of the repository (Q8 answered A: this vendor-only rule is the answer)", () => {
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

/**
 * Offenders in a set of files under `treeDir`: anything that is not a plain relative path to a file that
 * really lives inside it. Containment is decided on REAL paths with path.relative (never a string prefix:
 * case-insensitive file systems, a sibling sharing a prefix and links all defeat that), so a link inside
 * the tree whose target is outside it is an offender here as well as in the link scan. A relative specifier
 * is a URL to Node, so one holding `\`, `%`, `?` or `#` is rejected outright; an absolute path, a drive-
 * relative one (`C:x`), a UNC one and a `file:` URL do not start with `.` and are non-relative offenders.
 * `io` is an injectable file system.
 */
export function importOffenders(treeDir, relFiles, io = fs) {
  const offenders = [];
  const real = (p) => (io.realpathSync.native ?? io.realpathSync)(p);
  let realTree;
  try {
    realTree = real(treeDir);
  } catch {
    return [`${treeDir}: the tree cannot be resolved`];
  }
  const inside = (p) => {
    const rel = path.relative(realTree, p);
    return rel !== "" && rel.split(path.sep)[0] !== ".." && !path.isAbsolute(rel);
  };
  for (const rel of relFiles) {
    const full = path.join(treeDir, rel);
    try {
      if (!inside(real(full))) offenders.push(`${rel}: is, or links to, a file outside the tree`);
    } catch {
      offenders.push(`${rel}: cannot be resolved`);
      continue;
    }
    const dir = path.dirname(full);
    const { specifiers, unreadable } = moduleReferences(io.readFileSync(full, "utf8"));
    for (const u of unreadable) offenders.push(`${rel}: ${u.form} ${u.specifier}`);
    for (const { form, specifier } of specifiers) {
      if (!specifier.startsWith(".")) {
        offenders.push(`${rel}: ${form} ${specifier}`);
        continue;
      }
      if (/[\\%?#]/.test(specifier)) {
        offenders.push(`${rel}: ${form} ${specifier} is not a plain relative path`);
        continue;
      }
      const target = path.resolve(dir, specifier);
      let landed = false;
      try {
        landed = io.existsSync(target) && inside(real(target));
      } catch {
        landed = false;
      }
      if (!landed) offenders.push(`${rel}: ${form} ${specifier} does not resolve inside the tree`);
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
      "require with a second argument": "const x = require(\"package\", {});\n",
      "require with a trailing comma": "const x = require(\"package\",);\n",
      "require with a spaced trailing comma": "const x = require(\"package\" , );\n",
      "require across lines with a trailing comma": "const x = require(\n  \"package\",\n);\n",
      "dynamic import with options": "export const p = import(\"package\", { with: { type: \"json\" } });\n",
      "dynamic import with a trailing comma": "export const p = import(\"package\",);\n",
      "comments around the argument": "const x = require(/* a, b */ \"package\" /* ) */);\n",
      "escaped callee name": "const x = \\u0072equire(\"package\");\n",
      "escaped specifier": "const x = require(\"\\u0070ackage\");\n",
      "require inside an interpolation with a trailing comma": "export const s = `${require(\"package\",)}`;\n",
      "require in an arrow body": "export const f = (a, b) => require(\"package\", a);\n",
      "an unbalanced require call": "const x = require(\"package\"\n",
      "a mismatched closer in a call": "const x = require(\"package\", ];\n",
      "an unterminated string": "const x = \"never closed;\n",
      "a specifier with a paren in it": "const x = require(\"pack)age\");\n",
      "a first argument that is not alone": "const x = require(\"pack\", \"age\" + y);\n",
      "an empty require": "const x = require();\n",
      "a literal followed by an operator, in require": "export const x = require(\"./ok.js\" + y);\n",
      "a literal followed by an operator, in import": "export const p = import(\"./ok.js\" + y);\n",
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
      "require of a file in the tree with a trailing comma": "export const x = require(\"./ok.js\",);\n",
      "require of a file in the tree with extra arguments": "export const x = require(\"./ok.js\", \";\", \")\");\n",
      "dynamic import with options, relative": "export const p = import(\"./ok.js\", { with: { type: \"json\" } });\n",
      "an escaped relative specifier": "export const x = require(\"\\x2e/ok.js\");\n",
      "a semicolon and parens in strings of an ordinary call": "f(\"x;\", \")\", \",\");\nexport const a = 1;\n",
      "an ordinary call that merely contains the word require in a string": "f(\"require('package')\");\nexport const a = 1;\n",
      "a regex containing a closing brace and a paren": "export const r = /[})]/.test(a);\n",
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

test("the call-argument extractor splits only at top-level commas and fails on unbalanced delimiters", () => {
  const argCount = (src) => {
    const { tokens } = tokenize(src);
    const open = tokens.findIndex((t) => t.t === "punct" && t.v === "(" && !t.syn);
    const args = callArguments(tokens, open);
    return args === null ? null : args.length;
  };
  assert.equal(argCount("f()"), 0);
  assert.equal(argCount("f(a)"), 1);
  assert.equal(argCount("f(a,)"), 1);
  assert.equal(argCount("f(a, b)"), 2);
  assert.equal(argCount('f(a, [b, c], { d: ",", e: g(h, i) }, `x${y, z}`,)'), 4);
  assert.equal(argCount('f("a)", ";", \'b,c\')'), 3);
  assert.equal(argCount("f(a /* , */, b // ,\n)"), 2);
  assert.equal(argCount("f(x => { a(); b(); }, y)"), 2);
  assert.equal(argCount("f(a, /[,)]/, b)"), 3);
  assert.equal(argCount("f(a, b"), null);
  assert.equal(argCount("f(a, [b)"), null);
  assert.equal(argCount("f(a, {b: 1)"), null);
  assert.equal(tokenize('"open').ok, false);
  assert.equal(tokenize("`open").ok, false);
  assert.equal(tokenize("/* open").ok, false);
  assert.equal(tokenize("`a${ b").ok, false);
  assert.equal(tokenize('const a = 1; // done\n"x" + `y${1}`').ok, true);
});

test("the containment check works on real paths (injected file system): links, prefixes, dot-dot, URLs and drive forms", () => {
  const root = path.join(os.tmpdir(), "aistd-contain", "Tree");
  const sibling = `${root}-evil`;
  const make = (src, extra = {}) => {
    const f = { [path.join(root, "browser", "a.js")]: src };
    const io = fakeIo(root, { browser: "dir", "browser/a.js": "file", "browser/ok.js": "file" }, {
      files: f,
      exists: [path.join(sibling, "x.js"), path.join(root, "..", "outside.js"), ...(extra.exists ?? [])],
      real: extra.real ?? {},
      throwOn: extra.throwOn ?? [],
    });
    return importOffenders(root, ["browser/a.js"], io);
  };
  assert.deepEqual(make('import "./ok.js";\n'), []);
  assert.deepEqual(make('import "../browser/ok.js";\n'), []);
  // a link inside the tree whose real path is outside it
  const linked = path.join(root, "browser", "ok.js");
  assert.notDeepEqual(make('import "./ok.js";\n', { real: { [linked]: path.join(os.tmpdir(), "elsewhere.js") } }), []);
  // a sibling directory that shares the tree's name as a prefix
  assert.notDeepEqual(make('import "./ok.js";\n', { real: { [linked]: path.join(sibling, "x.js") } }), []);
  // the importing file is itself a link out of the tree
  assert.notDeepEqual(make('export const a = 1;\n', { real: { [path.join(root, "browser", "a.js")]: path.join(sibling, "x.js") } }), []);
  // a target that exists but whose real path cannot be read
  assert.notDeepEqual(make('import "./ok.js";\n', { throwOn: [linked] }), []);
  // dot-dot out of the tree
  assert.notDeepEqual(make('import "../../outside.js";\n'), []);
  assert.notDeepEqual(make('import "../../Tree-evil/x.js";\n'), []);
  // forms that are not plain relative paths
  for (const spec of ["file:///etc/passwd", "/abs/x.js", "C:x.js", "C:\\x.js", "\\\\host\\share\\x.js", "../", "./ok.js?x=1", "./ok.js#h", "./%2e%2e/outside.js", ".\\ok.js"]) {
    // the target is made to exist, so only the form of the specifier can reject it
    const target = path.resolve(path.join(root, "browser"), spec);
    assert.notDeepEqual(make(`import ${JSON.stringify(spec)};\n`, { exists: [target] }), [], spec);
  }
  // a real path on another drive: path.relative answers with an absolute path, which is not inside
  if (path.sep === "\\") assert.notDeepEqual(make('import "./ok.js";\n', { real: { [linked]: "Z:\\elsewhere\\x.js" } }), []);
  // a tree that cannot be resolved is an offender, not a pass
  const io = fakeIo(root, { browser: "dir", "browser/a.js": "file" }, { files: { [path.join(root, "browser", "a.js")]: "" } });
  io.realpathSync = () => {
    throw new Error("ENOENT");
  };
  assert.notDeepEqual(importOffenders(root, ["browser/a.js"], io), []);
});

test("module references are labelled by the form that made them", () => {
  const forms = (src) => moduleReferences(src).specifiers.map((r) => `${r.form}:${r.specifier}`);
  assert.deepEqual(forms(['import "a";', 'import b from "b";', 'export * from "c";', 'export { d } from "d";'].join("\n")), ["import:a", "import:b", "export-from:c", "export-from:d"]);
  assert.deepEqual(forms('import("e"); require("f");'), ["dynamic-import:e", "require:f"]);
});

const bs_q = (word) => JSON.stringify(word);

// --- The ambient-access guard -------------------------------------------------------------------
//
// WHAT THE CONTROL IS. A denylist of primitives cannot be complete, and this one does not claim to be.
// The control on the vendored tree is the two things together: (1) every file's SHA-256 is pinned in
// scripts/vendor/yaml.vendor.json, so any change to the tree is a visible change to that file, and
// (2) this scan, which fails toward detecting, so a refreshed release that reaches for the network, a
// process, a DOM loader or code-from-string stops the suite until a person has looked. REFRESHING THE
// HASHES IS THE HUMAN GATE: it requires reading the diff of the vendored tree, and a green suite after a
// refresh means "no listed primitive appeared", not "the diff is safe".
//
// WHAT IT BANS. In code (comments removed, string text blanked, template interpolations scanned as code):
//   * every network-capable browser primitive: fetch, XMLHttpRequest, WebSocket(Stream), EventSource,
//     WebTransport, RTCPeerConnection/DataChannel, importScripts, Worker, SharedWorker, sendBeacon,
//     serviceWorker, Request, Response, postMessage, BroadcastChannel, MessageChannel, opener;
//   * the DOM entry points that LOAD a resource without a network API: the Image and Audio constructors,
//     the HTML{Image,Script,IFrame,Link,Embed,Object,Source,Media}Element constructors, createElement(NS),
//     appendChild, insertAdjacentHTML, innerHTML, outerHTML, srcdoc, and ASSIGNMENT to `src`, `href`,
//     `action`, `data`, `poster`, `formAction`, `srcset` by dot, bracket, destructuring, Object.assign,
//     defineProperty, Reflect.set or setAttribute (see ASSIGNMENT_FORMS for what is and is not covered);
//     and a bare `document` used as an object (`document.`, `document[`);
//   * every route to the global object or a loader, so aliasing cannot hide a primitive: globalThis,
//     window, self, global, frames, navigator, location, process, Deno, Bun, require, createRequire,
//     child_process;
//   * code from a string: eval, Function, a called `.constructor`.
// A string literal that is EXACTLY one of those names is also flagged (computed members: `o["fetch"]`,
// `Reflect.get(o, "fetch")`). Identifier and string escapes (`fetch`, `\u{66}etch`, `"\x66etch"`) are
// decoded before matching. Reads are fail-toward-detecting: a banned identifier is flagged wherever it
// appears, including as a property name, and a regex body is read as code.
//
// WHAT IT LEAVES OUT, AND WHY. `document` as a bare identifier (the vendored parser has a method and
// variable of that name; only member access on it is flagged), `Option` (the constructor makes an
// <option> element; it loads nothing), `DOMParser`/`XMLSerializer` (parse and serialise in memory),
// `URL` and `import.meta.url` (a read-only string; no I/O), `Blob` (in-memory), `parent` and `top`
// (ordinary identifiers in a parser). It does not evaluate expressions: a name assembled at run time
// (`"fe" + "tch"`) is only seen if the object it is read from is one of the banned names. `this` at the top
// level of an ES module is undefined, so it is not a route to the global object here.
const NETWORK_PRIMITIVES = [
  "fetch", "XMLHttpRequest", "WebSocket", "WebSocketStream", "EventSource", "WebTransport",
  "RTCPeerConnection", "RTCDataChannel", "importScripts", "Worker", "SharedWorker", "sendBeacon",
  "serviceWorker", "Request", "Response", "postMessage", "BroadcastChannel", "MessageChannel", "opener",
];
const DOM_LOADERS = [
  "Image", "Audio", "HTMLImageElement", "HTMLScriptElement", "HTMLIFrameElement", "HTMLLinkElement",
  "HTMLEmbedElement", "HTMLObjectElement", "HTMLSourceElement", "HTMLMediaElement", "createElement",
  "createElementNS", "appendChild", "insertAdjacentHTML", "innerHTML", "outerHTML", "srcdoc",
];
const AMBIENT_OBJECTS = ["globalThis", "window", "self", "global", "frames", "navigator", "location", "process", "Deno", "Bun"];
const LOADERS_AND_CODE = ["require", "createRequire", "child_process", "eval", "Function"];

// Identifier and string escapes: \uXXXX, \u{X...}, \xHH. Applied to code after comments are removed.
function decodeEscapes(text) {
  return text
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (m, h) => {
      const cp = parseInt(h, 16);
      return cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
    })
    .replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
}

// Escapes are decoded in code context: in the code view (identifiers) and in the string view (computed
// keys). Decoding runs on the comment-stripped text, so a comment can neither smuggle a name in nor out.
function ambientViews(source) {
  return {
    code: decodeEscapes(stripComments(source)),
    text: decodeEscapes(stripComments(source, true)),
  };
}

// Property names that make an element fetch a resource when set. An assignment to any of them, in any
// of the spellings below, is an offender. A READ (`node.src`), a comparison (`===`) and a bare string
// "src" are not.
const RES = RESOURCE_PROPS.join("|");
const COMPOUND = "(?:\\*\\*|<<|>>>?|&&|\\|\\||\\?\\?|[-+*/%&|^])?";
// WAYS A PROPERTY IS ASSIGNED IN JS, and what is covered:
//   dot            el.src = u, el.src += u             covered (code view)
//   bracket        el["src"] = u, el[`src`] = u        covered (string view: quotes/backticks, decoded escapes)
//   destructuring  ({ k: el.src } = o), [el.src] = a   covered when the target is last in its pattern
//                  ({ src: el.src, other } = o)        NOT covered when more elements follow the target
//   calls          Object.assign(el, { src: u }), defineProperty(ies), Reflect.set, Reflect.defineProperty,
//                  setAttribute(NS): read from a token stream, never a regex over text. The arguments are
//                  split at top-level commas by a balanced-delimiter scan (strings, templates, nested
//                  functions and comments cannot end a call early). A resource name is an offender when
//                  an argument IS the literal name, or when it is a key (bare, quoted, shorthand, method,
//                  accessor or computed-literal) of an object literal at any depth in any argument. An
//                  unbalanced call or an unterminated literal is itself an offender ("unparseable").
//                  The same reader parses require() and import() (first argument one literal; the rest,
//                  trailing commas included, are read and ignored).
//   NOT covered:   a name assembled at run time (setAttribute(name, u), o[k] = u, Reflect.set(el, k, u)),
//                  a spread (Object.assign(el, props)), a Proxy or setter that forwards, and an assignment
//                  through an alias whose name is not a resource property. These are what the pinned
//                  hashes and the human re-read are for.
const ASSIGNMENT_FORMS = [
  ["dot notation", new RegExp(`\\.\\s*(?:${RES})\\s*${COMPOUND}=(?!=)`), "code"],
  ["bracket notation", new RegExp(`\\[\\s*(['"\`])(?:${RES})\\1\\s*\\]\\s*${COMPOUND}=(?!=)`), "text"],
  ["destructuring target (dot)", new RegExp(`\\.\\s*(?:${RES})\\s*[}\\]]\\s*=(?!=)`), "code"],
  ["destructuring target (bracket)", new RegExp(`\\[\\s*(['"\`])(?:${RES})\\1\\s*\\]\\s*[}\\]]\\s*=(?!=)`), "text"],
];

function ambientOffenders(source) {
  const offenders = [];
  const { code, text } = ambientViews(source);
  const all = [...NETWORK_PRIMITIVES, ...DOM_LOADERS, ...AMBIENT_OBJECTS, ...LOADERS_AND_CODE];
  // The code view has string text blanked, but an identifier escape may have been decoded into a name, so
  // names are matched on it after decoding.
  for (const name of all) {
    if (new RegExp(`(?<![\\w$])${name}(?![\\w$])`).test(code)) offenders.push(`identifier ${name}`);
  }
  if (/(?<![\w$.])document\s*(?:\?\.|\.|\[)/.test(code)) offenders.push("document used as an object");
  for (const problem of keyedCallProblems(source)) offenders.push(`resource property assignment: ${problem}`);
  for (const [label, re, view] of ASSIGNMENT_FORMS) {
    if (re.test(view === "text" ? text : code)) offenders.push(`resource property assignment: ${label}`);
  }
  if (/\.constructor\s*\(/.test(code) || /\[\s*['"`]constructor['"`]\s*\]/.test(text)) offenders.push("constructor call (reaches Function)");
  const named = new Set(all);
  for (const m of text.matchAll(/(['"`])([A-Za-z_$][\w$]*)\1/g)) {
    if (named.has(m[2])) offenders.push(`string ${m[2]}`);
  }
  return offenders;
}

test("the vendored tree performs no network, process, filesystem or dynamic-code access of its own", () => {
  const offenders = [];
  for (const rel of filesUnder(TREE).filter((p) => SCRIPT.test(p))) {
    for (const o of ambientOffenders(fs.readFileSync(path.join(TREE, rel), "utf8"))) offenders.push(`${rel}: ${o}`);
  }
  assert.deepEqual(offenders, []);
});

test("the ambient-access guard itself: each network primitive and each way to reach one is an offender", () => {
  const must = {
    "fetch call": "fetch(url);",
    "XMLHttpRequest": "const x = new XMLHttpRequest();",
    "WebSocket": "const s = new WebSocket(url);",
    "EventSource": "const s = new EventSource(url);",
    "sendBeacon": "navigator.sendBeacon(url, data);",
    "WebTransport": "const t = new WebTransport(url);",
    "RTCPeerConnection": "const c = new RTCPeerConnection();",
    "importScripts": "importScripts(url);",
    "Worker with a URL": "const w = new Worker(url);",
    "SharedWorker with a URL": "const w = new SharedWorker(url);",
    "navigator.serviceWorker": "navigator.serviceWorker.register(url);",
    "Request-based fetch": "const r = new Request(url);",
    "Response": "const r = new Response(body);",
    "computed member on globalThis": "globalThis[" + bs_q("fetch") + "](url);",
    "member on window": "const f = window.fetch;",
    "computed member on self": "self[" + bs_q("WebSocket") + "];",
    "alias of the global object": "const g = globalThis;\
g.fetch(url);",
    "alias of the global object that never names a primitive": "const g = globalThis;\nexport const k = Object.keys(g);",
    "comma-operator call": "(0, fetch)(url);",
    "exact string name used as a key": "Reflect.get(target, " + bs_q("fetch") + ");",
    "exact template name used as a key": "target[`sendBeacon`](url);",
    "fetch inside a template interpolation": "const x = `${fetch(url)}`;",
    "process": "const e = process.env;",
    "require": "const m = require(name);",
    "child_process": "const c = child_process;",
    "eval": "eval(src);",
    "Function constructor": "const f = new Function(src);",
    "Function called without new": "Function(" + bs_q("return this") + ")();",
    "constructor reaching Function": "(() => {}).constructor(" + bs_q("return this") + ")();",
    "computed constructor": "(() => {})[" + bs_q("constructor") + "](src);",
    "a property named like a primitive": "const o = { fetch: 1 };",
    "semicolon in a string before the key": "Object.assign(el, { note: \";\", src: url });",
    "semicolon in a nested function body before the key": "Object.assign(el, { f() { return 1; }, src: url });",
    "paren in a string before the key": "Object.assign(el, { note: \")\", src: url });",
    "comma in a string before a quoted key": "Object.assign(el, { note: \",\", \"src\": url });",
    "semicolon in a template before the key": "Object.assign(el, { note: `;`, src: url });",
    "comments between arguments": "Object.assign(el, /* ; , ) */ { src: u } /* , */);",
    "trailing comma": "Object.assign(el, { src: u },);",
    "extra arguments before the object": "Object.assign(el, a, b, { src: u });",
    "key in a nested object": "Object.assign(el, { style: { src: u } });",
    "arrow function before the key": "Object.assign(el, { f: () => { x(); y(); }, href: u });",
    "multi-line call": "Object.assign(\n  el,\n  {\n    id: 1,\n    src: u,\n  },\n);",
    "Reflect.set with a trailing comma": "Reflect.set(el, \"src\", u,);",
    "setAttribute with a trailing comma": "el.setAttribute(\"src\", u,);",
    "setAttribute across lines": "el.setAttribute(\n  \"src\",\n  u\n);",
    "setAttribute with a semicolon in the value": "el.setAttribute(\"src\", \";\");",
    "computed callee name": "Object[\"assign\"](el, { src: u });",
    "escaped callee name": "Object.\\u0061ssign(el, { src: u });",
    "escaped bare key": "Object.assign(el, { \\u0073rc: u });",
    "escaped quoted key": "Object.assign(el, { \"\\u0073rc\": u });",
    "accessor key": "Object.defineProperties(el, { x: { get src() { return 1; } } });",
    "computed literal key": "Object.assign(el, { [\"src\"]: u });",
    "method key": "Object.assign(el, { src() {} });",
    "defineProperty with a semicolon in the descriptor": "Object.defineProperty(el, \"src\", { value: \";\" });",
    "an unbalanced call": "Object.assign(el, { src: u };",
    "a mismatched closer": "Object.assign(el, { a: 1 ]);",
    "an unterminated string": "Object.assign(el, \"never closed);",
    "a stray bracket closes the call early": "Object.assign(el, a ]);",
    "a stray brace closes the call early": "Object.assign(el, a };",
    "an unterminated string with no call": "const s = 1; \"never closed",
    "an unterminated template with no call": "const s = 1; `never closed",
    "an unterminated block comment with no call": "const s = 1; /* never closed",
    "bracket src assignment": "element[\"src\"] = url;",
    "bracket action assignment": "form[\"action\"] = url;",
    "template-literal key assignment": "element[`src`] = url;",
    "single-quoted bracket key": "el['href'] = url;",
    "escaped bracket key": "el[\"\\u0073rc\"] = url;",
    "hex-escaped bracket key": "el[\"\\x73rc\"] = url;",
    "compound dot assignment": "el.src += suffix;",
    "compound bracket assignment": "el[\"src\"] ||= url;",
    "Object.assign with a src key": "Object.assign(el, { src: u });",
    "Object.assign with a quoted key": "Object.assign(el, { \"href\": u });",
    "Object.assign with a shorthand key": "Object.assign(el, { src });",
    "Object.assign across lines": "Object.assign(el, {\n  id: 1,\n  src: u,\n});",
    "setAttribute src": "el.setAttribute(\"src\", u);",
    "setAttribute href single quotes": "el.setAttribute('href', u);",
    "setAttributeNS": "el.setAttributeNS(null, \"src\", u);",
    "Reflect.set": "Reflect.set(el, \"src\", u);",
    "Object.defineProperty": "Object.defineProperty(el, \"src\", { value: u });",
    "Reflect.defineProperty": "Reflect.defineProperty(el, \"href\", { value: u });",
    "Object.defineProperties": "Object.defineProperties(el, { src: { value: u } });",
    "destructuring target, dot": "({ k: el.src } = o);",
    "destructuring target, array": "[el.src] = list;",
    "destructuring target, bracket": "({ k: el[\"src\"] } = o);",
    "escaped setAttribute name": "el.setAttribute(\"\\u0073rc\", u);",
    "Image constructor with a src assignment": "const i = new Image(); i.src = url;",
    "Audio constructor": "const a = new Audio(url);",
    "script element created": "const e = document.createElement(\"script\");",
    "createElement with a computed receiver": "const e = d.createElement(tag);",
    "iframe via the element constructor": "const f = new HTMLIFrameElement();",
    "HTMLScriptElement": "const f = HTMLScriptElement;",
    "appendChild of a loader": "host.appendChild(node);",
    "innerHTML": "el.innerHTML = markup;",
    "srcdoc": "frame.srcdoc = markup;",
    "document used as an object": "const b = document.body;",
    "document used with a computed member": "const b = document[\"body\"];",
    "document with optional chaining": "const b = document?.body;",
    "src assignment on any receiver": "node.src = url;",
    "href assignment on any receiver": "node.href = url;",
    "postMessage": "target.postMessage(data, \"*\");",
    "BroadcastChannel": "const c = new BroadcastChannel(name);",
    "escaped identifier fetch": "\\u0066etch(url);",
    "escaped identifier, braced code point": "\\u{66}etch(url);",
    "escaped global object": "\\u0067lobalThis.fetch2;",
    "escaped global with member": "const f = \\u0067lobalThis.\\u0066etch;",
    "escaped constructor name": "new \\u0057ebSocket(url);",
    "escape in the middle of a name": "f\\u0065tch(url);",
    "escaped computed key": "o[\"\\u0066etch\"](url);",
    "hex-escaped computed key": "o[\"\\x66etch\"](url);",
    "escaped name inside an interpolation": "const x = `${\\u0066etch(url)}`;",
    "escaped DOM loader": "new \\u0049mage();",
    "a regex body naming a primitive (regex bodies are read as code: fail toward detecting)": "const r = /fetch/;",
  };
  for (const [label, text] of Object.entries(must)) {
    assert.notDeepEqual(ambientOffenders(text), [], `must be an offender: ${label}`);
  }
  // Every listed name is an offender on its own, as an identifier and as an exact string key, so a name
  // dropped from a list is noticed whichever other cases would still have fired.
  // (An independent literal list, not the guard's own, so removing a name from the guard fails here.)
  for (const name of ["fetch", "XMLHttpRequest", "WebSocket", "WebSocketStream", "EventSource", "WebTransport", "RTCPeerConnection", "RTCDataChannel", "importScripts", "Worker", "SharedWorker", "sendBeacon", "serviceWorker", "Request", "Response", "postMessage", "BroadcastChannel", "MessageChannel", "opener", "Image", "Audio", "HTMLImageElement", "HTMLScriptElement", "HTMLIFrameElement", "HTMLLinkElement", "HTMLEmbedElement", "HTMLObjectElement", "HTMLSourceElement", "HTMLMediaElement", "createElement", "createElementNS", "appendChild", "insertAdjacentHTML", "innerHTML", "outerHTML", "srcdoc", "globalThis", "window", "self", "global", "frames", "navigator", "location", "process", "Deno", "Bun", "require", "createRequire", "child_process", "eval", "Function"]) {
    assert.notDeepEqual(ambientOffenders(`export const v = ${name};`), [], `identifier: ${name}`);
    assert.notDeepEqual(ambientOffenders(`export const v = o[${JSON.stringify(name)}];`), [], `string key: ${name}`);
    const escaped = String.fromCharCode(92) + "u" + name.charCodeAt(0).toString(16).padStart(4, "0") + name.slice(1);
    assert.notDeepEqual(ambientOffenders(`export const v = ${escaped};`), [], `escaped identifier: ${name}`);
    assert.notDeepEqual(ambientOffenders(`export const v = o["${escaped}"];`), [], `escaped string key: ${name}`);
  }
  // Every resource property, in every assignment spelling, against an independent literal list.
  for (const prop of ["src", "href", "action", "data", "poster", "formAction", "srcset"]) {
    const esc = String.fromCharCode(92) + "u" + prop.charCodeAt(0).toString(16).padStart(4, "0") + prop.slice(1);
    for (const [form, src] of [
      ["dot", `el.${prop} = u;`],
      ["compound", `el.${prop} += u;`],
      ["bracket", `el["${prop}"] = u;`],
      ["template key", `el[\`${prop}\`] = u;`],
      ["escaped bracket", `el["${esc}"] = u;`],
      ["destructuring", `({ k: el.${prop} } = o);`],
      ["Object.assign", `Object.assign(el, { ${prop}: u });`],
      ["Object.defineProperty", `Object.defineProperty(el, "${prop}", d);`],
      ["Reflect.set", `Reflect.set(el, "${prop}", u);`],
      ["setAttribute", `el.setAttribute("${prop}", u);`],
      ["Object.assign after a semicolon in a string", `Object.assign(el, { note: ";", ${prop}: u });`],
      ["Object.assign after a nested function body", `Object.assign(el, { f() { return 1; }, ${prop}: u });`],
      ["Object.assign with a trailing comma", `Object.assign(el, { ${prop}: u },);`],
      ["Reflect.set with a trailing comma", `Reflect.set(el, "${prop}", u,);`],
      ["setAttribute across lines", `el.setAttribute(\n"${prop}",\nu\n);`],
      ["setAttributeNS", `el.setAttributeNS(null, "${prop}", u);`],
      ["a nested key", `Object.assign(el, { style: { ${prop}: u } });`],
    ]) {
      assert.notDeepEqual(ambientOffenders(src), [], `${form}: ${prop}`);
    }
    // the same property READ or compared is not an assignment
    assert.deepEqual(ambientOffenders(`const v = el.${prop}; if (el["${prop}"] === v) {}`), [], `read: ${prop}`);
  }
  const may = {
    "a comment mentioning fetch": "// fetch(url) and new WebSocket(url)\
const a = 1;",
    "a block comment": "/* globalThis.fetch, process.env */ const a = 1;",
    "text inside a string": "const s = " + bs_q("this does not fetch or use a WebSocket") + ";",
    "text inside template literal text": "const s = `fetch and globalThis and process`;",
    "an identifier that merely contains a primitive name": "const prefetch = 1, fetchLike = 2, Workers = 3, RequestLike = 4, selfish = 5;",
    "a constructor reference that is not called": "const C = coll.constructor;\
const n = obj?.constructor?.name;",
    "an ordinary division": "const r = a.length / 2 / b;",
    "a method and variable named document": "class P { *document(top) { return top.document; } }\nconst document2 = 1;",
    "the document word in a string": "const t = \"document\";",
    "Option, which loads nothing": "const o = new Option();",
    "import.meta.url, a read-only string": "const u = import.meta.url;",
    "an escape inside a comment": "// \\u0066etch(url)\nconst a = 1;",
    "an escape inside a string that is not a name": "const s = \"\\u0066etching words\";",
    "an equality test on src": "if (node.src === other) {}",
    "setAttribute of a harmless name": "el.setAttribute(\"id\", u);",
    "Object.assign of harmless keys": "Object.assign(token, { type, source, end });",
    "Object.assign then a later src read": "Object.assign(a, b);\nconst s = node.src;",
    "bracket read": "const s = el[\"src\"];",
    "bracket comparison": "if (el[\"src\"] === x) {}",
    "bracket inequality": "if (el[\"src\"] !== x) {}",
    "Reflect.get of src": "const s = Reflect.get(el, \"src\");",
    "Reflect.set of a harmless key": "Reflect.set(el, \"id\", u);",
    "src word in a comment assignment": "// el[\"src\"] = url\nconst a = 1;",
    "src as a plain string value": "const kind = \"src\";",
    "a src read": "const s = node.src;",
    "semicolon in a string, harmless key": "Object.assign(el, { note: \";\", id: 1 });",
    "nested function body, harmless key": "Object.assign(el, { f() { return 1; }, id: 1 });",
    "resource word as a value": "Object.assign(el, { text: \"src\" });",
    "resource word as a variable value": "Object.assign(el, { label: src });",
    "resource word in an array": "Object.assign(el, [a, src]);",
    "resource word as the spread source": "Object.assign(el, src);",
    "setAttribute of a harmless name with the resource word as value": "el.setAttribute(\"id\", \"src\");",
    "Reflect.set of a harmless name with the resource word as value": "Reflect.set(el, \"id\", \"src\");",
    "resource key inside a comment in the call": "Object.assign(el, { /* src: 1 */ id: 1 });",
    "resource key inside a string in the call": "Object.assign(el, { text: \"Object.assign(x, { src: 1 })\" });",
    "Map.set with the resource word as the value": "cache.set(key, \"src\");",
    "Map.set with the resource word": "map.set(\"src\", 1);",
    "a resource key in a plain object, no call": "const o = { src: 1 };",
    "a multi-line harmless call": "Object.assign(\n  el,\n  {\n    id: 1,\n  },\n);",
    "a data read": "const d = node.data;",
    "a string that merely contains a name": "const s = " + bs_q("fetch_count") + ";",
  };
  for (const [label, text] of Object.entries(may)) {
    assert.deepEqual(ambientOffenders(text), [], `must be accepted: ${label}`);
  }
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
