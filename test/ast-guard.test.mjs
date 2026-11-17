// ST-61 (#148): the frozen truth table and the contract of the parser-backed invariant-4 guard (test/ast-guard.mjs).
// Outcomes are VIOLATION, CLEAN and UNKNOWN; VIOLATION and UNKNOWN both fail the gate. JavaScript only: no
// TypeScript, YAML guard or YAML tag behaviour is claimed here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeSource, OUTCOME, RULES, PARSE_CONTRACT, DEFAULT_LIMITS, ODD_CALLEE_REASON, directCallTexts } from "./ast-guard.mjs";
import { externalReferences } from "./js-references.mjs";

const outcome = (src, opts) => analyzeSource(src, opts).outcome;

// [label, source, expected outcome, expected rule (or null for CLEAN)]
const V = OUTCOME.VIOLATION, C = OUTCOME.CLEAN, U = OUTCOME.UNKNOWN;
export const TRUTH = [
  // direct
  ["direct eval", "eval('1')", V, "V-DYN-NAME"],
  ["direct Function", "new Function('return 1')", V, "V-DYN-NAME"],
  ["direct setTimeout with a string", "setTimeout('x', 1)", V, "V-TIMER"],
  ["direct setTimeout with a function", "setTimeout(() => 1, 1)", C, null],
  ["direct vm.Script", "import vm from 'node:vm'; new vm.Script('1')", V, "V-VM-SCRIPT"],
  // indirect: aliases, destructuring, assignment, bounded chains
  ["alias of eval", "const e = eval; e('1')", V, "V-DYN-NAME"],
  ["alias chain of eval", "const a = eval; const b = a; const c = b; c('1')", V, "V-DYN-NAME"],
  ["destructured eval from globalThis", "const { eval: q } = globalThis; q('1')", V, "V-DYN-NAME"],
  ["assigned alias", "let q; q = globalThis.eval; q('1')", V, "V-DYN-NAME"],
  ["alias of Function through global", "const F = globalThis.Function; F('return 1')()", V, "V-DYN-NAME"],
  // computed, resolved by a static key
  ["computed with a literal key", "globalThis['eval']('1')", V, "V-DYN-NAME"],
  ["computed with a joined key", "globalThis['ev' + 'al']('1')", V, "V-DYN-NAME"],
  ["computed with a const key", "const k = 'eval'; globalThis[k]('1')", V, "V-DYN-NAME"],
  ["computed with an array-join key", "globalThis[['ev', 'al'].join('')]('1')", V, "V-DYN-NAME"],
  ["computed with a safe resolved key", "const o = { run() {} }; const k = 'run'; o[k]()", C, null],
  // computed, genuinely dynamic
  ["computed dynamic member called", "const k = name(); globalThis[k]('1')", U, "U-COMPUTED-CALL"],
  ["computed dynamic read, not called", "const f = obj[key]; f.x = 1;", C, null],
  // stored computed member that reaches a call
  ["stored dynamic member called later", "const f = globalThis[x]; f()", U, "U-COMPUTED-CALL"],
  ["stored dynamic member called through an alias", "const f = obj[x]; const g = f; g()", U, "U-COMPUTED-CALL"],
  ["stored dynamic member called by .call", "const f = obj[x]; f.call(null)", U, "U-COMPUTED-CALL"],
  ["stored resolved member that is eval", "const k = 'eval'; const f = globalThis[k]; f('1')", V, "V-DYN-NAME"],
  ["stored dynamic member never called", "const f = obj[x]; const y = 1;", C, null],
  // rebound
  ["rebound to eval", "let f = () => 1; f = eval; f('1')", V, "V-DYN-NAME"],
  ["rebound in a branch", "let f = () => 1; if (c) { f = eval; } f('1')", V, "V-DYN-NAME"],
  // shadowed: a local binding named like a denied name is its own thing
  ["a local named process holding a literal", "const process = { binding: 1 }; const v = process.binding;", C, null],
  ["a shadowed globalThis holding a literal", "{ const globalThis = { a: 1 }; const v = globalThis['a']; }", C, null],
  // optional chain
  ["optional call of eval", "eval?.('1')", V, "V-DYN-NAME"],
  ["optional member then call", "globalThis?.eval('1')", V, "V-DYN-NAME"],
  ["optional chain with computed dynamic", "const f = o?.[k]; f?.()", U, "U-COMPUTED-CALL"],
  ["optional chain clean", "const v = o?.a?.b ?? 1;", C, null],
  // call / apply / bind
  ["eval.call", "eval.call(null, '1')", V, "V-DYN-NAME"],
  ["alias .apply", "const e = eval; e.apply(null, ['1'])", V, "V-DYN-NAME"],
  ["alias .bind", "const e = eval.bind(null); e('1')", V, "V-DYN-NAME"],
  ["Reflect.apply of eval", "Reflect.apply(eval, null, ['1'])", V, "V-DYN-NAME"],
  // non-call controls
  ["the word eval in a string", "const s = 'please eval this later and more';", C, null],
  ["eval in a comment", "// eval('1')\nconst a = 1;", C, null],
  ["a property named like a local", "const o = { a: 1 }; const v = o.a;", C, null],
  ["a function called evaluate", "function evaluate() {} evaluate();", C, null],
  ["a class constructor method", "class A { constructor() {} }", C, null],
  ["ordinary code", "const a = [1, 2, 3].map((x) => x * 2); export { a };", C, null],
  // frozen odd callee
  ["array callee", "[1]()", V, "V-ODD-CALLEE"],
  ["object callee", "({})()", V, "V-ODD-CALLEE"],
  ["number callee", "(1)()", V, "V-ODD-CALLEE"],
  ["string callee", "'x'()", V, "V-ODD-CALLEE"],
  ["template tag that is a literal", "'x'`y`", V, "V-ODD-CALLEE"],
  ["regex literal is not an odd callee", "const r = /a/; r.test('x')", C, null],
  // parse failure and unsupported syntax
  ["unterminated string", "const s = 'abc", U, "U-PARSE"],
  ["TypeScript annotation is unsupported", "const a: number = 1;", U, "U-PARSE"],
  ["JSX is unsupported", "const a = <div/>;", U, "U-PARSE"],
  ["decorator is unsupported", "@dec class A {}", U, "U-PARSE"],
];

