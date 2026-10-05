// Namespace reservation, and the non-shadow rule.
//
// Standard 7 R4: no rule id in this catalog may equal any rule id or alias defined by another pack.
// Enforced here against a recorded snapshot rather than by reading the sibling repositories at test
// time, so the suite does not depend on other checkouts existing. The snapshot can only ever be
// BEHIND — a rule added to another pack after it was taken would not be caught until it is
// refreshed, and refreshing it is a human action.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog, NAMESPACES, FOREIGN_NAMESPACES } from "../scripts/catalog.mjs";
import { REPO } from "./helpers.mjs";

const catalog = loadCatalog();
const inventory = JSON.parse(
  fs.readFileSync(path.join(REPO, "artifacts", "foreign-namespace-inventory.json"), "utf8"),
);

test("no rule id uses a namespace belonging to another pack", () => {
  for (const id of catalog.rules.keys()) {
    const namespace = id.split(".")[0];
    assert.ok(
      !FOREIGN_NAMESPACES.has(namespace),
      `${id} uses ${namespace}, which belongs to another pack. Record a crosswalk instead.`,
    );
  }
});

test("no rule id starts with ai. — that namespace is EngineeringStandards', permanently", () => {
  for (const id of catalog.rules.keys()) {
    assert.ok(!id.startsWith("ai."), `${id} must not use the ai. namespace`);
  }
});

test("every rule id uses a reserved namespace", () => {
  for (const id of catalog.rules.keys()) {
    assert.ok(NAMESPACES.has(id.split(".")[0]), `${id} uses an unreserved namespace`);
  }
});

test("no rule id collides with a recorded foreign rule id or alias", () => {
  const foreign = new Set();
  for (const pack of inventory.packs) {
    for (const id of pack.ruleIds) foreign.add(id);
    for (const alias of pack.aliases ?? []) foreign.add(alias);
  }
  for (const id of catalog.rules.keys()) {
    assert.ok(!foreign.has(id), `${id} collides with a rule id recorded in the foreign inventory`);
  }
  for (const alias of catalog.aliases.keys()) {
    assert.ok(!foreign.has(alias), `alias ${alias} collides with a recorded foreign id`);
  }
});

test("the foreign inventory records where each entry was read from, so it can be refreshed", () => {
  assert.ok(inventory.packs.length > 0, "the inventory must not be empty");
  for (const pack of inventory.packs) {
    assert.ok(pack.repository, "each pack records its repository");
    assert.ok(pack.readAt, "each pack records when it was read");
    assert.ok(Array.isArray(pack.ruleIds) && pack.ruleIds.length > 0, "each pack lists rule ids");
  }
});

test("the inventory is not vacuous — it actually contains the ids we most need to avoid", () => {
  // A snapshot that had silently become empty would make the collision test pass trivially.
  const all = new Set(inventory.packs.flatMap((p) => p.ruleIds));
  for (const id of [
    "ai.destructive-approval",
    "ai.no-fabricated-capabilities",
    "ai.no-safety-bypass",
    "ai.propose-execute",
    "testing.no-fabricated-results",
  ]) {
    assert.ok(all.has(id), `the inventory must record ${id}`);
  }
});

test("every crosswalk names a foreign rule, not one of ours", () => {
  for (const [id, rule] of catalog.rules) {
    for (const entry of rule.crosswalk ?? []) {
      assert.ok(
        !catalog.rules.has(entry.rule),
        `${id} crosswalks to ${entry.rule}, which is one of our own rules. A crosswalk names a FOREIGN rule.`,
      );
    }
  }
});

test("StandardsOrchestrator is cited only in order to refuse it, never conformed to", () => {
  // The use/mention split applied to governance: naming a frozen authority in order to reject it
  // must remain possible, or this very test file would be the violation.
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(mjs|json|yml|md)$/.test(entry.name)) continue;
      // This file states the patterns it searches for, so it would match itself. That is the
      // use/mention problem in miniature; excluding the detector from its own scan is the fix.
      if (full === fileURLToPath(import.meta.url)) continue;
      const text = fs.readFileSync(full, "utf8");
      // Conformance looks like a real module specifier, not a mention in prose.
      const imported =
        /from\s+["'][^"']*StandardsOrchestrator/.test(text) ||
        /require\(\s*["'][^"']*StandardsOrchestrator/.test(text);
      if (imported) offenders.push(path.relative(REPO, full));
    }
  };
  walk(REPO);
  assert.deepEqual(offenders, [], "nothing may import from or conform to StandardsOrchestrator");
});
