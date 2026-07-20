import { nameVersion } from "@/lib/project-service";
import { toErrorResponse } from "@/lib/serialise";

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) { try { const { projectId } = await params; const { name } = await request.json() as { name?: string }; if (!name?.trim()) throw new Error("Versiyon adı gerekli."); await nameVersion(projectId, name); return Response.json({ ok: true }); } catch (error) { return toErrorResponse(error); } }
