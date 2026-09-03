"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { respondToAssignment } from "./actions";

export interface AssignmentData {
  id: string;
  projectTitle: string;
  roleOnProject: string;
  status: string;
  matchScore: number | null;
}

export function AssignmentsList({ initial }: { initial: AssignmentData[] }) {
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();

  function respond(id: string, accept: boolean) {
    startTransition(async () => {
      const res = await respondToAssignment(id, accept);
      if (res.ok) {
        setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status: accept ? "ACCEPTED" : "DECLINED" } : a)));
      }
    });
  }

  if (items.length === 0) {
    return <p className="glass-surface rounded-md p-8 text-center text-sm text-steel">No assignments yet.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((a) => (
        <div key={a.id} className="glass-surface flex flex-wrap items-center justify-between gap-3 rounded-md p-5">
          <div>
            <div className="font-medium text-ink">{a.projectTitle}</div>
            <div className="mono-label mt-1">
              {a.roleOnProject} {a.matchScore !== null && `· Match ${a.matchScore}%`}
            </div>
          </div>
          {a.status === "PROPOSED" ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => respond(a.id, true)} isLoading={pending}>
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => respond(a.id, false)} disabled={pending}>
                Decline
              </Button>
            </div>
          ) : (
            <Badge tone={a.status === "ACCEPTED" ? "success" : "neutral"}>{a.status}</Badge>
          )}
        </div>
      ))}
    </div>
  );
}
