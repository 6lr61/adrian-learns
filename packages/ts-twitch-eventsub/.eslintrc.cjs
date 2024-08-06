/* eslint-env node */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict",
    "plugin:@typescript-eslint/stylistic",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: { project: "./tsconfig.json" },
  plugins: ["@typescript-eslint"],
  root: true,
  rules: {
    "@typescript-eslint/no-floating-promises": "error",
  },
  ignorePatterns: [".eslintrc.cjs"],
};
