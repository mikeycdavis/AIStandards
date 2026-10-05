// The rule-table generator: scripts/sync-rule-tables.mjs.
//
// Every test spawns the script as a subprocess, so argument parsing, the directory read and the write
// are what is exercised. Write-mode and malformed-input tests run against a temporary copy of a
// fixture root; nothing here writes into the repository or into the committed fixtures.
//
// LINE ENDINGS ARE SET AT RUNTIME, not trusted from the checkout. This repository pins no
// .gitattributes and core.autocrlf varies by machine, so a committed fixture arrives LF on one machine
// and CRLF on another, and a mixed-EOL file cannot be committed at all.

import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { REPO } from "./helpers.mjs";

const SCRIPT = path.join(REPO, "scripts", "sync-rule-tables.mjs");
const FIXTURES = path.join(REPO, "test", "fixtures", "sync-rule-tables");
const IN_SYNC = path.join(FIXTURES, "in-sync");
const DOC90 = "standards/90-fixture-cost-controls.md";
const DOC91 = "standards/91-fixture-fairness.md";
const DOC92 = "standards/92-fixture-no-blocks.md";
const EOLS = [["LF", "\n"], ["CRLF", "\r\n"]];

function run(args) {
  // cwd is a temp directory on purpose: the default root must come from the script's location.
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8", cwd: os.tmpdir() });
  assert.equal(r.error, undefined, `spawn failed: ${r.error}`);
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}
const check = (root) => run([`--root=${root}`, "--check"]);
const write = (root) => run([`--root=${root}`]);
const show = (r) => `exit ${r.code}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`;

function copyTree(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else fs.copyFileSync(from, to);
  }
}

/** A temporary root built from fixture trees, each later tree overlaid on the ones before it. */
function tempRoot(t, ...sources) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sync-rule-tables-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const src of sources) copyTree(src, root);
  return root;
}

/** Content and mtime of every file under a directory. */
function snapshot(dir) {
  const files = new Map();
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.set(path.relative(dir, full), { bytes: fs.readFileSync(full), mtimeMs: fs.statSync(full).mtimeMs });
    }
  };
  walk(dir);
  return files;
}

function assertUntouched(before, after, why) {
  assert.deepEqual([...after.keys()].sort(), [...before.keys()].sort(), `${why}: the set of files changed`);
  for (const [rel, b] of before) {
    const a = after.get(rel);
    assert.ok(a.bytes.equals(b.bytes), `${why}: ${rel} content changed`);
    assert.equal(a.mtimeMs, b.mtimeMs, `${why}: ${rel} mtime changed`);
  }
}

const read = (root, rel) => fs.readFileSync(path.join(root, rel), "utf8");
const put = (root, rel, text) => fs.writeFileSync(path.join(root, rel), text, "utf8");
const toEol = (text, eol) => {
  const lf = text.replace(/\r\n/g, "\n");
  return eol === "\n" ? lf : lf.replace(/\n/g, "\r\n");
};
function setEol(root, eol) {
  for (const file of fs.readdirSync(path.join(root, "standards"))) {
    const rel = `standards/${file}`;
    put(root, rel, toEol(read(root, rel), eol));
  }
}
const BLOCK = /(<!-- BEGIN GENERATED[^\n]*\n)[\s\S]*?(<!-- END GENERATED -->)/g;
const stripBlocks = (text) => text.replace(BLOCK, "$1$2");
const tableRows = (text) => text.split(/\r?\n/).filter((l) => /^\| R\d+ \|/.test(l));
const hasBareLf = (text) => /(^|[^\r])\n/.test(text);

// ---------------------------------------------------------------------------------------------
// In sync
// ---------------------------------------------------------------------------------------------

test("in sync: --check exits 0 against the committed fixture and modifies nothing", () => {
  const before = snapshot(IN_SYNC);
  const r = check(IN_SYNC);
  assert.equal(r.code, 0, show(r));
  assert.match(r.stdout, /3 generated block\(s\) in 2 document\(s\) match the catalog/);
  assertUntouched(before, snapshot(IN_SYNC), "--check");
});

