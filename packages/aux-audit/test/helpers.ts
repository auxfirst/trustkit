import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** .build-test/test/helpers.js -> package root */
const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const fixture = (name: string): string => join(packageRoot, "fixtures", name);
export const repoSchema = (name: string): string => join(packageRoot, "schemas", name);
export const cliPath = (): string => join(packageRoot, "dist", "cli.js");
