// ST-61 (#148): round-2 review tests (PR #149, head 9629857). Written before the fixes; every case below was CLEAN (or hung)
// at 9629857. VIOLATION and UNKNOWN both fail the gate, so "not CLEAN" is the assertion.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { externalReferences, analyzeSource } from "./js-references.mjs";
import { OUTCOME } from "./ast-guard.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "st61-r2-"));
fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
const where = { file: path.join(root, "scripts", "x.mjs"), root };
const fails = (src) => externalReferences(src + "\n", where).length > 0;
const outcome = (src, o) => analyzeSource(src + "\n", o).outcome;

// ---- item 1: a slash after ?.name is read the same way by Acorn and by Node ----
const PAYLOAD = '/ globalThis["ev"+"al"]("1") /g';
const WORDS = [
  ..."break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with".split(" "),
  ..."yield let static implements interface package private protected public await async of get set from as target meta undefined arguments eval constructor prototype name length value".split(" "),
];
const escFirst = (w) => "\\u00" + w.charCodeAt(0).toString(16) + w.slice(1);
const escBraced = (w) => [...w].map((c) => "\\u{" + c.charCodeAt(0).toString(16) + "}").join("");
const CONTEXTS = {
  script: (b) => `var o={},g=1;\n${b}`,
  generator: (b) => `function* f(){var o={},g=1;\n${b}} f().next();`,
  asyncFn: (b) => `async function f(){var o={},g=1;\n${b}} f();`,
  asyncGen: (b) => `async function* f(){var o={},g=1;\n${b}} f().next();`,
  strict: (b) => `"use strict";\nvar o={},g=1;\n${b}`,
  classBody: (b) => `class C{ m(){var o={},g=1;\n${b}} static { var o={},g=1;\n${b} } } new C().m();`,
  arrow: (b) => `const h=()=>{var o={},g=1;\n${b}}; h();`,
  asyncArrow: (b) => `const h=async()=>{var o={},g=1;\n${b}}; h();`,
  generatorMethod: (b) => `const q={ *m(){var o={},g=1;\n${b}} }; q.m().next();`,
};
const nodeAccepts = (src) => {
  try {
    new vm.Script(src);
    return true;
  } catch {
    return false;
  }
};

test("B1 (round 2): the sweep over every reserved and contextual word, escaped form and context is never CLEAN when Node accepts it", () => {
  let checked = 0;
  const survivors = [];
  for (const w of WORDS) {
    for (const form of [w, escFirst(w), escBraced(w)]) {
      for (const chain of [`o?.${form}`, `o?.a?.${form}`, `o?.[0]?.${form}`]) {
        const body = `${chain}\n${PAYLOAD}`;
        for (const [ctx, wrap] of Object.entries(CONTEXTS)) {
          const src = wrap(body);
          if (!nodeAccepts(src)) continue;
          checked += 1;
          if (analyzeSource(src + "\n").outcome === OUTCOME.CLEAN) survivors.push(`${ctx}: ${JSON.stringify(src)}`);
          if (ctx === "script" && analyzeSource("export {};\n" + src + "\n").outcome === OUTCOME.CLEAN) survivors.push(`module: ${JSON.stringify(src)}`);
        }
      }
    }
  }
  assert.ok(checked > 1000, `only ${checked} sources were accepted by Node`);
  assert.deepEqual(survivors.slice(0, 5), [], `${survivors.length} of ${checked} sources are CLEAN`);
});
test("B1 (round 2): the reported forms", () => {
  for (const src of [
    'function* f(){var o={},g=1;\no?.yield\n/ globalThis["ev"+"al"]("console.log(\'RAN\')") /g} f().next();',
    'function* f(){var o={},g=1;\no?.a?.yield\n/ globalThis["ev"+"al"]("1") /g} f().next();',
    'async function* f(){var o={},g=1;\no?.yield\n/ globalThis["ev"+"al"]("1") /g} f().next();',
    'o?.\\u0069n\n/ globalThis["ev"+"al"]("1") /g',
    'o?.\\u0063ase\n/ globalThis["ev"+"al"]("1") /g',
  ]) assert.ok(fails(src), src);
});
test("B1 (round 2): ordinary divisions after ?. stay CLEAN", () => {
  for (const src of ["const v = o?.a / 2;", "const v = o?.a\n/ 2 / 3;", "let i=0; const v = o?.length / i;", "const v = o?.[0] / 2, w = o?.f() / 2;", "const r = o?.[/x/];", "const r = o?.f(/x/);"]) assert.equal(outcome(src), OUTCOME.CLEAN, src);
});

