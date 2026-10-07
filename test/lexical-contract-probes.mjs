// The probe table behind docs/lexical-contract.md (ST-48, #110). Not a test file: it is imported by
// lexical-contract.test.mjs, which runs every probe through the real detector and compares this table,
// entry by entry, with the enumerated list in the document.
//
// Each probe is one FORM of the frozen source-code lexical contract:
//   id      the stable id used in the document (LC claimed, LN named non-claim, LX boundary control,
//           LH held lexical pending the ST-49 owner decision)
//   cls     claimed | non-claim | boundary | held
//   expect  fires    both promptsec rules fail/warn and the evidence names the file
//           skipped  both promptsec rules report `skipped`
//           s9-fires misuse.safety-controls-not-disabled fails on the named fixture
//           s9-clear misuse.safety-controls-not-disabled does not fire on the named fixture
//   file/source   the source written to a temp target (or `fixture`, a committed fixture directory)
//   pin     [test file, substring of the label or title of the existing test that pins the same form]
//
// Adding, removing or reclassifying a form is a contract change. It needs a new owner decision (see
// "The stop-extension rule" in docs/lexical-contract.md), not a regex patch.

export const LONG = "You are a support triage assistant. ".repeat(8); // 288 characters
export const SHORT = "Be brief.";
const at = (n) => "x".repeat(n);
const call = (body) => `export const call = () => client.messages.create({\n${body}\n});\n`;

const RF = "test/review-findings.test.mjs";
const MR = "test/message-role-shapes.test.mjs";
const SD = "test/safety-detector.test.mjs";
const PR = "test/lexical-contract-probes.mjs";

// Standard 21 names five instruction parameters and a 200-character threshold.
export const PARAMETER_NAMES = ["system", "system_prompt", "systemPrompt", "instructions", "systemInstruction"];
export const THRESHOLD = 200;

