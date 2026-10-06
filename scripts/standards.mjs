#!/usr/bin/env node
// AIStandards CLI.
//
// TWO COMMANDS, DELIBERATELY SEPARATE.
//
//   audit     evidence discovery. No status, no score, no policy required. It reports what is
//             there and what it could not see. It never produces a verdict, and it says so.
//   validate  the policy-aware verdict.
//
// They are separate because evidence and judgement are separate things, and a single command that
// produced both would eventually have one read as the other. `audit` is what you run to understand a
// repository; `validate` is what you gate on.
//
// DETECTORS ARE NOT A PLUGIN REGISTRY. They are plain functions called in a fixed, commented
// sequence below. Descriptive detectors run first and bind to no rule; judgmental ones follow.
// EVALUATED_RULES declares exactly which rules any detector examines, and everything outside it is
// reported as unevaluated rather than passing by omission.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { loadCatalog, assertBindings, coverage, CatalogError, REPO_ROOT } from "./catalog.mjs";
import { resolvePolicyPath, loadPolicy, assertVersionIdentity, applyPolicy, PolicyError, POLICY_BASENAME } from "./policy.mjs";
import { evaluate, envelope, distinction, STATUS, DISPOSITION } from "./compliance.mjs";
import { splitSource, isCode, extensionOf } from "./source.mjs";
import { inspectScaffolding } from "./scaffolding.mjs";
import { MANIFEST_NAMES, classifyManifest, manifestToolNames } from "./manifest.mjs";
import { TOOLPERM_NAMES, classifyToolPermissions, compareToolNames } from "./toolperms.mjs";
import { runInitCommand } from "./init.mjs";
import { validate as validateSchema } from "./jsonschema.mjs";

const EXIT_OK = 0;
const EXIT_FINDINGS = 1;   // a project-level failure
const EXIT_INVOCATION = 2; // a CONFIGURATION error: missing policy, bad flags, version mismatch
const EXIT_BLOCKED = 3;    // a structural integrity breach

const FRAMEWORK_VERSION = fs.readFileSync(path.join(REPO_ROOT, "VERSION"), "utf8").trim();

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const SCHEMAS = {
  policy: readJson(path.join(REPO_ROOT, "schemas", "ai-policy.schema.json")),
  manifest: readJson(path.join(REPO_ROOT, "schemas", "ai-system-manifest.schema.json")),
  toolPermissions: readJson(path.join(REPO_ROOT, "schemas", "tool-permissions.schema.json")),
};

// ---------------------------------------------------------------------------------------------
// Evidence collection
// ---------------------------------------------------------------------------------------------

// Directories this tool decides not to read. `not-project-evidence` is never project content.
// `framework` is this tool's own judgement, and it is the only kind that invalidates completeness —
// which is why it is recorded separately and why the rules that depend on a complete walk are
// withdrawn when it happens.
const SKIP = new Map([
  [".git", "not-project-evidence"],
  ["node_modules", "not-project-evidence"],
  ["test/fixtures", "framework"],
]);

const MAX_BYTES = 512 * 1024;

function collectFiles(root) {
  const surface = {
    root,
    filesCollected: 0,
    excludedDirectories: [],
    frameworkExcludedDirectories: [],
    unreadableFiles: [],
  };
  const files = [];

  const walk = (dir, rel) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      surface.unreadableFiles.push(rel || ".");
      return;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        const authorizedBy = SKIP.get(entry.name) ?? SKIP.get(childRel);
        if (authorizedBy) {
          surface.excludedDirectories.push({ path: childRel, authorizedBy });
          if (authorizedBy === "framework") surface.frameworkExcludedDirectories.push(childRel);
          continue;
        }
        walk(path.join(dir, entry.name), childRel);
      } else if (entry.isFile()) {
        files.push(childRel);
      }
    }
  };
  walk(root, "");
  surface.filesCollected = files.length;
  return { files, surface };
}

// A failed read and an empty file are not the same value, so this never returns a bare string.
function readText(root, rel) {
  try {
    const full = path.join(root, rel);
    const stat = fs.statSync(full);
    if (stat.size > MAX_BYTES) {
      return { ok: true, text: fs.readFileSync(full, "utf8").slice(0, MAX_BYTES), truncated: true };
    }
    return { ok: true, text: fs.readFileSync(full, "utf8"), truncated: false };
  } catch {
    return { ok: false, text: "", truncated: false };
  }
}

// ---------------------------------------------------------------------------------------------
// The run
// ---------------------------------------------------------------------------------------------

// Rules whose evidence is derived from reading repository content. When the walk was shortened by
// a FRAMEWORK exclusion, these are withdrawn to not-evaluated: a search that did not cover the
// repository cannot report that the repository is clean.
const CONTENT_DERIVED_RULES = [
  "promptsec.prompt-is-versioned-artifact",
  "promptsec.no-inline-system-prompt",
  "misuse.safety-controls-not-disabled",
];

// Exactly which rules a detector in this release examines. Everything else in the catalog is
// reported skipped / not-evaluated. A test asserts this list and the detectors' bindings agree in
// both directions, so the two cannot drift apart silently.
export const EVALUATED_RULES = [
  "lifecycle.manifest-exists",
  "lifecycle.manifest-valid",
  "lifecycle.manifest-not-scaffold",
  "lifecycle.model-version-pinned",
  "gate.tool-permission-manifest",
  "gate.actions-classified",
  "promptsec.prompt-is-versioned-artifact",
  "promptsec.no-inline-system-prompt",
  "misuse.safety-controls-not-disabled",
];

function createRun(root) {
  const { files, surface } = collectFiles(root);
  return {
    root,
    files,
    surface,
    findings: [],
    observations: [],
    invariantViolations: [],
    aiSurface: { manifest: null, promptAssets: [], toolDefinitions: [] },
    manifest: null,
    toolPermissions: null,

    // The single writer. `rule` is null for descriptive findings, because binding an observation to
    // a rule would manufacture a verdict out of it.
    addFinding({ id, category, severity = "info", label, message, evidence = [], rule = null, standardRef = null, remediation = null }) {
      this.findings.push({ id, category, severity, label, message, evidence, rule, standardRef, remediation });
    },

    // A judgement about a rule. `violation` means one was confirmed; `unknown` means the check
    // could not run, which is never a pass.
    observe({ rule, violation = false, unknown = false, message, evidence = [] }) {
      this.observations.push({ rule, violation, unknown, message, evidence });
    },

    breakInvariant({ id, message, evidence = [] }) {
      this.invariantViolations.push({ id, message, evidence });
    },
  };
}

