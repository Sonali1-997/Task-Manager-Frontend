/**
 * Server-side JWT helpers for the API gateway.
 *
 * The backend issues a JWT on login; the route handlers store it in an httpOnly
 * cookie and forward it as a Bearer token when proxying to the backend. The
 * gateway never *verifies* the token (the backend does that) — it only needs to
 * read the claims to populate the UI session.
 */
import { cookies } from "next/headers";
import { ServiceError } from "@/lib/service-error";
import type { Priority, Project, Role, Task, TaskStatus, User } from "@/lib/types";

export const TOKEN_COOKIE = "taskflow.token";

/** Map a backend role string ("admin"/"user", any case) onto the app's Role. */
export const normalizeRole = (r: unknown): Role =>
  String(r).toLowerCase() === "admin" ? "Admin" : "User";

export interface JwtClaims {
  sub?: string | number;
  id?: string | number;
  email?: string;
  name?: string;
  role?: string;
  exp?: number; // seconds since epoch
  [key: string]: unknown;
}

/** Decode (without verifying) the payload segment of a JWT. */
export function decodeJwt(token: string): JwtClaims | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as JwtClaims;
  } catch {
    return null;
  }
}

/** The JWT for the current request, or undefined when signed out. */
export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}

/** Authorization header to forward to the backend on protected routes, or an
 *  empty object when unauthenticated. */
export async function authHeader(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Guard an admin-only route: throws 401 when signed out, 403 when the JWT's
 *  role is not admin. The backend enforces this too — this is defense in depth
 *  so unauthorized requests never leave the gateway. */
export async function requireAdmin(): Promise<void> {
  const token = await getToken();
  const claims = token ? decodeJwt(token) : null;
  if (!claims) throw new ServiceError("Not authenticated", 401);
  if (normalizeRole(claims.role) !== "Admin") throw new ServiceError("Admin access required", 403);
}

/** Raw user shape as returned by the backend (e.g. `/auth/me`, `/users`). */
export type BackendUser = {
  userNo?: string | number;
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
};

/** Normalize a backend user (`{ userNo, name, email, role, ... }`) into the
 *  app's User shape. Falls back to the email prefix if `name` is ever absent. */
export function toUser(raw: BackendUser): User {
  const email = raw.email ?? "";
  return {
    id: Number(raw.userNo ?? raw.id ?? 0),
    name: raw.name ?? (email ? email.split("@")[0] : ""),
    email,
    role: normalizeRole(raw.role),
    status: raw.status === "Invited" ? "Invited" : "Active",
  };
}

/** Raw project shape as returned by the backend. The backend uses `description`
 *  (nullable) where the app uses `desc`, identifies the owner via `createdBy`
 *  + `ownerName`, and timestamps with `createDatetime`. */
export type BackendProject = {
  id?: string | number;
  projectNo?: string | number;
  name?: string;
  description?: string | null;
  desc?: string;
  status?: string;
  ownerId?: string | number;
  userNo?: string | number;
  createdBy?: string | number;
  ownerName?: string;
  created?: string;
  createdAt?: string;
  createDatetime?: string;
  totalTasks?: string | number;
  doneTasks?: string | number;
  progress?: string | number;
};

/** Normalize a backend project into the app's Project shape. */
export function toProject(raw: BackendProject): Project {
  return {
    id: Number(raw.id ?? raw.projectNo ?? 0),
    name: raw.name ?? "",
    desc: raw.description ?? raw.desc ?? "",
    ownerId: Number(raw.createdBy ?? raw.ownerId ?? raw.userNo ?? 0),
    created: (raw.createDatetime ?? raw.created ?? raw.createdAt ?? "").slice(0, 10),
    ownerName: raw.ownerName ?? undefined,
    totalTasks: raw.totalTasks != null ? Number(raw.totalTasks) : undefined,
    doneTasks: raw.doneTasks != null ? Number(raw.doneTasks) : undefined,
    progress: raw.progress != null ? Number(raw.progress) : undefined,
  };
}

/* ---- Task status / priority translation (app values <-> backend values) ---- */

const STATUS_TO_BACKEND: Record<TaskStatus, string> = {
  "To Do": "todo",
  "In Progress": "in_progress",
  Done: "done",
};
export const taskStatusToBackend = (s: TaskStatus): string => STATUS_TO_BACKEND[s] ?? "todo";

const taskStatusFromBackend = (s: unknown): TaskStatus => {
  const k = String(s).toLowerCase().replace(/[^a-z]/g, "");
  if (k === "inprogress") return "In Progress";
  if (k === "done") return "Done";
  return "To Do";
};

export const priorityToBackend = (p: Priority): string => p.toLowerCase();

const priorityFromBackend = (p: unknown): Priority => {
  const k = String(p).toLowerCase();
  return k === "high" ? "High" : k === "low" ? "Low" : "Medium";
};

/** Raw task shape as returned by the backend (different field names than the app). */
export type BackendTask = {
  id?: string | number;
  taskNo?: string | number;
  title?: string;
  description?: string;
  taskStatus?: string;
  priority?: string;
  dueDate?: string;
  due?: string;
  assignedUserNo?: string | number;
  projectNo?: string | number;
};

/** Normalize a backend task into the app's Task shape. */
export function toTask(raw: BackendTask): Task {
  return {
    id: Number(raw.id ?? raw.taskNo ?? 0),
    title: raw.title ?? "",
    desc: raw.description ?? "",
    status: taskStatusFromBackend(raw.taskStatus),
    priority: priorityFromBackend(raw.priority),
    due: (raw.dueDate ?? raw.due ?? "").slice(0, 10),
    assigneeId: Number(raw.assignedUserNo ?? 0),
    projectId: Number(raw.projectNo ?? 0),
  };
}

/** Call a backend endpoint with the current request's JWT attached as a Bearer
 *  token, parse the JSON body, and map non-2xx responses to a ServiceError.
 *  Throws 401 before making the request when there is no session. */
export async function backendFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = process.env.BACKEND_API_URL;
  if (!base) throw new ServiceError("BACKEND_API_URL is not configured", 500);

  const auth = await authHeader();
  if (!auth.Authorization) throw new ServiceError("Not authenticated", 401);

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      headers: { accept: "*/*", ...auth, ...(init.headers ?? {}) },
    });
  } catch {
    throw new ServiceError("Unable to reach the backend service", 502);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = body && (body.message ?? body.error);
    throw new ServiceError(
      Array.isArray(msg) ? msg.join(", ") : msg || "Request failed",
      res.status || 500,
    );
  }
  return body as T;
}
