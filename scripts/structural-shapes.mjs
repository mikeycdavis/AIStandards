// Standard 21's inline-prompt shapes, re-expressed over the parsed tree (ST-58, #120).
//
// This is a CONSUMER of scripts/structural.mjs. It reads a tree the reader already produced and finds
// the three shapes of one problem (parameter, message role, Gemini systemInstruction parts) in a YAML or
// JSON file. It does not parse, it has no fallback, and it does not decide whether a match is a violation:
// it reports each literal at or above `threshold` with where it is, and the detector decides.
//
// WHAT CHANGED FROM THE LEXICAL LAYER (decisions C, E, G; the compatibility change is recorded in
// docs/structural-reader.md):
//   * a literal is measured in Unicode code points of its DECODED value (escapes resolved, lines folded,
//     chomping applied), not in characters of the raw source;
//   * keys and values are decoded before they are compared: a key written with an escape (u0074 for the
//     t of `system`) is the key `system`;
//   * every scalar is a string, whatever its style or tag: a quoted or plain scalar, and a scalar carrying
//     an anchor or a tag, are decoded scalars (a block scalar is the one named exception, below);
//   * a mapping is a mapping, so a key's value is the node under that key, not the next text on a line.
//
// WHAT IS NOT CLAIMED, and is reported rather than guessed:
//   * an alias is not dereferenced and a merge key is not applied (decision C): a role, content or
//     instruction supplied through one is a non-claim, and the reader's alias and merge lists are the
//     evidence that one was present;
//   * a mapping nested INSIDE A COMPLEX KEY (`? {system: "..."}`) is not scanned (decision E). A key is
//     a name; the walk descends into values and sequence items only;
//   * documents are scanned independently: nothing here compares or combines evidence across documents;
//   * a block-style YAML `systemInstruction` mapping is not the object form Standard 21 claims (only `{...}`);
//   * a YAML BLOCK scalar (`|` or `>`) is not a literal for these shapes. Standard 21 names it as a non-claim
//     and the regression ledger the owner accepted lists no case that changes it, so it stays one until a
//     decision (ST-60) says otherwise. The reader decodes it, so the change would be one line here.
//
// DUPLICATE KEYS (decision E). The reader keeps every occurrence. Every occurrence of a content, text or
// instruction key is measured, and a role is `system` if ANY of its occurrences is. A key that occurs more
// than once in one mapping is reported as duplicate evidence, because a consumer that keeps only the last
// occurrence sees a different file from the one that was read.

export const SHAPES = Object.freeze({
  parameter: "parameter",
  messageRole: "message-role",
  systemInstructionParts: "system-instruction-parts",
});

// Parameter names that carry model instructions across the common provider SDKs. The same names as the
// lexical layer's INSTRUCTION_PARAM; a test requires the two lists to agree.
export const PARAMETER_KEYS = Object.freeze(["system", "system_prompt", "systemPrompt", "instructions", "systemInstruction"]);
const SYSTEM_INSTRUCTION_KEYS = new Set(["systemInstruction", "system_instruction"]);
const PARAMETER_SET = new Set(PARAMETER_KEYS);

// Every key a shape examines. Duplicate evidence is reported for these and no others, so a repository's
// ordinary repeated keys are not swept into the report.
const EXAMINED_KEYS = new Set([...PARAMETER_KEYS, "system_instruction", "role", "content", "parts", "text"]);

// Bounds on what a location entry may carry from a file. A key can be any length; the report is not a
// copy of the file.
export const PATH_STEP_LIMIT = 128;
export const PATH_DEPTH_LIMIT = 64;

