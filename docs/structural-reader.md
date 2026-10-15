# The structural reader

`scripts/structural.mjs` reads YAML and JSON as parsed trees with exact source positions. It is a reader,
not a detector: it decides nothing about prompts or any rule. It exists so that detection over
configuration files can stop guessing structure from indentation (the lexical layer, `scripts/source.mjs`,
which stays the right tool for source code).

Implemented by ST-57 (#119). Consumers that re-express the inline-prompt shapes over this tree are ST-58
(#120); migrating YAML detector fixtures and retiring YAML-specific lexical branches is ST-59 (#121);
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

Every node has `range`; YAML nodes may carry `anchor` and `tag` with the offset where they were written.

* Every scalar is a string. A plain `true`, `12` or `null` is that text; there is no implicit type coercion.
* Block, quoted and multi-line plain scalars are decoded to their semantic value (escapes resolved, lines
  folded, chomping applied). `length` measures the decoded value; `range` keeps the source extent.
* Aliases are **not dereferenced** and merge keys (`<<`) are **not applied**. They are recorded
  (`aliases`, `merges`) and reported on the audit as present and not followed.
* Every document of a YAML stream is read, independently, with its own `documentIndex`. An alias cannot use
  an anchor from another document.

## Failure outcomes

A file the reader cannot read is **file-scoped unknown**: never a pass, never a finding, and never scanned
lexically instead. The reader returns the failure as a value:

`read-failure`, `truncated` (a file past the read bound is refused, not cut), `utf-16`, `invalid-utf-8`,
`control-character`, `lone-cr`, `syntax` (any parser error, any document), `empty-document` (JSON),
`undefined-alias`, `parser-exception`.

Findings from files that did parse are unaffected. The audit reports failures on
`evidenceSurface.unparseableFiles` (exact `total`, at most 50 listed, `omitted` counted) and never carries
file text. `validate` reports the affected rules as `skipped` / `not-evaluated`.

Duplicate anchor definitions are legal YAML and parse. Unresolved tags (`!Ref`) are warnings, not failures.

## What is vendored

`scripts/vendor/yaml` is `yaml@2.9.1` (ISC), the package's `browser/**` and `LICENSE`, unmodified.
`scripts/vendor/yaml.vendor.json` pins the release, the registry tarball's integrity, and the SHA-256 of
every vendored file; `test/vendor-yaml.test.mjs` fails on drift, a missing notice, an import that is not a
file in the tree, or anything outside the tree importing it. `.gitattributes` keeps the tree LF so the
hashes do not depend on a checkout. The strict policy and manifest parser, `scripts/yaml.mjs`, is separate
and does not use it.

## Resources

No file-size cap or time limit is chosen here; that is a separate decision that needs repeated
measurements on the target CI. What is true today: the existing 512 KiB read bound applies (a larger file
is `truncated`), the parser is synchronous and cannot be interrupted, and the library enforces its own
nesting limit (reported as a `syntax` failure). A recovered pathological input is
`'a: &a 1\n' + '- *a\n'.repeat(200000)`; it is recorded as an input only.
