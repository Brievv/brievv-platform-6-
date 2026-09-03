"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { submitProfessionalApplication } from "./actions";

const DISCIPLINES = [
  "Architecture",
  "Structural Engineering",
  "MEP Engineering",
  "Civil Engineering",
  "Interior Design",
  "CAD / Drafting",
  "BIM",
  "Construction Documentation",
  "Visualization",
  "Estimating",
];

export function ApplicationForm() {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function toggle(d: string) {
    setSelected((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function onSubmit(formData: FormData) {
    setError(null);
    selected.forEach((d) => formData.append("disciplines", d));
    if (selected.length === 0) {
      setError("Select at least one discipline.");
      return;
    }
    startTransition(async () => {
      const res = await submitProfessionalApplication(formData);
      if (res.ok) setDone(true);
      else setError(res.error ?? "Something went wrong.");
    });
  }

  if (done) {
    return (
      <div className="glass-surface mx-auto max-w-lg rounded-xl p-8 text-center">
        <p className="text-ink">Application received. BRIEVV's team reviews new applications regularly.</p>
        <Link href="/sign-in" className="mt-4 inline-block text-sm font-medium text-orange hover:underline">
          Sign in once approved →
        </Link>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="glass-surface mx-auto max-w-xl space-y-5 rounded-xl p-8">
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" minLength={8} required />
      </div>

      <div>
        <Label>Disciplines — select all that apply</Label>
        <div className="flex flex-wrap gap-2">
          {DISCIPLINES.map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => toggle(d)}
              className={`rounded-full border px-3.5 py-2 font-mono text-xs transition-colors ${
                selected.includes(d) ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink hover:border-orange/40"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="yearsExperience">Years of experience</Label>
          <Input id="yearsExperience" name="yearsExperience" type="number" min={0} max={60} required />
        </div>
        <div>
          <Label htmlFor="hourlyRate">Hourly rate (USD, optional)</Label>
          <Input id="hourlyRate" name="hourlyRate" type="number" min={0} step="0.01" />
        </div>
      </div>

      <div>
        <Label htmlFor="portfolioUrl">Portfolio or LinkedIn URL</Label>
        <Input id="portfolioUrl" name="portfolioUrl" type="url" placeholder="https://" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="jurisdictions">Jurisdictions (comma-separated)</Label>
          <Input id="jurisdictions" name="jurisdictions" placeholder="US-CA, US-TX" />
        </div>
        <div>
          <Label htmlFor="softwareSkills">Software (comma-separated)</Label>
          <Input id="softwareSkills" name="softwareSkills" placeholder="AutoCAD, Revit" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="licenseNumber">License number (if applicable)</Label>
          <Input id="licenseNumber" name="licenseNumber" />
        </div>
        <div>
          <Label htmlFor="licenseState">Licensing state/board</Label>
          <Input id="licenseState" name="licenseState" />
        </div>
      </div>

      <div>
        <Label htmlFor="bio">Brief bio</Label>
        <Textarea id="bio" name="bio" rows={3} />
      </div>

      {error && <p className="font-mono text-xs text-danger">{error}</p>}
      <Button type="submit" className="w-full" isLoading={pending}>
        Submit application
      </Button>
    </form>
  );
}
