import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/",
      "node_modules/",
      "playwright-report/",
      "test-results/",
      "dist/"
    ]
  },
  ...nextVitals,
  ...nextTypescript
];

export default eslintConfig;

