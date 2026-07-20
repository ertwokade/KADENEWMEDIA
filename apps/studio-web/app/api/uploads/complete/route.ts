import { completeUpload } from "@/lib/project-service";
import { toErrorResponse } from "@/lib/serialise";

export async function POST(request: Request) { try { const body = await request.json() as { projectId: string; key: string; filename: string; mimeType: string }; return Response.json({ asset: await completeUpload(body) }, { status: 202 }); } catch (error) { return toErrorResponse(error); } }
