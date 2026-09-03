"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";

const schema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email"),
    company: z.string().optional(),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });
type FormValues = z.infer<typeof schema>;

export default function SignUpPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Something went wrong creating your account.");
      return;
    }
    router.push("/sign-in?registered=1&callbackUrl=/onboarding");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Logo href="/" className="mx-auto" />
        <h1 className="mt-8 text-center font-display text-2xl font-medium text-ink">Create your BRIEVV account</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="glass-surface mt-8 space-y-5 rounded-md p-7">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" autoComplete="name" {...register("name")} aria-invalid={!!errors.name} />
            <FieldError>{errors.name?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="company">Company (optional)</Label>
            <Input id="company" autoComplete="organization" {...register("company")} />
          </div>
          <div>
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} aria-invalid={!!errors.password} />
            <FieldError>{errors.password?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} aria-invalid={!!errors.confirmPassword} />
            <FieldError>{errors.confirmPassword?.message}</FieldError>
          </div>

          {serverError && <p className="font-mono text-xs text-danger">{serverError}</p>}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Create Account
          </Button>

          <p className="text-center text-xs text-steel">
            By continuing you agree to BRIEVV's{" "}
            <Link href="/legal/terms" className="underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-steel">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-orange hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
