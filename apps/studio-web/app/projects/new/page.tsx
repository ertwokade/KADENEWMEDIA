"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const allowed = new Set(["video/mp4", "video/quicktime", "video/webm", "audio/mpeg", "audio/wav", "audio/x-wav"]);
export default function NewProjectPage() {
  const router = useRouter(); const [name, setName] = useState(""); const [file, setFile] = useState<File | null>(null); const [progress, setProgress] = useState(0); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); if (!file || !allowed.has(file.type)) { setError("MP4, MOV, WebM, MP3 veya WAV dosyası seçin."); return; }
    const maxMb = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? 1024); if (file.size > maxMb * 1024 * 1024) { setError(`Dosya ${maxMb} MB sınırını aşıyor.`); return; }
    setBusy(true);
    try {
      const projectResponse = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) }); const projectPayload = await projectResponse.json(); if (!projectResponse.ok) throw new Error(projectPayload.error);
      setProgress(10); const projectId = projectPayload.project.id as string;
      const signResponse = await fetch("/api/uploads/presign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ projectId, mimeType: file.type, size: file.size }) }); const signed = await signResponse.json(); if (!signResponse.ok) throw new Error(signed.error);
      await new Promise<void>((resolve, reject) => { const xhr = new XMLHttpRequest(); xhr.open("PUT", signed.url); xhr.setRequestHeader("Content-Type", file.type); xhr.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(10 + Math.round((event.loaded / event.total) * 75)); }; xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Storage yüklemesi başarısız.")); xhr.onerror = () => reject(new Error("Storage bağlantısı kurulamadı.")); xhr.send(file); });
      const complete = await fetch("/api/uploads/complete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ projectId, key: signed.key, filename: file.name, mimeType: file.type }) }); const completed = await complete.json(); if (!complete.ok) throw new Error(completed.error); setProgress(100); router.push(`/editor/${projectId}`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Yükleme başarısız."); setBusy(false); }
  }
  return <main id="main" className="new-project shell"><Link className="back-link" href="/">← Projelere dön</Link><div className="new-grid"><section><p className="eyebrow">YENİ KURGU / UPLOAD</p><h1>Ham görüntüyü<br/><em>masaya bırak.</em></h1><p>Orijinal dosya değişmez. Proxy, transkript ve timeline arka planda hazırlanır.</p></section><form onSubmit={submit}><label>PROJE ADI<input autoFocus required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="Örn. İstanbul röportajı" /></label><label className={`dropzone ${file ? "has-file" : ""}`}><input aria-label="Medya dosyası" type="file" accept="video/mp4,video/quicktime,video/webm,audio/mpeg,audio/wav" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><span className="drop-icon">＋</span><strong>{file?.name ?? "Medya seç veya buraya bırak"}</strong><small>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · ${file.type}` : "MP4 · MOV · WEBM · MP3 · WAV"}</small></label>{busy && <div className="progress-block" aria-live="polite"><span style={{ width: `${progress}%` }} /><p>Yükleniyor — %{progress}</p></div>}{error && <p role="alert" className="form-error">{error}</p>}<button className="primary-button full" disabled={busy}>{busy ? "HAZIRLANIYOR…" : "PROJEYİ OLUŞTUR →"}</button></form></div></main>;
}
