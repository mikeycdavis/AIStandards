#!/usr/bin/env node
// The inventory review: the catalog is what the specification says it is, and the specification is
// honest about which of it came from the brief.
//
// This is the second of the two gates that make the fifty-three-item catalog approved content. It
// asks three questions the fidelity check cannot:
//
//   1. Does every DERIVED item resolve to a real token in the brief? A derived item whose token is
//      absent is an item invented and then attributed to the brief.
//   2. Is every AUTHORED item declared as authored, and does its standard actually carry the
//      authored content in its `## Additions` section? An authored requirement that never surfaces
//      there reads as the brief's requirement, which is the same failure wearing different clothes.
//   3. Does every non-`O` boundary posture have recorded evidence, and does every recorded posture
//      still name an item that exists?
//
// UNIMPLEMENTED ITEMS ARE NOT-EVALUATED, NEVER PASSED. Forty-six of the fifty-three standards do
// not exist yet, and every check that reads a document is withdrawn for them and reported in its
// own section. An inventory that counted a missing document as a satisfied check would be this
// framework's own central failure committed by its own tooling.
//
// Exit 0 no findings · 1 findings · 2 configuration error.

import fs from "node:fs";
import path from "node:path";
import {
  REPO_ROOT, readSpec, readPrompt, readBoundaryReview, parseSpec,
  additionsSection, normalizeEol, ADDITIONS_HEADING, SpecError,
} from "./spec.mjs";
import { loadCatalog } from "./catalog.mjs";

const EXPECTED_COUNT = 53;
const STANDARDS_DIR = path.join(REPO_ROOT, "standards");

const findings = [];
const withdrawn = [];
let checksRun = 0;

const finding = (check, detail) => findings.push({ check, detail });
const notEvaluated = (check, reason) => withdrawn.push({ check, reason });
const ran = () => { checksRun += 1; };

function checkNumbering(items) {
  ran();
  const seen = new Map();
  for (const item of items) {
    if (seen.has(item.number)) {
      finding("numbering", `item ${item.number} appears twice, at lines ${seen.get(item.number)} and ${item.line}`);
    }
    seen.set(item.number, item.line);
  }
  if (items.length !== EXPECTED_COUNT) {
    finding("numbering", `the specification lists ${items.length} items; ${EXPECTED_COUNT} are expected`);
  }
  for (let n = 1; n <= EXPECTED_COUNT; n += 1) {
    if (!seen.has(n)) finding("numbering", `item ${n} is missing. Numbering must be contiguous, or a citation resolves to nothing`);
  }
}

function checkDerivation(items, prompt) {
  ran();
  const promptText = normalizeEol(prompt);
  for (const item of items) {
    if (item.class === "V") {
      finding(
        "class",
        `item ${item.number} is class V. Verbatim is a class for QUOTED BLOCKS, not for items: an ` +
        "item is a title this repository chose, and no title is the brief's own words.",
      );
      continue;
    }
    if (item.class === "D") {
      if (item.derivedFrom === null) {
        finding("derivation", `item ${item.number} (${item.title}) is derived but names no token`);
        continue;
      }
      if (!promptText.includes(item.derivedFrom)) {
        finding(
          "derivation",
          `item ${item.number} (${item.title}) claims to derive from ${JSON.stringify(item.derivedFrom)}, ` +
          "which does not appear in artifacts/prompts/original_prompt.md. Either the token is wrong, " +
          "or the item is authored and must be reclassed A.",
        );
      }
      continue;
    }
    if (item.class === "A" && item.derivedFrom !== null) {
      finding(
        "derivation",
        `item ${item.number} is authored but names a derivation token. An authored item's authority ` +
        "is this repository's judgment; citing the brief for it is the attribution error inverted.",
      );
    }
  }
}

function checkAuthoredDeclarations(items, authored) {
  ran();
  const authoredItems = new Set(items.filter((i) => i.class === "A").map((i) => i.number));
  const declared = new Set(authored.map((a) => a.number));

  for (const n of authoredItems) {
    if (!declared.has(n)) {
      finding("authored", `item ${n} is class A but is not listed under "## Authored items". An undeclared authored item is an invented requirement`);
    }
  }
  for (const a of authored) {
    if (!authoredItems.has(a.number)) {
      finding("authored", `item ${a.number} is listed under "## Authored items" but its catalog row is not class A`);
    }
    if (!a.because || a.because === "—") {
      finding("authored", `item ${a.number} is declared authored with no reason. "Authored" without a reason records nothing`);
    }
  }

  // Titles must agree in both tables, or a renumbering silently re-attaches a justification to a
  // different item.
  const byNumber = new Map(items.map((i) => [i.number, i]));
  for (const a of authored) {
    const item = byNumber.get(a.number);
    if (item && item.title !== a.title) {
      finding("authored", `item ${a.number} is titled ${JSON.stringify(item.title)} in the catalog and ${JSON.stringify(a.title)} under Authored items`);
    }
  }
}

