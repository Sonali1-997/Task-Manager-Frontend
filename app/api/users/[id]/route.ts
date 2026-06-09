import type { NextRequest } from "next/server";
import { UsersService } from "@/services/users";
import { run, readJson, numericId } from "@/lib/route-helpers";
import { backendFetch, requireAdmin } from "@/lib/auth";
import type { UserUpdate } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  const { id } = await ctx.params;
  return run(() => UsersService.get(numericId(id)));
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  const { id } = await ctx.params;
  return run(async () => UsersService.update(numericId(id), await readJson<UserUpdate>(req)));
}

/** Backend gateway (admin only): forwards to `${BACKEND_API_URL}/users/{id}`. */
export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  const { id } = await ctx.params;
  return run(async () => {
    await requireAdmin();
    await backendFetch(`/users/${numericId(id)}`, { method: "DELETE" });
    return undefined; // 204
  });
}
