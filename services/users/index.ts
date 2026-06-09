/**
 * Users service.
 *
 * Owns the user collection and all user-related business rules (validation,
 * uniqueness, ID generation). Knows nothing about projects or tasks. The
 * in-memory store stands in for this service's own database and can be swapped
 * for a real one — or lifted into a standalone microservice — without touching
 * any caller, since callers only ever reach it through the API gateway.
 */
import type { User, UserCreate, UserUpdate } from "@/lib/types";
import { ServiceError, notFound, isValidEmail } from "@/lib/service-error";

const SEED: User[] = [
  { id: 1, name: "Sovan", email: "sovan@divii.com", role: "Admin", status: "Active" },
  { id: 2, name: "Seongjin", email: "seongjin@divii.com", role: "Admin", status: "Active" },
  { id: 3, name: "Saikat", email: "saikat@divii.com", role: "User", status: "Active" },
  { id: 4, name: "Arjun", email: "arjun@divii.com", role: "User", status: "Invited" },
];

// Persist the store on globalThis so it survives dev hot-reloads.
const g = globalThis as unknown as { __taskflowUsers?: User[] };
const store: User[] = (g.__taskflowUsers ??= structuredClone(SEED));

const nextId = () => (store.length ? Math.max(...store.map((u) => u.id)) + 1 : 1);

export const UsersService = {
  list(): User[] {
    return structuredClone(store);
  },

  get(id: number): User {
    const u = store.find((x) => x.id === id);
    if (!u) throw notFound("User");
    return structuredClone(u);
  },

  findByEmail(email: string): User | undefined {
    const u = store.find((x) => x.email.toLowerCase() === email.toLowerCase());
    return u ? structuredClone(u) : undefined;
  },

  create(input: UserCreate): User {
    const name = input.name?.trim();
    const email = input.email?.trim();
    if (!name) throw new ServiceError("Name is required");
    if (!email || !isValidEmail(email)) throw new ServiceError("A valid email is required");
    if (store.some((u) => u.email.toLowerCase() === email.toLowerCase()))
      throw new ServiceError("A user with this email already exists");

    const user: User = {
      id: nextId(),
      name,
      email,
      role: input.role === "Admin" ? "Admin" : "User",
      status: "Active",
    };
    store.push(user);
    return structuredClone(user);
  },

  update(id: number, patch: UserUpdate): User {
    const u = store.find((x) => x.id === id);
    if (!u) throw notFound("User");
    if (patch.name !== undefined) {
      if (!patch.name.trim()) throw new ServiceError("Name is required");
      u.name = patch.name.trim();
    }
    if (patch.email !== undefined) {
      const email = patch.email.trim();
      if (!isValidEmail(email)) throw new ServiceError("A valid email is required");
      if (store.some((x) => x.id !== id && x.email.toLowerCase() === email.toLowerCase()))
        throw new ServiceError("A user with this email already exists");
      u.email = email;
    }
    if (patch.role !== undefined) u.role = patch.role;
    if (patch.status !== undefined) u.status = patch.status;
    return structuredClone(u);
  },

  remove(id: number): void {
    const i = store.findIndex((x) => x.id === id);
    if (i === -1) throw notFound("User");
    store.splice(i, 1);
  },
};