function checkProhibitionsNameTheirPositive(items, authored, prompt) {
  ran();
  const promptText = normalizeEol(prompt);
  for (const a of authored) {
    if (a.number < 47) continue; // Band L, the prohibitions.
    if (a.negativeFaceOf.length === 0) {
      // One umbrella is permitted, and it must declare itself one rather than simply leaving the
      // column blank. A prohibition with no positive subject and no declaration is a rule invented
      // from nothing.
      if (!/^Umbrella\b/.test(a.because)) {
        finding(
          "prohibition",
          `item ${a.number} is a prohibition that names no positive token it is the negative face of, ` +
          'and its reason does not begin "Umbrella". Every other prohibition must name its positive.',
        );
      }
      continue;
    }
    for (const t of a.negativeFaceOf) {
      if (!promptText.includes(t)) {
        finding("prohibition", `item ${a.number} is the negative face of ${JSON.stringify(t)}, which is not in the brief`);
      }
    }
  }
}

function checkImplementations(items) {
  const byNumber = new Map(items.map((i) => [i.number, i]));
  const claimed = new Map();

  for (const item of items) {
    if (item.implementedBy === null) {
      notEvaluated(
        `document checks for item ${item.number}`,
        `${item.title} — no standard document exists in this release`,
      );
      continue;
    }
    ran();
    const abs = path.join(REPO_ROOT, item.implementedBy);
    if (!fs.existsSync(abs)) {
      finding("implementation", `item ${item.number} claims ${item.implementedBy}, which does not exist`);
      continue;
    }
    if (claimed.has(item.implementedBy)) {
      finding("implementation", `${item.implementedBy} is claimed by items ${claimed.get(item.implementedBy)} and ${item.number}`);
    }
    claimed.set(item.implementedBy, item.number);

    const text = fs.readFileSync(abs, "utf8");
    const h1 = normalizeEol(text).split("\n")[0];
    const m = /^#\s+Standard\s+(\d+)\s+—\s+(.+?)\s*$/.exec(h1);
    if (!m) {
      finding("implementation", `${item.implementedBy} does not open with "# Standard N — Title"; found ${JSON.stringify(h1)}`);
      continue;
    }
    if (Number(m[1]) !== item.number) {
      finding("implementation", `${item.implementedBy} calls itself Standard ${m[1]}; the specification numbers it ${item.number}`);
    }
    if (m[2] !== item.title) {
      finding(
        "implementation",
        `${item.implementedBy} is titled ${JSON.stringify(m[2])}; the specification titles it ${JSON.stringify(item.title)}. ` +
        "Two titles for one standard means a citation resolves to a document nobody can confirm is the right one.",
      );
    }

    const additions = additionsSection(text);
    if (additions === null) {
      finding("additions", `${item.implementedBy} has no ${JSON.stringify(ADDITIONS_HEADING)} section`);
      continue;
    }
    if (additions === "") {
      finding("additions", `${item.implementedBy} has an empty Additions section. "None." must be explicit, so the absence is a decision rather than an omission`);
      continue;
    }
    if (item.class === "A" && /^none\.?$/i.test(additions.trim())) {
      finding(
        "additions",
        `item ${item.number} is authored in full, but ${item.implementedBy} declares no additions. ` +
        "An authored standard whose Additions section says None presents this repository's own " +
        "requirements as the brief's.",
      );
    }
  }

  // The other direction: a document on disk nobody claims would never be checked by anything here.
  ran();
  for (const file of fs.readdirSync(STANDARDS_DIR).filter((f) => f.endsWith(".md"))) {
    const rel = `standards/${file}`;
    if (!claimed.has(rel)) {
      finding("implementation", `${rel} exists but no specification item claims it. An unclaimed standard is outside the inventory entirely`);
    }
  }
  return byNumber;
}

function checkBoundary(items, review) {
  ran();
  const byNumber = new Map(items.map((i) => [i.number, i]));
  const recorded = new Map();

  for (const p of review.postures ?? []) {
    if (recorded.has(p.item)) finding("boundary", `item ${p.item} has two boundary-review entries`);
    recorded.set(p.item, p);
    const item = byNumber.get(p.item);
    if (!item) {
      finding("boundary", `the boundary review records item ${p.item}, which the specification does not list`);
      continue;
    }
    if (item.posture !== p.posture) {
      finding("boundary", `item ${p.item} is posture ${item.posture} in the specification and ${p.posture} in the boundary review`);
    }
    if (item.title !== p.title) {
      finding("boundary", `item ${p.item} is titled differently in the boundary review`);
    }
    if (!Array.isArray(p.evidence) || p.evidence.length === 0) {
      finding("boundary", `item ${p.item} has posture ${p.posture} but records no evidence. A deferral to an unnamed standard defers into nothing`);
    }
    for (const e of p.evidence ?? []) {
      if (!e.pack || !e.standard || !e.observation) {
        finding("boundary", `item ${p.item} has an evidence entry missing pack, standard or observation`);
      }
    }
  }

  const notGoverned = new Set(review.notGovernedElsewhere?.items ?? []);
  for (const item of items) {
    if (item.posture === "O") {
      if (!notGoverned.has(item.number)) {
        finding(
          "boundary",
          `item ${item.number} is posture O but is not listed in notGovernedElsewhere. An O recorded ` +
          "without a search for an owner is an assumption, not a posture.",
        );
      }
      // An O item may carry an entry, but only one that records the REMOVAL of a deference. That
      // is the search an O posture requires, written down. An O item carrying a live deference
      // entry would be claiming to own something it also defers.
      const entry = recorded.get(item.number);
      if (entry && entry.verdict !== "CHANGED") {
        finding(
          "boundary",
          `item ${item.number} is posture O and carries a boundary entry with verdict ${entry.verdict}. ` +
          "An O item's entry may only record a deference that was removed on evidence.",
        );
      }
      continue;
    }
    if (!recorded.has(item.number)) {
      finding("boundary", `item ${item.number} has posture ${item.posture} and no boundary-review evidence`);
    }
    if (notGoverned.has(item.number)) {
      finding("boundary", `item ${item.number} defers to another pack yet is listed as governed by nobody`);
    }
  }

  // A review that claims a human signed it off, without a name, would be inventing a reviewer.
  ran();
  if (review.humanSignOff !== null && !review.humanSignOff) {
    finding("boundary", "humanSignOff is neither null nor a named reviewer. Absence must be recorded as null, not as an empty value");
  }
}