for (const [name, eol] of EOLS) {
  test(`in sync (${name}): write mode changes no byte and no mtime`, (t) => {
    const root = tempRoot(t, IN_SYNC);
    setEol(root, eol);
    const before = snapshot(root);
    const r = write(root);
    assert.equal(r.code, 0, show(r));
    assert.match(r.stdout, /no changes/);
    assertUntouched(before, snapshot(root), "write on an in-sync root");
  });
}

test("rows: only the named shard's rules for this standard, by requirement number, ties by shard position", (t) => {
  const root = tempRoot(t, IN_SYNC);
  const original = read(root, DOC90);
  put(root, DOC90, stripBlocks(original));
  assert.deepEqual(tableRows(read(root, DOC90)), [], "the mutation must actually empty the block");

  assert.equal(check(root).code, 1, "an emptied block is drift");
  const r = write(root);
  assert.equal(r.code, 0, show(r));
  const text = read(root, DOC90);
  assert.deepEqual(tableRows(text), [
    "| R1 | `cost.fixture-budget-declared` | required | error | structural | yes |",
    "| R2 | `cost.fixture-no-unbounded-loop` | forbidden | error | manual-review | **no** |",
    "| R3 | `cost.fixture-spend-alerting` | recommended | warning | configuration | yes |",
    "| R3 | `cost.fixture-owner-named` | optional | info | document | yes |",
  ]);
  // Same shard, other standard; same standard, other shard. Neither belongs in this table.
  assert.doesNotMatch(text, /cost\.fixture-other-standard|cost\.fixture-model-behaviour|fairness\.fixture-cohort-report/);
  assert.equal(text, original, "regenerating an emptied block reproduces the committed document exactly");
});

test("rows: a document with two blocks, a fenced heading and a non-requirement H3 regenerates exactly", (t) => {
  // The fence holds a heading-shaped `### R9 — ` line; were it read as a heading, R1's rule would be
  // labelled R9. The `### Notes` H3 cites an R3 rule; were it read as part of R2, that rule would be
  // cited twice.
  const root = tempRoot(t, IN_SYNC);
  const original = read(root, DOC91);
  put(root, DOC91, stripBlocks(original));
  assert.equal(tableRows(read(root, DOC91)).length, 0);
  assert.equal(write(root).code, 0);
  assert.equal(read(root, DOC91), original);
});

// ---------------------------------------------------------------------------------------------
// Drift
// ---------------------------------------------------------------------------------------------

const DRIFT_CASES = [
  {
    name: "drifted-row",
    expected: /expected: \| R2 \| `cost\.fixture-no-unbounded-loop` \| forbidden \|/,
    found: /found: {4}\| R2 \| `cost\.fixture-no-unbounded-loop` \| required \|/,
  },
  {
    name: "missing-row",
    expected: /expected: \| R3 \| `cost\.fixture-owner-named` \| optional \|/,
    found: /^ {2}found: {4}$/m,
  },
  {
    name: "extra-row",
    expected: /^ {2}expected: $/m,
    found: /found: {4}\| R4 \| `cost\.fixture-retired` \|/,
  },
];

for (const c of DRIFT_CASES) {
  test(`${c.name}: --check exits 1 naming the file and first differing row; write fixes it; a second write is a no-op`, (t) => {
    const root = tempRoot(t, path.join(FIXTURES, c.name));
    const original = read(root, DOC90);
    const before = snapshot(root);

    const r = check(root);
    assert.equal(r.code, 1, show(r));
    const at = /DRIFT standards\/90-fixture-cost-controls\.md:(\d+)/.exec(r.stdout);
    assert.ok(at, `the drifted file and line must be named:\n${r.stdout}`);
    assert.match(r.stdout, c.expected);
    assert.match(r.stdout, c.found);
    const foundText = /^ {2}found: {4}(.*)$/m.exec(r.stdout)[1];
    assert.equal(original.split(/\r?\n/)[Number(at[1]) - 1], foundText, "the reported line number points at the reported text");
    assertUntouched(before, snapshot(root), "--check on a drifted root");

    const w = write(root);
    assert.equal(w.code, 0, show(w));
    assert.match(w.stdout, /wrote standards\/90-fixture-cost-controls\.md/);
    assert.equal(
      toEol(read(root, DOC90), "\n"),
      toEol(read(IN_SYNC, DOC90), "\n"),
      "the written document equals the in-sync fixture",
    );

    const after = check(root);
    assert.equal(after.code, 0, `write then --check must pass\n${show(after)}`);

    const settled = snapshot(root);
    const second = write(root);
    assert.equal(second.code, 0, show(second));
    assert.match(second.stdout, /no changes/);
    assertUntouched(settled, snapshot(root), "a second write");
  });
}

