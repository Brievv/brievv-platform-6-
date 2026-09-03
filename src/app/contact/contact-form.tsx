"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { submitContactRequest } from "./actions";

const CATEGORIES = [
  { value: "start_project", label: "Start a project" },
  { value: "sales", label: "Sales inquiry" },
  { value: "enterprise", label: "Enterprise inquiry" },
  { value: "professional", label: "Professional inquiry" },
  { value: "support", label: "Support" },
  { value: "general", label: "General" },
];

export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await submitContactRequest(formData);
      if (res.ok) setDone(true);
      else setError(res.error ?? "Something went wrong.");
    });
  }

  if (done) {
    return (
      <div className="glass-surface mx-auto max-w-lg rounded-xl p-8 text-center">
        <p className="text-ink">Thanks — BRIEVV's team will follow up shortly.</p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="glass-surface mx-auto max-w-lg space-y-5 rounded-xl p-8">
      <div>
        <Label htmlFor="category">What's this about?</Label>
        <select id="category" name="category" defaultValue="general" className="h-11 w-full rounded border border-ink/15 bg-white px-3.5 text-sm text-ink">
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows={5} required />
      </div>
      {error && <p className="font-mono text-xs text-danger">{error}</p>}
      <Button type="submit" className="w-full" isLoading={pending}>
        Send message
      </Button>
    </form>
  );
}
