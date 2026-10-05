// scripts/manifest.mjs and scripts/toolperms.mjs, judged against the CLI.
//
// The two modules take over a judgement standards.mjs makes inline today. The equivalence test
// below is what makes that rewiring safe: for every fixture that carries a manifest or a tool
// permission file, and for synthetic cases the fixtures do not cover, a model built ONLY from the
// modules must predict what the real CLI reports for the four rules that read those files.
//
// This file covers the manifest module and the shared equivalence corpus; the tool permission
// module's own behaviour is in toolperms-module.test.mjs.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { MANIFEST_NAMES, classifyManifest, manifestToolNames } from "../scripts/manifest.mjs";
import { classifyToolPermissions, compareToolNames, TOOLPERM_NAMES } from "../scripts/toolperms.mjs";
import { hasScaffoldTextMarker } from "../scripts/scaffolding.mjs";
import { validate, fixture, HERE, REPO } from "./helpers.mjs";

const read = (p) => fs.readFileSync(p, "utf8");
const template = (name) => read(path.join(REPO, "templates", name));

const GOOD = `system:
  name: "Support triage"
  purpose: "Routes inbound support requests"
models:
  - id: "some-model-2025-01-01"
    provider: "some-provider"
`;

test("names and status set", () => {
  assert.deepEqual(MANIFEST_NAMES, ["ai-system.yml", "ai-system.yaml"]);
  assert.deepEqual(TOOLPERM_NAMES, ["tool-permissions.yml", "tool-permissions.yaml"]);
});

test("(b) a completed manifest is ok", () => {
  const out = classifyManifest(read(path.join(fixture("valid-manifest"), "ai-system.yml")));
  assert.equal(out.status, "ok");
  assert.equal(out.scaffold, false);
  assert.deepEqual(out.problems, []);
  assert.equal(out.parseError, null);
});

test("(a) the manifest template is scaffold, and its marker survives parsing", () => {
  const out = classifyManifest(template("ai-system.yml"));
  assert.equal(out.status, "scaffold");
  assert.equal(out.document.$scaffold, true);
  assert.deepEqual(out.problems, []);
});

test("(c) a schema-invalid document that also carries the marker is invalid, not scaffold", () => {
  const text = "$scaffold: true\nsystem:\n  name: REPLACE-ME\n"; // purpose and models missing
  const out = classifyManifest(text);
  assert.equal(out.status, "invalid");
  assert.ok(out.problems.length > 0);
  // The scaffold signal is still reported: scaffolding neither hides nor erases the finding.
  assert.equal(out.scaffold, true);
  // Negative control: the same document made valid is scaffold, so the ordering is what decided it.
  const repaired = classifyManifest(`${text}  purpose: REPLACE-ME\nmodels:\n  - id: REPLACE-ME\n    provider: REPLACE-ME\n`);
  assert.equal(repaired.status, "scaffold");
});

test("(c) an unknown field on an otherwise scaffold manifest is invalid", () => {
  const text = template("ai-system.yml") + "invented: true\n";
  assert.equal(classifyManifest(text).status, "invalid");
});

test("(d) a partially filled manifest is ok, not scaffold", () => {
  const text = `system:
  name: "Real name"
  purpose: REPLACE-ME
models:
  - id: REPLACE-ME
    provider: REPLACE-ME
`;
  const out = classifyManifest(text);
  assert.equal(out.status, "ok");
  assert.equal(out.scaffold, false);
  // Positive control for the fully unedited form of the same file.
  assert.equal(classifyManifest(text.replace("Real name", "REPLACE-ME")).status, "scaffold");
});

test("placeholder-only content without a marker is scaffold", () => {
  const out = classifyManifest(template("ai-system.yml").replace(/^\$scaffold: true\n/, ""));
  assert.equal(out.status, "scaffold");
  assert.match(out.reasons.join(" "), /every declared value/);
});

test("(e) a mention of the marker away from the first line marks nothing", () => {
  const text = `${GOOD}# AISTANDARDS-SCAFFOLD is mentioned here in passing\n`;
  assert.equal(hasScaffoldTextMarker(text), false);
  assert.equal(classifyManifest(text).status, "ok");
  const md = "# A real document\n\n<!-- AISTANDARDS-SCAFFOLD: mentioned mid-file -->\n";
  assert.equal(hasScaffoldTextMarker(md), false);
  // Positive control: the same comment on the first non-blank line is a marker.
  assert.equal(hasScaffoldTextMarker("\n\n<!-- AISTANDARDS-SCAFFOLD: x -->\n# Title\n"), true);
});

