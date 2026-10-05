#!/usr/bin/env node
// Document conformance: every WRITTEN standard carries the brief's nine required statements through
// Standard 6's ten-section structure, and says correctly which specification item it is.
//
// Standard 6 R1 fixes the file name and H1; R2 fixes ten H2 sections in order and says conformance
// "is asserted against the brief's nine, not against the section count". So the mapping from the
// brief's nine requirements to sections is held below AS DATA, the data is checked for internal
// consistency before any document is read, and every document reports, per brief requirement,
// whether that requirement resolves to a present, non-empty section. A requirement that maps to
// nothing, or to a section that is not required, is a configuration error — the brief's nine must
// never go uncovered silently.
//
// What this does NOT establish: that any section says anything adequate. A section passes by
// existing, being in order and being non-empty. Whether "Failure modes" names real failure modes is
// human review.
//
// UNWRITTEN ITEMS ARE NOT EVALUATED. A specification item whose Implemented-by cell is "—" is never
// required to exist; it is listed as not evaluated, never counted as conforming.
//
// AN H2 THAT IS NOT ONE OF THE REQUIRED SECTIONS IS AN OBSERVATION, NOT A FINDING. Standard 6 R2
// requires the ten sections in order; it does not say others are forbidden, and this tool does not
// author that prohibition. Observations are reported and never change the exit code.
//
// Usage: node scripts/standards-sections.mjs [--root=<dir>] [--json]
// Exit 0 every document conforms · 1 findings · 2 configuration error (bad arguments, missing
// directories, an unreadable or unparseable specification, a specification with no items, zero
// standard documents, or an inconsistent mapping). Zero documents checked is not a pass.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSpec, normalizeEol, ADDITIONS_HEADING, SpecError } from "./spec.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(HERE, "..");
const STANDARDS_REL = "standards";
const SPEC_REL = "artifacts/prompts/ai-standards-spec.md";

const EXIT_OK = 0;
const EXIT_FINDINGS = 1;
const EXIT_CONFIG = 2;

// ---------------------------------------------------------------------------------------------
// The mapping. Standard 6 R2 and the Phase 2 plan's skeleton table.
// ---------------------------------------------------------------------------------------------

/** The brief's nine statements, `artifacts/prompts/original_prompt.md`, "Each standard must clearly state:". */
const BRIEF_REQUIREMENTS = Object.freeze([
  [1, "Scope and applicability"],
  [2, "Normative requirements using MUST, MUST NOT, SHOULD, and MAY"],
  [3, "Rationale and failure modes"],
  [4, "Evidence required to demonstrate compliance"],
  [5, "Automated, manual-review, or not-evaluable validation type"],
  [6, "Severity and non-exemptibility"],
  [7, "Minimum tests and falsifiers"],
  [8, "Exceptions, attestations, expiry, and review-staleness rules"],
  [9, "Related standards and ADRs"],
]);

/**
 * The required H2 headings, in order, as the documents spell them. Standard 6 R2's inline prose
 * writes "Validation severity and exemptibility" without commas; every document and the approved
 * plan use the commas, and this list follows the documents.
 */
const REQUIRED_SECTIONS = Object.freeze([
  "Scope",
  "Requirements",
  "Failure modes",
  "Evidence",
  "Validation, severity, and exemptibility",
  "Tests and falsifiers",
  "Exceptions and staleness",
  "Additions this standard makes beyond the source",
  "Relationship to other standards and ADRs",
  "Implementation",
]);

/** Brief requirement number → the section that carries it. 5 and 6 share one section. */
const BRIEF_TO_SECTION = Object.freeze({
  1: "Scope",
  2: "Requirements",
  3: "Failure modes",
  4: "Evidence",
  5: "Validation, severity, and exemptibility",
  6: "Validation, severity, and exemptibility",
  7: "Tests and falsifiers",
  8: "Exceptions and staleness",
  9: "Relationship to other standards and ADRs",
});

/** Sections inherited from the archetype: required by Standard 6, carrying no brief requirement. */
const INHERITED_SECTIONS = Object.freeze([
  "Additions this standard makes beyond the source",
  "Implementation",
]);

