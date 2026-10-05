// Behavioural tests for `init` (scripts/init.mjs), against a SYNTHETIC templates directory.
//
// SYNTHETIC: the templates built here are contract-shaped (section 12.2 of the Phase 2 plan) but are
// written by this test, not the pack's real templates/. They prove init's behaviour, not the content
// of the real templates; test/init-e2e.test.mjs does the latter against <packRoot>/templates.
// Every disposable target lives under os.tmpdir(), never inside the pack, where `audit` would scan it.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { runInitCommand } from "../scripts/init.mjs";
import { REPO, CLI, validate, audit, resultFor } from "./helpers.mjs";

const INIT = path.join(REPO, "scripts", "init.mjs");
const VERSION = fs.readFileSync(path.join(REPO, "VERSION"), "utf8").trim();
const tmp = (label) => fs.mkdtempSync(path.join(os.tmpdir(), `aistd-init-${label}-`));

const MD = (name) => `<!-- AISTANDARDS-SCAFFOLD: synthetic ${name} -->\n# ${name}\n\nSynthetic template body.\n`;

/** A synthetic, contract-shaped templates directory. Returns its path. */
function syntheticTemplates({ version = VERSION, mutateIndex } = {}) {
  const dir = tmp("templates");
  const fixture = path.join(REPO, "test", "fixtures", "scaffold-manifest");
  const policy = fs.readFileSync(path.join(fixture, "ai-policy.yml"), "utf8")
    .replace(/^project:[^\n]*\n/m, "")
    .replace(/^standardVersion:.*$/m, `standardVersion: "${version}"`);
  const files = {
    "ai-policy.yml": `# AISTANDARDS-SCAFFOLD: SYNTHETIC test policy\n${policy}`,
    "ai-system.yml": fs.readFileSync(path.join(fixture, "ai-system.yml"), "utf8"),
    "tool-permissions.yml": "$scaffold: true\ntools: []\n",
    "AI-SYSTEM.md": MD("AI-SYSTEM"),
    "THREAT-MODEL.md": MD("THREAT-MODEL"),
    "AGENTS.md": MD("AGENTS"),
  };
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text);
  const yaml = (source, marker) => ({ source, destination: source, group: "core", format: "yaml", marker });
  const index = {
    schemaVersion: "1.0",
    templates: [
      yaml("ai-system.yml", "$scaffold"),
      yaml("tool-permissions.yml", "$scaffold"),
      yaml("ai-policy.yml", "comment"),
      { source: "AI-SYSTEM.md", destination: "docs/ai/AI-SYSTEM.md", group: "docs", format: "markdown", marker: "comment" },
      { source: "THREAT-MODEL.md", destination: "docs/ai/THREAT-MODEL.md", group: "docs", format: "markdown", marker: "comment" },
      { source: "AGENTS.md", destination: null, group: "reference", format: "markdown", marker: "comment" },
    ],
  };
  if (mutateIndex) mutateIndex(index, dir);
  fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify(index, null, 2));
  return dir;
}

function collect() {
  const chunks = { out: "", err: "" };
  return { chunks, io: (extra) => ({ stdout: { write: (s) => (chunks.out += s) }, stderr: { write: (s) => (chunks.err += s) }, ...extra }) };
}

function init(target, flags, templatesDir, extra = {}) {
  const c = collect();
  const code = runInitCommand([...(target === null ? [] : [target]), ...flags], c.io({ templatesDir, ...extra }));
  return { code, out: c.chunks.out, err: c.chunks.err };
}

/** relpath -> "d" or sha256 of contents; a full picture of a tree. */
function snapshot(root) {
  const out = {};
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      const rel = path.relative(root, p).replace(/\\/g, "/");
      if (e.isDirectory()) { out[rel] = "d"; walk(p); }
      else out[rel] = crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
    }
  };
  walk(root);
  return out;
}

const actionsOf = (out) => Object.fromEntries(JSON.parse(out).actions.map((a) => [a.destination, a.action]));

