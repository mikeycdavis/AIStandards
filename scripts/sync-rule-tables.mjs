#!/usr/bin/env node
// Writes the rule tables inside standard documents from the catalog, or checks that they match.
//
// THE CATALOG IS THE SOURCE OF TRUTH. `rules/*.json` defines each rule's level, severity,
// validation type and exemptibility; a standard document carries a copy of those four facts inside
// a generated block. This script rewrites the body of every block from the catalog, and `--check`
// reports — without writing — any block that differs from what it would write.
//
// THE REQUIREMENT LABEL IS READ FROM THE DOCUMENT, NEVER GUESSED. Rules carry no requirement field.
// A rule's label is the `### R<n> — ` section under `## Requirements` whose body cites the rule id in
// backticks. A rule cited in no section, or in more than one, is an error: a label inferred from
// shard order or table position would be a claim about the document that the document never made.
//
// EVERY SHARD WITH RULES FOR A WRITTEN STANDARD HAS A BLOCK IN ITS DOCUMENT. A written standard is a
// `standards/NN-*.md` file, and NN is its number. For each shard holding at least one rule whose
// `standard` is NN, that document must carry a block naming the shard; a missing one is reported with
// the document, the shard and the uncovered rule ids, even when the document's other blocks are
// present and in sync. Checking only the blocks that exist would pass a document that never shows a
// reader its rules. A standard with rules but no document (not yet written, under the phased plan)
// and a written standard with no rules both need nothing. No order between blocks is required.
// Coverage omission is malformed input, exit 2 in both modes: write mode never inserts a block,
// because where a table belongs in the prose is an authoring decision, not a rendering one.
//
// NOTHING OUTSIDE A BLOCK IS TOUCHED. The marker lines and every byte around them are preserved, and
// each block is rendered with the document's own line terminator. A document that mixes CRLF and bare
// LF is refused rather than normalised, because normalising it would rewrite bytes nobody asked about.
//
// ANY MALFORMED INPUT MEANS NOTHING IS WRITTEN. A partial regeneration is a state no reviewer asked
// for. A run that finds no generated block at all is a configuration error, not a pass.
//
// Usage: node scripts/sync-rule-tables.mjs [--root=<dir>] [--check]
// Exit 0 in sync, or written · 1 drift found (--check only) · 2 malformed input (including a written
// standard missing a block for a shard that holds its rules, in either mode) or configuration error.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadCatalog, CatalogError } from "./catalog.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT = path.resolve(HERE, "..");

// The marker grammar. BEGIN matches test/standards-tables.test.mjs, anchored to a whole line.
export const BEGIN_MARKER = /^<!-- BEGIN GENERATED FROM rules\/([a-z]+\.json) — DO NOT EDIT\. [^>]*-->$/;
export const END_MARKER = "<!-- END GENERATED -->";
// Any line carrying marker text must be exactly a marker. The table verifier counts marker text
// anywhere in a file, so a marker mentioned mid-line would be a block to one tool and prose to the
// other; refusing it keeps the two in agreement.
const MARKER_TEXT = /<!-- (BEGIN|END) GENERATED/;

export const TABLE_HEADER = "| Requirement | Rule | Level | Severity | Validation | Exemptible |";
export const TABLE_SEPARATOR = "| --- | --- | --- | --- | --- | --- |";

const REQUIREMENT_HEADING = /^### R(\d+) — /;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
// The filename prefix that makes a document a written standard, and the one documentNumber reads.
const NUMBER_PREFIX = /^(\d{2})-/;

const USAGE =
  "Usage: node scripts/sync-rule-tables.mjs [--root=<dir>] [--check]\n" +
  "Exit 0 in sync, or written; 1 drift found (--check only); 2 malformed input or configuration error.\n" +
  "A written standard missing a block for a shard that holds its rules is malformed input (exit 2) in\n" +
  "both modes; write mode never inserts a block.\n";

export class SyncError extends Error {
  constructor(message) {
    super(message);
    this.name = "SyncError";
  }
}

/** The document's line terminator. Mixed terminators are an error, never normalised. */
export function detectEol(text, where) {
  const crlf = text.includes("\r\n");
  const bareLf = /(^|[^\r])\n/.test(text);
  if (crlf && bareLf) {
    throw new SyncError(
      `${where}: mixes CRLF and bare LF line endings. The block cannot be rendered in the file's own ` +
      "line ending when the file has two; normalise the file deliberately, then re-run.",
    );
  }
  return crlf ? "\r\n" : "\n";
}