for (const [label, src, expected, rule] of TRUTH) {
  test(`truth table: ${label}`, () => {
    const r = analyzeSource(src + "\n");
    assert.equal(r.outcome, expected, `${src} -> ${JSON.stringify(r.findings.map((f) => f.rule))}`);
    if (rule) assert.ok(r.findings.some((f) => f.rule === rule), `${rule} expected in ${JSON.stringify(r.findings.map((f) => f.rule))}`);
    else assert.deepEqual(r.findings, []);
  });
}

test("the rule table is frozen: ids, outcomes and the odd-callee reason", () => {
  assert.equal(Object.isFrozen(RULES), true);
  assert.deepEqual(Object.keys(RULES).sort(), ["U-BOUND", "U-COMPUTED-CALL", "U-COMPUTED-GLOBAL", "U-COMPUTED-KEY", "U-CREATE-REQUIRE", "U-PARSE", "U-REFLECT-KEY", "U-REQUIRE", "U-SPECIFIER", "U-URL", "V-CONSTRUCTOR", "V-DYN-NAME", "V-MODULE-MEMBER", "V-ODD-CALLEE", "V-PROCESS-INTERNAL", "V-REFLECT", "V-TIMER", "V-VM-SCRIPT"]);
  for (const [id, r] of Object.entries(RULES)) assert.equal(r.outcome, id.startsWith("V-") ? "VIOLATION" : "UNKNOWN", id);
  assert.equal(ODD_CALLEE_REASON, "callee is an array, object, literal or template, which is never callable and is read as a call only by a reader that places a statement boundary differently");
  assert.match(analyzeSource("[1]()").findings[0].reason, /^callee is an array, object, literal or template/);
});

