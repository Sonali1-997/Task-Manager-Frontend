import type { NextRequest } from "next/server";
import { run, readJson, numericId } from "@/lib/route-helpers";
import { ServiceError } from "@/lib/service-error";
import {
  backendFetch,
  toTask,
  taskStatusToBackend,
  priorityToBackend,
  type BackendTask,
} from "@/lib/auth";
import type { TaskUpdate } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Backend gateway: forwards to `${BACKEND_API_URL}/tasks/{id}`. */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/tasks/[id]">) {
  const { id } = await ctx.params;
  return run(async () => toTask(await backendFetch<BackendTask>(`/tasks/${numericId(id)}`)));
}

/** Backend gateway: forwards to `${BACKEND_API_URL}/tasks/{id}`, translating
 *  only the fields present in the patch (supports status-only updates). */
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/tasks/[id]">) {
  const { id } = await ctx.params;
  return run(async () => {
    const patch = await readJson<TaskUpdate>(req);
    const payload: Record<string, unknown> = {};
    if (patch.title !== undefined) {
      if (!patch.title.trim()) throw new ServiceError("Title is required");
      payload.title = patch.title.trim();
    }
    if (patch.desc !== undefined) payload.description = patch.desc.trim();
    if (patch.status !== undefined) payload.taskStatus = taskStatusToBackend(patch.status);
    if (patch.priority !== undefined) payload.priority = priorityToBackend(patch.priority);
    if (patch.due !== undefined) payload.dueDate = patch.due || null;
    if (patch.assigneeId !== undefined) payload.assignedUserNo = String(patch.assigneeId);
    // Note: the backend's task-update DTO does not accept `projectNo` — a task
    // cannot be moved to another project via PATCH, so it is intentionally omitted.

    const body = await backendFetch<BackendTask>(`/tasks/${numericId(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return toTask(body);
  });
}

/** Backend gateway: forwards to `${BACKEND_API_URL}/tasks/{id}`. */
export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/tasks/[id]">) {
  const { id } = await ctx.params;
  return run(async () => {
    await backendFetch(`/tasks/${numericId(id)}`, { method: "DELETE" });
    return undefined; // 204
  });
}
