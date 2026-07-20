import { createPresignedUpload, createUploadKey } from "@kade/shared";
import { toErrorResponse } from "@/lib/serialise";

export async function POST(request: Request) { try { const body = await request.json() as { projectId: string; mimeType: string; size: number }; const key = createUploadKey(body.projectId, body.mimeType); const url = await createPresignedUpload(key, body.mimeType, body.size); return Response.json({ key, url }); } catch (error) { return toErrorResponse(error); } }
