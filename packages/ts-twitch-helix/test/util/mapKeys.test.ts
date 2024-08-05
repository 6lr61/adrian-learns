import { expect, test } from "vitest";
import { mapKeys } from "../../lib/util/mapKeys.js";
import { snakeToCamelCase } from "../../lib/util/snakeToCamelCase.js";

test("Convert keys to camel case", () => {
  const input = { snake_case: 1234, another_snake_case: "hello, world!" };
  const expected = { snakeCase: 1234, anotherSnakeCase: "hello, world!" };

  expect(mapKeys(input, snakeToCamelCase)).toEqual(expected);
});

test("Convert keys in nested object", () => {
  const fun = () => {};
  const input = {
    small_snake: {
      smaller_snake: { smol_snek: { smallest_snake: "is smol" } },
    },
    snake_case: { sub_snake: 1234, smol: "snek" },
    other_case: ["SCREAMING_SNAKE_CASE", "PascalCase", "kebab-case"],
    fun,
    bad: null,
  };
  const expected = {
    smallSnake: {
      smallerSnake: { smolSnek: { smallestSnake: "is smol" } },
    },
    snakeCase: { subSnake: 1234, smol: "snek" },
    otherCase: ["SCREAMING_SNAKE_CASE", "PascalCase", "kebab-case"],
    fun,
    bad: null,
  };

  expect(mapKeys(input, snakeToCamelCase)).toEqual(expected);
});
