import type { Task } from "@/lib/types";
import { TODAY } from "@/lib/types";

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

export const fmt = (d: string) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "—";

export const isOverdue = (t: Task) =>
  t.status !== "Done" && !!t.due && new Date(t.due) < new Date(TODAY);

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");
