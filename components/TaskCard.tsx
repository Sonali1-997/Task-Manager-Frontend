"use client";

import { Avatar, PriorityPill } from "@/components/ui";
import { fmt, isOverdue, cx } from "@/lib/ui";
import type { Task } from "@/lib/types";

export function TaskCard({
  task,
  assigneeName,
  onClick,
  draggable,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  task: Task;
  assigneeName: string;
  onClick?: () => void;
  draggable?: boolean;
  dragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  return (
    <div
      className={cx("tcard", task.status === "Done" && "done", dragging && "dragging")}
      draggable={draggable}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <PriorityPill value={task.priority} />
      <div className="tt">{task.title}</div>
      <div className="tmeta">
        <span>
          {isOverdue(task) ? <span className="overdue">⚠ Overdue</span> : `📅 ${fmt(task.due)}`}
        </span>
        <Avatar name={assigneeName} size={21} />
      </div>
    </div>
  );
}
