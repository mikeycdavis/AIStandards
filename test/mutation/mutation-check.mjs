// ST-61 (#148) criterion 9: mutation check of the invariant-4 guard.
// Copies test/ and scripts/ into a scratch directory, applies ONE textual mutant at a time to test/ast-guard.mjs or
// test/js-references.mjs, runs the guard suites, and records whether the suites fail (KILLED) or still pass (SURVIVED).
// A mutant whose search text is not found exactly once is recorded as NOT APPLIED (it proves nothing).
// Usage: node test/mutation/mutation-check.mjs <repo root> <scratch dir> <results.json>
// It is evidence, not part of npm test: it takes several minutes and runs the guard suites once per mutant.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [repo, scratch, resultsPath] = process.argv.slice(2);
if (!repo || !scratch || !resultsPath) {
  console.error("usage: node test/mutation/mutation-check.mjs <repo root> <scratch dir> <results.json>");
  process.exit(64);
}
const SUITES = ["test/ast-guard.test.mjs", "test/ast-guard-corpus.test.mjs", "test/ast-guard-hardening.test.mjs", "test/ast-guard-round2.test.mjs", "test/vendor-acorn.test.mjs"];
const G = "test/ast-guard.mjs";
const J = "test/js-references.mjs";
const MUTANTS = [
  // AST classification
  { id: "class-1", area: "AST classification", file: G, from: 'return Boolean(up && up.type === "CallExpression" && up.callee === ref);', to: "return false;" },
  { id: "class-3", area: "AST classification", file: G, from: 'return key === "call" || key === "apply" || key === "bind" ? [a] : [UNK];', to: "return [UNK];" },
  // scope ownership
  { id: "scope-1", area: "scope ownership", file: G, from: "for (let s = scope; s; s = s.parent) {\n    const b = s.names.get(name);", to: "for (let s = scope.parent || scope; s; s = s.parent) {\n    const b = s.names.get(name);" },
  { id: "scope-2", area: "scope ownership", file: G, from: 'this.patternDefs(node.param, null, [], s, (id, def) => this.declare(s, id.name, "catch").defs.push(def));', to: 'this.patternDefs(node.param, null, [], s, (id, def) => this.declare(scope, id.name, "catch").defs.push(def));' },
  // alias propagation
  { id: "alias-1", area: "alias propagation", file: G, from: 'case "expr":\n        return this.ev(def.node, def.scope, d);', to: 'case "expr":\n        return [UNK].slice(1);' },
  { id: "alias-2", area: "alias propagation", file: G, from: 'if (step.t === "key") {', to: "if (false) {" },
  { id: "alias-3", area: "alias propagation", file: G, from: "if (b.depth > this.limits.maxAliasDepth) {", to: "if (false) {" },
  // reassignment
  { id: "reassign-1", area: "reassignment", file: G, from: 'this.pending.push({ name: left.name, scope, def: node.operator === "=" ||', to: 'this.pending.push({ name: left.name, scope, def: true || node.operator === "=" ||' },
  { id: "reassign-2", area: "reassignment", file: G, from: "for (const def of b.defs) next = this.union(next, this.evalDef(def, d + 1));", to: "for (const def of b.defs.slice(0, 1)) next = this.union(next, this.evalDef(def, d + 1));" },
  // UNKNOWN production
  { id: "unknown-1", area: "UNKNOWN production", file: G, from: 'sink.add("U-PARSE", 0, `unparseable (${parsed.errors.join("; ")})`);', to: "" },
  { id: "unknown-2", area: "UNKNOWN production", file: G, from: 'this.sink.add("U-BOUND", 0, `more than ${this.limits.maxNodes} syntax nodes; the analysis stopped`);', to: "" },
  { id: "unknown-3", area: "UNKNOWN production", file: G, from: 'sink.add("U-BOUND", 0, `source of ${source.length} characters is larger than the bound of ${limits.maxSourceChars}`);', to: "" },
  { id: "unknown-4", area: "UNKNOWN production", file: G, from: 'this.sink.add("U-BOUND", node.start ?? 0, `syntax nesting deeper than ${this.limits.maxDepth}`);', to: "" },
  // token-guard defense in depth
  { id: "token-1", area: "token-guard defense", file: J, from: "...tok.unreadable.map((u) => `${u.form} ${u.specifier}`)", to: "" },
  { id: "token-2", area: "token-guard defense", file: J, from: "[...ast.specifiers, ...tok.specifiers]", to: "[...ast.specifiers]" },
  { id: "token-3", area: "token-guard defense", file: J, from: "...ast.findings.map(renderFinding), ", to: "" },
  // the eight survivors the Reviewer found at cb3b53d
  { id: "rev-1-fixpoint-bound", area: "reviewer survivor", file: G, from: 'if (round === this.limits.maxFixpointRounds - 1) this.sink.add("U-BOUND"', to: 'if (false) this.sink.add("U-BOUND"' },
  { id: "rev-2-global-computed", area: "reviewer survivor", file: G, from: 'if (sensitive) this.report("U-COMPUTED-GLOBAL", node, `computed access on', to: 'if (false) this.report("U-COMPUTED-GLOBAL", node, `computed access on' },
  { id: "rev-3-chain-unwrap", area: "reviewer survivor", file: G, from: 'while (x && (x.type === "ParenthesizedExpression" || x.type === "ChainExpression")) x = x.expression;\n  return x;\n};\nconst unwrapParens', to: 'while (x && (x.type === "ParenthesizedExpression")) x = x.expression;\n  return x;\n};\nconst unwrapParens' },
  { id: "rev-4-spread-open", area: "reviewer survivor", file: G, from: 'else if (e.type === "SpreadElement") open = true;', to: 'else if (e.type === "SpreadElement") open = false;' },
  { id: "rev-5-carveout-local", area: "reviewer survivor", file: G, from: 'if (pinned && node.name === "self" && local && isRef) exempt += 1;', to: 'if (pinned && node.name === "self" && isRef) exempt += 1;' },
  { id: "rev-6-carveout-count", area: "reviewer survivor", file: G, from: "if (pinned && exempt !== carveOut.selfOccurrences * perProgram) out.push(", to: "if (false) out.push(" },
  { id: "rev-7-vendored-skips-U", area: "reviewer survivor", file: G, from: "  report2(rule, node, reason) {\n    this.add(rule, node, reason);", to: "  report2(rule, node, reason) {\n    if (this.o.dynamicCode === false) return;\n    this.add(rule, node, reason);" },
  { id: "rev-8-optional-direct-call", area: "reviewer survivor", file: G, from: 'if (n.type !== "CallExpression" || n.optional || n.callee.type', to: 'if (n.type !== "CallExpression" || n.callee.type' },
  // this fix round
  { id: "b1-token-rule-off", area: "B1 optional slash", file: G, from: 'label === "regexp" && beforeThat === "?." &&', to: 'label === "regexp" && false && beforeThat === "?." &&' },
  { id: "b1-bracket-exempt", area: "B1 optional slash", file: G, from: 'beforeThat === "?." && before !== "[" && before !== "("', to: 'beforeThat === "?." && before !== "("' },
  { id: "b1-hazard-ignored", area: "B1 optional slash", file: G, from: "if (programs.length > 0 && hazard !== null) return", to: "if (false) return" },
  { id: "b2-denied-any-object", area: "B2 process internals", file: G, from: 'if (PROCESS_DENIED.has(key) && (hasKind("process", "nsproc", "global") || !knownLiteral))', to: 'if (PROCESS_DENIED.has(key) && (hasKind("process", "nsproc", "global")))' },
  { id: "b2-open-object", area: "B2 process internals", file: G, from: "obj.open = openObj;", to: "obj.open = false;" },
  { id: "b2-built-name", area: "B2 process internals", file: G, from: "  checkBuilt(node, scope) {\n    const v = this.ev(node, scope);", to: "  checkBuilt(node, scope) {\n    return;\n    const v = this.ev(node, scope);" },
  { id: "b2-with", area: "B2 process internals", file: G, from: 'case "WithStatement":\n        return this.report2("U-PARSE"', to: 'case "WithStatement":\n        return void ("U-PARSE"' },
  { id: "b2-reflective-key", area: "B2 process internals", file: G, from: "for (const k of keys) if (PROCESS_DENIED.has(k) && !literal)", to: "for (const k of keys) if (false && !literal)" },
  { id: "b3-dynamic-reads-off", area: "B3 dynamic reads", file: G, from: "    this.checkDynamicReads();\n  }", to: "  }" },
  { id: "b3-argument-inert", area: "B3 dynamic reads", file: G, from: "    if (call.callee === cur) return false;\n    const i = call.arguments.indexOf(cur);", to: "    if (call.callee === cur) return false;\n    return true;\n    const i = call.arguments.indexOf(cur);" },
  { id: "b3-return-inert", area: "B3 dynamic reads", file: G, from: 'case "ReturnStatement":\n        return this.returnStaysInert(p, seen);', to: 'case "ReturnStatement":\n        return true;' },
  { id: "b3-static-fn-unbound", area: "B3 dynamic reads", file: G, from: "STATIC[recv.name].includes(m) && !this.refBinding.get(recv)", to: "STATIC[recv.name].includes(m)" },
  // round 2 (review of 9629857)
  { id: "r2-param-pattern", area: "B2 pattern positions", file: G, from: "for (const p of node.params) this.checkPattern(p, [UNK], scope);", to: "" },
  { id: "r2-catch-pattern", area: "B2 pattern positions", file: G, from: "if (node.param) this.checkPattern(node.param, [UNK], scope);", to: "" },
  { id: "r2-for-declaration", area: "B2 pattern positions", file: G, from: 'if (node.left.type === "VariableDeclaration") for (const d of node.left.declarations) this.checkPattern(d.id, [UNK], scope);', to: "" },
  { id: "r2-for-assignment", area: "B2 pattern positions", file: G, from: "        else this.checkPattern(node.left, [UNK], scope);", to: "" },
  { id: "r2-rest-pattern", area: "B2 pattern positions", file: G, from: 'case "RestElement":\n        this.checkPattern(pattern.argument, [UNK], scope);\n        break;', to: 'case "RestElement":\n        break;' },
  { id: "r2-memo-off", area: "item 3 evaluation", file: G, from: "if (hit !== undefined) return hit;", to: "" },
  { id: "r2-evals-bound-off", area: "item 3 evaluation", file: G, from: "if (this.evals > this.limits.maxEvals) {", to: "if (false) {" },
  { id: "r2-callee-twice", area: "item 3 evaluation", file: G, from: "const calleeObj = callee && callee.type === \"MemberExpression\" ? this.ev(callee.object, scope, d + 1) : null;", to: "const calleeObj = null;" },
  { id: "r2-member-property-inert", area: "item 4 dynamic read", file: G, from: 'return this.valueStaysInert(p, seen);\n      }\n      case "AssignmentExpression": {', to: 'return true;\n      }\n      case "AssignmentExpression": {' },
  { id: "r2-descriptor-dynamic-key", area: "item 4 dynamic read", file: G, from: 'if (name === "getOwnPropertyDescriptor" && !literal) this.report("U-REFLECT-KEY"', to: 'if (false) this.report("U-REFLECT-KEY"' },
  { id: "r2-postfix-token-scan", area: "N-b postfix division", file: J, from: 'else if ((last === "+" || last === "-") && before.endsWith(last + last)) regex = false;', to: "else if (false) regex = false;" },
  { id: "r2-postfix-tokenizer", area: "N-b postfix division", file: J, from: 'p.v !== "]" && !postfix', to: 'p.v !== "]"' },
  // N3
  { id: "n3-token-guard-always", area: "N3 quadratic guard", file: J, from: 'ast.outcome === "CLEAN" ? moduleReferences(', to: "true ? moduleReferences(" },
];

