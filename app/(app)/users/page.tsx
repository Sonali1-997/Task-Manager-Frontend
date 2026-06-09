"use client";

import { useState } from "react";
import { useAuth, useToast } from "@/app/providers";
import { useWorkspace } from "@/components/Workspace";
import { Avatar } from "@/components/ui";
import { EditIcon, TrashIcon } from "@/components/icons";
import { UserModal } from "@/components/modals/UserModal";
import { usersApi } from "@/lib/api";
import type { User } from "@/lib/types";

export default function UsersPage() {
  const { me } = useAuth();
  const toast = useToast();
  const { loading, error, users, refresh } = useWorkspace();
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showNew, setShowNew] = useState(false);

  if (me?.role !== "Admin")
    return (
      <div className="view">
        <div className="panel">You don&apos;t have access to user management.</div>
      </div>
    );

  if (loading) return <div className="loading">Loading users…</div>;
  if (error) return <div className="view"><div className="panel">{error}</div></div>;

  async function del(id: number) {
    if (id === me?.id) {
      toast("Can't delete yourself");
      return;
    }
    await usersApi.remove(id);
    await refresh();
    toast("User deleted");
  }

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <div className="ph-sub">Manage team access and roles</div>
        </div>
        <button className="btn primary" onClick={() => setShowNew(true)}>
          + Add user
        </button>
      </div>

      <div className="tablewrap">
        <div className="tablescroll">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="cellname">
                      <Avatar name={u.name} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ color: "var(--faint)", fontSize: 12 }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`pill s-${u.role.toLowerCase()}`}>{u.role}</span>
                  </td>
                  <td>
                    <span
                      className="dot"
                      style={{ background: u.status === "Active" ? "var(--green)" : "var(--faint)" }}
                    />
                    {u.status}
                  </td>
                  <td>
                    <div className="rowact">
                      <span onClick={() => setEditUser(u)} title="Edit" style={{ display: "inline-flex" }}>
                        <EditIcon />
                      </span>
                      <span onClick={() => del(u.id)} title="Delete" style={{ display: "inline-flex" }}>
                        <TrashIcon />
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && <UserModal onClose={() => setShowNew(false)} />}
      {editUser && <UserModal user={editUser} onClose={() => setEditUser(null)} />}
    </div>
  );
}
