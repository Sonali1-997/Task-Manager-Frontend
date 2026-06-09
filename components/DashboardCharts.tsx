"use client";

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import { STATUSES, PRIORITIES } from "@/lib/types";
import type { Project, Task } from "@/lib/types";

ChartJS.register(
  ArcElement,
  BarElement,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
);

const MUTED = "#6f6e68";
const GRID = "rgba(0,0,0,.05)";

export function DashboardCharts({ tasks, projects }: { tasks: Task[]; projects: Project[] }) {
  const countBy = <K extends keyof Task>(key: K, value: Task[K]) =>
    tasks.filter((t) => t[key] === value).length;

  const statusData = STATUSES.map((s) => countBy("status", s));
  const priorityData = PRIORITIES.map((p) => countBy("priority", p));
  const trend = [4, 7, 9, 14, 22, tasks.length];
  const projData = projects.map((p) => tasks.filter((t) => t.projectId === p.id).length);

  return (
    <>
      <div className="chart-grid" style={{ marginBottom: 14 }}>
        <div className="panel">
          <div className="panel-title">Tasks by status</div>
          <div className="chart-box">
            <Doughnut
              data={{
                labels: STATUSES,
                datasets: [
                  { data: statusData, backgroundColor: ["#a8a59a", "#3f86d6", "#1d9e75"], borderWidth: 0 },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                cutout: "62%",
                plugins: {
                  legend: { position: "right", labels: { boxWidth: 10, font: { size: 12 }, color: MUTED } },
                },
              }}
            />
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">Tasks by priority</div>
          <div className="chart-box">
            <Bar
              data={{
                labels: PRIORITIES,
                datasets: [
                  { data: priorityData, backgroundColor: ["#97c459", "#ef9f27", "#e24b4a"], borderRadius: 5 },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { color: MUTED } },
                  y: { grid: { color: GRID }, ticks: { color: MUTED, precision: 0 }, beginAtZero: true },
                },
              }}
            />
          </div>
        </div>
      </div>
      <div className="chart-grid">
        <div className="panel">
          <div className="panel-title">Monthly task trend</div>
          <div className="chart-box">
            <Line
              data={{
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                datasets: [
                  {
                    data: trend,
                    borderColor: "#1f5fa8",
                    backgroundColor: "rgba(31,95,168,.12)",
                    fill: true,
                    tension: 0.35,
                    pointRadius: 3,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { color: MUTED } },
                  y: { grid: { color: GRID }, ticks: { color: MUTED, precision: 0 }, beginAtZero: true },
                },
              }}
            />
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">Tasks by project</div>
          <div className="chart-box">
            <Bar
              data={{
                labels: projects.map((p) => p.name.split(" ")[0]),
                datasets: [{ data: projData, backgroundColor: "#7f77dd", borderRadius: 5 }],
              }}
              options={{
                indexAxis: "y",
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { color: GRID }, ticks: { color: MUTED, precision: 0 }, beginAtZero: true },
                  y: { grid: { display: false }, ticks: { color: MUTED } },
                },
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
