// Phase 1 boundaries, asserted rather than remembered.
//
// The plan defers attestations, exceptions, containers, workflows and the adapter to later
// phases, each for a stated reason — most importantly that an escape hatch must not be built before
// the checks it is an escape from. These tests fail if a later phase's feature appears early, so
// the deferral is enforced rather than merely intended.
//
// They also enforce invariant 4 structurally. Invariant 4, as amended by decision A of the structural
// parser bundle (ST-57, #119), reads: no install-time or environment-resolved third-party dependency;
// vendored parser code is reviewed repository content whose identity, hashes and licence are pinned.
// The pinning is asserted in vendor-yaml.test.mjs. What is asserted here is the part that must stay
// absolute: nothing is resolved at install time or from the environment.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { REPO, cli, validate, fixture } from "./helpers.mjs";
import { externalReferences } from "./js-references.mjs";

const read = (rel) => fs.readFileSync(path.join(REPO, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(REPO, rel));

function filesUnder(dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(REPO, dir), { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...filesUnder(rel));
    else out.push(rel);
  }
  return out;
}

// Every entry named node_modules at any depth under `dir` (an absolute path), outside .git: a directory, a
// link or a file. It is reported and not descended into. The walk does not follow links.
function nodeModulesUnder(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.name === "node_modules") out.push(path.relative(base, full).split(path.sep).join("/"));
    else if (entry.isDirectory()) out.push(...nodeModulesUnder(full, base));
  }
  return out.sort();
}

const DEPENDENCY_KEYS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies", "bundledDependencies", "bundleDependencies", "workspaces", "overrides", "resolutions"];
const LIFECYCLE = ["preinstall", "install", "postinstall", "prepare", "prepublish", "prepublishOnly", "prepack", "postpack"];
const LOCKFILES = ["package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb", "bun.lock"];

test("invariant 4: no dependency key of any kind is declared, and no install step exists", () => {
  const pkg = JSON.parse(read("package.json"));
  for (const key of DEPENDENCY_KEYS) assert.ok(!(key in pkg), `package.json must have no ${key} key`);
  for (const name of LIFECYCLE) assert.ok(!(name in (pkg.scripts ?? {})), `package.json must have no ${name} script`);
});

test("invariant 4: no lockfile, no installed modules and no registry configuration anywhere in the repository", () => {
  const all = filesUnder(".");
  const offenders = all.filter((f) => LOCKFILES.includes(path.basename(f)) || path.basename(f) === ".npmrc" || path.basename(f) === ".yarnrc" || path.basename(f) === ".yarnrc.yml");
  assert.deepEqual(offenders, [], "a lockfile or registry configuration resolves dependencies from the environment");
  assert.ok(!exists("node_modules"), "node_modules must not exist");
  assert.deepEqual(nodeModulesUnder(REPO), [], "an installed-modules directory at any depth is an environment-resolved dependency");
  assert.ok(!exists("vendor"), "vendored code lives under scripts/vendor, which the pinned archive includes; a repository-root vendor/ would not be");
});

test("the installed-modules scan itself: a node_modules at any depth is reported, .git is not searched", () => {
  const tree = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-nm-"));
  try {
    const mk = (rel, file = false) => {
      const full = path.join(tree, ...rel.split("/"));
      if (file) {
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, "x");
      } else {
        fs.mkdirSync(full, { recursive: true });
      }
    };
    mk("scripts/ok.mjs", true);
    mk("test/fixtures/data.json", true);
    assert.deepEqual(nodeModulesUnder(tree), []);
    mk("node_modules/pkg/index.js", true);
    mk("scripts/node_modules/x/index.js", true);
    mk("test/fixtures/node_modules/y/index.js", true);
    mk("docs/a/b/c/node_modules", false);
    mk("tools/node_modules", true);
    mk(".git/node_modules/z/index.js", true);
    assert.deepEqual(nodeModulesUnder(tree), ["docs/a/b/c/node_modules", "node_modules", "scripts/node_modules", "test/fixtures/node_modules", "tools/node_modules"]);
    // reported, not descended into: a node_modules inside a node_modules is not listed again
    mk("scripts/node_modules/x/node_modules/deep/index.js", true);
    assert.equal(nodeModulesUnder(tree).filter((r) => r.startsWith("scripts/")).length, 1);
  } finally {
    fs.rmSync(tree, { recursive: true, force: true });
  }
});

