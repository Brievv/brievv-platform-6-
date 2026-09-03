"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function onSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    startTransition(async () => {
      await requestPasswordReset(email);
      setDone(true);
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Logo href="/" className="mx-auto" />
        <h1 className="mt-8 text-center font-display text-2xl font-medium text-ink">Reset your password</h1>

        <div className="glass-surface mt-8 rounded-md p-7">
          {done ? (
            <p className="text-sm text-ink">
              If an account exists for that email, we've sent password reset instructions. Check your inbox.
            </p>
          ) : (
            <form action={onSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <Button type="submit" className="w-full" isLoading={pending}>
                Send reset instructions
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-steel">
          <Link href="/sign-in" className="font-medium text-orange hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
