import next from "eslint-config-next";

/**
 * Flat ESLint config. `eslint-config-next` (v16) ships a native flat
 * config array (core-web-vitals + typescript), so we spread it directly.
 */
const eslintConfig = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**"],
  },
];

export default eslintConfig;
