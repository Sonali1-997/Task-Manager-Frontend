import { run } from "@/lib/route-helpers";
import { backendFetch, toUser, type BackendUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Backend gateway: forwards to `${BACKEND_API_URL}/auth/me` with the JWT and
 *  normalizes the profile (`{ userNo, email, role }`) into the app's User. This
 *  is the authoritative source of the signed-in user's role. */
export async function GET() {
  return run(async () => toUser(await backendFetch<BackendUser>("/auth/me")));
}