test("the parse contract is frozen: ECMAScript 2025, module and script, no plugins", () => {
  assert.deepEqual({ ...PARSE_CONTRACT, sourceTypes: [...PARSE_CONTRACT.sourceTypes], plugins: [...PARSE_CONTRACT.plugins] }, { ecmaVersion: 2025, sourceTypes: ["module", "script"], allowHashBang: true, allowReturnOutsideFunction: true, preserveParens: true, plugins: [] });
  assert.equal(Object.isFrozen(PARSE_CONTRACT), true);
  assert.equal(outcome("import fs from 'node:fs'; export const a = 1;"), C);
  // a with statement looks names up in an object at run time, so it is UNKNOWN (ST-61 review round, B2)
  assert.equal(outcome("var a = 1; with (a) {}"), "UNKNOWN");
  assert.equal(outcome("return 1;"), C);
  assert.equal(outcome("#!/usr/bin/env node\nconst a = 1;"), C);
});

test("a finding that exists only in the script reading is still reported (the union)", () => {
  assert.equal(outcome("with (o) { eval('1') }"), V);
});

test("the token guard is defense in depth: it can add a failure, it can never turn a failure into a pass", () => {
  const where = { file: "/tmp/x/scripts/a.mjs", root: "/tmp/x", io: { existsSync: () => true, realpathSync: (p) => p } };
  assert.notDeepEqual(externalReferences("eval('1');\n", where), []);
  assert.notDeepEqual(externalReferences("const f = o[k]; f();\n", where), []);
  assert.notDeepEqual(externalReferences("const s = 'abc\n", where), []);
  assert.deepEqual(externalReferences("export const a = 1;\n", where), []);
});

test("the vendored tree keeps the import and URL rules but is exempt from the dynamic-code rules", () => {
  assert.equal(outcome("const f = Function; f()", { dynamicCode: false }), C);
  assert.equal(outcome("const o = {}; o.constructor", { dynamicCode: false }), C);
  assert.equal(outcome("import x from 'package';", { dynamicCode: false }), C);
  assert.deepEqual(analyzeSource("import x from 'package';", { dynamicCode: false }).specifiers, [{ form: "import", specifier: "package" }]);
  assert.equal(outcome("const u = new URL(x, import.meta.url);", { dynamicCode: false }), U);
  assert.equal(outcome("require(name)", { dynamicCode: false }), U);
});

test("DEFAULT_LIMITS names every bound", () => {
  assert.deepEqual(Object.keys(DEFAULT_LIMITS).sort(), ["maxAliasDepth", "maxDepth", "maxFixpointRounds", "maxNodes", "maxSourceChars", "maxStringSet"]);
  assert.equal(Object.isFrozen(DEFAULT_LIMITS), true);
});

// ---- the bounds (criterion 6): each is UNKNOWN when hit, never a pass ----
test("bound: file size", () => {
  const r = analyzeSource("const a = 1;\n", { limits: { maxSourceChars: 5 } });
  assert.equal(r.outcome, U);
  assert.deepEqual(r.findings.map((f) => f.rule), ["U-BOUND"]);
  assert.match(r.findings[0].reason, /larger than the bound/);
});
test("bound: node count", () => {
  const src = "const a = [" + Array.from({ length: 200 }, (_, i) => i).join(",") + "];";
  const r = analyzeSource(src, { limits: { maxNodes: 50 } });
  assert.equal(r.outcome, U);
  assert.ok(r.findings.some((f) => f.rule === "U-BOUND" && /syntax nodes/.test(f.reason)));
});
test("bound: nesting depth", () => {
  const src = "x = " + "(".repeat(300) + "1" + ")".repeat(300) + ";";
  const r = analyzeSource(src, { limits: { maxDepth: 50 } });
  assert.equal(r.outcome, U);
  assert.ok(r.findings.some((f) => f.rule === "U-BOUND" && /nesting/.test(f.reason)));
});
test("bound: alias chain depth", () => {
  const chain = ["const a0 = eval;"];
  for (let i = 1; i < 40; i += 1) chain.push(`const a${i} = a${i - 1};`);
  chain.push("a39('1');");
  const r = analyzeSource(chain.join("\n"), { limits: { maxAliasDepth: 8 } });
  assert.notEqual(r.outcome, C);
  assert.ok(r.findings.some((f) => f.rule === "U-BOUND"), JSON.stringify(r.findings));
  const short = ["const a0 = eval;"];
  for (let i = 1; i < 20; i += 1) short.push(`const a${i} = a${i - 1};`);
  short.push("a19('1');");
  const ok = analyzeSource(short.join("\n"));
  assert.equal(ok.outcome, V);
  assert.equal(ok.findings.some((f) => f.rule === "U-BOUND"), false);
});
test("bound: string set size", () => {
  const parts = Array.from({ length: 12 }, (_, i) => `(c${i} ? 'a${i}' : 'b${i}')`);
  const src = `const k = ${parts.join(" + ")};\nglobalThis[k]('1');`;
  const r = analyzeSource(src, { limits: { maxStringSet: 8 } });
  assert.notEqual(r.outcome, C);
  assert.ok(r.findings.some((f) => f.rule === "U-BOUND"), JSON.stringify(r.findings.map((f) => f.rule)));
});
test("bound: a cyclic alias set terminates and is not clean when it reaches a call of a dynamic member", () => {
  const r = analyzeSource("let a = b; let b = a; a = obj[k]; a();\n");
  assert.notEqual(r.outcome, C);
});
test("bound: a cycle of aliases that never meets a guarded value is clean and terminates", () => {
  assert.equal(outcome("let a = 1, b = 2; a = b; b = a; a = b; b = a;"), C);
});

