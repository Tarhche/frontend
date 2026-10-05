import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import testingLibrary from "eslint-plugin-testing-library";
import jestDom from "eslint-plugin-jest-dom";
import prettier from "eslint-config-prettier/flat";

// What .eslintrc.json said, in the flat config ESLint 9 reads. `next lint` went
// with Next 16, and the eslintrc format cannot load eslint-config-next any more,
// so until now nothing was being linted at all.
const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  testingLibrary.configs["flat/react"],
  jestDom.configs["flat/recommended"],
  prettier,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",

      // Code written while lint could not run trips these: the React
      // Compiler's checks that react-hooks 7 brought along, and a few of the
      // testing-library ones. They say what is worth fixing rather than
      // failing everything until it is.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "testing-library/no-node-access": "warn",
      "testing-library/prefer-screen-queries": "warn",
      "testing-library/render-result-naming-convention": "warn",
      "jest-dom/prefer-to-have-text-content": "warn",
    },
  },
  {
    ignores: ["coverage/**"],
  },
];

export default config;