// --- Descriptive detectors: they observe, they do not judge -----------------------------------

// The manifest and the permission file are classified once, from their text, by manifest.mjs and
// toolperms.mjs; the detectors below read that classification instead of re-deriving it.

function detectManifestPresence(run) {
  const found = run.files.find((f) => MANIFEST_NAMES.includes(f));
  run.aiSurface.manifest = found ?? null;
  if (!found) return;
  const read = readText(run.root, found);
  if (!read.ok) {
    run.addFinding({ id: "manifest-unreadable", category: "surface", severity: "warning", label: "OBSERVED", message: `${found} could not be read`, evidence: [found] });
    return;
  }
  run.manifestClass = classifyManifest(read.text);
  if (run.manifestClass.status === "unparseable") {
    run.manifestParseError = run.manifestClass.parseError;
    run.addFinding({ id: "detected-manifest", category: "surface", severity: "warning", label: "OBSERVED", message: `Manifest at ${found} does not parse: ${run.manifestParseError}`, evidence: [found] });
    return;
  }
  run.manifest = run.manifestClass.document;
  run.addFinding({ id: "detected-manifest", category: "surface", label: "OBSERVED", message: `AI system manifest at ${found}`, evidence: [found] });
}

function detectToolPermissions(run) {
  const found = run.files.find((f) => TOOLPERM_NAMES.includes(f));
  run.toolPermissionsPath = found ?? null;
  if (!found) return;
  const read = readText(run.root, found);
  if (!read.ok) return;
  run.toolPermissionsClass = classifyToolPermissions(read.text);
  if (run.toolPermissionsClass.status === "unparseable") run.toolPermissionsParseError = run.toolPermissionsClass.parseError;
  else run.toolPermissions = run.toolPermissionsClass.document;
}

function detectPromptAssets(run) {
  const assets = run.files.filter(
    (f) => /(^|\/)prompts?\//i.test(f) || /\.prompt\.(md|txt|yml|yaml)$/i.test(f),
  );
  run.aiSurface.promptAssets = assets;
  if (assets.length > 0) {
    run.addFinding({ id: "detected-prompt-assets", category: "surface", label: "OBSERVED", message: `${assets.length} prompt asset(s)`, evidence: assets.slice(0, 20) });
  }
}

function detectToolDefinitions(run) {
  const declared = manifestToolNames(run.manifest);
  run.aiSurface.toolDefinitions = declared;
  if (declared.length > 0) {
    run.addFinding({ id: "detected-tools", category: "surface", label: "OBSERVED", message: `${declared.length} tool(s) declared in the manifest`, evidence: declared });
  }
}

// --- Judgmental detectors, full assurance ------------------------------------------------------

// GENERATED SCAFFOLDING IS NOT EVIDENCE, for any rule that reads it. A scaffold manifest is
// schema-valid by construction, so before this existed it made manifest-exists and manifest-valid
// pass, and made both gate rules pass vacuously because it declares no tools — a bootstrap writing
// the evidence its own evaluator then accepted, which is the incident scaffolding.mjs exists to
// prevent. Where the file is a scaffold, every rule that would have read it reports not-evaluated;
// only lifecycle.manifest-not-scaffold reports on the scaffold itself. A violation the file
// genuinely contains (unparseable, schema-invalid) still stands, because scaffolding never erases a
// finding.
function manifestIsScaffold(run) {
  return Boolean(run.manifestClass?.scaffold);
}

function toolPermissionsAreScaffold(run) {
  return Boolean(run.toolPermissionsClass?.scaffold);
}

function detectMissingManifest(run) {
  if (run.aiSurface.manifest) {
    if (manifestIsScaffold(run)) {
      run.observe({
        rule: "lifecycle.manifest-exists",
        unknown: true,
        message: `The file at ${run.aiSurface.manifest} is generated scaffolding, which is not evidence that a manifest was written.`,
        evidence: [run.aiSurface.manifest],
      });
      return;
    }
    run.observe({ rule: "lifecycle.manifest-exists", message: `Manifest present at ${run.aiSurface.manifest}.`, evidence: [run.aiSurface.manifest] });
    return;
  }
  run.observe({
    rule: "lifecycle.manifest-exists",
    violation: true,
    message: `No AI system manifest found. Expected one of: ${MANIFEST_NAMES.join(", ")}.`,
  });
}

function detectInvalidManifest(run) {
  if (!run.aiSurface.manifest) {
    // Absent rather than invalid. Reporting "invalid" for a file that does not exist would be a
    // second failure for one cause, and lifecycle.manifest-exists already carries it.
    run.observe({ rule: "lifecycle.manifest-valid", unknown: true, message: "No manifest to validate." });
    return;
  }
  if (run.manifestParseError != null) {
    run.observe({ rule: "lifecycle.manifest-valid", violation: true, message: `Manifest does not parse: ${run.manifestParseError}`, evidence: [run.aiSurface.manifest] });
    return;
  }
  const problems = run.manifestClass ? run.manifestClass.problems : validateSchema(run.manifest, SCHEMAS.manifest);
  if (problems.length > 0) {
    run.observe({ rule: "lifecycle.manifest-valid", violation: true, message: `Manifest does not conform to its schema: ${problems[0]}`, evidence: problems.slice(0, 10) });
    return;
  }
  if (manifestIsScaffold(run)) {
    run.observe({
      rule: "lifecycle.manifest-valid",
      unknown: true,
      message: "The manifest is generated scaffolding. It conforms to the schema by construction, and that is not evidence about the system.",
      evidence: [run.aiSurface.manifest],
    });
    return;
  }
  run.observe({ rule: "lifecycle.manifest-valid", message: "Manifest conforms to its schema.", evidence: [run.aiSurface.manifest] });
}

