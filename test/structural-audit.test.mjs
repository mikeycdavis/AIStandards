// The structural reader as the audit and validate commands use it (ST-57, #119).
//
// What is pinned here is the OUTCOME contract of decision D, observed through the real CLI:
//   * a YAML or JSON file the reader cannot read is, for the inline-prompt rules, file-scoped unknown. It is
//     never a pass, never a finding, and its text is not scanned lexically as a fallback by those rules
//     (Standard 9 stays lexical and still scans it: case H, ST-49);
//   * findings from files that parsed stand, whatever else failed;
//   * the failure is reported on an additive, bounded `unparseableFiles` evidence surface, and that
//     surface ships in the same change as the closed schema that has to admit it;
//   * the audit report carries schemaVersion "1.1" and validates against its closed schema; validate
//     keeps "1.0" because its own shape did not change.
//
// Targets are built in temp directories the way review-findings.test.mjs builds them.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { audit, validate, fixture, resultFor as ruleIn, REPO } from "./helpers.mjs";
import { validate as validateSchema } from "../scripts/jsonschema.mjs";

const NO_INLINE = "promptsec.no-inline-system-prompt";
const VERSIONED = "promptsec.prompt-is-versioned-artifact";
const SAFETY = "misuse.safety-controls-not-disabled";
const LONG = "x".repeat(250);
const AUDIT_SCHEMA = JSON.parse(fs.readFileSync(path.join(REPO, "schemas", "audit-report.schema.json"), "utf8"));
const VALIDATE_SCHEMA = JSON.parse(fs.readFileSync(path.join(REPO, "schemas", "validate-report.schema.json"), "utf8"));

function target(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-struct-"));
  const base = fixture("inline-system-prompt");
  fs.copyFileSync(path.join(base, "ai-policy.yml"), path.join(dir, "ai-policy.yml"));
  fs.copyFileSync(path.join(base, "ai-system.yml"), path.join(dir, "ai-system.yml"));
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return dir;
}

const verdictOf = (dir, rule) => ruleIn(validate(dir).json, rule);

test("the audit report validates against its closed schema, and carries schemaVersion 1.1", () => {
  // The first audit-schema conformance test: until now nothing checked an audit report against
  // schemas/audit-report.schema.json at all.
  const dir = target({ "a.yml": "k: v\n" });
  const { json } = audit(dir);
  assert.equal(json.schemaVersion, "1.1");
  assert.deepEqual(validateSchema(json, AUDIT_SCHEMA), []);
});

test("the audit schema is closed: an unknown key anywhere the schema describes is refused", () => {
  const dir = target({ "a.yml": "k: v\n" });
  const { json } = audit(dir);
  assert.ok(validateSchema({ ...json, extra: 1 }, AUDIT_SCHEMA).length > 0, "top level is closed");
  const withSurface = { ...json, evidenceSurface: { ...json.evidenceSurface, extra: 1 } };
  assert.ok(validateSchema(withSurface, AUDIT_SCHEMA).length > 0, "evidenceSurface is closed");
  const unparseable = { ...json.evidenceSurface.unparseableFiles, extra: 1 };
  const withUnparseable = { ...json, evidenceSurface: { ...json.evidenceSurface, unparseableFiles: unparseable } };
  assert.ok(validateSchema(withUnparseable, AUDIT_SCHEMA).length > 0, "unparseableFiles is closed");
  assert.ok(validateSchema({ ...json, schemaVersion: "1.0" }, AUDIT_SCHEMA).length > 0, "a 1.0 envelope is not a 1.1 envelope");
  const { structuralSurface, ...without } = json;
  assert.ok(structuralSurface !== undefined);
  assert.ok(validateSchema(without, AUDIT_SCHEMA).length > 0, "structuralSurface is required in 1.1");
});

test("validate keeps schemaVersion 1.0 and validates against its own schema", () => {
  const dir = target({ "a.yml": "k: v\n" });
  const { json } = validate(dir);
  assert.equal(json.schemaVersion, "1.0");
  assert.deepEqual(validateSchema(json, VALIDATE_SCHEMA), []);
});

test("a parseable repository reports an empty unparseable surface", () => {
  const dir = target({ "a.yml": "k: v\n", "b.json": "{\"k\": 1}\n" });
  const { json } = audit(dir);
  assert.deepEqual(json.evidenceSurface.unparseableFiles, { total: 0, files: [], omitted: 0 });
  assert.ok(json.structuralSurface.filesParsed >= 2);
});

test("an unparseable YAML file is reported with reason and position, not its text", () => {
  const dir = target({ "bad.yml": `system: "${LONG}"\nbad: [unclosed\n` });
  const { json } = audit(dir);
  const surface = json.evidenceSurface.unparseableFiles;
  assert.equal(surface.total, 1);
  assert.equal(surface.files[0].file, "bad.yml");
  assert.equal(surface.files[0].reason, "syntax");
  assert.equal(typeof surface.files[0].line, "number");
  assert.equal(typeof surface.files[0].column, "number");
  assert.ok(!JSON.stringify(json).includes(LONG), "no literal file text is carried into the report");
});