test("deterministic: two independent writes of the same input produce identical bytes", (t) => {
  const a = tempRoot(t, path.join(FIXTURES, "drifted-row"));
  const b = tempRoot(t, path.join(FIXTURES, "drifted-row"));
  assert.equal(write(a).code, 0);
  assert.equal(write(b).code, 0);
  const sa = snapshot(a);
  const sb = snapshot(b);
  assert.deepEqual([...sa.keys()].sort(), [...sb.keys()].sort());
  for (const [rel, file] of sa) assert.ok(file.bytes.equals(sb.get(rel).bytes), `${rel} differs between runs`);
});

// ---------------------------------------------------------------------------------------------
// Bytes outside blocks, and line endings
// ---------------------------------------------------------------------------------------------

for (const [name, eol] of EOLS) {
  test(`prose outside the markers is preserved byte-for-byte (${name})`, (t) => {
    const root = tempRoot(t, path.join(FIXTURES, "drifted-row"));
    setEol(root, eol);
    const before = fs.readFileSync(path.join(root, DOC90));
    assert.match(before.toString("utf8"), /on this line\. {3}\r?\n\tAnd/, "the fixture must carry whitespace worth preserving");

    assert.equal(write(root).code, 0);
    const after = fs.readFileSync(path.join(root, DOC90));
    assert.ok(!after.equals(before), "the write must have changed the block, or this test measures nothing");
    assert.ok(
      Buffer.from(stripBlocks(after.toString("utf8"))).equals(Buffer.from(stripBlocks(before.toString("utf8")))),
      "a byte outside a generated block changed",
    );
  });

  test(`a ${name} file stays ${name} after a write`, (t) => {
    const root = tempRoot(t, path.join(FIXTURES, "drifted-row"));
    setEol(root, eol);
    assert.equal(write(root).code, 0);
    const text = read(root, DOC90);
    if (eol === "\r\n") {
      assert.ok(!hasBareLf(text), "a CRLF file must contain no bare LF after a write");
      assert.match(text, /\| R2 \| `cost\.fixture-no-unbounded-loop` \| forbidden \| error \| manual-review \| \*\*no\*\* \|\r\n/);
    } else {
      assert.ok(!text.includes("\r"), "an LF file must contain no CR after a write");
    }
    assert.equal(check(root).code, 0);
  });
}

test("mixed line endings in a document with a block: exit 2 naming the file, in both modes, nothing written", (t) => {
  const root = tempRoot(t, path.join(FIXTURES, "drifted-row"));
  const lines = toEol(read(root, DOC90), "\n").split("\n");
  put(root, DOC90, `${lines.slice(0, 3).join("\r\n")}\r\n${lines.slice(3).join("\n")}`);
  const text = read(root, DOC90);
  assert.ok(text.includes("\r\n") && hasBareLf(text), "the mutation must actually mix line endings");

  const before = snapshot(root);
  for (const args of [["--check"], []]) {
    const r = run([`--root=${root}`, ...args]);
    assert.equal(r.code, 2, show(r));
    assert.match(r.stderr, /standards\/90-fixture-cost-controls\.md: mixes CRLF and bare LF line endings/);
    assertUntouched(before, snapshot(root), `mixed EOL, ${args.join(" ") || "write"}`);
  }
});

test("mixed line endings in a document with no block are not this tool's concern", (t) => {
  const root = tempRoot(t, IN_SYNC);
  put(root, DOC92, "# Standard 92 — Fixture Without Blocks\r\n\nMixed on purpose.\n");
  const r = check(root);
  assert.equal(r.code, 0, show(r));
});

// ---------------------------------------------------------------------------------------------
// Malformed input
// ---------------------------------------------------------------------------------------------

