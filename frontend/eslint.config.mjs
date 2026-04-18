import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Standard data-fetching pattern: useEffect(() => { fetchData(); }, [fetchData])
      // is the recommended React pattern for loading data on mount/dependency change.
      // This rule is overly strict for async fetch callbacks wrapped in useCallback.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
