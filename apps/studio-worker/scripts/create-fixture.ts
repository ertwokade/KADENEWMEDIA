import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { execa } from "execa";

const outputDir = fileURLToPath(new URL("../../../fixtures/generated", import.meta.url));
const output = fileURLToPath(new URL("../../../fixtures/generated/kade-studio-demo.mp4", import.meta.url));
await mkdir(outputDir, { recursive: true });
const video = "color=c=0xE9FF70:s=960x540:d=4:r=30[v0];color=c=0x202020:s=960x540:d=5:r=30[v1];color=c=0xF3F0E8:s=960x540:d=5:r=30[v2];[v0][v1][v2]concat=n=3:v=1:a=0[v]";
const audio = "sine=frequency=440:duration=3[a0];anullsrc=r=48000:cl=stereo:d=1[a1];sine=frequency=660:duration=4[a2];anullsrc=r=48000:cl=stereo:d=2[a3];sine=frequency=520:duration=4[a4];[a0][a1][a2][a3][a4]concat=n=5:v=0:a=1[a]";
await execa("ffmpeg", ["-hide_banner", "-y", "-filter_complex", `${video};${audio}`, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-movflags", "+faststart", output], { stdio: "inherit" });
console.log(`Fixture oluşturuldu: ${output}`);