// Each case overlays malformed/<name> onto a copy of the in-sync root, which alone exits 0.
const MALFORMED = [
  ["begin-without-end", /standards\/90-fixture-cost-controls\.md:\d+: BEGIN GENERATED marker has no matching END GENERATED marker/],
  ["end-without-begin", /standards\/90-fixture-cost-controls\.md:\d+: END GENERATED marker without a preceding BEGIN GENERATED marker/],
  ["nested-begin", /standards\/90-fixture-cost-controls\.md:\d+: nested BEGIN GENERATED marker/],
  ["malformed-marker", /standards\/90-fixture-cost-controls\.md:\d+: malformed generated-block marker/],
  ["unknown-shard", /standards\/90-fixture-cost-controls\.md:\d+: the marker names rules\/budget\.json, which is not a shard in the catalog/],
  ["zero-rows", /standards\/93-fixture-zero-rows\.md:\d+: the block would render zero rows — rules\/cost\.json defines no rule for Standard 93/],
  ["rule-cited-nowhere", /standards\/90-fixture-cost-controls\.md: cost\.fixture-owner-named \(rules\/cost\.json\) is cited in no requirement section/],
  ["rule-cited-twice", /standards\/90-fixture-cost-controls\.md: cost\.fixture-spend-alerting \(rules\/cost\.json\) is cited in more than one requirement section \(R1, R3\)/],
  ["no-number-prefix", /standards\/fixture-unnumbered\.md: filename has no two-digit NN- prefix/],
  ["h1-mismatch", /standards\/90-fixture-cost-controls\.md:1: H1 names Standard 9 but the filename prefix names Standard 90/],
  ["catalog-error", /the catalog in .+ failed to load: rules[\\/]cost\.json: rule "cost\.fixture-budget-declared" has unknown level "mandatory"/],
  ["duplicate-shard-block", /standards\/90-fixture-cost-controls\.md:\d+: more than one generated block names rules\/cost\.json/],
  ["duplicate-requirement", /standards\/90-fixture-cost-controls\.md:\d+: requirement R2 appears more than once/],
];

for (const [name, message] of MALFORMED) {
  test(`malformed input (${name}): exit 2 with an explicit message, in both modes, and nothing written`, (t) => {
    const root = tempRoot(t, IN_SYNC, path.join(FIXTURES, "malformed", name));
    const before = snapshot(root);
    for (const args of [["--check"], []]) {
      const r = run([`--root=${root}`, ...args]);
      assert.equal(r.code, 2, `${name}, ${args.join(" ") || "write"}: ${show(r)}`);
      assert.match(r.stderr, message);
      assert.equal(r.stdout, "", "a malformed run must not also report a result");
      assertUntouched(before, snapshot(root), `${name}, ${args.join(" ") || "write"}`);
    }
  });
}

test("write mode writes nothing when any document is malformed, even where another has fixable drift", (t) => {
  const root = tempRoot(t, path.join(FIXTURES, "drifted-row"), path.join(FIXTURES, "malformed", "zero-rows"));
  const before = snapshot(root);
  const r = write(root);
  assert.equal(r.code, 2, show(r));
  assert.match(r.stderr, /93-fixture-zero-rows\.md:\d+: the block would render zero rows/);
  assertUntouched(before, snapshot(root), "a refused write");

  fs.rmSync(path.join(root, "standards", "93-fixture-zero-rows.md"));
  assert.equal(check(root).code, 1, "the drift the refused write did not fix is still there");
});

test("configuration: a root without rules/ exits 2", (t) => {
  const root = tempRoot(t, IN_SYNC);
  fs.rmSync(path.join(root, "rules"), { recursive: true });
  const r = check(root);
  assert.equal(r.code, 2, show(r));
  assert.match(r.stderr, /has no rules\/ directory/);
});

test("configuration: a root without standards/ exits 2", (t) => {
  const root = tempRoot(t, IN_SYNC);
  fs.rmSync(path.join(root, "standards"), { recursive: true });
  const r = check(root);
  assert.equal(r.code, 2, show(r));
  assert.match(r.stderr, /has no standards\/ directory/);
});

test("configuration: a root that does not exist exits 2", (t) => {
  const root = tempRoot(t, IN_SYNC);
  const r = check(path.join(root, "does-not-exist"));
  assert.equal(r.code, 2, show(r));
  assert.match(r.stderr, /is not a directory/);
});

