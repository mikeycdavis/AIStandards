#!/usr/bin/env node
// `init` — initialise an EXPLICITLY SELECTED target directory from the pack's templates.
//
// Usage: node scripts/init.mjs <target> [--docs] [--dry-run] [--force-overwrite=<destination>]... [--json]
//
// WHAT THIS DOES NOT DO, stated first because the sibling-pack incident this pack was built
// against was a bootstrap that wrote the evidence its own evaluator then accepted:
//
//   * It renders nothing and invents nothing. Files are copied BYTE FOR BYTE from `templates/`.
//   * It writes scaffolding, and scaffolding is not evidence (see scripts/scaffolding.mjs). A
//     freshly initialised target is expected to be reported NON_COMPLIANT by `validate`.
//   * It never defaults to the working directory and never writes under the pack checkout. The
//     pack root is refused as a target by real path, so a mistyped invocation cannot scaffold the
//     standards pack's own tree.
//   * It reads only `<templatesDir>` and the pack's `VERSION`. No network, no other files.
//
// EXIT CODES: 0 done (including "nothing to do" and dry runs); 2 invocation, conflict, registry or
// write error. There is no exit 1: `init` produces no verdict, so a project-level failure does not
// arise here.
//
// TESTING HOOKS, all on the optional `io` argument of runInitCommand (see 12.3 of the Phase 2 plan):
//   io.stdout, io.stderr  writable streams (default process.stdout / process.stderr)
//   io.packRoot           the pack checkout (default: derived from this script's location)
//   io.templatesDir       the templates directory (default: <packRoot>/templates)
//   io.onWrite            (destination, index) => void, called immediately BEFORE each destination
//                         is written. Throwing simulates a write failure so the rollback path can
//                         be exercised; it is not part of the CLI.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const EXIT_OK = 0;
const EXIT_ERROR = 2;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PACK_ROOT = path.resolve(HERE, "..");

const GROUPS = new Set(["core", "docs", "reference"]);

const USAGE =
  "Usage: node scripts/init.mjs <target> [--docs] [--dry-run] [--force-overwrite=<destination>]... [--json]\n" +
  "\n" +
  "  <target>                       Required. An existing directory to initialise. Never defaulted.\n" +
  "  --docs                         Also write the docs group (docs/ai/*.md).\n" +
  "  --dry-run                      Write nothing; report the plan and the exit code a real run would give.\n" +
  "  --force-overwrite=<dest>       Permit replacing that one differing file. Repeatable. Must name a\n" +
  "                                 destination in the plan.\n" +
  "  --json                         One JSON object on stdout and nothing else.\n" +
  "\n" +
  "Exit codes: 0 done (or nothing to do), 2 invocation, conflict or write error.\n" +
  "Any conflict refuses the whole run: nothing is written.";

class InitError extends Error {}

function parseArgs(args) {
  const opts = { docs: false, dryRun: false, json: false, force: [], positional: [] };
  const problems = [];
  for (const arg of args) {
    if (arg === "--docs") opts.docs = true;
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--json") opts.json = true;
    else if (arg === "--force-overwrite" || arg.startsWith("--force-overwrite=")) {
      const value = arg.startsWith("--force-overwrite=") ? arg.slice("--force-overwrite=".length) : "";
      if (value === "") problems.push("--force-overwrite needs a destination: --force-overwrite=<destination>");
      else opts.force.push(value.replace(/\\/g, "/"));
    } else if (arg.startsWith("-")) problems.push(`unknown flag ${JSON.stringify(arg)}`);
    else opts.positional.push(arg);
  }
  if (opts.positional.length === 0) problems.push("a target directory is required; init never defaults to the working directory");
  if (opts.positional.length > 1) problems.push(`exactly one target is allowed, got ${opts.positional.length}`);
  return { opts, problems };
}

function isSafeRelative(p) {
  if (typeof p !== "string" || p === "") return false;
  if (p.includes("\\") || p.includes("\0") || p.startsWith("/") || /^[A-Za-z]:/.test(p)) return false;
  return p.split("/").every((c) => c !== "" && c !== "." && c !== ".." && !c.includes(":") && !/[. ]$/.test(c));
}

