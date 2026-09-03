"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { updateTaskStatusAdmin } from "./actions";

export interface AdminTaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  projectTitle: string;
  deadline: string | null;
}

const STATUSES = ["BACKLOG", "READY", "IN_PROGRESS", "REVIEW", "BLOCKED", "APPROVED", "COMPLETED"];

const PRIORITY_TONE: Record<string, "neutral" | "info" | "warning" | "danger"> = {
  LOW: "neutral",
  MEDIUM: "info",
  HIGH: "warning",
  URGENT: "danger",
};

export function AdminTasksList({ initial }: { initial: AdminTaskRow[] }) {
  const [rows, setRows] = useState(initial);
  const [pending, startTransition] = useTransition();

  function handleChange(id: string, status: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    startTransition(async () => {
      await updateTaskStatusAdmin(id, status);
    });
  }

  return (
    <div className="divide-y divide-ink/10 rounded-md border border-ink/10 bg-white">
      {rows.map((t) => (
        <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm">
          <div>
            <div className="text-ink">{t.title}</div>
            <Link href={`/dashboard/projects/${t.projectId}/tasks`} className="mono-label mt-0.5 block hover:text-orange">
              {t.projectTitle}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {t.deadline && <span className="font-mono text-xs text-steel">{new Date(t.deadline).toLocaleDateString()}</span>}
            <Badge tone={PRIORITY_TONE[t.priority] ?? "neutral"}>{t.priority}</Badge>
            <select
              value={t.status}
              onChange={(e) => handleChange(t.id, e.target.value)}
              disabled={pending}
              className="h-9 rounded border border-ink/15 bg-white px-2 text-xs text-ink"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