test("configuration: zero generated blocks across all documents is exit 2, in both modes, not a pass", (t) => {
  const root = tempRoot(t, IN_SYNC);
  fs.rmSync(path.join(root, DOC90));
  fs.rmSync(path.join(root, DOC91));
  assert.ok(fs.existsSync(path.join(root, DOC92)), "a document with no block remains, so the directory is not empty");
  for (const args of [["--check"], []]) {
    const r = run([`--root=${root}`, ...args]);
    assert.equal(r.code, 2, show(r));
    assert.match(r.stderr, /no generated blocks found/);
  }
});

test("CLI: an unknown flag, a positional argument, a spaced --root or an empty --root exits 2 with usage", () => {
  for (const args of [["--frobnicate"], ["--check", "extra"], ["--root="], ["--root", IN_SYNC], ["--CHECK"]]) {
    const r = run(args);
    assert.equal(r.code, 2, `${JSON.stringify(args)}: ${show(r)}`);
    assert.match(r.stderr, /unknown argument/);
    assert.match(r.stderr, /Usage: node scripts\/sync-rule-tables\.mjs/);
  }
});

// ---------------------------------------------------------------------------------------------
// Coverage: every shard holding rules for a written standard has a block in its document
// ---------------------------------------------------------------------------------------------

// Each root under coverage/ is self-contained and carries the same two shards byte-for-byte. The
// negative roots are the permitted root with one document replaced, so copying the permitted
// document back is each negative case's control.
const COVERAGE = path.join(FIXTURES, "coverage");
const PERMITTED = path.join(COVERAGE, "permitted");
const DOC95 = "standards/95-fixture-single-shard.md";
const DOC96 = "standards/96-fixture-two-shards.md";
const DOC97 = "standards/97-fixture-fairness-only.md";
const DOC98 = "standards/98-fixture-rule-free.md";

/** sha256 of every file under a directory, keyed by forward-slash relative path. */
function hashTree(dir) {
  const hashes = {};
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else hashes[path.relative(dir, full).split(path.sep).join("/")] = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
    }
  };
  walk(dir);
  return hashes;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const stderrLines = (r) => r.stderr.split(/\r?\n/).filter((l) => l !== "");
const omission = (doc, shard, standard, ids) =>
  new RegExp(
    `^sync-rule-tables: ${escapeRe(doc)}: coverage omitted — no generated block names rules/${escapeRe(shard)}, ` +
    `which holds ${ids.length} rule\\(s\\) for Standard ${standard}: ${ids.map(escapeRe).join(", ")}\\. ` +
    "Add the block where the table belongs; write mode never inserts one\\.$",
  );
const blockOf = (shard) =>
  new RegExp(`<!-- BEGIN GENERATED FROM rules/${escapeRe(shard)}[^\\n]*\\n[\\s\\S]*?<!-- END GENERATED -->\\r?\\n?`);
const fixtureRules = (root) =>
  ["cost.json", "fairness.json"].flatMap((shard) =>
    JSON.parse(read(root, `rules/${shard}`)).rules.map((r) => ({ id: r.id, standard: r.standard, shard })),
  );

const COVERAGE_OMISSIONS = [
  {
    name: "only-block-missing",
    shape: "(a) a written standard's only required block is missing",
    doc: DOC95, standard: 95, shard: "cost.json", ids: ["cost.fixture-cap-declared"],
    blocksKept: [], inSyncBeside: [],
  },
  {
    name: "one-of-several-missing",
    shape: "(b) one of several required shard blocks is missing",
    doc: DOC96, standard: 96, shard: "fairness.json", ids: ["fairness.fixture-parity-measured", "fairness.fixture-parity-published"],
    blocksKept: ["cost.json"], inSyncBeside: [],
  },
  {
    name: "omitted-beside-valid",
    shape: "(c) one document omits coverage while the others' blocks are valid and in sync",
    doc: DOC97, standard: 97, shard: "fairness.json", ids: ["fairness.fixture-audit-scheduled"],
    blocksKept: [], inSyncBeside: [DOC95, DOC96],
  },
];

