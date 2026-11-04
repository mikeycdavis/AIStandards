// Documentation conformance for ST-60 (#122): Standard 21, the assurance notes of the two inline-prompt
// rules and docs/structural-reader.md must say what the structural layer actually does, and must keep
// saying it. This reads text only; the behaviour itself is pinned by structural*.test.mjs.
//
// What it checks, and what it cannot:
//   * every named non-claim of decision F (and the ones recorded by C and E) is named in the standard
//     and in both notes, so deleting one is a failing test and not a silent narrowing;
//   * the structural scope in the text is the scope the code has (STRUCTURAL_EXTENSIONS);
//   * the unparseable outcome is stated as unknown, never a pass, with no lexical fallback;
//   * the documented schema versions are the versions the real commands emit and the schemas require;
//   * every reason and every location field of the closed schemas is documented.
// It cannot show that a sentence is adequate, only that it is present.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { REPO, fixture, audit, validate } from "./helpers.mjs";
import { STRUCTURAL_EXTENSIONS } from "../scripts/structural.mjs";

const read = (...p) => fs.readFileSync(path.join(REPO, ...p), "utf8").replace(/\r\n/g, "\n");
const STANDARD = read("standards", "21-prompt-and-instruction-security.md");
const READER = read("docs", "structural-reader.md");
const RULES = JSON.parse(read("rules", "promptsec.json")).rules;
const AUDIT_SCHEMA = JSON.parse(read("schemas", "audit-report.schema.json"));
const VALIDATE_SCHEMA = JSON.parse(read("schemas", "validate-report.schema.json"));

const flat = (s) => s.replace(/\s+/g, " ");
const SECTION = (() => {
  const i = STANDARD.indexOf("### Reading configuration files");
  assert.notEqual(i, -1, "Standard 21 has a 'Reading configuration files' section");
  return flat(STANDARD.slice(i));
})();

