import { run } from "@/lib/route-helpers";
import { backendFetch, toProject, type BackendProject } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Backend gateway: forwards to `${BACKEND_API_URL}/me/projects` — the projects
 *  the signed-in user belongs to. */
export async function GET() {
  return run(async () => {
    const raw = await backendFetch<unknown>("/me/projects");
    const envelope = (raw ?? {}) as { data?: unknown[]; projects?: unknown[]; items?: unknown[] };
    const list: unknown[] = Array.isArray(raw)
      ? raw
      : envelope.data ?? envelope.projects ?? envelope.items ?? [];
    return list.map((p) => toProject(p as BackendProject));
  });
}
