"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { updateProfessionalProfile } from "./actions";

export interface ProfileDefaults {
  title: string;
  bio: string;
  yearsExperience: number;
  hourlyRate: string;
  portfolioUrl: string;
  jurisdictions: string;
  softwareSkills: string;
  timezone: string;
}

export function ProfileForm({ defaults }: { defaults: ProfileDefaults }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const res = await updateProfessionalProfile(formData);
      setMessage(res.ok ? "Saved." : res.error ?? "Something went wrong.");
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={defaults.title} placeholder="Structural Engineer" />
      </div>
      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" rows={3} defaultValue={defaults.bio} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="yearsExperience">Years of experience</Label>
          <Input id="yearsExperience" name="yearsExperience" type="number" min={0} max={60} defaultValue={defaults.yearsExperience} />
        </div>
        <div>
          <Label htmlFor="hourlyRate">Hourly rate (USD)</Label>
          <Input id="hourlyRate" name="hourlyRate" type="number" min={0} step="0.01" defaultValue={defaults.hourlyRate} />
        </div>
      </div>
      <div>
        <Label htmlFor="portfolioUrl">Portfolio URL</Label>
        <Input id="portfolioUrl" name="portfolioUrl" type="url" defaultValue={defaults.portfolioUrl} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="jurisdictions">Jurisdictions (comma-separated)</Label>
          <Input id="jurisdictions" name="jurisdictions" defaultValue={defaults.jurisdictions} />
        </div>
        <div>
          <Label htmlFor="softwareSkills">Software (comma-separated)</Label>
          <Input id="softwareSkills" name="softwareSkills" defaultValue={defaults.softwareSkills} />
        </div>
      </div>
      <div>
        <Label htmlFor="timezone">Timezone</Label>
        <Input id="timezone" name="timezone" defaultValue={defaults.timezone} placeholder="America/Los_Angeles" />
      </div>
      {message && <p className="font-mono text-xs text-steel">{message}</p>}
      <Button type="submit" isLoading={pending}>
        Save changes
      </Button>
    </form>
  );
}
