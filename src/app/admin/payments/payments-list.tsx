"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/utils";
import { refundPayment } from "./actions";

export interface PaymentRow {
  id: string;
  projectTitle: string;
  kind: string;
  status: string;
  amountCents: number;
  createdAt: string;
}

export function PaymentsList({ initial }: { initial: PaymentRow[] }) {
  const [rows, setRows] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRefund(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await refundPayment(id);
      if (!res.ok) setError(res.error ?? "Refund failed.");
      else setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "PARTIALLY_REFUNDED" } : r)));
    });
  }

  return (
    <div>
      {error && <p className="mb-4 font-mono text-xs text-danger">{error}</p>}
      <div className="divide-y divide-ink/10 rounded-md border border-ink/10 bg-white">
        {rows.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm">
            <div>
              <div className="text-ink">{p.projectTitle}</div>
              <div className="mono-label mt-0.5">{p.kind.replace(/_/g, " ")}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-ink">{formatCents(p.amountCents)}</span>
              <Badge tone={p.status === "PAID" ? "success" : p.status === "FAILED" ? "danger" : "neutral"}>{p.status}</Badge>
              {p.status === "PAID" && (
                <Button size="sm" variant="outline" disabled={pending} onClick={() => handleRefund(p.id)}>
                  Refund
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