for (const c of COVERAGE_OMISSIONS) {
  test(`coverage ${c.shape}: exit 2 in both modes naming the document, shard and rule ids; nothing written`, (t) => {
    const fixture = path.join(COVERAGE, c.name);
    const message = omission(c.doc, c.shard, c.standard, c.ids);

    // Preconditions, so the case fails for the reason it names.
    assert.ok(read(fixture, "rules/cost.json") === read(PERMITTED, "rules/cost.json"), "the catalog must be the permitted root's");
    assert.ok(read(fixture, "rules/fairness.json") === read(PERMITTED, "rules/fairness.json"), "the catalog must be the permitted root's");
    assert.doesNotMatch(read(fixture, c.doc), new RegExp(`BEGIN GENERATED FROM rules/${escapeRe(c.shard)}`), "the block must actually be missing");
    for (const kept of c.blocksKept) {
      assert.match(read(fixture, c.doc), new RegExp(`BEGIN GENERATED FROM rules/${escapeRe(kept)}`), `the ${kept} block must be present`);
    }
    for (const beside of c.inSyncBeside) {
      assert.ok(read(fixture, beside) === read(PERMITTED, beside), `${beside} must be the permitted, in-sync document`);
      assert.match(read(fixture, beside), /BEGIN GENERATED/, `${beside} must carry a block`);
    }

    // --check against the committed fixture: exit 2, one message, and every file's hash unchanged.
    const hashes = hashTree(fixture);
    const r = check(fixture);
    assert.equal(r.code, 2, show(r));
    assert.equal(r.stdout, "", "a malformed run must not also report a result");
    assert.equal(stderrLines(r).length, 1, `exactly one problem is expected:\n${r.stderr}`);
    assert.match(stderrLines(r)[0], message);
    assert.deepEqual(hashTree(fixture), hashes, "--check changed a file under the committed fixture");

    // Write mode, on a temporary copy only: refused, and no block inserted.
    const root = tempRoot(t, fixture);
    const before = snapshot(root);
    const w = write(root);
    assert.equal(w.code, 2, show(w));
    assert.equal(w.stdout, "");
    assert.match(stderrLines(w)[0], message);
    assertUntouched(before, snapshot(root), `write mode on ${c.name}`);

    // Control: with the permitted copy of the document, the same root passes.
    fs.copyFileSync(path.join(PERMITTED, c.doc), path.join(root, c.doc));
    const fixed = check(root);
    assert.equal(fixed.code, 0, `control: restoring the block must pass\n${show(fixed)}`);
  });
}

const DOC96_SHARD_RULES = {
  "cost.json": ["cost.fixture-cap-enforced"],
  "fairness.json": ["fairness.fixture-parity-measured", "fairness.fixture-parity-published"],
};
for (const [shard, ids] of Object.entries(DOC96_SHARD_RULES)) {
  test(`coverage (b) mutation: removing only the rules/${shard} block of a two-shard standard is reported, in both modes`, (t) => {
    const root = tempRoot(t, PERMITTED);
    const other = shard === "cost.json" ? "fairness.json" : "cost.json";
    const original = read(root, DOC96);
    const mutated = original.replace(blockOf(shard), "");
    assert.notEqual(mutated, original, "the mutation must actually remove the block");
    assert.match(mutated, new RegExp(`BEGIN GENERATED FROM rules/${escapeRe(other)}`), "the other block must remain");
    put(root, DOC96, mutated);

    const before = snapshot(root);
    for (const args of [["--check"], []]) {
      const r = run([`--root=${root}`, ...args]);
      assert.equal(r.code, 2, `${args.join(" ") || "write"}: ${show(r)}`);
      assert.equal(r.stdout, "");
      assert.equal(stderrLines(r).length, 1, r.stderr);
      assert.match(stderrLines(r)[0], omission(DOC96, shard, 96, ids));
      assertUntouched(before, snapshot(root), `removed ${shard} block, ${args.join(" ") || "write"}`);
    }
  });
}

