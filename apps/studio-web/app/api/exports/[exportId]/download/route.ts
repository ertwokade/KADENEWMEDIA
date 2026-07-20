import { getExportDownload } from "@/lib/project-service";
import { toErrorResponse } from "@/lib/serialise";

export async function GET(_: Request, { params }: { params: Promise<{ exportId: string }> }) { try { const { exportId } = await params; return Response.redirect(await getExportDownload(exportId), 307); } catch (error) { return toErrorResponse(error); } }