/** Paired BEGIN/END marker lines, as 0-based line indexes. Throws on any unpaired or malformed marker. */
export function findBlocks(lines, where) {
  const blocks = [];
  let open = null;
  lines.forEach((line, i) => {
    if (!MARKER_TEXT.test(line)) return;
    const n = i + 1;
    const begin = BEGIN_MARKER.exec(line);
    if (begin) {
      if (open) {
        throw new SyncError(
          `${where}:${n}: nested BEGIN GENERATED marker; the block opened at line ${open.begin + 1} has no END yet`,
        );
      }
      open = { shard: begin[1], begin: i };
      return;
    }
    if (line === END_MARKER) {
      if (!open) throw new SyncError(`${where}:${n}: END GENERATED marker without a preceding BEGIN GENERATED marker`);
      blocks.push({ ...open, end: i });
      open = null;
      return;
    }
    throw new SyncError(
      `${where}:${n}: malformed generated-block marker. A marker must be a whole line of the form ` +
      `"<!-- BEGIN GENERATED FROM rules/<shard>.json — DO NOT EDIT. ... -->" or "${END_MARKER}": ` +
      JSON.stringify(line),
    );
  });
  if (open) throw new SyncError(`${where}:${open.begin + 1}: BEGIN GENERATED marker has no matching END GENERATED marker`);
  return blocks;
}

/** Tracks fenced code so headings inside a fence are not read as headings. */
function fenceTracker() {
  let fence = null;
  return (line) => {
    const m = FENCE.exec(line);
    if (m) {
      if (fence === null) fence = m[1][0];
      else if (m[1][0] === fence) fence = null;
      return true;
    }
    return fence !== null;
  };
}

