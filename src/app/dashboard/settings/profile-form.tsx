"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { updateProfile } from "./actions";

export function ProfileForm({ name, email, phone, timezone }: { name: string; email: string; phone: string; timezone: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const res = await updateProfile(formData);
      setMessage(res.ok ? "Saved." : res.error ?? "Something went wrong.");
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" defaultValue={name} required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" defaultValue={email} disabled />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={phone} placeholder="+1 555 000 0000" />
      </div>
      <div>
        <Label htmlFor="timezone">Timezone</Label>
        <Input id="timezone" name="timezone" defaultValue={timezone} placeholder="America/Los_Angeles" />
      </div>
      {message && <p className="font-mono text-xs text-steel">{message}</p>}
      <Button type="submit" isLoading={pending}>
        Save changes
      </Button>
    </form>
  );
}