// ---- scope ownership, reassignment and alias propagation (criterion 4) ----
const SCOPE = [
  ["an inner binding shadows a stored dynamic member", "const f = o[x]; { const f = () => 1; f(); }", C],
  ["a function parameter shadows a stored dynamic member", "const f = o[x]; function g(f) { f(); } g(() => 1);", C],
  ["a sibling function's local is not the outer binding", "function g() { const f = () => 1; f(); } const f = o[x]; void f;", C],
  ["the outer stored member is still called after an inner block", "const f = o[x]; { const f = () => 1; } f();", U],
  ["a var in a nested block belongs to the function", "function g() { { var f = o[x]; } f(); }", U],
  ["a let in a nested block does not leak", "function g() { { let f = o[x]; } const f = () => 1; f(); }", C],
  ["a catch parameter shadows", "const f = o[x]; try {} catch (f) { f(); }", C],
  ["reassignment to a safe function clears nothing: the earlier value may still run", "let f = o[x]; f(); f = () => 1;", U],
  ["reassignment to a dynamic member makes the later call unknown", "let f = () => 1; f = o[x]; f();", U],
  ["alias propagation through destructuring", "const { a } = { a: o[x] }; a();", U],
  ["alias propagation through an array", "const [a] = [o[x]]; a();", U],
  ["alias propagation through a conditional", "const f = c ? o[x] : () => 1; f();", U],
  ["alias propagation through a logical", "const f = g || o[x]; f();", U],
  ["a for-of binding holding dynamic members", "for (const f of [o[x]]) { f(); }", U],
  ["a computed key that resolves through a shadowing const", "const k = 'run'; { const k = 'eval'; globalThis[k](1); }", V],
  ["a global that is shadowed by a parameter is not the global", "function g(globalThis) { return globalThis[k]; } void g;", C],
];
for (const [label, src, expected] of SCOPE) {
  test(`scope: ${label}`, () => {
    const r = analyzeSource(src + "\n");
    assert.equal(r.outcome, expected, `${src} -> ${JSON.stringify(r.findings.map((f) => f.rule + ": " + f.reason))}`);
  });
}

// ---- performance and memory (criterion 12): bounded on the repository corpus and on adversarial inputs ----
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const timed = (f) => {
  const t = process.hrtime.bigint();
  const v = f();
  return { v, ms: Number(process.hrtime.bigint() - t) / 1e6 };
};

test("performance: the repository's own scripts and tests classify within a time and heap bound", () => {
  const files = [];
  for (const dir of ["scripts", "test"]) {
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) {
          if (e.name !== "node_modules" && e.name !== "vendor") walk(full);
        } else if (/\.(mjs|js|cjs)$/.test(e.name)) files.push(full);
      }
    };
    walk(path.join(REPO, dir));
  }
  assert.ok(files.length > 20, "the corpus is not empty");
  const before = process.memoryUsage().heapUsed;
  let slowest = 0;
  let total = 0;
  for (const f of files) {
    const { ms } = timed(() => analyzeSource(fs.readFileSync(f, "utf8")));
    total += ms;
    slowest = Math.max(slowest, ms);
  }
  const grown = (process.memoryUsage().heapUsed - before) / (1024 * 1024);
  assert.ok(slowest < 5000, `the slowest file took ${slowest.toFixed(0)} ms`);
  assert.ok(total < 30000, `the corpus took ${total.toFixed(0)} ms`);
  assert.ok(grown < 512, `retained heap grew ${grown.toFixed(0)} MB`);
});