test("coverage permitted: a rule-free written standard, rules citing an unwritten standard, and a multi-shard standard with every block in any order pass", (t) => {
  // Preconditions: each permitted case is really present, or the pass proves nothing about it.
  const rules = fixtureRules(PERMITTED);
  const docs = fs.readdirSync(path.join(PERMITTED, "standards"));
  assert.ok(docs.includes(path.basename(DOC98)) && !rules.some((r) => r.standard === 98), "a written standard with no rules");
  assert.doesNotMatch(read(PERMITTED, DOC98), /GENERATED/, "the rule-free standard carries no block");
  assert.ok(rules.some((r) => r.standard === 99) && !docs.some((f) => f.startsWith("99-")), "rules citing an unwritten standard");
  assert.deepEqual([...new Set(rules.filter((r) => r.standard === 96).map((r) => r.shard))].sort(), ["cost.json", "fairness.json"]);
  const order = [...read(PERMITTED, DOC96).matchAll(/BEGIN GENERATED FROM rules\/([a-z]+\.json)/g)].map((m) => m[1]);
  assert.deepEqual(order, ["fairness.json", "cost.json"], "the blocks must be in the reverse of the catalog's shard order");

  const hashes = hashTree(PERMITTED);
  const r = check(PERMITTED);
  assert.equal(r.code, 0, show(r));
  assert.equal(r.stderr, "");
  assert.match(r.stdout, /4 generated block\(s\) in 3 document\(s\) match the catalog/);
  assert.deepEqual(hashTree(PERMITTED), hashes, "--check changed a file under the committed fixture");

  const root = tempRoot(t, PERMITTED);
  const before = snapshot(root);
  const w = write(root);
  assert.equal(w.code, 0, show(w));
  assert.match(w.stdout, /no changes/);
  assertUntouched(before, snapshot(root), "write on the permitted root");
});

test("rows: a standard with rules in two shards gets each shard's rules only in that shard's block", (t) => {
  // The in-sync fixture's Standard 90 showed this exclusion while a Standard 90 rule could sit in a
  // shard its document named no block for. Coverage now forbids that, so it is shown here instead.
  const root = tempRoot(t, PERMITTED);
  const original = read(root, DOC96);
  put(root, DOC96, stripBlocks(original));
  assert.deepEqual(tableRows(read(root, DOC96)), [], "the mutation must actually empty both blocks");
  assert.equal(check(root).code, 1, "emptied blocks are drift, not a coverage omission");

  const w = write(root);
  assert.equal(w.code, 0, show(w));
  const text = read(root, DOC96);
  assert.equal(text, original, "regenerating both emptied blocks reproduces the committed document exactly");
  const blocks = [...text.matchAll(/BEGIN GENERATED FROM rules\/([a-z]+)\.json[^\n]*\n([\s\S]*?)<!-- END GENERATED -->/g)];
  assert.equal(blocks.length, 2);
  for (const [, namespace, body] of blocks) {
    const rows = tableRows(body);
    assert.ok(rows.length > 0, `the ${namespace} block must have rows`);
    for (const row of rows) assert.match(row, new RegExp(`^\\| R\\d+ \\| \`${namespace}\\.`), `a row from another shard in the ${namespace} block`);
  }
});

test("coverage: write mode rewrites nothing when one document has fixable drift and another omits coverage", (t) => {
  const fixture = path.join(COVERAGE, "drift-and-omission");
  const message = omission(DOC97, "fairness.json", 97, ["fairness.fixture-audit-scheduled"]);

  const hashes = hashTree(fixture);
  const c = check(fixture);
  assert.equal(c.code, 2, `coverage omission outranks drift\n${show(c)}`);
  assert.equal(c.stdout, "", "no DRIFT report alongside malformed input");
  assert.match(stderrLines(c)[0], message);
  assert.deepEqual(hashTree(fixture), hashes, "--check changed a file under the committed fixture");

  const root = tempRoot(t, fixture);
  const drifted = fs.readFileSync(path.join(root, DOC95));
  const before = snapshot(root);
  const w = write(root);
  assert.notEqual(w.code, 0, show(w));
  assert.equal(w.code, 2, show(w));
  assert.doesNotMatch(w.stdout, /wrote/);
  assert.match(stderrLines(w)[0], message);
  assert.ok(fs.readFileSync(path.join(root, DOC95)).equals(drifted), "the drifted document's bytes changed");
  assertUntouched(before, snapshot(root), "a write refused for a coverage omission");

  // Control: the drift is real, and fixable, once the omission is repaired.
  fs.copyFileSync(path.join(PERMITTED, DOC97), path.join(root, DOC97));
  const again = check(root);
  assert.equal(again.code, 1, show(again));
  assert.match(again.stdout, /DRIFT standards\/95-fixture-single-shard\.md:\d+/);
  const fixed = write(root);
  assert.equal(fixed.code, 0, show(fixed));
  assert.match(fixed.stdout, /wrote standards\/95-fixture-single-shard\.md/);
  assert.deepEqual(tableRows(read(root, DOC95)), tableRows(read(PERMITTED, DOC95)));
});

