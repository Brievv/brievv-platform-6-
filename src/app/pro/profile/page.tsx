import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";

export default async function ProProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;

  const profile = await db.professionalProfile.findUnique({ where: { userId } });
  if (!profile) redirect("/pro");

  return (
    <div>
      <DashboardTopbar title="Profile" />
      <div className="mx-auto max-w-lg px-6 py-10">
        <Card>
          <CardBody>
            <ProfileForm
              defaults={{
                title: profile.title ?? "",
                bio: profile.bio ?? "",
                yearsExperience: profile.yearsExperience ?? 0,
                hourlyRate: profile.hourlyRateCents ? (profile.hourlyRateCents / 100).toFixed(2) : "",
                portfolioUrl: profile.portfolioUrl ?? "",
                jurisdictions: profile.jurisdictions.join(", "),
                softwareSkills: profile.softwareSkills.join(", "),
                timezone: profile.timezone ?? "",
              }}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
