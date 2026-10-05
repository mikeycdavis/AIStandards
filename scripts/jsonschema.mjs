// A hand-rolled JSON Schema (draft 2020-12) subset validator.
//
// WHY THIS EXISTS. Same reason as scripts/yaml.mjs: no third-party dependencies, and the documents
// being validated decide what a verdict means.
//
// THE LOAD-BEARING RULE. An unimplemented keyword THROWS rather than being ignored. A validator
// that silently skips a keyword it does not understand reports "valid" for a document it never
// checked, which is the false pass this whole repository exists to refuse. If a schema in this
// repository uses a keyword this file does not implement, the correct outcome is a loud failure
// telling someone to implement it.

export class SchemaError extends Error {
  constructor(message) {
    super(message);
    this.name = "SchemaError";
  }
}

// Keywords this validator implements. Anything else in a schema object raises SchemaError.
const IMPLEMENTED = new Set([
  "$schema", "$id", "$defs", "$ref", "$comment",
  "title", "description", "default", "examples",
  "type", "enum", "const",
  "properties", "required", "additionalProperties", "propertyNames", "patternProperties",
  "minProperties", "maxProperties",
  "items", "minItems", "maxItems", "uniqueItems",
  "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf",
  "minLength", "maxLength", "pattern", "format",
  "oneOf", "anyOf", "allOf", "not",
]);

// Annotation-only keywords carry no assertion, so they are skipped without checking anything.
const ANNOTATIONS = new Set(["$schema", "$id", "$comment", "title", "description", "default", "examples", "format"]);

const typeOf = (value) => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
};