test("performance: the vendored parser itself (a 500 KB file) is analysed within the bound", () => {
  const src = fs.readFileSync(path.join(REPO, "scripts/vendor/acorn/dist/acorn.mjs"), "utf8");
  const { v, ms } = timed(() => analyzeSource(src, { dynamicCode: false }));
  assert.ok(ms < 30000, `took ${ms.toFixed(0)} ms`);
  assert.deepEqual(v.findings, [], JSON.stringify(v.findings.slice(0, 3)));
});

test("performance: adversarial alias chains and wide scopes stay bounded", () => {
  const long = [];
  long.push("let a0 = o[x];");
  for (let i = 1; i < 3000; i += 1) long.push(`let a${i} = a${i - 1};`);
  long.push("a2999();");
  const t1 = timed(() => analyzeSource(long.join("\n")));
  assert.notEqual(t1.v.outcome, C);
  assert.ok(t1.ms < 20000, `a 3000-link alias chain took ${t1.ms.toFixed(0)} ms`);

  const cycle = [];
  for (let i = 0; i < 400; i += 1) cycle.push(`let c${i} = c${(i + 1) % 400};`);
  cycle.push("c0 = o[x]; c0();");
  const t2 = timed(() => analyzeSource(cycle.join("\n")));
  assert.notEqual(t2.v.outcome, C);
  assert.ok(t2.ms < 20000, `a 400-cycle took ${t2.ms.toFixed(0)} ms`);

  const wide = [];
  for (let i = 0; i < 4000; i += 1) wide.push(`{ const f = o[x${i}]; f${i % 7}(); }`);
  const t3 = timed(() => analyzeSource(wide.join("\n")));
  assert.ok(t3.ms < 20000, `4000 sibling scopes took ${t3.ms.toFixed(0)} ms`);

  const fan = ["const s0 = 'a';"];
  for (let i = 1; i < 60; i += 1) fan.push(`const s${i} = (c ? s${i - 1} + 'x' : s${i - 1} + 'y');`);
  fan.push("globalThis[s59]();");
  const t4 = timed(() => analyzeSource(fan.join("\n")));
  assert.notEqual(t4.v.outcome, C);
  assert.ok(t4.ms < 20000, `a string-set explosion took ${t4.ms.toFixed(0)} ms`);

  const nest = "(".repeat(5000) + "1" + ")".repeat(5000);
  const t5 = timed(() => analyzeSource(`x = ${nest};`));
  assert.ok(t5.ms < 20000);
});

// Mutation follow-ups (criterion 9): behaviours the first mutation run showed were not pinned.
test("a compound assignment makes the binding unknown, never just its right-hand side", () => {
  const unresolved = analyzeSource('let k = "ex"; k += "it"; process[k](0);');
  assert.equal(unresolved.outcome, OUTCOME.UNKNOWN);
  assert.equal(analyzeSource('let k = "ex"; process[k](0);').outcome, OUTCOME.CLEAN, "negative control: the plain binding resolves");
});

test("require as a literal callee is read as a call; any other use of the name is UNKNOWN", () => {
  for (const ok of ['require("fs");', 'x.require("fs");', 'x?.require?.("fs");']) assert.equal(analyzeSource(ok).outcome, OUTCOME.CLEAN, ok);
  for (const bad of ["require;", "const r = require; r('fs');", "f(require);", "x.require;"]) assert.equal(analyzeSource(bad).outcome, OUTCOME.UNKNOWN, bad);
});

test("an optional or parenthesised call is not recorded as a direct call", () => {
  assert.deepEqual(directCallTexts("foo?.(1); foo(2); (foo)(3); a?.b(foo(4));", ["foo"]), ["foo ( 2 )", "foo ( 4 )"]);
});
