import { expect, test } from "vitest";
import { snakeToCamelCase } from "../../lib/util/snakeToCamelCase.js";

test("Convert a string to camel case", () => {
  expect(snakeToCamelCase("this_variable_name")).toBe("thisVariableName");
});

test("Handle empty string", () => {
  expect(snakeToCamelCase("")).toBe("");
});