test("invariant 4: every runtime import under scripts/ is a node: builtin or a local module", () => {
  const offenders = [];
  for (const file of filesUnder("scripts").filter((f) => /\.(mjs|js|cjs)$/.test(f))) {
    for (const o of externalReferences(read(file), { file: path.join(REPO, file), root: REPO })) offenders.push(`${file}: ${o}`);
  }
  assert.deepEqual(offenders, [], "a bare import specifier is a third-party dependency resolved from the environment");
});

// A file at <root>/scripts/a.mjs, for the scan's own tests. The injected file system says every path exists
// (except names starting "missing") and has no links, so only the containment logic is under test.
const FAKE_ROOT = path.join(os.tmpdir(), "aistd-scan-root");
const FAKE_IO = {
  existsSync: (p) => !path.basename(p).startsWith("missing"),
  realpathSync: (p) => p,
};
const HERE_FILE = { file: path.join(FAKE_ROOT, "scripts", "a.mjs"), root: FAKE_ROOT, io: FAKE_IO };

test("the repository-wide scan decides relative specifiers against the repository, not by their first character", () => {
  const refs = (spec, where = HERE_FILE) => externalReferences("import x from " + JSON.stringify(spec) + ";\n", where);
  for (const ok of ["./b.mjs", "../tests/x.mjs", "./sub/../b.mjs", "../scripts/b.mjs"]) assert.deepEqual(refs(ok), [], ok);
  const bad = ["../../outside.mjs", "../../../etc/x.mjs", "./../../outside.mjs", "./sub/../../../outside.mjs", "../..", "..", "./b.mjs?x=1", "./b.mjs#h", "./%2e%2e/x.mjs", ".\\b.mjs"];
  for (const spec of bad) assert.notDeepEqual(refs(spec), [], spec);
  // a target that does not exist cannot be shown to be contained
  assert.match(refs("./missing.mjs")[0], /does not exist/);
  assert.match(refs("../missing-dir.mjs")[0], /does not exist/);
  // a file deeper in the tree reaches less far
  const deep = { ...HERE_FILE, file: path.join(FAKE_ROOT, "scripts", "lib", "a.mjs") };
  assert.deepEqual(refs("../../outside.mjs", deep), []);
  assert.notDeepEqual(refs("../../../outside.mjs", deep), []);
  // an existing relative target whose real path is outside the root (a link) is an offender
  const target = path.join(FAKE_ROOT, "scripts", "b.mjs");
  const linked = { ...FAKE_IO, realpathSync: (p) => (p === target ? path.join(os.tmpdir(), "elsewhere.mjs") : p) };
  assert.notDeepEqual(refs("./b.mjs", { ...HERE_FILE, io: linked }), []);
  // a root that cannot be resolved proves nothing
  const noRoot = { ...FAKE_IO, realpathSync: () => { throw new Error("EACCES"); } };
  assert.notDeepEqual(refs("./b.mjs", { ...HERE_FILE, io: noRoot }), []);
  // the other literal forms are resolved the same way
  const forms = {
    "dynamic import": (spec) => "export const p = import(" + JSON.stringify(spec) + ");\n",
    "require": (spec) => "const x = require(" + JSON.stringify(spec) + ");\n",
    "re-export": (spec) => "export * from " + JSON.stringify(spec) + ";\n",
    "side-effect import": (spec) => "import " + JSON.stringify(spec) + ";\n",
    "new URL against import.meta.url": (spec) => "export const u = new URL(" + JSON.stringify(spec) + ", import.meta.url);\n",
  };
  for (const [label, make] of Object.entries(forms)) {
    assert.deepEqual(externalReferences(make("./b.mjs"), HERE_FILE), [], label + ": inside");
    assert.notDeepEqual(externalReferences(make("../../outside.mjs"), HERE_FILE), [], label + ": outside");
    assert.notDeepEqual(externalReferences(make("./missing.mjs"), HERE_FILE), [], label + ": missing");
  }
  // new URL: a bare path is relative; an absolute URL, a root-relative path and a non-literal are offenders
  const url = (src) => externalReferences(src, HERE_FILE);
  assert.deepEqual(url('export const u = new URL("data/x.json", import.meta.url);\n'), []);
  assert.notDeepEqual(url('export const u = new URL("../../data/x.json", import.meta.url);\n'), []);
  assert.notDeepEqual(url('export const u = new URL("file:///etc/passwd", import.meta.url);\n'), []);
  // any scheme other than file: names no file of this module, so its base is ignored (a stated limit: a network
  // location is not a file system path; loading it would need fetch or a dynamic import, which are flagged)
  assert.deepEqual(url('export const u = new URL("https://example.com/x.js", import.meta.url);\n'), []);
  // file URLs name file system paths and stay subject to containment, in every spelling the URL parser accepts
  const fileUrl = (p) => "file://" + (path.sep === "\\" ? "/" : "") + p.split(path.sep).join("/");
  const insideFile = fileUrl(path.join(FAKE_ROOT, "scripts", "b.mjs"));
  const outsideFile = fileUrl(path.join(os.tmpdir(), "outside-of-the-repository.mjs"));
  const fileSpellings = (u) => ({
    "plain": u,
    "upper-case scheme": "FILE" + u.slice(4),
    "mixed-case scheme": "FiLe" + u.slice(4),
    "leading space": " " + u,
    "trailing space": u + " ",
    "embedded tab": u.slice(0, 2) + "\t" + u.slice(2),
    "embedded newline": u.slice(0, 3) + "\n" + u.slice(3),
    "leading control character": String.fromCharCode(1) + u,
  });
  for (const [label, lit] of Object.entries(fileSpellings(outsideFile))) {
    for (const wrap of [(l) => "new URL(" + JSON.stringify(l) + ")", (l) => "new URL(" + JSON.stringify(l) + ", import.meta.url)", (l) => "new URL(" + JSON.stringify(l) + ", base)", (l) => "URL.parse(" + JSON.stringify(l) + ")", (l) => "fileURLToPath(" + JSON.stringify(l) + ")"]) {
      assert.notDeepEqual(url("export const u = " + wrap(lit) + ";\n"), [], "outside file URL, " + label + ": " + wrap("x"));
    }
  }
  for (const [label, lit] of Object.entries(fileSpellings(insideFile))) {
    assert.deepEqual(url("export const u = new URL(" + JSON.stringify(lit) + ");\n"), [], "inside file URL, " + label);
  }
  assert.notDeepEqual(url('export const u = new URL("file:./x.mjs", base);\n'), [], "a relative-looking file URL");
  assert.match(url('export const u = new URL(' + JSON.stringify(fileUrl(path.join(FAKE_ROOT, "scripts", "missing.mjs"))) + ");\n")[0], /does not exist/);
  // URL.parse(input, base) resolves like the constructor, so it follows the constructor's rules
  assert.deepEqual(url('export const u = URL.parse("./b.mjs", import.meta.url);\n'), []);
  assert.deepEqual(url('export const u = URL.parse("https://example.com/");\n'), []);
  for (const bad of ['URL.parse("../../outside.mjs", import.meta.url)', "URL.parse(input, import.meta.url)", 'URL.parse("./a.mjs", base)', 'URL.parse("./a.mjs")', "URL.parse()", "globalThis.URL.parse(input, base)", "const p = URL.parse", "URL.canParse(input, import.meta.url) && p(URL.parse)"]) {
    assert.notDeepEqual(url("export const u = " + bad + ";\n"), [], bad);
  }
  // fileURLToPath, pathToFileURL and import.meta.resolve
  assert.deepEqual(url('import { fileURLToPath } from "node:url";\nexport const here = fileURLToPath(import.meta.url);\n'), []);
  assert.deepEqual(url('import { fileURLToPath } from "node:url";\nexport const d = fileURLToPath(new URL("./b.mjs", import.meta.url));\n'), []);
  assert.deepEqual(url('import { pathToFileURL } from "node:url";\nexport const main = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;\n'), []);
  assert.deepEqual(url('export const r = import.meta.resolve("./b.mjs");\n'), []);
  assert.deepEqual(url('export const r = import.meta.resolve("node:fs");\n'), []);
  for (const bad of [
    "fileURLToPath(someUrl)",
    "fileURLToPath(opts.url)",
    "fileURLToPath(import.meta.url + x)",
    'fileURLToPath("https://example.com/x")',
    "fileURLToPath(new URL(x, import.meta.url))",
    "const f = fileURLToPath",
    "x = fileURLToPath;;(import.meta.url)",
    "pathToFileURL(somePath)",
    'pathToFileURL("./b.mjs")',
    "pathToFileURL(somePath).href",
    "import.meta.url === pathToFileURL(somePath).href",
    "const g = pathToFileURL",
    'import.meta.resolve("../../outside.mjs")',
    'import.meta.resolve("package")',
    "import.meta.resolve(name)",
    "const r = import.meta.resolve",
    'import.meta["resolve"]("./b.mjs")',
    'import.meta["url"]',
  ]) {
    assert.notDeepEqual(url("export const u = " + bad + ";\n"), [], bad);
  }
  assert.notDeepEqual(url('export const u = new URL("/etc/passwd", import.meta.url);\n'), []);
  // a root-relative URL is the file system root, not the repository, even when that path is inside it
  const rootRelative = "/" + path.join(FAKE_ROOT, "scripts", "b.mjs").split(path.sep).join("/");
  assert.notDeepEqual(url('export const u = new URL(' + JSON.stringify(rootRelative) + ', import.meta.url);\n'), []);
  assert.notDeepEqual(url('export const u = new URL("a", import.meta.url;\n'), [], "an unbalanced new URL call");
  // every spelling of the constructor, and every way of holding it that hides the name
  const OUT = '"../../outside.mjs", import.meta.url';
  const spellings = {
    "member of globalThis": "new globalThis.URL(" + OUT + ")",
    "member of window": "new window.URL(" + OUT + ")",
    "member of self": "new self.URL(" + OUT + ")",
    "member of global": "new global.URL(" + OUT + ")",
    "member of an arbitrary object": "new anything.URL(" + OUT + ")",
    "parenthesised": "new (URL)(" + OUT + ")",
    "parenthesised member": "new (globalThis.URL)(" + OUT + ")",
    "doubly parenthesised": "new ((URL))(" + OUT + ")",
    "optional call": "new URL?.(" + OUT + ")",
    "escaped name": "new " + String.fromCharCode(92) + "u0055RL(" + OUT + ")",
    "a helper that takes the base as its second argument": "resolveHere(" + OUT + ")",
    "Reflect.construct": "Reflect.construct(URL, [" + OUT + "])",
    "an alias of the constructor": "(() => { const U = URL; return new U(" + OUT + "); })()",
    "the constructor passed as a value": "make(URL)",
    "the constructor compared": "(x instanceof URL)",
    "called without new": 'URL("https://example.com/")',
    "new without an argument list": "new URL",
    "a member read without new": "globalThis.URL",
    "URL.bind with a path, constructed later": 'U = URL.bind(null, "../../outside.mjs"); new U(import.meta.url)',
    "URL.call": 'URL.call(null, "../../outside.mjs", import.meta.url)',
    "URL.apply": 'URL.apply(null, ["../../outside.mjs", import.meta.url])',
    "URL.prototype": "URL.prototype.constructor",
    "a computed member of URL": 'URL["bind"](null, x)',
    "a bind on the qualified constructor": 'globalThis.URL.bind(null, "../../outside.mjs")',
    // the base argument: only the literal import.meta.url is accepted
    "the base held in a variable": 'new URL("../../outside.mjs", base)',
    "the base is import.meta.url read into a variable first": 'const base = import.meta.url; new URL("../../outside.mjs", base)',
    "the base is a computed import.meta member": 'new URL("../../outside.mjs", import.meta["url"])',
    "the base is another import.meta member": 'new URL("../../outside.mjs", import.meta.dirname)',
    "the base is a member of an object": 'new URL("../../outside.mjs", opts.base)',
    "the base is a call": 'new URL("../../outside.mjs", getBase())',
    "the base is a template": "new URL(\"../../outside.mjs\", `${base}`)",
    "the base is a concatenation": 'new URL("../../outside.mjs", import.meta.url + "")',
    "the base is a different URL": 'new URL("../../outside.mjs", "file:///elsewhere/")',
    "a computed import.meta base passed to a helper": 'resolveHere("../../outside.mjs", import.meta["url"])',
    // the first argument and the argument list
    "the first argument in a variable": "new URL(rel, import.meta.url)",
    "the first argument a template with an interpolation": "new URL(`./${name}.mjs`, import.meta.url)",
    "the first argument a concatenation": 'new URL("./" + name, import.meta.url)',
    "the first argument a member": "new URL(opts.path, import.meta.url)",
    "the first argument a call": "new URL(pick(), import.meta.url)",
    "a spread of the arguments": "new URL(...args)",
    "a spread after the first argument": 'new URL("./a.mjs", ...rest)',
    "no arguments": "new URL()",
    "a third argument": 'new URL("./a.mjs", import.meta.url, extra)',
    "a relative literal with no base": 'new URL("./a.mjs")',
    "an inside literal with a computed import.meta base": 'new URL("./b.mjs", import.meta["url"])',
  };
  for (const [label, expr] of Object.entries(spellings)) {
    assert.notDeepEqual(url("export const u = " + expr + ";\n"), [], "must be an offender: " + label);
  }
  const accepted = {
    "member of globalThis, inside": 'new globalThis.URL("./b.mjs", import.meta.url)',
    "parenthesised, inside": 'new (URL)("./b.mjs", import.meta.url)',
    "member of window, bare relative, inside": 'new window.URL("b.mjs", import.meta.url)',
    "a URL that names no file of this module": 'new URL("https://example.com/")',
    "a static member of URL": "URL.canParse(input)",
    "a static member of globalThis.URL": "globalThis.URL.canParse(input)",
    "an absolute literal with any base (the base is ignored)": 'new URL("https://example.com/x", base)',
    "import.meta.url with whitespace and a comment inside": 'new URL("./b.mjs", import . meta /* c */ . url)',
    "a helper given an inside literal and import.meta.url": 'resolveHere("./b.mjs", import.meta.url)',
    "URL.createObjectURL": "URL.createObjectURL(blob)",
    "URL.revokeObjectURL": "URL.revokeObjectURL(objectUrl)",
    "URL named in an import clause": 'import { URL, fileURLToPath } from "node:url";\nexport const f = fileURLToPath(import.meta.url);',
    "URL in a string": 'export const s = "new URL(x)";',
    "URL in a comment": "// new URL(x, import.meta.url)\nexport const a = 1;",
    "a longer identifier": "export const URLS = 1; export const MyURL = 2;",
    "createRequire-free import.meta.url alone": "export const here = import.meta.url;",
  };
  // each unreadable or offending construction is reported once, not once per pass over the tokens
  assert.equal(url('export const u = new URL("../../o.mjs", import.meta.url);\n').length, 1);
  assert.equal(url('export const u = new URL("../../o.mjs", base);\n').length, 1);
  assert.equal(url('export const u = h("../../o.mjs", import.meta.dirname);\n').length, 1);
  for (const [label, expr] of Object.entries(accepted)) {
    assert.deepEqual(url(expr + ";\n"), [], "must be accepted: " + label);
  }
  assert.notDeepEqual(url("export const u = new URL(name, import.meta.url);\n"), []);
  assert.notDeepEqual(url('export const u = new URL("a" + b, import.meta.url);\n'), []);
  assert.deepEqual(url('export const u = new URL("https://example.com/");\n'), [], "a URL with no import.meta.url base names no file of this module");
  assert.throws(() => externalReferences("export const a = 1;\n"), TypeError);
});

