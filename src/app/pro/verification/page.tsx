import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerificationUpload } from "./verification-upload";

export default async function ProVerificationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;

  const profile = await db.professionalProfile.findUnique({ where: { userId }, include: { verification: true } });
  if (!profile) redirect("/pro");

  return (
    <div>
      <DashboardTopbar title="Verification" />
      <div className="mx-auto max-w-xl space-y-6 px-6 py-10">
        <Card>
          <CardBody className="flex items-center justify-between">
            <span className="mono-label">Current status</span>
            <Badge>{profile.status.replace(/_/g, " ")}</Badge>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mono-label mb-4">Upload verification documents</h2>
            <p className="mb-4 text-sm text-steel">
              Licenses, certifications, or ID as requested by BRIEVV's ops team. Documents are private and never
              shown publicly on your profile.
            </p>
            <VerificationUpload />
            {profile.verification && (
              <p className="mt-4 font-mono text-xs text-steel">
                {profile.verification.documentsStorageKeys.length} document(s) on file.
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
