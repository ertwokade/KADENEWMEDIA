import { createExport } from "@/lib/project-service";
import { toErrorResponse } from "@/lib/serialise";

export async function POST(_: Request, { params }: { params: Promise<{ projectId: string }> }) { try { const { projectId } = await params; return Response.json({ export: await createExport(projectId) }, { status: 202 }); } catch (error) { return toErrorResponse(error); } }