test("coverage: omissions and malformed documents are collected across documents and reported together", (t) => {
  const root = tempRoot(t, path.join(COVERAGE, "omitted-beside-valid"));
  put(root, DOC95, read(root, DOC95).replace("<!-- END GENERATED -->", "End marker removed."));
  put(root, DOC96, read(root, DOC96).replace(blockOf("cost.json"), ""));

  const before = snapshot(root);
  for (const args of [["--check"], []]) {
    const r = run([`--root=${root}`, ...args]);
    assert.equal(r.code, 2, show(r));
    assert.equal(r.stdout, "");
    const lines = stderrLines(r);
    assert.equal(lines.length, 3, r.stderr);
    // A document that fails to parse has its coverage left unjudged, so 95 reports only its marker.
    assert.match(lines[0], /standards\/95-fixture-single-shard\.md:\d+: BEGIN GENERATED marker has no matching END GENERATED marker/);
    assert.match(lines[1], omission(DOC96, "cost.json", 96, ["cost.fixture-cap-enforced"]));
    assert.match(lines[2], omission(DOC97, "fairness.json", 97, ["fairness.fixture-audit-scheduled"]));
    assertUntouched(before, snapshot(root), `collected errors, ${args.join(" ") || "write"}`);
  }
});

test("coverage: a document with no block is identified by its filename prefix, as standards-sections does", (t) => {
  // A wrong H1 on a document with no block is standards-sections' finding to make. Coverage follows
  // the filename, so the omission is still reported against Standard 97.
  const root = tempRoot(t, path.join(COVERAGE, "omitted-beside-valid"));
  put(root, DOC97, read(root, DOC97).replace(/^# Standard 97 — /, "# Standard 12 — "));
  assert.match(read(root, DOC97), /^# Standard 12 — /);
  const r = check(root);
  assert.equal(r.code, 2, show(r));
  assert.equal(stderrLines(r).length, 1, r.stderr);
  assert.match(stderrLines(r)[0], omission(DOC97, "fairness.json", 97, ["fairness.fixture-audit-scheduled"]));
});

// ---------------------------------------------------------------------------------------------
// The real repository
// ---------------------------------------------------------------------------------------------

test("the real repository is in sync: --check at the default root exits 0 and modifies nothing", () => {
  const dirs = ["standards", "rules"].map((d) => path.join(REPO, d));
  const before = dirs.map(snapshot);
  const r = run(["--check"]);
  assert.equal(r.code, 0, show(r));
  assert.match(r.stdout, /match the catalog/);
  dirs.forEach((d, i) => assertUntouched(before[i], snapshot(d), `--check against ${d}`));
});

test("MUTATION: a level corrupted in a copy of a real shard is reported as drift", (t) => {
  // Proves the check can fail against the real documents, not only against fixtures. The corruption
  // is made in a temporary copy; the repository's own shard is asserted untouched afterwards.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sync-rule-tables-real-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  copyTree(path.join(REPO, "rules"), path.join(root, "rules"));
  copyTree(path.join(REPO, "standards"), path.join(root, "standards"));
  const realShard = fs.readFileSync(path.join(REPO, "rules", "gate.json"));

  const control = check(root);
  assert.equal(control.code, 0, `control: the unmodified copy must be in sync\n${show(control)}`);

  const shardPath = path.join(root, "rules", "gate.json");
  const shard = JSON.parse(fs.readFileSync(shardPath, "utf8"));
  const rule = shard.rules.find((x) => x.id === "gate.irreversible-approval");
  assert.ok(rule, "the rule the mutation targets must exist");
  assert.notEqual(rule.level, "recommended", "the mutation must actually differ from the catalog");
  rule.level = "recommended";
  fs.writeFileSync(shardPath, JSON.stringify(shard, null, 2));

  const r = check(root);
  assert.equal(r.code, 1, show(r));
  assert.match(r.stdout, /DRIFT standards\/45-approval-gates\.md:\d+/);
  assert.match(r.stdout, /expected: \| R3 \| `gate\.irreversible-approval` \| recommended \|/);
  assert.match(r.stdout, /found: {4}\| R3 \| `gate\.irreversible-approval` \| required \|/);
  assert.ok(fs.readFileSync(path.join(REPO, "rules", "gate.json")).equals(realShard), "the real shard must be untouched");
});