// ---- item 2: every binding-introducing pattern position reaches the same check ----
const DENIED = ["binding", "execve", "_linkedBinding"];
const patternForms = (n) => [
  `function f({${n}}){return ${n}("x")} f(process)`,
  `(({${n}})=>${n}("x"))(process)`,
  `try{throw process}catch({${n}}){${n}("x")}`,
  `for(const {${n}} of [process]) ${n}("x")`,
  `for(let {${n}} in {a:process}) ${n}("x")`,
  `let b; for({${n}:b} of [process]) b("x")`,
  `function f({${n}}=process){${n}("x")} f()`,
  `function f({a:{${n}}}){${n}("x")} f({a:process})`,
  `function f({"${n}":b}){b("x")} f(process)`,
  `function f({["${n}"]:b}){b("x")} f(process)`,
  `function f({['${n}'.toString()]:b}){b("x")} f(process)`,
  `function f([{${n}}]){${n}("x")} f([process])`,
  `function f(...[{${n}}]){${n}("x")} f(process)`,
  `function f(a,...{${n}}){} f(1,process)`,
  `class A{ m({${n}}){${n}("x")} } new A().m(process)`,
  `class A{ static m({${n}}){${n}("x")} } A.m(process)`,
  `class A{ constructor({${n}}){${n}("x")} } new A(process)`,
  `const o={ m({${n}}){${n}("x")} }; o.m(process)`,
  `const o={ set v({${n}}){${n}("x")} }; o.v=process`,
  `async function f({${n}}){${n}("x")} f(process)`,
  `function* f({${n}}){${n}("x")} f(process).next()`,
  `async function* f({${n}}){${n}("x")} f(process).next()`,
  `const f=async({${n}})=>${n}("x"); f(process)`,
  `const {a:{${n}}}={a:process}; ${n}("x")`,
  `let b; ({${n}:b}=process); b("x")`,
  `let b; [{${n}:b}]=[process]; b("x")`,
  `function f(x=({${n}})=>1){} f()`,
  `const f=function({${n}}){}; f(process)`,
];
test("B2 (round 2): a denied process member in any pattern position is flagged", () => {
  const miss = [];
  for (const n of DENIED) for (const s of patternForms(n)) if (outcome(s) === OUTCOME.CLEAN) miss.push(s);
  assert.deepEqual(miss, []);
});
test("B2 (round 2): ordinary patterns stay CLEAN", () => {
  for (const s of ["function f({a, b}){return a+b}", "try{x()}catch({message}){y(message)}", "for(const {name} of list) use(name)", "const f=({a:{b}})=>b", "function f([a,...r], ...rest){}", "function f({a=1,...r}){}"]) assert.equal(outcome(s), OUTCOME.CLEAN, s);
});

