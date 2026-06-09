"use client";

import { useAuth } from "@/app/providers";
import { useWorkspace } from "@/components/Workspace";
import { DashboardCharts } from "@/components/DashboardCharts";
import { isOverdue } from "@/lib/ui";

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="stat">
      <div className="lbl">{label}</div>
      <div className="num" style={{ color: color ?? "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { me } = useAuth();
  const { loading, error, visibleTasks, visibleProjects } = useWorkspace();

  if (loading) return <div className="loading">Loading dashboard…</div>;
  if (error) return <div className="view"><div className="panel">{error}</div></div>;

  const total = visibleTasks.length;
  const done = visibleTasks.filter((t) => t.status === "Done").length;
  const inProgress = visibleTasks.filter((t) => t.status === "In Progress").length;
  const overdue = visibleTasks.filter(isOverdue).length;
  const role = me?.role ?? "User";
  const isAdmin = role === "Admin";

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <div className="ph-sub">
            {isAdmin ? "Overview across all projects" : "Your assigned work"}
          </div>
        </div>
        <span className={`pill s-${role.toLowerCase()}`}>{role}</span>
      </div>

      <div className="stat-grid">
        <Stat label="Projects" value={visibleProjects.length} />
        <Stat label="Total tasks" value={total} />
        <Stat label="Completed" value={done} color="var(--green)" />
        <Stat label="In progress" value={inProgress} color="var(--accent)" />
        <Stat label="Overdue" value={overdue} color="var(--red)" />
      </div>

      <DashboardCharts tasks={visibleTasks} projects={visibleProjects} />
    </div>
  );
}
