// Document conformance: scripts/standards-sections.mjs.
//
// Every case spawns the real script as a subprocess, as the rest of this suite does, against a root
// built in a temporary directory from ONE conforming base fixture
// (test/fixtures/standards-sections/conforming). Each failing case changes one thing and asserts
// the exact set of finding kinds, so a check that over-reports fails as surely as one that
// under-reports. Every edit asserts that it actually changed the text, so no mutation is vacuous.
//
// Nothing here writes into the repository. The real-repository case reads it and nothing more.

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { REPO, fixture } from "./helpers.mjs";

const SCRIPT = path.join(REPO, "scripts", "standards-sections.mjs");
const BASE = fixture(path.join("standards-sections", "conforming"));
const DOC1 = "standards/01-first-example.md";
const DOC2 = "standards/02-second-example.md";
const SPEC = "artifacts/prompts/ai-standards-spec.md";

const lf = (text) => text.replace(/\r\n/g, "\n");

const temps = [];
after(() => {
  for (const dir of temps) fs.rmSync(dir, { recursive: true, force: true });
});
function tempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "standards-sections-"));
  temps.push(dir);
  return dir;
}

function listFiles(dir, rel = "") {
  const out = [];
  for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const child = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...listFiles(dir, child));
    else out.push(child);
  }
  return out;
}

/**
 * A root copied from the base fixture. `edits` maps a root-relative path to a function of the
 * file's LF text (undefined for a new file) returning the new text, or null to delete the file.
 */
function variant(edits = {}, { eol = "\n" } = {}) {
  const root = tempDir();
  const paths = new Set([...listFiles(BASE), ...Object.keys(edits)]);
  for (const rel of paths) {
    const source = path.join(BASE, rel);
    const original = fs.existsSync(source) ? lf(fs.readFileSync(source, "utf8")) : undefined;
    const text = edits[rel] ? edits[rel](original) : original;
    if (text === null) continue;
    const target = path.join(root, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, eol === "\n" ? text : text.replace(/\n/g, eol));
  }
  return root;
}

function replaceOnce(text, from, to) {
  const count = text.split(from).length - 1;
  assert.equal(count, 1, `the edit expects ${JSON.stringify(from)} exactly once, found ${count}`);
  const next = text.replace(from, () => to);
  assert.notEqual(next, text, "the edit must change the text");
  return next;
}

/** The LF text from `## heading` up to (not including) the next H2, or the end. */
function sectionBlock(text, heading) {
  const start = text.indexOf(`\n## ${heading}\n`);
  assert.notEqual(start, -1, `the fixture must contain "## ${heading}"`);
  const next = text.indexOf("\n## ", start + 1);
  return text.slice(start + 1, next === -1 ? text.length : next + 1);
}

const removeSection = (text, heading) => replaceOnce(text, sectionBlock(text, heading), "");
const setBody = (text, heading, body) => replaceOnce(text, sectionBlock(text, heading), `## ${heading}\n${body}`);
const swapAdjacent = (text, a, b) => {
  const blockA = sectionBlock(text, a);
  const blockB = sectionBlock(text, b);
  return replaceOnce(text, blockA + blockB, blockB + blockA);
};