/** Read and defensively validate the registry. Throws InitError; returns entries with bytes. */
function loadRegistry(templatesDir) {
  const indexPath = path.join(templatesDir, "index.json");
  let raw;
  try {
    raw = fs.readFileSync(indexPath, "utf8");
  } catch (cause) {
    throw new InitError(`cannot read the template registry ${indexPath}: ${cause.code ?? cause.message}`);
  }
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (cause) {
    throw new InitError(`the template registry ${indexPath} is not valid JSON: ${cause.message}`);
  }
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) throw new InitError("the template registry must be a JSON object");
  if (doc.schemaVersion !== "1.0") throw new InitError(`the template registry schemaVersion must be "1.0", got ${JSON.stringify(doc.schemaVersion)}`);
  if (!Array.isArray(doc.templates) || doc.templates.length === 0) throw new InitError("the template registry must list at least one template");

  const seen = new Set();
  const entries = [];
  doc.templates.forEach((t, i) => {
    const at = `registry entry ${i}`;
    if (t === null || typeof t !== "object" || Array.isArray(t)) throw new InitError(`${at} is not an object`);
    for (const key of ["source", "group", "format", "marker"]) {
      if (typeof t[key] !== "string" || t[key] === "") throw new InitError(`${at}: "${key}" must be a non-empty string`);
    }
    if (!GROUPS.has(t.group)) throw new InitError(`${at}: unknown group ${JSON.stringify(t.group)}`);
    if (!isSafeRelative(t.source)) throw new InitError(`${at}: source ${JSON.stringify(t.source)} is not a safe relative path`);
    if (t.group === "reference") {
      if (t.destination !== null) throw new InitError(`${at}: a reference entry must have destination null, got ${JSON.stringify(t.destination)}`);
    } else {
      if (typeof t.destination !== "string") throw new InitError(`${at}: a ${t.group} entry needs a string destination`);
      if (!isSafeRelative(t.destination)) throw new InitError(`${at}: destination ${JSON.stringify(t.destination)} is absolute, escapes the target, or is malformed`);
      const key = t.destination.toLowerCase(); // Windows and macOS file systems fold case
      if (seen.has(key)) throw new InitError(`${at}: duplicate destination ${JSON.stringify(t.destination)}`);
      seen.add(key);
    }
    const sourcePath = path.resolve(templatesDir, t.source);
    let bytes;
    try {
      if (!fs.statSync(sourcePath).isFile()) throw new Error("not a file");
      bytes = fs.readFileSync(sourcePath);
    } catch {
      throw new InitError(`${at}: source ${JSON.stringify(t.source)} does not exist in ${templatesDir}`);
    }
    entries.push({ source: t.source, destination: t.destination, group: t.group, bytes });
  });
  return entries;
}

