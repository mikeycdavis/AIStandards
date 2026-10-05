// The inventory review.
//
// Two halves. The parser tests use fixtures and assert that a row the parser cannot understand is
// an ERROR rather than a row it skips — because a skipped row is an item that silently leaves the
// inventory, which is the exact failure the inventory exists to catch, committed by the inventory.
//
// The mutation tests corrupt the real specification and assert the specific finding. As in the
// fidelity suite, a check nobody has watched fail is a check nobody knows can fail.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { REPO, fixture } from "./helpers.mjs";
import {
  parseSpec, additionsSection, SpecError, SPEC_PATH, BOUNDARY_PATH, ADDITIONS_HEADING,
} from "../scripts/spec.mjs";

const specFixture = (name) => fs.readFileSync(path.join(fixture("spec"), name), "utf8");

const run = () =>
  spawnSync(process.execPath, [path.join(REPO, "scripts", "inventory.mjs")], {
    encoding: "utf8",
    cwd: REPO,
  });

function withMutation(file, mutate, assertion) {
  const original = fs.readFileSync(file);
  try {
    fs.writeFileSync(file, mutate(original.toString("utf8")));
    assertion(run());
  } finally {
    fs.writeFileSync(file, original);
  }
}

// ---------------------------------------------------------------------------
// The parser

test("a well-formed fixture parses into the items and authored rows it declares", () => {
  const { items, authored } = parseSpec(specFixture("well-formed.md"));
  assert.equal(items.length, 2, "only rows under a Band heading are catalog items");
  assert.deepEqual(items[0], {
    number: 1, title: "AI System Manifest", class: "D",
    derivedFrom: "AI system manifests", posture: "O", implementedBy: null, line: 11,
  });
  assert.equal(items[1].class, "A");
  assert.equal(items[1].derivedFrom, null, "an authored item names no derivation token");
  assert.equal(authored.length, 1);
  assert.deepEqual(authored[0].negativeFaceOf, ["AI safety"]);
});

test("a table outside a Band heading is not read as catalog rows", () => {
  // Otherwise a table added anywhere in the document silently joins the inventory.
  const { items } = parseSpec(specFixture("well-formed.md"));
  assert.ok(!items.some((i) => i.number === 9), "the trailing table must not become item 9");
});

test("a row with the wrong number of cells is an ERROR, never a skipped row", () => {
  assert.throws(
    () => parseSpec(specFixture("malformed-row.md")),
    (err) => {
      assert.ok(err instanceof SpecError);
      assert.match(err.message, /must have 6 cells, found 5/);
      return true;
    },
  );
});

test("an undelimited derivation token is refused rather than compared as prose", () => {
  assert.throws(
    () => parseSpec(specFixture("undelimited-token.md")),
    (err) => {
      assert.match(err.message, /neither a backticked token nor/);
      return true;
    },
  );
});

test("an unknown provenance class is refused", () => {
  assert.throws(
    () => parseSpec(specFixture("unknown-class.md")),
    (err) => {
      assert.match(err.message, /unknown class "Q"/);
      return true;
    },
  );
});

test("additionsSection distinguishes absent from empty from present", () => {
  assert.equal(additionsSection("# S\n\n## Scope\n\ntext\n"), null, "absent is null");
  assert.equal(additionsSection(`# S\n\n${ADDITIONS_HEADING}\n\n\n## Next\n`), "", "empty is the empty string");
  assert.equal(additionsSection(`# S\n\n${ADDITIONS_HEADING}\n\nNone.\n\n## Next\n`), "None.");
});

// ---------------------------------------------------------------------------
// The command

test("the repository's own specification passes the inventory review", () => {
  const r = run();
  assert.equal(r.status, 0, `inventory failed:\n${r.stdout}\n${r.stderr}`);
  assert.match(r.stdout, /PASS/);
});

test("it counts fifty-three items and reports the derived/authored split", () => {
  const r = run();
  assert.match(r.stdout, /items\s+53\s+\(44 derived, 9 authored\)/);
});

test("unimplemented standards are reported NOT EVALUATED, never counted as passing", () => {
  const r = run();
  assert.match(r.stdout, /NOT EVALUATED — \d+ check\(s\) could not run\. None of these is a pass/);
  assert.match(r.stdout, /no standard document exists in this release/);
  // The pass line must not claim the withdrawn checks succeeded.
  assert.ok(!/all 53 standards/i.test(r.stdout));
});

test("it states what it does not establish, so PASS is not read as approval of the content", () => {
  const r = run();
  assert.match(r.stdout, /does not establish that any item is well drafted/);
  assert.match(r.stdout, /nobody has\s+signed it off/);
});

test("MUTATION: a derived item whose token is not in the brief fails", () => {
  withMutation(SPEC_PATH, (t) => t.replace("`red teaming`", "`adversarial exercises`"), (r) => {
    assert.equal(r.status, 1);
    assert.match(r.stdout, /claims to derive from "adversarial exercises"/);
    assert.match(r.stdout, /the item is authored and must be reclassed A/);
  });
});

test("MUTATION: an authored item removed from the Authored items table fails", () => {
  withMutation(
    SPEC_PATH,
    (t) => t.replace(/\| 49 \| Data and Privacy Prohibitions \| Authored \|[^\n]*\n/, ""),
    (r) => {
      assert.equal(r.status, 1);
      assert.match(r.stdout, /item 49 is class A but is not listed under "## Authored items"/);
      assert.match(r.stdout, /invented requirement/);
    },
  );
});

