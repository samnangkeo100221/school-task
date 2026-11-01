import { defineConfig } from "eslint/config";
import next from "eslint-config-next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
    ...next.map(config => {
        if (config.rules) {
            return {
                ...config,
                rules: {
                    ...config.rules,
                    "react-hooks/set-state-in-effect": "off",
                },
            };
        }
        return config;
    }),
]);
