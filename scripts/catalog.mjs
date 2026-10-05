// The rule catalog: rule identity and metadata, and nothing else.
//
// THE THREE-WAY SEPARATION. The catalog defines rule identity and metadata. `ai-policy.yml` defines
// project applicability. The evaluator produces evidence. None of the three may redefine the others.
// A rule's level in the catalog is a default; a project's policy decides what applies to it; and
// neither of them decides what was observed.
//
// NAMESPACE. AIStandards rule ids never begin with `ai.` — that namespace belongs to
// EngineeringStandards, permanently. Where AIStandards covers ground an EngineeringStandards rule
// also covers, the relationship is recorded as a `crosswalk` entry naming the foreign id. A
// crosswalk is a semantic mapping. It is never an id reuse, and the foreign id is never minted here.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, "..");
const RULES_DIR = path.join(REPO_ROOT, "rules");

export class CatalogError extends Error {
  constructor(message) {
    super(message);
    this.name = "CatalogError";
  }
}

// Canonical rule id: `category.kebab-case-name`. camelCase is rejected by construction, so a
// legacy spelling cannot enter the catalog by being typed.
export const RULE_ID = /^[a-z][a-z0-9]*(\.[a-z0-9]+(-[a-z0-9]+)*)+$/;

// `not-evaluable` is the sixth validation type and the honest floor. It means: this framework
// states the requirement and structurally cannot check it, because its subject is model behaviour
// at inference time rather than repository content.
export const VALIDATION_TYPES = new Set([
  "structural", "document", "configuration", "code-analysis", "manual-review", "not-evaluable",
]);
export const ASSURANCE = new Set(["full", "partial", "none"]);
export const LEVELS = new Set(["required", "recommended", "optional", "forbidden"]);
export const SEVERITIES = new Set(["error", "warning", "info"]);

// Namespaces reserved by AIStandards. A rule outside this set is a typo or a land grab.
export const NAMESPACES = new Set([
  "lifecycle", "oversight", "misuse", "privacy", "provenance", "eval", "promptsec",
  "agent", "honesty", "lineage", "observability", "incident", "fairness", "disclosure",
  "cost", "gate", "invariant",
]);

// Namespaces owned by other packs. Nothing here may be minted as an AIStandards rule id.
export const FOREIGN_NAMESPACES = new Set(["ai", "ai-ux"]);

// Segments this pack reserves that another pack ALSO uses.
//
// The approved plan claimed the seventeen segments above were disjoint from every other pack's.
// The Phase 2 boundary review found six that are not, and the claim is replaced here by the list.
// A shared segment is permitted — Standard 7 R4 forbids a colliding FULL id, and no full id
// collides across the nine packs recorded in artifacts/foreign-namespace-inventory.json. What is
// not permitted is the overlap going unrecorded, because then nobody minting the next
// `disclosure.*` rule knows FinancialStandards has seven of them.
export const SHARED_SEGMENTS = new Map([
  ["lifecycle", ["MathematicsStandards"]],
  ["privacy", ["UIUXDesignStandards"]],
  ["agent", ["MathematicsStandards"]],
  ["observability", ["EngineeringStandards"]],
  ["disclosure", ["FinancialStandards"]],
  ["invariant", ["MachineLearningStandards"]],
]);

const REQUIRED_FIELDS = [
  "id", "title", "standard", "category", "level", "severity",
  "validationType", "assurance", "nonExemptible", "introducedIn",
  "description", "rationale", "remediation",
];

// Lifecycle fields are present from the first release even when null, so a consumer never has to
// distinguish "this rule has no successor" from "this catalog predates the field".
const LIFECYCLE_FIELDS = ["aliases", "deprecatedIn", "supersededBy", "removedIn"];