// Clipped by code points, so a clip never ends in half of a surrogate pair. Only a string longer than the
// limit in UTF-16 units can be longer in code points, so the common case allocates nothing.
const clip = (s) => {
  if (s.length <= PATH_STEP_LIMIT) return s;
  // Stops after PATH_STEP_LIMIT code points: enumerating a 200000-character key for every entry below it
  // would be quadratic in the size of the file.
  let end = 0;
  for (let points = 0; points < PATH_STEP_LIMIT && end < s.length; points += 1) {
    const c = s.charCodeAt(end);
    end += c >= 0xd800 && c <= 0xdbff && end + 1 < s.length && (s.charCodeAt(end + 1) & 0xfc00) === 0xdc00 ? 2 : 1;
  }
  return end < s.length ? `${s.slice(0, end)}…` : s;
};

// `line` and `column` cost O(length of the line) each, so a minified file of many entries on one line would be
// quadratic if every entry were located. An entry is located the first time its line or column is READ, and
// the report reads only the entries it lists (at most 50), so the rest never are.
// It captures the standalone `locate` function and nothing else: an entry that held the whole parsed result
// would keep every document tree of every file reachable for the whole run.
function withLazyWhere(entry, locate, offset) {
  let where = null;
  const at = () => (where ??= locate(offset));
  Object.defineProperty(entry, "line", { enumerable: true, configurable: true, get: () => at().line });
  Object.defineProperty(entry, "column", { enumerable: true, configurable: true, get: () => at().column });
  return entry;
}
const COMPLEX_KEY = "[complex key]";

// Walks up at most PATH_DEPTH_LIMIT + 1 ancestors: the last 64 steps are kept, and one more establishes that
// the path was cut. Walking the whole chain for every entry would be quadratic in nesting depth.
function pathOfFrame(frame) {
  const steps = [];
  let f = frame;
  for (; f && f.parent !== null && steps.length <= PATH_DEPTH_LIMIT; f = f.parent) steps.push(f.step);
  const truncated = steps.length > PATH_DEPTH_LIMIT;
  if (truncated) steps.length = PATH_DEPTH_LIMIT;
  steps.reverse();
  return { path: steps.map((s) => (typeof s === "string" ? clip(s) : s)), truncated };
}

// The Gemini OBJECT form. In JSON every mapping is braced. In YAML only the flow mapping `{...}` is the object
// form Standard 21 claims; a block-style `systemInstruction:` mapping is a named non-claim and stays one.
const isObjectForm = (parsed, node) => parsed.format === "json" || parsed.text[node.range.start] === "{";

const isScalar = (n) => n !== null && n !== undefined && n.kind === "scalar";
const keyName = (pair) => (isScalar(pair.key) ? pair.key.value : null);

/**
 * Find the inline-prompt shapes in a parsed tree.
 *
 * @param {object} parsed  the ok-result of parseStructuralBytes / parseStructuralText
 * @param {number} threshold  report a literal only at this many Unicode code points (decoded) or more
 * @returns {{ matches: Array, duplicates: Array }}
 *   matches:    { shape, length, documentIndex, offset, line, column, key, path, pathTruncated, duplicate }
 *               one per literal at or above the threshold, in source order
 *   duplicates: { documentIndex, offset, line, column, key, path, pathTruncated, occurrences }
 *               one per examined key that occurs more than once in a single mapping
 */
