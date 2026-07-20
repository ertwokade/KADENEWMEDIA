import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { execa } from "execa";

test("upload, edit, undo/redo and vertical export", async ({ page, request }) => {
  await page.goto("/"); await expect(page.getByRole("heading", { name: /Prompt ile kurgula/ })).toBeVisible();
  await page.getByRole("link", { name: /YENİ PROJE/ }).click(); await page.getByLabel("PROJE ADI").fill("E2E İstanbul");
  await page.getByLabel("Medya dosyası").setInputFiles(resolve("../../fixtures/generated/kade-studio-demo.mp4")); await page.getByRole("button", { name: /PROJEYİ OLUŞTUR/ }).click();
  await expect(page).toHaveURL(/\/editor\//); await expect(page.getByText("Kurgu Ajanı")).toBeVisible({ timeout: 180_000 });
  const beforeText = await page.locator(".timeline-head span").textContent();
  await page.getByLabel("Kurgu komutu").fill("0.7 saniyeden uzun sessizlikleri kes, ııı ve şey kelimelerini çıkar, 9:16 yap ve Kade altyazılarını aç"); await page.getByRole("button", { name: /KOMUTU UYGULA/ }).click();
  await expect(page.locator(".agent-report strong")).toHaveText("Tamamlandı"); await expect(page.getByLabel("Çıktı oranı")).toHaveValue("9:16"); await expect(page.locator(".caption-track span").first()).toBeVisible(); expect(await page.locator(".timeline-head span").textContent()).not.toBe(beforeText);
  await page.getByRole("button", { name: "Geri al" }).click(); await expect(page.getByLabel("Çıktı oranı")).toHaveValue("16:9"); await page.getByRole("button", { name: "Yinele" }).click(); await expect(page.getByLabel("Çıktı oranı")).toHaveValue("9:16");
  const exportButton = page.locator(".export-button"); await expect(exportButton).toBeEnabled(); await exportButton.click(); const download = page.getByRole("link", { name: /İNDİR/ }); await expect(download).toBeVisible({ timeout: 180_000 });
  const response = await request.get(await download.getAttribute("href") ?? ""); expect(response.ok()).toBe(true); const path = resolve("../../output/playwright/e2e-export.mp4"); await (await import("node:fs/promises")).writeFile(path, await response.body());
  const probe = JSON.parse((await execa("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", path])).stdout) as { streams: Array<{ codec_type: string; codec_name: string; width: number; height: number }>; format: { duration: string } };
  const video = probe.streams.find((stream) => stream.codec_type === "video"); expect(video).toMatchObject({ codec_name: "h264", width: 1080, height: 1920 }); expect(Number(probe.format.duration)).toBeLessThan(14);
});
