import { env, isAiConfigured, isStripeConfigured, isStorageConfigured, isEmailConfigured } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/features/notification-bell";

/**
 * Per spec §41-42, admins should be able to configure AI provider/model,
 * fees, etc. "without a redeploy." Pricing rules and the service catalog
 * genuinely work that way now (see /admin/pricing-rules, /admin/services —
 * both write to the database and are read live by the estimator).
 *
 * AI provider/model, Stripe keys, and storage credentials are different:
 * they're secrets and infrastructure endpoints, not business parameters —
 * changing them means rotating credentials, which is an environment-variable
 * change by design (spec §42: "Do not expose secret API credentials in the
 * frontend"). This page shows their current state so ops can see what's
 * configured without exposing the secret values themselves.
 */
export default function AdminSettingsPage() {
  const rows = [
    { label: "AI provider", value: env.AI_PROVIDER, configured: isAiConfigured() },
    { label: "AI model", value: env.AI_MODEL, configured: isAiConfigured() },
    { label: "AI max tokens", value: String(env.AI_MAX_TOKENS), configured: true },
    { label: "Stripe", value: isStripeConfigured() ? "Connected" : "Not configured", configured: isStripeConfigured() },
    { label: "Platform fee", value: `${env.STRIPE_PLATFORM_FEE_PERCENT}%`, configured: true },
    { label: "File storage (S3-compatible)", value: isStorageConfigured() ? env.S3_BUCKET : "Not configured", configured: isStorageConfigured() },
    { label: "Email (Resend)", value: isEmailConfigured() ? env.EMAIL_FROM : "Not configured", configured: isEmailConfigured() },
  ];

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">Settings</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 p-6 lg:p-8">
        <p className="mb-6 max-w-xl text-sm text-steel">
          Business rules (pricing, disciplines) are admin-editable without a redeploy — see Pricing Rules and
          Services. Infrastructure credentials below are environment variables by design; update them in your
          hosting provider and redeploy.
        </p>
        <div className="max-w-lg divide-y divide-ink/10 rounded-md border border-ink/10 bg-white">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between px-5 py-3.5 text-sm">
              <span className="text-ink">{r.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-steel">{r.value}</span>
                <Badge tone={r.configured ? "success" : "warning"}>{r.configured ? "Set" : "Missing"}</Badge>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
