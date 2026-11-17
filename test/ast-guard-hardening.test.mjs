// ST-61 (#148): reviewer-round regression tests (PR #149, head cb3b53d). Each case is driven through the public path the
// repository scan calls (externalReferences) and, where the outcome class matters, through analyzeSource. Every case
// in B1, B2 and B3 was CLEAN before the fix; VIOLATION and UNKNOWN both fail the gate.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { externalReferences, analyzeSource } from "./js-references.mjs";
import { ambientOffenders, directCallTexts, DYNAMIC_CODE_NAMES, renderFinding, OUTCOME } from "./ast-guard.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "st61-hard-"));
fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
const where = { file: path.join(root, "scripts", "x.mjs"), root };
const fails = (src) => externalReferences(src + "\n", where).length > 0;
const outcome = (src, o) => analyzeSource(src + "\n", o).outcome;

// B1: Acorn reads a slash after "?." and a keyword as a regex; Node reads it as division.
test("B1: ?. followed by a keyword is UNKNOWN even when Acorn parses it (newline form)", () => {
  const src = 'o?.case\n/ globalThis["ev"+"al"]("1") /g';
  assert.notEqual(outcome(src), OUTCOME.CLEAN);
  assert.ok(fails(src));
  for (const kw of ["case", "do", "else", "return", "throw", "new", "in", "instanceof", "typeof", "void", "delete", "of", "default"]) {
    const s = `o?.${kw}\n/ x /g`;
    assert.ok(fails(s), s);
    assert.ok(analyzeSource(s + "\n").findings.some((f) => f.rule === "U-PARSE"), s);
  }
  assert.equal(outcome("const v = o?.a / 2;"), OUTCOME.CLEAN, "negative control: a plain name after ?. is fine");
});

// B2: the process root is lost through parameters, returns, stores, spreads, catch, class fields, getters or with.
const B2 = [
  "function f(p){return p.binding('fs')} f(process)",
  "((p)=>p.binding('fs'))(process)",
  "[process].map(p=>p.binding('fs'))",
  "b.p=process; b.p.binding('fs')",
  "({...process}).binding('fs')",
  "Object.assign({}, process).binding('fs')",
  "const {...p}=process; p.binding('fs')",
  "Object.getOwnPropertyDescriptor(process,'bin'+'ding').value('fs')",
  "process.__proto__.binding.call(process,'fs')",
  "try{throw process}catch(p){p.binding('fs')}",
  "class A{static p=process} A.p.binding('fs')",
  "const get=()=>process; get().binding('fs')",
  "with(process){binding('fs')}",
  "function f(p){return p.execve('x')} f(process)",
  "function f(p){return p._linkedBinding('x')} f(process)",
  "with(process){execve('x')}",
  "with(process){_linkedBinding('x')}",
  "((p)=>p['exec'+'ve']('x'))(process)",
  "const o={get x(){return process}}; o.x._linkedBinding('x')",
  "function f(p){return Object.getOwnPropertyDescriptor(p,'binding').value('fs')} f(process)",
  "function f(p){return Reflect.get(p,'binding')('fs')} f(process)",
];
for (const src of B2) {
  test(`B2: ${src}`, () => {
    assert.notEqual(outcome(src), OUTCOME.CLEAN);
    assert.ok(fails(src));
  });
}
test("B2 controls: unrelated names and known-literal objects stay clean", () => {
  for (const ok of ["const o={binding:1}; const v=o.binding;", "const label='ok'; const v=[label].length;", "function f(p){return p.name} f(process)"]) assert.equal(outcome(ok), OUTCOME.CLEAN, ok);
});

// B3: a dynamic read is UNKNOWN unless its use is provably inert.
const B3 = [
  "function get(o,k){return o[k]} get(globalThis,'ev'+'al')('1')",
  "const get=(o,k)=>o[k]; get(globalThis,'ev'+'al')('1')",
  "h=o[k]; [1].map(h)",
  "Promise.resolve(1).then(o[k])",
  "Reflect.apply(o[k],null,[])",
  "const a=[o[k]]; const [h]=[...a]; h('x')",
  "const a=[o[k]]; a.at(0)('x')",
  "class A{ f=o[k]; constructor(){this.g=o[k]} } new A().f('x')",
  "const g={get x(){return o[k]}}; g.x('1')",
  "function* gen(){yield o[k]} gen().next().value('x')",
  "try{throw o[k]}catch(h){h('x')}",
  "function z(){return arguments[0]('x')} z(o[k])",
  "export default o[k]",
  "b.g=globalThis; h=b.g[k]; ['1'].map(h)",
  "Object.getOwnPropertyDescriptor(globalThis,'ev'+'al').value('1')",
  "const h=o[k]; [1].map(h)",
  "const h=o[k]; Promise.resolve(1).then(h)",
  "const h=o[k]; const m={h}; m.h('x')",
  "const h=o[k]; function f(){ return h } f()('x')",
  "const h=o?.[k]; setup(h)",
  "const r = run(items[i])(1);",
  "f(a[k])(x);",
  "run(o[k] ?? 0)(1);",
];
for (const src of B3) {
  test(`B3: ${src}`, () => {
    assert.notEqual(outcome(src), OUTCOME.CLEAN);
    assert.ok(fails(src));
  });
}
test("B3 controls: a dynamic read that is provably inert stays clean", () => {
  for (const ok of [
    "const f = obj[key]; f.x = 1;",
    "const f = obj[key];",
    "if (obj[key]) { go(); }",
    "const t = typeof obj[key];",
    "const same = obj[key] === other;",
    "obj[key] = 1;",
    "delete obj[key];",
    "const n = obj[key] ? 1 : 2;",
    "const v = obj[key]; if (v) { go(); }",
    "const label = `${obj[key]}`;",
    "const x = obj[key].length;",
    "for (const i of obj[key]) { go(i); }",
    "const TABLE = { a: 1, b: 2 }; const v = TABLE[key];",
  ]) assert.equal(outcome(ok), OUTCOME.CLEAN, ok);
});

