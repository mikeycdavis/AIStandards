// The adoption templates: what they are, that they stay honest, and that they cannot be mistaken
// for evidence. Contract: artifacts/project-plan-breakdown/02-phase-2-normative-corpus.md, section 12.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { REPO, validate, audit } from "./helpers.mjs";
import { parseYaml } from "../scripts/yaml.mjs";
import { validate as validateSchema } from "../scripts/jsonschema.mjs";
import { hasScaffoldTextMarker, inspectScaffolding } from "../scripts/scaffolding.mjs";
import { classifyManifest } from "../scripts/manifest.mjs";
import { classifyToolPermissions } from "../scripts/toolperms.mjs";
import { loadPolicy, assertVersionIdentity } from "../scripts/policy.mjs";

const TPL = path.join(REPO, "templates");
const read = (p) => fs.readFileSync(p, "utf8");
const readJson = (p) => JSON.parse(read(p));
const tpl = (name) => read(path.join(TPL, name));
const index = readJson(path.join(TPL, "index.json"));
const schema = (n) => readJson(path.join(REPO, "schemas", n));
const SCHEMAS = {
  manifest: schema("ai-system-manifest.schema.json"),
  tools: schema("tool-permissions.schema.json"),
  policy: schema("ai-policy.schema.json"),
};

const EXPECTED = [
  ["ai-system.yml", "ai-system.yml", "core", "yaml", "key"],
  ["tool-permissions.yml", "tool-permissions.yml", "core", "yaml", "key"],
  ["ai-policy.yml", "ai-policy.yml", "core", "yaml", "yaml-comment"],
  ...["AI-SYSTEM.md", "THREAT-MODEL.md", "EVALUATION-PLAN.md", "INCIDENT-REPORT.md", "RED-TEAM-REPORT.md", "ADR.md"].map(
    (n) => [n, `docs/ai/${n}`, "docs", "markdown", "markdown-comment"],
  ),
  ...["AGENTS.md", "CLAUDE.md", "copilot-instructions.md"].map((n) => [n, null, "reference", "markdown", "markdown-comment"]),
];

// --- index.json ------------------------------------------------------------------------------

test("index.json lists exactly the specified templates, groups, destinations and markers", () => {
  assert.equal(index.schemaVersion, "1.0");
  assert.deepEqual(
    index.templates.map((t) => [t.source, t.destination, t.group, t.format, t.marker]),
    EXPECTED,
  );
  for (const t of index.templates) assert.deepEqual(Object.keys(t).sort(), ["destination", "format", "group", "marker", "source"]);
});

test("every listed file exists, and every file in templates/ is listed", () => {
  const listed = new Set(index.templates.map((t) => t.source));
  assert.equal(listed.size, index.templates.length, "sources must be unique");
  for (const s of listed) assert.ok(fs.existsSync(path.join(TPL, s)), `${s} is listed but missing`);
  const onDisk = fs.readdirSync(TPL, { recursive: true }).filter((f) => fs.statSync(path.join(TPL, f)).isFile());
  const unlisted = onDisk.map((f) => f.split(path.sep).join("/")).filter((f) => f !== "index.json" && !listed.has(f));
  assert.deepEqual(unlisted, [], "a file in templates/ that index.json does not list");
});

test("destinations are unique, relative, and null exactly for the reference group", () => {
  const dests = index.templates.filter((t) => t.destination !== null).map((t) => t.destination);
  assert.equal(new Set(dests).size, dests.length);
  for (const t of index.templates) {
    assert.equal(t.destination === null, t.group === "reference", t.source);
    if (t.destination !== null) {
      assert.ok(!path.isAbsolute(t.destination) && !t.destination.split("/").includes(".."), t.destination);
    }
  }
});