/** The standard number, from the NN- filename prefix, cross-checked against the `# Standard N — ` H1. */
export function documentNumber(file, lines, where) {
  const prefix = NUMBER_PREFIX.exec(file);
  if (!prefix) {
    throw new SyncError(`${where}: filename has no two-digit NN- prefix, so the standard it documents cannot be established`);
  }
  const number = Number.parseInt(prefix[1], 10);
  const inFence = fenceTracker();
  for (let i = 0; i < lines.length; i += 1) {
    const line = i === 0 ? lines[i].replace(/^﻿/, "") : lines[i];
    if (inFence(line)) continue;
    if (!/^# /.test(line)) continue;
    const h1 = /^# Standard (\d+) — /.exec(line);
    if (!h1) throw new SyncError(`${where}:${i + 1}: the first H1 is not of the form "# Standard N — Title"`);
    if (Number.parseInt(h1[1], 10) !== number) {
      throw new SyncError(`${where}:${i + 1}: H1 names Standard ${h1[1]} but the filename prefix names Standard ${number}`);
    }
    return number;
  }
  throw new SyncError(`${where}: no "# Standard N — Title" H1, so the filename's standard number cannot be cross-checked`);
}

/** Every `### R<n> — ` section under `## Requirements`, with its body lines (heading excluded). */
export function requirementSections(lines, where) {
  const sections = [];
  const inFence = fenceTracker();
  let inRequirements = false;
  let current = null;
  lines.forEach((line, i) => {
    if (inFence(line)) {
      if (current) current.body.push(line);
      return;
    }
    if (/^#{1,2}\s/.test(line)) {
      inRequirements = /^## Requirements\s*$/.test(line);
      current = null;
      return;
    }
    if (!inRequirements) return;
    if (/^###\s/.test(line)) {
      const m = REQUIREMENT_HEADING.exec(line);
      current = null;
      if (!m) return; // Another H3 ends the requirement section above it and opens nothing.
      const number = Number.parseInt(m[1], 10);
      const earlier = sections.find((s) => s.number === number);
      if (earlier) {
        throw new SyncError(`${where}:${i + 1}: requirement R${number} appears more than once (first at line ${earlier.line})`);
      }
      current = { label: `R${m[1]}`, number, line: i + 1, body: [] };
      sections.push(current);
      return;
    }
    if (current) current.body.push(line);
  });
  return sections;
}

/** The expected body lines of one block: blank, header, separator, rows, blank. */
export function renderBlock({ shard, number, sections, catalog, where, markerLine }) {
  const candidates = [];
  let order = 0;
  for (const rule of catalog.rules.values()) {
    if (rule.shard !== shard) continue;
    const position = order;
    order += 1;
    if (rule.standard === number) candidates.push({ rule, position });
  }
  if (candidates.length === 0) {
    throw new SyncError(
      `${where}:${markerLine}: the block would render zero rows — rules/${shard} defines no rule for Standard ${number}`,
    );
  }

  const problems = [];
  for (const candidate of candidates) {
    const token = `\`${candidate.rule.id}\``;
    const hits = sections.filter((s) => s.body.some((l) => l.includes(token)));
    if (hits.length === 1) {
      candidate.section = hits[0];
    } else if (hits.length === 0) {
      problems.push(
        `${where}: ${candidate.rule.id} (rules/${shard}) is cited in no requirement section, so its requirement ` +
        (sections.length === 0 ? 'label cannot be established — the document has no "### R<n> — " sections under "## Requirements"' : "label cannot be established"),
      );
    } else {
      problems.push(
        `${where}: ${candidate.rule.id} (rules/${shard}) is cited in more than one requirement section ` +
        `(${hits.map((s) => s.label).join(", ")}), so its requirement label is ambiguous`,
      );
    }
  }
  if (problems.length > 0) throw new SyncError(problems.join("\n"));

  candidates.sort((a, b) => a.section.number - b.section.number || a.position - b.position);
  const rows = candidates.map(({ rule, section }) =>
    `| ${section.label} | \`${rule.id}\` | ${rule.level} | ${rule.severity} | ${rule.validationType} | ${rule.nonExemptible ? "**no**" : "yes"} |`,
  );
  return ["", TABLE_HEADER, TABLE_SEPARATOR, ...rows, ""];
}

/**
 * The regenerated text of one document, or null when it carries no marker text at all.
 * `drift` is the first line that differs from what would be written, or null when in sync.
 * `shards` names every block's shard, in document order, for the coverage check.
 */
export function syncDocument({ file, buffer, catalog }) {
  const where = `standards/${file}`;
  const text = buffer.toString("utf8");
  if (!MARKER_TEXT.test(text)) return null;
  if (!Buffer.from(text, "utf8").equals(buffer)) {
    throw new SyncError(`${where}: is not valid UTF-8, so it cannot be rewritten byte-for-byte outside its blocks`);
  }

  const eol = detectEol(text, where);
  const lines = text.split(eol);
  const blocks = findBlocks(lines, where);
  const number = documentNumber(file, lines, where);
  const sections = requirementSections(lines, where);

  const out = [];
  const seen = new Map();
  let cursor = 0;
  let drift = null;
  for (const block of blocks) {
    const markerLine = block.begin + 1;
    if (!catalog.shards.includes(block.shard)) {
      throw new SyncError(`${where}:${markerLine}: the marker names rules/${block.shard}, which is not a shard in the catalog`);
    }
    if (seen.has(block.shard)) {
      throw new SyncError(
        `${where}:${markerLine}: more than one generated block names rules/${block.shard} (the first is at line ${seen.get(block.shard)})`,
      );
    }
    seen.set(block.shard, markerLine);

    const expected = renderBlock({ shard: block.shard, number, sections, catalog, where, markerLine });
    const actual = lines.slice(block.begin + 1, block.end);
    if (drift === null) {
      for (let k = 0; k < Math.max(expected.length, actual.length); k += 1) {
        if (expected[k] !== actual[k]) {
          drift = {
            line: block.begin + 2 + k,
            expected: expected[k] ?? "(nothing: the block should end before this line)",
            found: actual[k] ?? "(nothing: the block ends here)",
          };
          break;
        }
      }
    }
    out.push(...lines.slice(cursor, block.begin + 1), ...expected);
    cursor = block.end;
  }
  out.push(...lines.slice(cursor));

  const newText = out.join(eol);
  const changed = newText !== text;
  if (changed !== (drift !== null)) {
    // Splitting and re-joining on one terminator is an identity, so this cannot happen unless the
    // rendering itself is wrong. Refusing is better than writing a file the check disagrees with.
    throw new Error(`${where}: internal inconsistency between drift detection and regenerated text`);
  }
  return { file, rel: where, blocks: blocks.length, shards: blocks.map((b) => b.shard), eol, newText, changed, drift };
}

/**
 * Standard number → shard → the ids of that shard's rules for that standard, in catalog order.
 * Shards come out in the catalog's sorted shard order, so every message built from this is stable.
 */
export function requiredCoverage(catalog) {
  const byStandard = new Map();
  for (const rule of catalog.rules.values()) {
    if (!byStandard.has(rule.standard)) byStandard.set(rule.standard, new Map());
    const shards = byStandard.get(rule.standard);
    if (!shards.has(rule.shard)) shards.set(rule.shard, []);
    shards.get(rule.shard).push(rule.id);
  }
  return byStandard;
}

/**
 * Every shard that holds rules for this document's standard and that no block in it names.
 * A file without the NN- prefix is not a written standard and needs nothing here. The number is the
 * filename's, as in documentNumber; a document with blocks has already had its H1 cross-checked.
 */
export function coverageProblems({ file, shards, coverage }) {
  const prefix = NUMBER_PREFIX.exec(file);
  if (!prefix) return [];
  const number = Number.parseInt(prefix[1], 10);
  const needed = coverage.get(number);
  if (!needed) return [];
  const present = new Set(shards);
  const problems = [];
  for (const [shard, ids] of needed) {
    if (present.has(shard)) continue;
    problems.push(
      `standards/${file}: coverage omitted — no generated block names rules/${shard}, which holds ` +
      `${ids.length} rule(s) for Standard ${number}: ${ids.join(", ")}. Add the block where the table ` +
      "belongs; write mode never inserts one.",
    );
  }
  return problems;
}

/** Plan a sync of every standards/*.md under root. Throws SyncError on any malformed input; writes nothing. */
export function planSync(root) {
  const resolved = path.resolve(root);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new SyncError(`root ${resolved} is not a directory`);
  }
  const rulesDir = path.join(resolved, "rules");
  const standardsDir = path.join(resolved, "standards");
  for (const [dir, name] of [[rulesDir, "rules/"], [standardsDir, "standards/"]]) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      throw new SyncError(`root ${resolved} has no ${name} directory`);
    }
  }

  let catalog;
  try {
    catalog = loadCatalog(rulesDir);
  } catch (err) {
    if (err instanceof CatalogError) throw new SyncError(`the catalog in ${rulesDir} failed to load: ${err.message}`);
    throw err;
  }
  const coverage = requiredCoverage(catalog);

  const names = fs
    .readdirSync(standardsDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort();

  const documents = [];
  const errors = [];
  for (const file of names) {
    let doc;
    try {
      doc = syncDocument({ file, buffer: fs.readFileSync(path.join(standardsDir, file)), catalog });
    } catch (err) {
      if (!(err instanceof SyncError)) throw err;
      // A document that could not be read has already failed the run, and its blocks are not known,
      // so its coverage is not judged: a coverage message built on a guess would be noise.
      errors.push(err.message);
      continue;
    }
    if (doc) documents.push(doc);
    errors.push(...coverageProblems({ file, shards: doc ? doc.shards : [], coverage }));
  }
  if (errors.length > 0) throw new SyncError(errors.join("\n"));

  const blocks = documents.reduce((n, d) => n + d.blocks, 0);
  if (blocks === 0) {
    throw new SyncError(
      `no generated blocks found in ${standardsDir}${path.sep}*.md. A run with nothing to generate is a ` +
      "configuration error, not a pass.",
    );
  }
  return { root: resolved, documents, blocks };
}

