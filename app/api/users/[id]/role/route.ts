import type { NextRequest } from "next/server";
import { run, readJson, numericId } from "@/lib/route-helpers";
import { ServiceError } from "@/lib/service-error";
import { backendFetch, toUser, requireAdmin, type BackendUser } from "@/lib/auth";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Backend gateway (admin only): forwards a role change to
 *  `${BACKEND_API_URL}/users/{id}/role`. The backend expects a lowercase role
 *  ("admin" | "user"). */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return run(async () => {
    await requireAdmin();

    const { role } = await readJson<{ role?: Role }>(req);
    if (role !== "Admin" && role !== "User") throw new ServiceError("A valid role is required");

    const body = await backendFetch<BackendUser>(`/users/${numericId(id)}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: role.toLowerCase() }),
    });

    // The backend may echo the updated user, or return nothing useful.
    return body && (body.email || body.userNo) ? toUser(body) : body;
  });
}