test("D: no lexical fallback. A long system literal in a file that does not parse is unknown, not a violation", () => {
  for (const [name, text] of [
    ["c01.yml", `system: "${LONG}"\nbad: [unclosed\n`],
    ["c02.yml", `top:\n\tsystem: "${LONG}"\n`],
    ["c05.json", `{"system": "${LONG}",}\n`],
    ["c08.json", `{'system': '${LONG}'}\n`],
  ]) {
    const dir = target({ [name]: text });
    for (const rule of [NO_INLINE, VERSIONED]) {
      const r = verdictOf(dir, rule);
      assert.equal(r.result, "skipped", `${name}: ${rule} is neither a finding from unparseable text nor a pass`);
      assert.equal(r.disposition, "not-evaluated", `${name}: ${rule}`);
    }
  }
});

test("D: unknown is never pass, even when nothing else was wrong", () => {
  const dir = target({ "only.json": "{\"a\": [1, 2" });
  const r = verdictOf(dir, NO_INLINE);
  assert.equal(r.disposition, "not-evaluated");
  assert.match(r.message, /could not be read structurally/);
});

test("D: a finding from a parsed file stands next to an unparseable one", () => {
  const dir = target({
    "good.yml": `system: "${LONG}"\n`,
    "bad.yml": "a: [\n",
  });
  const r = verdictOf(dir, NO_INLINE);
  assert.equal(r.disposition, "evaluated", "a confirmed violation is kept over an unknown");
  assert.ok(["failed", "warning"].includes(r.result), `expected a violation, got ${r.result}`);
  assert.deepEqual(r.evidence.filter((e) => e.includes("bad.yml")), [], "the unknown is not evidence of the failure");
  assert.ok(r.evidence.some((e) => e.startsWith("good.yml")));
});

test("D: every document of a stream is read, and one bad document makes the file unparseable", () => {
  const dir = target({ "multi.yml": "a: 1\n---\nb: [\n" });
  assert.equal(audit(dir).json.evidenceSurface.unparseableFiles.total, 1);
});

test("D: a file past the read bound is refused as truncated, not cut and scanned", () => {
  const big = `system: "${LONG}"\n` + "# pad\n".repeat(120000);
  assert.ok(Buffer.byteLength(big) > 512 * 1024);
  const dir = target({ "big.yml": big });
  const { json } = audit(dir);
  assert.equal(json.evidenceSurface.unparseableFiles.files[0].reason, "truncated");
  const r = verdictOf(dir, NO_INLINE);
  assert.equal(r.result, "skipped", "the cut text is not scanned");
  assert.equal(r.disposition, "not-evaluated");
});

test("D: invalid UTF-8 and UTF-16 are refused, not decoded lossily", () => {
  const dir = target({});
  fs.writeFileSync(path.join(dir, "latin.yml"), Buffer.from([0x6b, 0x3a, 0x20, 0xe9, 0x0a]));
  fs.writeFileSync(path.join(dir, "wide.yml"), Buffer.from("﻿k: v\n", "utf16le"));
  const reasons = audit(dir).json.evidenceSurface.unparseableFiles.files.map((f) => `${f.file}:${f.reason}`).sort();
  assert.deepEqual(reasons, ["latin.yml:invalid-utf-8", "wide.yml:utf-16"]);
});

test("F: only .yml, .yaml and .json are read structurally, case-insensitively, by name", () => {
  const dir = target({
    "UPPER.YML": "a: [\n",
    "mixed.Json": "{",
    "notes.jsonc": "{ // comment\n}\n",
    "events.jsonl": "{\"a\":1}\n{\"a\":2}\n",
    "events.ndjson": "{\"a\":1}\n{\"a\":2}\n",
    "tpl.yaml.j2": "a: {{ x }}\n",
    "README.md": "```yaml\na: [\n```\n",
    "nb.ipynb": "{ not json",
    noext: "a: [\n",
    "config.toml": "a = [\n",
  });
  const files = audit(dir).json.evidenceSurface.unparseableFiles.files.map((f) => f.file).sort();
  assert.deepEqual(files, ["UPPER.YML", "mixed.Json"]);
});

test("F: a .json file that is JSONC is unparseable (a named non-claim, never read leniently)", () => {
  const dir = target({ "tsconfig.json": "{\n  // comment\n  \"a\": 1\n}\n" });
  const f = audit(dir).json.evidenceSurface.unparseableFiles.files[0];
  assert.equal(f.file, "tsconfig.json");
  assert.equal(f.reason, "syntax");
});