test("fresh target: core files created byte for byte, docs and reference not written", () => {
  const tpl = syntheticTemplates(); const target = tmp("fresh");
  const r = init(target, [], tpl);
  assert.equal(r.code, 0, r.err);
  assert.deepEqual(Object.keys(snapshot(target)).sort(), ["ai-policy.yml", "ai-system.yml", "tool-permissions.yml"]);
  for (const f of ["ai-policy.yml", "ai-system.yml", "tool-permissions.yml"]) {
    assert.ok(fs.readFileSync(path.join(target, f)).equals(fs.readFileSync(path.join(tpl, f))), `${f} must be a byte-for-byte copy`);
  }
  assert.match(r.out, /create\s+ai-policy\.yml/);
  assert.match(r.out, /scaffolding, and nothing here claims compliance|Scaffolding is not evidence/);
  assert.match(r.out, /NON_COMPLIANT/);
  assert.ok(!/\bCOMPLIANT\b/.test(r.out.replace(/NON_COMPLIANT/g, "")), "output must never claim compliance");
});

test("--docs also writes docs/ai/*, creating parent directories; the reference group is never written", () => {
  const tpl = syntheticTemplates(); const target = tmp("docs");
  assert.equal(init(target, ["--docs"], tpl).code, 0);
  const files = Object.keys(snapshot(target)).filter((k) => snapshot(target)[k] !== "d").sort();
  assert.deepEqual(files, ["ai-policy.yml", "ai-system.yml", "docs/ai/AI-SYSTEM.md", "docs/ai/THREAT-MODEL.md", "tool-permissions.yml"]);
  assert.ok(!fs.existsSync(path.join(target, "AGENTS.md")));
  // negative control: without --docs there is no docs directory at all.
  const t2 = tmp("nodocs"); init(t2, [], tpl);
  assert.ok(!fs.existsSync(path.join(t2, "docs")));
});

test("--dry-run writes nothing, reports the plan, and a conflicting dry run exits 2", () => {
  const tpl = syntheticTemplates(); const target = tmp("dry");
  const before = snapshot(target);
  const r = init(target, ["--dry-run", "--json", "--docs"], tpl);
  assert.equal(r.code, 0);
  assert.deepEqual(snapshot(target), before);
  assert.equal(JSON.parse(r.out).dryRun, true);
  assert.equal(actionsOf(r.out)["docs/ai/AI-SYSTEM.md"], "create");
  // same plan as the real run
  const real = init(tmp("dry-real"), ["--json", "--docs"], tpl);
  assert.deepEqual(JSON.parse(real.out).actions, JSON.parse(r.out).actions);
  // a dry run that would conflict exits 2
  fs.writeFileSync(path.join(target, "ai-system.yml"), "mine: true\n");
  const c = init(target, ["--dry-run"], tpl);
  assert.equal(c.code, 2);
  assert.equal(fs.readFileSync(path.join(target, "ai-system.yml"), "utf8"), "mine: true\n");
});

test("repeat run exits 0 with every file unchanged and touches nothing", () => {
  const tpl = syntheticTemplates(); const target = tmp("repeat");
  assert.equal(init(target, ["--docs"], tpl).code, 0);
  const files = Object.keys(snapshot(target)).filter((k) => k !== "docs" && k !== "docs/ai");
  const before = snapshot(target);
  const mtimes = Object.fromEntries(files.map((f) => [f, fs.statSync(path.join(target, f)).mtimeMs]));
  const r = init(target, ["--docs", "--json"], tpl);
  assert.equal(r.code, 0);
  assert.ok(JSON.parse(r.out).actions.every((a) => a.action === "unchanged"));
  assert.deepEqual(snapshot(target), before);
  for (const f of files) assert.equal(fs.statSync(path.join(target, f)).mtimeMs, mtimes[f], `${f} mtime`);
});

test("an edited existing file is a conflict: the WHOLE run is refused and nothing is written", () => {
  const tpl = syntheticTemplates(); const target = tmp("conflict");
  fs.writeFileSync(path.join(target, "ai-system.yml"), "system:\n  name: mine\n");
  const before = snapshot(target);
  const r = init(target, ["--json", "--docs"], tpl);
  assert.equal(r.code, 2);
  assert.deepEqual(snapshot(target), before, "non-conflicting files must not be written either");
  const j = JSON.parse(r.out);
  assert.deepEqual(j.conflicts, ["ai-system.yml"]);
  assert.equal(j.exit, 2);
  assert.equal(actionsOf(r.out)["ai-policy.yml"], "create");
  // human output lists the conflict path
  const h = init(target, [], tpl);
  assert.equal(h.code, 2);
  assert.match(h.out, /Refused[\s\S]*ai-system\.yml/);
  // negative control: identical content is not a conflict
  const t2 = tmp("noconflict"); fs.copyFileSync(path.join(tpl, "ai-system.yml"), path.join(t2, "ai-system.yml"));
  assert.equal(init(t2, [], tpl).code, 0);
});