test("real links are caught by the repository-wide scan (skipped, and reported, where links cannot be created)", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-scan-"));
  const outside = root + "-outside.mjs";
  try {
    fs.mkdirSync(path.join(root, "scripts"));
    fs.writeFileSync(path.join(root, "scripts", "ok.mjs"), "export const ok = 1;\n");
    fs.writeFileSync(outside, "export const outside = 1;\n");
    try {
      fs.symlinkSync(outside, path.join(root, "scripts", "link.mjs"));
    } catch (e) {
      t.skip("symbolic links cannot be created here (" + e.code + "); the injected file system test runs the same logic");
      return;
    }
    const where = { file: path.join(root, "scripts", "a.mjs"), root };
    assert.deepEqual(externalReferences('import "./ok.mjs";\n', where), []);
    assert.notDeepEqual(externalReferences('import "./link.mjs";\n', where), [], "an in-repository link whose target is outside");
    assert.notDeepEqual(externalReferences('import "./nothing.mjs";\n', where), [], "a missing target");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { force: true });
  }
});

test("the repository-wide import scan itself: every form that names a module is read, and unreadable ones are offenders", () => {
  const must = {
    "side-effect import of a package": 'import "package";\n',
    "static import": 'import x from "package";\n',
    "named import with a string name": 'import { "a-b" as c } from "package";\n',
    "re-export with a string name": 'export { "a-b" as c } from "package";\n',
    "namespace re-export with a string name": 'export * as "ns" from "package";\n',
    "import with attributes": 'import x from "package" with { type: "json" };\n',
    "side-effect import with attributes": 'import "package" with { type: "json" };\n',
    "import across lines": 'import {\n  a,\n  b,\n} from "package";\n',
    "dynamic import": 'export const p = import("package");\n',
    "dynamic import with options": 'export const p = import("package", { with: { type: "json" } });\n',
    "require with a trailing comma": 'const x = require("package",);\n',
    "require with extra arguments": 'const x = require("package", {});\n',
    "non-literal require": 'const x = require(name);\n',
    "createRequire": 'import { createRequire } from "node:module";\nconst r = createRequire(import.meta.url);\n',
    "an import after a semicolon in a string": 'const s = ";"; import "package";\n',
    "an unbalanced call": 'const x = require("package"\n',
    "optional call": "const x = require?.(\"package\");\n",
    "optional call, trailing comma": "const x = require?.(\"package\",);\n",
    "parenthesised callee": "const x = (require)(\"package\");\n",
    "sequence callee": "const x = (0, require)(\"package\");\n",
    "module.require": "const x = module.require(\"package\");\n",
    "module.require, optional": "const x = module?.require?.(\"package\");\n",
    "computed require": "const x = module[\"require\"](\"package\");\n",
    "computed optional require": "const x = module[\"require\"]?.(\"package\");\n",
    "require.call": "const x = require.call(null, \"package\");\n",
    "require.apply": "const x = require.apply(null, [\"package\"]);\n",
    "require.bind": "const r = require.bind(null); const x = r(\"package\");\n",
    "aliased require": "const r = require; const x = r(\"package\");\n",
    "require passed as a value": "load(require);\n",
    "bare module.require reference": "const r = module.require;\n",
    "bare computed require reference": "const r = module[\"require\"];\n",
    "template specifier with an interpolation": "const x = require(`pack${\"age\"}`);\n",
    "template specifier without interpolation": "const x = require(`package`);\n",
    "escaped optional call": "const x = \\u0072equire?.(\"package\");\n",
    "require.resolve of a package": "const p = require.resolve(\"package\");\n",
  };
  for (const [label, text] of Object.entries(must)) assert.notDeepEqual(externalReferences(text, HERE_FILE), [], `must be an offender: ${label}`);
  const may = {
    "a node: builtin": 'import fs from "node:fs";\nexport { fs };\n',
    "side-effect node: import": 'import "node:process";\n',
    "a relative import": 'import { a } from "./a.mjs";\nexport { a };\n',
    "a relative side-effect import": 'import "./a.mjs";\n',
    "a relative re-export": 'export * from "../b.mjs";\n',
    "a relative dynamic import with options": 'export const p = import("./a.mjs", { with: { type: "json" } });\n',
    "a mention in a comment": '// import "package";\n/* require("package") */\nexport const a = 1;\n',
    "a mention in a string": 'export const s = "import \\"package\\"; require(\'package\')";\n',
    "import.meta": 'export const u = import.meta.url;\n',
    "optional call of a relative file": "export const x = require?.(\"./a.cjs\");\n",
    "module.require of a relative file": "export const x = module.require(\"./a.cjs\");\n",
    "computed require of a relative file": "export const x = module[\"require\"](\"./a.cjs\");\n",
    "template specifier without interpolation, relative": "export const x = require(`./a.cjs`);\n",
    "require of a node: builtin": "export const x = require(\"node:fs\");\n",
    "the word require in a string": "export const s = \"call require('package') later\";\n",
    "the word require in a template text": "export const s = `require?.(\"package\") and (require)(\"x\")`;\n",
    "the word require in comments": "// (require)(\"package\")\n/* require.call(null, \"package\") */\nexport const a = 1;\n",
    "a list of names ending in require": "export const names = [\"a\", \"require\"];\n",
    "a string key named require": "export const o = { \"require\": 1 };\n",
    "a longer identifier": "export const requirements = 1; export const requireAll = 2;\n",
    "a property named import": 'export const f = (o) => o.import("x");\n',
  };
  for (const [label, text] of Object.entries(may)) assert.deepEqual(externalReferences(text, HERE_FILE), [], `must be accepted: ${label}`);
});

