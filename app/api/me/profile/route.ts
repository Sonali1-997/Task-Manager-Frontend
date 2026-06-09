import type { NextRequest } from "next/server";
import { run, readJson } from "@/lib/route-helpers";
import { ServiceError, isValidEmail } from "@/lib/service-error";
import { backendFetch, toUser, type BackendUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Backend gateway: forwards to `${BACKEND_API_URL}/me/profile` — updates the
 *  signed-in user's name/email and/or password. Only the provided fields are
 *  sent; a password change requires the current password. */
export async function PATCH(req: NextRequest) {
  return run(async () => {
    const input = await readJson<{
      name?: string;
      email?: string;
      newPassword?: string;
      currentPassword?: string;
    }>(req);

    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) {
      if (!input.name.trim()) throw new ServiceError("Name is required");
      payload.name = input.name.trim();
    }
    if (input.email !== undefined) {
      const email = input.email.trim();
      if (!isValidEmail(email)) throw new ServiceError("A valid email is required");
      payload.email = email;
    }
    if (input.newPassword !== undefined) {
      if (input.newPassword.length < 6)
        throw new ServiceError("Password must be at least 6 characters");
      if (!input.currentPassword) throw new ServiceError("Current password is required");
      payload.newPassword = input.newPassword;
      payload.currentPassword = input.currentPassword;
    }

    const body = await backendFetch<BackendUser>("/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return body && (body.email || body.userNo) ? toUser(body) : body;
  });
}