test("every conflict is listed, not only the first", () => {
  const tpl = syntheticTemplates(); const target = tmp("conflicts");
  for (const f of ["ai-system.yml", "ai-policy.yml"]) fs.writeFileSync(path.join(target, f), "x: 1\n");
  const j = JSON.parse(init(target, ["--json"], tpl).out);
  assert.deepEqual(j.conflicts.sort(), ["ai-policy.yml", "ai-system.yml"]);
});

test("--force-overwrite replaces exactly the named file and only that", () => {
  const tpl = syntheticTemplates(); const target = tmp("force");
  fs.writeFileSync(path.join(target, "ai-system.yml"), "mine: 1\n");
  fs.writeFileSync(path.join(target, "tool-permissions.yml"), "mine: 2\n");
  const r = init(target, ["--force-overwrite=ai-system.yml", "--json"], tpl);
  assert.equal(r.code, 2, "the second conflict is still unforced");
  assert.equal(fs.readFileSync(path.join(target, "ai-system.yml"), "utf8"), "mine: 1\n");
  const r2 = init(target, ["--force-overwrite=ai-system.yml", "--force-overwrite=tool-permissions.yml"], tpl);
  assert.equal(r2.code, 0);
  const t3 = tmp("force-one"); fs.writeFileSync(path.join(t3, "ai-system.yml"), "mine: 1\n");
  const r3 = init(t3, ["--force-overwrite=ai-system.yml", "--json"], tpl);
  assert.equal(r3.code, 0);
  assert.equal(actionsOf(r3.out)["ai-system.yml"], "overwrite");
  assert.ok(fs.readFileSync(path.join(t3, "ai-system.yml")).equals(fs.readFileSync(path.join(tpl, "ai-system.yml"))));
});

test("--force-overwrite naming a destination outside the plan is an error and writes nothing", () => {
  const tpl = syntheticTemplates();
  for (const [flags, label] of [[["--force-overwrite=ai-sytem.yml"], "typo"], [["--force-overwrite=docs/ai/AI-SYSTEM.md"], "docs group without --docs"], [["--force-overwrite=AGENTS.md"], "reference"]]) {
    const target = tmp("force-typo");
    const r = init(target, flags, tpl);
    assert.equal(r.code, 2, label);
    assert.deepEqual(snapshot(target), {}, label);
    assert.match(r.err, /not a destination in the selected plan/);
  }
  // control: the same docs path is accepted once --docs selects it
  assert.equal(init(tmp("force-ok"), ["--docs", "--force-overwrite=docs/ai/AI-SYSTEM.md"], tpl).code, 0);
});

test("malformed --force-overwrite, unknown flags and extra positionals are exit 2 with usage", () => {
  const tpl = syntheticTemplates(); const target = tmp("args");
  for (const flags of [["--force-overwrite"], ["--force-overwrite="], ["--bogus"], ["--docs=yes"], [path.join(target, "b")]]) {
    const r = init(target, flags, tpl);
    assert.equal(r.code, 2, flags.join(" "));
    assert.match(r.err, /Usage:/);
  }
  assert.deepEqual(snapshot(target), {});
});

test("no target, a missing target and a file target are exit 2 and write nothing", () => {
  const tpl = syntheticTemplates(); const base = tmp("badtarget");
  assert.equal(init(null, [], tpl).code, 2);
  const missing = path.join(base, "nope");
  assert.equal(init(missing, [], tpl).code, 2);
  assert.ok(!fs.existsSync(missing), "init must not create the target");
  const file = path.join(base, "afile"); fs.writeFileSync(file, "x");
  assert.equal(init(file, [], tpl).code, 2);
  assert.deepEqual(Object.keys(snapshot(base)), ["afile"]);
});

