"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createDiscipline, toggleDisciplineActive } from "./actions";

export interface DisciplineRow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  serviceCount: number;
}

export function ServicesList({ initial }: { initial: DisciplineRow[] }) {
  const [rows, setRows] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createDiscipline(formData);
      if (res.ok) {
        setShowForm(false);
        window.location.reload();
      }
    });
  }

  function handleToggle(id: string, isActive: boolean) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isActive } : r)));
    startTransition(async () => {
      await toggleDisciplineActive(id, isActive);
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-steel">{rows.length} discipline{rows.length === 1 ? "" : "s"}</p>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          + New discipline
        </Button>
      </div>

      {showForm && (
        <form action={handleCreate} className="glass-surface mb-6 space-y-4 rounded-md p-6">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="Landscape Architecture" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <Button type="submit" isLoading={pending}>
            Create discipline
          </Button>
        </form>
      )}

      <div className="divide-y divide-ink/10 rounded-md border border-ink/10 bg-white">
        {rows.map((d) => (
          <div key={d.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
            <div>
              <div className="text-ink">{d.name}</div>
              {d.description && <div className="mt-0.5 text-xs text-steel">{d.description}</div>}
            </div>
            <div className="flex items-center gap-3">
              <Badge>{d.serviceCount} service{d.serviceCount === 1 ? "" : "s"}</Badge>
              <Badge tone={d.isActive ? "success" : "neutral"}>{d.isActive ? "Active" : "Inactive"}</Badge>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => handleToggle(d.id, !d.isActive)}>
                {d.isActive ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
