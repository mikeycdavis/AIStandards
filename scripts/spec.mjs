// Reading the derived specification.
//
// `artifacts/prompts/ai-standards-spec.md` is a document people edit, so this parser is strict
// rather than forgiving. A row it cannot understand is an ERROR, never a row it skips: a skipped
// row is an item that silently leaves the inventory, and an item that leaves the inventory is
// exactly the silent drop the whole review exists to catch.
//
// The same argument applies to the verbatim fences. A fence whose language tag is misspelled is not
// a block this parser passes over — it is a block nobody checks, which is worse than a block that
// fails.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, "..");

export const SPEC_PATH = path.join(REPO_ROOT, "artifacts", "prompts", "ai-standards-spec.md");
export const PROMPT_PATH = path.join(REPO_ROOT, "artifacts", "prompts", "original_prompt.md");
export const BOUNDARY_PATH = path.join(REPO_ROOT, "artifacts", "boundary-review.json");

export class SpecError extends Error {
  constructor(message) {
    super(message);
    this.name = "SpecError";
  }
}

export const CLASSES = new Set(["D", "V", "A"]);
export const POSTURES = new Set(["O", "B", "X", "D"]);

/** The section heading a standard's authored content must appear under. Standard 6's skeleton. */
export const ADDITIONS_HEADING = "## Additions this standard makes beyond the source";

/**
 * The one normalization applied anywhere in the fidelity check.
 *
 * `original_prompt.md` is stored CRLF and this repository pins no `.gitattributes`, so the same
 * words can arrive LF on another platform. Failing on that would make the check fail for a reason
 * unrelated to what it exists to catch, and a check that fails for irrelevant reasons is a check
 * somebody disables. Every difference other than the line terminator still fails.
 */
export const normalizeEol = (text) => text.replace(/\r\n/g, "\n");

function readOrThrow(file, what) {
  if (!fs.existsSync(file)) {
    throw new SpecError(`${what} does not exist at ${file}. There is nothing to check.`);
  }
  return fs.readFileSync(file, "utf8");
}

export const readSpec = () => readOrThrow(SPEC_PATH, "the specification");
export const readPrompt = () => readOrThrow(PROMPT_PATH, "the original prompt");

export function readBoundaryReview() {
  const raw = readOrThrow(BOUNDARY_PATH, "the boundary review");
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new SpecError(`the boundary review is not valid JSON: ${err.message}`);
  }
}

/**
 * Every fenced block tagged `verbatim`, with the line it starts on.
 *
 * An unclosed fence throws. A document whose last fence never closed would otherwise yield a block
 * running to the end of the file, which would compare against the prompt and fail with a message
 * about content rather than about the missing fence.
 */
export function verbatimBlocks(specText) {
  const lines = normalizeEol(specText).split("\n");
  const blocks = [];
  let open = null;
  lines.forEach((line, i) => {
    if (open === null) {
      if (line.trim() === "```verbatim") open = { line: i + 1, body: [] };
      return;
    }
    if (line.trim() === "```") {
      blocks.push({ line: open.line, text: open.body.join("\n") });
      open = null;
      return;
    }
    open.body.push(line);
  });
  if (open !== null) {
    throw new SpecError(`the verbatim block opened at line ${open.line} is never closed`);
  }
  return blocks;
}

const cells = (line) =>
  line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

const isSeparator = (line) => /^\|[\s:|-]+\|$/.test(line.trim());

/** A backticked token, or null for the em-dash placeholder. Anything else is an error. */
function token(cell, where) {
  if (cell === "—") return null;
  const m = /^`(.+)`$/.exec(cell);
  if (!m) {
    throw new SpecError(
      `${where}: the derived-from cell ${JSON.stringify(cell)} is neither a backticked token nor ` +
      "the em-dash placeholder. A token that is not delimited cannot be compared to the prompt.",
    );
  }
  return m[1];
}

/** One or more backticked tokens, comma-separated. Every element must be delimited. */
function tokenList(cell, where) {
  const parts = cell.split(/,\s*(?=`)/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) throw new SpecError(`${where}: empty token list`);
  return parts.map((p) => token(p, where));
}

/**
 * Parse the specification into items and authored declarations.
 *
 * Section-scoped: catalog rows are only read under a `### Band` heading, authored rows only under
 * `## Authored items`. Parsing by column count alone would let a table added elsewhere in the
 * document silently join the catalog.
 */
export function parseSpec(specText) {
  const lines = normalizeEol(specText).split("\n");
  const items = [];
  const authored = [];
  let section = null;

  lines.forEach((raw, index) => {
    const line = raw.trim();
    const where = `${path.basename(SPEC_PATH)}:${index + 1}`;

    if (line.startsWith("#")) {
      if (/^###\s+Band\s/.test(line)) section = "catalog";
      else if (/^##\s+Authored items\s*$/.test(line)) section = "authored";
      else if (/^##?\s/.test(line) && !line.startsWith("###")) section = null;
      return;
    }
    if (!line.startsWith("|") || isSeparator(line)) return;

    const c = cells(line);
    if (section === "catalog") {
      if (c[0] === "#") return; // header row
      if (c.length !== 6) {
        throw new SpecError(`${where}: a catalog row must have 6 cells, found ${c.length}: ${line}`);
      }
      const [num, title, cls, from, posture, impl] = c;
      if (!/^\d+$/.test(num)) throw new SpecError(`${where}: item number ${JSON.stringify(num)} is not a number`);
      if (!CLASSES.has(cls)) throw new SpecError(`${where}: unknown class ${JSON.stringify(cls)}`);
      if (!POSTURES.has(posture)) throw new SpecError(`${where}: unknown posture ${JSON.stringify(posture)}`);
      items.push({
        number: Number(num),
        title,
        class: cls,
        derivedFrom: token(from, where),
        posture,
        implementedBy: impl === "—" ? null : impl,
        line: index + 1,
      });
      return;
    }

    if (section === "authored") {
      if (c[0] === "#") return;
      if (c.length !== 4) {
        throw new SpecError(`${where}: an authored row must have 4 cells, found ${c.length}: ${line}`);
      }
      const [num, title, because, negativeOf] = c;
      if (!/^\d+$/.test(num)) throw new SpecError(`${where}: item number ${JSON.stringify(num)} is not a number`);
      authored.push({
        number: Number(num),
        title,
        because,
        // A prohibition may be the negative face of more than one token — "safety and oversight"
        // is the negative of two. The column is a comma-separated list of backticked tokens.
        negativeFaceOf: negativeOf === "—" ? [] : tokenList(negativeOf, where),
        line: index + 1,
      });
    }
  });

  return { items, authored };
}

/**
 * The `## Additions ...` section of a standard document, or null if it has none.
 *
 * Returns the text between that heading and the next H2. "None." is a legitimate value for a
 * derived standard and an illegitimate one for an authored item; distinguishing them is the
 * caller's job, not this function's.
 */
export function additionsSection(standardText) {
  const lines = normalizeEol(standardText).split("\n");
  const start = lines.findIndex((l) => l.trim() === ADDITIONS_HEADING);
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^##\s/.test(l));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
}
