import type { NextConfig } from "next";
const config: NextConfig = { transpilePackages: ["@kade/db", "@kade/editor-core", "@kade/shared"], output: "standalone", serverExternalPackages: ["pg"] };
export default config;
