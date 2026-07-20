import { createProject, listProjects } from "@/lib/project-service";
import { toErrorResponse } from "@/lib/serialise";

export async function GET() { return Response.json({ projects: await listProjects() }); }
export async function POST(request: Request) { try { const { name } = await request.json() as { name?: string }; return Response.json({ project: await createProject(name ?? "") }, { status: 201 }); } catch (error) { return toErrorResponse(error); } }