// N1, N2, N5
test("N1: no exemptIdentifier hook remains", () => {
  const src = fs.readFileSync(new URL("./ast-guard.mjs", import.meta.url), "utf8");
  assert.equal(src.includes("exemptIdentifier"), false);
});
test("N2: renderFinding does not repeat an offset the reason already ends with", () => {
  assert.equal(renderFinding({ form: "x", reason: "reason at offset 12", offset: 12, outcome: "UNKNOWN", rule: "U-PARSE" }), "x reason at offset 12 [UNKNOWN U-PARSE]");
  assert.equal(renderFinding({ form: "x", reason: "reason", offset: 12, outcome: "UNKNOWN", rule: "U-PARSE" }), "x reason at offset 12 [UNKNOWN U-PARSE]");
});
test("N5: the exported DYNAMIC_CODE_NAMES lists the loader member names too", () => {
  for (const n of ["getBuiltinModule", "_compile", "_extensions", "runMain", "_preloadModules", "eval", "Function"]) assert.ok(DYNAMIC_CODE_NAMES.includes(n), n);
  assert.equal(new Set(DYNAMIC_CODE_NAMES).size, DYNAMIC_CODE_NAMES.length);
});

// N3: the quadratic token guard does not run once the tree has failed or hit a bound.
test("N3: a 20000-deep parenthesis nest is answered quickly and fails", () => {
  const src = "var x=" + "(".repeat(20000) + "1" + ")".repeat(20000);
  const t0 = Date.now();
  const r = externalReferences(src + "\n", where);
  assert.ok(r.length > 0);
  assert.ok(Date.now() - t0 < 2500, `took ${Date.now() - t0} ms`);
});

// Mutation survivors reported by the Reviewer (criterion 9).
test("M1: the fixpoint bound reports U-BOUND when a binding does not settle", () => {
  const src = 'let a = "x"; a = "y"; const v = o[a];\n';
  const r = analyzeSource(src, { limits: { maxFixpointRounds: 1 } });
  assert.ok(r.findings.some((f) => f.rule === "U-BOUND" && /did not settle/.test(f.reason)), JSON.stringify(r.findings));
  assert.equal(analyzeSource(src).outcome, OUTCOME.CLEAN);
});
test("M2: a computed global member with a run-time key is U-COMPUTED-GLOBAL, not only a call", () => {
  assert.deepEqual(analyzeSource("const v = globalThis[name()];\n").findings.map((f) => f.rule), ["U-COMPUTED-GLOBAL"]);
  assert.deepEqual(analyzeSource("const v = process[name()];\n").findings.map((f) => f.rule), ["U-COMPUTED-GLOBAL"]);
});
test("M3: optional-chain wrappers are looked through (odd callee, alias, call)", () => {
  assert.ok(analyzeSource("[]?.();\n").findings.some((f) => f.rule === "V-ODD-CALLEE"));
  assert.ok(analyzeSource("const e = eval; (e?.call)(null, '1');\n").findings.some((f) => f.rule === "V-DYN-NAME"));
  assert.ok(analyzeSource("const f = o?.[k]; (f?.call)(null);\n").findings.some((f) => f.rule === "U-COMPUTED-CALL"));
  assert.ok(analyzeSource("require?.(name);\n").findings.some((f) => f.rule === "U-SPECIFIER"));
});
test("M4: an array with a spread has unknown positions", () => {
  const r = analyzeSource('const a = [...r, "eval"]; globalThis[a[0]]("1");\n');
  assert.equal(r.outcome, OUTCOME.UNKNOWN);
  assert.ok(!r.findings.some((f) => f.outcome === "VIOLATION"));
});
const sha = (s) => crypto.createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex");
test("M5: the carve-out excuses only a local self, never a free one, even at the pinned hash and count", () => {
  const free = "self;";
  assert.ok(ambientOffenders(free, { sha256: sha(free), selfOccurrences: 1 }).length > 0);
  const local = "function f(self) { return self; }";
  assert.deepEqual(ambientOffenders(local, { sha256: sha(local), selfOccurrences: 2 }), []);
});
test("M6: the carve-out count must be exact, upward and downward", () => {
  const local = "function f(self) { return self; }";
  assert.ok(ambientOffenders(local, { sha256: sha(local), selfOccurrences: 1 }).length > 0);
  assert.ok(ambientOffenders(local, { sha256: sha(local), selfOccurrences: 3 }).length > 0);
});
test("M7: a vendored tree is exempt from the dynamic-code rules only, never the import, URL, require or parse rules", () => {
  for (const [src, rule] of [["const r = require;", "U-REQUIRE"], ["import(x);", "U-SPECIFIER"], ["const u = new URL(x, import.meta.url);", "U-URL"], ["const c = createRequire(u);", "U-CREATE-REQUIRE"], ["const s = 'abc", "U-PARSE"]]) {
    const r = analyzeSource(src + "\n", { dynamicCode: false });
    assert.ok(r.findings.some((f) => f.rule === rule), `${src} -> ${JSON.stringify(r.findings.map((f) => f.rule))}`);
  }
  assert.equal(analyzeSource("eval('1');\n", { dynamicCode: false }).outcome, OUTCOME.CLEAN);
});
test("M8: an optional call is not recorded as a direct call", () => {
  assert.deepEqual(directCallTexts("foo?.(1); foo(2);", ["foo"]), ["foo ( 2 )"]);
  assert.deepEqual(directCallTexts("a?.b?.(foo(3));", ["foo"]), ["foo ( 3 )"]);
});

