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
// A name directly after `word-` (`x-system: "..."`, a hyphenated key) is a different name, not the parameter.
const INSTRUCTION_PARAM = /(?<!\w-)\b(system|system_prompt|systemPrompt|instructions|systemInstruction)["']?\s*[:=]\s*(["'`])/g;
const INLINE_THRESHOLD = 200;

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
    INSTRUCTION_PARAM.lastIndex = 0;
    let longest = -1;
    for (let match = INSTRUCTION_PARAM.exec(view); match; match = INSTRUCTION_PARAM.exec(view)) {
      const quote = match[2];
      const start = match.index + match[0].length - 1;
      let end = start + 1;
      while (end < read.text.length) {
        if (read.text[end] === "\\") { end += 2; continue; }
        if (read.text[end] === quote) break;
        if (read.text[end] === "\n" && quote !== "`") { end = -1; break; }
        end += 1;
      }
      if (end === -1) continue;
      longest = Math.max(longest, end - start - 1);
    }
    if (longest >= INLINE_THRESHOLD) hits.push(`${file} (${longest} chars)`);
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
