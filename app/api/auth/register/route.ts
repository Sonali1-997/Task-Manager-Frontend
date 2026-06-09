import type { NextRequest } from "next/server";
import { run, readJson } from "@/lib/route-helpers";
import { ServiceError, isValidEmail } from "@/lib/service-error";

export const dynamic = "force-dynamic";

/** Backend gateway: this route handler validates the input and forwards
 *  registration to the real auth service at `${BACKEND_API_URL}/auth/register`.
 *  Keeping the backend base URL server-side avoids CORS (the browser only ever
 *  talks to this same-origin route) and keeps the address out of the client bundle. */
export async function POST(req: NextRequest) {
  return run(async () => {
    const base = process.env.BACKEND_API_URL;
    if (!base) throw new ServiceError("BACKEND_API_URL is not configured", 500);

    const { name, email, password } = await readJson<{
      name?: string;
      email?: string;
      password?: string;
    }>(req);

    if (!name?.trim()) throw new ServiceError("Name is required");
    if (!email?.trim() || !isValidEmail(email.trim())) throw new ServiceError("A valid email is required");
    if (!password || password.length < 6) throw new ServiceError("Password must be at least 6 characters");

    let res: Response;
    try {
      res = await fetch(`${base}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "*/*" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
    } catch {
      throw new ServiceError("Unable to reach the registration service", 502);
    }

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = body && (body.message ?? body.error);
      throw new ServiceError(Array.isArray(msg) ? msg.join(", ") : msg || "Registration failed", res.status);
    }
    return body;
  }, 201);
}