export function findInlinePromptShapes(parsed, threshold) {
  const locate = parsed.locate;
  const matches = [];
  const duplicates = [];


  for (const doc of parsed.documents) {
    if (doc.root === null || doc.root === undefined) continue;
    const documentIndex = doc.index;

    const record = (shape, valueNode, key, frame, duplicate) => {
      if (!isScalar(valueNode) || valueNode.length < threshold) return;
      if (valueNode.style === "block-literal" || valueNode.style === "block-folded") return; // named non-claim
      const { path, truncated } = pathOfFrame(frame);
      const entry = {
        shape,
        length: valueNode.length,
        documentIndex,
        offset: valueNode.range.start,
        key,
        path,
        duplicate,
      };
      if (truncated) entry.pathTruncated = true;
      matches.push(withLazyWhere(entry, locate, valueNode.range.start));
    };

    // Iterative: a hostile nesting depth is not a stack hazard. Stack entries are [node, frame, inParts].
    // `inParts` is true under the `parts` of a systemInstruction, where a `text` key is the third shape.
    const pending = [{ node: doc.root, frame: { parent: null }, parts: false, dupCtx: false }];
    while (pending.length > 0) {
      const { node, frame, parts, dupCtx } = pending.pop();
      if (node.kind === "seq") {
        const kids = [];
        node.items.forEach((item, index) => {
          if (item) kids.push({ node: item, frame: { parent: frame, step: index }, parts, dupCtx });
        });
        for (let k = kids.length - 1; k >= 0; k -= 1) pending.push(kids[k]);
        continue;
      }
      if (node.kind !== "map") continue; // scalars and aliases: an alias is not followed

      // Decode every key of this mapping once and group the occurrences of the examined ones.
      const byName = new Map();
      for (const pair of node.pairs) {
        const name = keyName(pair);
        if (name === null || !EXAMINED_KEYS.has(name)) continue;
        if (!byName.has(name)) byName.set(name, []);
        byName.get(name).push(pair);
      }
      const dupNames = new Set();
      for (const [name, list] of byName) {
        if (list.length < 2) continue;
        dupNames.add(name);
        const first = list[0].key;
        const { path, truncated } = pathOfFrame(frame);
        const entry = withLazyWhere({ documentIndex, offset: first.range.start, key: name, path, occurrences: list.length }, locate, first.range.start);
        if (truncated) entry.pathTruncated = true;
        duplicates.push(entry);
      }

      const childFrame = (_pair, name) => ({ parent: frame, step: name === null ? COMPLEX_KEY : name });

      // Parameter shape: an instruction parameter whose value is a scalar. Every occurrence is measured.
      for (const pair of node.pairs) {
        const name = keyName(pair);
        if (name !== null && PARAMETER_SET.has(name)) {
          record(SHAPES.parameter, pair.value, name, childFrame(pair, name), dupNames.has(name));
        }
      }

      // Message role shape: this mapping has a `role` that is `system` and a `content` scalar.
      const roles = byName.get("role") ?? [];
      if (roles.some((p) => isScalar(p.value) && p.value.value === "system")) {
        for (const pair of byName.get("content") ?? []) {
          record(SHAPES.messageRole, pair.value, "content", childFrame(pair, "content"), dupNames.has("content") || dupNames.has("role"));
        }
      }

      // Third shape, inside a systemInstruction's `parts`: a `text` key of a mapping reached through them.
      if (parts) {
        for (const pair of byName.get("text") ?? []) {
          record(SHAPES.systemInstructionParts, pair.value, "text", childFrame(pair, "text"), dupCtx || dupNames.has("text"));
        }
      }

      // Descend into VALUES only. A key is a name: a mapping inside a complex key is a documented non-claim.
      const kids = [];
      for (const pair of node.pairs) {
        if (!pair.value) continue;
        const name = keyName(pair);
        const next = { parent: frame, step: name === null ? COMPLEX_KEY : name };
        // `parts` opens the third shape only as a key of a systemInstruction's own mapping.
        if (name !== null && SYSTEM_INSTRUCTION_KEYS.has(name) && pair.value.kind === "map" && isObjectForm(parsed, pair.value)) next.systemInstruction = true;
        const opensParts = name === "parts" && frame.systemInstruction === true;
        // A duplicated systemInstruction or parts key on the path makes every match below it ambiguous.
        const ambiguous = name !== null && (SYSTEM_INSTRUCTION_KEYS.has(name) || name === "parts") && dupNames.has(name);
        kids.push({ node: pair.value, frame: next, parts: parts || opensParts, dupCtx: dupCtx || ambiguous });
      }
      for (let k = kids.length - 1; k >= 0; k -= 1) pending.push(kids[k]);
    }
  }
  return { matches, duplicates };
}
