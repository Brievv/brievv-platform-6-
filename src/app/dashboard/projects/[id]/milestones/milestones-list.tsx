"use client";

import { useState, useTransition } from "react";
import { Plus, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { formatCents } from "@/lib/utils";
import { createMilestone, toggleMilestoneComplete } from "./actions";

export interface MilestoneData {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completedAt: string | null;
  amountCents: number | null;
}

export function MilestonesList({ projectId, initialMilestones }: { projectId: string; initialMilestones: MilestoneData[] }) {
  const [milestones, setMilestones] = useState(initialMilestones);
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createMilestone(projectId, formData);
      if (res.ok) {
        setShowForm(false);
        window.location.reload();
      }
    });
  }

  function handleToggle(id: string, currentlyComplete: boolean) {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, completedAt: currentlyComplete ? null : new Date().toISOString() } : m)));
    startTransition(async () => {
      const res = await toggleMilestoneComplete(projectId, id, !currentlyComplete);
      if (!res.ok) setMilestones(initialMilestones);
    });
  }

  const totalCents = milestones.reduce((sum, m) => sum + (m.amountCents ?? 0), 0);
  const paidCents = milestones.filter((m) => m.completedAt).reduce((sum, m) => sum + (m.amountCents ?? 0), 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-steel">
          {totalCents > 0 ? (
            <span>
              <span className="font-mono text-ink">{formatCents(paidCents)}</span> of{" "}
              <span className="font-mono text-ink">{formatCents(totalCents)}</span> milestone value completed
            </span>
          ) : (
            <span>{milestones.length} milestone{milestones.length === 1 ? "" : "s"}</span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus size={15} /> New milestone
        </Button>
      </div>

      {showForm && (
        <form action={handleCreate} className="glass-surface mb-6 space-y-4 rounded-md p-6">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
            <div>
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0" placeholder="2500.00" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" isLoading={pending}>
              Create milestone
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {milestones.length === 0 ? (
        <p className="glass-surface rounded-md p-8 text-center text-sm text-steel">No milestones yet.</p>
      ) : (
        <div className="space-y-2.5">
          {milestones.map((m) => (
            <div key={m.id} className="glass-surface flex items-start gap-3 rounded-md p-4">
              <button type="button" onClick={() => handleToggle(m.id, Boolean(m.completedAt))} disabled={pending} className="mt-0.5 flex-none">
                {m.completedAt ? <CheckCircle2 size={19} className="text-success" /> : <Circle size={19} className="text-ink/25" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`font-medium ${m.completedAt ? "text-steel line-through" : "text-ink"}`}>{m.title}</div>
                {m.description && <p className="mt-1 text-sm text-steel">{m.description}</p>}
                <div className="mt-1.5 flex flex-wrap gap-3 font-mono text-xs text-steel">
                  {m.dueDate && <span>Due {new Date(m.dueDate).toLocaleDateString()}</span>}
                  {m.amountCents !== null && <span>{formatCents(m.amountCents)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
