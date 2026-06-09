import type { NextRequest } from "next/server";
import { run, readJson } from "@/lib/route-helpers";
import { ServiceError } from "@/lib/service-error";
import {
  backendFetch,
  toTask,
  taskStatusToBackend,
  priorityToBackend,
  type BackendTask,
} from "@/lib/auth";
import type { TaskCreate } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Backend gateway: forwards to `${BACKEND_API_URL}/tasks`. Tolerates a bare
 *  array or an envelope (`{ data | tasks | items: [...] }`). Filtering is done
 *  client-side in the workspace, so no query params are forwarded. */
export async function GET() {
  return run(async () => {
    const raw = await backendFetch<unknown>("/tasks");
    const envelope = (raw ?? {}) as { data?: unknown[]; tasks?: unknown[]; items?: unknown[] };
    const list: unknown[] = Array.isArray(raw)
      ? raw
      : envelope.data ?? envelope.tasks ?? envelope.items ?? [];
    return list.map((t) => toTask(t as BackendTask));
  });
}

/** Backend gateway: forwards to `${BACKEND_API_URL}/tasks`, translating the
 *  app's task shape onto the backend's field names. */
export async function POST(req: NextRequest) {
  return run(async () => {
    const input = await readJson<TaskCreate>(req);
    const title = input.title?.trim();
    if (!title) throw new ServiceError("Title is required");

    const payload: Record<string, unknown> = {
      projectNo: String(input.projectId),
      title,
      description: input.desc?.trim() ?? "",
      taskStatus: taskStatusToBackend(input.status),
      priority: priorityToBackend(input.priority),
      assignedUserNo: String(input.assigneeId),
    };
    if (input.due) payload.dueDate = input.due;

    const body = await backendFetch<BackendTask>("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return toTask(body);
  }, 201);
}
