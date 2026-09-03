import { db } from "@/lib/db";
import { ProfessionalsList, type ProfessionalRow } from "./professionals-list";
import { NotificationBell } from "@/components/features/notification-bell";

export default async function AdminProfessionalsPage() {
  const profiles = await db.professionalProfile.findMany({
    include: { user: true, disciplines: { include: { discipline: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows: ProfessionalRow[] = profiles.map((p: any) => ({
    id: p.id,
    name: p.user.name,
    email: p.user.email,
    status: p.status,
    disciplines: p.disciplines.map((d: any) => d.discipline.name),
    yearsExperience: p.yearsExperience,
    licenseNumber: p.licenseNumber,
  }));

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">Professionals</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 p-6 lg:p-8">
        {rows.length === 0 ? (
          <p className="text-sm text-steel">No applications yet.</p>
        ) : (
          <ProfessionalsList initial={rows} />
        )}
      </main>
    </>
  );
}
