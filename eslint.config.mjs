import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
    tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        rules: {
            "react/react-in-jsx-scope": "off", // Next.js handles this automatically
        },
        settings: {
            react: { version: "detect" }, // Detect installed React version
        },
    },
    {
        ignores: [
            ".next/**",
            "out/**",
            "build/**",
            "node_modules/**",
            "next-env.d.ts",
        ],
    },
]);