export function main(argv, { stdout = process.stdout, stderr = process.stderr } = {}) {
  let check = false;
  let root = DEFAULT_ROOT;
  for (const arg of argv) {
    if (arg === "--check") check = true;
    else if (arg.startsWith("--root=") && arg.length > "--root=".length) root = arg.slice("--root=".length);
    else {
      stderr.write(`sync-rule-tables: unknown argument ${JSON.stringify(arg)}\n${USAGE}`);
      return 2;
    }
  }

  let plan;
  try {
    plan = planSync(root);
  } catch (err) {
    if (!(err instanceof SyncError)) throw err;
    stderr.write(`${err.message.split("\n").map((l) => `sync-rule-tables: ${l}`).join("\n")}\n`);
    return 2;
  }

  const summary = `${plan.blocks} generated block(s) in ${plan.documents.length} document(s)`;
  const changed = plan.documents.filter((d) => d.changed);

  if (check) {
    if (changed.length === 0) {
      stdout.write(`sync-rule-tables: ${summary} match the catalog.\n`);
      return 0;
    }
    for (const d of changed) {
      stdout.write(
        `sync-rule-tables: DRIFT ${d.rel}:${d.drift.line}\n` +
        `  expected: ${d.drift.expected}\n` +
        `  found:    ${d.drift.found}\n`,
      );
    }
    stdout.write(
      `sync-rule-tables: ${changed.length} document(s) differ from the catalog. ` +
      "Run without --check to regenerate.\n",
    );
    return 1;
  }

  for (const d of changed) {
    fs.writeFileSync(path.join(plan.root, "standards", d.file), d.newText, "utf8");
    stdout.write(`sync-rule-tables: wrote ${d.rel}\n`);
  }
  if (changed.length === 0) stdout.write(`sync-rule-tables: no changes; ${summary} already match the catalog.\n`);
  return 0;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`sync-rule-tables: unexpected error: ${err?.stack ?? err}\n`);
    process.exitCode = 2;
  }
}
