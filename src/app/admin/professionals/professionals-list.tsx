"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approveProfessional, rejectProfessional, requestDocuments } from "./actions";

export interface ProfessionalRow {
  id: string;
  name: string;
  email: string;
  status: string;
  disciplines: string[];
  yearsExperience: number | null;
  licenseNumber: string | null;
}

const STATUS_TONE: Record<string, "neutral" | "info" | "success" | "warning" | "danger"> = {
  APPLIED: "neutral",
  UNDER_REVIEW: "warning",
  DOCUMENTS_REQUIRED: "warning",
  VERIFICATION_PENDING: "warning",
  VERIFIED: "info",
  ACTIVE: "success",
  PAUSED: "neutral",
  SUSPENDED: "danger",
  REJECTED: "danger",
};

export function ProfessionalsList({ initial }: { initial: ProfessionalRow[] }) {
  const [rows, setRows] = useState(initial);
  const [pending, startTransition] = useTransition();

  function act(id: string, fn: (id: string) => Promise<{ ok: boolean }>, optimisticStatus: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: optimisticStatus } : r)));
    startTransition(async () => {
      await fn(id);
    });
  }

  return (
    <div className="space-y-2.5">
      {rows.map((p) => (
        <div key={p.id} className="rounded-md border border-ink/10 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium text-ink">{p.name}</div>
              <div className="mono-label mt-0.5">{p.email}</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {p.disciplines.map((d) => (
                  <Badge key={d}>{d}</Badge>
                ))}
              </div>
              <div className="mt-1.5 text-xs text-steel">
                {p.yearsExperience ?? 0} yrs experience {p.licenseNumber ? `· License ${p.licenseNumber}` : "· No license on file"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={STATUS_TONE[p.status] ?? "neutral"}>{p.status.replace(/_/g, " ")}</Badge>
              {!["ACTIVE", "REJECTED"].includes(p.status) && (
                <div className="flex gap-1.5">
                  <Button size="sm" disabled={pending} onClick={() => act(p.id, approveProfessional, "ACTIVE")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => act(p.id, requestDocuments, "DOCUMENTS_REQUIRED")}>
                    Request docs
                  </Button>
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => act(p.id, rejectProfessional, "REJECTED")}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