/** Every way the mapping can disagree with itself. Empty means consistent. */
function mappingProblems() {
  const problems = [];
  const numbers = BRIEF_REQUIREMENTS.map(([n]) => n);
  const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  if (JSON.stringify(numbers) !== JSON.stringify(expected)) {
    problems.push(`the brief requirements are numbered ${JSON.stringify(numbers)}; the brief lists exactly 1 through 9`);
  }
  const required = new Set(REQUIRED_SECTIONS);
  if (required.size !== REQUIRED_SECTIONS.length) {
    problems.push("the required-section list names a section more than once");
  }
  for (const [n, statement] of BRIEF_REQUIREMENTS) {
    const section = BRIEF_TO_SECTION[n];
    if (section === undefined) {
      problems.push(`brief requirement ${n} ("${statement}") maps to no section, so nothing would check it`);
    } else if (!required.has(section)) {
      problems.push(`brief requirement ${n} ("${statement}") maps to "## ${section}", which is not a required section`);
    }
  }
  for (const key of Object.keys(BRIEF_TO_SECTION)) {
    if (!numbers.includes(Number(key))) {
      problems.push(`the mapping names brief requirement ${key}, which the brief does not list`);
    }
  }
  const mapped = new Set(Object.values(BRIEF_TO_SECTION));
  for (const section of INHERITED_SECTIONS) {
    if (!required.has(section)) problems.push(`inherited section "## ${section}" is not a required section`);
    if (mapped.has(section)) {
      problems.push(`"## ${section}" is declared inherited but also carries a brief requirement; inherited means it carries none`);
    }
  }
  for (const section of REQUIRED_SECTIONS) {
    if (!mapped.has(section) && !INHERITED_SECTIONS.includes(section)) {
      problems.push(`required section "## ${section}" carries no brief requirement and is not declared inherited`);
    }
  }
  if (!REQUIRED_SECTIONS.map((s) => `## ${s}`).includes(ADDITIONS_HEADING)) {
    problems.push(`scripts/spec.mjs names the Additions heading ${JSON.stringify(ADDITIONS_HEADING)}, which is not a required section here`);
  }
  return problems;
}

// ---------------------------------------------------------------------------------------------
// Reading a document
// ---------------------------------------------------------------------------------------------