test("the pack root as target is refused by real path, including through a link, and nothing is written", () => {
  const tpl = syntheticTemplates();
  const before = snapshot(REPO);
  assert.equal(init(REPO, [], tpl).code, 2);
  assert.equal(init(path.join(REPO, "scripts", ".."), [], tpl).code, 2);
  let linkMade = false;
  const link = path.join(tmp("packlink"), "link");
  for (const type of ["dir", "junction"]) { try { fs.symlinkSync(REPO, link, type); linkMade = true; break; } catch { /* try next */ } }
  if (linkMade) assert.equal(init(link, [], tpl).code, 2, "a link to the pack is still the pack");
  else console.log("NOTE: could not create a symlink/junction here; the linked pack-root case was not exercised.");
  assert.deepEqual(snapshot(REPO), before, "the pack tree must be untouched");
  // negative control: any other directory is accepted
  assert.equal(init(tmp("notpack"), [], tpl).code, 0);
});

test("run as a script with cwd = the pack root and NO target: exit 2, pack tree byte-identical", () => {
  const before = snapshot(REPO);
  for (const args of [[], ["--docs"], ["--dry-run"], ["--json"]]) {
    const r = spawnSync(process.execPath, [INIT, ...args], { cwd: REPO, encoding: "utf8" });
    assert.equal(r.status, 2, `${args.join(" ")}: ${r.stderr}`);
    assert.match(r.stderr, /target directory is required/);
  }
  assert.deepEqual(snapshot(REPO), before);
  // and the explicit "." from inside the pack is the pack root, also refused
  const dot = spawnSync(process.execPath, [INIT, "."], { cwd: REPO, encoding: "utf8" });
  assert.equal(dot.status, 2);
  assert.deepEqual(snapshot(REPO), before);
});

test("a symlinked parent, a directory in place of a file, and a file in place of a parent are refused", () => {
  const tpl = syntheticTemplates();
  // directory where a file belongs
  const t1 = tmp("dirfile"); fs.mkdirSync(path.join(t1, "ai-system.yml"));
  const b1 = snapshot(t1);
  assert.equal(init(t1, [], tpl).code, 2);
  assert.deepEqual(snapshot(t1), b1);
  // a file where a parent directory belongs
  const t2 = tmp("fileparent"); fs.writeFileSync(path.join(t2, "docs"), "i am a file");
  const b2 = snapshot(t2);
  const r2 = init(t2, ["--docs"], tpl);
  assert.equal(r2.code, 2);
  assert.match(r2.err, /not a directory/);
  assert.deepEqual(snapshot(t2), b2);
  // control: without --docs that same target is fine
  assert.equal(init(t2, [], tpl).code, 0);
  // symlinked parent
  const outside = tmp("outside"); const t3 = tmp("symparent");
  let made = false;
  for (const type of ["dir", "junction"]) { try { fs.symlinkSync(outside, path.join(t3, "docs"), type); made = true; break; } catch { /* next */ } }
  if (!made) { console.log("SKIPPED symlinked-parent case: this OS refused to create a symlink or junction without privilege."); return; }
  const r3 = init(t3, ["--docs"], tpl);
  assert.equal(r3.code, 2);
  assert.match(r3.err, /symlink/);
  assert.deepEqual(fs.readdirSync(outside), [], "nothing may be written through the link");
  assert.ok(!fs.existsSync(path.join(t3, "ai-policy.yml")), "nor anywhere else in the target");
});

test("a write failure mid-run rolls everything back (created files, created directories, replaced files)", () => {
  const tpl = syntheticTemplates();
  // failure after two files were created, docs dir included
  const target = tmp("rollback");
  const before = snapshot(target);
  const r = init(target, ["--docs"], tpl, { onWrite: (dest, i) => { if (i === 4) throw new Error(`injected failure at ${dest}`); } });
  assert.equal(r.code, 2);
  assert.match(r.err, /injected failure/);
  assert.deepEqual(snapshot(target), before, "a failed run must leave the target exactly as it was");
  // replaced files are restored from the backup
  const t2 = tmp("rollback-replace");
  fs.writeFileSync(path.join(t2, "ai-system.yml"), "keep: me\n");
  fs.writeFileSync(path.join(t2, "z-unrelated.txt"), "unrelated");
  const b2 = snapshot(t2);
  const r2 = init(t2, ["--force-overwrite=ai-system.yml"], tpl, { onWrite: (dest, i) => { if (i === 2) throw new Error("boom"); } });
  assert.equal(r2.code, 2);
  assert.deepEqual(snapshot(t2), b2);
  // negative control: without the hook the same run succeeds
  assert.equal(init(t2, ["--force-overwrite=ai-system.yml"], tpl).code, 0);
});