// ---- item 3: nested call chains are evaluated in linear time ----
const guardUrl = pathToFileURL(path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "ast-guard.mjs")).href;
const timed = (sources) => {
  const code = `import { analyzeSource } from ${JSON.stringify(guardUrl)};
const out = [];
for (const s of JSON.parse(process.argv[1])) { const t = process.hrtime.bigint(); const r = analyzeSource(s); out.push({ ms: Number(process.hrtime.bigint() - t) / 1e6, outcome: r.outcome }); }
console.log(JSON.stringify(out));`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", code, JSON.stringify(sources)], { encoding: "utf8", timeout: 120000, windowsHide: true });
  assert.equal(r.status, 0, `child ended with ${r.status}/${r.signal}: ${(r.stderr || "").slice(0, 300)}`);
  return JSON.parse(r.stdout);
};
test("round 2 item 3: long call chains and nested calls are analysed in bounded time", () => {
  const cases = [];
  for (const n of [24, 100, 1000]) {
    cases.push("a" + ".b()".repeat(n) + ";", "a" + ".b(1)".repeat(n) + ";", "a" + ".then(x)".repeat(n) + ";", "a" + ".b().c(1)".repeat(n / 2) + ";");
    const m = Math.min(n, 150);
    cases.push("f(".repeat(m) + "x" + ")".repeat(m) + ";", "a.b(".repeat(m) + "x" + ")".repeat(m) + ";");
    cases.push("a" + ".b(c.d())".repeat(n) + ";", "x = a" + ".join(',')".repeat(n) + ";", "a" + "?.b()".repeat(n) + ";");
  }
  const res = timed(cases);
  res.forEach((r, i) => assert.ok(r.ms < 5000, `${r.ms} ms for ${cases[i].slice(0, 40)} (${cases[i].length} chars)`));
});
test("round 2 item 3: a chain past the node-evaluation bound is U-BOUND, not a hang", () => {
  const r = analyzeSource("a" + ".b()".repeat(20000) + ";\n", { limits: { maxEvals: 5000 } });
  assert.notEqual(r.outcome, OUTCOME.CLEAN);
  assert.ok(r.findings.some((f) => f.rule === "U-BOUND"));
});

// ---- item 4: a stored dynamic read whose property is then called ----
test("round 2 item 4: a dynamic descriptor read, and a property of a dynamic read that is called, are not CLEAN", () => {
  for (const s of [
    'const k=Math.random()+""; Object.getOwnPropertyDescriptor(globalThis,k).value("x")',
    'const k=Math.random()+""; const d=Object.getOwnPropertyDescriptor(globalThis,k); d.value("x")',
    'const k=Math.random()+""; Object.getOwnPropertyDescriptors(globalThis)[k].value("x")',
    'const k=Math.random()+""; const d=Object.getOwnPropertyDescriptors(globalThis)[k]; d.value("x")',
    'const k=Math.random()+""; const {value}=Object.getOwnPropertyDescriptor(globalThis,k); value("x")',
    'const k=Math.random()+""; Reflect.getOwnPropertyDescriptor(globalThis,k).value("x")',
    'const k=Math.random()+""; const v=globalThis[k].value; v("x")',
    'const k=Math.random()+""; globalThis[k].value("x")',
    'const k=Math.random()+""; const v=globalThis[k]; v.value("x")',
    'const k=Math.random()+""; const v=globalThis[k]; const w=v.value; w("x")',
    'const k=Math.random()+""; const v=globalThis[k]; new v.value("x")',
    'const k=Math.random()+""; const v=globalThis[k]; v.value`x`',
    'const k=Math.random()+""; const v=globalThis[k]; [1].map(v.value)',
  ]) assert.notEqual(outcome(s), OUTCOME.CLEAN, s);
  for (const s of ['const k=Math.random()+""; if (globalThis[k].value) x();', 'const k=Math.random()+""; const n = o[k].length;', 'const k=Math.random()+""; const t = typeof o[k].value;']) assert.equal(outcome(s), OUTCOME.CLEAN, s);
});

// ---- N-b: a division after ++ is not a regular expression ----
test("N-b: a division after a postfix increment is classified by the tree alone", () => {
  assert.equal(outcome('let i=0; const h=i++ / 2; const s="/";'), OUTCOME.CLEAN);
  assert.deepEqual(externalReferences('let i=0; const h=i++ / 2; const s="/";\n', where), []);
});
