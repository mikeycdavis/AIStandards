// Scaffolding is not evidence.
//
// WHY THIS EXISTS FROM THE FIRST RELEASE RATHER THAN BEING RETROFITTED. A sibling pack in this
// portfolio records, in its own source, that its bootstrap command once flipped three required
// rules from failing to passed with no work having been done: the bootstrap wrote the evidence its
// own evaluator then accepted. That is a structural defect, not a bug in one detector, and the fix
// belongs in the first release rather than after the same incident.
//
// AIStandards has no `init` command yet — it is Phase 2 scope. This module exists first, so that
// when `init` arrives, the recognition that keeps its output from satisfying rules already exists
// and is already tested. Building the bootstrap before the guard is the order that produced the
// incident.

export const SCAFFOLD_MARKER = "$scaffold";

// Placeholder text a generator writes for a human to replace. Matching is deliberately narrow:
// these are shapes no considered answer takes, not merely short ones.
const PLACEHOLDER = /^(REPLACE[-_ ]?ME|TODO|TBD|FIXME|CHANGEME|<[^>]+>|xxx+|\.\.\.)$/i;

/** True when a scalar is a generator placeholder rather than a written value. */
export function isPlaceholder(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed === "") return true;
  return PLACEHOLDER.test(trimmed);
}

/**
 * Two independent signals, either of which alone is defeatable.
 *
 * 1. An explicit `$scaffold` marker the generator wrote.
 * 2. Substance: whether the document's scalar values are placeholders.
 *
 * A document passing both may still be wrong. It is merely not a template, which is a lower bar
 * than being true and is described as exactly that wherever it is reported.
 *
 * @returns {{scaffold: boolean, reasons: string[], placeholders: string[]}}
 */
export function inspectScaffolding(document) {
  const reasons = [];
  const placeholders = [];

  if (document && typeof document === "object" && document[SCAFFOLD_MARKER] === true) {
    reasons.push(`carries the ${SCAFFOLD_MARKER} marker`);
  }

  let scalars = 0;
  const walk = (node, path) => {
    if (node === null || typeof node !== "object") {
      scalars += 1;
      if (isPlaceholder(node)) placeholders.push(path);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === SCAFFOLD_MARKER) continue;
      walk(value, path === "" ? key : `${path}.${key}`);
    }
  };
  walk(document, "");

  // A document whose values are entirely placeholders was generated and never edited. The
  // threshold is every scalar, not most: a partially-filled manifest is a project mid-adoption,
  // and reporting it as scaffolding would punish the honest halfway state.
  if (scalars > 0 && placeholders.length === scalars) {
    reasons.push("every declared value is a generator placeholder");
  }

  return { scaffold: reasons.length > 0, reasons, placeholders };
}
