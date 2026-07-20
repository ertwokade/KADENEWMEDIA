import { notFound } from "next/navigation";
import { getProjectData } from "@/lib/project-service";
import { json } from "@/lib/serialise";
import type { EditorData } from "@/lib/editor-types";
import { EditorClient } from "./EditorClient";

export const dynamic = "force-dynamic";
export default async function EditorPage({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params; const data = await getProjectData(projectId); if (!data) notFound(); return <EditorClient initialData={json(data) as unknown as EditorData} />; }
