"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { updateTicketStatus } from "./actions";

export interface TicketRow {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export function SupportTicketsList({ initial }: { initial: TicketRow[] }) {
  const [rows, setRows] = useState(initial);
  const [pending, startTransition] = useTransition();

  function handleChange(id: string, status: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    startTransition(async () => {
      await updateTicketStatus(id, status);
    });
  }

  return (
    <div className="space-y-2.5">
      {rows.map((t) => (
        <div key={t.id} className="rounded-md border border-ink/10 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge>{t.category.replace(/_/g, " ")}</Badge>
                <span className="font-medium text-ink">{t.subject}</span>
              </div>
              <p className="mt-1.5 whitespace-pre-line text-sm text-steel">{t.message}</p>
            </div>
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