function detectScaffoldManifest(run) {
  if (!run.aiSurface.manifest || run.manifestParseError != null) {
    run.observe({ rule: "lifecycle.manifest-not-scaffold", unknown: true, message: "No readable manifest to inspect for scaffolding." });
    return;
  }
  const { scaffold, reasons, placeholders } = run.manifestClass ?? inspectScaffolding(run.manifest);
  if (scaffold) {
    run.observe({
      rule: "lifecycle.manifest-not-scaffold",
      violation: true,
      message: `Manifest is generated scaffolding and not evidence: ${reasons.join("; ")}.`,
      evidence: placeholders.slice(0, 10),
    });
    return;
  }
  run.observe({ rule: "lifecycle.manifest-not-scaffold", message: "Manifest is not a template. That is a lower bar than being true." });
}

function detectMissingToolPermissions(run) {
  const declaredTools = run.aiSurface.toolDefinitions;
  if (!run.aiSurface.manifest || run.manifestParseError != null) {
    run.observe({ rule: "gate.tool-permission-manifest", unknown: true, message: "No readable manifest, so whether tools exist is unknown." });
    return;
  }
  if (manifestIsScaffold(run)) {
    run.observe({ rule: "gate.tool-permission-manifest", unknown: true, message: "The manifest is generated scaffolding, so whether the system has tools is not established." });
    return;
  }
  if (declaredTools.length === 0) {
    run.observe({ rule: "gate.tool-permission-manifest", message: "The manifest declares no tools, so no permission manifest is owed." });
    return;
  }
  if (!run.toolPermissionsPath) {
    run.observe({
      rule: "gate.tool-permission-manifest",
      violation: true,
      message: `The manifest declares ${declaredTools.length} tool(s) and there is no tool permission manifest. A tool nobody declared is a tool nothing gates.`,
      evidence: declaredTools,
    });
    return;
  }
  if (toolPermissionsAreScaffold(run)) {
    run.observe({
      rule: "gate.tool-permission-manifest",
      unknown: true,
      message: `The file at ${run.toolPermissionsPath} is generated scaffolding, which is not evidence that the declared tools were classified.`,
      evidence: [run.toolPermissionsPath],
    });
    return;
  }
  run.observe({ rule: "gate.tool-permission-manifest", message: `Tool permission manifest present at ${run.toolPermissionsPath}.`, evidence: [run.toolPermissionsPath] });
}

function detectUndeclaredTool(run) {
  const declaredTools = run.aiSurface.toolDefinitions;
  if (manifestIsScaffold(run)) {
    run.observe({ rule: "gate.actions-classified", unknown: true, message: "The manifest is generated scaffolding, so the tool list is not established." });
    return;
  }
  if (declaredTools.length === 0) {
    if (!run.aiSurface.manifest || run.manifestParseError != null) {
      run.observe({ rule: "gate.actions-classified", unknown: true, message: "No readable manifest, so the tool list is unknown." });
      return;
    }
    run.observe({ rule: "gate.actions-classified", message: "No tools declared, so there is nothing to classify." });
    return;
  }
  if (!run.toolPermissionsPath) {
    run.observe({ rule: "gate.actions-classified", unknown: true, message: "No permission manifest, so impact classes cannot be read." });
    return;
  }
  if (run.toolPermissionsParseError != null) {
    run.observe({ rule: "gate.actions-classified", unknown: true, message: `Permission manifest does not parse: ${run.toolPermissionsParseError}` });
    return;
  }
  const problems = run.toolPermissionsClass ? run.toolPermissionsClass.problems : validateSchema(run.toolPermissions, SCHEMAS.toolPermissions);
  if (problems.length > 0) {
    run.observe({ rule: "gate.actions-classified", violation: true, message: `Permission manifest does not conform: ${problems[0]}`, evidence: problems.slice(0, 10) });
    return;
  }
  if (toolPermissionsAreScaffold(run)) {
    run.observe({ rule: "gate.actions-classified", unknown: true, message: "The permission manifest is generated scaffolding, so no impact class was declared by anyone.", evidence: [run.toolPermissionsPath] });
    return;
  }
  const { classified, missing } = compareToolNames(run.toolPermissions, declaredTools);
  if (missing.length > 0) {
    run.observe({
      rule: "gate.actions-classified",
      violation: true,
      message: `Tool(s) declared in the manifest carry no impact class: ${missing.join(", ")}.`,
      evidence: missing,
    });
    return;
  }
  run.observe({ rule: "gate.actions-classified", message: "Every declared tool carries an impact class. Whether the class is correct is a human judgement.", evidence: [...classified] });
}

// --- Judgmental detectors, partial assurance ---------------------------------------------------

// Alias shapes that name a moving target. Deliberately a maintained list of exact shapes rather
// than a general heuristic. An unrecognised spelling is not seen. The rule's assurance is partial,
// so a clean observation reports as not-evaluated, never passed (Standard 5 R6, Q13).
const FLOATING_ALIAS = /(^|[-@:/])(latest|preview|current|stable|edge|nightly)$/i;

function detectFloatingModelAlias(run) {
  if (!run.aiSurface.manifest || run.manifestParseError != null) {
    run.observe({ rule: "lifecycle.model-version-pinned", unknown: true, message: "No readable manifest, so model identifiers are unknown." });
    return;
  }
  const models = Array.isArray(run.manifest?.models) ? run.manifest.models : [];
  if (models.length === 0) {
    run.observe({ rule: "lifecycle.model-version-pinned", unknown: true, message: "The manifest declares no models, so nothing could be checked for pinning." });
    return;
  }
  const floating = models.map((m) => m?.id).filter((id) => typeof id === "string" && FLOATING_ALIAS.test(id));
  if (floating.length > 0) {
    run.observe({
      rule: "lifecycle.model-version-pinned",
      violation: true,
      message: `Model identifier(s) name a moving alias rather than a version: ${floating.join(", ")}.`,
      evidence: floating,
    });
    return;
  }
  run.observe({
    rule: "lifecycle.model-version-pinned",
    message: "No declared model names a recognised moving alias. The string is pinned; that is not the same as the weights being pinned.",
    evidence: models.map((m) => m?.id).filter(Boolean),
  });
}

