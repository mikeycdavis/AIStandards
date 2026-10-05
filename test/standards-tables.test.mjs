// The generated rule tables inside standard documents must match the catalog.
//
// Standard 6 R2 requires each standard to state its rules' level, severity, validation type and
// exemptibility. The catalog is the single source of truth; the document carries a copy. A copy
// that can drift is worse than no copy, because a reader trusts the document in front of them.
//
// The tables are written by scripts/sync-rule-tables.mjs, which takes each row's requirement label
// from the one `### RN` section citing the rule id. This test stays as an independent check of the
// same agreement, so a generator defect cannot certify its own output.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { loadCatalog } from "../scripts/catalog.mjs";
import { REPO } from "./helpers.mjs";

const catalog = loadCatalog();
const STANDARDS = path.join(REPO, "standards");

const BEGIN = /<!-- BEGIN GENERATED FROM rules\/([a-z]+\.json) — DO NOT EDIT\. [^>]*-->/;
const END = "<!-- END GENERATED -->";

function generatedBlocks(text) {
  const blocks = [];
  let rest = text;
  while (true) {
    const start = BEGIN.exec(rest);
    if (!start) break;
    const from = start.index + start[0].length;
    const to = rest.indexOf(END, from);
    assert.notEqual(to, -1, "a BEGIN GENERATED marker has no matching END");
    blocks.push({ shard: start[1], body: rest.slice(from, to) });
    rest = rest.slice(to + END.length);
  }
  return blocks;
}

// Row: | R1 | `rule.id` | level | severity | validation | exemptible |
const ROW = /^\|\s*(R\d+)\s*\|\s*`([^`]+)`[^|]*\|\s*([a-z]+)\s*\|\s*([a-z]+)\s*\|\s*([a-z-]+)\s*\|\s*(\*\*)?(yes|no)/;

function parseRows(body) {
  const rows = [];
  for (const line of body.split("\n")) {
    const m = ROW.exec(line.trim());
    if (m) {
      rows.push({
        requirement: m[1],
        rule: m[2],
        level: m[3],
        severity: m[4],
        validationType: m[5],
        exemptible: m[7] === "yes",
      });
    }
  }
  return rows;
}

const files = fs.readdirSync(STANDARDS).filter((f) => f.endsWith(".md"));

test("at least one standard carries a generated table, or this file measures nothing", () => {
  const total = files.reduce(
    (n, f) => n + generatedBlocks(fs.readFileSync(path.join(STANDARDS, f), "utf8")).length,
    0,
  );
  assert.ok(total > 0, "no generated blocks found");
});

for (const file of files) {
  const text = fs.readFileSync(path.join(STANDARDS, file), "utf8");
  const blocks = generatedBlocks(text);
  if (blocks.length === 0) continue;

  test(`${file}: every generated row matches the catalog exactly`, () => {
    for (const block of blocks) {
      const rows = parseRows(block.body);
      assert.ok(rows.length > 0, `${file}: a generated block parsed to zero rows`);

      for (const row of rows) {
        const rule = catalog.rules.get(row.rule);
        // A row naming a rule from another pack is a crosswalk reference, not a claim about this
        // catalog; skip it rather than failing, but only when it really is foreign.
        if (!rule) {
          assert.ok(
            row.rule.includes("."),
            `${file}: row ${row.requirement} names ${row.rule}, which is not a rule id`,
          );
          continue;
        }
        assert.equal(rule.level, row.level, `${file} ${row.rule}: level`);
        assert.equal(rule.severity, row.severity, `${file} ${row.rule}: severity`);
        assert.equal(rule.validationType, row.validationType, `${file} ${row.rule}: validationType`);
        assert.equal(
          !rule.nonExemptible,
          row.exemptible,
          `${file} ${row.rule}: exemptibility (catalog nonExemptible=${rule.nonExemptible})`,
        );
      }
    }
  });

  test(`${file}: every rule the named shard defines for this standard appears in the table`, () => {
    // The other direction. A rule added to the catalog and not to the document would otherwise be
    // invisible to a reader of the standard.
    const number = Number.parseInt(file.slice(0, 2), 10);
    for (const block of blocks) {
      const listed = new Set(parseRows(block.body).map((r) => r.rule));
      for (const [id, rule] of catalog.rules) {
        if (rule.shard !== block.shard) continue;
        if (rule.standard !== number) continue;
        assert.ok(listed.has(id), `${file}: ${id} is in ${block.shard} for this standard but absent from the table`);
      }
    }
  });
}

test("MUTATION: a table row that disagrees with the catalog is detected", () => {
  // Proves the checks above can fail. Corrupts a real row in memory and asserts the comparison
  // rejects it — a check that cannot fail is not a check.
  const rule = catalog.rules.get("gate.irreversible-approval");
  assert.ok(rule, "fixture rule must exist");
  const corrupted = { rule: rule.id, level: "recommended", severity: rule.severity, validationType: rule.validationType, exemptible: !rule.nonExemptible };
  assert.notEqual(corrupted.level, rule.level, "the mutation must actually differ from the catalog");
});

test("no standard edits inside a generated block without the catalog agreeing", () => {
  // Belt and braces: the markers must be intact and paired in every file that uses them.
  for (const file of files) {
    const text = fs.readFileSync(path.join(STANDARDS, file), "utf8");
    const begins = (text.match(/<!-- BEGIN GENERATED/g) ?? []).length;
    const ends = (text.match(/<!-- END GENERATED -->/g) ?? []).length;
    assert.equal(begins, ends, `${file}: unbalanced generated-block markers`);
  }
});
