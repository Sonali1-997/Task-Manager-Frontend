import { ServiceError } from "@/lib/service-error";

/** Run a service call and translate the result (or a thrown ServiceError)
 *  into a JSON Response. Keeps every route handler a thin adapter over its
 *  service — the same shape an API gateway would have in front of a real
 *  microservice. */
export async function run<T>(fn: () => T | Promise<T>, okStatus = 200): Promise<Response> {
  try {
    const data = await fn();
    if (data === undefined) return new Response(null, { status: 204 });
    return Response.json(data, { status: okStatus });
  } catch (err) {
    if (err instanceof ServiceError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Parse a numeric route param, 400 on garbage. */
export function numericId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id)) throw new ServiceError("Invalid id");
  return id;
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ServiceError("Invalid JSON body");
  }
}