function checkRule(rule, source) {
  const where = `${source}: rule ${JSON.stringify(rule?.id ?? "(no id)")}`;

  for (const field of REQUIRED_FIELDS) {
    if (!(field in rule)) throw new CatalogError(`${where} is missing required field ${JSON.stringify(field)}`);
  }
  for (const field of LIFECYCLE_FIELDS) {
    if (!(field in rule)) {
      throw new CatalogError(
        `${where} is missing lifecycle field ${JSON.stringify(field)}. Lifecycle fields are present ` +
        "from the first release even when null.",
      );
    }
  }

  if (!RULE_ID.test(rule.id)) throw new CatalogError(`${where} does not match the canonical id pattern`);

  const namespace = rule.id.split(".")[0];
  if (FOREIGN_NAMESPACES.has(namespace)) {
    throw new CatalogError(
      `${where} uses the ${JSON.stringify(namespace)} namespace, which belongs to another pack. ` +
      "Record the relationship as a crosswalk instead; never mint a foreign id here.",
    );
  }
  if (!NAMESPACES.has(namespace)) {
    throw new CatalogError(`${where} uses unreserved namespace ${JSON.stringify(namespace)}`);
  }

  if (!LEVELS.has(rule.level)) throw new CatalogError(`${where} has unknown level ${JSON.stringify(rule.level)}`);
  if (!SEVERITIES.has(rule.severity)) throw new CatalogError(`${where} has unknown severity ${JSON.stringify(rule.severity)}`);
  if (!VALIDATION_TYPES.has(rule.validationType)) {
    throw new CatalogError(`${where} has unknown validationType ${JSON.stringify(rule.validationType)}`);
  }
  if (!ASSURANCE.has(rule.assurance)) throw new CatalogError(`${where} has unknown assurance ${JSON.stringify(rule.assurance)}`);
  if (typeof rule.nonExemptible !== "boolean") throw new CatalogError(`${where} nonExemptible must be a boolean`);
  if (!Number.isInteger(rule.standard) || rule.standard < 1) {
    throw new CatalogError(`${where} must cite a standard number`);
  }
  if (!Array.isArray(rule.aliases)) throw new CatalogError(`${where} aliases must be an array`);

  // `attestable` defaults to manual-review only. Anything else must opt in explicitly, so
  // attestation cannot quietly become a universal override for automated checks.
  const attestable = "attestable" in rule ? rule.attestable : rule.validationType === "manual-review";
  if (typeof attestable !== "boolean") throw new CatalogError(`${where} attestable must be a boolean`);

  if (rule.validationType === "not-evaluable") {
    // The not-evaluable invariants. Each one closes a route by which an unverifiable requirement
    // could come to look like a verified one.
    if (rule.assurance !== "none") {
      throw new CatalogError(`${where} is not-evaluable and must declare assurance "none"`);
    }
    if (attestable) {
      throw new CatalogError(
        `${where} is not-evaluable and must not be attestable. Human review of the repository cannot ` +
        "establish a fact about model behaviour at inference time.",
      );
    }
    if (rule.nonExemptible) {
      throw new CatalogError(`${where} is not-evaluable and must not be nonExemptible`);
    }
    const note = rule.$notEvaluableNote;
    if (typeof note !== "string" || note.trim().length < 40) {
      throw new CatalogError(
        `${where} is not-evaluable and must carry a $notEvaluableNote of at least 40 characters ` +
        "naming the artifact that would make it evaluable. \"Cannot be checked\" is not a note.",
      );
    }
  } else if ("$notEvaluableNote" in rule) {
    throw new CatalogError(`${where} carries a $notEvaluableNote but is not not-evaluable`);
  }

  for (const entry of rule.crosswalk ?? []) {
    if (!entry.pack || !entry.rule || !entry.relationship) {
      throw new CatalogError(`${where} has a crosswalk entry missing pack, rule or relationship`);
    }
    if (entry.rule === rule.id) {
      throw new CatalogError(`${where} crosswalks to its own id, which records nothing`);
    }
  }

  return { ...rule, attestable };
}

/** Load and validate every rule shard. Throws CatalogError rather than returning a partial catalog. */
export function loadCatalog(dir = RULES_DIR) {
  const rules = new Map();
  const aliases = new Map();
  const shards = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
    : [];

  if (shards.length === 0) throw new CatalogError(`no rule shards found in ${dir}`);

  for (const shard of shards) {
    const source = path.join("rules", shard);
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(path.join(dir, shard), "utf8"));
    } catch (cause) {
      throw new CatalogError(`${source} is not valid JSON: ${cause.message}`);
    }
    if (!Array.isArray(parsed?.rules)) throw new CatalogError(`${source} must have a "rules" array`);

    for (const raw of parsed.rules) {
      const rule = checkRule(raw, source);
      if (rules.has(rule.id)) throw new CatalogError(`${source}: duplicate rule id ${JSON.stringify(rule.id)}`);
      rules.set(rule.id, Object.freeze({ ...rule, shard }));
      for (const alias of rule.aliases) {
        if (aliases.has(alias) || rules.has(alias)) {
          throw new CatalogError(`${source}: alias ${JSON.stringify(alias)} collides with an existing id or alias`);
        }
        aliases.set(alias, rule.id);
      }
    }
  }

  return { rules, aliases, shards };
}

/** Resolve an id or a legacy alias to a canonical rule. */
export function resolve(catalog, id) {
  if (catalog.rules.has(id)) return catalog.rules.get(id);
  const canonical = catalog.aliases.get(id);
  return canonical ? catalog.rules.get(canonical) : null;
}

/**
 * The mechanical guard against vocabulary drift: an evaluator may not report against a rule id the
 * catalog does not define. Without this, a detector typo becomes a finding nobody can act on and a
 * rule nobody evaluates.
 */
export function assertBindings(catalog, ids) {
  const unknown = [...new Set(ids)].filter((id) => id != null && !catalog.rules.has(id));
  if (unknown.length > 0) {
    throw new CatalogError(
      `evaluator reports against rule id(s) the catalog does not define: ${unknown.join(", ")}`,
    );
  }
}

/**
 * Framework coverage: how much of the catalog the evaluator can actually examine.
 *
 * This travels BESIDE a verdict and never inside it. A coverage improvement must never be able to
 * look like a compliance improvement.
 */
export function coverage(catalog, evaluatedRules) {
  const total = catalog.rules.size;
  const evaluated = [...catalog.rules.keys()].filter((id) => evaluatedRules.includes(id)).length;
  let notEvaluable = 0;
  let manualReview = 0;
  for (const rule of catalog.rules.values()) {
    if (rule.validationType === "not-evaluable") notEvaluable += 1;
    else if (rule.validationType === "manual-review") manualReview += 1;
  }
  return {
    total,
    evaluated,
    manualReview,
    notEvaluable,
    unimplemented: total - evaluated - manualReview - notEvaluable,
  };
}