test("init exists, but only ever runs against an explicitly selected target", () => {
  // Built on purpose in Phase 2, after the checks and the scaffold guard it depends on. What must
  // still hold is that it cannot fall back to a default: a bare `init` is a refusal, never a run
  // against the working directory (which here is the pack checkout).
  assert.ok(exists("scripts/init.mjs"), "scripts/init.mjs is a Phase 2 deliverable and must exist");
  const r = cli(["init"]);
  assert.equal(r.code, 2, "init with no target must refuse");
  assert.match(r.stderr, /target directory is required/);
  assert.ok(!/not implemented/i.test(r.stderr), "init is implemented in this release");
});

test("the usage text advertises init, and still says attestations and exceptions are not implemented", () => {
  const r = cli([]);
  assert.match(r.stderr, /Usage: standards <audit\|validate\|init>/);
  assert.match(r.stderr, /^\s+init\s+Bootstrap/m);
  assert.match(r.stderr, /Not implemented in this release: attestations and exceptions \(Phase 4\)/);
});

test("Phase 4 features are absent: no attestations, no exceptions", () => {
  for (const rel of ["scripts/attestations.mjs", "scripts/reviews.mjs"]) {
    assert.ok(!exists(rel), `${rel} is Phase 4 and must not exist yet`);
  }
  const schema = JSON.parse(read("schemas/ai-policy.schema.json"));
  assert.ok(!("attestations" in schema.properties), "attestations are Phase 4");
  assert.ok(!("exceptions" in schema.properties), "exceptions are Phase 4");
  assert.equal(schema.additionalProperties, false, "the schema must be closed, so they cannot slip in");
});