test("the declared marker is actually present, in the declared form, in the real file text", () => {
  for (const t of index.templates) {
    const text = tpl(t.source);
    if (t.marker === "key") {
      const first = text.split(/\r?\n/).find((l) => l.trim() !== "");
      assert.equal(first, "$scaffold: true", `${t.source}: $scaffold must be the first line and key`);
      assert.equal(parseYaml(text).$scaffold, true);
      assert.equal(Object.keys(parseYaml(text))[0], "$scaffold", `${t.source}: first key`);
    } else if (t.marker === "yaml-comment") {
      assert.ok(hasScaffoldTextMarker(text));
      assert.match(text.split(/\r?\n/).find((l) => l.trim() !== ""), /^# AISTANDARDS-SCAFFOLD/);
    } else {
      assert.equal(t.marker, "markdown-comment");
      assert.ok(hasScaffoldTextMarker(text));
      assert.match(text.split(/\r?\n/).find((l) => l.trim() !== ""), /^<!-- AISTANDARDS-SCAFFOLD/);
    }
  }
});

test("negative control: stripping the marker is detected by the same check", () => {
  for (const t of index.templates.filter((x) => x.marker !== "key")) {
    const stripped = tpl(t.source).split(/\r?\n/).slice(1).join("\n");
    assert.equal(hasScaffoldTextMarker(stripped), false, t.source);
  }
});

test("no evaluation-plan.yml exists: no schema governs a plan's form", () => {
  assert.ok(!fs.existsSync(path.join(TPL, "evaluation-plan.yml")));
  assert.ok(!index.templates.some((t) => /evaluation-plan\.ya?ml/i.test(t.source)));
});

// --- Machine templates ------------------------------------------------------------------------

test("(a) each machine template classifies as scaffold, and validates against its schema", () => {
  const m = classifyManifest(tpl("ai-system.yml"));
  assert.equal(m.status, "scaffold");
  assert.deepEqual(validateSchema(parseYaml(tpl("ai-system.yml")), SCHEMAS.manifest), []);
  const p = classifyToolPermissions(tpl("tool-permissions.yml"));
  assert.equal(p.status, "scaffold");
  assert.deepEqual(validateSchema(parseYaml(tpl("tool-permissions.yml")), SCHEMAS.tools), []);
  assert.deepEqual(validateSchema(parseYaml(tpl("ai-policy.yml")), SCHEMAS.policy), []);
  assert.equal(inspectScaffolding(parseYaml(tpl("ai-system.yml"))).scaffold, true);
});

test("the manifest template declares only the four required values, all placeholders", () => {
  const doc = parseYaml(tpl("ai-system.yml"));
  assert.deepEqual(Object.keys(doc), ["$scaffold", "system", "models"]);
  assert.deepEqual(doc.system, { name: "REPLACE-ME", purpose: "REPLACE-ME" });
  assert.deepEqual(doc.models, [{ id: "REPLACE-ME", provider: "REPLACE-ME" }]);
});

test("the tool permission template declares no tool", () => {
  assert.deepEqual(parseYaml(tpl("tool-permissions.yml")), { $scaffold: true, tools: [] });
});

test("the policy template has no applicability block and no project", () => {
  const doc = parseYaml(tpl("ai-policy.yml"));
  assert.deepEqual(Object.keys(doc).sort(), ["rules", "standardVersion"]);
  for (const setting of Object.values(doc.rules)) assert.deepEqual(Object.keys(setting), ["level"]);
});

test("guidance in comments describes the schemas' real enums", () => {
  const impacts = SCHEMAS.tools.properties.tools.items.properties.impact.enum;
  const toolText = tpl("tool-permissions.yml");
  for (const v of impacts) assert.ok(toolText.includes(v), `impact ${v} should be described`);
  const manifest = SCHEMAS.manifest.properties;
  const text = tpl("ai-system.yml");
  for (const v of [...manifest.system.properties.lifecycleStage.enum, ...manifest.system.properties.autonomyTier.enum, ...manifest.dataSources.items.properties.kind.enum]) {
    assert.ok(text.includes(v), `${v} should be described`);
  }
});

// --- ai-policy.yml drift guard ---------------------------------------------------------------

function catalogRules() {
  const out = new Map();
  for (const f of fs.readdirSync(path.join(REPO, "rules")).filter((n) => n.endsWith(".json"))) {
    for (const r of readJson(path.join(REPO, "rules", f)).rules) out.set(r.id, r.level);
  }
  return out;
}

/** The drift comparison as a pure function, so a negative control can feed it a broken policy. */
function policyDrift(policy, catalog, version) {
  const problems = [];
  if (policy.standardVersion !== version) problems.push(`standardVersion ${policy.standardVersion} != ${version}`);
  const declared = policy.rules ?? {};
  for (const [id, level] of catalog) {
    if (!(id in declared)) problems.push(`missing ${id}`);
    else if (declared[id].level !== level) problems.push(`${id} is ${declared[id].level}, catalog says ${level}`);
  }
  for (const id of Object.keys(declared)) if (!catalog.has(id)) problems.push(`unknown ${id}`);
  return problems;
}

test("ai-policy.yml equals rules/*.json exactly, and standardVersion equals VERSION", () => {
  const catalog = catalogRules();
  assert.ok(catalog.size >= 46);
  const version = read(path.join(REPO, "VERSION")).trim();
  assert.deepEqual(policyDrift(parseYaml(tpl("ai-policy.yml")), catalog, version), []);
});

test("drift guard negative controls: a dropped rule, a lowered level, an extra id, a stale version", () => {
  const catalog = catalogRules();
  const version = read(path.join(REPO, "VERSION")).trim();
  const good = () => parseYaml(tpl("ai-policy.yml"));
  const [firstId, firstLevel] = [...catalog][0];

  const dropped = good();
  delete dropped.rules[firstId];
  assert.match(policyDrift(dropped, catalog, version).join(), /missing/);

  const lowered = good();
  lowered.rules[firstId].level = firstLevel === "optional" ? "required" : "optional";
  assert.match(policyDrift(lowered, catalog, version).join(), /catalog says/);

  const extra = good();
  extra.rules["agent.invented-rule"] = { level: "required" };
  assert.match(policyDrift(extra, catalog, version).join(), /unknown/);

  const stale = good();
  stale.standardVersion = "9.9.9";
  assert.match(policyDrift(stale, catalog, version).join(), /standardVersion/);
});

test("ai-policy.yml loads through the real policy loader and the version guard", () => {
  const version = read(path.join(REPO, "VERSION")).trim();
  const p = path.join(TPL, "ai-policy.yml");
  const policy = loadPolicy(p, SCHEMAS.policy);
  assertVersionIdentity(policy, version, p);
  assert.equal(Object.keys(policy.rules).length, catalogRules().size);
});

// --- Narrative templates ----------------------------------------------------------------------

const MARKDOWN = index.templates.filter((t) => t.format === "markdown").map((t) => t.source);

test("markdown templates carry prompts, not answers: every one still has REPLACE-ME to fill", () => {
  for (const name of MARKDOWN) assert.match(tpl(name), /REPLACE-ME/, name);
});

test("no template contains a fixed line-number reference", () => {
  const offenders = [];
  for (const t of index.templates) {
    const text = tpl(t.source);
    if (/\.(mjs|js|ts|md|json|ya?ml):\d+/.test(text) || /#L\d+/.test(text) || /\bline\s+\d+\b/i.test(text)) offenders.push(t.source);
  }
  assert.deepEqual(offenders, []);
  // Negative control: the pattern does fire on the thing it guards against.
  assert.ok(/\.(mjs|js):\d+/.test("scripts/standards.mjs:123"));
});

// Every backticked token in a Markdown template that names a schema field or enum value must exist
// in a schema. Tokens are permitted only when derivable from the schemas or when they are a file name.
function schemaVocabulary() {
  const words = new Set();
  const walk = (node, prefix) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node.enum)) node.enum.forEach((v) => words.add(String(v)));
    for (const [key, sub] of Object.entries(node.properties ?? {})) {
      words.add(key);
      words.add(prefix ? `${prefix}.${key}` : key);
      walk(sub, prefix ? `${prefix}.${key}` : key);
    }
    if (node.items) {
      walk(node.items, prefix);
    }
  };
  for (const s of [SCHEMAS.manifest, SCHEMAS.tools, SCHEMAS.policy]) walk(s, "");
  return words;
}

