"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils";
import { createPricingRule, toggleRuleActive } from "./actions";

export interface PricingRuleRow {
  id: string;
  name: string;
  disciplineSlug: string | null;
  basePriceCents: number;
  platformMarginPercent: number;
  isActive: boolean;
}

export function PricingRulesList({ initial }: { initial: PricingRuleRow[] }) {
  const [rows, setRows] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createPricingRule(formData);
      if (res.ok) {
        setShowForm(false);
        window.location.reload();
      }
    });
  }

  function handleToggle(id: string, isActive: boolean) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isActive } : r)));
    startTransition(async () => {
      await toggleRuleActive(id, isActive);
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="max-w-lg text-sm text-steel">
          These rules feed directly into the live estimator (`src/server/services/ai/estimator.ts`) — the base price
          and margin an active rule sets are what every new brief is priced against, no redeploy required.
        </p>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          + New rule
        </Button>
      </div>

      {showForm && (
        <form action={handleCreate} className="glass-surface mb-6 space-y-4 rounded-md p-6">
          <div>
            <Label htmlFor="name">Rule name</Label>
            <Input id="name" name="name" required placeholder="Default global pricing" />
          </div>
          <div>
            <Label htmlFor="disciplineSlug">Discipline slug (optional — blank applies globally)</Label>
            <Input id="disciplineSlug" name="disciplineSlug" placeholder="structural-engineering" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="basePrice">Base price (USD)</Label>
              <Input id="basePrice" name="basePrice" type="number" step="0.01" min="0" defaultValue="800" required />
            </div>
            <div>
              <Label htmlFor="margin">Platform margin (%)</Label>
              <Input id="margin" name="margin" type="number" step="0.1" min="0" defaultValue="20" required />
            </div>
          </div>
          <Button type="submit" isLoading={pending}>
            Create rule
          </Button>
        </form>
      )}

      <div className="divide-y divide-ink/10 rounded-md border border-ink/10 bg-white">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
            <div>
              <div className="text-ink">{r.name}</div>
              <div className="mono-label mt-0.5">{r.disciplineSlug ?? "Global"}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-steel">
                {formatCents(r.basePriceCents)} base · {r.platformMarginPercent}% margin
              </span>
              <Badge tone={r.isActive ? "success" : "neutral"}>{r.isActive ? "Active" : "Inactive"}</Badge>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => handleToggle(r.id, !r.isActive)}>
                {r.isActive ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