test("an escape hatch cannot precede the checks: no result may be excepted or attested yet", () => {
  const { json } = validate(fixture("valid-manifest"));
  for (const r of json.results) {
    assert.ok(
      !["excepted", "attested"].includes(r.disposition),
      `${r.rule} reports ${r.disposition}, but that mechanism does not exist in this release`,
    );
  }
});

test("Phase 5 features are absent: no adapter, no containers, no workflows", () => {
  for (const rel of [
    "standards-adapter.json",
    "compose.ci.yml",
    "ci/Dockerfile",
    "scripts/pipeline.mjs",
    "scripts/ci.sh",
    "scripts/adapter.mjs",
    ".github/workflows",
  ]) {
    assert.ok(!exists(rel), `${rel} is Phase 5 and must not exist yet`);
  }
});

test("the Phase 2 tooling built so far exists, and the rest of Phase 2 does not", () => {
  // The two catalog reviews are the FIRST Phase 2 work, because every later phase builds on a
  // numbering they can still change. The rule-table generator and the document-conformance checker
  // followed on 2026-09-14, each admitted here deliberately. Manifest and tool-permission tooling,
  // init and the templates were built on 2026-09-19 and are admitted below.
  for (const rel of ["scripts/inventory.mjs", "scripts/fidelity.mjs", "scripts/spec.mjs"]) {
    assert.ok(exists(rel), `${rel} is a blocking review and must exist`);
  }
  for (const rel of ["scripts/sync-rule-tables.mjs", "scripts/standards-sections.mjs"]) {
    assert.ok(exists(rel), `${rel} is Phase 2 tooling already delivered and must exist`);
  }
  for (const rel of ["scripts/manifest.mjs", "scripts/toolperms.mjs", "scripts/init.mjs", "templates/index.json"]) {
    assert.ok(exists(rel), `${rel} is a planned Phase 2 deliverable, built on 2026-09-19, and must exist`);
  }
});