function checkRuleBindings(items) {
  ran();
  const numbers = new Set(items.map((i) => i.number));
  const catalog = loadCatalog();
  const cited = new Set();
  for (const [id, rule] of catalog.rules) {
    if (!numbers.has(rule.standard)) {
      finding("binding", `rule ${id} cites standard ${rule.standard}, which is not an item in the specification`);
    }
    cited.add(rule.standard);
  }
  // The reverse direction is not a finding in this release: forty-six standards are unwritten, so
  // an item with no rule is expected. Reporting it as satisfied would be the false pass; reporting
  // it as a failure would be noise. It is withdrawn.
  const uncited = items.filter((i) => !cited.has(i.number));
  notEvaluated(
    "rule coverage per standard",
    `${uncited.length} of ${items.length} items have no catalog rule. Standard 6 requires every ` +
    "standard to cite at least one rule or record why not, and that check needs the rules Phase 2 " +
    "has not written",
  );
  return catalog.rules.size;
}

function main() {
  const spec = readSpec();
  const prompt = readPrompt();
  const review = readBoundaryReview();
  const { items, authored } = parseSpec(spec);

  if (items.length === 0) {
    process.stderr.write("inventory: the specification lists no items. There is nothing to check.\n");
    return 2;
  }

  checkNumbering(items);
  checkDerivation(items, prompt);
  checkAuthoredDeclarations(items, authored);
  checkProhibitionsNameTheirPositive(items, authored, prompt);
  checkImplementations(items);
  checkBoundary(items, review);
  const ruleCount = checkRuleBindings(items);

  const derived = items.filter((i) => i.class === "D").length;
  const authoredCount = items.filter((i) => i.class === "A").length;
  const implemented = items.filter((i) => i.implementedBy !== null).length;

  const out = [];
  out.push("inventory: the derived specification against the brief, the standards, and the boundary review.");
  out.push("");
  out.push(`  items            ${items.length}   (${derived} derived, ${authoredCount} authored)`);
  out.push(`  implemented      ${implemented}    standard document(s) on disk`);
  out.push(`  catalog rules    ${ruleCount}`);
  out.push(`  checks run       ${checksRun}`);
  out.push("");

  if (withdrawn.length > 0) {
    out.push(`NOT EVALUATED — ${withdrawn.length} check(s) could not run. None of these is a pass:`);
    for (const w of withdrawn) out.push(`  · ${w.check}: ${w.reason}`);
    out.push("");
  }

  if (findings.length > 0) {
    out.push(`FAIL — ${findings.length} finding(s):`);
    for (const f of findings) out.push(`  [${f.check}] ${f.detail}`);
    out.push("");
    out.push("The catalog is not approved content while any finding stands.");
    process.stdout.write(out.join("\n") + "\n");
    return 1;
  }

  out.push("PASS — every derived item resolves to a token in the brief, every authored item is");
  out.push("declared as authored and surfaces in its standard's Additions section, and every");
  out.push("non-O posture carries recorded boundary evidence.");
  out.push("");
  out.push("This does not establish that any item is well drafted, that the tokenisation is the only");
  out.push("reasonable reading, or that the boundary holds — the substantive half of the boundary");
  out.push("review is human judgment and artifacts/boundary-review.json records that nobody has");
  out.push("signed it off.");
  process.stdout.write(out.join("\n") + "\n");
  return 0;
}

try {
  process.exit(main());
} catch (err) {
  if (err instanceof SpecError) {
    process.stderr.write(`inventory: ${err.message}\n`);
    process.exit(2);
  }
  if (err?.name === "CatalogError") {
    process.stderr.write(`inventory: the catalog does not load: ${err.message}\n`);
    process.exit(2);
  }
  throw err;
}