const RUN_TIMEOUT_MS = 240000;
const run = (dir) => {
  const r = spawnSync(process.execPath, ["--test", ...SUITES], { cwd: dir, encoding: "utf8", windowsHide: true, timeout: RUN_TIMEOUT_MS });
  return { code: r.status, timedOut: Boolean(r.error && r.error.code === "ETIMEDOUT"), out: (r.stdout || "") + (r.stderr || "") };
};
const tally = (o) => ({ pass: Number((o.match(/^ℹ pass (\d+)/m) || [])[1]), fail: Number((o.match(/^ℹ fail (\d+)/m) || [])[1]) });

fs.rmSync(scratch, { recursive: true, force: true });
fs.mkdirSync(scratch, { recursive: true });
for (const d of ["test", "scripts"]) fs.cpSync(path.join(repo, d), path.join(scratch, d), { recursive: true });
fs.copyFileSync(path.join(repo, "package.json"), path.join(scratch, "package.json"));
// a CRLF checkout must not change which mutants apply: the search texts contain LF
for (const m of [G, J]) {
  const p = path.join(scratch, m);
  fs.writeFileSync(p, fs.readFileSync(p, "utf8").replaceAll(String.fromCharCode(13, 10), String.fromCharCode(10)));
}
const base = run(scratch);
console.log(`baseline: exit ${base.code} ${JSON.stringify(tally(base.out))}`);
if (base.code !== 0) process.exit(2);
const results = [];
// ONLY=id1,id2 runs just those mutants (used to re-check survivors after a test was added)
const only = process.env.ONLY ? new Set(process.env.ONLY.split(",")) : null;
for (const m of MUTANTS) {
  if (only && !only.has(m.id)) continue;
  const f = path.join(scratch, m.file);
  const orig = fs.readFileSync(f, "utf8");
  const hits = orig.split(m.from).length - 1;
  if (hits !== 1) {
    results.push({ id: m.id, area: m.area, status: `NOT APPLIED (${hits} matches)` });
    console.log(m.id, "NOT APPLIED", hits);
    continue;
  }
  fs.writeFileSync(f, orig.replace(m.from, () => m.to));
  const r = run(scratch);
  fs.writeFileSync(f, orig);
  const status = r.code === 0 ? "SURVIVED" : "KILLED";
  const t = tally(r.out);
  // how it was killed: a failing assertion, a crash of the suite (no tally), or the time limit
  const how = status === "SURVIVED" ? null : r.timedOut ? "timeout" : Number.isFinite(t.fail) && t.fail > 0 ? "assertion" : "crash";
  results.push({ id: m.id, area: m.area, status, how, ...t });
  console.log(m.id, m.area, status, how ?? "", JSON.stringify(t));
}
const count = (s) => results.filter((r) => r.status.startsWith(s)).length;
console.log(`by assertion: ${results.filter((r) => r.how === "assertion").length}, by crash: ${results.filter((r) => r.how === "crash").length}, by timeout: ${results.filter((r) => r.how === "timeout").length}`);
console.log(`summary: ${count("KILLED")} killed, ${count("SURVIVED")} survived, ${count("NOT")} not applied, of ${results.length}`);
fs.writeFileSync(resultsPath, JSON.stringify({ baseline: tally(base.out), results }, null, 1));
