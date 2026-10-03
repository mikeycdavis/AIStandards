// Phase 1 boundaries, asserted rather than remembered.
//
// The plan defers attestations, exceptions, containers, workflows and the adapter to later
// phases, each for a stated reason — most importantly that an escape hatch must not be built before
// the checks it is an escape from. These tests fail if a later phase's feature appears early, so
// the deferral is enforced rather than merely intended.
//
// They also enforce the zero-dependency decision structurally.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REPO, cli, validate, fixture } from "./helpers.mjs";

const read = (rel) => fs.readFileSync(path.join(REPO, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(REPO, rel));

test("no third-party dependency is declared, and there is no lockfile", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.ok(!("dependencies" in pkg), "there must be no dependencies key at all");
  assert.ok(!("devDependencies" in pkg), "there must be no devDependencies key at all");
  for (const lock of ["package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "pnpm-lock.yaml"]) {
    assert.ok(!exists(lock), `${lock} must not exist`);
  }
  assert.ok(!exists("node_modules"), "node_modules must not exist");
});

test("every runtime import is a node: builtin or a local module", () => {
  const offenders = [];
  for (const file of fs.readdirSync(path.join(REPO, "scripts")).filter((f) => f.endsWith(".mjs"))) {
    const text = read(path.join("scripts", file));
    for (const m of text.matchAll(/(?:^|\n)\s*import[^;]*?from\s+["']([^"']+)["']/g)) {
      const spec = m[1];
      if (spec.startsWith("node:") || spec.startsWith(".") || spec.startsWith("/")) continue;
      offenders.push(`scripts/${file}: ${spec}`);
    }
  }
  assert.deepEqual(offenders, [], "a bare import specifier is a third-party dependency");
});

test("init exists, but only ever runs against an explicitly selected target", () => {
  // Built on purpose in Phase 2, after the checks and the scaffold guard it depends on. What must
  // still hold is that it cannot fall back to a default: a bare `init` is a refusal, never a run
  // against the working directory (which here is the pack checkout).
  assert.ok(exists("scripts/init.mjs"), "scripts/init.mjs is a Phase 2 deliverable and must exist");
  const r = cli(["init"]);
  assert.equal(r.code, 2, "init with no target must refuse");
  assert.match(r.stderr, /target directory is required/);
  assert.ok(!/not implemented/i.test(r.stderr), "init is implemented in this release");
});

test("the usage text advertises init, and still says attestations and exceptions are not implemented", () => {
  const r = cli([]);
  assert.match(r.stderr, /Usage: standards <audit\|validate\|init>/);
  assert.match(r.stderr, /^\s+init\s+Bootstrap/m);
  assert.match(r.stderr, /Not implemented in this release: attestations and exceptions \(Phase 4\)/);
});

test("Phase 4 features are absent: no attestations, no exceptions", () => {
  for (const rel of ["scripts/attestations.mjs", "scripts/reviews.mjs"]) {
    assert.ok(!exists(rel), `${rel} is Phase 4 and must not exist yet`);
  }
  const schema = JSON.parse(read("schemas/ai-policy.schema.json"));
  assert.ok(!("attestations" in schema.properties), "attestations are Phase 4");
  assert.ok(!("exceptions" in schema.properties), "exceptions are Phase 4");
  assert.equal(schema.additionalProperties, false, "the schema must be closed, so they cannot slip in");
});

test("an escape hatch cannot precede the checks: no result may be excepted or attested yet", () => {
  const { json } = validate(fixture("valid-manifest"));
  for (const r of json.results) {
    assert.ok(
      !["excepted", "attested"].includes(r.disposition),
      `${r.rule} reports ${r.disposition}, but that mechanism does not exist in this release`,
    );
  }
});

test("Phase 5 features are absent: no adapter, no containers, no workflows", () => {
  for (const rel of [
    "standards-adapter.json",
    "compose.ci.yml",
    "ci/Dockerfile",
    "scripts/pipeline.mjs",
    "scripts/ci.sh",
    "scripts/adapter.mjs",
    ".github/workflows",
  ]) {
    assert.ok(!exists(rel), `${rel} is Phase 5 and must not exist yet`);
  }
});

test("the Phase 2 tooling built so far exists, and the rest of Phase 2 does not", () => {
  // The two catalog reviews are the FIRST Phase 2 work, because every later phase builds on a
  // numbering they can still change. The rule-table generator and the document-conformance checker
  // followed on 2026-09-14, each admitted here deliberately. Manifest and tool-permission tooling,
  // init and the templates were built on 2026-09-19 and are admitted below.
  for (const rel of ["scripts/inventory.mjs", "scripts/fidelity.mjs", "scripts/spec.mjs"]) {
    assert.ok(exists(rel), `${rel} is a blocking review and must exist`);
  }
  for (const rel of ["scripts/sync-rule-tables.mjs", "scripts/standards-sections.mjs"]) {
    assert.ok(exists(rel), `${rel} is Phase 2 tooling already delivered and must exist`);
  }
  for (const rel of ["scripts/manifest.mjs", "scripts/toolperms.mjs", "scripts/init.mjs", "templates/index.json"]) {
    assert.ok(exists(rel), `${rel} is a planned Phase 2 deliverable, built on 2026-09-19, and must exist`);
  }
});

test("only the standards written so far exist", () => {
  // The guard is not that the corpus is frozen — Phase 2 writes the remaining 45. It is that a
  // standard arrives deliberately, by being added here, rather than by appearing unnoticed.
  const present = fs.readdirSync(path.join(REPO, "standards")).filter((f) => f.endsWith(".md")).sort();
  assert.deepEqual(present, [
    "01-ai-system-manifest.md",
    "02-ai-risk-tiering-and-applicability.md",
    "03-machine-readable-ai-policy.md",
    "05-verdict-vocabulary.md",
    "06-standard-structure-and-rule-identity.md",
    "07-boundary-with-adjacent-standards.md",
    "08-ai-safety-requirements-and-safety-cases.md",
    "09-misuse-and-abuse-prevention.md",
    "11-autonomy-levels-and-delegated-authority.md",
    "13-personal-data-in-ai-systems.md",
    "17-evaluation-plans-for-generative-systems.md",
    "21-prompt-and-instruction-security.md",
    "23-agent-execution-security.md",
    "25-grounding-and-hallucination-control.md",
    "45-approval-gates.md",
  ]);
});

test("the original prompt is unmodified", () => {
  // It is a governing input, not a working document.
  const text = read("artifacts/prompts/original_prompt.md");
  assert.match(text, /^Create a repository of practical, machine-checkable AI engineering standards/);
  assert.match(text, /Never weaken a test, policy, standard, or evidence requirement merely to make a gate pass\./);
});

test("no standard still calls its own number provisional", () => {
  // Numbering was provisional until the two Phase 2 reviews passed. They pass, and
  // artifacts/prompts/ai-standards-spec.md is now the record of identity, so a document still
  // describing its number as unsettled is stale rather than cautious.
  for (const file of fs.readdirSync(path.join(REPO, "standards")).filter((f) => f.endsWith(".md"))) {
    const text = read(path.join("standards", file));
    assert.ok(
      !/Provisional numbering/.test(text),
      `${file} still carries a provisional-numbering marker, but the reviews that would lift it have passed`,
    );
  }
});

test("every standard cites the specification item it implements", () => {
  // The replacement for the provisional marker: identity is now a citation into the specification
  // rather than a caveat about not having one.
  for (const file of fs.readdirSync(path.join(REPO, "standards")).filter((f) => f.endsWith(".md"))) {
    const text = read(path.join("standards", file));
    assert.match(
      text,
      /Source: item \d+ of \[`artifacts\/prompts\/ai-standards-spec\.md`\]/,
      `${file} must name the specification item it implements`,
    );
  }
});
