import { mapKeys } from "./mapKeys.js";

function camelToSnakeCase(identifier: string): string {
  return identifier.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
}

export function unCamelCase<T extends Record<string, unknown>>(record: T): T {
  return mapKeys(record, camelToSnakeCase);
}
