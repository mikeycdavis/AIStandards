// scripts/toolperms.mjs: the tool permission manifest judged from text. The CLI equivalence for the
// gate rules lives in manifest-module.test.mjs, because those rules read both files together.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { classifyToolPermissions, compareToolNames, TOOLPERM_NAMES } from "../scripts/toolperms.mjs";
import { fixture, REPO } from "./helpers.mjs";

const read = (p) => fs.readFileSync(p, "utf8");

test("names", () => {
  assert.deepEqual(TOOLPERM_NAMES, ["tool-permissions.yml", "tool-permissions.yaml"]);
});

test("(a) the template is scaffold and its marker survives parsing", () => {
  const out = classifyToolPermissions(read(path.join(REPO, "templates", "tool-permissions.yml")));
  assert.equal(out.status, "scaffold");
  assert.equal(out.document.$scaffold, true);
  assert.deepEqual(out.document.tools, []);
  assert.deepEqual(out.problems, []);
});

test("(b) a completed permission file is ok", () => {
  const out = classifyToolPermissions(read(path.join(fixture("declared-tools"), "tool-permissions.yml")));
  assert.equal(out.status, "ok");
});

test("(c) invalid outranks the marker; the ordering is what decides it", () => {
  const bad = "$scaffold: true\ntools:\n  - name: send_email\n    impact: catastrophic\n";
  const out = classifyToolPermissions(bad);
  assert.equal(out.status, "invalid");
  assert.equal(out.scaffold, true);
  assert.ok(out.problems.length > 0);
  assert.equal(classifyToolPermissions("$scaffold: true\ntools: []\n").status, "scaffold");
});

test("(d) a real entry without the marker is ok", () => {
  const out = classifyToolPermissions("tools:\n  - name: read_file\n    impact: none\n");
  assert.equal(out.status, "ok");
  assert.equal(out.scaffold, false);
});

test("(e) a mid-file mention of the marker does not make it scaffold", () => {
  const out = classifyToolPermissions("tools:\n  - name: read_file\n    impact: none\n# AISTANDARDS-SCAFFOLD mentioned\n");
  assert.equal(out.status, "ok");
});

test("unparseable and non-mapping inputs", () => {
  assert.equal(classifyToolPermissions("tools: [\n").status, "unparseable");
  assert.equal(classifyToolPermissions("").status, "invalid");
  assert.equal(classifyToolPermissions("tools: {}\n").status, "invalid");
});

test("compareToolNames finds exactly the unclassified declared tools", () => {
  const doc = { tools: [{ name: "a" }, { name: "b" }, { name: "a" }] };
  assert.deepEqual(compareToolNames(doc, ["a", "b"]), { classified: ["a", "b"], missing: [] });
  assert.deepEqual(compareToolNames(doc, ["a", "c", "d"]).missing, ["c", "d"]);
  // Negative control: an extra classified tool the manifest never declared is not "missing".
  assert.deepEqual(compareToolNames(doc, ["a"]).missing, []);
  assert.deepEqual(compareToolNames(null, ["a"]), { classified: [], missing: ["a"] });
  assert.deepEqual(compareToolNames({}, []), { classified: [], missing: [] });
});
