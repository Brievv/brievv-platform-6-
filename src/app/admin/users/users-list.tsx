"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { changeUserRole, toggleUserActive } from "./actions";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLES = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER", "PROFESSIONAL", "CLIENT", "SUPPORT_AGENT"];

export function UsersList({ initial, currentUserId }: { initial: UserRow[]; currentUserId: string }) {
  const [rows, setRows] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRoleChange(userId: string, role: string) {
    setError(null);
    setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, role } : r)));
    startTransition(async () => {
      const res = await changeUserRole(userId, role);
      if (!res.ok) {
        setError(res.error ?? "Could not change role.");
        setRows(initial);
      }
    });
  }

  function handleToggleActive(userId: string, isActive: boolean) {
    setError(null);
    setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, isActive } : r)));
    startTransition(async () => {
      const res = await toggleUserActive(userId, isActive);
      if (!res.ok) {
        setError(res.error ?? "Could not update user.");
        setRows(initial);
      }
    });
  }

  return (
    <div>
      {error && <p className="mb-4 font-mono text-xs text-danger">{error}</p>}
      <div className="divide-y divide-ink/10 rounded-md border border-ink/10 bg-white">
        {rows.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm">
            <div>
              <div className="font-medium text-ink">{u.name}</div>
              <div className="mono-label mt-0.5">{u.email}</div>
            </div>
            <div className="flex items-center gap-2">
              {!u.isActive && <Badge tone="danger">Deactivated</Badge>}
              <select
                value={u.role}
                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                disabled={pending || u.id === currentUserId}
                className="h-9 rounded border border-ink/15 bg-white px-2 text-xs text-ink disabled:opacity-50"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              {u.id !== currentUserId && (
                <Button size="sm" variant="outline" disabled={pending} onClick={() => handleToggleActive(u.id, !u.isActive)}>
                  {u.isActive ? "Deactivate" : "Reactivate"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