test("H: Standard 9 stays lexical, so an unparseable YAML file is still scanned for a disabled safety control", () => {
  const dir = target({ "bad.yml": "safety_mode: off\nmoderation: 'off'\nbad: [\n" });
  const r = verdictOf(dir, SAFETY);
  assert.ok(["failed", "warning"].includes(r.result), "misuse.safety-controls-not-disabled is not moved by this change");
  assert.equal(r.disposition, "evaluated");
});

test("evidence strings of a parseable file are unchanged", () => {
  const dir = target({ "good.yml": `system: "${LONG}"\n` });
  const r = verdictOf(dir, NO_INLINE);
  assert.deepEqual(r.evidence, ["good.yml (250 chars)"]);
});

test("the unparseable surface is bounded and says how many it omitted", () => {
  const files = {};
  for (let i = 0; i < 120; i += 1) files[`bad-${String(i).padStart(3, "0")}.yml`] = "a: [\n";
  const { json } = audit(target(files));
  const s = json.evidenceSurface.unparseableFiles;
  assert.equal(s.total, 120);
  assert.equal(s.files.length + s.omitted, 120);
  assert.ok(s.files.length <= 50);
  assert.deepEqual(validateSchema(json, AUDIT_SCHEMA), []);
});

test("C: aliases and merge keys are reported as present and not followed, with positions", () => {
  const dir = target({ "a.yml": "base: &b\n  role: system\nuse:\n  <<: *b\nalso: *b\n" });
  const { json } = audit(dir);
  const s = json.structuralSurface;
  assert.equal(s.aliasesNotFollowed.total, 2);
  assert.equal(s.mergeKeysNotApplied.total, 1);
  assert.deepEqual(s.aliasesNotFollowed.listed.map((a) => [a.file, a.documentIndex, a.name, a.line]), [
    ["a.yml", 0, "b", 4],
    ["a.yml", 0, "b", 5],
  ]);
  assert.deepEqual(validateSchema(json, AUDIT_SCHEMA), []);
});

test("C: explicitly tagged merge keys are reported as merge keys not applied", () => {
  const dir = target({
    "a.yml": "base: &b\n  k: 1\nu:\n  !!merge <<: *b\nv:\n  !<tag:yaml.org,2002:merge> <<: *b\nw:\n  \"<<\": *b\n",
  });
  const { json } = audit(dir);
  assert.equal(json.structuralSurface.mergeKeysNotApplied.total, 2);
  assert.deepEqual(json.structuralSurface.mergeKeysNotApplied.listed.map((m) => m.line), [4, 6]);
  assert.deepEqual(validateSchema(json, AUDIT_SCHEMA), []);
});

test("the report is deterministic across runs (no filesystem ordering leaks into it)", () => {
  const dir = target({ "z.yml": "a: [\n", "a.json": "{", "m.yml": "k: *x\n" });
  const strip = (j) => JSON.stringify({ ...j, auditedAt: "t", evidenceSurface: { ...j.evidenceSurface, root: "r" } });
  assert.equal(strip(audit(dir).json), strip(audit(dir).json));
});

// Manifest and tool-permission files are in structural scope (decision F has no exemption for them). A
// broken one is therefore BOTH invalid for its own rules (judged by manifest.mjs / toolperms.mjs, which
// these tests do not touch) AND an unparseable file for the inline-prompt rules. The outcome pinned
// here is the approved file-scoped unknown: listed in unparseableFiles with a reason and a position,
// the two inline rules not evaluated for the right reason (the file could not be read), and NOT the
// partial-assurance "ran over a declared partial scope and found nothing" result, which would claim a
// search that never happened.
for (const [label, name, text] of [
  ["an unparseable manifest (`system: [unclosed`)", "ai-system.yml", "system: [unclosed\n"],
  ["an unparseable tool-permission file (`tools: [`)", "tool-permissions.yml", "tools: [\n"],
]) {
  test(`manifest scope: ${label} is file-scoped unknown for the inline-prompt rules, not a partial result`, () => {
    const dir = target({ [name]: text });
    const { json } = audit(dir);
    const entry = json.evidenceSurface.unparseableFiles.files.find((f) => f.file === name);
    assert.ok(entry, `${name} must be listed in unparseableFiles`);
    assert.equal(entry.reason, "syntax");
    assert.equal(typeof entry.line, "number");
    const report = validate(dir).json;
    for (const rule of [NO_INLINE, VERSIONED]) {
      const r = ruleIn(report, rule);
      assert.equal(r.result, "skipped", rule);
      assert.equal(r.disposition, "not-evaluated", rule);
      assert.match(r.message, /could not be read structurally/, `${rule}: ${r.message}`);
      assert.doesNotMatch(r.message, /declared partial scope|Not established/, `${rule}: must not read as a partial search that found nothing`);
      assert.ok(r.evidence.some((e) => e.startsWith(`${name} (syntax`) || e === `${name} (syntax)`), `${rule}: evidence names the file: ${JSON.stringify(r.evidence)}`);
    }
  });
}
