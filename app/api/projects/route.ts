import type { NextRequest } from "next/server";
import { run, readJson } from "@/lib/route-helpers";
import { ServiceError } from "@/lib/service-error";
import { backendFetch, toProject, type BackendProject } from "@/lib/auth";
import type { ProjectCreate } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Backend gateway: forwards to `${BACKEND_API_URL}/projects`. Tolerates a bare
 *  array or an envelope (`{ data | projects | items: [...] }`). */
export async function GET() {
  return run(async () => {
    const raw = await backendFetch<unknown>("/projects");
    const envelope = (raw ?? {}) as { data?: unknown[]; projects?: unknown[]; items?: unknown[] };
    const list: unknown[] = Array.isArray(raw)
      ? raw
      : envelope.data ?? envelope.projects ?? envelope.items ?? [];
    return list.map((p) => toProject(p as BackendProject));
  });
}

/** Backend gateway: forwards to `${BACKEND_API_URL}/projects`. The backend takes
 *  `{ name, description }` and infers the owner from the JWT. */
export async function POST(req: NextRequest) {
  return run(async () => {
    const input = await readJson<ProjectCreate>(req);
    const name = input.name?.trim();
    if (!name) throw new ServiceError("Name is required");

    const body = await backendFetch<BackendProject>("/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: input.desc?.trim() ?? "" }),
    });
    return toProject(body);
  }, 201);
}
