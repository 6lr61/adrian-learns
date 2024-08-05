export function capitalize<S extends string>(word: S): Capitalize<S>;
export function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
