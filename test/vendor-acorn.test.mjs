// ST-61 criterion 1: the vendored Acorn 8.19.0 parser keeps its provenance, hash, licence, offline and
// no-runtime-dependency contract.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as acorn from "../scripts/vendor/acorn/dist/acorn.mjs";
import { ambientOffenders, analyzeSource } from "./ast-guard.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VENDOR = path.join(REPO, "scripts", "vendor");
const TREE = path.join(VENDOR, "acorn");
const ID = JSON.parse(fs.readFileSync(path.join(VENDOR, "acorn.vendor.json"), "utf8"));
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)).map((x) => path.join(e.name, x)) : [e.name]));

test("identity names acorn 8.19.0 under MIT with the registry integrity values", () => {
  assert.equal(ID.schema, "vendor-identity/1");
  assert.equal(ID.name, "acorn");
  assert.equal(ID.version, "8.19.0");
  assert.equal(ID.license, "MIT");
  assert.equal(ID.modifications, "none");
  assert.equal(ID.source.registryTarball, "https://registry.npmjs.org/acorn/-/acorn-8.19.0.tgz");
  assert.match(ID.source.tarballIntegritySha512, /^sha512-[A-Za-z0-9+/]{86}==$/);
  assert.match(ID.source.tarballSha1, /^[0-9a-f]{40}$/);
  assert.match(ID.source.tarballSha256, /^[0-9a-f]{64}$/);
});

test("the vendored tree holds exactly the listed files, each matching its SHA-256 byte for byte", () => {
  assert.deepEqual(walk(TREE).map((p) => p.split(path.sep).join("/")).sort(), ID.files.map((f) => f.path).sort());
  for (const f of ID.files) assert.equal(sha(fs.readFileSync(path.join(TREE, f.path))), f.sha256, f.path);
});

test("the MIT licence and copyright notice ship with the tree, unabbreviated", () => {
  const text = fs.readFileSync(path.join(TREE, ID.licenseFile), "utf8");
  assert.match(text, /^MIT License\n\nCopyright \(C\) 2012-2022 by various contributors/);
  assert.match(text, /Permission is hereby granted, free of charge/);
  assert.match(text, /THE SOFTWARE IS PROVIDED "AS IS"/);
});

test("line endings are LF in the tree", () => {
  for (const f of ID.files) assert.equal(fs.readFileSync(path.join(TREE, f.path)).includes(0x0d), false, f.path);
});

test("no runtime dependency: package.json lists none and the module imports nothing", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(TREE, "package.json"), "utf8"));
  assert.equal(pkg.version, "8.19.0");
  for (const k of ["dependencies", "peerDependencies", "optionalDependencies"]) assert.equal(pkg[k], undefined, k);
  const r = analyzeSource(fs.readFileSync(path.join(TREE, "dist/acorn.mjs"), "utf8"), { dynamicCode: false });
  assert.deepEqual(r.specifiers, []);
});

test("offline: the pinned file has no ambient access; the only carve-out is its local variable self, fingerprinted", () => {
  const file = path.join(TREE, ID.ambientCarveOut.file);
  const src = fs.readFileSync(file, "utf8");
  const carve = { sha256: ID.ambientCarveOut.sha256, selfOccurrences: ID.ambientCarveOut.occurrences };
  assert.equal(ID.ambientCarveOut.sha256, ID.files.find((f) => f.path === ID.ambientCarveOut.file).sha256);
  assert.deepEqual(ambientOffenders(src, carve), []);
  // without the carve-out the same file is reported, so the exemption is not a directory or name exemption
  assert.ok(ambientOffenders(src, null).length > 0);
  // any change to the bytes ends it, even a harmless one
  assert.ok(ambientOffenders(src + "\n", carve).length > 0);
  // a new use of self, or of any other ambient name, is reported
  assert.ok(ambientOffenders(src.replace("// The main exported interface", "self.fetch;\n// The main exported interface"), carve).length > 0);
  assert.ok(ambientOffenders("function f(){ return fetch('x') }", null).length > 0);
  // a free (global) self is never excused, whatever the hash
  const free = "self.postMessage(1)";
  assert.ok(ambientOffenders(free, { sha256: sha(Buffer.from(free)), selfOccurrences: 1 }).length > 0);
});

test("the parser is the pinned version and runs the frozen contract with no plugins", () => {
  assert.equal(acorn.version, "8.19.0");
  assert.equal(typeof acorn.Parser.extend, "function");
  const src = fs.readFileSync(path.join(REPO, "test", "ast-guard.mjs"), "utf8");
  assert.equal(/\.extend\s*\(/.test(src), false, "the guard must not extend the parser with a plugin");
});