test("MUTATION: relabelling an authored item as derived fails, because it names no token", () => {
  withMutation(SPEC_PATH, (t) => t.replace("| 47 | AI Engineering Invariants | A |", "| 47 | AI Engineering Invariants | D |"), (r) => {
    assert.equal(r.status, 1);
    assert.match(r.stdout, /item 47 .* is derived but names no token/);
  });
});

test("MUTATION: a prohibition whose positive token is not in the brief fails", () => {
  withMutation(SPEC_PATH, (t) => t.replace("| 50 | Evaluation Integrity Prohibitions | Authored | `benchmark integrity` |", "| 50 | Evaluation Integrity Prohibitions | Authored | `evaluation hygiene` |"), (r) => {
    assert.equal(r.status, 1);
    assert.match(r.stdout, /item 50 is the negative face of "evaluation hygiene", which is not in the brief/);
  });
});

test("MUTATION: a non-O posture with no boundary evidence fails", () => {
  withMutation(BOUNDARY_PATH, (t) => {
    const j = JSON.parse(t);
    j.postures = j.postures.filter((p) => p.item !== 31);
    return JSON.stringify(j, null, 2);
  }, (r) => {
    assert.equal(r.status, 1);
    assert.match(r.stdout, /item 31 has posture B and no boundary-review evidence/);
  });
});

test("MUTATION: a boundary entry with an empty evidence array fails", () => {
  withMutation(BOUNDARY_PATH, (t) => {
    const j = JSON.parse(t);
    j.postures.find((p) => p.item === 38).evidence = [];
    return JSON.stringify(j, null, 2);
  }, (r) => {
    assert.equal(r.status, 1);
    assert.match(r.stdout, /records no evidence.*defers into nothing/);
  });
});

test("MUTATION: a posture that disagrees between the spec and the review fails", () => {
  withMutation(BOUNDARY_PATH, (t) => {
    const j = JSON.parse(t);
    j.postures.find((p) => p.item === 44).posture = "O";
    return JSON.stringify(j, null, 2);
  }, (r) => {
    assert.equal(r.status, 1);
    assert.match(r.stdout, /item 44 is posture X in the specification and O in the boundary review/);
  });
});

test("MUTATION: an O posture with no recorded search fails", () => {
  withMutation(BOUNDARY_PATH, (t) => {
    const j = JSON.parse(t);
    j.notGovernedElsewhere.items = j.notGovernedElsewhere.items.filter((n) => n !== 35);
    return JSON.stringify(j, null, 2);
  }, (r) => {
    assert.equal(r.status, 1);
    assert.match(r.stdout, /item 35 is posture O but is not listed in notGovernedElsewhere/);
    assert.match(r.stdout, /an assumption, not a posture/);
  });
});

test("MUTATION: a standard whose title disagrees with the specification fails", () => {
  const doc = path.join(REPO, "standards", "05-verdict-vocabulary.md");
  withMutation(doc, (t) => t.replace("# Standard 5 — Verdict Vocabulary", "# Standard 5 — Verdict Terms"), (r) => {
    assert.equal(r.status, 1);
    assert.match(r.stdout, /is titled "Verdict Terms"; the specification titles it "Verdict Vocabulary"/);
  });
});

test("MUTATION: an authored standard declaring no additions fails", () => {
  // Standard 7 is authored in full. If its Additions section said "None.", every requirement in it
  // would read as the brief's.
  const doc = path.join(REPO, "standards", "07-boundary-with-adjacent-standards.md");
  withMutation(doc, (t) => {
    const i = t.indexOf(ADDITIONS_HEADING);
    const rest = t.slice(i + ADDITIONS_HEADING.length);
    const next = rest.indexOf("\n## ");
    return t.slice(0, i) + ADDITIONS_HEADING + "\n\nNone.\n" + rest.slice(next);
  }, (r) => {
    assert.equal(r.status, 1);
    assert.match(r.stdout, /item 7 is authored in full, but .* declares no additions/);
  });
});

test("MUTATION: a standard on disk that no item claims fails", () => {
  const stray = path.join(REPO, "standards", "99-not-in-the-specification.md");
  fs.writeFileSync(stray, "# Standard 99 — Stray\n");
  try {
    const r = run();
    assert.equal(r.status, 1);
    assert.match(r.stdout, /no specification item claims it/);
  } finally {
    fs.rmSync(stray);
  }
});

test("MUTATION: a missing item number fails, because a citation would resolve to nothing", () => {
  withMutation(SPEC_PATH, (t) => t.replace(/\| 43 \| Environmental Impact Accounting \|[^\n]*\n/, ""), (r) => {
    assert.equal(r.status, 1);
    assert.match(r.stdout, /item 43 is missing\. Numbering must be contiguous/);
    assert.match(r.stdout, /lists 52 items; 53 are expected/);
  });
});

test("NEGATIVE CONTROL: every catalog rule cites an item the specification lists", () => {
  // The positive form of the binding check, asserted here so the mutation tests above are not the
  // only evidence the check runs at all.
  const r = run();
  assert.equal(r.status, 0);
  assert.ok(!/cites standard \d+, which is not an item/.test(r.stdout));
});

test("a boundary review that names no reviewer records null rather than an empty string", () => {
  const review = JSON.parse(fs.readFileSync(BOUNDARY_PATH, "utf8"));
  assert.equal(review.humanSignOff, null, "an unsigned review must say so, not carry a blank");
  assert.ok(review.$signOffNote.length > 40, "and must say what that means");
  assert.ok(Array.isArray(review.unresolved) && review.unresolved.length > 0,
    "a review claiming nothing is unresolved would be claiming a completeness it does not have");
});
