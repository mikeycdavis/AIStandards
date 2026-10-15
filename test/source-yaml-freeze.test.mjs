// The YAML branches of scripts/source.mjs are frozen (ST-57, #119, decisions A and H).
//
// source.mjs is the lexical layer, and it is SHARED: Standard 21's source-code forms and Standard 9
// (misuse.safety-controls-not-disabled, which stays lexical until ST-49 / #111 decides otherwise) both
// read YAML through it. The structural reader replaces the YAML handling Standard 21 needed; it does
// not replace this. So the YAML-specific branches are pinned two ways:
//
//   * by content hash: the block-scalar machinery (BLOCK_HEADER and yamlBlockScalarEnd) and the three
//     places splitSource consults `isYaml`, so an edit to them is a visible decision rather than a
//     drive-by;
//   * by behaviour: splitSource over a set of YAML inputs returns exactly the pinned partitions.
//
// Retiring any of this belongs to the story that migrates YAML detection and states what replaced it
// (ST-59, #121), and Standard 9 or TOML move only through ST-49 / #111. If this test fails because a
// branch was changed on purpose, update the pin in the same change and say why in the description.

import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { REPO } from "./helpers.mjs";
import { splitSource, extensionOf } from "../scripts/source.mjs";

const SOURCE = fs.readFileSync(path.join(REPO, "scripts", "source.mjs"), "utf8").replace(/\r\n/g, "\n");
const sha = (text) => crypto.createHash("sha256").update(text).digest("hex");

function between(start, end) {
  const a = SOURCE.indexOf(start);
  const b = SOURCE.indexOf(end, a);
  assert.ok(a !== -1 && b !== -1, `markers not found: ${start} .. ${end}`);
  return SOURCE.slice(a, b);
}

test("the block-scalar machinery of source.mjs is unchanged", () => {
  const region = between("// A YAML block-scalar header ends its line", "/**\n * Split source text into");
  assert.equal(sha(region), PINNED.blockScalar);
});

test("the three places splitSource consults the YAML flag are unchanged", () => {
  const lines = SOURCE.split("\n").filter((l) => /\bisYaml\b/.test(l));
  assert.equal(sha(lines.join("\n")), PINNED.isYaml);
  assert.equal(lines.length, 3);
});

test("the extension table still routes .yml and .yaml (and .toml, and .json) to the same syntaxes", () => {
  const rows = SOURCE.split("\n").filter((l) => /"\.(yml|yaml|toml|json)"/.test(l));
  assert.equal(sha(rows.join("\n")), PINNED.extensions);
});

test("behaviour: splitSource over YAML returns the pinned partitions", () => {
  for (const [name, input, expected] of CASES) {
    const got = splitSource(input, "p.yaml");
    assert.deepEqual(
      { usable: got.usable, codeOnly: got.codeOnly },
      expected,
      `splitSource changed for: ${name}`,
    );
  }
  assert.equal(extensionOf("p.YAML"), ".yaml");
});

// Pins computed from scripts/source.mjs as of the ST-57 base (develop de149bf), where it is unchanged.
const PINNED = {
  blockScalar: "9051320b2960cac86742af9da47acf90a51c34b60fce3708d8acee570a714689",
  isYaml: "9f9e81c7093bee0e184ad8aea25481d15d050c474bb4937f525096d9f8795c56",
  extensions: "2ae72c02e5cbd386191129a82a9d2a462c2af05880e015a7697ef380320fdb3c",
};
const CASES = [
  [
    "plain mapping with comment and quoted value",
    "# top\nname: \"x # not a comment\"  # tail\nk: v\n",
    {
      "usable": true,
      "codeOnly": "     \nname: \"                          \nk: v\n"
    }
  ],
  [
    "block literal ends by dedent",
    "doc: |\n  system: \"a\"\n  more\nnext: 1\n",
    {
      "usable": true,
      "codeOnly": "doc: |\n             \n      \nnext: 1\n"
    }
  ],
  [
    "block folded with indicators behind an anchor and tag",
    "a: &x !t >-2\n    text\n  tail\nb: c\n",
    {
      "usable": true,
      "codeOnly": "a: &x !t >-2\n        \n      \nb: c\n"
    }
  ],
  [
    "sequence item with block scalar",
    "- |\n  one\n  two\n- three\n",
    {
      "usable": true,
      "codeOnly": "- |\n     \n     \n- three\n"
    }
  ],
  [
    "quoted key kept whole in property-name position",
    "\"system\": \"You are a support triage assis\"\nrole: 'system'\n",
    {
      "usable": true,
      "codeOnly": "\"system\": \"                               \nrole: '       \n"
    }
  ],
  [
    "header-looking value inside quotes is not a block",
    "note: \"a |\"\n\"system\": \"q\"\n",
    {
      "usable": true,
      "codeOnly": "note: \"    \n\"system\": \"  \n"
    }
  ],
  [
    "pipe after comment hash is not a header",
    "note: a # b: |\nk: v\n",
    {
      "usable": true,
      "codeOnly": "note: a       \nk: v\n"
    }
  ],
  [
    "crlf line endings",
    "a: |\r\n  one\r\nb: 2\r\n",
    {
      "usable": true,
      "codeOnly": "a: |\r\n     \r\nb: 2\r\n"
    }
  ],
  [
    "flow mapping",
    "{role: \"system\", content: \"c\", list: [1, \"two\"]}\n",
    {
      "usable": true,
      "codeOnly": "{role: \"       , content: \"  , list: [1, \"    ]}\n"
    }
  ],
  [
    "document markers",
    "a: 1\n---\nb: |\n  t\n...\n",
    {
      "usable": true,
      "codeOnly": "a: 1\n---\nb: |\n   \n...\n"
    }
  ],
  [
    "empty block scalar",
    "k: |\nnext: \"v\"\n",
    {
      "usable": true,
      "codeOnly": "k: |\nnext: \"  \n"
    }
  ],
  [
    "explicit indentation under dash-quoted key",
    "- \"documentation\": |2\n    text\n  system: \"s\"\n",
    {
      "usable": true,
      "codeOnly": "- \"documentation\": |2\n        \n  system: \"  \n"
    }
  ]
];
