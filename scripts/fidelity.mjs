#!/usr/bin/env node
// The fidelity review: every block the specification presents as the brief's words IS the brief's
// words.
//
// This is one of the two gates that make the fifty-three-item catalog approved content rather than
// a proposal. What it prevents is narrow and specific: the specification quoting the brief slightly
// wrong, and every standard written against that quote inheriting the error while citing the brief
// as its authority. A paraphrase presented as a quotation is the smallest possible way to invent
// the source's intent, and V4 of the brief forbids exactly that.
//
// WHAT IT CANNOT ESTABLISH. That the quoted block is the RIGHT block to quote, that a passage of
// the brief the specification never quotes is nonetheless honoured, or that any standard written
// under a verbatim block says what the block requires. It compares bytes.
//
// Exit 0 clean · 1 a block does not match · 2 configuration error, including zero blocks found.

import { readSpec, readPrompt, verbatimBlocks, normalizeEol, SpecError } from "./spec.mjs";

function main() {
  const spec = readSpec();
  const prompt = readPrompt();

  const blocks = verbatimBlocks(spec);
  if (blocks.length === 0) {
    // A run that checked nothing is not a run that passed. Same reasoning as the test runner's
    // zero-discovered-files rule: an empty check and a clean check are indistinguishable in the
    // output, so they must be distinguishable in the exit code.
    process.stderr.write(
      "fidelity: the specification declares no verbatim blocks. A fidelity check with nothing to " +
      "check is a configuration error, not a pass.\n",
    );
    return 2;
  }

  const promptRaw = prompt;
  const promptNormalized = normalizeEol(prompt);
  const rawBytesMatched = [];
  const failures = [];

  for (const block of blocks) {
    // The block text arrives already normalized from the parser; normalize the prompt to match.
    if (promptNormalized.includes(block.text)) {
      rawBytesMatched.push(promptRaw.includes(block.text));
      continue;
    }
    failures.push(block);
  }

  const lines = [];
  lines.push(`fidelity: ${blocks.length} verbatim block(s) declared in the specification.`);
  lines.push("Compared against artifacts/prompts/original_prompt.md after normalizing CRLF to LF on");
  lines.push("both sides. That is the only normalization applied; every other difference fails.");
  lines.push("");

  const rawExact = rawBytesMatched.filter(Boolean).length;
  lines.push(
    `Raw byte match without normalization: ${rawExact} of ${rawBytesMatched.length} matched blocks. ` +
    (rawExact === rawBytesMatched.length
      ? "The normalization changed nothing in this checkout."
      : "The remainder differ only in line terminator; the words are identical."),
  );
  lines.push("");

  if (failures.length === 0) {
    lines.push(`PASS — every verbatim block is the brief's own words.`);
    process.stdout.write(lines.join("\n") + "\n");
    return 0;
  }

  lines.push(`FAIL — ${failures.length} block(s) are not present in the brief:`);
  for (const block of failures) {
    lines.push("");
    lines.push(`  ai-standards-spec.md:${block.line} — this block is presented as the brief's words`);
    lines.push("  but does not appear in artifacts/prompts/original_prompt.md:");
    for (const l of block.text.split("\n").slice(0, 12)) lines.push(`    | ${l}`);
    if (block.text.split("\n").length > 12) lines.push("    | ...");
    lines.push("");
    lines.push("  Fix the SPECIFICATION. The brief is a governing input and is never edited to make");
    lines.push("  a check pass — doing so would be weakening the evidence requirement rather than");
    lines.push("  meeting it. If the block should not be a quotation, reclass it as authored (A).");
  }
  process.stdout.write(lines.join("\n") + "\n");
  return 1;
}

try {
  process.exit(main());
} catch (err) {
  if (err instanceof SpecError) {
    process.stderr.write(`fidelity: ${err.message}\n`);
    process.exit(2);
  }
  throw err;
}
