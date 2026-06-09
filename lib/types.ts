/**
 * Shared API contracts (the "contracts package").
 *
 * These are pure data shapes exchanged over the HTTP boundary between the
 * frontend and the three services (users / projects / tasks). They are the
 * only thing shared across service boundaries — services reference each other
 * by ID only, never by importing one another's modules. That keeps each
 * service independently extractable into its own microservice later.
 */

export type Role = "Admin" | "User";
export type UserStatus = "Active" | "Invited";
export type Priority = "Low" | "Medium" | "High";
export type TaskStatus = "To Do" | "In Progress" | "Done";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
}

export interface Project {
  id: number;
  name: string;
  desc: string;
  ownerId: number;
  created: string; // ISO date (YYYY-MM-DD)
  ownerName?: string; // owner display name, supplied by the backend
  totalTasks?: number; // task rollups, supplied by the backend
  doneTasks?: number;
  progress?: number; // 0-100
}

export interface Task {
  id: number;
  title: string;
  desc: string;
  status: TaskStatus;
  priority: Priority;
  due: string; // ISO date (YYYY-MM-DD) or ""
  assigneeId: number;
  projectId: number;
}

/* ---- create / update input shapes ---- */
export type UserCreate = { name: string; email: string; role: Role; password?: string };
export type UserUpdate = Partial<Omit<User, "id">>;

export type ProjectCreate = { name: string; desc?: string; ownerId: number };
export type ProjectUpdate = Partial<Omit<Project, "id">>;

export type TaskCreate = Omit<Task, "id">;
export type TaskUpdate = Partial<Omit<Task, "id">>;

export const STATUSES: TaskStatus[] = ["To Do", "In Progress", "Done"];
export const PRIORITIES: Priority[] = ["Low", "Medium", "High"];
export const ROLES: Role[] = ["User", "Admin"];

/** Reference date the prototype treats as "today" for overdue calculations. */
export const TODAY = "2026-06-04";
