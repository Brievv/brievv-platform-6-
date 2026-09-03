import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/features/notification-bell";

/**
 * This page renders `ROLE_PERMISSIONS` directly from `src/lib/rbac.ts` —
 * the same object every server action calls `assertCan()` against. There
 * is deliberately no separate "roles config" here: a roles page that
 * describes permissions different from what the code enforces would be
 * actively misleading. Changing what a role can do means editing
 * `rbac.ts`, which is a code change (spec §24 requires server-side
 * enforcement, not a database-editable permission table for now).
 */
export default function AdminRolesPage() {
  const roles = Object.entries(ROLE_PERMISSIONS) as [string, string[]][];

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">Roles &amp; permissions</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 space-y-4 p-6 lg:p-8">
        <p className="max-w-2xl text-sm text-steel">
          This reflects the actual permission matrix enforced in code (<code className="font-mono text-xs">src/lib/rbac.ts</code>) —
          not a separate description of it. Every permission listed here is independently checked server-side on
          every protected action, not just used to hide UI.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map(([role, perms]) => (
            <div key={role} className="rounded-md border border-ink/10 bg-white p-5">
              <div className="font-medium text-ink">{role.replace(/_/g, " ")}</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {perms.length === 0 ? (
                  <span className="text-xs text-steel">No elevated permissions</span>
                ) : (
                  perms.map((p) => <Badge key={p}>{p}</Badge>)
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