test("unparseable text is unparseable, with a message and no document", () => {
  const out = classifyManifest("system: [unclosed\n");
  assert.equal(out.status, "unparseable");
  assert.equal(typeof out.parseError, "string");
  assert.equal(out.document, null);
  // The deliberately unsupported YAML forms are refused, not guessed at.
  assert.equal(classifyManifest("a: |\n  block\n").status, "unparseable");
});

test("an empty file or a non-mapping is invalid, never ok", () => {
  assert.equal(classifyManifest("").status, "invalid");
  assert.equal(classifyManifest("- a\n- b\n").status, "invalid");
});

test("manifestToolNames matches the declared tools and tolerates absence", () => {
  assert.ok(manifestToolNames(classifyManifest(read(path.join(fixture("declared-tools"), "ai-system.yml"))).document).length > 0);
  assert.deepEqual(manifestToolNames({ tools: [{ name: "a" }, { name: "b" }, {}, null] }), ["a", "b"]);
  assert.deepEqual(manifestToolNames({}), []);
  assert.deepEqual(manifestToolNames(null), []);
  assert.deepEqual(manifestToolNames({ tools: "nope" }), []);
});

test("the modules import only node: builtins and local modules", () => {
  for (const f of ["manifest.mjs", "toolperms.mjs"]) {
    const text = read(path.join(REPO, "scripts", f));
    for (const m of text.matchAll(/(?:^|\n)\s*import[^;]*?from\s+["']([^"']+)["']/g)) {
      assert.ok(m[1].startsWith("node:") || m[1].startsWith("."), `${f} imports ${m[1]}`);
    }
  }
});

// --- Equivalence with the CLI ---------------------------------------------------------------

const RULES = {
  exists: "lifecycle.manifest-exists",
  valid: "lifecycle.manifest-valid",
  notScaffold: "lifecycle.manifest-not-scaffold",
  permManifest: "gate.tool-permission-manifest",
  classified: "gate.actions-classified",
};

/** What the CLI should report, predicted from the modules alone. Values are `result` strings. */
function predict(manifestText, permText) {
  const m = manifestText == null ? null : classifyManifest(manifestText);
  const p = permText == null ? null : classifyToolPermissions(permText);
  const parsed = m != null && m.status !== "unparseable";
  const mScaffold = parsed && m.scaffold;
  const declared = parsed ? manifestToolNames(m.document) : [];
  const out = {};
  out[RULES.exists] = !m ? "failed" : mScaffold ? "skipped" : "passed";
  out[RULES.valid] = !m ? "skipped" : m.status === "unparseable" || m.status === "invalid" ? "failed" : m.status === "scaffold" ? "skipped" : "passed";
  out[RULES.notScaffold] = !parsed ? "skipped" : m.scaffold ? "failed" : "passed";

  const pScaffold = p != null && p.status !== "unparseable" && p.scaffold;
  out[RULES.permManifest] = !parsed ? "skipped" : mScaffold ? "skipped" : declared.length === 0 ? "passed" : !p ? "failed" : pScaffold ? "skipped" : "passed";

  if (mScaffold) out[RULES.classified] = "skipped";
  else if (declared.length === 0) out[RULES.classified] = parsed ? "passed" : "skipped";
  else if (!p) out[RULES.classified] = "skipped";
  else if (p.status === "unparseable") out[RULES.classified] = "skipped";
  else if (p.problems.length > 0) out[RULES.classified] = "failed";
  else if (p.scaffold) out[RULES.classified] = "skipped";
  else out[RULES.classified] = compareToolNames(p.document, declared).missing.length > 0 ? "failed" : "passed";
  return out;
}

function firstFile(dir, names) {
  const hit = names.find((n) => fs.existsSync(path.join(dir, n)));
  return hit ? read(path.join(dir, hit)) : null;
}

const POLICY = read(path.join(fixture("valid-manifest"), "ai-policy.yml"));

function synthetic(manifestText, permText) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-equiv-"));
  fs.writeFileSync(path.join(dir, "ai-policy.yml"), POLICY);
  if (manifestText != null) fs.writeFileSync(path.join(dir, "ai-system.yml"), manifestText);
  if (permText != null) fs.writeFileSync(path.join(dir, "tool-permissions.yml"), permText);
  return dir;
}

