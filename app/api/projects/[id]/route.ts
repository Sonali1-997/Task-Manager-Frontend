import type { NextRequest } from "next/server";
import { run, readJson, numericId } from "@/lib/route-helpers";
import { ServiceError } from "@/lib/service-error";
import { backendFetch, toProject, type BackendProject } from "@/lib/auth";
import type { ProjectUpdate } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Backend gateway: forwards to `${BACKEND_API_URL}/projects/{id}`. */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/projects/[id]">) {
  const { id } = await ctx.params;
  return run(async () => toProject(await backendFetch<BackendProject>(`/projects/${numericId(id)}`)));
}

/** Backend gateway: forwards to `${BACKEND_API_URL}/projects/{id}`. Maps the
 *  app's `desc` onto the backend's `description`. */
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/projects/[id]">) {
  const { id } = await ctx.params;
  return run(async () => {
    const patch = await readJson<ProjectUpdate>(req);
    const payload: Record<string, unknown> = {};
    if (patch.name !== undefined) {
      if (!patch.name.trim()) throw new ServiceError("Name is required");
      payload.name = patch.name.trim();
    }
    if (patch.desc !== undefined) payload.description = patch.desc.trim();

    const body = await backendFetch<BackendProject>(`/projects/${numericId(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return toProject(body);
  });
}

/** Backend gateway: forwards to `${BACKEND_API_URL}/projects/{id}`. */
export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/projects/[id]">) {
  const { id } = await ctx.params;
  return run(async () => {
    await backendFetch(`/projects/${numericId(id)}`, { method: "DELETE" });
    return undefined; // 204
  });
}