function checkPolicyVersion(entries, packRoot) {
  let packVersion;
  try {
    packVersion = fs.readFileSync(path.join(packRoot, "VERSION"), "utf8").trim();
  } catch (cause) {
    throw new InitError(`cannot read the pack VERSION: ${cause.code ?? cause.message}`);
  }
  const policy = entries.find((e) => e.destination === "ai-policy.yml" && e.group === "core");
  if (!policy) throw new InitError("the registry has no core ai-policy.yml entry; a target initialised without a policy would exit 2 on every validate");
  const m = /^standardVersion:[ \t]*["']?([^"'\s#]+)["']?[ \t]*(?:#.*)?$/m.exec(policy.bytes.toString("utf8"));
  if (!m) throw new InitError("the template ai-policy.yml has no readable standardVersion");
  if (m[1] !== packVersion) {
    throw new InitError(`the template ai-policy.yml pins standardVersion ${m[1]} but the pack VERSION is ${packVersion}; refusing, since every validate of the adopter would exit 2`);
  }
}

/** lstat each component beneath the target. Returns {state, problem}. */
function inspectDestination(targetDir, destination, bytes) {
  const parts = destination.split("/");
  let cur = targetDir;
  for (let i = 0; i < parts.length; i++) {
    cur = path.join(cur, parts[i]);
    const last = i === parts.length - 1;
    let st;
    try {
      st = fs.lstatSync(cur);
    } catch (cause) {
      if (cause.code === "ENOENT" || cause.code === "ENOTDIR") {
        if (cause.code === "ENOTDIR") return { problem: `a parent of ${destination} is not a directory` };
        return { state: "create" };
      }
      return { problem: `cannot inspect ${destination}: ${cause.code ?? cause.message}` };
    }
    if (st.isSymbolicLink()) return { problem: `${last ? destination : parts.slice(0, i + 1).join("/")} is a symlink; refusing to write through it` };
    if (last) {
      if (st.isDirectory()) return { problem: `${destination} exists as a directory` };
      if (!st.isFile()) return { problem: `${destination} exists and is not a regular file` };
      let existing;
      try {
        existing = fs.readFileSync(cur);
      } catch (cause) {
        return { problem: `cannot read ${destination}: ${cause.code ?? cause.message}` };
      }
      return { state: existing.equals(bytes) ? "unchanged" : "conflict", existing };
    }
    if (!st.isDirectory()) return { problem: `a parent of ${destination} (${parts.slice(0, i + 1).join("/")}) is not a directory` };
  }
  return { state: "create" };
}

function buildPlan(opts, io) {
  const packRoot = io.packRoot ?? DEFAULT_PACK_ROOT;
  const templatesDir = io.templatesDir ?? path.join(packRoot, "templates");
  const errors = [];
  const plan = { target: null, actions: [], conflicts: [], errors, items: [] };

  const targetArg = path.resolve(opts.positional[0]);
  plan.target = targetArg;
  let targetReal;
  try {
    if (!fs.statSync(targetArg).isDirectory()) errors.push(`target ${targetArg} is not a directory`);
    targetReal = fs.realpathSync(targetArg);
  } catch {
    errors.push(`target ${targetArg} does not exist or is not readable; init does not create the target`);
  }
  if (targetReal !== undefined) {
    let packReal = packRoot;
    try { packReal = fs.realpathSync(packRoot); } catch { /* compared as given */ }
    const norm = (p) => (process.platform === "win32" ? p.toLowerCase() : p);
    if (norm(targetReal) === norm(packReal)) errors.push(`target ${targetArg} is the AIStandards pack itself; init never writes into the pack checkout`);
  }

  let entries = [];
  try {
    entries = loadRegistry(templatesDir);
    checkPolicyVersion(entries, packRoot);
  } catch (cause) {
    if (!(cause instanceof InitError)) throw cause;
    errors.push(cause.message);
    entries = [];
  }

  const selected = entries.filter((e) => e.group === "core" || (e.group === "docs" && opts.docs));
  const forced = new Set(opts.force);
  const known = new Set(selected.map((e) => e.destination));
  if (errors.length === 0) {
    for (const f of forced) {
      if (!known.has(f)) errors.push(`--force-overwrite ${JSON.stringify(f)} is not a destination in the selected plan (${[...known].join(", ")})`);
    }
  }

  if (errors.length === 0) {
    for (const e of selected) {
      const r = inspectDestination(targetReal, e.destination, e.bytes);
      if (r.problem) { errors.push(r.problem); continue; }
      let action = r.state;
      if (action === "conflict" && forced.has(e.destination)) action = "overwrite";
      plan.items.push({ ...e, action, backup: r.existing });
      plan.actions.push({ destination: e.destination, action });
      if (action === "conflict") plan.conflicts.push(e.destination);
    }
    plan.targetReal = targetReal;
  }
  return plan;
}

function rollbackAndReport(state) {
  const problems = [];
  for (const tmp of state.temps) { try { fs.rmSync(tmp, { force: true }); } catch (c) { problems.push(`rollback: ${tmp}: ${c.message}`); } }
  for (const b of [...state.replaced].reverse()) { try { fs.writeFileSync(b.path, b.bytes); } catch (c) { problems.push(`rollback: could not restore ${b.path}: ${c.message}`); } }
  for (const f of [...state.createdFiles].reverse()) { try { fs.rmSync(f, { force: true }); } catch (c) { problems.push(`rollback: could not remove ${f}: ${c.message}`); } }
  for (const d of [...state.createdDirs].reverse()) { try { fs.rmdirSync(d); } catch (c) { problems.push(`rollback: could not remove ${d}: ${c.message}`); } }
  return problems;
}

function apply(plan, io) {
  const state = { temps: [], replaced: [], createdFiles: [], createdDirs: [] };
  let index = 0;
  try {
    for (const item of plan.items) {
      if (item.action === "unchanged") continue;
      if (typeof io.onWrite === "function") io.onWrite(item.destination, index);
      index += 1;
      const parts = item.destination.split("/");
      let dir = plan.targetReal;
      for (const part of parts.slice(0, -1)) {
        dir = path.join(dir, part);
        if (!fs.existsSync(dir)) { fs.mkdirSync(dir); state.createdDirs.push(dir); }
      }
      const finalPath = path.join(plan.targetReal, ...parts);
      const tmp = path.join(dir, `.${path.basename(finalPath)}.aistandards-init-${process.pid}.tmp`);
      state.temps.push(tmp);
      fs.writeFileSync(tmp, item.bytes, { flag: "wx" });
      if (item.action === "overwrite") state.replaced.push({ path: finalPath, bytes: item.backup });
      else state.createdFiles.push(finalPath);
      fs.renameSync(tmp, finalPath);
      state.temps.pop();
    }
    return [];
  } catch (cause) {
    const problems = [`write failed: ${cause.message}`, ...rollbackAndReport(state)];
    return problems;
  }
}

const NOTE =
  "NOTE: these files are scaffolding. Scaffolding is not evidence, and nothing here claims compliance. " +
  "A freshly initialised project is expected to be reported NON_COMPLIANT by `validate` until the manifest is written.";

function report(opts, io, plan, exit) {
  const out = io.stdout ?? process.stdout;
  const err = io.stderr ?? process.stderr;
  if (opts.json) {
    out.write(`${JSON.stringify({
      schemaVersion: "1.0",
      target: plan.target,
      dryRun: opts.dryRun,
      docs: opts.docs,
      exit,
      actions: plan.actions,
      conflicts: plan.conflicts,
      errors: plan.errors,
    }, null, 2)}\n`);
    for (const e of plan.errors) err.write(`init: ${e}\n`);
    return;
  }
  const lines = [`init${opts.dryRun ? " (dry run)" : ""} — ${plan.target}`, ""];
  const width = Math.max(9, ...plan.actions.map((a) => a.action.length));
  for (const a of plan.actions) lines.push(`  ${a.action.padEnd(width)}  ${a.destination}`);
  if (plan.actions.length === 0) lines.push("  (no plan: the run was refused before any file was considered)");
  lines.push("");
  if (plan.conflicts.length > 0) {
    lines.push("Refused: these existing files differ from their templates, so NOTHING was written:");
    for (const c of plan.conflicts) lines.push(`  ${c}`);
    lines.push("Move or merge them, or pass --force-overwrite=<destination> for a file you mean to replace.", "");
  }
  out.write(`${lines.join("\n")}\n${NOTE}\n`);
  for (const e of plan.errors) err.write(`init: ${e}\n`);
  if (exit === EXIT_OK && opts.dryRun) out.write("Dry run: nothing was written.\n");
}

/**
 * Run `init`. `args` is argv after the command. Returns an exit code; never calls process.exit.
 */
export function runInitCommand(args, io = {}) {
  const err = io.stderr ?? process.stderr;
  const { opts, problems } = parseArgs(args);
  if (problems.length > 0) {
    if (opts.json) {
      (io.stdout ?? process.stdout).write(`${JSON.stringify({ schemaVersion: "1.0", target: opts.positional[0] ?? null, dryRun: opts.dryRun, docs: opts.docs, exit: EXIT_ERROR, actions: [], conflicts: [], errors: problems }, null, 2)}\n`);
      err.write(`init: ${problems.join("\ninit: ")}\n\n${USAGE}\n`);
    } else {
      err.write(`init: ${problems.join("\ninit: ")}\n\n${USAGE}\n`);
    }
    return EXIT_ERROR;
  }
  try {
    const plan = buildPlan(opts, io);
    if (plan.errors.length > 0 || plan.conflicts.length > 0) {
      report(opts, io, plan, EXIT_ERROR);
      return EXIT_ERROR;
    }
    if (!opts.dryRun) {
      const failures = apply(plan, io);
      if (failures.length > 0) {
        plan.errors.push(...failures);
        report(opts, io, plan, EXIT_ERROR);
        return EXIT_ERROR;
      }
    }
    report(opts, io, plan, EXIT_OK);
    return EXIT_OK;
  } catch (cause) {
    err.write(`init: unexpected error: ${cause?.stack ?? cause}\n`);
    return EXIT_ERROR;
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  process.exitCode = runInitCommand(process.argv.slice(2));
}
