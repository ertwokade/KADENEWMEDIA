import Link from "next/link";
import { listProjects } from "@/lib/project-service";

export const dynamic = "force-dynamic";
const statusLabel: Record<string, string> = { draft: "Taslak", uploading: "Yükleniyor", processing: "İşleniyor", ready: "Kurguya hazır", failed: "Başarısız" };
export default async function Dashboard() {
  const projects = await listProjects();
  return <main id="main" className="dashboard shell"><section className="dashboard-hero"><div><p className="eyebrow">YAPAY ZEKÂ DESTEKLİ VİDEO MASASI / 001</p><h1>Prompt ile kurgula.<br/><em>Timeline’da kontrol et.</em></h1></div><Link className="primary-button" href="/projects/new">+ YENİ PROJE</Link></section><section className="project-section"><div className="section-title"><h2>Projeler</h2><span>{String(projects.length).padStart(2, "0")} KAYIT</span></div>{projects.length ? <div className="project-list">{projects.map((project, index) => <Link className="project-row" href={`/editor/${project.id}`} key={project.id}><span className="project-index">{String(index + 1).padStart(2, "0")}</span><strong>{project.name}</strong><span className={`status status-${project.status}`}><i /> {statusLabel[project.status] ?? project.status}</span><time>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(project.updatedAt)}</time><b aria-hidden>↗</b></Link>)}</div> : <div className="empty-state"><span>Henüz kayıt yok</span><p>İlk konuşma videonu yükle ve kurgu masanı aç.</p><Link href="/projects/new">İlk projeyi oluştur →</Link></div>}</section></main>;
}
