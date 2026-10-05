// Policy loading, and the one rule that matters most in this file.
//
// THE POLICY IS RESOLVED AGAINST THE TARGET. NEVER AGAINST THIS CHECKOUT.
//
// A sibling pack in this portfolio reads its policy from its own checkout when none is supplied,
// labels the resulting report with its own project name, and exits 0 — producing what the
// enforcement layer's own contract schema calls "a confident verdict about the wrong thing". That
// is the single worst failure available to a compliance tool, because it is indistinguishable from
// success.
//
// The countermeasure is structural, not careful coding: `resolvePolicyPath` takes the target and
// nothing else. There is no packRoot parameter, no fallback argument, and no default that could
// point here. A caller cannot ask this module to read the pack's own policy for someone else's
// verdict, because there is no way to express the request.

import fs from "node:fs";
import path from "node:path";
import { parseYaml, YamlError } from "./yaml.mjs";
import { validate } from "./jsonschema.mjs";

export const POLICY_BASENAME = "ai-policy.yml";

export class PolicyError extends Error {
  constructor(message) {
    super(message);
    this.name = "PolicyError";
  }
}

/**
 * Where a target's policy lives.
 *
 * @param {string} target      the directory being evaluated
 * @param {string|null} explicit  a caller-supplied path, resolved relative to the process cwd
 * @returns {{path: string, source: "explicit"|"target-default"}}
 *
 * Note the return type: `source` has exactly two values. There is deliberately no third, because a
 * third would be the fallback this module exists to make unrepresentable.
 */
export function resolvePolicyPath(target, explicit = null) {
  if (explicit != null && explicit !== "") {
    return { path: path.resolve(explicit), source: "explicit" };
  }
  return { path: path.join(path.resolve(target), POLICY_BASENAME), source: "target-default" };
}

/**
 * Load and validate a policy.
 *
 * Every failure here is a CONFIGURATION error, not a compliance failure. A verdict was requested and
 * there is nothing to evaluate against; reporting that as non-compliance would blame the project for
 * the operator's mistake, and reporting it as compliance would be the false green.
 */
export function loadPolicy(policyPath, schema) {
  if (!fs.existsSync(policyPath)) {
    throw new PolicyError(
      `no policy at ${policyPath}. A verdict was requested and there is nothing to evaluate ` +
      `against. Create ${POLICY_BASENAME} in the target, or name one with --policy.`,
    );
  }

  const stat = fs.statSync(policyPath);
  if (!stat.isFile()) throw new PolicyError(`${policyPath} is not a file`);

  let text;
  try {
    text = fs.readFileSync(policyPath, "utf8");
  } catch (cause) {
    throw new PolicyError(`${policyPath} could not be read: ${cause.message}`);
  }

  let parsed;
  try {
    parsed = parseYaml(text);
  } catch (cause) {
    if (cause instanceof YamlError) throw new PolicyError(`${policyPath}: ${cause.message}`);
    throw cause;
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new PolicyError(`${policyPath} must contain a mapping at the top level`);
  }

  const problems = validate(parsed, schema);
  if (problems.length > 0) {
    throw new PolicyError(`${policyPath} does not conform to the policy schema:\n  - ${problems.join("\n  - ")}`);
  }

  return parsed;
}

/**
 * The version-identity guard.
 *
 * A verdict that misstates which rules produced it is the false green this tool exists to refuse, so
 * a disagreement here is fatal rather than a warning.
 */
export function assertVersionIdentity(policy, frameworkVersion, policyPath) {
  if (policy.standardVersion !== frameworkVersion) {
    throw new PolicyError(
      `${policyPath} declares standardVersion ${JSON.stringify(policy.standardVersion)} and this ` +
      `framework is ${JSON.stringify(frameworkVersion)}. A verdict that misstates which rules ` +
      "produced it is worse than no verdict, so none is produced.",
    );
  }
}

/**
 * Resolve, per rule, what the policy says about it.
 *
 * Level precedence: the policy's declared level wins over the catalog's default, because the
 * catalog states what a rule is and the policy states what this project adopted. A rule the policy
 * never mentions is `undeclared` — which is not the same as absent, and is counted separately so a
 * project can see how much of the catalog it never considered.
 */
export function applyPolicy(catalog, policy) {
  const declared = policy.rules ?? {};
  const applicability = policy.applicability ?? {};
  const out = new Map();

  for (const [id, rule] of catalog.rules) {
    const setting = declared[id];
    const declaration = applicability[id];
    out.set(id, {
      rule,
      level: setting?.level ?? rule.level,
      undeclared: setting === undefined,
      applicable: declaration?.status !== "not-applicable",
      applicabilityReason: declaration?.reason ?? null,
      revisitWhen: declaration?.revisitWhen ?? null,
    });
  }

  // A policy naming a rule the catalog does not define is a configuration error. Silently ignoring
  // it would let a typo look like an adopted rule for as long as nobody checked.
  const unknown = [...new Set([...Object.keys(declared), ...Object.keys(applicability)])]
    .filter((id) => !catalog.rules.has(id));
  if (unknown.length > 0) {
    throw new PolicyError(
      `policy names rule id(s) this catalog does not define: ${unknown.join(", ")}. ` +
      "Check for a typo, or for a rule from another standards pack.",
    );
  }

  return out;
}
