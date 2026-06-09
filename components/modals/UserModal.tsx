"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { useToast } from "@/app/providers";
import { useWorkspace } from "@/components/Workspace";
import { usersApi } from "@/lib/api";
import type { Role, User } from "@/lib/types";

const validEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

export function UserModal({
  user,
  onClose,
  onSaved,
}: {
  user?: User | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { refresh } = useWorkspace();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user?.role ?? "User");
  const [bad, setBad] = useState({ name: false, email: false, pw: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    // Editing an existing user only changes their role (the backend exposes no
    // name/email update); creation still validates the full form.
    if (!user) {
      const next = { name: !name.trim(), email: !validEmail(email.trim()), pw: password.length < 6 };
      setBad(next);
      if (Object.values(next).some(Boolean)) return;
    }
    setBusy(true);
    setErr("");
    try {
      if (user) {
        await usersApi.setRole(user.id, role);
      } else {
        await usersApi.create({ name: name.trim(), email: email.trim(), role, password });
      }
      await refresh();
      toast(user ? "Role updated" : "User created");
      onSaved?.();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={user ? "Edit user" : "Add user"} onClose={onClose}>
      {err && <div className="banner" style={{ display: "block" }}>{err}</div>}
      <div className={`field${bad.name ? " invalid" : ""}`}>
        <label>Full name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} disabled={!!user} />
        <div className="err">Name is required.</div>
      </div>
      <div className={`field${bad.email ? " invalid" : ""}`}>
        <label>Email *</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!user} />
        <div className="err">Enter a valid email.</div>
      </div>
      {!user && (
        <div className={`field${bad.pw ? " invalid" : ""}`}>
          <label>Password *</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="err">Min 6 characters.</div>
        </div>
      )}
      <div className="field">
        <label>Role *</label>
        <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="User">User</option>
          <option value="Admin">Admin</option>
        </select>
      </div>
      <div className="modal-foot">
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button className="btn primary" onClick={save} disabled={busy}>
          Save
        </button>
      </div>
    </Modal>
  );
}