const TOOLS_MANIFEST = `${GOOD}tools:\n  - name: send_email\n  - name: read_file\n`;
const PERMS_OK = "tools:\n  - name: send_email\n    impact: externally-visible\n  - name: read_file\n    impact: none\n";
const PERMS_PARTIAL = "tools:\n  - name: send_email\n    impact: externally-visible\n";
const PERMS_BAD = "tools:\n  - name: send_email\n    impact: catastrophic\n";
const SCAFFOLD_M = "$scaffold: true\nsystem:\n  name: REPLACE-ME\n  purpose: REPLACE-ME\nmodels:\n  - id: REPLACE-ME\n    provider: REPLACE-ME\n";
const SCAFFOLD_P = "$scaffold: true\ntools: []\n";

const CASES = [
  ["no files", null, null],
  ["permissions only", null, PERMS_OK],
  ["unparseable manifest", "system: [unclosed\n", null],
  ["invalid manifest", "system:\n  name: x\n", null],
  ["invalid AND scaffold manifest", "$scaffold: true\nsystem:\n  name: REPLACE-ME\n", null],
  ["scaffold manifest", SCAFFOLD_M, null],
  ["scaffold manifest with tools declared", `${SCAFFOLD_M}tools:\n  - name: send_email\n`, null],
  ["ok manifest, no tools", GOOD, null],
  ["tools, no permission file", TOOLS_MANIFEST, null],
  ["tools, unparseable permissions", TOOLS_MANIFEST, "tools: [\n"],
  ["tools, invalid permissions", TOOLS_MANIFEST, PERMS_BAD],
  ["tools, scaffold permissions", TOOLS_MANIFEST, SCAFFOLD_P],
  ["tools, invalid AND scaffold permissions", TOOLS_MANIFEST, "$scaffold: true\ntools:\n  - name: send_email\n"],
  ["tools, one unclassified", TOOLS_MANIFEST, PERMS_PARTIAL],
  ["tools, all classified", TOOLS_MANIFEST, PERMS_OK],
];

test("equivalence: the modules predict the CLI for synthetic cases", () => {
  const seenManifest = new Set();
  const seenResults = new Set();
  for (const [label, m, p] of CASES) {
    const dir = synthetic(m, p);
    try {
      const report = validate(dir).json;
      assert.ok(report, `${label}: no report`);
      const want = predict(m, p);
      for (const rule of Object.values(RULES)) {
        const got = report.results.find((r) => r.rule === rule);
        assert.ok(got, `${label}: no result for ${rule}`);
        assert.equal(got.result, want[rule], `${label}: ${rule}`);
        seenResults.add(got.result);
      }
      if (m != null) seenManifest.add(classifyManifest(m).status);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  // The corpus must exercise every status and every outcome, or agreement proves little.
  assert.deepEqual([...seenManifest].sort(), ["invalid", "ok", "scaffold", "unparseable"]);
  assert.deepEqual([...seenResults].sort(), ["failed", "passed", "skipped"]);
});

test("equivalence: the modules predict the CLI for every fixture that has one of the files", () => {
  let compared = 0;
  for (const name of fs.readdirSync(path.join(HERE, "fixtures"))) {
    const dir = fixture(name);
    if (!fs.statSync(dir).isDirectory()) continue;
    const m = firstFile(dir, MANIFEST_NAMES);
    const p = firstFile(dir, TOOLPERM_NAMES);
    if (m == null && p == null) continue;
    const policyText = fs.existsSync(path.join(dir, "ai-policy.yml")) ? read(path.join(dir, "ai-policy.yml")) : "";
    if (/^applicability:/m.test(policyText)) continue; // a not-applicable declaration changes the result on purpose
    const report = validate(dir).json;
    if (!report) continue; // a fixture that is a configuration error has no verdict to compare
    const want = predict(m, p);
    for (const rule of Object.values(RULES)) {
      const got = report.results.find((r) => r.rule === rule);
      assert.ok(got, `${name}: no result for ${rule}`);
      assert.equal(got.result, want[rule], `${name}: ${rule}`);
    }
    compared += 1;
  }
  assert.ok(compared >= 8, `only ${compared} fixtures compared`);
});

test("equivalence control: a wrong prediction would be caught", () => {
  // The same comparison, fed a deliberately wrong model, must disagree with the CLI.
  const dir = synthetic(SCAFFOLD_M, null);
  try {
    const report = validate(dir).json;
    const got = report.results.find((r) => r.rule === RULES.valid);
    assert.equal(got.result, "skipped");
    assert.notEqual(got.result, "passed", "a scaffold must not be predicted, or reported, as passed");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
