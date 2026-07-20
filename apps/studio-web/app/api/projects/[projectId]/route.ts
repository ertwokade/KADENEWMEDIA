import { getProjectData } from "@/lib/project-service";
import { toErrorResponse } from "@/lib/serialise";

export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) { try { const { projectId } = await params; const data = await getProjectData(projectId); if (!data) return toErrorResponse(new Error("Proje bulunamadı."), 404); return Response.json(data); } catch (error) { return toErrorResponse(error, 500); } }
