import next from "eslint-config-next";

/**
 * Flat ESLint config. `eslint-config-next` (v16) ships a native flat
 * config array (core-web-vitals + typescript), so we spread it directly.
 */
const eslintConfig = [
  ...next,
  {
    // .claude/ holds third-party skills installed by BONDS: not our code.
    ignores: [".next/**", "node_modules/**", "cli/dist/**", ".claude/**"],
  },
];

export default eslintConfig;
