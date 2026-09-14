# Fixture specification for test/standards-sections.test.mjs

This is not the real specification. `parseSpec` in `scripts/spec.mjs` reads only catalog rows under a
`### Band` heading and validates only the rows it reads, so a three-row catalog is enough and the
real fifty-three-item file does not need to be copied. Item 3 is deliberately unwritten.

### Band A — Fixture

| # | Title | Class | Derived from | Posture | Implemented by |
| --- | --- | --- | --- | --- | --- |
| 1 | First Example Standard | A | — | O | standards/01-first-example.md |
| 2 | Second Example, With Punctuation | A | — | O | standards/02-second-example.md |
| 3 | Unwritten Example | A | — | O | — |
