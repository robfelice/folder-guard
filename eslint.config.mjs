import js from "@eslint/js";
import tseslint from "typescript-eslint";
import obsidianPlugin from "eslint-plugin-obsidianmd";
import tsParser from "@typescript-eslint/parser";

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parser: tsParser,
        },
        plugins: {
            obsidianmd: obsidianPlugin,
        },
        rules: {
            // Correct rule name per documentation
            "obsidianmd/ui/sentence-case": "error",
        },
    },
];