const FILENAME = /^(\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const H1 = /^#[ \t]+Standard[ \t]+(\d+)[ \t]+—[ \t]+(.*\S)[ \t]*$/;
const H1_WRONG_DASH = /^#[ \t]+Standard[ \t]+\d+[ \t]+(?:-{1,2}|–|:)[ \t]+/;
const SOURCE = /^Source: item (\d+) of \[`artifacts\/prompts\/ai-standards-spec\.md`\]/;
const H2 = /^ {0,3}##(?:[ \t]+(.*?))?[ \t]*$/;
const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;

/**
 * Lines, H2 headings and Source lines, skipping fenced code and HTML comment blocks.
 *
 * A `#` line inside a fence is an example, not a heading. A comment block is one that STARTS a line
 * with `<!--` and runs to the first line containing `-->` (CommonMark's HTML block type 2).
 */
function scan(text) {
  const lines = normalizeEol(text).split("\n");
  const headings = [];
  const sources = [];
  let fence = null;
  let inComment = false;

  lines.forEach((line, i) => {
    if (fence !== null) {
      const close = FENCE_CLOSE.exec(line);
      if (close && close[1][0] === fence.char && close[1].length >= fence.length) fence = null;
      return;
    }
    if (inComment) {
      if (line.includes("-->")) inComment = false;
      return;
    }
    const open = FENCE_OPEN.exec(line);
    // A backtick fence's info string may not contain a backtick; such a line is inline code.
    if (open && !(open[1][0] === "`" && open[2].includes("`"))) {
      fence = { char: open[1][0], length: open[1].length, line: i + 1 };
      return;
    }
    const h2 = H2.exec(line);
    if (h2) {
      const heading = (h2[1] ?? "").replace(/(?:^|[ \t]+)#+$/, "").trim();
      headings.push({ text: heading, line: i + 1, index: i });
      return;
    }
    const commentStart = /^ {0,3}<!--/.exec(line);
    if (commentStart && !line.slice(commentStart[0].length).includes("-->")) {
      inComment = true;
      return;
    }
    const source = SOURCE.exec(line);
    if (source) sources.push({ item: Number(source[1]), line: i + 1 });
  });

  // Each heading's body runs to the next H2 or the end of the file.
  headings.forEach((h, k) => {
    const end = k + 1 < headings.length ? headings[k + 1].index : lines.length;
    const body = lines.slice(h.index + 1, end).join("\n");
    // Empty means nothing but whitespace once HTML comments are removed. A generated block is a
    // table between two comments, so the table survives and the section is not empty.
    h.empty = body.replace(/<!--[\s\S]*?(?:-->|$)/g, "").trim() === "";
  });

  return { lines, headings, sources, unclosedFence: fence === null ? null : fence.line };
}

const loose = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function checkDocument(file, text, spec) {
  const rel = `${STANDARDS_REL}/${file}`;
  const findings = [];
  const observations = [];
  const add = (kind, message, line = null) => findings.push({ kind, message, line });
  const { lines, headings, sources, unclosedFence } = scan(text);

  // --- Identity: Standard 6 R1 ---------------------------------------------------------------
  const nameMatch = FILENAME.exec(file);
  const fileNumber = nameMatch ? Number(nameMatch[1]) : null;
  if (!nameMatch) {
    add("filename-malformed", `${rel} is not named NN-kebab-case-title.md (two digits, then lowercase words joined by single hyphens)`);
  }

  const first = lines[0];
  const h1 = H1.exec(first);
  let h1Number = null;
  let title = null;
  if (!h1) {
    const dash = H1_WRONG_DASH.test(first) ? " The separator must be an em dash (U+2014), not a hyphen, en dash or colon." : "";
    add("h1-malformed", `the first line must be "# Standard N — Title"; found ${JSON.stringify(first)}.${dash}`, 1);
  } else {
    h1Number = Number(h1[1]);
    title = h1[2];
    if (fileNumber !== null && h1Number !== fileNumber) {
      add("h1-number-mismatch", `the H1 calls this Standard ${h1Number}; the file name numbers it ${fileNumber}`, 1);
    }
  }
  const number = fileNumber ?? h1Number;

  // --- Provenance: the Source line and the specification row -----------------------------------
  if (sources.length === 0) {
    add(
      "source-missing",
      "no line of the form \"Source: item N of [`artifacts/prompts/ai-standards-spec.md`](...)\" outside fenced code",
    );
  }
  if (number !== null) {
    for (const s of sources) {
      if (s.item !== number) {
        add("source-item-mismatch", `the Source line cites item ${s.item}; this document is Standard ${number}`, s.line);
      }
    }
    const rows = spec.byNumber.get(number) ?? [];
    if (rows.length === 0) {
      add("spec-item-missing", `${SPEC_REL} has no catalog item ${number}`);
    } else {
      const row = rows[0];
      if (title !== null && row.title !== title) {
        add(
          "title-mismatch",
          `the H1 title is ${JSON.stringify(title)}; ${SPEC_REL} item ${number} (line ${row.line}) titles it ${JSON.stringify(row.title)}`,
          1,
        );
      }
      if (row.implementedBy !== rel) {
        add(
          "spec-claim-mismatch",
          row.implementedBy === null
            ? `${SPEC_REL} item ${number} (line ${row.line}) records no document (Implemented by "—"), but ${rel} exists`
            : `${SPEC_REL} item ${number} (line ${row.line}) is implemented by ${JSON.stringify(row.implementedBy)}, not ${JSON.stringify(rel)}`,
        );
      }
    }
  }
  for (const other of spec.items) {
    if (other.implementedBy === rel && other.number !== number) {
      add("claimed-by-other-item", `${SPEC_REL} item ${other.number} (line ${other.line}) also claims ${rel}`);
    }
  }

  // --- Structure: Standard 6 R2 ----------------------------------------------------------------
  if (unclosedFence !== null) {
    add("unclosed-fence", `the fenced block opened at line ${unclosedFence} is never closed, so everything after it is code, not structure`, unclosedFence);
  }

  const required = new Set(REQUIRED_SECTIONS);
  const occurrences = new Map();
  for (const h of headings) {
    if (!required.has(h.text)) {
      observations.push({
        kind: "unrecognized-section",
        message: `"## ${h.text}" is not one of the required sections. Recorded, not failed: Standard 6 R2 requires its sections in order and does not forbid others`,
        line: h.line,
      });
      continue;
    }
    if (!occurrences.has(h.text)) occurrences.set(h.text, []);
    occurrences.get(h.text).push(h);
  }

  for (const section of REQUIRED_SECTIONS) {
    const occ = occurrences.get(section) ?? [];
    if (occ.length === 0) {
      const near = headings.find((h) => !required.has(h.text) && loose(h.text) === loose(section));
      const hint = near ? `; "## ${near.text}" at line ${near.line} differs from it only in case or punctuation` : "";
      add("missing-section", `no "## ${section}" heading${hint}`);
      continue;
    }
    for (const again of occ.slice(1)) {
      add("duplicate-section", `"## ${section}" appears again at line ${again.line}; it first appears at line ${occ[0].line}`, again.line);
    }
    for (const o of occ) {
      if (o.empty) add("empty-section", `"## ${section}" at line ${o.line} has no content once HTML comments are removed`, o.line);
    }
  }

  const present = REQUIRED_SECTIONS.filter((s) => occurrences.has(s));
  const actual = [...present].sort((a, b) => occurrences.get(a)[0].line - occurrences.get(b)[0].line);
  const firstWrong = actual.findIndex((s, i) => s !== present[i]);
  if (firstWrong !== -1) {
    add(
      "sections-out-of-order",
      `required sections appear as [${actual.join(" | ")}]; the order is [${present.join(" | ")}]`,
      occurrences.get(actual[firstWrong])[0].line,
    );
  }

  // --- The brief's nine, through the mapping ----------------------------------------------------
  const briefRequirements = BRIEF_REQUIREMENTS.map(([n, statement]) => {
    const section = BRIEF_TO_SECTION[n];
    const occ = occurrences.get(section)?.[0] ?? null;
    const reason = occ === null ? "absent" : occ.empty ? "empty" : null;
    if (reason !== null) {
      add(
        "brief-requirement-unresolved",
        `brief requirement ${n} ("${statement}") is carried by "## ${section}", which is ${reason}`,
        occ?.line ?? null,
      );
    }
    return { number: n, statement, section, resolved: reason === null, line: occ?.line ?? null, reason };
  });

  return { file: rel, number, title, conforms: findings.length === 0, findings, observations, briefRequirements };
}

// ---------------------------------------------------------------------------------------------
// The run
// ---------------------------------------------------------------------------------------------

class ConfigError extends Error {}

const USAGE = "Usage: node scripts/standards-sections.mjs [--root=<dir>] [--json]";

function parseArgs(argv) {
  const options = { root: DEFAULT_ROOT, json: false };
  const seen = new Set();
  for (const arg of argv) {
    const name = arg.startsWith("--root=") ? "--root" : arg;
    if (seen.has(name)) throw new ConfigError(`${name} given more than once. ${USAGE}`);
    seen.add(name);
    if (arg === "--json") {
      options.json = true;
    } else if (name === "--root") {
      const value = arg.slice("--root=".length);
      if (value === "") throw new ConfigError(`--root= needs a directory. ${USAGE}`);
      options.root = path.resolve(value);
    } else {
      throw new ConfigError(`unknown argument ${JSON.stringify(arg)}. ${USAGE}`);
    }
  }
  return options;
}

const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };

function run(argv) {
  const options = parseArgs(argv);

  const problems = mappingProblems();
  if (problems.length > 0) {
    throw new ConfigError(`the brief-to-section mapping is inconsistent, so no document can be checked against it:\n  - ${problems.join("\n  - ")}`);
  }

  const { root } = options;
  if (!isDir(root)) throw new ConfigError(`root ${root} is not a directory`);
  const standardsDir = path.join(root, STANDARDS_REL);
  if (!isDir(standardsDir)) throw new ConfigError(`${standardsDir} is not a directory. There is nothing to check.`);
  const specPath = path.join(root, ...SPEC_REL.split("/"));
  let specText;
  try {
    specText = fs.readFileSync(specPath, "utf8");
  } catch (err) {
    throw new ConfigError(`the specification ${specPath} cannot be read: ${err.message}`);
  }
  let items;
  try {
    ({ items } = parseSpec(specText));
  } catch (err) {
    if (err instanceof SpecError) throw new ConfigError(`the specification ${specPath} does not parse: ${err.message}`);
    throw err;
  }
  if (items.length === 0) {
    throw new ConfigError(`the specification ${specPath} lists no catalog items, so no document's identity can be checked`);
  }

  const files = fs.readdirSync(standardsDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort();
  if (files.length === 0) {
    throw new ConfigError(`${standardsDir} holds no standard documents (*.md). Checking zero documents is not a pass.`);
  }

  const byNumber = new Map();
  for (const item of items) {
    if (!byNumber.has(item.number)) byNumber.set(item.number, []);
    byNumber.get(item.number).push(item);
  }
  const spec = { items, byNumber };

  const documents = files.map((file) => {
    let text;
    try {
      text = fs.readFileSync(path.join(standardsDir, file), "utf8");
    } catch (err) {
      throw new ConfigError(`${STANDARDS_REL}/${file} cannot be read: ${err.message}`);
    }
    return checkDocument(file, text, spec);
  });

  const rootFindings = [];
  for (const [n, rows] of byNumber) {
    if (rows.length > 1) {
      rootFindings.push({ kind: "spec-item-duplicated", message: `${SPEC_REL} lists item ${n} ${rows.length} times, at lines ${rows.map((r) => r.line).join(", ")}`, line: null });
    }
  }
  const onDisk = new Set(documents.map((d) => d.file));
  for (const item of items) {
    if (item.implementedBy !== null && !onDisk.has(item.implementedBy)) {
      rootFindings.push({
        kind: "claimed-document-missing",
        message: `${SPEC_REL} item ${item.number} (line ${item.line}) claims ${JSON.stringify(item.implementedBy)}, which is not a document in ${STANDARDS_REL}/`,
        line: null,
      });
    }
  }

  const unwritten = items.filter((i) => i.implementedBy === null).map((i) => i.number);
  const findingCount = rootFindings.length + documents.reduce((n, d) => n + d.findings.length, 0);
  const exitCode = findingCount > 0 ? EXIT_FINDINGS : EXIT_OK;

  const report = {
    tool: "standards-sections",
    root,
    result: exitCode === EXIT_OK ? "conforms" : "findings",
    exitCode,
    mapping: {
      requiredSections: [...REQUIRED_SECTIONS],
      briefRequirements: BRIEF_REQUIREMENTS.map(([number, statement]) => ({ number, statement, section: BRIEF_TO_SECTION[number] })),
      inheritedSections: [...INHERITED_SECTIONS],
    },
    observationPolicy:
      "An H2 that is not a required section is an observation and does not change the exit code: " +
      "Standard 6 R2 requires its sections in order and does not state that others are forbidden.",
    documents,
    rootFindings,
    notEvaluated: {
      unwrittenItems: unwritten,
      reason: "these specification items record no document (Implemented by \"—\"); nothing is required of them, and they are not counted as conforming",
    },
    summary: {
      documents: documents.length,
      conforming: documents.filter((d) => d.conforms).length,
      findings: findingCount,
      observations: documents.reduce((n, d) => n + d.observations.length, 0),
      unwrittenItems: unwritten.length,
    },
  };

  process.stdout.write(options.json ? `${JSON.stringify(report, null, 2)}\n` : render(report));
  return exitCode;
}

function render(report) {
  const out = [];
  const at = (file, line) => (line === null ? file : `${file}:${line}`);
  out.push("standards-sections: the ten-section structure and the identity of every written standard.");
  out.push("");
  out.push(`  root              ${report.root}`);
  out.push(`  documents         ${report.summary.documents}`);
  out.push(`  conforming        ${report.summary.conforming}`);
  out.push(`  unwritten items   ${report.summary.unwrittenItems} (not evaluated; nothing is required of them)`);
  out.push("");
  for (const d of report.documents) {
    const resolved = d.briefRequirements.filter((r) => r.resolved).length;
    out.push(`  ${d.conforms ? "ok  " : "FAIL"}  ${d.file}  (${resolved}/${d.briefRequirements.length} brief requirements resolve)`);
  }
  out.push("");

  const observations = report.documents.flatMap((d) => d.observations.map((o) => ({ ...o, file: d.file })));
  if (observations.length > 0) {
    out.push(`OBSERVATIONS — ${observations.length}. These do not change the exit code; Standard 6 R2 does not forbid other H2s:`);
    for (const o of observations) out.push(`  ${at(o.file, o.line)} [${o.kind}] ${o.message}`);
    out.push("");
  }

  const findings = [
    ...report.rootFindings.map((f) => ({ ...f, file: SPEC_REL })),
    ...report.documents.flatMap((d) => d.findings.map((f) => ({ ...f, file: d.file }))),
  ];
  if (findings.length > 0) {
    out.push(`FAIL — ${findings.length} finding(s):`);
    for (const f of findings) out.push(`  ${at(f.file, f.line)} [${f.kind}] ${f.message}`);
  } else {
    out.push("PASS — every written standard carries the required sections in order, none empty, each of the");
    out.push("brief's nine requirements resolves to its section, and each document's number, title and");
    out.push("Source line agree with its specification row.");
    out.push("");
    out.push("This does not establish that any section says anything adequate — only that it exists, is in");
    out.push("order, and is not empty.");
  }
  return `${out.join("\n")}\n`;
}

try {
  process.exit(run(process.argv.slice(2)));
} catch (err) {
  if (err instanceof ConfigError) {
    process.stderr.write(`standards-sections: ${err.message}\n`);
    process.exit(EXIT_CONFIG);
  }
  throw err;
}
