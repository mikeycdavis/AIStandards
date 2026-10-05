// The fidelity review.
//
// The mutation test is the one that matters. A fidelity check that cannot be made to fail is not a
// fidelity check — it is a command that prints PASS — and the only way to know it can fail is to
// break something and watch it. Each mutation below corrupts one thing and asserts the specific
// failure, then restores it in a finally block.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { REPO } from "./helpers.mjs";
import { verbatimBlocks, normalizeEol, SpecError, SPEC_PATH, PROMPT_PATH } from "../scripts/spec.mjs";

const run = (extraCwd) =>
  spawnSync(process.execPath, [path.join(REPO, "scripts", "fidelity.mjs")], {
    encoding: "utf8",
    cwd: extraCwd ?? REPO,
  });

/** Rewrite a file, run fidelity, restore. The restore must happen even when an assertion throws. */
function withMutation(file, mutate, assertion) {
  const original = fs.readFileSync(file);
  try {
    fs.writeFileSync(file, mutate(original.toString("utf8")));
    assertion(run());
  } finally {
    fs.writeFileSync(file, original);
  }
}

test("the repository's own specification passes the fidelity review", () => {
  const r = run();
  assert.equal(r.status, 0, `fidelity failed:\n${r.stdout}\n${r.stderr}`);
  assert.match(r.stdout, /PASS/);
});

test("it reports how many blocks it checked, so a silent zero is visible", () => {
  const r = run();
  assert.match(r.stdout, /fidelity: \d+ verbatim block\(s\)/);
  const count = Number(/fidelity: (\d+) verbatim/.exec(r.stdout)[1]);
  assert.ok(count >= 4, "the specification must declare at least the four blocks it was written with");
});

test("it declares the one normalization it applies rather than applying it quietly", () => {
  const r = run();
  assert.match(r.stdout, /normalizing CRLF to LF on/);
  assert.match(r.stdout, /every other difference fails/);
  assert.match(r.stdout, /Raw byte match without normalization: \d+ of \d+/);
});

test("MUTATION: altering one word inside a verbatim block fails the review", () => {
  withMutation(SPEC_PATH, (text) => text.replace("Rationale and failure modes", "Rationale and failure cases"), (r) => {
    assert.equal(r.status, 1, "a paraphrase presented as a quotation must fail");
    assert.match(r.stdout, /FAIL/);
    assert.match(r.stdout, /ai-standards-spec\.md:\d+/, "the failure must name the line");
    assert.match(r.stdout, /Fix the SPECIFICATION/);
  });
});

test("MUTATION: deleting a single character inside a verbatim block fails the review", () => {
  // A whole-word change could conceivably be caught by a looser comparison. A dropped comma cannot.
  withMutation(SPEC_PATH, (text) => text.replace("MUST, MUST NOT, SHOULD, and MAY", "MUST MUST NOT, SHOULD, and MAY"), (r) => {
    assert.equal(r.status, 1);
    assert.match(r.stdout, /FAIL/);
  });
});

test("MUTATION: adding trailing whitespace inside a verbatim block fails the review", () => {
  withMutation(SPEC_PATH, (text) => text.replace("9. Related standards and ADRs", "9. Related standards and ADRs "), (r) => {
    assert.equal(r.status, 1, "whitespace inside a line is not normalized away");
  });
});

test("the check never edits the brief to make itself pass", () => {
  // The remediation text is load-bearing: the brief is a governing input, and editing it to satisfy
  // a check would be weakening an evidence requirement, which the brief itself forbids by name.
  const source = fs.readFileSync(path.join(REPO, "scripts", "fidelity.mjs"), "utf8");
  assert.ok(!/writeFileSync|appendFileSync|rmSync|unlinkSync/.test(source),
    "fidelity.mjs must have no write path at all");
  assert.match(source, /The brief is a governing input and is never edited/);
});

test("a specification with no verbatim blocks is exit 2, not a pass", () => {
  // Zero checks and zero failures look identical in the output. They must differ in the exit code.
  withMutation(SPEC_PATH, (text) => text.replace(/```verbatim/g, "```text"), (r) => {
    assert.equal(r.status, 2, "a fidelity run with nothing to check is a configuration error");
    assert.match(r.stderr, /declares no verbatim blocks/);
    assert.ok(!/PASS/.test(r.stdout));
  });
});

test("an unclosed verbatim fence is refused rather than read to end of file", () => {
  assert.throws(
    () => verbatimBlocks("```verbatim\nsomething\n"),
    (err) => {
      assert.ok(err instanceof SpecError);
      assert.match(err.message, /never closed/);
      return true;
    },
  );
});

test("NEGATIVE CONTROL: a block that IS in the brief is not reported as a failure", () => {
  // Without this, a checker that failed everything would satisfy every mutation test above.
  const prompt = normalizeEol(fs.readFileSync(PROMPT_PATH, "utf8"));
  for (const block of verbatimBlocks(fs.readFileSync(SPEC_PATH, "utf8"))) {
    assert.ok(prompt.includes(block.text), `the block at line ${block.line} must be in the brief`);
  }
});

test("the brief still carries the sentence the whole pack is built to obey", () => {
  const prompt = fs.readFileSync(PROMPT_PATH, "utf8");
  assert.match(prompt, /Never weaken a test, policy, standard, or evidence requirement merely to make a gate pass\./);
  assert.match(prompt, /Do not invent historical intent, test results, approvals, reviewers, model capabilities, or compliance evidence\./);
});

test("a missing specification is exit 2 with no verdict", () => {
  const tmp = path.join(REPO, "artifacts", "prompts", ".spec-moved-by-test.md");
  fs.renameSync(SPEC_PATH, tmp);
  try {
    const r = run();
    assert.equal(r.status, 2);
    assert.match(r.stderr, /does not exist/);
    assert.equal(r.stdout.trim(), "", "no verdict may be printed for a run with nothing to check");
  } finally {
    fs.renameSync(tmp, SPEC_PATH);
  }
});
