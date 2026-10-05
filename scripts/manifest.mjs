// The AI system manifest, judged from its text alone.
//
// This module is pure over text: it reads no target file and has no CLI. The caller finds and reads
// the file and hands the text here, so the classification below is the single place that decides
// what a manifest is. It reproduces the judgement the detectors in standards.mjs make, in the order
// they make it, so those detectors can call it instead of keeping their own copy.
//
// ORDER MATTERS, and it is the point of the module. A parse failure is `unparseable`. A schema
// problem is `invalid` EVEN WHEN THE FILE ALSO CARRIES THE SCAFFOLD MARKER, because scaffolding
// never erases a finding. Only a document that parses and conforms is then asked whether it is
// scaffolding. Anything left is `ok`, which is a lower bar than true.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseYaml, YamlError } from "./yaml.mjs";
import { validate as validateSchema } from "./jsonschema.mjs";
import { inspectScaffolding } from "./scaffolding.mjs";

export const MANIFEST_NAMES = ["ai-system.yml", "ai-system.yaml"];

const SCHEMA = JSON.parse(
  fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "schemas", "ai-system-manifest.schema.json"),
    "utf8",
  ),
);

/**
 * @param {string} text the manifest's file text
 * @returns {{document: any, parseError: string|null, problems: string[], scaffold: boolean,
 *            reasons: string[], placeholders: string[],
 *            status: "unparseable"|"invalid"|"scaffold"|"ok"}}
 */
export function classifyManifest(text) {
  let document = null;
  try {
    document = parseYaml(text);
  } catch (cause) {
    const parseError = cause instanceof YamlError ? cause.message : String(cause);
    return { document: null, parseError, problems: [], scaffold: false, reasons: [], placeholders: [], status: "unparseable" };
  }
  const problems = validateSchema(document, SCHEMA);
  const { scaffold, reasons, placeholders } = inspectScaffolding(document);
  const status = problems.length > 0 ? "invalid" : scaffold ? "scaffold" : "ok";
  return { document, parseError: null, problems, scaffold, reasons, placeholders, status };
}

/** The tool names a manifest declares, exactly as the tool-definition detector reads them. */
export function manifestToolNames(document) {
  return Array.isArray(document?.tools) ? document.tools.map((t) => t?.name).filter(Boolean) : [];
}
