// The parser-backed invariant-4 guard (ST-61, #148).
//
// This module is the AUTHORITATIVE reader of JavaScript for invariant 4 (no environment-resolved dependency, no
// hidden code loading under scripts/). It parses the source with the vendored Acorn (scripts/vendor/acorn, no
// plugins, no runtime dependency) and classifies every construct from the syntax tree, never from token adjacency.
//
// OUTCOMES. Every finding is VIOLATION or UNKNOWN; a source with neither is CLEAN. VIOLATION and UNKNOWN both
// fail the gate. A source that cannot be parsed, a construct the analysis cannot resolve, and any analysis bound
// that is hit are UNKNOWN, never a clean pass. The older token guard (js-references.mjs) stays as defense in
// depth: it can add a failure, it can never remove one (see classifySource in js-references.mjs).
//
// SCOPE. JavaScript only. No TypeScript, no YAML guard and no YAML tag behaviour is claimed here.

import crypto from "node:crypto";
import * as acorn from "../scripts/vendor/acorn/dist/acorn.mjs";

export const OUTCOME = Object.freeze({ VIOLATION: "VIOLATION", CLEAN: "CLEAN", UNKNOWN: "UNKNOWN" });

// The frozen parse contract (criterion 2). ECMAScript 2025, parsed as a module and as a script: a source that
// parses as both is analysed as both and the findings are united; a source that parses as neither is UNKNOWN.
// Hashbang lines are comments; a top-level return is allowed in the script reading (a CommonJS wrapper).
export const PARSE_CONTRACT = Object.freeze({
  ecmaVersion: 2025,
  sourceTypes: Object.freeze(["module", "script"]),
  allowHashBang: true,
  allowReturnOutsideFunction: true,
  preserveParens: true,
  plugins: Object.freeze([]),
});

// The analysis bounds (criterion 6). Hitting any one is an UNKNOWN finding (rule U-BOUND).
export const DEFAULT_LIMITS = Object.freeze({
  maxSourceChars: 2 * 1024 * 1024,
  maxNodes: 1_000_000,
  maxDepth: 600,
  maxAliasDepth: 24,
  maxFixpointRounds: 4,
  maxStringSet: 32,
  maxEvals: 20_000_000,
});

// The stable rule table. Ids, outcomes and the reason prefixes are frozen: a test pins the table.
// `dynamic` rules are the ones the pinned vendored trees are exempt from (first-party scripts keep every rule).
export const RULES = Object.freeze({
  "V-DYN-NAME": { outcome: "VIOLATION", form: "dynamic-code", dynamic: true },
  "V-CONSTRUCTOR": { outcome: "VIOLATION", form: "dynamic-code", dynamic: true },
  "V-TIMER": { outcome: "VIOLATION", form: "dynamic-code", dynamic: true },
  "V-VM-SCRIPT": { outcome: "VIOLATION", form: "dynamic-code", dynamic: true },
  "V-PROCESS-INTERNAL": { outcome: "VIOLATION", form: "dynamic-code", dynamic: true },
  "V-MODULE-MEMBER": { outcome: "VIOLATION", form: "dynamic-code", dynamic: true },
  "V-REFLECT": { outcome: "VIOLATION", form: "dynamic-code", dynamic: true },
  // V-ODD-CALLEE: a call, construction or tagged template whose callee, after parentheses are removed, is an
  // array, object, literal or template. Such a callee is never callable; it arises only where a reader that
  // places a statement boundary differently (a block before a bracket, a brace before a slash) sees a call the
  // engine does not make. Exact trigger and reason text are frozen below (ODD_CALLEE_REASON).
  "V-ODD-CALLEE": { outcome: "VIOLATION", form: "dynamic-code", dynamic: true },
  "U-COMPUTED-CALL": { outcome: "UNKNOWN", form: "dynamic-code", dynamic: true },
  "U-COMPUTED-GLOBAL": { outcome: "UNKNOWN", form: "dynamic-code", dynamic: true },
  "U-COMPUTED-KEY": { outcome: "UNKNOWN", form: "dynamic-code", dynamic: true },
  "U-REFLECT-KEY": { outcome: "UNKNOWN", form: "dynamic-code", dynamic: true },
  "U-REQUIRE": { outcome: "UNKNOWN", form: "require", dynamic: false },
  "U-CREATE-REQUIRE": { outcome: "UNKNOWN", form: "createRequire", dynamic: false },
  "U-SPECIFIER": { outcome: "UNKNOWN", form: "specifier", dynamic: false },
  "U-URL": { outcome: "UNKNOWN", form: "url", dynamic: false },
  "U-PARSE": { outcome: "UNKNOWN", form: "source", dynamic: false },
  "U-BOUND": { outcome: "UNKNOWN", form: "bound", dynamic: false },
});
export const ODD_CALLEE_REASON = "callee is an array, object, literal or template, which is never callable and is read as a call only by a reader that places a statement boundary differently";

// Names that reach a loader or run code through a built-in object (module instances, process): denied as
// identifiers and as strings, wherever they appear.
const LOADER_MEMBER_NAMES = ["getBuiltinModule", "_compile", "_extensions", "runMain", "_preloadModules"];
export const DYNAMIC_CODE_NAMES = ["eval", "Function", "importScripts", "runInContext", "runInNewContext", "runInThisContext", "compileFunction", "SourceTextModule", "SyntheticModule", "NODE_OPTIONS", "NODE_PATH", "dlopen", "_load", "_resolveFilename", ...LOADER_MEMBER_NAMES];
export const TIMER_NAMES = ["setTimeout", "setInterval", "setImmediate"];
const NAME_STRINGS = new Set([...DYNAMIC_CODE_NAMES, "constructor", ...TIMER_NAMES]);
const IDENT_NAMES = new Set(DYNAMIC_CODE_NAMES);
const PROCESS_DENIED = new Set(["binding", "_linkedBinding", "execve"]);
const MODULE_DENIED = new Set(["load"]);
const REFLECT_LOOKUPS = new Set(["get", "getOwnPropertyDescriptor"]);
const URL_STATIC_SAFE = new Set(["canParse", "createObjectURL", "revokeObjectURL"]);
const GLOBAL_NAMES = new Set(["globalThis", "global", "self", "window"]);
const MODULE_NAMES = new Set(["module", "Module", "exports"]);
const PROCESS_MODULES = new Set(["process", "node:process"]);

export const AMBIENT_NAMES = ["fetch", "XMLHttpRequest", "WebSocket", "WebSocketStream", "EventSource", "WebTransport", "RTCPeerConnection", "RTCDataChannel", "importScripts", "Worker", "SharedWorker", "sendBeacon", "serviceWorker", "Request", "Response", "postMessage", "BroadcastChannel", "MessageChannel", "opener", "Image", "Audio", "HTMLImageElement", "HTMLScriptElement", "HTMLIFrameElement", "HTMLLinkElement", "HTMLEmbedElement", "HTMLObjectElement", "HTMLSourceElement", "HTMLMediaElement", "createElement", "createElementNS", "appendChild", "insertAdjacentHTML", "innerHTML", "outerHTML", "srcdoc", "globalThis", "window", "self", "global", "frames", "navigator", "location", "process", "Deno", "Bun", "require", "createRequire", "child_process", "eval", "Function"];

const UNK = Object.freeze({ k: "unk" });
const isNode = (v) => v !== null && typeof v === "object" && typeof v.type === "string";

function childNodes(node) {
  const out = [];
  for (const key of Object.keys(node)) {
    if (key === "type" || key === "start" || key === "end") continue;
    const v = node[key];
    if (Array.isArray(v)) {
      for (const x of v) if (isNode(x)) out.push(x);
    } else if (isNode(v)) {
      out.push(v);
    }
  }
  return out;
}

const unwrap = (n) => {
  let x = n;
  while (x && (x.type === "ParenthesizedExpression" || x.type === "ChainExpression")) x = x.expression;
  return x;
};
const unwrapParens = (n) => {
  let x = n;
  while (x && x.type === "ParenthesizedExpression") x = x.expression;
  return x;
};
const staticString = (n) => {
  const x = unwrapParens(n);
  if (!x) return null;
  if (x.type === "Literal" && typeof x.value === "string") return x.value;
  if (x.type === "TemplateLiteral" && x.expressions.length === 0 && x.quasis[0].value.cooked != null) return x.quasis[0].value.cooked;
  return null;
};
// import.meta.url exactly (spacing and comments between its parts do not matter in the tree)
const isMetaUrl = (n) => {
  const x = unwrapParens(n);
  return Boolean(x && x.type === "MemberExpression" && !x.computed && x.property.type === "Identifier" && x.property.name === "url" && x.object.type === "MetaProperty" && x.object.meta.name === "import");
};
// an expression chain rooted at import.meta (import.meta.dirname, import.meta["url"], import.meta.url.x)
const isMetaRooted = (n) => {
  let x = unwrapParens(n);
  while (x && x.type === "MemberExpression") x = unwrapParens(x.object);
  return Boolean(x && x.type === "MetaProperty" && x.meta.name === "import");
};

// ---------------------------------------------------------------------------------------------------------------
// Scopes and bindings

class Scope {
  constructor(kind, parent) {
    this.kind = kind;
    this.parent = parent;
    this.names = new Map();
  }
}
// The binding an identifier names, as recorded while walking (null for a global or an unrecorded name).
function lookupFrom(analysis, identifier) {
  return analysis.refBinding.get(identifier) ?? null;
}
class Binding {
  constructor(name, kind) {
    this.name = name;
    this.kind = kind;
    this.defs = [];
    this.state = 0;
    this.val = [];
    this.depth = 0;
  }
}

