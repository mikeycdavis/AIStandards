# The source-code lexical contract

**Status: frozen (ST-48, #110; owner decision H of 2026-10-07).** This document enumerates, without an
open-ended tail, what the lexical (regular-expression) layer claims and does not claim for **source code**.
It is the list that `test/lexical-contract.test.mjs` pins. It does not change detector behaviour, and it
does not replace the detector paragraph of Standard 21 (`standards/21-prompt-and-instruction-security.md`,
"The detector for R1 and R2"), which remains the normative prose.

## Scope

- **In the frozen list:** forms in source-code files (JS/TS, Python, shell) for the inline-prompt rules R1
  and R2 of Standard 21 (`promptsec.prompt-is-versioned-artifact`, `promptsec.no-inline-system-prompt`):
  the *parameter shape*, the *message role shape* and the *systemInstruction parts shape*, each with the
  named non-claims and boundary controls that bound it.
- **Held lexical pending ST-49 (#111):** TOML forms and the forms of Standard 9
  (`misuse.safety-controls-not-disabled`). They stay on the lexical layer and move only through the
  separate ST-49 owner decision. They are listed so that the decision has an exact inventory to act on.
- **Not in the frozen list:** YAML and JSON forms (parameter keys, message lists, flow mappings, explicit
  keys, block scalars, key boundaries). Those are the structural parser's to own (FE-30, #109) and are
  deliberately not frozen here. #104 was the last bounded YAML/JSON regex repair.

Instruction parameter names: `system`, `system_prompt`, `systemPrompt`, `instructions`, `systemInstruction`.
Threshold: 200 characters.

Frozen forms: 67 (20 claimed, 17 non-claims, 17 boundary controls, 13 held pending ST-49).

## The stop-extension rule

The source-code lexical contract is **frozen**. New forms are **not added by regex patches**: no new
parameter name, key spelling, role spelling, quoting style, language or nesting shape may be taught to the
lexical detector by widening a pattern, and no form in the list below may change its classification, without
a **new owner decision** recorded on the backlog. An extension is one decision that names the form, the
reason and the test, and updates this list and its pinning test in the same change.

**Why.** Between #93 and #104 the lexical layer was repaired once per review round: each repair widened a
pattern, and each widening drew a further finding. 13 Codex review comments across #93 to #104 asked
for one more spelling, and each answer was a new regex clause with a new case beside it. That path has no
end, because source text is not a regular language; the owner chose to stop it. YAML and JSON move to a
structural parser (FE-30). Source code stays lexical and is bounded here. A fix that makes the detector
claim *more* (a new firing form) or *less* (a new skip) is an extension, whatever its size.

**What is still allowed without a new decision:** a defect where a form in this list does not behave as
this list records (the test will show it), a repair that restores the recorded classification, and
documentation. Nothing else.

**What the test enforces.** Every row below is run through the real detector and must produce the recorded
result; the rows must equal the probe table in `test/lexical-contract-probes.mjs` (id, class, result and
pin, in order); the listed parameter names and the threshold must equal the detector's; each cited pinning
test must still exist. The test cannot see a form that nobody listed: a detector change that claims a new
shape and adds neither a row nor a probe is stopped by review, which is what this rule asks reviewers to do.

## The enumerated list

Result: `fires` means both promptsec rules fail or warn and the evidence names the file; `skipped` means both
report `skipped`, never `passed`; `s9-fires` and `s9-clear` mean `misuse.safety-controls-not-disabled`
fails or does not fire on the named fixture.

### Claimed forms

Each fires on a quoted literal of at least the threshold. The parameter shape matches a listed name, then `:` or `=`, then the literal. The message role shape matches an object whose `role` is the quoted word `system` and whose `content` is the literal, in either key order. The systemInstruction parts shape matches the Gemini object form with a `text` literal inside `parts`.

| Id | Class | Result | Form | Pinned by |
| --- | --- | --- | --- | --- |
| LC-01 | claimed | fires | Parameter shape: a bare listed name, `:`, a quoted literal, as an object property in JS/TS | `test/message-role-shapes.test.mjs :: a key after a ternary value in the same object` |
| LC-02 | claimed | fires | Parameter shape: a quoted property name (`"system": "..."`) in JS/TS | `test/review-findings.test.mjs :: a double-quoted JS key` |
| LC-03 | claimed | fires | Parameter shape: the name `instructions` | `test/review-findings.test.mjs :: a quoted key after other properties` |
| LC-04 | claimed | fires | Parameter shape: the name `systemPrompt`, single-quoted value | `test/review-findings.test.mjs :: a quoted key with a single-quoted value` |
| LC-05 | claimed | fires | Parameter shape: the name `system_prompt` as a Python attribute assignment | `test/review-findings.test.mjs :: a this-attribute assignment` |
| LC-06 | claimed | fires | Parameter shape: the name `systemInstruction` holding a plain string literal | `test/lexical-contract-probes.mjs :: id: "LC-06"` |
| LC-07 | claimed | fires | Parameter shape: an assignment (`=`) in JS/TS | `test/message-role-shapes.test.mjs :: an assignment after a ternary statement` |
| LC-08 | claimed | fires | Parameter shape: a Python keyword argument | `test/review-findings.test.mjs :: a Python keyword argument` |
| LC-09 | claimed | fires | Parameter shape: a Python dict with a quoted key | `test/review-findings.test.mjs :: a Python dict with a double-quoted key` |
| LC-10 | claimed | fires | Parameter shape: a shell flag spelled exactly `--system=` | `test/review-findings.test.mjs :: a shell flag that is exactly --system` |
| LC-11 | claimed | fires | Threshold: a literal of exactly 200 characters is claimed | `test/review-findings.test.mjs :: at the threshold it is` |
| LC-12 | claimed | fires | Message role shape: `{ role: "system", content: "..." }` with bare keys, role first, in JS/TS | `test/message-role-shapes.test.mjs :: role before content, bare keys` |
| LC-13 | claimed | fires | Message role shape: content before role | `test/message-role-shapes.test.mjs :: content before role, bare keys` |
| LC-14 | claimed | fires | Message role shape: single-quoted keys and values | `test/message-role-shapes.test.mjs :: single-quoted keys and values` |
| LC-15 | claimed | fires | Message role shape: a TypeScript `as const` on the role | `test/message-role-shapes.test.mjs :: a TypeScript const assertion on the role` |
| LC-16 | claimed | fires | Message role shape: the system message after a user message | `test/message-role-shapes.test.mjs :: the system message after a short user message` |
| LC-17 | claimed | fires | Message role shape: a Python dict, double-quoted | `test/message-role-shapes.test.mjs :: a Python dict, double-quoted` |
| LC-18 | claimed | fires | Message role shape: a Python dict, content first | `test/message-role-shapes.test.mjs :: a Python dict, content first` |
| LC-19 | claimed | fires | systemInstruction parts shape: `systemInstruction: { parts: [{ text: "..." }] }` in JS/TS | `test/message-role-shapes.test.mjs :: the second of two parts` |
| LC-20 | claimed | fires | systemInstruction parts shape: the snake-case `system_instruction` in a Python dict | `test/message-role-shapes.test.mjs :: a Python dict assigned with =` |

### Named non-claims

Standard 21 states that the detector does not follow these. Each reports `skipped`.

| Id | Class | Result | Form | Pinned by |
| --- | --- | --- | --- | --- |
| LN-01 | non-claim | skipped | A role held in a variable (`role: SYSTEM`) | `test/message-role-shapes.test.mjs :: a role held in a variable` |
| LN-02 | non-claim | skipped | A bare `system` word in JavaScript (a variable, not the role literal) | `test/message-role-shapes.test.mjs :: a bare system word in JavaScript` |
| LN-03 | non-claim | skipped | Template-literal content | `test/message-role-shapes.test.mjs :: a template-literal content` |
| LN-04 | non-claim | skipped | Content built by concatenation | `test/message-role-shapes.test.mjs :: a content built by concatenation from a variable` |
| LN-05 | non-claim | skipped | Content that is an array of typed parts | `test/message-role-shapes.test.mjs :: a content that is an array of typed parts` |
| LN-06 | non-claim | skipped | The `developer` role is not the system role | `test/message-role-shapes.test.mjs :: the developer role` |
| LN-07 | non-claim | skipped | A keyword-argument constructor (`ChatMessage(role="system", ...)`) | `test/message-role-shapes.test.mjs :: keyword arguments in a constructor` |
| LN-08 | non-claim | skipped | A dict built by `dict(role=..., content=...)` | `test/message-role-shapes.test.mjs :: a dict built by dict()` |
| LN-09 | non-claim | skipped | A Python `Part(text=...)` call inside a Content | `test/message-role-shapes.test.mjs :: a Python Part call` |
| LN-10 | non-claim | skipped | A plain string `system_instruction=` in Python | `test/message-role-shapes.test.mjs :: a plain string system_instruction` |
| LN-11 | non-claim | skipped | A `systemInstruction` whose `parts` is a variable | `test/message-role-shapes.test.mjs :: a systemInstruction whose parts is a variable` |
| LN-12 | non-claim | skipped | A template-literal key | `test/review-findings.test.mjs :: a template-literal key` |
| LN-13 | non-claim | skipped | A computed key | `test/review-findings.test.mjs :: a computed key` |
| LN-14 | non-claim | skipped | A hyphenated quoted key that is not a listed name (`system-prompt`) | `test/review-findings.test.mjs :: a hyphenated quoted key that is not a listed name` |
| LN-15 | non-claim | skipped | A Python tuple pair | `test/review-findings.test.mjs :: a Python tuple pair` |
| LN-16 | non-claim | skipped | A LangChain role tuple | `test/review-findings.test.mjs :: a LangChain role tuple` |
| LN-17 | non-claim | skipped | A prompt held in an unlisted variable and passed to a listed parameter (variables are not followed) | `test/lexical-contract-probes.mjs :: id: "LN-17"` |

### Boundary controls

Each is the twin of a claimed form that must not fire. They bound the claim from the other side.

| Id | Class | Result | Form | Pinned by |
| --- | --- | --- | --- | --- |
| LX-01 | boundary | skipped | A role used as a value (`const role = "system"`) beside an unrelated long string | `test/message-role-shapes.test.mjs :: a role assigned to a variable, with an unrelated long string after it` |
| LX-02 | boundary | skipped | A role other than `system` (a user message) | `test/message-role-shapes.test.mjs :: a user message` |
| LX-03 | boundary | skipped | An object with a `system` role and no `content` (RBAC shape) | `test/message-role-shapes.test.mjs :: an object with a role and no content` |
| LX-04 | boundary | skipped | A parameter literal one character under the threshold (199) | `test/review-findings.test.mjs :: a quoted key one character under the threshold` |
| LX-05 | boundary | skipped | A message role literal one character under the threshold (199) | `test/message-role-shapes.test.mjs :: content one character under the threshold` |
| LX-06 | boundary | skipped | A parameter inside a `//` comment | `test/review-findings.test.mjs :: a // line comment` |
| LX-07 | boundary | skipped | A parameter quoted inside a string literal | `test/review-findings.test.mjs :: a string that quotes the parameter` |
| LX-08 | boundary | skipped | A parameter name as a ternary operand | `test/message-role-shapes.test.mjs :: a parameter name as a ternary operand` |
| LX-09 | boundary | skipped | A role value composed by concatenation (`"system" + "-admin"`) | `test/message-role-shapes.test.mjs :: a role composed by concatenating a literal` |
| LX-10 | boundary | skipped | A key that only ends in a listed name (`x_system`) | `test/review-findings.test.mjs :: a key that only ends in the parameter name` |
| LX-11 | boundary | skipped | A hyphenated key ending in a listed name (`x-system`) | `test/review-findings.test.mjs :: a hyphenated key that ends in the parameter name` |
| LX-12 | boundary | skipped | A user turn's `parts` (not a systemInstruction) | `test/message-role-shapes.test.mjs :: a user turn's parts` |
| LX-13 | boundary | skipped | A `systemInstruction` with no `parts` | `test/message-role-shapes.test.mjs :: a systemInstruction with no parts` |
| LX-14 | boundary | skipped | Text beside `parts`, not inside it | `test/message-role-shapes.test.mjs :: text beside parts rather than inside it` |
| LX-15 | boundary | skipped | A `content` that belongs to the next object, not the role's object | `test/message-role-shapes.test.mjs :: a content that belongs to the next object` |
| LX-16 | boundary | skipped | A message quoted inside a comment | `test/message-role-shapes.test.mjs :: a JS comment quoting the message` |
| LX-17 | boundary | skipped | A short parameter literal | `test/review-findings.test.mjs :: a short quoted-key instruction` |

### Held lexical pending ST-49 (#111)

TOML and Standard 9. Not moved, not extended; the ST-49 decision is the only way they change layer.

| Id | Class | Result | Form | Pinned by |
| --- | --- | --- | --- | --- |
| LH-01 | held | fires | TOML: a quoted key `"system" = "..."` is read by the parameter shape (held lexical; moves only through ST-49) | `test/review-findings.test.mjs :: a quoted key in TOML` |
| LH-02 | held | skipped | TOML: an array of tables with `role`/`content` is not claimed (held lexical; moves only through ST-49) | `test/message-role-shapes.test.mjs :: a TOML array of tables` |
| LH-03 | held | s9-fires | Standard 9: a quoted off value on the moderation key of a JavaScript object fails misuse.safety-controls-not-disabled | `test/safety-detector.test.mjs :: safety-off-js-object` |
| LH-04 | held | s9-clear | Standard 9: the same JavaScript object with the control on does not fire | `test/safety-detector.test.mjs :: safety-on-js-object` |
| LH-05 | held | s9-fires | Standard 9: a Python keyword argument set to `"off"` fails | `test/safety-detector.test.mjs :: safety-off-python-kwarg` |
| LH-06 | held | s9-clear | Standard 9: a Python keyword argument with the control on does not fire | `test/safety-detector.test.mjs :: safety-on-python-kwarg` |
| LH-07 | held | s9-fires | Standard 9: a TypeScript typed value of `"off"` fails | `test/safety-detector.test.mjs :: safety-off-typed-ts` |
| LH-08 | held | s9-clear | Standard 9: a TypeScript union type naming `"off"` does not fire | `test/safety-detector.test.mjs :: safety-union-type-ts` |
| LH-09 | held | s9-fires | Standard 9: a ternary that selects `"off"` fails | `test/safety-detector.test.mjs :: safety-off-ternary-js` |
| LH-10 | held | s9-clear | Standard 9: a ternary whose consequent is the key does not fire | `test/safety-detector.test.mjs :: safety-ternary-js` |
| LH-11 | held | s9-fires | Standard 9: an `off` literal followed by a fallback operand evaluates to off and fails | `test/safety-detector.test.mjs :: safety-off-or-fallback-js` |
| LH-12 | held | s9-fires | Standard 9: a YAML quoted off value on the moderation key, followed by other lines, fails (YAML-file form of Standard 9, held with it) | `test/safety-detector.test.mjs :: safety-off-yaml-trailing` |
| LH-13 | held | s9-clear | Standard 9: the YAML file with the control on does not fire | `test/safety-detector.test.mjs :: safety-on-yaml-trailing` |

## Relationship to other documents

- Standard 21, "The detector for R1 and R2", is the normative statement of the three shapes and the
  claim boundary. This list is its enumerated, test-pinned form. ST-60 (#122) edits that paragraph; this
  document is separate so the two changes do not collide.
- `scripts/standards.mjs` carries the implementation and its comments. This document does not duplicate
  them.
