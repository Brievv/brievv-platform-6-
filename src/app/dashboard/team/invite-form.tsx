"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteTeamMember } from "./actions";

export function InviteForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const res = await inviteTeamMember(formData);
      setMessage(res.ok ? "Invitation added." : res.error ?? "Something went wrong.");
    });
  }

  return (
    <form action={onSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex-1">
        <Input name="email" type="email" placeholder="teammate@company.com" required />
      </div>
      <Button type="submit" isLoading={pending}>
        Invite
      </Button>
      {message && <p className="w-full font-mono text-xs text-steel">{message}</p>}
    </form>
  );
}
