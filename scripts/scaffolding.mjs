// Scaffolding is not evidence.
//
// WHY THIS EXISTS FROM THE FIRST RELEASE RATHER THAN BEING RETROFITTED. A sibling pack in this
// portfolio records, in its own source, that its bootstrap command once flipped three required
// rules from failing to passed with no work having been done: the bootstrap wrote the evidence its
// own evaluator then accepted. That is a structural defect, not a bug in one detector, and the fix
// belongs in the first release rather than after the same incident.
//
// This module was written BEFORE `init`, so the recognition that keeps a bootstrap's output from
// satisfying rules already existed and was already tested when `init` arrived. Building the
// bootstrap before the guard is the order that produced the incident.
//
// TWO MARKER REPRESENTATIONS, because the files a bootstrap writes are of two kinds:
//
//   - A machine-read document whose schema has a slot for it carries the key `$scaffold: true`.
//     That is a value in the parsed document, so it survives parsing and inspectScaffolding() sees it.
//   - A file with no such slot — a policy, whose schema is closed, or a Markdown template — carries
//     the text marker below on its FIRST non-blank line, as a comment. It is positional on purpose:
//     a marker anywhere in a file cannot be told from a document that merely mentions one.

export const SCAFFOLD_MARKER = "$scaffold";

/** The text marker for files that cannot carry a `$scaffold` key. */
export const SCAFFOLD_TEXT_MARKER = "AISTANDARDS-SCAFFOLD";

/**
 * True when the first non-blank line is a comment carrying the text marker: `# AISTANDARDS-SCAFFOLD`
 * in YAML, or `<!-- AISTANDARDS-SCAFFOLD ... -->` in Markdown.
 */
export function hasScaffoldTextMarker(text) {
  if (typeof text !== "string") return false;
  const first = text.split(/\r?\n/).find((line) => line.trim() !== "");
  if (first === undefined) return false;
  const line = first.trim();
  return (
    (line.startsWith("#") && line.slice(1).trim().startsWith(SCAFFOLD_TEXT_MARKER)) ||
    (line.startsWith("<!--") && line.slice(4).trim().startsWith(SCAFFOLD_TEXT_MARKER))
  );
}

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
