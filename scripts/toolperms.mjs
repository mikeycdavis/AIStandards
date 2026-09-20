// The tool permission manifest, judged from its text alone. Pure over text, like manifest.mjs, and
// with the same status order: unparseable, then invalid, then scaffold, then ok. A schema problem
// outranks the scaffold marker because scaffolding never erases a finding.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseYaml, YamlError } from "./yaml.mjs";
import { validate as validateSchema } from "./jsonschema.mjs";
import { inspectScaffolding } from "./scaffolding.mjs";

export const TOOLPERM_NAMES = ["tool-permissions.yml", "tool-permissions.yaml"];

const SCHEMA = JSON.parse(
  fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "schemas", "tool-permissions.schema.json"),
    "utf8",
  ),
);

/**
 * @param {string} text the permission manifest's file text
 * @returns {{document: any, parseError: string|null, problems: string[], scaffold: boolean,
 *            reasons: string[], placeholders: string[],
 *            status: "unparseable"|"invalid"|"scaffold"|"ok"}}
 */
export function classifyToolPermissions(text) {
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

/**
 * Which declared tool names carry no impact class. `classified` is the de-duplicated list of names
 * the permission document classifies; `missing` is every declared name absent from it.
 */
export function compareToolNames(document, declaredNames) {
  const classified = [...new Set((document?.tools ?? []).map((t) => t?.name))];
  const set = new Set(classified);
  const missing = (declaredNames ?? []).filter((name) => !set.has(name));
  return { classified, missing };
}
