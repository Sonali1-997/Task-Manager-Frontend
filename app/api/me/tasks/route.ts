import { run } from "@/lib/route-helpers";
import { backendFetch, toTask, type BackendTask } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Backend gateway: forwards to `${BACKEND_API_URL}/me/tasks` — the tasks
 *  assigned to the signed-in user. */
export async function GET() {
  return run(async () => {
    const raw = await backendFetch<unknown>("/me/tasks");
    const envelope = (raw ?? {}) as { data?: unknown[]; tasks?: unknown[]; items?: unknown[] };
    const list: unknown[] = Array.isArray(raw)
      ? raw
      : envelope.data ?? envelope.tasks ?? envelope.items ?? [];
    return list.map((t) => toTask(t as BackendTask));
  });
}