test("only the standards written so far exist", () => {
  // The guard is not that the corpus is frozen — Phase 2 writes the remaining 45. It is that a
  // standard arrives deliberately, by being added here, rather than by appearing unnoticed.
  const present = fs.readdirSync(path.join(REPO, "standards")).filter((f) => f.endsWith(".md")).sort();
  assert.deepEqual(present, [
    "01-ai-system-manifest.md",
    "02-ai-risk-tiering-and-applicability.md",
    "03-machine-readable-ai-policy.md",
    "05-verdict-vocabulary.md",
    "06-standard-structure-and-rule-identity.md",
    "07-boundary-with-adjacent-standards.md",
    "08-ai-safety-requirements-and-safety-cases.md",
    "09-misuse-and-abuse-prevention.md",
    "11-autonomy-levels-and-delegated-authority.md",
    "13-personal-data-in-ai-systems.md",
    "17-evaluation-plans-for-generative-systems.md",
    "21-prompt-and-instruction-security.md",
    "23-agent-execution-security.md",
    "25-grounding-and-hallucination-control.md",
    "33-ai-observability.md",
    "44-operational-resilience-degradation-and-provider-portability.md",
    "45-approval-gates.md",
    "51-agent-and-tool-execution-prohibitions.md",
  ]);
});