// [label, a pattern that must be present]. Each is a distinct named non-claim.
const NON_CLAIMS = [
  ["JSONC", /JSONC/],
  ["JSON5", /JSON5/],
  ["JSONL/NDJSON", /JSONL and NDJSON|JSONL\/NDJSON/],
  ["templates", /templates/],
  ["Markdown fences", /Markdown fences/],
  ["notebooks", /notebooks/],
  ["extensionless files", /extensionless files/],
  ["mismatched extension", /mismatch|does not match its extension/],
  ["complex-key system", /complex/],
  ["aliases and merge keys not followed", /aliases and merge keys/],
  ["block scalars", /block scalar/],
  ["block-style systemInstruction", /block-style (YAML )?`?systemInstruction/],
];

test("Standard 21 names the structural scope exactly as the code has it", () => {
  for (const ext of STRUCTURAL_EXTENSIONS) assert.ok(SECTION.includes("`" + ext + "`"), `scope names ${ext}`);
  assert.match(SECTION, /A file whose name ends in `\.yml`, `\.yaml` or `\.json`, matched case-insensitively on the file name, is read as a parsed tree/);
  assert.match(SECTION, /JSON text in a `\.yml` file is read as YAML, and YAML in a `\.json` file does not parse/);
  assert.match(SECTION, /case-insensitively/);
  assert.match(SECTION, /Nothing is sniffed from content/);
  assert.match(SECTION, /TOML/);
  assert.match(SECTION, /misuse\.safety-controls-not-disabled/);
  assert.match(SECTION, /stays on the lexical layer/);
});

for (const [label, pattern] of NON_CLAIMS) {
  test(`Standard 21 names the non-claim: ${label}`, () => assert.match(SECTION, pattern));
  test(`both inline-prompt assurance notes carry the non-claim: ${label}`, () => {
    // The second rule's note defers to the first by name, so it is checked through that reference.
    const first = RULES.find((r) => r.id === "promptsec.prompt-is-versioned-artifact").$assuranceNote;
    assert.match(flat(first), pattern);
    const second = RULES.find((r) => r.id === "promptsec.no-inline-system-prompt").$assuranceNote;
    assert.match(second, /promptsec\.prompt-is-versioned-artifact/);
    assert.match(second, /named non-claims/);
  });
}

test("the JSONC and JSON5 non-claim states that a JSONC file named .json is unknown, not leniently read", () => {
  assert.match(SECTION, /- JSONC and JSON5 \(a JSONC file named `\*\.json` does not parse, so it is unknown, not leniently read\);/);
});

test("the unparseable outcome is unknown, never a pass, with no lexical fallback or recovery", () => {
  assert.match(SECTION, /unknown, not clean/);
  assert.match(SECTION, /Unknown is never a pass/);
  assert.match(SECTION, /not scanned as text instead/);
  assert.match(SECTION, /in the first release no part of it is recovered/);
  assert.match(SECTION, /In the first release no file is exempt for being a template/);
  assert.match(SECTION, /Lifting either limit would be a later decision, not made here\./);
  assert.match(SECTION, /evidenceSurface\.unparseableFiles/);
  // The second rule's note defers to the first by name (checked above); the first carries the outcome.
  const note = flat(RULES.find((r) => r.id === "promptsec.prompt-is-versioned-artifact").$assuranceNote);
  assert.match(note, /reported unknown/);
  assert.match(note, /never passed/);
  assert.match(note, /never scanned as text/);
  assert.match(flat(RULES.find((r) => r.id === "promptsec.no-inline-system-prompt").$assuranceNote), /unknown outcome for an unparseable YAML or JSON file/);
});

test("every failure reason the reader can return has a cause in the Standard 21 unknown paragraph", () => {
  const para = SECTION.slice(SECTION.indexOf("A file the parser cannot read is unknown"), SECTION.indexOf("Named non-claims"));
  for (const phrase of ["syntax error", "not valid UTF-8", "UTF-16 byte order mark", "control character", "lone carriage return", "512 KiB", "undefined alias", "empty JSON document", "parser exception", "unreadable file"])
    assert.ok(para.includes(phrase), `cause named: ${phrase}`);
});

test("the measurement is stated in code points, and the source-code unit is stated as different", () => {
  assert.match(SECTION, /Unicode code points/);
  assert.match(SECTION, /UTF-16 code units/);
  assert.match(SECTION, /which unit\s+should govern is not decided/);
});

test("the unparseable outcome is falsifiable under Standard 6 R3", () => {
  const row = flat(STANDARD).match(/\| R1, R2 \(YAML and JSON\) \|[^\n]*?\|/);
  assert.ok(row, "the tests table has a YAML and JSON row with a falsifier");
  assert.match(flat(STANDARD), /It reports `passed`, produces a finding of its own, or is scanned as text instead/);
});

test("the documented schema versions are the versions the real commands emit and the schemas require", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-docs-"));
  try {
    const base = fixture("inline-system-prompt");
    for (const f of ["ai-policy.yml", "ai-system.yml"]) fs.copyFileSync(path.join(base, f), path.join(dir, f));
    const auditVersion = audit(dir).json.schemaVersion;
    const validateVersion = validate(dir).json.schemaVersion;
    assert.equal(AUDIT_SCHEMA.properties.schemaVersion.const, auditVersion);
    assert.equal(VALIDATE_SCHEMA.properties.schemaVersion.const, validateVersion);
    const flatReader = flat(READER);
    assert.ok(flatReader.includes("| `audit --json` | `schemas/audit-report.schema.json` | `" + auditVersion + "` |"), "audit row");
    assert.ok(flatReader.includes("| `validate --json` | `schemas/validate-report.schema.json` | `" + validateVersion + "` |"), "validate row");
    assert.match(flat(STANDARD), /versioned and additive/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the schema section documents every failure reason and every location and unparseable field", () => {
  const i = READER.indexOf("## The report schemas");
  assert.notEqual(i, -1);
  const j = READER.indexOf("## Failure outcomes");
  const schemaSection = flat(READER.slice(i, j));
  const reasons = AUDIT_SCHEMA.$defs.unparseableFile.properties.reason.enum;
  const reasonList = flat(READER.slice(j, READER.indexOf("Findings from files that did parse")));
  for (const reason of reasons) assert.ok(reasonList.includes("`" + reason + "`"), `reason ${reason} is listed`);
  const unparseableFields = Object.keys(AUDIT_SCHEMA.$defs.unparseableFile.properties);
  for (const field of unparseableFields) assert.ok(schemaSection.includes(field), `unparseable field ${field}`);
  const locationProps = VALIDATE_SCHEMA.properties.results.items.properties.locations.items.properties;
  for (const field of Object.keys(locationProps)) assert.ok(schemaSection.includes(field), `location field ${field}`);
  for (const field of ["locationsOmitted", "duplicateKeysEvaluated", "aliasesNotFollowed", "mergeKeysNotApplied", "filesParsed"]) {
    assert.ok(schemaSection.includes(field), field);
  }
});
