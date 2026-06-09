"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useToast } from "@/app/providers";
import { useWorkspace } from "@/components/Workspace";
import { Avatar, PriorityPill } from "@/components/ui";
import { TaskModal } from "@/components/modals/TaskModal";
import { meApi } from "@/lib/api";
import { fmt, isOverdue } from "@/lib/ui";
import type { Project, Task } from "@/lib/types";

export default function ProfilePage() {
  const { me, setMe } = useAuth();
  const { projectById } = useWorkspace();
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(me?.name ?? "");
  const [email, setEmail] = useState(me?.email ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErr, setProfileErr] = useState("");

  const [current, setCurrent] = useState("");
  const [np, setNp] = useState("");
  const [cp, setCp] = useState("");
  const [pwBad, setPwBad] = useState({ cur: false, np: false, cp: false });
  const [pwErr, setPwErr] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [openTask, setOpenTask] = useState<Task | null>(null);

  // Load the signed-in user's assigned tasks and projects from the backend.
  useEffect(() => {
    let active = true;
    Promise.all([meApi.tasks(), meApi.projects()])
      .then(([t, p]) => {
        if (!active) return;
        setMyTasks(t);
        setMyProjects(p);
      })
      .catch(() => {
        /* leave lists empty on failure */
      })
      .finally(() => {
        if (active) setListsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!me) return null;

  // Resolve a project name from the workspace directory, falling back to the
  // user's own project list.
  const projectName = (id: number) =>
    projectById(id)?.name ?? myProjects.find((p) => p.id === id)?.name ?? "—";

  async function saveProfile() {
    setSavingProfile(true);
    setProfileErr("");
    try {
      await meApi.updateProfile({ name: name.trim(), email: email.trim() });
      setMe({ ...me!, name: name.trim(), email: email.trim() });
      toast("Profile saved");
    } catch (e) {
      setProfileErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePw() {
    const bad = { cur: !current, np: np.length < 6, cp: np !== cp || !cp };
    setPwBad(bad);
    if (bad.cur || bad.np || bad.cp) return;
    setSavingPw(true);
    setPwErr("");
    try {
      await meApi.updateProfile({ currentPassword: current, newPassword: np });
      setCurrent("");
      setNp("");
      setCp("");
      toast("Password updated");
    } catch (e) {
      setPwErr(e instanceof Error ? e.message : "Could not update password");
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="view">
      <div className="page-head">
        <h1>Profile</h1>
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <Avatar name={name || me.name} size={52} />
          <button className="btn sm">Change photo</button>
        </div>
        {profileErr && <div className="banner" style={{ display: "block" }}>{profileErr}</div>}
        <div className="two">
          <div className="field">
            <label>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="field" style={{ maxWidth: 240 }}>
          <label>Role</label>
          <input value={me.role} disabled />
        </div>
        <div className="modal-foot">
          <button className="btn primary" onClick={saveProfile} disabled={savingProfile}>
            Save changes
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-title">My tasks</div>
        {listsLoading ? (
          <div style={{ color: "var(--faint)", padding: "8px 0" }}>Loading tasks…</div>
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
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {myTasks.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "var(--faint)", padding: 30 }}>
                        No tasks assigned to you
                      </td>
                    </tr>
                  )}
                  {myTasks.map((t) => (
                    <tr key={t.id} className="clickable" onClick={() => setOpenTask(t)}>
                      <td style={{ fontWeight: 600 }}>{t.title}</td>
                      <td>
                        <PriorityPill value={t.priority} />
                      </td>
                      <td>{t.status}</td>
                      <td>{projectName(t.projectId)}</td>
                      <td>{isOverdue(t) ? <span className="overdue">{fmt(t.due)}</span> : fmt(t.due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-title">My projects</div>
        {listsLoading ? (
          <div style={{ color: "var(--faint)", padding: "8px 0" }}>Loading projects…</div>
        ) : (
          <div className="tablewrap">
            <div className="tablescroll">
              <table className="data">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {myProjects.length === 0 && (
                    <tr>
                      <td colSpan={2} style={{ textAlign: "center", color: "var(--faint)", padding: 30 }}>
                        You&apos;re not part of any projects yet
                      </td>
                    </tr>
                  )}
                  {myProjects.map((p) => (
                    <tr
                      key={p.id}
                      className="clickable"
                      onClick={() => router.push(`/projects/${p.id}`)}
                    >
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ color: "var(--faint)" }}>{p.desc || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-title">Change password</div>
        {pwErr && <div className="banner" style={{ display: "block" }}>{pwErr}</div>}
        <div className="two">
          <div className={`field${pwBad.cur ? " invalid" : ""}`}>
            <label>Current</label>
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            <div className="err">Current password is required.</div>
          </div>
          <div />
        </div>
        <div className="two">
          <div className={`field${pwBad.np ? " invalid" : ""}`}>
            <label>New password</label>
            <input type="password" value={np} onChange={(e) => setNp(e.target.value)} />
            <div className="err">Min 6 characters.</div>
          </div>
          <div className={`field${pwBad.cp ? " invalid" : ""}`}>
            <label>Confirm</label>
            <input type="password" value={cp} onChange={(e) => setCp(e.target.value)} />
            <div className="err">Passwords must match.</div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={changePw} disabled={savingPw}>
            {savingPw ? "Updating…" : "Update password"}
          </button>
        </div>
      </div>

      {openTask && <TaskModal task={openTask} onClose={() => setOpenTask(null)} />}
    </div>
  );
}
