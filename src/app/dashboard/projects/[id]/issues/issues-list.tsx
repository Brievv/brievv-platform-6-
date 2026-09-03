"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { raiseIssue, updateIssueStatus } from "./actions";

export interface IssueData {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
}

const SEVERITY_TONE: Record<string, "neutral" | "info" | "warning" | "danger"> = {
  LOW: "neutral",
  MEDIUM: "info",
  HIGH: "warning",
  CRITICAL: "danger",
};

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "WONT_FIX"];

export function IssuesList({ projectId, initial }: { projectId: string; initial: IssueData[] }) {
  const [issues, setIssues] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await raiseIssue(projectId, formData);
      if (res.ok) {
        setShowForm(false);
        window.location.reload();
      }
    });
  }

  function handleStatusChange(id: string, status: string) {
    setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    startTransition(async () => {
      await updateIssueStatus(projectId, id, status);
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-steel">{issues.length} issue{issues.length === 1 ? "" : "s"}</p>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus size={15} /> Raise issue
        </Button>
      </div>

      {showForm && (
        <form action={handleCreate} className="glass-surface mb-6 space-y-4 rounded-md p-6">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Site photos don't match the survey" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <div>
            <Label htmlFor="severity">Severity</Label>
            <select id="severity" name="severity" defaultValue="MEDIUM" className="h-11 w-full rounded border border-ink/15 bg-white px-3.5 text-sm text-ink">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <Button type="submit" isLoading={pending}>
            Raise issue
          </Button>
        </form>
      )}

      {issues.length === 0 ? (
        <p className="glass-surface rounded-md p-8 text-center text-sm text-steel">No issues raised.</p>
      ) : (
        <div className="space-y-2.5">
          {issues.map((i) => (
            <div key={i.id} className="glass-surface rounded-md p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-ink">{i.title}</div>
                  {i.description && <p className="mt-1 text-sm text-steel">{i.description}</p>}
                </div>
                <Badge tone={SEVERITY_TONE[i.severity] ?? "neutral"}>{i.severity}</Badge>
              </div>
              <select
                value={i.status}
                onChange={(e) => handleStatusChange(i.id, e.target.value)}
                disabled={pending}
                className="mt-3 h-8 rounded border border-ink/15 bg-white px-2 text-xs text-ink"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
