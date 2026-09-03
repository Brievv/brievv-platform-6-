"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { decideApproval } from "./actions";

export interface ApprovalData {
  id: string;
  subjectType: string;
  title: string;
  status: string;
  createdAt: string;
}

export function ApprovalsList({ projectId, initial, canDecide }: { projectId: string; initial: ApprovalData[]; canDecide: boolean }) {
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();

  function decide(id: string, approve: boolean) {
    startTransition(async () => {
      const res = await decideApproval(projectId, id, approve);
      if (res.ok) setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status: approve ? "APPROVED" : "REJECTED" } : a)));
    });
  }

  if (items.length === 0) {
    return <p className="glass-surface rounded-md p-8 text-center text-sm text-steel">No approvals requested.</p>;
  }

  return (
    <div className="space-y-2.5">
      {items.map((a) => (
        <div key={a.id} className="glass-surface flex items-center justify-between gap-3 rounded-md p-4">
          <div>
            <div className="font-medium text-ink">{a.title}</div>
            <div className="mono-label mt-0.5">{a.subjectType}</div>
          </div>
          {a.status === "PENDING" && canDecide ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => decide(a.id, true)} isLoading={pending}>
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => decide(a.id, false)} disabled={pending}>
                Reject
              </Button>
            </div>
          ) : (
            <Badge tone={a.status === "APPROVED" ? "success" : a.status === "REJECTED" ? "danger" : "warning"}>{a.status}</Badge>
          )}
        </div>
      ))}
    </div>
  );
}
