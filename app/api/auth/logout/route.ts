import { cookies } from "next/headers";
import { run } from "@/lib/route-helpers";
import { TOKEN_COOKIE, getToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Backend gateway: notifies `${BACKEND_API_URL}/auth/logout` so the backend can
 *  invalidate the token, then clears the JWT cookie. The local session is always
 *  ended, even if the backend call fails. */
export async function POST() {
  return run(async () => {
    const token = await getToken();
    const base = process.env.BACKEND_API_URL;
    if (token && base) {
      try {
        await fetch(`${base}/auth/logout`, {
          method: "POST",
          headers: { accept: "*/*", Authorization: `Bearer ${token}` },
          body: "",
        });
      } catch {
        /* ignore — end the local session regardless */
      }
    }
    (await cookies()).delete(TOKEN_COOKIE);
    return undefined; // 204
  });
}
