import { moveHistory } from "@/lib/project-service";
import { toErrorResponse } from "@/lib/serialise";

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) { try { const { projectId } = await params; const { direction } = await request.json() as { direction: "undo" | "redo" }; if (direction !== "undo" && direction !== "redo") throw new Error("Geçersiz geçmiş yönü."); return Response.json(await moveHistory(projectId, direction)); } catch (error) { return toErrorResponse(error); } }
