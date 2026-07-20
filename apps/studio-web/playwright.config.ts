import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e", timeout: 180_000, fullyParallel: false, workers: 1, retries: 0,
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure", screenshot: "only-on-failure" },
  outputDir: "../../output/playwright/test-results",
  reporter: [["list"], ["html", { outputFolder: "../../output/playwright/report", open: "never" }]],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