// The proofs that keep ordinary data code CLEAN: each is a use that cannot invoke the value read.
test("B3 controls: arguments to a local function whose parameter is inert, a returned value whose callers are inert, and data methods stay clean", () => {
  for (const ok of [
    "function same(a, b) { return a === b; } const r = same(o[k], 1);",
    "function pick(o, k) { return o[k]; } if (pick(x, y)) { go(); }",
    "const t = new Map(); const v = t.get(o[k]);",
    "const L = ['a', 'b']; const r = L.includes(o[k]);",
    "const r = /x/.test(o[k]);",
    "const ok = Object.prototype.hasOwnProperty.call(o, k) && Object.keys(o[k]).length > 0;",
    "const T = Object.freeze({ a: 1 }); const v = T[k];",
    "const copy = { ...o[k] };",
    "function f(p) { return p.name; } f(process);",
    'run("binding", "message");',
  ]) assert.equal(outcome(ok), OUTCOME.CLEAN, ok);
  // and the same shapes stay UNKNOWN when the argument can be invoked
  for (const bad of [
    "function call(a) { return a(); } call(o[k]);",
    "function pick(o, k) { return o[k]; } const h = pick(x, y); h('1');",
    "export function pick(o, k) { return o[k]; }",
    "const t = new Map(); t.set(1, o[k]);",
    "const r = [1].map(o[k]);",
  ]) assert.notEqual(outcome(bad), OUTCOME.CLEAN, bad);
});

// Mutants that survived the first run of this round (rev-3, class-3, b3-member-call, b3-static-fn-unbound).
test("M3b: a parenthesised optional chain is looked through for a URL base and an import.meta.resolve specifier", () => {
  const rules = (src) => analyzeSource(src + "\n").findings.map((f) => f.rule);
  assert.ok(rules("(import.meta?.resolve)(x)").includes("U-SPECIFIER"));
  assert.deepEqual(rules("const u = new (o?.URL)(x, import.meta.url)"), ["U-URL", "U-URL"]);
});
test("class-3: call, apply and bind of a stored dynamic member from a known table are still a call of it", () => {
  for (const src of ["const T = { a: 1 }; const f = T[k]; f.call(null, 'x');", "const T = { a: 1 }; const f = T[k]; f.apply(null, ['x']);", "const T = { a: 1 }; const f = T[k]; const g = f.bind(null); g('x');"]) {
    assert.notEqual(outcome(src), OUTCOME.CLEAN, src);
  }
});
test("b3: a dynamic read bound through .bind is not inert, and a local Object is not the language's Object", () => {
  assert.notEqual(outcome("const g = o[k].bind(null); g('x');"), OUTCOME.CLEAN);
  assert.notEqual(outcome("const Object = { keys: (x) => x() }; Object.keys(o[k]);"), OUTCOME.CLEAN);
  assert.notEqual(outcome("function f(Object, o, k) { return Object.keys(o[k]); } f({ keys: (x) => x() }, p, q);"), OUTCOME.CLEAN);
  assert.equal(outcome("const n = Object.keys(o[k]).length;"), OUTCOME.CLEAN);
});