// Parameter names that carry model instructions across the common provider SDKs.
// The name may be quoted, `"system": "..."`: the code-only view keeps a quoted property NAME and
// blanks every other string, so the optional quote after the name is only ever a key's closing quote.
// A listed name is not the suffix of a longer key: it is rejected after any letter (Unicode, so `pré-system`),
// digit or underscore, with or without a run of hyphens between (`x-system`, `x--system`). A run of
// hyphens after whitespace, a quote or a bracket is a flag (`--system="..."`), and a dot is an attribute
// access (`options.system = "..."`); both still name the parameter.
const INSTRUCTION_PARAM = /(?<![\p{L}\p{N}_]-*)\b(system|system_prompt|systemPrompt|instructions|systemInstruction)["']?\s*[:=]\s*(["'`])/gu;
const INLINE_THRESHOLD = 200;

// Measure the quoted literal that opens at `start` in the ORIGINAL text, and return the length of its
// body, or -1 when it is not terminated on its line (a template literal may span lines). A backslash
// skips the next character, so an escaped quote does not end the literal.
function measureLiteral(text, start) {
  const quote = text[start];
  let end = start + 1;
  while (end < text.length) {
    if (text[end] === "\\") { end += 2; continue; }
    if (text[end] === quote) break;
    if (text[end] === "\n" && quote !== "`") return -1;
    end += 1;
  }
  return end - start - 1;
}

// Two further shapes of the same problem, each its OWN detection shape with its own name in the
// evidence. Both read the code-only view (index-aligned with the text, strings blanked except a quoted
// property NAME) to find KEYS, and the original text to measure the literal a key holds.
//
//   message role shape        a message object whose `role` is the quoted word `system` (a bare
//                             `system` in YAML) and whose `content` is a quoted literal, in either key
//                             order: `{"role": "system", "content": "..."}`, and the YAML list-of-messages
//                             form. The `content` must be a key of the SAME object (or YAML mapping) that
//                             holds the role, not of a nested or neighbouring one.
//   systemInstruction parts   the Gemini object form `systemInstruction: { parts: [{ text: "..." }] }`,
//   shape                     also spelled `system_instruction`: a `text` key inside the `parts` of the
//                             object.
//
// A role is a key only when it opens a mapping entry (the previous code character is `{` or `,`, or it
// begins a YAML line after any `- ` markers) and its separator is `:`. So `const role = "system"`, a
// keyword argument, a ternary branch and a hyphenated or prefixed name are not the key. Not claimed:
// a role or content held in a variable, template-literal or concatenated content, content that is an
// array of typed parts, the `developer` role, TOML tables, keyword-argument constructors, block scalars,
// and block-style YAML `systemInstruction` (Standard 21, "The detector for R1 and R2").
const KEY_PREFIX = String.raw`(?<![\w$-])(["']?)`;
const ROLE_KEY = new RegExp(String.raw`${KEY_PREFIX}role\1[ \t\r\n]*:[ \t\r\n]*`, "g");
const SYSTEM_BARE = /system(?=[ \t]*(?:\r?\n|$|[,}]))/y;
const CONTENT_KEY = /(["']?)content\1[ \t\r\n]*:[ \t\r\n]*(["'])/y;
const PARTS_KEY = /(["']?)parts\1[ \t\r\n]*:[ \t\r\n]*(?=[[{])/y;
const TEXT_KEY = new RegExp(String.raw`${KEY_PREFIX}text\1[ \t\r\n]*:[ \t\r\n]*(["'])`, "g");
const SYSTEM_INSTRUCTION_KEY = new RegExp(String.raw`${KEY_PREFIX}(?:system_instruction|systemInstruction)\1[ \t\r\n]*[:=][ \t\r\n]*\{`, "g");

const OPENERS = "{[(";
const CLOSERS = "}])";

// Index of the bracket that closes the one opening at `open`, or -1. Strings and comments are blanked
// in the view, so a bracket inside one is not counted.
function matchClose(view, open) {
  let depth = 0;
  for (let k = open; k < view.length; k += 1) {
    if (OPENERS.includes(view[k])) depth += 1;
    else if (CLOSERS.includes(view[k])) {
      depth -= 1;
      if (depth === 0) return k;
    }
  }
  return -1;
}

// Index of the `{` that directly encloses `idx`, or -1 when the innermost open bracket is not a brace.
function enclosingBrace(view, idx) {
  let depth = 0;
  for (let k = idx - 1; k >= 0; k -= 1) {
    if (CLOSERS.includes(view[k])) depth += 1;
    else if (OPENERS.includes(view[k])) {
      if (depth === 0) return view[k] === "{" ? k : -1;
      depth -= 1;
    }
  }
  return -1;
}

// True when the code character before `idx` is the `?` of a ternary: in `ok ? system : "..."` the word is
// an operand and the colon is the ternary's, so the word is not a key. (A quoted name in operand position
// is already blanked in the view, so only a bare name reaches this check.)
// In YAML there is no ternary: a `?` that begins a line (after any `- ` markers) or follows `{`, `[` or `,`
// is the explicit-key indicator, `? system\n: "..."`, and the word after it IS a key (Codex review of
// PR #98). A `?` after other text in YAML stays a plain-scalar character, which is not a key either.
const SAME_LINE_KEY = /[^\s:]+[ \t]*:/y;
function followsTernaryMark(view, idx, yaml = false) {
  let k = idx - 1;
  while (k >= 0 && /\s/.test(view[k])) k -= 1;
  if (k < 0 || view[k] !== "?") return false;
  if (!yaml) return true;
  // The indicator must be separated from the key by whitespace: `?system` is a plain key named `?system`.
  if (!/\s/.test(view[k + 1])) return true;
  const lineStart = view.lastIndexOf("\n", k - 1) + 1;
  if (/^[ \t]*(?:-[ \t]+)*$/.test(view.slice(lineStart, k))) {
    // Block form: a name whose `:` is on the same line (`? system: "..."`) is an inline mapping used as
    // the complex KEY, so the literal is inside a key and not the entry's value. Only a name whose colon
    // starts a later line (`? system` then `: "..."`) is the explicit key (Codex review of PR #103).
    SAME_LINE_KEY.lastIndex = idx;
    return SAME_LINE_KEY.test(view);
  }
  let p = k - 1;
  while (p >= 0 && /\s/.test(view[p])) p -= 1;
  return !(p >= 0 && "{[,".includes(view[p]));
}

// True when the role literal that ends just before `after` is the WHOLE value: what follows must close the
// entry, so `"system" + "-admin"`, `"system".toUpperCase()`, `"system" || x` and `"system" ? a : b` do not
// name the system role. In braced code the entry ends at `,` or `}`, after an optional TypeScript
// `as const`; in YAML it ends at the line, or at `,` or `}` in flow style. Comments are blanked in the
// view, so a trailing comment is whitespace here.
const CLOSES_ENTRY_CODE = /\s*(?:as[ \t\r\n]+const\s*)?[,}]/y;
const CLOSES_ENTRY_YAML = /[ \t]*(?:\r?\n|$|[,}])/y;
function closesEntry(view, after, yaml) {
  const re = yaml ? CLOSES_ENTRY_YAML : CLOSES_ENTRY_CODE;
  re.lastIndex = after;
  return re.test(view);
}

// True when the key at `idx` opens a mapping entry in a braced object: the previous code character is
// `{` or `,`; in YAML also `[`, since a flow sequence's item may be an implicit single-pair mapping,
// `[systemInstruction: {...}]` (Codex review of PR #98). In code `[` opens an array or a TypeScript tuple
// type, whose `name: type` elements are labels and not keys.
function opensEntry(view, idx, yaml = false) {
  for (let k = idx - 1; k >= 0; k -= 1) {
    if (/\s/.test(view[k])) continue;
    return view[k] === "{" || view[k] === "," || (yaml && view[k] === "[");
  }
  return false;
}

// Longest quoted `content` literal among the keys of the object (open..close), at its own depth only.
function contentInObject(view, text, open, close) {
  let longest = -1;
  let depth = 0;
  let expectKey = true;
  for (let k = open + 1; k < close; k += 1) {
    const ch = view[k];
    if (/\s/.test(ch)) continue;
    if (depth === 0 && expectKey) {
      CONTENT_KEY.lastIndex = k;
      const m = CONTENT_KEY.exec(view);
      if (m) longest = Math.max(longest, measureLiteral(text, k + m[0].length - 1));
    }
    expectKey = false;
    if (OPENERS.includes(ch)) depth += 1;
    else if (CLOSERS.includes(ch)) depth -= 1;
    else if (ch === "," && depth === 0) expectKey = true;
  }
  return longest;
}

// The YAML block mapping that holds the key at `idx` (a key that begins its line, after any `- `
// markers): the start offsets of every key of that mapping, found by indentation. `col` is the key's
// column, which is the same for every key of one mapping, including a first key that follows `- `.
function yamlMappingKeys(view, idx, lineStart) {
  const col = idx - lineStart;
  const keys = [idx];
  const lineInfo = (start) => {
    const nl = view.indexOf("\n", start);
    const line = view.slice(start, nl === -1 ? view.length : nl);
    const lead = /^([ \t]*)((?:-[ \t]+)*)/.exec(line);
    return { line, nl, indent: lead[1].length, keyCol: lead[0].length, dashed: lead[2] !== "", blank: line.trim() === "" };
  };
  const boundary = (line) => /^(---|\.\.\.)/.test(line);

  // Upward, unless this key itself follows a `- ` marker: then it opens its item and nothing above is
  // in its mapping.
  if (/^[ \t]*$/.test(view.slice(lineStart, idx))) {
    let cur = lineStart;
    while (cur > 0) {
      const start = view.lastIndexOf("\n", cur - 2) + 1;
      const info = lineInfo(start);
      cur = start;
      if (info.blank) continue;
      if (boundary(info.line)) break;
      if (info.dashed && info.indent < col) {
        if (info.keyCol === col) keys.push(start + col);
        break;
      }
      if (info.indent === col && !info.dashed) keys.push(start + col);
      else if (info.indent < col) break;
    }
  }

  // Downward: keys at the same column belong; a shallower line ends the mapping.
  let next = view.indexOf("\n", idx);
  while (next !== -1 && next + 1 < view.length) {
    const start = next + 1;
    const info = lineInfo(start);
    next = info.nl;
    if (info.blank) continue;
    if (boundary(info.line)) break;
    if (info.indent < col) break;
    if (info.indent === col && !info.dashed) keys.push(start + col);
  }
  return keys;
}

function messageRoleLength(view, text, yaml) {
  let longest = -1;
  ROLE_KEY.lastIndex = 0;
  for (let m = ROLE_KEY.exec(view); m; m = ROLE_KEY.exec(view)) {
    const idx = m.index;
    const valueAt = idx + m[0].length;
    let isSystem = false;
    if (view[valueAt] === "\"" || view[valueAt] === "'") {
      const body = measureLiteral(text, valueAt);
      isSystem = body === "system".length && text.slice(valueAt + 1, valueAt + 1 + body) === "system"
        && closesEntry(view, valueAt + body + 2, yaml);
    } else if (yaml) {
      SYSTEM_BARE.lastIndex = valueAt;
      isSystem = SYSTEM_BARE.test(view);
    }
    if (!isSystem) continue;

    if (opensEntry(view, idx)) {
      const open = enclosingBrace(view, idx);
      if (open !== -1) {
        const close = matchClose(view, open);
        if (close !== -1) longest = Math.max(longest, contentInObject(view, text, open, close));
        continue;
      }
    }
    if (!yaml) continue;
    const lineStart = view.lastIndexOf("\n", idx - 1) + 1;
    if (!/^[ \t]*(?:-[ \t]+)*$/.test(view.slice(lineStart, idx))) continue;
    for (const key of yamlMappingKeys(view, idx, lineStart)) {
      CONTENT_KEY.lastIndex = key;
      const c = CONTENT_KEY.exec(view);
      if (c) longest = Math.max(longest, measureLiteral(text, key + c[0].length - 1));
    }
  }
  return longest;
}

// After the name, a `:` makes it a mapping KEY only where an entry can open: after `{` or `,` (or, in YAML,
// at the start of a line after any `- ` markers). Anywhere else the colon is a ternary's or a label's. An
// `=` assignment or keyword argument is not constrained.
function isInstructionKey(view, match, yaml) {
  if (/=[ \t\r\n]*\{$/.test(match[0])) return true;
  if (opensEntry(view, match.index, yaml)) return true;
  if (!yaml) return false;
  const lineStart = view.lastIndexOf("\n", match.index - 1) + 1;
  return /^[ \t]*(?:-[ \t]+)*$/.test(view.slice(lineStart, match.index));
}

function systemInstructionPartsLength(view, text, yaml) {
  let longest = -1;
  SYSTEM_INSTRUCTION_KEY.lastIndex = 0;
  for (let m = SYSTEM_INSTRUCTION_KEY.exec(view); m; m = SYSTEM_INSTRUCTION_KEY.exec(view)) {
    if (!isInstructionKey(view, m, yaml)) continue;
    const open = m.index + m[0].length - 1;
    const close = matchClose(view, open);
    if (close === -1) continue;
    // `parts` is a key of the systemInstruction object itself; `text` is searched only inside its value.
    let depth = 0;
    let expectKey = true;
    for (let k = open + 1; k < close; k += 1) {
      const ch = view[k];
      if (/\s/.test(ch)) continue;
      if (depth === 0 && expectKey) {
        PARTS_KEY.lastIndex = k;
        const p = PARTS_KEY.exec(view);
        if (p) {
          const valueOpen = k + p[0].length;
          const valueClose = matchClose(view, valueOpen);
          if (valueClose !== -1) {
            const inside = view.slice(valueOpen, valueClose);
            TEXT_KEY.lastIndex = 0;
            for (let t = TEXT_KEY.exec(inside); t; t = TEXT_KEY.exec(inside)) {
              if (!opensEntry(inside, t.index, yaml)) continue;
              const literal = valueOpen + t.index + t[0].length - 1;
              longest = Math.max(longest, measureLiteral(text, literal));
            }
          }
        }
      }
      expectKey = false;
      if (OPENERS.includes(ch)) depth += 1;
      else if (CLOSERS.includes(ch)) depth -= 1;
      else if (ch === "," && depth === 0) expectKey = true;
    }
  }
  return longest;
}

function detectInlineSystemPrompt(run, withdrawn) {
  const rules = ["promptsec.prompt-is-versioned-artifact", "promptsec.no-inline-system-prompt"];

  // A shortened walk withdraws a CLEAN result, never a finding: a violation in a file that was
  // collected is a violation whatever else was excluded. So the files are always scanned, and the
  // withdrawal applies only when nothing was found.
  const hits = [];
  for (const file of run.files) {
    if (!isCode(file)) continue;
    const read = readText(run.root, file);
    if (!read.ok) continue;
    const split = splitSource(read.text, file);
    if (!split.usable) continue;

    // Find the parameter in the CODE view of the file (comments, and the bodies of string literals,
    // blanked in place), so a match that merely sits in a comment or inside a quoted mention is not
    // an instruction parameter. The view is index-aligned with the original text, which is where the
    // literal is measured, so the match's own opening quote is the literal's start. EVERY match is
    // measured, not the first: a short instruction earlier in a file does not describe a long one later.
    const view = split.codeOnly;
    const yaml = [".yml", ".yaml"].includes(extensionOf(file));
    INSTRUCTION_PARAM.lastIndex = 0;
    let longest = -1;
    for (let match = INSTRUCTION_PARAM.exec(view); match; match = INSTRUCTION_PARAM.exec(view)) {
      if (followsTernaryMark(view, match.index, yaml)) continue;
      const length = measureLiteral(read.text, match.index + match[0].length - 1);
      longest = Math.max(longest, length);
    }
    if (longest >= INLINE_THRESHOLD) hits.push(`${file} (${longest} chars)`);

    const role = messageRoleLength(view, read.text, yaml);
    if (role >= INLINE_THRESHOLD) hits.push(`${file} (${role} chars, message role shape)`);
    const gemini = systemInstructionPartsLength(view, read.text, yaml);
    if (gemini >= INLINE_THRESHOLD) hits.push(`${file} (${gemini} chars, systemInstruction parts shape)`);
  }

  if (hits.length > 0) {
    for (const rule of rules) {
      run.observe({ rule, violation: true, message: `Instruction literal of ${INLINE_THRESHOLD}+ characters passed inline at a model call site.`, evidence: hits.slice(0, 10) });
    }
    return;
  }
  if (withdrawn) {
    for (const rule of rules) {
      run.observe({ rule, unknown: true, message: "The walk was shortened by a framework exclusion, so absence of an inline prompt cannot be established.", evidence: run.surface.frameworkExcludedDirectories });
    }
    return;
  }
  for (const rule of rules) {
    run.observe({ rule, message: "No long instruction literal found at a model call site. A prompt assembled from fragments or fetched at runtime would not be seen." });
  }
}

// Exact literal spellings that disable a provider safety control. Maintained list, searched in code
// and literal positions only and never in comments, so prose describing these settings is never
// mistaken for using them.
const DISABLED_SAFETY = [
  "BLOCK_NONE",
  "OFF",
];
const SAFETY_KEY = /\b(safety_settings|safetySettings|moderation|content_filter|contentFilter|safety_mode|safetyMode|harm_block_threshold|harmBlockThreshold)\b/;

// The off-pattern: a key that switches a control, `:` or `=`, then `false` or a quoted `none` or
// `off`. Two shapes place a quoted value straight after such a key without assigning it, and only
// the quoted form is guarded against them:
//   a union type member, `moderation: "off" | "on"`: the value is followed by a single `|`. A `||`
//     is not guarded, because `"off" || fallback` evaluates to "off".
//   a ternary consequent, `strict ? moderation : "off"`: the key follows `?` (or `?` and a PHP `$`)
//     and the separator is `:`. A key followed by `=` there is an assignment and is not guarded.
//     Not applied to YAML, where `? moderation` opens an explicit key whose value is `: 'off'`.
const OFF_KEYS = String.raw`\b(?:moderation|content_filter|contentFilter|safety_mode|safetyMode)`;
const OFF_FALSE = new RegExp(String.raw`${OFF_KEYS}\s*[:=]\s*false`, "i");
const offQuoted = (ternaryGuard) => new RegExp(
  String.raw`(?:${ternaryGuard ? String.raw`(?<!\?\s*\$?)` : ""}${OFF_KEYS}\s*:|${OFF_KEYS}\s*=)` +
  String.raw`\s*(?:["']none["']|["']off["'])(?!\s*\|(?!\|))`,
  "i",
);
const OFF_QUOTED = offQuoted(true);
const OFF_QUOTED_YAML = offQuoted(false);

function detectDisabledSafetyControls(run, withdrawn) {
  const rule = "misuse.safety-controls-not-disabled";

  // As for the inline prompt: the files that were collected are always scanned. A shortened walk
  // withdraws only a clean result.
  const hits = [];
  for (const file of run.files) {
    if (!isCode(file)) continue;
    const read = readText(run.root, file);
    if (!read.ok) continue;
    const split = splitSource(read.text, file);
    if (!split.usable) continue;

    // The use/mention split is the whole point here: a README explaining why BLOCK_NONE is
    // dangerous, or a comment recording that it was removed, must not be a finding.
    //
    // The searched text is the file with its comments blanked in place, not the code partition
    // followed by the string partition. The off-pattern below needs a key, its separator and a
    // quoted value to stay adjacent as written. Concatenating the partitions moved every quoted
    // value to the end of the text, so `moderation: 'off'` matched only when nothing followed it
    // and `{ moderation: "off" }` never matched: the result depended on layout, not on the setting.
    const searchable = split.withoutComments;
    if (!SAFETY_KEY.test(searchable)) continue;
    for (const literal of DISABLED_SAFETY) {
      if (new RegExp(`\\b${literal}\\b`).test(searchable)) {
        hits.push(`${file} (${literal})`);
        break;
      }
    }
    const ext = extensionOf(file);
    const offQuotedHere = ext === ".yml" || ext === ".yaml" ? OFF_QUOTED_YAML : OFF_QUOTED;
    if (OFF_FALSE.test(searchable) || offQuotedHere.test(searchable)) {
      hits.push(`${file} (safety control set off)`);
    }
  }

  if (hits.length > 0) {
    run.observe({ rule, violation: true, message: "A model provider safety control is disabled in configuration.", evidence: [...new Set(hits)].slice(0, 10) });
    return;
  }
  if (withdrawn) {
    run.observe({ rule, unknown: true, message: "The walk was shortened by a framework exclusion, so absence of a disabled safety control cannot be established.", evidence: run.surface.frameworkExcludedDirectories });
    return;
  }
  run.observe({ rule, message: "No recognised disabled-safety literal found. A provider spelling not on the maintained list would not be seen." });
}

// --- Invariants --------------------------------------------------------------------------------

// A structural integrity breach, not a rule result. A policy claims a rule has no subject here,
// and a detector then observed the subject. Both cannot be true, and the honest response is to stop
// rather than to pick one — a verdict computed over a policy known to be false is not a verdict.
function checkApplicabilityContradictions(run, resolved) {
  for (const [id, entry] of resolved) {
    if (entry.applicable) continue;
    const violations = run.observations.filter((o) => o.rule === id && o.violation);
    if (violations.length > 0) {
      run.breakInvariant({
        id: "invariant.applicability-contradicted",
        message:
          `The policy declares ${id} not-applicable, and a check observed the very thing it says ` +
          "is absent. The policy is describing a different repository than the one evaluated.",
        evidence: violations.flatMap((v) => v.evidence ?? []).slice(0, 10),
      });
    }
  }
}

// --- Orchestration -----------------------------------------------------------------------------

function runDetectors(run) {
  // Descriptive first: the judgmental detectors read what these establish.
  detectManifestPresence(run);
  detectToolPermissions(run);
  detectPromptAssets(run);
  detectToolDefinitions(run);

  // Judgmental, full assurance.
  detectMissingManifest(run);
  detectInvalidManifest(run);
  detectScaffoldManifest(run);
  detectMissingToolPermissions(run);
  detectUndeclaredTool(run);

  // Judgmental, partial assurance. A shortened walk withdraws the content-derived rules rather
  // than letting an incomplete search report a clean repository.
  const withdrawn = run.surface.frameworkExcludedDirectories.length > 0;
  detectFloatingModelAlias(run);
  detectInlineSystemPrompt(run, withdrawn);
  detectDisabledSafetyControls(run, withdrawn);

  return run;
}

// ---------------------------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------------------------

const NOT_A_VERDICT = "This is evidence, not a verdict.";

function commandAudit(target, flags) {
  const catalog = loadCatalog();
  const run = runDetectors(createRun(target));
  assertBindings(catalog, run.observations.map((o) => o.rule));

  const report = {
    schemaVersion: "1.0",
    standard: { id: "ai", version: FRAMEWORK_VERSION },
    project: path.basename(path.resolve(target)),
    auditedAt: new Date().toISOString(),
    notAVerdict: NOT_A_VERDICT,
    evidenceSurface: run.surface,
    aiSurface: run.aiSurface,
    findings: run.findings,
  };

  if (flags.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    const out = [];
    out.push(`AIStandards audit — ${report.project}`);
    out.push(NOT_A_VERDICT);
    out.push("");
    out.push(`Files read: ${run.surface.filesCollected}`);
    if (run.surface.frameworkExcludedDirectories.length > 0) {
      out.push(`Excluded by this tool (completeness not established): ${run.surface.frameworkExcludedDirectories.join(", ")}`);
    }
    out.push(`Manifest: ${run.aiSurface.manifest ?? "none found"}`);
    out.push(`Prompt assets: ${run.aiSurface.promptAssets.length}`);
    out.push(`Declared tools: ${run.aiSurface.toolDefinitions.length}`);
    out.push("");
    if (run.findings.length === 0) {
      out.push("No findings.");
    } else {
      for (const f of run.findings) out.push(`  [${f.label}] ${f.id}: ${f.message}`);
    }
    out.push("");
    out.push("Run `validate` for a policy-aware verdict. This command does not produce one.");
    process.stdout.write(`${out.join("\n")}\n`);
  }

  // --strict fails on any finding needing attention. Without it, audit is diagnostic and exits 0
  // regardless of what it found — because a finding is evidence, and evidence is not a failure.
  if (flags.strict && run.findings.some((f) => f.severity === "error" || f.severity === "warning")) {
    return EXIT_FINDINGS;
  }
  return EXIT_OK;
}

function commandValidate(target, flags) {
  const catalog = loadCatalog();
  const { path: policyPath, source: policySource } = resolvePolicyPath(target, flags.policy);

  // Every failure below is exit 2. A verdict was requested and there is nothing to evaluate
  // against; that is a configuration problem, not a compliance failure, and conflating the two
  // would let a broken setup read as a broken project.
  const policy = loadPolicy(policyPath, SCHEMAS.policy);
  assertVersionIdentity(policy, FRAMEWORK_VERSION, policyPath);
  const resolved = applyPolicy(catalog, policy);

  const run = runDetectors(createRun(target));
  assertBindings(catalog, run.observations.map((o) => o.rule));
  checkApplicabilityContradictions(run, resolved);

  const verdict = evaluate({
    resolved,
    observations: run.observations,
    evaluatedRules: EVALUATED_RULES,
    invariantViolations: run.invariantViolations,
  });

  const report = envelope({
    verdict,
    project: policy.project ?? path.basename(path.resolve(target)),
    standardVersion: policy.standardVersion,
    frameworkVersion: FRAMEWORK_VERSION,
    policyPath,
    policySource,
    auditedAt: new Date().toISOString(),
    frameworkCoverage: coverage(catalog, EVALUATED_RULES),
  });

  if (flags.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    const out = [];
    out.push(`AIStandards validate — ${report.project}`);
    out.push(`Policy: ${policyPath} (${policySource})`);
    out.push("");
    out.push(`Status: ${report.status}${report.score == null ? "" : `  Score: ${report.score}%`}`);
    if (report.status === STATUS.BLOCKED_BY_INVARIANT) {
      out.push("");
      out.push("Blocked. A structural integrity breach was found, so no score is reported:");
      for (const v of report.invariantViolations) out.push(`  ${v.id}: ${v.message}`);
    }
    out.push("");
    out.push(`  passed ${report.summary.passed}  failed ${report.summary.failed}  warnings ${report.summary.warnings}  skipped ${report.summary.skipped}`);
    out.push("");
    for (const r of report.results) {
      if (r.distinction === "passed") continue;
      out.push(`  ${r.distinction.padEnd(30)} ${r.rule}`);
    }
    if (report.unestablishedProhibitions.length > 0) {
      out.push("");
      out.push("Prohibitions not established. These are not passes:");
      for (const p of report.unestablishedProhibitions) out.push(`  ${p.rule} — ${p.reason}`);
    }
    if (report.notEvaluable.length > 0) {
      out.push("");
      out.push("Stated but not evaluable by this framework. These change neither status nor score:");
      for (const n of report.notEvaluable) out.push(`  ${n.rule}`);
    }
    out.push("");
    out.push(`Framework coverage (not a compliance measure): ${report.frameworkCoverage.evaluated}/${report.frameworkCoverage.total} rules have a detector.`);
    process.stdout.write(`${out.join("\n")}\n`);
  }

  if (report.status === STATUS.BLOCKED_BY_INVARIANT) return EXIT_BLOCKED;
  if (report.status === STATUS.NON_COMPLIANT) return EXIT_FINDINGS;
  if (report.status === STATUS.NOT_EVALUATED) return EXIT_FINDINGS;
  return EXIT_OK;
}

const USAGE = `Usage: standards <audit|validate|init> [path] [flags]

  init       Bootstrap a target with scaffolding. Writes files a human must complete; init output
             satisfies no rule. Its own flags: --docs, --dry-run, --force-overwrite=<file>, --json.
  audit      Evidence discovery. What this repository has, and what could not be seen.
             Needs no policy. Never produces a verdict.
  validate   Policy-aware compliance evaluation. Loads the AI policy from the TARGET,
             applies applicability, and produces the status.

  --dir=<path>       Target a directory other than the positional argument.
  --policy=<path>    validate only. Defaults to <dir>/${POLICY_BASENAME}, resolved against the
                     TARGET and never against this checkout.
  --json             Emit the structured report on stdout.
  --strict           audit only. Exit 1 when a finding needs attention.

Exit codes: 0 clean, 1 project-level failure, 2 configuration error, 3 blocked by invariant.
These are process semantics. The verdict is the "status" field of the JSON report.

Not implemented in this release: attestations and exceptions (Phase 4).`;

function parseArgs(argv) {
  const flags = { json: false, strict: false, policy: null, dir: null };
  const positional = [];
  for (const arg of argv) {
    if (arg === "--json") flags.json = true;
    else if (arg === "--strict") flags.strict = true;
    else if (arg.startsWith("--policy=")) flags.policy = arg.slice("--policy=".length);
    else if (arg.startsWith("--dir=")) flags.dir = arg.slice("--dir=".length);
    else if (arg.startsWith("-")) throw new PolicyError(`unknown flag ${JSON.stringify(arg)}`);
    else positional.push(arg);
  }
  return { flags, positional };
}

function main(argv) {
  // `init` owns its own argument parsing: its flags are not audit/validate's, and parsing them here
  // would reject --docs, --dry-run and --force-overwrite before init ever saw them.
  if (argv[0] === "init") return runInitCommand(argv.slice(1));

  let parsed;
  try {
    parsed = parseArgs(argv.slice(1));
  } catch (cause) {
    process.stderr.write(`standards: ${cause.message}\n\n${USAGE}\n`);
    return EXIT_INVOCATION;
  }
  const command = argv[0];
  const { flags, positional } = parsed;

  if (command !== "audit" && command !== "validate") {
    process.stderr.write(`${USAGE}\n`);
    return EXIT_INVOCATION;
  }

  // An empty value is not "no value": `--dir=` (an unset variable expanded into the flag) would
  // otherwise resolve to the working directory and report on a repository nobody named.
  const named = flags.dir ?? positional[0];
  if (named === "") {
    process.stderr.write("standards: the target directory is empty. Name a directory, or omit --dir to use the working directory.\n");
    return EXIT_INVOCATION;
  }
  const target = path.resolve(named ?? ".");
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    process.stderr.write(`standards: ${target} is not a directory\n`);
    return EXIT_INVOCATION;
  }
  if (command === "audit" && flags.policy != null) {
    process.stderr.write("standards: --policy applies to `validate`. `audit` produces no verdict and needs no policy.\n");
    return EXIT_INVOCATION;
  }

  try {
    return command === "audit" ? commandAudit(target, flags) : commandValidate(target, flags);
  } catch (cause) {
    if (cause instanceof PolicyError || cause instanceof CatalogError) {
      process.stderr.write(`standards: ${cause.message}\n`);
      return EXIT_INVOCATION;
    }
    throw cause;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  process.exitCode = main(process.argv.slice(2));
}

export { main, distinction, DISPOSITION };
