import { applyCommand } from "@/lib/project-service";
import { toErrorResponse } from "@/lib/serialise";

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) { try { const { projectId } = await params; const body = await request.json() as { text?: string; plan?: unknown }; if (!body.text?.trim()) throw new Error("Kurgu komutu boş olamaz."); return Response.json(await applyCommand(projectId, body.text, body.plan)); } catch (error) { return toErrorResponse(error); } }