function lookup(scope, name) {
  for (let s = scope; s; s = s.parent) {
    const b = s.names.get(name);
    if (b) return b;
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------------------
// The analysis of one parsed program

class Analysis {
  constructor(ast, sourceType, options, sink) {
    this.ast = ast;
    this.sourceType = sourceType;
    this.o = options;
    this.limits = options.limits;
    this.sink = sink;
    this.scopeOf = new Map();
    this.pending = [];
    this.implicit = new Map();
    this.nodes = 0;
    this.maxSeen = 0;
    this.keyDepth = 0;
    this.alloc = new Map();
    this.memo = new Map(); // node -> its abstract value, valid while no binding is half-evaluated
    this.stable = false; // true once the bindings are final, so the memo can live across the walk
    this.evTop = 0;
    this.inBinding = 0;
    this.evals = 0;
    this.evalBoundHit = false;
    this.parents = new Map(); // node -> its parent, filled while walking
    this.refs = new Map(); // binding -> identifier nodes that name it
    this.refBinding = new Map(); // identifier node -> binding
    this.dynReads = []; // computed member reads whose key is built at run time
  }

  add(rule, node, reason) {
    this.sink.add(rule, node.start ?? 0, reason);
  }

  // ---- pass 1: scopes, declarations, assignments ----
  declare(scope, name, kind) {
    let b = scope.names.get(name);
    if (!b) {
      b = new Binding(name, kind);
      scope.names.set(name, b);
    }
    return b;
  }

  // Collects the identifiers a pattern binds, calling out(identifier, def) for each; `src` is the {node, scope}
  // the pattern is matched against (null when nothing is known), `path` the steps taken inside it.
  patternDefs(pattern, src, path, scope, out) {
    if (!pattern) return;
    switch (pattern.type) {
      case "Identifier":
        out(pattern, src ? { k: "dest", src, path } : { k: "unk" });
        break;
      case "ObjectPattern":
        for (const p of pattern.properties) {
          if (p.type === "RestElement") this.patternDefs(p.argument, null, [], scope, out);
          else {
            const step = { t: "key", node: p.computed ? p.key : null, name: p.computed ? null : p.key.type === "Identifier" ? p.key.name : String(p.key.value), scope };
            this.patternDefs(p.value, src, [...path, step], scope, out);
          }
        }
        break;
      case "ArrayPattern":
        pattern.elements.forEach((e, i) => {
          if (e) this.patternDefs(e, src, [...path, { t: "idx", i }], scope, out);
        });
        break;
      case "RestElement":
        this.patternDefs(pattern.argument, null, [], scope, out);
        break;
      case "AssignmentPattern":
        this.patternDefs(pattern.left, src, path, scope, out);
        this.patternDefs(pattern.left, { node: pattern.right, scope }, [], scope, out);
        break;
      default:
        break;
    }
  }

  bindPattern(pattern, src, scope, kind) {
    this.patternDefs(pattern, src, [], scope, (id, def) => {
      this.declare(scope, id.name, kind).defs.push(def);
    });
  }

  functionScopeOf(scope) {
    let s = scope;
    while (s.parent && s.kind !== "function" && s.kind !== "program") s = s.parent;
    return s;
  }

  build(node, scope) {
    this.nodes += 1;
    if (this.nodes > this.limits.maxNodes) {
      if (!this.boundHit) {
        this.boundHit = true;
        this.sink.add("U-BOUND", 0, `more than ${this.limits.maxNodes} syntax nodes; the analysis stopped`);
      }
      return;
    }
    switch (node.type) {
      case "Program": {
        const s = new Scope("program", null);
        this.scopeOf.set(node, s);
        for (const st of node.body) this.build(st, s);
        return;
      }
      case "FunctionDeclaration":
      case "FunctionExpression":
      case "ArrowFunctionExpression": {
        if (node.type === "FunctionDeclaration" && node.id) { const fb = this.declare(scope, node.id.name, "function"); fb.defs.push({ k: "unk" }); fb.fn = node; }
        const s = new Scope("function", scope);
        this.scopeOf.set(node, s);
        if (node.type === "FunctionExpression" && node.id) this.declare(s, node.id.name, "function").defs.push({ k: "unk" });
        for (const p of node.params) {
          this.patternDefs(p, null, [], s, (id, def) => this.declare(s, id.name, "param").defs.push(def));
          this.buildChildrenOfPattern(p, s);
        }
        if (node.body.type === "BlockStatement") for (const st of node.body.body) this.build(st, s);
        else this.build(node.body, s);
        return;
      }
      case "ClassDeclaration":
        if (node.id) this.declare(scope, node.id.name, "class").defs.push({ k: "unk" });
        for (const c of childNodes(node)) this.build(c, scope);
        return;
      case "BlockStatement":
      case "StaticBlock": {
        const s = new Scope("block", scope);
        this.scopeOf.set(node, s);
        for (const st of node.body) this.build(st, s);
        return;
      }
      case "SwitchStatement": {
        this.build(node.discriminant, scope);
        const s = new Scope("block", scope);
        this.scopeOf.set(node, s);
        for (const c of node.cases) this.build(c, s);
        return;
      }
      case "ForStatement":
      case "ForInStatement":
      case "ForOfStatement": {
        const s = new Scope("block", scope);
        this.scopeOf.set(node, s);
        if (node.type === "ForStatement") {
          if (node.init) this.build(node.init, s);
          if (node.test) this.build(node.test, s);
          if (node.update) this.build(node.update, s);
        } else {
          const left = node.left;
          const iter = node.type === "ForOfStatement" ? { k: "iter", node: node.right, scope: s } : { k: "unk" };
          if (left.type === "VariableDeclaration") {
            const target = left.kind === "var" ? this.functionScopeOf(s) : s;
            for (const d of left.declarations) {
              this.patternDefs(d.id, null, [], s, (id, def) => this.declare(target, id.name, left.kind).defs.push(iter));
              this.buildChildrenOfPattern(d.id, s);
            }
          } else {
            this.patternDefs(left, null, [], s, (id) => this.pending.push({ name: id.name, scope: s, def: iter }));
            this.build(left, s);
          }
          this.build(node.right, s);
        }
        this.build(node.body, s);
        return;
      }
      case "CatchClause": {
        const s = new Scope("block", scope);
        this.scopeOf.set(node, s);
        if (node.param) {
          this.patternDefs(node.param, null, [], s, (id, def) => this.declare(s, id.name, "catch").defs.push(def));
          this.buildChildrenOfPattern(node.param, s);
        }
        for (const st of node.body.body) this.build(st, s);
        return;
      }
      case "VariableDeclaration": {
        const target = node.kind === "var" ? this.functionScopeOf(scope) : scope;
        for (const d of node.declarations) {
          const src = d.init ? { node: d.init, scope } : null;
          if (d.id.type === "Identifier") {
            const vb = this.declare(target, d.id.name, node.kind);
            vb.defs.push(src ? { k: "expr", node: d.init, scope } : { k: "unk0" });
            if (d.init && (d.init.type === "ArrowFunctionExpression" || d.init.type === "FunctionExpression")) vb.fn = d.init;
            if (d.init && d.init.type === "NewExpression" && d.init.callee.type === "Identifier" && ["Map", "Set", "WeakMap", "WeakSet"].includes(d.init.callee.name)) vb.collection = true;
          } else {
            this.patternDefs(d.id, src, [], scope, (id, def) => this.declare(target, id.name, node.kind).defs.push(def));
          }
          this.buildChildrenOfPattern(d.id, scope);
          if (d.init) this.build(d.init, scope);
        }
        return;
      }
      case "ImportDeclaration": {
        const source = node.source.value;
        for (const sp of node.specifiers) {
          const imported = sp.type === "ImportDefaultSpecifier" ? "default" : sp.type === "ImportNamespaceSpecifier" ? "*" : sp.imported.type === "Identifier" ? sp.imported.name : String(sp.imported.value);
          this.declare(scope, sp.local.name, "import").defs.push({ k: "import", source, imported });
        }
        return;
      }
      case "AssignmentExpression": {
        const left = node.left;
        if (left.type === "Identifier") {
          this.pending.push({ name: left.name, scope, def: node.operator === "=" || node.operator === "||=" || node.operator === "??=" || node.operator === "&&=" ? { k: "expr", node: node.right, scope } : { k: "unk" } });
        } else if (left.type === "ObjectPattern" || left.type === "ArrayPattern") {
          this.patternDefs(left, { node: node.right, scope }, [], scope, (id, def) => this.pending.push({ name: id.name, scope, def }));
        }
        for (const c of childNodes(node)) this.build(c, scope);
        return;
      }
      default:
        for (const c of childNodes(node)) this.build(c, scope);
    }
  }

  // default values and computed keys inside a pattern contain ordinary expressions
  buildChildrenOfPattern(pattern, scope) {
    if (!pattern) return;
    switch (pattern.type) {
      case "ObjectPattern":
        for (const p of pattern.properties) {
          if (p.type === "RestElement") this.buildChildrenOfPattern(p.argument, scope);
          else {
            if (p.computed) this.build(p.key, scope);
            this.buildChildrenOfPattern(p.value, scope);
          }
        }
        break;
      case "ArrayPattern":
        for (const e of pattern.elements) this.buildChildrenOfPattern(e, scope);
        break;
      case "RestElement":
        this.buildChildrenOfPattern(pattern.argument, scope);
        break;
      case "AssignmentPattern":
        this.buildChildrenOfPattern(pattern.left, scope);
        this.build(pattern.right, scope);
        break;
      default:
        break;
    }
  }

  resolvePending() {
    for (const { name, scope, def } of this.pending) {
      const b = lookup(scope, name);
      if (b) b.defs.push(def);
      else {
        if (!this.implicit.has(name)) this.implicit.set(name, []);
        this.implicit.get(name).push(def);
      }
    }
  }

  // ---- abstract values: arrays of alternatives ----
  union(a, b) {
    const out = [...a];
    const seen = new Set(out.map((x) => this.altKey(x)));
    for (const x of b) {
      const k = this.altKey(x);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(x);
      }
    }
    if (out.filter((x) => x.k === "str").length > this.limits.maxStringSet) {
      this.sink.add("U-BOUND", 0, `a string set larger than ${this.limits.maxStringSet}`);
      return [UNK];
    }
    return out;
  }
  altKey(x) {
    switch (x.k) {
      case "str":
        return "s:" + x.v;
      case "reflect":
        return "r:" + (x.via ? 1 : 0);
      case "rmethod":
        return "m:" + x.m;
      case "dyn":
        return "d:" + x.offset;
      case "arr":
      case "obj":
        return x.k + ":" + (x.id ??= ++this.idCounter);
      default:
        return x.k;
    }
  }
  idCounter = 0;
  str(v) {
    return [{ k: "str", v }];
  }
  allStr(av) {
    return av.length > 0 && av.every((x) => x.k === "str");
  }
  product(a, b, f) {
    const out = [];
    for (const x of a) for (const y of b) out.push({ k: "str", v: f(x.v, y.v) });
    return this.union([], out);
  }

  evalBinding(b, d) {
    if (b.state === 2) {
      this.maxSeen = Math.max(this.maxSeen, b.depth);
      return b.val;
    }
    if (b.state === 1) return b.val;
    b.state = 1;
    this.inBinding += 1;
    const outerSeen = this.maxSeen;
    this.maxSeen = 0;
    let val = [];
    for (let round = 0; round < this.limits.maxFixpointRounds; round += 1) {
      b.val = val;
      let next = [];
      for (const def of b.defs) next = this.union(next, this.evalDef(def, d + 1));
      if (next.length === val.length && next.every((x, i) => this.altKey(x) === this.altKey(val[i]))) {
        val = next;
        break;
      }
      val = next;
      if (round === this.limits.maxFixpointRounds - 1) this.sink.add("U-BOUND", 0, `binding ${b.name} did not settle within ${this.limits.maxFixpointRounds} rounds`);
    }
    b.val = val;
    this.inBinding -= 1;
    b.depth = this.maxSeen + 1;
    b.state = 2;
    this.maxSeen = Math.max(outerSeen, b.depth);
    if (b.depth > this.limits.maxAliasDepth) {
      this.sink.add("U-BOUND", 0, `alias chain through ${b.name} deeper than ${this.limits.maxAliasDepth}`);
      b.val = [UNK, ...b.val];
    }
    return b.val;
  }

  evalDef(def, d) {
    switch (def.k) {
      case "expr":
        return this.ev(def.node, def.scope, d);
      case "dest": {
        let v = this.ev(def.src.node, def.src.scope, d);
        for (const step of def.path) {
          if (step.t === "key") {
            const keys = step.node ? this.keysOf(this.ev(step.node, step.scope, d)) : [step.name];
            v = this.getMember(v, keys, step.node ? step.node.start : 0);
          } else v = this.getMember(v, [String(step.i)], 0);
        }
        return v;
      }
      case "iter": {
        const src = this.ev(def.node, def.scope, d);
        let out = [];
        for (const a of src) out = this.union(out, a.k === "arr" ? a.items.flat() : [UNK]);
        return out.length ? out : [UNK];
      }
      case "import": {
        if (PROCESS_MODULES.has(def.source)) {
          if (def.imported === "default") return [{ k: "process" }];
          if (def.imported === "*") return [{ k: "nsproc" }];
        }
        return [UNK];
      }
      default:
        return [UNK];
    }
  }

  keysOf(av) {
    if (av.length === 0) return null;
    let out = [];
    for (const a of av) {
      if (a.k === "str") out.push(a.v);
      else if (a.k === "arr" && !a.open) {
        let joined = [""];
        let ok = true;
        a.items.forEach((item, i) => {
          const ks = this.keysOf(item);
          if (ks === null) ok = false;
          else joined = joined.flatMap((j) => ks.map((k) => (i === 0 ? k : j + "," + k)));
        });
        if (!ok) return null;
        out.push(...joined);
      } else return null;
    }
    out = [...new Set(out)];
    return out.length > this.limits.maxStringSet ? null : out;
  }

  getMember(av, keys, offset) {
    let out = [];
    for (const a of av) {
      if (keys === null) {
        out = this.union(out, [{ k: "dyn", offset }]);
        continue;
      }
      for (const key of keys) out = this.union(out, this.memberOf(a, key, offset));
    }
    return out.length ? out : [UNK];
  }

  memberOf(a, key, offset) {
    switch (a.k) {
      case "global":
        if (GLOBAL_NAMES.has(key)) return [{ k: "global" }];
        if (key === "process") return [{ k: "process" }];
        if (key === "Reflect") return [{ k: "reflect", via: true }];
        if (MODULE_NAMES.has(key)) return [{ k: "module" }];
        return [UNK];
      case "nsproc":
        return key === "default" ? [{ k: "process" }] : [UNK];
      case "reflect":
        return REFLECT_LOOKUPS.has(key) ? [{ k: "rmethod", m: key }] : [UNK];
      case "module":
        return key === "prototype" || key === "exports" ? [{ k: "module" }] : [UNK];
      case "arr": {
        if (/^\d+$/.test(key) && !a.open) return a.items[Number(key)] ?? [UNK];
        return [UNK];
      }
      case "obj": {
        if (a.props.has(key)) return a.props.get(key);
        if (a.proto) return this.getMember(a.proto, [key], offset);
        return [UNK];
      }
      case "dyn":
        return key === "call" || key === "apply" || key === "bind" ? [a] : [UNK];
      default:
        return [UNK];
    }
  }

  // One evaluation per node: the value of a node is computed once and reused, so a long chain of calls is evaluated in
  // linear time (round 2, item 3). The memo is cleared between top-level evaluations until the bindings are final,
  // and a value is stored only when no binding is half-evaluated (a cycle member's value is not final yet).
  // A node-evaluation bound turns a runaway analysis into U-BOUND.
  ev(node, scope, d = 0) {
    if (!node) return [UNK];
    if (this.evTop === 0 && !this.stable) this.memo.clear();
    const hit = this.memo.get(node);
    if (hit !== undefined) return hit;
    this.evals += 1;
    if (this.evals > this.limits.maxEvals) {
      if (!this.evalBoundHit) {
        this.evalBoundHit = true;
        this.sink.add("U-BOUND", node.start ?? 0, `more than ${this.limits.maxEvals} expression evaluations; the analysis stopped`);
      }
      return [UNK];
    }
    this.evTop += 1;
    let v;
    try {
      v = this.evRaw(node, scope, d);
    } finally {
      this.evTop -= 1;
    }
    if (this.inBinding === 0) this.memo.set(node, v);
    return v;
  }

  evRaw(node, scope, d = 0) {
    if (d > 200) {
      this.sink.add("U-BOUND", node.start ?? 0, "expression nesting deeper than the evaluation bound");
      return [UNK];
    }
    if (!node) return [UNK];
    switch (node.type) {
      case "Literal":
        if (typeof node.value === "string") return this.str(node.value);
        if (typeof node.value === "number" || typeof node.value === "boolean" || node.value === null) return this.str(String(node.value));
        if (node.bigint) return this.str(node.bigint);
        return [UNK];
      case "TemplateLiteral": {
        let acc = this.str(node.quasis[0].value.cooked ?? "");
        for (let i = 0; i < node.expressions.length; i += 1) {
          const e = this.ev(node.expressions[i], scope, d + 1);
          if (!this.allStr(e)) return [UNK];
          acc = this.product(acc, e, (x, y) => x + y);
          acc = this.product(acc, this.str(node.quasis[i + 1].value.cooked ?? ""), (x, y) => x + y);
        }
        return acc;
      }
      case "Identifier": {
        if (node.name === "undefined") return [UNK];
        const b = lookup(scope, node.name);
        if (b) {
          const v = this.evalBinding(b, d);
          return v.length ? v : [UNK];
        }
        if (this.implicit.has(node.name)) {
          let out = [];
          for (const def of this.implicit.get(node.name)) out = this.union(out, this.evalDef(def, d + 1));
          return out;
        }
        if (node.name === "process") return [{ k: "process" }];
        if (GLOBAL_NAMES.has(node.name)) return [{ k: "global" }];
        if (node.name === "Reflect") return [{ k: "reflect", via: false }];
        if (MODULE_NAMES.has(node.name)) return [{ k: "module" }];
        return [UNK];
      }
      case "ThisExpression":
        return [{ k: "global" }];
      case "ParenthesizedExpression":
      case "ChainExpression":
        return this.ev(node.expression, scope, d + 1);
      case "SequenceExpression":
        return this.ev(node.expressions[node.expressions.length - 1], scope, d + 1);
      case "ConditionalExpression":
        return this.union(this.ev(node.consequent, scope, d + 1), this.ev(node.alternate, scope, d + 1));
      case "LogicalExpression":
        return this.union(this.ev(node.left, scope, d + 1), this.ev(node.right, scope, d + 1));
      case "AwaitExpression":
      case "YieldExpression":
        return node.argument ? this.ev(node.argument, scope, d + 1) : [UNK];
      case "AssignmentExpression":
        return node.operator === "=" ? this.ev(node.right, scope, d + 1) : [UNK];
      case "BinaryExpression": {
        if (node.operator !== "+") return [UNK];
        const a = this.ev(node.left, scope, d + 1);
        const b = this.ev(node.right, scope, d + 1);
        return this.allStr(a) && this.allStr(b) ? this.product(a, b, (x, y) => x + y) : [UNK];
      }
      case "ArrayExpression": {
        const items = [];
        let open = false;
        for (const e of node.elements) {
          if (!e) items.push([UNK]);
          else if (e.type === "SpreadElement") open = true;
          else items.push(this.ev(e, scope, d + 1));
        }
        const arr = this.alloc.get(node) ?? { k: "arr" };
        this.alloc.set(node, arr);
        arr.items = items;
        arr.open = open;
        return [arr];
      }
      case "ObjectExpression": {
        const props = new Map();
        let proto = null;
        let openObj = false;
        for (const p of node.properties) {
          if (p.type === "SpreadElement" || (p.type === "Property" && (p.computed || p.kind !== "init"))) openObj = true;
          if (p.type !== "Property" || p.computed || p.kind !== "init" || p.method) continue;
          const name = p.key.type === "Identifier" ? p.key.name : String(p.key.value);
          const v = this.ev(p.value, scope, d + 1);
          if (name === "__proto__") proto = v;
          else props.set(name, v);
        }
        const obj = this.alloc.get(node) ?? { k: "obj" };
        this.alloc.set(node, obj);
        obj.props = props;
        obj.proto = proto;
        obj.open = openObj;
        return [obj];
      }
      case "MemberExpression":
        return this.evMember(node, this.ev(node.object, scope, d + 1), scope, d);
      case "CallExpression": {
        const callee = unwrap(node.callee);
        if (callee && callee.type === "Identifier" && callee.name === "String" && !lookup(scope, "String") && node.arguments.length === 1 && node.arguments[0].type !== "SpreadElement") {
          const a = this.ev(node.arguments[0], scope, d + 1);
          return this.allStr(a) ? a : [UNK];
        }
        // Object.freeze(x) and its kin return their argument
        if (callee && callee.type === "MemberExpression" && !callee.computed && callee.object.type === "Identifier" && callee.object.name === "Object" && !lookup(scope, "Object") && ["freeze", "seal", "preventExtensions"].includes(callee.property.name) && node.arguments.length === 1 && node.arguments[0].type !== "SpreadElement") {
          return this.ev(node.arguments[0], scope, d + 1);
        }
        const calleeObj = callee && callee.type === "MemberExpression" ? this.ev(callee.object, scope, d + 1) : null;
        if (callee && callee.type === "MemberExpression" && !callee.computed && callee.property.name === "join" && node.arguments.length <= 1) {
          const arr = calleeObj;
          const sepNode = node.arguments[0];
          const sep = sepNode ? this.ev(sepNode, scope, d + 1) : this.str(",");
          if (arr.length === 1 && arr[0].k === "arr" && !arr[0].open && this.allStr(sep) && sep.length === 1) {
            const parts = arr[0].items.map((i) => (this.allStr(i) ? i : null));
            if (parts.every(Boolean)) {
              let acc = null;
              for (const p of parts) acc = acc === null ? p : this.product(acc, p, (x, y) => x + sep[0].v + y);
              return acc ?? this.str("");
            }
          }
          return [UNK];
        }
        if (callee && callee.type === "MemberExpression") {
          const obj = calleeObj;
          if (obj.some((x) => x.k === "dyn") && !callee.computed && ["call", "apply", "bind"].includes(callee.property.name)) return [UNK];
        }
        // Reflect.get(obj, "key") reads like obj.key
        const cv = calleeObj ? this.evMember(callee, calleeObj, scope, d) : this.ev(node.callee, scope, d + 1);
        if (cv.length === 1 && cv[0].k === "rmethod" && cv[0].m === "get" && node.arguments.length >= 2 && !node.arguments.some((a) => a.type === "SpreadElement")) {
          const keys = this.keysOf(this.ev(node.arguments[1], scope, d + 1));
          return this.getMember(this.ev(node.arguments[0], scope, d + 1), keys, node.start);
        }
        return [UNK];
      }
      default:
        return [UNK];
    }
  }

  evMember(node, obj, scope, d) {
    const keys = node.computed ? this.keysOf(this.ev(node.property, scope, d + 1)) : [node.property.name];
    return this.getMember(obj, keys, node.start);
  }

  // ---- pass 2: the checks ----
  run() {
    this.build(this.ast, null);
    if (this.boundHit) return;
    this.resolvePending();
    this.stable = true;
    const root = this.scopeOf.get(this.ast);
    this.walk(this.ast, [], root, 0);
    this.checkDynamicReads();
  }

  isDynamic(rule) {
    return RULES[rule].dynamic;
  }

  walk(node, ancestors, scope, depth) {
    if (depth > this.limits.maxDepth) {
      if (!this.depthHit) {
        this.depthHit = true;
        this.sink.add("U-BOUND", node.start ?? 0, `syntax nesting deeper than ${this.limits.maxDepth}`);
      }
      return;
    }
    this.nodes += 1;
    if (this.nodes > this.limits.maxNodes) return;
    this.parents.set(node, ancestors[ancestors.length - 1] ?? null);
    const own = this.scopeOf.get(node);
    const sc = own ?? scope;
    this.check(node, ancestors, sc);
    this.enteringKey(node, ancestors, sc, depth);
  }

  enteringKey(node, ancestors, sc, depth) {
    // A computed key is walked with keyDepth raised: a code-running name inside it is reported even as an array
    // element (round 9 of the PR #147 review).
    const isKeyed = (child) => (node.type === "MemberExpression" && node.computed && child === node.property) || ((node.type === "Property" || node.type === "MethodDefinition" || node.type === "PropertyDefinition") && node.computed && child === node.key);
    ancestors.push(node);
    for (const c of childNodes(node)) {
      const keyed = isKeyed(c);
      if (keyed) this.keyDepth += 1;
      this.walk(c, ancestors, sc, depth + 1);
      if (keyed) this.keyDepth -= 1;
    }
    ancestors.pop();
  }

  parentOf(ancestors, up = 1) {
    return ancestors[ancestors.length - up] ?? null;
  }

  // the expression that stands for `node` after parentheses: returns the outermost wrapper
  outerOf(node, ancestors) {
    let cur = node;
    let i = ancestors.length - 1;
    while (i >= 0 && ancestors[i].type === "ParenthesizedExpression") {
      cur = ancestors[i];
      i -= 1;
    }
    return { node: cur, parent: ancestors[i] ?? null, grand: ancestors[i - 1] ?? null };
  }

  report(rule, node, reason) {
    if (!RULES[rule]) throw new Error("unknown rule " + rule);
    if (RULES[rule].dynamic && this.o.dynamicCode === false) return;
    this.add(rule, node, reason);
  }

  check(node, ancestors, scope) {
    const parent = this.parentOf(ancestors);
    switch (node.type) {
      case "Identifier":
        return this.checkIdentifier(node, ancestors, parent, scope);
      case "Literal":
      case "TemplateLiteral":
        if (node.type === "TemplateLiteral" && node.expressions.length > 0) this.checkBuilt(node, scope);
        return this.checkString(node, parent, ancestors);
      case "MemberExpression":
        return this.checkMember(node, ancestors, parent, scope);
      case "CallExpression":
      case "NewExpression":
        return this.checkCall(node, ancestors, scope);
      case "TaggedTemplateExpression":
        return this.checkCallee(node, node.tag, scope);
      case "ImportDeclaration":
        return this.checkImport(node);
      case "ExportNamedDeclaration":
        return this.checkExportFrom(node);
      case "ImportExpression":
        return this.checkDynamicImport(node);
      case "MetaProperty":
        return this.checkMeta(node, ancestors, parent);
      case "VariableDeclarator":
        return this.checkDeclarator(node, scope);
      // every other position that binds or assigns through a pattern goes through the same checkPattern (round 2, B2)
      case "FunctionDeclaration":
      case "FunctionExpression":
      case "ArrowFunctionExpression":
        for (const p of node.params) this.checkPattern(p, [UNK], scope);
        return undefined;
      case "CatchClause":
        if (node.param) this.checkPattern(node.param, [UNK], scope);
        return undefined;
      case "ForInStatement":
      case "ForOfStatement":
        if (node.left.type === "VariableDeclaration") for (const d of node.left.declarations) this.checkPattern(d.id, [UNK], scope);
        else this.checkPattern(node.left, [UNK], scope);
        return undefined;
      case "AssignmentExpression":
        if (node.left.type === "ObjectPattern" || node.left.type === "ArrayPattern") this.checkPattern(node.left, this.ev(node.right, scope), scope);
        return undefined;
      case "Property":
        return this.checkProperty(node, ancestors, parent, scope);
      case "BinaryExpression":
        return node.operator === "+" ? this.checkBuilt(node, scope) : undefined;
      case "WithStatement":
        return this.report2("U-PARSE", node, `a with statement, whose names are looked up in an object at run time, at offset ${node.start}`);
      default:
        return undefined;
    }
  }

  // ---- identifiers ----
  checkIdentifier(node, ancestors, parent, scope) {
    const name = node.name;
    this.noteReference(node, parent, scope);
    const inImportClause = parent && (parent.type === "ImportSpecifier" || parent.type === "ImportDefaultSpecifier" || parent.type === "ImportNamespaceSpecifier");
    if (IDENT_NAMES.has(name)) this.report("V-DYN-NAME", node, `reference to ${name}, which runs source text or reaches a loader`);
    if (name === "constructor") this.checkConstructor(node, ancestors, parent);
    if (TIMER_NAMES.includes(name)) this.checkTimer(node, ancestors, parent, inImportClause);
    if (name === "require") this.checkRequireIdentifier(node, ancestors, parent);
    if (name === "createRequire") this.report2("U-CREATE-REQUIRE", node, "createRequire builds a require the scan cannot read");
    if (name === "Script") this.checkScript(node, ancestors, parent);
    if (name === "URL" && !inImportClause) this.checkUrlIdentifier(node, ancestors, parent);
    if ((name === "fileURLToPath" || name === "pathToFileURL") && !inImportClause) this.checkFileUrlFn(node, ancestors, parent);
  }

  // ---- dynamic reads (criterion 5) ----
  // An identifier that can name a binding (not a property name or a key) is a reference to it.
  noteReference(node, parent, scope) {
    if (parent && parent.type === "MemberExpression" && parent.property === node && !parent.computed) return;
    if (parent && (parent.type === "Property" || parent.type === "MethodDefinition" || parent.type === "PropertyDefinition") && parent.key === node && !parent.computed && !parent.shorthand) return;
    const b = lookup(scope, node.name);
    if (!b) return;
    this.refBinding.set(node, b);
    if (!this.refs.has(b)) this.refs.set(b, []);
    this.refs.get(b).push(node);
  }

  // A computed read whose key is built at run time may yield any member of its object, the global object's eval
  // among them. It is CLEAN only when its value is provably never invoked and never leaves the expression: a
  // test, a comparison, a write target, a property of it, or a binding whose every use is itself such a use.
  // Anything else (an argument, a return, a store, a spread, an array or object element, a throw, a yield, a
  // default export, a class field, an implicit global) is UNKNOWN. Direct calls are reported by checkCallee.
  checkDynamicReads() {
    for (const node of this.dynReads) {
      if (!this.valueStaysInert(node, new Set())) this.report("U-COMPUTED-CALL", node, "a computed member read whose key is built at run time, and whose value is not shown never to be invoked");
    }
  }

  valueStaysInert(node, seen) {
    let cur = node;
    let p = this.parents.get(cur);
    while (p && (p.type === "ParenthesizedExpression" || p.type === "ChainExpression")) {
      cur = p;
      p = this.parents.get(cur);
    }
    if (!p) return false;
    switch (p.type) {
      case "ExpressionStatement":
      case "UnaryExpression":
      case "UpdateExpression":
      case "TemplateLiteral":
        return true;
      case "BinaryExpression":
        return p.operator !== "instanceof" || p.left === cur;
      case "IfStatement":
      case "WhileStatement":
      case "DoWhileStatement":
      case "ForStatement":
        return p.test === cur;
      case "ForInStatement":
      case "ForOfStatement":
        return p.right === cur;
      case "ConditionalExpression":
        return p.test === cur ? true : this.valueStaysInert(p, seen);
      case "LogicalExpression":
        return this.valueStaysInert(p, seen);
      case "SequenceExpression":
        return p.expressions[p.expressions.length - 1] === cur ? this.valueStaysInert(p, seen) : true;
      case "MemberExpression": {
        if (p.property === cur && p.computed) return true; // used as a key
        if (p.object !== cur) return false;
        // a property of the read is as unknown as the read, .call .apply and .bind included: it may be the function itself,
        // so it must stay inert in turn (a member that is called is not inert)
        return this.valueStaysInert(p, seen);
      }
      case "AssignmentExpression": {
        if (p.left === cur) return true;
        return p.left.type === "Identifier" && this.bindingStaysInert(this.refBinding.get(p.left), seen) && this.valueStaysInert(p, seen);
      }
      case "CallExpression":
      case "NewExpression":
        return this.argumentStaysInert(p, cur, seen);
      case "SpreadElement": {
        // { ...x } copies the members of x, which are read as members of x are: by name, and judged where they are called
        const q = this.parents.get(p);
        return !!q && q.type === "ObjectExpression";
      }
      case "ReturnStatement":
        return this.returnStaysInert(p, seen);
      case "AssignmentPattern":
        if (p.left === cur) return true;
        return p.left.type === "Identifier" && this.bindingStaysInert(this.refBinding.get(p.left), seen);
      case "ArrowFunctionExpression":
        return p.body === cur && this.resultStaysInert(p, seen);
      case "VariableDeclarator":
        if (p.id === cur) return true;
        return p.init === cur && p.id.type === "Identifier" && this.bindingStaysInert(this.refBinding.get(p.id), seen);
      default:
        return false;
    }
  }

  // A value passed as an argument stays inert when the callee provably never invokes it: a local function whose
  // parameter is itself only used inertly, or a data method of a regular expression literal, a known string or
  // array, or a Map or Set created here (test, includes, indexOf, get, has).
  argumentStaysInert(call, cur, seen) {
    if (call.callee === cur) return false;
    const i = call.arguments.indexOf(cur);
    if (i < 0) return false;
    const callee = call.callee;
    if (callee.type === "Identifier") {
      const b = lookupFrom(this, callee);
      const fn = b && b.fn;
      if (!fn || b.defs.length !== 1 || this.usesArguments(fn)) return false;
      let prm = fn.params[i];
      if (prm && prm.type === "AssignmentPattern") prm = prm.left;
      if (!prm || prm.type !== "Identifier") return false;
      return this.bindingStaysInert(this.refBinding.get(prm), seen);
    }
    if (call.type === "CallExpression" && callee.type === "MemberExpression" && !callee.computed) {
      const m = callee.property.name;
      // Object.prototype.hasOwnProperty.call(x, key) reads own-property presence and never calls x
      const hop = callee.object;
      if (m === "call" && hop.type === "MemberExpression" && !hop.computed && hop.property.name === "hasOwnProperty" && hop.object.type === "MemberExpression" && !hop.object.computed && hop.object.property.name === "prototype" && hop.object.object.type === "Identifier" && hop.object.object.name === "Object" && !this.refBinding.get(hop.object.object)) return true;
      const recv = callee.object;
      // static data functions of the language that read their argument and never call it
      const STATIC = { Object: ["keys", "values", "entries", "getPrototypeOf", "isFrozen", "getOwnPropertyNames"], Array: ["isArray"], Number: ["isFinite", "isInteger", "isNaN", "isSafeInteger"], JSON: ["stringify"] };
      if (recv.type === "Identifier" && STATIC[recv.name] && STATIC[recv.name].includes(m) && !this.refBinding.get(recv)) return true;
      if (m === "test" && ((recv.type === "Literal" && recv.regex) || (recv.type === "NewExpression" && recv.callee.type === "Identifier" && recv.callee.name === "RegExp" && !this.refBinding.get(recv.callee)))) return true;
      if (["includes", "indexOf", "lastIndexOf"].includes(m) && recv.type === "Identifier") {
        const b = lookupFrom(this, recv);
        if (b && b.defs.length === 1 && b.defs[0].k === "expr" && ["ArrayExpression", "Literal"].includes(b.defs[0].node.type) && b.kind === "const") return true;
      }
      if (["get", "has"].includes(m) && recv.type === "Identifier") {
        const b = lookupFrom(this, recv);
        if (b && b.collection && b.defs.length === 1 && b.kind === "const") return true;
      }
    }
    return false;
  }

  // A returned value is inert when the function is a local, unexported, plain function and every use of it is a call
  // whose result is itself inert.
  returnStaysInert(ret, seen) {
    let fn = this.parents.get(ret);
    while (fn && !/Function/.test(fn.type)) fn = this.parents.get(fn);
    return fn ? this.resultStaysInert(fn, seen) : false;
  }

  resultStaysInert(fn, seen) {
    if (fn.async || fn.generator) return false;
    let b = null;
    const holder = this.parents.get(fn);
    if (fn.type === "FunctionDeclaration" && fn.id) {
      b = this.refBinding.get(fn.id) ?? null;
      if (holder && /^Export/.test(holder.type)) return false;
    } else if (holder && holder.type === "VariableDeclarator" && holder.init === fn && holder.id.type === "Identifier") {
      b = this.refBinding.get(holder.id) ?? null;
      const decl = this.parents.get(holder);
      const outer = decl && this.parents.get(decl);
      if (outer && /^Export/.test(outer.type)) return false;
    }
    if (!b || b.defs.length !== 1) return false;
    const key = fn;
    if (seen.has(key)) return true;
    seen.add(key);
    for (const ref of this.refs.get(b) ?? []) {
      if (ref === fn.id || ref === holder.id) continue; // the declaration itself
      const call = this.parents.get(ref);
      if (call && call.type === "CallExpression" && call.callee === ref) {
        if (!this.valueStaysInert(call, seen)) return false;
      } else if (!this.valueStaysInert(ref, seen)) return false; // the function value itself is only tested or compared
    }
    return true;
  }

  usesArguments(fn) {
    if (fn.usesArguments !== undefined) return fn.usesArguments;
    let found = false;
    const visit = (n) => {
      if (found || !n || typeof n.type !== "string") return;
      if (n.type === "Identifier" && n.name === "arguments") { found = true; return; }
      if (n !== fn && (n.type === "FunctionDeclaration" || n.type === "FunctionExpression")) return;
      for (const k of Object.keys(n)) {
        const v = n[k];
        if (Array.isArray(v)) v.forEach(visit);
        else if (v && typeof v.type === "string") visit(v);
      }
    };
    visit(fn.body);
    for (const p of fn.params) visit(p);
    fn.usesArguments = found;
    return found;
  }

  bindingStaysInert(binding, seen) {
    if (!binding) return false;
    if (seen.has(binding)) return true;
    seen.add(binding);
    for (const ref of this.refs.get(binding) ?? []) {
      const par = this.parents.get(ref);
      if (par && /Function/.test(par.type) && par.params.includes(ref)) continue; // the declaration of a parameter
      if (!this.valueStaysInert(ref, seen)) return false;
    }
    return true;
  }

  // rules that the vendored trees are NOT exempt from
  report2(rule, node, reason) {
    this.add(rule, node, reason);
  }

  checkConstructor(node, ancestors, parent) {
    if (parent && parent.type === "MethodDefinition" && parent.key === node && !parent.computed && parent.kind === "constructor") return;
    if (parent && parent.type === "MemberExpression" && parent.property === node && !parent.computed) {
      const up = this.outerOf(parent, ancestors.slice(0, -1));
      const gp = up.parent;
      if (gp && gp.type === "MemberExpression" && gp.object === up.node && !gp.computed && gp.property.name === "name") return;
      if (gp && gp.type === "BinaryExpression" && ["===", "!==", "==", "!="].includes(gp.operator)) return;
    }
    this.report("V-CONSTRUCTOR", node, "constructor used other than as a class's own method, compared, or named, which reaches Function");
  }

  checkTimer(node, ancestors, parent, inImportClause) {
    const name = node.name;
    if (inImportClause) {
      if (parent.type === "ImportSpecifier" && parent.imported === node && parent.local.name !== name) this.report("V-TIMER", node, `${name} imported under another name`);
      return;
    }
    let ref = node;
    let hold = ancestors;
    if (parent && parent.type === "MemberExpression" && parent.property === node && !parent.computed) {
      ref = parent;
      hold = ancestors.slice(0, -1);
    }
    const up = hold[hold.length - 1];
    if (up && (up.type === "CallExpression") && up.callee === ref) {
      const first = up.arguments[0];
      const f = first && unwrapParens(first);
      if (!(f && (f.type === "FunctionExpression" || f.type === "ArrowFunctionExpression"))) this.report("V-TIMER", node, `${name} whose first argument is not a function expression`);
      return;
    }
    if (up && up.type === "ChainExpression") {
      const call = hold[hold.length - 2];
      if (call && call.type === "CallExpression" && call.callee === ref) {
        const f = call.arguments[0] && unwrapParens(call.arguments[0]);
        if (!(f && (f.type === "FunctionExpression" || f.type === "ArrowFunctionExpression"))) this.report("V-TIMER", node, `${name} whose first argument is not a function expression`);
        return;
      }
    }
    this.report("V-TIMER", node, `reference to ${name} that is not a direct call`);
  }

  isRequireCallee(node, ancestors, parent) {
    // `require(...)`, `require?.(...)`, `x.require(...)`, `x?.require?.(...)`, `x["require"](...)`
    let ref = node;
    let hold = ancestors;
    if (parent && parent.type === "MemberExpression" && !parent.computed && parent.property === node) {
      ref = parent;
      hold = ancestors.slice(0, -1);
    }
    const up = hold[hold.length - 1];
    return Boolean(up && up.type === "CallExpression" && up.callee === ref);
  }

  checkRequireIdentifier(node, ancestors, parent) {
    if (this.isRequireCallee(node, ancestors, parent)) return;
    this.report2("U-REQUIRE", node, `reference that is not a literal call at offset ${node.start}`);
  }

  checkScript(node, ancestors, parent) {
    if (parent && parent.type === "NewExpression" && parent.callee === node) this.report("V-VM-SCRIPT", node, "vm.Script, which compiles source text");
    else if (parent && parent.type === "MemberExpression" && parent.property === node && !parent.computed && parent.object.type === "Identifier" && parent.object.name === "vm") this.report("V-VM-SCRIPT", node, "vm.Script, which compiles source text");
  }

  // ---- strings ----
  checkString(node, parent, ancestors) {
    const v = staticString(node);
    if (v === null) return;
    if (parent && (parent.type === "ImportDeclaration" || parent.type === "ExportAllDeclaration" || (parent.type === "ExportNamedDeclaration" && parent.source === node) || (parent.type === "ImportExpression" && parent.source === node))) return;
    if (node.type === "TemplateLiteral" && parent && parent.type === "TaggedTemplateExpression" && parent.quasi === node) return;
    const arrayElement = parent && parent.type === "ArrayExpression" && this.keyDepth === 0;
    if (!arrayElement && NAME_STRINGS.has(v)) this.report("V-DYN-NAME", node, `the string "${v}" naming a code-running or process-starting member`);
    if (v === "require" || v === "createRequire") {
      const inPatternKey = parent && parent.type === "Property" && parent.key === node && ancestors[ancestors.length - 2] && ancestors[ancestors.length - 2].type === "ObjectPattern";
      const inComputedKey = parent && parent.type === "MemberExpression" && parent.computed && parent.property === node;
      if (inPatternKey || inComputedKey) {
        if (v === "createRequire") this.report2("U-CREATE-REQUIRE", node, "createRequire builds a require the scan cannot read");
        else if (inPatternKey) this.report2("U-REQUIRE", node, `a destructured require at offset ${node.start}`);
        else {
          const up = this.outerOf(parent, ancestors.slice(0, -1));
          const call = up.parent && (up.parent.type === "CallExpression" && up.parent.callee === up.node);
          if (!call) this.report2("U-REQUIRE", node, `computed reference that is not a literal call at offset ${node.start}`);
        }
      }
    }
  }

  // ---- members ----
  memberAlerts(av, keys, node, pattern) {
    const hasKind = (...ks) => av.some((a) => ks.includes(a.k));
    if (keys === null) return;
    for (const key of keys) {
      if (NAME_STRINGS.has(key) && node.type === "MemberExpression" && node.computed) {
        const lit = staticString(node.property);
        if (lit === null) this.report("V-DYN-NAME", node, `computed member resolved to the name "${key}", which runs code`);
      }
      const knownLiteral = av.length > 0 && av.every((a) => a.k === "str" || a.k === "arr" || (a.k === "obj" && !a.open));
      if (PROCESS_DENIED.has(key) && (hasKind("process", "nsproc", "global") || !knownLiteral)) this.report("V-PROCESS-INTERNAL", node, `process.${key}, which reaches internal modules or replaces the process`);
      if (MODULE_DENIED.has(key) && hasKind("module")) this.report("V-MODULE-MEMBER", node, `module.${key}, which loads and runs a file`);
      if (pattern && REFLECT_LOOKUPS.has(key) && hasKind("reflect")) this.report("V-REFLECT", node, `Reflect.${key} destructured, so its calls cannot be read`);
    }
  }

  checkMember(node, ancestors, parent, scope) {
    const obj = this.ev(node.object, scope);
    const keys = node.computed ? this.keysOf(this.ev(node.property, scope)) : [node.property.name];
    this.memberAlerts(obj, keys, node, false);
    if (node.computed && keys === null) {
      const sensitive = obj.find((a) => ["global", "process", "nsproc", "module", "reflect"].includes(a.k));
      if (sensitive) this.report("U-COMPUTED-GLOBAL", node, `computed access on ${sensitive.k === "nsproc" ? "process" : sensitive.k} with a key built at run time`);
    }
    if (node.computed && keys === null && !(obj.length > 0 && obj.every((a) => a.k === "str" || a.k === "arr" || (a.k === "obj" && !a.open)))) this.dynReads.push(node);
    const own = this.ev(node, scope);
    const up = this.outerOf(node, ancestors);
    const isCallee = (p) => p && ((p.type === "CallExpression" && p.callee === up.node) || (p.type === "ChainExpression" && false));
    // Reflect.get and Reflect.getOwnPropertyDescriptor are read only as direct calls
    if (own.some((a) => a.k === "rmethod")) {
      let p = up.parent;
      if (!(p && p.type === "CallExpression" && p.callee === up.node)) this.report("V-REFLECT", node, `Reflect.${own.find((a) => a.k === "rmethod").m} used other than as a direct call`);
    }
    // Reflect reached through the global object may only be the object of a further member access
    if (own.some((a) => a.k === "reflect" && a.via)) {
      const p = up.parent;
      if (!(p && p.type === "MemberExpression" && p.object === up.node)) this.report("V-REFLECT", node, "Reflect reached through the global object and held");
    }
    void isCallee;
    if (node.computed && keys === null && this.isRequireKeyUnknown) void 0;
  }

  checkProperty(node, ancestors, parent, scope) {
    if (!node.computed) return;
    const inClass = false;
    void inClass;
    const keys = this.keysOf(this.ev(node.key, scope));
    if (keys === null) {
      this.report("U-COMPUTED-KEY", node, "a computed property name built at run time");
      return;
    }
    for (const k of keys) {
      if (NAME_STRINGS.has(k) && staticString(node.key) === null) this.report("V-DYN-NAME", node, `computed property name resolved to "${k}"`);
    }
  }

  checkDeclarator(node, scope) {
    if (node.id.type !== "Identifier" && node.init) this.checkPattern(node.id, this.ev(node.init, scope), scope);
  }

  checkPattern(pattern, srcAv, scope) {
    switch (pattern.type) {
      case "ObjectPattern":
        for (const p of pattern.properties) {
          if (p.type === "RestElement") continue;
          const keys = p.computed ? this.keysOf(this.ev(p.key, scope)) : [p.key.type === "Identifier" ? p.key.name : String(p.key.value)];
          this.memberAlerts(srcAv, keys, p, true);
          if (p.computed && keys === null) {
            const sensitive = srcAv.find((a) => ["global", "process", "nsproc", "module", "reflect"].includes(a.k));
            if (sensitive) this.report("U-COMPUTED-GLOBAL", p, `computed destructuring from ${sensitive.k} with a key built at run time`);
          }
          this.checkPattern(p.value, this.getMember(srcAv, keys, p.start), scope);
        }
        break;
      case "ArrayPattern":
        pattern.elements.forEach((e, i) => {
          if (e) this.checkPattern(e, this.getMember(srcAv, [String(i)], 0), scope);
        });
        break;
      case "AssignmentPattern":
        this.checkPattern(pattern.left, this.union(srcAv, this.ev(pattern.right, scope)), scope);
        break;
      case "RestElement":
        this.checkPattern(pattern.argument, [UNK], scope);
        break;
      default:
        break;
    }
  }

  // ---- calls ----
  checkCallee(node, calleeNode, scope) {
    const callee = unwrapParens(calleeNode);
    const inner = unwrap(calleeNode);
    if (inner && ["ArrayExpression", "ObjectExpression", "Literal", "TemplateLiteral"].includes(inner.type) && !(inner.type === "Literal" && inner.regex)) {
      this.report("V-ODD-CALLEE", node, ODD_CALLEE_REASON);
    }
    const av = this.ev(calleeNode, scope);
    const dyn = av.find((a) => a.k === "dyn");
    if (dyn) {
      const direct = callee && callee.type === "MemberExpression" && callee.computed;
      this.report("U-COMPUTED-CALL", node, direct ? "a computed member called, whose name is built at run time" : "a stored computed member reaches a call, and its key is built at run time");
    }
  }

  checkCall(node, ancestors, scope) {
    this.checkCallee(node, node.callee, scope);
    const calleeAv = this.ev(node.callee, scope);
    const rm = calleeAv.find((a) => a.k === "rmethod");
    if (rm && node.type === "CallExpression") {
      const args = node.arguments;
      if (args.length < 2 || args.some((a) => a.type === "SpreadElement")) {
        this.report("U-REFLECT-KEY", node, `Reflect.${rm.m} without a readable object and key`);
      } else {
        const keys = this.keysOf(this.ev(args[1], scope));
        if (keys === null) this.report("U-REFLECT-KEY", node, `Reflect.${rm.m} with a key built at run time`);
        else {
          const obj = this.ev(args[0], scope);
          for (const k of keys) {
            if (NAME_STRINGS.has(k) || IDENT_NAMES.has(k)) this.report("V-DYN-NAME", node, `Reflect.${rm.m} reads the name "${k}", which runs code`);
            if (PROCESS_DENIED.has(k) && obj.some((a) => ["process", "nsproc", "global"].includes(a.k))) this.report("V-PROCESS-INTERNAL", node, `Reflect.${rm.m} reads process.${k}`);
            if (MODULE_DENIED.has(k) && obj.some((a) => a.k === "module")) this.report("V-MODULE-MEMBER", node, `Reflect.${rm.m} reads module.${k}`);
          }
        }
      }
    }
    if (node.type === "CallExpression") this.checkBuilt(node, scope);
    this.checkOwnDescriptor(node, scope);
    if (node.type === "CallExpression") this.checkSpecifierCall(node, ancestors);
    this.checkMetaBase(node, ancestors);
  }

  // Reading a denied process member by name through a reflective call, on an object that is not a known literal:
  // the process root may have been lost through a parameter, a return or a store.
  checkOwnDescriptor(node, scope) {
    if (node.type !== "CallExpression" || node.arguments.length < 2 || node.arguments.some((a) => a.type === "SpreadElement")) return;
    const ce = unwrap(node.callee);
    if (!ce || ce.type !== "MemberExpression") return;
    const name = ce.computed ? staticString(ce.property) : ce.property.name;
    const viaReflect = this.ev(ce.object, scope).some((a) => a.k === "reflect") && ["get", "getOwnPropertyDescriptor", "has"].includes(name);
    const viaObject = ce.object.type === "Identifier" && ce.object.name === "Object" && !lookup(scope, "Object") && ["getOwnPropertyDescriptor", "hasOwn"].includes(name);
    if (!viaReflect && !viaObject) return;
    const keys = this.keysOf(this.ev(node.arguments[1], scope));
    const obj = this.ev(node.arguments[0], scope);
    const literal = obj.length > 0 && obj.every((a) => a.k === "str" || a.k === "arr" || (a.k === "obj" && !a.open));
    if (keys === null) {
      // a descriptor chosen at run time from an object that is not a known literal carries a value that may be any member
      if (name === "getOwnPropertyDescriptor" && !literal) this.report("U-REFLECT-KEY", node, `${name} with a key built at run time on an object that is not a known literal`);
      return;
    }
    for (const k of keys) if (PROCESS_DENIED.has(k) && !literal) this.report("V-PROCESS-INTERNAL", node, `${name} reads process.${k} from an object that is not a known literal`);
  }

  // require(...) and import.meta.resolve(...) and calls whose second argument is import.meta.url
  checkSpecifierCall(node) {
    const callee = unwrap(node.callee);
    if (!callee) return;
    const isReq = node.callee.type !== "ParenthesizedExpression" && ((callee.type === "Identifier" && callee.name === "require") || (callee.type === "MemberExpression" && ((!callee.computed && callee.property.name === "require") || (callee.computed && staticString(callee.property) === "require"))));
    if (isReq) {
      const lit = node.arguments[0] && node.arguments[0].type !== "SpreadElement" ? staticString(node.arguments[0]) : null;
      if (lit !== null) this.sink.spec({ form: "require", specifier: lit });
      else this.sink.unreadable("U-SPECIFIER", node.start, `non-literal at offset ${node.start}`, "require");
    }
    if (callee.type === "MemberExpression" && !callee.computed && callee.property.name === "resolve" && callee.object.type === "MetaProperty") {
      const lit = node.arguments[0] && node.arguments[0].type !== "SpreadElement" ? staticString(node.arguments[0]) : null;
      if (lit !== null) this.sink.spec({ form: "resolve", specifier: lit });
      else this.sink.unreadable("U-SPECIFIER", node.start, `non-literal at offset ${node.start}`, "resolve");
    }
  }

  checkMetaBase(node, ancestors) {
    const callee = unwrap(node.callee);
    const isUrlCtor = node.type === "NewExpression" && this.isUrlRef(callee);
    const isUrlParse = node.type === "CallExpression" && callee && callee.type === "MemberExpression" && !callee.computed && callee.property.name === "parse" && this.isUrlRef(unwrapParens(callee.object));
    if (isUrlCtor || isUrlParse) {
      this.readUrlConstruction(node);
      return;
    }
    const second = node.arguments[1];
    if (second && second.type !== "SpreadElement" && isMetaRooted(second)) {
      if (isMetaUrl(second)) {
        const lit = node.arguments[0].type !== "SpreadElement" ? staticString(node.arguments[0]) : null;
        if (lit !== null) this.sink.spec({ form: "url", specifier: lit });
        else this.sink.unreadable("U-SPECIFIER", node.start, `non-literal at offset ${node.start}`, "url");
      } else {
        this.sink.unreadable("U-URL", node.start, `base is import.meta used in a form other than import.meta.url at offset ${node.start}`, "url");
      }
    }
  }

  isUrlRef(n) {
    if (!n) return false;
    if (n.type === "Identifier") return n.name === "URL";
    return n.type === "MemberExpression" && !n.computed && n.property.name === "URL";
  }

  readUrlConstruction(node) {
    const args = node.arguments;
    const bad = (why) => this.sink.unreadable("U-URL", node.start, `${why} at offset ${node.start}`, "url");
    if (args.some((a) => a.type === "SpreadElement")) return bad("construction with a spread argument list");
    if (args.length === 0 || args.length > 2) return bad("construction with no arguments or with extra arguments");
    const literal = staticString(args[0]);
    if (literal === null) return bad("non-literal first argument");
    const normal = literal.replace(/[\t\n\r]/g, "").replace(/^[\u0000- ]+|[\u0000- ]+$/g, "");
    if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(normal)) {
      if (/^file:/i.test(normal)) this.sink.spec({ form: "file-url", specifier: literal });
      return undefined;
    }
    if (args.length === 1) return bad("relative literal with no base");
    if (isMetaUrl(args[1])) this.sink.spec({ form: "url", specifier: literal });
    else bad("base is not the literal import.meta.url");
    return undefined;
  }

  checkUrlIdentifier(node, ancestors, parent) {
    // the reference expression: the identifier, or the member whose non-computed property it is
    let ref = node;
    let hold = ancestors;
    if (parent && parent.type === "MemberExpression" && parent.property === node && !parent.computed) {
      ref = parent;
      hold = ancestors.slice(0, -1);
    }
    let cur = ref;
    let i = hold.length - 1;
    while (i >= 0 && hold[i].type === "ParenthesizedExpression") {
      cur = hold[i];
      i -= 1;
    }
    const up = hold[i];
    if (up && up.type === "NewExpression" && up.callee === cur) return; // read as a construction by checkCall
    if (up && up.type === "MemberExpression" && up.object === cur && !up.computed) {
      if (URL_STATIC_SAFE.has(up.property.name)) return;
      if (up.property.name === "parse") {
        const call = hold[i - 1];
        if (call && call.type === "CallExpression" && call.callee === up) return; // read as URL.parse(...) by checkCall
      }
    }
    // a member that merely is named URL on the left of an access (globalThis.URL.canParse) is handled above via ref
    this.sink.unreadable("U-URL", node.start, `reference to URL that is not a literal construction at offset ${node.start}`, "url");
  }

  checkFileUrlFn(node, ancestors, parent) {
    const name = node.name;
    const call = parent && parent.type === "CallExpression" && parent.callee === node ? parent : null;
    if (!call) {
      this.sink.unreadable("U-URL", node.start, `reference to ${name} that is not a call at offset ${node.start}`, "url");
      return;
    }
    if (name === "fileURLToPath") {
      const a = call.arguments;
      if (a.length === 1 && a[0].type !== "SpreadElement") {
        if (isMetaUrl(a[0])) return;
        const lit = staticString(a[0]);
        if (lit !== null) {
          this.sink.spec({ form: "file-url", specifier: lit });
          return;
        }
        const x = unwrapParens(a[0]);
        if (x.type === "NewExpression" && this.isUrlRef(unwrap(x.callee))) return;
      }
      this.sink.unreadable("U-URL", node.start, `fileURLToPath of something other than import.meta.url, a literal or a URL construction at offset ${node.start}`, "url");
      return;
    }
    // pathToFileURL(x).href === import.meta.url, in that order, is the entry-point test
    const href = ancestors[ancestors.length - 2];
    const cmp = ancestors[ancestors.length - 3];
    const ok = href && href.type === "MemberExpression" && href.object === call && !href.computed && href.property.name === "href" && cmp && cmp.type === "BinaryExpression" && ["===", "!==", "==", "!="].includes(cmp.operator) && cmp.left === href && isMetaUrl(cmp.right);
    if (!ok) this.sink.unreadable("U-URL", node.start, `pathToFileURL outside the entry-point comparison at offset ${node.start}`, "url");
  }

  // A string built from parts (a concatenation, a template, a join) that names a code-running or process member.
  checkBuilt(node, scope) {
    const v = this.ev(node, scope);
    if (!this.allStr(v)) return;
    for (const a of v) {
      if (NAME_STRINGS.has(a.v) || IDENT_NAMES.has(a.v)) this.report("V-DYN-NAME", node, `a string built from parts that names "${a.v}", which runs code`);
      if (PROCESS_DENIED.has(a.v)) this.report("V-PROCESS-INTERNAL", node, `a string built from parts that names "${a.v}", which reaches internal modules or replaces the process`);
    }
  }

  checkMeta(node, ancestors, parent) {
    if (node.meta.name !== "import") return;
    if (!parent || parent.type !== "MemberExpression" || parent.object !== node) return;
    if (parent.computed) {
      this.sink.unreadable("U-URL", node.start, `computed import.meta member at offset ${node.start}`, "url");
      return;
    }
    if (parent.property.name === "resolve") {
      const call = ancestors[ancestors.length - 2];
      if (!(call && call.type === "CallExpression" && call.callee === parent)) this.sink.unreadable("U-URL", node.start, `import.meta.resolve that is not called at offset ${node.start}`, "url");
    }
  }

  // ---- static module syntax ----
  checkImport(node) {
    this.sink.spec({ form: "import", specifier: node.source.value, node });
    if (PROCESS_MODULES.has(node.source.value)) {
      for (const sp of node.specifiers) {
        if (sp.type !== "ImportSpecifier") continue;
        const name = sp.imported.type === "Identifier" ? sp.imported.name : String(sp.imported.value);
        if (PROCESS_DENIED.has(name)) this.report("V-PROCESS-INTERNAL", sp, `process.${name} imported, which reaches internal modules or replaces the process`);
      }
    }
  }

  checkExportFrom(node) {
    if (!node.source) return;
    this.sink.spec({ form: "export-from", specifier: node.source.value, node });
    if (PROCESS_MODULES.has(node.source.value)) {
      for (const sp of node.specifiers) {
        const name = sp.local.type === "Identifier" ? sp.local.name : String(sp.local.value);
        if (PROCESS_DENIED.has(name)) this.report("V-PROCESS-INTERNAL", sp, `process.${name} re-exported, which reaches internal modules or replaces the process`);
      }
    }
  }

  checkDynamicImport(node) {
    const lit = staticString(node.source);
    if (lit !== null) this.sink.spec({ form: "dynamic-import", specifier: lit, node });
    else this.sink.unreadable("U-SPECIFIER", node.start, `non-literal at offset ${node.start}`, "dynamic-import");
  }
}