function run(root, { args = ["--json"], script = SCRIPT } = {}) {
  const r = spawnSync(process.execPath, [script, ...(root === null ? [] : [`--root=${root}`]), ...args], {
    encoding: "utf8",
    cwd: REPO,
  });
  assert.equal(r.error, undefined, `spawn failed: ${r.error}`);
  let json = null;
  if (args.includes("--json") && r.stdout.trim() !== "") {
    try {
      json = JSON.parse(r.stdout);
    } catch {
      assert.fail(`--json stdout was not JSON.\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
    }
  }
  return { code: r.status, stdout: r.stdout, stderr: r.stderr, json };
}

const doc = (report, file) => {
  const d = report.documents.find((x) => x.file === file);
  assert.ok(d, `the report has no entry for ${file}`);
  return d;
};
const kinds = (report, file) => doc(report, file).findings.map((f) => f.kind).sort();

/** One document fails with exactly these kinds; every other document still conforms. */
function assertOnly(r, file, expectedKinds) {
  assert.equal(r.code, 1, `expected exit 1.\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  assert.equal(r.json.result, "findings");
  assert.deepEqual(kinds(r.json, file), [...expectedKinds].sort(), JSON.stringify(doc(r.json, file).findings, null, 2));
  assert.equal(r.json.documents.length, 2, "both fixture documents must be checked");
  for (const other of r.json.documents.filter((d) => d.file !== file)) {
    assert.equal(other.conforms, true, `${other.file} was not edited and must still conform`);
  }
  assert.deepEqual(r.json.rootFindings, []);
}

// ---------------------------------------------------------------------------------------------
// Positive cases

test("the conforming base passes, resolving all nine brief requirements in each document", () => {
  const r = run(variant());
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.equal(r.json.result, "conforms");
  assert.equal(r.json.summary.documents, 2);
  assert.equal(r.json.summary.findings, 0);
  assert.equal(r.json.summary.observations, 0);
  for (const d of r.json.documents) {
    assert.deepEqual(d.findings, []);
    assert.equal(d.briefRequirements.length, 9);
    assert.ok(d.briefRequirements.every((b) => b.resolved && b.reason === null && b.line > 0));
  }
  const shared = doc(r.json, DOC1).briefRequirements.filter((b) => b.section === "Validation, severity, and exemptibility");
  assert.deepEqual(shared.map((b) => b.number), [5, 6], "brief requirements 5 and 6 share one section");
});

test("an unwritten specification item is never required to exist, and is reported not evaluated", () => {
  const r = run(variant());
  assert.equal(r.code, 0);
  assert.deepEqual(r.json.notEvaluated.unwrittenItems, [3]);
  const all = JSON.stringify([...r.json.rootFindings, ...r.json.documents.flatMap((d) => d.findings)]);
  assert.ok(!/item 3\b/.test(all), "item 3 is unwritten and must produce no finding");
});

test("a CRLF root conforms exactly as an LF root does", () => {
  const crlf = run(variant({}, { eol: "\r\n" }));
  const plain = run(variant({}, { eol: "\n" }));
  assert.equal(crlf.code, 0, crlf.stdout + crlf.stderr);
  assert.equal(plain.code, 0);
  const strip = (report) => report.documents;
  assert.deepEqual(strip(crlf.json), strip(plain.json), "line endings must not change any line number or result");
});

test("a CRLF document still fails when it is wrong", () => {
  const r = run(variant({ [DOC1]: (t) => removeSection(t, "Evidence") }, { eol: "\r\n" }));
  assertOnly(r, DOC1, ["missing-section", "brief-requirement-unresolved"]);
});

test("the text report passes and fails with the same exit codes as --json", () => {
  const pass = run(variant(), { args: [] });
  assert.equal(pass.code, 0);
  assert.match(pass.stdout, /^PASS — /m);
  assert.match(pass.stdout, /does not establish that any section says anything adequate/);
  const fail = run(variant({ [DOC1]: (t) => removeSection(t, "Scope") }), { args: [] });
  assert.equal(fail.code, 1);
  assert.match(fail.stdout, /^FAIL — 2 finding\(s\):/m);
  assert.match(fail.stdout, /\[missing-section\] no "## Scope" heading/);
});

// ---------------------------------------------------------------------------------------------
// Structure: Standard 6 R2

test("a missing required section fails, and the brief requirement it carries is unresolved", () => {
  const r = run(variant({ [DOC1]: (t) => removeSection(t, "Evidence") }));
  assertOnly(r, DOC1, ["missing-section", "brief-requirement-unresolved"]);
  const unresolved = doc(r.json, DOC1).briefRequirements.filter((b) => !b.resolved);
  assert.deepEqual(unresolved.map((b) => [b.number, b.reason]), [[4, "absent"]]);
});

test("removing the shared section leaves BOTH brief requirements 5 and 6 unresolved", () => {
  const r = run(variant({ [DOC1]: (t) => removeSection(t, "Validation, severity, and exemptibility") }));
  assertOnly(r, DOC1, ["missing-section", "brief-requirement-unresolved", "brief-requirement-unresolved"]);
});

test("removing an inherited section fails even though no brief requirement goes unresolved", () => {
  const r = run(variant({ [DOC1]: (t) => removeSection(t, "Implementation") }));
  assertOnly(r, DOC1, ["missing-section"]);
  assert.ok(doc(r.json, DOC1).briefRequirements.every((b) => b.resolved));
});

test("a section misspelled without its commas is missing, and the near-miss is named", () => {
  const r = run(variant({
    [DOC1]: (t) => replaceOnce(t, "## Validation, severity, and exemptibility\n", "## Validation severity and exemptibility\n"),
  }));
  assertOnly(r, DOC1, ["missing-section", "brief-requirement-unresolved", "brief-requirement-unresolved"]);
  const missing = doc(r.json, DOC1).findings.find((f) => f.kind === "missing-section");
  assert.match(missing.message, /differs from it only in case or punctuation/);
  assert.equal(doc(r.json, DOC1).observations.length, 1);
});

test("a duplicated required section fails", () => {
  const r = run(variant({ [DOC1]: (t) => `${t}\n## Scope\n\nAgain.\n` }));
  assertOnly(r, DOC1, ["duplicate-section"]);
});

test("required sections out of order fail", () => {
  const r = run(variant({ [DOC1]: (t) => swapAdjacent(t, "Failure modes", "Evidence") }));
  assertOnly(r, DOC1, ["sections-out-of-order"]);
});

test("an empty required section fails", () => {
  const r = run(variant({ [DOC1]: (t) => setBody(t, "Failure modes", "\n   \n\n") }));
  assertOnly(r, DOC1, ["empty-section", "brief-requirement-unresolved"]);
  const b = doc(r.json, DOC1).briefRequirements.find((x) => x.number === 3);
  assert.equal(b.reason, "empty");
});

test("a section holding only an HTML comment is empty", () => {
  const single = run(variant({ [DOC1]: (t) => setBody(t, "Evidence", "\n<!-- to be written -->\n\n") }));
  assertOnly(single, DOC1, ["empty-section", "brief-requirement-unresolved"]);
  const multi = run(variant({ [DOC1]: (t) => setBody(t, "Evidence", "\n<!--\nTo be written.\nLater.\n-->\n\n") }));
  assertOnly(multi, DOC1, ["empty-section", "brief-requirement-unresolved"]);
});

test("a section holding only a generated table is NOT empty", () => {
  const table =
    "\n<!-- BEGIN GENERATED FROM rules/example.json — DO NOT EDIT. Fixture only. -->\n\n" +
    "| Requirement | Rule | Level | Severity | Validation | Exemptible |\n" +
    "| --- | --- | --- | --- | --- | --- |\n" +
    "| R1 | `example.fixture` | required | error | structural | yes |\n\n" +
    "<!-- END GENERATED -->\n\n";
  const r = run(variant({ [DOC1]: (t) => setBody(t, "Validation, severity, and exemptibility", table) }));
  assert.equal(r.code, 0, r.stdout + r.stderr);

  // The falsifier: the same markers with nothing between them are empty.
  const hollow = "\n<!-- BEGIN GENERATED FROM rules/example.json — DO NOT EDIT. Fixture only. -->\n\n<!-- END GENERATED -->\n\n";
  const bad = run(variant({ [DOC1]: (t) => setBody(t, "Validation, severity, and exemptibility", hollow) }));
  assertOnly(bad, DOC1, ["empty-section", "brief-requirement-unresolved", "brief-requirement-unresolved"]);
});

test("headings inside fenced code and HTML comment blocks are ignored", () => {
  const inert =
    "\n```markdown\n## Scope\n## Evidence\n# Standard 9 — Not an H1\n```\n\n" +
    "~~~~\n## Implementation\n```\n## Requirements\n~~~~\n\n" +
    "<!--\n## Failure modes\n-->\n\nContent.\n\n";
  const r = run(variant({ [DOC1]: (t) => setBody(t, "Requirements", inert) }));
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.equal(doc(r.json, DOC1).observations.length, 0);

  // The control: the same headings outside the fences are duplicates, so the fixture above really
  // would be caught if fences were read as structure.
  const exposed = run(variant({ [DOC1]: (t) => setBody(t, "Requirements", "\n## Scope\n\nContent.\n\n") }));
  assert.equal(exposed.code, 1);
  assert.ok(kinds(exposed.json, DOC1).includes("duplicate-section"));
});

test("an unclosed fence is reported, not silently read as the rest of the document", () => {
  const r = run(variant({ [DOC1]: (t) => replaceOnce(t, "**The fixture MUST be conforming.**\n", "**The fixture MUST be conforming.**\n\n```text\nnever closed\n") }));
  assert.equal(r.code, 1);
  const k = kinds(r.json, DOC1);
  assert.ok(k.includes("unclosed-fence"), JSON.stringify(k));
  assert.ok(k.includes("missing-section"), "the sections swallowed by the fence are missing");
});

test("an H2 that is not a required section is an observation, not a failure", () => {
  const r = run(variant({ [DOC1]: (t) => replaceOnce(t, "## Implementation\n", "## Notes\n\nAn extra section.\n\n## Implementation\n") }));
  assert.equal(r.code, 0, "an observation must not change the exit code");
  assert.equal(r.json.result, "conforms");
  const obs = doc(r.json, DOC1).observations;
  assert.equal(obs.length, 1);
  assert.equal(obs[0].kind, "unrecognized-section");
  assert.match(obs[0].message, /"## Notes"/);
  assert.match(obs[0].message, /does not forbid others/);
  assert.equal(r.json.summary.observations, 1);
  assert.match(r.json.observationPolicy, /does not change the exit code/);

  const text = run(variant({ [DOC1]: (t) => replaceOnce(t, "## Implementation\n", "## Notes\n\nAn extra section.\n\n## Implementation\n") }), { args: [] });
  assert.equal(text.code, 0);
  assert.match(text.stdout, /OBSERVATIONS — 1\. These do not change the exit code/);
});

// ---------------------------------------------------------------------------------------------
// Identity and provenance: Standard 6 R1 and the specification row

test("an H1 whose number disagrees with the file name fails", () => {
  const r = run(variant({ [DOC1]: (t) => replaceOnce(t, "# Standard 1 — ", "# Standard 7 — ") }));
  assertOnly(r, DOC1, ["h1-number-mismatch"]);
});

test("an H1 title that differs from the specification title by one character fails", () => {
  const r = run(variant({ [DOC1]: (t) => replaceOnce(t, "# Standard 1 — First Example Standard\n", "# Standard 1 — First Example standard\n") }));
  assertOnly(r, DOC1, ["title-mismatch"]);
});

test("an H1 with a hyphen instead of an em dash is malformed, and says so", () => {
  const r = run(variant({ [DOC1]: (t) => replaceOnce(t, "# Standard 1 — ", "# Standard 1 - ") }));
  assertOnly(r, DOC1, ["h1-malformed"]);
  assert.match(doc(r.json, DOC1).findings[0].message, /em dash \(U\+2014\)/);
});

test("an H1 that is not the first line is malformed", () => {
  const r = run(variant({ [DOC1]: (t) => `\n${t}` }));
  assertOnly(r, DOC1, ["h1-malformed"]);
});

test("a file name that is not NN-kebab-case-title.md fails", () => {
  const renamed = "standards/01-First_Example.md";
  const r = run(variant({
    [DOC1]: () => null,
    [renamed]: () => lf(fs.readFileSync(path.join(BASE, DOC1), "utf8")),
    [SPEC]: (t) => replaceOnce(t, `| ${DOC1} |`, `| ${renamed} |`),
  }));
  assertOnly(r, renamed, ["filename-malformed"]);
});

test("a missing Source line fails, and a Source line only in a fence does not count", () => {
  const sourceLine = "Source: item 1 of [`artifacts/prompts/ai-standards-spec.md`](../artifacts/prompts/ai-standards-spec.md),\n";
  const missing = run(variant({ [DOC1]: (t) => replaceOnce(t, sourceLine, "") }));
  assertOnly(missing, DOC1, ["source-missing"]);
  const fenced = run(variant({ [DOC1]: (t) => replaceOnce(t, sourceLine, `\`\`\`\n${sourceLine}\`\`\`\n`) }));
  assertOnly(fenced, DOC1, ["source-missing"]);
  const prose = run(variant({ [DOC1]: (t) => replaceOnce(t, sourceLine, "Source: item 1 of the specification,\n") }));
  assertOnly(prose, DOC1, ["source-missing"]);
});

test("a Source line citing the wrong item fails", () => {
  const r = run(variant({ [DOC1]: (t) => replaceOnce(t, "Source: item 1 of", "Source: item 2 of") }));
  assertOnly(r, DOC1, ["source-item-mismatch"]);
});

test("a specification row that does not claim the document fails", () => {
  const unclaimed = run(variant({ [SPEC]: (t) => replaceOnce(t, `| O | ${DOC1} |`, "| O | — |") }));
  assertOnly(unclaimed, DOC1, ["spec-claim-mismatch"]);
  assert.match(doc(unclaimed.json, DOC1).findings[0].message, /records no document/);
});

test("a specification row claiming a different path fails, and the claimed path is reported missing", () => {
  const r = run(variant({ [SPEC]: (t) => replaceOnce(t, `| O | ${DOC1} |`, "| O | standards/01-elsewhere.md |") }));
  assert.equal(r.code, 1);
  assert.deepEqual(kinds(r.json, DOC1), ["spec-claim-mismatch"]);
  assert.deepEqual(r.json.rootFindings.map((f) => f.kind), ["claimed-document-missing"]);
});

test("a document with no specification row fails", () => {
  const r = run(variant({
    [SPEC]: (t) => replaceOnce(t, `| 1 | First Example Standard | A | — | O | ${DOC1} |\n`, ""),
  }));
  assertOnly(r, DOC1, ["spec-item-missing"]);
});

test("a second specification item claiming the same document fails", () => {
  const r = run(variant({ [SPEC]: (t) => replaceOnce(t, "| 3 | Unwritten Example | A | — | O | — |", `| 3 | Unwritten Example | A | — | O | ${DOC1} |`) }));
  assertOnly(r, DOC1, ["claimed-by-other-item"]);
});

// ---------------------------------------------------------------------------------------------
// Configuration errors: exit 2, never a pass

test("zero standard documents is a configuration error, not a pass", () => {
  const r = run(variant({ [DOC1]: () => null, [DOC2]: () => null, "standards/README.txt": () => "not a standard\n" }));
  assert.equal(r.code, 2, r.stdout + r.stderr);
  assert.equal(r.json, null, "a configuration error emits no report");
  assert.match(r.stderr, /no standard documents/);
});

test("a missing standards directory, missing specification, unparseable or empty specification are exit 2", () => {
  const noStandards = run(variant({ [DOC1]: () => null, [DOC2]: () => null }));
  // With both documents gone the directory is not created at all.
  assert.equal(noStandards.code, 2);
  assert.match(noStandards.stderr, /is not a directory/);

  const noSpec = run(variant({ [SPEC]: () => null }));
  assert.equal(noSpec.code, 2);
  assert.match(noSpec.stderr, /cannot be read/);

  const badRow = run(variant({ [SPEC]: (t) => replaceOnce(t, "| 3 | Unwritten Example | A | — | O | — |", "| 3 | Unwritten Example | A | O | — |") }));
  assert.equal(badRow.code, 2);
  assert.match(badRow.stderr, /does not parse: .*must have 6 cells/);

  const noItems = run(variant({ [SPEC]: () => "# A specification with no catalog\n" }));
  assert.equal(noItems.code, 2);
  assert.match(noItems.stderr, /lists no catalog items/);
});

test("bad arguments are exit 2", () => {
  const root = variant();
  for (const args of [["--bogus"], ["--json", "--json"], ["--root="], ["positional"]]) {
    const r = run(root, { args });
    assert.equal(r.code, 2, `${JSON.stringify(args)} must be exit 2`);
    assert.match(r.stderr, /Usage: /);
  }
  const nowhere = run(path.join(tempDir(), "does-not-exist"));
  assert.equal(nowhere.code, 2);
  assert.match(nowhere.stderr, /is not a directory/);
});

// ---------------------------------------------------------------------------------------------
// The mapping: the brief's nine must never go uncovered silently

/** A copy of the script (and the spec module it imports) with its mapping edited. */
function mutatedScript(edit) {
  const dir = path.join(tempDir(), "scripts");
  fs.mkdirSync(dir);
  const original = lf(fs.readFileSync(SCRIPT, "utf8"));
  fs.writeFileSync(path.join(dir, "standards-sections.mjs"), edit(original));
  fs.copyFileSync(path.join(REPO, "scripts", "spec.mjs"), path.join(dir, "spec.mjs"));
  return path.join(dir, "standards-sections.mjs");
}

test("MUTATION control: an unedited copy of the script passes, so the copy mechanism is sound", () => {
  const r = run(variant(), { script: mutatedScript((t) => t) });
  assert.equal(r.code, 0, r.stdout + r.stderr);
});

test("MUTATION: a brief requirement dropped from the mapping is a configuration error", () => {
  const script = mutatedScript((t) => replaceOnce(t, '  4: "Evidence",\n', ""));
  const r = run(variant(), { script });
  assert.equal(r.code, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /brief requirement 4 \("Evidence required to demonstrate compliance"\) maps to no section/);
});

test("MUTATION: a brief requirement mapped to a heading that is not required is a configuration error", () => {
  const script = mutatedScript((t) => replaceOnce(t, '  7: "Tests and falsifiers",\n', '  7: "Test plan",\n'));
  const r = run(variant(), { script });
  assert.equal(r.code, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /brief requirement 7 .* maps to "## Test plan", which is not a required section/);
});

test("MUTATION: a section dropped from the required list while still mapped is a configuration error", () => {
  const script = mutatedScript((t) => replaceOnce(t, '  "Evidence",\n', ""));
  const r = run(variant(), { script });
  assert.equal(r.code, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /brief requirement 4 .* maps to "## Evidence", which is not a required section/);
});

test("MUTATION: a required section neither mapped nor inherited is a configuration error", () => {
  const script = mutatedScript((t) => replaceOnce(
    t,
    '  "Additions this standard makes beyond the source",\n  "Implementation",\n]);',
    '  "Additions this standard makes beyond the source",\n]);',
  ));
  const r = run(variant(), { script });
  assert.equal(r.code, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /required section "## Implementation" carries no brief requirement and is not declared inherited/);
});

test("MUTATION: a consistent rename in the mapping fails every document until the documents agree", () => {
  // Standard 6 R2: a change that merges or splits a section must update the mapping, "and the test
  // fails until it does". This is the other half: the mapping changed and the documents did not.
  const script = mutatedScript((t) => {
    assert.equal(t.split('"Tests and falsifiers"').length - 1, 2, "the heading appears once in each table");
    return t.replaceAll('"Tests and falsifiers"', '"Tests"');
  });
  const r = run(variant(), { script });
  assert.equal(r.code, 1, r.stdout + r.stderr);
  for (const file of [DOC1, DOC2]) {
    assert.deepEqual(kinds(r.json, file), ["brief-requirement-unresolved", "missing-section"]);
    assert.deepEqual(doc(r.json, file).briefRequirements.filter((b) => !b.resolved).map((b) => b.number), [7]);
    assert.deepEqual(doc(r.json, file).observations.map((o) => o.kind), ["unrecognized-section"]);
  }
});

// ---------------------------------------------------------------------------------------------
// The real repository — read only, and strict

test("the mapping's nine statements are the brief's nine, word for word", () => {
  const brief = lf(fs.readFileSync(path.join(REPO, "artifacts", "prompts", "original_prompt.md"), "utf8"));
  const start = brief.indexOf("Each standard must clearly state:\n");
  assert.notEqual(start, -1, "the brief's list must be findable");
  const listed = [];
  for (const line of brief.slice(start).split("\n").slice(1)) {
    if (line.trim() === "") { if (listed.length > 0) break; continue; }
    const m = /^(\d+)\. (.+)$/.exec(line);
    if (!m) break;
    listed.push({ number: Number(m[1]), statement: m[2] });
  }
  const r = run(REPO);
  assert.deepEqual(r.json.mapping.briefRequirements.map(({ number, statement }) => ({ number, statement })), listed);
  assert.equal(listed.length, 9);
});

test("the real repository conforms: every written standard, all nine requirements resolved", () => {
  const onDisk = fs.readdirSync(path.join(REPO, "standards")).filter((f) => f.endsWith(".md")).sort();
  assert.ok(onDisk.length > 0);

  const byDefault = run(null);
  const explicit = run(REPO);
  for (const r of [byDefault, explicit]) {
    assert.equal(r.code, 0, `the real repository must conform.\n${r.stdout}\n${r.stderr}`);
    assert.deepEqual(r.json.documents.map((d) => d.file), onDisk.map((f) => `standards/${f}`));
    assert.deepEqual(r.json.rootFindings, []);
    for (const d of r.json.documents) {
      assert.deepEqual(d.findings, [], `${d.file} has findings`);
      assert.equal(d.briefRequirements.filter((b) => b.resolved).length, 9, `${d.file}: all nine must resolve`);
    }
  }
  assert.deepEqual(byDefault.json.documents, explicit.json.documents, "the default root is the repository root");
});
