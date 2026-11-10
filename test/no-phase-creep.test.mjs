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
import { externalReferences, directCallTexts, indirectNameReferences, unreviewedImports, stripComments } from "./js-references.mjs";

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

test("invariant 4: every runtime import under scripts/ is a node: builtin or a local module", () => {
  assert.deepEqual(runtimeOffenders(REPO), [], "a bare import specifier is a third-party dependency resolved from the environment");
});

test("the allowlist is short, named, and each entry is reviewed: a reason, an existing file, exact calls", () => {
  assert.ok(RUNTIME_ALLOWLIST.length <= 3, "the allowlist is meant to stay short; a new entry is a decision");
  for (const e of RUNTIME_ALLOWLIST) {
    assert.ok(typeof e.reason === "string" && e.reason.length > 20, e.file + " needs a reason");
    assert.ok(exists(e.file), e.file + " must exist");
    assert.ok(e.modules.length > 0 && e.names.length > 0 && e.calls.length > 0, e.file + " must record the modules, names and exact calls");
  }
});

test("an allowlisted file keeps only its reviewed calls; any other call or other construct is an offender", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-allow-"));
  try {
    const put = (rel, text) => {
      const full = path.join(root, ...rel.split("/"));
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, text);
    };
    const list = [{ file: "scripts/run.mjs", reason: "starts the one reviewed child process", modules: ["node:child_process"], names: ["spawnSync"], calls: ['spawnSync ( "git" , [ "status" ] )'] }];
    const header = 'import { spawnSync } from "node:child_process";\n';
    put("scripts/run.mjs", header + 'spawnSync("git", ["status"]);\n');
    assert.deepEqual(runtimeOffenders(root, list), []);
    // the same module in an unlisted file
    put("scripts/other.mjs", header + 'spawnSync("git", ["status"]);\n');
    assert.ok(runtimeOffenders(root, list).some((o) => o.startsWith("scripts/other.mjs: import node:child_process is a loader-capable module")));
    fs.rmSync(path.join(root, "scripts", "other.mjs"));
    // an edited call, an extra call, and another construct in the allowlisted file
    put("scripts/run.mjs", header + 'spawnSync("git", ["status", "--short"]);\n');
    assert.ok(runtimeOffenders(root, list).some((o) => o.includes("the reviewed calls changed")), "an edited call");
    put("scripts/run.mjs", header + 'spawnSync("git", ["status"]);\nspawnSync("git", ["log"]);\n');
    assert.ok(runtimeOffenders(root, list).some((o) => o.includes("the reviewed calls changed")), "an extra call");
    put("scripts/run.mjs", header + 'spawnSync("git", ["status"]);\neval("1");\n');
    assert.ok(runtimeOffenders(root, list).some((o) => o.includes("reference to eval")), "another construct");
    put("scripts/run.mjs", 'import { spawnSync } from "node:child_process";\nimport { fork } from "node:worker_threads";\nspawnSync("git", ["status"]);\n');
    assert.ok(runtimeOffenders(root, list).some((o) => o.includes("node:worker_threads is a loader-capable module")), "another loader-capable module");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("the runtime scan covers .cjs, .js and .mjs at any depth and reports code that could hide a loader", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-runtime-"));
  try {
    const put = (rel, text) => {
      const full = path.join(root, ...rel.split("/"));
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, text);
    };
    put("scripts/ok.mjs", 'import fs from "node:fs";\nexport const a = fs;\n');
    put("scripts/lib/ok.cjs", 'const p = require("node:path");\nmodule.exports = p;\n');
    assert.deepEqual(runtimeOffenders(root), []);
    put("scripts/a.cjs", 'const x = require("package");\n');
    put("scripts/lib/deep/b.js", 'const x = eval(\'require("package")\');\n');
    put("scripts/c.mjs", 'import "package";\n');
    put("scripts/lib/d.cjs", "const f = new Function(\"return require\");\n");
    const found = runtimeOffenders(root);
    for (const file of ["scripts/a.cjs", "scripts/lib/deep/b.js", "scripts/c.mjs", "scripts/lib/d.cjs"]) {
      assert.ok(found.some((o) => o.startsWith(file + ":")), file + " must be reported: " + JSON.stringify(found));
    }
    assert.ok(!found.some((o) => o.startsWith("scripts/ok.mjs") || o.startsWith("scripts/lib/ok.cjs")));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("dynamic-code loaders are unreadable references: eval, Function, vm, timers given source, child_process evaluating source, eval workers", () => {
  const where = { file: path.join(os.tmpdir(), "aistd-dyn", "scripts", "a.cjs"), root: path.join(os.tmpdir(), "aistd-dyn"), io: { existsSync: () => true, realpathSync: (q) => q } };
  const refs = (src) => externalReferences(src, where);
  const must = {
    "eval of a require": 'const x = eval(\'require("package")\');',
    "indirect eval": 'const x = (0, eval)("1");',
    "eval as a value": "const e = eval;",
    "new Function": 'const f = new Function("return 1");',
    "Function without new": 'const f = Function("a", "return a");',
    "Function through globalThis": 'const f = new globalThis.Function("return 1");',
    "computed eval": 'const e = globalThis["eval"];',
    "the constructor of a function": 'const f = (() => {}).constructor("return 1");',
    "vm.runInThisContext": 'const v = vm.runInThisContext("1");',
    "vm.runInNewContext": 'const v = vm.runInNewContext("1", {});',
    "vm.runInContext": "const v = vm.runInContext(code, ctx);",
    "vm.Script": 'const s = new vm.Script("1");',
    "a Script constructed": 'const s = new Script("1");',
    "vm.compileFunction": 'const f = vm.compileFunction("return 1");',
    "vm.SourceTextModule": "const m = new vm.SourceTextModule(src);",
    "importScripts": 'importScripts("https://example.com/x.js");',
    "setTimeout with a string": 'setTimeout("doIt()", 10);',
    "setInterval with a template": "setInterval(" + String.fromCharCode(96) + "doIt()" + String.fromCharCode(96) + ", 10);",
    "setTimeout with a concatenated string": 'setTimeout("do" + name + "()", 10);',
    "a worker with eval: true": 'new Worker("require(\'package\')", { eval: true });',
    "node -e through execSync": 'execSync("node -e \'1\'");',
    "node --eval through spawnSync": 'spawnSync(process.execPath, ["--eval", "1"]);',
    "node -p through execFileSync": 'execFileSync("node", ["-p", "1"]);',
    "node --print=code": 'spawn("node", ["--print=1"]);',
    "fork with -e": 'fork("x.js", ["-e", "1"]);',
    "qualified child_process call": 'cp.execSync("node -e 1");',
    // the three findings Codex raised at b795b60, as regressions of the contract
    "optional computed access on globalThis": 'const [name] = ["Function"]; globalThis?.[name]("return import(\'package\')")();',
    "a string produced by an unlisted call, in a process argument": 'execFileSync(process.execPath, ["x--require".match(/.{9}$/)[0], "package"]);',
    "a destructured constructor": 'const { constructor: C } = (() => {}); C("return import(\'package\')")();',
    "a destructured constructor with other bindings": "const { a, constructor: C } = fn;",
    "a worker_threads import": 'import { Worker } from "node:worker_threads";',
    "a vm import": 'import vm from "node:vm";',
    "a module import (createRequire, register)": 'import Module from "node:module";',
    "a bare child_process import": 'import { exec } from "child_process";',
    "a dynamic import of a loader-capable module": 'const cp = await import("node:child_process");',
    "a require of a loader-capable module": 'const cp = require("child_process");',
    "process.binding": 'const b = process.binding("natives");',
    "dlopen": 'process.dlopen(module, file);',
    "Module._load": 'Module._load("package");',
    "a timer given a named callback (it may hold source text)": "setInterval(tick, 10);",
    "an unbalanced timer call": 'setTimeout("x", 1;',
    // positively classified or unreadable: parenthesised, quoted, computed, aliased and passed-on spellings
    "a parenthesised constructor called": 'const f = (fn.constructor)("return 1")();',
    "a doubly parenthesised constructor": 'const f = ((fn.constructor))("return 1")();',
    "constructor.call": 'const f = fn.constructor.call(null, "return 1");',
    "constructor.apply": 'const f = fn.constructor.apply(null, ["return 1"]);',
    "constructor.bind": 'const C = fn.constructor.bind(null);',
    "the constructor held": "const C = fn.constructor;",
    "the constructor passed on": "make(fn.constructor);",
    "the constructor of the constructor": 'const f = fn.constructor.constructor("return 1");',
    "a quoted eval option": 'new Worker("require(\'package\')", {"eval": true});',
    "a single-quoted eval option": "new Worker(code, { 'eval': true });",
    "a quoted eval option after other options": 'new Worker(code, { stdout: true, "eval": true });',
    "Reflect.get of constructor": 'const f = Reflect.get(fn, "constructor")("return 1");',
    "Reflect.apply of a quoted name": 'Reflect.apply(g["eval"], null, ["1"]);',
    "a computed child-process call": 'cp["execSync"](\'node -e "1"\');',
    "a computed child-process call, benign command": 'cp["execSync"]("git status");',
    "a parenthesised child-process call": '(execSync)("node -e 1");',
    "a parenthesised timer": '(setTimeout)("doIt()", 1);',
    "a child-process function held": "const r = execSync;",
    "a child-process function passed on": "run(spawnSync);",
    "a timer passed on": "wait(setTimeout);",
    "a computed member called, name from an array": 'for (const n of ["eval"]) globalThis[n]("1");',
    "a computed member called, name built by concatenation": 'globalThis["ev" + "al"]("1");',
    "a computed member called, name held": 'const k = "constructor"; fn[k]("return 1")();',
    "a computed member called optionally": "obj[name]?.(1);",
    "a computed member constructed": "new registry[name](1);",
    "a computed member of a call result called": "make()[name](1);",
    "computed access on globalThis with a built key": 'const f = globalThis[name];',
    "computed access on process with a built key": "const f = process[name];",
    "computed access on module with a built key": "const f = module[name];",
    "NODE_OPTIONS set for a child": 'spawnSync(process.execPath, [file], { env: { NODE_OPTIONS: "--require package" } });',
    "NODE_OPTIONS assigned": 'process.env.NODE_OPTIONS = "--import package";',
    "NODE_PATH assigned": 'process.env.NODE_PATH = dir;',
    "NODE_OPTIONS as a quoted key": 'run({ "NODE_OPTIONS": x });',
    "a template command with -e": "execSync(" + String.fromCharCode(96) + "node -e ${code}" + String.fromCharCode(96) + ");",
    "a template option": "execFileSync(process.execPath, [" + String.fromCharCode(96) + "--require=${pkg}" + String.fromCharCode(96) + "]);",
    "a template argument with a flag-free prefix": "spawnSync(cmd, [" + String.fromCharCode(96) + "${flag}" + String.fromCharCode(96) + "]);",
    "a command built with +": 'execSync("node " + flag + " x.js");',
    "an option built with +": 'execFileSync(process.execPath, ["--req" + "uire", "package"]);',
    "a command joined from an array": 'execSync(["node", flag].join(" "));',
    "an option concatenated": 'execFileSync("node", [].concat(flags, ["x.js"]));',
    "an option built with replace": 'execFileSync("node", [name.replace("a", "-r")]);',
    "a computed property name built by concatenation": 'new Worker("require(\'package\')", { ["ev" + "al"]: true });',
    "a computed property name from a variable": "new Worker(code, { [key]: true });",
    "a literal computed property name": 'new Worker(code, { ["eval"]: true });',
    "a literal computed property name after another key": 'new Worker(code, { stdout: true, ["eval"]: true });',
    "a computed method name": "const o = { [name]() {} };",
    "node --require preload": 'execFileSync(process.execPath, ["--require", "package"]);',
    "node -r preload": 'execFileSync(process.execPath, ["-r", "package"]);',
    "node --require=preload": 'spawnSync(process.execPath, ["--require=package", "x.js"]);',
    "node --import preload": 'execFileSync(process.execPath, ["--import", "package"]);',
    "node --import=preload": 'spawn(process.execPath, ["--import=package"]);',
    "node --loader": 'execFileSync("node", ["--loader", "package", "x.js"]);',
    "node --experimental-loader=": 'fork("x.js", [], { execArgv: ["--experimental-loader=package"] });',
    "node --input-type": 'execFileSync("node", ["--input-type=module", "x.mjs"]);',
    "node --env-file": 'execFileSync("node", ["--env-file=.env", "x.js"]);',
    "node --experimental-default-type": 'execFileSync("node", ["--experimental-default-type=module", "x.js"]);',
    "a bare dash (stdin)": 'execFileSync("node", ["-"]);',
    "a preload flag in a command string": 'exec("node app.js -r package", cb);',
    "a quoted preload flag in a command string": 'execSync(\'node "--require" package\');',
    "an unknown option on another program": 'execFileSync("git", ["log", "--format=%H"]);',
    "a test-runner flag with a non-numeric value": 'spawnSync(process.execPath, ["--test-concurrency=x"]);',
    "a renamed child-process import": 'import { execSync as run } from "node:child_process";\nrun("node -e 1");',
    "a renamed timer import": 'import { setTimeout as later } from "node:timers";\nlater("code", 1);',
    "a string-named child-process import": 'import { "execSync" as run } from "node:child_process";\nrun("node -e 1");',
    "a renamed re-export": 'export { execSync as run } from "node:child_process";',
    "a destructured rename": 'const { execSync: run } = cp;',
    "a name string in an object value": 'const o = { kind: "eval" };',
    "a name string as an argument": 'lookup("Function");',
    "vm.SyntheticModule": "const m = new vm.SyntheticModule(names, fn);",
    "a timer given a template with an interpolation": "setTimeout(" + String.fromCharCode(96) + "do${name}()" + String.fromCharCode(96) + ", 1);",
    "setImmediate with a string": 'setImmediate("doIt()");',
    "node --print as a separate argument": 'execFileSync("node", ["--print", "1"]);',
    "node --eval=code": 'spawnSync("node", ["--eval=1"]);',
    "exec with node -e": 'exec("node -e 1", cb);',
    "a double-quoted flag in a command string": 'execSync(\'node "-e" "require(\\"package\\")"\');',
    "a single-quoted flag in a command string": 'execSync("node \'-e\' \'1\'");',
    "a flag quoted in the middle": 'execSync("node --ev\'al\' 1");',
    "a flag with its value attached and quoted": 'execSync(\'node -e"1"\');',
    "a backslash-escaped flag": 'execSync("node \\\\-e 1");',
    "-p with its value attached": 'execSync("node -p1");',
    "--print quoted": 'execSync("node \\"--print\\" 1");',
    "the constructor called optionally": 'const f = (() => {}).constructor?.("return import(\'package\')")();',
    "the constructor reached by optional chaining": 'const f = fn?.constructor("return 1");',
    "a computed constructor called": 'const f = fn["constructor"]("return 1");',
    "a computed constructor called optionally": 'const f = fn["constructor"]?.("return 1");',
    "execFile with -e": 'execFile("node", ["-e", "1"], cb);',
  };
  // Child-process calls are reachable only through a loader-capable module, which is denied by default. Each of
  // these cases (kept from earlier review rounds as regressions) therefore also gets the import it would need.
  const withImport = (src) => (/\b(exec|execSync|execFile|execFileSync|spawn|spawnSync|fork|cp)\b/.test(src) ? 'import * as cp from "node:child_process";\n' + src : src);
  // every loader-capable module (an independent list), in every importing form, with and without node:
  for (const m of ["child_process", "worker_threads", "vm", "module", "cluster", "repl", "inspector", "wasi", "v8", "trace_events", "async_hooks"]) {
    for (const spec of [m, "node:" + m]) {
      for (const form of ['import x from "' + spec + '";', 'import "' + spec + '";', 'export * from "' + spec + '";', 'const x = await import("' + spec + '");', 'const x = require("' + spec + '");']) {
        assert.notDeepEqual(refs(form + "\n"), [], "loader-capable module: " + form);
      }
    }
  }
  // every name that runs source text or reaches a loader (an independent list), as an identifier and as a string
  for (const n of ["eval", "Function", "importScripts", "runInContext", "runInNewContext", "runInThisContext", "compileFunction", "SourceTextModule", "SyntheticModule", "NODE_OPTIONS", "NODE_PATH", "dlopen", "_load", "_resolveFilename"]) {
    assert.notDeepEqual(refs("const v = x." + n + ";\n"), [], "name as identifier: " + n);
    assert.notDeepEqual(refs('const v = o["' + n + '"];\n'), [], "name as string: " + n);
    assert.notDeepEqual(refs('const o = { "' + n + '": 1 };\n'), [], "name as quoted key: " + n);
  }
  // timers: only a function expression is permitted as the first argument
  for (const t of ["setTimeout", "setInterval", "setImmediate"]) {
    assert.notDeepEqual(refs(t + '("code()", 1);\n'), [], t + " with source");
    assert.notDeepEqual(refs(t + "(callback, 1);\n"), [], t + " with a name");
    assert.deepEqual(refs(t + "(() => {}, 1);\n"), [], t + " with an arrow");
    assert.deepEqual(refs(t + "(function () {}, 1);\n"), [], t + " with a function expression");
    assert.deepEqual(refs(t + "(async function () {}, 1);\n"), [], t + " with an async function expression");
    assert.deepEqual(refs(t + "(async () => {}, 1);\n"), [], t + " with an async arrow");
  }
  for (const [label, src] of Object.entries(must)) assert.notDeepEqual(refs(withImport(src) + "\n"), [], "must be an offender: " + label);
  const may = {
    "a timer given a function": "setTimeout(() => {}, 10);",
    "a timer given a function expression with a block": "setInterval(function () { tick(); }, 10);",
    "the word eval in a string": 'const s = "do not eval this";',
    "the word eval in a comment": "// eval(x)\nconst a = 1;",
    "a class constructor method": "class A { constructor(x) { this.x = x; } }",
    "a constructor compared": "if (value.constructor === Foo) {}",
    "a constructor inequality": "if (value.constructor !== Foo) {}",
    "the name of a constructor read": "const n = value.constructor.name;",
    "a list of names that includes eval and constructor": 'const names = ["promptsec", "eval", "constructor", "Function"];',
    "a nested list of names": 'const groups = [["a", "eval"], ["exec"]];',
    "a regular expression exec": "const m = re.exec(text);",
    "exec on a regex literal with string building": 'const m = /^a+/.exec(text.slice(1) + tail);',
    "exec on a regex literal with a template": "const m = /a/.exec(" + String.fromCharCode(96) + "${x}" + String.fromCharCode(96) + ");",
    "an optional-chained constructor name": "const n = obj?.constructor?.name;",
    "an indexed read": "const x = items[i];",
    "a list of names in a call, followed by a colon in a ternary": 'const l = cond ? ["eval", "exec"] : ["x"];',
    "a computed property name with a numeric literal": "const o = { [0]: a, [1]: b };",
    "a computed property name with a plain string literal key": 'const o = { ["kind"]: 1 };',
    "an indexed call with a numeric literal": "const r = steps[0](input);",
    "an indexed call of a table with a literal key": 'const r = handlers["start"](1);',
    "an indexed read of a global with a literal key": 'const v = process["argv"];',
    "an array literal after return": "function f() { return [a, b]; }",
    "an array literal as an argument": "run([a, b], c);",
    "a quoted non-flag in a command string": "execSync('git log \"HEAD\" docs');",
    "an identifier containing the word": "const evaluate = 1; const Functions = 2; const myeval = 3;",
    "the namespace string eval in a list": 'const names = ["promptsec", "eval"];',
    "a class with a Script name that is not constructed": "const Script = 1;",
  };
  for (const [label, src] of Object.entries(may)) assert.deepEqual(refs(src + "\n"), [], "must be accepted: " + label);
});

// ST-57 (#119): three loader forms the contract above did not reject (found by audit of develop 94b05f7, and
// raised as open review threads on PR #138). Each is a way to run or load code that the scan reads as inert.
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
  assert.ok(found.some((o) => o.includes("reference to eval")), "eval after a for-await regex statement is reported: " + JSON.stringify(found));
  // the same slash after a plain for head is already a regex
  const plain = externalReferences('for (const x of y) /"/.test(z); eval("1"); "\n', where);
  assert.ok(plain.some((o) => o.includes("reference to eval")), "the for head baseline: " + JSON.stringify(plain));
  // and the import scanner (stripComments) agrees: the import after the regex statement is still found
  const src = 'async function f() { for await (const x of y) /"/.test(z); }\nimport "node:fs";\n';
  assert.ok(stripComments(src).includes("import"), "the import scanner keeps code after the regex");
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
    const stripped = stripComments("// c" + sep + 'import x from "package";\n');
    assert.ok(stripped.includes("import"), "stripComments keeps the import after a " + label + " line end");
  }
  assert.ok(!stripComments('// c import x from "package";\n').includes("import"), "a comment on one line is dropped");
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
  const hidesEval = (src) => !refs(src).some((r) => r.includes("eval"));
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
  const hash = refs('#!/usr/bin/env node "\neval("1");');
  assert.ok(hash.some((r) => r.includes("eval")), "the code after a hashbang line is scanned");
  assert.ok(!hash.some((r) => r.includes("unparseable")), "a quote in a hashbang line is not an unterminated string");
  assert.deepEqual(refs("#!/usr/bin/env node\nconst a = 1;"), [], "a plain hashbang is accepted");
  assert.ok(stripComments('#!/usr/bin/env node "\nimport x from "package";\n').includes("import"), "the import scanner also skips a hashbang line");
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
    "a string statement": "'use strict'\n" + tail,
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
  assert.deepEqual(Object.entries(may).filter(([, src]) => refs(src).length > 0).map(([label]) => label), [], "forms the scan must accept");
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
  // The guard is not that the corpus is frozen — Phase 2 writes the remaining 2. It is that a
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
    "10-human-oversight-and-intervention.md",
    "11-autonomy-levels-and-delegated-authority.md",
    "12-context-and-corpus-provenance.md",
    "13-personal-data-in-ai-systems.md",
    "14-consent-and-licensing.md",
    "15-retention-deletion-memorization.md",
    "16-access-control-for-models-context-and-tools.md",
    "17-evaluation-plans-for-generative-systems.md",
    "18-benchmark-integrity-and-contamination.md",
    "19-robustness-evaluation.md",
    "20-regression-testing.md",
    "21-prompt-and-instruction-security.md",
    "22-tool-and-function-call-security.md",
    "23-agent-execution-security.md",
    "24-retrieval-and-context-supply-chain.md",
    "25-grounding-and-hallucination-control.md",
    "26-uncertainty-expression-and-abstention.md",
    "27-citation-and-source-attribution.md",
    "28-capability-honesty-to-users.md",
    "29-ai-system-versioning-and-change-control.md",
    "30-model-and-prompt-lineage.md",
    "31-reproducibility-under-nondeterminism.md",
    "32-rollback-and-recovery.md",
    "33-ai-observability.md",
    "34-ai-incident-response.md",
    "35-red-teaming.md",
    "36-auditability-of-ai-actions.md",
    "37-fairness-and-harm-distribution.md",
    "38-accessibility-of-ai-features.md",
    "39-transparency-and-system-documentation.md",
    "40-user-disclosure-of-ai-involvement.md",
    "41-inference-cost-and-budget-control.md",
    "42-latency-budgets-for-ai-interactions.md",
    "43-environmental-impact-accounting.md",
    "44-operational-resilience-degradation-and-provider-portability.md",
    "45-approval-gates.md",
    "46-gates-for-externally-visible-actions.md",
    "48-safety-and-oversight-prohibitions.md",
    "49-data-and-privacy-prohibitions.md",
    "50-evaluation-integrity-prohibitions.md",
    "51-agent-and-tool-execution-prohibitions.md",
    "52-output-honesty-prohibitions.md",
    "53-disclosure-and-deception-prohibitions.md",
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
