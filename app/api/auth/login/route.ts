import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { run, readJson } from "@/lib/route-helpers";
import { ServiceError, isValidEmail } from "@/lib/service-error";
import { TOKEN_COOKIE, decodeJwt, normalizeRole } from "@/lib/auth";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Backend gateway: forwards credentials to `${BACKEND_API_URL}/auth/login`,
 *  stores the returned JWT in an httpOnly cookie, and returns a User for the
 *  client-side UI session. The token never reaches client JS — it travels with
 *  same-origin /api requests via the cookie and is forwarded as a Bearer token
 *  by the route handlers (see lib/auth.ts `authHeader`). */
export async function POST(req: NextRequest) {
  return run(async () => {
    const base = process.env.BACKEND_API_URL;
    if (!base) throw new ServiceError("BACKEND_API_URL is not configured", 500);

    const { email, password } = await readJson<{ email?: string; password?: string }>(req);
    if (!email?.trim() || !isValidEmail(email.trim())) throw new ServiceError("Enter a valid email");
    if (!password) throw new ServiceError("Password is required");

    let res: Response;
    try {
      res = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "*/*" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
    } catch {
      throw new ServiceError("Unable to reach the login service", 502);
    }

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = body && (body.message ?? body.error);
      throw new ServiceError(
        Array.isArray(msg) ? msg.join(", ") : msg || "Invalid email or password",
        res.status || 401,
      );
    }

    const token: string | undefined = body?.access_token ?? body?.accessToken ?? body?.token;
    if (!token) throw new ServiceError("Login service did not return a token", 502);

    const claims = decodeJwt(token) ?? {};
    const maxAge = claims.exp
      ? Math.max(0, claims.exp - Math.floor(Date.now() / 1000))
      : 60 * 60 * 24 * 7; // 7 days

    (await cookies()).set(TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });

    // Build the UI session from the backend's user object if present, else from
    // the JWT claims.
    const u = (body.user ?? {}) as Partial<User> & { id?: string | number };
    const user: User = {
      id: Number(u.id ?? claims.sub ?? claims.id ?? 0),
      name: u.name ?? claims.name ?? email.trim().split("@")[0],
      email: u.email ?? claims.email ?? email.trim(),
      role: normalizeRole(u.role ?? claims.role),
      status: "Active",
    };
    return user;
  });
}
