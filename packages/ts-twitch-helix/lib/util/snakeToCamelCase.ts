import { capitalize } from "./capitalize.js";

export function snakeToCamelCase(input: string): string {
  const [first, ...rest] = input.toLowerCase().split("_");

  return [first, ...rest.map(capitalize)].join("");
}