// ---------------------------------------------------------------------------------------------------------------
// The public analysis

class Sink {
  constructor(dynamicCode) {
    this.findings = new Map();
    this.specifiers = [];
    this.dynamicCode = dynamicCode;
  }
  add(rule, offset, reason) {
    const key = `${rule}@${offset}@${reason}`;
    if (!this.findings.has(key)) this.findings.set(key, { rule, outcome: RULES[rule].outcome, offset, reason, form: RULES[rule].form });
  }
  unreadable(rule, offset, reason, form) {
    const key = `${rule}@${offset}@${reason}`;
    if (!this.findings.has(key)) this.findings.set(key, { rule, outcome: RULES[rule].outcome, offset, reason, form });
  }
  spec(s) {
    this.specifiers.push({ form: s.form, specifier: s.specifier });
  }
}

export function parseContracted(source, limits = DEFAULT_LIMITS) {
  const programs = [];
  const errors = [];
  let hazard = null;
  for (const sourceType of PARSE_CONTRACT.sourceTypes) {
    // Cross-check (ST-61 review B1, round 2): after "?." and a member name Node always reads a slash as a division, but
    // Acorn 8.19.0 lets an expression follow some names (keywords, "of", "yield" and "await" in a generator or async
    // function, escaped keywords) and reads a regular expression there. The tokens are taken from the parse itself, so the
    // parser's own context decides, and no list of words is kept: any regular expression directly after "?." and a name
    // makes the whole source UNKNOWN, because the two readings differ.
    let before = null;
    let beforeThat = null;
    let local = null;
    try {
      const ast = acorn.parse(source, {
        ecmaVersion: PARSE_CONTRACT.ecmaVersion,
        sourceType,
        allowHashBang: PARSE_CONTRACT.allowHashBang,
        allowReturnOutsideFunction: sourceType === "script" && PARSE_CONTRACT.allowReturnOutsideFunction,
        preserveParens: PARSE_CONTRACT.preserveParens,
        onToken: (t) => {
          const label = t.type.label;
          if (local === null && label === "regexp" && beforeThat === "?." && before !== "[" && before !== "(") local = t.start;
          beforeThat = before;
          before = label;
        },
      });
      if (local !== null && hazard === null) hazard = `a slash after "?." and a member name at offset ${local}, which Acorn reads as a regular expression and Node as a division`;
      programs.push({ ast, sourceType });
    } catch (e) {
      errors.push(`${sourceType}: ${e && e.message ? e.message : String(e)}`);
    }
  }
  void limits;
  if (programs.length > 0 && hazard !== null) return { programs: [], errors: [...errors, hazard] };
  return { programs, errors };
}

