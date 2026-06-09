"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/app/providers";
import { usersApi, projectsApi, tasksApi, meApi } from "@/lib/api";
import type { Project, Task, User } from "@/lib/types";

/**
 * Loads data from the three services once for the authenticated shell and
 * shares it across pages. Each fetch is an independent call to its service's
 * endpoint — the cross-service joins (assignee name, project name) happen here
 * on the client by ID, exactly as they would against separate microservices.
 */
interface WorkspaceState {
  users: User[];
  projects: Project[];
  tasks: Task[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  userById: (id: number) => User | undefined;
  projectById: (id: number) => Project | undefined;
  visibleTasks: Task[];
  visibleProjects: Project[];
}

const Ctx = createContext<WorkspaceState | null>(null);
export const useWorkspace = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace must be used within <WorkspaceProvider>");
  return ctx;
};

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      if (me?.role === "Admin") {
        // Admins load the full workspace (and the user directory) so they can
        // manage everything and preview the "view as User" experience.
        const [p, t, u] = await Promise.all([
          projectsApi.list(),
          tasksApi.list(),
          usersApi.list().catch(() => [] as User[]),
        ]);
        setProjects(p);
        setTasks(t);
        setUsers(u);
      } else {
        // Regular users get only their assigned work, from the dedicated
        // /me endpoints. The directory is seeded with themselves so their own
        // name resolves (the backend directory is admin-only).
        const [p, t] = await Promise.all([meApi.projects(), meApi.tasks()]);
        setProjects(p);
        setTasks(t);
        setUsers(me ? [me] : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const userById = useCallback((id: number) => users.find((u) => u.id === id), [users]);
  const projectById = useCallback((id: number) => projects.find((p) => p.id === id), [projects]);

  // Data is already scoped by the fetch — admins load everything, regular users
  // load only their own /me data — so the visible views are the loaded sets.
  const visibleTasks = tasks;
  const visibleProjects = projects;

  const value: WorkspaceState = {
    users,
    projects,
    tasks,
    loading,
    error,
    refresh,
    userById,
    projectById,
    visibleTasks,
    visibleProjects,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
