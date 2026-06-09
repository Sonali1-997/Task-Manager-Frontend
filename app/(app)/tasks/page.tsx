"use client";

import { useMemo, useState } from "react";
import { useAuth, useToast } from "@/app/providers";
import { useWorkspace } from "@/components/Workspace";
import { TaskCard } from "@/components/TaskCard";
import { Avatar, PriorityPill } from "@/components/ui";
import { TaskModal } from "@/components/modals/TaskModal";
import { SearchIcon } from "@/components/icons";
import { tasksApi } from "@/lib/api";
import { STATUSES, PRIORITIES } from "@/lib/types";
import { fmt, isOverdue } from "@/lib/ui";
import type { Task, TaskStatus } from "@/lib/types";

export default function TasksPage() {
  const { me } = useAuth();
  const toast = useToast();
  const { loading, error, visibleTasks, projects, userById, projectById, refresh } = useWorkspace();

  const [mode, setMode] = useState<"board" | "list">("board");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [project, setProject] = useState("");
  const [q, setQ] = useState("");
  const [dragId, setDragId] = useState<number | null>(null);
  const [dropCol, setDropCol] = useState<string | null>(null);
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [showNew, setShowNew] = useState(false);

  const isAdmin = me?.role === "Admin";

  const filtered = useMemo(() => {
    return visibleTasks.filter((t) => {
      if (status && t.status !== status) return false;
      if (priority && t.priority !== priority) return false;
      if (project && t.projectId !== Number(project)) return false;
      if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [visibleTasks, status, priority, project, q]);

  if (loading) return <div className="loading">Loading tasks…</div>;
  if (error) return <div className="view"><div className="panel">{error}</div></div>;

  async function moveTask(taskId: number, newStatus: TaskStatus) {
    const t = visibleTasks.find((x) => x.id === taskId);
    if (!t || t.status === newStatus) return;
    await tasksApi.update(taskId, { status: newStatus });
    await refresh();
    toast("Moved to " + newStatus);
  }

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <h1>Tasks</h1>
          <div className="ph-sub">
            {filtered.length} task(s){isAdmin ? "" : " assigned to you"}
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div className="seg">
          <button className={mode === "board" ? "on" : ""} onClick={() => setMode("board")}>
            Board
          </button>
          <button className={mode === "list" ? "on" : ""} onClick={() => setMode("list")}>
            List
          </button>
        </div>
        <div className="search-inline">
          <SearchIcon />
          <input placeholder="Search tasks…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select value={project} onChange={(e) => setProject(e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="spacer" />
        <button className="btn primary" onClick={() => setShowNew(true)}>
          + New task
        </button>
      </div>

      {mode === "board" ? (
        <div className="board">
          {STATUSES.map((s) => {
            const colTasks = filtered.filter((t) => t.status === s);
            return (
              <div
                key={s}
                className={`col${dropCol === s ? " drop" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropCol(s);
                }}
                onDragLeave={() => setDropCol((c) => (c === s ? null : c))}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropCol(null);
                  if (dragId != null) moveTask(dragId, s);
                  setDragId(null);
                }}
              >
                <div className="col-head">
                  <span>{s.toUpperCase()}</span>
                  <span>{colTasks.length}</span>
                </div>
                {colTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    assigneeName={userById(t.assigneeId)?.name ?? "—"}
                    draggable
                    dragging={dragId === t.id}
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => setOpenTask(t)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="tablewrap">
          <div className="tablescroll">
            <table className="data">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--faint)", padding: 30 }}>
                      No records found
                    </td>
                  </tr>
                )}
                {filtered.map((t) => {
                  const assignee = userById(t.assigneeId);
                  return (
                    <tr key={t.id} className="clickable" onClick={() => setOpenTask(t)}>
                      <td style={{ fontWeight: 600 }}>{t.title}</td>
                      <td>
                        <PriorityPill value={t.priority} />
                      </td>
                      <td>{t.status}</td>
                      <td>{projectById(t.projectId)?.name ?? "—"}</td>
                      <td>
                        <div className="cellname">
                          <Avatar name={assignee?.name ?? "—"} size={24} />
                          {assignee?.name ?? "—"}
                        </div>
                      </td>
                      <td>
                        {isOverdue(t) ? <span className="overdue">{fmt(t.due)}</span> : fmt(t.due)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {openTask && <TaskModal task={openTask} onClose={() => setOpenTask(null)} />}
      {showNew && (
        <TaskModal
          defaultProjectId={project ? Number(project) : undefined}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  );
}
