"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trackProject, type TrackResult } from "./actions";

export function TrackForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<TrackResult | null>(null);
  const [searched, setSearched] = useState(false);

  function onSubmit(formData: FormData) {
    const referenceCode = String(formData.get("referenceCode") ?? "");
    const email = String(formData.get("email") ?? "");
    startTransition(async () => {
      const res = await trackProject(referenceCode, email);
      setResult(res);
      setSearched(true);
    });
  }

  return (
    <div className="glass-surface mx-auto max-w-md rounded-xl p-8">
      <form action={onSubmit} className="space-y-5">
        <div>
          <Label htmlFor="referenceCode">Reference code</Label>
          <Input id="referenceCode" name="referenceCode" placeholder="BRV-2026-000123" className="uppercase" required />
        </div>
        <div>
          <Label htmlFor="email">Email used on the brief</Label>
          <Input id="email" name="email" type="email" placeholder="you@company.com" required />
        </div>
        <Button type="submit" className="w-full" isLoading={pending}>
          Track project
        </Button>
      </form>

      {searched && !pending && (
        <div className="mt-6 border-t border-ink/10 pt-6">
          {result?.found ? (
            <div className="space-y-2 text-sm">
              <div className="mono-label">{result.referenceCode}</div>
              <div className="font-medium text-ink">{result.title}</div>
              <Badge tone="info">{result.status?.replace(/_/g, " ")}</Badge>
            </div>
          ) : (
            <p className="text-sm text-steel">
              No project matched that reference code and email. Double-check both, or{" "}
              <Link href="/contact" className="font-medium text-orange hover:underline">
                contact BRIEVV
              </Link>{" "}
              for help.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
