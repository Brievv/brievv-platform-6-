import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { completeOnboarding } from "./actions";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Logo href={null} className="mx-auto" />
        <h1 className="mt-8 text-center font-display text-2xl font-medium text-ink">
          Welcome to BRIEVV, {session.user.name?.split(" ")[0] ?? "there"}.
        </h1>
        <p className="mt-2 text-center text-sm text-steel">A couple of quick details, then you're set.</p>

        <Card className="mt-8">
          <CardBody>
            <form action={completeOnboarding} className="space-y-5">
              <div>
                <Label htmlFor="companyName">Company (optional)</Label>
                <Input id="companyName" name="companyName" placeholder="Rivera Development" />
              </div>
              <div>
                <Label htmlFor="jobTitle">Your role (optional)</Label>
                <Input id="jobTitle" name="jobTitle" placeholder="Project Manager, Owner, Architect..." />
              </div>

              <fieldset>
                <legend className="mono-label mb-2">What brings you to BRIEVV?</legend>
                <div className="space-y-2">
                  <RadioOption name="projectInterest" value="start_now" label="I have a project ready to submit right now" defaultChecked />
                  <RadioOption name="projectInterest" value="exploring" label="Just exploring the platform for now" />
                  <RadioOption name="projectInterest" value="team_account" label="Setting up an account for my team" />
                </div>
              </fieldset>

              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function RadioOption({ name, value, label, defaultChecked }: { name: string; value: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded border border-ink/10 px-3.5 py-2.5 text-sm text-ink transition-colors hover:border-orange/40">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="h-4 w-4 border-ink/25" />
      {label}
    </label>
  );
}
