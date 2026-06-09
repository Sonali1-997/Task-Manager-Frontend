"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useToast } from "@/app/providers";
import { useWorkspace } from "@/components/Workspace";
import { TaskCard } from "@/components/TaskCard";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { TaskModal } from "@/components/modals/TaskModal";
import { projectsApi } from "@/lib/api";
import { STATUSES } from "@/lib/types";
import { fmt } from "@/lib/ui";
import type { Task } from "@/lib/types";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const toast = useToast();
  const { me } = useAuth();
  const { loading, error, projectById, tasks, userById, refresh } = useWorkspace();

  const [editing, setEditing] = useState(false);
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const isAdmin = me?.role === "Admin";

  if (loading) return <div className="loading">Loading project…</div>;
  if (error) return <div className="view"><div className="panel">{error}</div></div>;

  const project = projectById(id);
  if (!project)
    return (
      <div className="view">
        <a className="back" onClick={() => router.push("/projects")}>
          ← Projects
        </a>
        <div className="panel">Project not found.</div>
      </div>
    );

  const pts = tasks.filter((t) => t.projectId === id);
  const ownerName = project.ownerName ?? userById(project.ownerId)?.name ?? "—";

  async function del() {
    await projectsApi.remove(id);
    await refresh();
    toast("Project deleted");
    router.push("/projects");
  }

  return (
    <div className="view">
      <a className="back" onClick={() => router.push("/projects")}>
        ← Projects
      </a>
      <div className="page-head">
        <div>
          <h1>{project.name}</h1>
          <div className="ph-sub">{project.desc}</div>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button className="btn danger" onClick={del}>
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="detail-meta">
        <div>
          <div className="k">Owner</div>
          <div className="v">{ownerName}</div>
        </div>
        <div>
          <div className="k">Created</div>
          <div className="v">{fmt(project.created)}</div>
        </div>
        <div>
          <div className="k">Tasks</div>
          <div className="v">{project.totalTasks ?? pts.length}</div>
        </div>
      </div>

      <div className="board">
        {STATUSES.map((s) => {
          const colTasks = pts.filter((t) => t.status === s);
          return (
            <div className="col" key={s}>
              <div className="col-head">
                <span>{s.toUpperCase()}</span>
                <span>{colTasks.length}</span>
              </div>
              {colTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  assigneeName={userById(t.assigneeId)?.name ?? "—"}
                  onClick={() => setOpenTask(t)}
                />
              ))}
            </div>
          );
        })}
      </div>

      {editing && <ProjectModal project={project} onClose={() => setEditing(false)} />}
      {openTask && <TaskModal task={openTask} onClose={() => setOpenTask(null)} />}
    </div>
  );
}
