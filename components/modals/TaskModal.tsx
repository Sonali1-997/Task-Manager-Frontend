"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { useAuth, useToast } from "@/app/providers";
import { useWorkspace } from "@/components/Workspace";
import { tasksApi } from "@/lib/api";
import { STATUSES, PRIORITIES } from "@/lib/types";
import type { Task, TaskStatus, Priority } from "@/lib/types";

export function TaskModal({
  task,
  defaultProjectId,
  onClose,
  onSaved,
}: {
  task?: Task | null;
  defaultProjectId?: number;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { me } = useAuth();
  const { users, projects, refresh } = useWorkspace();
  const toast = useToast();

  const isAdmin = me?.role === "Admin";
  // A non-admin may still change the status of an existing task, but not edit
  // its other fields. Creating a task is always fully editable.
  const canEdit = isAdmin || !task;

  const [title, setTitle] = useState(task?.title ?? "");
  const [desc, setDesc] = useState(task?.desc ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "To Do");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "Medium");
  const [due, setDue] = useState(task?.due ?? "");
  const [assigneeId, setAssigneeId] = useState<number>(task?.assigneeId ?? me!.id);
  const [projectId, setProjectId] = useState<number>(
    task?.projectId ?? defaultProjectId ?? projects[0]?.id ?? 0,
  );
  const [titleBad, setTitleBad] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (canEdit && !title.trim()) {
      setTitleBad(true);
      return;
    }
    setBusy(true);
    setErr("");
    try {
      if (task) {
        // Status-only update for non-admins; full update otherwise.
        const patch = canEdit
          ? { title: title.trim(), desc: desc.trim(), status, priority, due, assigneeId, projectId }
          : { status };
        await tasksApi.update(task.id, patch);
      } else {
        await tasksApi.create({
          title: title.trim(),
          desc: desc.trim(),
          status,
          priority,
          due,
          assigneeId,
          projectId,
        });
      }
      await refresh();
      toast("Task saved");
      onSaved?.();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!task) return;
    setBusy(true);
    try {
      await tasksApi.remove(task.id);
      await refresh();
      toast("Task deleted");
      onSaved?.();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
      setBusy(false);
    }
  }

  return (
    <Modal title={task ? "Task details" : "New task"} onClose={onClose}>
      {err && <div className="banner" style={{ display: "block" }}>{err}</div>}
      <div className={`field${titleBad ? " invalid" : ""}`}>
        <label>Title *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={!canEdit} />
        <div className="err">Title is required.</div>
      </div>
      <div className="field">
        <label>Description</label>
        <textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} disabled={!canEdit} />
      </div>
      <div className="two">
        <div className="field">
          <label>Status *</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Priority *</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            disabled={!canEdit}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="two">
        <div className="field">
          <label>Due date</label>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} disabled={!canEdit} />
        </div>
        <div className="field">
          <label>Assigned user *</label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(Number(e.target.value))}
            disabled={!canEdit}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Project *</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(Number(e.target.value))}
          disabled={!canEdit || !!task}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="modal-foot">
        {task && isAdmin && (
          <button className="btn danger" style={{ marginRight: "auto" }} onClick={del} disabled={busy}>
            Delete
          </button>
        )}
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button className="btn primary" onClick={save} disabled={busy}>
          {canEdit ? "Save" : "Update status"}
        </button>
      </div>
    </Modal>
  );
}