function unprovenTokens(text, vocabulary) {
  const bad = [];
  for (const m of text.matchAll(/`([^`\n]+)`/g)) {
    const token = m[1];
    if (/\.(ya?ml|md|json|mjs)$/.test(token)) continue; // file names are not schema claims
    if (!vocabulary.has(token)) bad.push(token);
  }
  return bad;
}

test("every backticked field or enum value in the markdown templates exists in a schema", () => {
  const vocab = schemaVocabulary();
  for (const key of ["evaluation.planPath", "evaluation.suiteCommand", "evaluation.baselinePath", "retrieval-index", "externally-visible", "dataSources", "models"]) {
    assert.ok(vocab.has(key), `vocabulary should contain ${key}`);
  }
  for (const name of MARKDOWN) assert.deepEqual(unprovenTokens(tpl(name), vocab), [], name);
});

test("negative control: an invented field or enum value is caught", () => {
  const vocab = schemaVocabulary();
  assert.deepEqual(unprovenTokens("use `evaluation.planPath` and `evaluation.planFile`", vocab), ["evaluation.planFile"]);
  assert.deepEqual(unprovenTokens("kind of `retrieval-index` or `vector-store`", vocab), ["vector-store"]);
});

test("EVALUATION-PLAN.md names only the real evaluation fields and says no schema governs a plan", () => {
  const text = tpl("EVALUATION-PLAN.md");
  const named = new Set([...text.matchAll(/`(evaluation\.[A-Za-z]+)`/g)].map((m) => m[1]));
  assert.deepEqual([...named].sort(), ["evaluation.baselinePath", "evaluation.planPath", "evaluation.suiteCommand"]);
  assert.match(text, /No schema in this release governs a plan's form/);
  assert.ok(!/MachineLearningStandards/.test(text), "must not restate or cite ML-owned requirements");
});

// --- Templates do not trip this pack's own detectors -------------------------------------------

function materialise() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-tpl-"));
  for (const t of index.templates) {
    if (t.destination === null) continue;
    const dest = path.join(dir, t.destination);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(TPL, t.source), dest);
  }
  return dir;
}

test("copied into a target, the templates produce exactly one failure and no pass", () => {
  const dir = materialise();
  try {
    const report = validate(dir).json;
    assert.ok(report, "validate produced a report");
    assert.equal(report.results.length, catalogRules().size);
    const failed = report.results.filter((r) => r.result === "failed").map((r) => r.rule);
    assert.deepEqual(failed, ["lifecycle.manifest-not-scaffold"]);
    assert.equal(report.results.filter((r) => r.result === "passed").length, 0, "no result may be passed");
    assert.equal(report.status, "NON_COMPLIANT");
    assert.equal(report.score, 0);

    const surface = audit(dir).json;
    assert.deepEqual(
      surface.findings.filter((f) => f.severity !== "info" || f.rule).map((f) => f.id),
      [],
      "audit must report nothing beyond descriptive observations",
    );
    assert.deepEqual(surface.findings.map((f) => f.id), ["detected-manifest"]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("control: the same check sees a pass when a completed manifest is present", () => {
  const dir = materialise();
  try {
    fs.writeFileSync(
      path.join(dir, "ai-system.yml"),
      'system:\n  name: "Example"\n  purpose: "Example"\nmodels:\n  - id: "m-2025-01-01"\n    provider: "p"\n',
    );
    const report = validate(dir).json;
    assert.ok(report.results.some((r) => r.result === "passed"), "a written manifest must be able to pass");
    assert.ok(!report.results.some((r) => r.result === "failed" && r.rule === "lifecycle.manifest-not-scaffold"));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
