import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "Kade Studio", description: "Prompt ile kurgula. Timeline’da kontrol et." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body><a className="skip-link" href="#main">İçeriğe geç</a><header className="site-header"><Link className="wordmark" href="/"><span>KADE</span><i>/</i><span>STUDIO</span></Link><div className="coordinates">İSTANBUL 41.01° N · 28.98° E</div><div className="mode-badge"><span /> DEMO AI MODU</div></header>{children}</body></html>;
}
