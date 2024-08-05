import { isRecord } from "./isRecord.js";

export function mapKeys<T extends Record<string, unknown>>(
  obj: T,
  fun: (s: string) => string
): T {
  const mappedEntries = Object.entries(obj).map(([key, value]) => {
    if (isRecord(value)) {
      return [fun(key), mapKeys(value, fun)];
    } else {
      return [fun(key), value];
    }
  });

  return Object.fromEntries(mappedEntries);
}
