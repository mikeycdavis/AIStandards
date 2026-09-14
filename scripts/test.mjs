#!/usr/bin/env node
// The test runner.
//
// AN EXPLICIT FILE LIST, NO GLOBS. A glob that matches nothing looks exactly like a suite that
// passed, and the failure mode is silent: someone renames a directory, the suite matches zero
// files, CI goes green, and nobody learns that the tests stopped running. So the list is written
// out, and a file present on disk but absent from the list is itself a failure.
//
// ZERO DISCOVERED FILES IS EXIT 2, never exit 0. A test run that ran no tests is a configuration
// error, not a pass.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");
const TEST_DIR = path.join(REPO, "test");

const FILES = [
  "catalog.test.mjs",
  "namespace.test.mjs",
  "binding.test.mjs",
  "validation-type.test.mjs",
  "yaml.test.mjs",
  "jsonschema.test.mjs",
  "source.test.mjs",
  "scaffolding.test.mjs",
  "distinction.test.mjs",
  "compliance.test.mjs",
  "policy-resolution.test.mjs",
  "audit.test.mjs",
  "safety-detector.test.mjs",
  "partial-assurance.test.mjs",
  "validate.test.mjs",
  "standards-tables.test.mjs",
  "standards-sections.test.mjs",
  "sync-rule-tables.test.mjs",
  "fidelity.test.mjs",
  "inventory.test.mjs",
  "no-phase-creep.test.mjs",
];

const missing = FILES.filter((f) => !fs.existsSync(path.join(TEST_DIR, f)));
if (missing.length > 0) {
  process.stderr.write(`test: listed test file(s) do not exist: ${missing.join(", ")}\n`);
  process.exit(2);
}

// The other direction: a test file on disk that nobody listed would never run, and its absence
// from CI would be invisible. Top level of test/ only; fixtures are not tests.
const onDisk = fs.readdirSync(TEST_DIR).filter((f) => f.endsWith(".test.mjs"));
const unlisted = onDisk.filter((f) => !FILES.includes(f));
if (unlisted.length > 0) {
  process.stderr.write(
    `test: test file(s) exist but are not in the runner's list, so they never run: ${unlisted.join(", ")}\n`,
  );
  process.exit(2);
}

if (FILES.length === 0) {
  process.stderr.write("test: no test files. A suite that runs nothing is not a passing suite.\n");
  process.exit(2);
}

// `--test-concurrency=1`. The fidelity and inventory suites are MUTATION suites: they corrupt a
// real file, assert the specific failure, and restore it. Two such suites running in parallel
// processes will overwrite each other's restore, and the symptom is a test failing for a reason
// that has nothing to do with what it asserts — or worse, a corrupted file left on disk. Serial
// execution is the price of testing checks against the artifacts they actually read.
const result = spawnSync(
  process.execPath,
  ["--test", "--test-concurrency=1", ...FILES.map((f) => path.join(TEST_DIR, f))],
  { stdio: "inherit", cwd: REPO },
);

if (result.error) {
  process.stderr.write(`test: could not run: ${result.error.message}\n`);
  process.exit(2);
}
// A signal death is exit 2, not 0. A killed runner has not passed.
if (result.signal) {
  process.stderr.write(`test: runner terminated by signal ${result.signal}\n`);
  process.exit(2);
}
process.exit(result.status ?? 2);