export const PROBES = [
  // ---- Claimed: the parameter shape ----
  { id: "LC-01", cls: "claimed", expect: "fires", desc: "Parameter shape: a bare listed name, `:`, a quoted literal, as an object property in JS/TS", file: "src/a.js", source: call(`  k: ok ? 1 : 2, system: "${LONG}",`), pin: [MR, "a key after a ternary value in the same object"] },
  { id: "LC-02", cls: "claimed", expect: "fires", desc: "Parameter shape: a quoted property name (`\"system\": \"...\"`) in JS/TS", file: "src/a.js", source: call(`  "system": "${LONG}",`), pin: [RF, "a double-quoted JS key"] },
  { id: "LC-03", cls: "claimed", expect: "fires", desc: "Parameter shape: the name `instructions`", file: "src/a.js", source: call(`  "model": "m", "max_tokens": 5, "instructions" : "${LONG}"`), pin: [RF, "a quoted key after other properties"] },
  { id: "LC-04", cls: "claimed", expect: "fires", desc: "Parameter shape: the name `systemPrompt`, single-quoted value", file: "src/a.js", source: call(`  "systemPrompt": '${LONG}',`), pin: [RF, "a quoted key with a single-quoted value"] },
  { id: "LC-05", cls: "claimed", expect: "fires", desc: "Parameter shape: the name `system_prompt` as a Python attribute assignment", file: "src/a.py", source: `self.system_prompt = "${LONG}"\n`, pin: [RF, "a this-attribute assignment"] },
  { id: "LC-06", cls: "claimed", expect: "fires", desc: "Parameter shape: the name `systemInstruction` holding a plain string literal", file: "src/a.js", source: call(`  systemInstruction: "${LONG}",`), pin: [PR, "id: \"LC-06\""] },
  { id: "LC-07", cls: "claimed", expect: "fires", desc: "Parameter shape: an assignment (`=`) in JS/TS", file: "src/a.js", source: `const k = ok ? 1 : 2;\nconst system = "${LONG}";\n`, pin: [MR, "an assignment after a ternary statement"] },
  { id: "LC-08", cls: "claimed", expect: "fires", desc: "Parameter shape: a Python keyword argument", file: "src/a.py", source: `client.create(model="m", system="${LONG}")\n`, pin: [RF, "a Python keyword argument"] },
  { id: "LC-09", cls: "claimed", expect: "fires", desc: "Parameter shape: a Python dict with a quoted key", file: "src/a.py", source: `client.create(**{"system": "${LONG}"})\n`, pin: [RF, "a Python dict with a double-quoted key"] },
  { id: "LC-10", cls: "claimed", expect: "fires", desc: "Parameter shape: a shell flag spelled exactly `--system=`", file: "src/a.sh", source: `llm --system="${LONG}" "hi"\n`, pin: [RF, "a shell flag that is exactly --system"] },
  { id: "LC-11", cls: "claimed", expect: "fires", desc: "Threshold: a literal of exactly 200 characters is claimed", file: "src/a.js", source: call(`  system: "${at(200)}",`), pin: [RF, "at the threshold it is"] },

  // ---- Claimed: the message role shape ----
  { id: "LC-12", cls: "claimed", expect: "fires", desc: "Message role shape: `{ role: \"system\", content: \"...\" }` with bare keys, role first, in JS/TS", file: "src/a.js", source: call(`  messages: [{ role: "system", content: "${LONG}" }],`), pin: [MR, "role before content, bare keys"] },
  { id: "LC-13", cls: "claimed", expect: "fires", desc: "Message role shape: content before role", file: "src/a.js", source: call(`  messages: [{ content: "${LONG}", role: "system" }],`), pin: [MR, "content before role, bare keys"] },
  { id: "LC-14", cls: "claimed", expect: "fires", desc: "Message role shape: single-quoted keys and values", file: "src/a.js", source: call(`  messages: [{ 'role': 'system', 'content': '${LONG}' }],`), pin: [MR, "single-quoted keys and values"] },
  { id: "LC-15", cls: "claimed", expect: "fires", desc: "Message role shape: a TypeScript `as const` on the role", file: "src/a.ts", source: call(`  messages: [{ role: "system" as const, content: "${LONG}" }],`), pin: [MR, "a TypeScript const assertion on the role"] },
  { id: "LC-16", cls: "claimed", expect: "fires", desc: "Message role shape: the system message after a user message", file: "src/a.js", source: call(`  messages: [{ role: "user", content: "${SHORT}" }, { role: "system", content: "${LONG}" }],`), pin: [MR, "the system message after a short user message"] },
  { id: "LC-17", cls: "claimed", expect: "fires", desc: "Message role shape: a Python dict, double-quoted", file: "src/a.py", source: `client.chat.completions.create(messages=[{"role": "system", "content": "${LONG}"}])\n`, pin: [MR, "a Python dict, double-quoted"] },
  { id: "LC-18", cls: "claimed", expect: "fires", desc: "Message role shape: a Python dict, content first", file: "src/a.py", source: `messages = [{"content": "${LONG}", "role": "system"}]\n`, pin: [MR, "a Python dict, content first"] },

  // ---- Claimed: the Gemini systemInstruction parts shape ----
  { id: "LC-19", cls: "claimed", expect: "fires", desc: "systemInstruction parts shape: `systemInstruction: { parts: [{ text: \"...\" }] }` in JS/TS", file: "src/a.js", source: call(`  systemInstruction: { parts: [{ text: "${LONG}" }] },`), pin: [MR, "the second of two parts"] },
  { id: "LC-20", cls: "claimed", expect: "fires", desc: "systemInstruction parts shape: the snake-case `system_instruction` in a Python dict", file: "src/a.py", source: `model = Model(system_instruction={"parts": [{"text": "${LONG}"}]})\n`, pin: [MR, "a Python dict assigned with ="] },

  // ---- Named non-claims: the detector does not follow these, and reports skipped ----
  { id: "LN-01", cls: "non-claim", expect: "skipped", desc: "A role held in a variable (`role: SYSTEM`)", file: "src/a.js", source: call(`  messages: [{ role: SYSTEM, content: "${LONG}" }],`), pin: [MR, "a role held in a variable"] },
  { id: "LN-02", cls: "non-claim", expect: "skipped", desc: "A bare `system` word in JavaScript (a variable, not the role literal)", file: "src/a.js", source: call(`  messages: [{ role: system, content: "${LONG}" }],`), pin: [MR, "a bare system word in JavaScript"] },
  { id: "LN-03", cls: "non-claim", expect: "skipped", desc: "Template-literal content", file: "src/a.js", source: call("  messages: [{ role: \"system\", content: `" + LONG + "` }],"), pin: [MR, "a template-literal content"] },
  { id: "LN-04", cls: "non-claim", expect: "skipped", desc: "Content built by concatenation", file: "src/a.js", source: call(`  messages: [{ role: "system", content: PREFIX + "${LONG}" }],`), pin: [MR, "a content built by concatenation from a variable"] },
  { id: "LN-05", cls: "non-claim", expect: "skipped", desc: "Content that is an array of typed parts", file: "src/a.js", source: call(`  messages: [{ role: "system", content: [{ type: "text", text: "${LONG}" }] }],`), pin: [MR, "a content that is an array of typed parts"] },
  { id: "LN-06", cls: "non-claim", expect: "skipped", desc: "The `developer` role is not the system role", file: "src/a.js", source: call(`  messages: [{ role: "developer", content: "${LONG}" }],`), pin: [MR, "the developer role"] },
  { id: "LN-07", cls: "non-claim", expect: "skipped", desc: "A keyword-argument constructor (`ChatMessage(role=\"system\", ...)`)", file: "src/a.py", source: `SystemMessage = ChatMessage(role="system", content="${LONG}")\n`, pin: [MR, "keyword arguments in a constructor"] },
  { id: "LN-08", cls: "non-claim", expect: "skipped", desc: "A dict built by `dict(role=..., content=...)`", file: "src/a.py", source: `m = dict(role="system", content="${LONG}")\n`, pin: [MR, "a dict built by dict()"] },
  { id: "LN-09", cls: "non-claim", expect: "skipped", desc: "A Python `Part(text=...)` call inside a Content", file: "src/a.py", source: `config = Config(system_instruction=Content(parts=[Part(text="${LONG}")]))\n`, pin: [MR, "a Python Part call"] },
  { id: "LN-10", cls: "non-claim", expect: "skipped", desc: "A plain string `system_instruction=` in Python", file: "src/a.py", source: `config = Config(system_instruction="${LONG}")\n`, pin: [MR, "a plain string system_instruction"] },
  { id: "LN-11", cls: "non-claim", expect: "skipped", desc: "A `systemInstruction` whose `parts` is a variable", file: "src/a.js", source: call(`  systemInstruction: { parts: PARTS, note: { text: "${LONG}" } },`), pin: [MR, "a systemInstruction whose parts is a variable"] },
  { id: "LN-12", cls: "non-claim", expect: "skipped", desc: "A template-literal key", file: "src/a.js", source: call("  `system`: \"" + LONG + "\","), pin: [RF, "a template-literal key"] },
  { id: "LN-13", cls: "non-claim", expect: "skipped", desc: "A computed key", file: "src/a.js", source: call(`  [\`system\`]: "${LONG}",`), pin: [RF, "a computed key"] },
  { id: "LN-14", cls: "non-claim", expect: "skipped", desc: "A hyphenated quoted key that is not a listed name (`system-prompt`)", file: "src/a.js", source: call(`  "system-prompt": "${LONG}",`), pin: [RF, "a hyphenated quoted key that is not a listed name"] },
  { id: "LN-15", cls: "non-claim", expect: "skipped", desc: "A Python tuple pair", file: "src/a.py", source: `dict([("system", "${LONG}")])\n`, pin: [RF, "a Python tuple pair"] },
  { id: "LN-16", cls: "non-claim", expect: "skipped", desc: "A LangChain role tuple", file: "src/a.py", source: `ChatPromptTemplate.from_messages([("system", "${LONG}")])\n`, pin: [RF, "a LangChain role tuple"] },
  { id: "LN-17", cls: "non-claim", expect: "skipped", desc: "A prompt held in an unlisted variable and passed to a listed parameter (variables are not followed)", file: "src/a.js", source: `const PROMPT = "${LONG}";\nexport const call = () => client.create({ system: PROMPT });\n`, pin: [PR, "id: \"LN-17\""] },

  // ---- Boundary controls: the claimed forms stop here ----
  { id: "LX-01", cls: "boundary", expect: "skipped", desc: "A role used as a value (`const role = \"system\"`) beside an unrelated long string", file: "src/a.js", source: `export const role = "system";\nexport const note = "${LONG}";\n`, pin: [MR, "a role assigned to a variable, with an unrelated long string after it"] },
  { id: "LX-02", cls: "boundary", expect: "skipped", desc: "A role other than `system` (a user message)", file: "src/a.js", source: call(`  messages: [{ role: "user", content: "${LONG}" }],`), pin: [MR, "a user message"] },
  { id: "LX-03", cls: "boundary", expect: "skipped", desc: "An object with a `system` role and no `content` (RBAC shape)", file: "src/a.js", source: call(`  user: { role: "system", description: "${LONG}" },`), pin: [MR, "an object with a role and no content"] },
  { id: "LX-04", cls: "boundary", expect: "skipped", desc: "A parameter literal one character under the threshold (199)", file: "src/a.js", source: call(`  "system": "${at(199)}",`), pin: [RF, "a quoted key one character under the threshold"] },
  { id: "LX-05", cls: "boundary", expect: "skipped", desc: "A message role literal one character under the threshold (199)", file: "src/a.js", source: call(`  messages: [{ role: "system", content: "${at(199)}" }],`), pin: [MR, "content one character under the threshold"] },
  { id: "LX-06", cls: "boundary", expect: "skipped", desc: "A parameter inside a `//` comment", file: "src/a.js", source: call(`  // system: "${LONG}",\n  model: "m",`), pin: [RF, "a // line comment"] },
  { id: "LX-07", cls: "boundary", expect: "skipped", desc: "A parameter quoted inside a string literal", file: "src/a.js", source: `export const docs = 'system: "${at(250)}"';\n`, pin: [RF, "a string that quotes the parameter"] },
  { id: "LX-08", cls: "boundary", expect: "skipped", desc: "A parameter name as a ternary operand", file: "src/a.js", source: `const x = ok ? system : "${LONG}";\n`, pin: [MR, "a parameter name as a ternary operand"] },
  { id: "LX-09", cls: "boundary", expect: "skipped", desc: "A role value composed by concatenation (`\"system\" + \"-admin\"`)", file: "src/a.js", source: call(`  messages: [{ role: "system" + "-admin", content: "${LONG}" }],`), pin: [MR, "a role composed by concatenating a literal"] },
  { id: "LX-10", cls: "boundary", expect: "skipped", desc: "A key that only ends in a listed name (`x_system`)", file: "src/a.js", source: call(`  "x_system": "${LONG}",`), pin: [RF, "a key that only ends in the parameter name"] },
  { id: "LX-11", cls: "boundary", expect: "skipped", desc: "A hyphenated key ending in a listed name (`x-system`)", file: "src/a.js", source: call(`  "x-system": "${LONG}",`), pin: [RF, "a hyphenated key that ends in the parameter name"] },
  { id: "LX-12", cls: "boundary", expect: "skipped", desc: "A user turn's `parts` (not a systemInstruction)", file: "src/a.js", source: call(`  contents: [{ role: "user", parts: [{ text: "${LONG}" }] }],`), pin: [MR, "a user turn's parts"] },
  { id: "LX-13", cls: "boundary", expect: "skipped", desc: "A `systemInstruction` with no `parts`", file: "src/a.js", source: call(`  systemInstruction: { text: "${LONG}" },`), pin: [MR, "a systemInstruction with no parts"] },
  { id: "LX-14", cls: "boundary", expect: "skipped", desc: "Text beside `parts`, not inside it", file: "src/a.js", source: call(`  systemInstruction: { parts: [{ inline: 1 }], extra: { text: "${LONG}" } },`), pin: [MR, "text beside parts rather than inside it"] },
  { id: "LX-15", cls: "boundary", expect: "skipped", desc: "A `content` that belongs to the next object, not the role's object", file: "src/a.js", source: call(`  m: [{ role: "system", name: "x" }, { content: "${LONG}" }],`), pin: [MR, "a content that belongs to the next object"] },
  { id: "LX-16", cls: "boundary", expect: "skipped", desc: "A message quoted inside a comment", file: "src/a.js", source: `// { "role": "system", "content": "${LONG}" }\nexport const x = 1;\n`, pin: [MR, "a JS comment quoting the message"] },
  { id: "LX-17", cls: "boundary", expect: "skipped", desc: "A short parameter literal", file: "src/a.js", source: call(`  "system": "${SHORT}",`), pin: [RF, "a short quoted-key instruction"] },

  // ---- Held lexical pending the ST-49 (#111) owner decision: TOML and Standard 9 ----
  { id: "LH-01", cls: "held", expect: "fires", desc: "TOML: a quoted key `\"system\" = \"...\"` is read by the parameter shape (held lexical; moves only through ST-49)", file: "src/prompt.toml", source: `"system" = "${LONG}"\n`, pin: [RF, "a quoted key in TOML"] },
  { id: "LH-02", cls: "held", expect: "skipped", desc: "TOML: an array of tables with `role`/`content` is not claimed (held lexical; moves only through ST-49)", file: "src/a.toml", source: `[[messages]]\nrole = "system"\ncontent = "${LONG}"\n`, pin: [MR, "a TOML array of tables"] },
  { id: "LH-03", cls: "held", expect: "s9-fires", desc: "Standard 9: a quoted off value on the moderation key of a JavaScript object fails misuse.safety-controls-not-disabled", fixture: "safety-off-js-object", evidenceFile: "src/config.js", pin: [SD, "safety-off-js-object"] },
  { id: "LH-04", cls: "held", expect: "s9-clear", desc: "Standard 9: the same JavaScript object with the control on does not fire", fixture: "safety-on-js-object", pin: [SD, "safety-on-js-object"] },
  { id: "LH-05", cls: "held", expect: "s9-fires", desc: "Standard 9: a Python keyword argument set to `\"off\"` fails", fixture: "safety-off-python-kwarg", evidenceFile: "src/client.py", pin: [SD, "safety-off-python-kwarg"] },
  { id: "LH-06", cls: "held", expect: "s9-clear", desc: "Standard 9: a Python keyword argument with the control on does not fire", fixture: "safety-on-python-kwarg", pin: [SD, "safety-on-python-kwarg"] },
  { id: "LH-07", cls: "held", expect: "s9-fires", desc: "Standard 9: a TypeScript typed value of `\"off\"` fails", fixture: "safety-off-typed-ts", evidenceFile: "src/types.ts", pin: [SD, "safety-off-typed-ts"] },
  { id: "LH-08", cls: "held", expect: "s9-clear", desc: "Standard 9: a TypeScript union type naming `\"off\"` does not fire", fixture: "safety-union-type-ts", pin: [SD, "safety-union-type-ts"] },
  { id: "LH-09", cls: "held", expect: "s9-fires", desc: "Standard 9: a ternary that selects `\"off\"` fails", fixture: "safety-off-ternary-js", evidenceFile: "src/cfg.js", pin: [SD, "safety-off-ternary-js"] },
  { id: "LH-10", cls: "held", expect: "s9-clear", desc: "Standard 9: a ternary whose consequent is the key does not fire", fixture: "safety-ternary-js", pin: [SD, "safety-ternary-js"] },
  { id: "LH-11", cls: "held", expect: "s9-fires", desc: "Standard 9: an `off` literal followed by a fallback operand evaluates to off and fails", fixture: "safety-off-or-fallback-js", evidenceFile: "src/cfg.js", pin: [SD, "safety-off-or-fallback-js"] },
  { id: "LH-12", cls: "held", expect: "s9-fires", desc: "Standard 9: a YAML quoted off value on the moderation key, followed by other lines, fails (YAML-file form of Standard 9, held with it)", fixture: "safety-off-yaml-trailing", evidenceFile: "config.yml", pin: [SD, "safety-off-yaml-trailing"] },
  { id: "LH-13", cls: "held", expect: "s9-clear", desc: "Standard 9: the YAML file with the control on does not fire", fixture: "safety-on-yaml-trailing", pin: [SD, "safety-on-yaml-trailing"] },
];