/**
 * Classifies a JavaScript source. Returns { outcome, findings, specifiers, stats }; `findings` holds every
 * VIOLATION and UNKNOWN finding, `specifiers` every module specifier the source names.
 * Options: dynamicCode (false for a pinned vendored tree), limits (override of DEFAULT_LIMITS, tests only).
 */
export function analyzeSource(source, options = {}) {
  const limits = { ...DEFAULT_LIMITS, ...(options.limits ?? {}) };
  const sink = new Sink(options.dynamicCode !== false);
  const stats = { nodes: 0, programs: 0 };
  if (typeof source !== "string") throw new TypeError("analyzeSource needs a string");
  if (source.length > limits.maxSourceChars) {
    sink.add("U-BOUND", 0, `source of ${source.length} characters is larger than the bound of ${limits.maxSourceChars}`);
    return finish(sink, stats);
  }
  let parsed;
  try {
    parsed = parseContracted(source, limits);
  } catch (e) {
    sink.add("U-PARSE", 0, `unparseable (${e && e.message ? e.message : String(e)})`);
    return finish(sink, stats);
  }
  if (parsed.programs.length === 0) {
    sink.add("U-PARSE", 0, `unparseable (${parsed.errors.join("; ")})`);
    return finish(sink, stats);
  }
  for (const { ast, sourceType } of parsed.programs) {
    const a = new Analysis(ast, sourceType, { ...options, limits, dynamicCode: options.dynamicCode !== false }, sink);
    try {
      a.run();
    } catch (e) {
      if (e instanceof RangeError) sink.add("U-BOUND", 0, "the analysis exceeded the stack and stopped");
      else throw e;
    }
    stats.nodes += a.nodes;
    stats.programs += 1;
  }
  return finish(sink, stats);
}

