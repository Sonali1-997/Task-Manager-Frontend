"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { useWorkspace } from "@/components/Workspace";
import { Avatar, ProgressBar } from "@/components/ui";
import { ProjectModal } from "@/components/modals/ProjectModal";

export default function ProjectsPage() {
  const router = useRouter();
  const { me } = useAuth();
  const { loading, error, visibleProjects, tasks, userById } = useWorkspace();
  const [showNew, setShowNew] = useState(false);
  const isAdmin = me?.role === "Admin";

  if (loading) return <div className="loading">Loading projects…</div>;
  if (error) return <div className="view"><div className="panel">{error}</div></div>;

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <h1>Projects</h1>
          <div className="ph-sub">{visibleProjects.length} project(s)</div>
        </div>
        {isAdmin && (
          <button className="btn primary" onClick={() => setShowNew(true)}>
            + New project
          </button>
        )}
      </div>

      <div className="tablewrap">
        <div className="tablescroll">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Owner</th>
                <th>Tasks</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {visibleProjects.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--faint)", padding: 30 }}>
                    No records found
                  </td>
                </tr>
              )}
              {visibleProjects.map((p) => {
                const pts = tasks.filter((t) => t.projectId === p.id);
                const total = p.totalTasks ?? pts.length;
                const done = p.doneTasks ?? pts.filter((t) => t.status === "Done").length;
                const pct = p.progress ?? (total ? Math.round((done / total) * 100) : 0);
                const ownerName = p.ownerName ?? userById(p.ownerId)?.name ?? "—";
                return (
                  <tr key={p.id} className="clickable" onClick={() => router.push(`/projects/${p.id}`)}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>
                      <div className="cellname">
                        <Avatar name={ownerName} size={26} />
                        {ownerName}
                      </div>
                    </td>
                    <td>{total}</td>
                    <td>
                      <ProgressBar pct={pct} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && <ProjectModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
