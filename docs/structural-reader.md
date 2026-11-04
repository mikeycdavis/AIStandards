# The structural reader

`scripts/structural.mjs` reads YAML and JSON as parsed trees with exact source positions. It is a reader,
not a detector: it decides nothing about prompts or any rule. It exists so that detection over
configuration files can stop guessing structure from indentation (the lexical layer, `scripts/source.mjs`,
which stays the right tool for source code).

Implemented by ST-57 (#119). The consumer that re-expresses the inline-prompt shapes over this tree is
`scripts/structural-shapes.mjs` (ST-58, #120; see "The inline-prompt shapes over the tree" below); migrating YAML detector fixtures and retiring YAML-specific lexical branches is ST-59 (#121);
Standard 21 text, assurance notes and schema documentation are ST-60 (#122); moving Standard 9 or TOML
onto this layer is ST-49 (#111) alone.

## Scope

`.yml`, `.yaml` and `.json`, matched case-insensitively on the file name by `isStructuralScope`. Nothing is
sniffed from content: JSON text in a `.yml` file is read as YAML, and YAML in a `.json` file fails.

Named non-claims, never read structurally: JSONC, JSON5, JSONL/NDJSON, templates (`*.yaml.j2`), Markdown
fences, notebooks, extensionless files, and a file whose content does not match its extension. A JSONC
file named `*.json` is therefore *unparseable*, not leniently read. TOML stays on the frozen lexical layer.

## The tree

Both formats produce one node shape. Offsets index the decoded text (UTF-16 code units, so
`text.slice(start, end)` is the source); `line` is 1-based and counts LF; `column` is 1-based in code
points; `length` is the length of the decoded value in Unicode code points. A leading UTF-8 byte order mark
is removed first and recorded.

| `kind` | fields |
|---|---|
| `map` | `pairs[]` of `{ key, value, merge, range }`, every occurrence in source order (duplicate keys are kept) |
| `seq` | `items[]` |
| `scalar` | `value` (decoded string), `length`, `style`, `jsonType` (JSON only) |
| `alias` | `name` |

Every node has `range`; YAML nodes may carry `anchor` and `tag` with the offset where they were written. Where
the written position of a property cannot be recovered, `offset` is `null`, and a tag then carries the parser's
resolved tag with `resolved: true`, never presented as the written spelling (a known limit: for example a
flow map entry whose quoted key's colon has no space after it, `{"k":!!str v}`).

* Every scalar is a string. A plain `true`, `12` or `null` is that text; there is no implicit type coercion.
* Block, quoted and multi-line plain scalars are decoded to their semantic value (escapes resolved, lines
  folded, chomping applied). `length` measures the decoded value; `range` keeps the source extent.
* Aliases are **not dereferenced** and merge keys (`<<`) are **not applied**. They are recorded
  (`aliases`, `merges`) and reported on the audit as present and not followed.
* Every document of a YAML stream is read, independently, with its own `documentIndex`. An alias cannot use
  an anchor from another document.

## The inline-prompt shapes over the tree

ST-58 (#120) re-expresses Standard 21's three inline-prompt shapes over the parsed tree, for `.yml`,
`.yaml` and `.json` files that parsed. Source code stays on the lexical layer, unchanged.

| Shape | What it is on the tree |
|---|---|
| `parameter` | a mapping key that is one of `system`, `system_prompt`, `systemPrompt`, `instructions`, `systemInstruction` (decoded, exact, case-sensitive) whose value is a scalar |
| `message-role` | a mapping with a `role` whose value is the scalar `system` (on any occurrence of the key) and a `content` key whose value is a scalar: the literal is the `content` |
| `system-instruction-parts` | a `text` key holding a scalar, anywhere inside the `parts` value of a mapping that is itself the value of `systemInstruction` or `system_instruction` and is written as an object (`{...}`; every JSON mapping is) |

A literal fires at 200 or more **Unicode code points of its decoded value**. Every occurrence of every
shape is measured, in every document, at any depth; the longest of each shape is the evidence string
(`file (N chars)`, `file (N chars, message role shape)`, `file (N chars, systemInstruction parts shape)`),
which keeps its existing form.

Decisions applied:

* **Decoded, not raw (E).** Keys and scalar values are decoded before they are compared or measured:
  `"system"` is `system`; escapes are resolved and lines are folded. Every scalar is a string, in
  every style, with or without an anchor or a tag. Beside the quoted forms the lexical layer saw, a plain
  multi-line scalar under an instruction key is therefore now a literal.
* **Aliases and merges are not followed (C).** A literal supplied through an alias, or a `role` or
  `content` supplied through a merge key, is a non-claim; the audit's `structuralSurface` lists the
  aliases and merge keys that were present and not followed. Everything literally authored is scanned,
  including an anchor's definition (once: an alias to it is not a second finding) and a mapping written
  inline as the value of a merge key.
* **Documents are independent (C).** A `role` in one document and a `content` in the next never combine.
* **Duplicate keys (E).** Every occurrence of a key is evaluated; the reader keeps all of them. A message
  is a system message if any of its `role` keys is `system`. A key one of these shapes reads that occurs
  more than once in one mapping is reported as duplicate evidence: `duplicate: true` on a location, and
  `structuralSurface.duplicateKeysEvaluated` (bounded at 50, exact total) on the audit.
* **Named non-claims (retained).** A block-style YAML `systemInstruction` mapping (only the flow form
  `{...}` and JSON are the object form Standard 21 claims) is not read for the parts shape. A YAML **block scalar** (`|`, `>` and their indicators) is not a literal
  for these shapes: Standard 21 names it as a non-claim and the regression ledger lists no case that
  changes it. The reader decodes it, so lifting the non-claim is a decision for ST-60, not a parser limit.
* **Named non-claim (E).** A `system` mapping nested inside a **complex key** (`? {system: "..."}`) is
  not scanned: the walk descends into values and sequence items, never into keys. (The value paired with
  a complex key is scanned.)
* **Locations (G).** `validate` adds `results[].locations`: for each literal that fired, `file`,
  `documentIndex` (YAML only), `line`, `column` (code points), `key`, `path` (mapping keys as strings,
  sequence indexes as integers; keys clipped at 128 characters and at most the last 64 steps, marked
  `pathTruncated`), `shape`, `length` (decoded code points) and `duplicate`. At most 50 are listed per
  result and `locationsOmitted` counts the rest. A lexically scanned file has evidence strings and no
  location, because the lexical layer has none. The validate report is `schemaVersion` `1.1` and the audit
  report `1.2`; both are additive over `1.0` / `1.1`, their closed schemas admit the new fields in the same
  change, and the old evidence strings are preserved during the additive compatibility period.

**Compatibility change from raw-source measurement (E).** Until ST-58 a YAML or JSON literal was measured
as raw source text. Three ledger cases that fired no longer do, because their decoded length is under 200
(`d09`, `d09b` and `d19`: escapes that decode 300, 240 and 250 raw characters to 50, 40 and 125). Seven that
were missed now fire: `b02` and `b03` (an anchor or a tag on the value), `d06`, `d07` and `d08` (an escaped
key or role), `d17` and `d18` (a folded or plain multi-line scalar).

## Failure outcomes

The reader itself has no fallback: a file it cannot read is returned as a **failure value**, and the reader
never scans its text some other way. What a consumer does with that value is the consumer's rule, and today
it differs by rule:

| Rule | Reads | A file the reader refused |
|---|---|---|
| `promptsec.no-inline-system-prompt`, `promptsec.prompt-is-versioned-artifact` (Standard 21's inline-prompt shapes) | the **tree** (`scripts/structural-shapes.mjs`) for every `.yml` / `.yaml` / `.json` file that parsed; the **lexical** layer (`scripts/source.mjs`) for every other file. A structural file is never read as text for these rules | **file-scoped unknown**: never a pass, never a finding of its own, and never scanned lexically instead; recorded as unknown alongside any violation found elsewhere, which stands |
| `misuse.safety-controls-not-disabled` (Standard 9) | the **lexical** layer (`scripts/source.mjs`) for every collected file, structural scope included | **still scanned lexically**: a disabled safety setting in a malformed `.yml` is found and reported as an evaluated failure (`test/structural-audit.test.mjs`, case H). Moving Standard 9 onto this layer is ST-49 (#111) alone |
| TOML files | the frozen lexical layer | unchanged; TOML is not structural scope |
| the manifest and the tool-permission file | the strict policy/manifest parser, `scripts/yaml.mjs` | their own, pre-existing outcomes (an unparseable manifest is reported by the manifest rules); this reader is not involved |

The reader returns the failure as a value:

`read-failure`, `truncated` (a file past the read bound is refused, not cut), `utf-16`, `invalid-utf-8`,
`control-character`, `lone-cr`, `syntax` (any parser error, any document), `empty-document` (JSON),
`undefined-alias`, `parser-exception`.

Findings from files that did parse are unaffected. The audit reports failures on
`evidenceSurface.unparseableFiles` (exact `total`, at most 50 listed, `omitted` counted) and never carries
file text. `validate` reports the two inline-prompt rules as `skipped` / `not-evaluated` where nothing else
decides them; it does not do so for `misuse.safety-controls-not-disabled`.

Duplicate anchor definitions are legal YAML and parse. Unresolved tags (`!Ref`) are warnings, not failures.

## What is vendored

`scripts/vendor/yaml` is `yaml@2.9.1` (ISC), the package's `browser/**` and `LICENSE`, unmodified.
`scripts/vendor/yaml.vendor.json` pins the release, the registry tarball's integrity, and the SHA-256 of
every vendored file; `test/vendor-yaml.test.mjs` fails on drift, a missing notice, an import that is not a
file in the tree, or anything outside the tree importing it other than the structural reader. `.gitattributes` keeps the tree LF so the
hashes do not depend on a checkout. The strict policy and manifest parser, `scripts/yaml.mjs`, is separate
and does not use it.

## Resources

No file-size cap or time limit is chosen here; that is a separate decision that needs repeated
measurements on the target CI. What is true today: the existing 512 KiB read bound applies (a larger file
is `truncated`), the parser is synchronous and cannot be interrupted, and the library enforces its own
nesting limit (reported as a `syntax` failure). A recovered pathological input is
`'a: &a 1\n' + '- *a\n'.repeat(200000)`; it is recorded as an input only.
