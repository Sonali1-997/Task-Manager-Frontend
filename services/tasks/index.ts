/**
 * Tasks service.
 *
 * Owns the task collection. References its project and assignee by ID only
 * (`projectId`, `assigneeId`); it does not import the projects or users
 * services. Independently extractable into its own microservice.
 */
import type { Task, TaskCreate, TaskUpdate, TaskStatus, Priority } from "@/lib/types";
import { STATUSES, PRIORITIES } from "@/lib/types";
import { ServiceError, notFound } from "@/lib/service-error";

const SEED: Task[] = [
  { id: 1, title: "Wire Discord command interface", desc: "Map slash commands to agent actions.", status: "To Do", priority: "High", due: "2026-06-09", assigneeId: 1, projectId: 1 },
  { id: 2, title: "Draft human-in-the-loop spec", desc: "Approval gates for autonomous steps.", status: "To Do", priority: "Medium", due: "2026-06-12", assigneeId: 2, projectId: 1 },
  { id: 3, title: "Always-on agent runtime", desc: "Background worker + scheduler.", status: "In Progress", priority: "High", due: "2026-05-30", assigneeId: 3, projectId: 1 },
  { id: 4, title: "API convention review", desc: "Standardise response envelopes.", status: "In Progress", priority: "Medium", due: "2026-06-10", assigneeId: 1, projectId: 1 },
  { id: 5, title: "Modular monolith scaffold", desc: "NestJS module boundaries.", status: "Done", priority: "Low", due: "2026-05-18", assigneeId: 1, projectId: 2 },
  { id: 6, title: "JWT auth guards", desc: "Role guard + strategy.", status: "Done", priority: "Medium", due: "2026-05-20", assigneeId: 3, projectId: 2 },
  { id: 7, title: "PRD template polish", desc: "Generic, reusable sections.", status: "In Progress", priority: "Medium", due: "2026-06-14", assigneeId: 1, projectId: 2 },
  { id: 8, title: "Workflow command docs", desc: "/start /sync /push.", status: "To Do", priority: "Low", due: "2026-06-20", assigneeId: 3, projectId: 3 },
  { id: 9, title: "Branching conventions", desc: "Feature tag format.", status: "Done", priority: "Low", due: "2026-05-12", assigneeId: 2, projectId: 3 },
  { id: 10, title: "Runtime spike", desc: "Evaluate scheduler libs.", status: "To Do", priority: "High", due: "2026-05-28", assigneeId: 1, projectId: 4 },
];

const g = globalThis as unknown as { __taskflowTasks?: Task[] };
const store: Task[] = (g.__taskflowTasks ??= structuredClone(SEED));

const nextId = () => (store.length ? Math.max(...store.map((t) => t.id)) + 1 : 1);

function validStatus(s: unknown): s is TaskStatus {
  return typeof s === "string" && (STATUSES as string[]).includes(s);
}
function validPriority(p: unknown): p is Priority {
  return typeof p === "string" && (PRIORITIES as string[]).includes(p);
}

export const TasksService = {
  list(filter?: { projectId?: number; assigneeId?: number }): Task[] {
    let rows = store;
    if (filter?.projectId !== undefined) rows = rows.filter((t) => t.projectId === filter.projectId);
    if (filter?.assigneeId !== undefined) rows = rows.filter((t) => t.assigneeId === filter.assigneeId);
    return structuredClone(rows);
  },

  get(id: number): Task {
    const t = store.find((x) => x.id === id);
    if (!t) throw notFound("Task");
    return structuredClone(t);
  },

  create(input: TaskCreate): Task {
    const title = input.title?.trim();
    if (!title) throw new ServiceError("Title is required");
    if (!validStatus(input.status)) throw new ServiceError("Invalid status");
    if (!validPriority(input.priority)) throw new ServiceError("Invalid priority");
    const task: Task = {
      id: nextId(),
      title,
      desc: input.desc?.trim() ?? "",
      status: input.status,
      priority: input.priority,
      due: input.due ?? "",
      assigneeId: input.assigneeId,
      projectId: input.projectId,
    };
    store.push(task);
    return structuredClone(task);
  },

  update(id: number, patch: TaskUpdate): Task {
    const t = store.find((x) => x.id === id);
    if (!t) throw notFound("Task");
    if (patch.title !== undefined) {
      if (!patch.title.trim()) throw new ServiceError("Title is required");
      t.title = patch.title.trim();
    }
    if (patch.desc !== undefined) t.desc = patch.desc.trim();
    if (patch.status !== undefined) {
      if (!validStatus(patch.status)) throw new ServiceError("Invalid status");
      t.status = patch.status;
    }
    if (patch.priority !== undefined) {
      if (!validPriority(patch.priority)) throw new ServiceError("Invalid priority");
      t.priority = patch.priority;
    }
    if (patch.due !== undefined) t.due = patch.due;
    if (patch.assigneeId !== undefined) t.assigneeId = patch.assigneeId;
    if (patch.projectId !== undefined) t.projectId = patch.projectId;
    return structuredClone(t);
  },

  remove(id: number): void {
    const i = store.findIndex((x) => x.id === id);
    if (i === -1) throw notFound("Task");
    store.splice(i, 1);
  },
};
