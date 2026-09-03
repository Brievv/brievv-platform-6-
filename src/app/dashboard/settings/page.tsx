import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import { MfaSettings } from "./mfa-settings";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/sign-in");

  return (
    <div>
      <DashboardTopbar title="Settings" />
      <div className="mx-auto max-w-lg space-y-6 px-6 py-10">
        <Card>
          <CardBody>
            <ProfileForm name={user.name} email={user.email} phone={user.phone ?? ""} timezone={user.timezone} />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mono-label mb-4">Security</h2>
            <MfaSettings initialEnabled={user.mfaEnabled} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
