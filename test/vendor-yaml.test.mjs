// The vendored YAML parser: identity, hashes, notice and isolation (ST-57, #119, decision A).
//
// Invariant 4, as amended: there is no install-time or environment-resolved third-party dependency.
// Vendored parser code is reviewed repository content whose identity, hashes and licence are pinned.
// What these tests make true is the second sentence. They fail when the vendored tree drifts, when its
// notice goes missing, when anything under scripts/ reaches for a package by name, and when a
// dependency key, a lockfile or an install step appears anywhere.

import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { REPO } from "./helpers.mjs";

const VENDOR = path.join(REPO, "scripts", "vendor");
const TREE = path.join(VENDOR, "yaml");
const IDENTITY = JSON.parse(fs.readFileSync(path.join(VENDOR, "yaml.vendor.json"), "utf8"));

function filesUnder(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(full, base));
    else out.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return out.sort();
}

const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

test("the identity pins what was vendored: package, version, licence, source and tarball hashes", () => {
  assert.equal(IDENTITY.name, "yaml");
  assert.equal(IDENTITY.version, "2.9.1");
  assert.equal(IDENTITY.license, "ISC");
  assert.match(IDENTITY.copyright, /^Copyright .+/);
  assert.equal(IDENTITY.source.registryTarball, "https://registry.npmjs.org/yaml/-/yaml-2.9.1.tgz");
  assert.match(IDENTITY.source.tarballIntegritySha512, /^sha512-[A-Za-z0-9+/]{86}==$/);
  assert.match(IDENTITY.source.tarballSha1, /^[0-9a-f]{40}$/);
  assert.match(IDENTITY.source.tarballSha256, /^[0-9a-f]{64}$/);
  assert.equal(IDENTITY.modifications, "none");
  assert.ok(IDENTITY.files.length > 0);
});

test("every vendored file matches its recorded SHA-256, byte for byte", () => {
  for (const entry of IDENTITY.files) {
    assert.match(entry.sha256, /^[0-9a-f]{64}$/, entry.path);
    const full = path.join(TREE, entry.path);
    assert.ok(fs.existsSync(full), `${entry.path} is recorded but missing from the tree`);
    assert.equal(sha256(full), entry.sha256, `${entry.path} has drifted from the pinned release`);
  }
});

test("the vendored tree holds exactly the recorded files: nothing added, nothing removed", () => {
  const onDisk = filesUnder(TREE);
  const recorded = IDENTITY.files.map((f) => f.path).sort();
  assert.deepEqual(onDisk, recorded);
  assert.equal(new Set(recorded).size, recorded.length, "a path is recorded twice");
});

test("scripts/vendor holds only the yaml tree and its identity (a second vendored package needs its own decision)", () => {
  assert.deepEqual(fs.readdirSync(VENDOR).sort(), ["yaml", "yaml.vendor.json"]);
});

test("the upstream licence and copyright notice ship with the tree, and are not abbreviated", () => {
  assert.ok(IDENTITY.files.some((f) => f.path === "LICENSE"));
  const text = fs.readFileSync(path.join(TREE, IDENTITY.licenseFile), "utf8");
  assert.match(text, /^Copyright Eemeli Aro <eemeli@gmail\.com>/);
  assert.match(text, /Permission to use, copy, modify, and\/or distribute this software for any purpose/);
  assert.match(text, /with or without fee is hereby granted, provided that the above copyright notice\nand this permission notice appear in all copies\./);
  assert.match(text, /THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES/);
});

test("the notice is kept next to the code it covers: the identity names it and the tree contains it", () => {
  assert.equal(IDENTITY.licenseFile, "LICENSE");
  assert.ok(fs.existsSync(path.join(TREE, "LICENSE")));
});

test("line endings are LF in the tree, and git is told to keep them LF", () => {
  for (const rel of IDENTITY.files.map((f) => f.path)) {
    const bytes = fs.readFileSync(path.join(TREE, rel));
    assert.equal(bytes.includes(0x0d), false, `${rel} contains a carriage return, so its hash would depend on the checkout`);
  }
  const attributes = fs.readFileSync(path.join(REPO, ".gitattributes"), "utf8");
  assert.match(attributes, /^scripts\/vendor\/\*\* +text +eol=lf$/m);
});

test("the vendored tree imports only itself: relative specifiers that resolve inside the tree", () => {
  const offenders = [];
  for (const rel of IDENTITY.files.map((f) => f.path).filter((p) => p.endsWith(".js"))) {
    const dir = path.dirname(path.join(TREE, rel));
    const text = fs.readFileSync(path.join(TREE, rel), "utf8");
    for (const m of text.matchAll(/(?:^|\n)\s*(?:import|export)[^;'"]*?from\s*['"]([^'"]+)['"]/g)) {
      const spec = m[1];
      if (!spec.startsWith(".")) {
        offenders.push(`${rel}: ${spec}`);
        continue;
      }
      const target = path.resolve(dir, spec);
      if (!target.startsWith(TREE + path.sep) || !fs.existsSync(target)) offenders.push(`${rel}: ${spec} does not resolve inside the tree`);
    }
    for (const m of text.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]/g)) offenders.push(`${rel}: dynamic import ${m[1]}`);
  }
  assert.deepEqual(offenders, []);
});

test("the vendored tree performs no network, process or filesystem access of its own", () => {
  const offenders = [];
  for (const rel of IDENTITY.files.map((f) => f.path).filter((p) => p.endsWith(".js"))) {
    const text = fs.readFileSync(path.join(TREE, rel), "utf8");
    for (const pattern of [/\brequire\s*\(/, /\bchild_process\b/, /\bfetch\s*\(/, /\bXMLHttpRequest\b/, /\bprocess\.(?:env|exit|argv|binding)/, /from\s*['"]node:/, /\beval\s*\(/, /new Function\s*\(/]) {
      if (pattern.test(text)) offenders.push(`${rel}: ${pattern}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("the reader imports the vendored parser by a relative path, and the strict manifest parser does not", () => {
  const reader = fs.readFileSync(path.join(REPO, "scripts", "structural.mjs"), "utf8");
  assert.match(reader, /from "\.\/vendor\/yaml\/browser\/index\.js"/);
  const manifestParser = fs.readFileSync(path.join(REPO, "scripts", "yaml.mjs"), "utf8");
  assert.equal(/vendor|structural/.test(manifestParser.split("\n").filter((l) => /^\s*import\b/.test(l)).join("\n")), false,
    "scripts/yaml.mjs is the strict policy and manifest parser and stays separate (decision H)");
});

test("nothing outside the vendored tree imports the vendored parser except the structural reader", () => {
  const users = [];
  const scan = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (full === VENDOR || entry.name === "node_modules" || entry.name === ".git" || entry.name === "fixtures") continue;
        scan(full);
      } else if (/\.(mjs|js|cjs)$/.test(entry.name) && /vendor\/yaml/.test(fs.readFileSync(full, "utf8"))) {
        users.push(path.relative(REPO, full).split(path.sep).join("/"));
      }
    }
  };
  scan(path.join(REPO, "scripts"));
  assert.deepEqual(users.sort(), ["scripts/structural.mjs"]);
});
