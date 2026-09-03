"use client";

import { useState, useId, cloneElement, isValidElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { cn, formatCents } from "@/lib/utils";
import { FileDropzone, type UploadedFileRef } from "@/components/features/file-dropzone";

const DISCIPLINES = [
  "Architecture",
  "Structural Engineering",
  "Civil Engineering",
  "MEP Engineering",
  "Interior Design",
  "CAD / Drafting",
  "BIM",
  "Construction Documentation",
  "Visualization",
  "Estimating",
  "Permit Documentation",
  "Multidisciplinary",
];

const schema = z.object({
  title: z.string().optional().default("Untitled project"),
  companyName: z.string().optional().default(""),
  location: z.string().optional().default(""),
  projectType: z.string().optional().default(""),
  disciplines: z.array(z.string()).default([]),
  scopeDescription: z.string().optional().default("Scope to be confirmed by the BRIEVV team."),
  jurisdiction: z.string().optional().default(""),
  requiredSoftware: z.string().optional().default(""),
  requiresLicense: z.boolean().default(false),
  urgency: z.enum(["standard", "rush", "asap"]).default("standard"),
  budgetLow: z.string().optional().default(""),
  budgetHigh: z.string().optional().default(""),
  contactName: z.string().optional().default("Project contact"),
  contactEmail: z.string().optional().default("brief@brievv.dev"),
  contactPhone: z.string().optional().default(""),
});
type FormValues = z.infer<typeof schema>;

type Stage = "form" | "analyzing" | "result" | "pending";

export default function StartProjectPage() {
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<Stage>("form");
  const [result, setResult] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [intakeId] = useState(() => crypto.randomUUID());
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileRef[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { disciplines: [], requiresLicense: false, urgency: "standard" },
  });

  const disciplines = watch("disciplines");
  const values = watch();

  const STEPS = ["Project", "Disciplines", "Scope", "Files", "Requirements", "Contact", "Review"];

  function toggleDiscipline(name: string) {
    const current = disciplines ?? [];
    setValue("disciplines", current.includes(name) ? current.filter((d) => d !== name) : [...current, name], {
      shouldValidate: true,
    });
  }

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    setStage("analyzing");
    try {
      const res = await fetch("/api/v1/ai/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          companyName: values.companyName,
          location: values.location,
          projectType: values.projectType,
          disciplines: values.disciplines.length ? values.disciplines : ["General review"],
          scopeDescription: values.scopeDescription,
          jurisdiction: values.jurisdiction,
          requiredSoftware: values.requiredSoftware ? values.requiredSoftware.split(",").map((s) => s.trim()) : [],
          requiresLicense: values.requiresLicense,
          urgency: values.urgency,
          budgetLowCents: values.budgetLow ? Number(values.budgetLow) * 100 : undefined,
          budgetHighCents: values.budgetHigh ? Number(values.budgetHigh) * 100 : undefined,
          contactName: values.contactName,
          contactEmail: values.contactEmail,
          contactPhone: values.contactPhone,
          uploadedFiles: uploadedFiles.map((f) => ({
            storageKey: f.storageKey,
            fileName: f.fileName,
            mimeType: f.mimeType,
            sizeBytes: f.sizeBytes,
          })),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong");
      setResult(body);
      setStage(body.status === "AI_ANALYSIS_PENDING" ? "pending" : "result");
    } catch (err: any) {
      setSubmitError(err.message ?? "Something went wrong submitting your brief. Please try again.");
      setStage("form");
    }
  }

  if (stage === "analyzing") {
    return (
      <IntakeShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Loader2 size={28} className="animate-spin text-orange" />
          <p className="mt-5 font-mono text-sm text-steel">Analyzing your project…</p>
          <p className="mt-1 text-xs text-steel/70">Classifying scope, checking complexity, preparing your quote.</p>
        </div>
      </IntakeShell>
    );
  }

  if (stage === "pending") {
    return (
      <IntakeShell>
        <Card>
          <CardBody className="py-14 text-center">
            <CheckCircle2 size={28} className="mx-auto text-success" />
            <h1 className="mt-4 font-display text-xl font-medium text-ink">Your brief was received successfully.</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-steel">
              Our team is completing the estimate manually and will follow up at {values.contactEmail} shortly.
            </p>
            <p className="mt-4 font-mono text-xs text-steel">Reference: {result?.referenceCode}</p>
          </CardBody>
        </Card>
      </IntakeShell>
    );
  }

  if (stage === "result" && result) {
    return (
      <IntakeShell>
        <Card>
          <CardBody className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="mono-label">Reference {result.referenceCode}</div>
                <h1 className="mt-1 font-display text-2xl font-medium text-ink">{values.title}</h1>
              </div>
              <Badge tone="warning">{result.requiresHumanReview ? "Pending BRIEVV review" : "Quote ready"}</Badge>
            </div>

            <div className="grid grid-cols-1 divide-y divide-ink/10 rounded-md border border-ink/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <Stat label="Exact project price" value={formatCents(result.exactPriceCents ?? result.priceLowCents)} />
              <Stat label="Timeline" value={result.timeline} />
              <Stat label="Recommended team" value={(result.team ?? []).join(", ") || "—"} small />
            </div>

            <div>
              <h3 className="mono-label mb-2">Scope summary</h3>
              <p className="text-sm leading-relaxed text-ink">{result.scopeSummary}</p>
            </div>
            {result.assumptions?.length > 0 && (
              <div>
                <h3 className="mono-label mb-2">Assumptions</h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-ink">
                  {result.assumptions.map((a: string) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.risks?.length > 0 && (
              <div>
                <h3 className="mono-label mb-2">Open questions</h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-ink">
                  {result.risks.map((r: string) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="border-t border-ink/10 pt-4 text-xs text-steel">
              This is a starting estimate. A BRIEVV lead reviews every quote and confirms final scope and price before
              work begins — you'll hear from us at {values.contactEmail} within one business day.
            </p>

            <div className="flex flex-wrap gap-3">
              <a href={`/dashboard/quotes/${result.quoteId}`} className={cn("inline-flex")}>
                <Button>Review &amp; Approve Quote</Button>
              </a>
              <Button variant="ghost" onClick={() => (window.location.href = "/contact")}>
                Talk to BRIEVV
              </Button>
            </div>
            <p className="text-xs text-steel">
              {"If you don't have a BRIEVV account yet, sign in or create one with "}
              {values.contactEmail}
              {" to review, approve, and track this quote."}
            </p>
          </CardBody>
        </Card>
      </IntakeShell>
    );
  }

  return (
    <IntakeShell>
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={cn(
                "h-1 w-full rounded-full",
                i <= step ? "bg-orange" : "bg-ink/10"
              )}
            />
            <span className={cn("hidden font-mono text-[0.65rem] uppercase sm:block", i === step ? "text-ink" : "text-steel/50")}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardBody className="space-y-5">
            {step === 0 && (
              <>
                <Field label="Project name" error={errors.title?.message}>
                  <Input placeholder="e.g. Two-story ADU permit set" {...register("title")} />
                </Field>
                <Field label="Company (optional)">
                  <Input placeholder="Rivera Development" {...register("companyName")} />
                </Field>
                <Field label="Project location (optional)">
                  <Input placeholder="City, state / country" {...register("location")} />
                </Field>
                <Field label="Project type (optional)">
                  <Input placeholder="New construction, renovation, tenant improvement…" {...register("projectType")} />
                </Field>
              </>
            )}

            {step === 1 && (
              <Field label="Disciplines — select all that apply" error={errors.disciplines?.message as string}>
                <div className="flex flex-wrap gap-2">
                  {DISCIPLINES.map((d) => {
                    const active = disciplines?.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggleDiscipline(d)}
                        className={cn(
                          "rounded-full border px-4 py-2 font-mono text-xs transition-colors",
                          active ? "border-ink bg-ink text-white" : "border-ink/15 text-ink hover:border-orange/50"
                        )}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-steel">
                  {disciplines?.length ? `${disciplines.length} selected: ${disciplines.join(", ")}` : "No disciplines selected yet"}
                </p>
              </Field>
            )}

            {step === 2 && (
              <>
                <Field label="Describe the work" error={errors.scopeDescription?.message}>
                  <Textarea rows={7} placeholder="What are you trying to accomplish? What deliverables do you need? What's the current project stage?" {...register("scopeDescription")} />
                </Field>
                <Field label="Jurisdiction / applicable code (optional)">
                  <Input placeholder="e.g. City of Austin, IBC 2021" {...register("jurisdiction")} />
                </Field>
              </>
            )}

            {step === 3 && (
              <div>
                <Label>Existing materials (optional)</Label>
                <p className="mb-3 mt-1 text-xs text-steel">
                  Upload drawings, site photos, surveys, or reference files — BRIEVV's estimator and your future project
                  team can use these directly.
                </p>
                <FileDropzone scope={{ intakeId }} onFilesChange={setUploadedFiles} />
              </div>
            )}

            {step === 4 && (
              <>
                <Field label="Required software (optional, comma-separated)">
                  <Input placeholder="Revit, AutoCAD, SketchUp" {...register("requiredSoftware")} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Budget low (USD, optional)">
                    <Input type="number" placeholder="5000" {...register("budgetLow")} />
                  </Field>
                  <Field label="Budget high (USD, optional)">
                    <Input type="number" placeholder="20000" {...register("budgetHigh")} />
                  </Field>
                </div>
                <Field label="Urgency">
                  <select className="h-11 w-full rounded border border-ink/15 bg-white px-3.5 text-sm" {...register("urgency")}>
                    <option value="standard">Standard</option>
                    <option value="rush">Rush</option>
                    <option value="asap">ASAP</option>
                  </select>
                </Field>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" {...register("requiresLicense")} className="h-4 w-4 rounded border-ink/25" />
                  This work requires a licensed professional (structural stamp, PE, etc.)
                </label>
              </>
            )}

            {step === 5 && (
              <>
                <Field label="Full name" error={errors.contactName?.message}>
                  <Input {...register("contactName")} />
                </Field>
                <Field label="Work email" error={errors.contactEmail?.message}>
                  <Input type="email" {...register("contactEmail")} />
                </Field>
                <Field label="Phone (optional)">
                  <Input {...register("contactPhone")} />
                </Field>
              </>
            )}

            {step === 6 && (
              <div className="space-y-4 text-sm">
                <ReviewRow label="Project" value={values.title} />
                <ReviewRow label="Disciplines" value={(values.disciplines ?? []).join(", ")} />
                <ReviewRow label="Scope" value={values.scopeDescription} />
                <ReviewRow label="Files attached" value={uploadedFiles.length ? `${uploadedFiles.length} file(s)` : "None"} />
                <ReviewRow label="Urgency" value={values.urgency} />
                <ReviewRow label="Contact" value={`${values.contactName} · ${values.contactEmail}`} />
                {submitError && <p className="font-mono text-xs text-danger">{submitError}</p>}
              </div>
            )}
          </CardBody>
        </Card>

        <div className="mt-6 flex justify-between">
          <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button type="submit">Get my instant quote</Button>
          )}
        </div>
      </form>
    </IntakeShell>
  );
}

function IntakeShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <main className="bg-paper py-14">
        <div className="mx-auto w-full max-w-2xl px-6">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const autoId = useId();
  const child = isValidElement(children) ? (children as React.ReactElement<{ id?: string }>) : null;
  const fieldId = child?.props.id ?? autoId;

  return (
    <div>
      <Label htmlFor={fieldId}>{label}</Label>
      {child ? cloneElement(child, { id: fieldId }) : children}
      <FieldError>{error}</FieldError>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="p-5">
      <div className="mono-label">{label}</div>
      <div className={cn("mt-2 font-mono text-ink", small ? "text-sm" : "text-lg")}>{value}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-ink/10 pb-3">
      <div className="mono-label">{label}</div>
      <div className="mt-1 text-ink">{value || "—"}</div>
    </div>
  );
}