test("the original prompt is unmodified", () => {
  // It is a governing input, not a working document.
  const text = read("artifacts/prompts/original_prompt.md");
  assert.match(text, /^Create a repository of practical, machine-checkable AI engineering standards/);
  assert.match(text, /Never weaken a test, policy, standard, or evidence requirement merely to make a gate pass\./);
});

test("no standard still calls its own number provisional", () => {
  // Numbering was provisional until the two Phase 2 reviews passed. They pass, and
  // artifacts/prompts/ai-standards-spec.md is now the record of identity, so a document still
  // describing its number as unsettled is stale rather than cautious.
  for (const file of fs.readdirSync(path.join(REPO, "standards")).filter((f) => f.endsWith(".md"))) {
    const text = read(path.join("standards", file));
    assert.ok(
      !/Provisional numbering/.test(text),
      `${file} still carries a provisional-numbering marker, but the reviews that would lift it have passed`,
    );
  }
});

test("every standard cites the specification item it implements", () => {
  // The replacement for the provisional marker: identity is now a citation into the specification
  // rather than a caveat about not having one.
  for (const file of fs.readdirSync(path.join(REPO, "standards")).filter((f) => f.endsWith(".md"))) {
    const text = read(path.join("standards", file));
    assert.match(
      text,
      /Source: item \d+ of \[`artifacts\/prompts\/ai-standards-spec\.md`\]/,
      `${file} must name the specification item it implements`,
    );
  }
});
