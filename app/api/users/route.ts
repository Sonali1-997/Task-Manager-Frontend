import type { NextRequest } from "next/server";
import { run, readJson } from "@/lib/route-helpers";
import { ServiceError, isValidEmail } from "@/lib/service-error";
import { backendFetch, toUser, requireAdmin, type BackendUser } from "@/lib/auth";
import type { UserCreate } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Backend gateway: forwards to `${BACKEND_API_URL}/users` with the JWT and
 *  normalizes each backend user into the app's User shape. Tolerates either a
 *  bare array or an envelope (`{ data | users | items: [...] }`). */
export async function GET() {
  return run(async () => {
    const raw = await backendFetch<unknown>("/users");
    const envelope = (raw ?? {}) as { data?: unknown[]; users?: unknown[]; items?: unknown[] };
    const list: unknown[] = Array.isArray(raw)
      ? raw
      : envelope.data ?? envelope.users ?? envelope.items ?? [];
    return list.map((u) => toUser(u as BackendUser));
  });
}

/** Backend gateway (admin only): forwards to `${BACKEND_API_URL}/users`. The
 *  backend expects a lowercase role ("admin" | "user"). */
export async function POST(req: NextRequest) {
  return run(async () => {
    await requireAdmin();

    const input = await readJson<UserCreate>(req);
    const name = input.name?.trim();
    const email = input.email?.trim();
    if (!name) throw new ServiceError("Name is required");
    if (!email || !isValidEmail(email)) throw new ServiceError("A valid email is required");
    if (!input.password || input.password.length < 6)
      throw new ServiceError("Password must be at least 6 characters");

    const body = await backendFetch<BackendUser>("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password: input.password,
        role: (input.role ?? "User").toLowerCase(),
      }),
    });

    return body && (body.email || body.userNo) ? toUser(body) : body;
  }, 201);
}