function finish(sink, stats) {
  const findings = [...sink.findings.values()].sort((a, b) => a.offset - b.offset || a.rule.localeCompare(b.rule));
  const outcome = findings.some((f) => f.outcome === "VIOLATION") ? OUTCOME.VIOLATION : findings.length ? OUTCOME.UNKNOWN : OUTCOME.CLEAN;
  const seen = new Set();
  const specifiers = sink.specifiers.filter((s) => {
    const k = s.form + "\0" + s.specifier;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return { outcome, findings, specifiers, stats };
}

export const renderFinding = (f) => `${f.form} ${f.reason}${/at offset \d+$/.test(f.reason) ? "" : ` at offset ${f.offset}`} [${f.outcome} ${f.rule}]`;

// ---------------------------------------------------------------------------------------------------------------
// The allowlist helpers (an allowlisted file may use its reviewed names only as recorded direct calls)

function parseAll(source) {
  const { programs } = parseContracted(source);
  return programs;
}

function walkAll(node, visit, ancestors = []) {
  visit(node, ancestors);
  ancestors.push(node);
  for (const c of childNodes(node)) walkAll(c, visit, ancestors);
  ancestors.pop();
}

/**
 * The normalised text of every direct call to one of `names`: the callee and its arguments as one space-joined
 * token string (every punctuation character apart, strings re-quoted), the format the allowlist records.
 * A direct call is `name(...)` with the name as the callee itself: not parenthesised, not optional.
 */
export function directCallTexts(source, names) {
  const programs = parseAll(source);
  if (programs.length === 0) return [];
  const { ast } = programs[0];
  const tokens = [...acorn.tokenizer(source, { ecmaVersion: PARSE_CONTRACT.ecmaVersion, sourceType: programs[0].sourceType, allowHashBang: true, allowReturnOutsideFunction: true })];
  const out = [];
  walkAll(ast, (n, anc) => {
    if (n.type !== "CallExpression" || n.optional || n.callee.type !== "Identifier" || !names.includes(n.callee.name)) return;
    const parts = [];
    for (const t of tokens) {
      if (t.start < n.start || t.end > n.end) continue;
      const text = source.slice(t.start, t.end);
      if (t.type.label === "string") parts.push(JSON.stringify(t.value));
      else if (t.type.label === "name" || t.type.label === "num" || t.type.keyword || t.type.label === "regexp" || t.type.label === "template" || t.type.label === "`" || t.type.label === "${") parts.push(text);
      else parts.push(...text.split(""));
    }
    out.push(parts.join(" "));
  });
  return out;
}

/**
 * Every use of one of `names` other than as the callee of a direct call (an alias, `.call`, an optional or
 * parenthesised call, a value passed on, a re-export, a list element). The import clause itself is judged by
 * unreviewedImports. Returns descriptions; empty means every use is a direct call.
 */
export function indirectNameReferences(source, names) {
  const programs = parseAll(source);
  if (programs.length === 0) return [`unparseable source, so the use of ${names.join(", ")} cannot be read`];
  const out = new Set();
  for (const { ast } of programs) {
    walkAll(ast, (n, anc) => {
      if (n.type === "Identifier" && names.includes(n.name)) {
        const parent = anc[anc.length - 1];
        if (parent && (parent.type === "ImportSpecifier" || parent.type === "ImportDefaultSpecifier" || parent.type === "ImportNamespaceSpecifier")) return;
        if (parent && parent.type === "CallExpression" && parent.callee === n && !parent.optional && !(anc[anc.length - 2] && anc[anc.length - 2].type === "ChainExpression")) return;
        out.add(`${n.name} at offset ${n.start}`);
      } else if (n.type === "Literal" && typeof n.value === "string" && names.includes(n.value)) {
        const parent = anc[anc.length - 1];
        if (parent && (parent.type === "ImportDeclaration" || parent.type === "ExportAllDeclaration" || parent.type === "ExportNamedDeclaration" && parent.source === n)) return;
        out.add(`"${n.value}" at offset ${n.start}`);
      }
    });
  }
  return [...out].sort();
}

/**
 * Every reference to `moduleName` (with or without the node: prefix) other than one static import declaration
 * whose specifiers are exactly unaliased named imports from `names`. A namespace, a default, an alias, a quoted
 * name, a side-effect import, a re-export, a dynamic import and a require are all unreviewed.
 */
export function unreviewedImports(source, moduleName, names) {
  const programs = parseAll(source);
  if (programs.length === 0) return ["unparseable source"];
  const bare = moduleName.replace(/^node:/, "");
  const matches = (spec) => spec === bare || spec === "node:" + bare || spec.startsWith(bare + "/") || spec.startsWith("node:" + bare + "/");
  const out = new Set();
  for (const { ast } of programs) {
    walkAll(ast, (n, anc) => {
      if (n.type === "ImportDeclaration" && matches(String(n.source.value))) {
        const specs = n.specifiers;
        const ok = String(n.source.value) === moduleName && specs.length > 0 && specs.every((s) => s.type === "ImportSpecifier" && s.imported.type === "Identifier" && s.local.type === "Identifier" && s.imported.name === s.local.name && names.includes(s.imported.name));
        if (!ok) out.add(`import of ${n.source.value} at offset ${n.start} binds more than the reviewed names, or aliases them`);
      } else if ((n.type === "ExportNamedDeclaration" || n.type === "ExportAllDeclaration") && n.source && matches(String(n.source.value))) {
        out.add(`re-export from ${n.source.value} at offset ${n.start}`);
      } else if (n.type === "ImportExpression") {
        const lit = staticString(n.source);
        if (lit === null || matches(lit)) out.add(`dynamic import of ${lit ?? "a non-literal"} at offset ${n.start}`);
      } else if (n.type === "CallExpression") {
        const c = unwrap(n.callee);
        if (c && c.type === "Identifier" && c.name === "require") {
          const lit = n.arguments[0] ? staticString(n.arguments[0]) : null;
          if (lit === null || matches(lit)) out.add(`require of ${lit ?? "a non-literal"} at offset ${n.start}`);
        }
      }
    });
  }
  return [...out].sort();
}

// ---------------------------------------------------------------------------------------------------------------
// The ambient-access guard for a pinned vendored tree

const sha256 = (text) => crypto.createHash("sha256").update(text).digest("hex");

/**
 * The ambient-access offenders of a vendored file: every identifier or string naming a network primitive, a
 * global object, a loader, or a code runner (AMBIENT_NAMES). `carveOut` is { sha256, selfOccurrences }: it excuses
 * ONLY the occurrences of the identifier `self` that resolve to a local binding declared in this very file, and
 * only when the file's bytes hash to the pinned value and the number of such occurrences is the pinned number.
 * It is never a directory or a file-name exemption: change the file, or add a use of `self`, and it ends.
 */
export function ambientOffenders(source, carveOut = null) {
  const out = [];
  const programs = parseAll(source);
  if (programs.length === 0) return ["unparseable: the ambient-access guard cannot read this file"];
  const names = new Set(AMBIENT_NAMES);
  const pinned = carveOut && sha256(Buffer.from(source, "utf8")) === carveOut.sha256;
  let exempt = 0;
  for (const { ast, sourceType } of programs) {
    const analysis = new Analysis(ast, sourceType, { limits: DEFAULT_LIMITS, dynamicCode: true }, new Sink(true));
    analysis.build(ast, null);
    analysis.resolvePending();
    const walkScoped = (node, scope, anc) => {
      const sc = analysis.scopeOf.get(node) ?? scope;
      if (node.type === "Identifier" && names.has(node.name)) {
        const local = lookup(sc, node.name);
        const isRef = !(anc.length && anc[anc.length - 1].type === "MemberExpression" && anc[anc.length - 1].property === node && !anc[anc.length - 1].computed) && !(anc.length && anc[anc.length - 1].type === "Property" && anc[anc.length - 1].key === node && !anc[anc.length - 1].computed);
        if (pinned && node.name === "self" && local && isRef) exempt += 1;
        else out.push(`ambient name ${node.name} at offset ${node.start}`);
      } else if ((node.type === "Literal" && typeof node.value === "string" && names.has(node.value)) || (node.type === "TemplateLiteral" && staticString(node) !== null && names.has(staticString(node)))) {
        const parent = anc[anc.length - 1];
        if (!(parent && (parent.type === "ImportDeclaration" || parent.type === "ExportAllDeclaration"))) out.push(`ambient name "${staticString(node)}" as a string at offset ${node.start}`);
      }
      anc.push(node);
      for (const c of childNodes(node)) walkScoped(c, sc, anc);
      anc.pop();
    };
    walkScoped(ast, null, []);
  }
  if (carveOut) {
    const perProgram = programs.length;
    if (pinned && exempt !== carveOut.selfOccurrences * perProgram) out.push(`the pinned local-variable self occurrences changed: found ${exempt / perProgram}, pinned ${carveOut.selfOccurrences}`);
    if (!pinned) out.push("the carve-out does not apply: the file is not the pinned bytes");
  }
  return out;
}