const matchesType = (value, type) =>
  type === "integer" ? Number.isInteger(value)
    : type === "number" ? typeof value === "number"
      : typeOf(value) === type;

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeOf(a) !== typeOf(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((item, i) => deepEqual(item, b[i]));
  if (a && typeof a === "object") {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

function resolveRef(ref, root) {
  if (!ref.startsWith("#/")) {
    throw new SchemaError(`only local $ref pointers are supported, found ${JSON.stringify(ref)}`);
  }
  let node = root;
  for (const rawSegment of ref.slice(2).split("/")) {
    const segment = rawSegment.replace(/~1/g, "/").replace(/~0/g, "~");
    if (node == null || typeof node !== "object" || !(segment in node)) {
      throw new SchemaError(`$ref ${JSON.stringify(ref)} does not resolve`);
    }
    node = node[segment];
  }
  return node;
}

/**
 * Validate a value against a schema.
 * @returns {string[]} violation messages; empty means valid.
 */
export function validate(value, schema, root = schema, path = "$") {
  if (schema === true) return [];
  if (schema === false) return [`${path}: schema forbids any value here`];
  if (schema == null || typeof schema !== "object") {
    throw new SchemaError(`${path}: schema must be an object or boolean`);
  }

  for (const keyword of Object.keys(schema)) {
    if (!IMPLEMENTED.has(keyword)) {
      // Deliberately fatal. See the header.
      throw new SchemaError(
        `${path}: schema uses keyword ${JSON.stringify(keyword)}, which this validator does not ` +
        "implement. Implement it rather than ignoring it — a skipped keyword is an unchecked document.",
      );
    }
  }

  if ("$ref" in schema) {
    const target = resolveRef(schema.$ref, root);
    const rest = { ...schema };
    delete rest.$ref;
    const out = validate(value, target, root, path);
    return Object.keys(rest).some((k) => !ANNOTATIONS.has(k) && k !== "$defs")
      ? out.concat(validate(value, rest, root, path))
      : out;
  }

  const errors = [];
  const at = (key) => (path === "$" ? `$.${key}` : `${path}.${key}`);

  if ("type" in schema) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => matchesType(value, t))) {
      errors.push(`${path}: expected ${types.join(" or ")}, found ${typeOf(value)}`);
      return errors; // Later keywords assume the type held; reporting them would be noise.
    }
  }

  if ("const" in schema && !deepEqual(value, schema.const)) {
    errors.push(`${path}: must equal ${JSON.stringify(schema.const)}`);
  }
  if ("enum" in schema && !schema.enum.some((option) => deepEqual(value, option))) {
    errors.push(`${path}: ${JSON.stringify(value)} is not one of ${JSON.stringify(schema.enum)}`);
  }

  if (typeof value === "string") {
    if ("minLength" in schema && value.length < schema.minLength) {
      errors.push(`${path}: shorter than minLength ${schema.minLength}`);
    }
    if ("maxLength" in schema && value.length > schema.maxLength) {
      errors.push(`${path}: longer than maxLength ${schema.maxLength}`);
    }
    if ("pattern" in schema && !new RegExp(schema.pattern, "u").test(value)) {
      errors.push(`${path}: ${JSON.stringify(value)} must match ${schema.pattern}`);
    }
  }

  if (typeof value === "number") {
    if ("minimum" in schema && value < schema.minimum) errors.push(`${path}: below minimum ${schema.minimum}`);
    if ("maximum" in schema && value > schema.maximum) errors.push(`${path}: above maximum ${schema.maximum}`);
    if ("exclusiveMinimum" in schema && value <= schema.exclusiveMinimum) {
      errors.push(`${path}: not above exclusiveMinimum ${schema.exclusiveMinimum}`);
    }
    if ("exclusiveMaximum" in schema && value >= schema.exclusiveMaximum) {
      errors.push(`${path}: not below exclusiveMaximum ${schema.exclusiveMaximum}`);
    }
    if ("multipleOf" in schema && value % schema.multipleOf !== 0) {
      errors.push(`${path}: not a multiple of ${schema.multipleOf}`);
    }
  }

  if (Array.isArray(value)) {
    if ("minItems" in schema && value.length < schema.minItems) {
      errors.push(`${path}: fewer than minItems ${schema.minItems}`);
    }
    if ("maxItems" in schema && value.length > schema.maxItems) {
      errors.push(`${path}: more than maxItems ${schema.maxItems}`);
    }
    if (schema.uniqueItems === true) {
      for (let i = 0; i < value.length; i += 1) {
        for (let j = i + 1; j < value.length; j += 1) {
          if (deepEqual(value[i], value[j])) {
            errors.push(`${path}: items ${i} and ${j} are duplicates and uniqueItems is set`);
          }
        }
      }
    }
    if ("items" in schema) {
      value.forEach((item, i) => {
        errors.push(...validate(item, schema.items, root, `${path}[${i}]`));
      });
    }
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const keys = Object.keys(value);

    if ("minProperties" in schema && keys.length < schema.minProperties) {
      errors.push(`${path}: fewer than minProperties ${schema.minProperties}`);
    }
    if ("maxProperties" in schema && keys.length > schema.maxProperties) {
      errors.push(`${path}: more than maxProperties ${schema.maxProperties}`);
    }

    for (const required of schema.required ?? []) {
      if (!Object.prototype.hasOwnProperty.call(value, required)) {
        errors.push(`${path}: missing required property ${JSON.stringify(required)}`);
      }
    }

    if ("propertyNames" in schema) {
      for (const key of keys) {
        for (const message of validate(key, schema.propertyNames, root, `${at(key)} (property name)`)) {
          errors.push(message);
        }
      }
    }

    const declared = new Set(Object.keys(schema.properties ?? {}));
    for (const [key, sub] of Object.entries(schema.properties ?? {})) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(...validate(value[key], sub, root, at(key)));
      }
    }

    const patterns = Object.entries(schema.patternProperties ?? {});
    const matchedByPattern = new Set();
    for (const [pattern, sub] of patterns) {
      const re = new RegExp(pattern, "u");
      for (const key of keys) {
        if (re.test(key)) {
          matchedByPattern.add(key);
          errors.push(...validate(value[key], sub, root, at(key)));
        }
      }
    }

    if ("additionalProperties" in schema) {
      const extra = keys.filter((k) => !declared.has(k) && !matchedByPattern.has(k));
      if (schema.additionalProperties === false) {
        for (const key of extra) {
          errors.push(`${path}: property ${JSON.stringify(key)} is not permitted here`);
        }
      } else if (typeof schema.additionalProperties === "object") {
        for (const key of extra) {
          errors.push(...validate(value[key], schema.additionalProperties, root, at(key)));
        }
      }
    }
  }

  if ("allOf" in schema) {
    schema.allOf.forEach((sub) => errors.push(...validate(value, sub, root, path)));
  }
  if ("anyOf" in schema && !schema.anyOf.some((sub) => validate(value, sub, root, path).length === 0)) {
    errors.push(`${path}: matches none of the anyOf alternatives`);
  }
  if ("oneOf" in schema) {
    const matched = schema.oneOf.filter((sub) => validate(value, sub, root, path).length === 0).length;
    if (matched !== 1) {
      errors.push(`${path}: matches ${matched} of the oneOf alternatives, expected exactly 1`);
    }
  }
  if ("not" in schema && validate(value, schema.not, root, path).length === 0) {
    errors.push(`${path}: matches a schema it must not match`);
  }

  return errors;
}

/** Throw on the first violation. Used where a caller wants a hard failure rather than a list. */
export function assertValid(value, schema, label = "document") {
  const problems = validate(value, schema);
  if (problems.length > 0) {
    throw new SchemaError(`${label} is not valid:\n  - ${problems.join("\n  - ")}`);
  }
}
