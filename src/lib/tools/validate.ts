import Ajv, { type ErrorObject, type ValidateFunction } from "ajv";

// `useDefaults` fills schema defaults (minRating, limit) into the validated
// input in place; `strict: false` tolerates UI-only keywords like `title`. (No `format` keywords are used in the tool schemas, so ajv-formats isn't needed.)
const ajv = new Ajv({ allErrors: true, useDefaults: true, strict: false });

const cache = new Map<string, ValidateFunction>();

function compile(cacheKey: string, schema: Record<string, unknown>): ValidateFunction {
  let fn = cache.get(cacheKey);
  if (!fn) {
    fn = ajv.compile(schema);
    cache.set(cacheKey, fn);
  }
  return fn;
}

export interface SchemaResult {
  ok: boolean;
  /** For input: a copy with defaults applied. */
  value: unknown;
  errors: string[];
}

function format(errors: ErrorObject[] | null | undefined): string[] {
  return (errors ?? []).map((e) => `${e.instancePath || "(root)"} ${e.message ?? "is invalid"}`.trim());
}

export function validateAgainst(cacheKey: string, schema: Record<string, unknown>, data: unknown): SchemaResult {
  // Validate a clone so defaults never mutate the caller's object.
  const value = structuredClone(data);
  const fn = compile(cacheKey, schema);
  const ok = fn(value) as boolean;
  return { ok, value, errors: ok ? [] : format(fn.errors) };
}
