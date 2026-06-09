/**
 * Frontend API client — the microservice seam.
 *
 * Every domain has its own base URL. Today they all resolve to this app's
 * route handlers ("/api/..."), but each can be repointed at a standalone
 * service (e.g. NEXT_PUBLIC_USERS_API="https://users.internal") without
 * changing a single call site. This is the boundary that becomes the network
 * hop once the services are split out.
 */
import type {
  Role,
  User,
  Project,
  Task,
  UserCreate,
  UserUpdate,
  ProjectCreate,
  ProjectUpdate,
  TaskCreate,
  TaskUpdate,
} from "@/lib/types";

const BASE = {
  users: process.env.NEXT_PUBLIC_USERS_API ?? "/api/users",
  projects: process.env.NEXT_PUBLIC_PROJECTS_API ?? "/api/projects",
  tasks: process.env.NEXT_PUBLIC_TASKS_API ?? "/api/tasks",
  auth: process.env.NEXT_PUBLIC_AUTH_API ?? "/api/auth",
  me: process.env.NEXT_PUBLIC_ME_API ?? "/api/me",
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((body && body.error) || `Request failed (${res.status})`);
  }
  return body as T;
}

const jsonBody = (data: unknown) => ({ body: JSON.stringify(data) });

export const usersApi = {
  list: () => request<User[]>(BASE.users),
  get: (id: number) => request<User>(`${BASE.users}/${id}`),
  create: (data: UserCreate) => request<User>(BASE.users, { method: "POST", ...jsonBody(data) }),
  update: (id: number, data: UserUpdate) =>
    request<User>(`${BASE.users}/${id}`, { method: "PATCH", ...jsonBody(data) }),
  setRole: (id: number, role: Role) =>
    request<User>(`${BASE.users}/${id}/role`, { method: "PATCH", ...jsonBody({ role }) }),
  remove: (id: number) => request<void>(`${BASE.users}/${id}`, { method: "DELETE" }),
};

export const projectsApi = {
  list: () => request<Project[]>(BASE.projects),
  get: (id: number) => request<Project>(`${BASE.projects}/${id}`),
  create: (data: ProjectCreate) =>
    request<Project>(BASE.projects, { method: "POST", ...jsonBody(data) }),
  update: (id: number, data: ProjectUpdate) =>
    request<Project>(`${BASE.projects}/${id}`, { method: "PATCH", ...jsonBody(data) }),
  remove: (id: number) => request<void>(`${BASE.projects}/${id}`, { method: "DELETE" }),
};

export const tasksApi = {
  list: (filter?: { projectId?: number; assigneeId?: number }) => {
    const qs = new URLSearchParams();
    if (filter?.projectId !== undefined) qs.set("projectId", String(filter.projectId));
    if (filter?.assigneeId !== undefined) qs.set("assigneeId", String(filter.assigneeId));
    const q = qs.toString();
    return request<Task[]>(q ? `${BASE.tasks}?${q}` : BASE.tasks);
  },
  get: (id: number) => request<Task>(`${BASE.tasks}/${id}`),
  create: (data: TaskCreate) => request<Task>(BASE.tasks, { method: "POST", ...jsonBody(data) }),
  update: (id: number, data: TaskUpdate) =>
    request<Task>(`${BASE.tasks}/${id}`, { method: "PATCH", ...jsonBody(data) }),
  remove: (id: number) => request<void>(`${BASE.tasks}/${id}`, { method: "DELETE" }),
};

export const meApi = {
  tasks: () => request<Task[]>(`${BASE.me}/tasks`),
  projects: () => request<Project[]>(`${BASE.me}/projects`),
  updateProfile: (data: {
    name?: string;
    email?: string;
    newPassword?: string;
    currentPassword?: string;
  }) => request<User>(`${BASE.me}/profile`, { method: "PATCH", ...jsonBody(data) }),
};

export const authApi = {
  login: (email: string, password: string) =>
    request<User>(`${BASE.auth}/login`, { method: "POST", ...jsonBody({ email, password }) }),
  register: (name: string, email: string, password: string) =>
    request<User>(`${BASE.auth}/register`, {
      method: "POST",
      ...jsonBody({ name, email, password }),
    }),
  logout: () => request<void>(`${BASE.auth}/logout`, { method: "POST" }),
  me: () => request<User>(`${BASE.auth}/me`),
};
