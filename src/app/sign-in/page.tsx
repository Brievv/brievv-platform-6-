"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const justRegistered = searchParams.get("registered") === "1";
  const [serverError, setServerError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [pending, setPending] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setPending(true);
    const res = await signIn("credentials", { ...values, redirect: false, callbackUrl });
    setPending(false);

    if (res?.error === "MFA_REQUIRED") {
      setMfaRequired(true);
      return;
    }
    if (res?.error === "MFA_INVALID") {
      setServerError("Incorrect authentication code.");
      return;
    }
    if (res?.error) {
      setServerError("Incorrect email or password.");
      return;
    }
    if (res?.url) window.location.href = res.url;
  }

  async function submitTotp() {
    setServerError(null);
    setPending(true);
    const values = getValues();
    const res = await signIn("credentials", { ...values, totpCode, redirect: false, callbackUrl });
    setPending(false);

    if (res?.error === "MFA_INVALID") {
      setServerError("Incorrect authentication code.");
      return;
    }
    if (res?.error) {
      setServerError("Sign-in failed. Please start over.");
      setMfaRequired(false);
      return;
    }
    if (res?.url) window.location.href = res.url;
  }

  if (mfaRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Logo href="/" className="mx-auto" />
          <h1 className="mt-8 text-center font-display text-2xl font-medium text-ink">Enter your authentication code</h1>
          <p className="mt-2 text-center text-sm text-steel">Open your authenticator app and enter the 6-digit code.</p>

          <div className="glass-surface mt-8 space-y-5 rounded-md p-7">
            <div>
              <Label htmlFor="totpCode">Authentication code</Label>
              <Input
                id="totpCode"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && submitTotp()}
              />
            </div>
            {serverError && <p className="font-mono text-xs text-danger">{serverError}</p>}
            <Button type="button" className="w-full" isLoading={pending} onClick={submitTotp} disabled={totpCode.length !== 6}>
              Verify
            </Button>
            <button type="button" onClick={() => setMfaRequired(false)} className="w-full text-center text-xs text-steel hover:text-ink">
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Logo href="/" className="mx-auto" />
        <h1 className="mt-8 text-center font-display text-2xl font-medium text-ink">Sign in to BRIEVV</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="glass-surface mt-8 space-y-5 rounded-md p-7">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="mb-2 text-xs text-orange hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} aria-invalid={!!errors.password} />
            <FieldError>{errors.password?.message}</FieldError>
          </div>

          {serverError && <p className="font-mono text-xs text-danger">{serverError}</p>}

          <Button type="submit" className="w-full" isLoading={pending}>
            Sign In
          </Button>

          <div className="flex items-center gap-3 text-xs text-steel">
            <span className="h-px flex-1 bg-ink/10" /> or <span className="h-px flex-1 bg-ink/10" />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl })}>
            Continue with Google
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => signIn("azure-ad", { callbackUrl })}>
            Continue with Microsoft
          </Button>
        </form>

        {justRegistered && (
          <p className="mt-4 rounded border border-success/30 bg-success/5 px-3.5 py-2.5 text-center text-xs text-ink">
            Account created — sign in to continue.
          </p>
        )}

        <p className="mt-6 text-center text-sm text-steel">
          New to BRIEVV?{" "}
          <Link href="/sign-up" className="font-medium text-orange hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