test("malformed or unsafe registries are refused with exit 2 and write nothing", () => {
  const variants = {
        "wrong schemaVersion": (i) => { i.schemaVersion = "2.0"; },
    "templates not an array": (i) => { i.templates = {}; },
    "unknown group": (i) => { i.templates[0].group = "extra"; },
    "listed source missing": (i) => { i.templates[0].source = "ghost.yml"; },
    "duplicate destination": (i) => { i.templates[1].destination = i.templates[0].destination; },
    "case-folded duplicate destination": (i) => { i.templates[1].destination = i.templates[0].destination.toUpperCase(); },
    "absolute destination": (i) => { i.templates[0].destination = "/etc/x.yml"; },
    "drive destination": (i) => { i.templates[0].destination = "C:/x.yml"; },
    "escaping destination": (i) => { i.templates[0].destination = "../x.yml"; },
    "escaping destination mid-path": (i) => { i.templates[3].destination = "docs/../../x.md"; },
    "backslash destination": (i) => { i.templates[0].destination = "a\\b.yml"; },
    "reference with destination": (i) => { i.templates[5].destination = "AGENTS.md"; },
    "core without destination": (i) => { i.templates[0].destination = null; },
    "source escapes templates dir": (i) => { i.templates[0].source = "../index.json"; },
    "no ai-policy entry": (i) => { i.templates = i.templates.filter((t) => t.source !== "ai-policy.yml"); },
  };
  for (const [label, mutate] of Object.entries(variants)) {
    const tpl = syntheticTemplates({ mutateIndex: (i) => mutate(i) });
    const target = tmp("badreg");
    const r = init(target, ["--docs"], tpl);
    assert.equal(r.code, 2, label);
    assert.deepEqual(snapshot(target), {}, label);
    assert.ok(r.err.length > 0, `${label}: needs a diagnostic`);
  }
  for (const [label, damage] of [["missing registry", (p) => fs.rmSync(p)], ["not json", (p) => fs.writeFileSync(p, "{nope")]]) {
    const tpl = syntheticTemplates(); damage(path.join(tpl, "index.json"));
    const target = tmp("badreg");
    assert.equal(init(target, [], tpl).code, 2, label);
    assert.deepEqual(snapshot(target), {}, label);
  }
  // negative control: the unmutated registry is accepted
  assert.equal(init(tmp("goodreg"), ["--docs"], syntheticTemplates()).code, 0);
});

test("a starter policy pinned to a different standardVersion is refused", () => {
  const stale = syntheticTemplates({ version: "9.9.9" });
  const target = tmp("stale");
  const r = init(target, [], stale);
  assert.equal(r.code, 2);
  assert.match(r.err, /9\.9\.9/);
  assert.match(r.err, new RegExp(VERSION.replace(/\./g, "\\.")));
  assert.deepEqual(snapshot(target), {});
  assert.equal(init(tmp("current"), [], syntheticTemplates()).code, 0, "control: matching version is accepted");
});

