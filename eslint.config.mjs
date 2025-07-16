import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.browser,
    },
    rules: {
      quotes: ["error", "single"],
      semi: ["error", "always"],
      "no-var": "error",
      "no-console": "off",
      "comma-dangle": ["error", "never"],
      indent: [
        "warn",
        4,
        {
          SwitchCase: 1,
        },
      ],
      "no-unused-vars": [
        "warn",
        {
          args: "none",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      camelcase: "off",
      "id-match": [
        "error",
        "^(?:[A-Z][a-zA-Z0-9]*([A-Z][a-zA-Z0-9]*)*|[a-z][a-zA-Z0-9]*([A-Z][a-zA-Z0-9]*)*|[_a-z]+(?:_[a-z]+)*)$", // Enforce camelCase/PascalCase/snake_case
        {
          properties: true,
          classFields: true,
          onlyDeclarations: false,
          ignoreDestructuring: false,
        },
      ],
      "dot-notation": [
        "error",
        {
          allowPattern: "^[a-z]+(_[a-z]+)*$",
        },
      ],
      "class-methods-use-this": "warn",
      "new-cap": [
        "error",
        {
          newIsCap: false,
          capIsNew: false,
        },
      ],
      "brace-style": [
        "error",
        "1tbs", // Enforce "one true brace style" (same line opening brace)
        {
          allowSingleLine: true // Allow single-line statements
        },
      ],
      "space-before-blocks": ["error", "always"], // Require space before `{`
      "space-before-function-paren": [
        "error",
        {
          anonymous: "always", // For anonymous functions (like arrow functions or function expressions)
          named: "never", // No space for named functions
          asyncArrow: "always", // Space for async arrow functions
        },
      ],
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "always", prev: "if", next: "*" },
        { blankLine: "always", prev: "switch", next: "*" },
        { blankLine: "always", prev: "for", next: "*" },
        { blankLine: "always", prev: "while", next: "*" },
        { blankLine: "always", prev: "do", next: "*" },
        { blankLine: "always", prev: "try", next: "*" },
        { blankLine: "always", prev: "class", next: "*" },
        { blankLine: "always", prev: "block", next: "*" },
        { blankLine: "always", prev: "*", next: "if" },
        { blankLine: "always", prev: "*", next: "switch" },
        { blankLine: "always", prev: "*", next: "for" },
        { blankLine: "always", prev: "*", next: "while" },
        { blankLine: "always", prev: "*", next: "do" },
        { blankLine: "always", prev: "*", next: "try" },
        { blankLine: "always", prev: "*", next: "class" },
      ],
      "eol-last": ["error", "always"],
      "comma-spacing": ["error", { before: false, after: true }],
      "template-curly-spacing": ["error"],
      "space-in-parens": ["error", "never"],
      "semi-spacing": "error",
      "rest-spread-spacing": ["error", "never"],
      "padded-blocks": ["error", "never"],
      "object-property-newline": [
        "error",
        { allowAllPropertiesOnSameLine: true },
      ],
      "no-trailing-spaces": [
        "error",
        { ignoreComments: true, skipBlankLines: true },
      ],
      "no-self-compare": "error",
      "no-regex-spaces": "error",
      "no-multi-spaces": [
        "error",
        { exceptions: { VariableDeclarator: true, ImportDeclaration: true } },
      ],
      "no-extra-boolean-cast": "error",
      "no-duplicate-imports": "error",
      "key-spacing": "error",
      "func-call-spacing": ["error", "never"],
      "dot-location": ["error", "property"],
      "comma-style": ["error", "last"],
      "operator-linebreak": ["error", "none"],
      "block-spacing": "error",
      curly: "error",
      "keyword-spacing": ["error", { before: true }],
      "space-infix-ops": "error",
      "no-multiple-empty-lines": ["error", { max: 1 }],
      "no-useless-escape": "off",
    },
  },
]);
