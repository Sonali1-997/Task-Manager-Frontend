"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { useAuth, useToast } from "@/app/providers";
import { useWorkspace } from "@/components/Workspace";
import { projectsApi } from "@/lib/api";
import type { Project } from "@/lib/types";

export function ProjectModal({
  project,
  onClose,
  onSaved,
}: {
  project?: Project | null;
  onClose: () => void;
  onSaved?: (p: Project) => void;
}) {
  const { me } = useAuth();
  const { refresh } = useWorkspace();
  const toast = useToast();
  const [name, setName] = useState(project?.name ?? "");
  const [desc, setDesc] = useState(project?.desc ?? "");
  const [nameBad, setNameBad] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (!name.trim()) {
      setNameBad(true);
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const saved = project
        ? await projectsApi.update(project.id, { name: name.trim(), desc: desc.trim() })
        : await projectsApi.create({ name: name.trim(), desc: desc.trim(), ownerId: me!.id });
      await refresh();
      toast("Project saved");
      onSaved?.(saved);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={project ? "Edit project" : "New project"} onClose={onClose}>
      {err && <div className="banner" style={{ display: "block" }}>{err}</div>}
      <div className={`field${nameBad ? " invalid" : ""}`}>
        <label>Name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <div className="err">Name is required.</div>
      </div>
      <div className="field">
        <label>Description</label>
        <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
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