test("--json: stdout is exactly one JSON object of the documented shape; diagnostics go to stderr", () => {
  const tpl = syntheticTemplates(); const target = tmp("json");
  const r = init(target, ["--json", "--docs"], tpl);
  const j = JSON.parse(r.out); // throws if anything but pure JSON
  assert.deepEqual(Object.keys(j), ["schemaVersion", "target", "dryRun", "docs", "exit", "actions", "conflicts", "errors"]);
  assert.equal(j.schemaVersion, "1.0");
  assert.equal(j.docs, true); assert.equal(j.dryRun, false); assert.equal(j.exit, 0);
  assert.deepEqual(j.errors, []); assert.deepEqual(j.conflicts, []);
  assert.ok(j.actions.every((a) => typeof a.destination === "string" && ["create", "unchanged", "overwrite", "conflict"].includes(a.action)));
  assert.equal(r.err, "");
  // error case: still one JSON object on stdout, the diagnostic on stderr
  const e = init(path.join(target, "nope"), ["--json"], tpl);
  assert.equal(e.code, 2);
  assert.equal(JSON.parse(e.out).exit, 2);
  assert.ok(JSON.parse(e.out).errors.length > 0);
  assert.ok(e.err.length > 0);
});

test("as a script: exit code is set, output reaches the process streams", () => {
  const r = spawnSync(process.execPath, [INIT, path.join(tmp("script"), "missing"), "--json"], { cwd: os.tmpdir(), encoding: "utf8" });
  assert.equal(r.status, 2);
  assert.equal(JSON.parse(r.stdout).exit, 2);
});

// --- Initialization alone satisfies zero rules: the SYNTHETIC-template variant ---------------------
// The identical assertions run against the REAL templates in test/init-e2e.test.mjs. This one runs
// now, in isolation, so the property has evidence before the real templates are integrated.

test("SYNTHETIC: an initialised target satisfies zero rules, is NON_COMPLIANT, and before init there is no verdict", () => {
  const tpl = syntheticTemplates();
  for (const flags of [[], ["--docs"]]) {
    const target = path.join(tmp("e2e"), "adopter-project");
    fs.mkdirSync(target);
    const before = validate(target);
    assert.equal(before.code, 2, "no policy: a configuration error, never a pass");
    assert.equal(before.json, null);
    assert.equal(init(target, flags, tpl).code, 0);
    const v = validate(target);
    assert.ok(v.json, `validate must produce a verdict: ${v.stderr}`);
    const passed = v.json.results.filter((r) => r.result === "passed").map((r) => r.rule);
    assert.deepEqual(passed, [], `initialization alone must satisfy zero rules; passed: ${passed.join(", ")}`);
    assert.equal(resultFor(v.json, "lifecycle.manifest-not-scaffold").result, "failed");
    assert.equal(v.json.status, "NON_COMPLIANT");
    assert.equal(v.code, 1);
    // the policy resolved is the TARGET's
    assert.ok(path.resolve(v.json.policyPath).startsWith(path.resolve(target)), v.json.policyPath);
    assert.equal(v.json.project, "adopter-project");
    assert.notEqual(v.json.project, "AIStandards");
    const a = audit(target);
    assert.equal(a.json.status, undefined, "audit emits no status");
    assert.equal(a.json.score, undefined, "audit emits no score");
  }
});

test("SYNTHETIC negative control: a target with a real, complete manifest DOES pass rules", () => {
  // Proves the zero-pass assertion above can fail: the same check on a genuinely written manifest.
  const v = validate(path.join(REPO, "test", "fixtures", "valid-manifest"));
  assert.ok(v.json.results.some((r) => r.result === "passed"));
});

test("the pack root is refused even when it holds nothing that could conflict (refusal is by identity, not by clash)", () => {
  // The real pack root is refused today partly because its own ai-policy.yml would CONFLICT, which
  // would mask a missing identity check. A fake, empty pack root removes that mask.
  const tpl = syntheticTemplates();
  const fakePack = tmp("fakepack");
  fs.writeFileSync(path.join(fakePack, "VERSION"), `${VERSION}\n`);
  const before = snapshot(fakePack);
  const r = init(fakePack, [], tpl, { packRoot: fakePack });
  assert.equal(r.code, 2);
  assert.match(r.err, /pack itself/);
  assert.deepEqual(snapshot(fakePack), before);
  const dotted = init(path.join(fakePack, "sub", ".."), [], tpl, { packRoot: fakePack });
  assert.equal(dotted.code, 2);
  // negative control: the same directory is fine as a target when the pack lives elsewhere
  const elsewhere = tmp("elsewhere"); fs.writeFileSync(path.join(elsewhere, "VERSION"), `${VERSION}
`);
  assert.equal(init(fakePack, [], tpl, { packRoot: elsewhere }).code, 0);
});
